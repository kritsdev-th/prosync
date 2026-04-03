/** Permission groups stored in roles.permissions JSONB */
export interface RolePermissions {
	system: {
		can_manage_users: boolean;
		can_manage_org_units: boolean;
	};
	planning: {
		can_view_plan: boolean;
		can_create_plan: boolean;
		can_edit_plan: boolean;
		can_delete_plan: boolean;
	};
	procurement: {
		can_view_document: boolean;
		can_create_document: boolean;
		can_approve_document: boolean;
	};
	finance: {
		can_view_dika: boolean;
		can_create_dika: boolean;
		can_approve_dika: boolean;
	};
	audit: {
		can_view_audit_trail: boolean;
	};
}

/** Merged (flattened) permissions for JWT payload */
export interface MergedPermissions {
	can_manage_users: boolean;
	can_manage_plans: boolean;
	can_manage_procurement: boolean;
	can_manage_finance: boolean;
	can_view_audit_trail: boolean;
}

/** User assignment row joined with role and org unit */
export interface UserAssignmentRow {
	permissions: unknown;
	org_unit_id: number;
	is_primary_unit: boolean;
}

/** Result of merging all role permissions for a user */
export function mergePermissions(assignments: UserAssignmentRow[]): {
	permissions: MergedPermissions;
	primaryOrgUnitId: number | null;
} {
	const merged: MergedPermissions = {
		can_manage_users: false,
		can_manage_plans: false,
		can_manage_procurement: false,
		can_manage_finance: false,
		can_view_audit_trail: false
	};
	let primaryOrgUnitId: number | null = null;

	for (const a of assignments) {
		if (a.is_primary_unit) primaryOrgUnitId = a.org_unit_id;
		const p = a.permissions as RolePermissions;
		if (p.system?.can_manage_users) merged.can_manage_users = true;
		if (p.planning?.can_view_plan || p.planning?.can_create_plan || p.planning?.can_edit_plan)
			merged.can_manage_plans = true;
		if (p.procurement?.can_view_document || p.procurement?.can_create_document || p.procurement?.can_approve_document)
			merged.can_manage_procurement = true;
		if (p.finance?.can_view_dika || p.finance?.can_create_dika || p.finance?.can_approve_dika)
			merged.can_manage_finance = true;
		if (p.audit?.can_view_audit_trail) merged.can_view_audit_trail = true;
	}

	return { permissions: merged, primaryOrgUnitId };
}

/** Audit record from MongoDB */
export interface AuditRecord {
	_id: string;
	action_type: string;
	agency_id: number;
	action_by?: {
		user_id: number;
		name: string;
		ip_address?: string;
	};
	created_at?: string;
	[key: string]: unknown;
}

/** Valid MongoDB audit collection names */
export type AuditCollection =
	| 'plan_budget_histories'
	| 'doc_payload_histories'
	| 'bank_transaction_histories';

export const VALID_AUDIT_COLLECTIONS: AuditCollection[] = [
	'plan_budget_histories',
	'doc_payload_histories',
	'bank_transaction_histories'
];
