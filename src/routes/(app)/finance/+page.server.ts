import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	dikaVouchers,
	vendors,
	plans,
	bankAccounts,
	bankTransactions,
	taxTransactions,
	agencies,
	provinces,
	bank,
	loans
} from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';
import { writeAuditLog } from '$lib/server/db/audit';
import { approveDikaSchema, createBankAccountSchema, createLoanSchema, approveLoanSchema, repayLoanSchema, parseFormData } from '$lib/server/validation/schemas';

interface DikaRow {
	id: number;
	document_id: number;
	vendor_name: string;
	plan_title: string;
	gross_amount: string;
	fine_amount: string;
	tax_amount: string;
	net_amount: string;
	status: string;
}

interface BankAccountRow {
	id: number;
	account_name: string;
	account_number: string;
	balance: string;
	is_tax_pool: boolean;
	bank_name: string;
	bank_code: string;
	bank_logo: string | null;
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();

	let provincesList: { id: number; name: string }[] = [];
	let agencyList: { id: number; name: string; agency_type: string | null; province_id: number }[] = [];
	let selectedProvinceId: number | null = null;
	let agencyId: number | null = null;

	if (user.is_super_admin) {
		provincesList = await db.select({ id: provinces.id, name: provinces.name }).from(provinces).orderBy(provinces.name);
		const pidParam = url.searchParams.get('province_id');
		if (pidParam) {
			selectedProvinceId = Number(pidParam);
			agencyList = await db
				.select({ id: agencies.id, name: agencies.name, agency_type: agencies.agency_type, province_id: agencies.province_id })
				.from(agencies)
				.where(eq(agencies.province_id, selectedProvinceId));
		}
		const aidParam = url.searchParams.get('agency_id');
		if (aidParam) agencyId = Number(aidParam);
	} else {
		agencyId = user.agency_id;
	}

	// Load all vendors (global, not agency-scoped)
	const vendorList = await db.select().from(vendors);

	let dikaList: DikaRow[] = [];
	let accountList: BankAccountRow[] = [];
	let taxList: typeof taxTransactions.$inferSelect[] = [];
	let loanList: typeof loans.$inferSelect[] = [];

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
				bank_name: bank.name,
				bank_code: bank.bank_code,
				bank_logo: bank.logo_url
			})
			.from(bankAccounts)
			.innerJoin(bank, eq(bankAccounts.bank_id, bank.id))
			.where(eq(bankAccounts.agency_id, agencyId));

		taxList = await db
			.select()
			.from(taxTransactions)
			.where(eq(taxTransactions.agency_id, agencyId));

		loanList = await db
			.select()
			.from(loans)
			.where(or(eq(loans.borrower_agency_id, agencyId), eq(loans.lender_agency_id, agencyId)));
	}

	// Load bank list for account creation dropdown
	const bankList = await db.select({ id: bank.id, name: bank.name, bank_code: bank.bank_code, logo_url: bank.logo_url }).from(bank);

	// Load all agencies for inter-agency loan selector
	const allAgencies = await db.select({ id: agencies.id, name: agencies.name }).from(agencies);

	return {
		user,
		dikaVouchers: dikaList,
		bankAccounts: accountList,
		taxTransactions: taxList,
		loans: loanList,
		vendors: vendorList,
		banks: bankList,
		allAgencies,
		provinces: provincesList,
		agencies: agencyList,
		selectedProvinceId,
		selectedAgencyId: agencyId
	};
};

export const actions: Actions = {
	approveDika: async ({ request, locals, getClientAddress }) => {
		const parsed = parseFormData(approveDikaSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			const { dika_id, action } = parsed.data;
			const [dika] = await db.select().from(dikaVouchers).where(eq(dikaVouchers.id, dika_id));
			if (!dika) return fail(404, { success: false, errors: { dika_id: ['ไม่พบฎีกา'] } });

			if (action === 'examine') {
				await db
					.update(dikaVouchers)
					.set({ status: 'PENDING_EXAMINE', examiner_id: locals.user!.sub })
					.where(eq(dikaVouchers.id, dika_id));
				return { success: true, message: 'ตรวจสอบฎีกาสำเร็จ' };
			}

			if (action === 'pay') {
				await db.transaction(async (tx) => {
					await tx
						.update(dikaVouchers)
						.set({ status: 'PAID', director_id: locals.user!.sub })
						.where(eq(dikaVouchers.id, dika_id));

					await tx.insert(bankTransactions).values({
						bank_account_id: dika.payment_bank_account_id,
						transaction_type: 'OUT',
						amount: dika.net_amount,
						plan_id: dika.plan_id,
						dika_voucher_id: dika_id,
						action_by_user_id: locals.user!.sub,
						tags: { vendor_id: dika.vendor_id }
					});

					if (Number(dika.tax_amount) > 0 && dika.tax_pool_account_id) {
						await tx.insert(bankTransactions).values({
							bank_account_id: dika.tax_pool_account_id,
							transaction_type: 'BORROW_TAX',
							amount: dika.tax_amount,
							plan_id: dika.plan_id,
							dika_voucher_id: dika_id,
							action_by_user_id: locals.user!.sub,
							tags: { type: 'tax_withholding' }
						});

						const [vendor] = await tx
							.select()
							.from(vendors)
							.where(eq(vendors.id, dika.vendor_id));

						await tx.insert(taxTransactions).values({
							agency_id: dika.agency_id,
							dika_voucher_id: dika_id,
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

				if (locals.user) {
					await writeAuditLog({
						collection: 'bank_transaction_histories',
						action_type: 'SYSTEM_SETTLE',
						agency_id: dika.agency_id,
						bank_transaction_id: dika_id,
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
					.where(eq(dikaVouchers.id, dika_id));
				return { success: true, message: 'ปฏิเสธฎีกาแล้ว' };
			}
		} catch (err) {
			console.error('Approve dika error:', err);
			return fail(500, { success: false, errors: { dika_id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	createBankAccount: async ({ request }) => {
		const parsed = parseFormData(createBankAccountSchema, await request.formData());
		if (!parsed.success) {
			return fail(400, { success: false, errors: parsed.errors });
		}

		try {
			await db.insert(bankAccounts).values({
				...parsed.data,
				balance: '0'
			});

			return { success: true, message: 'สร้างบัญชีธนาคารสำเร็จ' };
		} catch (err) {
			console.error('Create bank account error:', err);
			return fail(500, { success: false, errors: { account_name: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	createLoan: async ({ request, locals }) => {
		const parsed = parseFormData(createLoanSchema, await request.formData());
		if (!parsed.success) return fail(400, { success: false, errors: parsed.errors });
		try {
			const { amount, purpose, due_date, loan_type, borrower_agency_id, lender_agency_id, source_bank_account_id } = parsed.data;
			await db.insert(loans).values({
				borrower_agency_id,
				loan_type,
				lender_agency_id: lender_agency_id ?? null,
				source_bank_account_id: source_bank_account_id ?? null,
				amount: String(amount),
				purpose,
				due_date: due_date || null,
				requested_by_user_id: (locals as any).user?.id ?? null
			});
			return { success: true, message: 'สร้างคำขอยืมเงินสำเร็จ' };
		} catch (err) {
			console.error('Create loan error:', err);
			return fail(500, { success: false, errors: { amount: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	approveLoan: async ({ request, locals }) => {
		const parsed = parseFormData(approveLoanSchema, await request.formData());
		if (!parsed.success) return fail(400, { success: false, errors: parsed.errors });
		try {
			const { loan_id, action } = parsed.data;
			await db.update(loans).set({
				status: action === 'APPROVED' ? 'APPROVED' : 'REJECTED',
				approved_by_user_id: (locals as any).user?.id ?? null,
				approved_at: new Date()
			}).where(eq(loans.id, loan_id));
			return { success: true, message: action === 'APPROVED' ? 'อนุมัติการยืมเงินแล้ว' : 'ปฏิเสธการยืมเงินแล้ว' };
		} catch (err) {
			console.error('Approve loan error:', err);
			return fail(500, { success: false, errors: { loan_id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	},

	repayLoan: async ({ request }) => {
		const parsed = parseFormData(repayLoanSchema, await request.formData());
		if (!parsed.success) return fail(400, { success: false, errors: parsed.errors });
		try {
			const { loan_id, repay_amount } = parsed.data;
			const [loan] = await db.select().from(loans).where(eq(loans.id, loan_id));
			if (!loan) return fail(404, { success: false, errors: { loan_id: ['ไม่พบรายการยืม'] } });
			const newRepaid = Number(loan.repaid_amount) + repay_amount;
			const fullyRepaid = newRepaid >= Number(loan.amount);
			await db.update(loans).set({
				repaid_amount: String(newRepaid),
				status: fullyRepaid ? 'REPAID' : loan.status,
				repaid_at: fullyRepaid ? new Date() : null
			}).where(eq(loans.id, loan_id));
			return { success: true, message: fullyRepaid ? 'ชำระคืนครบแล้ว' : 'บันทึกการชำระคืนแล้ว' };
		} catch (err) {
			console.error('Repay loan error:', err);
			return fail(500, { success: false, errors: { loan_id: ['เกิดข้อผิดพลาด กรุณาลองใหม่'] } });
		}
	}
};
