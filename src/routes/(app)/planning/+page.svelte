<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { formatBaht } from '$lib/utils/format';

	let { data } = $props();
	let showCreateModal = $state(false);
	let showFyModal = $state(false);
	let editingPlan = $state<any>(null);
	let creatingParentId = $state<number | null>(null);
	let createIsLeaf = $state(false);
	let editIsLeaf = $state(false);
	let viewingPlan = $state<any>(null);
	let deletingPlan = $state<any>(null);

	// Toast notifications
	let toasts = $state<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
	let toastId = 0;
	function showToast(message: string, type: 'success' | 'error' = 'success') {
		const id = ++toastId;
		toasts = [...toasts, { id, message, type }];
		setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); }, 3000);
	}

	// Collapse/expand state: track which plan IDs are collapsed
	let collapsed = $state<Set<number>>(new Set());
	function toggleCollapse(id: number) {
		const next = new Set(collapsed);
		if (next.has(id)) next.delete(id); else next.add(id);
		collapsed = next;
	}

	// Pagination
	const PAGE_SIZE = 10;
	let currentPage = $state(1);

	let canCreate = $derived(!!data.selectedAgencyId);

	function getParentPlan(parentId: number | null) {
		if (!parentId) return null;
		return data.plans.find((p: any) => p.id === parentId) || null;
	}

	function getOrgUnitName(id: number | null) {
		if (!id) return null;
		return data.orgUnits.find((u: any) => u.id === id)?.name || null;
	}

	let parentPlan = $derived(getParentPlan(creatingParentId));
	let parentMinDate = $derived(parentPlan?.start_date || '');
	let parentMaxDate = $derived(parentPlan?.end_date || '');
	let isSubPlan = $derived(!!creatingParentId);

	function buildTree(planList: any[], parentId: number | null = null): any[] {
		return planList
			.filter((p) => p.parent_id === parentId)
			.map((p) => ({ ...p, children: buildTree(planList, p.id) }));
	}

	let tree = $derived(buildTree(data.plans));
	let totalPages = $derived(Math.max(1, Math.ceil(tree.length / PAGE_SIZE)));
	let paginatedTree = $derived(tree.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
	let activeFy = $derived(data.fiscalYears.find((fy: any) => fy.id === data.selectedFyId));

	// Reset page when data changes
	$effect(() => {
		if (data.selectedFyId) currentPage = 1;
	});

	function selectFy(fyId: number) {
		const params = new URLSearchParams();
		if (data.selectedAgencyId) params.set('agency_id', String(data.selectedAgencyId));
		params.set('fy_id', String(fyId));
		goto(`/planning?${params.toString()}`);
	}

	function budgetProgress(estimated: string, actual: string): number {
		const est = Number(estimated);
		const act = Number(actual);
		if (est <= 0) return 0;
		return Math.min(100, Math.round((act / est) * 100));
	}
</script>

<!-- Tree Node -->
{#snippet planNode(node: any, depth: number, isLast: boolean)}
	{@const progress = budgetProgress(node.estimated_amount, node.actual_amount)}
	{@const hasChildren = node.children?.length > 0}
	<div class="relative" style="margin-left: {depth > 0 ? '2rem' : '0'}">
		{#if depth > 0}
			<div class="absolute -left-5 top-0 h-5 w-5 border-b-2 border-l-2 rounded-bl-lg"
				style="border-color: var(--color-slate-200)"></div>
			{#if !isLast}
				<div class="absolute -left-5 top-0 bottom-0 border-l-2" style="border-color: var(--color-slate-200)"></div>
			{/if}
		{/if}

		<div class="mb-1.5">
			<div class="flex items-stretch gap-0">
				<!-- Collapse toggle: outside the modal-opening div -->
				{#if hasChildren}
					<button class="shrink-0 flex items-center justify-center rounded-l-lg px-2 transition-colors duration-150"
						style="color: var(--color-slate-400)"
						title={collapsed.has(node.id) ? 'ขยาย' : 'ยุบ'}
						onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-slate-100)'}
						onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
						onclick={() => toggleCollapse(node.id)}>
						<svg class="h-4 w-4 transition-transform duration-200" style="transform: rotate({collapsed.has(node.id) ? '0deg' : '90deg'}); transition-timing-function: var(--ease-out-expo)" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
					</button>
				{:else}
					<div class="w-8 shrink-0"></div>
				{/if}

				<!-- Card: opens detail modal -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div onclick={() => (viewingPlan = node)}
					class="group min-w-0 flex-1 cursor-pointer transition-all duration-300"
					style="transition-timing-function: var(--ease-out-expo)">
				<div class="flex items-center gap-3 rounded-lg px-3 py-2.5 hover-lift"
					style="background: {depth === 0 ? 'var(--color-slate-50)' : 'transparent'}">
					<!-- Left accent -->
					{#if depth === 0}
						<div class="w-1 self-stretch rounded-full"
							style="background: {node.plan_type === 'INCOME' ? 'var(--color-health-500)' : 'var(--color-brand-500)'}"></div>
					{/if}

					<!-- Content -->
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline gap-2">
							<span class="{depth === 0 ? 'text-sm font-semibold' : 'text-[0.8125rem] font-medium'} truncate"
								style="color: var(--color-slate-900)">{node.title}</span>
							<span class="shrink-0 rounded px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide uppercase"
								style="background: {node.plan_type === 'INCOME' ? 'var(--color-health-100)' : 'var(--color-brand-100)'}; color: {node.plan_type === 'INCOME' ? 'var(--color-health-700)' : 'var(--color-brand-700)'}">
								{node.plan_type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
							</span>
							{#if node.is_leaf_node}
								<span class="shrink-0 rounded px-1.5 py-0.5 text-[0.625rem] font-medium"
									style="background: var(--color-info-muted); color: var(--color-brand-700)">Leaf</span>
							{/if}
						</div>

						<!-- Budget row -->
						<div class="mt-1 flex items-center gap-3">
							<div class="flex-1">
								<div class="flex justify-between text-[0.6875rem]" style="color: var(--color-slate-500)">
									<span>{formatBaht(node.estimated_amount)}</span>
									<span>{formatBaht(node.actual_amount)}</span>
								</div>
								<div class="mt-0.5 h-1 w-full overflow-hidden rounded-full" style="background: var(--color-slate-200)">
									<div class="h-full rounded-full transition-all duration-500"
										style="width: {progress}%; background: {progress >= 90 ? 'var(--color-error)' : progress >= 60 ? 'var(--color-warning)' : 'var(--color-brand-500)'}; transition-timing-function: var(--ease-out-expo)"></div>
								</div>
							</div>
							{#if Number(node.estimated_amount) > 0}
								<span class="shrink-0 text-[0.625rem] font-semibold tabular-nums" style="color: var(--color-slate-500)">{progress}%</span>
							{/if}
						</div>

						{#if node.start_date && node.end_date}
							<p class="mt-0.5 text-[0.6875rem]" style="color: var(--color-slate-400)">
								{node.start_date} — {node.end_date}
								{#if node.duration_text}<span style="color: var(--color-slate-300)"> / {node.duration_text}</span>{/if}
							</p>
						{/if}
					</div>

					<!-- Actions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
						onclick={(e) => e.stopPropagation()}>
						{#if !node.is_leaf_node}
							<button onclick={() => { creatingParentId = node.id; showCreateModal = true; }}
								class="rounded-md p-1.5 transition-colors duration-150" title="เพิ่มแผนย่อย"
								style="color: var(--color-health-600)" onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-health-50)'} onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
								<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
							</button>
						{/if}
						<button onclick={() => { editingPlan = node; editIsLeaf = node.is_leaf_node; }}
							class="rounded-md p-1.5 transition-colors duration-150" title="แก้ไข"
							style="color: var(--color-brand-600)" onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-50)'} onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
							<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
						</button>
						<button class="rounded-md p-1.5 transition-colors duration-150" title="ลบ"
							style="color: var(--color-error)"
							onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-error-muted)'}
							onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
							onclick={(e) => { e.stopPropagation(); deletingPlan = node; }}>
							<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
						</button>
					</div>
				</div>
			</div>
			</div>

			{#if hasChildren && !collapsed.has(node.id)}
				<div class="relative pl-3">
					{#each node.children as child, i}
						{@render planNode(child, depth + 1, i === node.children.length - 1)}
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/snippet}

<!-- Page Layout -->
<div style="max-width: 72rem; margin: 0 auto; padding: clamp(1rem, 3vw, 2rem)">
	<!-- Header: asymmetric -->
	<div class="flex items-end justify-between gap-6">
		<div>
			<h1 style="color: var(--color-slate-900)">แผนยุทธศาสตร์และงบประมาณ</h1>
			<p class="mt-1" style="color: var(--color-slate-500); font-size: clamp(0.8125rem, 1.2vw, 0.875rem)">วางแผน ติดตาม และเปรียบเทียบข้อมูลปีต่อปี</p>
		</div>
		<div class="flex items-center gap-2">
			<button onclick={() => (showFyModal = true)} disabled={!canCreate}
				class="rounded-lg px-3 py-2 text-[0.8125rem] font-medium transition-colors duration-150 disabled:cursor-not-allowed"
				style="color: {canCreate ? 'var(--color-slate-600)' : 'var(--color-slate-300)'}; border: 1px solid var(--color-slate-200); opacity: {canCreate ? '1' : '0.6'}">
				สร้างปีงบประมาณ
			</button>
			<button onclick={() => { creatingParentId = null; showCreateModal = true; }} disabled={!canCreate}
				class="rounded-lg px-4 py-2 text-[0.8125rem] font-medium text-white transition-all duration-200 disabled:cursor-not-allowed"
				style="background: {canCreate ? 'var(--color-brand-600)' : 'var(--color-slate-300)'}">
				สร้างแผนงาน
			</button>
		</div>
	</div>

	{#if data.user.is_super_admin && data.agencies.length > 0}
		<div class="mt-5">
			<select onchange={(e) => goto(`/planning?agency_id=${(e.target as HTMLSelectElement).value}`)}
				class="rounded-lg px-3 py-2 text-sm"
				style="border: 1px solid var(--color-slate-200); color: var(--color-slate-700); background: white; outline: none">
				<option value="">-- เลือกหน่วยงาน --</option>
				{#each data.agencies as agency}
					<option value={agency.id} selected={data.selectedAgencyId === agency.id}>{agency.name}</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- Toast triggered via $effect below -->

	<!-- Fiscal Year Tabs -->
	{#if data.fiscalYears.length > 0}
		<div class="mt-6 flex gap-1" style="border-bottom: 1px solid var(--color-slate-200)">
			{#each data.fiscalYears as fy}
				<button onclick={() => selectFy(fy.id)}
					class="relative rounded-t-lg px-4 py-2.5 text-[0.8125rem] font-medium transition-colors duration-200"
					style="color: {data.selectedFyId === fy.id ? 'var(--color-brand-600)' : 'var(--color-slate-500)'}">
					ปี {fy.year_name}
					{#if fy.is_active}
						<span class="ml-1 inline-block h-1.5 w-1.5 rounded-full pulse-soft" style="background: var(--color-health-500)"></span>
					{/if}
					{#if data.selectedFyId === fy.id}
						<div class="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style="background: var(--color-brand-500)"></div>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Fiscal Year Summary: asymmetric 2+2 -->
		{#if activeFy}
			<div class="mt-5 grid grid-cols-4 gap-3" style="grid-template-columns: 1.2fr 1.2fr 1fr 1fr">
				<div class="rounded-lg p-4 slide-up" style="background: var(--color-health-50)">
					<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-health-600)">คาดการณ์รายรับ</p>
					<p class="mt-1 text-lg font-bold" style="color: var(--color-health-800)">{formatBaht(String(activeFy.total_estimated_income))}</p>
				</div>
				<div class="rounded-lg p-4 slide-up-delay-1" style="background: var(--color-brand-50)">
					<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-brand-600)">คาดการณ์รายจ่าย</p>
					<p class="mt-1 text-lg font-bold" style="color: var(--color-brand-800)">{formatBaht(String(activeFy.total_estimated_expense))}</p>
				</div>
				<div class="rounded-lg p-3 slide-up-delay-2" style="background: var(--color-slate-50)">
					<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-slate-400)">รายรับจริง</p>
					<p class="mt-1 text-base font-semibold" style="color: var(--color-slate-700)">{formatBaht(String(activeFy.total_actual_income))}</p>
				</div>
				<div class="rounded-lg p-3 slide-up-delay-3" style="background: var(--color-slate-50)">
					<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-slate-400)">รายจ่ายจริง</p>
					<p class="mt-1 text-base font-semibold" style="color: var(--color-slate-700)">{formatBaht(String(activeFy.total_actual_expense))}</p>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Plan Tree -->
	<div class="mt-8">
		{#if tree.length === 0}
			<div class="py-16 text-center" style="color: var(--color-slate-400)">
				<p class="text-sm">{data.selectedAgencyId ? 'ยังไม่มีแผนงาน' : 'กรุณาเลือกหน่วยงานก่อน'}</p>
			</div>
		{:else}
			<!-- Count + collapse all -->
			<div class="mb-3 flex items-center justify-between">
				<p class="text-[0.75rem]" style="color: var(--color-slate-400)">
					แผนงานทั้งหมด {tree.length} แผน
					{#if totalPages > 1}
						/ หน้า {currentPage} จาก {totalPages}
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<button onclick={() => { collapsed = new Set(); }}
						class="rounded px-2 py-1 text-[0.6875rem] font-medium transition-colors duration-150"
						style="color: var(--color-slate-500)">ขยายทั้งหมด</button>
					<button onclick={() => { collapsed = new Set(tree.map((n: any) => n.id)); }}
						class="rounded px-2 py-1 text-[0.6875rem] font-medium transition-colors duration-150"
						style="color: var(--color-slate-500)">ยุบทั้งหมด</button>
				</div>
			</div>

			<div class="space-y-1">
				{#each paginatedTree as rootNode, i}
					{@render planNode(rootNode, 0, i === paginatedTree.length - 1)}
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-6 flex items-center justify-center gap-1">
					<button onclick={() => (currentPage = Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
						class="rounded-md px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors duration-150 disabled:cursor-not-allowed"
						style="color: {currentPage <= 1 ? 'var(--color-slate-300)' : 'var(--color-slate-600)'}">
						&larr; ก่อนหน้า
					</button>
					{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
						<button onclick={() => (currentPage = page)}
							class="rounded-md px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors duration-150"
							style="background: {page === currentPage ? 'var(--color-brand-600)' : 'transparent'}; color: {page === currentPage ? 'white' : 'var(--color-slate-500)'}">
							{page}
						</button>
					{/each}
					<button onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
						class="rounded-md px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors duration-150 disabled:cursor-not-allowed"
						style="color: {currentPage >= totalPages ? 'var(--color-slate-300)' : 'var(--color-slate-600)'}">
						ถัดไป &rarr;
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- ═══════════ MODALS ═══════════ -->

{#snippet formField(id: string, label: string, required?: boolean)}
	<label for={id} class="block text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">
		{label}{#if required}<span style="color: var(--color-error)"> *</span>{/if}
	</label>
{/snippet}

<!-- Create Fiscal Year Modal -->
{#if showFyModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto fade-in"
		style="background: oklch(0.24 0.05 180 / 0.4); padding: clamp(2rem, 6vh, 4rem) 1rem"
		onclick={() => (showFyModal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="w-full scale-in" style="max-width: 32rem" onclick={(e) => e.stopPropagation()}>
			<div class="relative rounded-xl p-6" style="background: var(--color-slate-50); box-shadow: var(--shadow-xl)">
				<button onclick={() => (showFyModal = false)} title="ปิด" class="absolute right-3 top-3 rounded-md p-1 transition-colors duration-150" style="color: var(--color-slate-400)">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
				<h3 style="color: var(--color-slate-900)">สร้างปีงบประมาณ</h3>
				<form method="POST" action="?/createFiscalYear" use:enhance={() => {
					return async ({ update, result }) => { showFyModal = false; if (result.type === 'success') showToast('สร้างปีงบประมาณสำเร็จ'); await update(); };
				}}>
					<input type="hidden" name="agency_id" value={data.selectedAgencyId || ''} />
					<div class="mt-5">
						{@render formField('fy-year', 'ปีงบประมาณ (พ.ศ.)', true)}
						<input id="fy-year" name="year_name" maxlength="4" placeholder="เช่น 2569" required
							class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
							style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
					</div>
					<div class="mt-6 flex justify-end gap-2">
						<button type="button" onclick={() => (showFyModal = false)}
							class="rounded-lg px-3 py-2 text-sm font-medium" style="color: var(--color-slate-600)">ยกเลิก</button>
						<button type="submit" class="rounded-lg px-4 py-2 text-sm font-medium text-white"
							style="background: var(--color-brand-600)">บันทึก</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Create Plan Modal -->
{#if showCreateModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto fade-in"
		style="background: oklch(0.24 0.05 180 / 0.4); padding: clamp(2rem, 6vh, 4rem) 1rem"
		onclick={() => { showCreateModal = false; creatingParentId = null; createIsLeaf = false; }}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="w-full scale-in" style="max-width: 40rem" onclick={(e) => e.stopPropagation()}>
		<div class="relative rounded-xl p-6" style="background: var(--color-slate-50); box-shadow: var(--shadow-xl)">
			<button onclick={() => { showCreateModal = false; creatingParentId = null; createIsLeaf = false; }} title="ปิด" class="absolute right-3 top-3 rounded-md p-1 transition-colors duration-150" style="color: var(--color-slate-400)">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
			</button>
			<h3 style="color: var(--color-slate-900)">{isSubPlan ? 'สร้างแผนย่อย' : 'สร้างแผนงาน'}</h3>

			{#if parentPlan}
				<div class="mt-3 rounded-lg p-3" style="background: var(--color-brand-50)">
					<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-brand-500)">แผนแม่</p>
					<p class="mt-0.5 text-sm font-semibold" style="color: var(--color-slate-800)">{parentPlan.title}</p>
					<p class="mt-0.5 text-[0.75rem]" style="color: var(--color-slate-500)">
						{parentPlan.plan_type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
						{#if parentPlan.start_date} / {parentPlan.start_date} — {parentPlan.end_date}{/if}
						{#if getOrgUnitName(parentPlan.responsible_unit_id)} / {getOrgUnitName(parentPlan.responsible_unit_id)}{/if}
					</p>
				</div>
			{/if}

			<form method="POST" action="?/createPlan" use:enhance={() => {
				return async ({ update, result }) => { showCreateModal = false; creatingParentId = null; createIsLeaf = false; if (result.type === 'success') showToast('สร้างแผนงานสำเร็จ'); await update(); };
			}}>
				<input type="hidden" name="agency_id" value={data.selectedAgencyId || ''} />
				<input type="hidden" name="fiscal_year_id" value={data.selectedFyId || ''} />
				<input type="hidden" name="parent_id" value={creatingParentId || ''} />
				{#if isSubPlan && parentPlan}
					<input type="hidden" name="plan_type" value={parentPlan.plan_type} />
					<input type="hidden" name="responsible_unit_id" value={parentPlan.responsible_unit_id || ''} />
				{/if}

				<div class="mt-5 space-y-4">
					<div>
						{@render formField('c-title', 'ชื่อแผน/โครงการ/กิจกรรม', true)}
						<input id="c-title" name="title" required
							class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
							style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
					</div>

					{#if !isSubPlan}
						<div class="grid grid-cols-2 gap-3">
							<div>
								{@render formField('c-type', 'ประเภท', true)}
								<select id="c-type" name="plan_type" required
									class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
									style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white">
									<option value="EXPENSE">รายจ่าย</option>
									<option value="INCOME">รายรับ</option>
								</select>
							</div>
							<div>
								{@render formField('c-unit', 'หน่วยงานรับผิดชอบ')}
								<select id="c-unit" name="responsible_unit_id"
									class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
									style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white">
									<option value="">-- ไม่ระบุ --</option>
									{#each data.orgUnits as unit}<option value={unit.id}>{unit.name}</option>{/each}
								</select>
							</div>
						</div>
					{:else}
						<div class="grid grid-cols-2 gap-3">
							<div>
								<p class="text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">ประเภท</p>
								<div class="mt-1 rounded-lg px-3 py-2 text-sm" style="background: var(--color-slate-100); color: var(--color-slate-500)">
									{parentPlan?.plan_type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
								</div>
							</div>
							<div>
								<p class="text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">หน่วยงาน</p>
								<div class="mt-1 truncate rounded-lg px-3 py-2 text-sm" style="background: var(--color-slate-100); color: var(--color-slate-500)">
									{getOrgUnitName(parentPlan?.responsible_unit_id ?? null) || 'ไม่ระบุ'}
								</div>
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-3">
						<div>
							{@render formField('c-start', 'วันที่เริ่ม')}
							<input id="c-start" name="start_date" type="date" min={parentMinDate || undefined} max={parentMaxDate || undefined}
								class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
								style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
						</div>
						<div>
							{@render formField('c-end', 'วันที่สิ้นสุด')}
							<input id="c-end" name="end_date" type="date" min={parentMinDate || undefined} max={parentMaxDate || undefined}
								class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
								style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							{@render formField('c-desc', 'กิจกรรม/ขั้นตอน')}
							<textarea id="c-desc" name="description" rows="3" placeholder="อธิบายกิจกรรม"
								class="mt-1 block w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
								style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white"></textarea>
						</div>
						<div>
							{@render formField('c-outputs', 'ผลผลิตที่คาดหวัง')}
							<textarea id="c-outputs" name="expected_outputs" rows="3" placeholder="บรรทัดละรายการ"
								class="mt-1 block w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
								style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white"></textarea>
						</div>
					</div>

					{#if !isSubPlan}
						<div>
							<p class="text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">ผู้เกี่ยวข้อง (หน่วยงาน)</p>
							<div class="mt-1 max-h-24 overflow-y-auto rounded-lg p-2 space-y-0.5" style="border: 1px solid var(--color-slate-200); background: white">
								{#each data.orgUnits as unit}
									<label class="flex items-center gap-2 rounded px-2 py-1 text-sm cursor-pointer"
										style="color: var(--color-slate-700)">
										<input type="checkbox" name="stakeholder_unit_check" value={unit.id}
											style="accent-color: var(--color-brand-600)"
											onchange={(e) => {
												const form = (e.target as HTMLInputElement).closest('form');
												if (!form) return;
												const checks = form.querySelectorAll<HTMLInputElement>('input[name="stakeholder_unit_check"]:checked');
												const hidden = form.querySelector<HTMLInputElement>('input[name="stakeholder_unit_ids"]');
												if (hidden) hidden.value = Array.from(checks).map(c => c.value).join(',');
											}} />
										{unit.name}
									</label>
								{/each}
							</div>
							<input type="hidden" name="stakeholder_unit_ids" value="" />
						</div>
					{:else if Array.isArray(parentPlan?.stakeholder_unit_ids) && parentPlan.stakeholder_unit_ids.length > 0}
						<div>
							<p class="text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">ผู้เกี่ยวข้อง (หน่วยงาน)</p>
							<div class="mt-1 flex flex-wrap gap-1.5">
								{#each parentPlan.stakeholder_unit_ids as sid}
									{#if getOrgUnitName(sid)}
										<span class="rounded-md px-2.5 py-1 text-[0.75rem] font-medium" style="background: var(--color-brand-50); color: var(--color-brand-700)">{getOrgUnitName(sid)}</span>
									{/if}
								{/each}
							</div>
							<input type="hidden" name="stakeholder_unit_ids" value={parentPlan.stakeholder_unit_ids.join(',')} />
						</div>
					{/if}

					<div class="flex items-center gap-4">
						<label class="flex items-center gap-2 text-sm cursor-pointer" style="color: var(--color-slate-700)">
							<input type="checkbox" name="is_leaf_node" value="true" style="accent-color: var(--color-brand-600)"
								onchange={(e) => { createIsLeaf = (e.target as HTMLInputElement).checked; }} />
							Leaf Node (พร้อมจัดซื้อ)
						</label>
						{#if createIsLeaf}
							<div class="flex-1">
								{@render formField('c-amount', 'งบประมาณ (บาท)')}
								<input id="c-amount" name="estimated_amount" type="number" step="0.01" value="0"
									class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
									style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
							</div>
						{:else}
							<p class="text-[0.75rem]" style="color: var(--color-warning)">งบประมาณคำนวณอัตโนมัติจากแผนย่อย</p>
						{/if}
					</div>
				</div>

				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => { showCreateModal = false; creatingParentId = null; createIsLeaf = false; }}
						class="rounded-lg px-3 py-2 text-sm font-medium" style="color: var(--color-slate-600)">ยกเลิก</button>
					<button type="submit" class="rounded-lg px-4 py-2 text-sm font-medium text-white"
						style="background: var(--color-brand-600)">บันทึก</button>
				</div>
			</form>
		</div>
		</div>
	</div>
{/if}

<!-- Edit Plan Modal -->
{#if editingPlan}
	{@const editParent = getParentPlan(editingPlan.parent_id)}
	{@const isEditRoot = !editingPlan.parent_id}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto fade-in"
		style="background: oklch(0.24 0.05 180 / 0.4); padding: clamp(2rem, 6vh, 4rem) 1rem"
		onclick={() => { editingPlan = null; editIsLeaf = false; }}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="w-full scale-in" style="max-width: 40rem" onclick={(e) => e.stopPropagation()}>
		<div class="relative rounded-xl p-6" style="background: var(--color-slate-50); box-shadow: var(--shadow-xl)">
			<button onclick={() => { editingPlan = null; editIsLeaf = false; }} title="ปิด" class="absolute right-3 top-3 rounded-md p-1 transition-colors duration-150" style="color: var(--color-slate-400)">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
			</button>
			<h3 style="color: var(--color-slate-900)">แก้ไขแผนงาน</h3>

			{#if editParent}
				<div class="mt-3 rounded-lg p-3" style="background: var(--color-brand-50)">
					<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-brand-500)">แผนแม่</p>
					<p class="mt-0.5 text-sm font-semibold" style="color: var(--color-slate-800)">{editParent.title}</p>
				</div>
			{/if}

			<form method="POST" action="?/updatePlan" use:enhance={() => {
				return async ({ update, result }) => { editingPlan = null; editIsLeaf = false; if (result.type === 'success') showToast('แก้ไขแผนงานสำเร็จ'); await update(); };
			}}>
				<input type="hidden" name="id" value={editingPlan.id} />
				<div class="mt-5 space-y-4">
					<div>
						{@render formField('e-title', 'ชื่อแผน/โครงการ/กิจกรรม')}
						<input id="e-title" name="title" value={editingPlan.title} required
							class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
							style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
					</div>

					{#if isEditRoot}
						<div>
							{@render formField('e-unit', 'หน่วยงานรับผิดชอบ')}
							<select id="e-unit" name="responsible_unit_id"
								class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
								style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white">
								<option value="">-- ไม่ระบุ --</option>
								{#each data.orgUnits as unit}<option value={unit.id} selected={editingPlan.responsible_unit_id === unit.id}>{unit.name}</option>{/each}
							</select>
						</div>
					{:else}
						<div class="grid grid-cols-2 gap-3">
							<div>
								<p class="text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">ประเภท</p>
								<div class="mt-1 rounded-lg px-3 py-2 text-sm" style="background: var(--color-slate-100); color: var(--color-slate-500)">{editingPlan.plan_type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}</div>
							</div>
							<div>
								<p class="text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">หน่วยงาน</p>
								<div class="mt-1 truncate rounded-lg px-3 py-2 text-sm" style="background: var(--color-slate-100); color: var(--color-slate-500)">{getOrgUnitName(editingPlan.responsible_unit_id) || 'ไม่ระบุ'}</div>
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-3">
						<div>
							{@render formField('e-start', 'วันที่เริ่ม')}
							<input id="e-start" name="start_date" type="date" value={editingPlan.start_date || ''} min={editParent?.start_date || undefined} max={editParent?.end_date || undefined}
								class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
								style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
						</div>
						<div>
							{@render formField('e-end', 'วันที่สิ้นสุด')}
							<input id="e-end" name="end_date" type="date" value={editingPlan.end_date || ''} min={editParent?.start_date || undefined} max={editParent?.end_date || undefined}
								class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
								style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							{@render formField('e-desc', 'กิจกรรม/ขั้นตอน')}
							<textarea id="e-desc" name="description" rows="3"
								class="mt-1 block w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
								style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white">{editingPlan.description || ''}</textarea>
						</div>
						<div>
							{@render formField('e-outputs', 'ผลผลิตที่คาดหวัง')}
							<textarea id="e-outputs" name="expected_outputs" rows="3"
								class="mt-1 block w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
								style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white">{Array.isArray(editingPlan.expected_outputs) ? editingPlan.expected_outputs.join('\n') : (editingPlan.expected_outputs || '')}</textarea>
						</div>
					</div>

					<div>
						<p class="text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">ผู้เกี่ยวข้อง (หน่วยงาน)</p>
						<div class="mt-1 max-h-24 overflow-y-auto rounded-lg p-2 space-y-0.5" style="border: 1px solid var(--color-slate-200); background: white">
							{#each data.orgUnits as unit}
								<label class="flex items-center gap-2 rounded px-2 py-1 text-sm cursor-pointer" style="color: var(--color-slate-700)">
									<input type="checkbox" name="edit_stakeholder_check" value={unit.id}
										checked={Array.isArray(editingPlan.stakeholder_unit_ids) && editingPlan.stakeholder_unit_ids.includes(unit.id)}
										style="accent-color: var(--color-brand-600)"
										onchange={(e) => {
											const form = (e.target as HTMLInputElement).closest('form');
											if (!form) return;
											const checks = form.querySelectorAll<HTMLInputElement>('input[name="edit_stakeholder_check"]:checked');
											const hidden = form.querySelector<HTMLInputElement>('input[name="stakeholder_unit_ids"]');
											if (hidden) hidden.value = Array.from(checks).map(c => c.value).join(',');
										}} />
									{unit.name}
								</label>
							{/each}
						</div>
						<input type="hidden" name="stakeholder_unit_ids" value={Array.isArray(editingPlan.stakeholder_unit_ids) ? editingPlan.stakeholder_unit_ids.join(',') : ''} />
					</div>

					<div class="flex items-center gap-4">
						<label class="flex items-center gap-2 text-sm cursor-pointer" style="color: var(--color-slate-700)">
							<input type="checkbox" name="is_leaf_node" value="true" checked={editingPlan.is_leaf_node} style="accent-color: var(--color-brand-600)"
								onchange={(e) => { editIsLeaf = (e.target as HTMLInputElement).checked; }} />
							Leaf Node (พร้อมจัดซื้อ)
						</label>
						{#if editIsLeaf}
							<div class="flex-1">
								{@render formField('e-amount', 'งบประมาณ (บาท)')}
								<input id="e-amount" name="estimated_amount" type="number" step="0.01" value={editingPlan.estimated_amount}
									class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
									style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
							</div>
						{:else}
							<p class="text-[0.75rem]" style="color: var(--color-warning)">งบประมาณคำนวณอัตโนมัติจากแผนย่อย</p>
						{/if}
					</div>
				</div>

				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => { editingPlan = null; editIsLeaf = false; }}
						class="rounded-lg px-3 py-2 text-sm font-medium" style="color: var(--color-slate-600)">ยกเลิก</button>
					<button type="submit" class="rounded-lg px-4 py-2 text-sm font-medium text-white"
						style="background: var(--color-brand-600)">บันทึก</button>
				</div>
			</form>
		</div>
		</div>
	</div>
{/if}

<!-- Detail View Modal -->
{#if viewingPlan}
	{@const vParent = getParentPlan(viewingPlan.parent_id)}
	{@const vProgress = budgetProgress(viewingPlan.estimated_amount, viewingPlan.actual_amount)}
	{@const vUnit = getOrgUnitName(viewingPlan.responsible_unit_id)}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto fade-in"
		style="background: oklch(0.24 0.05 180 / 0.4); padding: clamp(2rem, 6vh, 4rem) 1rem"
		onclick={() => (viewingPlan = null)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="w-full scale-in" style="max-width: 36rem" onclick={(e) => e.stopPropagation()}>
			<div class="relative overflow-hidden rounded-xl" style="background: var(--color-slate-50); box-shadow: var(--shadow-xl)">

				<!-- Close -->
				<button onclick={() => (viewingPlan = null)} title="ปิด"
					class="absolute right-3 top-3 z-10 rounded-md p-1 transition-colors duration-150"
					style="color: var(--color-slate-400)"
					onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-slate-700)'; (e.currentTarget as HTMLElement).style.background = 'var(--color-slate-100)' }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-slate-400)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>

				<!-- Header -->
				<div class="px-6 pt-5 pb-4" style="border-bottom: 1px solid var(--color-slate-200)">
					<div class="flex items-baseline gap-2 pr-8 flex-wrap">
						<h3 style="color: var(--color-slate-900)">{viewingPlan.title}</h3>
						<span class="rounded px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide"
							style="background: {viewingPlan.plan_type === 'INCOME' ? 'var(--color-health-100)' : 'var(--color-brand-100)'}; color: {viewingPlan.plan_type === 'INCOME' ? 'var(--color-health-700)' : 'var(--color-brand-700)'}">
							{viewingPlan.plan_type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
						</span>
						{#if viewingPlan.is_leaf_node}
							<span class="rounded px-1.5 py-0.5 text-[0.625rem] font-medium" style="background: var(--color-info-muted); color: var(--color-brand-700)">Leaf</span>
						{/if}
					</div>
					{#if vParent}
						<p class="mt-1 text-[0.8125rem]" style="color: var(--color-slate-400)">แผนแม่: {vParent.title}</p>
					{/if}
				</div>

				<!-- Body -->
				<div class="px-6 py-5" style="display: grid; gap: clamp(1rem, 2.5vw, 1.5rem)">

					<!-- Budget -->
					<div class="rounded-lg p-4" style="background: white; border: 1px solid var(--color-slate-100)">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-slate-400)">งบประมาณที่ตั้งไว้</p>
								<p class="mt-0.5 text-lg font-bold" style="color: var(--color-slate-900)">{formatBaht(viewingPlan.estimated_amount)}</p>
							</div>
							<div class="text-right">
								<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-slate-400)">เบิกจ่ายจริง</p>
								<p class="mt-0.5 text-lg font-bold" style="color: var(--color-slate-900)">{formatBaht(viewingPlan.actual_amount)}</p>
							</div>
						</div>
						{#if Number(viewingPlan.estimated_amount) > 0}
							<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full" style="background: var(--color-slate-100)">
								<div class="h-full rounded-full" style="width: {vProgress}%; background: {vProgress >= 90 ? 'var(--color-error)' : vProgress >= 60 ? 'var(--color-warning)' : 'var(--color-brand-500)'}; transition: width 0.5s var(--ease-out-expo)"></div>
							</div>
							<p class="mt-1 text-right text-[0.6875rem] font-medium"
								style="color: {vProgress >= 90 ? 'var(--color-error)' : vProgress >= 60 ? 'var(--color-warning)' : 'var(--color-brand-500)'}">
								ใช้ไป {vProgress}%
							</p>
						{/if}
					</div>

					<!-- Info grid: asymmetric -->
					{#if viewingPlan.start_date || vUnit}
						<div class="grid gap-4" style="grid-template-columns: {viewingPlan.start_date && vUnit ? '1.3fr 1fr' : '1fr'}">
							{#if viewingPlan.start_date}
								<div>
									<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-slate-400)">ระยะเวลาดำเนินการ</p>
									<p class="mt-1 text-sm font-medium" style="color: var(--color-slate-800)">
										{viewingPlan.start_date} — {viewingPlan.end_date || '...'}
									</p>
									{#if viewingPlan.duration_text}
										<p class="text-[0.75rem]" style="color: var(--color-slate-500)">{viewingPlan.duration_text}</p>
									{/if}
								</div>
							{/if}
							{#if vUnit}
								<div>
									<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-slate-400)">หน่วยงานรับผิดชอบ</p>
									<p class="mt-1 text-sm font-medium" style="color: var(--color-slate-800)">{vUnit}</p>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Stakeholders -->
					{#if Array.isArray(viewingPlan.stakeholder_unit_ids) && viewingPlan.stakeholder_unit_ids.length > 0}
						<div>
							<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-slate-400)">หน่วยงานที่เกี่ยวข้อง</p>
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each viewingPlan.stakeholder_unit_ids as sid}
									{#if getOrgUnitName(sid)}
										<span class="rounded-md px-2.5 py-1 text-[0.75rem] font-medium"
											style="background: var(--color-brand-50); color: var(--color-brand-700)">{getOrgUnitName(sid)}</span>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					<!-- Description -->
					<div>
						<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-slate-400)">กิจกรรม/ขั้นตอน</p>
						<div class="mt-2 overflow-y-auto rounded-lg p-3" style="background: white; border: 1px solid var(--color-slate-100); height: 8rem">
							<p class="whitespace-pre-wrap text-sm leading-relaxed" style="color: var(--color-slate-700); overflow-wrap: anywhere">{viewingPlan.description || '-'}</p>
						</div>
					</div>

					<!-- Expected outputs -->
					<div>
						<p class="text-[0.6875rem] font-medium uppercase tracking-wider" style="color: var(--color-slate-400)">ผลผลิตที่คาดหวัง</p>
						<div class="mt-2 overflow-y-auto rounded-lg p-3" style="background: var(--color-warning-muted); border: 1px solid oklch(0.90 0.04 85); height: 4rem">
							<p class="whitespace-pre-wrap text-sm leading-relaxed" style="color: var(--color-slate-700); overflow-wrap: anywhere">{Array.isArray(viewingPlan.expected_outputs) && viewingPlan.expected_outputs.length > 0 ? viewingPlan.expected_outputs.join('\n') : '-'}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirm Modal -->
{#if deletingPlan}
	{@const hasChildPlans = data.plans.some((p: any) => p.parent_id === deletingPlan.id)}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center fade-in"
		style="background: oklch(0.24 0.05 180 / 0.4); padding: 1rem"
		onclick={() => (deletingPlan = null)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="w-full scale-in" style="max-width: 26rem" onclick={(e) => e.stopPropagation()}>
			<div class="rounded-xl p-6 text-center" style="background: var(--color-slate-50); box-shadow: var(--shadow-xl)">
				<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style="background: var(--color-error-muted)">
					<svg class="h-7 w-7" style="color: var(--color-error)" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
				</div>
				<h3 class="mt-4 text-lg font-semibold" style="color: var(--color-slate-900)">ยืนยันการลบแผนงาน</h3>
				<p class="mt-2 text-sm" style="color: var(--color-slate-600)">
					ต้องการลบ <strong style="color: var(--color-slate-800)">{deletingPlan.title}</strong> ใช่หรือไม่?
				</p>
				{#if hasChildPlans}
					<p class="mt-3 rounded-md px-3 py-2 text-[0.8125rem] font-medium" style="background: var(--color-error-muted); color: var(--color-error)">
						แผนงานย่อยทั้งหมดภายใต้แผนนี้จะถูกลบด้วย
					</p>
				{/if}
				<div class="mt-5 flex justify-center gap-3">
					<button onclick={() => (deletingPlan = null)}
						class="rounded-lg px-4 py-2 text-sm font-medium" style="color: var(--color-slate-600); border: 1px solid var(--color-slate-200)">ยกเลิก</button>
					<form method="POST" action="?/deletePlan" use:enhance={() => {
						return async ({ update }) => {
							showToast('ลบแผนงานสำเร็จ', 'error');
							deletingPlan = null;
							await update();
						};
					}}>
						<input type="hidden" name="id" value={deletingPlan.id} />
						<button type="submit" class="rounded-lg px-4 py-2 text-sm font-medium text-white"
							style="background: var(--color-error)">ลบแผนงาน</button>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Toast Notifications -->
{#if toasts.length > 0}
	<div class="fixed right-4 top-4 z-[60] flex flex-col gap-2" style="pointer-events: none">
		{#each toasts as toast (toast.id)}
			<div class="toast-slide-in rounded-lg px-4 py-3 text-[0.8125rem] font-medium"
				style="pointer-events: auto; box-shadow: var(--shadow-md);
					background: {toast.type === 'error' ? 'var(--color-error-muted)' : 'var(--color-success-muted)'};
					color: {toast.type === 'error' ? 'var(--color-error)' : 'var(--color-health-700)'};
					border: 1px solid {toast.type === 'error' ? 'oklch(0.85 0.06 25)' : 'oklch(0.85 0.06 150)'}">
				{toast.message}
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes toastSlideIn {
		from { opacity: 0; transform: translateX(100%); }
		to { opacity: 1; transform: translateX(0); }
	}
	.toast-slide-in {
		animation: toastSlideIn 0.4s var(--ease-out-expo) forwards;
	}
</style>
