<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>เข้าสู่ระบบ | ProSync ERP</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 via-brand-500 to-health-500 px-4 py-12">
	<!-- Animated background patterns -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
		<div class="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
		<div class="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-health-400/10 blur-3xl"></div>
	</div>

	<!-- Grid pattern overlay -->
	<div class="absolute inset-0 opacity-[0.03]" 
		style="background-image: linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px); background-size: 40px 40px;">
	</div>

	<!-- Main Card -->
	<div class="relative z-10 flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in slide-up"
		style="box-shadow: 0 25px 50px -12px oklch(0.58 0.030 180 / 0.25);">
		
		<!-- Left Section - Branding -->
		<div class="hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-brand-600/90 via-brand-500/90 to-health-500/90 p-8 lg:flex">
			<!-- Logo -->
			<div class="mb-6 overflow-hidden rounded-2xl bg-white/95 p-6 shadow-xl">
				<img src="/prosync-erp.png" alt="ProSync ERP" class="h-16 w-auto object-contain" />
			</div>

			<!-- Brand name -->
			<h1 class="text-2xl font-bold tracking-tight text-white mb-2">ProSync ERP</h1>
			<p class="text-sm leading-relaxed text-white/80 text-center mb-6">
				ระบบบริหารจัดการยุทธศาสตร์และติดตามแผนพัฒนาองค์การ
			</p>

			<!-- Feature highlights -->
			<div class="grid w-full grid-cols-2 gap-3">
				<div class="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
						</svg>
					</div>
					<span class="text-xs font-medium text-white/90">มาตรฐาน ISO</span>
				</div>
				<div class="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
						</svg>
					</div>
					<span class="text-xs font-medium text-white/90">ปลอดภัยสูง</span>
				</div>
				<div class="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
						</svg>
					</div>
					<span class="text-xs font-medium text-white/90">รวดเร็ว</span>
				</div>
				<div class="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.941 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
						</svg>
					</div>
					<span class="text-xs font-medium text-white/90">ใช้งานง่าย</span>
				</div>
			</div>
		</div>

		<!-- Right Section - Login Form -->
		<div class="flex w-full lg:w-1/2 flex-col justify-center bg-gradient-to-br from-slate-50 via-brand-50/20 to-health-50/20 p-8 md:p-10">
			<!-- Mobile Logo (visible only on small screens) -->
			<div class="mb-6 text-center lg:hidden">
				<div class="mx-auto mb-3 overflow-hidden rounded-xl bg-white p-3 shadow-lg">
					<img src="/prosync-erp.png" alt="ProSync ERP" class="h-10 w-auto object-contain" />
				</div>
				<h1 class="text-xl font-bold tracking-tight" style="color: oklch(0.38 0.040 180);">ProSync ERP</h1>
			</div>

			<!-- Welcome text -->
			<div class="mb-6">
				<h2 class="text-2xl font-bold" style="color: oklch(0.38 0.040 180);">ยินดีต้อนรับกลับ</h2>
				<p class="mt-1 text-sm" style="color: oklch(0.58 0.030 180);">กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>
			</div>

			<!-- Login Form -->
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
				<div class="space-y-4">
					<!-- ID Card Input -->
					<div>
						<label for="id_card" class="mb-1.5 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
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
								class="block w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-10 pr-4 py-2.5 text-sm
									transition-all duration-200 ease-out-quart
									placeholder:text-gray-400
									hover:border-gray-300 hover:bg-white
									focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
								required
							/>
						</div>
						{#if form?.errors?.id_card}
							<p class="mt-1.5 flex items-center gap-1.5 text-xs" style="color: oklch(0.58 0.18 25);">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{form.errors.id_card[0]}
							</p>
						{/if}
					</div>

					<!-- Password Input -->
					<div>
						<label for="password" class="mb-1.5 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
							รหัสผ่าน
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
								<svg class="h-5 w-5" style="color: oklch(0.70 0.025 180);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
								</svg>
							</div>
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								name="password"
								placeholder="กรอกรหัสผ่าน"
								autocomplete="current-password"
								class="block w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-10 pr-12 py-2.5 text-sm
									transition-all duration-200 ease-out-quart
									placeholder:text-gray-400
									hover:border-gray-300 hover:bg-white
									focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
								required
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors hover:bg-gray-100"
								style="color: oklch(0.70 0.025 180);"
							>
								{#if showPassword}
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
									</svg>
								{:else}
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={loading}
						class="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg
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

			<!-- Register link -->
			<div class="mt-6 text-center">
				<p class="text-sm" style="color: oklch(0.58 0.030 180);">
					ยังไม่มีบัญชี?
					<a href="/register" class="font-semibold transition-colors hover:underline" style="color: oklch(0.52 0.14 240);">
						ลงทะเบียนใช้งาน
					</a>
				</p>
			</div>

			<!-- Help info -->
			<div class="mt-5 rounded-xl bg-gradient-to-br from-brand-50 to-health-50 p-3.5">
				<div class="flex items-start gap-2.5">
					<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
						<svg class="h-3.5 w-3.5" style="color: oklch(0.52 0.14 240);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<p class="text-xs font-semibold" style="color: oklch(0.45 0.12 240);">ต้องการความช่วยเหลือ?</p>
						<p class="mt-0.5 text-xs leading-relaxed" style="color: oklch(0.58 0.030 180);">
							ติดต่อผู้ดูแลระบบหากมีปัญหาในการเข้าสู่ระบบ
						</p>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<p class="mt-6 text-center text-xs" style="color: oklch(0.58 0.030 180);">
				ProSync ERP v1.0 &copy; {new Date().getFullYear()}
			</p>
		</div>
	</div>
</div>
