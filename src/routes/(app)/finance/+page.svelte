<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ScopeSelector from '$lib/components/ScopeSelector.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { formatBaht, formatNumber, exportToCsv } from '$lib/utils/format';

	let { data, form: formResult } = $props();
	let canManageFinance = $derived(data.user.is_super_admin || data.user.permissions.can_manage_finance);
	let activeTab = $state<'dika' | 'accounts' | 'tax' | 'vendors' | 'loans'>('dika');
	let showCreateAccountModal = $state(false);
	let showCreateLoanModal = $state(false);
	let selectedLoanType = $state('');
	const perPage = 20;

	// Pagination states
	let dikaPage = $state(1);
	let taxPage = $state(1);
	let vendorPage = $state(1);
	let loanPage = $state(1);

	// Filter states
	let vendorTypeFilter = $state('');
	let vendorSearch = $state('');
	let loanTypeFilter = $state('');

	// Derived data
	let paginatedDika = $derived(
		data.dikaVouchers.slice((dikaPage - 1) * perPage, dikaPage * perPage)
	);
	let paginatedTax = $derived(
		data.taxTransactions.slice((taxPage - 1) * perPage, taxPage * perPage)
	);
	let filteredVendors = $derived(
		data.vendors.filter((v: any) => {
			if (vendorTypeFilter && v.vendor_type !== vendorTypeFilter) return false;
			if (vendorSearch) {
				const q = vendorSearch.toLowerCase();
				return v.company_name.toLowerCase().includes(q) || v.tax_id.includes(q);
			}
			return true;
		})
	);
	let paginatedVendors = $derived(
		filteredVendors.slice((vendorPage - 1) * perPage, vendorPage * perPage)
	);
	let filteredLoans = $derived(
		data.loans.filter((l: any) => {
			if (loanTypeFilter && l.loan_type !== loanTypeFilter) return false;
			return true;
		})
	);
	let paginatedLoans = $derived(
		filteredLoans.slice((loanPage - 1) * perPage, loanPage * perPage)
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
		{#each [{ key: 'dika', label: 'ฎีกาเบิกจ่าย' }, { key: 'accounts', label: 'บัญชีธนาคาร' }, { key: 'tax', label: 'ภาษี' }, { key: 'vendors', label: 'ผู้ประกอบการ' }, { key: 'loans', label: 'ยืมเงิน' }] as tab}
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
								{#if dika.status === 'PENDING_EXAMINE' && canManageFinance}
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
		{#if canManageFinance}
			<div class="mt-4 flex justify-end">
				<button onclick={() => (showCreateAccountModal = true)}
					class="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
					style="background: oklch(0.52 0.14 240);">
					+ เพิ่มบัญชีธนาคาร
				</button>
			</div>
		{/if}
		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each data.bankAccounts as account}
				<div class="rounded-xl border bg-white p-5 shadow-sm">
					<div class="flex items-center gap-3">
						{#if account.bank_logo}
							<img src={account.bank_logo} alt={account.bank_name} class="bank-logo" />
						{:else}
							<div class="bank-logo-fallback">{account.bank_code}</div>
						{/if}
						<div class="flex-1 min-w-0">
							<h3 class="font-medium text-gray-900">{account.account_name}</h3>
							<p class="text-sm text-gray-500">{account.bank_name} | {account.account_number}</p>
						</div>
						{#if account.is_tax_pool}
							<span class="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 flex-shrink-0">บัญชีภาษี</span>
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

	{#if activeTab === 'loans'}
		<div class="mt-4 flex items-center gap-3">
			<select bind:value={loanTypeFilter}
				class="rounded-lg border px-3 py-1.5 text-sm outline-none" style="border-color: oklch(0.82 0.015 180);">
				<option value="">ทุกประเภท</option>
				<option value="TAX_POOL">ยืมจากภาษี (Tax Pool)</option>
				<option value="INTER_AGENCY">ยืมจากหน่วยงานอื่น</option>
			</select>
			<span class="text-sm text-gray-500">{filteredLoans.length} รายการ</span>
			{#if canManageFinance}
				<button onclick={() => (showCreateLoanModal = true)}
					class="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-white"
					style="background: oklch(0.52 0.14 240);">
					+ สร้างคำขอยืมเงิน
				</button>
			{/if}
		</div>
		<div class="mt-2 overflow-hidden rounded-xl border bg-white shadow-sm">
			<table class="w-full text-left text-sm">
				<thead class="border-b bg-gray-50">
					<tr>
						<th class="px-4 py-3 font-medium text-gray-600">#</th>
						<th class="px-4 py-3 font-medium text-gray-600">ประเภท</th>
						<th class="px-4 py-3 font-medium text-gray-600">วัตถุประสงค์</th>
						<th class="px-4 py-3 font-medium text-gray-600 text-right">จำนวนเงิน</th>
						<th class="px-4 py-3 font-medium text-gray-600 text-right">ชำระคืนแล้ว</th>
						<th class="px-4 py-3 font-medium text-gray-600">กำหนดคืน</th>
						<th class="px-4 py-3 font-medium text-gray-600">สถานะ</th>
						<th class="px-4 py-3 font-medium text-gray-600">จัดการ</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each paginatedLoans as loan}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-mono text-gray-500">{loan.id}</td>
							<td class="px-4 py-3">
								{#if loan.loan_type === 'TAX_POOL'}
									<span class="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">ยืมจากภาษี</span>
								{:else}
									<span class="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">ยืมข้ามหน่วยงาน</span>
								{/if}
							</td>
							<td class="px-4 py-3">{loan.purpose}</td>
							<td class="px-4 py-3 text-right font-mono">{formatNumber(loan.amount)}</td>
							<td class="px-4 py-3 text-right font-mono">{formatNumber(loan.repaid_amount)}</td>
							<td class="px-4 py-3">{loan.due_date || '-'}</td>
							<td class="px-4 py-3"><StatusBadge status={loan.status} /></td>
							<td class="px-4 py-3">
								{#if loan.status === 'PENDING' && canManageFinance}
									<div class="flex gap-1">
										<form method="POST" action="?/approveLoan" use:enhance>
											<input type="hidden" name="loan_id" value={loan.id} />
											<button type="submit" name="action" value="APPROVED" class="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50">อนุมัติ</button>
										</form>
										<form method="POST" action="?/approveLoan" use:enhance>
											<input type="hidden" name="loan_id" value={loan.id} />
											<button type="submit" name="action" value="REJECTED" class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">ปฏิเสธ</button>
										</form>
									</div>
								{:else if loan.status === 'APPROVED' && canManageFinance}
									<form method="POST" action="?/repayLoan" use:enhance class="flex items-center gap-1">
										<input type="hidden" name="loan_id" value={loan.id} />
										<input type="number" name="repay_amount" required min="1" step="0.01"
											placeholder="จำนวน" class="w-24 rounded border px-2 py-1 text-xs" />
										<button type="submit" class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">ชำระ</button>
									</form>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="px-4 py-8 text-center text-gray-500">ไม่มีรายการยืมเงิน</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<Pagination totalItems={filteredLoans.length} bind:currentPage={loanPage} {perPage} />
		</div>
	{/if}

	{#if activeTab === 'vendors'}
		<div class="mt-4 flex items-center gap-3">
			<div class="relative flex-1" style="max-width: 18rem">
				<svg class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
				<input type="text" placeholder="ค้นหาชื่อหรือเลขผู้เสียภาษี..."
					bind:value={vendorSearch}
					class="w-full rounded-lg border px-3 py-1.5 pl-8 text-sm outline-none" style="border-color: oklch(0.82 0.015 180);" />
			</div>
			<select bind:value={vendorTypeFilter}
				class="rounded-lg border px-3 py-1.5 text-sm outline-none" style="border-color: oklch(0.82 0.015 180);">
				<option value="">ทุกประเภท</option>
				<option value="นิติบุคคล">นิติบุคคล</option>
				<option value="บุคคลธรรมดา">บุคคลธรรมดา</option>
			</select>
			<span class="ml-auto text-sm text-gray-500">{filteredVendors.length} รายการ</span>
		</div>
		<div class="mt-2 overflow-hidden rounded-xl border bg-white shadow-sm">
			<table class="w-full text-left text-sm">
				<thead class="border-b bg-gray-50">
					<tr>
						<th class="px-4 py-3 font-medium text-gray-600">#</th>
						<th class="px-4 py-3 font-medium text-gray-600">ชื่อบริษัท/ร้านค้า</th>
						<th class="px-4 py-3 font-medium text-gray-600">ประเภท</th>
						<th class="px-4 py-3 font-medium text-gray-600">เลขผู้เสียภาษี</th>
						<th class="px-4 py-3 font-medium text-gray-600">ผู้ติดต่อ</th>
						<th class="px-4 py-3 font-medium text-gray-600">เบอร์โทร</th>
						<th class="px-4 py-3 font-medium text-gray-600">อีเมล</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each paginatedVendors as v}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-mono text-gray-500">{v.id}</td>
							<td class="px-4 py-3 font-medium text-gray-900">{v.company_name}</td>
							<td class="px-4 py-3">
								{#if v.vendor_type === 'นิติบุคคล'}
									<span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">นิติบุคคล</span>
								{:else if v.vendor_type === 'บุคคลธรรมดา'}
									<span class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">บุคคลธรรมดา</span>
								{:else}
									<span class="text-gray-400">-</span>
								{/if}
							</td>
							<td class="px-4 py-3 font-mono">{v.tax_id}</td>
							<td class="px-4 py-3">{v.contact_person || '-'}</td>
							<td class="px-4 py-3">{v.contact_phone || '-'}</td>
							<td class="px-4 py-3">{v.contact_email || '-'}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-4 py-8 text-center text-gray-500">ไม่พบผู้ประกอบการ</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<Pagination totalItems={filteredVendors.length} bind:currentPage={vendorPage} {perPage} />
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

<!-- Create Bank Account Modal -->
{#if showCreateAccountModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center" style="background: oklch(0.15 0.02 180 / 0.5); backdrop-filter: blur(4px);" onclick={() => (showCreateAccountModal = false)}>
		<div class="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl" style="animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);" onclick={(e) => e.stopPropagation()}>
			<h2 class="mb-5 text-lg font-semibold" style="color: oklch(0.2 0.02 180);">เพิ่มบัญชีธนาคาร</h2>
			<form method="POST" action="?/createBankAccount" use:enhance={() => {
				return async ({ update }) => { showCreateAccountModal = false; await update(); };
			}}>
				<input type="hidden" name="agency_id" value={data.selectedAgencyId || ''} />
				<div class="space-y-4">
					<div>
						<label class="mb-1 block text-sm font-medium" style="color: oklch(0.35 0.02 180);">ธนาคาร</label>
						<CustomSelect
							options={data.banks.map((b: any) => ({ value: String(b.id), label: `${b.name} (${b.bank_code})` }))}
							name="bank_id"
							required={true}
							placeholder="-- เลือกธนาคาร --"
							class="w-full"
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium" style="color: oklch(0.35 0.02 180);">ชื่อบัญชี</label>
						<input name="account_name" required class="w-full rounded-lg border px-3 py-2 text-sm" style="border-color: oklch(0.82 0.015 180);" placeholder="เช่น บัญชีเงินบำรุง" />
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium" style="color: oklch(0.35 0.02 180);">เลขที่บัญชี</label>
						<input name="account_number" required
							pattern="[\d\-\s]{10,20}"
							title="เลขที่บัญชีต้องเป็นตัวเลข 10-15 หลัก (อาจมีขีดคั่นได้)"
							class="w-full rounded-lg border px-3 py-2 text-sm" style="border-color: oklch(0.82 0.015 180);"
							placeholder="เช่น 020-2-12345-6"
							oninput={(e) => {
								const input = e.currentTarget;
								const digits = input.value.replace(/[^0-9\-\s]/g, '');
								if (digits !== input.value) input.value = digits;
								const pure = digits.replace(/[-\s]/g, '');
								if (pure.length < 10 || pure.length > 15) {
									input.setCustomValidity('เลขที่บัญชีต้องเป็นตัวเลข 10-15 หลัก');
								} else {
									input.setCustomValidity('');
								}
							}} />
					</div>
					<div>
						<label class="flex items-center gap-2 text-sm" style="color: oklch(0.35 0.02 180);">
							<input type="checkbox" name="is_tax_pool" value="true" />
							บัญชีพักหักภาษี
						</label>
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-3">
					<button type="button" onclick={() => (showCreateAccountModal = false)} class="rounded-lg px-4 py-2 text-sm" style="color: oklch(0.45 0.02 180);">ยกเลิก</button>
					<button type="submit" class="rounded-lg px-4 py-2 text-sm font-medium text-white" style="background: oklch(0.52 0.14 240);">สร้างบัญชี</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Create Loan Modal -->
{#if showCreateLoanModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center" style="background: oklch(0.15 0.02 180 / 0.5); backdrop-filter: blur(4px);" onclick={() => (showCreateLoanModal = false)}>
		<div class="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl" style="animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);" onclick={(e) => e.stopPropagation()}>
			<h2 class="mb-5 text-lg font-semibold" style="color: oklch(0.2 0.02 180);">สร้างคำขอยืมเงิน</h2>
			<form method="POST" action="?/createLoan" use:enhance={() => {
				return async ({ update }) => { showCreateLoanModal = false; selectedLoanType = ''; await update(); };
			}}>
				<input type="hidden" name="borrower_agency_id" value={data.selectedAgencyId || ''} />
				<div class="space-y-4">
					<div>
						<label class="mb-1 block text-sm font-medium" style="color: oklch(0.35 0.02 180);">ประเภทการยืม</label>
						<select name="loan_type" required bind:value={selectedLoanType}
							class="w-full rounded-lg border px-3 py-2 text-sm" style="border-color: oklch(0.82 0.015 180);">
							<option value="">-- เลือกประเภท --</option>
							<option value="TAX_POOL">ยืมจากเงินภาษี (Tax Pool)</option>
							<option value="INTER_AGENCY">ยืมจากหน่วยงานอื่น</option>
						</select>
					</div>
					{#if selectedLoanType === 'TAX_POOL'}
						<div>
							<label class="mb-1 block text-sm font-medium" style="color: oklch(0.35 0.02 180);">บัญชีพักภาษี</label>
							<CustomSelect
								options={data.bankAccounts.filter((a: any) => a.is_tax_pool).map((a: any) => ({ value: String(a.id), label: `${a.account_name} (${a.account_number}) - ${formatBaht(a.balance)}` }))}
								name="source_bank_account_id"
								placeholder="-- เลือกบัญชีภาษี --"
								class="w-full"
							/>
						</div>
					{/if}
					{#if selectedLoanType === 'INTER_AGENCY'}
						<div>
							<label class="mb-1 block text-sm font-medium" style="color: oklch(0.35 0.02 180);">หน่วยงานที่ยืม</label>
							<CustomSelect
								options={data.allAgencies.filter((a: any) => a.id !== data.selectedAgencyId).map((a: any) => ({ value: String(a.id), label: a.name }))}
								name="lender_agency_id"
								required={true}
								placeholder="-- เลือกหน่วยงาน --"
								class="w-full"
							/>
						</div>
					{/if}
					<div>
						<label class="mb-1 block text-sm font-medium" style="color: oklch(0.35 0.02 180);">จำนวนเงิน (บาท)</label>
						<input name="amount" type="number" required min="1" step="0.01"
							class="w-full rounded-lg border px-3 py-2 text-sm" style="border-color: oklch(0.82 0.015 180);"
							placeholder="0.00" />
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium" style="color: oklch(0.35 0.02 180);">วัตถุประสงค์</label>
						<textarea name="purpose" required rows="2"
							class="w-full rounded-lg border px-3 py-2 text-sm" style="border-color: oklch(0.82 0.015 180);"
							placeholder="ระบุเหตุผลการยืมเงิน"></textarea>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium" style="color: oklch(0.35 0.02 180);">กำหนดคืน (ถ้ามี)</label>
						<input name="due_date" type="date"
							class="w-full rounded-lg border px-3 py-2 text-sm" style="border-color: oklch(0.82 0.015 180);" />
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-3">
					<button type="button" onclick={() => (showCreateLoanModal = false)} class="rounded-lg px-4 py-2 text-sm" style="color: oklch(0.45 0.02 180);">ยกเลิก</button>
					<button type="submit" class="rounded-lg px-4 py-2 text-sm font-medium text-white" style="background: oklch(0.52 0.14 240);">ส่งคำขอ</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	@keyframes scale-in { from { opacity: 0; } to { opacity: 1; } }
	.bank-logo {
		width: 36px;
		height: 36px;
		object-fit: contain;
		border-radius: 8px;
		flex-shrink: 0;
	}
	.bank-logo-fallback {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		background: #e3f2fd;
		color: #1565c0;
		font-size: 0.625rem;
		font-weight: 700;
		flex-shrink: 0;
	}
</style>
