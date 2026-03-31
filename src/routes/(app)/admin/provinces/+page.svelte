<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Pagination from '$lib/components/Pagination.svelte';
	import { exportToCsv } from '$lib/utils/format';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateForm = $state(false);
	let editingId = $state<number | null>(null);
	let editingName = $state('');
	let deletingId = $state<number | null>(null);
	let currentPage = $state(1);
	const perPage = 20;

	let paginatedProvinces = $derived(
		data.provinces.slice((currentPage - 1) * perPage, currentPage * perPage)
	);

	function startEdit(id: number, name: string) {
		editingId = id;
		editingName = name;
	}

	function cancelEdit() {
		editingId = null;
		editingName = '';
	}

	function confirmDelete(id: number) {
		deletingId = id;
	}

	function cancelDelete() {
		deletingId = null;
	}

	function handleExportCsv() {
		exportToCsv('provinces', [
			{ key: 'id', label: 'รหัส' },
			{ key: 'name', label: 'ชื่อจังหวัด' }
		], data.provinces);
	}
</script>

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดการจังหวัด</h1>
			<p class="mt-1 text-sm text-gray-500">เพิ่ม แก้ไข ลบ ข้อมูลจังหวัดในระบบ</p>
		</div>
		<div class="flex gap-2">
			<button
				onclick={handleExportCsv}
				class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				ส่งออก CSV
			</button>
			<button
				onclick={() => (showCreateForm = !showCreateForm)}
				class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				เพิ่มจังหวัด
			</button>
		</div>
	</div>

	<!-- Create Form -->
	{#if showCreateForm}
		<div class="mb-6 rounded-xl border bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">เพิ่มจังหวัดใหม่</h2>
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						if (form?.success) {
							showCreateForm = false;
						}
					};
				}}
			>
				<div class="flex items-end gap-3">
					<div class="flex-1">
						<label for="create-name" class="mb-1 block text-sm font-medium text-gray-700">
							ชื่อจังหวัด <span class="text-red-500">*</span>
						</label>
						<input
							id="create-name"
							type="text"
							name="name"
							placeholder="เช่น กรุงเทพมหานคร"
							required
							class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
						{#if form && !form.success && form.errors?.name}
							<p class="mt-1 text-sm text-red-600">{form.errors.name[0]}</p>
						{/if}
					</div>
					<div class="flex gap-2">
						<button
							type="submit"
							class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							บันทึก
						</button>
						<button
							type="button"
							onclick={() => (showCreateForm = false)}
							class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
						>
							ยกเลิก
						</button>
					</div>
				</div>
			</form>
		</div>
	{/if}

	<!-- Table -->
	<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
						รหัส
					</th>
					<th class="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
						ชื่อจังหวัด
					</th>
					<th class="px-6 py-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
						จัดการ
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each paginatedProvinces as province (province.id)}
					<tr class="transition-colors hover:bg-gray-50">
						{#if editingId === province.id}
							<td class="px-6 py-3 text-sm text-gray-500">{province.id}</td>
							<td class="px-6 py-3" colspan="1">
								<form
									method="POST"
									action="?/update"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
											if (form?.success) {
												cancelEdit();
											}
										};
									}}
									class="flex items-center gap-2"
								>
									<input type="hidden" name="id" value={province.id} />
									<input
										type="text"
										name="name"
										bind:value={editingName}
										required
										class="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
									/>
									<button
										type="submit"
										class="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
									>
										บันทึก
									</button>
									<button
										type="button"
										onclick={cancelEdit}
										class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
									>
										ยกเลิก
									</button>
								</form>
							</td>
							<td></td>
						{:else if deletingId === province.id}
							<td class="px-6 py-3 text-sm text-gray-500">{province.id}</td>
							<td class="px-6 py-3">
								<span class="text-sm text-red-600">
									ยืนยันลบ "{province.name}" ?
								</span>
							</td>
							<td class="px-6 py-3 text-right">
								<form
									method="POST"
									action="?/delete"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
											cancelDelete();
										};
									}}
									class="inline-flex items-center gap-2"
								>
									<input type="hidden" name="id" value={province.id} />
									<button
										type="submit"
										class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
									>
										ลบ
									</button>
									<button
										type="button"
										onclick={cancelDelete}
										class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
									>
										ยกเลิก
									</button>
								</form>
							</td>
						{:else}
							<td class="px-6 py-3 text-sm text-gray-500">{province.id}</td>
							<td class="px-6 py-3 text-sm font-medium text-gray-900">{province.name}</td>
							<td class="px-6 py-3 text-right">
								<div class="inline-flex items-center gap-2">
									<button
										onclick={() => startEdit(province.id, province.name)}
										class="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
									>
										แก้ไข
									</button>
									<button
										onclick={() => confirmDelete(province.id)}
										class="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
									>
										ลบ
									</button>
								</div>
							</td>
						{/if}
					</tr>
				{:else}
					<tr>
						<td colspan="3" class="px-6 py-12 text-center text-sm text-gray-400">
							ยังไม่มีข้อมูลจังหวัด
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<Pagination totalItems={data.provinces.length} bind:currentPage {perPage} />
	</div>
</div>
