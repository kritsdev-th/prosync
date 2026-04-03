import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import {
  agencies,
  users,
  fiscalYears,
  documents,
  dikaVouchers,
  plans,
  provinces,
  orgUnits,
} from "$lib/server/db/schema";
import { eq, and, count, isNull, desc, sql } from "drizzle-orm";
import type { ChartData } from "$lib/types/dashboard";

export const load: PageServerLoad = async ({ parent, url }) => {
  const { user } = await parent();

  // Get filter params from URL
  const provinceId = url.searchParams.get("province_id");
  const agencyId = url.searchParams.get("agency_id");
  const orgUnitId = url.searchParams.get("org_unit_id");

  // Load provinces for selector
  const provincesList = await db
    .select()
    .from(provinces)
    .orderBy(provinces.name);

  // Load agencies (filtered by province if selected)
  let agenciesQuery = db.select().from(agencies);
  if (provinceId) {
    agenciesQuery = agenciesQuery.where(
      eq(agencies.province_id, parseInt(provinceId)),
    );
  }
  const agenciesList = await agenciesQuery;

  // Load org units (filtered by agency if selected)
  let orgUnitsQuery = db.select().from(orgUnits);
  if (agencyId) {
    orgUnitsQuery = orgUnitsQuery.where(
      eq(orgUnits.agency_id, parseInt(agencyId)),
    );
  }
  const orgUnitsList = await orgUnitsQuery;

  const stats: Record<string, unknown> = {};
  const chartData: Record<string, unknown> = {};

  // Determine effective agency_id for queries
  const effectiveAgencyId = agencyId ? parseInt(agencyId) : user.agency_id;

  if (user.is_super_admin) {
    // System-wide metrics
    const [agencyCount] = await db.select({ count: count() }).from(agencies);
    const [userCount] = await db
      .select({ count: count() })
      .from(users)
      .where(isNull(users.deleted_at));
    stats.totalAgencies = agencyCount.count;
    stats.totalUsers = userCount.count;

    // Document status breakdown for donut chart
    const docStatusData = await db
      .select({
        status: documents.status,
        count: count(),
      })
      .from(documents)
      .groupBy(documents.status);

    chartData.documentStatus = docStatusData.map((d) => ({
      label: getStatusLabel(d.status),
      value: d.count,
      color: getStatusColor(d.status),
    }));

    // Plan type breakdown (income vs expense)
    const planTypeData = await db
      .select({
        planType: plans.plan_type,
        count: count(),
      })
      .from(plans)
      .groupBy(plans.plan_type);

    chartData.planType = planTypeData.map((p) => ({
      label: p.planType === "INCOME" ? "รายได้" : "รายจ่าย",
      value: p.count,
      color:
        p.planType === "INCOME"
          ? "oklch(0.54 0.16 150)"
          : "oklch(0.52 0.14 240)",
    }));

    // Budget utilization by agency (top 5)
    const budgetByAgency = await db
      .select({
        agency_name: agencies.name,
        total_budget: sql<number>`SUM(${plans.estimated_amount})`,
        used_budget: sql<number>`SUM(${plans.actual_amount})`,
      })
      .from(plans)
      .innerJoin(agencies, eq(plans.agency_id, agencies.id))
      .groupBy(agencies.name)
      .orderBy(desc(sql`SUM(${plans.estimated_amount})`))
      .limit(5);

    chartData.budgetByAgency = budgetByAgency.map((b) => ({
      label: b.agency_name,
      value: Number(b.used_budget) || 0,
      max: Number(b.total_budget) || 1,
    }));

    // Monthly document trends not available (documents table has no created_at column)
    chartData.monthlyDocuments = [];

    // Dika voucher status
    const dikaStatusData = await db
      .select({
        status: dikaVouchers.status,
        count: count(),
      })
      .from(dikaVouchers)
      .groupBy(dikaVouchers.status);

    chartData.dikaStatus = dikaStatusData.map((d) => ({
      label: getDikaStatusLabel(d.status),
      value: d.count,
      color: getDikaStatusColor(d.status),
    }));
  }

  // Agency-specific stats (when agency is selected or user has agency)
  if (effectiveAgencyId) {
    const [activeFy] = await db
      .select()
      .from(fiscalYears)
      .where(
        and(
          eq(fiscalYears.agency_id, effectiveAgencyId),
          eq(fiscalYears.is_active, true),
        ),
      );

    if (activeFy) {
      stats.fiscalYear = activeFy;
    }

    const [docCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(
        and(
          eq(documents.agency_id, effectiveAgencyId),
          eq(documents.status, "IN_PROGRESS"),
        ),
      );
    stats.activeDocuments = docCount.count;

    const [pendingDika] = await db
      .select({ count: count() })
      .from(dikaVouchers)
      .where(
        and(
          eq(dikaVouchers.agency_id, effectiveAgencyId),
          eq(dikaVouchers.status, "PENDING_EXAMINE"),
        ),
      );
    stats.pendingDikaVouchers = pendingDika.count;

    // Agency document status breakdown
    const agencyDocStatus = await db
      .select({
        status: documents.status,
        count: count(),
      })
      .from(documents)
      .where(eq(documents.agency_id, effectiveAgencyId))
      .groupBy(documents.status);

    chartData.agencyDocumentStatus = agencyDocStatus.map((d) => ({
      label: getStatusLabel(d.status),
      value: d.count,
      color: getStatusColor(d.status),
    }));

    // Agency budget summary
    const [agencyPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.agency_id, effectiveAgencyId))
      .orderBy(desc(plans.id))
      .limit(1);

    if (agencyPlan) {
      chartData.agencyBudget = {
        total: Number(agencyPlan.estimated_amount) || 0,
        used: Number(agencyPlan.actual_amount) || 0,
        remaining:
          (Number(agencyPlan.estimated_amount) || 0) -
          (Number(agencyPlan.actual_amount) || 0),
      };
    }
  }

  // System status
  stats.systemStatus = "online";

  return {
    user,
    stats,
    chartData,
    provinces: provincesList,
    agencies: agenciesList,
    orgUnits: orgUnitsList,
    filters: {
      provinceId: provinceId ? parseInt(provinceId) : null,
      agencyId: agencyId ? parseInt(agencyId) : null,
      orgUnitId: orgUnitId ? parseInt(orgUnitId) : null,
    },
  };
};

// Helper functions for labels and colors
function getStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    DRAFT: "ร่าง",
    IN_PROGRESS: "ดำเนินการ",
    COMPLETED: "เสร็จสิ้น",
    CANCELLED: "ยกเลิก",
    PENDING: "รอดำเนินการ",
    APPROVED: "อนุมัติ",
    REJECTED: "ไม่อนุมัติ",
  };
  return labels[status || ""] || status || "ไม่ระบุ";
}

function getStatusColor(status: string | null): string {
  const colors: Record<string, string> = {
    DRAFT: "oklch(0.6 0.02 180)",
    IN_PROGRESS: "oklch(0.52 0.14 240)",
    COMPLETED: "oklch(0.54 0.16 150)",
    CANCELLED: "oklch(0.58 0.2 25)",
    PENDING: "oklch(0.62 0.18 60)",
    APPROVED: "oklch(0.54 0.16 150)",
    REJECTED: "oklch(0.58 0.2 25)",
  };
  return colors[status || ""] || "oklch(0.6 0.02 180)";
}

function getDikaStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    DRAFT: "ร่าง",
    PENDING_EXAMINE: "รอตรวจสอบ",
    EXAMINED: "ตรวจสอบแล้ว",
    APPROVED: "อนุมัติ",
    REJECTED: "ไม่อนุมัติ",
    PAID: "จ่ายแล้ว",
  };
  return labels[status || ""] || status || "ไม่ระบุ";
}

function getDikaStatusColor(status: string | null): string {
  const colors: Record<string, string> = {
    DRAFT: "oklch(0.6 0.02 180)",
    PENDING_EXAMINE: "oklch(0.62 0.18 60)",
    EXAMINED: "oklch(0.52 0.14 240)",
    APPROVED: "oklch(0.54 0.16 150)",
    REJECTED: "oklch(0.58 0.2 25)",
    PAID: "oklch(0.54 0.16 150)",
  };
  return colors[status || ""] || "oklch(0.6 0.02 180)";
}
