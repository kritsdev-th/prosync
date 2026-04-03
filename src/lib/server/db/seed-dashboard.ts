import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import * as schema from "./schema";

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
  "สมชาย",
  "สมหญิง",
  "วิชัย",
  "สุภาพ",
  "ประเสริฐ",
  "นภา",
  "ธนพล",
  "อรุณี",
  "กิตติ",
  "พิมพ์ใจ",
  "สมศักดิ์",
  "วรรณา",
  "ชัยวัฒน์",
  "นิตยา",
  "สุรชัย",
  "มาลี",
  "อนุชา",
  "รัตนา",
  "พิชัย",
  "สมพร",
];

const lastNames = [
  "สุขใจ",
  "ดีงาม",
  "ศรีสุข",
  "มั่นคง",
  "เจริญรุ่ง",
  "แสงทอง",
  "บุญมี",
  "รักไทย",
  "พงษ์พันธ์",
  "วงศ์สวัสดิ์",
  "แก้วมณี",
  "จันทร์เพ็ญ",
  "ศิริวัฒน์",
  "ทองดี",
  "สมบูรณ์",
];

const positions = ["นาย", "นาง", "นางสาว", "นพ.", "พญ.", "ทพ.", "ภก.", "พว."];

const positionRanks = [
  "เจ้าพนักงานพัสดุชำนาญงาน",
  "นักวิชาการเงินและบัญชีชำนาญการ",
  "พยาบาลวิชาชีพชำนาญการพิเศษ",
  "แพทย์ชำนาญการ",
  "เภสัชกรชำนาญการ",
  "นักวิชาการคอมพิวเตอร์ชำนาญการ",
  "เจ้าพนักงานธุรการชำนาญงาน",
  "นักทรัพยากรบุคคลชำนาญการ",
  "วิศวกรโยธาชำนาญการ",
  "นักวิชาการสาธารณสุขชำนาญการ",
];

// ──────────────────────────────────────────────
// Org unit names by department
// ──────────────────────────────────────────────
const departmentUnits = [
  // ศัลยกรรม
  { name: "ศัลยกรรมทั่วไป", parent: "ศัลยกรรม" },
  { name: "ศัลยกรรมกระดูก", parent: "ศัลยกรรม" },
  { name: "ศัลยกรรมระบบทางเดินปัสสาวะ", parent: "ศัลยกรรม" },
  // อายุรกรรม
  { name: "อายุรกรรมทั่วไป", parent: "อายุรกรรม" },
  { name: "อายุรกรรมหัวใจ", parent: "อายุรกรรม" },
  { name: "อายุรกรรมระบบทางเดินอาหาร", parent: "อายุรกรรม" },
  // กุมารเวชกรรม
  { name: "กุมารเวชกรรมทั่วไป", parent: "กุมารเวชกรรม" },
  { name: "กุมารเวชกรรมทารกแรกเกิด", parent: "กุมารเวชกรรม" },
  { name: "คลินิกเด็กสุขภาพดี", parent: "กุมารเวชกรรม" },
  // สูติ-นรีเวชกรรม
  { name: "สูติกรรม", parent: "สูติ-นรีเวชกรรม" },
  { name: "นรีเวชกรรม", parent: "สูติ-นรีเวชกรรม" },
  { name: "คลินิกวางแผนครอบครัว", parent: "สูติ-นรีเวชกรรม" },
  // จักษุวิทยา
  { name: "คลินิกจักษุทั่วไป", parent: "จักษุวิทยา" },
  { name: "ห้องตรวจจักษุพิเศษ", parent: "จักษุวิทยา" },
  { name: "ห้องผ่าตัดจักษุ", parent: "จักษุวิทยา" },
  // โสต ศอ นาสิก
  { name: "คลินิกหู", parent: "โสต ศอ นาสิก" },
  { name: "คลินิกจมูก", parent: "โสต ศอ นาสิก" },
  { name: "คลินิกคอ", parent: "โสต ศอ นาสิก" },
  // ออร์โธปิดิกส์
  { name: "คลินิกกระดูกทั่วไป", parent: "ออร์โธปิดิกส์" },
  { name: "คลินิกกระดูกเด็ก", parent: "ออร์โธปิดิกส์" },
  { name: "คลินิกกายภาพบำบัด", parent: "ออร์โธปิดิกส์" },
  // วิสัญญีวิทยา
  { name: "ห้องผ่าตัดใหญ่", parent: "วิสัญญีวิทยา" },
  { name: "ห้องผ่าตัดเล็ก", parent: "วิสัญญีวิทยา" },
  { name: "ห้องฟื้นผู้ป่วย", parent: "วิสัญญีวิทยา" },
  // รังสีวิทยา
  { name: "แผนกเอกซเรย์ทั่วไป", parent: "รังสีวิทยา" },
  { name: "แผนก CT Scan", parent: "รังสีวิทยา" },
  { name: "แผนก MRI", parent: "รังสีวิทยา" },
  // เภสัชกรรม
  { name: "เภสัชกรรมคลินิก", parent: "เภสัชกรรม" },
  { name: "เภสัชกรรมโรงพยาบาล", parent: "เภสัชกรรม" },
  { name: "คลังยา", parent: "เภสัชกรรม" },
  // การเงิน
  { name: "งานบัญชี", parent: "การเงินและบัญชี" },
  { name: "งานงบประมาณ", parent: "การเงินและบัญชี" },
  { name: "งานตรวจสอบ", parent: "การเงินและบัญชี" },
  // พัสดุ
  { name: "งานจัดซื้อ", parent: "พัสดุและจัดซื้อจัดจ้าง" },
  { name: "งานคลังพัสดุ", parent: "พัสดุและจัดซื้อจัดจ้าง" },
  { name: "งานซ่อมบำรุง", parent: "พัสดุและจัดซื้อจัดจ้าง" },
  // แผนงาน
  { name: "งานยุทธศาสตร์", parent: "แผนงานและประเมินผล" },
  { name: "งานติดตามประเมินผล", parent: "แผนงานและประเมินผล" },
  { name: "งานสารสนเทศ", parent: "แผนงานและประเมินผล" },
  // IT
  { name: "งานพัฒนาระบบ", parent: "เทคโนโลยีสารสนเทศ" },
  { name: "งานเครือข่าย", parent: "เทคโนโลยีสารสนเทศ" },
  { name: "งานช่วยเหลือผู้ใช้", parent: "เทคโนโลยีสารสนเทศ" },
  // ทรัพยากรบุคคล
  { name: "งานสรรหา", parent: "ทรัพยากรบุคคล" },
  { name: "งานพัฒนาบุคลากร", parent: "ทรัพยากรบุคคล" },
  { name: "งานสวัสดิการ", parent: "ทรัพยากรบุคคล" },
];

// ──────────────────────────────────────────────
// Plan templates
// ──────────────────────────────────────────────
const parentPlanTemplates = [
  { title: "แผนพัฒนาระบบบริการสุขภาพ", type: "EXPENSE" as const },
  { title: "แผนจัดซื้อครุภัณฑ์การแพทย์", type: "EXPENSE" as const },
  { title: "แผนพัฒนาบุคลากร", type: "EXPENSE" as const },
  { title: "แผนพัฒนาระบบเทคโนโลยีสารสนเทศ", type: "EXPENSE" as const },
  { title: "แผนปรับปรุงโครงสร้างพื้นฐาน", type: "EXPENSE" as const },
  { title: "แผนส่งเสริมสุขภาพชุมชน", type: "EXPENSE" as const },
  { title: "แผนป้องกันควบคุมโรค", type: "EXPENSE" as const },
  { title: "แผนพัฒนาระบบยาและเวชภัณฑ์", type: "EXPENSE" as const },
  { title: "แผนเพิ่มประสิทธิภาพการบริหาร", type: "EXPENSE" as const },
  { title: "แผนรายได้เงินบำรุง", type: "INCOME" as const },
];

const childPlanTemplates = [
  "จัดซื้ออุปกรณ์ทางการแพทย์",
  "อบรมพัฒนาทักษะบุคลากร",
  "ปรับปรุงระบบเครือข่ายคอมพิวเตอร์",
  "ซ่อมบำรุงอาคารสถานที่",
  "จัดซื้อยาและเวชภัณฑ์",
  "พัฒนาระบบสารสนเทศโรงพยาบาล",
  "จัดซื้อครุภัณฑ์สำนักงาน",
  "โครงการส่งเสริมสุขภาพประชาชน",
  "ปรับปรุงระบบไฟฟ้าและน้ำประปา",
  "จัดซื้อวัสดุทางการแพทย์",
  "อบรมเชิงปฏิบัติการ",
  "พัฒนาระบบฐานข้อมูล",
  "ซ่อมบำรุงเครื่องมือแพทย์",
  "จัดซื้ออุปกรณ์คอมพิวเตอร์",
  "โครงการรณรงค์ป้องกันโรค",
];

// ──────────────────────────────────────────────
// Document status pool
// ──────────────────────────────────────────────
const documentStatuses = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "PENDING",
  "APPROVED",
];

// ──────────────────────────────────────────────
// Dika voucher status pool
// ──────────────────────────────────────────────
const dikaStatuses = [
  "DRAFT",
  "PENDING_EXAMINE",
  "EXAMINED",
  "APPROVED",
  "REJECTED",
  "PAID",
];

async function seed() {
  console.log("🌱 Seeding dashboard mock data...");

  // ──────────────────────────────────────────
  // 1. Ensure base data exists
  // ──────────────────────────────────────────
  let provinces = await db.select().from(schema.provinces);
  if (provinces.length === 0) {
    provinces = await db
      .insert(schema.provinces)
      .values([
        { name: "ร้อยเอ็ด" },
        { name: "ขอนแก่น" },
        { name: "กรุงเทพมหานคร" },
      ])
      .returning();
    console.log("✅ Provinces seeded");
  }

  let agencies = await db.select().from(schema.agencies);
  if (agencies.length === 0) {
    agencies = await db
      .insert(schema.agencies)
      .values([
        {
          name: "โรงพยาบาลร้อยเอ็ด",
          agency_type: "โรงพยาบาล",
          province_id: provinces[0].id,
        },
      ])
      .returning();
    console.log("✅ Agencies seeded");
  }

  const hospital = agencies[0];

  // Ensure roles exist
  let roles = await db.select().from(schema.roles);
  if (roles.length === 0) {
    roles = await db
      .insert(schema.roles)
      .values([
        {
          name: "ผู้อำนวยการ",
          permissions: {
            system: { can_manage_users: true, can_manage_org_units: true },
            planning: {
              can_create_plan: true,
              can_edit_plan: true,
              can_delete_plan: true,
            },
            procurement: {
              can_create_document: true,
              can_approve_document: true,
            },
            finance: { can_create_dika: true, can_approve_dika: true },
            audit: { can_view_audit_trail: true },
          },
        },
        {
          name: "หัวหน้าแผนก",
          permissions: {
            system: { can_manage_users: false, can_manage_org_units: true },
            planning: {
              can_create_plan: true,
              can_edit_plan: true,
              can_delete_plan: false,
            },
            procurement: {
              can_create_document: true,
              can_approve_document: false,
            },
            finance: { can_create_dika: false, can_approve_dika: false },
            audit: { can_view_audit_trail: true },
          },
        },
        {
          name: "เจ้าหน้าที่พัสดุ",
          permissions: {
            system: { can_manage_users: false, can_manage_org_units: false },
            planning: {
              can_create_plan: false,
              can_edit_plan: false,
              can_delete_plan: false,
            },
            procurement: {
              can_create_document: true,
              can_approve_document: false,
            },
            finance: { can_create_dika: false, can_approve_dika: false },
            audit: { can_view_audit_trail: false },
          },
        },
        {
          name: "เจ้าหน้าที่การเงิน",
          permissions: {
            system: { can_manage_users: false, can_manage_org_units: false },
            planning: {
              can_create_plan: false,
              can_edit_plan: false,
              can_delete_plan: false,
            },
            procurement: {
              can_create_document: false,
              can_approve_document: false,
            },
            finance: { can_create_dika: true, can_approve_dika: false },
            audit: { can_view_audit_trail: false },
          },
        },
        {
          name: "แพทย์",
          permissions: {
            system: { can_manage_users: false, can_manage_org_units: false },
            planning: {
              can_create_plan: false,
              can_edit_plan: false,
              can_delete_plan: false,
            },
            procurement: {
              can_create_document: false,
              can_approve_document: false,
            },
            finance: { can_create_dika: false, can_approve_dika: false },
            audit: { can_view_audit_trail: false },
          },
        },
        {
          name: "พยาบาล",
          permissions: {
            system: { can_manage_users: false, can_manage_org_units: false },
            planning: {
              can_create_plan: false,
              can_edit_plan: false,
              can_delete_plan: false,
            },
            procurement: {
              can_create_document: false,
              can_approve_document: false,
            },
            finance: { can_create_dika: false, can_approve_dika: false },
            audit: { can_view_audit_trail: false },
          },
        },
        {
          name: "นักวิชาการ",
          permissions: {
            system: { can_manage_users: false, can_manage_org_units: false },
            planning: {
              can_create_plan: true,
              can_edit_plan: true,
              can_delete_plan: false,
            },
            procurement: {
              can_create_document: true,
              can_approve_document: false,
            },
            finance: { can_create_dika: false, can_approve_dika: false },
            audit: { can_view_audit_trail: false },
          },
        },
        {
          name: "เจ้าหน้าที่ธุรการ",
          permissions: {
            system: { can_manage_users: false, can_manage_org_units: false },
            planning: {
              can_create_plan: false,
              can_edit_plan: false,
              can_delete_plan: false,
            },
            procurement: {
              can_create_document: false,
              can_approve_document: false,
            },
            finance: { can_create_dika: false, can_approve_dika: false },
            audit: { can_view_audit_trail: false },
          },
        },
      ])
      .returning();
    console.log("✅ Roles seeded");
  }

  // Ensure fiscal year exists
  let fiscalYears = await db.select().from(schema.fiscalYears);
  if (fiscalYears.length === 0) {
    fiscalYears = await db
      .insert(schema.fiscalYears)
      .values({
        agency_id: hospital.id,
        year_name: "2569",
        is_active: true,
      })
      .returning();
    console.log("✅ Fiscal Year seeded");
  }
  const fiscalYear = fiscalYears[0];

  // ──────────────────────────────────────────
  // 2. Create org units (departments + sub-units)
  // ──────────────────────────────────────────
  let orgUnits = await db.select().from(schema.orgUnits);
  if (orgUnits.length === 0) {
    // Root unit
    const [rootUnit] = await db
      .insert(schema.orgUnits)
      .values({
        agency_id: hospital.id,
        name: "คณะกรรมการบริหารโรงพยาบาลร้อยเอ็ด",
        parent_id: null,
        head_of_unit_id: null,
      })
      .returning();

    // Department-level units (parents)
    const parentUnitNames = [
      "ศัลยกรรม",
      "อายุรกรรม",
      "กุมารเวชกรรม",
      "สูติ-นรีเวชกรรม",
      "จักษุวิทยา",
      "โสต ศอ นาสิก",
      "ออร์โธปิดิกส์",
      "วิสัญญีวิทยา",
      "รังสีวิทยา",
      "เภสัชกรรม",
      "การเงินและบัญชี",
      "พัสดุและจัดซื้อจัดจ้าง",
      "แผนงานและประเมินผล",
      "เทคโนโลยีสารสนเทศ",
      "ทรัพยากรบุคคล",
    ];

    const parentUnits = await db
      .insert(schema.orgUnits)
      .values(
        parentUnitNames.map((name) => ({
          agency_id: hospital.id,
          name,
          parent_id: rootUnit.id,
          head_of_unit_id: null,
        })),
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
          head_of_unit_id: null,
        })),
      )
      .returning();

    orgUnits = [rootUnit, ...parentUnits, ...subUnits];
    console.log(`✅ Org Units seeded (${orgUnits.length} units)`);
  }

  // ──────────────────────────────────────────
  // 3. Create 20 users across different departments
  // ──────────────────────────────────────────
  const existingUsers = await db.select().from(schema.users);
  const existingCount = existingUsers.filter((u) => !u.is_super_admin).length;

  if (existingCount < 20) {
    const usersToCreate = 20 - existingCount;
    const subUnits = orgUnits.filter((u) => u.parent_id !== null);
    const roleMap = new Map(roles.map((r) => [r.name, r]));

    const roleNames = [
      "ผู้อำนวยการ",
      "หัวหน้าแผนก",
      "เจ้าหน้าที่พัสดุ",
      "เจ้าหน้าที่การเงิน",
      "แพทย์",
      "พยาบาล",
      "นักวิชาการ",
      "เจ้าหน้าที่ธุรการ",
    ];

    const newUsers = [];
    for (let i = 0; i < usersToCreate; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const position = positions[i % positions.length];
      const positionRank = positionRanks[i % positionRanks.length];
      const roleName = roleNames[i % roleNames.length];
      const role = roleMap.get(roleName);
      const orgUnit = subUnits[i % subUnits.length];
      const idCard = `1${String(345678901234 + i).padStart(12, "0")}`;

      const passwordHash = await hash("password1234");

      const [user] = await db
        .insert(schema.users)
        .values({
          password_hash: passwordHash,
          agency_id: hospital.id,
          id_card: idCard,
          position,
          position_rank: positionRank,
          name: `${firstName} ${lastName}`,
          email: `user${i + 1}@hospital.go.th`,
          phone: `08${randomInt(10000000, 99999999)}`,
          is_super_admin: false,
          profile_completed: true,
        })
        .returning();

      // Assign to org unit and role
      if (role && orgUnit) {
        await db.insert(schema.userAssignments).values({
          user_id: user.id,
          role_id: role.id,
          org_unit_id: orgUnit.id,
          is_primary_unit: true,
        });
      }

      newUsers.push(user);
    }

    console.log(
      `✅ ${usersToCreate} users created (total: ${existingCount + usersToCreate})`,
    );
  }

  // ──────────────────────────────────────────
  // 4. Create 50 plans (10 parent + 40 children)
  // ──────────────────────────────────────────
  const existingPlans = await db.select().from(schema.plans);

  if (existingPlans.length < 50) {
    const parentUnits = orgUnits.filter((u) => {
      const parent = orgUnits.find((ou) => ou.id === u.parent_id);
      return parent && parent.parent_id !== null; // second-level units = departments
    });

    const allUnits = orgUnits.filter((u) => u.parent_id !== null);

    // Create 10 parent plans
    const parentPlans = await db
      .insert(schema.plans)
      .values(
        parentPlanTemplates.map((template, idx) => {
          const responsibleUnit = parentUnits[idx % parentUnits.length];
          const estimatedAmount =
            template.type === "INCOME"
              ? randomAmount(5000000, 20000000)
              : randomAmount(2000000, 15000000);
          const actualAmount = randomAmount(0, Number(estimatedAmount) * 0.8);

          return {
            agency_id: hospital.id,
            fiscal_year_id: fiscalYear.id,
            title: template.title,
            parent_id: null,
            responsible_unit_id: responsibleUnit?.id || null,
            start_date: "2025-10-01",
            end_date: "2026-09-30",
            duration_text: "12 เดือน",
            expected_outputs: JSON.stringify({
              outputs: [`ผลลัพธ์ของ${template.title}`],
            }),
            description: `รายละเอียด${template.title} ประจำปีงบประมาณ ${fiscalYear.year_name}`,
            stakeholder_unit_ids: JSON.stringify([]),
            is_leaf_node: false,
            plan_type: template.type,
            estimated_amount: estimatedAmount,
            actual_amount: actualAmount,
          };
        }),
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
          start_date: "2025-10-01",
          end_date: "2026-09-30",
          duration_text: "12 เดือน",
          expected_outputs: JSON.stringify({
            outputs: [`ผลลัพธ์ของ${template}`],
          }),
          description: `รายละเอียด${template} ภายใต้${parentPlan.title}`,
          stakeholder_unit_ids: JSON.stringify([]),
          is_leaf_node: true,
          plan_type: parentPlan.plan_type,
          estimated_amount: estimatedAmount,
          actual_amount: actualAmount,
        });
      }
    }

    await db.insert(schema.plans).values(childPlans);

    console.log(
      `✅ Plans seeded (${parentPlans.length} parent + ${childPlans.length} child = ${parentPlans.length + childPlans.length} total)`,
    );
  }

  // ──────────────────────────────────────────
  // 5. Create workflows and bank accounts (prerequisites)
  // ──────────────────────────────────────────
  let workflows = await db.select().from(schema.workflows);
  if (workflows.length === 0) {
    workflows = await db
      .insert(schema.workflows)
      .values([
        { name: "วิธีคัดเลือก", total_steps: 10 },
        { name: "วิธีเฉพาะเจาะจง", total_steps: 7 },
        { name: "วิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding)", total_steps: 12 },
        { name: "วิธีตลาดอิเล็กทรอนิกส์ (e-market)", total_steps: 10 },
      ])
      .returning();
    console.log(`✅ Workflows seeded (${workflows.length} workflows)`);
  }

  let bankAccounts = await db.select().from(schema.bankAccounts);
  if (bankAccounts.length === 0) {
    // Ensure banks exist first
    let banks = await db.select().from(schema.bank);
    if (banks.length === 0) {
      banks = await db
        .insert(schema.bank)
        .values([
          { bank_code: "BBL", name: "ธนาคารกรุงเทพ" },
          { bank_code: "KBANK", name: "ธนาคารกสิกรไทย" },
          { bank_code: "KTB", name: "ธนาคารกรุงไทย" },
          { bank_code: "SCB", name: "ธนาคารไทยพาณิชย์" },
        ])
        .returning();
    }

    bankAccounts = await db
      .insert(schema.bankAccounts)
      .values([
        {
          agency_id: hospital.id,
          bank_id: banks.find((b) => b.bank_code === "KTB")?.id || banks[0].id,
          account_name: "บัญชีเงินบำรุง",
          account_number: "123-4-56789-0",
          balance: "5000000.00",
          is_tax_pool: false,
        },
        {
          agency_id: hospital.id,
          bank_id: banks.find((b) => b.bank_code === "KTB")?.id || banks[0].id,
          account_name: "บัญชีพักหักภาษี",
          account_number: "123-4-56789-1",
          balance: "0.00",
          is_tax_pool: true,
        },
      ])
      .returning();
    console.log(`✅ Bank Accounts seeded (${bankAccounts.length} accounts)`);
  }

  // ──────────────────────────────────────────
  // 6. Create sample documents for chart data
  // ──────────────────────────────────────────
  const existingDocs = await db.select().from(schema.documents);

  if (existingDocs.length < 30) {
    const workflows = await db.select().from(schema.workflows);
    const plans = await db.select().from(schema.plans);
    const users = await db
      .select()
      .from(schema.users)
      .where((t) => !t.is_super_admin);

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
          updated_by: user.id,
        });
      }

      await db.insert(schema.documents).values(docs);
      console.log(`✅ Documents seeded (${docs.length} documents)`);
    }
  }

  // ──────────────────────────────────────────
  // 7. Create sample vendors
  // ──────────────────────────────────────────
  let vendors = await db.select().from(schema.vendors);
  if (vendors.length === 0) {
    const vendorNames = [
      "บริษัท อุปกรณ์การแพทย์ จำกัด",
      "ห้างหุ้นส่วน ยาดีเวชภัณฑ์",
      "บริษัท เทคโนโลยีสุขภาพ จำกัด",
      "ร้าน ครุภัณฑ์การแพทย์",
      "บริษัท ก่อสร้างมั่นคง จำกัด",
      "ห้างหุ้นส่วน คอมพิวเตอร์สมัยใหม่",
      "บริษัท วัสดุสำนักงานไทย จำกัด",
      "ร้าน เฟอร์นิเจอร์คุณภาพ",
    ];
    vendors = await db
      .insert(schema.vendors)
      .values(
        vendorNames.map((name, i) => ({
          vendor_type: i % 2 === 0 ? "นิติบุคคล" : "บุคคลธรรมดา",
          tax_id: `${String(1000000000000 + i).padStart(13, "0")}`,
          company_name: name,
          contact_person: `ผู้ติดต่อ ${i + 1}`,
          contact_email: `vendor${i + 1}@example.com`,
          contact_phone: `02${randomInt(1000000, 9999999)}`,
        })),
      )
      .returning();
    console.log(`✅ Vendors seeded (${vendors.length} vendors)`);
  }

  // ──────────────────────────────────────────
  // 8. Create sample dika vouchers for chart data
  // ──────────────────────────────────────────
  const existingDika = await db.select().from(schema.dikaVouchers);

  if (existingDika.length < 20) {
    const documents = await db.select().from(schema.documents);
    const plans = await db.select().from(schema.plans);
    const bankAccounts = await db.select().from(schema.bankAccounts);

    if (
      documents.length > 0 &&
      vendors.length > 0 &&
      plans.length > 0 &&
      bankAccounts.length > 0
    ) {
      const dikaToCreate = Math.min(20 - existingDika.length, documents.length);
      const dikaVouchers = [];

      for (let i = 0; i < dikaToCreate; i++) {
        const doc = documents[i % documents.length];
        const vendor = vendors[i % vendors.length];
        const plan = plans[i % plans.length];
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
          tax_pool_account_id:
            bankAccounts.length > 1 ? bankAccounts[1].id : null,
          gross_amount: grossAmount,
          fine_amount: "0.00",
          tax_amount: taxAmount,
          net_amount: netAmount,
          status,
          examiner_id: null,
          director_id: null,
        });
      }

      await db.insert(schema.dikaVouchers).values(dikaVouchers);
      console.log(`✅ Dika Vouchers seeded (${dikaVouchers.length} vouchers)`);
    }
  }

  console.log("\n🎉 Dashboard mock data seeding complete!");
  console.log("\n📊 Summary:");
  console.log(`   - Users: 20+ across different departments`);
  console.log(`   - Plans: 50 (10 parent + 40 child)`);
  console.log(`   - Documents: 30+ with varied statuses`);
  console.log(`   - Dika Vouchers: 20+ with varied statuses`);
  console.log("\n🔐 Default password for all users: password1234");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
