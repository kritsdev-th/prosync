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
		const start = Math.max(1, currentPage - 2);
		const end = Math.min(totalPages, currentPage + 2);
		for (let i = start; i <= end; i++) pages.push(i);
		return pages;
	});

	function goTo(page: number) {
		if (page >= 1 && page <= totalPages) currentPage = page;
	}
</script>

{#if totalPages > 1}
	<div class="flex items-center justify-between border-t bg-white/60 backdrop-blur-sm px-4 py-4"
		style="border-color: oklch(0.90 0.012 180 / 0.5);">
		<p class="text-sm" style="color: oklch(0.58 0.030 180);">
			แสดง <span class="font-semibold" style="color: oklch(0.38 0.040 180);">{Math.min((currentPage - 1) * perPage + 1, totalItems)}</span>–<span class="font-semibold" style="color: oklch(0.38 0.040 180);">{Math.min(currentPage * perPage, totalItems)}</span> จาก <span class="font-semibold" style="color: oklch(0.38 0.040 180);">{totalItems}</span> รายการ
		</p>
		<div class="flex items-center gap-1.5">
			<button
				onclick={() => goTo(currentPage - 1)}
				disabled={currentPage === 1}
				class="group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
				style="
					color: oklch(0.58 0.030 180);
					background-color: oklch(0.97 0.005 180);
				"
			>
				<svg class="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				<span class="hidden sm:inline">ก่อนหน้า</span>
			</button>

			{#if visiblePages[0] > 1}
				<button
					onclick={() => goTo(1)}
					class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
					style="
						color: oklch(0.58 0.030 180);
						background-color: oklch(0.97 0.005 180);
					"
				>
					1
				</button>
				{#if visiblePages[0] > 2}
					<span class="flex h-9 w-9 items-center justify-center text-sm" style="color: oklch(0.70 0.025 180);">...</span>
				{/if}
			{/if}

			{#each visiblePages as page}
				{#if page === currentPage}
					<button
						class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold shadow-sm transition-all duration-200"
						style="
							background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.54 0.16 150));
							color: white;
						"
					>
						{page}
					</button>
				{:else}
					<button
						onclick={() => goTo(page)}
						class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
						style="
							color: oklch(0.58 0.030 180);
							background-color: oklch(0.97 0.005 180);
						"
					>
						{page}
					</button>
				{/if}
			{/each}

			{#if visiblePages[visiblePages.length - 1] < totalPages}
				{#if visiblePages[visiblePages.length - 1] < totalPages - 1}
					<span class="flex h-9 w-9 items-center justify-center text-sm" style="color: oklch(0.70 0.025 180);">...</span>
				{/if}
				<button
					onclick={() => goTo(totalPages)}
					class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
					style="
						color: oklch(0.58 0.030 180);
						background-color: oklch(0.97 0.005 180);
					"
				>
					{totalPages}
				</button>
			{/if}

			<button
				onclick={() => goTo(currentPage + 1)}
				disabled={currentPage === totalPages}
				class="group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
				style="
					color: oklch(0.58 0.030 180);
					background-color: oklch(0.97 0.005 180);
				"
			>
				<span class="hidden sm:inline">ถัดไป</span>
				<svg class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>
{:else if totalItems > 0}
	<div class="border-t bg-white/60 backdrop-blur-sm px-4 py-4"
		style="border-color: oklch(0.90 0.012 180 / 0.5);">
		<p class="text-sm" style="color: oklch(0.58 0.030 180);">
			ทั้งหมด <span class="font-semibold" style="color: oklch(0.38 0.040 180);">{totalItems}</span> รายการ
		</p>
	</div>
{/if}
