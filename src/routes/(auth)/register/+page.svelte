<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
</script>

<svelte:head>
	<title>ลงทะเบียน | ProSync ERP</title>
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
			<h1 class="text-2xl font-bold tracking-tight text-white mb-2">สร้างบัญชีใหม่</h1>
			<p class="text-sm leading-relaxed text-white/80 text-center mb-6">
				เข้าร่วมกับ ProSync ERP
			</p>

			<!-- Benefits -->
			<div class="space-y-2.5 w-full">
				<div class="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div class="text-left">
						<p class="text-xs font-semibold text-white">จัดการแผนยุทธศาสตร์</p>
						<p class="text-[10px] text-white/70">ติดตามและประเมินผล</p>
					</div>
				</div>
				<div class="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div class="text-left">
						<p class="text-xs font-semibold text-white">ระบบจัดซื้อจัดจ้าง</p>
						<p class="text-[10px] text-white/70">ครบวงจรตามมาตรฐาน</p>
					</div>
				</div>
				<div class="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/20">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div class="text-left">
						<p class="text-xs font-semibold text-white">การเงินและบัญชี</p>
						<p class="text-[10px] text-white/70">จัดการฎีกาและภาษี</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Section - Register Form -->
		<div class="flex w-full lg:w-1/2 flex-col justify-center bg-gradient-to-br from-slate-50 via-brand-50/20 to-health-50/20 p-8 md:p-10">
			<!-- Mobile Logo (visible only on small screens) -->
			<div class="mb-6 text-center lg:hidden">
				<div class="mx-auto mb-3 overflow-hidden rounded-xl bg-white p-3 shadow-lg">
					<img src="/prosync-erp.png" alt="ProSync ERP" class="h-10 w-auto object-contain" />
				</div>
				<h1 class="text-xl font-bold tracking-tight" style="color: oklch(0.38 0.040 180);">สร้างบัญชีใหม่</h1>
			</div>

			<!-- Welcome text -->
			<div class="mb-6">
				<h2 class="text-2xl font-bold" style="color: oklch(0.38 0.040 180);">สร้างบัญชีผู้ใช้ใหม่</h2>
				<p class="mt-1 text-sm" style="color: oklch(0.58 0.030 180);">กรุณากรอกข้อมูลให้ครบถ้วน</p>
			</div>

			<!-- Register Form -->
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
					<!-- Name Input -->
					<div>
						<label for="name" class="mb-1.5 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
							ชื่อ-สกุล <span class="text-red-500">*</span>
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
								<svg class="h-5 w-5" style="color: oklch(0.70 0.025 180);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
								</svg>
							</div>
							<input
								type="text"
								id="name"
								name="name"
								placeholder="กรอกชื่อ-นามสกุล"
								class="block w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-10 pr-4 py-2.5 text-sm
									transition-all duration-200 ease-out-quart
									placeholder:text-gray-400
									hover:border-gray-300 hover:bg-white
									focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
								required
							/>
						</div>
						{#if form?.errors?.name}
							<p class="mt-1.5 flex items-center gap-1.5 text-xs" style="color: oklch(0.58 0.18 25);">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{form.errors.name[0]}
							</p>
						{/if}
					</div>

					<!-- ID Card Input -->
					<div>
						<label for="id_card" class="mb-1.5 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
							เลขบัตรประชาชน <span class="text-red-500">*</span>
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

					<!-- Email Input -->
					<div>
						<label for="email" class="mb-1.5 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
							อีเมล
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
								<svg class="h-5 w-5" style="color: oklch(0.70 0.025 180);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
								</svg>
							</div>
							<input
								type="email"
								id="email"
								name="email"
								placeholder="example@email.com"
								class="block w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-10 pr-4 py-2.5 text-sm
									transition-all duration-200 ease-out-quart
									placeholder:text-gray-400
									hover:border-gray-300 hover:bg-white
									focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
							/>
						</div>
						{#if form?.errors?.email}
							<p class="mt-1.5 flex items-center gap-1.5 text-xs" style="color: oklch(0.58 0.18 25);">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{form.errors.email[0]}
							</p>
						{/if}
					</div>

					<!-- Position Inputs -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="position" class="mb-1.5 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
								ยศ/คำนำหน้า
							</label>
							<input
								type="text"
								id="position"
								name="position"
								placeholder="เช่น นาย, นาง"
								class="block w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm
									transition-all duration-200 ease-out-quart
									placeholder:text-gray-400
									hover:border-gray-300 hover:bg-white
									focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
							/>
						</div>
						<div>
							<label for="position_rank" class="mb-1.5 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
								ระดับตำแหน่ง
							</label>
							<input
								type="text"
								id="position_rank"
								name="position_rank"
								placeholder="เช่น เจ้าหน้าที่"
								class="block w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm
									transition-all duration-200 ease-out-quart
									placeholder:text-gray-400
									hover:border-gray-300 hover:bg-white
									focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
							/>
						</div>
					</div>

					<!-- Password Input -->
					<div>
						<label for="password" class="mb-1.5 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
							รหัสผ่าน <span class="text-red-500">*</span>
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
								placeholder="อย่างน้อย 6 ตัวอักษร"
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
						{#if form?.errors?.password}
							<p class="mt-1.5 flex items-center gap-1.5 text-xs" style="color: oklch(0.58 0.18 25);">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{form.errors.password[0]}
							</p>
						{/if}
					</div>

					<!-- Confirm Password Input -->
					<div>
						<label for="confirm_password" class="mb-1.5 block text-sm font-semibold" style="color: oklch(0.38 0.040 180);">
							ยืนยันรหัสผ่าน <span class="text-red-500">*</span>
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
								<svg class="h-5 w-5" style="color: oklch(0.70 0.025 180);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
							<input
								type={showConfirmPassword ? 'text' : 'password'}
								id="confirm_password"
								name="confirm_password"
								placeholder="กรอกรหัสผ่านอีกครั้ง"
								class="block w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-10 pr-12 py-2.5 text-sm
									transition-all duration-200 ease-out-quart
									placeholder:text-gray-400
									hover:border-gray-300 hover:bg-white
									focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
								required
							/>
							<button
								type="button"
								onclick={() => (showConfirmPassword = !showConfirmPassword)}
								class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors hover:bg-gray-100"
								style="color: oklch(0.70 0.025 180);"
							>
								{#if showConfirmPassword}
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
						{#if form?.errors?.confirm_password}
							<p class="mt-1.5 flex items-center gap-1.5 text-xs" style="color: oklch(0.58 0.18 25);">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{form.errors.confirm_password[0]}
							</p>
						{/if}
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
								กำลังลงทะเบียน...
							{:else}
								สร้างบัญชี
								<svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
								</svg>
							{/if}
						</span>
					</button>
				</div>
			</form>

			<!-- Login link -->
			<div class="mt-5 text-center">
				<p class="text-sm" style="color: oklch(0.58 0.030 180);">
					มีบัญชีอยู่แล้ว?
					<a href="/login" class="font-semibold transition-colors hover:underline" style="color: oklch(0.52 0.14 240);">
						เข้าสู่ระบบ
					</a>
				</p>
			</div>

			<!-- Terms info -->
			<div class="mt-4 rounded-xl bg-gradient-to-br from-brand-50 to-health-50 p-3.5">
				<div class="flex items-start gap-2.5">
					<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
						<svg class="h-3.5 w-3.5" style="color: oklch(0.52 0.14 240);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<p class="text-xs font-semibold" style="color: oklch(0.45 0.12 240);">ข้อกำหนดการใช้งาน</p>
						<p class="mt-0.5 text-xs leading-relaxed" style="color: oklch(0.58 0.030 180);">
							การลงทะเบียนถือว่าท่านยอมรับข้อกำหนดของเรา
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
