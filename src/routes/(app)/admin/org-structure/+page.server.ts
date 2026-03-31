import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { orgUnits, users, agencies } from '$lib/server/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { createOrgUnitSchema, updateOrgUnitSchema, parseFormData } from '$lib/server/validation/schemas';

export const load: PageServerLoad = async () => {
	const units = await db
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

	const agencyList = await db.select().from(agencies);
	const userList = await db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(isNull(users.deleted_at));

	return { units, agencies: agencyList, users: userList };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const parsed = parseFormData(createOrgUnitSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			await db.insert(orgUnits).values({
				name: parsed.data.name,
				agency_id: parsed.data.agency_id,
				parent_id: parsed.data.parent_id ?? null,
				head_of_unit_id: parsed.data.head_of_unit_id ?? null
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
			await db
				.update(orgUnits)
				.set({
					name,
					parent_id: parent_id ?? null,
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
