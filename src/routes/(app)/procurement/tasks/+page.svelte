<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';

	let { data } = $props();

	const typeLabels: Record<string, { label: string; action: string; color: string; bg: string; icon: string }> = {
		APPROVER: {
			label: 'รออนุมัติ',
			action: 'ตรวจสอบและอนุมัติ',
			color: 'oklch(0.48 0.14 60)',
			bg: 'oklch(0.62 0.18 60 / 0.08)',
			icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		UPLOADER: {
			label: 'รอส่งเอกสาร',
			action: 'อัปโหลดเอกสาร',
			color: 'oklch(0.42 0.12 240)',
			bg: 'oklch(0.52 0.14 240 / 0.08)',
			icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
		},
		COMMITTEE_MEMBER: {
			label: 'รอแต่งตั้งกรรมการ',
			action: 'ดำเนินการตามคณะกรรมการ',
			color: 'oklch(0.45 0.1 280)',
			bg: 'oklch(0.55 0.12 280 / 0.08)',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
		},
		SCORER: {
			label: 'รอให้คะแนน',
			action: 'ให้คะแนน vendor',
			color: 'oklch(0.4 0.14 150)',
			bg: 'oklch(0.54 0.16 150 / 0.08)',
			icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
		}
	};

	function getDocTitle(task: any): string {
		const payload = task.document_payload;
		if (payload && typeof payload === 'object' && 'title' in payload) {
			return payload.title;
		}
		return `เอกสาร #${task.document_id}`;
	}

	function timeAgo(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'เมื่อสักครู่';
		if (mins < 60) return `${mins} นาทีที่แล้ว`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours} ชม.ที่แล้ว`;
		const days = Math.floor(hours / 24);
		return `${days} วันที่แล้ว`;
	}

	const groupOrder = ['APPROVER', 'UPLOADER', 'COMMITTEE_MEMBER', 'SCORER'] as const;
	let activeGroups = $derived(groupOrder.filter((g) => (data.grouped as any)[g]?.length > 0));
</script>

<div>
	<BackButton href="/procurement" label="กลับหน้าจัดซื้อจัดจ้าง" />

	<div class="page-header">
		<div>
			<h1 class="page-title">งานที่รอดำเนินการ</h1>
			<p class="page-subtitle">
				รายการงานทั้งหมดที่คุณต้องดำเนินการ
				<span class="item-count">{data.tasks.length} งาน</span>
			</p>
		</div>
	</div>

	{#if data.tasks.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h3 class="empty-title">ไม่มีงานในขณะนี้</h3>
			<p class="empty-desc">คุณไม่มีงานที่ต้องดำเนินการในตอนนี้</p>
		</div>
	{:else}
		{#each activeGroups as groupKey}
			{@const groupTasks = (data.grouped as any)[groupKey]}
			{@const info = typeLabels[groupKey]}
			<section class="task-section">
				<div class="section-header">
					<div class="section-icon" style="background: {info.bg}; color: {info.color};">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d={info.icon} />
						</svg>
					</div>
					<h2 class="section-title">{info.label}</h2>
					<span class="section-count" style="background: {info.bg}; color: {info.color};">{groupTasks.length}</span>
				</div>

				<div class="task-list">
					{#each groupTasks as task}
						<a href="/procurement/{task.document_id}" class="task-card">
							<div class="task-step-badge" style="background: {info.bg}; color: {info.color};">
								ขั้นที่ {task.step_sequence}
							</div>
							<div class="task-info">
								<h3 class="task-name">{task.step_name}</h3>
								<p class="task-doc">{getDocTitle(task)}</p>
								<span class="task-time">{timeAgo(task.created_at)}</span>
							</div>
							<div class="task-action">
								<span class="action-label">{info.action}</span>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-arrow">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>

<style>
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin: 20px 0 24px; gap: 16px; }
	.page-title { margin: 0 0 4px 0; font-size: clamp(1.375rem, 1.1rem + 0.7vw, 1.625rem); font-weight: 700; color: oklch(0.2 0.02 180); }
	.page-subtitle { margin: 0; font-size: 0.875rem; color: oklch(0.5 0.02 180); display: flex; align-items: center; gap: 10px; }
	.item-count { padding: 2px 10px; border-radius: 6px; background: oklch(0.55 0.12 280 / 0.08); color: oklch(0.45 0.1 280); font-size: 0.75rem; font-weight: 600; }

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 64px 24px;
		background: oklch(0.98 0.005 180);
		border: 1px solid oklch(0.92 0.005 180);
		border-radius: 18px;
	}
	.empty-icon { width: 56px; height: 56px; margin: 0 auto 16px; color: oklch(0.54 0.16 150); }
	.empty-icon svg { width: 100%; height: 100%; }
	.empty-title { margin: 0 0 4px 0; font-size: 1.125rem; font-weight: 600; color: oklch(0.3 0.02 180); }
	.empty-desc { margin: 0; font-size: 0.875rem; color: oklch(0.55 0.02 180); }

	/* Sections */
	.task-section { margin-bottom: 28px; }
	.section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding: 0 4px; }
	.section-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.section-icon svg { width: 18px; height: 18px; }
	.section-title { margin: 0; font-size: 1rem; font-weight: 600; color: oklch(0.2 0.02 180); flex: 1; }
	.section-count { padding: 2px 8px; border-radius: 6px; font-size: 0.6875rem; font-weight: 700; flex-shrink: 0; }

	/* Task Cards */
	.task-list { display: flex; flex-direction: column; gap: 8px; }
	.task-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 20px;
		border-radius: 14px;
		border: 1px solid oklch(0.92 0.005 180);
		background: oklch(0.995 0.002 180);
		text-decoration: none;
		transition: box-shadow 0.15s ease, border-color 0.15s ease;
	}
	.task-card:hover {
		box-shadow: 0 4px 16px oklch(0.52 0.14 240 / 0.08);
		border-color: oklch(0.52 0.14 240 / 0.2);
	}

	.task-step-badge {
		padding: 4px 10px;
		border-radius: 8px;
		font-size: 0.6875rem;
		font-weight: 700;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.task-info { flex: 1; min-width: 0; }
	.task-name { margin: 0 0 2px 0; font-size: 0.9375rem; font-weight: 500; color: oklch(0.2 0.02 180); }
	.task-doc { margin: 0 0 2px 0; font-size: 0.8125rem; color: oklch(0.5 0.02 180); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.task-time { font-size: 0.6875rem; color: oklch(0.6 0.01 180); }

	.task-action {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	.task-card:hover .task-action { opacity: 1; }
	.action-label { font-size: 0.75rem; font-weight: 500; color: oklch(0.52 0.14 240); white-space: nowrap; }
	.action-arrow { width: 14px; height: 14px; color: oklch(0.52 0.14 240); }

	@media (max-width: 768px) {
		.task-action { opacity: 1; }
		.action-label { display: none; }
		.task-card { padding: 14px 16px; }
	}
</style>
