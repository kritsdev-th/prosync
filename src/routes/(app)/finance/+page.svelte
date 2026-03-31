<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form: formResult } = $props();
	let activeTab = $state<'dika' | 'accounts' | 'tax'>('dika');

	const statusColors: Record<string, string> = {
		PENDING_EXAMINE: 'bg-yellow-100 text-yellow-700',
		PAID: 'bg-green-100 text-green-700',
		REJECTED: 'bg-red-100 text-red-700'
	};
	const statusLabels: Record<string, string> = {
		PENDING_EXAMINE: 'รอตรวจสอบ',
		PAID: 'จ่ายแล้ว',
		REJECTED: 'ปฏิเสธ'
	};
</script>

<div>
	<h1 class="text-2xl font-bold text-gray-900">การเงินและเบิกจ่าย</h1>
	<p class="mt-1 text-sm text-gray-500">จัดการฎีกาเบิกจ่าย บัญชีธนาคาร และภาษี</p>

	{#if data.user.is_super_admin && data.agencies.length > 0}
		<div class="mt-4">
			<select
				onchange={(e) => goto(`/finance?agency_id=${(e.target as HTMLSelectElement).value}`)}
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

	<!-- Tabs -->
	<div class="mt-6 flex gap-1 border-b">
		{#each [{ key: 'dika', label: 'ฎีกาเบิกจ่าย' }, { key: 'accounts', label: 'บัญชีธนาคาร' }, { key: 'tax', label: 'ภาษี' }] as tab}
			<button
				onclick={() => (activeTab = tab.key as any)}
				class="rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors
					{activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if activeTab === 'dika'}
		<div class="mt-4 overflow-hidden rounded-xl border bg-white shadow-sm">
			<table class="w-full text-left text-sm">
				<thead class="border-b bg-gray-50">
					<tr>
						<th class="px-4 py-3 font-medium text-gray-600">#</th>
						<th class="px-4 py-3 font-medium text-gray-600">ผู้รับจ้าง</th>
						<th class="px-4 py-3 font-medium text-gray-600">แผนงาน</th>
						<th class="px-4 py-3 font-medium text-gray-600 text-right">ยอดสุทธิ</th>
						<th class="px-4 py-3 font-medium text-gray-600">สถานะ</th>
						<th class="px-4 py-3 font-medium text-gray-600">จัดการ</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each data.dikaVouchers as dika}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-mono text-gray-500">{dika.id}</td>
							<td class="px-4 py-3">{dika.vendor_name}</td>
							<td class="px-4 py-3">{dika.plan_title}</td>
							<td class="px-4 py-3 text-right font-mono">{Number(dika.net_amount).toLocaleString('th-TH')}</td>
							<td class="px-4 py-3">
								<span class="rounded-full px-2 py-0.5 text-xs {statusColors[dika.status] || ''}">
									{statusLabels[dika.status] || dika.status}
								</span>
							</td>
							<td class="px-4 py-3">
								{#if dika.status === 'PENDING_EXAMINE'}
									<div class="flex gap-1">
										<form method="POST" action="?/approveDika" use:enhance>
											<input type="hidden" name="dika_id" value={dika.id} />
											<button type="submit" name="action" value="pay" class="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50">
												อนุมัติจ่าย
											</button>
										</form>
										<form method="POST" action="?/approveDika" use:enhance>
											<input type="hidden" name="dika_id" value={dika.id} />
											<button type="submit" name="action" value="reject" class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">
												ปฏิเสธ
											</button>
										</form>
									</div>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="px-4 py-8 text-center text-gray-500">ไม่มีฎีกาเบิกจ่าย</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if activeTab === 'accounts'}
		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each data.bankAccounts as account}
				<div class="rounded-xl border bg-white p-5 shadow-sm">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-medium text-gray-900">{account.account_name}</h3>
							<p class="text-sm text-gray-500">{account.bank_name} | {account.account_number}</p>
						</div>
						{#if account.is_tax_pool}
							<span class="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">บัญชีภาษี</span>
						{/if}
					</div>
					<p class="mt-3 text-2xl font-bold text-gray-900">
						{Number(account.balance).toLocaleString('th-TH')}
						<span class="text-sm font-normal text-gray-500">บาท</span>
					</p>
				</div>
			{:else}
				<div class="col-span-2 rounded-xl border bg-white p-8 text-center text-gray-500">
					ไม่มีบัญชีธนาคาร
				</div>
			{/each}
		</div>
	{/if}

	{#if activeTab === 'tax'}
		<div class="mt-4 overflow-hidden rounded-xl border bg-white shadow-sm">
			<table class="w-full text-left text-sm">
				<thead class="border-b bg-gray-50">
					<tr>
						<th class="px-4 py-3 font-medium text-gray-600">เลขผู้เสียภาษี</th>
						<th class="px-4 py-3 font-medium text-gray-600">แบบ</th>
						<th class="px-4 py-3 font-medium text-gray-600 text-right">ฐานภาษี</th>
						<th class="px-4 py-3 font-medium text-gray-600 text-right">ภาษี</th>
						<th class="px-4 py-3 font-medium text-gray-600">สถานะ</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each data.taxTransactions as tax}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-mono">{tax.tax_id}</td>
							<td class="px-4 py-3">{tax.tax_form_type}</td>
							<td class="px-4 py-3 text-right font-mono">{Number(tax.tax_base_amount).toLocaleString('th-TH')}</td>
							<td class="px-4 py-3 text-right font-mono">{Number(tax.tax_amount).toLocaleString('th-TH')}</td>
							<td class="px-4 py-3">
								<span class="rounded-full px-2 py-0.5 text-xs {tax.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
									{tax.status === 'SUBMITTED' ? 'ส่งแล้ว' : 'รอส่ง'}
								</span>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-4 py-8 text-center text-gray-500">ไม่มีข้อมูลภาษี</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
