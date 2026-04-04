<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Pagination from '$lib/components/Pagination.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { exportToCsv } from '$lib/utils/format';

	let { data, form } = $props();
	let searchQuery = $state(data.search || '');
	let showCreateModal = $state(false);
	let editingUser = $state<any>(null);
	let assigningUser = $state<any>(null);
	let currentPage = $state(1);
	const perPage = 20;

	let paginatedUsers = $derived(
		data.users.slice((currentPage - 1) * perPage, currentPage * perPage)
	);

	function getUserAssignments(userId: number) {
		return data.assignments.filter((a: any) => a.user_id === userId);
	}

	function handleSearch() {
		goto(`/admin/users?search=${encodeURIComponent(searchQuery)}`);
	}

	function handleExportCsv() {
		exportToCsv('users', [
			{ key: 'name', label: 'ชื่อ-สกุล' },
			{ key: 'id_card', label: 'เลขบัตรประชาชน' },
			{ key: 'agency_name', label: 'หน่วยงาน' },
			{ key: 'position', label: 'ยศ/คำนำหน้า' },
			{ key: 'position_rank', label: 'ระดับตำแหน่ง' },
			{ key: 'email', label: 'อีเมล' }
		], data.users);
	}
</script>

<div>
	<BackButton href="/org-management" label="กลับหน้าโครงสร้างองค์กร" />
	<div style="display: flex; align-items: flex-start; justify-content: space-between; margin: 20px 0 24px; gap: 16px;">
		<div>
			<h1 style="margin: 0 0 4px 0; font-size: clamp(1.375rem, 1.1rem + 0.7vw, 1.625rem); font-weight: 700; color: oklch(0.2 0.02 180); letter-spacing: -0.01em;">จัดการผู้ใช้งาน</h1>
			<p style="margin: 0; font-size: 0.875rem; color: oklch(0.5 0.02 180);">ค้นหา เพิ่ม แก้ไข ลบ ผู้ใช้งาน และจัดการสิทธิ์</p>
		</div>
		<div style="display: flex; gap: 10px; flex-shrink: 0;">
			<button onclick={handleExportCsv} style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; border: 1px solid oklch(0.88 0.01 180); background: oklch(0.98 0.005 180); color: oklch(0.35 0.02 180); font-size: 0.875rem; font-weight: 500; cursor: pointer;">
				ส่งออก CSV
			</button>
			<button
				onclick={() => (showCreateModal = true)}
				style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 10px; border: none; background: oklch(0.52 0.14 240); color: oklch(0.98 0.005 180); font-size: 0.875rem; font-weight: 500; cursor: pointer;"
			>
				เพิ่มผู้ใช้งาน
			</button>
		</div>
	</div>

	<!-- Search -->
	<div class="mt-4">
		<form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex gap-2">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="ค้นหาด้วยชื่อหรือเลขบัตรประชาชน..."
				class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			/>
			<button type="submit" class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
				ค้นหา
			</button>
		</form>
	</div>

	{#if form?.message}
		<div class="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{form.message}</div>
	{/if}

	<!-- Users Table -->
	<div class="mt-4 overflow-hidden rounded-xl border bg-white shadow-sm">
		<table class="w-full text-left text-sm">
			<thead class="border-b bg-gray-50">
				<tr>
					<th class="px-4 py-3 font-medium text-gray-600">ชื่อ-สกุล</th>
					<th class="px-4 py-3 font-medium text-gray-600">เลขบัตรประชาชน</th>
					<th class="px-4 py-3 font-medium text-gray-600">หน่วยงาน</th>
					<th class="px-4 py-3 font-medium text-gray-600">บทบาท / แผนก</th>
					<th class="px-4 py-3 font-medium text-gray-600">จัดการ</th>
				</tr>
			</thead>
			<tbody class="divide-y">
				{#each paginatedUsers as user}
					{@const assignments = getUserAssignments(user.id)}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3">
							<div class="font-medium text-gray-900">
								{user.position || ''} {user.name}
								{#if user.is_super_admin}
									<span class="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">SA</span>
								{/if}
							</div>
							<div class="text-xs text-gray-500">{user.position_rank || ''}</div>
						</td>
						<td class="px-4 py-3 font-mono text-xs text-gray-600">{user.id_card}</td>
						<td class="px-4 py-3 text-gray-600">{user.agency_name || '-'}</td>
						<td class="px-4 py-3">
							{#if assignments.length > 0}
								{#each assignments as a}
									<div class="text-xs">
										<span class="font-medium text-blue-700">{a.role_name}</span>
										<span class="text-gray-500"> @ {a.org_unit_name}</span>
										{#if a.is_primary_unit}
											<span class="ml-1 rounded bg-green-100 px-1 text-green-700">หลัก</span>
										{/if}
									</div>
								{/each}
							{:else}
								<span class="text-xs text-gray-400">ยังไม่ได้มอบหมาย</span>
							{/if}
						</td>
						<td class="px-4 py-3">
							<div class="flex gap-1">
								<button
									onclick={() => (editingUser = user)}
									class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
								>
									แก้ไข
								</button>
								<button
									onclick={() => (assigningUser = user)}
									class="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
								>
									จัดสิทธิ์
								</button>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={user.id} />
									<button type="submit" class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">
										ลบ
									</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<Pagination totalItems={data.users.length} bind:currentPage {perPage} />
	</div>
</div>

<!-- Create User Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">เพิ่มผู้ใช้งานใหม่</h2>
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ update }) => {
					showCreateModal = false;
					await update();
				};
			}}>
				<div class="mt-4 space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700">ชื่อ-สกุล <span class="text-red-500">*</span></label>
						<input name="name" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">เลขบัตรประชาชน <span class="text-red-500">*</span></label>
						<input name="id_card" maxlength="13" inputmode="numeric" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						{#if form?.errors?.id_card}
							<p class="mt-1 text-sm text-red-600">{form.errors.id_card[0]}</p>
						{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">รหัสผ่าน <span class="text-red-500">*</span></label>
						<input name="password" type="password" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">หน่วยงาน</label>
						<CustomSelect name="agency_id" options={data.agencies.map(a => ({ value: String(a.id), label: a.name }))} placeholder="-- ไม่ระบุ --" class="mt-1" />
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-sm font-medium text-gray-700">ยศ/คำนำหน้า</label>
							<input name="position" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">ระดับตำแหน่ง</label>
							<input name="position_rank" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">อีเมล</label>
						<input name="email" type="email" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => (showCreateModal = false)} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
						ยกเลิก
					</button>
					<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
						บันทึก
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit User Modal -->
{#if editingUser}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">แก้ไขผู้ใช้งาน</h2>
			<form method="POST" action="?/update" use:enhance={() => {
				return async ({ update }) => {
					editingUser = null;
					await update();
				};
			}}>
				<input type="hidden" name="id" value={editingUser.id} />
				<div class="mt-4 space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700">ชื่อ-สกุล</label>
						<input name="name" value={editingUser.name} required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">หน่วยงาน</label>
						<CustomSelect name="agency_id" options={data.agencies.map(a => ({ value: String(a.id), label: a.name }))} value={editingUser.agency_id ? String(editingUser.agency_id) : ''} placeholder="-- ไม่ระบุ --" class="mt-1" />
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-sm font-medium text-gray-700">ยศ/คำนำหน้า</label>
							<input name="position" value={editingUser.position || ''} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">ระดับตำแหน่ง</label>
							<input name="position_rank" value={editingUser.position_rank || ''} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">อีเมล</label>
						<input name="email" type="email" value={editingUser.email || ''} class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => (editingUser = null)} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
						ยกเลิก
					</button>
					<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
						บันทึก
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Assign Role Modal -->
{#if assigningUser}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">จัดการสิทธิ์: {assigningUser.name}</h2>

			{#if getUserAssignments(assigningUser.id).length > 0}
			{@const currentAssignments = getUserAssignments(assigningUser.id)}
				<div class="mt-4">
					<h3 class="text-sm font-medium text-gray-700">สิทธิ์ปัจจุบัน</h3>
					<div class="mt-2 space-y-2">
						{#each currentAssignments as a}
							<div class="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
								<div class="text-sm">
									<span class="font-medium">{a.role_name}</span>
									<span class="text-gray-500"> @ {a.org_unit_name}</span>
									{#if a.is_primary_unit}
										<span class="ml-1 rounded bg-green-100 px-1 text-xs text-green-700">หลัก</span>
									{/if}
								</div>
								<form method="POST" action="?/removeAssignment" use:enhance>
									<input type="hidden" name="id" value={a.id} />
									<button type="submit" class="text-xs text-red-600 hover:text-red-800">ลบ</button>
								</form>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<form method="POST" action="?/assign" use:enhance={() => {
				return async ({ update }) => {
					await update();
				};
			}}>
				<input type="hidden" name="user_id" value={assigningUser.id} />
				<div class="mt-4 space-y-3">
					<h3 class="text-sm font-medium text-gray-700">เพิ่มสิทธิ์ใหม่</h3>
					<div>
						<label class="block text-sm text-gray-600">บทบาท</label>
						<CustomSelect name="role_id" required options={data.roles.map(r => ({ value: String(r.id), label: r.name }))} placeholder="-- เลือกบทบาท --" class="mt-1" />
					</div>
					<div>
						<label class="block text-sm text-gray-600">แผนก</label>
						<CustomSelect name="org_unit_id" required options={data.orgUnits.map(u => ({ value: String(u.id), label: u.name }))} placeholder="-- เลือกแผนก --" class="mt-1" />
					</div>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" name="is_primary_unit" value="true" class="rounded border-gray-300" />
						สังกัดหลัก (Primary Unit)
					</label>
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => (assigningUser = null)} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
						ปิด
					</button>
					<button type="submit" class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
						เพิ่มสิทธิ์
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
