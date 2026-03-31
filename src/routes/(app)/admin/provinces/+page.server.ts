import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { provinces } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const allProvinces = await db.select().from(provinces).orderBy(provinces.name);
	return { provinces: allProvinces };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';

		if (!name) {
			return fail(400, {
				success: false,
				errors: { name: ['กรุณาระบุชื่อจังหวัด'] }
			});
		}

		if (name.length > 100) {
			return fail(400, {
				success: false,
				errors: { name: ['ชื่อจังหวัดต้องไม่เกิน 100 ตัวอักษร'] }
			});
		}

		await db.insert(provinces).values({ name });

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const name = formData.get('name')?.toString().trim() ?? '';

		if (!id || isNaN(id)) {
			return fail(400, {
				success: false,
				errors: { id: ['ไม่พบรหัสจังหวัด'] }
			});
		}

		if (!name) {
			return fail(400, {
				success: false,
				errors: { name: ['กรุณาระบุชื่อจังหวัด'] }
			});
		}

		if (name.length > 100) {
			return fail(400, {
				success: false,
				errors: { name: ['ชื่อจังหวัดต้องไม่เกิน 100 ตัวอักษร'] }
			});
		}

		await db.update(provinces).set({ name }).where(eq(provinces.id, id));

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, {
				success: false,
				errors: { id: ['ไม่พบรหัสจังหวัด'] }
			});
		}

		await db.delete(provinces).where(eq(provinces.id, id));

		return { success: true };
	}
};
