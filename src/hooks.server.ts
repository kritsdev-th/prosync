import { redirect, type Handle } from '@sveltejs/kit';
import { verifyToken, verifyRefreshToken, signAccessToken } from '$lib/server/auth/jwt';
import { db } from '$lib/server/db';
import { users, userAssignments, roles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { JWTPayload } from '$lib/types/auth';

async function buildJWTPayload(userId: number): Promise<JWTPayload | null> {
	const [user] = await db
		.select({
			id: users.id,
			id_card: users.id_card,
			name: users.name,
			agency_id: users.agency_id,
			is_super_admin: users.is_super_admin
		})
		.from(users)
		.where(and(eq(users.id, userId), isNull(users.deleted_at)));

	if (!user) return null;

	// Merge permissions from all assignments
	const merged = {
		can_manage_users: false,
		can_manage_plans: false,
		can_manage_procurement: false,
		can_manage_finance: false,
		can_view_audit_trail: false
	};
	let primaryOrgUnitId: number | null = null;

	if (!user.is_super_admin) {
		const assignments = await db
			.select({
				permissions: roles.permissions,
				org_unit_id: userAssignments.org_unit_id,
				is_primary_unit: userAssignments.is_primary_unit
			})
			.from(userAssignments)
			.innerJoin(roles, eq(userAssignments.role_id, roles.id))
			.where(eq(userAssignments.user_id, userId));

		for (const a of assignments) {
			if (a.is_primary_unit) primaryOrgUnitId = a.org_unit_id;
			const p = a.permissions as Record<string, Record<string, boolean>>;
			if (p.system?.can_manage_users) merged.can_manage_users = true;
			if (p.planning?.can_create_plan || p.planning?.can_edit_plan)
				merged.can_manage_plans = true;
			if (p.procurement?.can_create_document || p.procurement?.can_approve_document)
				merged.can_manage_procurement = true;
			if (p.finance?.can_create_dika || p.finance?.can_approve_dika)
				merged.can_manage_finance = true;
			if (p.audit?.can_view_audit_trail) merged.can_view_audit_trail = true;
		}
	}

	return {
		sub: user.id,
		id_card: user.id_card,
		name: user.name,
		agency_id: user.agency_id,
		is_super_admin: user.is_super_admin,
		primary_org_unit_id: primaryOrgUnitId,
		permissions: merged
	};
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	const accessToken = event.cookies.get('accessToken');
	const refreshToken = event.cookies.get('refreshToken');
	const isAuthRoute =
		event.url.pathname.startsWith('/login') || event.url.pathname.startsWith('/api/auth');

	// 1. Try access token
	if (accessToken) {
		const payload = await verifyToken(accessToken);
		if (payload) {
			event.locals.user = payload;
		}
	}

	// 2. If access token failed, try refresh token
	if (!event.locals.user && refreshToken) {
		const refreshPayload = await verifyRefreshToken(refreshToken);
		if (refreshPayload) {
			const jwtPayload = await buildJWTPayload(refreshPayload.sub);
			if (jwtPayload) {
				const newAccessToken = await signAccessToken(jwtPayload);
				const isProduction = process.env.NODE_ENV === 'production';
				event.cookies.set('accessToken', newAccessToken, {
					path: '/',
					httpOnly: true,
					secure: isProduction,
					sameSite: 'lax',
					maxAge: 60 * 15 // 15 min
				});
				event.locals.user = jwtPayload;
			}
		}
	}

	// 3. Redirect to login if not authenticated (except auth routes)
	if (!event.locals.user && !isAuthRoute) {
		throw redirect(303, '/login');
	}

	// 4. Redirect to dashboard if already logged in and visiting login
	if (event.locals.user && event.url.pathname === '/login') {
		throw redirect(303, '/dashboard');
	}

	// 5. RBAC path checks (skip for super admin)
	if (event.locals.user && !event.locals.user.is_super_admin) {
		const path = event.url.pathname;
		const perms = event.locals.user.permissions;

		if (path.startsWith('/planning') && !perms.can_manage_plans) {
			throw redirect(303, '/dashboard');
		}
		if (path.startsWith('/procurement') && !perms.can_manage_procurement) {
			throw redirect(303, '/dashboard');
		}
		if (path.startsWith('/finance') && !perms.can_manage_finance) {
			throw redirect(303, '/dashboard');
		}
		if (path.startsWith('/audit') && !perms.can_view_audit_trail) {
			throw redirect(303, '/dashboard');
		}
		if (path.startsWith('/admin') && !perms.can_manage_users) {
			throw redirect(303, '/dashboard');
		}
	}

	return resolve(event);
};
