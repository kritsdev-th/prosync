<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	let { data } = $props();
</script>

<div>
	<!-- Breadcrumb -->
	<nav class="flex items-center gap-1.5 text-[0.8125rem]" style="color: var(--color-slate-400)">
		<a href="/admin" class="transition-colors duration-150 hover:underline" style="color: var(--color-brand-600)">จัดการระบบ</a>
		<span>/</span>
		<a href="/admin/org-structure" class="transition-colors duration-150 hover:underline" style="color: var(--color-brand-600)">โครงสร้างองค์กร</a>
		<span>/</span>
		{#if data.parentName}
			<span>{data.parentName}</span>
			<span>/</span>
		{/if}
		<span style="color: var(--color-slate-700)">{data.unit.name}</span>
	</nav>

	<!-- Header -->
	<BackButton href="/admin/org-structure" label="กลับหน้าโครงสร้าง" />
	<div class="mt-3 flex items-start justify-between gap-4">
		<div>
			<h1 style="margin: 0 0 4px 0; font-size: clamp(1.375rem, 1.1rem + 0.7vw, 1.625rem); font-weight: 700; color: oklch(0.2 0.02 180); letter-spacing: -0.01em;">{data.unit.name}</h1>
			<div class="mt-1 flex items-center gap-3">
				{#if data.unit.head_name}
					<p class="text-sm" style="color: var(--color-slate-500)">
						หัวหน้าหน่วยงาน:
						<span class="font-medium" style="color: var(--color-slate-700)">{data.unit.head_name}</span>
					</p>
				{:else}
					<p class="text-sm" style="color: var(--color-slate-400)">ยังไม่กำหนดหัวหน้าหน่วยงาน</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Members Table -->
	<div class="mt-6">
		<h2 class="text-base font-semibold" style="color: var(--color-slate-800)">
			สมาชิกในแผนก
			<span class="ml-1 text-sm font-normal" style="color: var(--color-slate-400)">({data.members.length} คน)</span>
		</h2>

		{#if data.members.length === 0}
			<div class="mt-4 rounded-xl p-8 text-center" style="background: var(--color-slate-50); border: 1px solid var(--color-slate-100)">
				<p class="text-sm" style="color: var(--color-slate-400)">ยังไม่มีสมาชิกในแผนกนี้</p>
				{#if (data as any).canManage}
					<p class="mt-1 text-[0.75rem]" style="color: var(--color-slate-400)">มอบหมายบทบาทให้ผู้ใช้ในหน้า
						<a href="/admin/users" class="underline" style="color: var(--color-brand-600)">จัดการผู้ใช้งาน</a>
					</p>
				{/if}
			</div>
		{:else}
			<div class="mt-3 overflow-hidden rounded-xl" style="border: 1px solid var(--color-slate-100); background: white">
				<table class="w-full text-left text-sm">
					<thead>
						<tr style="background: var(--color-slate-50); border-bottom: 1px solid var(--color-slate-100)">
							<th class="px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-wider" style="color: var(--color-slate-500)">ชื่อ-สกุล</th>
							<th class="px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-wider" style="color: var(--color-slate-500)">เลขบัตรประชาชน</th>
							<th class="px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-wider" style="color: var(--color-slate-500)">ตำแหน่ง</th>
							<th class="px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-wider" style="color: var(--color-slate-500)">บทบาท</th>
							<th class="px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-wider" style="color: var(--color-slate-500)">สังกัด</th>
						</tr>
					</thead>
					<tbody>
						{#each data.members as member, i}
							<tr style="border-bottom: {i < data.members.length - 1 ? '1px solid var(--color-slate-50)' : 'none'}">
								<td class="px-4 py-3">
									<span class="font-medium" style="color: var(--color-slate-900)">{member.user_name}</span>
								</td>
								<td class="px-4 py-3 tabular-nums" style="color: var(--color-slate-600)">{member.id_card}</td>
								<td class="px-4 py-3" style="color: var(--color-slate-600)">
									{#if member.position || member.position_rank}
										{member.position || ''}{member.position && member.position_rank ? ' / ' : ''}{member.position_rank || ''}
									{:else}
										<span style="color: var(--color-slate-300)">-</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<span class="rounded-md px-2 py-0.5 text-[0.75rem] font-medium" style="background: var(--color-brand-50); color: var(--color-brand-700)">{member.role_name}</span>
								</td>
								<td class="px-4 py-3">
									{#if member.is_primary_unit}
										<span class="rounded-md px-2 py-0.5 text-[0.6875rem] font-medium" style="background: var(--color-health-100); color: var(--color-health-700)">สังกัดหลัก</span>
									{:else}
										<span class="text-[0.75rem]" style="color: var(--color-slate-400)">สังกัดรอง</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
