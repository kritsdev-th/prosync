import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, isNull } from 'drizzle-orm';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// ──────────────────────────────────────────────
// Helper: Random number in range
// ──────────────────────────────────────────────
function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(min: number, max: number): string {
	return (Math.random() * (max - min) + min).toFixed(2);
}

// ──────────────────────────────────────────────
// Thai name pools
// ──────────────────────────────────────────────
const firstNames = [
	'สมชาย',
	'สมหญิง',
	'วิชัย',
	'สุภาพ',
	'ประเสริฐ',
	'นภา',
	'ธนพล',
	'อรุณี',
	'กิตติ',
	'พิมพ์ใจ',
	'สมศักดิ์',
	'วรรณา',
	'ชัยวัฒน์',
	'นิตยา',
	'สุรชัย',
	'มาลี',
	'อนุชา',
	'รัตนา',
	'พิชัย',
	'สมพร'
];

const lastNames = [
	'สุขใจ',
	'ดีงาม',
	'ศรีสุข',
	'มั่นคง',
	'เจริญรุ่ง',
	'แสงทอง',
	'บุญมี',
	'รักไทย',
	'พงษ์พันธ์',
	'วงศ์สวัสดิ์',
	'แก้วมณี',
	'จันทร์เพ็ญ',
	'ศิริวัฒน์',
	'ทองดี',
	'สมบูรณ์'
];

const positions = ['นาย', 'นาง', 'นางสาว', 'นพ.', 'พญ.', 'ทพ.', 'ภก.', 'พว.'];

const positionRanks = [
	'เจ้าพนักงานพัสดุชำนาญงาน',
	'นักวิชาการเงินและบัญชีชำนาญการ',
	'พยาบาลวิชาชีพชำนาญการพิเศษ',
	'แพทย์ชำนาญการ',
	'เภสัชกรชำนาญการ',
	'นักวิชาการคอมพิวเตอร์ชำนาญการ',
	'เจ้าพนักงานธุรการชำนาญงาน',
	'นักทรัพยากรบุคคลชำนาญการ',
	'วิศวกรโยธาชำนาญการ',
	'นักวิชาการสาธารณสุขชำนาญการ'
];

// ──────────────────────────────────────────────
// Org unit names by department
// ──────────────────────────────────────────────
const departmentUnits = [
	// ศัลยกรรม
	{ name: 'ศัลยกรรมทั่วไป', parent: 'ศัลยกรรม' },
	{ name: 'ศัลยกรรมกระดูก', parent: 'ศัลยกรรม' },
	{ name: 'ศัลยกรรมระบบทางเดินปัสสาวะ', parent: 'ศัลยกรรม' },
	// อายุรกรรม
	{ name: 'อายุรกรรมทั่วไป', parent: 'อายุรกรรม' },
	{ name: 'อายุรกรรมหัวใจ', parent: 'อายุรกรรม' },
	{ name: 'อายุรกรรมระบบทางเดินอาหาร', parent: 'อายุรกรรม' },
	// กุมารเวชกรรม
	{ name: 'กุมารเวชกรรมทั่วไป', parent: 'กุมารเวชกรรม' },
	{ name: 'กุมารเวชกรรมทารกแรกเกิด', parent: 'กุมารเวชกรรม' },
	{ name: 'คลินิกเด็กสุขภาพดี', parent: 'กุมารเวชกรรม' },
	// สูติ-นรีเวชกรรม
	{ name: 'สูติกรรม', parent: 'สูติ-นรีเวชกรรม' },
	{ name: 'นรีเวชกรรม', parent: 'สูติ-นรีเวชกรรม' },
	{ name: 'คลินิกวางแผนครอบครัว', parent: 'สูติ-นรีเวชกรรม' },
	// จักษุวิทยา
	{ name: 'คลินิกจักษุทั่วไป', parent: 'จักษุวิทยา' },
	{ name: 'ห้องตรวจจักษุพิเศษ', parent: 'จักษุวิทยา' },
	{ name: 'ห้องผ่าตัดจักษุ', parent: 'จักษุวิทยา' },
	// โสต ศอ นาสิก
	{ name: 'คลินิกหู', parent: 'โสต ศอ นาสิก' },
	{ name: 'คลินิกจมูก', parent: 'โสต ศอ นาสิก' },
	{ name: 'คลินิกคอ', parent: 'โสต ศอ นาสิก' },
	// ออร์โธปิดิกส์
	{ name: 'คลินิกกระดูกทั่วไป', parent: 'ออร์โธปิดิกส์' },
	{ name: 'คลินิกกระดูกเด็ก', parent: 'ออร์โธปิดิกส์' },
	{ name: 'คลินิกกายภาพบำบัด', parent: 'ออร์โธปิดิกส์' },
	// วิสัญญีวิทยา
	{ name: 'ห้องผ่าตัดใหญ่', parent: 'วิสัญญีวิทยา' },
	{ name: 'ห้องผ่าตัดเล็ก', parent: 'วิสัญญีวิทยา' },
	{ name: 'ห้องฟื้นผู้ป่วย', parent: 'วิสัญญีวิทยา' },
	// รังสีวิทยา
	{ name: 'แผนกเอกซเรย์ทั่วไป', parent: 'รังสีวิทยา' },
	{ name: 'แผนก CT Scan', parent: 'รังสีวิทยา' },
	{ name: 'แผนก MRI', parent: 'รังสีวิทยา' },
	// เภสัชกรรม
	{ name: 'เภสัชกรรมคลินิก', parent: 'เภสัชกรรม' },
	{ name: 'เภสัชกรรมโรงพยาบาล', parent: 'เภสัชกรรม' },
	{ name: 'คลังยา', parent: 'เภสัชกรรม' },
	// การเงิน
	{ name: 'งานบัญชี', parent: 'การเงินและบัญชี' },
	{ name: 'งานงบประมาณ', parent: 'การเงินและบัญชี' },
	{ name: 'งานตรวจสอบ', parent: 'การเงินและบัญชี' },
	// พัสดุ
	{ name: 'งานจัดซื้อ', parent: 'พัสดุและจัดซื้อจัดจ้าง' },
	{ name: 'งานคลังพัสดุ', parent: 'พัสดุและจัดซื้อจัดจ้าง' },
	{ name: 'งานซ่อมบำรุง', parent: 'พัสดุและจัดซื้อจัดจ้าง' },
	// แผนงาน
	{ name: 'งานยุทธศาสตร์', parent: 'แผนงานและประเมินผล' },
	{ name: 'งานติดตามประเมินผล', parent: 'แผนงานและประเมินผล' },
	{ name: 'งานสารสนเทศ', parent: 'แผนงานและประเมินผล' },
	// IT
	{ name: 'งานพัฒนาระบบ', parent: 'เทคโนโลยีสารสนเทศ' },
	{ name: 'งานเครือข่าย', parent: 'เทคโนโลยีสารสนเทศ' },
	{ name: 'งานช่วยเหลือผู้ใช้', parent: 'เทคโนโลยีสารสนเทศ' },
	// ทรัพยากรบุคคล
	{ name: 'งานสรรหา', parent: 'ทรัพยากรบุคคล' },
	{ name: 'งานพัฒนาบุคลากร', parent: 'ทรัพยากรบุคคล' },
	{ name: 'งานสวัสดิการ', parent: 'ทรัพยากรบุคคล' }
];

// ──────────────────────────────────────────────
// Plan templates
// ──────────────────────────────────────────────
const parentPlanTemplates = [
	{ title: 'แผนพัฒนาระบบบริการสุขภาพ', type: 'EXPENSE' as const },
	{ title: 'แผนจัดซื้อครุภัณฑ์การแพทย์', type: 'EXPENSE' as const },
	{ title: 'แผนพัฒนาบุคลากร', type: 'EXPENSE' as const },
	{ title: 'แผนพัฒนาระบบเทคโนโลยีสารสนเทศ', type: 'EXPENSE' as const },
	{ title: 'แผนปรับปรุงโครงสร้างพื้นฐาน', type: 'EXPENSE' as const },
	{ title: 'แผนส่งเสริมสุขภาพชุมชน', type: 'EXPENSE' as const },
	{ title: 'แผนป้องกันควบคุมโรค', type: 'EXPENSE' as const },
	{ title: 'แผนพัฒนาระบบยาและเวชภัณฑ์', type: 'EXPENSE' as const },
	{ title: 'แผนเพิ่มประสิทธิภาพการบริหาร', type: 'EXPENSE' as const },
	{ title: 'แผนรายได้เงินบำรุง', type: 'INCOME' as const }
];

const childPlanTemplates = [
	'จัดซื้ออุปกรณ์ทางการแพทย์',
	'อบรมพัฒนาทักษะบุคลากร',
	'ปรับปรุงระบบเครือข่ายคอมพิวเตอร์',
	'ซ่อมบำรุงอาคารสถานที่',
	'จัดซื้อยาและเวชภัณฑ์',
	'พัฒนาระบบสารสนเทศโรงพยาบาล',
	'จัดซื้อครุภัณฑ์สำนักงาน',
	'โครงการส่งเสริมสุขภาพประชาชน',
	'ปรับปรุงระบบไฟฟ้าและน้ำประปา',
	'จัดซื้อวัสดุทางการแพทย์',
	'อบรมเชิงปฏิบัติการ',
	'พัฒนาระบบฐานข้อมูล',
	'ซ่อมบำรุงเครื่องมือแพทย์',
	'จัดซื้ออุปกรณ์คอมพิวเตอร์',
	'โครงการรณรงค์ป้องกันโรค'
];

// ──────────────────────────────────────────────
// Document status pool
// ──────────────────────────────────────────────
const documentStatuses = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PENDING', 'APPROVED'];

// ──────────────────────────────────────────────
// Dika voucher status pool
// ──────────────────────────────────────────────
const dikaStatuses = ['DRAFT', 'PENDING_EXAMINE', 'EXAMINED', 'APPROVED', 'REJECTED', 'PAID'];

async function seed() {
	console.log('🌱 Seeding database...');

	// ──────────────────────────────────────────
	// 1. Provinces (idempotent)
	// ──────────────────────────────────────────
	let provinces = await db.select().from(schema.provinces);
	if (provinces.length === 0) {
		provinces = await db
			.insert(schema.provinces)
			.values([{ name: 'ร้อยเอ็ด' }, { name: 'ขอนแก่น' }, { name: 'กรุงเทพมหานคร' }])
			.returning();
		console.log('✅ Provinces seeded');
	} else {
		console.log('ℹ️  Provinces already exist');
	}

	// ──────────────────────────────────────────
	// 2. Agencies (idempotent)
	// ──────────────────────────────────────────
	let agencies = await db.select().from(schema.agencies);
	if (agencies.length === 0) {
		agencies = await db
			.insert(schema.agencies)
			.values([
				{
					name: 'โรงพยาบาลร้อยเอ็ด',
					agency_type: 'โรงพยาบาล',
					province_id: provinces[0].id
				}
			])
			.returning();
		console.log('✅ Agencies seeded');
	} else {
		console.log('ℹ️  Agencies already exist');
	}

	const hospital = agencies[0];

	// ──────────────────────────────────────────
	// 3. Roles (idempotent)
	// ──────────────────────────────────────────
	let roles = await db.select().from(schema.roles);
	if (roles.length === 0) {
		roles = await db
			.insert(schema.roles)
			.values([
				{
					name: 'ผู้อำนวยการ',
					permissions: {
						system: { can_manage_users: true, can_manage_org_units: true },
						planning: { can_view_plan: true, can_create_plan: true, can_edit_plan: true, can_delete_plan: true },
						procurement: { can_view_document: true, can_create_document: true, can_approve_document: true },
						finance: { can_view_dika: true, can_create_dika: true, can_approve_dika: true },
						audit: { can_view_audit_trail: true }
					}
				},
				{
					name: 'รองผู้อำนวยการ',
					permissions: {
						system: { can_manage_users: true, can_manage_org_units: true },
						planning: { can_view_plan: true, can_create_plan: true, can_edit_plan: true, can_delete_plan: false },
						procurement: { can_view_document: true, can_create_document: true, can_approve_document: false },
						finance: { can_view_dika: true, can_create_dika: true, can_approve_dika: false },
						audit: { can_view_audit_trail: true }
					}
				},
				{
					name: 'หัวหน้าเจ้าหน้าที่พัสดุ',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_view_plan: true, can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_view_document: true, can_create_document: true, can_approve_document: true },
						finance: { can_view_dika: true, can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: true }
					}
				},
				{
					name: 'หัวหน้ากองคลัง',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_view_plan: true, can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_view_document: true, can_create_document: false, can_approve_document: false },
						finance: { can_view_dika: true, can_create_dika: true, can_approve_dika: true },
						audit: { can_view_audit_trail: true }
					}
				},
				{
					name: 'หัวหน้าแผนก',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: true },
						planning: { can_view_plan: true, can_create_plan: true, can_edit_plan: true, can_delete_plan: false },
						procurement: { can_view_document: true, can_create_document: true, can_approve_document: false },
						finance: { can_view_dika: false, can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: true }
					}
				},
				{
					name: 'เจ้าหน้าที่พัสดุ',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_view_plan: false, can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_view_document: true, can_create_document: true, can_approve_document: false },
						finance: { can_view_dika: false, can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: false }
					}
				},
				{
					name: 'เจ้าหน้าที่การเงิน',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_view_plan: false, can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_view_document: false, can_create_document: false, can_approve_document: false },
						finance: { can_view_dika: true, can_create_dika: true, can_approve_dika: false },
						audit: { can_view_audit_trail: false }
					}
				},
				{
					name: 'แพทย์',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_view_plan: false, can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_view_document: false, can_create_document: false, can_approve_document: false },
						finance: { can_view_dika: false, can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: false }
					}
				},
				{
					name: 'พยาบาล',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_view_plan: false, can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_view_document: false, can_create_document: false, can_approve_document: false },
						finance: { can_view_dika: false, can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: false }
					}
				},
				{
					name: 'นักวิชาการ',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_view_plan: false, can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_view_document: true, can_create_document: false, can_approve_document: false },
						finance: { can_view_dika: false, can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: false }
					}
				},
				{
					name: 'เจ้าหน้าที่ธุรการ',
					permissions: {
						system: { can_manage_users: false, can_manage_org_units: false },
						planning: { can_view_plan: false, can_create_plan: false, can_edit_plan: false, can_delete_plan: false },
						procurement: { can_view_document: false, can_create_document: false, can_approve_document: false },
						finance: { can_view_dika: false, can_create_dika: false, can_approve_dika: false },
						audit: { can_view_audit_trail: false }
					}
				}
			])
			.returning();
		console.log('✅ Roles seeded');
	} else {
		console.log('ℹ️  Roles already exist');
	}

	// ──────────────────────────────────────────
	// 4. Super Admin user (idempotent)
	// ──────────────────────────────────────────
	const existingSuperAdmins = await db
		.select()
		.from(schema.users)
		.where(eq(schema.users.is_super_admin, true));

	if (existingSuperAdmins.length === 0) {
		const superAdminHash = await hash('admin1234');
		await db.insert(schema.users).values({
			password_hash: superAdminHash,
			agency_id: null,
			id_card: '0000000000000',
			position: 'ผู้ดูแลระบบ',
			position_rank: 'Super Admin',
			name: 'ผู้ดูแลระบบสูงสุด',
			email: 'admin@prosync.go.th',
			is_super_admin: true,
			profile_completed: true
		});
		console.log('✅ Super Admin created (email: admin@prosync.go.th, password: admin1234)');
	} else {
		console.log('ℹ️  Super Admin already exists');
	}

	// ──────────────────────────────────────────
	// 5. Banks (idempotent)
	// ──────────────────────────────────────────
	// All Thai banks — upsert to ensure all are present
	const allBankData = [
		{ bank_code: 'BBL', name: 'ธนาคารกรุงเทพ', logo_url: '/Bank_logo/BBL.png' },
		{ bank_code: 'KBANK', name: 'ธนาคารกสิกรไทย', logo_url: '/Bank_logo/KBANK.png' },
		{ bank_code: 'KTB', name: 'ธนาคารกรุงไทย', logo_url: '/Bank_logo/KTB.png' },
		{ bank_code: 'SCB', name: 'ธนาคารไทยพาณิชย์', logo_url: '/Bank_logo/SCB.png' },
		{ bank_code: 'TTB', name: 'ธนาคารทหารไทยธนชาต', logo_url: '/Bank_logo/TTB.png' },
		{ bank_code: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา', logo_url: '/Bank_logo/BAY.png' },
		{ bank_code: 'KKP', name: 'ธนาคารเกียรตินาคินภัทร', logo_url: '/Bank_logo/KKP.png' },
		{ bank_code: 'CIMBT', name: 'ธนาคารซีไอเอ็มบีไทย', logo_url: '/Bank_logo/CIMBT.png' },
		{ bank_code: 'TISCO', name: 'ธนาคารทิสโก้', logo_url: '/Bank_logo/TISCO.png' },
		{ bank_code: 'UOBT', name: 'ธนาคารยูโอบี', logo_url: '/Bank_logo/UOBT.png' },
		{ bank_code: 'LHFG', name: 'ธนาคารแลนด์ แอนด์ เฮ้าส์', logo_url: '/Bank_logo/LHFG.png' },
		{ bank_code: 'ICBCT', name: 'ธนาคารไอซีบีซี (ไทย)', logo_url: '/Bank_logo/ICBCT.png' },
		{ bank_code: 'GSB', name: 'ธนาคารออมสิน', logo_url: '/Bank_logo/GSB.png' },
		{ bank_code: 'BAAC', name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', logo_url: '/Bank_logo/BAAC.png' },
		{ bank_code: 'GHB', name: 'ธนาคารอาคารสงเคราะห์', logo_url: '/Bank_logo/GHB.png' },
	];
	const existingBanks = await db.select().from(schema.bank);
	const existingCodes = new Set(existingBanks.map((b) => b.bank_code));
	const missingBanks = allBankData.filter((b) => !existingCodes.has(b.bank_code));
	if (missingBanks.length > 0) {
		await db.insert(schema.bank).values(missingBanks);
		console.log(`✅ Banks: inserted ${missingBanks.length} missing (total ${existingBanks.length + missingBanks.length})`);
	} else {
		console.log(`ℹ️  Banks: all ${existingBanks.length} present`);
	}
	let banks = await db.select().from(schema.bank);

	// ──────────────────────────────────────────
	// 6. Workflows (idempotent) — 4 central + 15-step วิธีเฉพาะเจาะจง
	// ──────────────────────────────────────────
	let workflows = await db.select().from(schema.workflows);
	if (workflows.length === 0) {
		workflows = await db
			.insert(schema.workflows)
			.values([
				{ name: 'วิธีคัดเลือก', total_steps: 10, agency_id: null },
				{ name: 'วิธีตลาดอิเล็กทรอนิกส์ (e-market)', total_steps: 0, agency_id: null },
				{ name: 'วิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding)', total_steps: 0, agency_id: null },
				{ name: 'วิธีเฉพาะเจาะจง', total_steps: 15, agency_id: null }
			])
			.returning();
		console.log('✅ Workflows seeded');

		// ── วิธีคัดเลือก (10 steps — same as before) ──
		const [selectionMethod] = workflows;
		await db.insert(schema.workflowSteps).values([
			{ workflow_id: selectionMethod.id, step_sequence: 1, step_name: 'จัดทำรายงานขอซื้อขอจ้าง (PR)', ui_schema: { type: 'document_upload', components: ['budget_input', 'single_pdf_uploader'] }, required_pdfs: ['รายงานขอซื้อขอจ้าง'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: selectionMethod.id, step_sequence: 2, step_name: 'จัดทำร่าง TOR และราคากลาง', ui_schema: { type: 'committee', components: [{ type: 'committee_selector', committee_type: 'TOR' }, { type: 'committee_selector', committee_type: 'MEDIAN_PRICE' }] }, required_pdfs: null, approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: selectionMethod.id, step_sequence: 3, step_name: 'แต่งตั้งคณะกรรมการซื้อหรือจ้าง และคณะกรรมการตรวจรับ', ui_schema: { type: 'committee', components: [{ type: 'committee_selector', committee_type: 'PROCUREMENT' }, { type: 'committee_selector', committee_type: 'INSPECTION' }] }, required_pdfs: null, approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: selectionMethod.id, step_sequence: 4, step_name: 'ส่งหนังสือเชิญชวน', ui_schema: { type: 'vendor_scoring_with_upload', components: ['vendor_multi_selector', 'vendor_invitation_pdf_uploader'], min_vendors: 3 }, required_pdfs: ['หนังสือเชิญชวน'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: selectionMethod.id, step_sequence: 5, step_name: 'ผู้ประกอบการยื่นข้อเสนอ', ui_schema: { type: 'vendor_proposal_with_upload', components: ['vendor_proposal_receiver', 'vendor_per_item_pdf_uploader'], write_to_table: 'document_bidders' }, required_pdfs: null, approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: selectionMethod.id, step_sequence: 6, step_name: 'พิจารณาผลและประกาศคะแนน', ui_schema: { type: 'evaluation_with_scoring', components: ['bidders_scoring_board', 'single_pdf_uploader'], read_from_table: 'document_bidders' }, required_pdfs: ['ใบรายงานผลพิจารณา'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'committee', value: 'PROCUREMENT' }] },
			{ workflow_id: selectionMethod.id, step_sequence: 7, step_name: 'อนุมัติผลการจัดซื้อจัดจ้าง', ui_schema: { type: 'approval', components: ['approval_summary'] }, required_pdfs: null, approver_role: 'DIRECTOR', is_final_step: false, step_assignees: [{ type: 'role', value: 'DIRECTOR' }] },
			{ workflow_id: selectionMethod.id, step_sequence: 8, step_name: 'ประกาศผู้ชนะและลงนามสัญญา', ui_schema: { type: 'document_upload', components: ['contract_details_form', 'multi_pdf_uploader'] }, required_pdfs: ['ประกาศผู้ชนะ', 'สัญญาที่ลงนามแล้ว'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: selectionMethod.id, step_sequence: 9, step_name: 'ตรวจรับพัสดุ', ui_schema: { type: 'document_upload', components: ['inspection_form', 'fine_calculator', 'multi_pdf_uploader'] }, required_pdfs: ['ใบตรวจรับ', 'ใบแจ้งหนี้'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'committee', value: 'INSPECTION' }] },
			{ workflow_id: selectionMethod.id, step_sequence: 10, step_name: 'ส่งเรื่องเบิกจ่าย', ui_schema: { type: 'document_upload', components: ['send_to_finance_button'], trigger: 'generate_dika' }, required_pdfs: null, approver_role: null, is_final_step: true, step_assignees: [{ type: 'creator' }] }
		]);

		// ── วิธีเฉพาะเจาะจง (15 steps — 5 phases) ──
		const specificMethod = workflows.find((w) => w.name === 'วิธีเฉพาะเจาะจง')!;
		await db.insert(schema.workflowSteps).values([
			// Phase 1: Initiation — ตั้งเรื่องและขออนุมัติหลักการ
			{ workflow_id: specificMethod.id, step_sequence: 1, step_name: 'จัดทำรายงานขอซื้อขอจ้าง (PR)', ui_schema: { type: 'document_upload', components: ['budget_input', 'single_pdf_uploader'], required_pdfs: ['รายงานขอซื้อขอจ้าง'] }, required_pdfs: ['รายงานขอซื้อขอจ้าง'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: specificMethod.id, step_sequence: 2, step_name: 'เห็นชอบรายงานขอซื้อขอจ้าง', ui_schema: { type: 'approval', components: ['approval_summary'], approvers: [] }, required_pdfs: null, approver_role: 'REVIEWER', is_final_step: false, step_assignees: [{ type: 'role', value: 'REVIEWER' }] },
			{ workflow_id: specificMethod.id, step_sequence: 3, step_name: 'อนุมัติรายงานขอซื้อขอจ้าง (อนุมัติหลักการ)', ui_schema: { type: 'approval', components: ['approval_summary'], approvers: [] }, required_pdfs: null, approver_role: 'DIRECTOR', is_final_step: false, step_assignees: [{ type: 'role', value: 'DIRECTOR' }] },

			// Phase 2: Invitation & Bidding — เชิญชวนและรับข้อเสนอ
			{ workflow_id: specificMethod.id, step_sequence: 4, step_name: 'จัดทำร่างหนังสือเชิญชวน', ui_schema: { type: 'document_upload', components: ['single_pdf_uploader'], required_pdfs: ['หนังสือเชิญชวน (ฉบับร่าง)'] }, required_pdfs: ['หนังสือเชิญชวน (ฉบับร่าง)'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: specificMethod.id, step_sequence: 5, step_name: 'เห็นชอบหนังสือเชิญชวน', ui_schema: { type: 'approval', components: ['approval_summary'], approvers: [] }, required_pdfs: null, approver_role: 'REVIEWER', is_final_step: false, step_assignees: [{ type: 'role', value: 'REVIEWER' }] },
			{ workflow_id: specificMethod.id, step_sequence: 6, step_name: 'อนุมัติหนังสือเชิญชวน', ui_schema: { type: 'approval', components: ['approval_summary'], approvers: [] }, required_pdfs: null, approver_role: 'DIRECTOR', is_final_step: false, step_assignees: [{ type: 'role', value: 'DIRECTOR' }] },
			{ workflow_id: specificMethod.id, step_sequence: 7, step_name: 'บันทึกผลการเสนอราคา (รับซอง)', ui_schema: { type: 'vendor_proposal_with_upload', components: ['vendor_proposal_receiver', 'vendor_per_item_pdf_uploader'], write_to_table: 'document_bidders' }, required_pdfs: null, approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },

			// Phase 3: Evaluation & Approval — พิจารณาผลและอนุมัติสั่งซื้อ
			{ workflow_id: specificMethod.id, step_sequence: 8, step_name: 'จัดทำรายงานผลการพิจารณา', ui_schema: { type: 'evaluation_with_scoring', components: ['bidders_scoring_board', 'single_pdf_uploader'], read_from_table: 'document_bidders', required_pdfs: ['ใบรายงานผลพิจารณา'] }, required_pdfs: ['ใบรายงานผลพิจารณา'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: specificMethod.id, step_sequence: 9, step_name: 'เห็นชอบผลการพิจารณา', ui_schema: { type: 'approval', components: ['approval_summary'], approvers: [] }, required_pdfs: null, approver_role: 'REVIEWER', is_final_step: false, step_assignees: [{ type: 'role', value: 'REVIEWER' }] },
			{ workflow_id: specificMethod.id, step_sequence: 10, step_name: 'อนุมัติสั่งซื้อ/สั่งจ้าง (อนุมัติผู้ชนะ)', ui_schema: { type: 'approval', components: ['approval_summary'], approvers: [] }, required_pdfs: null, approver_role: 'DIRECTOR', is_final_step: false, step_assignees: [{ type: 'role', value: 'DIRECTOR' }] },

			// Phase 4: Contract & Inspection — ทำสัญญาและตรวจรับ
			{ workflow_id: specificMethod.id, step_sequence: 11, step_name: 'จัดทำร่างสัญญา / ใบสั่งซื้อ (PO)', ui_schema: { type: 'document_upload', components: ['contract_details_form', 'single_pdf_uploader'], required_pdfs: ['สัญญา/ใบสั่งซื้อ (ฉบับร่าง)'] }, required_pdfs: ['สัญญา/ใบสั่งซื้อ (ฉบับร่าง)'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'creator' }] },
			{ workflow_id: specificMethod.id, step_sequence: 12, step_name: 'ตรวจสอบความถูกต้องสัญญา/ใบสั่งซื้อ', ui_schema: { type: 'approval', components: ['approval_summary'], approvers: [] }, required_pdfs: null, approver_role: 'REVIEWER', is_final_step: false, step_assignees: [{ type: 'role', value: 'REVIEWER' }] },
			{ workflow_id: specificMethod.id, step_sequence: 13, step_name: 'ลงนามสัญญา / ใบสั่งซื้อ', ui_schema: { type: 'approval', components: ['approval_summary'], approvers: [] }, required_pdfs: null, approver_role: 'DIRECTOR', is_final_step: false, step_assignees: [{ type: 'role', value: 'DIRECTOR' }] },
			{ workflow_id: specificMethod.id, step_sequence: 14, step_name: 'บริหารสัญญา / ตรวจรับพัสดุ', ui_schema: { type: 'document_upload', components: ['inspection_form', 'fine_calculator', 'multi_pdf_uploader'], required_pdfs: ['ใบตรวจรับ', 'ใบแจ้งหนี้'] }, required_pdfs: ['ใบตรวจรับ', 'ใบแจ้งหนี้'], approver_role: null, is_final_step: false, step_assignees: [{ type: 'committee', value: 'INSPECTION' }] },

			// Phase 5: Disbursement — เบิกจ่ายเงิน
			{ workflow_id: specificMethod.id, step_sequence: 15, step_name: 'จัดทำฎีกาและส่งเรื่องเบิกจ่าย', ui_schema: { type: 'document_upload', components: ['send_to_finance_button'], trigger: 'generate_dika' }, required_pdfs: null, approver_role: null, is_final_step: true, step_assignees: [{ type: 'creator' }] }
		]);

		console.log('✅ Workflow steps seeded (วิธีคัดเลือก 10 steps + วิธีเฉพาะเจาะจง 15 steps)');
	} else {
		console.log('ℹ️  Workflows already exist');
	}

	// ──────────────────────────────────────────
	// 7. Fiscal Year (idempotent)
	// ──────────────────────────────────────────
	let fiscalYears = await db.select().from(schema.fiscalYears);
	if (fiscalYears.length === 0) {
		fiscalYears = await db
			.insert(schema.fiscalYears)
			.values({
				agency_id: hospital.id,
				year_name: '2569',
				is_active: true
			})
			.returning();
		console.log('✅ Fiscal Year seeded');
	} else {
		console.log('ℹ️  Fiscal Years already exist');
	}
	const fiscalYear = fiscalYears[0];

	// ──────────────────────────────────────────
	// 8. Org Units (idempotent)
	// ──────────────────────────────────────────
	let orgUnits = await db.select().from(schema.orgUnits);
	if (orgUnits.length === 0) {
		// Root unit
		const [rootUnit] = await db
			.insert(schema.orgUnits)
			.values({
				agency_id: hospital.id,
				name: 'คณะกรรมการบริหารโรงพยาบาลร้อยเอ็ด',
				parent_id: null,
				head_of_unit_id: null
			})
			.returning();

		// Department-level units (parents)
		const parentUnitNames = [
			'ศัลยกรรม',
			'อายุรกรรม',
			'กุมารเวชกรรม',
			'สูติ-นรีเวชกรรม',
			'จักษุวิทยา',
			'โสต ศอ นาสิก',
			'ออร์โธปิดิกส์',
			'วิสัญญีวิทยา',
			'รังสีวิทยา',
			'เภสัชกรรม',
			'การเงินและบัญชี',
			'พัสดุและจัดซื้อจัดจ้าง',
			'แผนงานและประเมินผล',
			'เทคโนโลยีสารสนเทศ',
			'ทรัพยากรบุคคล'
		];

		const parentUnits = await db
			.insert(schema.orgUnits)
			.values(
				parentUnitNames.map((name) => ({
					agency_id: hospital.id,
					name,
					parent_id: rootUnit.id,
					head_of_unit_id: null
				}))
			)
			.returning();

		// Sub-units
		const parentUnitMap = new Map(parentUnits.map((u) => [u.name, u.id]));

		const subUnits = await db
			.insert(schema.orgUnits)
			.values(
				departmentUnits.map((du) => ({
					agency_id: hospital.id,
					name: du.name,
					parent_id: parentUnitMap.get(du.parent) || rootUnit.id,
					head_of_unit_id: null
				}))
			)
			.returning();

		orgUnits = [rootUnit, ...parentUnits, ...subUnits];
		console.log(`✅ Org Units seeded (${orgUnits.length} units)`);
	} else {
		console.log('ℹ️  Org Units already exist');
	}

	// ──────────────────────────────────────────
	// 9. Named workflow users + sample users
	// ──────────────────────────────────────────
	const existingUsers = await db.select().from(schema.users);
	const existingCount = existingUsers.filter((u) => !u.is_super_admin).length;
	const roleMap = new Map(roles.map((r) => [r.name, r.id]));
	const rootUnit = orgUnits.find((u) => u.parent_id === null)!;
	const procurementUnit = orgUnits.find((u) => u.name === 'พัสดุและจัดซื้อจัดจ้าง');
	const financeUnit = orgUnits.find((u) => u.name === 'การเงินและบัญชี');
	const subUnits = orgUnits.filter((u) => u.parent_id !== null);

	if (existingCount < 20) {
		const passwordHash = await hash('password1234');

		// ── Named users for the 15-step workflow ──
		const namedUsers = [
			{ name: 'นพ.สมชาย สุขใจ', email: 'director@hospital.go.th', position: 'นพ.', positionRank: 'ผู้อำนวยการโรงพยาบาล', roleName: 'ผู้อำนวยการ', orgUnit: rootUnit, idCard: '1100100010001' },
			{ name: 'นางสมหญิง ดีงาม', email: 'vice-director@hospital.go.th', position: 'นาง', positionRank: 'รองผู้อำนวยการฝ่ายบริหาร', roleName: 'รองผู้อำนวยการ', orgUnit: rootUnit, idCard: '1100100010002' },
			{ name: 'นายวิชัย ศรีสุข', email: 'procurement-head@hospital.go.th', position: 'นาย', positionRank: 'หัวหน้าเจ้าหน้าที่พัสดุ', roleName: 'หัวหน้าเจ้าหน้าที่พัสดุ', orgUnit: procurementUnit || subUnits[0], idCard: '1100100010003' },
			{ name: 'นางสุภาพ มั่นคง', email: 'procurement1@hospital.go.th', position: 'นาง', positionRank: 'เจ้าพนักงานพัสดุชำนาญงาน', roleName: 'เจ้าหน้าที่พัสดุ', orgUnit: procurementUnit || subUnits[0], idCard: '1100100010004' },
			{ name: 'นายประเสริฐ เจริญรุ่ง', email: 'procurement2@hospital.go.th', position: 'นาย', positionRank: 'เจ้าพนักงานพัสดุชำนาญงาน', roleName: 'เจ้าหน้าที่พัสดุ', orgUnit: procurementUnit || subUnits[0], idCard: '1100100010005' },
			{ name: 'นางนภา แสงทอง', email: 'finance-head@hospital.go.th', position: 'นาง', positionRank: 'หัวหน้ากองคลัง', roleName: 'หัวหน้ากองคลัง', orgUnit: financeUnit || subUnits[1], idCard: '1100100010006' },
			{ name: 'นายธนพล บุญมี', email: 'finance1@hospital.go.th', position: 'นาย', positionRank: 'นักวิชาการเงินและบัญชีชำนาญการ', roleName: 'เจ้าหน้าที่การเงิน', orgUnit: financeUnit || subUnits[1], idCard: '1100100010007' },
			{ name: 'นางอรุณี รักไทย', email: 'committee1@hospital.go.th', position: 'นาง', positionRank: 'พยาบาลวิชาชีพชำนาญการพิเศษ', roleName: 'พยาบาล', orgUnit: subUnits[2], idCard: '1100100010008' },
			{ name: 'นายกิตติ พงษ์พันธ์', email: 'committee2@hospital.go.th', position: 'นาย', positionRank: 'เภสัชกรชำนาญการ', roleName: 'นักวิชาการ', orgUnit: subUnits[3], idCard: '1100100010009' },
			{ name: 'นางพิมพ์ใจ วงศ์สวัสดิ์', email: 'committee3@hospital.go.th', position: 'นาง', positionRank: 'นักวิชาการคอมพิวเตอร์ชำนาญการ', roleName: 'นักวิชาการ', orgUnit: subUnits[4], idCard: '1100100010010' }
		];

		const createdNamedUsers: { id: number; name: string; email: string }[] = [];

		for (const nu of namedUsers) {
			const existing = existingUsers.find((u) => u.id_card === nu.idCard);
			if (existing) {
				createdNamedUsers.push({ id: existing.id, name: existing.name, email: existing.email || '' });
				continue;
			}

			const [user] = await db
				.insert(schema.users)
				.values({
					password_hash: passwordHash,
					agency_id: hospital.id,
					id_card: nu.idCard,
					position: nu.position,
					position_rank: nu.positionRank,
					name: nu.name,
					email: nu.email,
					phone: `08${randomInt(10000000, 99999999)}`,
					is_super_admin: false,
					profile_completed: true
				})
				.returning();

			createdNamedUsers.push({ id: user.id, name: user.name, email: nu.email });

			const roleId = roleMap.get(nu.roleName);
			if (roleId && nu.orgUnit) {
				await db.insert(schema.userAssignments).values({
					user_id: user.id,
					role_id: roleId,
					org_unit_id: nu.orgUnit.id,
					is_primary_unit: true
				});
			}
		}

		// Set director as head of root org unit
		const directorUser = createdNamedUsers.find((u) => u.email === 'director@hospital.go.th');
		if (directorUser && rootUnit) {
			await db.update(schema.orgUnits).set({ head_of_unit_id: directorUser.id }).where(eq(schema.orgUnits.id, rootUnit.id));
		}

		// Set procurement head as head of procurement unit
		const procHead = createdNamedUsers.find((u) => u.email === 'procurement-head@hospital.go.th');
		if (procHead && procurementUnit) {
			await db.update(schema.orgUnits).set({ head_of_unit_id: procHead.id }).where(eq(schema.orgUnits.id, procurementUnit.id));
		}

		// Set finance head as head of finance unit
		const finHead = createdNamedUsers.find((u) => u.email === 'finance-head@hospital.go.th');
		if (finHead && financeUnit) {
			await db.update(schema.orgUnits).set({ head_of_unit_id: finHead.id }).where(eq(schema.orgUnits.id, financeUnit.id));
		}

		console.log(`✅ Named workflow users created (${createdNamedUsers.length} users)`);

		// ── Additional random users to fill to 20 ──
		const remainingCount = 20 - existingCount - createdNamedUsers.length;
		if (remainingCount > 0) {
			const roleNames = ['แพทย์', 'พยาบาล', 'นักวิชาการ', 'เจ้าหน้าที่ธุรการ'];
			for (let i = 0; i < remainingCount; i++) {
				const firstName = firstNames[(i + 10) % firstNames.length];
				const lastName = lastNames[(i + 10) % lastNames.length];
				const position = positions[(i + 4) % positions.length];
				const positionRank = positionRanks[(i + 4) % positionRanks.length];
				const roleName = roleNames[i % roleNames.length];
				const roleId = roleMap.get(roleName);
				const orgUnit = subUnits[(i + 5) % subUnits.length];
				const idCard = `1${String(345678901234 + existingCount + createdNamedUsers.length + i).padStart(12, '0')}`;

				const [user] = await db
					.insert(schema.users)
					.values({
						password_hash: passwordHash,
						agency_id: hospital.id,
						id_card: idCard,
						position,
						position_rank: positionRank,
						name: `${firstName} ${lastName}`,
						email: `user${existingCount + createdNamedUsers.length + i + 1}@hospital.go.th`,
						phone: `08${randomInt(10000000, 99999999)}`,
						is_super_admin: false,
						profile_completed: true
					})
					.returning();

				if (roleId && orgUnit) {
					await db.insert(schema.userAssignments).values({
						user_id: user.id,
						role_id: roleId,
						org_unit_id: orgUnit.id,
						is_primary_unit: true
					});
				}
			}
			console.log(`✅ Additional users created (${remainingCount} random users)`);
		}
	} else {
		console.log('ℹ️  Users already exist (20+ users)');
	}

	// ──────────────────────────────────────────
	// 10. Bank Accounts (idempotent)
	// ──────────────────────────────────────────
	let bankAccounts = await db.select().from(schema.bankAccounts);
	if (bankAccounts.length === 0) {
		const ktbBank = banks.find((b) => b.bank_code === 'KTB') || banks[0];
		bankAccounts = await db
			.insert(schema.bankAccounts)
			.values([
				{
					agency_id: hospital.id,
					bank_id: ktbBank.id,
					account_name: 'บัญชีเงินบำรุง',
					account_number: '123-4-56789-0',
					balance: '5000000.00',
					is_tax_pool: false
				},
				{
					agency_id: hospital.id,
					bank_id: ktbBank.id,
					account_name: 'บัญชีพักหักภาษี',
					account_number: '123-4-56789-1',
					balance: '0.00',
					is_tax_pool: true
				}
			])
			.returning();
		console.log('✅ Bank Accounts seeded');
	} else {
		console.log('ℹ️  Bank Accounts already exist');
	}

	// ──────────────────────────────────────────
	// 11. Median Prices (idempotent)
	// ──────────────────────────────────────────
	const existingPrices = await db.select().from(schema.medianPrices);
	if (existingPrices.length === 0) {
		await db.insert(schema.medianPrices).values([
			{
				category: 'เวชภัณฑ์',
				item_name: 'ยาสามัญประจำโรงพยาบาล',
				price: '150000.00',
				province_id: provinces[0].id,
				effective_date: '2026-01-01'
			},
			{
				category: 'ครุภัณฑ์การแพทย์',
				item_name: 'เครื่อง X-Ray ดิจิตอล',
				price: '3500000.00',
				province_id: provinces[0].id,
				effective_date: '2026-01-01'
			},
			{
				category: 'วัสดุสำนักงาน',
				item_name: 'กระดาษ A4 (ลัง)',
				price: '850.00',
				province_id: provinces[0].id,
				effective_date: '2026-01-01'
			}
		]);
		console.log('✅ Median Prices seeded');
	} else {
		console.log('ℹ️  Median Prices already exist');
	}

	// ──────────────────────────────────────────
	// 12. Plans (50 total: 10 parent + 40 child)
	// ──────────────────────────────────────────
	const existingPlans = await db.select().from(schema.plans);

	if (existingPlans.length < 50) {
		const parentUnits = orgUnits.filter((u) => {
			const parent = orgUnits.find((ou) => ou.id === u.parent_id);
			return parent && parent.parent_id !== null;
		});

		const allUnits = orgUnits.filter((u) => u.parent_id !== null);

		// Create 10 parent plans
		const parentPlans = await db
			.insert(schema.plans)
			.values(
				parentPlanTemplates.map((template, idx) => {
					const responsibleUnit = parentUnits[idx % parentUnits.length];
					const estimatedAmount =
						template.type === 'INCOME'
							? randomAmount(5000000, 20000000)
							: randomAmount(2000000, 15000000);
					const actualAmount = randomAmount(0, Number(estimatedAmount) * 0.8);

					return {
						agency_id: hospital.id,
						fiscal_year_id: fiscalYear.id,
						title: template.title,
						parent_id: null,
						responsible_unit_id: responsibleUnit?.id || null,
						start_date: '2025-10-01',
						end_date: '2026-09-30',
						duration_text: '12 เดือน',
						expected_outputs: JSON.stringify({
							outputs: [`ผลลัพธ์ของ${template.title}`]
						}),
						description: `รายละเอียด${template.title} ประจำปีงบประมาณ ${fiscalYear.year_name}`,
						stakeholder_unit_ids: JSON.stringify([]),
						is_leaf_node: false,
						plan_type: template.type,
						estimated_amount: estimatedAmount,
						actual_amount: actualAmount
					};
				})
			)
			.returning();

		// Create 40 child plans (4 per parent)
		const childPlans = [];
		for (const parentPlan of parentPlans) {
			for (let i = 0; i < 4; i++) {
				const template =
					childPlanTemplates[(parentPlan.id + i) % childPlanTemplates.length];
				const responsibleUnit = allUnits[randomInt(0, allUnits.length - 1)];
				const estimatedAmount = randomAmount(100000, 3000000);
				const actualAmount = randomAmount(0, Number(estimatedAmount) * 0.9);

				childPlans.push({
					agency_id: hospital.id,
					fiscal_year_id: fiscalYear.id,
					title: `${template} - ${parentPlan.title}`,
					parent_id: parentPlan.id,
					responsible_unit_id: responsibleUnit?.id || null,
					start_date: '2025-10-01',
					end_date: '2026-09-30',
					duration_text: '12 เดือน',
					expected_outputs: JSON.stringify({
						outputs: [`ผลลัพธ์ของ${template}`]
					}),
					description: `รายละเอียด${template} ภายใต้${parentPlan.title}`,
					stakeholder_unit_ids: JSON.stringify([]),
					is_leaf_node: true,
					plan_type: parentPlan.plan_type,
					estimated_amount: estimatedAmount,
					actual_amount: actualAmount
				});
			}
		}

		await db.insert(schema.plans).values(childPlans);

		console.log(
			`✅ Plans seeded (${parentPlans.length} parent + ${childPlans.length} child = ${parentPlans.length + childPlans.length} total)`
		);
	} else {
		console.log('ℹ️  Plans already exist (50+ plans)');
	}

	// ──────────────────────────────────────────
	// 13. Vendors (idempotent)
	// ──────────────────────────────────────────
	let vendors = await db.select().from(schema.vendors);
	if (vendors.length === 0) {
		const vendorNames = [
			'บริษัท อุปกรณ์การแพทย์ จำกัด',
			'ห้างหุ้นส่วน ยาดีเวชภัณฑ์',
			'บริษัท เทคโนโลยีสุขภาพ จำกัด',
			'ร้าน ครุภัณฑ์การแพทย์',
			'บริษัท ก่อสร้างมั่นคง จำกัด',
			'ห้างหุ้นส่วน คอมพิวเตอร์สมัยใหม่',
			'บริษัท วัสดุสำนักงานไทย จำกัด',
			'ร้าน เฟอร์นิเจอร์คุณภาพ'
		];
		vendors = await db
			.insert(schema.vendors)
			.values(
				vendorNames.map((name, i) => ({
					vendor_type: i % 2 === 0 ? 'นิติบุคคล' : 'บุคคลธรรมดา',
					tax_id: `${String(1000000000000 + i).padStart(13, '0')}`,
					company_name: name,
					contact_person: `ผู้ติดต่อ ${i + 1}`,
					contact_email: `vendor${i + 1}@example.com`,
					contact_phone: `02${randomInt(1000000, 9999999)}`
				}))
			)
			.returning();
		console.log(`✅ Vendors seeded (${vendors.length} vendors)`);
	} else {
		console.log('ℹ️  Vendors already exist');
	}

	// ──────────────────────────────────────────
	// 14. Documents (30+ documents)
	// ──────────────────────────────────────────
	const existingDocs = await db.select().from(schema.documents);

	if (existingDocs.length < 30) {
		const users = await db.select().from(schema.users).where(eq(schema.users.is_super_admin, false));
		const plans = await db.select().from(schema.plans);

		if (workflows.length > 0 && plans.length > 0 && users.length > 0) {
			const docsToCreate = 30 - existingDocs.length;
			const docs = [];

			for (let i = 0; i < docsToCreate; i++) {
				const workflow = workflows[i % workflows.length];
				const plan = plans[i % plans.length];
				const user = users[i % users.length];
				const status = documentStatuses[i % documentStatuses.length];

				// Create dates spread over last 6 months
				const date = new Date();
				date.setMonth(date.getMonth() - randomInt(0, 5));
				date.setDate(randomInt(1, 28));

				docs.push({
					agency_id: hospital.id,
					workflow_id: workflow.id,
					plan_id: plan.id,
					current_step_id: null,
					payload: JSON.stringify({ title: `เอกสารจัดซื้อจัดจ้าง #${i + 1}` }),
					status,
					updated_by: user.id
				});
			}

			await db.insert(schema.documents).values(docs);
			console.log(`✅ Documents seeded (${docs.length} documents)`);
		}
	} else {
		console.log('ℹ️  Documents already exist (30+ documents)');
	}

	// ──────────────────────────────────────────
	// 15. Dika Vouchers (20+ vouchers)
	// ──────────────────────────────────────────
	const existingDika = await db.select().from(schema.dikaVouchers);

	if (existingDika.length < 20) {
		const documents = await db.select().from(schema.documents);

		if (
			documents.length > 0 &&
			vendors.length > 0 &&
			existingPlans.length > 0 &&
			bankAccounts.length > 0
		) {
			const dikaToCreate = Math.min(20 - existingDika.length, documents.length);
			const dikaVouchers = [];

			for (let i = 0; i < dikaToCreate; i++) {
				const doc = documents[i % documents.length];
				const vendor = vendors[i % vendors.length];
				const plan = existingPlans[i % existingPlans.length];
				const status = dikaStatuses[i % dikaStatuses.length];
				const grossAmount = randomAmount(10000, 500000);
				const taxAmount = randomAmount(0, Number(grossAmount) * 0.07);
				const netAmount = (Number(grossAmount) - Number(taxAmount)).toFixed(2);

				dikaVouchers.push({
					agency_id: hospital.id,
					document_id: doc.id,
					vendor_id: vendor.id,
					plan_id: plan.id,
					payment_bank_account_id: bankAccounts[0].id,
					tax_pool_account_id: bankAccounts.length > 1 ? bankAccounts[1].id : null,
					gross_amount: grossAmount,
					fine_amount: '0.00',
					tax_amount: taxAmount,
					net_amount: netAmount,
					status,
					examiner_id: null,
					director_id: null
				});
			}

			await db.insert(schema.dikaVouchers).values(dikaVouchers);
			console.log(`✅ Dika Vouchers seeded (${dikaVouchers.length} vouchers)`);
		}
	} else {
		console.log('ℹ️  Dika Vouchers already exist (20+ vouchers)');
	}

	// ──────────────────────────────────────────
	// 16. Real Workflow Document + Notifications
	// ──────────────────────────────────────────
	const existingNotifs = await db.select().from(schema.notifications);
	if (existingNotifs.length === 0) {
		const allUsers = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users).where(isNull(schema.users.deleted_at));
		const directorU = allUsers.find((u) => u.email === 'director@hospital.go.th');
		const procHeadU = allUsers.find((u) => u.email === 'procurement-head@hospital.go.th');
		const proc1U = allUsers.find((u) => u.email === 'procurement1@hospital.go.th');
		const finHeadU = allUsers.find((u) => u.email === 'finance-head@hospital.go.th');
		const fin1U = allUsers.find((u) => u.email === 'finance1@hospital.go.th');
		const comm1U = allUsers.find((u) => u.email === 'committee1@hospital.go.th');

		// ── Create a REAL document in วิธีเฉพาะเจาะจง workflow ──
		const specificWf = workflows.find((w) => w.name === 'วิธีเฉพาะเจาะจง');
		const leafPlans = await db.select().from(schema.plans).where(eq(schema.plans.is_leaf_node, true));
		const firstLeafPlan = leafPlans[0];

		if (specificWf && firstLeafPlan && proc1U) {
			// Get first step of the workflow
			const wfSteps = await db.select().from(schema.workflowSteps)
				.where(eq(schema.workflowSteps.workflow_id, specificWf.id))
				.orderBy(schema.workflowSteps.step_sequence);

			const firstStep = wfSteps[0];

			if (firstStep) {
				// Create the real document — step 1: จัดทำรายงานขอซื้อขอจ้าง (PR)
				const [realDoc] = await db.insert(schema.documents).values({
					agency_id: hospital.id,
					workflow_id: specificWf.id,
					plan_id: firstLeafPlan.id,
					current_step_id: firstStep.id,
					payload: JSON.stringify({ title: `จัดซื้อยาสามัญประจำโรงพยาบาล — ${firstLeafPlan.title}` }),
					status: 'IN_PROGRESS',
					updated_by: proc1U.id
				}).returning();

				console.log(`✅ Real workflow document created (ID: ${realDoc.id}, workflow: ${specificWf.name})`);

				// Create step assignment for step 1 (creator = procurement officer)
				await db.insert(schema.documentStepAssignments).values({
					document_id: realDoc.id,
					step_id: firstStep.id,
					user_id: proc1U.id,
					assignment_type: 'UPLOADER',
					is_completed: false
				});

				// Notify the procurement officer about step 1
				await db.insert(schema.notifications).values({
					user_id: proc1U.id,
					document_id: realDoc.id,
					step_id: firstStep.id,
					title: `งานใหม่: ${firstStep.step_name}`,
					message: `คุณมีงานใหม่ "${firstStep.step_name}" สำหรับเอกสาร "${firstLeafPlan.title}"`,
					action_url: `/procurement/${realDoc.id}`,
					notification_type: 'UPLOAD_REQUIRED',
					is_read: false
				});

				console.log(`✅ Step 1 assignment + notification created for procurement officer`);

				// ── Create a 2nd document at step 2 (เห็นชอบ — waiting for procurement head) ──
				const secondLeafPlan = leafPlans[1];
				if (secondLeafPlan && wfSteps[1] && procHeadU) {
					const [doc2] = await db.insert(schema.documents).values({
						agency_id: hospital.id,
						workflow_id: specificWf.id,
						plan_id: secondLeafPlan.id,
						current_step_id: wfSteps[1].id, // step 2: เห็นชอบรายงาน
						payload: JSON.stringify({
							title: `จัดซื้อครุภัณฑ์คอมพิวเตอร์ — ${secondLeafPlan.title}`,
							step_1_จัดทำรายงานขอซื้อ: { completed: true, completed_by: proc1U.id }
						}),
						status: 'IN_PROGRESS',
						updated_by: proc1U.id
					}).returning();

					// Assign procurement head as reviewer
					await db.insert(schema.documentStepAssignments).values({
						document_id: doc2.id,
						step_id: wfSteps[1].id,
						user_id: procHeadU.id,
						assignment_type: 'APPROVER',
						is_completed: false
					});

					await db.insert(schema.notifications).values({
						user_id: procHeadU.id,
						document_id: doc2.id,
						step_id: wfSteps[1].id,
						title: `งานใหม่: ${wfSteps[1].step_name}`,
						message: `คุณมีเอกสารรอเห็นชอบ "${secondLeafPlan.title}" — กรุณาตรวจสอบและเห็นชอบ`,
						action_url: `/procurement/${doc2.id}`,
						notification_type: 'APPROVAL_REQUIRED',
						is_read: false
					});

					console.log(`✅ Document #${doc2.id} at step 2 (waiting for procurement head approval)`);
				}

				// ── Create a 3rd document at step 3 (อนุมัติ — waiting for director) ──
				const thirdLeafPlan = leafPlans[2];
				if (thirdLeafPlan && wfSteps[2] && directorU) {
					const [doc3] = await db.insert(schema.documents).values({
						agency_id: hospital.id,
						workflow_id: specificWf.id,
						plan_id: thirdLeafPlan.id,
						current_step_id: wfSteps[2].id, // step 3: อนุมัติรายงาน
						payload: JSON.stringify({
							title: `ซ่อมบำรุงเครื่องเอกซเรย์ — ${thirdLeafPlan.title}`,
							step_1_จัดทำรายงานขอซื้อ: { completed: true },
							step_2_เห็นชอบรายงาน: { completed: true, approved_by: procHeadU?.id }
						}),
						status: 'IN_PROGRESS',
						updated_by: proc1U.id
					}).returning();

					await db.insert(schema.documentStepAssignments).values({
						document_id: doc3.id,
						step_id: wfSteps[2].id,
						user_id: directorU.id,
						assignment_type: 'APPROVER',
						is_completed: false
					});

					await db.insert(schema.notifications).values({
						user_id: directorU.id,
						document_id: doc3.id,
						step_id: wfSteps[2].id,
						title: `งานใหม่: ${wfSteps[2].step_name}`,
						message: `คุณมีเอกสารรออนุมัติหลักการ "${thirdLeafPlan.title}" — กรุณาอนุมัติ`,
						action_url: `/procurement/${doc3.id}`,
						notification_type: 'APPROVAL_REQUIRED',
						is_read: false
					});

					console.log(`✅ Document #${doc3.id} at step 3 (waiting for director approval)`);
				}
			}
		}

		console.log('✅ Real workflow documents + notifications seeded');
	} else {
		console.log('ℹ️  Notifications already exist');
	}

	// ──────────────────────────────────────────
	// Summary
	// ──────────────────────────────────────────
	console.log('\n🎉 Database seeding complete!');
	console.log('\n📊 Summary:');
	console.log('   - Super Admin: 1 (email: admin@prosync.go.th, password: admin1234)');
	console.log('   - Workflows: 4 central procurement methods');
	console.log('     • วิธีคัดเลือก (10 steps)');
	console.log('     • วิธีเฉพาะเจาะจง (15 steps — full 5-phase workflow)');
	console.log('     • วิธีตลาดอิเล็กทรอนิกส์ (e-market)');
	console.log('     • วิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding)');
	console.log('   - Org Units: 45+ (hierarchical structure)');
	console.log('   - Plans: 50 (10 parent + 40 child)');
	console.log('   - Documents: 30+ with varied statuses');
	console.log('   - Dika Vouchers: 20+ with varied statuses');
	console.log('\n🔐 Workflow User Credentials (password: password1234):');
	console.log('   ผู้อำนวยการ (DIRECTOR):       director@hospital.go.th');
	console.log('   รอง ผอ. (REVIEWER):            vice-director@hospital.go.th');
	console.log('   หัวหน้าพัสดุ (REVIEWER):       procurement-head@hospital.go.th');
	console.log('   เจ้าหน้าที่พัสดุ (CREATOR):    procurement1@hospital.go.th');
	console.log('   เจ้าหน้าที่พัสดุ 2:            procurement2@hospital.go.th');
	console.log('   หัวหน้าการเงิน:                finance-head@hospital.go.th');
	console.log('   เจ้าหน้าที่การเงิน:            finance1@hospital.go.th');
	console.log('   กรรมการ 1 (พยาบาล):            committee1@hospital.go.th');
	console.log('   กรรมการ 2 (เภสัชกร):           committee2@hospital.go.th');
	console.log('   กรรมการ 3 (IT):                committee3@hospital.go.th');

	process.exit(0);
}

seed().catch((err) => {
	console.error('❌ Seed failed:', err);
	process.exit(1);
});
