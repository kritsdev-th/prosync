<script lang="ts">
	import { page } from '$app/stores';
	import type { JWTPayload } from '$lib/types/auth';

	let { user, open }: { user: JWTPayload; open: boolean } = $props();

	const navItems = $derived(
		[
			{ href: '/dashboard', label: 'แดชบอร์ด', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', show: true },
			{ href: '/planning', label: 'แผนยุทธศาสตร์', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', show: user.is_super_admin || user.permissions.can_manage_plans },
			{ href: '/procurement', label: 'จัดซื้อจัดจ้าง', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z', show: user.is_super_admin || user.permissions.can_manage_procurement },
			{ href: '/finance', label: 'การเงินและเบิกจ่าย', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', show: user.is_super_admin || user.permissions.can_manage_finance },
			{ href: '/audit', label: 'ประวัติการเปลี่ยนแปลง', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', show: user.is_super_admin || user.permissions.can_view_audit_trail },
			{ href: '/admin', label: 'จัดการระบบ', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', show: user.is_super_admin || user.permissions.can_manage_users }
		].filter((item) => item.show)
	);
</script>

<aside
	class="flex w-64 flex-col border-r border-gray-200/80 bg-white shadow-sm transition-all duration-200 ease-out
		{open ? 'translate-x-0' : '-translate-x-full absolute z-40 h-full'}"
>
	<!-- Brand -->
	<div class="flex h-14 items-center gap-2.5 border-b border-gray-100 px-5">
		<img src="/prosync-erp.png" alt="ProSync ERP" class="h-8 w-auto" />
		<span class="text-base font-bold tracking-tight text-gray-900">ProSync ERP</span>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
		{#each navItems as item}
			{@const active = $page.url.pathname.startsWith(item.href)}
			<a
				href={item.href}
				class="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium
					transition-all duration-150 ease-out
					{active
						? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/5'
						: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
			>
				<svg
					class="h-[18px] w-[18px] shrink-0 transition-colors duration-150
						{active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.icon} />
				</svg>
				{item.label}
			</a>
		{/each}
	</nav>

	<!-- Footer -->
	<div class="border-t border-gray-100 px-4 py-3">
		<p class="text-[11px] text-gray-400">ProSync ERP v1.0</p>
	</div>
</aside>
