import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { agencies, provinces } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const agencyList = await db
		.select({
			id: agencies.id,
			name: agencies.name,
			agency_type: agencies.agency_type,
			province_id: agencies.province_id,
			province_name: provinces.name
		})
		.from(agencies)
		.leftJoin(provinces, eq(agencies.province_id, provinces.id))
		.orderBy(agencies.name);

	const provinceList = await db
		.select({
			id: provinces.id,
			name: provinces.name
		})
		.from(provinces)
		.orderBy(provinces.name);

	return { agencies: agencyList, provinces: provinceList };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const agency_type = formData.get('agency_type')?.toString().trim();
		const province_id = Number(formData.get('province_id'));

		if (!name) {
			return fail(400, { error: 'กรุณากรอกชื่อหน่วยงาน', name, agency_type, province_id });
		}
		if (!agency_type) {
			return fail(400, { error: 'กรุณาเลือกประเภทหน่วยงาน', name, agency_type, province_id });
		}
		if (!province_id || isNaN(province_id)) {
			return fail(400, { error: 'กรุณาเลือกจังหวัด', name, agency_type, province_id });
		}

		await db.insert(agencies).values({ name, agency_type, province_id });
		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const name = formData.get('name')?.toString().trim();
		const agency_type = formData.get('agency_type')?.toString().trim();
		const province_id = Number(formData.get('province_id'));

		if (!id || isNaN(id)) {
			return fail(400, { error: 'ไม่พบหน่วยงานที่ต้องการแก้ไข' });
		}
		if (!name) {
			return fail(400, { error: 'กรุณากรอกชื่อหน่วยงาน' });
		}
		if (!agency_type) {
			return fail(400, { error: 'กรุณาเลือกประเภทหน่วยงาน' });
		}
		if (!province_id || isNaN(province_id)) {
			return fail(400, { error: 'กรุณาเลือกจังหวัด' });
		}

		await db.update(agencies).set({ name, agency_type, province_id }).where(eq(agencies.id, id));
		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { error: 'ไม่พบหน่วยงานที่ต้องการลบ' });
		}

		await db.delete(agencies).where(eq(agencies.id, id));
		return { success: true };
	}
};
