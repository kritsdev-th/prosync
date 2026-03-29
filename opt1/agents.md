# ERP Agent Working Instructions

> อ่าน `system-prompt.md` ก่อนเสมอ — ไฟล์นี้บอกเฉพาะ **วิธีทำงาน** ของแต่ละ Agent

---

## Orchestrator Rules

**Role**: ผู้ประสานงาน multi-agent team — **ห้ามเขียน code เอง**

**หน้าที่**: plan → design contracts → delegate → verify → integrate

**Workflow ทุกครั้งที่รับ task**:
1. **Define Contract**: ออกแบบ TypeScript Interfaces / Zod Schemas ก่อนเสมอ — ส่งให้ทุก agent ยึดก่อน start
2. **Parallel Delegation**: มอบหมายให้ Fullstack Agent + UI Agent ทำงานพร้อมกันจาก contract เดียวกัน
3. **QA**: ส่งให้ Debug Agent → Tester Agent
4. **Integration Review**: ตรวจ security (JWT/httpOnly) + architecture ก่อน deliver

**Output ที่ต้องออกแบบก่อน delegate ทุกครั้ง**:
- TypeScript interface ของ load function return value
- TypeScript interface ของ form action payload
- Zod schema สำหรับ validate input
- MongoDB document shape ถ้า feature นั้นมี audit trail

---

## Fullstack Agent Rules

**Output**: `+page.server.ts`, `+server.ts`, `hooks.server.ts`, `src/lib/server/**`

### TypeScript
- **ห้าม `any`** — define specific types/interfaces ทุก function parameter และ return value
- ใช้ `async/await` + `try/catch` ทุก async operation
- Import types จาก `/src/lib/types/` เสมอ — ห้าม redefine

### API Design
- RESTful: GET=read, POST=create, PUT/PATCH=update — **ห้าม `db.delete()`** (ดู Soft Delete)
- Validate ทุก input ด้วย Zod ก่อน query DB เสมอ
- Return `fail(400, { success: false, errors: zodError.flatten().fieldErrors })` สำหรับ validation errors
- Return shape ต้องตรง `ActionResponse<T>` จาก `/src/lib/types/api.ts` เสมอ

### Drizzle ORM
```typescript
import { pgTable, serial, integer, varchar, boolean, jsonb,
         timestamp, uniqueIndex, isNull, desc, asc } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Partial Unique Index — ใช้ pattern นี้สำหรับ dika_vouchers
export const dikaVouchers = pgTable('dika_vouchers', {
  id: serial('id').primaryKey(),
  document_id: integer('document_id').notNull().references(() => documents.id),
  status: varchar('status', { length: 50 }).notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
  // ... other fields
}, (table) => ({
  uniqueActiveDika: uniqueIndex('idx_unique_active_dika')
    .on(table.document_id)
    .where(sql`status NOT IN ('REJECTED', 'PAID') AND deleted_at IS NULL`)
}));

// ทุก SELECT ต้องมี isNull filter
const results = await db.select().from(plans)
  .where(and(eq(plans.agency_id, agencyId), isNull(plans.deleted_at)));

// Soft delete เสมอ — ห้าม db.delete()
await db.update(plans).set({ deleted_at: new Date() }).where(eq(plans.id, id));
```

### Authentication Middleware (hooks.server.ts)
```typescript
export const handle: Handle = async ({ event, resolve }) => {
  // 1. ดึง accessToken
  const accessToken = event.cookies.get('accessToken');

  try {
    // 2. Verify access token
    const { payload } = await jwtVerify(accessToken, secret);
    event.locals.user = payload as JWTPayload;
  } catch {
    // 3. Access token หมดอายุ → ลอง refresh
    const refreshToken = event.cookies.get('refreshToken');
    if (refreshToken) {
      try {
        const { payload } = await jwtVerify(refreshToken, secret);
        const newAccess = await createAccessToken(payload as JWTPayload);
        event.cookies.set('accessToken', newAccess, { httpOnly: true, path: '/', maxAge: 900 });
        event.locals.user = payload as JWTPayload;
      } catch {
        // refresh token หมดอายุ → redirect login
        if (!event.url.pathname.startsWith('/login') && !event.url.pathname.startsWith('/api/auth')) {
          throw redirect(303, '/login');
        }
      }
    }
  }

  // 4. RBAC — God Mode check ต้องเป็น condition แรกเสมอ
  const user = event.locals.user;
  if (user && !user.is_super_admin) {
    const path = event.url.pathname;
    if (path.startsWith('/planning')    && !user.permissions.planning.can_create_plan)    throw redirect(303, '/unauthorized');
    if (path.startsWith('/procurement') && !user.permissions.procurement.can_create_document) throw redirect(303, '/unauthorized');
    if (path.startsWith('/finance')     && !user.permissions.finance.can_create_dika)     throw redirect(303, '/unauthorized');
    if (path.startsWith('/audit')       && !user.permissions.audit.can_view_audit_trail)  throw redirect(303, '/unauthorized');
    if (path.startsWith('/admin')       && !user.permissions.system.can_manage_users)     throw redirect(303, '/unauthorized');
  }

  // 5. Security Headers
  const response = await resolve(event);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
};
```

### Pagination (ทุก list endpoint)
```typescript
// +page.server.ts load function standard
export const load: PageServerLoad = async ({ url, locals }) => {
  const page      = Number(url.searchParams.get('page'))       || 1;
  const limit     = Number(url.searchParams.get('limit'))      || 20;
  const sortBy    = url.searchParams.get('sort_by')            || 'created_at';
  const sortOrder = url.searchParams.get('sort_order')         || 'desc';
  const q         = url.searchParams.get('q')                  || '';
  const offset    = (page - 1) * limit;

  const items = await db.select().from(plans)
    .where(and(
      isNull(plans.deleted_at),
      eq(plans.agency_id, locals.user.agency_id!),
      q ? ilike(plans.title, `%${q}%`) : undefined
    ))
    .orderBy(sortOrder === 'desc' ? desc(plans[sortBy]) : asc(plans[sortBy]))
    .limit(limit).offset(offset);

  return { items, page, limit };
};
```

### Search
- `?q=` → ILIKE: `ilike(table.column, \`%${q}%\`)`
- `?status=`, `?fiscal_year_id=` → strict `eq()`
- ห้ามใช้ `LIKE` — ใช้ `ILIKE` เสมอ (case-insensitive)

### Audit Trail (MongoDB)
```typescript
// ทุกครั้งที่ CRUD บน plans, documents, bank_transactions ต้อง insert MongoDB ด้วย
import { getMongoDb } from '$lib/server/db/mongodb';

async function insertAuditLog(collection: string, doc: object) {
  const db = await getMongoDb();
  await db.collection(collection).insertOne({
    ...doc,
    created_at: new Date(),
  });
}

// ตัวอย่างการใช้
await insertAuditLog('plan_budget_histories', {
  plan_id: plan.id,
  agency_id: user.agency_id,
  action_type: 'MANUAL_ADJUST',
  changes: { estimated_amount: { old: oldAmount, new: newAmount } },
  action_by: {
    user_id: user.sub,
    name: user.name,
    position: user.position,
    ip_address: event.getClientAddress(),
  },
});
```

### File Upload
```typescript
// SvelteKit action รับ FormData → validate → stream to S3 → save URL
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function uploadPdf(file: File, agencyId: number, documentId: number, stepName: string) {
  // Validate
  if (file.type !== 'application/pdf') throw new Error('MIME type must be application/pdf');
  if (file.size > 20 * 1024 * 1024)   throw new Error('File size exceeds 20MB');

  const timestamp = Date.now();
  const key = `agencies/${agencyId}/procurements/${documentId}/${stepName}_${timestamp}.pdf`;
  const s3 = new S3Client({ endpoint: env.S3_ENDPOINT, ... });

  await s3.send(new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: 'application/pdf',
  }));

  return `https://${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
}
```

### Rate Limiting (/api/auth/login)
```typescript
// Max 5 requests per minute per IP — ใช้ memory Map (หรือ Redis ถ้ามี)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxReq = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxReq) return false;
  entry.count++;
  return true;
}
```

### Fiscal Year Auto-Create (ใน /planning load function)
```typescript
function getCurrentThaiYear(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year  = now.getFullYear();
  return String(month >= 10 ? year + 544 : year + 543);
}

async function ensureFiscalYear(agencyId: number, db: DrizzleDb) {
  const yearName = getCurrentThaiYear();
  const existing = await db.select().from(fiscalYears)
    .where(and(eq(fiscalYears.agency_id, agencyId), eq(fiscalYears.year_name, yearName), isNull(fiscalYears.deleted_at)))
    .limit(1);

  if (existing.length === 0) {
    // สร้างปีใหม่
    await db.insert(fiscalYears).values({ agency_id: agencyId, year_name: yearName, is_active: true, ... });
    // ปิดปีเก่า
    await db.update(fiscalYears).set({ is_active: false })
      .where(and(eq(fiscalYears.agency_id, agencyId), ne(fiscalYears.year_name, yearName)));
    // Copy recurring plans
    await copyRecurringPlans(agencyId, yearName, db);
  }
}
```

### Seeding (src/lib/server/db/seed.ts)

```typescript
// รัน: pnpm db:seed
// ใช้ INSERT ... ON CONFLICT DO NOTHING เสมอ
async function seed() {
  // 1. provinces (77 จังหวัด)
  await db.insert(provinces).values(ALL_77_PROVINCES).onConflictDoNothing();
  // 2. workflows + workflow_steps (4 templates)
  await db.insert(workflows).values(DEFAULT_WORKFLOWS).onConflictDoNothing();
  // 3. roles (SUPER_ADMIN, DIRECTOR, PROCUREMENT_OFFICER, FINANCE_OFFICER)
  await db.insert(roles).values(DEFAULT_ROLES).onConflictDoNothing();
  // 4. banks (ธนาคารหลักของไทย)
  await db.insert(bank).values(THAI_BANKS).onConflictDoNothing();
}
```

### Print / Export
- **Official PDFs** (ฎีกา, PR report): server-side ด้วย `puppeteer` หรือ `pdfmake` — embed font TH Sarabun PSK/New
- **CSV/Excel**: ใช้ `exceljs` — header: `Content-Type: text/csv; charset=utf-8` + BOM (`\uFEFF`) เพื่อให้ Excel แสดงภาษาไทยได้

### Tests (Tester Agent)
- Framework: Jest + ts-jest
- Coverage: ≥ 80%
- ต้อง assert ทุก business rule เช่น:
  - Fine calculation formula
  - Soft delete (ไม่มี hard delete)
  - Partial unique index behavior
  - Bottom-up rollup correctness
  - Race condition handling

---

## UI Agent Rules

**Output**: `+page.svelte`, `src/lib/components/**`

> **CRITICAL**: Svelte syntax เท่านั้น — ห้าม React/JSX ห้าม import React

### ภาษาและ Format
- ทุก label, message, error → **ภาษาไทย**
- วันที่ → พ.ศ. DD/MM/YYYY ด้วย `Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok' })`
- เงิน → `amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })` + " บาท"
- Input เงิน → FLOAT 2 ทศนิยม (100 สตางค์ = 1 บาท — auto-convert)

### Status Badges (สีมาตรฐาน)
```svelte
<!-- ใช้ consistent color mapping นี้ทั่วทั้ง app -->
{#if status === 'DRAFT'}         <span class="badge gray">ร่าง</span>
{:else if status === 'IN_PROGRESS'} <span class="badge blue">กำลังดำเนินการ</span>
{:else if status === 'COMPLETED'}   <span class="badge green">เสร็จสิ้น</span>
{:else if status === 'PAID'}        <span class="badge green">จ่ายแล้ว</span>
{:else if status === 'REJECTED'}    <span class="badge red">ปฏิเสธ</span>
{:else if status === 'PENDING'}     <span class="badge yellow">รอดำเนินการ</span>
{/if}
```

### Forms — ใช้ use:enhance เสมอ
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<form method="POST" use:enhance>
  <input name="title" required />
  <!-- แสดง server error inline ใต้ field -->
  {#if form?.errors?.title}
    <p class="text-red-500 text-sm">{form.errors.title[0]}</p>
  {/if}
  <button type="submit">บันทึก</button>
</form>
```

### Pagination Component (reusable)
```svelte
<!-- src/lib/components/Pagination.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let total: number;
  export let limit = 20;

  $: currentPage = Number($page.url.searchParams.get('page')) || 1;
  $: totalPages = Math.ceil(total / limit);

  function goToPage(p: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', String(p));
    goto(`?${params}`, { keepFocus: true });
  }
</script>

<div class="flex gap-2">
  <button on:click={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>ก่อนหน้า</button>
  <span>{currentPage} / {totalPages}</span>
  <button on:click={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>ถัดไป</button>
</div>
```

### Search Input (debounced)
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let q = $page.url.searchParams.get('q') ?? '';
  let timer: ReturnType<typeof setTimeout>;

  function handleSearch() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const params = new URLSearchParams($page.url.searchParams);
      q ? params.set('q', q) : params.delete('q');
      params.set('page', '1');
      goto(`?${params}`, { keepFocus: true });
    }, 300); // debounce 300ms
  }
</script>

<input bind:value={q} on:input={handleSearch} placeholder="ค้นหา..." />
```

### Permission-based UI (ซ่อน/แสดง element)
```svelte
<script lang="ts">
  import type { LayoutData } from './$types';
  export let data: LayoutData;
  $: user = data.user;
</script>

<!-- ใช้ permissions จาก JWT ในการแสดง/ซ่อน button เสมอ -->
{#if user.is_super_admin || user.permissions.finance.can_approve_dika}
  <button>อนุมัติฎีกา</button>
{/if}

{#if user.is_super_admin || user.permissions.procurement.can_create_document}
  <button>สร้างเอกสารจัดซื้อ</button>
{/if}
```

### Dashboard (Role-based widgets)
```svelte
<!-- ใช้ {#await} เพื่อ stream widget data — ห้าม block initial load -->
{#if data.user.is_super_admin}
  {#await data.systemMetrics}
    <WidgetSkeleton />
  {:then metrics}
    <SystemMetricsWidget {metrics} />
  {/await}
{:else if data.user.permissions.finance.can_approve_dika}
  {#await data.pendingDika}
    <WidgetSkeleton />
  {:then dika}
    <PendingDikaWidget {dika} />
  {/await}
{/if}
```

### Notification Bell (Navbar)
```svelte
<script lang="ts">
  export let unreadCount: number;

  async function markAsRead(id: number, actionUrl: string) {
    await fetch('/api/notifications/read', { method: 'POST', body: JSON.stringify({ id }) });
    goto(actionUrl);
  }
</script>

<button class="relative">
  🔔
  {#if unreadCount > 0}
    <span class="badge-red absolute -top-1 -right-1">{unreadCount}</span>
  {/if}
</button>
```

### Table List Pages (Global Convention)
ทุก list page ต้องมี:
1. Search input (debounced 300ms)
2. Status filter dropdown (ถ้ามี status)
3. ตาราง pagination 20 rows default
4. ปุ่ม Export CSV
5. คลิก row → ไปหน้า Detail

### Print / Export
```svelte
<!-- Print View — ซ่อน sidebar/navbar/button ด้วย @media print -->
<style>
  @media print {
    nav, aside, button, .no-print { display: none !important; }
    .print-only { display: block !important; }
  }
</style>

<!-- Export CSV Button -->
<a href="/api/plans/export?{params}" download="plans.csv">Export CSV</a>
```

### Disabled Button + Tooltip Pattern
```svelte
<!-- ใช้เมื่อ document มีสถานะ IN_PROGRESS หรืองบหมดแล้ว -->
<div title={hasActiveDoc ? 'มีเอกสารกำลังดำเนินการอยู่' : ''}>
  <button disabled={hasActiveDoc} class:opacity-50={hasActiveDoc}>
    สร้างเอกสารจัดซื้อ
  </button>
</div>
```

---

## Debug Agent Rules

**เครื่องมือ**: `pnpm check` + `svelte-check`

**Checklist**:
- [ ] ไม่มี TypeScript `any` type
- [ ] ทุก `+page.svelte` ใช้ `export let data` และ `export let form` จาก `$types`
- [ ] ทุก `load` function return type ตรงกับ `+page.svelte` props
- [ ] ทุก form action return `ActionResponse<T>` shape
- [ ] `App.Locals.user` มี type `JWTPayload | null`
- [ ] ไม่มี React syntax ใน .svelte files

---

## Tester Agent Rules

**Framework**: Jest + ts-jest
**Coverage target**: ≥ 80%

**Test cases ที่ต้อง cover**:

```typescript
describe('Business Rules', () => {
  // Fine calculation
  it('คำนวณค่าปรับส่งช้า 2 วัน จาก 500,000 บาท', () => {
    expect(calculateFine(500000, 2)).toBe(1000); // 500000 × 0.001 × 2
  });

  // Soft delete
  it('ห้าม hard delete — ต้องใช้ soft delete', async () => {
    await expect(db.delete(plans).where(...)).rejects.toThrow();
  });

  // Fiscal year calculation
  it('ตุลาคม 2025 = ปีงบประมาณ 2569', () => {
    expect(getFiscalYear(new Date('2025-10-01'))).toBe('2569');
  });
  it('กันยายน 2025 = ปีงบประมาณ 2568', () => {
    expect(getFiscalYear(new Date('2025-09-30'))).toBe('2568');
  });

  // Bottom-up rollup
  it('อัปเดต leaf node → rollup ขึ้นถึง root', async () => {
    // setup tree: root → mid → leaf
    // update leaf.actual_amount
    // assert root.actual_amount updated
  });

  // Partial unique index
  it('สร้าง dika ซ้ำ document เดิม (ที่ยัง PENDING) → throw error', async () => {
    await expect(createDika({ document_id: 1 })).rejects.toThrow();
  });

  // Permission check
  it('User ที่ไม่มี can_approve_dika ห้ามอนุมัติฎีกา', async () => {
    const user = mockUser({ finance: { can_approve_dika: false } });
    await expect(approveDika(user, dikaId)).rejects.toThrow('Unauthorized');
  });
});
```
