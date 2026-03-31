import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { medianPrices, provinces } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createMedianPriceSchema, updateMedianPriceSchema, parseFormData } from '$lib/server/validation/schemas';

export const load: PageServerLoad = async () => {
	const prices = await db
		.select({
			id: medianPrices.id,
			category: medianPrices.category,
			item_name: medianPrices.item_name,
			price: medianPrices.price,
			province_id: medianPrices.province_id,
			province_name: provinces.name,
			effective_date: medianPrices.effective_date
		})
		.from(medianPrices)
		.innerJoin(provinces, eq(medianPrices.province_id, provinces.id));

	const provinceList = await db.select().from(provinces);

	return { prices, provinces: provinceList };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const parsed = parseFormData(createMedianPriceSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			await db.insert(medianPrices).values(parsed.data);
			return { success: true, message: 'เพิ่มราคากลางสำเร็จ' };
		} catch (err) {
			console.error('Create median price error:', err);
			return fail(500, { success: false, errors: { category: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	update: async ({ request }) => {
		const parsed = parseFormData(updateMedianPriceSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { id, ...data } = parsed.data;
			await db.update(medianPrices).set(data).where(eq(medianPrices.id, id));
			return { success: true, message: 'แก้ไขราคากลางสำเร็จ' };
		} catch (err) {
			console.error('Update median price error:', err);
			return fail(500, { success: false, errors: { category: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { success: false, errors: { id: ['ไม่พบราคากลาง'] } });
		}

		try {
			await db.delete(medianPrices).where(eq(medianPrices.id, id));
			return { success: true, message: 'ลบราคากลางสำเร็จ' };
		} catch (err) {
			console.error('Delete median price error:', err);
			return fail(500, { success: false, errors: { id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	}
};
