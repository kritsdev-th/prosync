# ERP_Enterprise_Architecture: ระบบ ERP จัดซื้อ เบิกจ่าย และบริหารงบประมาณภาครัฐ

## Tech Stack

- Frontend & Backend: SvelteKit (TypeScript, +page.server.ts actions & load functions)
- ORM: Drizzle ORM
- Primary Database: PostgreSQL
- Audit Database: MongoDB (via mongodb driver — NOT Mongoose)
- Auth: JWT via jose — Access Token 15 min + Refresh Token 7 days, httpOnly cookies (XSS-safe), stateless (role + permission embedded in token, no IAM query per request)
- Password Hashing: argon2 (via @node-rs/argon2)
- Styling: Tailwind CSS

---

## Login Credential Contract

- **Fields**: id_card (เลขบัตรประชาชน 13 หลัก) + password
- **Auth Flow**:
  1. User กรอก id_card + password ที่ `/login`
  2. `SELECT id, password_hash, agency_id, ... FROM users WHERE id_card = $1 AND deleted_at IS NULL`
  3. `argon2.verify(password_hash, password)`
  4. ผ่าน → ดึง user_assignments ทั้งหมด → merge permissions → sign JWT → set httpOnly cookies
  5. ไม่ผ่าน → `fail(400, { errors: { id_card: ["เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง"] } })`
  - > ห้ามระบุว่า field ไหนผิด เพื่อป้องกัน user enumeration attack

---

## Database Tables

### Master & Multi-Tenant

- **provinces**: `id` (PK), `name`

- **agencies**: `id` (PK/TenantID), `name`, `agency_type`, `province_id` (FK→provinces)
  - province_id กำหนดว่า agency นี้ต้องดึงราคากลางของจังหวัดนั้นมาใช้เท่านั้น

- **median_prices**: `id` (PK), `category`, `item_name`, `price` NUMERIC(15,2), `province_id` (FK), `effective_date`

---

### Organization & IAM

- **users**:
  - `id` (PK), `password_hash` VARCHAR(255) **[ห้าม SELECT ในปกติ — ใช้เฉพาะ Login]**
  - `agency_id` (FK, **NULLABLE** — NULL = Super Admin), `is_super_admin` BOOLEAN DEFAULT FALSE
  - `id_card` VARCHAR(13) UNIQUE, `position`, `position_rank`, `name`, `email`

- **org_units**: `id` (PK), `agency_id` (FK), `name`, `parent_id` (FK self-ref), `head_of_unit_id` (FK→users)

- **roles**: `id` (PK), `name`, `permissions` JSONB
  - > **CRITICAL DESIGN DECISION**: roles = Global Templates — **ไม่มี agency_id โดยเจตนา** การผูก Role กับ Agency ทำผ่าน `user_assignments` เท่านั้น

- **user_assignments**: `id` (PK), `user_id` (FK), `role_id` (FK), `org_unit_id` (FK), `is_primary_unit` BOOLEAN
  - is_primary_unit = true → ระบบดึงชื่อแผนกนี้ไปประทับหัวกระดาษราชการ + HR เงินเดือน

---

### Bank, Tax & Cashflow

- **bank**: `id` (PK), `bank_code` UNIQUE, `name`, `logo_url`

- **bank_accounts**: `id` (PK), `agency_id` (FK), `bank_id` (FK), `account_name`, `account_number`, `balance` NUMERIC(15,2), `is_tax_pool` BOOLEAN
  - is_tax_pool = true → บัญชีพักภาษีก่อนส่งสรรพากร

- **bank_transactions**: `id` (PK), `bank_account_id` (FK), `transaction_type` [IN/OUT/BORROW_TAX/REPAY_TAX/PAY_TAX], `amount`, `plan_id` (FK), `dika_voucher_id` (FK), `action_by_user_id` (FK), `tags` JSONB, `created_at`

- **tax_transactions**: `id` (PK), `agency_id` (FK), `dika_voucher_id` (FK), `vendor_id` (FK), `tax_id` VARCHAR(13), `tax_rate` NUMERIC(5,2), `tax_base_amount`, `tax_amount`, `tax_form_type` [เช่น ภ.ง.ด.53], `status` [WITHHELD/SUBMITTED]

---

### Planning & Rollup

- **fiscal_years**: `id` (PK), `agency_id` (FK), `year_name` VARCHAR(4), `is_active` BOOLEAN, `total_estimated_income`, `total_estimated_expense`, `total_actual_income`, `total_actual_expense` — ทุก field NUMERIC(15,2) อัปเดตอัตโนมัติจาก Bottom-Up Trigger

- **plans**: `id` (PK), `agency_id` (FK), `fiscal_year_id` (FK), `title`, `parent_id` (FK self-ref), `is_leaf_node` BOOLEAN, `is_recurring` BOOLEAN [ใช้ copy ไปปีถัดไป], `plan_type` [INCOME/EXPENSE], `estimated_amount` NUMERIC(15,2), `actual_amount` NUMERIC(15,2) DEFAULT 0

---

### Workflow & Dika

- **workflows**: `id` (PK), `name`, `total_steps`
  - 4 templates เริ่มต้น: วิธีเฉพาะเจาะจง, วิธีคัดเลือก, e-bidding, e-market

- **workflow_steps**: `id` (PK), `workflow_id` (FK), `step_sequence`, `step_name`, `ui_schema` JSONB, `required_pdfs` JSONB, `approver_role`, `is_final_step` BOOLEAN

- **documents**: `id` (PK), `agency_id` (FK), `workflow_id` (FK), `plan_id` (FK→plans is_leaf_node=true), `current_step_id`, `payload` JSONB, `status` [IN_PROGRESS/APPROVED_PROCUREMENT/REJECTED], `updated_by` (FK)

- **approvals**: `id` (PK), `document_id` (FK), `step_id` (FK), `user_id` (FK), `action` [APPROVED/REJECTED], `comment` TEXT [**บังคับเมื่อ REJECTED** — Zod min(10)], `created_at` TIMESTAMP WITH TIME ZONE
  - Unique Index: (document_id, step_id) — ป้องกัน approve ซ้ำ
  - เมื่อ REJECTED → document.status = REJECTED + INSERT notification ไปหา updated_by

- **document_committees**: `id` (PK), `document_id` (FK), `user_id` (FK), `committee_type` [TOR/MEDIAN_PRICE/PROCUREMENT/INSPECTION], `role_in_committee`

- **document_bidders**: `id` (PK), `document_id` (FK), `vendor_id` (FK), `proposal_pdf_url`, `proposed_price`, `score`, `is_winner` BOOLEAN, `submitted_at`

- **vendors**: `id` (PK), `vendor_type`, `tax_id` VARCHAR(13) UNIQUE, `company_name`, `contact_person`, `contact_email`, `contact_phone`

- **dika_vouchers**: `id` (PK), `agency_id` (FK), `document_id` (FK), `vendor_id` (FK), `plan_id` (FK), `payment_bank_account_id` (FK), `tax_pool_account_id` (FK), `gross_amount`, `fine_amount`, `tax_amount`, `net_amount` — ทุก field NUMERIC(15,2), `status` [PENDING_EXAMINE/PAID/REJECTED], `examiner_id` (FK), `director_id` (FK)
  - **Partial Unique Index**: ห้าม document_id ซ้ำ เว้นแต่ status IN ('PAID','REJECTED')

- **notifications**: `id` (PK), `user_id` (FK), `title`, `message`, `action_url`, `is_read` BOOLEAN DEFAULT FALSE, `created_at`, `deleted_at`

---

### Audit Trail (MongoDB collections)

- **plan_budget_histories**: `_id`, `plan_id`, `agency_id`, `action_type` [MANUAL_ADJUST/SYSTEM_EXPEND/...], `changes` {estimated_amount:{old,new}, actual_amount:{old,new}}, `action_by` {user_id, name, position, ip_address}, `created_at`

- **doc_payload_histories**: `_id`, `document_id`, `agency_id`, `step_id`, `action_type`, `payload_snapshot`, `diff`, `action_by` {user_id, name, ip_address}, `created_at`

- **bank_transaction_histories**: `_id`, `bank_transaction_id`, `agency_id`, `action_type`, `amount_change` {old, new}, `action_by` {user_id, name, ip_address}, `created_at`

---

## Soft Delete Policy — ทุก Major Table ต้องมี `deleted_at` (TIMESTAMP WITH TIME ZONE)

Tables: `users, plans, documents, agencies, dika_vouchers, org_units, vendors, bank_accounts, notifications`

- ห้าม `db.delete()` — ใช้ `db.update().set({ deleted_at: new Date() })` เท่านั้น
- ทุก SELECT ต้อง `.where(isNull(table.deleted_at))` เว้นแต่ดู Audit Trail

---

## Timezone Standard

- **DB (PostgreSQL & MongoDB)**: UTC เสมอ (`TIMESTAMP WITH TIME ZONE` / ISODate)
- **Backend**: `new Date()` (Node.js default UTC)
- **Frontend**: แปลงเป็น Asia/Bangkok (UTC+7) + พ.ศ. ก่อนแสดงผลทุกครั้ง

---

## System Overview

ระบบ ERP ภาครัฐสำหรับวางแผนงบประมาณ จัดซื้อจัดจ้าง และบริหารโครงการ รองรับ Multi-Tenant (กั้นด้วย agency_id) + Matrix IAM + Polyglot Audit Trail

**Personas**:
- ผอ. / รองผอ. (Executive) — ดูภาพรวม อนุมัติ
- หัวหน้า/เจ้าหน้าที่แผนงาน (Planning) — สร้าง/จัดการแผน
- หัวหน้า/เจ้าหน้าที่พัสดุ (Procurement) — จัดการเอกสารจัดซื้อ
- หัวหน้า/เจ้าหน้าที่การเงิน (Finance) — เบิกจ่าย ภาษี
- ผู้ตรวจสอบภายใน (Auditor) — ดู Audit Trail เท่านั้น

---

## Core Systems & Business Rules

### 1. Super Admin System

**สิทธิ์**: God Mode — เข้าถึงทุก page ทุก agency ไม่มีข้อจำกัด

**Rules**:
- `users.is_super_admin = true` + `agency_id = NULL`
- **God Mode check ต้องเป็น condition แรกเสมอ**: `if (user.is_super_admin) return true`
- Impersonation: เก็บ `impersonated_agency_id` ใน httpOnly cookie TTL 1 ชั่วโมง — queries ใน (app) layout ใช้ค่านี้ก่อน JWT agency_id

**Seed Data ที่ต้องมี**:
- Roles พื้นฐาน: ผอ., รองผอ., หัวหน้าแผนก, พัสดุ, การเงิน
- หน่วยงาน: โรงพยาบาลร้อยเอ็ด (province=ร้อยเอ็ด)
- แผนก: ศัลยกรรม, พัสดุ
- ผู้ใช้ตัวอย่าง: นพ.สมชาย แพทย์ชำนาญการ
- ราคากลางตัวอย่าง: ยาสามัญประจำโรงพยาบาล

**Pages**:
- `/login`: Dropdown เลือกจังหวัด → หน่วยงาน ก่อน login
- `/admin`: จัดการ Users, Agencies, Org Units, Roles, Assignments + ปุ่ม Impersonate

---

### 2. Multi-Tenant & Matrix IAM

**สิทธิ์จัดการ**: Super Admin, ผอ., รองผอ., หัวหน้าแผนก

**Rules**:
- Root org_unit (parent_id = null) สร้างได้เฉพาะ Super Admin เท่านั้น — ต้องกำหนด head_of_unit_id = ผอ.
- ลบ Role → cascade soft-delete user_assignments ที่เกี่ยวข้อง
- User ใหม่: Default = ไม่มีสิทธิ์จนกว่าจะมี user_assignments — Login ครั้งแรกกรอก id_card, position, position_rank, agency
- 1 user มีได้หลาย user_assignments (Matrix) — is_primary_unit = true ได้แค่ 1 รายการ

**Pages**:
- Org Structure (Tree View): สร้าง/แก้/ลบ org_units — คลิกดูรายชื่อ users ใน unit
- User Management: ค้นหา users → แก้ user_assignments | จัดการ Roles + Permission JSONB

---

### 3. Strategic Planning & Budgeting Engine

**สิทธิ์จัดการ**: Super Admin, ผอ., รองผอ., ทีมแผนงาน

**Rules**:
- ทุก CRUD บน plans → INSERT `plan_budget_histories` ใน MongoDB (Denormalized: user_id, name, position, ip_address)
- เฉพาะ Leaf Node (is_leaf_node=true) เท่านั้นที่ตั้ง estimated_amount / รับ actual_amount
- ชื่อแผนห้ามซ้ำกันในระดับเดียวกัน (same parent_id + fiscal_year_id)
- **Bottom-Up Trigger 2 จังหวะ**:
  - จังหวะ 1: INSERT bank_transactions → UPDATE plans.actual_amount (leaf) + UPDATE bank_accounts.balance
  - จังหวะ 2: UPDATE plans → WHILE loop rollup ขึ้น parent ทุกชั้น → UPDATE fiscal_years
- **Race Condition**: ใช้ Atomic UPDATE (`actual_amount = actual_amount + $1`) + `SELECT ... FOR UPDATE` ใน transaction
- **Fine Calculation**: `fine_amount = contract_price × 0.001 × days_late` (0.1%/วัน ตามระเบียบพัสดุภาครัฐ)
- **Fiscal Year Auto-Create** (Lazy Init): ตรวจสอบทุกครั้งที่เข้า /planning — ถ้าปีปัจจุบันยังไม่มีใน fiscal_years → INSERT อัตโนมัติ + copy plans ที่ is_recurring=true จากปีก่อน

**Pages**:
- `/planning` (Tree View): สร้าง/แก้/ลบ plans — คลิกดู Detail + Audit Trail + สร้างแผนย่อย — ตั้งงบได้เฉพาะ is_leaf_node=true

---

### 4. Dynamic Procurement Workflow

**สิทธิ์จัดการ**: Super Admin, ผอ., รองผอ., หัวหน้าพัสดุ, เจ้าหน้าที่พัสดุ, หน่วยงานที่รับผิดชอบแผนนั้น

**Rules**:
- เอกสารต้องผูก plan ที่ is_leaf_node=true + มี estimated_amount > 0 + fiscal year ยังไม่หมดอายุ (≤ 30 ก.ย.)
- ถ้ามีเอกสาร IN_PROGRESS อยู่ → ห้ามสร้างใหม่ → return 400 + ข้อความ graceful | UI: Disable ปุ่ม + Tooltip
- 1 plan สามารถมีหลาย documents ได้ (กรณีโครงการหลายรายการ) — แต่ต้อง check สถานะก่อนเสมอ
- ทุก CRUD บน documents → INSERT `doc_payload_histories` ใน MongoDB
- แต่ละ step ปลดล็อกได้เมื่อผ่านเงื่อนไขครบ — is_final_step=true → ส่งต่อไป dika_vouchers

**ui_schema วิธีคัดเลือก (10 ขั้นตอน)**:

| Step | ชื่อ | components | เป้าหมาย |
|------|------|------------|----------|
| 1 | จัดทำ PR | budget_input, single_pdf_uploader | กรอกวงเงิน + PDF |
| 2 | TOR + ราคากลาง | committee_selector×2 (TOR, MEDIAN_PRICE) | INSERT document_committees |
| 3 | แต่งตั้งกรรมการ | committee_selector×2 (PROCUREMENT, INSPECTION) | INSERT document_committees |
| 4 | ส่งหนังสือเชิญ | vendor_multi_selector, vendor_invitation_pdf_uploader, min_vendors:3 | เชิญ ≥3 vendors + PDF 1:1 |
| 5 | รับข้อเสนอ | vendor_proposal_receiver → document_bidders | tick รับซอง + ราคา + PDF |
| 6 | ประกาศคะแนน | bidders_scoring_board, single_pdf_uploader | กรอกคะแนน + เลือกผู้ชนะ |
| 7 | อนุมัติ (DIRECTOR) | approval_summary | ผอ. กด → INSERT approvals |
| 8 | ลงนามสัญญา | contract_details_form, multi_pdf_uploader | เลขสัญญา + วันที่ + PDF |
| 9 | ตรวจรับ | inspection_form, fine_calculator, multi_pdf_uploader | วันส่งมอบ + คำนวณค่าปรับ |
| 10 | ส่งเบิกจ่าย | send_to_finance_button (trigger: generate_dika) | INSERT dika_vouchers |

Payload JSONB ใน documents สะสมข้อมูลทุก step โดยใช้ `workflow_steps.step_sequence` + `step_name` เป็น key เช่น `step_1_pr`, `step_2_tor` ฯลฯ

**Pages**:
- `/procurement`: List เอกสาร (กรอง fiscal_year/plan/status) + Detail (พร้อม ui_schema renderer + Audit Trail)
- `/procurement/workflows`: จัดการ Workflow templates + สร้างใหม่

---

### 5. Disbursement, Cashflow & Tax

**สิทธิ์จัดการ**: Super Admin, ผอ., รองผอ., ทีมการเงิน

**Rules**:
- ทุก dika ต้องผูก document ที่ APPROVED_PROCUREMENT
- **Partial Unique Index** บน dika_vouchers: ห้าม document_id ซ้ำ เว้นแต่ status IN ('PAID','REJECTED')
- Pre-INSERT check: ถ้ามี dika active อยู่แล้ว → return 400 + ข้อความ graceful
- คำนวณภาษีอัตโนมัติ → INSERT tax_transactions → โอนไป bank_accounts.is_tax_pool=true
- เมื่อ PAID → Trigger rollup plans.actual_amount → INSERT `bank_transaction_histories` ใน MongoDB

**Pages**:
- `/finance/dika`: List + Detail + Audit Trail
- `/finance/tax`: กรองช่วงเวลา + Export CSV + ปุ่มส่งสรรพากร
- `/finance/bank-accounts`: List + Detail + Transaction History

---

### 6. Polyglot Audit Trail

**สิทธิ์**: Auditor + Super Admin + ผอ. (view-only)

**Rules**:
- ทุก CREATE/UPDATE/DELETE บน plans, documents, bank_transactions → INSERT MongoDB ทันที
- MongoDB Index บน: `agency_id`, `action_by.user_id`, `action_type`, `created_at`

**Pages**:
- `/audit`: Overview → 3 sub-pages (Plan History / Disbursement History / Procurement Doc History)
- ทุก page: กรอง user_id/action_type/date range — คลิก record ดู diff

---

## SvelteKit Directory Structure

**ทุก Agent ต้องปฏิบัติตาม** — ห้ามสร้างไฟล์นอก structure นี้:

```
/src
 ├── /lib
 │    ├── /components        # UI Agent: Svelte components
 │    ├── /server
 │    │    ├── /db            # schema.ts, db.ts (Drizzle), mongodb.ts
 │    │    └── /auth          # JWT jose logic
 │    └── /types              # Shared TypeScript interfaces (Contracts)
 ├── /routes
 │    ├── /(auth)             # /login
 │    └── /(app)              # Navbar + Sidebar layout
 │         ├── /dashboard
 │         ├── /planning
 │         ├── /procurement
 │         ├── /finance
 │         ├── /audit
 │         └── /admin
 └── app.d.ts                 # App.Locals ต้องมี user: JWTPayload
```

---

## JWT Payload Contract (Shared between all agents)

```typescript
// /src/lib/types/auth.ts — ห้ามเปลี่ยนโครงสร้างนี้
export interface JWTPayload {
  sub: number;                        // users.id
  id_card: string;
  name: string;
  agency_id: number | null;           // null = Super Admin
  is_super_admin: boolean;
  primary_org_unit_id: number | null;
  permissions: {
    system:      { can_manage_users: boolean; can_manage_org_units: boolean };
    planning:    { can_create_plan: boolean; can_edit_plan: boolean; can_delete_plan: boolean };
    procurement: { can_create_document: boolean; can_approve_document: boolean };
    finance:     { can_create_dika: boolean; can_approve_dika: boolean };
    audit:       { can_view_audit_trail: boolean };
  };
  exp?: number;
}
```

---

## Form Action Response Contract (Shared between all agents)

```typescript
// /src/lib/types/api.ts — ทุก +page.server.ts action ต้อง return shape นี้
export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;                    // เช่น "บันทึกข้อมูลสำเร็จ"
  errors?: Record<string, string[]>;  // Zod field errors
  data?: T;
}
```

---

## Role & Permission Matrix (JSONB Structure for `roles.permissions`)

```json
{
  "system":      { "can_manage_users": false, "can_manage_org_units": false },
  "planning":    { "can_create_plan": true, "can_edit_plan": true, "can_delete_plan": false },
  "procurement": { "can_create_document": true, "can_approve_document": false },
  "finance":     { "can_create_dika": true, "can_approve_dika": false },
  "audit":       { "can_view_audit_trail": false }
}
```

---

## File Upload Constraints

- **Storage**: S3-compatible (MinIO / AWS S3) — ห้าม local filesystem
- **MIME**: `application/pdf` เท่านั้น — max **20MB**
- **URL Pattern**: `https://[STORAGE_DOMAIN]/agencies/[agency_id]/procurements/[document_id]/[step_name]_[timestamp].pdf`

---

## Database Trigger: Bottom-Up Rollup (PL/pgSQL Spec)

```sql
CREATE OR REPLACE FUNCTION rollup_plan_budget()
RETURNS TRIGGER AS $$
DECLARE
    current_parent_id   INTEGER;
    diff_actual         NUMERIC;
    diff_estimated      NUMERIC;
    root_fiscal_year_id INTEGER;
BEGIN
    diff_actual     := NEW.actual_amount    - COALESCE(OLD.actual_amount, 0);
    diff_estimated  := NEW.estimated_amount - COALESCE(OLD.estimated_amount, 0);
    current_parent_id   := NEW.parent_id;
    root_fiscal_year_id := NEW.fiscal_year_id;

    WHILE current_parent_id IS NOT NULL LOOP
        UPDATE plans
        SET actual_amount    = actual_amount    + diff_actual,
            estimated_amount = estimated_amount + diff_estimated
        WHERE id = current_parent_id
        RETURNING parent_id INTO current_parent_id;
    END LOOP;

    UPDATE fiscal_years
    SET total_actual_expense    = total_actual_expense    + diff_actual,
        total_estimated_expense = total_estimated_expense + diff_estimated
    WHERE id = root_fiscal_year_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rollup_plan_budget
AFTER UPDATE OF actual_amount, estimated_amount ON plans
FOR EACH ROW WHEN (NEW.is_leaf_node = true)
EXECUTE FUNCTION rollup_plan_budget();
```

---

## Role-Based Dashboard Contract

| Role | Widgets |
|------|---------|
| Super Admin | System metrics (Agencies, Users, Health) + Impersonate dropdown |
| ผอ./รองผอ. | Budget Chart (Actual vs Estimated) + Pending Approvals + Project Status |
| Planning | Fiscal Year Progress + Budget Utilization + Recent Plan Changes |
| Procurement/Finance | My Active Tasks + Recent Dika + Pending Tax Submissions |

---

## Notification System

**Trigger ต้อง INSERT notification เมื่อ**:
- Document ถึง step ที่ต้องอนุมัติ → notify users ที่มี approver_role
- Dika สร้างใหม่รอตรวจ → notify Finance team
- Document ถูก Rejected → notify `documents.updated_by`

---

## Environment Variables

```env
DATABASE_URL="postgres://user:password@localhost:5432/erp_db"
MONGODB_URI="mongodb://localhost:27017/erp_audit_db"
JWT_SECRET="min_32_chars_random_string_here"
S3_ENDPOINT="https://..."
S3_BUCKET="erp-documents"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
# NODE_ENV controls Secure cookie flag (true in production)
```
