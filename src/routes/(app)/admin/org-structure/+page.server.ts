import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { orgUnits, users, agencies } from '$lib/server/db/schema';
import { eq, and, isNull, ne } from 'drizzle-orm';
import { createOrgUnitSchema, updateOrgUnitSchema, parseFormData } from '$lib/server/validation/schemas';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Determine agency scope
	let agencyFilter: number | null = null;

	if (locals.user?.is_super_admin) {
		const aidParam = url.searchParams.get('agency_id');
		if (aidParam) agencyFilter = Number(aidParam);
	} else if (locals.user?.is_director || locals.user?.permissions.can_manage_users) {
		agencyFilter = locals.user.agency_id;
	}

	// Load org units (scoped by agency if applicable)
	const unitsQuery = db
		.select({
			id: orgUnits.id,
			agency_id: orgUnits.agency_id,
			name: orgUnits.name,
			parent_id: orgUnits.parent_id,
			head_of_unit_id: orgUnits.head_of_unit_id,
			head_name: users.name
		})
		.from(orgUnits)
		.leftJoin(users, eq(orgUnits.head_of_unit_id, users.id));

	const units = agencyFilter
		? await unitsQuery.where(eq(orgUnits.agency_id, agencyFilter))
		: await unitsQuery;

	const agencyList = await db.select().from(agencies);

	// Load users for head_of_unit dropdown — exclude super admins
	const userListQuery = db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(and(isNull(users.deleted_at), eq(users.is_super_admin, false)));

	const userList = agencyFilter
		? await db
				.select({ id: users.id, name: users.name })
				.from(users)
				.where(and(isNull(users.deleted_at), eq(users.is_super_admin, false), eq(users.agency_id, agencyFilter)))
		: await userListQuery;

	return { units, agencies: agencyList, users: userList, agencyFilter };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const parsed = parseFormData(createOrgUnitSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { name, agency_id, parent_id, head_of_unit_id } = parsed.data;

			// Unique name check within same level (same parent_id + agency_id)
			const parentIdVal = parent_id ?? null;
			const parentCondition = parentIdVal
				? eq(orgUnits.parent_id, parentIdVal)
				: isNull(orgUnits.parent_id);
			const [duplicate] = await db
				.select({ id: orgUnits.id })
				.from(orgUnits)
				.where(and(eq(orgUnits.name, name), eq(orgUnits.agency_id, agency_id), parentCondition))
				.limit(1);

			if (duplicate) {
				return fail(400, { success: false, errors: { name: ['ชื่อแผนกซ้ำในระดับเดียวกัน'] } });
			}

			// Validate head_of_unit exists
			if (head_of_unit_id) {
				const [head] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, head_of_unit_id), isNull(users.deleted_at)));
				if (!head) {
					return fail(400, { success: false, errors: { head_of_unit_id: ['ไม่พบผู้ใช้งานที่เลือก'] } });
				}
			}

			await db.insert(orgUnits).values({
				name,
				agency_id,
				parent_id: parentIdVal,
				head_of_unit_id: head_of_unit_id ?? null
			});

			return { success: true, message: 'สร้างแผนกสำเร็จ' };
		} catch (err) {
			console.error('Create org unit error:', err);
			return fail(500, { success: false, errors: { name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	update: async ({ request }) => {
		const parsed = parseFormData(updateOrgUnitSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { id, name, parent_id, head_of_unit_id } = parsed.data;
			const parentIdVal = parent_id ?? null;

			// Get current unit to know its agency_id
			const [current] = await db.select({ agency_id: orgUnits.agency_id }).from(orgUnits).where(eq(orgUnits.id, id));
			if (!current) {
				return fail(404, { success: false, errors: { id: ['ไม่พบแผนก'] } });
			}

			// Unique name check within same level (exclude self)
			const parentCondition = parentIdVal
				? eq(orgUnits.parent_id, parentIdVal)
				: isNull(orgUnits.parent_id);
			const [duplicate] = await db
				.select({ id: orgUnits.id })
				.from(orgUnits)
				.where(and(eq(orgUnits.name, name), eq(orgUnits.agency_id, current.agency_id), parentCondition, ne(orgUnits.id, id)))
				.limit(1);

			if (duplicate) {
				return fail(400, { success: false, errors: { name: ['ชื่อแผนกซ้ำในระดับเดียวกัน'] } });
			}

			// Prevent circular parent reference
			if (parentIdVal === id) {
				return fail(400, { success: false, errors: { parent_id: ['ไม่สามารถเลือกตัวเองเป็นแผนกแม่'] } });
			}

			await db
				.update(orgUnits)
				.set({
					name,
					parent_id: parentIdVal,
					head_of_unit_id: head_of_unit_id ?? null
				})
				.where(eq(orgUnits.id, id));

			return { success: true, message: 'แก้ไขแผนกสำเร็จ' };
		} catch (err) {
			console.error('Update org unit error:', err);
			return fail(500, { success: false, errors: { name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { success: false, errors: { id: ['ไม่พบแผนก'] } });
		}

		try {
			await db.delete(orgUnits).where(eq(orgUnits.id, id));
			return { success: true, message: 'ลบแผนกสำเร็จ' };
		} catch (err) {
			console.error('Delete org unit error:', err);
			return fail(500, { success: false, errors: { id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	}
};
