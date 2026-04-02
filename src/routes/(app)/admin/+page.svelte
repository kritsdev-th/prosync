<script lang="ts">
	const sections = [
		{
			title: 'จัดการจังหวัด',
			desc: 'เพิ่ม แก้ไข ลบ จังหวัด',
			href: '/admin/provinces',
			icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
		},
		{
			title: 'จัดการหน่วยงาน',
			desc: 'จัดการ Agency (Tenant)',
			href: '/admin/agencies',
			icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z'
		},
		{
			title: 'ราคากลาง',
			desc: 'จัดการราคากลางตามจังหวัด',
			href: '/admin/median-prices',
			icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'
		}
	];
</script>

<div>
	<h1 class="text-2xl font-bold" style="color: var(--color-slate-900)">จัดการระบบ</h1>
	<p class="mt-1 text-sm" style="color: var(--color-slate-500)">เฉพาะ Super Admin เท่านั้น — จัดการข้อมูลหลักของระบบ</p>

	<div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
		{#each sections as section}
			<a href={section.href}
				class="group flex items-start gap-3 rounded-lg p-4 transition-all duration-200"
				style="background: white; border: 1px solid var(--color-slate-100); box-shadow: 0 1px 2px oklch(0.2 0.02 240 / 0.05)"
				onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand-200)'; }}
				onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px oklch(0.2 0.02 240 / 0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-slate-100)'; }}>
				<div class="shrink-0 rounded-lg p-2" style="background: var(--color-slate-100)">
					<svg class="h-5 w-5" style="color: var(--color-slate-500)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d={section.icon} />
					</svg>
				</div>
				<div class="min-w-0">
					<h3 class="text-sm font-semibold" style="color: var(--color-slate-900)">{section.title}</h3>
					<p class="mt-0.5 text-[0.75rem]" style="color: var(--color-slate-500)">{section.desc}</p>
				</div>
			</a>
		{/each}
	</div>
</div>
