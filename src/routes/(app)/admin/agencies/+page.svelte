<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import Pagination from '$lib/components/Pagination.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import { exportToCsv } from '$lib/utils/format';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editingId = $state<number | null>(null);
	let editName = $state('');
	let editType = $state('');
	let editProvinceId = $state<number | null>(null);
	let currentPage = $state(1);
	const perPage = 20;

	let paginatedAgencies = $derived(
		data.agencies.slice((currentPage - 1) * perPage, currentPage * perPage)
	);

	const agencyTypes = [
		{ value: 'อบจ.', label: 'อบจ.' },
		{ value: 'เทศบาลนคร', label: 'เทศบาลนคร' },
		{ value: 'เทศบาลเมือง', label: 'เทศบาลเมือง' },
		{ value: 'เทศบาลตำบล', label: 'เทศบาลตำบล' },
		{ value: 'อบต.', label: 'อบต.' }
	];

	function startEdit(agency: (typeof data.agencies)[0]) {
		editingId = agency.id;
		editName = agency.name;
		editType = agency.agency_type ?? '';
		editProvinceId = agency.province_id;
	}

	function cancelEdit() {
		editingId = null;
	}

	function handleExportCsv() {
		exportToCsv('agencies', [
			{ key: 'name', label: 'ชื่อหน่วยงาน' },
			{ key: 'agency_type', label: 'ประเภท' },
			{ key: 'province_name', label: 'จังหวัด' }
		], data.agencies);
	}
</script>

<div class="mx-auto max-w-5xl">
	<BackButton href="/admin" label="กลับหน้าจัดการระบบ" />
	<div class="mt-3 mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดการหน่วยงาน</h1>
			<p class="mt-1 text-sm text-gray-500">เพิ่ม แก้ไข ลบ หน่วยงานในระบบ</p>
		</div>
		<button onclick={handleExportCsv} class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
			ส่งออก CSV
		</button>
	</div>

	{#if form?.error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.error}
		</div>
	{/if}
	{#if form?.success}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
			บันทึกสำเร็จ
		</div>
	{/if}

	<!-- Create form -->
	<div class="mb-6 rounded-xl border bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-lg font-semibold text-gray-800">เพิ่มหน่วยงานใหม่</h2>
		<form method="POST" action="?/create" use:enhance class="grid grid-cols-1 gap-4 sm:grid-cols-4">
			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-gray-700">ชื่อหน่วยงาน <span class="text-red-500">*</span></label>
				<input
					type="text"
					id="name"
					name="name"
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					placeholder="กรอกชื่อหน่วยงาน"
				/>
			</div>
			<div>
				<label for="agency_type" class="mb-1 block text-sm font-medium text-gray-700">ประเภท <span class="text-red-500">*</span></label>
				<select
					id="agency_type"
					name="agency_type"
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				>
					<option value="">-- เลือกประเภท --</option>
					{#each agencyTypes as t}
						<option value={t.value}>{t.label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="province_id" class="mb-1 block text-sm font-medium text-gray-700">จังหวัด <span class="text-red-500">*</span></label>
				<select
					id="province_id"
					name="province_id"
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				>
					<option value="">-- เลือกจังหวัด --</option>
					{#each data.provinces as province}
						<option value={province.id}>{province.name}</option>
					{/each}
				</select>
			</div>
			<div class="flex items-end">
				<button
					type="submit"
					class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				>
					เพิ่มหน่วยงาน
				</button>
			</div>
		</form>
	</div>

	<!-- Agency table -->
	<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
		<table class="w-full text-left text-sm">
			<thead class="border-b bg-gray-50 text-xs uppercase text-gray-500">
				<tr>
					<th class="px-6 py-3 font-medium">ชื่อหน่วยงาน</th>
					<th class="px-6 py-3 font-medium">ประเภท</th>
					<th class="px-6 py-3 font-medium">จังหวัด</th>
					<th class="px-6 py-3 text-right font-medium">จัดการ</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each paginatedAgencies as agency (agency.id)}
					{#if editingId === agency.id}
						<tr class="bg-blue-50/50">
							<td colspan="4" class="px-6 py-3">
								<form
									method="POST"
									action="?/update"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
											editingId = null;
										};
									}}
									class="grid grid-cols-1 gap-3 sm:grid-cols-4"
								>
									<input type="hidden" name="id" value={agency.id} />
									<div>
										<input
											type="text"
											name="name"
											bind:value={editName}
											required
											class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
										/>
									</div>
									<div>
										<select
											name="agency_type"
											bind:value={editType}
											required
											class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
										>
											<option value="">-- เลือกประเภท --</option>
											{#each agencyTypes as t}
												<option value={t.value}>{t.label}</option>
											{/each}
										</select>
									</div>
									<div>
										<select
											name="province_id"
											bind:value={editProvinceId}
											required
											class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
										>
											<option value="">-- เลือกจังหวัด --</option>
											{#each data.provinces as province}
												<option value={province.id}>{province.name}</option>
											{/each}
										</select>
									</div>
									<div class="flex items-center gap-2">
										<button
											type="submit"
											class="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
										>
											บันทึก
										</button>
										<button
											type="button"
											onclick={cancelEdit}
											class="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
										>
											ยกเลิก
										</button>
									</div>
								</form>
							</td>
						</tr>
					{:else}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-3 font-medium text-gray-900">{agency.name}</td>
							<td class="px-6 py-3 text-gray-600">{agency.agency_type ?? '-'}</td>
							<td class="px-6 py-3 text-gray-600">{agency.province_name ?? '-'}</td>
							<td class="px-6 py-3 text-right">
								<div class="flex items-center justify-end gap-2">
									<button
										onclick={() => startEdit(agency)}
										class="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
									>
										แก้ไข
									</button>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											return async ({ update }) => {
												if (confirm('ต้องการลบหน่วยงานนี้หรือไม่?')) {
													await update();
												}
											};
										}}
									>
										<input type="hidden" name="id" value={agency.id} />
										<button
											type="submit"
											class="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
										>
											ลบ
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/if}
				{:else}
					<tr>
						<td colspan="4" class="px-6 py-8 text-center text-gray-400">
							ยังไม่มีหน่วยงานในระบบ
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<Pagination totalItems={data.agencies.length} bind:currentPage {perPage} />
	</div>
</div>
