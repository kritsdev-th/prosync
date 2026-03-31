import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function seed() {
	console.log('🌱 Seeding database...');

	// 1. Provinces
	const [roiEt] = await db
		.insert(schema.provinces)
		.values([
			{ name: 'ร้อยเอ็ด' },
			{ name: 'ขอนแก่น' },
			{ name: 'กรุงเทพมหานคร' }
		])
		.returning();
	console.log('✅ Provinces seeded');

	// 2. Agencies
	const [hospital] = await db
		.insert(schema.agencies)
		.values([
			{
				name: 'โรงพยาบาลร้อยเอ็ด',
				agency_type: 'โรงพยาบาล',
				province_id: roiEt.id
			}
		])
		.returning();
	console.log('✅ Agencies seeded');

	// 3. Roles (Global templates - no agency_id)
	const [directorRole, deputyRole, deptHeadRole, procurementRole, financeRole, doctorRole] =
		await db
			.insert(schema.roles)
			.values([
				{
					name: 'ผู้อำนวยการ',
					permissions: {
						system: { can_manage_users: true, can_manage_org_units: true },
						planning: { can_create_plan: true, can_edit_plan: true, can_delete_plan: true },
						procurement: { can_create_document: true, can_approve_document: true },
						finance: { can_create_dika: true, can_approve_dika: true },
						audit: { can_view_audit_trail: true }
					}
				},
				{
					name: 'รองผู้อำนวยการ',
					permissions: {
						system: { can_manage_users: true, can_manage_org_units: true },
						planning: { can_create_plan: true, can_edit_plan: true, can_delete_plan: false },
						procurement: { can_create_document: true, can_approve_document: false },
						finance: { can_create_dika: true, can_approve_dika: false },
						audit: { can_view_audit_trail: true }
					}
				},
				{
					name: 'หัวหน้าแผนก',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: true },
						planning: { can_create_plan: true, can_edit_plan: true, can_delete_plan: false },
						procurement: { can_create_document: true, can_approve_document: false },
						finance: { can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: true }
					}
				},
				{
					name: 'เจ้าหน้าที่พัสดุ',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_create_document: true, can_approve_document: false },
						finance: { can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: false }
					}
				},
				{
					name: 'เจ้าหน้าที่การเงิน',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_create_document: false, can_approve_document: false },
						finance: { can_create_dika: true, can_approve_dika: false },
						audit: { can_view_audit_trail: false }
					}
				},
				{
					name: 'แพทย์',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_create_document: false, can_approve_document: false },
						finance: { can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: false }
					}
				}
			])
			.returning();
	console.log('✅ Roles seeded');

	// 4. Super Admin user
	const superAdminHash = await hash('admin1234');
	const [superAdmin] = await db
		.insert(schema.users)
		.values({
			password_hash: superAdminHash,
			agency_id: null,
			id_card: '0000000000000',
			position: 'ผู้ดูแลระบบ',
			position_rank: 'Super Admin',
			name: 'ผู้ดูแลระบบสูงสุด',
			email: 'admin@prosync.go.th',
			is_super_admin: true
		})
		.returning();
	console.log('✅ Super Admin created');

	// 5. Sample users
	const directorHash = await hash('director1234');
	const [director] = await db
		.insert(schema.users)
		.values({
			password_hash: directorHash,
			agency_id: hospital.id,
			id_card: '1234567890123',
			position: 'นพ.',
			position_rank: 'แพทย์ชำนาญการพิเศษ',
			name: 'สมชาย ใจดี',
			email: 'somchai@hospital.go.th'
		})
		.returning();

	const procurerHash = await hash('procurer1234');
	const [procurer] = await db
		.insert(schema.users)
		.values({
			password_hash: procurerHash,
			agency_id: hospital.id,
			id_card: '1234567890124',
			position: 'นาย',
			position_rank: 'เจ้าพนักงานพัสดุชำนาญงาน',
			name: 'สมหมาย จัดซื้อ',
			email: 'sommai@hospital.go.th'
		})
		.returning();
	console.log('✅ Sample users created');

	// 6. Org Units (Tree Structure)
	const [rootUnit] = await db
		.insert(schema.orgUnits)
		.values({
			agency_id: hospital.id,
			name: 'คณะกรรมการบริหารโรงพยาบาลร้อยเอ็ด',
			parent_id: null,
			head_of_unit_id: director.id
		})
		.returning();

	const [surgeryUnit, procurementUnit, financeUnit, planningUnit] = await db
		.insert(schema.orgUnits)
		.values([
			{
				agency_id: hospital.id,
				name: 'ศัลยกรรม',
				parent_id: rootUnit.id,
				head_of_unit_id: director.id
			},
			{
				agency_id: hospital.id,
				name: 'พัสดุและจัดซื้อจัดจ้าง',
				parent_id: rootUnit.id,
				head_of_unit_id: null
			},
			{
				agency_id: hospital.id,
				name: 'การเงินและบัญชี',
				parent_id: rootUnit.id,
				head_of_unit_id: null
			},
			{
				agency_id: hospital.id,
				name: 'แผนงานและประเมินผล',
				parent_id: rootUnit.id,
				head_of_unit_id: null
			}
		])
		.returning();
	console.log('✅ Org Units seeded');

	// 7. User Assignments
	await db.insert(schema.userAssignments).values([
		{
			user_id: director.id,
			role_id: directorRole.id,
			org_unit_id: rootUnit.id,
			is_primary_unit: true
		},
		{
			user_id: procurer.id,
			role_id: procurementRole.id,
			org_unit_id: procurementUnit.id,
			is_primary_unit: true
		}
	]);
	console.log('✅ User Assignments seeded');

	// 8. Banks
	await db.insert(schema.bank).values([
		{ bank_code: 'BBL', name: 'ธนาคารกรุงเทพ' },
		{ bank_code: 'KBANK', name: 'ธนาคารกสิกรไทย' },
		{ bank_code: 'KTB', name: 'ธนาคารกรุงไทย' },
		{ bank_code: 'SCB', name: 'ธนาคารไทยพาณิชย์' },
		{ bank_code: 'TMB', name: 'ธนาคารทหารไทยธนชาต' }
	]);
	console.log('✅ Banks seeded');

	// 9. Bank Accounts
	await db.insert(schema.bankAccounts).values([
		{
			agency_id: hospital.id,
			bank_id: 3, // KTB
			account_name: 'บัญชีเงินบำรุง',
			account_number: '123-4-56789-0',
			balance: '5000000.00',
			is_tax_pool: false
		},
		{
			agency_id: hospital.id,
			bank_id: 3,
			account_name: 'บัญชีพักหักภาษี',
			account_number: '123-4-56789-1',
			balance: '0.00',
			is_tax_pool: true
		}
	]);
	console.log('✅ Bank Accounts seeded');

	// 10. Median Prices
	await db.insert(schema.medianPrices).values([
		{
			category: 'เวชภัณฑ์',
			item_name: 'ยาสามัญประจำโรงพยาบาล',
			price: '150000.00',
			province_id: roiEt.id,
			effective_date: '2026-01-01'
		},
		{
			category: 'ครุภัณฑ์การแพทย์',
			item_name: 'เครื่อง X-Ray ดิจิตอล',
			price: '3500000.00',
			province_id: roiEt.id,
			effective_date: '2026-01-01'
		},
		{
			category: 'วัสดุสำนักงาน',
			item_name: 'กระดาษ A4 (ลัง)',
			price: '850.00',
			province_id: roiEt.id,
			effective_date: '2026-01-01'
		}
	]);
	console.log('✅ Median Prices seeded');

	// 11. Workflows (4 procurement methods)
	const [selectionMethod, specificMethod, eBiddingMethod, eMarketMethod] = await db
		.insert(schema.workflows)
		.values([
			{ name: 'วิธีคัดเลือก', total_steps: 10 },
			{ name: 'วิธีเฉพาะเจาะจง', total_steps: 7 },
			{ name: 'วิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding)', total_steps: 12 },
			{ name: 'วิธีตลาดอิเล็กทรอนิกส์ (e-market)', total_steps: 10 }
		])
		.returning();

	// Workflow steps for "วิธีคัดเลือก" (Selection Method - 10 steps)
	await db.insert(schema.workflowSteps).values([
		{
			workflow_id: selectionMethod.id,
			step_sequence: 1,
			step_name: 'จัดทำรายงานขอซื้อขอจ้าง (PR)',
			ui_schema: { components: ['budget_input', 'single_pdf_uploader'] },
			required_pdfs: ['รายงานขอซื้อขอจ้าง'],
			approver_role: null,
			is_final_step: false
		},
		{
			workflow_id: selectionMethod.id,
			step_sequence: 2,
			step_name: 'จัดทำร่าง TOR และราคากลาง',
			ui_schema: {
				components: [
					{ type: 'committee_selector', committee_type: 'TOR' },
					{ type: 'committee_selector', committee_type: 'MEDIAN_PRICE' }
				]
			},
			required_pdfs: null,
			approver_role: null,
			is_final_step: false
		},
		{
			workflow_id: selectionMethod.id,
			step_sequence: 3,
			step_name: 'แต่งตั้งคณะกรรมการซื้อหรือจ้าง และคณะกรรมการตรวจรับ',
			ui_schema: {
				components: [
					{ type: 'committee_selector', committee_type: 'PROCUREMENT' },
					{ type: 'committee_selector', committee_type: 'INSPECTION' }
				]
			},
			required_pdfs: null,
			approver_role: null,
			is_final_step: false
		},
		{
			workflow_id: selectionMethod.id,
			step_sequence: 4,
			step_name: 'ส่งหนังสือเชิญชวน',
			ui_schema: {
				components: ['vendor_multi_selector', 'vendor_invitation_pdf_uploader'],
				min_vendors: 3
			},
			required_pdfs: ['หนังสือเชิญชวน'],
			approver_role: null,
			is_final_step: false
		},
		{
			workflow_id: selectionMethod.id,
			step_sequence: 5,
			step_name: 'ผู้ประกอบการยื่นข้อเสนอ',
			ui_schema: {
				components: ['vendor_proposal_receiver'],
				write_to_table: 'document_bidders'
			},
			required_pdfs: null,
			approver_role: null,
			is_final_step: false
		},
		{
			workflow_id: selectionMethod.id,
			step_sequence: 6,
			step_name: 'พิจารณาผลและประกาศคะแนน',
			ui_schema: {
				components: ['bidders_scoring_board', 'single_pdf_uploader'],
				read_from_table: 'document_bidders'
			},
			required_pdfs: ['ใบรายงานผลพิจารณา'],
			approver_role: null,
			is_final_step: false
		},
		{
			workflow_id: selectionMethod.id,
			step_sequence: 7,
			step_name: 'อนุมัติผลการจัดซื้อจัดจ้าง',
			ui_schema: { components: ['approval_summary'] },
			required_pdfs: null,
			approver_role: 'DIRECTOR',
			is_final_step: false
		},
		{
			workflow_id: selectionMethod.id,
			step_sequence: 8,
			step_name: 'ประกาศผู้ชนะและลงนามสัญญา',
			ui_schema: { components: ['contract_details_form', 'multi_pdf_uploader'] },
			required_pdfs: ['ประกาศผู้ชนะ', 'สัญญาที่ลงนามแล้ว'],
			approver_role: null,
			is_final_step: false
		},
		{
			workflow_id: selectionMethod.id,
			step_sequence: 9,
			step_name: 'ตรวจรับพัสดุ',
			ui_schema: { components: ['inspection_form', 'fine_calculator', 'multi_pdf_uploader'] },
			required_pdfs: ['ใบตรวจรับ', 'ใบแจ้งหนี้'],
			approver_role: null,
			is_final_step: false
		},
		{
			workflow_id: selectionMethod.id,
			step_sequence: 10,
			step_name: 'ส่งเรื่องเบิกจ่าย',
			ui_schema: { components: ['send_to_finance_button'], trigger: 'generate_dika' },
			required_pdfs: null,
			approver_role: null,
			is_final_step: true
		}
	]);
	console.log('✅ Workflows & Steps seeded');

	// 12. Sample Fiscal Year
	await db.insert(schema.fiscalYears).values({
		agency_id: hospital.id,
		year_name: '2569',
		is_active: true
	});
	console.log('✅ Fiscal Year seeded');

	console.log('\n🎉 Seeding complete!');
	process.exit(0);
}

seed().catch((err) => {
	console.error('❌ Seed failed:', err);
	process.exit(1);
});
