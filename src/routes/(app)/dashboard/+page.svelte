<script lang="ts">
	import { formatBaht } from '$lib/utils/format';

	let { data } = $props();
	const stats = data.stats as Record<string, any>;
</script>

<div>
	<!-- Page Header with asymmetry -->
	<div class="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-health-500 p-6 shadow-lg md:p-8">
		<!-- Decorative background pattern -->
		<div class="absolute inset-0 opacity-10">
			<svg class="absolute -right-20 -top-20 h-64 w-64" viewBox="0 0 200 200" fill="currentColor">
				<circle cx="100" cy="100" r="80" class="text-white" />
			</svg>
			<svg class="absolute -bottom-16 -right-16 h-48 w-48" viewBox="0 0 200 200" fill="currentColor">
				<circle cx="100" cy="100" r="60" class="text-white" />
			</svg>
		</div>
		
		<div class="relative">
			<h1 class="text-2xl font-bold tracking-tight text-white md:text-3xl">แดชบอร์ด</h1>
			<p class="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
				ยินดีต้อนรับกลับ, <span class="font-semibold text-white">{data.user.name}</span>
				{#if data.user.is_super_admin}
					<span class="ml-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
						<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
						Administrator
					</span>
				{/if}
			</p>
		</div>
	</div>

	<!-- Stats Grid with varied spacing and asymmetry -->
	<div class="mb-10">
		<div class="mb-4 flex items-end justify-between">
			<div>
				<h2 class="text-lg font-semibold" style="color: oklch(0.38 0.040 180);">ภาพรวมระบบ</h2>
				<p class="mt-1 text-sm" style="color: oklch(0.58 0.030 180);">ข้อมูลสำคัญและการดำเนินการ</p>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#if data.user.is_super_admin}
				<!-- Super Admin stats -->
				<div class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
					style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
					<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150"
						style="background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.54 0.16 150));"></div>
					<div class="relative">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 shadow-sm">
								<svg class="h-5 w-5" style="color: oklch(0.52 0.14 240);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
								</svg>
							</div>
							<div>
								<p class="text-xs font-medium" style="color: oklch(0.58 0.030 180);">หน่วยงาน</p>
								<p class="text-2xl font-bold" style="color: oklch(0.45 0.12 240);">{stats.totalAgencies ?? 0}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
					style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
					<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150"
						style="background: linear-gradient(135deg, oklch(0.54 0.16 150), oklch(0.62 0.14 150));"></div>
					<div class="relative">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-health-100 to-health-50 shadow-sm">
								<svg class="h-5 w-5" style="color: oklch(0.54 0.16 150);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<div>
								<p class="text-xs font-medium" style="color: oklch(0.58 0.030 180);">ผู้ใช้งาน</p>
								<p class="text-2xl font-bold" style="color: oklch(0.46 0.14 150);">{stats.totalUsers ?? 0}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
					style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
					<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150"
						style="background: linear-gradient(135deg, oklch(0.58 0.18 25), oklch(0.68 0.18 25));"></div>
					<div class="relative">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 shadow-sm">
								<svg class="h-5 w-5" style="color: oklch(0.68 0.14 30);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
							<div>
								<p class="text-xs font-medium" style="color: oklch(0.58 0.030 180);">โหมด</p>
								<p class="text-base font-bold" style="color: oklch(0.58 0.18 25);">Super Admin</p>
								<p class="mt-0.5 text-[10px]" style="color: oklch(0.70 0.025 180);">เข้าถึงทุกหน่วยงาน</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if stats.fiscalYear}
				<div class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:col-span-2 lg:col-span-2"
					style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
					<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150"
						style="background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.54 0.16 150));"></div>
					<div class="relative">
						<div class="mb-3 flex items-center justify-between">
							<div>
								<p class="text-xs font-medium" style="color: oklch(0.58 0.030 180);">ปีงบประมาณ {stats.fiscalYear.year_name}</p>
							</div>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-health-100">
								<svg class="h-4 w-4" style="color: oklch(0.52 0.14 240);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-xs">
									<span style="color: oklch(0.58 0.030 180);">คาดการณ์รายจ่าย</span>
									<span class="font-mono font-medium" style="color: oklch(0.58 0.18 25);">{formatBaht(stats.fiscalYear.total_estimated_expense)}</span>
								</div>
								<div class="flex items-center justify-between text-xs">
									<span style="color: oklch(0.58 0.030 180);">จ่ายจริง</span>
									<span class="font-mono font-medium" style="color: oklch(0.46 0.14 150);">{formatBaht(stats.fiscalYear.total_actual_expense)}</span>
								</div>
							</div>
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-xs">
									<span style="color: oklch(0.58 0.030 180);">คาดการณ์รายรับ</span>
									<span class="font-mono font-medium" style="color: oklch(0.54 0.16 150);">{formatBaht(stats.fiscalYear.total_estimated_income)}</span>
								</div>
								<div class="flex items-center justify-between text-xs">
									<span style="color: oklch(0.58 0.030 180);">รับจริง</span>
									<span class="font-mono font-medium" style="color: oklch(0.46 0.14 150);">{formatBaht(stats.fiscalYear.total_actual_income)}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if stats.activeDocuments !== undefined}
				<div class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
					style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
					<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150"
						style="background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.62 0.14 240));"></div>
					<div class="relative">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 shadow-sm">
								<svg class="h-5 w-5" style="color: oklch(0.52 0.14 240);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<div class="flex-1">
								<p class="text-xs font-medium" style="color: oklch(0.58 0.030 180);">เอกสารดำเนินการ</p>
								<p class="text-2xl font-bold" style="color: oklch(0.45 0.12 240);">{stats.activeDocuments}</p>
								<a href="/procurement" class="mt-1 inline-flex items-center gap-1 text-xs font-medium transition-colors duration-200 hover:underline"
									style="color: oklch(0.52 0.14 240);">
									ดูทั้งหมด
									<svg class="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
								</a>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if stats.pendingDikaVouchers !== undefined}
				<div class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
					style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
					<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150"
						style="background: linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.85 0.10 85));"></div>
					<div class="relative">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 shadow-sm">
								<svg class="h-5 w-5" style="color: oklch(0.68 0.12 75);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="flex-1">
								<p class="text-xs font-medium" style="color: oklch(0.58 0.030 180);">ฎีการอตรวจสอบ</p>
								<p class="text-2xl font-bold" style="color: oklch(0.68 0.12 75);">{stats.pendingDikaVouchers}</p>
								<a href="/finance" class="mt-1 inline-flex items-center gap-1 text-xs font-medium transition-colors duration-200 hover:underline"
									style="color: oklch(0.52 0.14 240);">
									ดูทั้งหมด
									<svg class="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
								</a>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<div class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
				style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
				<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150"
					style="background: linear-gradient(135deg, oklch(0.54 0.16 150), oklch(0.64 0.16 150));"></div>
				<div class="relative flex items-center gap-3">
					<div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-health-100 to-health-50 shadow-sm">
						<div class="absolute inset-0 flex items-center justify-center">
							<div class="h-2 w-2 rounded-full bg-green-500 pulse-soft"></div>
						</div>
						<svg class="h-5 w-5 opacity-0" style="color: oklch(0.54 0.16 150);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<p class="text-xs font-medium" style="color: oklch(0.58 0.030 180);">สถานะระบบ</p>
						<p class="text-xl font-bold" style="color: oklch(0.46 0.14 150);">ออนไลน์</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Quick Links - Asymmetric Layout -->
	<div class="mb-8">
		<div class="mb-4">
			<h2 class="text-lg font-semibold" style="color: oklch(0.38 0.040 180);">เมนูลัด</h2>
			<p class="mt-1 text-sm" style="color: oklch(0.58 0.030 180);">เข้าถึงฟีเจอร์หลักได้อย่างรวดเร็ว</p>
		</div>
		
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			{#if data.user.is_super_admin || data.user.permissions.can_manage_plans}
				<a href="/planning" class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
					style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
					<div class="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-10"
						style="background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.54 0.16 150));"></div>
					<div class="relative flex items-start gap-4">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
							<svg class="h-6 w-6" style="color: oklch(0.52 0.14 240);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						</div>
						<div class="flex-1">
							<p class="font-semibold transition-colors duration-200 group-hover:text-brand-600" style="color: oklch(0.38 0.040 180);">แผนยุทธศาสตร์</p>
							<p class="mt-1 text-sm leading-relaxed" style="color: oklch(0.58 0.030 180);">วางแผนและจัดการงบประมาณอย่างเป็นระบบ</p>
							<div class="mt-3 flex items-center gap-1 text-xs font-medium transition-colors duration-200" style="color: oklch(0.52 0.14 240);">
								<span>เข้าสู่เมนู</span>
								<svg class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</div>
					</div>
				</a>
			{/if}

			{#if data.user.is_super_admin || data.user.permissions.can_manage_procurement}
				<a href="/procurement" class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
					style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
					<div class="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-10"
						style="background: linear-gradient(135deg, oklch(0.54 0.16 150), oklch(0.64 0.16 150));"></div>
					<div class="relative flex items-start gap-4">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-health-100 to-health-50 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
							<svg class="h-6 w-6" style="color: oklch(0.54 0.16 150);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
							</svg>
						</div>
						<div class="flex-1">
							<p class="font-semibold transition-colors duration-200 group-hover:text-health-600" style="color: oklch(0.38 0.040 180);">จัดซื้อจัดจ้าง</p>
							<p class="mt-1 text-sm leading-relaxed" style="color: oklch(0.58 0.030 180);">จัดการเอกสารจัดซื้อตาม Workflow</p>
							<div class="mt-3 flex items-center gap-1 text-xs font-medium transition-colors duration-200" style="color: oklch(0.54 0.16 150);">
								<span>เข้าสู่เมนู</span>
								<svg class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</div>
					</div>
				</a>
			{/if}

			{#if data.user.is_super_admin || data.user.permissions.can_manage_finance}
				<a href="/finance" class="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
					style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);">
					<div class="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-10"
						style="background: linear-gradient(135deg, oklch(0.60 0.12 240), oklch(0.70 0.12 240));"></div>
					<div class="relative flex items-start gap-4">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
							<svg class="h-6 w-6" style="color: oklch(0.60 0.12 240);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="flex-1">
							<p class="font-semibold transition-colors duration-200 group-hover:text-brand-600" style="color: oklch(0.38 0.040 180);">การเงินและเบิกจ่าย</p>
							<p class="mt-1 text-sm leading-relaxed" style="color: oklch(0.58 0.030 180);">ฎีกา บัญชี และภาษี</p>
							<div class="mt-3 flex items-center gap-1 text-xs font-medium transition-colors duration-200" style="color: oklch(0.52 0.14 240);">
								<span>เข้าสู่เมนู</span>
								<svg class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</div>
					</div>
				</a>
			{/if}
		</div>
	</div>
</div>
