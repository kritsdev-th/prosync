import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users, userAssignments, roles, orgUnits } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/auth/password';
import { signAccessToken, signRefreshToken } from '$lib/server/auth/jwt';
import type { JWTPayload } from '$lib/types/auth';
import { loginSchema, parseFormData } from '$lib/server/validation/schemas';
import { mergePermissions } from '$lib/server/validation/types';
import { dev } from '$app/environment';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const parsed = parseFormData(loginSchema, formData);

		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		const { id_card, password } = parsed.data;

		try {
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

			let primaryOrgUnitId: number | null = null;
			let merged = {
				can_manage_users: false,
				can_manage_plans: false,
				can_manage_procurement: false,
				can_manage_finance: false,
				can_view_audit_trail: false
			};

			let isDirector = false;

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

				const result = mergePermissions(assignments);
				merged = result.permissions;
				primaryOrgUnitId = result.primaryOrgUnitId;

				if (user.agency_id) {
					const [rootHead] = await db
						.select({ id: orgUnits.id })
						.from(orgUnits)
						.where(and(
							eq(orgUnits.head_of_unit_id, user.id),
							isNull(orgUnits.parent_id),
							eq(orgUnits.agency_id, user.agency_id)
						))
						.limit(1);
					isDirector = !!rootHead;
				}
			}

			const jwtPayload: JWTPayload = {
				sub: user.id,
				id_card: user.id_card,
				name: user.name,
				agency_id: user.agency_id,
				is_super_admin: user.is_super_admin,
				is_director: isDirector,
				profile_completed: user.profile_completed,
				primary_org_unit_id: primaryOrgUnitId,
				permissions: merged
			};

			const accessToken = await signAccessToken(jwtPayload);
			const refreshToken = await signRefreshToken(user.id);

			cookies.set('accessToken', accessToken, {
				path: '/',
				httpOnly: true,
				secure: !dev,
				sameSite: 'lax',
				maxAge: 60 * 15
			});

			cookies.set('refreshToken', refreshToken, {
				path: '/',
				httpOnly: true,
				secure: !dev,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7
			});
		} catch (err) {
			console.error('Login error:', err);
			return fail(500, {
				success: false,
				errors: { id_card: ['เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'] }
			});
		}

		throw redirect(303, '/dashboard');
	}
};
