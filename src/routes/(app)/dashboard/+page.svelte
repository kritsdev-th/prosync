<script lang="ts">
	let { data } = $props();
	const stats = data.stats as Record<string, any>;
</script>

<div>
	<h1 class="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
	<p class="mt-1 text-sm text-gray-500">
		ยินดีต้อนรับ {data.user.name}
		{#if data.user.is_super_admin}
			(Super Admin)
		{/if}
	</p>

	<div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		{#if data.user.is_super_admin}
			<!-- Super Admin widgets -->
			<div class="rounded-xl border bg-white p-6 shadow-sm">
				<p class="text-sm font-medium text-gray-500">หน่วยงานทั้งหมด</p>
				<p class="mt-1 text-3xl font-bold text-blue-600">{stats.totalAgencies ?? 0}</p>
			</div>
			<div class="rounded-xl border bg-white p-6 shadow-sm">
				<p class="text-sm font-medium text-gray-500">ผู้ใช้งานทั้งหมด</p>
				<p class="mt-1 text-3xl font-bold text-blue-600">{stats.totalUsers ?? 0}</p>
			</div>
			<div class="rounded-xl border bg-white p-6 shadow-sm">
				<p class="text-sm font-medium text-gray-500">โหมด</p>
				<p class="mt-1 text-xl font-bold text-red-600">Super Admin</p>
				<p class="mt-1 text-xs text-gray-400">เข้าถึงได้ทุกหน่วยงาน</p>
			</div>
		{/if}

		{#if stats.fiscalYear}
			<!-- Director / Executive widgets -->
			<div class="rounded-xl border bg-white p-6 shadow-sm">
				<p class="text-sm font-medium text-gray-500">ปีงบประมาณ {stats.fiscalYear.year_name}</p>
				<div class="mt-2 space-y-1">
					<div class="flex justify-between text-xs">
						<span class="text-gray-500">คาดการณ์รายจ่าย</span>
						<span class="font-mono font-medium text-red-600">{Number(stats.fiscalYear.total_estimated_expense).toLocaleString('th-TH')}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-gray-500">จ่ายจริง</span>
						<span class="font-mono font-medium text-red-700">{Number(stats.fiscalYear.total_actual_expense).toLocaleString('th-TH')}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-gray-500">คาดการณ์รายรับ</span>
						<span class="font-mono font-medium text-green-600">{Number(stats.fiscalYear.total_estimated_income).toLocaleString('th-TH')}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-gray-500">รับจริง</span>
						<span class="font-mono font-medium text-green-700">{Number(stats.fiscalYear.total_actual_income).toLocaleString('th-TH')}</span>
					</div>
				</div>
			</div>
		{/if}

		{#if stats.activeDocuments !== undefined}
			<div class="rounded-xl border bg-white p-6 shadow-sm">
				<p class="text-sm font-medium text-gray-500">เอกสารกำลังดำเนินการ</p>
				<p class="mt-1 text-3xl font-bold text-yellow-600">{stats.activeDocuments}</p>
				<a href="/procurement" class="mt-2 inline-block text-xs text-blue-600 hover:underline">ดูทั้งหมด →</a>
			</div>
		{/if}

		{#if stats.pendingDikaVouchers !== undefined}
			<div class="rounded-xl border bg-white p-6 shadow-sm">
				<p class="text-sm font-medium text-gray-500">ฎีการอตรวจสอบ</p>
				<p class="mt-1 text-3xl font-bold text-purple-600">{stats.pendingDikaVouchers}</p>
				<a href="/finance" class="mt-2 inline-block text-xs text-blue-600 hover:underline">ดูทั้งหมด →</a>
			</div>
		{/if}

		<div class="rounded-xl border bg-white p-6 shadow-sm">
			<p class="text-sm font-medium text-gray-500">สถานะระบบ</p>
			<p class="mt-1 text-xl font-bold text-green-600">ออนไลน์</p>
		</div>
	</div>

	<!-- Quick Links -->
	<div class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">เมนูลัด</h2>
		<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#if data.user.is_super_admin || data.user.permissions.can_manage_plans}
				<a href="/planning" class="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
					<div class="rounded-lg bg-blue-50 p-2">
						<svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
					</div>
					<div>
						<p class="font-medium text-gray-900">แผนยุทธศาสตร์</p>
						<p class="text-xs text-gray-500">วางแผนและจัดการงบประมาณ</p>
					</div>
				</a>
			{/if}

			{#if data.user.is_super_admin || data.user.permissions.can_manage_procurement}
				<a href="/procurement" class="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
					<div class="rounded-lg bg-green-50 p-2">
						<svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
						</svg>
					</div>
					<div>
						<p class="font-medium text-gray-900">จัดซื้อจัดจ้าง</p>
						<p class="text-xs text-gray-500">จัดการเอกสารจัดซื้อตาม Workflow</p>
					</div>
				</a>
			{/if}

			{#if data.user.is_super_admin || data.user.permissions.can_manage_finance}
				<a href="/finance" class="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
					<div class="rounded-lg bg-purple-50 p-2">
						<svg class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<p class="font-medium text-gray-900">การเงินและเบิกจ่าย</p>
						<p class="text-xs text-gray-500">ฎีกา บัญชี และภาษี</p>
					</div>
				</a>
			{/if}
		</div>
	</div>
</div>
