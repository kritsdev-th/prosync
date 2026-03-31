import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { medianPrices, provinces } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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
		const form = await request.formData();
		const category = form.get('category') as string;
		const item_name = form.get('item_name') as string;
		const price = form.get('price') as string;
		const province_id = Number(form.get('province_id'));
		const effective_date = form.get('effective_date') as string;

		if (!category || !item_name || !price || !province_id || !effective_date) {
			return fail(400, { success: false, errors: { category: ['กรุณากรอกข้อมูลให้ครบถ้วน'] } });
		}

		await db.insert(medianPrices).values({
			category,
			item_name,
			price,
			province_id,
			effective_date
		});

		return { success: true, message: 'เพิ่มราคากลางสำเร็จ' };
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const category = form.get('category') as string;
		const item_name = form.get('item_name') as string;
		const price = form.get('price') as string;
		const effective_date = form.get('effective_date') as string;

		await db
			.update(medianPrices)
			.set({ category, item_name, price, effective_date })
			.where(eq(medianPrices.id, id));

		return { success: true, message: 'แก้ไขราคากลางสำเร็จ' };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

		await db.delete(medianPrices).where(eq(medianPrices.id, id));

		return { success: true, message: 'ลบราคากลางสำเร็จ' };
	}
};
