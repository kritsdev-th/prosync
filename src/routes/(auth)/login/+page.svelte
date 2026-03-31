<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
	let emailInput = $state('');
</script>

<svelte:head>
	<title>เข้าสู่ระบบ | ProSync ERP</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
	<!-- Animated background with hospital-healthy theme -->
	<div class="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-health-500"></div>
	
	<!-- Decorative background patterns -->
	<div class="absolute inset-0 opacity-30">
		<div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
		<div class="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
		<div class="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-health-400/10 blur-3xl"></div>
	</div>

	<!-- Grid pattern overlay -->
	<div class="absolute inset-0 opacity-[0.03]" 
		style="background-image: linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px); background-size: 40px 40px;">
	</div>

	<!-- Login Card -->
	<div class="relative w-full max-w-md animate-in">
		<!-- Logo & Branding -->
		<div class="mb-8 text-center slide-up">
			<div class="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
				<div class="absolute inset-0 rounded-2xl bg-white/20 backdrop-blur-sm"></div>
				<img 
					src="/prosync-erp.png" 
					alt="ProSync ERP" 
					class="relative h-12 w-auto object-contain transition-transform duration-500 hover:scale-105" 
				/>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-white md:text-3xl">ProSync ERP</h1>
			<p class="mt-3 text-sm leading-relaxed text-white/80">
				ระบบบริหารจัดการยุทธศาสตร์และติดตามแผนพัฒนาองค์การ
			</p>
		</div>

		<!-- Login Form Card -->
		<div class="slide-up-delay-1 overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
			style="box-shadow: 0 25px 50px -12px oklch(0.38 0.040 180 / 0.25);">
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
						<label for="id_card" class="mb-2 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
							เลขบัตรประชาชน
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
								<svg class="h-5 w-5" style="color: oklch(0.70 0.025 180);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
								</svg>
							</div>
							<input
								type="text"
								id="id_card"
								name="id_card"
								maxlength="13"
								inputmode="numeric"
								placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
								autocomplete="username"
								class="block w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-10 pr-4 py-3 text-sm
									transition-all duration-200 ease-out-quart
									placeholder:text-gray-400
									hover:border-gray-300 hover:bg-white
									focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
								required
							/>
						</div>
						{#if form?.errors?.id_card}
							<p class="mt-2 flex items-center gap-1.5 text-sm" style="color: oklch(0.58 0.18 25);">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{form.errors.id_card[0]}
							</p>
						{/if}
					</div>

					<div>
						<label for="password" class="mb-2 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
							รหัสผ่าน
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
								<svg class="h-5 w-5" style="color: oklch(0.70 0.025 180);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
							</div>
							<input
								type="password"
								id="password"
								name="password"
								placeholder="กรอกรหัสผ่าน"
								autocomplete="current-password"
								class="block w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-10 pr-4 py-3 text-sm
									transition-all duration-200 ease-out-quart
									placeholder:text-gray-400
									hover:border-gray-300 hover:bg-white
									focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
								required
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg
							transition-all duration-300 ease-out-expo
							hover:shadow-xl hover:shadow-brand-500/30 hover:scale-[1.02]
							focus:ring-4 focus:ring-brand-500/30 focus:outline-none
							active:scale-[0.98]
							disabled:opacity-70 disabled:pointer-events-none disabled:cursor-not-allowed"
					>
						<div class="absolute inset-0 bg-gradient-to-r from-brand-500 to-health-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
						<span class="relative inline-flex items-center justify-center gap-2">
							{#if loading}
								<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								กำลังเข้าสู่ระบบ...
							{:else}
								เข้าสู่ระบบ
								<svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
								</svg>
							{/if}
						</span>
					</button>
				</div>
			</form>

			<!-- Helpful info -->
			<div class="mt-6 rounded-xl bg-gradient-to-br from-brand-50 to-health-50 p-4">
				<div class="flex items-start gap-3">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
						<svg class="h-4 w-4" style="color: oklch(0.52 0.14 240);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<p class="text-xs font-semibold" style="color: oklch(0.45 0.12 240);">ต้องการความช่วยเหลือ?</p>
						<p class="mt-1 text-xs leading-relaxed" style="color: oklch(0.58 0.030 180);">
							ติดต่อผู้ดูแลระบบหากมีปัญหาในการเข้าสู่ระบบ
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<p class="mt-8 text-center text-xs text-white/60 slide-up-delay-2">
			ProSync ERP v1.0 &copy; {new Date().getFullYear()}
		</p>
	</div>
</div>
