import type { PageServerLoad } from './$types';
import { getMongoDb } from '$lib/server/db/mongodb';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();
	const collection = url.searchParams.get('collection') || 'plan_budget_histories';
	const agencyId = user.is_super_admin
		? Number(url.searchParams.get('agency_id')) || null
		: user.agency_id;

	let records: any[] = [];

	if (agencyId) {
		const mongoDB = await getMongoDb();
		const filter: Record<string, unknown> = { agency_id: agencyId };

		const actionType = url.searchParams.get('action_type');
		if (actionType) filter.action_type = actionType;

		records = await mongoDB
			.collection(collection)
			.find(filter)
			.sort({ created_at: -1 })
			.limit(100)
			.toArray();

		// Serialize ObjectId
		records = records.map((r) => ({ ...r, _id: r._id.toString() }));
	}

	return {
		user,
		records,
		collection,
		selectedAgencyId: agencyId
	};
};
