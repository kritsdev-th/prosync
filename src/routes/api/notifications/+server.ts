import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteReadNotifications } from '$lib/server/notifications';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const limit = parseInt(url.searchParams.get('limit') || '20');
	const offset = parseInt(url.searchParams.get('offset') || '0');

	const [notifs, unreadCount] = await Promise.all([
		getUserNotifications(locals.user.sub, limit, offset),
		getUnreadCount(locals.user.sub)
	]);

	return json({ notifications: notifs, unreadCount });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const { action, id } = body;

	if (action === 'read' && id) {
		await markAsRead(id, locals.user.sub);
		return json({ success: true });
	}

	if (action === 'read-all') {
		await markAllAsRead(locals.user.sub);
		return json({ success: true });
	}

	if (action === 'delete-read') {
		await deleteReadNotifications(locals.user.sub);
		return json({ success: true });
	}

	return json({ error: 'Invalid action' }, { status: 400 });
};
