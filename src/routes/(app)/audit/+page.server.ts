import type { PageServerLoad } from './$types';
import { getMongoDb } from '$lib/server/db/mongodb';
import { type AuditRecord, type AuditCollection, VALID_AUDIT_COLLECTIONS } from '$lib/server/validation/types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();
	const collectionParam = url.searchParams.get('collection') || 'plan_budget_histories';
	const collection: AuditCollection = VALID_AUDIT_COLLECTIONS.includes(collectionParam as AuditCollection)
		? (collectionParam as AuditCollection)
		: 'plan_budget_histories';

	const agencyId = user.is_super_admin
		? Number(url.searchParams.get('agency_id')) || null
		: user.agency_id;

	let records: AuditRecord[] = [];

	if (agencyId) {
		try {
			const mongoDB = await getMongoDb();
			const filter: Record<string, unknown> = { agency_id: agencyId };

			const actionType = url.searchParams.get('action_type');
			if (actionType) filter.action_type = actionType;

			const rawRecords = await mongoDB
				.collection(collection)
				.find(filter)
				.sort({ created_at: -1 })
				.limit(100)
				.toArray();

			records = rawRecords.map((r) => ({
				...r,
				_id: r._id.toString()
			})) as AuditRecord[];
		} catch (err) {
			console.error('Audit load error:', err);
			records = [];
		}
	}

	return {
		user,
		records,
		collection,
		selectedAgencyId: agencyId
	};
};
