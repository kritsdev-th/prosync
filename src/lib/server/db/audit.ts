import { getMongoDb } from './mongodb';

interface ActionBy {
	user_id: number;
	name: string;
	position?: string;
	ip_address: string;
}

interface AuditEntry {
	collection: 'plan_budget_histories' | 'doc_payload_histories' | 'bank_transaction_histories';
	action_type: string;
	agency_id: number;
	action_by: ActionBy;
	[key: string]: unknown;
}

export async function writeAuditLog(entry: AuditEntry) {
	const db = await getMongoDb();
	const { collection, ...data } = entry;
	return db.collection(collection).insertOne({
		...data,
		created_at: new Date()
	});
}
