# Agent Working Instructions

## Orchestrator Section

- Role: You are the "Orchestrator" of a multi-agent engineering team building an Enterprise-grade Thai public-sector ERP system.
- Core Mandate: Your job is NOT to write code yourself. You must "plan", "design API contracts", "delegate", "verify", and "integrate" the work of your specialist sub-agents. You ensure all outputs strictly follow SvelteKit best practices and the defined State Machine architecture.

- Workflow Execution:
  1. Define the Contract: Before delegating, you MUST design the TypeScript Interfaces / Zod Schemas for the payload and database models.
  2. Parallel Delegation: Instruct the following sub-agents to work concurrently based on the exact same contract:
     - [Fullstack Agent]: Builds the SvelteKit server code (`+page.server.ts`, `+server.ts`, actions, load functions) handling PostgreSQL (business logic) and MongoDB (Audit trails).
     - [UI Design Agent]: Builds the `+page.svelte` components and polished Tailwind CSS. MUST use "Anthropic Frontend Design" skills. CRITICAL: Strictly output Svelte syntax. NO React/JSX. Focus on Thai public-sector UX/UI accessibility.
  3. Quality Assurance:
     - [Debug Agent]: Runs `pnpm check` and `svelte-check`. Fixes any TypeScript strictly typed errors and ensures seamless integration between server and client code.
     - [Tester Agent]: Writes unit and integration tests using Jest and ts-jest for the backend/state-machine logic. Must assert all business rules and aim for at least 80% code coverage.
  4. Integration & Review: You will review the merged output, ensure it meets the ERP's security (JWT/httpOnly) and architectural standards, and deliver the final cohesive feature.

## Fullstack Agent Section

### Backend CONVENTIONS

- No `any` types in TypeScript – always define specific types or interfaces for function parameters and return values.
- Use async/await for all asynchronous operations, and handle errors with try/catch blocks.
- Follow RESTful API design principles for route naming and HTTP methods (GET for read, POST for create, PUT/PATCH for update, DELETE for delete).
- Implement input validation and sanitization on all API endpoints using a library like Zod or Joi to prevent invalid data from entering the system.
- Use environment variables for all configuration (e.g. database connection strings, JWT secrets) and never hardcode sensitive information in the codebase.
- Write unit tests for all critical business logic functions using a testing framework like Jest, and aim for at least 80% code coverage.
- Document all API endpoints with OpenAPI/Swagger, including request parameters, response schemas, and error codes, to facilitate frontend integration and future maintenance.

### Drizzle ORM Schema Standard (Reference implementation)

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

### Authentication Flow & Middleware (hooks.server.ts)

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

### Standardized Pagination & Sorting Parameters

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

### Database Seeding & Migration Strategy

The Fullstack Agent MUST implement a robust seeding mechanism using Drizzle ORM to ensure all environments (Dev, Staging, Prod) have the required Master Data.

- Seeding Contract (src/lib/server/db/seed.ts):
  - Data to Seed:
    1. provinces (All 77 provinces of Thailand).
    2. workflows and workflow_steps (The default templates like "วิธีคัดเลือก" and "วิธีเฉพาะเจาะจง").
    3. roles (Default system roles: SUPER_ADMIN, DIRECTOR, PROCUREMENT_OFFICER, FINANCE_OFFICER).
    4. banks (Major Thai banks with standard bank codes).
- Execution: Provide a package.json script ("db:seed": "tsx src/lib/server/db/seed.ts") that uses INSERT ... ON CONFLICT DO NOTHING to prevent duplicate seeding errors.

### Rate Limiting & Security Headers

Government systems are prime targets for attacks. The SvelteKit application MUST enforce security at the middleware level.

- Security Contract (hooks.server.ts):
  - Security Headers: Inject strict HTTP headers in the handle hook:
    - TypeScript
        response.headers.set('X-Frame-Options', 'DENY'); // Prevent Clickjacking
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  - Rate Limiting: Implement IP-based rate limiting for critical routes (e.g., /api/auth/login max 5 requests/minute). The Fullstack agent can use a lightweight memory cache or Redis (if available) to track requests by event.getClientAddress().

### Search & Filter Conventions

Searching and filtering must be uniform across all modules.

- URL Standard:
  - Global Text Search: ?q=... (Searches primary text fields like document name, user name, or plan title).
  - Exact Match Filters: ?status=IN_PROGRESS or ?fiscal_year_id=2

- Database Query Rule:
  - For q: The Fullstack Agent MUST use PostgreSQL ILIKE for case-insensitive partial matching (e.g., ilike(plans.title, \%${q}%`)`).
  - For Filters: Use strict equality eq().
  - UI Agent Rule: Debounce the search input (?q=) by 300ms before submitting the form to prevent spamming the database.

### Print / Export Specification (Government Forms)

Public sector systems require exact PDF generation for official forms (e.g., forms with the Thai Garuda emblem / ตราครุฑ).

- Export & Print Contracts:
    - The Fullstack Agent MUST provide CSV/Excel export endpoints using libraries like exceljs or standard CSV stringification, setting the correct Content-Type: text/csv; charset=utf-8 header with BOM (Byte Order Mark) to ensure Thai characters render correctly in MS Excel.

## UI Agent Section

### Frontend and UI CONVENTIONS

- Language: Thai for all labels, messages, and UI text. Error messages in Thai.
- Date format: Thai Buddhist Era (พ.ศ.) — year + 543. Display as DD/MM/YYYY (Buddhist year).
- Fiscal year: starts 1 October, ends 30 September. Year label is the year that September falls in (e.g. Oct 2566 – Sep 2567 = "ปีงบประมาณ 2567").
- Currency: Thai Baht (THB or ฿). Format with toLocaleString("th-TH") and show "บาท" suffix.
- Number inputs for money: use FLOAT, Only for 2 decimal places because in thailand 100 satang = 1 baht (1.00 = 1 baht and 0.01 = 1 satang When it reaches 100 satang must be changed to 1 baht automatically).
- Status badges: use color coding — DRAFT=gray, IN_PROGRESS=blue, COMPLETED=green, REJECTED=red, PAID=green, PENDING=yellow.
- Tables: always show pagination (20 rows default). Include export-to-CSV button on list pages.
- Forms: validate required fields client-side with Svelte use:enhance. Show server errors returned from fail() inline under the relevant field.

### Notification System Contract (In-App Alerts)

A system with state machines requires notifications to move tasks forward.

- Database Schema Addition:
  - Table notifications: id (PK), user_id (FK -> users), title (VARCHAR), message (TEXT), action_url (VARCHAR - e.g., /procurement/105), is_read (BOOLEAN DEFAULT FALSE), created_at (TIMESTAMP).

- Workflow Triggers:
  - The Fullstack Agent MUST insert a notification record when:
  - A document enters a state requiring approval (Notify the approver_role users).
  - A Dika voucher is created and needs examination (Notify Finance).
  - A document is Rejected (Notify the creator updated_by).
  - UI Agent Rule: Implement a Notification Bell in the Navbar with an unread badge. Clicking a notification updates is_read = true via a server action and redirects to the action_url.

### Role-Based Dashboard Contract (/dashboard)

The UI and Fullstack Agents MUST dynamically render the dashboard based on event.locals.user.permissions and is_super_admin. Do NOT build a single generic dashboard.

- Dashboard Widgets & Routing Rules:
  - Super Admin (is_super_admin: true): Sees System-wide metrics (Total Agencies, Active Users, System Health) and a dropdown to impersonate agencies.
  - Executive/Director (ผอ./รอง ผอ.): Sees "Budget Overview Chart" (Actual vs Estimated), "Pending Approvals" (Action required), and "Project Status Summary".
  - Planning Dept: Sees "Fiscal Year Progress", "Budget Utilization by Plan", and "Recent Plan Changes".
  - Procurement/Finance Dept: Sees "My Active Tasks" (Documents in progress), "Recent Dika Vouchers", and "Pending Tax Submissions".
  - Implementation Rule: Use SvelteKit await blocks in +page.svelte to stream widget data without blocking the initial page load.

### Pagination Component Implementation (UI Layer)

- UI Agent Rule: Build a reusable <Pagination /> component that reads/writes to $page.url.searchParams using goto(..., { keepFocus: true }).

### Print / Export Specification for UI (Government Forms)

Public sector systems require exact PDF generation for official forms (e.g., forms with the Thai Garuda emblem / ตราครุฑ).

- Export & Print Contracts:
  - Data Tables & Reports: - The UI Agent MUST implement a "Print View" using CSS @media print (hiding sidebars, navbars, and buttons) for simple tabular data.
  - Official PDF Forms (e.g., Dika Vouchers, PR Reports): - The Fullstack Agent MUST use a server-side PDF generation library (e.g., puppeteer, playwright, or pdfmake).
    - Fonts: MUST embed and use official Thai government fonts (e.g., TH Sarabun PSK or TH Sarabun New).