<script lang="ts">
	import type { LayoutData } from './$types';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { data, children } = $props();
	let sidebarOpen = $state(true);
</script>

<div class="flex h-screen bg-gray-50/80">
	<Sidebar user={data.user} open={sidebarOpen} />

	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Top Navbar -->
		<header class="flex h-14 items-center justify-between border-b border-gray-200/80 bg-white px-6 shadow-sm shadow-gray-900/5">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="rounded-lg p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
				aria-label="เปิด/ปิดเมนูด้านข้าง"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
						{data.user.name.charAt(0)}
					</div>
					<div class="flex flex-col">
						<span class="text-sm font-medium leading-tight text-gray-700">{data.user.name}</span>
						{#if data.user.is_super_admin}
							<span class="text-[10px] font-medium leading-tight text-red-600">Super Admin</span>
						{/if}
					</div>
				</div>
				<div class="h-5 w-px bg-gray-200"></div>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
					>
						ออกจากระบบ
					</button>
				</form>
			</div>
		</header>

		<!-- Main content -->
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>
