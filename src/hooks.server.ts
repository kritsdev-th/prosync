import { redirect, type Handle } from '@sveltejs/kit';
import { verifyToken, verifyRefreshToken, signAccessToken } from '$lib/server/auth/jwt';
import { db } from '$lib/server/db';
import { users, userAssignments, roles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { JWTPayload } from '$lib/types/auth';
import { mergePermissions } from '$lib/server/validation/types';
import { dev } from '$app/environment';

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

	let primaryOrgUnitId: number | null = null;
	let merged = {
		can_manage_users: false,
		can_manage_plans: false,
		can_manage_procurement: false,
		can_manage_finance: false,
		can_view_audit_trail: false
	};

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

		const result = mergePermissions(assignments);
		merged = result.permissions;
		primaryOrgUnitId = result.primaryOrgUnitId;
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
		event.url.pathname.startsWith('/login') ||
		event.url.pathname.startsWith('/register') ||
		event.url.pathname.startsWith('/api/auth');

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
				event.cookies.set('accessToken', newAccessToken, {
					path: '/',
					httpOnly: true,
					secure: !dev,
					sameSite: 'lax',
					maxAge: 60 * 15
				});
				event.locals.user = jwtPayload;
			}
		}
	}

	// 3. Redirect to login if not authenticated (except auth routes)
	if (!event.locals.user && !isAuthRoute) {
		throw redirect(303, '/login');
	}

	// 4. Redirect to dashboard if already logged in and visiting auth pages
	if (event.locals.user && (event.url.pathname === '/login' || event.url.pathname === '/register')) {
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
