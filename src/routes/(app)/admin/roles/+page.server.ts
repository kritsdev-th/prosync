import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { roles, userAssignments } from '$lib/server/db/schema';

const DEFAULT_PERMISSIONS = {
	system: { can_manage_users: false, can_manage_org_units: false },
	planning: { can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
	procurement: { can_create_document: false, can_approve_document: false },
	finance: { can_create_dika: false, can_approve_dika: false },
	audit: { can_view_audit_trail: false }
};

function parsePermissions(formData: FormData) {
	const permissions = structuredClone(DEFAULT_PERMISSIONS);

	for (const [key] of formData.entries()) {
		if (!key.startsWith('perm.')) continue;
		const parts = key.replace('perm.', '').split('.');
		if (parts.length !== 2) continue;
		const [group, perm] = parts;
		if (group in permissions && perm in (permissions as any)[group]) {
			(permissions as any)[group][perm] = true;
		}
	}

	return permissions;
}

export const load: PageServerLoad = async () => {
	const allRoles = await db.select().from(roles).orderBy(roles.name);
	return { roles: allRoles };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';

		if (!name) {
			return fail(400, {
				success: false,
				errors: { name: ['กรุณาระบุชื่อบทบาท'] }
			});
		}

		if (name.length > 100) {
			return fail(400, {
				success: false,
				errors: { name: ['ชื่อบทบาทต้องไม่เกิน 100 ตัวอักษร'] }
			});
		}

		const permissions = parsePermissions(formData);
		await db.insert(roles).values({ name, permissions });

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const name = formData.get('name')?.toString().trim() ?? '';

		if (!id || isNaN(id)) {
			return fail(400, {
				success: false,
				errors: { id: ['ไม่พบรหัสบทบาท'] }
			});
		}

		if (!name) {
			return fail(400, {
				success: false,
				errors: { name: ['กรุณาระบุชื่อบทบาท'] }
			});
		}

		if (name.length > 100) {
			return fail(400, {
				success: false,
				errors: { name: ['ชื่อบทบาทต้องไม่เกิน 100 ตัวอักษร'] }
			});
		}

		const permissions = parsePermissions(formData);
		await db.update(roles).set({ name, permissions }).where(eq(roles.id, id));

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, {
				success: false,
				errors: { id: ['ไม่พบรหัสบทบาท'] }
			});
		}

		await db.delete(userAssignments).where(eq(userAssignments.role_id, id));
		await db.delete(roles).where(eq(roles.id, id));

		return { success: true };
	}
};
