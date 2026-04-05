import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { workflows, workflowSteps, users, agencies, provinces } from '$lib/server/db/schema';
import { eq, asc, and, isNull, or, inArray, sql } from 'drizzle-orm';
import { buildUiSchema } from '$lib/types/workflow';
import type { StepType } from '$lib/types/workflow';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	// Central workflows (agency_id IS NULL) are always visible
	// Agency-specific workflows are only visible to that agency's users
	let workflowList;
	if (user.is_super_admin) {
		// Super admin sees all workflows
		workflowList = await db.select().from(workflows).orderBy(workflows.agency_id, workflows.name);
	} else if (user.agency_id) {
		// Regular user sees central + their agency's workflows
		workflowList = await db
			.select()
			.from(workflows)
			.where(or(isNull(workflows.agency_id), eq(workflows.agency_id, user.agency_id)))
			.orderBy(workflows.agency_id, workflows.name);
	} else {
		// No agency — only central
		workflowList = await db.select().from(workflows).where(isNull(workflows.agency_id)).orderBy(workflows.name);
	}

	const workflowIds = workflowList.map((w) => w.id);
	const stepsList =
		workflowIds.length > 0
			? await db
					.select()
					.from(workflowSteps)
					.where(inArray(workflowSteps.workflow_id, workflowIds))
					.orderBy(asc(workflowSteps.workflow_id), asc(workflowSteps.step_sequence))
			: [];

	// Sync total_steps column with actual step count
	if (workflowIds.length > 0) {
		const stepCounts = new Map<number, number>();
		for (const s of stepsList) {
			stepCounts.set(s.workflow_id, (stepCounts.get(s.workflow_id) || 0) + 1);
		}
		for (const wf of workflowList) {
			const actual = stepCounts.get(wf.id) || 0;
			if (wf.total_steps !== actual) {
				db.update(workflows).set({ total_steps: actual }).where(eq(workflows.id, wf.id)).execute();
			}
		}
	}

	// Load users for approver selection (non-deleted, non-super-admin)
	// If regular user, filter to their agency
	let userList: { id: number; name: string; position: string | null }[] = [];
	if (user.is_super_admin) {
		userList = await db
			.select({ id: users.id, name: users.name, position: users.position })
			.from(users)
			.where(and(isNull(users.deleted_at), eq(users.is_super_admin, false)));
	} else if (user.agency_id) {
		userList = await db
			.select({ id: users.id, name: users.name, position: users.position })
			.from(users)
			.where(and(isNull(users.deleted_at), eq(users.is_super_admin, false), eq(users.agency_id, user.agency_id)));
	} else {
		userList = [];
	}

	// Load agencies for super admin to assign workflows
	let agencyList: { id: number; name: string }[] = [];
	if (user.is_super_admin) {
		agencyList = await db.select({ id: agencies.id, name: agencies.name }).from(agencies).orderBy(agencies.name);
	}

	return {
		user,
		workflows: workflowList,
		steps: stepsList,
		users: userList,
		agencies: agencyList
	};
};

export const actions: Actions = {
	createWorkflow: async ({ request, locals }) => {
		const user = locals.user;
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { error: 'กรุณากรอกชื่อวิธีจัดซื้อ' });

		// Determine agency_id: super admin can create central (null) or for specific agency
		// Regular user creates for their own agency
		let agencyId: number | null = null;
		if (user?.is_super_admin) {
			const agencyRaw = form.get('agency_id')?.toString();
			agencyId = agencyRaw ? Number(agencyRaw) : null; // null = central
		} else if (user?.agency_id) {
			agencyId = user.agency_id;
		} else {
			return fail(403, { error: 'ไม่มีสิทธิ์สร้างวิธีจัดซื้อ' });
		}

		try {
			await db.insert(workflows).values({ name, total_steps: 0, agency_id: agencyId });
			return { success: true, message: 'สร้างวิธีจัดซื้อจัดจ้างสำเร็จ' };
		} catch (err) {
			console.error('Create workflow error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด' });
		}
	},

	updateWorkflow: async ({ request, locals }) => {
		const user = locals.user;
		const form = await request.formData();
		const id = Number(form.get('id'));
		const name = form.get('name')?.toString().trim();
		if (!id || !name) return fail(400, { error: 'ข้อมูลไม่ครบ' });

		// Check permission: central workflows only editable by super admin
		const [wf] = await db.select({ agency_id: workflows.agency_id }).from(workflows).where(eq(workflows.id, id));
		if (!wf) return fail(404, { error: 'ไม่พบวิธีจัดซื้อ' });
		if (wf.agency_id === null && !user?.is_super_admin) {
			return fail(403, { error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขวิธีจัดซื้อส่วนกลางได้' });
		}
		if (wf.agency_id !== null && !user?.is_super_admin && user?.agency_id !== wf.agency_id) {
			return fail(403, { error: 'ไม่มีสิทธิ์แก้ไขวิธีจัดซื้อของหน่วยงานอื่น' });
		}

		try {
			await db.update(workflows).set({ name }).where(eq(workflows.id, id));
			return { success: true, message: 'แก้ไขสำเร็จ' };
		} catch (err) {
			console.error('Update workflow error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด' });
		}
	},

	deleteWorkflow: async ({ request, locals }) => {
		const user = locals.user;
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { error: 'ไม่พบรหัส' });

		// Check permission
		const [wf] = await db.select({ agency_id: workflows.agency_id }).from(workflows).where(eq(workflows.id, id));
		if (!wf) return fail(404, { error: 'ไม่พบวิธีจัดซื้อ' });
		if (wf.agency_id === null && !user?.is_super_admin) {
			return fail(403, { error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่ลบวิธีจัดซื้อส่วนกลางได้' });
		}
		if (wf.agency_id !== null && !user?.is_super_admin && user?.agency_id !== wf.agency_id) {
			return fail(403, { error: 'ไม่มีสิทธิ์ลบวิธีจัดซื้อของหน่วยงานอื่น' });
		}

		try {
			await db.delete(workflowSteps).where(eq(workflowSteps.workflow_id, id));
			await db.delete(workflows).where(eq(workflows.id, id));
			return { success: true, message: 'ลบวิธีจัดซื้อจัดจ้างสำเร็จ' };
		} catch (err) {
			console.error('Delete workflow error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด' });
		}
	},

	createStep: async ({ request, locals }) => {
		const user = locals.user;
		const form = await request.formData();
		const workflowId = Number(form.get('workflow_id'));
		const stepName = form.get('step_name')?.toString().trim();
		const stepType = form.get('step_type')?.toString() as StepType;
		const isFinalStep = form.get('is_final_step') === 'true';
		const configJson = form.get('template_config')?.toString() || '{}';
		const insertAfterRaw = Number(form.get('insert_after') ?? '0');
		const insertAfter = insertAfterRaw;

		if (!workflowId || !stepName || !stepType) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบ' });
		}

		// Check permission on workflow
		const [wf] = await db.select({ agency_id: workflows.agency_id }).from(workflows).where(eq(workflows.id, workflowId));
		if (!wf) return fail(404, { error: 'ไม่พบวิธีจัดซื้อ' });
		if (wf.agency_id === null && !user?.is_super_admin) {
			return fail(403, { error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขวิธีจัดซื้อส่วนกลางได้' });
		}
		if (wf.agency_id !== null && !user?.is_super_admin && user?.agency_id !== wf.agency_id) {
			return fail(403, { error: 'ไม่มีสิทธิ์แก้ไขวิธีจัดซื้อของหน่วยงานอื่น' });
		}

		try {
			const config = JSON.parse(configJson);
			const uiSchema = buildUiSchema(stepType, config);

			const existingSteps = await db
				.select({ id: workflowSteps.id, seq: workflowSteps.step_sequence })
				.from(workflowSteps)
				.where(eq(workflowSteps.workflow_id, workflowId))
				.orderBy(asc(workflowSteps.step_sequence));

			let newSeq: number;

			if (insertAfter === -1) {
				newSeq = 1;
				for (const step of existingSteps) {
					await db.update(workflowSteps).set({ step_sequence: step.seq + 1 }).where(eq(workflowSteps.id, step.id));
				}
			} else if (insertAfter > 0 && insertAfter <= existingSteps.length) {
				newSeq = insertAfter + 1;
				for (const step of existingSteps) {
					if (step.seq >= newSeq) {
						await db.update(workflowSteps).set({ step_sequence: step.seq + 1 }).where(eq(workflowSteps.id, step.id));
					}
				}
			} else {
				newSeq = existingSteps.length > 0 ? Math.max(...existingSteps.map((s) => s.seq)) + 1 : 1;
			}

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

			const totalCount = existingSteps.length + 1;
			await db.update(workflows).set({ total_steps: totalCount }).where(eq(workflows.id, workflowId));

			return { success: true, message: 'เพิ่มขั้นตอนสำเร็จ' };
		} catch (err) {
			console.error('Create step error:', err);
			return fail(500, { error: 'เกิดข้อผิดพลาด' });
		}
	},

	deleteStep: async ({ request, locals }) => {
		const user = locals.user;
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { error: 'ไม่พบรหัส' });

		try {
			const [step] = await db
				.select({ workflow_id: workflowSteps.workflow_id })
				.from(workflowSteps)
				.where(eq(workflowSteps.id, id));

			if (step) {
				// Check permission on parent workflow
				const [wf] = await db.select({ agency_id: workflows.agency_id }).from(workflows).where(eq(workflows.id, step.workflow_id));
				if (wf?.agency_id === null && !user?.is_super_admin) {
					return fail(403, { error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขวิธีจัดซื้อส่วนกลางได้' });
				}
				if (wf?.agency_id !== null && !user?.is_super_admin && user?.agency_id !== wf?.agency_id) {
					return fail(403, { error: 'ไม่มีสิทธิ์แก้ไขวิธีจัดซื้อของหน่วยงานอื่น' });
				}
			}

			await db.delete(workflowSteps).where(eq(workflowSteps.id, id));

			if (step) {
				const remaining = await db
					.select()
					.from(workflowSteps)
					.where(eq(workflowSteps.workflow_id, step.workflow_id))
					.orderBy(asc(workflowSteps.step_sequence));

				for (let i = 0; i < remaining.length; i++) {
					await db
						.update(workflowSteps)
						.set({
							step_sequence: i + 1,
							is_final_step: i === remaining.length - 1
						})
						.where(eq(workflowSteps.id, remaining[i].id));
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
