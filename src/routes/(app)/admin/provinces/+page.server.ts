import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { provinces } from '$lib/server/db/schema';
import { provinceSchema, parseFormData } from '$lib/server/validation/schemas';

export const load: PageServerLoad = async () => {
	const allProvinces = await db.select().from(provinces).orderBy(provinces.name);
	return { provinces: allProvinces };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const parsed = parseFormData(provinceSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			await db.insert(provinces).values({ name: parsed.data.name });
			return { success: true };
		} catch (err) {
			console.error('Create province error:', err);
			return fail(500, { success: false, errors: { name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { success: false, errors: { id: ['ไม่พบรหัสจังหวัด'] } });
		}

		const parsed = parseFormData(provinceSchema, formData);
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			await db.update(provinces).set({ name: parsed.data.name }).where(eq(provinces.id, id));
			return { success: true };
		} catch (err) {
			console.error('Update province error:', err);
			return fail(500, { success: false, errors: { name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { success: false, errors: { id: ['ไม่พบรหัสจังหวัด'] } });
		}

		try {
			await db.delete(provinces).where(eq(provinces.id, id));
			return { success: true };
		} catch (err) {
			console.error('Delete province error:', err);
			return fail(500, { success: false, errors: { id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	}
};
