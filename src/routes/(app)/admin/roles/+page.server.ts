import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { roles, userAssignments } from '$lib/server/db/schema';
import { roleSchema, parseFormData } from '$lib/server/validation/schemas';
import type { RolePermissions } from '$lib/server/validation/types';

const DEFAULT_PERMISSIONS: RolePermissions = {
	system: { can_manage_users: false, can_manage_org_units: false },
	planning: { can_view_plan: false, can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
	procurement: { can_view_document: false, can_create_document: false, can_approve_document: false },
	finance: { can_view_dika: false, can_create_dika: false, can_approve_dika: false },
	audit: { can_view_audit_trail: false }
};

function parsePermissions(formData: FormData): RolePermissions {
	const permissions = structuredClone(DEFAULT_PERMISSIONS);

	for (const [key] of formData.entries()) {
		if (!key.startsWith('perm.')) continue;
		const parts = key.replace('perm.', '').split('.');
		if (parts.length !== 2) continue;
		const [group, perm] = parts;
		if (
			group in permissions &&
			perm in permissions[group as keyof RolePermissions]
		) {
			(permissions[group as keyof RolePermissions] as Record<string, boolean>)[perm] = true;
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
		const parsed = parseFormData(roleSchema, formData);
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const permissions = parsePermissions(formData);
			await db.insert(roles).values({ name: parsed.data.name, permissions });
			return { success: true };
		} catch (err) {
			console.error('Create role error:', err);
			return fail(500, { success: false, errors: { name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { success: false, errors: { id: ['ไม่พบรหัสบทบาท'] } });
		}

		const parsed = parseFormData(roleSchema, formData);
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const permissions = parsePermissions(formData);
			await db.update(roles).set({ name: parsed.data.name, permissions }).where(eq(roles.id, id));
			return { success: true };
		} catch (err) {
			console.error('Update role error:', err);
			return fail(500, { success: false, errors: { name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { success: false, errors: { id: ['ไม่พบรหัสบทบาท'] } });
		}

		try {
			await db.delete(userAssignments).where(eq(userAssignments.role_id, id));
			await db.delete(roles).where(eq(roles.id, id));
			return { success: true };
		} catch (err) {
			console.error('Delete role error:', err);
			return fail(500, { success: false, errors: { id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	}
};
