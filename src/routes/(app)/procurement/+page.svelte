<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form: formResult } = $props();
	let showCreateModal = $state(false);

	const statusColors: Record<string, string> = {
		IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
		APPROVED_PROCUREMENT: 'bg-green-100 text-green-700',
		REJECTED: 'bg-red-100 text-red-700'
	};

	const statusLabels: Record<string, string> = {
		IN_PROGRESS: 'กำลังดำเนินการ',
		APPROVED_PROCUREMENT: 'อนุมัติแล้ว',
		REJECTED: 'ปฏิเสธ'
	};
</script>

<div>
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดซื้อจัดจ้าง</h1>
			<p class="mt-1 text-sm text-gray-500">จัดการเอกสารจัดซื้อจัดจ้างตาม Workflow</p>
		</div>
		<button
			onclick={() => (showCreateModal = true)}
			class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			สร้างเอกสารจัดซื้อ
		</button>
	</div>

	{#if data.user.is_super_admin && data.agencies.length > 0}
		<div class="mt-4">
			<select
				onchange={(e) => goto(`/procurement?agency_id=${(e.target as HTMLSelectElement).value}`)}
				class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
	{#if formResult?.errors?.plan_id}
		<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formResult.errors.plan_id[0]}</div>
	{/if}

	<!-- Documents Table -->
	<div class="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
		<table class="w-full text-left text-sm">
			<thead class="border-b bg-gray-50">
				<tr>
					<th class="px-4 py-3 font-medium text-gray-600">#</th>
					<th class="px-4 py-3 font-medium text-gray-600">วิธีจัดซื้อ</th>
					<th class="px-4 py-3 font-medium text-gray-600">แผนงาน</th>
					<th class="px-4 py-3 font-medium text-gray-600">สถานะ</th>
					<th class="px-4 py-3 font-medium text-gray-600">จัดการ</th>
				</tr>
			</thead>
			<tbody class="divide-y">
				{#each data.documents as doc}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 font-mono text-gray-500">{doc.id}</td>
						<td class="px-4 py-3">{doc.workflow_name}</td>
						<td class="px-4 py-3 font-medium">{doc.plan_title}</td>
						<td class="px-4 py-3">
							<span class="rounded-full px-2 py-0.5 text-xs {statusColors[doc.status] || 'bg-gray-100 text-gray-600'}">
								{statusLabels[doc.status] || doc.status}
							</span>
						</td>
						<td class="px-4 py-3">
							<a
								href="/procurement/{doc.id}"
								class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
							>
								ดูรายละเอียด
							</a>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-gray-500">ไม่มีเอกสารจัดซื้อจัดจ้าง</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">สร้างเอกสารจัดซื้อจัดจ้าง</h2>
			<form
				method="POST"
				action="?/createDocument"
				use:enhance={() => {
					return async ({ update, result }) => {
						if (result.type === 'success') showCreateModal = false;
						await update();
					};
				}}
			>
				<input type="hidden" name="agency_id" value={data.selectedAgencyId || ''} />
				<div class="mt-4 space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700">วิธีจัดซื้อจัดจ้าง *</label>
						<select name="workflow_id" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- เลือกวิธี --</option>
							{#each data.workflows as wf}
								<option value={wf.id}>{wf.name} ({wf.total_steps} ขั้นตอน)</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">แผนงาน (Leaf Node) *</label>
						<select name="plan_id" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- เลือกแผนงาน --</option>
							{#each data.leafPlans as plan}
								<option value={plan.id}>
									[ปี {plan.fiscal_year}] {plan.title} (งบ {Number(plan.estimated_amount).toLocaleString('th-TH')} บาท)
								</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => (showCreateModal = false)} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
					<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">สร้างเอกสาร</button>
				</div>
			</form>
		</div>
	</div>
{/if}
