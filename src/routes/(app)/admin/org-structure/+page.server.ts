import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { orgUnits, users, agencies } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

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
		const form = await request.formData();
		const name = form.get('name') as string;
		const agency_id = Number(form.get('agency_id'));
		const parent_id = form.get('parent_id') as string;
		const head_of_unit_id = form.get('head_of_unit_id') as string;

		if (!name || !agency_id) {
			return fail(400, { success: false, errors: { name: ['กรุณากรอกข้อมูลให้ครบถ้วน'] } });
		}

		await db.insert(orgUnits).values({
			name,
			agency_id,
			parent_id: parent_id ? Number(parent_id) : null,
			head_of_unit_id: head_of_unit_id ? Number(head_of_unit_id) : null
		});

		return { success: true, message: 'สร้างแผนกสำเร็จ' };
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const name = form.get('name') as string;
		const parent_id = form.get('parent_id') as string;
		const head_of_unit_id = form.get('head_of_unit_id') as string;

		if (!name) {
			return fail(400, { success: false, errors: { name: ['กรุณากรอกชื่อ'] } });
		}

		await db
			.update(orgUnits)
			.set({
				name,
				parent_id: parent_id ? Number(parent_id) : null,
				head_of_unit_id: head_of_unit_id ? Number(head_of_unit_id) : null
			})
			.where(eq(orgUnits.id, id));

		return { success: true, message: 'แก้ไขแผนกสำเร็จ' };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

		await db.delete(orgUnits).where(eq(orgUnits.id, id));

		return { success: true, message: 'ลบแผนกสำเร็จ' };
	}
};
