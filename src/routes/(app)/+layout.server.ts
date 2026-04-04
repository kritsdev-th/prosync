import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getUnreadCount } from '$lib/server/notifications';
import { getPendingTaskCount } from '$lib/server/step-assignments';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const [notificationCount, pendingTaskCount] = await Promise.all([
		getUnreadCount(locals.user.sub),
		getPendingTaskCount(locals.user.sub)
	]);

	return { user: locals.user, notificationCount, pendingTaskCount };
};
