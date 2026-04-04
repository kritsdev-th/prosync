import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { orgUnits, users, userAssignments, roles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const unitId = Number(params.id);
	if (!unitId || isNaN(unitId)) throw error(404, 'ไม่พบแผนก');

	// Load org unit with head info
	const [unit] = await db
		.select({
			id: orgUnits.id,
			name: orgUnits.name,
			agency_id: orgUnits.agency_id,
			parent_id: orgUnits.parent_id,
			head_of_unit_id: orgUnits.head_of_unit_id,
			head_name: users.name
		})
		.from(orgUnits)
		.leftJoin(users, eq(orgUnits.head_of_unit_id, users.id))
		.where(eq(orgUnits.id, unitId));

	if (!unit) throw error(404, 'ไม่พบแผนก');

	// Load members assigned to this unit via user_assignments
	const members = await db
		.select({
			assignment_id: userAssignments.id,
			user_id: users.id,
			user_name: users.name,
			id_card: users.id_card,
			position: users.position,
			position_rank: users.position_rank,
			role_id: roles.id,
			role_name: roles.name,
			is_primary_unit: userAssignments.is_primary_unit
		})
		.from(userAssignments)
		.innerJoin(users, and(eq(userAssignments.user_id, users.id), isNull(users.deleted_at)))
		.innerJoin(roles, eq(userAssignments.role_id, roles.id))
		.where(eq(userAssignments.org_unit_id, unitId));

	// Load parent unit name for breadcrumb
	let parentName: string | null = null;
	if (unit.parent_id) {
		const [parent] = await db
			.select({ name: orgUnits.name })
			.from(orgUnits)
			.where(eq(orgUnits.id, unit.parent_id));
		parentName = parent?.name ?? null;
	}

	const canManage = locals.user?.is_super_admin || locals.user?.is_director || locals.user?.permissions.can_manage_users || false;

	return { unit, members, parentName, canManage };
};
