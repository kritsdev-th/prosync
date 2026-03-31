<script lang="ts">
	import type { PageData } from './$types';
	let { data } = $props();

	const sections = [
		{
			title: 'จัดการผู้ใช้งาน',
			description: 'ค้นหา เพิ่ม แก้ไข ลบ ผู้ใช้งาน และจัดการสิทธิ์',
			href: '/admin/users',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
		},
		{
			title: 'โครงสร้างองค์กร',
			description: 'จัดการแผนก หน่วยงาน และโครงสร้าง Tree',
			href: '/admin/org-structure',
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
		},
		{
			title: 'จัดการบทบาทและสิทธิ์',
			description: 'สร้าง แก้ไข บทบาท และกำหนดสิทธิ์ JSONB',
			href: '/admin/roles',
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
		},
		{
			title: 'จัดการจังหวัด',
			description: 'เพิ่ม แก้ไข ลบ จังหวัด',
			href: '/admin/provinces',
			icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
		},
		{
			title: 'จัดการหน่วยงาน',
			description: 'เพิ่ม แก้ไข ลบ หน่วยงาน (Tenant)',
			href: '/admin/agencies',
			icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z'
		},
		{
			title: 'ราคากลาง',
			description: 'จัดการราคากลางแยกตามจังหวัด',
			href: '/admin/median-prices',
			icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'
		}
	];
</script>

<div>
	<h1 class="text-2xl font-bold text-gray-900">จัดการระบบ</h1>
	<p class="mt-1 text-sm text-gray-500">เฉพาะ Super Admin เท่านั้น</p>

	<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each sections as section}
			<a
				href={section.href}
				class="group rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-blue-50 p-2">
						<svg
							class="h-6 w-6 text-blue-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d={section.icon}
							/>
						</svg>
					</div>
					<h3 class="font-semibold text-gray-900 group-hover:text-blue-600">{section.title}</h3>
				</div>
				<p class="mt-2 text-sm text-gray-500">{section.description}</p>
			</a>
		{/each}
	</div>
</div>
