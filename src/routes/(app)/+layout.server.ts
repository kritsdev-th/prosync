import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getUnreadCount } from '$lib/server/notifications';
import { getPendingTaskCount, getPendingFinanceCount } from '$lib/server/step-assignments';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const u = locals.user;
	const [notificationCount, pendingTaskCount, pendingFinanceCount] = await Promise.all([
		getUnreadCount(u.sub),
		getPendingTaskCount(u.sub),
		getPendingFinanceCount(
			u.sub,
			u.agency_id,
			u.is_super_admin,
			u.is_director || false,
			u.permissions?.can_manage_finance || false
		)
	]);

	return { user: u, notificationCount, pendingTaskCount, pendingFinanceCount };
};
