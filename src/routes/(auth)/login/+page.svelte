<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>เข้าสู่ระบบ | ProSync ERP</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 px-4">
	<div class="w-full max-w-md">
		<!-- Logo & Branding -->
		<div class="mb-8 text-center">
			<img src="/prosync-erp.png" alt="ProSync ERP" class="mx-auto mb-4 h-20 w-auto" />
			<h1 class="text-2xl font-bold tracking-tight text-gray-900">ProSync ERP</h1>
			<p class="mt-1.5 text-sm leading-relaxed text-gray-500">
				ระบบบริหารจัดการยุทธศาสตร์และติดตามแผนพัฒนาองค์การ
			</p>
		</div>

		<!-- Login Card -->
		<div class="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-xl shadow-gray-900/5">
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<div class="space-y-5">
					<div>
						<label for="id_card" class="mb-1.5 block text-sm font-medium text-gray-700">
							เลขบัตรประชาชน
						</label>
						<input
							type="text"
							id="id_card"
							name="id_card"
							maxlength="13"
							inputmode="numeric"
							placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
							autocomplete="username"
							class="block w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm
								transition-colors duration-150
								placeholder:text-gray-400
								hover:border-gray-400
								focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
							required
						/>
						{#if form?.errors?.id_card}
							<p class="mt-1.5 text-sm text-red-600">{form.errors.id_card[0]}</p>
						{/if}
					</div>

					<div>
						<label for="password" class="mb-1.5 block text-sm font-medium text-gray-700">
							รหัสผ่าน
						</label>
						<input
							type="password"
							id="password"
							name="password"
							placeholder="กรอกรหัสผ่าน"
							autocomplete="current-password"
							class="block w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-2.5 text-sm
								transition-colors duration-150
								placeholder:text-gray-400
								hover:border-gray-400
								focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="relative w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm
							transition-all duration-150
							hover:bg-blue-700 hover:shadow-md
							focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
							active:scale-[0.98]
							disabled:opacity-60 disabled:pointer-events-none"
					>
						{#if loading}
							<span class="inline-flex items-center gap-2">
								<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								กำลังเข้าสู่ระบบ...
							</span>
						{:else}
							เข้าสู่ระบบ
						{/if}
					</button>
				</div>
			</form>
		</div>

		<p class="mt-6 text-center text-xs text-gray-400">
			ProSync ERP v1.0
		</p>
	</div>
</div>
