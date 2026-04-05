<script lang="ts">
	let {
		totalItems,
		currentPage = $bindable(1),
		perPage = 20
	}: {
		totalItems: number;
		currentPage: number;
		perPage?: number;
	} = $props();

	let totalPages = $derived(Math.max(1, Math.ceil(totalItems / perPage)));

	let visiblePages = $derived.by(() => {
		const pages: number[] = [];
		const start = Math.max(1, currentPage - 1);
		const end = Math.min(totalPages, currentPage + 1);
		for (let i = start; i <= end; i++) pages.push(i);
		return pages;
	});

	function goTo(page: number) {
		if (page >= 1 && page <= totalPages) currentPage = page;
	}
</script>

{#if totalPages > 1}
	<div class="pg-wrap">
		<p class="pg-info">
			{Math.min((currentPage - 1) * perPage + 1, totalItems)}–{Math.min(currentPage * perPage, totalItems)}
			<span class="pg-info-muted">จาก {totalItems}</span>
		</p>

		<div class="pg-nav">
			<button
				onclick={() => goTo(currentPage - 1)}
				disabled={currentPage === 1}
				class="pg-arrow"
				aria-label="หน้าก่อน"
			>
				<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
			</button>

			{#if visiblePages[0] > 1}
				<button onclick={() => goTo(1)} class="pg-num">1</button>
				{#if visiblePages[0] > 2}
					<span class="pg-dots">...</span>
				{/if}
			{/if}

			{#each visiblePages as page}
				<button
					onclick={() => goTo(page)}
					class="pg-num"
					class:active={page === currentPage}
					aria-current={page === currentPage ? 'page' : undefined}
				>
					{page}
				</button>
			{/each}

			{#if visiblePages[visiblePages.length - 1] < totalPages}
				{#if visiblePages[visiblePages.length - 1] < totalPages - 1}
					<span class="pg-dots">...</span>
				{/if}
				<button onclick={() => goTo(totalPages)} class="pg-num">{totalPages}</button>
			{/if}

			<button
				onclick={() => goTo(currentPage + 1)}
				disabled={currentPage === totalPages}
				class="pg-arrow"
				aria-label="หน้าถัดไป"
			>
				<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
			</button>
		</div>
	</div>
{:else if totalItems > 0}
	<div class="pg-wrap">
		<p class="pg-info">
			ทั้งหมด <span class="pg-info-bold">{totalItems}</span> รายการ
		</p>
	</div>
{/if}

<style>
	.pg-wrap {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 16px;
		border-top: 1px solid oklch(0.92 0.008 180);
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
	}

	.pg-info {
		font-size: 0.8125rem;
		font-weight: 600;
		color: oklch(0.38 0.03 180);
		margin: 0;
		font-variant-numeric: tabular-nums;
	}
	.pg-info-muted {
		font-weight: 400;
		color: oklch(0.58 0.02 180);
	}
	.pg-info-bold {
		font-weight: 600;
		color: oklch(0.38 0.03 180);
	}

	.pg-nav {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.pg-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: oklch(0.50 0.03 180);
		cursor: pointer;
		transition: background 0.15s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.pg-arrow:hover:not(:disabled) {
		background: oklch(0.52 0.14 240 / 0.06);
		color: oklch(0.52 0.14 240);
	}
	.pg-arrow:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.pg-arrow svg {
		width: 16px;
		height: 16px;
	}

	.pg-num {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		height: 32px;
		padding: 0 6px;
		border: none;
		border-radius: 8px;
		background: transparent;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
		font-size: 0.8125rem;
		font-weight: 500;
		color: oklch(0.50 0.03 180);
		cursor: pointer;
		transition: background 0.15s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.pg-num:hover:not(.active) {
		background: oklch(0.52 0.14 240 / 0.06);
		color: oklch(0.42 0.12 240);
	}
	.pg-num.active {
		background: oklch(0.52 0.14 240);
		color: oklch(0.98 0.005 240);
		font-weight: 600;
		cursor: default;
		box-shadow: 0 1px 3px oklch(0.52 0.14 240 / 0.25);
	}

	.pg-dots {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 32px;
		font-size: 0.75rem;
		color: oklch(0.65 0.02 180);
		letter-spacing: 1px;
		user-select: none;
	}
</style>
