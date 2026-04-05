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
import { eq, and, asc } from 'drizzle-orm';
import { writeAuditLog } from '$lib/server/db/audit';
import {
	addCommitteeSchema,
	addBidderSchema,
	updateBidderScoreSchema,
	approveSchema,
	generateDikaSchema,
	parseFormData
} from '$lib/server/validation/schemas';
import { assignAndNotify, completeAssignment } from '$lib/server/step-assignments';
import { createNotification } from '$lib/server/notifications';

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

	// Check if current user is assigned to the current step
	let isAssignedToCurrentStep = false;
	if (currentStep && user) {
		const { documentStepAssignments } = await import('$lib/server/db/schema');
		const [assignment] = await db
			.select({ id: documentStepAssignments.id })
			.from(documentStepAssignments)
			.where(and(
				eq(documentStepAssignments.document_id, docId),
				eq(documentStepAssignments.step_id, currentStep.id),
				eq(documentStepAssignments.user_id, user.sub),
				eq(documentStepAssignments.is_completed, false)
			))
			.limit(1);
		isAssignedToCurrentStep = !!assignment;
	}

	// Super admin and document creator can always act
	const isCreator = doc.updated_by === user.sub;
	const canActOnStep = user.is_super_admin || isAssignedToCurrentStep || isCreator;

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
		bankAccounts: accounts,
		canActOnStep
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

		// Handle file upload
		const pdfFile = form.get('pdf_file') as File | null;
		if (pdfFile && pdfFile.size > 0) {
			const { writeFileSync, mkdirSync, existsSync } = await import('fs');
			const { join } = await import('path');

			// Path pattern: /uploads/procurement/{agency_id}/{doc_id}/step_{seq}_{timestamp}.pdf
			const uploadDir = join('static', 'uploads', 'procurement', String(form.get('agency_id') || '0'), String(docId));
			if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

			const timestamp = Date.now();
			const filename = `step_${form.get('step_seq') || '0'}_${timestamp}.pdf`;
			const filePath = join(uploadDir, filename);
			const publicPath = `/uploads/procurement/${form.get('agency_id') || '0'}/${docId}/${filename}`;

			const buffer = Buffer.from(await pdfFile.arrayBuffer());
			writeFileSync(filePath, buffer);

			parsedData.uploaded_pdf = publicPath;
			parsedData.uploaded_filename = pdfFile.name;
			parsedData.uploaded_at = new Date().toISOString();
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

			// Build rich payload based on step type
			const uiType = (currentStep.ui_schema as any)?.type || 'unknown';
			const stepPayload: Record<string, unknown> = { ...parsedData };

			// Add uploaded PDF info
			if (stepPayload.uploaded_pdf) {
				stepPayload._meta = `อัปโหลดเอกสารสำเร็จ`;
			}

			// Add committee info
			if (uiType === 'committee') {
				const comps = (currentStep.ui_schema as any)?.components || [];
				const types = comps.filter((c: any) => c?.committee_type).map((c: any) => c.committee_type);
				if (types.length > 0) {
					stepPayload._meta = `บันทึกกรรมการประเภท ${types.join(' และ ')} ลงตาราง document_committees แล้ว`;
				}
			}

			// Add vendor proposal info
			if (uiType === 'vendor_proposal_with_upload') {
				stepPayload._meta = 'เอกสารใบเสนอราคาจาก Vendor ถูกบันทึกลงตาราง document_bidders แล้ว';
			}

			// Add evaluation info
			if (uiType === 'evaluation_with_scoring') {
				stepPayload._meta = 'คะแนนของผู้ยื่นซองแต่ละรายและสถานะผู้ชนะ ถูกอัปเดตลงในตาราง document_bidders แล้ว';
			}

			// Always add who/when
			stepPayload.completed_by = locals.user?.sub || null;
			stepPayload.completed_by_name = locals.user?.name || null;
			stepPayload.completed_at = new Date().toISOString();

			const updatedPayload = {
				...(doc.payload as Record<string, unknown>),
				[stepKey]: stepPayload
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

				// Complete current user's assignment for the completed step
				await completeAssignment(docId, currentStep.id, locals.user.sub);

				// Assign and notify users for the next step
				if (nextStep && !isFinalStep) {
					await assignAndNotify(docId, nextStep.id, doc.agency_id, nextStep.step_name, locals.user?.sub);
				}
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

	removeCommittee: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('committee_id'));
		if (!id) return fail(400, { success: false, errors: { committee_id: ['ไม่พบรหัสกรรมการ'] } });

		try {
			await db.delete(documentCommittees).where(eq(documentCommittees.id, id));
			return { success: true, message: 'ลบกรรมการสำเร็จ' };
		} catch (err) {
			console.error('Remove committee error:', err);
			return fail(500, { success: false, errors: { committee_id: ['เกิดข้อผิดพลาด'] } });
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

	approve: async ({ request, params, locals, getClientAddress }) => {
		const parsed = parseFormData(approveSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const docId = Number(params.id);
			const { step_id, action, comment } = parsed.data;

			// Prevent double-approve: check if this user already approved this step
			const existingApproval = await db
				.select({ id: approvals.id })
				.from(approvals)
				.where(and(
					eq(approvals.document_id, docId),
					eq(approvals.step_id, step_id),
					eq(approvals.user_id, locals.user!.sub)
				))
				.limit(1);

			if (existingApproval.length > 0) {
				return fail(400, { success: false, errors: { step_id: ['คุณได้อนุมัติ/ปฏิเสธขั้นตอนนี้ไปแล้ว'] } });
			}

			// Verify document is still at this step
			const [doc] = await db.select().from(documents).where(eq(documents.id, docId));
			if (!doc || doc.current_step_id !== step_id) {
				return fail(400, { success: false, errors: { step_id: ['ขั้นตอนนี้ไม่ใช่ขั้นตอนปัจจุบันแล้ว'] } });
			}

			await db.insert(approvals).values({
				document_id: docId,
				step_id,
				user_id: locals.user!.sub,
				action,
				comment: comment ?? null
			});

			// Complete the approver's assignment
			if (locals.user) {
				await completeAssignment(docId, step_id, locals.user.sub);
			}

			if (action === 'REJECTED') {
				await db.update(documents).set({ status: 'REJECTED' }).where(eq(documents.id, docId));

				// Notify document creator of rejection
				if (doc.updated_by) {
					const [step] = await db.select({ step_name: workflowSteps.step_name }).from(workflowSteps).where(eq(workflowSteps.id, step_id));
					await createNotification({
						userId: doc.updated_by,
						documentId: docId,
						stepId: step_id,
						title: 'เอกสารถูกปฏิเสธ',
						message: `เอกสาร #${docId} ถูกปฏิเสธในขั้นตอน "${step?.step_name || ''}"${comment ? ` — ${comment}` : ''}`,
						actionUrl: `/procurement/${docId}`,
						notificationType: 'DOCUMENT_REJECTED'
					});
				}
			} else {
				// APPROVED: auto-advance to next step
				const steps = await db
					.select()
					.from(workflowSteps)
					.where(eq(workflowSteps.workflow_id, doc.workflow_id))
					.orderBy(workflowSteps.step_sequence);

				const currentStep = steps.find((s) => s.id === step_id);
				if (currentStep) {
					const nextStep = steps.find((s) => s.step_sequence === currentStep.step_sequence + 1);
					const isFinalStep = currentStep.is_final_step;

					// Store approval data in payload
					const stepKey = `step_${currentStep.step_sequence}_${currentStep.step_name.replace(/\s+/g, '_').substring(0, 30)}`;
					const updatedPayload = {
						...(doc.payload as Record<string, unknown>),
						[stepKey]: {
							_meta: 'ผู้มีอำนาจกดอนุมัติแล้ว ข้อมูลถูกบันทึกลงตาราง approvals',
							approver: {
								user_id: locals.user!.sub,
								name: locals.user!.name,
								position: locals.user!.position_rank || null,
								approved_at: new Date().toISOString()
							},
							comment: comment ?? null
						}
					};

					await db
						.update(documents)
						.set({
							payload: updatedPayload,
							current_step_id: nextStep?.id || doc.current_step_id,
							status: isFinalStep ? 'APPROVED_PROCUREMENT' : 'IN_PROGRESS',
							updated_by: doc.updated_by
						})
						.where(eq(documents.id, docId));

					// Assign and notify users for the next step
					if (nextStep && !isFinalStep) {
						await assignAndNotify(docId, nextStep.id, doc.agency_id, nextStep.step_name, locals.user?.sub);
					}
				}
			}

			// Write audit log for approve/reject
			if (locals.user) {
				const [stepForAudit] = await db.select({ step_name: workflowSteps.step_name }).from(workflowSteps).where(eq(workflowSteps.id, step_id));
				await writeAuditLog({
					collection: 'doc_payload_histories',
					action_type: action === 'APPROVED' ? 'STEP_APPROVED' : 'STEP_REJECTED',
					agency_id: doc.agency_id,
					document_id: docId,
					step_id,
					step_name: stepForAudit?.step_name || '',
					comment: comment ?? null,
					action_by: {
						user_id: locals.user.sub,
						name: locals.user.name,
						ip_address: getClientAddress()
					}
				});
			}

			return { success: true, message: action === 'APPROVED' ? 'อนุมัติสำเร็จ — ส่งต่อขั้นตอนถัดไปแล้ว' : 'ปฏิเสธแล้ว' };
		} catch (err) {
			console.error('Approve error:', err);
			return fail(500, { success: false, errors: { step_id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	generateDika: async ({ request, params, locals, getClientAddress }) => {
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

			// Write audit log
			if (locals.user) {
				await writeAuditLog({
					collection: 'doc_payload_histories',
					action_type: 'GENERATE_DIKA',
					agency_id: doc.agency_id,
					document_id: docId,
					dika_data: { gross_amount, fine_amount, tax_amount, net_amount: net.toFixed(2), vendor_id: winner.vendor_id },
					action_by: {
						user_id: locals.user.sub,
						name: locals.user.name,
						ip_address: getClientAddress()
					}
				});
			}

			return { success: true, message: 'สร้างฎีกาเบิกจ่ายสำเร็จ' };
		} catch (err) {
			console.error('Generate dika error:', err);
			return fail(500, { success: false, errors: { gross_amount: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	}
};
