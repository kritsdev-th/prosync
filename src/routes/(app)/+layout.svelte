<script lang="ts">
	import type { LayoutData } from './$types';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { data, children } = $props();
	let sidebarOpen = $state(true);
</script>

<div class="flex h-screen bg-gray-100">
	<Sidebar user={data.user} open={sidebarOpen} />

	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Top Navbar -->
		<header class="flex h-14 items-center justify-between border-b bg-white px-6 shadow-sm">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			<div class="flex items-center gap-3">
				<span class="text-sm text-gray-700">{data.user.name}</span>
				{#if data.user.is_super_admin}
					<span
						class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
					>
						Super Admin
					</span>
				{/if}
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
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
