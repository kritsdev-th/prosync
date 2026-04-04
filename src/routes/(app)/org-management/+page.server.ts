import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { provinces, agencies } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(303, '/login');
	const { is_super_admin, is_director } = locals.user;

	// Non-super-admin: auto-scope to their own agency (view-only for non-director/non-admin)
	if (!is_super_admin) {
		const agencyId = locals.user.agency_id;
		if (!agencyId) throw redirect(303, '/dashboard');

		const [agency] = await db
			.select({ id: agencies.id, name: agencies.name })
			.from(agencies)
			.where(eq(agencies.id, agencyId));

		// canManage: only director or users with can_manage_users
		const canManage = is_director || locals.user.permissions.can_manage_users;

		return {
			mode: canManage ? 'director' as const : 'viewer' as const,
			selectedAgencyId: agencyId,
			agencyName: agency?.name ?? '',
			provinces: [],
			agencies: [],
			canManage
		};
	}

	// Super admin: province/agency selector
	const provinceList = await db
		.select({ id: provinces.id, name: provinces.name })
		.from(provinces);

	const selectedProvinceId = url.searchParams.get('province_id')
		? Number(url.searchParams.get('province_id'))
		: null;

	let agencyList: { id: number; name: string }[] = [];
	let selectedAgencyId: number | null = null;

	if (selectedProvinceId) {
		agencyList = await db
			.select({ id: agencies.id, name: agencies.name })
			.from(agencies)
			.where(eq(agencies.province_id, selectedProvinceId));

		const aidParam = url.searchParams.get('agency_id');
		if (aidParam) {
			selectedAgencyId = Number(aidParam);
		}
	}

	return {
		mode: 'super_admin' as const,
		selectedProvinceId,
		selectedAgencyId,
		provinces: provinceList,
		agencies: agencyList,
		agencyName: null,
		canManage: true
	};
};
