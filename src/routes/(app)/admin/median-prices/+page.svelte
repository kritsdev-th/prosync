<script lang="ts">
	import { enhance } from '$app/forms';
	import Pagination from '$lib/components/Pagination.svelte';
	import { formatBaht, formatThaiDate, exportToCsv } from '$lib/utils/format';

	let { data, form: formResult } = $props();
	let showCreateModal = $state(false);
	let editingPrice = $state<any>(null);
	let currentPage = $state(1);
	const perPage = 20;

	let paginatedPrices = $derived(
		data.prices.slice((currentPage - 1) * perPage, currentPage * perPage)
	);

	function handleExportCsv() {
		exportToCsv('median-prices', [
			{ key: 'category', label: 'หมวดหมู่' },
			{ key: 'item_name', label: 'ชื่อรายการ' },
			{ key: 'price', label: 'ราคากลาง (บาท)' },
			{ key: 'province_name', label: 'จังหวัด' },
			{ key: 'effective_date', label: 'วันที่บังคับใช้' }
		], data.prices);
	}
</script>

<div>
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">ราคากลาง</h1>
			<p class="mt-1 text-sm text-gray-500">จัดการราคากลางแยกตามจังหวัด</p>
		</div>
		<div class="flex gap-2">
			<button onclick={handleExportCsv} class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
				ส่งออก CSV
			</button>
			<button onclick={() => (showCreateModal = true)} class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
				เพิ่มราคากลาง
			</button>
		</div>
	</div>

	{#if formResult?.message}
		<div class="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{formResult.message}</div>
	{/if}

	<div class="mt-4 overflow-hidden rounded-xl border bg-white shadow-sm">
		<table class="w-full text-left text-sm">
			<thead class="border-b bg-gray-50">
				<tr>
					<th class="px-4 py-3 font-medium text-gray-600">หมวดหมู่</th>
					<th class="px-4 py-3 font-medium text-gray-600">ชื่อรายการ</th>
					<th class="px-4 py-3 font-medium text-gray-600 text-right">ราคากลาง (บาท)</th>
					<th class="px-4 py-3 font-medium text-gray-600">จังหวัด</th>
					<th class="px-4 py-3 font-medium text-gray-600">วันที่บังคับใช้</th>
					<th class="px-4 py-3 font-medium text-gray-600">จัดการ</th>
				</tr>
			</thead>
			<tbody class="divide-y">
				{#each paginatedPrices as price}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3">{price.category}</td>
						<td class="px-4 py-3 font-medium">{price.item_name}</td>
						<td class="px-4 py-3 text-right font-mono">{formatBaht(price.price)}</td>
						<td class="px-4 py-3">{price.province_name}</td>
						<td class="px-4 py-3 text-gray-500">{formatThaiDate(price.effective_date)}</td>
						<td class="px-4 py-3">
							<div class="flex gap-1">
								<button onclick={() => (editingPrice = price)} class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">แก้ไข</button>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={price.id} />
									<button type="submit" class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">ลบ</button>
								</form>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="px-4 py-8 text-center text-gray-500">ไม่มีข้อมูลราคากลาง</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<Pagination totalItems={data.prices.length} bind:currentPage {perPage} />
	</div>
</div>

{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">เพิ่มราคากลาง</h2>
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ update }) => { showCreateModal = false; await update(); };
			}}>
				<div class="mt-4 space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700">หมวดหมู่ <span class="text-red-500">*</span></label>
						<input name="category" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">ชื่อรายการ <span class="text-red-500">*</span></label>
						<input name="item_name" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">ราคากลาง (บาท) <span class="text-red-500">*</span></label>
						<input name="price" type="number" step="0.01" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">จังหวัด <span class="text-red-500">*</span></label>
						<select name="province_id" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- เลือกจังหวัด --</option>
							{#each data.provinces as p}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">วันที่บังคับใช้ <span class="text-red-500">*</span></label>
						<input name="effective_date" type="date" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => (showCreateModal = false)} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
					<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">บันทึก</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if editingPrice}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">แก้ไขราคากลาง</h2>
			<form method="POST" action="?/update" use:enhance={() => {
				return async ({ update }) => { editingPrice = null; await update(); };
			}}>
				<input type="hidden" name="id" value={editingPrice.id} />
				<div class="mt-4 space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700">หมวดหมู่</label>
						<input name="category" value={editingPrice.category} required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">ชื่อรายการ</label>
						<input name="item_name" value={editingPrice.item_name} required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">ราคากลาง (บาท)</label>
						<input name="price" type="number" step="0.01" value={editingPrice.price} required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">วันที่บังคับใช้</label>
						<input name="effective_date" type="date" value={editingPrice.effective_date} required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => (editingPrice = null)} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
					<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">บันทึก</button>
				</div>
			</form>
		</div>
	</div>
{/if}
