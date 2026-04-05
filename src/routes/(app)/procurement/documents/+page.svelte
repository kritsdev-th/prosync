<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ScopeSelector from '$lib/components/ScopeSelector.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { formatBaht } from '$lib/utils/format';
	import { inferStepType, STEP_TYPE_LABELS, getStepConfigSummary } from '$lib/types/workflow';

	let { data, form: formResult } = $props();
	let showCreateModal = $state(false);
	let selectedWorkflowId = $state<number | null>(null);
	let searchQuery = $state('');
	let canCreate = $derived(data.user.is_super_admin || data.user.is_director || data.user.permissions?.can_manage_procurement);
	let selectedFyId = $state<number | null>(null);
	let _fyInit = $derived.by(() => {
		if (selectedFyId === null && data.fiscalYears?.length > 0) {
			selectedFyId = data.fiscalYears.find((fy: any) => fy.is_active)?.id ?? data.fiscalYears[0]?.id ?? null;
		}
	});

	let selectedWorkflowSteps = $derived(
		selectedWorkflowId
			? (data.workflowSteps ?? []).filter((s: any) => s.workflow_id === selectedWorkflowId).sort((a: any, b: any) => a.step_sequence - b.step_sequence)
			: []
	);

	let filteredDocs = $derived.by(() => {
		let docs = data.documents;
		// Filter by fiscal year
		if (selectedFyId) {
			docs = docs.filter((d: any) => d.fiscal_year_id === selectedFyId);
		}
		// Filter by search query
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			docs = docs.filter((d: any) =>
				d.workflow_name.toLowerCase().includes(q) ||
				d.plan_title.toLowerCase().includes(q) ||
				String(d.id).includes(q)
			);
		}
		return docs;
	});
</script>

<div>
	<BackButton href="/procurement" label="กลับหน้าจัดซื้อจัดจ้าง" />

	<div class="page-header">
		<div>
			<h1 class="page-title">เอกสารจัดซื้อจัดจ้าง</h1>
			<p class="page-subtitle">สร้างเอกสาร เชื่อมแผนงาน และดำเนินการตามขั้นตอน</p>
		</div>
		{#if canCreate}
			<button onclick={() => (showCreateModal = true)} class="btn-primary">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				สร้างเอกสาร
			</button>
		{/if}
	</div>

	{#if data.user.is_super_admin}
		<ScopeSelector
			provinces={data.provinces}
			agencies={data.agencies}
			orgUnits={[]}
			selectedProvinceId={data.selectedProvinceId}
			selectedAgencyId={data.selectedAgencyId}
			isSuperAdmin={true}
			basePath="/procurement/documents"
			compact={true}
		/>
	{/if}

	{#if formResult?.message}
		<div class="toast-success">{formResult.message}</div>
	{/if}
	{#if formResult?.errors?.plan_id}
		<div class="toast-error">{formResult.errors.plan_id[0]}</div>
	{/if}

	<!-- Fiscal Year Tabs + Search -->
	<div class="filter-bar">
		{#if data.fiscalYears?.length > 0}
			<div class="fy-tabs">
				<button class="fy-tab" class:active={!selectedFyId} onclick={() => (selectedFyId = null)}>ทั้งหมด</button>
				{#each data.fiscalYears as fy}
					<button class="fy-tab" class:active={selectedFyId === fy.id} onclick={() => (selectedFyId = fy.id)}>
						{fy.year_name}
						{#if fy.is_active}<span class="fy-dot"></span>{/if}
					</button>
				{/each}
			</div>
		{/if}
		<div class="search-wrap">
			<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
			<input type="text" placeholder="ค้นหาวิธีจัดซื้อ, แผนงาน..." bind:value={searchQuery} class="search-input" />
		</div>
	</div>

	<!-- Documents Table -->
	<div class="table-card">
		<div class="table-scroll">
			<table class="data-table">
				<thead>
					<tr>
						<th class="id-col">#</th>
						<th>วิธีจัดซื้อ</th>
						<th>แผนงาน</th>
						<th>สถานะ</th>
						<th class="action-col">จัดการ</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredDocs as doc}
						<tr>
							<td class="id-col id-cell">{doc.id}</td>
							<td>{doc.workflow_name}</td>
							<td class="name-cell">{doc.plan_title}</td>
							<td><StatusBadge status={doc.status} /></td>
							<td class="action-col">
								<a href="/procurement/{doc.id}" class="view-btn">ดูรายละเอียด</a>
							</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="empty-cell">
							{#if !data.selectedAgencyId && data.user.is_super_admin}
								กรุณาเลือกจังหวัดและหน่วยงานก่อน
							{:else}
								ไม่มีเอกสารจัดซื้อจัดจ้าง
							{/if}
						</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if filteredDocs.length > 0}
			<div class="list-footer">ทั้งหมด {filteredDocs.length} รายการ</div>
		{/if}
	</div>
</div>

<!-- Create Document Modal -->
{#if showCreateModal}
	<div class="modal-bg" onclick={() => (showCreateModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-title">สร้างเอกสารจัดซื้อจัดจ้าง</h2>
			<form method="POST" action="?/createDocument" use:enhance={() => {
				return async ({ update, result }) => { if (result.type === 'success') showCreateModal = false; await update(); };
			}}>
				<input type="hidden" name="agency_id" value={data.selectedAgencyId || ''} />
				<div class="modal-body">
					<div class="ff">
						<label class="fl">วิธีจัดซื้อจัดจ้าง <span class="req">*</span></label>
						<CustomSelect
							name="workflow_id"
							required
							placeholder="-- เลือกวิธี --"
							class="fi"
							options={data.workflows.map((wf) => ({ value: String(wf.id), label: `${wf.name} (${wf.total_steps} ขั้นตอน)` }))}
							onchange={(v) => { selectedWorkflowId = Number(v) || null; }}
						/>
					</div>
					<div class="ff">
						<label class="fl">แผนงาน (Leaf Node) <span class="req">*</span></label>
						<CustomSelect
							name="plan_id"
							required
							placeholder="-- เลือกแผนงาน --"
							class="fi"
							options={data.leafPlans.map((plan) => ({ value: String(plan.id), label: `[ปี ${plan.fiscal_year}] ${plan.title} (${formatBaht(plan.estimated_amount)})` }))}
						/>
					</div>

					<!-- Steps Preview -->
					{#if selectedWorkflowSteps.length > 0}
						<div class="steps-preview">
							<h4 class="preview-title">ขั้นตอนทั้งหมด ({selectedWorkflowSteps.length} ขั้นตอน)</h4>
							<div class="steps-list">
								{#each selectedWorkflowSteps as step}
									{@const stype = inferStepType(step.ui_schema)}
									{@const stypeInfo = stype ? STEP_TYPE_LABELS[stype] : null}
									<div class="step-row">
										<div class="step-num">{step.step_sequence}</div>
										<div class="step-info">
											<span class="step-name">{step.step_name}</span>
											{#if stypeInfo}
												<span class="step-badge" style="background: {stypeInfo.bg}; color: {stypeInfo.color};">{stypeInfo.label}</span>
											{/if}
											{#if step.approver_role}
												<span class="step-badge approver-badge">อนุมัติ: {step.approver_role}</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				<div class="modal-foot">
					<button type="button" onclick={() => { showCreateModal = false; selectedWorkflowId = null; }} class="btn-ghost">ยกเลิก</button>
					<button type="submit" class="btn-primary">สร้างเอกสาร</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin: 20px 0 24px; gap: 16px; }
	.page-title { margin: 0 0 4px 0; font-size: clamp(1.375rem, 1.1rem + 0.7vw, 1.625rem); font-weight: 700; color: oklch(0.2 0.02 180); }
	.page-subtitle { margin: 0; font-size: 0.875rem; color: oklch(0.5 0.02 180); }

	.btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 10px; border: none; background: oklch(0.52 0.14 240); color: oklch(0.98 0.005 180); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
	.btn-primary:hover { opacity: 0.88; }
	.btn-ghost { padding: 8px 16px; border-radius: 10px; border: none; background: none; color: oklch(0.45 0.02 180); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
	.btn-icon { width: 16px; height: 16px; }

	.toast-success { padding: 12px 18px; margin-bottom: 12px; border-radius: 10px; background: oklch(0.54 0.16 150 / 0.08); color: oklch(0.38 0.14 150); font-size: 0.875rem; border-left: 3px solid oklch(0.54 0.16 150); }
	.toast-error { padding: 12px 18px; margin-bottom: 12px; border-radius: 10px; background: oklch(0.58 0.2 25 / 0.08); color: oklch(0.45 0.18 25); font-size: 0.875rem; border-left: 3px solid oklch(0.58 0.2 25); }

	.filter-bar { margin-bottom: 16px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
	.fy-tabs { display: flex; gap: 2px; }
	.fy-tab { padding: 6px 14px; border: none; border-radius: 8px; background: transparent; font-family: 'Noto Sans Thai', sans-serif; font-size: 0.8125rem; font-weight: 500; color: oklch(0.5 0.02 180); cursor: pointer; transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1); position: relative; }
	.fy-tab:hover { color: oklch(0.4 0.04 180); background: oklch(0.52 0.14 240 / 0.04); }
	.fy-tab.active { color: oklch(0.42 0.14 240); background: oklch(0.52 0.14 240 / 0.08); font-weight: 600; }
	.fy-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: oklch(0.54 0.16 150); margin-left: 4px; vertical-align: middle; }
	.search-wrap { position: relative; max-width: 380px; }
	.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: oklch(0.55 0.02 180); pointer-events: none; }
	.search-input { width: 100%; padding: 9px 14px 9px 42px; border: 1px solid oklch(0.82 0.015 180); border-radius: 10px; background: oklch(0.995 0.002 180); font-family: 'Noto Sans Thai', sans-serif; font-size: 0.875rem; color: oklch(0.25 0.02 180); }
	.search-input:focus { outline: none; border-color: oklch(0.52 0.14 240); box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.12); }

	.table-card { border-radius: 14px; border: 1px solid oklch(0.92 0.005 180); background: oklch(0.995 0.002 180); overflow: hidden; }
	.table-scroll { max-height: calc(100vh - 24rem); min-height: 200px; overflow-y: auto; }
	.table-scroll::-webkit-scrollbar { width: 6px; }
	.table-scroll::-webkit-scrollbar-thumb { background: oklch(0.82 0.01 180); border-radius: 3px; }
	.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
	.data-table thead { position: sticky; top: 0; z-index: 1; }
	.data-table th { text-align: left; padding: 12px 16px; font-weight: 500; color: oklch(0.45 0.02 180); background: oklch(0.97 0.005 180); border-bottom: 1px solid oklch(0.9 0.005 180); font-size: 0.8125rem; }
	.data-table td { padding: 12px 16px; color: oklch(0.3 0.02 180); border-bottom: 1px solid oklch(0.95 0.003 180); }
	.data-table tr:hover td { background: oklch(0.52 0.14 240 / 0.02); }
	.id-col { width: 60px; }
	.id-cell { font-variant-numeric: tabular-nums; color: oklch(0.5 0.02 180); }
	.name-cell { font-weight: 500; }
	.action-col { width: 130px; text-align: right; }
	.view-btn { padding: 4px 12px; border-radius: 8px; font-size: 0.8125rem; font-weight: 500; text-decoration: none; color: oklch(0.52 0.14 240); }
	.view-btn:hover { background: oklch(0.52 0.14 240 / 0.08); }
	.empty-cell { text-align: center; padding: 40px 16px; color: oklch(0.55 0.02 180); }
	.list-footer { padding: 12px 16px; font-size: 0.8125rem; color: oklch(0.55 0.02 180); text-align: center; border-top: 1px solid oklch(0.92 0.005 180); }

	/* Modal */
	.modal-bg { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: oklch(0.15 0.02 180 / 0.5); backdrop-filter: blur(4px); }
	.modal { width: 100%; max-width: 580px; background: oklch(0.995 0.002 180); border-radius: 18px; padding: 28px; box-shadow: 0 20px 60px oklch(0.15 0.02 180 / 0.2); animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); max-height: 90vh; overflow-y: auto; }
	.modal-title { margin: 0 0 20px 0; font-size: 1.125rem; font-weight: 600; color: oklch(0.2 0.02 180); }
	.modal-body { display: flex; flex-direction: column; gap: 16px; }
	.modal-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid oklch(0.92 0.005 180); }
	.ff { display: flex; flex-direction: column; gap: 6px; }
	.fl { font-size: 0.8125rem; font-weight: 500; color: oklch(0.35 0.02 180); }
	.req { color: oklch(0.58 0.2 25); }
	.fi { padding: 10px 14px; border: 1px solid oklch(0.82 0.015 180); border-radius: 10px; background: oklch(0.995 0.002 180); font-family: 'Noto Sans Thai', sans-serif; font-size: 0.9375rem; color: oklch(0.25 0.02 180); }
	.fi:focus { outline: none; border-color: oklch(0.52 0.14 240); box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.12); }

	.steps-preview { padding: 16px; border-radius: 12px; background: oklch(0.97 0.005 180); border: 1px solid oklch(0.92 0.005 180); }
	.preview-title { margin: 0 0 12px 0; font-size: 0.875rem; font-weight: 600; color: oklch(0.3 0.02 180); }
	.steps-list { display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; }
	.step-row { display: flex; gap: 10px; align-items: center; padding: 8px 12px; border-radius: 8px; background: oklch(0.995 0.002 180); border: 1px solid oklch(0.94 0.005 180); }
	.step-num { width: 24px; height: 24px; border-radius: 50%; background: oklch(0.52 0.14 240); color: oklch(0.98 0.005 180); display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; font-weight: 600; flex-shrink: 0; }
	.step-info { flex: 1; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
	.step-name { font-size: 0.8125rem; color: oklch(0.3 0.02 180); }
	.step-badge { font-size: 0.6875rem; padding: 1px 8px; border-radius: 4px; font-weight: 500; }
	.approver-badge { background: oklch(0.62 0.18 60 / 0.12); color: oklch(0.48 0.14 60); }

	@keyframes scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
	@media (max-width: 768px) { .page-header { flex-direction: column; } }
</style>
