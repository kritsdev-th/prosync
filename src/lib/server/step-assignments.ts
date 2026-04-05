import { db } from '$lib/server/db';
import {
	documentStepAssignments,
	workflowSteps,
	documents,
	users,
	orgUnits,
	documentCommittees,
	dikaVouchers
} from '$lib/server/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { createBulkNotifications } from './notifications';
import { sendEmail, buildWorkflowEmail } from './email';

interface StepAssignee {
	type: 'role' | 'creator' | 'committee' | 'specific_user';
	value?: string;
	user_id?: number;
}

/**
 * Resolve which user IDs should be assigned to act on a given step for a given document.
 */
export async function resolveAssignees(
	documentId: number,
	step: { id: number; step_assignees: any; approver_role: string | null; ui_schema: any },
	agencyId: number
): Promise<{ userId: number; type: string }[]> {
	const assignees: { userId: number; type: string }[] = [];
	const stepAssigneeDefs: StepAssignee[] = step.step_assignees || [];

	for (const def of stepAssigneeDefs) {
		switch (def.type) {
			case 'role': {
				if (def.value === 'DIRECTOR') {
					// Find root org unit head for this agency
					const rootUnits = await db
						.select({ head_of_unit_id: orgUnits.head_of_unit_id })
						.from(orgUnits)
						.where(and(eq(orgUnits.agency_id, agencyId), isNull(orgUnits.parent_id)));
					for (const unit of rootUnits) {
						if (unit.head_of_unit_id) {
							assignees.push({ userId: unit.head_of_unit_id, type: 'APPROVER' });
						}
					}
				} else if (def.value === 'REVIEWER') {
					// Find the head of the procurement/supply department (พัสดุ)
					const procUnits = await db
						.select({ head_of_unit_id: orgUnits.head_of_unit_id, name: orgUnits.name })
						.from(orgUnits)
						.where(and(eq(orgUnits.agency_id, agencyId)));

					// Try to find procurement-specific unit head first
					const procUnit = procUnits.find((u) =>
						u.head_of_unit_id && (u.name.includes('พัสดุ') || u.name.includes('จัดซื้อ'))
					);
					if (procUnit?.head_of_unit_id) {
						assignees.push({ userId: procUnit.head_of_unit_id, type: 'APPROVER' });
					} else {
						// Fallback: find any non-root department head
						const deptHead = procUnits.find((u) => u.head_of_unit_id);
						if (deptHead?.head_of_unit_id) {
							assignees.push({ userId: deptHead.head_of_unit_id, type: 'APPROVER' });
						}
					}
				}
				break;
			}
			case 'creator': {
				const [doc] = await db
					.select({ updated_by: documents.updated_by })
					.from(documents)
					.where(eq(documents.id, documentId));
				if (doc?.updated_by) {
					assignees.push({ userId: doc.updated_by, type: 'UPLOADER' });
				}
				break;
			}
			case 'committee': {
				if (def.value) {
					const members = await db
						.select({ user_id: documentCommittees.user_id })
						.from(documentCommittees)
						.where(
							and(
								eq(documentCommittees.document_id, documentId),
								eq(documentCommittees.committee_type, def.value)
							)
						);
					for (const m of members) {
						assignees.push({ userId: m.user_id, type: 'COMMITTEE_MEMBER' });
					}
				}
				break;
			}
			case 'specific_user': {
				if (def.user_id) {
					assignees.push({ userId: def.user_id, type: 'APPROVER' });
				}
				break;
			}
		}
	}

	// Fallback: if no step_assignees defined, use legacy approver_role
	if (assignees.length === 0 && step.approver_role) {
		if (step.approver_role === 'DIRECTOR') {
			const rootUnits = await db
				.select({ head_of_unit_id: orgUnits.head_of_unit_id })
				.from(orgUnits)
				.where(and(eq(orgUnits.agency_id, agencyId), isNull(orgUnits.parent_id)));
			for (const unit of rootUnits) {
				if (unit.head_of_unit_id) {
					assignees.push({ userId: unit.head_of_unit_id, type: 'APPROVER' });
				}
			}
		}
	}

	// Fallback: if still no assignees, assign to document creator
	if (assignees.length === 0) {
		const [doc] = await db
			.select({ updated_by: documents.updated_by })
			.from(documents)
			.where(eq(documents.id, documentId));
		if (doc?.updated_by) {
			assignees.push({ userId: doc.updated_by, type: 'UPLOADER' });
		}
	}

	// Deduplicate by userId
	const seen = new Set<number>();
	return assignees.filter((a) => {
		if (seen.has(a.userId)) return false;
		seen.add(a.userId);
		return true;
	});
}

/**
 * Assign users to a document step and send notifications + emails.
 */
export async function assignAndNotify(
	documentId: number,
	stepId: number,
	agencyId: number,
	stepName: string,
	advancedByUserId?: number
) {
	// Get step details
	const [step] = await db
		.select()
		.from(workflowSteps)
		.where(eq(workflowSteps.id, stepId));

	if (!step) return;

	const assignees = await resolveAssignees(documentId, step, agencyId);
	if (assignees.length === 0) return;

	// Insert assignments
	await db.insert(documentStepAssignments).values(
		assignees.map((a) => ({
			document_id: documentId,
			step_id: stepId,
			user_id: a.userId,
			assignment_type: a.type,
			is_completed: false
		}))
	);

	// Determine notification type from assignment type
	const notifType =
		assignees[0]?.type === 'APPROVER'
			? 'APPROVAL_REQUIRED'
			: assignees[0]?.type === 'COMMITTEE_MEMBER'
				? 'COMMITTEE_REQUIRED'
				: 'UPLOAD_REQUIRED';

	const actionLabel =
		notifType === 'APPROVAL_REQUIRED'
			? 'รออนุมัติ'
			: notifType === 'COMMITTEE_REQUIRED'
				? 'รอแต่งตั้งกรรมการ'
				: 'รอดำเนินการ';

	// Create notifications (skip the user who just advanced — they already know)
	const notifyAssignees = advancedByUserId
		? assignees.filter((a) => a.userId !== advancedByUserId)
		: assignees;

	if (notifyAssignees.length > 0) {
		await createBulkNotifications(
			notifyAssignees.map((a) => ({
				userId: a.userId,
				documentId,
				stepId,
				title: `งานใหม่: ${stepName}`,
				message: `คุณมีงานที่ต้องดำเนินการในขั้นตอน "${stepName}" — ${actionLabel}`,
				actionUrl: `/procurement/${documentId}`,
				notificationType: notifType
			}))
		);
	}

	// Send emails (skip advancing user)
	for (const a of notifyAssignees) {
		const [user] = await db
			.select({ name: users.name, email: users.email })
			.from(users)
			.where(eq(users.id, a.userId));

		if (user?.email) {
			await sendEmail({
				to: user.email,
				subject: `[ProSync] งานใหม่: ${stepName}`,
				html: buildWorkflowEmail({
					recipientName: user.name,
					stepName,
					documentTitle: `เอกสาร #${documentId}`,
					actionUrl: `/procurement/${documentId}`,
					actionLabel: actionLabel
				})
			});
		}
	}
}

/**
 * Mark a user's assignment as completed for a given document + step.
 */
export async function completeAssignment(documentId: number, stepId: number, userId: number) {
	// Mark assignment as completed
	await db
		.update(documentStepAssignments)
		.set({ is_completed: true })
		.where(
			and(
				eq(documentStepAssignments.document_id, documentId),
				eq(documentStepAssignments.step_id, stepId),
				eq(documentStepAssignments.user_id, userId)
			)
		);

	// Also mark related notifications as read
	const { notifications } = await import('$lib/server/db/schema');
	await db
		.update(notifications)
		.set({ is_read: true })
		.where(
			and(
				eq(notifications.user_id, userId),
				eq(notifications.document_id, documentId),
				eq(notifications.step_id, stepId),
				eq(notifications.is_read, false)
			)
		);
}

/**
 * Get count of pending tasks for a user.
 */
export async function getPendingTaskCount(userId: number): Promise<number> {
	const [result] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(documentStepAssignments)
		.where(
			and(
				eq(documentStepAssignments.user_id, userId),
				eq(documentStepAssignments.is_completed, false)
			)
		);
	return result?.count ?? 0;
}

/**
 * Get pending finance dika count for a user based on their role.
 * - Finance staff (can_manage_finance): PENDING_EXAMINE + APPROVED
 * - Director (is_director): EXAMINED
 * - Super admin: all three
 */
export async function getPendingFinanceCount(userId: number, agencyId: number | null, isSuperAdmin: boolean, isDirector: boolean, canManageFinance: boolean): Promise<number> {
	if (!agencyId) return 0;

	const statuses: string[] = [];
	if (isSuperAdmin) {
		statuses.push('PENDING_EXAMINE', 'EXAMINED', 'APPROVED');
	} else if (isDirector) {
		// ผอ./รองผอ. เห็นเฉพาะ EXAMINED (รออนุมัติ) เท่านั้น
		statuses.push('EXAMINED');
	} else {
		if (canManageFinance) statuses.push('PENDING_EXAMINE', 'APPROVED');
	}

	if (statuses.length === 0) return 0;

	const [result] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(dikaVouchers)
		.where(
			and(
				eq(dikaVouchers.agency_id, agencyId),
				sql`${dikaVouchers.status} IN (${sql.join(statuses.map(s => sql`${s}`), sql`, `)})`
			)
		);
	return result?.count ?? 0;
}

/**
 * Get all pending tasks for a user with document and step details.
 */
export async function getPendingTasks(userId: number) {
	return db
		.select({
			assignment_id: documentStepAssignments.id,
			assignment_type: documentStepAssignments.assignment_type,
			document_id: documentStepAssignments.document_id,
			step_id: documentStepAssignments.step_id,
			step_name: workflowSteps.step_name,
			step_sequence: workflowSteps.step_sequence,
			document_status: documents.status,
			document_payload: documents.payload,
			created_at: documentStepAssignments.created_at
		})
		.from(documentStepAssignments)
		.innerJoin(workflowSteps, eq(documentStepAssignments.step_id, workflowSteps.id))
		.innerJoin(documents, eq(documentStepAssignments.document_id, documents.id))
		.where(
			and(
				eq(documentStepAssignments.user_id, userId),
				eq(documentStepAssignments.is_completed, false)
			)
		)
		.orderBy(documentStepAssignments.created_at);
}
