import type { PageServerLoad } from './$types';
import { getPendingTasks } from '$lib/server/step-assignments';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const tasks = await getPendingTasks(user.sub);

	// Group tasks by assignment type
	const grouped = {
		APPROVER: tasks.filter((t) => t.assignment_type === 'APPROVER'),
		UPLOADER: tasks.filter((t) => t.assignment_type === 'UPLOADER'),
		COMMITTEE_MEMBER: tasks.filter((t) => t.assignment_type === 'COMMITTEE_MEMBER'),
		SCORER: tasks.filter((t) => t.assignment_type === 'SCORER')
	};

	return { user, tasks, grouped };
};
