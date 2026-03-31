<script lang="ts">
	import { goto } from '$app/navigation';
	import Pagination from '$lib/components/Pagination.svelte';
	import { formatThaiDateTime, exportToCsv } from '$lib/utils/format';

	let { data } = $props();
	let expandedId = $state<string | null>(null);
	let currentPage = $state(1);
	const perPage = 20;

	const collections = [
		{ key: 'plan_budget_histories', label: 'แผนงาน / งบประมาณ' },
		{ key: 'doc_payload_histories', label: 'เอกสารจัดซื้อจัดจ้าง' },
		{ key: 'bank_transaction_histories', label: 'การเบิกจ่าย / บัญชี' }
	];

	let paginatedRecords = $derived(
		data.records.slice((currentPage - 1) * perPage, currentPage * perPage)
	);

	const ACTION_COLORS: Record<string, string> = {
		CREATE: 'bg-green-100 text-green-700',
		UPDATE: 'bg-blue-100 text-blue-700',
		DELETE: 'bg-red-100 text-red-700'
	};

	function switchCollection(col: string) {
		currentPage = 1;
		const params = new URLSearchParams();
		params.set('collection', col);
		if (data.selectedAgencyId) params.set('agency_id', String(data.selectedAgencyId));
		goto(`/audit?${params.toString()}`);
	}

	function handleExportCsv() {
		exportToCsv('audit-trail', [
			{ key: 'action_type', label: 'ประเภท' },
			{ key: 'action_by_name', label: 'ผู้ดำเนินการ' },
			{ key: 'ip_address', label: 'IP Address' },
			{ key: 'created_at', label: 'วันที่' }
		], data.records.map((r: any) => ({
			...r,
			action_by_name: r.action_by?.name || 'ระบบ',
			ip_address: r.action_by?.ip_address || '-'
		})));
	}
</script>

<div>
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">ประวัติการเปลี่ยนแปลง</h1>
			<p class="mt-1 text-sm text-gray-500">ตรวจสอบย้อนหลังทุกการเปลี่ยนแปลง (Audit Trail)</p>
		</div>
		<button onclick={handleExportCsv} class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
			ส่งออก CSV
		</button>
	</div>

	<!-- Collection Tabs -->
	<div class="mt-6 flex gap-1 border-b">
		{#each collections as col}
			<button
				onclick={() => switchCollection(col.key)}
				class="rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors
					{data.collection === col.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
			>
				{col.label}
			</button>
		{/each}
	</div>

	<!-- Records -->
	<div class="mt-4 space-y-2">
		{#each paginatedRecords as record}
			<div class="rounded-xl border bg-white shadow-sm">
				<button
					onclick={() => (expandedId = expandedId === record._id ? null : record._id)}
					class="flex w-full items-center justify-between p-4 text-left"
				>
					<div class="flex items-center gap-3">
						<span class="rounded-full px-2 py-0.5 text-xs font-medium {ACTION_COLORS[record.action_type] || 'bg-gray-100 text-gray-700'}">
							{record.action_type}
						</span>
						<span class="text-sm font-medium text-gray-900">
							{record.action_by?.name || 'ระบบ'}
						</span>
						<span class="text-xs text-gray-500">
							IP: {record.action_by?.ip_address || '-'}
						</span>
					</div>
					<span class="text-xs text-gray-400">
						{record.created_at ? formatThaiDateTime(record.created_at) : '-'}
					</span>
				</button>

				{#if expandedId === record._id}
					<div class="border-t px-4 pb-4">
						<pre class="mt-3 overflow-auto rounded-lg bg-gray-50 p-3 text-xs">{JSON.stringify(record, null, 2)}</pre>
					</div>
				{/if}
			</div>
		{:else}
			<div class="rounded-xl border bg-white p-8 text-center text-gray-500">
				ไม่มีข้อมูลประวัติการเปลี่ยนแปลง
			</div>
		{/each}
	</div>

	{#if data.records.length > 0}
		<div class="mt-4 overflow-hidden rounded-xl border bg-white shadow-sm">
			<Pagination totalItems={data.records.length} bind:currentPage {perPage} />
		</div>
	{/if}
</div>
