import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	documents,
	workflows,
	workflowSteps,
	plans,
	vendors,
	documentCommittees,
	documentBidders,
	approvals,
	dikaVouchers,
	users,
	bankAccounts
} from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeAuditLog } from '$lib/server/db/audit';
import {
	addCommitteeSchema,
	addBidderSchema,
	updateBidderScoreSchema,
	approveSchema,
	generateDikaSchema,
	parseFormData
} from '$lib/server/validation/schemas';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	const docId = Number(params.id);

	const [doc] = await db
		.select({
			id: documents.id,
			agency_id: documents.agency_id,
			workflow_id: documents.workflow_id,
			plan_id: documents.plan_id,
			current_step_id: documents.current_step_id,
			payload: documents.payload,
			status: documents.status,
			updated_by: documents.updated_by
		})
		.from(documents)
		.where(eq(documents.id, docId));

	if (!doc) throw error(404, 'ไม่พบเอกสาร');

	const [workflow] = await db.select().from(workflows).where(eq(workflows.id, doc.workflow_id));
	const steps = await db
		.select()
		.from(workflowSteps)
		.where(eq(workflowSteps.workflow_id, doc.workflow_id))
		.orderBy(workflowSteps.step_sequence);

	const [plan] = await db.select().from(plans).where(eq(plans.id, doc.plan_id));

	const committees = await db
		.select({
			id: documentCommittees.id,
			user_id: documentCommittees.user_id,
			user_name: users.name,
			committee_type: documentCommittees.committee_type,
			role_in_committee: documentCommittees.role_in_committee
		})
		.from(documentCommittees)
		.innerJoin(users, eq(documentCommittees.user_id, users.id))
		.where(eq(documentCommittees.document_id, docId));

	const bidders = await db
		.select({
			id: documentBidders.id,
			vendor_id: documentBidders.vendor_id,
			vendor_name: vendors.company_name,
			proposal_pdf_url: documentBidders.proposal_pdf_url,
			proposed_price: documentBidders.proposed_price,
			score: documentBidders.score,
			is_winner: documentBidders.is_winner
		})
		.from(documentBidders)
		.innerJoin(vendors, eq(documentBidders.vendor_id, vendors.id))
		.where(eq(documentBidders.document_id, docId));

	const approvalList = await db
		.select({
			id: approvals.id,
			step_id: approvals.step_id,
			user_name: users.name,
			action: approvals.action,
			comment: approvals.comment,
			created_at: approvals.created_at
		})
		.from(approvals)
		.innerJoin(users, eq(approvals.user_id, users.id))
		.where(eq(approvals.document_id, docId));

	const vendorList = await db.select().from(vendors);
	const userList = await db
		.select({ id: users.id, name: users.name, position: users.position })
		.from(users)
		.where(eq(users.agency_id, doc.agency_id));

	const accounts = await db
		.select()
		.from(bankAccounts)
		.where(eq(bankAccounts.agency_id, doc.agency_id));

	const currentStep = steps.find((s) => s.id === doc.current_step_id);

	return {
		user,
		document: doc,
		workflow,
		steps,
		currentStep,
		plan,
		committees,
		bidders,
		approvals: approvalList,
		vendors: vendorList,
		users: userList,
		bankAccounts: accounts
	};
};

export const actions: Actions = {
	advanceStep: async ({ request, params, locals, getClientAddress }) => {
		const form = await request.formData();
		const docId = Number(params.id);
		const stepData = form.get('step_data') as string | null;

		let parsedData: Record<string, unknown> = {};
		try {
			parsedData = stepData ? JSON.parse(stepData) as Record<string, unknown> : {};
		} catch {
			return fail(400, { success: false, errors: { step: ['ข้อมูลขั้นตอนไม่ถูกต้อง'] } });
		}

		try {
			const [doc] = await db.select().from(documents).where(eq(documents.id, docId));
			if (!doc) return fail(404, { success: false, errors: { step: ['ไม่พบเอกสาร'] } });

			const steps = await db
				.select()
				.from(workflowSteps)
				.where(eq(workflowSteps.workflow_id, doc.workflow_id))
				.orderBy(workflowSteps.step_sequence);

			const currentStep = steps.find((s) => s.id === doc.current_step_id);
			if (!currentStep) return fail(400, { success: false, errors: { step: ['ไม่พบขั้นตอนปัจจุบัน'] } });

			const stepKey = `step_${currentStep.step_sequence}_${currentStep.step_name.replace(/\s+/g, '_').substring(0, 30)}`;
			const updatedPayload = {
				...(doc.payload as Record<string, unknown>),
				[stepKey]: parsedData
			};

			const nextStep = steps.find((s) => s.step_sequence === currentStep.step_sequence + 1);
			const isFinalStep = currentStep.is_final_step;

			await db
				.update(documents)
				.set({
					payload: updatedPayload,
					current_step_id: nextStep?.id || doc.current_step_id,
					status: isFinalStep ? 'APPROVED_PROCUREMENT' : 'IN_PROGRESS',
					updated_by: locals.user?.sub || null
				})
				.where(eq(documents.id, docId));

			if (locals.user) {
				await writeAuditLog({
					collection: 'doc_payload_histories',
					action_type: 'STEP_ADVANCE',
					agency_id: doc.agency_id,
					document_id: docId,
					step_id: currentStep.id,
					payload_snapshot: updatedPayload,
					diff: parsedData,
					action_by: {
						user_id: locals.user.sub,
						name: locals.user.name,
						ip_address: getClientAddress()
					}
				});
			}

			return { success: true, message: `บันทึกขั้นตอน "${currentStep.step_name}" สำเร็จ` };
		} catch (err) {
			console.error('Advance step error:', err);
			return fail(500, { success: false, errors: { step: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	addCommittee: async ({ request, params }) => {
		const parsed = parseFormData(addCommitteeSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const docId = Number(params.id);
			await db.insert(documentCommittees).values({
				document_id: docId,
				user_id: parsed.data.user_id,
				committee_type: parsed.data.committee_type,
				role_in_committee: parsed.data.role_in_committee ?? null
			});

			return { success: true, message: 'เพิ่มกรรมการสำเร็จ' };
		} catch (err) {
			console.error('Add committee error:', err);
			return fail(500, { success: false, errors: { user_id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	addBidder: async ({ request, params }) => {
		const parsed = parseFormData(addBidderSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const docId = Number(params.id);
			await db.insert(documentBidders).values({
				document_id: docId,
				vendor_id: parsed.data.vendor_id,
				proposed_price: parsed.data.proposed_price ?? null,
				submitted_at: new Date()
			});

			return { success: true, message: 'เพิ่มผู้ยื่นซองสำเร็จ' };
		} catch (err) {
			console.error('Add bidder error:', err);
			return fail(500, { success: false, errors: { vendor_id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	updateBidderScore: async ({ request }) => {
		const parsed = parseFormData(updateBidderScoreSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			await db
				.update(documentBidders)
				.set({ score: parsed.data.score ?? null, is_winner: parsed.data.is_winner })
				.where(eq(documentBidders.id, parsed.data.bidder_id));

			return { success: true, message: 'อัปเดตคะแนนสำเร็จ' };
		} catch (err) {
			console.error('Update bidder score error:', err);
			return fail(500, { success: false, errors: { bidder_id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	approve: async ({ request, params, locals }) => {
		const parsed = parseFormData(approveSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const docId = Number(params.id);
			const { step_id, action, comment } = parsed.data;

			await db.insert(approvals).values({
				document_id: docId,
				step_id,
				user_id: locals.user!.sub,
				action,
				comment: comment ?? null
			});

			if (action === 'REJECTED') {
				await db.update(documents).set({ status: 'REJECTED' }).where(eq(documents.id, docId));
			}

			return { success: true, message: action === 'APPROVED' ? 'อนุมัติสำเร็จ' : 'ปฏิเสธแล้ว' };
		} catch (err) {
			console.error('Approve error:', err);
			return fail(500, { success: false, errors: { step_id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	generateDika: async ({ request, params, locals }) => {
		const parsed = parseFormData(generateDikaSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const docId = Number(params.id);
			const { gross_amount, fine_amount, tax_amount, payment_bank_account_id, tax_pool_account_id } = parsed.data;

			const [doc] = await db.select().from(documents).where(eq(documents.id, docId));
			if (!doc) return fail(404, { success: false, errors: { step: ['ไม่พบเอกสาร'] } });

			const [winner] = await db
				.select()
				.from(documentBidders)
				.where(and(eq(documentBidders.document_id, docId), eq(documentBidders.is_winner, true)));

			if (!winner) {
				return fail(400, { success: false, errors: { step: ['ยังไม่มีผู้ชนะการประมูล'] } });
			}

			const net = Number(gross_amount) - Number(fine_amount) - Number(tax_amount);

			await db.insert(dikaVouchers).values({
				agency_id: doc.agency_id,
				document_id: docId,
				vendor_id: winner.vendor_id,
				plan_id: doc.plan_id,
				payment_bank_account_id,
				tax_pool_account_id: tax_pool_account_id ?? null,
				gross_amount,
				fine_amount,
				tax_amount,
				net_amount: net.toFixed(2),
				status: 'PENDING_EXAMINE'
			});

			return { success: true, message: 'สร้างฎีกาเบิกจ่ายสำเร็จ' };
		} catch (err) {
			console.error('Generate dika error:', err);
			return fail(500, { success: false, errors: { gross_amount: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	}
};
