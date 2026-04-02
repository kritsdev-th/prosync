<script lang="ts">
	import { enhance } from '$app/forms';
	import BackButton from '$lib/components/BackButton.svelte';

	let { data, form: formResult } = $props();
	let showCreateModal = $state(false);
	let editingUnit = $state<any>(null);

	function buildTree(units: any[], parentId: number | null = null): any[] {
		return units
			.filter((u) => u.parent_id === parentId)
			.map((u) => ({ ...u, children: buildTree(units, u.id) }));
	}

	let tree = $derived(buildTree(data.units));
</script>

{#snippet unitNode(node: any, depth: number)}
	<div class="border-l-2 border-gray-200" style="margin-left: {depth * 24}px">
		<div class="flex items-center gap-2 rounded-lg border bg-white p-3 my-1 hover:shadow-sm">
			<a href="/admin/org-structure/{node.id}" class="flex-1 min-w-0 group">
				<div class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{node.name}</div>
				<div class="text-xs text-gray-500">
					{#if node.head_name}
						หัวหน้า: {node.head_name}
					{:else}
						<span class="text-gray-400">ยังไม่กำหนดหัวหน้า</span>
					{/if}
				</div>
			</a>
			<div class="flex gap-1">
				<button
					onclick={() => (editingUnit = node)}
					class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
				>
					แก้ไข
				</button>
				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="id" value={node.id} />
					<button type="submit" class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">
						ลบ
					</button>
				</form>
			</div>
		</div>
		{#if node.children?.length > 0}
			{#each node.children as child}
				{@render unitNode(child, depth + 1)}
			{/each}
		{/if}
	</div>
{/snippet}

<div>
	<BackButton href="/org-management" label="กลับหน้าโครงสร้างองค์กร" />
	<div class="mt-3 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">โครงสร้างองค์กร</h1>
			<p class="mt-1 text-sm text-gray-500">จัดการแผนกและหน่วยงาน แบบ Tree Hierarchy</p>
		</div>
		<button
			onclick={() => (showCreateModal = true)}
			class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			สร้างแผนก
		</button>
	</div>

	{#if formResult?.message}
		<div class="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{formResult.message}</div>
	{/if}

	<!-- Tree View -->
	<div class="mt-6">
		{#if tree.length === 0}
			<div class="rounded-xl border bg-white p-8 text-center text-gray-500">
				ยังไม่มีข้อมูลโครงสร้างองค์กร
			</div>
		{:else}
			{#each tree as rootNode}
				{@render unitNode(rootNode, 0)}
			{/each}
		{/if}
	</div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">สร้างแผนกใหม่</h2>
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ update }) => { showCreateModal = false; await update(); };
			}}>
				<div class="mt-4 space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700">ชื่อแผนก *</label>
						<input name="name" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">หน่วยงาน *</label>
						<select name="agency_id" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- เลือกหน่วยงาน --</option>
							{#each data.agencies as agency}
								<option value={agency.id}>{agency.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">แผนกแม่ (Parent)</label>
						<select name="parent_id" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- ระดับสูงสุด (Root) --</option>
							{#each data.units as unit}
								<option value={unit.id}>{unit.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">หัวหน้าหน่วยงาน</label>
						<select name="head_of_unit_id" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- ไม่ระบุ --</option>
							{#each data.users as user}
								<option value={user.id}>{user.name}</option>
							{/each}
						</select>
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

<!-- Edit Modal -->
{#if editingUnit}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-bold text-gray-900">แก้ไขแผนก</h2>
			<form method="POST" action="?/update" use:enhance={() => {
				return async ({ update }) => { editingUnit = null; await update(); };
			}}>
				<input type="hidden" name="id" value={editingUnit.id} />
				<div class="mt-4 space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700">ชื่อแผนก</label>
						<input name="name" value={editingUnit.name} required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">แผนกแม่</label>
						<select name="parent_id" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- ระดับสูงสุด --</option>
							{#each data.units.filter((u) => u.id !== editingUnit.id) as unit}
								<option value={unit.id} selected={editingUnit.parent_id === unit.id}>{unit.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">หัวหน้าหน่วยงาน</label>
						<select name="head_of_unit_id" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
							<option value="">-- ไม่ระบุ --</option>
							{#each data.users as user}
								<option value={user.id} selected={editingUnit.head_of_unit_id === user.id}>{user.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button type="button" onclick={() => (editingUnit = null)} class="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
					<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">บันทึก</button>
				</div>
			</form>
		</div>
	</div>
{/if}
