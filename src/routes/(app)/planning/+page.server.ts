import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { plans, fiscalYears, agencies } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeAuditLog } from '$lib/server/db/audit';
import { createFiscalYearSchema, createPlanSchema, updatePlanSchema, parseFormData } from '$lib/server/validation/schemas';

interface FiscalYearRow {
	id: number;
	is_active: boolean;
	[key: string]: unknown;
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();
	const agencyId = user.is_super_admin
		? Number(url.searchParams.get('agency_id')) || null
		: user.agency_id;

	let fiscalYearList: FiscalYearRow[] = [];
	let planList: typeof plans.$inferSelect[] = [];
	let agencyList: typeof agencies.$inferSelect[] = [];

	if (user.is_super_admin) {
		agencyList = await db.select().from(agencies);
	}

	if (agencyId) {
		fiscalYearList = await db
			.select()
			.from(fiscalYears)
			.where(eq(fiscalYears.agency_id, agencyId));

		const fyIdParam = url.searchParams.get('fy_id');
		const selectedFy = fyIdParam
			? Number(fyIdParam)
			: fiscalYearList.find((fy) => fy.is_active)?.id || fiscalYearList[0]?.id;

		if (selectedFy) {
			planList = await db
				.select()
				.from(plans)
				.where(and(eq(plans.agency_id, agencyId), eq(plans.fiscal_year_id, selectedFy)));
		}

		return {
			user,
			agencies: agencyList,
			fiscalYears: fiscalYearList,
			plans: planList,
			selectedAgencyId: agencyId,
			selectedFyId: selectedFy || null
		};
	}

	return {
		user,
		agencies: agencyList,
		fiscalYears: fiscalYearList,
		plans: planList,
		selectedAgencyId: agencyId,
		selectedFyId: null
	};
};

export const actions: Actions = {
	createFiscalYear: async ({ request }) => {
		const parsed = parseFormData(createFiscalYearSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			await db.insert(fiscalYears).values(parsed.data);
			return { success: true, message: 'สร้างปีงบประมาณสำเร็จ' };
		} catch (err) {
			console.error('Create fiscal year error:', err);
			return fail(500, { success: false, errors: { year_name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	createPlan: async ({ request, locals, getClientAddress }) => {
		const parsed = parseFormData(createPlanSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { agency_id, fiscal_year_id, title, parent_id, plan_type, is_leaf_node, estimated_amount } = parsed.data;

			const [created] = await db
				.insert(plans)
				.values({
					agency_id,
					fiscal_year_id,
					title,
					parent_id: parent_id ?? null,
					plan_type,
					is_leaf_node,
					estimated_amount: estimated_amount || '0'
				})
				.returning();

			if (locals.user) {
				await writeAuditLog({
					collection: 'plan_budget_histories',
					action_type: 'CREATE',
					agency_id,
					plan_id: created.id,
					changes: {
						estimated_amount: { old: 0, new: Number(estimated_amount) || 0 },
						actual_amount: { old: 0, new: 0 }
					},
					action_by: {
						user_id: locals.user.sub,
						name: locals.user.name,
						position: '',
						ip_address: getClientAddress()
					}
				});
			}

			return { success: true, message: 'สร้างแผนงานสำเร็จ' };
		} catch (err) {
			console.error('Create plan error:', err);
			return fail(500, { success: false, errors: { title: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	updatePlan: async ({ request, locals, getClientAddress }) => {
		const parsed = parseFormData(updatePlanSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { id, title, estimated_amount, is_leaf_node } = parsed.data;

			const [oldPlan] = await db.select().from(plans).where(eq(plans.id, id));

			await db
				.update(plans)
				.set({
					title,
					estimated_amount: estimated_amount || '0',
					is_leaf_node
				})
				.where(eq(plans.id, id));

			if (locals.user && oldPlan) {
				await writeAuditLog({
					collection: 'plan_budget_histories',
					action_type: 'MANUAL_ADJUST',
					agency_id: oldPlan.agency_id,
					plan_id: id,
					changes: {
						estimated_amount: {
							old: Number(oldPlan.estimated_amount),
							new: Number(estimated_amount) || 0
						}
					},
					action_by: {
						user_id: locals.user.sub,
						name: locals.user.name,
						position: '',
						ip_address: getClientAddress()
					}
				});
			}

			return { success: true, message: 'แก้ไขแผนงานสำเร็จ' };
		} catch (err) {
			console.error('Update plan error:', err);
			return fail(500, { success: false, errors: { title: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	deletePlan: async ({ request, locals, getClientAddress }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { success: false, errors: { id: ['ไม่พบแผนงาน'] } });
		}

		try {
			const [oldPlan] = await db.select().from(plans).where(eq(plans.id, id));

			await db.delete(plans).where(eq(plans.id, id));

			if (locals.user && oldPlan) {
				await writeAuditLog({
					collection: 'plan_budget_histories',
					action_type: 'DELETE',
					agency_id: oldPlan.agency_id,
					plan_id: id,
					changes: {
						estimated_amount: { old: Number(oldPlan.estimated_amount), new: 0 },
						actual_amount: { old: Number(oldPlan.actual_amount), new: 0 }
					},
					action_by: {
						user_id: locals.user.sub,
						name: locals.user.name,
						position: '',
						ip_address: getClientAddress()
					}
				});
			}

			return { success: true, message: 'ลบแผนงานสำเร็จ' };
		} catch (err) {
			console.error('Delete plan error:', err);
			return fail(500, { success: false, errors: { id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	}
};
