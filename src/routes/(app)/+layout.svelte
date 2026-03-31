<script lang="ts">
	import type { LayoutData } from './$types';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { data, children } = $props();
	let sidebarOpen = $state(true);
</script>

<div class="flex h-screen bg-gradient-to-br from-slate-50 via-brand-50/30 to-health-50/20">
	<Sidebar user={data.user} open={sidebarOpen} />

	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Top Navbar -->
		<header class="flex h-16 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md transition-all duration-200"
			style="border-color: oklch(0.90 0.012 180 / 0.5); box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.06);"
		>
			<div class="flex items-center gap-4">
				<button
					onclick={() => (sidebarOpen = !sidebarOpen)}
					class="group relative -ml-2 rounded-xl p-2 transition-all duration-200 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
					aria-label="เปิด/ปิดเมนูด้านข้าง"
				>
					<div class="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-brand-100 to-health-100 opacity-0 transition-opacity duration-200 group-hover:opacity-60"></div>
					<svg class="h-5 w-5 transition-colors duration-200" style="color: oklch(0.58 0.030 180);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>

				<!-- Breadcrumb hint -->
				<div class="hidden items-center gap-2 text-sm md:flex">
					<span style="color: oklch(0.70 0.025 180);">ระบบ</span>
					<svg class="h-4 w-4" style="color: oklch(0.84 0.018 180);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<!-- User info with avatar -->
				<div class="group flex items-center gap-2.5 rounded-xl bg-white/60 px-3 py-1.5 transition-all duration-200 hover:bg-white hover:shadow-md"
					style="box-shadow: 0 1px 2px 0 oklch(0.58 0.030 180 / 0.04);"
				>
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-health-500 text-xs font-semibold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
						{data.user.name.charAt(0)}
					</div>
					<div class="flex flex-col">
						<span class="text-sm font-medium leading-tight" style="color: oklch(0.38 0.040 180);">{data.user.name}</span>
						{#if data.user.is_super_admin}
							<span class="text-[9px] font-medium leading-tight" style="color: oklch(0.54 0.16 150);">Administrator</span>
						{/if}
					</div>
				</div>
				
				<div class="h-6 w-px" style="background-color: oklch(0.90 0.012 180 / 0.8);"></div>
				
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
						style="color: oklch(0.58 0.030 180);"
					>
						<svg class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
						</svg>
						<span class="hidden sm:inline">ออกจากระบบ</span>
					</button>
				</form>
			</div>
		</header>

		<!-- Main content -->
		<main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
			<div class="mx-auto max-w-7xl animate-in">
				{@render children()}
			</div>
		</main>
	</div>
</div>
