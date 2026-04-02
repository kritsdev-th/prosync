import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, userAssignments, roles, orgUnits, agencies } from '$lib/server/db/schema';
import { eq, and, isNull, like, or } from 'drizzle-orm';
import { hashPassword } from '$lib/server/auth/password';
import {
	createUserSchema,
	updateUserSchema,
	assignRoleSchema,
	parseFormData
} from '$lib/server/validation/schemas';

export const load: PageServerLoad = async ({ url, locals }) => {
	const search = url.searchParams.get('search') || '';

	// Determine agency scope
	let agencyFilter: number | null = null;
	if (locals.user?.is_super_admin) {
		const aidParam = url.searchParams.get('agency_id');
		if (aidParam) agencyFilter = Number(aidParam);
	} else if (locals.user?.is_director || locals.user?.permissions.can_manage_users) {
		agencyFilter = locals.user.agency_id;
	}

	// Build search + agency conditions
	const conditions = [isNull(users.deleted_at)];
	if (search) {
		conditions.push(or(like(users.name, `%${search}%`), like(users.id_card, `%${search}%`))!);
	}
	if (agencyFilter) {
		conditions.push(eq(users.agency_id, agencyFilter));
	}

	const userList = await db
		.select({
			id: users.id,
			name: users.name,
			id_card: users.id_card,
			position: users.position,
			position_rank: users.position_rank,
			email: users.email,
			agency_id: users.agency_id,
			agency_name: agencies.name,
			is_super_admin: users.is_super_admin
		})
		.from(users)
		.leftJoin(agencies, eq(users.agency_id, agencies.id))
		.where(and(...conditions));

	// Assignments — scoped by agency via org_unit
	const assignmentConditions = agencyFilter
		? eq(orgUnits.agency_id, agencyFilter)
		: undefined;

	const allAssignments = agencyFilter
		? await db
				.select({
					id: userAssignments.id,
					user_id: userAssignments.user_id,
					role_id: userAssignments.role_id,
					role_name: roles.name,
					org_unit_id: userAssignments.org_unit_id,
					org_unit_name: orgUnits.name,
					is_primary_unit: userAssignments.is_primary_unit
				})
				.from(userAssignments)
				.innerJoin(roles, eq(userAssignments.role_id, roles.id))
				.innerJoin(orgUnits, eq(userAssignments.org_unit_id, orgUnits.id))
				.where(eq(orgUnits.agency_id, agencyFilter))
		: await db
				.select({
					id: userAssignments.id,
					user_id: userAssignments.user_id,
					role_id: userAssignments.role_id,
					role_name: roles.name,
					org_unit_id: userAssignments.org_unit_id,
					org_unit_name: orgUnits.name,
					is_primary_unit: userAssignments.is_primary_unit
				})
				.from(userAssignments)
				.innerJoin(roles, eq(userAssignments.role_id, roles.id))
				.innerJoin(orgUnits, eq(userAssignments.org_unit_id, orgUnits.id));

	const allRoles = await db.select().from(roles);

	// Org units scoped by agency
	const allOrgUnits = agencyFilter
		? await db.select().from(orgUnits).where(eq(orgUnits.agency_id, agencyFilter))
		: await db.select().from(orgUnits);

	const allAgencies = await db.select().from(agencies);

	return {
		users: userList,
		assignments: allAssignments,
		roles: allRoles,
		orgUnits: allOrgUnits,
		agencies: allAgencies,
		search,
		agencyFilter
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const parsed = parseFormData(createUserSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { name, id_card, password, agency_id, position, position_rank, email } = parsed.data;
			const password_hash = await hashPassword(password);

			await db.insert(users).values({
				name,
				id_card,
				password_hash,
				agency_id: agency_id ?? null,
				position: position ?? null,
				position_rank: position_rank ?? null,
				email: email ?? null,
				profile_completed: true
			});

			return { success: true, message: 'สร้างผู้ใช้งานสำเร็จ' };
		} catch (err) {
			console.error('Create user error:', err);
			return fail(500, { success: false, errors: { name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	update: async ({ request }) => {
		const parsed = parseFormData(updateUserSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { id, name, agency_id, position, position_rank, email } = parsed.data;

			await db
				.update(users)
				.set({
					name,
					agency_id: agency_id ?? null,
					position: position ?? null,
					position_rank: position_rank ?? null,
					email: email ?? null
				})
				.where(eq(users.id, id));

			return { success: true, message: 'แก้ไขผู้ใช้งานสำเร็จ' };
		} catch (err) {
			console.error('Update user error:', err);
			return fail(500, { success: false, errors: { name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { success: false, errors: { id: ['ไม่พบผู้ใช้งาน'] } });
		}

		try {
			await db.update(users).set({ deleted_at: new Date() }).where(eq(users.id, id));
			return { success: true, message: 'ลบผู้ใช้งานสำเร็จ' };
		} catch (err) {
			console.error('Delete user error:', err);
			return fail(500, { success: false, errors: { id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	assign: async ({ request }) => {
		const parsed = parseFormData(assignRoleSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { user_id, role_id, org_unit_id, is_primary_unit } = parsed.data;

			if (is_primary_unit) {
				await db
					.update(userAssignments)
					.set({ is_primary_unit: false })
					.where(eq(userAssignments.user_id, user_id));
			}

			await db.insert(userAssignments).values({
				user_id,
				role_id,
				org_unit_id,
				is_primary_unit
			});

			return { success: true, message: 'มอบหมายสิทธิ์สำเร็จ' };
		} catch (err) {
			console.error('Assign role error:', err);
			return fail(500, { success: false, errors: { role_id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	removeAssignment: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { success: false, errors: { id: ['ไม่พบสิทธิ์'] } });
		}

		try {
			await db.delete(userAssignments).where(eq(userAssignments.id, id));
			return { success: true, message: 'ลบสิทธิ์สำเร็จ' };
		} catch (err) {
			console.error('Remove assignment error:', err);
			return fail(500, { success: false, errors: { id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	}
};
