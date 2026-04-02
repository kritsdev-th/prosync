<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	function onProvinceChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		if (val) goto(`/org-management?province_id=${val}`);
		else goto('/org-management');
	}

	function onAgencyChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		if (val && data.selectedProvinceId) {
			goto(`/org-management?province_id=${data.selectedProvinceId}&agency_id=${val}`);
		}
	}

	let agencyId = $derived(
		data.mode === 'director' ? data.selectedAgencyId : data.selectedAgencyId
	);

	const cards = [
		{
			title: 'จัดการสิทธิ์ผู้ใช้งาน',
			desc: 'ค้นหาผู้ใช้ มอบหมายบทบาท/แผนก กำหนดสังกัดหลัก',
			href: '/admin/users',
			iconBg: 'var(--color-brand-100)',
			iconColor: 'var(--color-brand-600)',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
		},
		{
			title: 'จัดการบทบาทและสิทธิ์',
			desc: 'สร้าง/แก้ไขบทบาท กำหนดสิทธิ์การเข้าถึงระบบ',
			href: '/admin/roles',
			iconBg: 'var(--color-health-100)',
			iconColor: 'var(--color-health-600)',
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
		},
		{
			title: 'โครงสร้างองค์กร',
			desc: 'จัดการแผนก หน่วยงาน Tree Hierarchy',
			href: '/admin/org-structure',
			iconBg: 'var(--color-slate-100)',
			iconColor: 'var(--color-slate-600)',
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
		}
	];

	function cardHref(baseHref: string): string {
		if (!agencyId) return baseHref;
		return `${baseHref}?agency_id=${agencyId}`;
	}
</script>

<div>
	<h1 class="text-2xl font-bold" style="color: var(--color-slate-900)">จัดการโครงสร้างองค์กร</h1>
	<p class="mt-1 text-sm" style="color: var(--color-slate-500)">จัดการผู้ใช้งาน สิทธิ์ บทบาท และโครงสร้างแผนก</p>

	<!-- Selector -->
	{#if data.mode === 'super_admin'}
		<div class="mt-5 flex items-center gap-3 rounded-lg p-3" style="background: var(--color-slate-50); border: 1px solid var(--color-slate-100)">
			<div class="flex items-center gap-2">
				<label class="text-[0.8125rem] font-medium" style="color: var(--color-slate-600)">จังหวัด</label>
				<select onchange={onProvinceChange}
					class="rounded-md px-3 py-1.5 text-[0.8125rem] outline-none"
					style="border: 1px solid var(--color-slate-200); color: var(--color-slate-700); background: white">
					<option value="">-- เลือกจังหวัด --</option>
					{#each data.provinces as p}
						<option value={p.id} selected={data.selectedProvinceId === p.id}>{p.name}</option>
					{/each}
				</select>
			</div>
			<div class="flex items-center gap-2">
				<label class="text-[0.8125rem] font-medium" style="color: {data.selectedProvinceId ? 'var(--color-slate-600)' : 'var(--color-slate-300)'}">หน่วยงาน</label>
				<select onchange={onAgencyChange}
					disabled={!data.selectedProvinceId}
					class="rounded-md px-3 py-1.5 text-[0.8125rem] outline-none"
					style="border: 1px solid var(--color-slate-200); color: {data.selectedProvinceId ? 'var(--color-slate-700)' : 'var(--color-slate-300)'}; background: white; opacity: {data.selectedProvinceId ? '1' : '0.6'}">
					<option value="">{data.selectedProvinceId && data.agencies.length === 0 ? '-- ไม่มีหน่วยงานในจังหวัดนี้ --' : '-- เลือกหน่วยงาน --'}</option>
					{#each data.agencies as a}
						<option value={a.id} selected={data.selectedAgencyId === a.id}>{a.name}</option>
					{/each}
				</select>
			</div>
		</div>
	{:else}
		<div class="mt-5 inline-flex items-center gap-2 rounded-md px-3 py-2" style="background: var(--color-brand-50); border: 1px solid var(--color-brand-100)">
			<span class="text-[0.8125rem] font-medium" style="color: var(--color-brand-600)">หน่วยงาน:</span>
			<span class="text-[0.8125rem] font-semibold" style="color: var(--color-brand-800)">{data.agencyName}</span>
		</div>
	{/if}

	<!-- Cards — always visible, disabled when no agency -->
	<div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
		{#each cards as card}
			{#if agencyId}
				<a href={cardHref(card.href)}
					class="group flex items-start gap-3 rounded-lg p-4 transition-all duration-200"
					style="background: white; border: 1px solid var(--color-slate-100); box-shadow: 0 1px 2px oklch(0.2 0.02 240 / 0.05)"
					onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand-200)'; }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px oklch(0.2 0.02 240 / 0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-slate-100)'; }}>
					<div class="shrink-0 rounded-lg p-2" style="background: {card.iconBg}">
						<svg class="h-5 w-5" style="color: {card.iconColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d={card.icon} />
						</svg>
					</div>
					<div class="min-w-0">
						<h3 class="text-sm font-semibold" style="color: var(--color-slate-900)">{card.title}</h3>
						<p class="mt-0.5 text-[0.75rem]" style="color: var(--color-slate-500)">{card.desc}</p>
					</div>
				</a>
			{:else}
				<div class="flex items-start gap-3 rounded-lg p-4"
					style="background: var(--color-slate-50); border: 1px solid var(--color-slate-100); opacity: 0.5; cursor: not-allowed">
					<div class="shrink-0 rounded-lg p-2" style="background: var(--color-slate-100)">
						<svg class="h-5 w-5" style="color: var(--color-slate-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d={card.icon} />
						</svg>
					</div>
					<div class="min-w-0">
						<h3 class="text-sm font-semibold" style="color: var(--color-slate-400)">{card.title}</h3>
						<p class="mt-0.5 text-[0.75rem]" style="color: var(--color-slate-300)">{card.desc}</p>
					</div>
				</div>
			{/if}
		{/each}
	</div>
	{#if !agencyId && data.mode === 'super_admin'}
		<p class="mt-3 text-center text-[0.8125rem]" style="color: var(--color-slate-400)">กรุณาเลือกจังหวัดและหน่วยงานก่อนดำเนินการ</p>
	{/if}
</div>
