<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ScopeSelector from '$lib/components/ScopeSelector.svelte';
	import { formatBaht, formatNumber, exportToCsv } from '$lib/utils/format';

	let { data, form: formResult } = $props();
	let activeTab = $state<'dika' | 'accounts' | 'tax'>('dika');
	let dikaPage = $state(1);
	let taxPage = $state(1);
	const perPage = 20;

	let paginatedDika = $derived(
		data.dikaVouchers.slice((dikaPage - 1) * perPage, dikaPage * perPage)
	);
	let paginatedTax = $derived(
		data.taxTransactions.slice((taxPage - 1) * perPage, taxPage * perPage)
	);

	function exportDika() {
		exportToCsv('dika-vouchers', [
			{ key: 'id', label: 'รหัส' },
			{ key: 'vendor_name', label: 'ผู้รับจ้าง' },
			{ key: 'plan_title', label: 'แผนงาน' },
			{ key: 'net_amount', label: 'ยอดสุทธิ (บาท)' },
			{ key: 'status', label: 'สถานะ' }
		], data.dikaVouchers);
	}

	function exportTax() {
		exportToCsv('tax-transactions', [
			{ key: 'tax_id', label: 'เลขผู้เสียภาษี' },
			{ key: 'tax_form_type', label: 'แบบ' },
			{ key: 'tax_base_amount', label: 'ฐานภาษี (บาท)' },
			{ key: 'tax_amount', label: 'ภาษี (บาท)' },
			{ key: 'status', label: 'สถานะ' }
		], data.taxTransactions);
	}
</script>

<div>
	<PageHeader title="การเงินและเบิกจ่าย" subtitle="จัดการฎีกาเบิกจ่าย บัญชีธนาคาร และภาษี" />

	{#if data.user.is_super_admin}
		<ScopeSelector
			provinces={data.provinces}
			agencies={data.agencies}
			orgUnits={[]}
			selectedProvinceId={data.selectedProvinceId}
			selectedAgencyId={data.selectedAgencyId}
			isSuperAdmin={true}
			basePath="/finance"
		/>
	{/if}

	{#if formResult?.message}
		<div class="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{formResult.message}</div>
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
		<div class="mt-4 flex justify-end">
			<button onclick={exportDika} class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
				ส่งออก CSV
			</button>
		</div>
		<div class="mt-2 overflow-hidden rounded-xl border bg-white shadow-sm">
			<table class="w-full text-left text-sm">
				<thead class="border-b bg-gray-50">
					<tr>
						<th class="px-4 py-3 font-medium text-gray-600">#</th>
						<th class="px-4 py-3 font-medium text-gray-600">ผู้รับจ้าง</th>
						<th class="px-4 py-3 font-medium text-gray-600">แผนงาน</th>
						<th class="px-4 py-3 font-medium text-gray-600 text-right">ยอดสุทธิ (บาท)</th>
						<th class="px-4 py-3 font-medium text-gray-600">สถานะ</th>
						<th class="px-4 py-3 font-medium text-gray-600">จัดการ</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each paginatedDika as dika}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-mono text-gray-500">{dika.id}</td>
							<td class="px-4 py-3">{dika.vendor_name}</td>
							<td class="px-4 py-3">{dika.plan_title}</td>
							<td class="px-4 py-3 text-right font-mono">{formatNumber(dika.net_amount)}</td>
							<td class="px-4 py-3">
								<StatusBadge status={dika.status} />
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
			<Pagination totalItems={data.dikaVouchers.length} bind:currentPage={dikaPage} {perPage} />
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
						{formatBaht(account.balance)}
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
		<div class="mt-4 flex justify-end">
			<button onclick={exportTax} class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
				ส่งออก CSV
			</button>
		</div>
		<div class="mt-2 overflow-hidden rounded-xl border bg-white shadow-sm">
			<table class="w-full text-left text-sm">
				<thead class="border-b bg-gray-50">
					<tr>
						<th class="px-4 py-3 font-medium text-gray-600">เลขผู้เสียภาษี</th>
						<th class="px-4 py-3 font-medium text-gray-600">แบบ</th>
						<th class="px-4 py-3 font-medium text-gray-600 text-right">ฐานภาษี (บาท)</th>
						<th class="px-4 py-3 font-medium text-gray-600 text-right">ภาษี (บาท)</th>
						<th class="px-4 py-3 font-medium text-gray-600">สถานะ</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each paginatedTax as tax}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-mono">{tax.tax_id}</td>
							<td class="px-4 py-3">{tax.tax_form_type}</td>
							<td class="px-4 py-3 text-right font-mono">{formatNumber(tax.tax_base_amount)}</td>
							<td class="px-4 py-3 text-right font-mono">{formatNumber(tax.tax_amount)}</td>
							<td class="px-4 py-3">
								<StatusBadge status={tax.status} />
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-4 py-8 text-center text-gray-500">ไม่มีข้อมูลภาษี</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<Pagination totalItems={data.taxTransactions.length} bind:currentPage={taxPage} {perPage} />
		</div>
	{/if}
</div>
