<script lang="ts">
	import { formatBaht } from '$lib/utils/format';
	import ScopeSelector from '$lib/components/ScopeSelector.svelte';
	import { DonutChart, BarChart, KPICard, ProgressChart } from '$lib/components/charts';
	import { ChartBarIcon, DocumentIcon, BuildingIcon, UsersIcon } from '$lib/components/icons';

	let { data } = $props();
	const stats = data.stats as Record<string, any>;
	const chartData = data.chartData as Record<string, any>;
	const filters = data.filters as { provinceId: number | null; agencyId: number | null; orgUnitId: number | null };

	// Check if scope is selected
	let hasScopeSelected = $derived(filters.provinceId !== null && filters.agencyId !== null);
</script>

<div class="dashboard-container">
	<!-- Page Header -->
	<div class="page-header">
		<div class="header-content">
			<div>
				<h1 class="header-title">แดชบอร์ด</h1>
				<p class="header-subtitle">
					ยินดีต้อนรับกลับ, <span class="user-name">{data.user.name}</span>
					{#if data.user.is_super_admin}
						<span class="admin-badge">
							<svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
							Administrator
						</span>
					{/if}
				</p>
			</div>
		</div>
		<div class="header-decoration"></div>
	</div>

	<!-- Scope Selector -->
	<ScopeSelector
		provinces={data.provinces}
		agencies={data.agencies}
		orgUnits={data.orgUnits}
		selectedProvinceId={filters.provinceId}
		selectedAgencyId={filters.agencyId}
		selectedOrgUnitId={filters.orgUnitId}
	/>

	{#if hasScopeSelected || data.user.is_super_admin}
		<!-- KPI Summary Cards -->
		<div class="kpi-grid">
			{#if data.user.is_super_admin && stats.totalAgencies !== undefined}
				<KPICard
					title="หน่วยงานทั้งหมด"
					value={stats.totalAgencies}
					icon={BuildingIcon}
					color="oklch(0.52 0.14 240)"
				/>
			{/if}

			{#if data.user.is_super_admin && stats.totalUsers !== undefined}
				<KPICard
					title="ผู้ใช้งานระบบ"
					value={stats.totalUsers}
					icon={UsersIcon}
					color="oklch(0.54 0.16 150)"
				/>
			{/if}

			{#if stats.activeDocuments !== undefined}
				<KPICard
					title="เอกสารดำเนินการ"
					value={stats.activeDocuments}
					icon={DocumentIcon}
					color="oklch(0.52 0.14 240)"
				/>
			{/if}

			{#if stats.pendingDikaVouchers !== undefined}
				<KPICard
					title="ฎีการอตรวจสอบ"
					value={stats.pendingDikaVouchers}
					color="oklch(0.62 0.18 60)"
				/>
			{/if}
		</div>

		<!-- Budget Summary (if available) -->
		{#if chartData.agencyBudget}
			<div class="budget-summary-card">
				<div class="card-header">
					<h3 class="card-title">สรุปงบประมาณ</h3>
					{#if stats.fiscalYear}
						<span class="card-badge">ปี {stats.fiscalYear.year_name}</span>
					{/if}
				</div>
				<div class="budget-metrics">
					<div class="budget-metric">
						<div class="metric-label">งบประมาณทั้งหมด</div>
						<div class="metric-value primary">{formatBaht(chartData.agencyBudget.total)}</div>
					</div>
					<div class="budget-metric">
						<div class="metric-label">ใช้ไปแล้ว</div>
						<div class="metric-value success">{formatBaht(chartData.agencyBudget.used)}</div>
					</div>
					<div class="budget-metric">
						<div class="metric-label">คงเหลือ</div>
						<div class="metric-value {chartData.agencyBudget.remaining >= 0 ? 'success' : 'error'}">
							{formatBaht(chartData.agencyBudget.remaining)}
						</div>
					</div>
					<div class="budget-metric">
						<div class="metric-label">อัตราการใช้</div>
						<div class="metric-value">
							{chartData.agencyBudget.total > 0 ? ((chartData.agencyBudget.used / chartData.agencyBudget.total) * 100).toFixed(1) : 0}%
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Charts Grid -->
		<div class="charts-grid">
			<!-- Document Status Donut Chart -->
			{#if chartData.documentStatus && chartData.documentStatus.length > 0}
				<DonutChart
					title="สถานะเอกสาร"
					subtitle="ภาพรวมสถานะเอกสารทั้งหมด"
					data={chartData.documentStatus}
				/>
			{/if}

			<!-- Agency Document Status -->
			{#if chartData.agencyDocumentStatus && chartData.agencyDocumentStatus.length > 0}
				<DonutChart
					title="สถานะเอกสารหน่วยงาน"
					subtitle="แยกตามสถานะ"
					data={chartData.agencyDocumentStatus}
				/>
			{/if}

			<!-- Dika Voucher Status -->
			{#if chartData.dikaStatus && chartData.dikaStatus.length > 0}
				<DonutChart
					title="สถานะฎีกา"
					subtitle="การตรวจสอบและอนุมัติ"
					data={chartData.dikaStatus}
				/>
			{/if}

			<!-- Plan Type Distribution -->
			{#if chartData.planType && chartData.planType.length > 0}
				<DonutChart
					title="ประเภทแผน"
					subtitle="รายได้ vs รายจ่าย"
					data={chartData.planType}
				/>
			{/if}

			<!-- Budget Utilization by Agency -->
			{#if chartData.budgetByAgency && chartData.budgetByAgency.length > 0}
				<div class="chart-card-wide">
					<ProgressChart
						title="การใช้งบประมาณแยกตามหน่วยงาน"
						subtitle="Top 5 หน่วยงานที่มีงบประมาณสูงสุด"
						items={chartData.budgetByAgency}
					/>
				</div>
			{/if}

			<!-- Monthly Documents Trend -->
			{#if chartData.monthlyDocuments && chartData.monthlyDocuments.length > 0}
				<div class="chart-card-wide">
					<BarChart
						title="แนวโน้มเอกสารรายเดือน"
						subtitle="6 เดือนล่าสุด"
						data={chartData.monthlyDocuments}
					/>
				</div>
			{/if}
		</div>

		{:else}
			<!-- Empty State - Prompt to select scope -->
			<div class="empty-state">
				<div class="empty-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h3 class="empty-title">เลือกขอบเขตเพื่อดูข้อมูล</h3>
				<p class="empty-description">
					กรุณาเลือกจังหวัดและหน่วยงานด้านบนเพื่อดูข้อมูลเชิงลึกและกราฟวิเคราะห์
				</p>
				<div class="empty-hint">
					<div class="hint-step">
						<div class="hint-number">1</div>
						<span>เลือกจังหวัด</span>
					</div>
					<div class="hint-arrow">→</div>
					<div class="hint-step">
						<div class="hint-number">2</div>
						<span>เลือกหน่วยงาน</span>
					</div>
					<div class="hint-arrow">→</div>
					<div class="hint-step">
						<div class="hint-number">3</div>
						<span>ดูข้อมูลวิเคราะห์</span>
					</div>
				</div>
			</div>
		{/if}
</div>

<style>
	.dashboard-container {
		animation: fade-in 0.6s ease-out-expo;
	}

	/* Page Header */
	.page-header {
		position: relative;
		overflow: hidden;
		margin-bottom: 32px;
		border-radius: 20px;
		background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.54 0.16 150));
		padding: 32px;
		box-shadow: 0 8px 32px oklch(0.52 0.14 240 / 0.15);
	}

	.header-content {
		position: relative;
		z-index: 1;
	}

	.header-title {
		margin: 0 0 8px 0;
		font-size: clamp(1.5rem, 1.2rem + 0.8vw, 2rem);
		font-weight: 700;
		color: oklch(1 0 0);
		letter-spacing: -0.02em;
	}

	.header-subtitle {
		margin: 0;
		font-size: clamp(0.875rem, 0.75rem + 0.4vw, 1rem);
		color: oklch(1 0 0 / 0.85);
		line-height: 1.6;
	}

	.user-name {
		font-weight: 600;
		color: oklch(1 0 0);
	}

	.admin-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-left: 8px;
		padding: 4px 12px;
		border-radius: 999px;
		background: oklch(1 0 0 / 0.2);
		backdrop-filter: blur(8px);
		font-size: 0.75rem;
		font-weight: 500;
		color: oklch(1 0 0);
	}

	.badge-icon {
		width: 14px;
		height: 14px;
	}

	.header-decoration {
		position: absolute;
		top: -40px;
		right: -40px;
		width: 200px;
		height: 200px;
		border-radius: 50%;
		background: oklch(1 0 0 / 0.08);
		pointer-events: none;
	}

	/* KPI Grid */
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 20px;
		margin-bottom: 32px;
	}

	/* Budget Summary Card */
	.budget-summary-card {
		background: oklch(1 0 0);
		border: 1px solid oklch(0.9 0.005 180);
		border-radius: 16px;
		padding: 24px;
		margin-bottom: 32px;
		animation: slide-up 0.5s ease-out-expo;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.card-title {
		margin: 0;
		font-size: clamp(1rem, 0.85rem + 0.4vw, 1.125rem);
		font-weight: 600;
		color: oklch(0.25 0.02 180);
	}

	.card-badge {
		padding: 4px 12px;
		border-radius: 8px;
		background: oklch(0.52 0.14 240 / 0.1);
		font-size: 0.75rem;
		font-weight: 600;
		color: oklch(0.52 0.14 240);
	}

	.budget-metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 20px;
	}

	.budget-metric {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.metric-label {
		font-size: 0.8125rem;
		color: oklch(0.5 0.02 180);
	}

	.metric-value {
		font-size: clamp(1.125rem, 0.95rem + 0.5vw, 1.375rem);
		font-weight: 700;
		color: oklch(0.25 0.02 180);
	}

	.metric-value.primary {
		color: oklch(0.52 0.14 240);
	}

	.metric-value.success {
		color: oklch(0.54 0.16 150);
	}

	.metric-value.error {
		color: oklch(0.58 0.2 25);
	}

	/* Charts Grid */
	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 24px;
	}

	.chart-card-wide {
		grid-column: 1 / -1;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 32px;
		text-align: center;
		animation: fade-in 0.6s ease-out-expo;
	}

	.empty-icon {
		width: 80px;
		height: 80px;
		margin-bottom: 24px;
		border-radius: 50%;
		background: oklch(0.52 0.14 240 / 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-icon svg {
		width: 40px;
		height: 40px;
		color: oklch(0.52 0.14 240);
	}

	.empty-title {
		margin: 0 0 12px 0;
		font-size: clamp(1.25rem, 1rem + 0.6vw, 1.5rem);
		font-weight: 600;
		color: oklch(0.25 0.02 180);
	}

	.empty-description {
		max-width: 400px;
		margin: 0 0 32px 0;
		font-size: 0.9375rem;
		color: oklch(0.5 0.02 180);
		line-height: 1.6;
	}

	.empty-hint {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.hint-step {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		border-radius: 12px;
		background: oklch(0.98 0.005 180);
		border: 1px solid oklch(0.9 0.005 180);
		font-size: 0.875rem;
		color: oklch(0.35 0.02 180);
	}

	.hint-number {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: oklch(0.52 0.14 240);
		color: oklch(1 0 0);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.hint-arrow {
		font-size: 1.25rem;
		color: oklch(0.6 0.02 180);
	}

	/* Animations */
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page-header {
			padding: 24px;
		}

		.kpi-grid {
			grid-template-columns: 1fr;
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}

		.chart-card-wide {
			grid-column: 1;
		}

		.budget-metrics {
			grid-template-columns: 1fr 1fr;
		}

		.empty-hint {
			flex-direction: column;
		}

		.hint-arrow {
			transform: rotate(90deg);
		}
	}
</style>
