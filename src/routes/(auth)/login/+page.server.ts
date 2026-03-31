import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users, userAssignments, roles } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/auth/password';
import { signAccessToken, signRefreshToken } from '$lib/server/auth/jwt';
import type { JWTPayload } from '$lib/types/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id_card = formData.get('id_card') as string;
		const password = formData.get('password') as string;

		if (!id_card || !password) {
			return fail(400, {
				success: false,
				errors: { id_card: ['กรุณากรอกข้อมูลให้ครบถ้วน'] }
			});
		}

		if (!/^\d{13}$/.test(id_card)) {
			return fail(400, {
				success: false,
				errors: { id_card: ['เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'] }
			});
		}

		// Query user with password_hash (only for login)
		const [user] = await db
			.select()
			.from(users)
			.where(and(eq(users.id_card, id_card), isNull(users.deleted_at)));

		if (!user) {
			return fail(400, {
				success: false,
				errors: { id_card: ['เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง'] }
			});
		}

		const validPassword = await verifyPassword(user.password_hash, password);
		if (!validPassword) {
			return fail(400, {
				success: false,
				errors: { id_card: ['เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง'] }
			});
		}

		// Build permissions from assignments
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
				.where(eq(userAssignments.user_id, user.id));

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

		const jwtPayload: JWTPayload = {
			sub: user.id,
			id_card: user.id_card,
			name: user.name,
			agency_id: user.agency_id,
			is_super_admin: user.is_super_admin,
			primary_org_unit_id: primaryOrgUnitId,
			permissions: merged
		};

		const isProduction = process.env.NODE_ENV === 'production';
		const accessToken = await signAccessToken(jwtPayload);
		const refreshToken = await signRefreshToken(user.id);

		cookies.set('accessToken', accessToken, {
			path: '/',
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: 60 * 15 // 15 minutes
		});

		cookies.set('refreshToken', refreshToken, {
			path: '/',
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		throw redirect(303, '/dashboard');
	}
};
