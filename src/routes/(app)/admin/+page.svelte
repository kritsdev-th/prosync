<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';

	const sections = [
		{
			title: 'จัดการจังหวัด',
			desc: 'เพิ่ม แก้ไข ลบ จังหวัด ในระบบ',
			href: '/admin/provinces',
			icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
			accentColor: 'oklch(0.52 0.14 240)',
			accentBg: 'oklch(0.52 0.14 240 / 0.08)'
		},
		{
			title: 'จัดการหน่วยงาน',
			desc: 'จัดการ Agency (Tenant) ในแต่ละจังหวัด',
			href: '/admin/agencies',
			icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
			accentColor: 'oklch(0.54 0.16 150)',
			accentBg: 'oklch(0.54 0.16 150 / 0.08)'
		},
		{
			title: 'ราคากลาง',
			desc: 'จัดการราคากลางแยกตามจังหวัด',
			href: '/admin/median-prices',
			icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
			accentColor: 'oklch(0.62 0.18 60)',
			accentBg: 'oklch(0.62 0.18 60 / 0.08)'
		}
	];
</script>

<div>
	<PageHeader title="จัดการระบบ" subtitle="เฉพาะ Super Admin — จัดการข้อมูลหลักของระบบ" />

	<div class="card-grid">
		{#each sections as card, i}
			<a href={card.href} class="nav-card" style="animation-delay: {i * 0.08}s;">
				<div class="card-icon-wrap" style="background: {card.accentBg};">
					<svg class="card-icon" style="color: {card.accentColor};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d={card.icon} />
					</svg>
				</div>
				<div class="card-body">
					<h3 class="card-title">{card.title}</h3>
					<p class="card-desc">{card.desc}</p>
				</div>
				<svg class="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		{/each}
	</div>
</div>

<style>
	.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

	.nav-card {
		display: flex; align-items: center; gap: 16px; padding: 24px;
		border-radius: 16px; background: oklch(0.995 0.002 180);
		border: 1px solid oklch(0.92 0.005 180); text-decoration: none;
		animation: card-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
	}
	.nav-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 28px oklch(0.52 0.14 240 / 0.1);
		border-color: oklch(0.52 0.14 240 / 0.2);
	}

	.card-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.card-icon { width: 24px; height: 24px; }
	.card-body { flex: 1; min-width: 0; }
	.card-title { margin: 0 0 4px 0; font-size: 1rem; font-weight: 600; color: oklch(0.2 0.02 180); }
	.card-desc { margin: 0; font-size: 0.8125rem; color: oklch(0.5 0.02 180); line-height: 1.4; }

	.card-arrow { width: 20px; height: 20px; color: oklch(0.7 0.01 180); flex-shrink: 0; transition: transform 0.2s ease, color 0.2s ease; }
	.nav-card:hover .card-arrow { transform: translateX(4px); color: oklch(0.52 0.14 240); }

	@keyframes card-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

	@media (max-width: 768px) { .card-grid { grid-template-columns: 1fr; } }
</style>
