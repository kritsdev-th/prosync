<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { formatBaht, formatNumber } from '$lib/utils/format';

	let { data, form: formResult } = $props();
	let showCreateModal = $state(false);
	let showFyModal = $state(false);
	let editingPlan = $state<any>(null);
	let creatingParentId = $state<number | null>(null);
	let createIsLeaf = $state(false);
	let editIsLeaf = $state(false);

	// Get parent plan's date range for constraining child plan dates
	function getParentPlan(parentId: number | null) {
		if (!parentId) return null;
		return data.plans.find((p: any) => p.id === parentId) || null;
	}

	let parentPlan = $derived(getParentPlan(creatingParentId));
	let parentMinDate = $derived(parentPlan?.start_date || '');
	let parentMaxDate = $derived(parentPlan?.end_date || '');

	function buildTree(planList: any[], parentId: number | null = null): any[] {
		return planList
			.filter((p) => p.parent_id === parentId)
			.map((p) => ({ ...p, children: buildTree(planList, p.id) }));
	}

	let tree = $derived(buildTree(data.plans));
	let activeFy = $derived(data.fiscalYears.find((fy: any) => fy.id === data.selectedFyId));

	function selectFy(fyId: number) {
		const params = new URLSearchParams();
		if (data.selectedAgencyId) params.set('agency_id', String(data.selectedAgencyId));
		params.set('fy_id', String(fyId));
		goto(`/planning?${params.toString()}`);
	}
</script>

{#snippet planNode(node: any, depth: number)}
	<div style="margin-left: {depth * 24}px" class="my-1">
		<div class="flex items-center gap-2 rounded-lg border bg-white p-3 hover:shadow-sm {node.is_leaf_node ? 'border-l-4 border-l-green-400' : ''}">
			<div class="flex-1">
				<div class="flex items-center gap-2">
					<span class="font-medium text-gray-900">{node.title}</span>
					<span class="rounded-full px-2 py-0.5 text-xs {node.plan_type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
						{node.plan_type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
					</span>
					{#if node.is_leaf_node}
						<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Leaf</span>
					{/if}
				</div>
				<div class="mt-1 flex flex-wrap gap-4 text-xs text-gray-500">
					<span>งบตั้ง: {formatBaht(node.estimated_amount)}</span>
					<span>จ่ายจริง: {formatBaht(node.actual_amount)}</span>
					{#if node.start_date && node.end_date}
						<span>ช่วงเวลา: {node.start_date} - {node.end_date}</span>
					{/if}
					{#if node.duration_text}
						<span>({node.duration_text})</span>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-1">
				{#if !node.is_leaf_node}
					<button
						onclick={() => { creatingParentId = node.id; showCreateModal = true; }}
						class="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
					>
						+ แผนย่อย
					</button>
				{/if}
				<button
					onclick={() => (editingPlan = node)}
					class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
				>
					แก้ไข
				</button>
				<form method="POST" action="?/deletePlan" use:enhance class="flex">
					<input type="hidden" name="id" value={node.id} />
					<button type="submit" class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">ลบ</button>
				</form>
			</div>
		</div>
		{#if node.children?.length > 0}
			{#each node.children as child}
				{@render planNode(child, depth + 1)}
			{/each}
		{/if}
	</div>
{/snippet}

<div>
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">แผนยุทธศาสตร์และงบประมาณ</h1>
			<p class="mt-1 text-sm text-gray-500">วางแผน ติดตาม และเปรียบเทียบข้อมูลปีต่อปี</p>
		</div>
		<div class="flex gap-2">
			<button onclick={() => (showFyModal = true)} class="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
				สร้างปีงบประมาณ
			</button>
			<button onclick={() => { creatingParentId = null; showCreateModal = true; }} class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
				สร้างแผนงาน
			</button>
		</div>
	</div>

	{#if data.user.is_super_admin && data.agencies.length > 0}
		<div class="mt-4">
			<select
				onchange={(e) => goto(`/planning?agency_id=${(e.target as HTMLSelectElement).value}`)}
				class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="">-- เลือกหน่วยงาน --</option>
				{#each data.agencies as agency}
					<option value={agency.id} selected={data.selectedAgencyId === agency.id}>{agency.name}</option>
				{/each}
			</select>
		</div>
	{/if}

	{#if formResult?.message}
		<div class="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{formResult.message}</div>
	{/if}

	<!-- Fiscal Year Tabs -->
	{#if data.fiscalYears.length > 0}
		<div class="mt-4 flex gap-2 border-b">
			{#each data.fiscalYears as fy}
				<button
					onclick={() => selectFy(fy.id)}
					class="rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors
						{data.selectedFyId === fy.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					ปี {fy.year_name}
					{#if fy.is_active}
						<span class="ml-1 rounded-full bg-green-100 px-1.5 text-xs text-green-700">Active</span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Fiscal Year Summary -->
		{#if activeFy}
			<div class="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
				<div class="rounded-xl border bg-white p-4">
					<p class="text-xs text-gray-500">คาดการณ์รายรับ</p>
					<p class="mt-1 text-lg font-bold text-green-600">{formatBaht(String(activeFy.total_estimated_income))}</p>
				</div>
				<div class="rounded-xl border bg-white p-4">
					<p class="text-xs text-gray-500">คาดการณ์รายจ่าย</p>
					<p class="mt-1 text-lg font-bold text-red-600">{formatBaht(String(activeFy.total_estimated_expense))}</p>
				</div>
				<div class="rounded-xl border bg-white p-4">
					<p class="text-xs text-gray-500">รายรับจริง</p>
					<p class="mt-1 text-lg font-bold text-green-700">{formatBaht(String(activeFy.total_actual_income))}</p>
				</div>
				<div class="rounded-xl border bg-white p-4">
					<p class="text-xs text-gray-500">รายจ่ายจริง</p>
					<p class="mt-1 text-lg font-bold text-red-700">{formatBaht(String(activeFy.total_actual_expense))}</p>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Plan Tree -->
	<div class="mt-6">
		{#if tree.length === 0}
			<div class="rounded-xl border bg-white p-8 text-center text-gray-500">
				{data.selectedAgencyId ? 'ยังไม่มีแผนงาน คลิก "สร้างแผนงาน" เพื่อเริ่มต้น' : 'กรุณาเลือกหน่วยงานก่อน'}
			</div>
		{:else}
			{#each tree as rootNode}
				{@render planNode(rootNode, 0)}
			{/each}
		{/if}
	</div>
</div>

<!-- Create Fiscal Year Modal -->
{#if showFyModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">สร้างปีงบประมาณ</h2>
			<form method="POST" action="?/createFiscalYear" use:enhance={() => {
				return async ({ update }) => { showFyModal = false; await update(); };
			}}>
				<input type="hidden" name="agency_id" value={data.selectedAgencyId || ''} />
				<div class="mt-4 space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700">ปีงบประมาณ (พ.ศ.) <span class="text-red-500">*</span></label>
						<input name="year_name" maxlength="4" placeholder="เช่น 2569" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => (showFyModal = false)} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
					<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">บันทึก</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Create Plan Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">สร้างแผนงาน{creatingParentId ? 'ย่อย' : ''}</h2>
			{#if parentPlan}
				<p class="mt-1 text-xs text-gray-500">แผนแม่: {parentPlan.title}
					{#if parentPlan.start_date && parentPlan.end_date}
						(ช่วงวันที่: {parentPlan.start_date} ถึง {parentPlan.end_date})
					{/if}
				</p>
			{/if}
			<form method="POST" action="?/createPlan" use:enhance={() => {
				return async ({ update }) => { showCreateModal = false; creatingParentId = null; createIsLeaf = false; await update(); };
			}}>
				<input type="hidden" name="agency_id" value={data.selectedAgencyId || ''} />
				<input type="hidden" name="fiscal_year_id" value={data.selectedFyId || ''} />
				<input type="hidden" name="parent_id" value={creatingParentId || ''} />
				<div class="mt-4 space-y-3">
					<div>
						<label for="create-title" class="block text-sm font-medium text-gray-700">ชื่อแผน/โครงการ/กิจกรรม <span class="text-red-500">*</span></label>
						<input id="create-title" name="title" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label for="create-plan_type" class="block text-sm font-medium text-gray-700">ประเภท <span class="text-red-500">*</span></label>
						<select id="create-plan_type" name="plan_type" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="EXPENSE">รายจ่าย (EXPENSE)</option>
							<option value="INCOME">รายรับ (INCOME)</option>
						</select>
					</div>
					<div>
						<label for="create-responsible_unit_id" class="block text-sm font-medium text-gray-700">หน่วยงานที่รับผิดชอบ</label>
						<select id="create-responsible_unit_id" name="responsible_unit_id" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- ไม่ระบุ --</option>
							{#each data.orgUnits as unit}
								<option value={unit.id}>{unit.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="create-start_date" class="block text-sm font-medium text-gray-700">วันที่เริ่มดำเนินการ</label>
							<input id="create-start_date" name="start_date" type="date" min={parentMinDate || undefined} max={parentMaxDate || undefined} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
						<div>
							<label for="create-end_date" class="block text-sm font-medium text-gray-700">วันที่สิ้นสุด</label>
							<input id="create-end_date" name="end_date" type="date" min={parentMinDate || undefined} max={parentMaxDate || undefined} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
					</div>
					<div>
						<label for="create-expected_outputs" class="block text-sm font-medium text-gray-700">ผลผลิตที่คาดหวัง</label>
						<textarea id="create-expected_outputs" name="expected_outputs" rows="3" placeholder="ระบุผลผลิตที่คาดหวัง (บรรทัดละรายการ)" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"></textarea>
					</div>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" name="is_leaf_node" value="true" onchange={(e) => { createIsLeaf = (e.target as HTMLInputElement).checked; }} class="rounded border-gray-300" />
						แผนล่างสุด (Leaf Node) - พร้อมเปิดเอกสารจัดซื้อ
					</label>
					{#if createIsLeaf}
						<div>
							<label for="create-estimated_amount" class="block text-sm font-medium text-gray-700">งบประมาณที่ตั้งไว้ (บาท)</label>
							<input id="create-estimated_amount" name="estimated_amount" type="number" step="0.01" value="0" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
					{:else}
						<p class="text-xs text-amber-600">* งบประมาณจะถูกคำนวณอัตโนมัติจากแผนย่อย (Bottom-up Rollup)</p>
					{/if}
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => { showCreateModal = false; creatingParentId = null; createIsLeaf = false; }} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
					<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">บันทึก</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Plan Modal -->
{#if editingPlan}
	{@const editParent = getParentPlan(editingPlan.parent_id)}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">แก้ไขแผนงาน</h2>
			{#if editParent}
				<p class="mt-1 text-xs text-gray-500">แผนแม่: {editParent.title}
					{#if editParent.start_date && editParent.end_date}
						(ช่วงวันที่: {editParent.start_date} ถึง {editParent.end_date})
					{/if}
				</p>
			{/if}
			<form method="POST" action="?/updatePlan" use:enhance={() => {
				return async ({ update }) => { editingPlan = null; editIsLeaf = false; await update(); };
			}}>
				<input type="hidden" name="id" value={editingPlan.id} />
				<div class="mt-4 space-y-3">
					<div>
						<label for="edit-title" class="block text-sm font-medium text-gray-700">ชื่อแผน/โครงการ/กิจกรรม</label>
						<input id="edit-title" name="title" value={editingPlan.title} required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label for="edit-responsible_unit_id" class="block text-sm font-medium text-gray-700">หน่วยงานที่รับผิดชอบ</label>
						<select id="edit-responsible_unit_id" name="responsible_unit_id" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- ไม่ระบุ --</option>
							{#each data.orgUnits as unit}
								<option value={unit.id} selected={editingPlan.responsible_unit_id === unit.id}>{unit.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="edit-start_date" class="block text-sm font-medium text-gray-700">วันที่เริ่มดำเนินการ</label>
							<input id="edit-start_date" name="start_date" type="date" value={editingPlan.start_date || ''} min={editParent?.start_date || undefined} max={editParent?.end_date || undefined} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
						<div>
							<label for="edit-end_date" class="block text-sm font-medium text-gray-700">วันที่สิ้นสุด</label>
							<input id="edit-end_date" name="end_date" type="date" value={editingPlan.end_date || ''} min={editParent?.start_date || undefined} max={editParent?.end_date || undefined} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
					</div>
					<div>
						<label for="edit-expected_outputs" class="block text-sm font-medium text-gray-700">ผลผลิตที่คาดหวัง</label>
						<textarea id="edit-expected_outputs" name="expected_outputs" rows="3" placeholder="ระบุผลผลิตที่คาดหวัง (บรรทัดละรายการ)" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">{Array.isArray(editingPlan.expected_outputs) ? editingPlan.expected_outputs.join('\n') : (editingPlan.expected_outputs || '')}</textarea>
					</div>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" name="is_leaf_node" value="true" checked={editingPlan.is_leaf_node} onchange={(e) => { editIsLeaf = (e.target as HTMLInputElement).checked; }} class="rounded border-gray-300" />
						แผนล่างสุด (Leaf Node)
					</label>
					{#if editIsLeaf || editingPlan.is_leaf_node}
						<div>
							<label for="edit-estimated_amount" class="block text-sm font-medium text-gray-700">งบประมาณที่ตั้งไว้ (บาท)</label>
							<input id="edit-estimated_amount" name="estimated_amount" type="number" step="0.01" value={editingPlan.estimated_amount} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
					{:else}
						<p class="text-xs text-amber-600">* งบประมาณจะถูกคำนวณอัตโนมัติจากแผนย่อย (Bottom-up Rollup)</p>
					{/if}
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => { editingPlan = null; editIsLeaf = false; }} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
					<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">บันทึก</button>
				</div>
			</form>
		</div>
	</div>
{/if}
