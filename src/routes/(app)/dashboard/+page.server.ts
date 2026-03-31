import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { agencies, users, fiscalYears, documents, dikaVouchers, plans } from '$lib/server/db/schema';
import { eq, and, count, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const stats: Record<string, unknown> = {};

	if (user.is_super_admin) {
		// System-wide metrics
		const [agencyCount] = await db.select({ count: count() }).from(agencies);
		const [userCount] = await db.select({ count: count() }).from(users).where(isNull(users.deleted_at));
		stats.totalAgencies = agencyCount.count;
		stats.totalUsers = userCount.count;
		stats.agencyList = await db.select().from(agencies);
	}

	if (user.agency_id) {
		// Agency-specific stats
		const [activeFy] = await db
			.select()
			.from(fiscalYears)
			.where(and(eq(fiscalYears.agency_id, user.agency_id), eq(fiscalYears.is_active, true)));

		if (activeFy) {
			stats.fiscalYear = activeFy;
		}

		const [docCount] = await db
			.select({ count: count() })
			.from(documents)
			.where(and(eq(documents.agency_id, user.agency_id), eq(documents.status, 'IN_PROGRESS')));
		stats.activeDocuments = docCount.count;

		const [pendingDika] = await db
			.select({ count: count() })
			.from(dikaVouchers)
			.where(and(eq(dikaVouchers.agency_id, user.agency_id), eq(dikaVouchers.status, 'PENDING_EXAMINE')));
		stats.pendingDikaVouchers = pendingDika.count;
	}

	return { user, stats };
};
