import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	documents,
	workflows,
	workflowSteps,
	plans,
	fiscalYears,
	agencies,
	provinces
} from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { createDocumentSchema, parseFormData } from '$lib/server/validation/schemas';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();

	let provincesList: { id: number; name: string }[] = [];
	let agencyList: { id: number; name: string; agency_type: string | null; province_id: number }[] = [];
	let selectedProvinceId: number | null = null;
	let agencyId: number | null = null;

	if (user.is_super_admin) {
		provincesList = await db.select({ id: provinces.id, name: provinces.name }).from(provinces).orderBy(provinces.name);
		const pidParam = url.searchParams.get('province_id');
		if (pidParam) {
			selectedProvinceId = Number(pidParam);
			agencyList = await db
				.select({ id: agencies.id, name: agencies.name, agency_type: agencies.agency_type, province_id: agencies.province_id })
				.from(agencies)
				.where(eq(agencies.province_id, selectedProvinceId));
		}
		const aidParam = url.searchParams.get('agency_id');
		if (aidParam) agencyId = Number(aidParam);
	} else {
		agencyId = user.agency_id;
	}

	const workflowList = await db.select().from(workflows);
	const stepsList = await db.select().from(workflowSteps);

	let documentList: any[] = [];
	let leafPlanList: any[] = [];

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

		leafPlanList = await db
			.select({
				id: plans.id,
				title: plans.title,
				estimated_amount: plans.estimated_amount,
				actual_amount: plans.actual_amount,
				fiscal_year: fiscalYears.year_name
			})
			.from(plans)
			.innerJoin(fiscalYears, eq(plans.fiscal_year_id, fiscalYears.id))
			.where(and(eq(plans.agency_id, agencyId), eq(plans.is_leaf_node, true)));
	}

	return {
		user,
		documents: documentList,
		workflows: workflowList,
		workflowSteps: stepsList,
		leafPlans: leafPlanList,
		provinces: provincesList,
		agencies: agencyList,
		selectedProvinceId,
		selectedAgencyId: agencyId
	};
};

export const actions: Actions = {
	createDocument: async ({ request, locals }) => {
		const parsed = parseFormData(createDocumentSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { agency_id, workflow_id, plan_id } = parsed.data;

			const existing = await db
				.select()
				.from(documents)
				.where(and(eq(documents.plan_id, plan_id), eq(documents.status, 'IN_PROGRESS')));

			if (existing.length > 0) {
				return fail(400, {
					success: false,
					errors: { plan_id: [`เอกสารนี้อยู่ระหว่างดำเนินการ [#${existing[0].id}]`] }
				});
			}

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
		} catch (err) {
			console.error('Create document error:', err);
			return fail(500, { success: false, errors: { plan_id: ['เกิดข้อผิดพลาด'] } });
		}
	}
};
