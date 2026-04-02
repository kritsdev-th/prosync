import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, agencies, orgUnits } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { completeProfileSchema, parseFormData } from '$lib/server/validation/schemas';
import { signAccessToken } from '$lib/server/auth/jwt';
import type { JWTPayload } from '$lib/types/auth';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	// Super admins don't need profile completion
	if (locals.user.is_super_admin) throw redirect(303, '/dashboard');

	// Check actual DB state (JWT might be stale)
	const [user] = await db
		.select({ profile_completed: users.profile_completed })
		.from(users)
		.where(eq(users.id, locals.user.sub));

	if (user?.profile_completed) throw redirect(303, '/dashboard');

	// Load agencies for dropdown
	const agencyList = await db.select({ id: agencies.id, name: agencies.name }).from(agencies);

	return {
		user: { name: locals.user.name, id_card: locals.user.id_card },
		agencies: agencyList
	};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.user) throw redirect(303, '/login');

		const parsed = parseFormData(completeProfileSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		const { position, position_rank, agency_id, phone, email } = parsed.data;

		try {
			// Update user profile
			await db
				.update(users)
				.set({
					position,
					position_rank,
					agency_id,
					phone,
					email: email ?? null,
					profile_completed: true
				})
				.where(eq(users.id, locals.user.sub));

			// Check if user becomes director after setting agency
			let isDirector = false;
			const [rootHead] = await db
				.select({ id: orgUnits.id })
				.from(orgUnits)
				.where(and(
					eq(orgUnits.head_of_unit_id, locals.user.sub),
					isNull(orgUnits.parent_id),
					eq(orgUnits.agency_id, agency_id)
				))
				.limit(1);
			isDirector = !!rootHead;

			// Rebuild JWT with updated info
			const updatedPayload: JWTPayload = {
				...locals.user,
				agency_id,
				is_director: isDirector,
				profile_completed: true
			};

			const newAccessToken = await signAccessToken(updatedPayload);
			cookies.set('accessToken', newAccessToken, {
				path: '/',
				httpOnly: true,
				secure: !dev,
				sameSite: 'lax',
				maxAge: 60 * 15
			});
		} catch (err) {
			console.error('Complete profile error:', err);
			return fail(500, { success: false, errors: { position: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}

		throw redirect(303, '/dashboard');
	}
};
