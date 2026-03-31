import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	dikaVouchers,
	documents,
	vendors,
	plans,
	bankAccounts,
	bankTransactions,
	taxTransactions,
	agencies,
	bank
} from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeAuditLog } from '$lib/server/db/audit';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();
	const agencyId = user.is_super_admin
		? Number(url.searchParams.get('agency_id')) || null
		: user.agency_id;

	let dikaList: any[] = [];
	let accountList: any[] = [];
	let agencyList: any[] = [];
	let taxList: any[] = [];

	if (user.is_super_admin) {
		agencyList = await db.select().from(agencies);
	}

	if (agencyId) {
		dikaList = await db
			.select({
				id: dikaVouchers.id,
				document_id: dikaVouchers.document_id,
				vendor_name: vendors.company_name,
				plan_title: plans.title,
				gross_amount: dikaVouchers.gross_amount,
				fine_amount: dikaVouchers.fine_amount,
				tax_amount: dikaVouchers.tax_amount,
				net_amount: dikaVouchers.net_amount,
				status: dikaVouchers.status
			})
			.from(dikaVouchers)
			.innerJoin(vendors, eq(dikaVouchers.vendor_id, vendors.id))
			.innerJoin(plans, eq(dikaVouchers.plan_id, plans.id))
			.where(eq(dikaVouchers.agency_id, agencyId));

		accountList = await db
			.select({
				id: bankAccounts.id,
				account_name: bankAccounts.account_name,
				account_number: bankAccounts.account_number,
				balance: bankAccounts.balance,
				is_tax_pool: bankAccounts.is_tax_pool,
				bank_name: bank.name
			})
			.from(bankAccounts)
			.innerJoin(bank, eq(bankAccounts.bank_id, bank.id))
			.where(eq(bankAccounts.agency_id, agencyId));

		taxList = await db
			.select()
			.from(taxTransactions)
			.where(eq(taxTransactions.agency_id, agencyId));
	}

	return {
		user,
		dikaVouchers: dikaList,
		bankAccounts: accountList,
		taxTransactions: taxList,
		agencies: agencyList,
		selectedAgencyId: agencyId
	};
};

export const actions: Actions = {
	approveDika: async ({ request, locals, getClientAddress }) => {
		const form = await request.formData();
		const dikaId = Number(form.get('dika_id'));
		const action = form.get('action') as string; // 'examine' or 'pay'

		const [dika] = await db.select().from(dikaVouchers).where(eq(dikaVouchers.id, dikaId));
		if (!dika) return fail(404, { success: false, errors: { dika_id: ['ไม่พบฎีกา'] } });

		if (action === 'examine') {
			await db
				.update(dikaVouchers)
				.set({ status: 'PENDING_EXAMINE', examiner_id: locals.user!.sub })
				.where(eq(dikaVouchers.id, dikaId));
			return { success: true, message: 'ตรวจสอบฎีกาสำเร็จ' };
		}

		if (action === 'pay') {
			// Use transaction for atomic operation
			await db.transaction(async (tx) => {
				// Update dika status
				await tx
					.update(dikaVouchers)
					.set({ status: 'PAID', director_id: locals.user!.sub })
					.where(eq(dikaVouchers.id, dikaId));

				// Create bank transaction (OUT - payment to vendor)
				await tx.insert(bankTransactions).values({
					bank_account_id: dika.payment_bank_account_id,
					transaction_type: 'OUT',
					amount: dika.net_amount,
					plan_id: dika.plan_id,
					dika_voucher_id: dikaId,
					action_by_user_id: locals.user!.sub,
					tags: { vendor_id: dika.vendor_id }
				});

				// If there's tax, move it to tax pool
				if (Number(dika.tax_amount) > 0 && dika.tax_pool_account_id) {
					await tx.insert(bankTransactions).values({
						bank_account_id: dika.tax_pool_account_id,
						transaction_type: 'BORROW_TAX',
						amount: dika.tax_amount,
						plan_id: dika.plan_id,
						dika_voucher_id: dikaId,
						action_by_user_id: locals.user!.sub,
						tags: { type: 'tax_withholding' }
					});

					// Get vendor tax_id
					const [vendor] = await tx
						.select()
						.from(vendors)
						.where(eq(vendors.id, dika.vendor_id));

					// Create tax transaction record
					await tx.insert(taxTransactions).values({
						agency_id: dika.agency_id,
						dika_voucher_id: dikaId,
						vendor_id: dika.vendor_id,
						tax_id: vendor?.tax_id || '',
						tax_rate: '1.00',
						tax_base_amount: dika.gross_amount,
						tax_amount: dika.tax_amount,
						tax_form_type: 'ภ.ง.ด.53',
						status: 'WITHHELD'
					});
				}
			});

			// Audit trail
			if (locals.user) {
				await writeAuditLog({
					collection: 'bank_transaction_histories',
					action_type: 'SYSTEM_SETTLE',
					agency_id: dika.agency_id,
					bank_transaction_id: dikaId,
					amount_change: { old: 0, new: Number(dika.net_amount) },
					action_by: {
						user_id: locals.user.sub,
						name: locals.user.name,
						ip_address: getClientAddress()
					}
				});
			}

			return { success: true, message: 'อนุมัติจ่ายเงินสำเร็จ' };
		}

		if (action === 'reject') {
			await db
				.update(dikaVouchers)
				.set({ status: 'REJECTED' })
				.where(eq(dikaVouchers.id, dikaId));
			return { success: true, message: 'ปฏิเสธฎีกาแล้ว' };
		}
	},

	createBankAccount: async ({ request }) => {
		const form = await request.formData();
		const agency_id = Number(form.get('agency_id'));
		const bank_id = Number(form.get('bank_id'));
		const account_name = form.get('account_name') as string;
		const account_number = form.get('account_number') as string;
		const is_tax_pool = form.get('is_tax_pool') === 'true';

		if (!account_name || !account_number || !bank_id) {
			return fail(400, { success: false, errors: { account_name: ['กรุณากรอกข้อมูลให้ครบ'] } });
		}

		await db.insert(bankAccounts).values({
			agency_id,
			bank_id,
			account_name,
			account_number,
			balance: '0',
			is_tax_pool
		});

		return { success: true, message: 'สร้างบัญชีธนาคารสำเร็จ' };
	}
};
