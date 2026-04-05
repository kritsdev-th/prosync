import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { provinces, agencies, fiscalYears } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getMongoDb } from '$lib/server/db/mongodb';
import { type AuditRecord, type AuditCollection, VALID_AUDIT_COLLECTIONS } from '$lib/server/validation/types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();
	const collectionParam = url.searchParams.get('collection') || 'plan_budget_histories';
	const collection: AuditCollection = VALID_AUDIT_COLLECTIONS.includes(collectionParam as AuditCollection)
		? (collectionParam as AuditCollection)
		: 'plan_budget_histories';

	// Scope: super admin must select province+agency, others see own agency
	let provincesList: { id: number; name: string }[] = [];
	let agenciesList: { id: number; name: string; province_id: number }[] = [];
	let selectedProvinceId: number | null = null;
	let selectedAgencyId: number | null = null;

	if (user.is_super_admin) {
		provincesList = await db.select({ id: provinces.id, name: provinces.name }).from(provinces).orderBy(provinces.name);

		const pidParam = url.searchParams.get('province_id');
		if (pidParam) {
			selectedProvinceId = Number(pidParam);
			agenciesList = await db
				.select({ id: agencies.id, name: agencies.name, province_id: agencies.province_id })
				.from(agencies)
				.where(eq(agencies.province_id, selectedProvinceId));
		}

		const aidParam = url.searchParams.get('agency_id');
		if (aidParam) selectedAgencyId = Number(aidParam);
	} else {
		selectedAgencyId = user.agency_id;
	}

	const actionType = url.searchParams.get('action_type') || null;
	let records: AuditRecord[] = [];

	if (selectedAgencyId) {
		try {
			const mongoDB = await getMongoDb();
			const filter: Record<string, unknown> = {};

			if (user.is_super_admin) {
				// Super admin sees: records for selected agency + own edits
				filter.$or = [
					{ agency_id: selectedAgencyId },
					{ 'action_by.user_id': user.sub }
				];
			} else {
				// Regular user / director: only own agency records
				filter.agency_id = selectedAgencyId;
			}

			if (actionType) filter.action_type = actionType;

			const rawRecords = await mongoDB
				.collection(collection)
				.find(filter)
				.sort({ created_at: -1 })
				.limit(200)
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

	// Load fiscal years for filtering
	let fyList: { id: number; year_name: string; is_active: boolean }[] = [];
	if (selectedAgencyId) {
		fyList = await db
			.select({ id: fiscalYears.id, year_name: fiscalYears.year_name, is_active: fiscalYears.is_active })
			.from(fiscalYears)
			.where(eq(fiscalYears.agency_id, selectedAgencyId));
	}

	return {
		user,
		records,
		collection,
		fiscalYears: fyList,
		provinces: provincesList,
		agencies: agenciesList,
		selectedProvinceId,
		selectedAgencyId,
		actionType
	};
};
