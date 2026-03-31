import { MongoClient, type Db } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

const uri = MONGODB_URI;

let client: MongoClient;
let db: Db;

export async function getMongoDb(): Promise<Db> {
	if (!db) {
		client = new MongoClient(uri);
		await client.connect();
		db = client.db();

		// Create indexes for efficient querying
		await Promise.all([
			db
				.collection('plan_budget_histories')
				.createIndex({ agency_id: 1, 'action_by.user_id': 1, created_at: -1 }),
			db
				.collection('doc_payload_histories')
				.createIndex({ agency_id: 1, 'action_by.user_id': 1, created_at: -1 }),
			db
				.collection('bank_transaction_histories')
				.createIndex({ agency_id: 1, 'action_by.user_id': 1, created_at: -1 })
		]);
	}
	return db;
}

export async function getPlanBudgetHistories() {
	const db = await getMongoDb();
	return db.collection('plan_budget_histories');
}

export async function getDocPayloadHistories() {
	const db = await getMongoDb();
	return db.collection('doc_payload_histories');
}

export async function getBankTransactionHistories() {
	const db = await getMongoDb();
	return db.collection('bank_transaction_histories');
}
