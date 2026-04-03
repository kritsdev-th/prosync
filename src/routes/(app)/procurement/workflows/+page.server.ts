import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { workflows, workflowSteps, users } from '$lib/server/db/schema';
import { eq, asc, and, isNull } from 'drizzle-orm';
import { buildUiSchema } from '$lib/types/workflow';
import type { StepType } from '$lib/types/workflow';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const workflowList = await db.select().from(workflows).orderBy(workflows.name);
	const stepsList = await db.select().from(workflowSteps).orderBy(asc(workflowSteps.workflow_id), asc(workflowSteps.step_sequence));

	// Load users for approver selection (non-deleted, non-super-admin)
	const userList = await db
		.select({ id: users.id, name: users.name, position: users.position })
		.from(users)
		.where(and(isNull(users.deleted_at), eq(users.is_super_admin, false)));

	return {
		user,
		workflows: workflowList,
		steps: stepsList,
		users: userList
	};
};

export const actions: Actions = {
	createWorkflow: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { error: 'กรุณากรอกชื่อวิธีจัดซื้อ' });

		try {
			await db.insert(workflows).values({ name, total_steps: 0 });
			return { success: true, message: 'สร้างวิธีจัดซื้อจัดจ้างสำเร็จ' };
		} catch (err) {
			console.error('Create workflow error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด' });
		}
	},

	updateWorkflow: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const name = form.get('name')?.toString().trim();
		if (!id || !name) return fail(400, { error: 'ข้อมูลไม่ครบ' });

		try {
			await db.update(workflows).set({ name }).where(eq(workflows.id, id));
			return { success: true, message: 'แก้ไขสำเร็จ' };
		} catch (err) {
			console.error('Update workflow error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด' });
		}
	},

	deleteWorkflow: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { error: 'ไม่พบรหัส' });

		try {
			await db.delete(workflowSteps).where(eq(workflowSteps.workflow_id, id));
			await db.delete(workflows).where(eq(workflows.id, id));
			return { success: true, message: 'ลบวิธีจัดซื้อจัดจ้างสำเร็จ' };
		} catch (err) {
			console.error('Delete workflow error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด' });
		}
	},

	createStep: async ({ request }) => {
		const form = await request.formData();
		const workflowId = Number(form.get('workflow_id'));
		const stepName = form.get('step_name')?.toString().trim();
		const stepType = form.get('step_type')?.toString() as StepType;
		const isFinalStep = form.get('is_final_step') === 'true';
		const configJson = form.get('template_config')?.toString() || '{}';
		const insertAfterRaw = Number(form.get('insert_after') ?? '0');
		const insertAfter = insertAfterRaw; // 0 = append, -1 = before first, N = after step N

		if (!workflowId || !stepName || !stepType) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบ' });
		}

		try {
			const config = JSON.parse(configJson);
			const uiSchema = buildUiSchema(stepType, config);

			// Get existing steps ordered
			const existingSteps = await db
				.select({ id: workflowSteps.id, seq: workflowSteps.step_sequence })
				.from(workflowSteps)
				.where(eq(workflowSteps.workflow_id, workflowId))
				.orderBy(asc(workflowSteps.step_sequence));

			let newSeq: number;

			if (insertAfter === -1) {
				// Insert before first step — new step becomes 1, shift everything by +1
				newSeq = 1;
				for (const step of existingSteps) {
					await db.update(workflowSteps).set({ step_sequence: step.seq + 1 }).where(eq(workflowSteps.id, step.id));
				}
			} else if (insertAfter > 0 && insertAfter <= existingSteps.length) {
				// Insert after a specific step — shift all steps after insertAfter by +1
				newSeq = insertAfter + 1;
				for (const step of existingSteps) {
					if (step.seq >= newSeq) {
						await db.update(workflowSteps).set({ step_sequence: step.seq + 1 }).where(eq(workflowSteps.id, step.id));
					}
				}
			} else {
				// Append at end
				newSeq = existingSteps.length > 0
					? Math.max(...existingSteps.map((s) => s.seq)) + 1
					: 1;
			}

			// If final step, unset any existing final steps
			if (isFinalStep) {
				await db
					.update(workflowSteps)
					.set({ is_final_step: false })
					.where(eq(workflowSteps.workflow_id, workflowId));
			}

			const approverRole = stepType === 'APPROVAL' ? (config.approvers?.[0]?.name || 'CUSTOM') : null;
			const requiredPdfs = stepType === 'DOCUMENT_UPLOAD' ? config.required_pdfs || null : null;

			await db.insert(workflowSteps).values({
				workflow_id: workflowId,
				step_sequence: newSeq,
				step_name: stepName,
				ui_schema: uiSchema,
				required_pdfs: requiredPdfs,
				approver_role: approverRole,
				is_final_step: isFinalStep
			});

			// Update total_steps count
			const totalCount = existingSteps.length + 1;
			await db.update(workflows).set({ total_steps: totalCount }).where(eq(workflows.id, workflowId));

			return { success: true, message: 'เพิ่มขั้นตอนสำเร็จ' };
		} catch (err) {
			console.error('Create step error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด' });
		}
	},

	deleteStep: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { error: 'ไม่พบรหัส' });

		try {
			// Get the step's workflow_id before deleting
			const [step] = await db.select({ workflow_id: workflowSteps.workflow_id }).from(workflowSteps).where(eq(workflowSteps.id, id));
			await db.delete(workflowSteps).where(eq(workflowSteps.id, id));

			if (step) {
				// Re-sequence remaining steps
				const remaining = await db
					.select()
					.from(workflowSteps)
					.where(eq(workflowSteps.workflow_id, step.workflow_id))
					.orderBy(asc(workflowSteps.step_sequence));

				for (let i = 0; i < remaining.length; i++) {
					await db.update(workflowSteps).set({
						step_sequence: i + 1,
						is_final_step: i === remaining.length - 1
					}).where(eq(workflowSteps.id, remaining[i].id));
				}

				await db.update(workflows).set({ total_steps: remaining.length }).where(eq(workflows.id, step.workflow_id));
			}

			return { success: true, message: 'ลบขั้นตอนสำเร็จ' };
		} catch (err) {
			console.error('Delete step error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด' });
		}
	}
};
