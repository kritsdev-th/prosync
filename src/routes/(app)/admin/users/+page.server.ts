import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	users,
	userAssignments,
	roles,
	orgUnits,
	agencies
} from '$lib/server/db/schema';
import { eq, and, isNull, like, or } from 'drizzle-orm';
import { hashPassword } from '$lib/server/auth/password';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || '';

	let userList;
	if (search) {
		userList = await db
			.select({
				id: users.id,
				name: users.name,
				id_card: users.id_card,
				position: users.position,
				position_rank: users.position_rank,
				email: users.email,
				agency_id: users.agency_id,
				agency_name: agencies.name,
				is_super_admin: users.is_super_admin
			})
			.from(users)
			.leftJoin(agencies, eq(users.agency_id, agencies.id))
			.where(
				and(
					isNull(users.deleted_at),
					or(like(users.name, `%${search}%`), like(users.id_card, `%${search}%`))
				)
			);
	} else {
		userList = await db
			.select({
				id: users.id,
				name: users.name,
				id_card: users.id_card,
				position: users.position,
				position_rank: users.position_rank,
				email: users.email,
				agency_id: users.agency_id,
				agency_name: agencies.name,
				is_super_admin: users.is_super_admin
			})
			.from(users)
			.leftJoin(agencies, eq(users.agency_id, agencies.id))
			.where(isNull(users.deleted_at));
	}

	// Get assignments for each user
	const allAssignments = await db
		.select({
			id: userAssignments.id,
			user_id: userAssignments.user_id,
			role_id: userAssignments.role_id,
			role_name: roles.name,
			org_unit_id: userAssignments.org_unit_id,
			org_unit_name: orgUnits.name,
			is_primary_unit: userAssignments.is_primary_unit
		})
		.from(userAssignments)
		.innerJoin(roles, eq(userAssignments.role_id, roles.id))
		.innerJoin(orgUnits, eq(userAssignments.org_unit_id, orgUnits.id));

	const allRoles = await db.select().from(roles);
	const allOrgUnits = await db.select().from(orgUnits);
	const allAgencies = await db.select().from(agencies);

	return { users: userList, assignments: allAssignments, roles: allRoles, orgUnits: allOrgUnits, agencies: allAgencies, search };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('name') as string;
		const id_card = form.get('id_card') as string;
		const password = form.get('password') as string;
		const agency_id = form.get('agency_id') as string;
		const position = form.get('position') as string;
		const position_rank = form.get('position_rank') as string;
		const email = form.get('email') as string;

		if (!name || !id_card || !password) {
			return fail(400, { success: false, errors: { name: ['กรุณากรอกข้อมูลให้ครบถ้วน'] } });
		}
		if (!/^\d{13}$/.test(id_card)) {
			return fail(400, { success: false, errors: { id_card: ['เลขบัตรประชาชนต้องเป็น 13 หลัก'] } });
		}

		const password_hash = await hashPassword(password);
		await db.insert(users).values({
			name,
			id_card,
			password_hash,
			agency_id: agency_id ? Number(agency_id) : null,
			position: position || null,
			position_rank: position_rank || null,
			email: email || null
		});

		return { success: true, message: 'สร้างผู้ใช้งานสำเร็จ' };
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const name = form.get('name') as string;
		const agency_id = form.get('agency_id') as string;
		const position = form.get('position') as string;
		const position_rank = form.get('position_rank') as string;
		const email = form.get('email') as string;

		if (!name) {
			return fail(400, { success: false, errors: { name: ['กรุณากรอกชื่อ'] } });
		}

		await db
			.update(users)
			.set({
				name,
				agency_id: agency_id ? Number(agency_id) : null,
				position: position || null,
				position_rank: position_rank || null,
				email: email || null
			})
			.where(eq(users.id, id));

		return { success: true, message: 'แก้ไขผู้ใช้งานสำเร็จ' };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

		// Soft delete
		await db.update(users).set({ deleted_at: new Date() }).where(eq(users.id, id));

		return { success: true, message: 'ลบผู้ใช้งานสำเร็จ' };
	},

	assign: async ({ request }) => {
		const form = await request.formData();
		const user_id = Number(form.get('user_id'));
		const role_id = Number(form.get('role_id'));
		const org_unit_id = Number(form.get('org_unit_id'));
		const is_primary_unit = form.get('is_primary_unit') === 'true';

		if (!user_id || !role_id || !org_unit_id) {
			return fail(400, { success: false, errors: { role_id: ['กรุณาเลือกข้อมูลให้ครบ'] } });
		}

		// If setting as primary, unset other primary assignments for this user
		if (is_primary_unit) {
			await db
				.update(userAssignments)
				.set({ is_primary_unit: false })
				.where(eq(userAssignments.user_id, user_id));
		}

		await db.insert(userAssignments).values({
			user_id,
			role_id,
			org_unit_id,
			is_primary_unit
		});

		return { success: true, message: 'มอบหมายสิทธิ์สำเร็จ' };
	},

	removeAssignment: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));

		await db.delete(userAssignments).where(eq(userAssignments.id, id));

		return { success: true, message: 'ลบสิทธิ์สำเร็จ' };
	}
};
