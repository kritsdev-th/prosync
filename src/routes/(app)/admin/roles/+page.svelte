<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import BackButton from '$lib/components/BackButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { exportToCsv } from '$lib/utils/format';

	let { data }: { data: PageData } = $props();

	let editingId = $state<number | null>(null);
	let editName = $state('');
	let editPermissions = $state<Record<string, Record<string, boolean>>>({});
	let currentPage = $state(1);
	const perPage = 20;

	let paginatedRoles = $derived(
		data.roles.slice((currentPage - 1) * perPage, currentPage * perPage)
	);

	const PERMISSION_LABELS: Record<string, { label: string; perms: Record<string, string> }> = {
		system: {
			label: 'ระบบ',
			perms: {
				can_manage_users: 'จัดการผู้ใช้งาน',
				can_manage_org_units: 'จัดการโครงสร้างองค์กร'
			}
		},
		planning: {
			label: 'แผนงาน',
			perms: {
				can_create_plan: 'สร้างแผน',
				can_edit_plan: 'แก้ไขแผน',
				can_delete_plan: 'ลบแผน'
			}
		},
		procurement: {
			label: 'จัดซื้อจัดจ้าง',
			perms: {
				can_create_document: 'สร้างเอกสารจัดซื้อ',
				can_approve_document: 'อนุมัติเอกสารจัดซื้อ'
			}
		},
		finance: {
			label: 'การเงิน',
			perms: {
				can_create_dika: 'สร้างฎีกาเบิกจ่าย',
				can_approve_dika: 'อนุมัติฎีกาเบิกจ่าย'
			}
		},
		audit: {
			label: 'ตรวจสอบ',
			perms: {
				can_view_audit_trail: 'ดูประวัติการเปลี่ยนแปลง'
			}
		}
	};

	function getActivePermissions(permissions: any): string[] {
		const active: string[] = [];
		for (const [group, perms] of Object.entries(permissions ?? {})) {
			const groupDef = PERMISSION_LABELS[group];
			if (!groupDef) continue;
			for (const [key, val] of Object.entries(perms as Record<string, boolean>)) {
				if (val && groupDef.perms[key]) {
					active.push(groupDef.perms[key]);
				}
			}
		}
		return active;
	}

	function startEdit(role: any) {
		editingId = role.id;
		editName = role.name;
		editPermissions = structuredClone(role.permissions);
	}

	function cancelEdit() {
		editingId = null;
		editName = '';
		editPermissions = {};
	}

	function handleExportCsv() {
		exportToCsv('roles', [
			{ key: 'name', label: 'ชื่อบทบาท' },
			{ key: 'permissions_summary', label: 'สิทธิ์' }
		], data.roles.map((r: any) => ({
			...r,
			permissions_summary: getActivePermissions(r.permissions).join(', ')
		})));
	}
</script>

<div>
	<BackButton href="/org-management" label="กลับหน้าโครงสร้างองค์กร" />
	<div class="mt-3 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดการบทบาทและสิทธิ์</h1>
			<p class="mt-1 text-sm text-gray-500">สร้าง แก้ไข ลบ บทบาท พร้อมกำหนดสิทธิ์การใช้งาน</p>
		</div>
		<button onclick={handleExportCsv} class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
			ส่งออก CSV
		</button>
	</div>

	<!-- Create Form -->
	<div class="mt-6 rounded-xl border bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-gray-900">เพิ่มบทบาทใหม่</h2>
		<form method="POST" action="?/create" use:enhance class="mt-4 space-y-4">
			<div>
				<label for="create-name" class="block text-sm font-medium text-gray-700">ชื่อบทบาท <span class="text-red-500">*</span></label>
				<input
					id="create-name"
					type="text"
					name="name"
					required
					maxlength="100"
					placeholder="เช่น เจ้าหน้าที่พัสดุ"
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div>
				<p class="text-sm font-medium text-gray-700">สิทธิ์การใช้งาน</p>
				<div class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each Object.entries(PERMISSION_LABELS) as [group, groupDef]}
						<div class="rounded-lg border border-gray-200 p-3">
							<p class="mb-2 text-sm font-semibold text-gray-800">{groupDef.label}</p>
							{#each Object.entries(groupDef.perms) as [key, label]}
								<label class="flex items-center gap-2 py-1 text-sm text-gray-600">
									<input type="checkbox" name="perm.{group}.{key}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
									{label}
								</label>
							{/each}
						</div>
					{/each}
				</div>
			</div>

			<button
				type="submit"
				class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				เพิ่มบทบาท
			</button>
		</form>
	</div>

	<!-- Roles Table -->
	<div class="mt-6 rounded-xl border bg-white shadow-sm">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">ชื่อบทบาท</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">สิทธิ์</th>
					<th class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">จัดการ</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each paginatedRoles as role}
					{#if editingId === role.id}
						<tr class="bg-blue-50">
							<td colspan="3" class="px-6 py-4">
								<form method="POST" action="?/update" use:enhance={() => { return async ({ update }) => { await update(); cancelEdit(); }; }} class="space-y-4">
									<input type="hidden" name="id" value={role.id} />
									<div>
										<label for="edit-name-{role.id}" class="block text-sm font-medium text-gray-700">ชื่อบทบาท</label>
										<input
											id="edit-name-{role.id}"
											type="text"
											name="name"
											required
											maxlength="100"
											bind:value={editName}
											class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
										/>
									</div>

									<div>
										<p class="text-sm font-medium text-gray-700">สิทธิ์การใช้งาน</p>
										<div class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{#each Object.entries(PERMISSION_LABELS) as [group, groupDef]}
												<div class="rounded-lg border border-gray-200 bg-white p-3">
													<p class="mb-2 text-sm font-semibold text-gray-800">{groupDef.label}</p>
													{#each Object.entries(groupDef.perms) as [key, label]}
														<label class="flex items-center gap-2 py-1 text-sm text-gray-600">
															<input
																type="checkbox"
																name="perm.{group}.{key}"
																checked={editPermissions?.[group]?.[key] ?? false}
																class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
															/>
															{label}
														</label>
													{/each}
												</div>
											{/each}
										</div>
									</div>

									<div class="flex gap-2">
										<button
											type="submit"
											class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										>
											บันทึก
										</button>
										<button
											type="button"
											onclick={() => cancelEdit()}
											class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										>
											ยกเลิก
										</button>
									</div>
								</form>
							</td>
						</tr>
					{:else}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 text-sm font-medium text-gray-900">{role.name}</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{#if getActivePermissions(role.permissions).length > 0}
									<div class="flex flex-wrap gap-1">
										{#each getActivePermissions(role.permissions) as perm}
											<span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{perm}</span>
										{/each}
									</div>
								{:else}
									<span class="text-gray-400">ไม่มีสิทธิ์</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-right text-sm">
								<button
									onclick={() => startEdit(role)}
									class="mr-2 text-blue-600 hover:text-blue-800"
								>
									แก้ไข
								</button>
								<form method="POST" action="?/delete" use:enhance class="inline">
									<input type="hidden" name="id" value={role.id} />
									<button
										type="submit"
										onclick={(e) => { if (!confirm('ลบบทบาทนี้? การดำเนินการนี้จะลบการมอบหมายผู้ใช้ที่เกี่ยวข้องด้วย')) e.preventDefault(); }}
										class="text-red-600 hover:text-red-800"
									>
										ลบ
									</button>
								</form>
							</td>
						</tr>
					{/if}
				{:else}
					<tr>
						<td colspan="3" class="px-6 py-8 text-center text-sm text-gray-400">ยังไม่มีบทบาทในระบบ</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<Pagination totalItems={data.roles.length} bind:currentPage {perPage} />
	</div>
</div>
