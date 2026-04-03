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
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
			accentColor: 'oklch(0.52 0.14 240)',
			accentBg: 'oklch(0.52 0.14 240 / 0.08)'
		},
		{
			title: 'จัดการบทบาทและสิทธิ์',
			desc: 'สร้าง/แก้ไขบทบาท กำหนดสิทธิ์การเข้าถึงระบบ',
			href: '/admin/roles',
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
			accentColor: 'oklch(0.54 0.16 150)',
			accentBg: 'oklch(0.54 0.16 150 / 0.08)'
		},
		{
			title: 'โครงสร้างองค์กร',
			desc: 'จัดการแผนก หน่วยงาน Tree Hierarchy',
			href: '/admin/org-structure',
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
			accentColor: 'oklch(0.55 0.12 280)',
			accentBg: 'oklch(0.55 0.12 280 / 0.08)'
		}
	];

	function cardHref(baseHref: string): string {
		if (!agencyId) return baseHref;
		const params = new URLSearchParams();
		params.set('agency_id', String(agencyId));
		if (data.selectedProvinceId) params.set('province_id', String(data.selectedProvinceId));
		return `${baseHref}?${params.toString()}`;
	}
</script>

<div class="page-container">
	<h1 class="page-title">จัดการโครงสร้างองค์กร</h1>
	<p class="page-subtitle">จัดการผู้ใช้งาน สิทธิ์ บทบาท และโครงสร้างแผนก</p>

	<!-- Scope Selector -->
	{#if data.mode === 'super_admin'}
		<div class="scope-bar">
			<div class="scope-field">
				<span class="scope-label">จังหวัด</span>
				<select onchange={onProvinceChange} class="scope-select">
					<option value="">-- เลือกจังหวัด --</option>
					{#each data.provinces as p}
						<option value={p.id} selected={data.selectedProvinceId === p.id}>{p.name}</option>
					{/each}
				</select>
			</div>
			<div class="scope-field">
				<span class="scope-label" class:disabled-label={!data.selectedProvinceId}>หน่วยงาน</span>
				<select
					onchange={onAgencyChange}
					disabled={!data.selectedProvinceId}
					class="scope-select"
					class:disabled-select={!data.selectedProvinceId}
				>
					<option value="">
						{data.selectedProvinceId && data.agencies.length === 0
							? '-- ไม่มีหน่วยงานในจังหวัดนี้ --'
							: '-- เลือกหน่วยงาน --'}
					</option>
					{#each data.agencies as a}
						<option value={a.id} selected={data.selectedAgencyId === a.id}>{a.name}</option>
					{/each}
				</select>
			</div>
		</div>
	{:else}
		<!-- Director badge -->
		<div class="director-badge">
			<svg class="director-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
			</svg>
			<span class="director-label">หน่วยงาน:</span>
			<span class="director-name">{data.agencyName}</span>
		</div>
	{/if}

	<!-- Cards -->
	<div class="card-grid">
		{#each cards as card}
			{#if agencyId}
				<a href={cardHref(card.href)} class="nav-card">
					<div class="card-icon-wrap" style="background: {card.accentBg};">
						<svg class="card-icon" style="color: {card.accentColor};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d={card.icon} />
						</svg>
					</div>
					<div class="card-text">
						<h3 class="card-title">{card.title}</h3>
						<p class="card-desc">{card.desc}</p>
					</div>
					<svg class="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</a>
			{:else}
				<div class="nav-card disabled">
					<div class="card-icon-wrap">
						<svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d={card.icon} />
						</svg>
					</div>
					<div class="card-text">
						<h3 class="card-title">{card.title}</h3>
						<p class="card-desc">{card.desc}</p>
					</div>
				</div>
			{/if}
		{/each}
	</div>

	{#if !agencyId && data.mode === 'super_admin'}
		<p class="hint-text">กรุณาเลือกจังหวัดและหน่วยงานก่อนดำเนินการ</p>
	{/if}
</div>

<style>
	.page-container {
		animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.page-title {
		margin: 0 0 4px 0;
		font-size: clamp(1.375rem, 1.1rem + 0.7vw, 1.625rem);
		font-weight: 700;
		color: oklch(0.2 0.02 180);
		letter-spacing: -0.01em;
	}

	.page-subtitle {
		margin: 0 0 24px 0;
		font-size: 0.875rem;
		color: oklch(0.5 0.02 180);
	}

	/* ── Scope Bar ── */
	.scope-bar {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 16px 20px;
		margin-bottom: 28px;
		border-radius: 14px;
		background: oklch(0.98 0.005 180);
		border: 1px solid oklch(0.9 0.005 180);
	}

	.scope-field {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.scope-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: oklch(0.4 0.02 180);
		white-space: nowrap;
	}

	.scope-label.disabled-label {
		color: oklch(0.7 0.01 180);
	}

	.scope-select {
		padding: 8px 14px;
		border: 1px solid oklch(0.82 0.015 180);
		border-radius: 10px;
		background: oklch(0.995 0.002 180);
		font-family: 'Noto Sans Thai', sans-serif;
		font-size: 0.875rem;
		color: oklch(0.25 0.02 180);
		cursor: pointer;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.scope-select:focus {
		outline: none;
		border-color: oklch(0.52 0.14 240);
		box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.12);
	}

	.scope-select.disabled-select {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ── Director Badge ── */
	.director-badge {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 12px 18px;
		margin-bottom: 28px;
		border-radius: 12px;
		background: oklch(0.52 0.14 240 / 0.06);
		border-left: 3px solid oklch(0.52 0.14 240);
	}

	.director-icon {
		width: 20px;
		height: 20px;
		color: oklch(0.52 0.14 240);
	}

	.director-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: oklch(0.45 0.02 180);
	}

	.director-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: oklch(0.25 0.02 180);
	}

	/* ── Card Grid ── */
	.card-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.nav-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 20px;
		border-radius: 14px;
		background: oklch(0.995 0.002 180);
		border: 1px solid oklch(0.92 0.005 180);
		text-decoration: none;
		transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
	}

	.nav-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px oklch(0.52 0.14 240 / 0.08);
		border-color: oklch(0.52 0.14 240 / 0.2);
	}

	.nav-card.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.card-icon-wrap {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: oklch(0.94 0.005 180);
	}

	.card-icon {
		width: 22px;
		height: 22px;
		color: oklch(0.55 0.02 180);
	}

	.card-text {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		margin: 0 0 3px 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: oklch(0.2 0.02 180);
	}

	.card-desc {
		margin: 0;
		font-size: 0.75rem;
		color: oklch(0.5 0.02 180);
		line-height: 1.4;
	}

	.card-arrow {
		width: 18px;
		height: 18px;
		color: oklch(0.7 0.01 180);
		flex-shrink: 0;
		transition: transform 0.15s ease, color 0.15s ease;
	}

	.nav-card:hover .card-arrow {
		transform: translateX(3px);
		color: oklch(0.52 0.14 240);
	}

	.hint-text {
		text-align: center;
		margin-top: 20px;
		font-size: 0.875rem;
		color: oklch(0.55 0.02 180);
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@media (max-width: 768px) {
		.card-grid {
			grid-template-columns: 1fr;
		}

		.scope-bar {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
