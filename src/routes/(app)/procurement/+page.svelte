<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();
	let pendingCount = $derived((data as any).pendingTaskCount ?? 0);
</script>

<div>
	<PageHeader title="จัดซื้อจัดจ้าง" subtitle="จัดการวิธีการจัดซื้อจัดจ้างและทำเอกสาร" />

	<!-- My Tasks Quick Access -->
	<a href="/procurement/tasks" class="tasks-banner">
		<div class="tasks-icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
			</svg>
		</div>
		<div class="tasks-info">
			<h3 class="tasks-title">งานของฉัน</h3>
			<p class="tasks-desc">
				{#if pendingCount > 0}
					คุณมี <strong>{pendingCount}</strong> งานที่รอดำเนินการ
				{:else}
					ไม่มีงานที่ต้องดำเนินการในขณะนี้
				{/if}
			</p>
		</div>
		{#if pendingCount > 0}
			<span class="tasks-badge">{pendingCount}</span>
		{/if}
		<svg class="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
	</a>

	<div class="card-grid">
		<a href="/procurement/workflows" class="nav-card">
			<div class="card-icon-wrap" style="background: oklch(0.55 0.12 280 / 0.08);">
				<svg class="card-icon" style="color: oklch(0.55 0.12 280);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</div>
			<div class="card-body">
				<h3 class="card-title">จัดการวิธีจัดซื้อจัดจ้าง</h3>
				<p class="card-desc">สร้าง/แก้ไข วิธีการจัดซื้อ กำหนดขั้นตอนและ Template การทำงาน</p>
			</div>
			<svg class="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		</a>

		<a href="/procurement/documents" class="nav-card">
			<div class="card-icon-wrap" style="background: oklch(0.52 0.14 240 / 0.08);">
				<svg class="card-icon" style="color: oklch(0.52 0.14 240);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>
			<div class="card-body">
				<h3 class="card-title">ทำเอกสารจัดซื้อจัดจ้าง</h3>
				<p class="card-desc">สร้างเอกสาร เชื่อมแผนงาน เลือกวิธีจัดซื้อ และดำเนินการตามขั้นตอน</p>
			</div>
			<svg class="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		</a>
	</div>
</div>

<style>
	.card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }

	.nav-card {
		display: flex; align-items: center; gap: 16px; padding: 24px;
		border-radius: 16px; background: oklch(0.995 0.002 180);
		border: 1px solid oklch(0.92 0.005 180); text-decoration: none;
		animation: card-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
	}
	.nav-card:nth-child(2) { animation-delay: 0.08s; }
	.nav-card:nth-child(3) { animation-delay: 0.16s; }
	.nav-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px oklch(0.52 0.14 240 / 0.1); border-color: oklch(0.52 0.14 240 / 0.2); }

	.card-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.card-icon { width: 24px; height: 24px; }
	.card-body { flex: 1; min-width: 0; }
	.card-title { margin: 0 0 4px 0; font-size: 1rem; font-weight: 600; color: oklch(0.2 0.02 180); }
	.card-desc { margin: 0; font-size: 0.8125rem; color: oklch(0.5 0.02 180); line-height: 1.4; }
	.card-arrow { width: 20px; height: 20px; color: oklch(0.7 0.01 180); flex-shrink: 0; transition: transform 0.2s ease, color 0.2s ease; }
	.nav-card:hover .card-arrow { transform: translateX(4px); color: oklch(0.52 0.14 240); }

	@keyframes card-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

	/* Tasks Banner */
	.tasks-banner {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 18px 24px;
		margin-bottom: 18px;
		border-radius: 14px;
		background: linear-gradient(135deg, oklch(0.52 0.14 240 / 0.06), oklch(0.54 0.16 150 / 0.04));
		border: 1px solid oklch(0.52 0.14 240 / 0.12);
		text-decoration: none;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		animation: card-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
	}
	.tasks-banner:hover { border-color: oklch(0.52 0.14 240 / 0.25); box-shadow: 0 4px 16px oklch(0.52 0.14 240 / 0.08); }
	.tasks-icon { width: 40px; height: 40px; border-radius: 10px; background: oklch(0.52 0.14 240 / 0.1); color: oklch(0.52 0.14 240); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.tasks-icon svg { width: 22px; height: 22px; }
	.tasks-info { flex: 1; }
	.tasks-title { margin: 0 0 2px 0; font-size: 0.9375rem; font-weight: 600; color: oklch(0.25 0.02 180); }
	.tasks-desc { margin: 0; font-size: 0.8125rem; color: oklch(0.5 0.02 180); }
	.tasks-desc strong { color: oklch(0.52 0.14 240); }
	.tasks-badge {
		min-width: 24px; height: 24px; padding: 0 6px;
		border-radius: 12px; background: oklch(0.58 0.2 25);
		color: white; font-size: 0.75rem; font-weight: 700;
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
	}

	@media (max-width: 768px) { .card-grid { grid-template-columns: 1fr; } }
</style>
