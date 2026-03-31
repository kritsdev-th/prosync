import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	documents,
	workflows,
	workflowSteps,
	plans,
	fiscalYears,
	agencies
} from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();
	const agencyId = user.is_super_admin
		? Number(url.searchParams.get('agency_id')) || null
		: user.agency_id;

	let documentList: any[] = [];
	let workflowList: any[] = [];
	let leafPlans: any[] = [];
	let agencyList: any[] = [];

	if (user.is_super_admin) {
		agencyList = await db.select().from(agencies);
	}

	workflowList = await db.select().from(workflows);

	if (agencyId) {
		documentList = await db
			.select({
				id: documents.id,
				agency_id: documents.agency_id,
				workflow_id: documents.workflow_id,
				workflow_name: workflows.name,
				plan_id: documents.plan_id,
				plan_title: plans.title,
				current_step_id: documents.current_step_id,
				payload: documents.payload,
				status: documents.status
			})
			.from(documents)
			.innerJoin(workflows, eq(documents.workflow_id, workflows.id))
			.innerJoin(plans, eq(documents.plan_id, plans.id))
			.where(eq(documents.agency_id, agencyId));

		// Get leaf plans with budget for creating new documents
		leafPlans = await db
			.select({
				id: plans.id,
				title: plans.title,
				estimated_amount: plans.estimated_amount,
				actual_amount: plans.actual_amount,
				fiscal_year: fiscalYears.year_name
			})
			.from(plans)
			.innerJoin(fiscalYears, eq(plans.fiscal_year_id, fiscalYears.id))
			.where(
				and(
					eq(plans.agency_id, agencyId),
					eq(plans.is_leaf_node, true)
				)
			);
	}

	return {
		user,
		documents: documentList,
		workflows: workflowList,
		leafPlans,
		agencies: agencyList,
		selectedAgencyId: agencyId
	};
};

export const actions: Actions = {
	createDocument: async ({ request, locals }) => {
		const form = await request.formData();
		const agency_id = Number(form.get('agency_id'));
		const workflow_id = Number(form.get('workflow_id'));
		const plan_id = Number(form.get('plan_id'));

		if (!agency_id || !workflow_id || !plan_id) {
			return fail(400, { success: false, errors: { plan_id: ['กรุณาเลือกข้อมูลให้ครบ'] } });
		}

		// Check if there's already an active document for this plan
		const existing = await db
			.select()
			.from(documents)
			.where(
				and(eq(documents.plan_id, plan_id), eq(documents.status, 'IN_PROGRESS'))
			);

		if (existing.length > 0) {
			return fail(400, {
				success: false,
				errors: {
					plan_id: [
						`ไม่สามารถสร้างเอกสารได้ เนื่องจากเอกสารนี้อยู่ระหว่างการทำแผนจัดซื้อจัดจ้าง [Document #${existing[0].id}] กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง`
					]
				}
			});
		}

		// Get first step
		const [firstStep] = await db
			.select()
			.from(workflowSteps)
			.where(and(eq(workflowSteps.workflow_id, workflow_id), eq(workflowSteps.step_sequence, 1)));

		await db.insert(documents).values({
			agency_id,
			workflow_id,
			plan_id,
			current_step_id: firstStep?.id || null,
			payload: {},
			status: 'IN_PROGRESS',
			updated_by: locals.user?.sub || null
		});

		return { success: true, message: 'สร้างเอกสารจัดซื้อจัดจ้างสำเร็จ' };
	}
};
