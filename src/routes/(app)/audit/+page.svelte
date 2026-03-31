<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
	let expandedId = $state<string | null>(null);

	const collections = [
		{ key: 'plan_budget_histories', label: 'แผนงาน / งบประมาณ' },
		{ key: 'doc_payload_histories', label: 'เอกสารจัดซื้อจัดจ้าง' },
		{ key: 'bank_transaction_histories', label: 'การเบิกจ่าย / บัญชี' }
	];

	function switchCollection(col: string) {
		const params = new URLSearchParams();
		params.set('collection', col);
		if (data.selectedAgencyId) params.set('agency_id', String(data.selectedAgencyId));
		goto(`/audit?${params.toString()}`);
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleString('th-TH');
	}
</script>

<div>
	<h1 class="text-2xl font-bold text-gray-900">ประวัติการเปลี่ยนแปลง</h1>
	<p class="mt-1 text-sm text-gray-500">Audit Trail - ตรวจสอบย้อนหลังทุกการเปลี่ยนแปลง</p>

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
		{#each data.records as record}
			<div class="rounded-xl border bg-white shadow-sm">
				<button
					onclick={() => (expandedId = expandedId === record._id ? null : record._id)}
					class="flex w-full items-center justify-between p-4 text-left"
				>
					<div class="flex items-center gap-3">
						<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
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
						{record.created_at ? formatDate(record.created_at) : '-'}
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
</div>
