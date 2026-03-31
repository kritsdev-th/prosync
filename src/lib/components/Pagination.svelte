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
	<div class="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
		<p class="text-sm text-gray-600">
			แสดง {Math.min((currentPage - 1) * perPage + 1, totalItems)}–{Math.min(currentPage * perPage, totalItems)} จาก {totalItems} รายการ
		</p>
		<div class="flex items-center gap-1">
			<button
				onclick={() => goTo(currentPage - 1)}
				disabled={currentPage === 1}
				class="rounded-md border px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				ก่อนหน้า
			</button>

			{#if visiblePages[0] > 1}
				<button onclick={() => goTo(1)} class="rounded-md px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100">1</button>
				{#if visiblePages[0] > 2}
					<span class="px-1 text-gray-400">...</span>
				{/if}
			{/if}

			{#each visiblePages as page}
				<button
					onclick={() => goTo(page)}
					class="rounded-md px-2.5 py-1.5 text-sm font-medium {page === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}"
				>
					{page}
				</button>
			{/each}

			{#if visiblePages[visiblePages.length - 1] < totalPages}
				{#if visiblePages[visiblePages.length - 1] < totalPages - 1}
					<span class="px-1 text-gray-400">...</span>
				{/if}
				<button onclick={() => goTo(totalPages)} class="rounded-md px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100">{totalPages}</button>
			{/if}

			<button
				onclick={() => goTo(currentPage + 1)}
				disabled={currentPage === totalPages}
				class="rounded-md border px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				ถัดไป
			</button>
		</div>
	</div>
{:else if totalItems > 0}
	<div class="border-t bg-gray-50 px-4 py-3">
		<p class="text-sm text-gray-600">ทั้งหมด {totalItems} รายการ</p>
	</div>
{/if}
