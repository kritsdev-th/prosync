<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomSelect from '$lib/components/CustomSelect.svelte';

	let { data, form: formResult } = $props();
	let errors = $derived((formResult?.errors ?? {}) as Record<string, string[]>);
</script>

<div class="flex min-h-[80vh] items-center justify-center">
	<div class="w-full" style="max-width: 28rem">
		<div class="rounded-xl p-6" style="background: white; border: 1px solid var(--color-slate-100); box-shadow: var(--shadow-md)">
			<!-- Header -->
			<div class="text-center">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style="background: var(--color-brand-100)">
					<svg class="h-6 w-6" style="color: var(--color-brand-600)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</div>
				<h1 class="mt-3 text-lg font-bold" style="color: var(--color-slate-900)">กรอกข้อมูลส่วนตัว</h1>
				<p class="mt-1 text-[0.8125rem]" style="color: var(--color-slate-500)">กรุณากรอกข้อมูลเพิ่มเติมเพื่อใช้งานระบบ</p>
			</div>

			<!-- User Info (read-only) -->
			<div class="mt-5 rounded-lg p-3" style="background: var(--color-slate-50)">
				<div class="flex justify-between text-sm">
					<span style="color: var(--color-slate-500)">ชื่อ-สกุล</span>
					<span class="font-medium" style="color: var(--color-slate-800)">{data.user.name}</span>
				</div>
				<div class="mt-1 flex justify-between text-sm">
					<span style="color: var(--color-slate-500)">เลขบัตรประชาชน</span>
					<span class="font-medium tabular-nums" style="color: var(--color-slate-800)">{data.user.id_card}</span>
				</div>
			</div>

			<!-- Form -->
			<form method="POST" use:enhance class="mt-5 space-y-4">
				<div>
					<label for="position" class="block text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">
						ยศ/คำนำหน้า <span style="color: var(--color-error)">*</span>
					</label>
					<input id="position" name="position" required placeholder="เช่น นพ., พญ., นาย, นาง"
						class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
						style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
					{#if errors.position}
						<p class="mt-1 text-[0.75rem]" style="color: var(--color-error)">{errors.position[0]}</p>
					{/if}
				</div>

				<div>
					<label for="position_rank" class="block text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">
						ระดับตำแหน่ง <span style="color: var(--color-error)">*</span>
					</label>
					<input id="position_rank" name="position_rank" required placeholder="เช่น แพทย์ชำนาญการ, พยาบาลวิชาชีพชำนาญการ"
						class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
						style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
					{#if errors.position_rank}
						<p class="mt-1 text-[0.75rem]" style="color: var(--color-error)">{errors.position_rank[0]}</p>
					{/if}
				</div>

				<div>
					<label for="agency_id" class="block text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">
						สังกัดหน่วยงาน <span style="color: var(--color-error)">*</span>
					</label>
					<CustomSelect
						options={data.agencies.map((agency: any) => ({ value: String(agency.id), label: agency.name }))}
						name="agency_id"
						id="agency_id"
						required={true}
						placeholder="-- เลือกหน่วยงาน --"
						class="mt-1 w-full"
					/>
					{#if errors.agency_id}
						<p class="mt-1 text-[0.75rem]" style="color: var(--color-error)">{errors.agency_id[0]}</p>
					{/if}
				</div>

				<div>
					<label for="phone" class="block text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">
						เบอร์โทรศัพท์ <span style="color: var(--color-error)">*</span>
					</label>
					<input id="phone" name="phone" type="tel" required placeholder="เช่น 081-234-5678"
						class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none tabular-nums"
						style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
					{#if errors.phone}
						<p class="mt-1 text-[0.75rem]" style="color: var(--color-error)">{errors.phone[0]}</p>
					{/if}
				</div>

				<div>
					<label for="email" class="block text-[0.8125rem] font-medium" style="color: var(--color-slate-700)">
						อีเมล <span class="text-[0.75rem] font-normal" style="color: var(--color-slate-400)">(ไม่บังคับ)</span>
					</label>
					<input id="email" name="email" type="email" placeholder="เช่น somchai@hospital.go.th"
						class="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
						style="border: 1px solid var(--color-slate-200); color: var(--color-slate-900); background: white" />
					{#if errors.email}
						<p class="mt-1 text-[0.75rem]" style="color: var(--color-error)">{errors.email[0]}</p>
					{/if}
				</div>

				<button type="submit"
					class="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all duration-200"
					style="background: var(--color-brand-600)"
					onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-700)'; }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-600)'; }}>
					บันทึกข้อมูล
				</button>
			</form>
		</div>
	</div>
</div>
