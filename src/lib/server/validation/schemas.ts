import { z } from 'zod';

// ──────────────────────────────────────────────
// Shared validators
// ──────────────────────────────────────────────

const thaiIdCard = z
	.string()
	.regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');

const requiredString = (fieldName: string) =>
	z.string().min(1, `กรุณากรอก${fieldName}`);

const optionalString = z
	.string()
	.transform((v) => (v.trim() === '' ? null : v.trim()))
	.nullable()
	.optional();

const positiveId = z.coerce
	.number()
	.int()
	.positive('กรุณาเลือกข้อมูล');

const optionalId = z.coerce
	.number()
	.int()
	.positive()
	.nullable()
	.optional()
	.or(z.literal('').transform(() => null));

const monetaryAmount = z.coerce
	.number()
	.min(0, 'จำนวนเงินต้องไม่ติดลบ')
	.transform((v) => v.toFixed(2));

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────

export const loginSchema = z.object({
	identifier: requiredString('เลขบัตรประชาชน, อีเมล หรือเบอร์โทร'),
	password: requiredString('รหัสผ่าน')
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
	id_card: thaiIdCard,
	password: requiredString('รหัสผ่าน').pipe(z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')),
	confirm_password: requiredString('ยืนยันรหัสผ่าน'),
	name: requiredString('ชื่อ-สกุล').pipe(z.string().max(255, 'ชื่อต้องไม่เกิน 255 ตัวอักษร')),
	email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').nullable().optional()
		.or(z.literal('').transform(() => null)),
	position: optionalString,
	position_rank: optionalString
}).refine((data) => data.password === data.confirm_password, {
	message: 'รหัสผ่านไม่ตรงกัน',
	path: ['confirm_password']
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const completeProfileSchema = z.object({
	position: requiredString('ยศ/คำนำหน้า').pipe(z.string().max(50)),
	position_rank: requiredString('ระดับตำแหน่ง').pipe(z.string().max(255)),
	agency_id: positiveId,
	phone: requiredString('เบอร์โทรศัพท์').pipe(z.string().max(20).regex(/^[0-9\-+() ]+$/, 'รูปแบบเบอร์โทรไม่ถูกต้อง')),
	email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').max(255).nullable().optional()
		.or(z.literal('').transform(() => null))
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────

export const createUserSchema = z.object({
	name: requiredString('ชื่อ-สกุล').pipe(z.string().max(255, 'ชื่อต้องไม่เกิน 255 ตัวอักษร')),
	id_card: thaiIdCard,
	password: requiredString('รหัสผ่าน').pipe(z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')),
	agency_id: optionalId,
	position: optionalString,
	position_rank: optionalString,
	email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').nullable().optional()
		.or(z.literal('').transform(() => null))
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
	id: positiveId,
	name: requiredString('ชื่อ-สกุล').pipe(z.string().max(255)),
	agency_id: optionalId,
	position: optionalString,
	position_rank: optionalString,
	email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').nullable().optional()
		.or(z.literal('').transform(() => null))
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const assignRoleSchema = z.object({
	user_id: positiveId,
	role_id: positiveId,
	org_unit_id: positiveId,
	is_primary_unit: z.enum(['true', 'false']).transform((v) => v === 'true').default('false')
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

// ──────────────────────────────────────────────
// Roles
// ──────────────────────────────────────────────

export const roleSchema = z.object({
	name: requiredString('ชื่อบทบาท').pipe(z.string().max(100, 'ชื่อบทบาทต้องไม่เกิน 100 ตัวอักษร'))
});

export type RoleInput = z.infer<typeof roleSchema>;

// ──────────────────────────────────────────────
// Provinces
// ──────────────────────────────────────────────

export const provinceSchema = z.object({
	name: requiredString('ชื่อจังหวัด').pipe(z.string().max(100, 'ชื่อจังหวัดต้องไม่เกิน 100 ตัวอักษร'))
});

export type ProvinceInput = z.infer<typeof provinceSchema>;

// ──────────────────────────────────────────────
// Agencies
// ──────────────────────────────────────────────

const agencyTypes = ['อบจ.', 'เทศบาลนคร', 'เทศบาลเมือง', 'เทศบาลตำบล', 'อบต.'] as const;

export const createAgencySchema = z.object({
	name: requiredString('ชื่อหน่วยงาน').pipe(z.string().max(255)),
	agency_type: z.enum(agencyTypes, { message: 'กรุณาเลือกประเภทหน่วยงาน' }),
	province_id: positiveId
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;

export const updateAgencySchema = createAgencySchema.extend({
	id: positiveId
});

export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;

// ──────────────────────────────────────────────
// Org Structure
// ──────────────────────────────────────────────

export const createOrgUnitSchema = z.object({
	name: requiredString('ชื่อแผนก').pipe(z.string().max(255)),
	agency_id: positiveId,
	parent_id: optionalId,
	head_of_unit_id: optionalId
});

export type CreateOrgUnitInput = z.infer<typeof createOrgUnitSchema>;

export const updateOrgUnitSchema = z.object({
	id: positiveId,
	name: requiredString('ชื่อแผนก').pipe(z.string().max(255)),
	parent_id: optionalId,
	head_of_unit_id: optionalId
});

export type UpdateOrgUnitInput = z.infer<typeof updateOrgUnitSchema>;

// ──────────────────────────────────────────────
// Median Prices
// ──────────────────────────────────────────────

export const createMedianPriceSchema = z.object({
	category: requiredString('หมวดหมู่').pipe(z.string().max(100)),
	item_name: requiredString('ชื่อรายการ').pipe(z.string().max(255)),
	price: monetaryAmount,
	province_id: positiveId,
	effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง')
});

export type CreateMedianPriceInput = z.infer<typeof createMedianPriceSchema>;

export const updateMedianPriceSchema = z.object({
	id: positiveId,
	category: requiredString('หมวดหมู่').pipe(z.string().max(100)),
	item_name: requiredString('ชื่อรายการ').pipe(z.string().max(255)),
	price: monetaryAmount,
	effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง')
});

export type UpdateMedianPriceInput = z.infer<typeof updateMedianPriceSchema>;

// ──────────────────────────────────────────────
// Planning
// ──────────────────────────────────────────────

export const createFiscalYearSchema = z.object({
	agency_id: positiveId,
	year_name: z.string().regex(/^\d{4}$/, 'ปีงบประมาณต้องเป็นตัวเลข 4 หลัก (พ.ศ.)')
});

export type CreateFiscalYearInput = z.infer<typeof createFiscalYearSchema>;

const planTypes = ['INCOME', 'EXPENSE'] as const;

const optionalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง')
	.nullable().optional()
	.or(z.literal('').transform(() => null));

const requiredDate = z.string().min(1, 'กรุณาเลือกวันที่').regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง');

const optionalIdList = z.string()
	.transform((v) => {
		if (!v || v.trim() === '') return null;
		return v.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
	})
	.nullable().optional()
	.or(z.literal('').transform(() => null));

const requiredIdList = z.string().min(1, 'กรุณาเลือกอย่างน้อย 1 รายการ')
	.transform((v) => v.split(',').map(Number).filter((n) => !isNaN(n) && n > 0))
	.refine((arr) => arr.length > 0, 'กรุณาเลือกอย่างน้อย 1 รายการ');

export const createPlanSchema = z.object({
	agency_id: positiveId,
	fiscal_year_id: positiveId,
	title: requiredString('ชื่อแผน').pipe(z.string().max(255)),
	parent_id: optionalId,
	responsible_unit_id: positiveId,
	start_date: requiredDate,
	end_date: requiredDate,
	expected_outputs: optionalString,
	description: optionalString,
	stakeholder_unit_ids: requiredIdList,
	plan_type: z.enum(planTypes, { message: 'กรุณาเลือกประเภทแผน' }),
	is_leaf_node: z.enum(['true', 'false']).transform((v) => v === 'true').default('false'),
	estimated_amount: monetaryAmount.default(0)
}).refine(
	(data) => {
		if (data.start_date && data.end_date) {
			return data.start_date <= data.end_date;
		}
		return true;
	},
	{ message: 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด', path: ['end_date'] }
);

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = z.object({
	id: positiveId,
	title: requiredString('ชื่อแผน').pipe(z.string().max(255)),
	responsible_unit_id: optionalId,
	start_date: optionalDate,
	end_date: optionalDate,
	expected_outputs: optionalString,
	description: optionalString,
	stakeholder_unit_ids: optionalIdList,
	is_leaf_node: z.enum(['true', 'false']).transform((v) => v === 'true').default('false'),
	estimated_amount: monetaryAmount.default(0)
}).refine(
	(data) => {
		if (data.start_date && data.end_date) {
			return data.start_date <= data.end_date;
		}
		return true;
	},
	{ message: 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด', path: ['end_date'] }
);

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

// ──────────────────────────────────────────────
// Procurement
// ──────────────────────────────────────────────

export const createDocumentSchema = z.object({
	agency_id: positiveId,
	workflow_id: positiveId,
	plan_id: positiveId
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const addCommitteeSchema = z.object({
	user_id: positiveId,
	committee_type: requiredString('ประเภทคณะกรรมการ'),
	role_in_committee: optionalString
});

export type AddCommitteeInput = z.infer<typeof addCommitteeSchema>;

export const addBidderSchema = z.object({
	vendor_id: positiveId,
	proposed_price: z.coerce.number().min(0).transform((v) => v.toFixed(2)).nullable().optional()
		.or(z.literal('').transform(() => null))
});

export type AddBidderInput = z.infer<typeof addBidderSchema>;

export const updateBidderScoreSchema = z.object({
	bidder_id: positiveId,
	score: z.coerce.number().min(0).transform((v) => v.toFixed(2)).nullable().optional()
		.or(z.literal('').transform(() => null)),
	is_winner: z.enum(['true', 'false']).transform((v) => v === 'true').default('false')
});

export type UpdateBidderScoreInput = z.infer<typeof updateBidderScoreSchema>;

const approvalActions = ['APPROVED', 'REJECTED'] as const;

export const approveSchema = z.object({
	step_id: positiveId,
	action: z.enum(approvalActions, { message: 'กรุณาเลือกการกระทำ' }),
	comment: optionalString
}).refine(
	(data) => data.action !== 'REJECTED' || (data.comment && data.comment.trim().length > 0),
	{ message: 'กรุณาระบุเหตุผลที่ปฏิเสธ', path: ['comment'] }
);

export type ApproveInput = z.infer<typeof approveSchema>;

export const generateDikaSchema = z.object({
	gross_amount: monetaryAmount,
	fine_amount: monetaryAmount.default(0),
	tax_amount: monetaryAmount.default(0),
	payment_bank_account_id: positiveId,
	tax_pool_account_id: optionalId
});

export type GenerateDikaInput = z.infer<typeof generateDikaSchema>;

// ──────────────────────────────────────────────
// Finance
// ──────────────────────────────────────────────

const dikaActions = ['examine', 'pay', 'reject'] as const;

export const approveDikaSchema = z.object({
	dika_id: positiveId,
	action: z.enum(dikaActions, { message: 'กรุณาเลือกการกระทำ' })
});

export type ApproveDikaInput = z.infer<typeof approveDikaSchema>;

export const createBankAccountSchema = z.object({
	agency_id: positiveId,
	bank_id: positiveId,
	account_name: requiredString('ชื่อบัญชี').pipe(z.string().max(255)),
	account_number: requiredString('เลขที่บัญชี').pipe(z.string().max(50)),
	is_tax_pool: z.enum(['true', 'false']).transform((v) => v === 'true').default('false')
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Parse FormData with a Zod schema, returning typed data or SvelteKit fail() errors */
export function parseFormData<T extends z.ZodType>(
	schema: T,
	formData: FormData
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string[]> } {
	const rawData: Record<string, unknown> = {};
	for (const [key, value] of formData.entries()) {
		rawData[key] = value;
	}

	const result = schema.safeParse(rawData);
	if (result.success) {
		return { success: true, data: result.data };
	}

	const errors: Record<string, string[]> = {};
	for (const issue of result.error.issues) {
		const field = issue.path[0]?.toString() || '_form';
		if (!errors[field]) errors[field] = [];
		errors[field].push(issue.message);
	}
	return { success: false, errors };
}
