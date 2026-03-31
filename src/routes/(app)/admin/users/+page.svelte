<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();
	let searchQuery = $state(data.search || '');
	let showCreateModal = $state(false);
	let editingUser = $state<any>(null);
	let assigningUser = $state<any>(null);

	function getUserAssignments(userId: number) {
		return data.assignments.filter((a: any) => a.user_id === userId);
	}

	function handleSearch() {
		goto(`/admin/users?search=${encodeURIComponent(searchQuery)}`);
	}
</script>

<div>
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
			<p class="mt-1 text-sm text-gray-500">ค้นหา เพิ่ม แก้ไข ลบ ผู้ใช้งาน และจัดการสิทธิ์</p>
		</div>
		<button
			onclick={() => (showCreateModal = true)}
			class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			เพิ่มผู้ใช้งาน
		</button>
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
		<div class="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{form.message}</div>
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
				{#each data.users as user}
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
						<label class="block text-sm font-medium text-gray-700">ชื่อ-สกุล *</label>
						<input name="name" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">เลขบัตรประชาชน *</label>
						<input name="id_card" maxlength="13" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">รหัสผ่าน *</label>
						<input name="password" type="password" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">หน่วยงาน</label>
						<select name="agency_id" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- ไม่ระบุ --</option>
							{#each data.agencies as agency}
								<option value={agency.id}>{agency.name}</option>
							{/each}
						</select>
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
						<select name="agency_id" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- ไม่ระบุ --</option>
							{#each data.agencies as agency}
								<option value={agency.id} selected={editingUser.agency_id === agency.id}>{agency.name}</option>
							{/each}
						</select>
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

			<!-- Current assignments -->
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

			<!-- Add new assignment -->
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
						<select name="role_id" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- เลือกบทบาท --</option>
							{#each data.roles as role}
								<option value={role.id}>{role.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm text-gray-600">แผนก</label>
						<select name="org_unit_id" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- เลือกแผนก --</option>
							{#each data.orgUnits as unit}
								<option value={unit.id}>{unit.name}</option>
							{/each}
						</select>
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
