import { db } from '$lib/server/db';
import { notifications } from '$lib/server/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

interface CreateNotificationParams {
	userId: number;
	documentId?: number | null;
	stepId?: number | null;
	title: string;
	message: string;
	actionUrl?: string | null;
	notificationType: string;
}

export async function createNotification(params: CreateNotificationParams) {
	return db.insert(notifications).values({
		user_id: params.userId,
		document_id: params.documentId ?? null,
		step_id: params.stepId ?? null,
		title: params.title,
		message: params.message,
		action_url: params.actionUrl ?? null,
		notification_type: params.notificationType,
		is_read: false
	});
}

export async function createBulkNotifications(items: CreateNotificationParams[]) {
	if (items.length === 0) return;
	return db.insert(notifications).values(
		items.map((p) => ({
			user_id: p.userId,
			document_id: p.documentId ?? null,
			step_id: p.stepId ?? null,
			title: p.title,
			message: p.message,
			action_url: p.actionUrl ?? null,
			notification_type: p.notificationType,
			is_read: false
		}))
	);
}

export async function getUnreadCount(userId: number): Promise<number> {
	const [result] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)));
	return result?.count ?? 0;
}

export async function getUserNotifications(userId: number, limit = 20, offset = 0) {
	return db
		.select()
		.from(notifications)
		.where(eq(notifications.user_id, userId))
		.orderBy(desc(notifications.created_at))
		.limit(limit)
		.offset(offset);
}

export async function markAsRead(notificationId: number, userId: number) {
	return db
		.update(notifications)
		.set({ is_read: true })
		.where(and(eq(notifications.id, notificationId), eq(notifications.user_id, userId)));
}

export async function markAllAsRead(userId: number) {
	return db
		.update(notifications)
		.set({ is_read: true })
		.where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)));
}

export async function deleteReadNotifications(userId: number) {
	return db
		.delete(notifications)
		.where(and(eq(notifications.user_id, userId), eq(notifications.is_read, true)));
}
