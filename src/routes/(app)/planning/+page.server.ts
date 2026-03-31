import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { plans, fiscalYears, agencies } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeAuditLog } from '$lib/server/db/audit';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();
	const agencyId = user.is_super_admin
		? Number(url.searchParams.get('agency_id')) || null
		: user.agency_id;

	let fiscalYearList: any[] = [];
	let planList: any[] = [];
	let agencyList: any[] = [];

	if (user.is_super_admin) {
		agencyList = await db.select().from(agencies);
	}

	if (agencyId) {
		fiscalYearList = await db
			.select()
			.from(fiscalYears)
			.where(eq(fiscalYears.agency_id, agencyId));

		const selectedFy = url.searchParams.get('fy_id')
			? Number(url.searchParams.get('fy_id'))
			: fiscalYearList.find((fy: any) => fy.is_active)?.id || fiscalYearList[0]?.id;

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
	createFiscalYear: async ({ request, locals }) => {
		const form = await request.formData();
		const agency_id = Number(form.get('agency_id'));
		const year_name = form.get('year_name') as string;

		if (!agency_id || !year_name) {
			return fail(400, { success: false, errors: { year_name: ['กรุณากรอกข้อมูลให้ครบ'] } });
		}

		await db.insert(fiscalYears).values({ agency_id, year_name });

		return { success: true, message: 'สร้างปีงบประมาณสำเร็จ' };
	},

	createPlan: async ({ request, locals, getClientAddress }) => {
		const form = await request.formData();
		const agency_id = Number(form.get('agency_id'));
		const fiscal_year_id = Number(form.get('fiscal_year_id'));
		const title = form.get('title') as string;
		const parent_id = form.get('parent_id') as string;
		const plan_type = form.get('plan_type') as string;
		const is_leaf_node = form.get('is_leaf_node') === 'true';
		const estimated_amount = form.get('estimated_amount') as string;

		if (!title || !plan_type) {
			return fail(400, { success: false, errors: { title: ['กรุณากรอกข้อมูลให้ครบ'] } });
		}

		const [created] = await db
			.insert(plans)
			.values({
				agency_id,
				fiscal_year_id,
				title,
				parent_id: parent_id ? Number(parent_id) : null,
				plan_type,
				is_leaf_node,
				estimated_amount: estimated_amount || '0'
			})
			.returning();

		// Audit trail
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
	},

	updatePlan: async ({ request, locals, getClientAddress }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const title = form.get('title') as string;
		const estimated_amount = form.get('estimated_amount') as string;
		const is_leaf_node = form.get('is_leaf_node') === 'true';

		// Get old values for audit
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
	},

	deletePlan: async ({ request, locals, getClientAddress }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

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
	}
};
