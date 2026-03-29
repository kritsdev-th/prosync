# ERP_Enterprise_Architecture:ระบบ ERP จัดซื้อ เบิกจ่าย และบริหารงบประมาณภาครัฐ (Multi-Tenant & Audit Trail)

## Tech Stack

- Frontend & Backend: SvelteKit (TypeScript, +page.server.ts actions & load functions)
- ORM: Drizzle ORM
- Primary Database: PostgreSQL
- Audit Database: MongoDB (via mongodb driver — NOT Mongoose)
- Auth: JWT via jose library — Access Token 15 min + Refresh Token 7 days, both in httpOnly cookies that can protect against XSS, the Access Token has role + permission no need to query IAM every request as it is stateless

- Password Hashing: argon2 (via @node-rs/argon2)
- Styling: Tailwind CSS

## Login Credential Contract

- Login Form Fields: id_card (เลขบัตรประชาชน 13 หลัก) + password
- Auth Flow:
  1. User กรอก id_card + password ที่ /login
  2. Backend query: SELECT id, password_hash, agency_id, ... 
     FROM users WHERE id_card = $1 AND deleted_at IS NULL
  3. ใช้ argon2.verify(password_hash, password) เพื่อตรวจสอบ
  4. ถ้าผ่าน → ดึง user_assignments ทั้งหมดของ user นี้ 
     → merge permissions → sign JWT → set httpOnly cookies
  5. ถ้าไม่ผ่าน → return fail(400, { errors: { id_card: 
     ["เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง"] } })
     (ห้ามบอกว่า field ไหนผิด เพื่อป้องกัน user enumeration attack)

## Database Tables

### Master & Multi-Tenant (กลุ่มระบบศูนย์กลางและหน่วยงาน กั้นข้อมูลด้วย Tenant ID)

- table_name: "provinces"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสจังหวัด (ส่วนกลาง)" }
    - { "name": "name", "key": "-", "data_type": "VARCHAR(100)", "description": "ชื่อจังหวัด" }

- table_name: "agencies"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "Tenant ID: รหัสหน่วยงาน ใช้กั้นข้อมูลไม่ให้ปะปนกัน (Multi-Tenant)" }
    - { "name": "name", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อหน่วยงาน (เช่น รพ.ร้อยเอ็ด)" }
    - { "name": "agency_type", "key": "-", "data_type": "VARCHAR(50)", "description": "ประเภทหน่วยงาน" }
    - { "name": "province_id", "key": "FK", "data_type": "INTEGER", "description": "อ้างอิงจังหวัด เพื่อบังคับให้ระบบดึงราคากลางของจังหวัดนี้มาใช้เท่านั้น" }

- table_name: "median_prices"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสราคากลาง" }
    - { "name": "category", "key": "-", "data_type": "VARCHAR(100)", "description": "หมวดหมู่รายการ" }
    - { "name": "item_name", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อรายการ (เช่น เครื่อง X-Ray)" }
    - { "name": "price", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ราคากลางมาตรฐาน" }
    - { "name": "province_id", "key": "FK", "data_type": "INTEGER", "description": "ราคากลางแยกตามจังหวัด" }
    - { "name": "effective_date", "key": "-", "data_type": "DATE", "description": "วันที่บังคับใช้ราคากลาง" }

### Organization & IAM (กลุ่มโครงสร้างองค์กรและสิทธิ์การใช้งานแบบ Matrix)

- table_name: "users"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสผู้ใช้งาน" },
    - { "name": "password_hash", "key": "-", "data_type": "VARCHAR(255)",
    "description": "Password ที่ Hash ด้วย argon2 (@node-rs/argon2). ห้าม SELECT field นี้ออกมาใน Query ปกติ ใช้เฉพาะตอน Login เท่านั้น" },
    - { "name": "agency_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกผู้ใช้กับหน่วยงาน (Tenant)" },
    - { "name": "id_card", "key": "-", "data_type": "VARCHAR(13)", "description": "เลขบัตรประชาชน (ใช้ยืนยันตัวตนหลัก)" },
    - { "name": "position", "key": "-", "data_type": "VARCHAR(50)", "description": "ยศ/คำนำหน้า (เช่น นพ.)" },
    - { "name": "position_rank", "key": "-", "data_type": "VARCHAR(255)", "description": "ระดับตำแหน่ง (เช่น แพทย์ชำนาญการ)" },
    - { "name": "name", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อ-นามสกุล" },
    - { "name": "email", "key": "-", "data_type": "VARCHAR(255)", "description": "อีเมล" }

- table_name: "org_units"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสแผนก/กอง" },
    - { "name": "agency_id", "key": "FK", "data_type": "INTEGER", "description": "แผนกสังกัดหน่วยงานไหน" },
    - { "name": "name", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อแผนก (เช่น ศัลยกรรม, พัสดุ)" },
    - { "name": "parent_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกแผนกแม่ (Tree Hierarchy สำหรับทำแผนกย่อย)" },
    - { "name": "head_of_unit_id", "key": "FK", "data_type": "INTEGER", "description": "ผู้ใช้ที่เป็นหัวหน้าแผนก" }

- table_name: "roles"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสบทบาท" },
    - { "name": "name", "key": "-", "data_type": "VARCHAR(100)", "description": "ชื่อบทบาท (เช่น พัสดุ, การเงิน, ผอ.)" },
    - { "name": "permissions", "key": "-", "data_type": "JSONB", "description": "สิทธิ์เชิงลึกระดับฟังก์ชัน" }

- table_name: "user_assignments"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "ตารางคุมสิทธิ์ Matrix (1 คนหลายหน้าที่)" },
    - { "name": "user_id", "key": "FK", "data_type": "INTEGER", "description": "อ้างอิงผู้ใช้งาน" },
    - { "name": "role_id", "key": "FK", "data_type": "INTEGER", "description": "อ้างอิงบทบาท" },
    - { "name": "org_unit_id", "key": "FK", "data_type": "INTEGER", "description": "แผนกที่ได้รับสิทธิ์ให้ไปทำงาน" },
    - { "name": "is_primary_unit", "key": "-", "data_type": "BOOLEAN", "description": "สังกัดหลัก: ถ้า True ระบบจะดึงชื่อแผนกนี้ไปประทับบนหัวกระดาษราชการ และ HR ใช้จ่ายเงินเดือน" }

### Bank, Tax & Cashflow (กลุ่มบัญชีธนาคาร ภาษี และกระแสเงินสด)

- table_name: "bank"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสธนาคาร" }
    - { "name": "bank_code", "key": "UNIQUE", "data_type": "VARCHAR(20)", "description": "รหัสย่อธนาคาร (เช่น BBL, KBANK, KTB)" }
    - { "name": "name", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อธนาคาร (เช่น ธนาคารกรุงเทพ, ธนาคารกสิกรไทย, ธนาคารกรุงไทย)" }
    - { "name": "logo_url", "key": "-", "data_type": "TEXT", "description": "ลิงก์รูปภาพโลโก้ธนาคาร (สำหรับนำไปแสดงผลบนหน้า UI)" }

- table_name: "bank_accounts"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสสมุดบัญชีจริง" },
    - { "name": "agency_id", "key": "FK", "data_type": "INTEGER", "description": "สังกัดหน่วยงาน" },
    - { "name": "bank_id", "key": "FK", "data_type": "INTEGER", "description": "อ้างอิงธนาคารจากตาราง banks" },
    - { "name": "account_name", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อบัญชี (เช่น บัญชีเงินบำรุง)" },
    - { "name": "account_number", "key": "-", "data_type": "VARCHAR(50)", "description": "เลขที่บัญชี" },
    - { "name": "balance", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ยอดเงินคงเหลือจริง (อัปเดตเมื่อมี Transaction เท่านั้น)" },
    - { "name": "is_tax_pool", "key": "-", "data_type": "BOOLEAN", "description": "ถ้า True = บัญชีพักหักภาษี สำหรับดักเงินไว้ส่งสรรพากร" }

- table_name: "bank_transactions"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "สมุดรายวันเบิกจ่าย (Cashflow Audit)" },
    - { "name": "bank_account_id", "key": "FK", "data_type": "INTEGER", "description": "เงินเข้า-ออกจากสมุดเล่มไหน" },
    - { "name": "transaction_type", "key": "-", "data_type": "VARCHAR(50)", "description": "IN, OUT, BORROW_TAX, REPAY_TAX, PAY_TAX" },
    - { "name": "amount", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ยอดเงินที่ขยับ" },
    - { "name": "plan_id", "key": "FK", "data_type": "INTEGER", "description": "เงินก้อนนี้ตัดจากแผนไหน (ผูก Leaf Node)" },
    - { "name": "dika_voucher_id", "key": "FK", "data_type": "INTEGER", "description": "อ้างอิงฎีกาที่สั่งจ่าย" },
    - { "name": "action_by_user_id", "key": "FK", "data_type": "INTEGER", "description": "คนที่กดปุ่มให้เกิดรายการนี้" },
    - { "name": "tags", "key": "-", "data_type": "JSONB", "description": "Metadata สำหรับค้นหา (เช่น {\"vendor\": \"บ.เมดิคอลแคร์\"})" },
    - { "name": "created_at", "key": "-", "data_type": "TIMESTAMP", "description": "เวลาที่สับสวิตช์เงินออกจริง" }

- table_name: "tax_transactions"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "ทะเบียนคุมภาษีหัก ณ ที่จ่าย" },
    - { "name": "agency_id", "key": "FK", "data_type": "INTEGER", "description": "สังกัดหน่วยงาน" },
    - { "name": "dika_voucher_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกฎีกาเบิกจ่าย" },
    - { "name": "vendor_id", "key": "FK", "data_type": "INTEGER", "description": "ผู้รับจ้าง" },
    - { "name": "tax_id", "key": "-", "data_type": "VARCHAR(13)", "description": "เลขผู้เสียภาษี 13 หลักของผู้รับจ้าง" },
    - { "name": "tax_rate", "key": "-", "data_type": "NUMERIC(5,2)", "description": "อัตราภาษี (เช่น 1%)" },
    - { "name": "tax_base_amount", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ยอดฐานภาษีก่อนหัก (Gross)" },
    - { "name": "tax_amount", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ยอดเงินภาษีที่หักไว้" },
    - { "name": "tax_form_type", "key": "-", "data_type": "VARCHAR(50)", "description": "แบบแสดงรายการ (เช่น ภ.ง.ด.53)" },
    - { "name": "status", "key": "-", "data_type": "VARCHAR(50)", "description": "WITHHELD (พักไว้รอส่ง), SUBMITTED (ส่งสรรพากรแล้ว)" }

### Planning & Rollup (กลุ่มการวางแผนและปีงบประมาณแบบ Bottom-Up)

- table_name: "fiscal_years"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "ปีงบประมาณ (จุดสูงสุดของ Dashboard)" },
    - { "name": "agency_id", "key": "FK", "data_type": "INTEGER", "description": "สังกัดหน่วยงาน" },
    - { "name": "year_name", "key": "-", "data_type": "VARCHAR(4)", "description": "ปีงบประมาณ (เช่น 2566)" },
    - { "name": "is_active", "key": "-", "data_type": "BOOLEAN", "description": "ปีที่กำลังแอคทีฟ" },
    - { "name": "total_estimated_income", "key": "-", "data_type": "NUMERIC(15,2)", "description": "รวมคาดการณ์รายรับ (ดันจาก Bottom-Up)" },
    - { "name": "total_estimated_expense", "key": "-", "data_type": "NUMERIC(15,2)", "description": "รวมคาดการณ์รายจ่าย (ดันจาก Bottom-Up เมื่อตั้งงบ)" },
    - { "name": "total_actual_income", "key": "-", "data_type": "NUMERIC(15,2)", "description": "รวมรับจริง (ดันจาก Bottom-Up)" },
    - { "name": "total_actual_expense", "key": "-", "data_type": "NUMERIC(15,2)", "description": "รวมจ่ายจริง (ดันจาก Bottom-Up ทันทีที่ ผอ. อนุมัติฎีกา)" }

- table_name: "plans"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "แผนปฏิบัติการ (N-Level)" },
    - { "name": "agency_id", "key": "FK", "data_type": "INTEGER", "description": "สังกัดหน่วยงาน" },
    - { "name": "fiscal_year_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกปีงบประมาณ" },
    - { "name": "title", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อแผน (เช่น โครงการปรับปรุง ER)" },
    - { "name": "parent_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกแผนแม่ เพื่อดันยอดตัวเลขขึ้นระดับบน" },
    - { "name": "is_leaf_node", "key": "-", "data_type": "BOOLEAN", "description": "ค่า True = แผนล่างสุดที่พร้อมให้เปิดเอกสารจัดซื้อ" },
    - { "name": "plan_type", "key": "-", "data_type": "VARCHAR(20)", "description": "INCOME / EXPENSE" },
    - { "name": "estimated_amount", "key": "-", "data_type": "NUMERIC(15,2)", "description": "งบที่ตั้งไว้ (ตัวเลขคาดการณ์)" },
    - { "name": "actual_amount", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ยอดรับ/จ่ายจริง (Default 0, รอรับยอดจาก Transaction)" }

### Workflow & Dika (กลุ่มกระบวนงานจัดซื้อ 15 ขั้นตอน และ ฎีกาเบิกจ่าย)

- table_name: "workflows"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "แม่พิมพ์ 15 ขั้นตอน" },
    - { "name": "name", "key": "-", "data_type": "VARCHAR(100)", "description": "ชื่อวิธีการจัดหา (เช่น วิธีคัดเลือก, วิธีเฉพาะเจาะจง)" },
    - { "name": "total_steps", "key": "-", "data_type": "INTEGER", "description": "จำนวนขั้นตอนทั้งหมดในวิธีนี้" }

- table_name: "workflow_steps"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "ขั้นตอนย่อยในแม่พิมพ์" },
    - { "name": "workflow_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกกับวิธีการจัดหา" },
    - { "name": "step_sequence", "key": "-", "data_type": "INTEGER", "description": "ลำดับที่ (1, 2, 3...)" },
    - { "name": "step_name", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อขั้นตอน (เช่น จัดทำร่าง TOR)" },
    - { "name": "ui_schema", "key": "-", "data_type": "JSONB", "description": "ตัวกำหนดพฤติกรรมหน้าจอ (เช่น ให้ดึงตาราง document_bidders มาแสดง)" },
    - { "name": "required_pdfs", "key": "-", "data_type": "JSONB", "description": "รายการ PDF ที่บังคับอัปโหลด (Array of Strings)" },
    - { "name": "approver_role", "key": "-", "data_type": "VARCHAR(50)", "description": "บทบาทที่ต้องเซ็นอนุมัติขั้นตอนนี้ (เช่น DIRECTOR)" },
    - { "name": "is_final_step", "key": "-", "data_type": "BOOLEAN", "description": "ถ้า True คือสิ้นสุดกระบวนการพัสดุ ส่งเรื่องไปตารางฎีกาเบิกจ่าย" }

- table_name: "documents"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "แฟ้มเอกสารจัดซื้อ" },
    - { "name": "agency_id", "key": "FK", "data_type": "INTEGER", "description": "สังกัดหน่วยงาน" },
    - { "name": "workflow_id", "key": "FK", "data_type": "INTEGER", "description": "อ้างอิงระเบียบจัดซื้อ" },
    - { "name": "plan_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกกับแผนที่ is_leaf_node = True" },
    - { "name": "current_step_id", "key": "-", "data_type": "INTEGER", "description": "สเต็ปปัจจุบัน" },
    - { "name": "payload", "key": "-", "data_type": "JSONB", "description": "ตู้เซฟเก็บสเปค: ราคากลาง, ไฟล์ PDF, และราคาชนะประมูล" },
    - { "name": "status", "key": "-", "data_type": "VARCHAR(50)", "description": "IN_PROGRESS, APPROVED_PROCUREMENT, REJECTED" },
    - { "name": "updated_by", "key": "FK", "data_type": "INTEGER", "description": "ใครกดแก้ไขล่าสุด" }

- table_name: "approvals"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "ประวัติการเซ็นอนุมัติ" },
    - { "name": "document_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกเอกสารจัดซื้อ" },
    - { "name": "step_id", "key": "FK", "data_type": "INTEGER", "description": "ขั้นตอนที่เซ็น" },
    - { "name": "user_id", "key": "FK", "data_type": "INTEGER", "description": "ใครเป็นคนเซ็น" },
    - { "name": "action", "key": "-", "data_type": "VARCHAR(20)", "description": "ผลการพิจารณา: APPROVED หรือ REJECTED" },
    - { "name": "comment", "key": "-", "data_type": "TEXT", "description": "หมายเหตุจากผู้อนุมัติ (บังคับกรอกเมื่อ action = REJECTED)" },
    - { "name": "created_at", "key": "-", "data_type": "TIMESTAMP WITH TIME ZONE", "description": "วันเวลาที่เซ็นอนุมัติ/ปฏิเสธ (UTC)" }

- table_name: "document_committees"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสรายชื่อ" }
    - { "name": "document_id", "key": "FK", "data_type": "INTEGER", "description": "[Many-to-1 -> documents.id] ผูกกับเอกสารจัดซื้อ" }
    - { "name": "user_id", "key": "FK", "data_type": "INTEGER", "description": "[Many-to-1 -> users.id] บุคคลที่เป็นกรรมการ" }
    - { "name": "committee_type", "key": "-", "data_type": "VARCHAR(50)", "description": "ประเภทคณะกรรมการ (เช่น 'TOR', 'MEDIAN_PRICE', 'PROCUREMENT', 'INSPECTION')" }
    - { "name": "role_in_committee", "key": "-", "data_type": "VARCHAR(100)", "description": "ตำแหน่งในคณะ (เช่น 'ประธานกรรมการ', 'กรรมการ')" }

- table_name: "document_bidders"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสการยื่นซอง" }
    - { "name": "document_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกกับเอกสารจัดซื้อ" }
    - { "name": "vendor_id", "key": "FK", "data_type": "INTEGER", "description": "อ้างอิงบริษัทที่ส่งข้อเสนอมา" }
    - { "name": "proposal_pdf_url", "key": "-", "data_type": "TEXT", "description": "ลิงก์ไฟล์ PDF ใบเสนอราคา (1:1)" }
    - { "name": "proposed_price", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ราคาที่เสนอมา" }
    - { "name": "score", "key": "-", "data_type": "NUMERIC(5,2)", "description": "คะแนนจากการประเมิน (อัปเดตในสเต็ปประกาศคะแนน)" }
    - { "name": "is_winner", "key": "-", "data_type": "BOOLEAN", "description": "ใครคือผู้ชนะ" }
    - { "name": "submitted_at", "key": "-", "data_type": "TIMESTAMP", "description": "เวลาที่ส่งเอกสารตอบกลับเข้าระบบ" }

- table_name: "vendors"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "รหัสผู้ประกอบการ" }
    - { "name": "vendor_type", "key": "-", "data_type": "VARCHAR(100)", "description": "ประเภทผู้ประกอบการ" }
    - { "name": "tax_id", "key": "UNIQUE", "data_type": "VARCHAR(13)", "description": "เลขผู้เสียภาษี 13 หลัก" }
    - { "name": "company_name", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อบริษัท/ผู้รับจ้าง" }
    - { "name": "contact_person", "key": "-", "data_type": "VARCHAR(255)", "description": "ชื่อผู้ติดต่อ" },
    - { "name": "contact_email", "key": "-", "data_type": "VARCHAR(255)", "description": "อีเมลผู้ติดต่อ" },
    - { "name": "contact_phone", "key": "-", "data_type": "VARCHAR(20)", "description": "เบอร์โทรผู้ติดต่อ" }

- table_name: "dika_vouchers"
  - columns:
    - { "name": "id", "key": "PK", "data_type": "INTEGER", "description": "ฎีกาเบิกจ่าย" },
    - { "name": "agency_id", "key": "FK", "data_type": "INTEGER", "description": "สังกัดหน่วยงาน" },
    - { "name": "document_id", "key": "FK", "data_type": "INTEGER", "description": "ผูกเอกสารจัดซื้อใบที่ตรวจรับแล้ว" },
    - { "name": "vendor_id", "key": "FK", "data_type": "INTEGER", "description": "ผู้รับจ้าง (เปลี่ยนจาก name เป็น id)" },
    - { "name": "plan_id", "key": "FK", "data_type": "INTEGER", "description": "งบประมาณที่ถูกตัด (คัดลอกมาจาก documents.plan_id ตอนสร้างฎีกา)" },
    - { "name": "payment_bank_account_id", "key": "FK", "data_type": "INTEGER", "description": "บัญชีที่จะตัดเงินจ่าย" },
    - { "name": "tax_pool_account_id", "key": "FK", "data_type": "INTEGER", "description": "บัญชีที่จะนำภาษีไปพักไว้" },
    - { "name": "gross_amount", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ยอดเต็มจำนวน" },
    - { "name": "fine_amount", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ยอดค่าปรับจากการส่งมอบล่าช้า (ถ้ามี)" },
    - { "name": "tax_amount", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ยอดภาษี" },
    - { "name": "net_amount", "key": "-", "data_type": "NUMERIC(15,2)", "description": "ยอดโอนสุทธิ" },
    - { "name": "status", "key": "-", "data_type": "VARCHAR(50)", "description": "PENDING_EXAMINE, PAID, REJECTED" },
    - { "name": "examiner_id", "key": "FK", "data_type": "INTEGER", "description":"ลายเซ็นผู้ตรวจฎีกา (ถ้ามี) ที่ต้องเซ็นก่อนส่ง ผอ." },
    - { "name": "director_id", "key": "FK", "data_type": "INTEGER", "description": "ลายเซ็น ผอ. ผู้อนุมัติจ่าย" }

### Audit Trail (กลุ่มกล้องวงจรปิด บันทึกการเปลี่ยนแปลงทุกอย่างแบบละเอียด) โดยส่วนนี้จะเป็นการใช้ NoSQL (Use MongoDB) เพื่อให้เก็บข้อมูลได้ยืดหยุ่นและไม่ต้องออกแบบ Schema ล่วงหน้ามากนัก

- collection_name: "plan_budget_histories"
  - fields:
    - { "name": "_id", "type": "ObjectId", "description": "Primary Key สร้างโดย MongoDB" },
    - { "name": "plan_id", "type": "Number", "description": "อ้างอิง ID แผนจาก PostgreSQL" },
    - { "name": "agency_id", "type": "Number", "description": "Tenant ID สำหรับกั้นข้อมูล" },
    - { "name": "action_type", "type": "String", "description": "ประเภท Action เช่น MANUAL_ADJUST, SYSTEM_EXPEND" },
    - { "name": "changes", "type": "Object", "description": "จัดกลุ่มยอดที่เปลี่ยนแปลง", "sub_fields": [
      - { "name": "estimated_amount", "type": "Object", "description": "{ old: Number, new: Number }" },
      - { "name": "actual_amount", "type": "Object", "description": "{ old: Number, new: Number }" }
    ]},
    - { "name": "action_by", "type": "Object", "description": "ข้อมูลผู้ทำรายการแบบ Denormalized (ฝังข้อมูล)", "sub_fields": [
      - { "name": "user_id", "type": "Number", "description": "อ้างอิง ID จากตาราง users" },
      - { "name": "name", "type": "String", "description": "ชื่อ-สกุล ณ เวลานั้น" },
      - { "name": "position", "type": "String", "description": "ตำแหน่ง ณ เวลานั้น" },
      - { "name": "ip_address", "type": "String", "description": "IP Address เครื่องที่กดทำรายการ" }
    ]},
    - { "name": "created_at", "type": "ISODate", "description": "วันเวลาที่บันทึก" }

- collection_name: "doc_payload_histories"
  - fields:
    - { "name": "_id", "type": "ObjectId", "description": "Primary Key สร้างโดย MongoDB" },
    - { "name": "document_id", "type": "Number", "description": "อ้างอิง ID เอกสารจัดซื้อจาก PostgreSQL" },
    - { "name": "agency_id", "type": "Number", "description": "Tenant ID สำหรับกั้นข้อมูล" },
    - { "name": "step_id", "type": "Number", "description": "การแก้ไขเกิดในขั้นตอนไหน (1-15)" },
    - { "name": "action_type", "type": "String", "description": "ประเภท Action เช่น VENDOR_BIDDING_UPDATE" },
    - { "name": "payload_snapshot", "type": "Object", "description": "ก้อน JSONB สถานะล่าสุด ณ วินาทีนั้น" },
    - { "name": "diff", "type": "Object", "description": "เก็บเฉพาะฟิลด์ที่ข้อมูลเปลี่ยน เพื่อความง่ายในการทำ UI เปรียบเทียบ" },
    - { "name": "action_by", "type": "Object", "description": "ข้อมูลผู้ทำรายการแบบ Denormalized", "sub_fields": [
      - { "name": "user_id", "type": "Number", "description": "อ้างอิง ID" },
      - { "name": "name", "type": "String", "description": "ชื่อ-สกุล" },
      - { "name": "ip_address", "type": "String", "description": "IP Address" }
      ]},
    - { "name": "created_at", "type": "ISODate", "description": "วันเวลาที่บันทึก" }

- collection_name: "bank_transaction_histories"
  - fields:
    - { "name": "_id", "type": "ObjectId", "description": "Primary Key สร้างโดย MongoDB" },
    - { "name": "bank_transaction_id", "type": "Number", "description": "อ้างอิง ID รายการเคลื่อนไหวเงินจาก PostgreSQL" },
    - { "name": "agency_id", "type": "Number", "description": "Tenant ID สำหรับกั้นข้อมูล" },
    - { "name": "action_type", "type": "String", "description": "ประเภท Action เช่น MANUAL_ADJUST, SYSTEM_SETTLE" },
    - { "name": "amount_change", "type": "Object", "description": "{ old: Number, new: Number }" },
    - { "name": "action_by", "type": "Object", "description": "ข้อมูลผู้ทำรายการแบบ Denormalized", "sub_fields": [
      - { "name": "user_id", "type": "Number", "description": "อ้างอิง ID" },
      - { "name": "name", "type": "String", "description": "ชื่อ-สกุล" },
      - { "name": "ip_address", "type": "String", "description": "IP Address" }
      ]},
    - { "name": "created_at", "type": "ISODate", "description": "วันเวลาที่บันทึก" }

## overview of the system (ภาพรวมของระบบ)

- What is this system
  - ระบบนี้คือ "แพลตฟอร์มบริหารจัดการยุทธศาสตร์และติดตามแผนพัฒนาองค์การ (Strategic Development & Portfolio Management System)"
  - เป็นระบบ ERP ที่ออกแบบมาสำหรับหน่วยงานภาครัฐ เพื่อช่วยให้การวางแผนงบประมาณ การจัดซื้อจัดจ้าง และการบริหารจัดการโครงการต่างๆ เป็นไปอย่างมีประสิทธิภาพ โปร่งใส และตรวจสอบได้
  - ระบบนี้จะช่วยให้ผู้บริหารสามารถมองเห็นภาพรวมของแผนงานต่างๆ ที่กำลังดำเนินการอยู่ในปีงบประมาณปัจจุบันและที่ดำเนินการไปแล้วเมื่อปีงบประมาณก่อนหน้า รวมถึงสถานะของแต่ละโครงการ เพื่อนำมาเป็นข้อมูลเปรียบเทียบในการวางแผนและสามารถตัดสินใจได้อย่างมีข้อมูลรองรับ

- Organization Structure & IAM
  - ระบบนี้ถูกออกแบบให้รองรับโครงสร้างองค์กรของหน่วยงานภาครัฐที่มีหลายแผนกและหลายโครงการ โดยมีการจัดการสิทธิ์การเข้าถึงข้อมูลแบบ Matrix ที่สามารถกำหนดได้ว่าใครสามารถดูหรือแก้ไขข้อมูลในแผนกไหนได้บ้าง
  - โครงสร้างองค์กรจะถูกจัดเก็บในฐานข้อมูลแบบ Relational Database (PostgreSQL) เพื่อให้สามารถเชื่อมโยงข้อมูลระหว่างผู้ใช้งาน แผนก และโครงการต่างๆ ได้อย่างมีประสิทธิภาพ
  - ระบบจะมีการเก็บประวัติการเปลี่ยนแปลงของข้อมูลต่างๆ อย่างละเอียดใน Audit Trail ที่ใช้เทคโนโลยี Polyglot Persistence โดยผสมผสานระหว่าง Relational Database สำหรับข้อมูลหลัก และ NoSQL Database (MongoDB) สำหรับบันทึกประวัติการเปลี่ยนแปลงที่มีความยืดหยุ่นสูงเพื่อให้สามารถตรวจสอบย้อนหลังได้อย่างมีประสิทธิภาพและสามารถตอบสนองความต้องการในการตรวจสอบข้อมูลในรูปแบบต่างๆ ได้อย่างครบถ้วน

- Persona
  - คณะกรรมการบริหารโรงพยาบาลหรือทีมบริหารโรงพยาบาล (Executive Committee)
    - ผู้อำนวยการโรงพยาบาล (Director): ผู้บริหารสูงสุดที่ต้องการภาพรวมของแผนงานทั้งหมดในโรงพยาบาล เพื่อใช้ในการตัดสินใจเชิงกลยุทธ์และการจัดสรรงบประมาณ
    - รองผู้อำนวยการฝ่ายต่างๆ (Deputy Directors): ผู้บริหารที่รับผิดชอบแต่ละฝ่าย เช่น ฝ่ายการแพทย์ ฝ่ายพยาบาล ฝ่ายสนับสนุน ที่ต้องการข้อมูลเฉพาะของแผนงานในสังกัดของตนเอง เพื่อใช้ในการวางแผนและการติดตามผล
  - ฝ่ายแผนงานและประเมินผล (Policy and Evaluation Department)
    - หัวหน้าแผนงาน (Planning Head): ผู้ที่ต้องการระบบที่ช่วยให้การวางแผนและการติดตามผลของโครงการต่างๆ เป็นไปอย่างมีประสิทธิภาพ และสามารถดึงข้อมูลเปรียบเทียบระหว่างปีงบประมาณได้อย่างง่ายดาย
    - เจ้าหน้าที่วางแผน (Planning Officer): ผู้ที่ต้องการระบบที่ช่วยให้การสร้างและปรับปรุงแผนงานเป็นไปอย่างง่ายดาย และสามารถดูประวัติการเปลี่ยนแปลงของแผนงานได้อย่างละเอียด
    - เจ้าหน้าที่ประเมินผล (Evaluation Officer): ผู้ที่ต้องการระบบที่ช่วยให้การติดตามผลและการประเมินโครงการต่างๆ เป็นไปอย่างมีประสิทธิภาพ และสามารถดูข้อมูลย้อนหลังเพื่อวิเคราะห์แนวโน้มและผลกระทบของโครงการได้
  - ฝ่ายงานพัสดุและจัดซื้อจัดจ้าง (Procurement Department)
    - หัวหน้าฝ่ายพัสดุ (Procurement Head): ผู้ที่ต้องการระบบที่ช่วยให้การบริหารจัดการแผนงานและโครงการต่างๆ ในฝ่ายพัสดุเป็นไปอย่างมีประสิทธิภาพ และสามารถดูภาพรวมของสถานะโครงการทั้งหมดในฝ่ายได้อย่างง่ายดาย
    - เจ้าหน้าที่พัสดุ (Procurement Officer): ผู้ที่ต้องการระบบที่ช่วยให้การจัดการเอกสารและการติดตามสถานะของแต่ละโครงการเป็นไปอย่างมีประสิทธิภาพ และสามารถดูประวัติการเปลี่ยนแปลงของเอกสารต่างๆ ได้อย่างละเอียด
    - หัวหน้าฝ่ายจัดซื้อจัดจ้าง (Procurement Head): ผู้ที่ต้องการระบบที่ช่วยให้การบริหารจัดการแผนงานและโครงการต่างๆ ในฝ่ายจัดซื้อจัดจ้างเป็นไปอย่างมีประสิทธิภาพ และสามารถดูภาพรวมของสถานะโครงการทั้งหมดในฝ่ายได้อย่างง่ายดาย
    - เจ้าหน้าที่จัดซื้อจัดจ้าง (Procurement Officer): ผู้ที่ต้องดำเนินการจัดซื้อจัดจ้างตามแผนงาน ต้องการระบบที่ช่วยให้การจัดการเอกสารและการติดตามสถานะของแต่ละโครงการเป็นไปอย่างมีประสิทธิภาพ
  - ฝ่ายการเงินและบัญชี (Finance & Accounting)
    - หัวหน้าฝ่ายการเงินและบัญชี (Finance Head): ผู้ที่ต้องการระบบที่ช่วยให้การบริหารจัดการงบประมาณและการติดตามการใช้จ่ายเป็นไปอย่างมีประสิทธิภาพ และสามารถดูภาพรวมของสถานะงบประมาณทั้งหมดในฝ่ายได้อย่างง่ายดาย
    - เจ้าหน้าที่การเงินและบัญชี (Finance Officer): ผู้ที่ต้องดูแลการเบิกจ่ายและการจัดการงบประมาณ ต้องการระบบที่ช่วยให้การติดตามการใช้จ่ายและการบริหารงบประมาณเป็นไปอย่างมีประสิทธิภาพ
  - ฝ่ายตรวจสอบภายใน
    - ผู้ตรวจสอบภายใน (Internal Auditor): ผู้ที่ต้องการตรวจสอบความถูกต้องของกระบวนการและการใช้จ่าย ต้องการระบบที่มี Audit Trail ที่ละเอียดและโปร่งใส เพื่อให้สามารถตรวจสอบย้อนหลังได้อย่างมีประสิทธิภาพ

## core system for this platform (ระบบหลักของแพลตฟอร์มนี้)

### 1. System for Super Admin (ระบบสำหรับผู้ดูแลสูงสุดที่มีสิทธิ์จัดการทุกอย่างในทุกหน่วยงาน)

- คำอธิบาย (description):
  - ระบบนี้จะเป็นจุดเริ่มต้นที่สำคัญสำหรับการใช้งานแพลตฟอร์ม โดย Super Admin จะมีสิทธิ์ในการเพิ่ม แก้ไข หรือลบทุกอย่างในระบบ เช่น การสร้างหน่วยงาน (Agencies) การสร้างแผนก (Org_units) การจัดการผู้ใช้งาน (Users) การกำหนดบทบาท (Roles) และการมอบหมายสิทธิ์ (User Assignments) ให้กับผู้ใช้งานในแต่ละหน่วยงาน นอกจากนี้ Super Admin ยังสามารถดูข้อมูลและรายงานต่างๆ ของทุกหน่วยงานได้อย่างเต็มที่ โดยไม่มีข้อจำกัดในการเข้าถึงข้อมูลใดๆ ในระบบ

- การทำงานที่เกี่ยวข้อง (logic and rules):
  - การกำหนดข้อมูลที่เป็นค่าเริ่มต้น (Default Data) คือ การสร้างบทบาทพื้นฐาน (เช่น ผอ., รองผอ., หัวหน้าแผนก, พัสดุ, การเงิน) และการสร้างหน่วยงานตัวอย่าง (เช่น โรงพยาบาลร้อยเอ็ด) การสร้เางแผนกตัวอย่าง (เช่น ศัลยกรรม, พัสดุ) การสรา้างจังหวัดตัวอย่าง (เช่น ร้อยเอ็ด) และการสร้างผู้ใช้งานตัวอย่าง (เช่น นายแพทย์สมชาย ตำแหน่ง แพทย์ชำนาญการ สังกัดโรงพยาบาลร้อยเอ็ด) การสร้างราคากลางตัวอย่าง (เช่น ยาสามัญประจำโรงพยาบาล) เพื่อให้ระบบมีข้อมูลเริ่มต้นสำหรับการทดสอบและการใช้งานจริง
  - ทุกหน้าที่มีในระบบจะสามารถเข้าถึงได้โดย Super Admin โดยไม่มีข้อจำกัดใดๆ

- หน้าที่เกี่ยวข้อง(Pages):
  - หน้าที่ใช้สำหรับเลือกจังหวัดและหน่วยงานตอน Login เข้ามาจะต้องเลือกจังหวัดและหน่วยงานที่ต้องการทำงานด้วย โดยข้อมูลนี้จะถูกใช้ในการกำหนดสิทธิ์การเข้าถึงข้อมูลและฟังก์ชันต่างๆ ในระบบตามหน่วยงานที่เลือก และเมื่อเข้าสู่ระบบมาแล้ว Super Admin จะสามารถเข้าไปจัดการข้อมูลทุกอย่างได้ในหน้าจัดการผู้ใช้งาน หน้าจัดการหน่วยงาน หน้าจัดการแผนก หน้าจัดการบทบาท และหน้าจัดการมอบหมายสิทธิ์ รวมถึงสามารถดูรายงานและข้อมูลของทุกหน่วยงานได้อย่างเต็มที่
    - การแสดงผล: เมื่อผู้ใช้งานใหม่เข้ามาที่หน้า Login ระบบจะตรวจสอบว่ามีหน่วยงานและจังหวัดใดบ้างที่ถูกสร้างไว้ในระบบ และจะแสดง Dropdown-list ให้ผู้ใช้งานเลือกจังหวัดและหน่วยงานที่ต้องการทำงานด้วย โดยข้อมูลนี้จะถูกใช้ในการกำหนดสิทธิ์การเข้าถึงข้อมูลและฟังก์ชันต่างๆ ในระบบตามหน่วยงานที่เลือก

### 2. Multi-Tenant & Matrix IAM (ระบบจัดการองค์กรและสิทธิ์ผู้ใช้งาน) ให้สิทธ์การเข้าถึงข้อมูลแบบละเอียดและการจัดการ(แก้ไข เพิ่ม ลบ)เฉาะ ผอ. รองผอ. หัวหน้าแผนก และ Super Admin เท่านั้น

- คำอธิบาย (description):
  - ระบบนี้จะเป็นจุดเริ่มต้นที่สำคัญสำหรับการใช้งานแพลตฟอร์ม โดยผู้บริหารหรือผู้อำนวยการจะสามารถสร้างหน่วยงาน (Tenant) ใหม่ได้เองผ่านระบบ โดยกรอกข้อมูลพื้นฐาน เช่น ชื่อหน่วยงาน ประเภทหน่วยงาน และจังหวัดที่ตั้ง ซึ่งจะมีผลต่อการดึงราคากลางมาใช้ในเอกสารจัดซื้อจัดจ้างของหน่วยงานนั้นๆ พร้อมทั้งสามารถกำหนดโครงสร้างแผนกภายในหน่วยงาน และมอบหมายผู้ใช้งานให้กับแผนกต่างๆ ได้อย่างยืดหยุ่นตามความต้องการของแต่ละหน่วยงานระบบนี้จะต้องรองรับการใช้งานของหลายหน่วยงาน (Multi-Tenant) โดยมีการกั้นข้อมูลด้วย Tenant ID (Agencies_id) เพื่อให้ข้อมูลของแต่ละหน่วยงานไม่ปะปนกัน และสามารถจัดการสิทธิ์การเข้าถึงข้อมูลได้อย่างละเอียดแบบ Matrix IAM ที่ผู้ใช้หนึ่งคนสามารถมีบทบาทและสิทธิ์ในหลายแผนกได้พร้อมกัน

- การทำงานที่เกี่ยวข้อง (logic and rules):
  - Role Design Decision (IMPORTANT for Agents) roles table = Global Templates (ไม่มี agency_id โดยเจตนา).การกำหนดว่าใครมี Role อะไรใน Agency ไหน → ทำผ่าน user_assignments เท่านั้น ห้าม Agent เพิ่ม agency_id ใน roles table
  - เมื่อมีการแก้ไขหรือลบสิทธิ์ของผู้ใช้งานในตาราง `roles` ระบบจะต้องย้อนไปแก้ไขหรือลบข้อมูลการมอบหมายสิทธิ์ใน `user_assignments` ที่เกี่ยวข้องเมื่อมีการลบบทบาท (Role) ออกไป เพื่อให้แน่ใจว่าข้อมูลสิทธิ์ของผู้ใช้งานเป็นปัจจุบันและไม่มีข้อมูลที่ไม่ถูกต้องหลงเหลืออยู่ในระบบ (ทำโดย Super Admin หรือ ผอ. รองผอ. และหัวหน้าแผนก เท่านั้น)
  - การใช้งาน is_primary_unit จะทำได้ดังนี้ เมื่อ Super Admin สร้าง "โรงพยาบาลร้อยเอ็ด" (ผูก province_id = ร้อยเอ็ด) ไว้รอแล้ว ผอ. รองผอ. สร้างแผนกใน org_units โดยจะต้องใส่ข้อมูล parent_id ที่ไม่เป็น null เพราะว่าแผนกสูงสุดจะต้องมี parent_id = null โดยจะสร้างได้เฉพาะ Super Admin เท่านั้น และเมื่อมีการสร้างแผนกสูงสุดแล้วจะต้องมีการกำหนดหัวหน้าหน่วยงาน (head_of_unit_id) ที่เป็น FK โดยคนนี้คือ ผอ. ที่รับผิดชอบทั้งหน่วยงาน และฝากฝังให้ ผอ. ไปสร้างแผนกย่อย (เช่น ศัลยกรรม) ที่มี parent_id อ้างอิงไปยังแผนกสูงสุด (เช่น คณะกรรมการบริหารโรงพยาบาลหรือทีมบริหารโรงพยาบาลขอนแก่น) และเมื่อมีการสร้างแผนกย่อยแล้ว ผอ. รองผอ. หรือหัวหน้าแผนก จะต้องมอบหมายบทบาทให้กับผู้ใช้งานที่อยู่ในแผนกนั้นๆ โดยการสร้าง Record ในตาราง `user_assignments` ซึ่งจะมีการระบุว่าแผนกไหนเป็นสังกัดหลัก (is_primary_unit = True) เพื่อให้ระบบสามารถดึงชื่อแผนกนี้ไปประทับบนหัวกระดาษราชการ และ HR ใช้จ่ายเงินเดือนได้อย่างถูกต้อง เช่น
    เมื่อถึงตอนจัดสิทธิ์ใน user_assignments สมมติว่า นายแพทย์ สมชาย ต้องทำหน้าที่ 2 อย่าง แอดมินจะสร้าง Record 2 บรรทัด:
        แผนก "ศัลยกรรม" / บทบาท "แพทย์" / is_primary_unit = True
        แผนก "พัสดุ" / บทบาท "กรรมการจัดซื้อ" / is_primary_unit = False
  - แต่ละ User จะ login เข้ามาแบบไม่มีสิทธิ์อะไรเลย (Default Role = None) และจะไม่สามารถเข้าถึงข้อมูลใดๆ ได้จนกว่าจะมีการมอบหมายบทบาทและแผนกให้กับผู้ใช้งานนั้นๆ ในตาราง `user_assignments` และการ Login เข้ามาครั้งแรกจะมีฟอร์มให้กรอกข้อมูลส่วนตัวเพิ่มเติม  เช่น เลขบัตรประชาชน ยศ/คำนำหน้า (เช่น นพ.) ระดับตำแหน่ง (เช่น แพทย์ชำนาญการ) และสังกัดหน่วยงาน (เช่น โรงพยาบาลร้อยเอ็ด อ้างอิง agencies ที่มีในระบบแสดงเป็น Dropdown-list ให้เลือก) เพื่อให้ข้อมูลในระบบมีความสมบูรณ์และสามารถนำไปใช้ในการจัดการสิทธิ์และการแสดงข้อมูลต่างๆ ได้อย่างถูกต้อง

- หน้าที่เกี่ยวข้อง(Pages):
  - หน้าสำหรับจัดการโครงสร้างแผนก (Organizational Structure Management) ทำได้เฉพาะ Super Admin ผอ. รองผอ. เท่านั้น
    - หน้านี้จะสามารถสร้าง ลบ และแก้ไขหน่วยงานได้ โดยการสร้างจะต้องกรอกข้อมูลพื้นฐาน เช่น ชื่อหน่วยงาน ประเภทหน่วยงาน จังหวัดที่ตั้ง () หัวหน้าหน่วยงาน ตาม database schema ที่ออกแบบไว้ โดยสามารถกำหนดแผนกแม่-ลูก (Parent-Child Relationship) เพื่อรองรับโครงสร้างองค์กรที่ซับซ้อน ได้ตามความต้องการของแต่ละหน่วยงาน โดยหน่วยงานที่อยู่ลำดับสูงสุด (Root Node) จะต้องมีการกำหนด parent_id = null เพื่อให้ระบบสามารถจัดการโครงสร้างแบบ Tree Hierarchy ได้อย่างถูกต้อง พร้อมกำหนดหัวหน้าหน่วยงาน (head_of_unit_id) ที่เป็น FK ไปยังตาราง users เพื่อให้สามารถแสดงข้อมูลหัวหน้าหน่วยงานได้อย่างถูกต้องในระบบ และเมื่อมีการสร้างหรือแก้ไขหน่วยงาน ระบบจะต้องมีการตรวจสอบความถูกต้องของข้อมูล เช่น ตรวจสอบว่าชื่อหน่วยงานไม่ซ้ำกันภายในระดับเดียวกัน และตรวจสอบว่าหัวหน้าหน่วยงานที่เลือกมีอยู่จริงในระบบ เพื่อป้องกันข้อผิดพลาดในการจัดการโครงสร้างองค์กร
    - การแสดงผล: แสดงเป็นโครงสร้างแบบ Tree View ที่สามารถขยาย-ย่อได้ โดยแสดงชื่อหน่วยงานและหัวหน้าหน่วยงานในแต่ละบรรทัดในการ์ด พร้อมปุ่มสำหรับสร้าง แก้ไข และลบหน่วยงาน และเมื่อคลิกที่หน่วยงานใดๆจะเข้าไปที่หน้าหน้าแสดงรายชื่อผู้ใช้งานที่ได้อยู่ในหน่วยงานนั้นๆ (แบ่งตาม org_unit_id)
  - หน้าสำหรับจัดการจัดการผู้ใช้งาน (User Management) ทำได้เฉพาะ Super Admin เท่านั้น
    - หนัาแรกจะต้อง 2 ส่วนหลักๆ แยกเป็นการ์ดเพื่อให้กดเข้าไปหน้านั้นๆต่อไป คือ
      - ส่วนที่ใช้ในการจัดการสิทธิ์ของผู้ใช้งาน (User Permission Management Section)
        - ส่วนค้นหา (Search Section): มีช่องกรอกข้อมูลสำหรับค้นหาผู้ใช้งาน เช่น ชื่อ-สกุล เลขบัตรประชาชน และแผนกที่สังกัด เพื่อให้สามารถค้นหาผู้ใช้งานได้อย่างรวดเร็วและแม่นยำ
        - การแสดงผล: แสดงผลลัพธ์การค้นหาในรูปแบบตาราง โดยมีคอลัมน์ที่แสดงข้อมูลสำคัญ เช่น ชื่อ-สกุล เลขบัตรประชาชน แผนกที่สังกัด และบทบาทที่ได้รับมอบหมาย(role_id) พร้อมปุ่มสำหรับแก้ไขหรือจัดการสิทธิ์ของผู้ใช้งานแต่ละคนโดยจะเป็นการแก้ไขตาราง user_assignments ตรง role_id และ org_unit_id และสามารถกำหนด is_primary_unit เพื่อระบุว่าแผนกไหนเป็นสังกัดหลักของผู้ใช้งานนั้นๆได้ ตามที่เลือกในส่วนค้นหา
      - ส่วนจัดการสิทธิ์ (Permission Management Section): จะมีดังนี้
        - ส่วนของการสร้างบทบาท (Role Creation): มีฟอร์มสำหรับสร้างบทบาทใหม่ โดยกรอกชื่อบทบาทและเลือกสิทธิ์ที่เกี่ยวข้องกับบทบาทนั้นๆ เช่น สิทธิ์ในการดูหรือแก้ไขข้อมูลในแผนกต่างๆ และเมื่อสร้างบทบาทแล้วจะสามารถนำไปมอบหมายให้กับผู้ใช้งานได้ในส่วนของการจัดการผู้ใช้งาน โดยจะเป็นการสร้าง Record ในตาราง roles และสามารถแก้ไขหรือจัดการบทบาทที่มีอยู่แล้วได้ตามความต้องการของแต่ละหน่วยงาน
        - การแสดงผล: แสดงรายการบทบาทที่มีอยู่ในระบบในรูปแบบตาราง โดยมีคอลัมน์ที่แสดงชื่อบทบาทและสิทธิ์ที่เกี่ยวข้อง พร้อมปุ่มสำหรับแก้ไขหรือจัดการบทบาทแต่ละบทบาท

### 3. Strategic Planning & Budgeting Engine (ระบบบริหารแผนยุทธศาสตร์และงบประมาณ) ให้สิทธ์การเข้าถึงข้อมูลแบบละเอียดและการจัดการ(แก้ไข เพิ่ม ลบ)เฉพาะ Super Admin ผอ. รองผอ. หัวหน้าแผนกแผนงานและประเมินผล และทุกคนในแผนกแผนงานและประเมินผลเท่านั้น

- คำอธิบาย (description):
  - ผู้บริหารหรือผอ. วางสร้างแผนพัฒนาองค์กรและติดตามการพัฒนาแบบปีต่อปี (Year-over-Year) โดยมีการเปรียบเทียบข้อมูลระหว่างปีงบประมาณปัจจุบันและปีงบประมาณก่อนหน้า เพื่อให้เห็นแนวโน้มและผลกระทบของโครงการต่างๆ ที่ดำเนินการไปแล้ว และนำมาเป็นข้อมูลในการวางแผนและตัดสินใจในอนาคตหรือการปรับเปลี่ยนแผนงานในปีงบประมาณปัจจุบัน
  - ระบบนี้จะต้องช่วยให้ผู้บริหารสามารถมองเห็นภาพรวมของแผนงานต่างๆ ที่กำลังดำเนินการอยู่ในปีงบประมาณปัจจุบันและที่ดำเนินการไปแล้วเมื่อปีงบประมาณก่อนหน้า เพื่อนำมาเป็นข้อมูลเปรียบเทียบในการวางแผนและสามารถตัดสินใจได้อย่างมีข้อมูลรองรับ (ผู้บริหารสามารถสร้าง ลบ แก้ไข แผนงานต่างๆในปีงบประมาณปัจจุบันได้ตามสิทธิ์ที่ได้รับมอบหมาย)

- การทำงานที่เกี่ยวข้อง (logic and rules):
  - เมื่อมีการจัดการแผนงาน (เพิ่ม ลบ แก้ไข) จะต้องมีการบันทึกประวัติการเปลี่ยนแปลงอย่างละเอียดใน Audit Trail เพื่อให้สามารถตรวจสอบย้อนหลังได้ว่าใครเป็นคนทำการเปลี่ยนแปลงอะไรไปบ้าง และเมื่อไหร่ เก็บลงไปใน MongoDB (collection plan_budget_histories) โดยจะต้องบันทึกข้อมูลผู้ทำรายการแบบ Denormalized (ฝังข้อมูล) เช่น user_id, name, position, ip_address
  - เมื่อมีการกำหนดแผนถึงแผนระดับล่างสุด (Leaf Node = true) จะสามารถมีการตั้งงบประมาณ (Estimate) หรือเกิดการเบิกจ่ายจริง (Actual) ได้ แล้วระบบจะใช้ Database Trigger ทำการม้วนยอด (Bottom-up) บวกทบขึ้นไปยังแผนระดับบนสุด (parent_id = null) และรวบรวมการตั้งงบประมาณ (Estimate) หรือการเบิกจ่ายจริง (Actual)ไปเก็บไว้ที่ตาราง `fiscal_years` ใน total_estimated_income", "total_estimated_expense", "total_actual_income" และ "total_actual_expense" ตามที่กำหนดโดยอัตโนมัติ เพื่อให้ผู้บริหารสามารถดูภาพรวมของงบประมาณและการใช้จ่ายได้อย่างรวดเร็วโดยไม่ต้องคำนวณจากแผนย่อยทีละแผน (ทำโดย Super Admin หรือ ผอ. ของหน่วยงานนั้นๆ เท่านั้น)
  - ระบบจะต้องมีการตรวจสอบความถูกต้องของข้อมูล เช่น ตรวจสอบว่าแผนงานไม่ซ้ำกันภายในระดับเดียวกัน และตรวจสอบว่าแผนแม่ (ถ้ามี) มีอยู่จริงในระบบ เพื่อป้องกันข้อผิดพลาดในการจัดการโครงสร้างแผนงาน
  - ระบบจะต้องสร้างแผนงานแบบอัตโนมัติเมื่อผ่านพ้นปีงบประมาณปัจจุบัน โดยดึงค่าข้อมูลจากแผนงานในปีงบประมาณก่อนหน้า (ถ้ามี) มาเป็นแม่แบบในการสร้างแผนงานใหม่ในปีงบประมาณถัดไป เพื่อให้การวางแผนในปีถัดไปเป็นไปอย่างรวดเร็วและมีข้อมูลเปรียบเทียบจากปีที่ผ่านมา
  - เพื่อให้ระบบทำงานได้ถูกต้องและแยกความรับผิดชอบ (Separation of Concerns) อย่างชัดเจน Bottom-up Trigger หรือ Database Trigger (การอัพเดท) การจะถูกแบ่งออกเป็น 2 จังหวะ
    - จังหวะที่ 1 (เงินเข้า-ออกบัญชีจริง): เมื่อมีการ INSERT bank_transactions จะมี Trigger ตัวแรกทำงานเพื่อไป UPDATE plans.actual_amount (เฉพาะแผนที่เป็น Leaf Node) รวมถึงไปหักลบยอดใน bank_accounts.balance
    - จังหวะที่ 2 (การ Rollup ตัวเลข): เมื่อตัวเลขในแผน Leaf Node เปลี่ยนไป จะมี Trigger ตัวที่สองที่ดักจับเหตุการณ์ UPDATE plans (ทั้ง estimated_amount และ actual_amount) เพื่อทำหน้าที่ดันยอดที่เปลี่ยนแปลงขึ้นไปหาแผนแม่ (Parent)
  - ถ้า Tree ลึก 5 ชั้นหรือไม่ว่ากี่ชั้น การ Trigger จะต้อง recursive ขึ้นไปทุกชั้นจนถึงจุดสูงสุด (Root) ใน PostgreSQL ให้เขียน Trigger Function โดยใช้ลูป WHILE หรือ Recursive CTE เพื่อไต่ระดับ parent_id ขึ้นไปเรื่อยๆ จนกว่า parent_id จะเป็น NULL จากนั้นจึงนำยอดรวมขั้นสุดท้ายไปอัปเดตที่ตาราง fiscal_years
  - Race condition หากมีเจ้าหน้าที่ 2 คนกดอนุมัติจ่ายเงินจากแผนเดียวกันในเสี้ยววินาทีเดียวกัน ยอดเงินอาจจะถูก Rollup ผิดพลาดได้ การจัดการจะต้องทำ 2 ระดับประสานกัน
    - ระดับ Database (Atomic Update): แทนที่จะเขียนคำสั่งดึงข้อมูลมาก่อนแล้วค่อยบวกค่า (SELECT -> UPDATE) ใน Trigger ต้องใช้การอัปเดตแบบ Atomic เสมอ เช่น UPDATE plans SET actual_amount = actual_amount + $1 WHERE id = $2; การเขียนแบบนี้ PostgreSQL จะทำการล็อก Row นั้นโดยอัตโนมัติ (Row-Level Lock) ระหว่างที่คำนวณ ทำให้ Transaction อื่นที่เข้ามาพร้อมกันต้องรอคิว
    - ระดับ Backend Application: ควบคุมจังหวะที่ละเอียดอ่อนด้วย Database Transaction ไม่ว่าจะพัฒนาระบบฝั่ง Backend ด้วย Node.js หรือใช้งานเครื่องมืออย่าง Ruby on Rails ก็สามารถครอบการทำงานด้วยบล็อก Transaction พร้อมกับใช้คำสั่งล็อกระดับแถว (เช่น การใช้ lock! หรือ SELECT ... FOR UPDATE) เพื่อป้องกันไม่ให้ข้อมูลถูกเปลี่ยนแปลงระหว่างที่ลอจิกฝั่งเซิร์ฟเวอร์กำลังประมวลผลการคำนวณภาษี

- หน้าที่เกี่ยวข้อง(Pages):
  - หน้าสำหรับสร้างและจัดการแผนงาน (Plan Management)
    - หน้านี้จะสามารถสร้าง ลบ และแก้ไขแผนงานได้ โดยการสร้างจะต้องกรอกข้อมูลพื้นฐาน เช่น ชื่อแผน ประเภทแผน (รายรับ/รายจ่าย) งบประมาณที่ตั้งไว้ และสามารถกำหนดความสัมพันธ์แบบแม่-ลูก (Parent-Child Relationship) เพื่อรองรับโครงสร้างแผนงานที่ซับซ้อน ได้ตามความต้องการของแต่ละหน่วยงาน โดยแผนงานที่อยู่ลำดับสูงสุด (Root Node) จะต้องมีการกำหนด parent_id = null เพื่อให้ระบบสามารถจัดการโครงสร้างแบบ Tree Hierarchy ได้อย่างถูกต้อง พร้อมกำหนด is_leaf_node = true เมื่อเป็นแผนระดับล่างสุดที่ไม่สามารถมีแผนย่อยได้อีกต่อไป และเมื่อมีการสร้างหรือแก้ไขแผนงาน ระบบจะต้องมีการตรวจสอบความถูกต้องของข้อมูล เช่น ตรวจสอบว่าชื่อแผนงานไม่ซ้ำกันภายในระดับเดียวกัน และตรวจสอบว่าแผนแม่ (ถ้ามี) มีอยู่จริงในระบบ เพื่อป้องกันข้อผิดพลาดในการจัดการโครงสร้างแผนงาน
    - การแสดงผล: แสดงเป็นโครงสร้างแบบ Tree View ที่สามารถขยาย-ย่อได้ โดยแสดงชื่อแผนงาน ประเภทแผน และงบประมาณที่ตั้งไว้ในแต่ละบรรทัดในการ์ด พร้อมปุ่มสำหรับสร้าง แก้ไข และลบแผนงาน และเมื่อคลิกที่แผนงานใดๆจะเข้าไปที่หน้าหน้าแสดงรายละเอียดของแผนงานนั้นๆ รวมถึงประวัติการเปลี่ยนแปลงของ_PLAN_ใน Audit Trail และมีปุ่มสำหรับสร้างแผนงานย่อย (Sub-Plan) ที่มี parent_id อ้างอิงไปยังแผนงานแม่ และสามารถตั้งงบประมาณ (Estimate) หรือเกิดการเบิกจ่ายจริง (Actual) ได้เมื่อเป็นแผนระดับล่างสุด (is_leaf_node = true)

### 4. Dynamic Procurement Workflow (ระบบจัดซื้อจัดจ้างแบบยืดหยุ่น) ให้สิทธ์การเข้าถึงข้อมูลแบบละเอียดและการจัดการ(แก้ไข เพิ่ม ลบ)เฉพาะ Super Admin ผอ. รองผอ. หัวหน้าแผนกจัดซื้อจัดจ้าง และเจ้าหน้้าที่พัสดุและจัดซื้อจัดจ้าง (Procurement Officer) รวมไปถึงหน่วยงานที่เป็นผู้รับผิดชอบแผนงานนั้นๆ ที่การทำงานจัดซื้อจัดจ้างนั้นเชื่อมโยงอยู่ด้วยเท่านั้น

- คำอธิบาย (description):
  - ระบบนี้จะต้องรองรับกระบวนการจัดซื้อจัดจ้างที่มีความซับซ้อนและหลากหลายโดยมีแม่พิมพ์กระบวนการมาตรฐานหลาย
  ขั้นตอนที่สามารถปรับแต่งได้ตามความต้องการของแต่ละหน่วยงานและสามารถติดตามสถานะของเอกสารจัดซื้อจัดจ้างได้อย่างละเอียดในแต่ละขั้นตอน พร้อมทั้งมีการบันทึกประวัติการอนุมัติและการเปลี่ยนแปลงต่างๆ ที่เกิดขึ้นในกระบวนการจัดซื้อจัดจ้าง เพื่อให้สามารถตรวจสอบย้อนหลังได้อย่างโปร่งใสและมีประสิทธิภาพ

- การทำงานที่เกี่ยวข้อง (logic and rules):
  - ในการจัดทำแผนจัดซื้อจัดจ้างแต่ละแผนงานจะต้องมีการอ้างอิงแผนงานที่เป็นแผนล่างสุด (Leaf Node) ในระบบวางแผนที่มีการตั้งงบประมาณไว้แล้ว เพื่อให้สามารถเชื่อมโยงข้อมูลระหว่างแผนงานและเอกสารจัดซื้อจัดจ้างได้อย่างถูกต้อง
  - เมื่อมีการสร้างเอกสารจัดซื้อจัดจ้างใหม่ ระบบจะต้องมีเฉพาะแผนงานที่มีอยู่จริงในระบบ(มีให้เลือกเฉพาะแผนงานที่มีการสร้างไว้แล้วและเป็นแผนล่างสุด โดยแสดงตามปีงบประมาณปัจจุบันเป็นค่าเริ่มต้น) และมีการตั้งงบประมาณไว้แล้ว เพื่อป้องกันข้อผิดพลาดในการสร้างเอกสารจัดซื้อจัดจ้างที่ไม่ถูกต้อง
  - เมื่อระยะเวลาของแผนงานนั้นได้ผ่านพ้นไปแล้ว (เช่น แผนงานปีงบประมาณ 2566 เมื่อวันที่ 30 กันยายน 2566 ผ่านไปแล้ว) จะต้องไม่สามารถสร้างเอกสารจัดซื้อจัดจ้างใหม่ที่อ้างอิงแผนงานนั้นได้อีกต่อไป
  - ในกรณีที่มีการแก้ไขหรือลบเอกสารจัดซื้อจัดจ้างที่มีการเชื่อมโยงกับแผนงาน ระบบจะต้องย้อนไปแก้ไขหรือลบข้อมูลการเชื่อมโยงในตาราง `plans` ที่เกี่ยวข้อง เพื่อให้แน่ใจว่าข้อมูลการเชื่อมโยงระหว่างแผนงานและเอกสารจัดซื้อจัดจ้างเป็นปัจจุบันและไม่มีข้อมูลที่ไม่ถูกต้องหลงเหลืออยู่ในระบบ (ทำโดย Super Admin หรือ ผอ. รองผอ. และหัวหน้าแผนกจัดซื้อจัดจ้าง เท่านั้น)
  - กรณีที่เป็นแผนการพัฒนาองค์กรทำครั้งเดียวเบิกจ่ายหลายครั้ง (ใน 1 แผนงานจะมีการกำหนดระยะเวลาและงบประมาณแผน 1 ปีแต่จะแบ่งจ่ายรายเดือน เช่นโครงการจ่ายค่าน้ำค่าไฟที่ต้องจ่ายทุกเดือน)
    - เมื่อมีการสร้างเอกสารจัดซื้อจัดจ้างใหม่ที่เชื่อมโยงกับแผนงานนั้น ระบบจะต้องมีการตรวจสอบว่ามีเอกสารจัดซื้อจัดจ้างที่เชื่อมโยงกับแผนงานนั้นอยู่แล้วหรือไม่ ถ้ามีอยู่แล้วจะต้องตรวจสอบสถานะของเอกสารจัดซื้อจัดจ้างที่มีอยู่แล้วว่าเป็น 'REJECTED' หรือ 'APPROVED_PROCUREMENT' หรือไม่ ถ้าไม่ จะต้องแจ้งเตือนผู้ใช้งานอย่างนุ่มนวล (ดีกว่าปล่อยให้ Database พ่น Error ออกมาตรงๆ) เช่น ถ้าระบบ return status 400 พร้อมข้อความ "ไม่สามารถสร้างฎีกาได้ เนื่องจากเอกสารนี้อยู่ระหว่างการทำแผนจัดซื้อจัดจ้าง [Documents ID] กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง"
    - ที่หน้าจอ SvelteKit (UI Design Agent) ในหน้ารายละเอียดแผนงาน (Plan Detail) จะมีปุ่ม "สร้างเอกสารจัดซื้อ" * UI Logic: Frontend ต้องไปอ่านค่าสถานะเอกสารภายใต้แผนนี้มา ถ้าระบบพบว่ามีเอกสารติดสถานะ IN_PROGRESS หรือ งบประมาณคงเหลือ = 0 ให้ เปลี่ยนปุ่มเป็นสีเทา (Disabled) หรือซ่อนปุ่มไปเลย พร้อมแสดง Tooltip เล็กๆ บอกผู้ใช้ว่า "มีเอกสารกำลังดำเนินการอยู่"
  - กรณีที่เป็นแผนการพัฒนาองค์กรแบบโครงการ (ทำแผนรอบเดียวจะ้องทำเองการจัดซื้อจัดจ้างหลายรายการพร้อมกัน)
    - จะต้องมีการสร้างเอกสารจัดซื้อจัดจ้างที่เชื่อมโยงกับแผนงานนั้นได้หลายรายการพร้อมกัน
  - ในการจัดการ (เพิ่ม ลบ แก้ไข) เอกสารจัดซื้อจัดจ้างแต่ละรายการจะต้องมีการบันทึกประวัติการเปลี่ยนแปลงอย่างละเอียดใน Audit Trail เพื่อให้สามารถตรวจสอบย้อนหลังได้ว่าใครเป็นคนทำการเปลี่ยนแปลงอะไรไปบ้าง และเมื่อไหร่ เก็บลงไปที่ MongoDB (doc_payload_histories)
  - ในการยกระดับสถาปัตยกรรม State Machine ให้มีความเป็น Hybrid จะผสมผสานระหว่างตาราง Relational (เพื่อการ Query และทำ Index ที่รวดเร็ว) เข้ากับ JSONB Payload (เพื่อความยืดหยุ่นของเอกสาร) ดังนี้
    - การสร้าง workflows จะเป็นการสร้างวิธีการทำแผนจัดซื้อจัดจ้าง เช่น การจัดซื้อจัดจ้างโดยวิธีเฉพาะเจาะจง, การจัดซื้อจัดจ้างโดยวิธีคัดเลือก และการจัดวื้อจัดจ้างแบบวิธีส่งหนังสือเชิญชวนจะแบ่งเป็นสองวิธีคือ วิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding) และวิธีตลาดอิเล็กทรอนิกส์ (e-market) (ใน Table workflows จะมีอยู่ 4 แบบในตอนเริ่มต้น)
  - โครงสร้างและกลไกการทำงานของ ui_schema สำหรับวิธีคัดเลือก (Selection Method) ในตาราง workflow_steps คอลัมน์ ui_schema จะเป็นตัวบอก Frontend ว่าขั้นตอนนี้คืออะไร และต้องแสดงคอมโพเนนต์ไหนบ้าง
    - (หมายเหตุความยืดหยุ่น: Step ที่ 1, 2 และ 3 สามารถแยกกันทำงานทีละขั้นตอนเพื่อให้ผู้รับผิดชอบแต่ละส่วนเข้ามาทำทีละใบ หรือสามารถนำ components มารวมกัน (Merge) ไว้ใน Step เดียวกัน เพื่อให้เจ้าหน้าที่อัปโหลดเอกสารทั้งหมดพร้อมกันในหน้าจอเดียวก็ได้ และแต่ละขั้นตอนเมื่อผ่านเงื่อนไขในขั้นตอนนั้นๆ แล้วก็จะสามารถปลดล็อก (Unlock) ขั้นตอนถัดไปให้ทำงานได้เรื่อยๆ จนกว่าจะครบทุกขั้นตอน(ถึงขั้นตอนสุดท้าย: is_final_step = true ) ของวิธีคัดเลือกนี้)
    - ขั้นตอนที่ 1: จัดทำรายงานขอซื้อขอจ้าง (PR)
      - ui_schema: {"components": ["budget_input", "single_pdf_uploader"]}
        - เงื่อนไข: ให้กรอกวงเงินงบประมาณ และอัปโหลดไฟล์รายงานขอซื้อขอจ้าง 1 ใบ
    - ขั้นตอนที่ 2: จัดทำร่าง TOR และราคากลาง
      - ui_schema: {"components": [{"type": "committee_selector", "committee_type": "TOR"}, {"type": "committee_selector", "committee_type": "MEDIAN_PRICE"}]}
        - เงื่อนไข: ระบบจะดึง UI เลือกกรรมการมา 2 กล่อง และเมื่อบันทึกข้อมูล Backend จะนำไป INSERT ลงตาราง document_committees โดยแปะป้าย (Tag) คอลัมน์ committee_type ให้แยกจากกันอย่างชัดเจน
    - ขั้นตอนที่ 3: แต่งตั้งคณะกรรมการซื้อหรือจ้าง และคณะกรรมการตรวจรับ
      - ui_schema: {"components": [{"type": "committee_selector", "committee_type": "PROCUREMENT"}, {"type": "committee_selector", "committee_type": "INSPECTION"}]}
        - เงื่อนไข: ใช้ UI กล่องเดิมเป๊ะๆ แค่เปลี่ยน Tag ตอนบันทึกลง Database ให้เป็น 'PROCUREMENT' และ 'INSPECTION' เพื่อแยกความแตกต่างของคณะกรรมการแต่ละประเภท และสามารถดึงข้อมูลไปแสดงในขั้นตอนต่อๆ ไปได้อย่างถูกต้อง
    - ขั้นตอนที่ 4: ส่งหนังสือเชิญชวน
      - ui_schema: {"components": ["vendor_multi_selector", "vendor_invitation_pdf_uploader"], "min_vendors": 3}
        - เงื่อนไข: วิธีคัดเลือกบังคับให้ต้องเชิญชวนผู้ประกอบการที่มีคุณสมบัติตรงตามเงื่อนไข UI จะให้ค้นหาและเลือก Vendor จากตาราง vendors ไม่น้อยกว่า 3 ราย และบังคับให้อัปโหลดไฟล์ PDF จดหมายเชิญคู่กันแบบ 1 ต่อ 1
    - ขั้นตอนที่ 5: ผู้ประกอบการยื่นข้อเสนอ
      - ui_schema: {"components": ["vendor_proposal_receiver"], "write_to_table": "document_bidders"}
        - เงื่อนไข: ดึงรายชื่อ Vendor จาก Step 4 มาแสดง UI ให้เจ้าหน้าที่ติ๊กรับซองเฉพาะคนที่ส่ง พร้อมพิมพ์ราคาที่เสนอและอัปโหลด PDF ใบเสนอราคา (ข้อมูลส่วนนี้จะวิ่งไป INSERT ลงตาราง document_bidders แบบ 1:1)
    - ขั้นตอนที่ 6: พิจารณาผลและประกาศคะแนน
      - ui_schema: {"components": ["bidders_scoring_board", "single_pdf_uploader"], "read_from_table": "document_bidders"}
        - เงื่อนไข: ระบบจะ SELECT ข้อมูลจาก document_bidders เฉพาะรายที่ยื่นซองมาแสดงเป็นตารางให้คณะกรรมการกรอกคะแนน เลือกผู้ชนะ และมีช่องอัปโหลดใบรายงานผลพิจารณา 1 ใบ
    - ขั้นตอนที่ 7: อนุมัติผลการจัดซื้อจัดจ้าง (ใช้รูปแบบ Generic Approval)
      - ui_schema: {"components": ["approval_summary"]}
        - เงื่อนไข: ถ้า approver_role มีค่าเป็น 'DIRECTOR' ระบบจะแสดงข้อมูลสรุปพร้อมปุ่ม "ตรวจสอบและอนุมัติ" เมื่อ ผอ. กด ระบบจะบันทึกข้อมูลลงตาราง approvals
    - ขั้นตอนที่ 8: ประกาศผู้ชนะและลงนามสัญญา
      - ui_schema: {"components": ["contract_details_form", "multi_pdf_uploader"]}
        - เงื่อนไข: กรอกเลขที่สัญญา วันที่เริ่ม-สิ้นสุด และอัปโหลดไฟล์ประกาศผู้ชนะพร้อมไฟล์สัญญาที่ลงนามแล้ว
    - ขั้นตอนที่ 9: ตรวจรับพัสดุ
      - ui_schema: {"components": ["inspection_form", "fine_calculator", "multi_pdf_uploader"]}
        - เงื่อนไข: ระบุวันที่ส่งมอบ ระบบคำนวณค่าปรับอัตโนมัติ (ถ้าส่งช้า) คณะกรรมการตรวจรับกดอนุมัติ และอัปโหลดใบตรวจรับและใบแจ้งหนี้ (Invoice)
    - ขั้นตอนที่ 10: ส่งเรื่องเบิกจ่าย
      - ui_schema: {"components": ["send_to_finance_button"], "trigger": "generate_dika"}
        - เงื่อนไข: กดปุ่มส่งเรื่อง ระบบจะดึงข้อมูลที่เกี่ยวข้องทั้งหมดไป INSERT ลงตาราง dika_vouchers ทันที
    - เมื่อระบบประมวลผลผ่าน ui_schema ในแต่ละขั้น Payload ในตาราง documents จะถูกเติมข้อมูลต่อท้ายไปเรื่อยๆ โดยที่ข้อมูลเชิงสัมพันธ์ (Relational Data) จะถูกส่งไปตารางเป้าหมายเพื่อประโยชน์ในการ Query และนี่คือหน้าตาของ JSONB ในคอลัมน์ payload เมื่อกระบวนการดำเนินมาถึงขั้นตอนสุดท้ายดังนี้ (step_1_pr เป็นเพียงตัวอย่าง ข้อมูลจริงจะต้องไปดึงมาจาก workflow_steps.step_sequence และ workflow_steps.step_name มาเป็นตำกำหนดชื่อใน payload)
    {
        "step_1_pr": {
            "pr_report_pdf_url": "https://storage.../pr_report_123.pdf",
            "budget_amount": 500000
        },
        {
        "step_2_tor": {
            "tor_pdf_url": "https://storage.../tor.pdf",
            "_meta": "บันทึกกรรมการประเภท TOR และ MEDIAN_PRICE ลงตาราง document_committees แล้ว"
        },
        "step_3_committee_order": {
            "committee_order_pdf_url": "https://storage.../order.pdf",
            "_meta": "บันทึกกรรมการประเภท PROCUREMENT และ INSPECTION ลงตาราง document_committees แล้ว"
        }
        },
        "step_4_invitation": {
            "invitation_date": "2026-04-01",
            "invited_vendors": [
            {
                "vendor_id": 101,
                "invitation_pdf_url": "https://storage.../invite_v101.pdf"
            },
            {
                "vendor_id": 102,
                "invitation_pdf_url": "https://storage.../invite_v102.pdf"
            },
            {
                "vendor_id": 103,
                "invitation_pdf_url": "https://storage.../invite_v103.pdf"
            }
            ]
        },
        "step_5_proposals_received": {
            "received_date": "2026-04-10",
            "_meta": "เอกสารใบเสนอราคาจาก Vendor ถูกบันทึกลงตาราง document_bidders แบบ 1:1 เรียบร้อยแล้ว (บ.ซี ไม่มายื่นซอง)"
        },
        "step_6_evaluation_scoring": {
            "evaluation_report_pdf_url": "https://storage.../eval_report.pdf",
            "winner_vendor_id": 102,
            "final_agreed_price": 485000,
            "_meta": "คะแนนของผู้ยื่นซองแต่ละรายและสถานะผู้ชนะ ถูกอัปเดตลงในตาราง document_bidders แล้ว"
        },
        "step_7_approval": {
            "_meta": "ผู้มีอำนาจกดอนุมัติแล้ว ข้อมูลถูกบันทึกลงตาราง approvals",
            "approver": {
                "user_id": 555,
                "name": "นพ. สมชาย ใจดี",
                "position": "ผู้อำนวยการโรงพยาบาลร้อยเอ็ด",
                "approved_at": "2026-04-12T10:30:00Z"
            }
        },
        "step_8_contract": {
            "contract_no": "66/2569",
            "contract_start_date": "2026-04-15",
            "contract_end_date": "2026-05-15",
            "winner_announcement_pdf_url": "https://storage.../announcement.pdf",
            "signed_contract_pdf_url": "https://storage.../signed_contract.pdf"
        },
        "step_9_inspection": {
            "inspection_report_pdf_url": "https://storage.../inspection.pdf",
            "invoice_pdf_url": "https://storage.../invoice.pdf",
            "delivery_date": "2026-05-17",
            "days_late": 2,
            "fine_amount": 2000,
            "approver": {
                "user_id": 444,
                "name": "นาย ตรวจรับ แม่นยำ",
                "position": "ประธานกรรมการตรวจรับพัสดุ",
                "approved_at": "2026-05-18T14:00:00Z"
            }
        },
        "step_10_finance_transfer": {
            "transferred_at": "2026-05-18T15:00:00Z",
            "_meta": "ข้อมูลส่งต่อไปยังตาราง dika_vouchers สำเร็จ เพื่อตั้งเรื่องเบิกจ่ายโอนเงิน 485,000 บาท (หักค่าปรับ 2,000 บาท) ให้ vendor_id: 102"
        }
    }

- หน้าที่เกี่ยวข้อง(Pages):
  - หน้าสำหรับสร้างและจัดการเอกสารจัดซื้อจัดจ้าง (Procurement Document Management)
    - หน้านี้จะสามารถสร้าง ลบ และแก้ไขเอกสารจัดซื้อจัดจ้างได้ โดยการสร้างจะต้องกรอกข้อมูลพื้นฐาน เช่น ชื่อเอกสาร ประเภทเอกสาร (เช่น การจัดซื้อจัดจ้างทั่วไป การจัดซื้อจัดจ้างแบบโครงการ) แผนงานที่เชื่อมโยง (โดยเลือกจากแผนงานที่มีอยู่ในระบบและเป็นแผนล่างสุดที่มีการตั้งงบประมาณไว้แล้ว) และรายละเอียดอื่นๆ ที่เกี่ยวข้องกับเอกสารจัดซื้อจัดจ้างนั้นๆ
      - การแสดงผล: แสดงรายการเอกสารจัดซื้อจัดจ้างในรูปแบบตาราง โดยมีคอลัมน์ที่แสดงชื่อเอกสาร ประเภทเอกสาร แผนงานที่เชื่อมโยง และสถานะของเอกสาร พร้อมปุ่มสำหรับแก้ไขหรือจัดการเอกสารแต่ละรายการ และเมื่อคลิกที่เอกสารใดๆจะเข้าไปที่หน้ารายละเอียดของเอกสารนั้นๆ รวมถึงประวัติการเปลี่ยนแปลงของเอกสารใน Audit Trail และขั้นตอนการทำงานตาม ui_schema ที่กำหนดไว้ใน workflow_steps
  - หน้าสำหรับติดตามสถานะการจัดซื้อจัดจ้าง (Procurement Tracking)
    - หน้านี้จะเป็นหน้ารวมที่แสดงภาพรวมของเอกสารจัดซื้อจัดจ้างทั้งหมดที่อยู่ในระบบของหนว่ยงานนั้นๆ โดยสามารถกรองข้อมูลตามปีงบประมาณ แผนงาน หรือสถานะของเอกสารได้อย่างรวดเร็ว และเมื่อคลิกที่เอกสารใดๆจะเข้าไปที่หน้ารายละเอียดของเอกสารนั้นๆได้
      - การแสดงผล: แสดงรายการเอกสารจัดซื้อจัดจ้างในรูปแบบตาราง โดยมีคอลัมน์ที่แสดงชื่อเอกสาร ประเภทเอกสาร แผนงานที่เชื่อมโยง และสถานะของเอกสาร พร้อมปุ่มสำหรับดูรายละเอียดของเอกสารแต่ละรายการ พอกดเข้าไปแต่ละเอกสารจะเห็นรายละเอียดของเอกสารนั้นๆ และแสดงสถานะของเอกสารว่าปัจจับันอยู่ในขั้นตอนไหนของกระบวนการจัดซื้อจัดจ้าง พร้อมทั้งแสดงข้อมูลใน Payload ที่ถูกเติมเข้ามาในแต่ละขั้นตอนตามที่กำหนดไว้ใน workflow_steps
  - หน้าสำหรับจัดการ Workflow ของการจัดซื้อจัดจ้าง (Workflow Management)
    - หน้านี้จะเป็นหน้าที่ใช้สำหรับสร้างและจัดการ Workflow ของการจัดซื้อจัดจ้าง โดยสามารถกำหนดขั้นตอนต่างๆ ของกระบวนการจัดซื้อจัดจ้างได้อย่างยืดหยุ่นตามความต้องการของแต่ละหน่วยงาน และสามารถกำหนด ui_schema สำหรับแต่ละขั้นตอนเพื่อให้ Frontend สามารถแสดงคอมโพเนนต์ที่เหมาะสมกับแต่ละขั้นตอนของกระบวนการจัดซื้อจัดจ้างได้อย่างถูกต้อง
      - การแสดงผล: แสดงรายการ Workflow ที่มีอยู่ในระบบในรูปแบบตาราง โดยมีคอลัมน์ที่แสดงชื่อ Workflow และรายละเอียดของขั้นตอนต่างๆ พร้อมปุ่มสำหรับแก้ไขหรือจัดการ Workflow แต่ละรายการ และเมื่อคลิกที่ Workflow ใดๆจะเข้าไปที่หน้ารายละเอียดของ Workflow นั้นๆ รวมถึงขั้นตอนต่างๆ ที่กำหนดไว้ใน Workflow และสามารถแก้ไขหรือเพิ่มขั้นตอนใหม่ได้ตามความต้องการของแต่ละหน่วยงาน แต่จะมี Template Workflow ที่สร้างไว้ล่วงหน้าให้เลือกใช้ได้เลยเพื่อความรวดเร็วในการตั้งค่า เช่น วิธีคัดเลือก (Selection Method) ที่ได้อธิบายไปในส่วนของ logic and rules ข้างต้น และสามารถสร้าง Workflow ใหม่จากศูนย์ได้ตามความต้องการของแต่ละหน่วยงาน

### 5. Disbursement, Cashflow & Tax Module (ระบบเบิกจ่าย บัญชี และภาษี) ให้สิทธ์การเข้าถึงข้อมูลแบบละเอียดและการจัดการ(แก้ไข เพิ่ม ลบ)เฉพาะ Super Admin ผอ. รองผอ. หัวหน้าแผนกการเงินและบัญชี และทุกคนในแผนกการเงินและบัญชีเท่านั้น

- คำอธิบาย (description):
  - ระบบนี้จะต้องรองรับการจัดการเบิกจ่ายที่มีความซับซ้อนและหลากหลาย โดยสามารถเชื่อมโยงกับแผนงานที่ตั้งไว้ในระบบวางแผน และสามารถติดตามสถานะของแต่ละการเบิกจ่ายได้อย่างละเอียด พร้อมทั้งมีการบันทึกประวัติการเปลี่ยนแปลงต่างๆ ที่เกิดขึ้นในกระบวนการเบิกจ่าย เพื่อให้สามารถตรวจสอบย้อนหลังได้อย่างโปร่งใสและมีประสิทธิภาพ นอกจากนี้ยังต้องมีการจัดการภาษีหัก ณ ที่จ่ายที่เกี่ยวข้องกับแต่ละการเบิกจ่าย และสามารถรายงานข้อมูลภาษีให้กับสรรพากรได้อย่างถูกต้องและครบถ้วน

- การทำงานที่เกี่ยวข้อง (logic and rules):
  - ในการจัดการเบิกจ่ายแต่ละรายการจะต้องมีการอ้างอิงเอกสารจัดซื้อจัดจ้างที่เกี่ยวข้อง เพื่อให้สามารถเชื่อมโยงข้อมูลระหว่างการเบิกจ่ายและเอกสารจัดซื้อจัดจ้างได้อย่างถูกต้อง
  - ระบบจะต้องมีการตรวจสอบความถูกต้องของข้อมูล เช่น ตรวจสอบว่าฎีกาเบิกจ่ายไม่ซ้ำกันภายในเอกสารจัดซื้อจัดจ้างเดียวกัน โดยใช้วิธีดังนี้
    - ใช้ความสามารถของ PostgreSQL ที่เรียกว่า Partial Unique Index เราจะสร้าง Index พิเศษที่ตาราง dika_vouchers เพื่อบอก Database ว่า "ห้ามมี document_id ซ้ำกันเด็ดขาด ยกเว้นว่าฎีกาอันเก่าจะมีสถานะเป็น PAID หรือ REJECTED ไปแล้ว
    - ก่อนที่ SvelteKit Server Action จะสั่ง INSERT ลง Database ควรมีการเช็คข้อมูลก่อนว่าในแผนจัดซื้อจัดจ้างนั้นๆมีฎีกาเบิกจ่ายอยู่แล้วหรือไม่ ถ้ามีอยู่แล้วมีสถานะเป็น 'REJECTED' หรือ 'PAID' หรือไม่ ถ้าไม่ จะต้องแจ้งเตือนผู้ใช้งานอย่างนุ่มนวล (ดีกว่าปล่อยให้ Database พ่น Error ออกมาตรงๆ) เช่น ถ้าระบบ return status 400 พร้อมข้อความ "ไม่สามารถสร้างฎีกาได้ เนื่องจากเอกสารนี้อยู่ระหว่างการเบิกจ่าย [Dika ID] กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง"
    - ที่หน้าจอ SvelteKit (UI Design Agent) ในหน้ารายละเอียดแผนงาน (Plan Detail) จะมีปุ่ม "สร้างเอกสารจัดซื้อ" * UI Logic: Frontend ต้องไปอ่านค่าสถานะเอกสารภายใต้แผนนี้มา ถ้าระบบพบว่ามีเอกสารติดสถานะ DRAFT, IN_PROGRESS หรือ งบประมาณคงเหลือ = 0 ให้ เปลี่ยนปุ่มเป็นสีเทา (Disabled) หรือซ่อนปุ่มไปเลย พร้อมแสดง Tooltip เล็กๆ บอกผู้ใช้ว่า "มีเอกสารกำลังดำเนินการอยู่"
  - ในการจัดการภาษีใดๆ ระบบจะต้องมีการคำนวณภาษีโดยอัตโนมัติเมื่อมีการสร้างหรือแก้ไขการเบิกจ่ายที่เกี่ยวข้องกับเอกสารจัดซื้อจัดจ้างที่มีการตั้งงบประมาณไว้แล้ว และต้องมีการบันทึกข้อมูลการหักภาษีหักที่จ่ายลงในตาราง dika_vouchers และเก็บยอกเงินที่จ่ายภาษีไปไว้ในบัญชีที่เอาไว้สำหรับเก็บภาษีโดยเฉพาะ (เช่น bank_accounts ที่มี account_type = 'TAX')
  - เมื่อสิ้นสุดกระบวนการเบิกจ่ายแล้ว (สถานะเป็น PAID) ระบบจะต้องมีการอัปเดตยอดเงินในแผนงานที่เกี่ยวข้องโดยอัตโนมัติ และต้องเก็บประวัติการเปลี่ยนแปลงยอดเงินในบัญชีที่นำเงินอออกมาจ่าย หรือบัชีที่เกี่ยวข้องใน bank_accounts ลงใน MongoDB (collection bank_transaction_histories) โดยจะต้องบันทึกข้อมูลผู้ทำรายการแบบ Denormalized (ฝังข้อมูล) เช่น user_id, name, position, ip_address และข้อมูลการเปลี่ยนแปลงยอดเงิน เช่น amount_changed, previous_balance, new_balance เพื่อให้สามารถตรวจสอบย้อนหลังได้ว่าใครเป็นคนทำการเปลี่ยนแปลงยอดเงินอะไรไปบ้าง และเมื่อไหร่
  - เมื่อมีการอัปเดตยอดเงินในแผนงานที่เกี่ยวข้องแล้ว ระบบจะต้องมีการ Trigger เพื่อม้วนยอด (Bottom-up) บวกทบขึ้นไปยังแผนระดับบนสุด (parent_id = null) และรวบรวมการตั้งงบประมาณ (Estimate) หรือการเบิกจ่ายจริง (Actual)ไปเก็บไว้ที่ตาราง `fiscal_years` ใน total_estimated_income", "total_estimated_expense", "total_actual_income" และ "total_actual_expense" ตามที่กำหนดโดยอัตโนมัติ

- หน้าที่เกี่ยวข้อง(Pages):
  - หน้าสำหรับจัดการการเบิกจ่าย (Disbursement Management)
    - หน้านี้จะสามารถสร้าง ลบ และแก้ไขการเบิกจ่ายได้ โดยการสร้างจะต้องกรอกข้อมูลพื้นฐาน เช่น ชื่อผู้ขอเบิก จำนวนเงินที่ขอเบิก เอกสารจัดซื้อจัดจ้างที่เกี่ยวข้อง และรายละเอียดอื่นๆ ที่เกี่ยวข้องกับการเบิกจ่ายนั้นๆ
      - การแสดงผล: แสดงรายการการเบิกจ่ายในรูปแบบตาราง โดยมีคอลัมน์ที่แสดงชื่อผู้ขอเบิก จำนวนเงินที่ขอเบิก เอกสารจัดซื้อจัดจ้างที่เกี่ยวข้อง และสถานะของการเบิกจ่าย พร้อมปุ่มสำหรับแก้ไขหรือจัดการการเบิกจ่ายแต่ละรายการ และเมื่อคลิกที่การเบิกจ่ายใดๆจะเข้าไปที่หน้ารายละเอียดของการเบิกจ่ายนั้นๆ รวมถึงประวัติการเปลี่ยนแปลงของการเบิกจ่ายใน Audit Trail 
  - หน้าสำหรับรายงานภาษี (Tax Reporting)
    - หน้านี้จะเป็นหน้าที่ใช้สำหรับรายงานข้อมูลภาษีให้กับสรรพากร โดยสามารถเลือกช่วงเวลาที่ต้องการรายงาน และระบบจะทำการคำนวณและสรุปข้อมูลภาษีหัก ณ ที่จ่ายที่เกิดขึ้นในช่วงเวลานั้นๆ และสามารถดาวน์โหลดรายงานในรูปแบบไฟล์ CSV ได้
      - การแสดงผล: แสดงข้อมูลสรุปภาษีที่จ่ายในรูปแบบตาราง โดยมีคอลัมน์ที่แสดงชื่อผู้ขอเบิก จำนวนเงินที่ขอเบิก ภาษีที่จ่ายที่เกี่ยวข้อง และวันที่ของการเบิกจ่าย พร้อมปุ่มสำหรับดาวน์โหลดรายงานในรูปแบบไฟล์ CSV และมีปุ่มสำหรับกดส่งภาษีไปยังสรรพากรผ่าน API ของกรมสรรพากร (ถ้ามีการเชื่อมต่อ) และแสดงสถานะการส่งภาษีว่า "ส่งสำเร็จ" หรือ "ส่งไม่สำเร็จ" พร้อมรายละเอียดของข้อผิดพลาดถ้ามี
  - หน้าสำหรับจัดการบัญชีธนาคาร (Bank Account Management)
    - หน้านี้จะเป็นหน้าที่ใช้สำหรับจัดการบัญชีธนาคารที่เกี่ยวข้องกับการเบิกจ่าย โดยสามารถสร้าง ลบ และแก้ไขบัญชีธนาคารได้ โดยการสร้างจะต้องกรอกข้อมูลพื้นฐาน เช่น ชื่อธนาคาร เลขที่บัญชี ประเภทบัญชี และรายละเอียดอื่นๆ ที่เกี่ยวข้องกับบัญชีธนาคารนั้นๆ
      - การแสดงผล: แสดงรายการบัญชีธนาคารในรูปแบบตาราง โดยมีคอลัมน์ที่แสดงชื่อธนาคาร เลขที่บัญชี ประเภทบัญชี และยอดเงินปัจจุบัน พร้อมปุ่มสำหรับแก้ไขหรือจัดการบัญชีธนาคารแต่ละรายการ และเมื่อคลิกที่บัญชีธนาคารใดๆจะเข้าไปที่หน้ารายละเอียดของบัญชีธนาคารนั้นๆ รวมถึงประวัติการเปลี่ยนแปลงยอดเงินในบัญชีนั้นๆ ใน Audit Trail

### 6. Polyglot Audit Trail (ระบบกล้องวงจรปิดติดตามการเปลี่ยนแปลง)

- คำอธิบาย (description):
  - ระบบนี้จะต้องมีการบันทึกประวัติการเปลี่ยนแปลงของข้อมูลใน table plan, bank_transaction and documents ในระบบอย่างละเอียดและโปร่งใส โดยใช้เทคโนโลยี Polyglot Persistence ที่ผสมผสานระหว่าง Relational Database (PostgreSQL) สำหรับข้อมูลหลัก และ NoSQL Database (MongoDB) สำหรับบันทึกประวัติการเปลี่ยนแปลงที่มีความยืดหยุ่นสูง

- การทำงานที่เกี่ยวข้อง (logic and rules):
  - ในทุกๆ การเปลี่ยนแปลงข้อมูลที่สำคัญในตาราง plans, bank_transaction และ documents ไม่ว่าจะเป็นการสร้าง แก้ไข หรือ ลบ ข้อมูล ระบบจะต้องทำการบันทึกประวัติการเปลี่ยนแปลงนั้นๆ ลงใน MongoDB โดยจะต้องบันทึกข้อมูลผู้ทำรายการแบบ Denormalized (ฝังข้อมูล) เช่น user_id, name, position, ip_address และข้อมูลการเปลี่ยนแปลง เช่น action_type (CREATE, UPDATE, DELETE), changed_data (ข้อมูลที่ถูกเปลี่ยนแปลง), previous_data (ข้อมูลก่อนเปลี่ยนแปลง), changed_at (เวลาที่เกิดการเปลี่ยนแปลง) เพื่อให้สามารถตรวจสอบย้อนหลังได้ว่าใครเป็นคนทำการเปลี่ยนแปลงอะไรไปบ้าง และเมื่อไหร่
  - ในการบันทึกประวัติการเปลี่ยนแปลงใน MongoDB จะต้องมีการจัดเก็บข้อมูลในรูปแบบที่สามารถค้นหาและเรียกดูได้อย่างมีประสิทธิภาพ เช่น การสร้าง Index ใน MongoDB เพื่อให้สามารถค้นหาประวัติการเปลี่ยนแปลงตาม user_id, action_type หรือช่วงเวลาที่เกิดการเปลี่ยนแปลงได้อย่างรวดเร็ว และต้องมีการจัดเก็บข้อมูลในรูปแบบที่สามารถแสดงผลได้อย่างชัดเจนเมื่อเรียกดูประวัติการเปลี่ยนแปลงในหน้าจอ SvelteKit (UI Design Agent)
  - ในหน้าจอ SvelteKit (UI Design Agent) จะต้องมีการแสดงประวัติการเปลี่ยนแปลงของข้อมูลในรูปแบบที่เข้าใจง่าย โดยสามารถกรองข้อมูลตาม user_id, action_type หรือช่วงเวลาที่เกิดการเปลี่ยนแปลงได้ และเมื่อคลิกที่ประวัติการเปลี่ยนแปลงใดๆ จะต้องแสดงรายละเอียดของการเปลี่ยนแปลงนั้นๆ รวมถึงข้อมูลผู้ทำรายการและข้อมูลที่ถูกเปลี่ยนแปลงอย่างชัดเจน เพื่อให้ผู้ใช้งานสามารถตรวจสอบย้อนหลังได้อย่างโปร่งใสและมีประสิทธิภาพ

- หน้าที่เกี่ยวข้อง(Pages):
  - หน้าสำหรับดูภาพรวมประวัติการเปลี่ยนแปลง (Change History Overview)
    - หน้านี้จะเป็นหน้าที่ใช้สำหรับดูภาพรวมของประวัติการเปลี่ยนแปลงทั้งหมดในระบบ โดยจะแสดงรายการให้กดเพื่อไปยังหน้าอื่นๆ ที่แสดงประวัติการเปลี่ยนแปลงของแต่ละประเภทข้อมูล เช่น แผนงาน การเบิกจ่าย และเอกสารจัดซื้อจัดจ้าง โดยสามารถกรองข้อมูลตาม user_id, action_type หรือช่วงเวลาที่เกิดการเปลี่ยนแปลงได้อย่างรวดเร็ว และเมื่อคลิกที่ประเภทข้อมูลใดๆ จะเข้าไปที่หน้ารายละเอียดของประวัติการเปลี่ยนแปลงนั้นๆ ได้
      - การแสดงผล: แสดงรายการประเภทข้อมูลที่มีการเปลี่ยนแปลงในรูปแบบตาราง โดยมีคอลัมน์ที่แสดงประเภทข้อมูลและจำนวนรายการที่มีการเปลี่ยนแปลง พร้อมปุ่มสำหรับดูรายละเอียดของประวัติการเปลี่ยนแปลงแต่ละประเภท และเมื่อคลิกที่ประเภทข้อมูลใดๆจะเข้าไปที่หน้ารายละเอียดของประวัติการเปลี่ยนแปลงนั้นๆ รวมถึงข้อมูลผู้ทำรายการและข้อมูลที่ถูกเปลี่ยนแปลงอย่างชัดเจน โดยจะมีหน้าดังนี้
        - หน้าสำหรับดูประวัติการเปลี่ยนแปลงของแผนงาน (Plan Change History)
          - หน้านี้จะเป็นหน้าที่ใช้สำหรับดูประวัติการเปลี่ยนแปลงของข้อมูลในตาราง plans โดยสามารถกรองข้อมูลตาม user_id, action_type หรือช่วงเวลาที่เกิดการเปลี่ยนแปลงได้ และเมื่อคลิกที่ประวัติการเปลี่ยนแปลงใดๆ จะต้องแสดงรายละเอียดของการเปลี่ยนแปลงนั้นๆ รวมถึงข้อมูลผู้ทำรายการและข้อมูลที่ถูกเปลี่ยนแปลงอย่างชัดเจน เพื่อให้ผู้ใช้งานสามารถตรวจสอบย้อนหลังได้อย่างโปร่งใสและมีประสิทธิภาพ
            - การแสดงผล: แสดงรายการประวัติการเปลี่ยนแปลงของแผนงานในรูปแบบตาราง
        - หน้าสำหรับดูประวัติการเปลี่ยนแปลงของการเบิกจ่าย (Disbursement Change History)
          - หน้านี้จะเป็นหน้าที่ใช้สำหรับดูประวัติการเปลี่ยนแปลงของข้อมูลในตาราง bank_transaction โดยสามารถกรองข้อมูลตาม user_id, action_type หรือช่วงเวลาที่เกิดการเปลี่ยนแปลงได้ และเมื่อคลิกที่ประวัติการเปลี่ยนแปลงใดๆ จะต้องแสดงรายละเอียดของการเปลี่ยนแปลงนั้นๆ รวมถึงข้อมูลผู้ทำรายการและข้อมูลที่ถูกเปลี่ยนแปลงอย่างชัดเจน เพื่อให้ผู้ใช้งานสามารถตรวจสอบย้อนหลังได้อย่างโปร่งใสและมีประสิทธิภาพ
            - การแสดงผล: แสดงรายการประวัติการเปลี่ยนแปลงของการเบิกจ่ายในรูปแบบตาราง
        - หน้าสำหรับดูประวัติการเปลี่ยนแปลงของเอกสารจัดซื้อจัดจ้าง (Procurement Document Change History)
          - หน้านี้จะเป็นหน้าที่ใช้สำหรับดูประวัติการเปลี่ยนแปลงของข้อมูลในตาราง documents โดยสามารถกรองข้อมูลตาม user_id, action_type หรือช่วงเวลาที่เกิดการเปลี่ยนแปลงได้ และเมื่อคลิกที่ประวัติการเปลี่ยนแปลงใดๆ จะต้องแสดงรายละเอียดของการเปลี่ยนแปลงนั้นๆ รวมถึงข้อมูลผู้ทำรายการและข้อมูลที่ถูกเปลี่ยนแปลงอย่างชัดเจน เพื่อให้ผู้ใช้งานสามารถตรวจสอบย้อนหลังได้อย่างโปร่งใสและมีประสิทธิภาพ
            - การแสดงผล: แสดงรายการประวัติการเปลี่ยนแปลงของเอกสารจัดซื้อจัดจ้างในรูปแบบตาราง

## SvelteKit Directory Structure (Routing & Folders)

All agents MUST strictly follow this route and folder convention to prevent file collision:
/src
 ├── /lib
 │    ├── /components    # UI Agent: Svelte components (buttons, tables, forms)
 │    ├── /server        # Fullstack Agent: Server-only code
 │    │    ├── /db       # Drizzle schema.ts, db connection, mongodb connection
 │    │    └── /auth     # JWT jose logic
 │    └── /types         # Shared TypeScript interfaces (Contracts)
 ├── /routes
 │    ├── /(auth)        # Login page (/login)
 │    ├── /(app)         # Main layout for logged-in users (contains Navbar, Sidebar)
 │    │    ├── /dashboard        # Overview
 │    │    ├── /planning         # Strategic Planning & Budgeting
 │    │    ├── /procurement      # Dynamic Procurement Workflow
 │    │    ├── /finance          # Disbursement & Cashflow
 │    │    ├── /audit            # Polyglot Audit Trail
 │    │    └── /admin            # Super Admin & Multi-Tenant IAM
 └── app.d.ts            # MUST define `App.Locals` with the `JWTPayload` user object

## Drizzle ORM Schema Standard (Reference implementation)

When the Fullstack Agent creates src/lib/server/db/schema.ts, use drizzle-orm/pg-core.
CRITICAL RULE: For the Partial Unique Index in dika_vouchers and documents, you MUST use Drizzle's uniqueIndex().where() syntax.
Example Contract:
import { pgTable, serial, integer, numeric, varchar, boolean, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
// Example: Dika Vouchers Table with Partial Index
export const dikaVouchers = pgTable('dika_vouchers', {
  id: serial('id').primaryKey(),
  document_id: integer('document_id').notNull().references(() => documents.id),
  // ... other fields
  status: varchar('status', { length: 50 }).notNull(), // 'PENDING_EXAMINE', 'PAID', 'REJECTED'
}, (table) => {
  return {
    // CRITICAL: Partial Unique Index to prevent double billing
    uniqueActiveDika: uniqueIndex('idx_unique_active_dika')
      .on(table.document_id)
      .where(sql`status NOT IN ('REJECTED', 'CANCELLED')`)
  };
});

## JWT Payload Contract (Stateless Auth)

The jose library MUST sign and verify this exact payload. The Fullstack Agent will inject this into event.locals.user via hooks.server.ts. The UI Agent will read this from data.user in +layout.svelte.
// /src/lib/types/auth.ts
export interface JWTPayload {
  sub: number;                  // users.id
  id_card: string;              // users.id_card
  name: string;                 // users.name
  agency_id: number;            // agencies.id (Tenant Isolation)
  is_super_admin: boolean;      // bypasses all checks if true
  primary_org_unit_id: number | null;
  // Matrix Permissions (Derived from roles and user_assignments during login)
  permissions: {
    can_manage_users: boolean;
    can_manage_plans: boolean;
    can_manage_procurement: boolean;
    can_manage_finance: boolean;
  };
  exp?: number;
}

## 4. SvelteKit Form Action Response Contract

All +page.server.ts actions MUST return a standard shape. The UI Agent MUST design forms that expect this shape for error handling (form?.errors) using Svelte's use:enhance.
// /src/lib/types/api.ts
export interface ActionResponse<T = any> {
  success: boolean;
  message?: string; // e.g., "บันทึกข้อมูลสำเร็จ"
  errors?: Record<string, string[]>; // Zod formatted field errors e.g., { budget_amount: ["ระบุตัวเลขที่ถูกต้อง"] }
  data?: T;
}
Fullstack Agent Rule: Always use return fail(400, { success: false, errors: zodError.flatten().fieldErrors }) for validation errors.

## Environment Variables Contract (.env.example)

Both Agents must assume these environment variables exist. Never hardcode secrets.
''' [Database Connections]
    DATABASE_URL="postgres://user:password@localhost:5432/erp_db"
    MONGODB_URI="mongodb://localhost:27017/erp_audit_db"
    [Authentication]
    JWT_SECRET="generate_a_strong_random_secret_string_here_min_32_chars"
    NODE_ENV will dictate Secure cookies (true in production, false in dev)
'''

## Authentication Flow & Middleware (hooks.server.ts)

The Fullstack Agent MUST implement the exact authentication lifecycle in SvelteKit's hooks.server.ts using jose and httpOnly cookies.

- Auth Flow Rules
  - Request Intercept: Every request checks for the accessToken cookie.
  - Token Verification:
    - If accessToken is valid: Decode and inject JWTPayload into event.locals.user.
    - If accessToken is expired/missing: Check refreshToken cookie.
    - If refreshToken is valid: Generate a new accessToken (15 min), set the new cookie, and inject event.locals.user.
    - If both are invalid/missing: Redirect to /login (except for /login or /api/auth routes).
  - Role-Based Access Control (RBAC) in Hooks:
    - After setting event.locals.user, check the requested URL path.
    - Example: If url.pathname.startsWith('/planning'), check if (!user.permissions.can_manage_plans && !user.is_super_admin) throw redirect(303, '/unauthorized');

## Role & Permission Matrix Contract (JSONB Structure)

The roles.permissions column in the database MUST strictly follow this JSON object structure. Agents must use these exact keys when checking permissions.

- Permission Schema (Zod Equivalent):
  - JSON
        {
        "system": {
            "can_manage_users": false,
            "can_manage_org_units": false
        },
        "planning": {
            "can_create_plan": true,
            "can_edit_plan": true,
            "can_delete_plan": false
        },
        "procurement": {
            "can_create_document": true,
            "can_approve_document": false
        },
        "finance": {
            "can_create_dika": true,
            "can_approve_dika": false
        },
        "audit": {
            "can_view_audit_trail": false
        }
        }
- UI Agent Rule: Use these boolean flags from data.user.permissions to conditionally render buttons (e.g., Hide the "อนุมัติฎีกา" button if can_approve_dika is false).

## File Upload Strategy & Constraints

Since this is a government system handling sensitive PDFs, the file upload mechanism must be standardized.

- Upload Contracts:
  - Storage Provider: S3-compatible storage (e.g., MinIO or AWS S3). DO NOT save files to the local file system.
  - File Validation: - Strict MIME Type checking: application/pdf ONLY.
  - Size Limit: Maximum 20MB per file.
  - URL Pattern: Files must be stored and referenced in the DB using this exact path structure:
    https://[STORAGE_DOMAIN]/agencies/[agency_id]/procurements/[document_id]/[step_name]_[timestamp].pdf
  - Backend Implementation: The SvelteKit action receives FormData, validates it via Zod, streams the buffer to S3 via aws-sdk-client-s3, and saves the returned URL to the JSONB payload.

## Database Trigger: Bottom-Up Rollup (PL/pgSQL Template)

The Fullstack Agent MUST use this logic when generating the Drizzle migration for the financial rollup. Do not invent a different rollup logic.

- PL/pgSQL Reference for Agent:
  - SQL
        -- Trigger Function for rolling up Actual/Estimated amounts
        CREATE OR REPLACE FUNCTION rollup_plan_budget()
        RETURNS TRIGGER AS $$
        DECLARE
            current_parent_id INTEGER;
            diff_actual NUMERIC;
            diff_estimated NUMERIC;
            root_fiscal_year_id INTEGER;
        BEGIN
            -- Calculate difference
            diff_actual := NEW.actual_amount - COALESCE(OLD.actual_amount, 0);
            diff_estimated := NEW.estimated_amount - COALESCE(OLD.estimated_amount, 0);

            current_parent_id := NEW.parent_id;
            root_fiscal_year_id := NEW.fiscal_year_id;

            -- 1. Recursive Rollup using WHILE loop to climb the tree
            WHILE current_parent_id IS NOT NULL LOOP
                UPDATE plans 
                SET actual_amount = actual_amount + diff_actual,
                    estimated_amount = estimated_amount + diff_estimated
                WHERE id = current_parent_id
                RETURNING parent_id INTO current_parent_id;
            END LOOP;

            -- 2. Update the root fiscal_year table
            UPDATE fiscal_years
            SET total_actual_expense = total_actual_expense + diff_actual,
                total_estimated_expense = total_estimated_expense + diff_estimated
            WHERE id = root_fiscal_year_id;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Attach trigger to plans table (only trigger when leaf node updates)
        CREATE TRIGGER trigger_rollup_plan_budget
        AFTER UPDATE OF actual_amount, estimated_amount ON plans
        FOR EACH ROW
        WHEN (NEW.is_leaf_node = true)
        EXECUTE FUNCTION rollup_plan_budget();

## Super Admin Definition & God Mode

The "Super Admin" is a system-level entity that transcends individual agencies.

- Schema Updates & Rules:
  - In users table: Add column is_super_admin BOOLEAN DEFAULT FALSE.
  - In users table: agency_id MUST be nullable (INTEGER NULL). If is_super_admin is true, agency_id is usually NULL (meaning they have global access).
  - God Mode Logic: In hooks.server.ts and all backend API checks, the absolute first condition must be:
    if (user.is_super_admin) return true; // Bypass all matrix permissions and agency isolations
  - UI Logic: The Super Admin dashboard will see a dropdown to "Impersonate / View as Agency [X]", which sets a temporary session variable to scope the queries to a specific agency_id.

## Role-Based Dashboard Contract (/dashboard)

The UI and Fullstack Agents MUST dynamically render the dashboard based on event.locals.user.permissions and is_super_admin. Do NOT build a single generic dashboard.

- Dashboard Widgets & Routing Rules:
  - Super Admin (is_super_admin: true): Sees System-wide metrics (Total Agencies, Active Users, System Health) and a dropdown to impersonate agencies.
  - Executive/Director (ผอ./รอง ผอ.): Sees "Budget Overview Chart" (Actual vs Estimated), "Pending Approvals" (Action required), and "Project Status Summary".
  - Planning Dept: Sees "Fiscal Year Progress", "Budget Utilization by Plan", and "Recent Plan Changes".
  - Procurement/Finance Dept: Sees "My Active Tasks" (Documents in progress), "Recent Dika Vouchers", and "Pending Tax Submissions".
  - Implementation Rule: Use SvelteKit await blocks in +page.svelte to stream widget data without blocking the initial page load.

## Notification System Contract (In-App Alerts)

A system with state machines requires notifications to move tasks forward.

- Database Schema Addition:
  - Table notifications: id (PK), user_id (FK -> users), title (VARCHAR), message (TEXT), action_url (VARCHAR - e.g., /procurement/105), is_read (BOOLEAN DEFAULT FALSE), created_at (TIMESTAMP).

- Workflow Triggers:
  - The Fullstack Agent MUST insert a notification record when:
  - A document enters a state requiring approval (Notify the approver_role users).
  - A Dika voucher is created and needs examination (Notify Finance).
  - A document is Rejected (Notify the creator updated_by).
  - UI Agent Rule: Implement a Notification Bell in the Navbar with an unread badge. Clicking a notification updates is_read = true via a server action and redirects to the action_url.

## Standardized Pagination & Sorting Parameters

All list pages (Tables) and API endpoints MUST strictly adhere to this URL Search Parameter convention to ensure consistency.

- URL Standard:?page=1&limit=20&sort_by=created_at&sort_order=desc

- Fullstack Agent Rule (Drizzle Implementation):
  - TypeScript
        // SvelteKit Load Function Standard
        const page = Number(url.searchParams.get('page')) || 1;
        const limit = Number(url.searchParams.get('limit')) || 20;
        const sortBy = url.searchParams.get('sort_by') || 'created_at';
        const sortOrder = url.searchParams.get('sort_order') || 'desc';
        const offset = (page - 1) * limit;
        // Drizzle query MUST include:
        // .limit(limit).offset(offset).orderBy(sortOrder === 'desc' ? desc(table[sortBy]) : asc(table[sortBy]))
- UI Agent Rule: Build a reusable <Pagination /> component that reads/writes to $page.url.searchParams using goto(..., { keepFocus: true }).

## Search & Filter Conventions

Searching and filtering must be uniform across all modules.

- URL Standard:
  - Global Text Search: ?q=... (Searches primary text fields like document name, user name, or plan title).
  - Exact Match Filters: ?status=IN_PROGRESS or ?fiscal_year_id=2

- Database Query Rule:
  - For q: The Fullstack Agent MUST use PostgreSQL ILIKE for case-insensitive partial matching (e.g., ilike(plans.title, \%${q}%`)`).
  - For Filters: Use strict equality eq().
  - UI Agent Rule: Debounce the search input (?q=) by 300ms before submitting the form to prevent spamming the database.

## Fiscal Year Auto-Create Logic (Lazy Initialization)

Do NOT use external Cron Jobs for creating the new Fiscal Year (to keep the infrastructure simple). Instead, use "Lazy Initialization" triggered by user access.

- Logic for Fullstack Agent:
  - When an Admin or Planning Officer accesses the /planning route:
    - Determine the current Thai Fiscal Year based on the current date:
      - If today is between Oct 1 and Dec 31, Fiscal Year = Current Year + 544.
      - If today is between Jan 1 and Sep 30, Fiscal Year = Current Year + 543.
    - Check if this year_name exists in the fiscal_years table for their agency_id.
    - If it does NOT exist:
      - Automatically INSERT the new fiscal_years record.
    - Run a background function to copy plans from the previous year (where is_recurring = true or carried_forward_amount > 0).
    - Set the old year's is_active = false and the new year's is_active = true.

## Database Seeding & Migration Strategy

The Fullstack Agent MUST implement a robust seeding mechanism using Drizzle ORM to ensure all environments (Dev, Staging, Prod) have the required Master Data.

- Seeding Contract (src/lib/server/db/seed.ts):
  - Data to Seed:
    1. provinces (All 77 provinces of Thailand).
    2. workflows and workflow_steps (The default templates like "วิธีคัดเลือก" and "วิธีเฉพาะเจาะจง").
    3. roles (Default system roles: SUPER_ADMIN, DIRECTOR, PROCUREMENT_OFFICER, FINANCE_OFFICER).
    4. banks (Major Thai banks with standard bank codes).
- Execution: Provide a package.json script ("db:seed": "tsx src/lib/server/db/seed.ts") that uses INSERT ... ON CONFLICT DO NOTHING to prevent duplicate seeding errors.

## Rate Limiting & Security Headers

Government systems are prime targets for attacks. The SvelteKit application MUST enforce security at the middleware level.

- Security Contract (hooks.server.ts):
  - Security Headers: Inject strict HTTP headers in the handle hook:
    - TypeScript
        response.headers.set('X-Frame-Options', 'DENY'); // Prevent Clickjacking
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  - Rate Limiting: Implement IP-based rate limiting for critical routes (e.g., /api/auth/login max 5 requests/minute). The Fullstack agent can use a lightweight memory cache or Redis (if available) to track requests by event.getClientAddress().

## Soft Delete Policy (CRITICAL FOR AUDIT)

In a financial and procurement ERP, data is NEVER truly deleted.

- Database Schema & Query Rules:
  - Schema Update: All major tables (users, plans, documents, agencies, dika_vouchers) MUST include a deleted_at: timestamp('deleted_at', { withTimezone: true }) column.
  - Fullstack Agent Rule: - ABSOLUTELY NO db.delete(table) commands are allowed.
    - To delete, use db.update(table).set({ deleted_at: new Date() }).
    - All SELECT queries MUST append .where(isNull(table.deleted_at)) to filter out deleted records, unless the user is viewing the "Recycle Bin" or Audit Trail.
- Major Tables ที่ต้องมี deleted_at (ครบถ้วน): users, plans, documents, agencies, dika_vouchers, org_units, vendors, bank_accounts, notifications

## Timezone & DateTime Standard (UTC to Asia/Bangkok)

Timezone bugs in financial systems cause severe reporting errors. Agents must strictly follow this timezone boundary.

- Timezone Contracts:
  - Database (PostgreSQL & MongoDB): Store all timestamps in pure UTC (TIMESTAMP WITH TIME ZONE in Postgres, ISODate in Mongo).
  - Backend APIs: Always use new Date() (which is UTC by default in Node.js) for inserting or updating records.
  - Frontend (UI Agent): Format timestamps to Asia/Bangkok (UTC+7) and display the year in Thai Buddhist Era (พ.ศ.).
  - Implementation Tool: Use Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok' }) or date-fns-tz for rendering dates in Svelte components.

## Print / Export Specification (Government Forms)

Public sector systems require exact PDF generation for official forms (e.g., forms with the Thai Garuda emblem / ตราครุฑ).

- Export & Print Contracts:
  - Official PDF Forms (e.g., Dika Vouchers, PR Reports): - The Fullstack Agent MUST use a server-side PDF generation library (e.g., puppeteer, playwright, or pdfmake).
    - Fonts: MUST embed and use official Thai government fonts (e.g., TH Sarabun PSK or TH Sarabun New).
  - Data Tables & Reports: - The UI Agent MUST implement a "Print View" using CSS @media print (hiding sidebars, navbars, and buttons) for simple tabular data.
    - The Fullstack Agent MUST provide CSV/Excel export endpoints using libraries like exceljs or standard CSV stringification, setting the correct Content-Type: text/csv; charset=utf-8 header with BOM (Byte Order Mark) to ensure Thai characters render correctly in MS Excel.