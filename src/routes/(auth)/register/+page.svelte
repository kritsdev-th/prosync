<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
	let showConfirm = $state(false);
</script>

<svelte:head>
	<title>ลงทะเบียน | ProSync ERP</title>
</svelte:head>

<div class="page">
	<div class="card">
		<!-- Left: illustration -->
		<div class="hero">
			<img src="/signup.gif" alt="" class="hero-gif" />
			<div class="hero-fade"></div>
			<div class="hero-bottom">
				<p class="hero-tagline">สร้างบัญชีเพื่อเข้าถึงระบบติดตาม<br/>แผนพัฒนา จัดซื้อจัดจ้าง และงบประมาณ</p>
			</div>
		</div>

		<!-- Right: form -->
		<div class="body">
			<div class="body-inner">
				<!-- Logo -->
				<div class="logo-row">
					<img src="/PROSYNC-ERP.png" alt="ProSync ERP" class="logo-img" />
				</div>

				<h1 class="title">สร้างบัญชีใหม่</h1>
				<p class="subtitle">กรอกข้อมูลเพื่อลงทะเบียนเข้าใช้งาน</p>

				<form
					method="POST"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => { loading = false; await update(); };
					}}
				>
					<fieldset disabled={loading} class="fields">
						<div class="field">
							<label for="name">ชื่อ-สกุล</label>
							<input id="name" name="name" type="text" placeholder="กรอกชื่อ-นามสกุล" required />
							{#if form?.errors?.name}
								<p class="err">{(form.errors as any).name[0]}</p>
							{/if}
						</div>

						<div class="field">
							<label for="id_card">เลขบัตรประชาชน</label>
							<input id="id_card" name="id_card" type="text" maxlength="13" inputmode="numeric" placeholder="เลข 13 หลัก" required />
							{#if form?.errors?.id_card}
								<p class="err">{(form.errors as any).id_card[0]}</p>
							{/if}
						</div>

						<div class="field">
							<label for="password">รหัสผ่าน</label>
							<div class="pw-wrap">
								<input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="อย่างน้อย 6 ตัวอักษร" required />
								<button type="button" class="eye" tabindex="-1" onclick={() => showPassword = !showPassword}>
									{#if showPassword}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
									{:else}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
									{/if}
								</button>
							</div>
							{#if form?.errors?.password}
								<p class="err">{(form.errors as any).password[0]}</p>
							{/if}
						</div>

						<div class="field">
							<label for="confirm_password">ยืนยันรหัสผ่าน</label>
							<div class="pw-wrap">
								<input id="confirm_password" name="confirm_password" type={showConfirm ? 'text' : 'password'} placeholder="กรอกรหัสผ่านอีกครั้ง" required />
								<button type="button" class="eye" tabindex="-1" onclick={() => showConfirm = !showConfirm}>
									{#if showConfirm}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
									{:else}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
									{/if}
								</button>
							</div>
							{#if form?.errors?.confirm_password}
								<p class="err">{(form.errors as any).confirm_password[0]}</p>
							{/if}
						</div>

						<button type="submit" class="btn-submit">
							{#if loading}
								<span class="spinner"></span>
								กำลังสร้างบัญชี...
							{:else}
								ลงทะเบียนใช้งาน
							{/if}
						</button>
					</fieldset>
				</form>

				<p class="switch">มีบัญชีอยู่แล้ว? <a href="/login">เข้าสู่ระบบ</a></p>
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		background: oklch(0.955 0.01 230);
		padding: clamp(8px, 4vw, 0px);
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
	}

	.card {
		display: grid;
		grid-template-columns: 1fr 1fr;
		width: 100%;
		max-width: 920px;
		min-height: 560px;
		border-radius: 24px;
		overflow: hidden;
		background: oklch(0.995 0.003 230);
		box-shadow:
			0 1px 2px oklch(0.2 0.02 230 / 0.06),
			0 8px 32px oklch(0.2 0.02 230 / 0.08);
		animation: rise 0.55s cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* ---------- hero (left) ---------- */
	.hero {
		position: relative;
		background: oklch(0.855 0.018 230);
		overflow: hidden;
	}
	.hero-gif {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 1;
	}
	.hero-fade {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to top,
			oklch(0.22 0.03 230 / 0.92) 0%,
			transparent 40%
		);
	}
	.hero-bottom {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 32px;
	}
	.hero-tagline {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.65;
		color: oklch(0.92 0.01 230);
	}

	/* ---------- body (right) ---------- */
	.body {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: clamp(28px, 4vw, 48px) clamp(24px, 4vw, 44px);
		padding-top: clamp(32px, 8vw, 104px);
		overflow-y: auto;
		position: relative;
	}
	.body-inner {
		width: 100%;
		max-width: 400px;
	}

	/* Logo */
	.logo-row {
		position: absolute;
		top: 20px;
		right: 24px;
	}
	.logo-img {
		height: 112px;
		width: auto;
		display: block;
	}

	.title {
		margin: 0 0 4px;
		font-size: clamp(1.35rem, 2.2vw, 1.625rem);
		font-weight: 700;
		color: oklch(0.2 0.025 165);
	}
	.subtitle {
		margin: 0 0 24px;
		font-size: 0.85rem;
		color: oklch(0.52 0.02 230);
	}

	/* ---------- fields ---------- */
	.fields {
		display: flex;
		flex-direction: column;
		gap: 16px;
		border: none;
		padding: 0;
		margin: 0;
	}

	.field { display: flex; flex-direction: column; gap: 6px; }
	.field label {
		font-size: 0.8rem;
		font-weight: 600;
		color: oklch(0.38 0.02 230);
	}
	.field input, .pw-wrap input {
		width: 100%;
		padding: 10px 14px;
		border: 1.5px solid oklch(0.88 0.012 230);
		border-radius: 10px;
		font-family: inherit;
		font-size: 0.875rem;
		color: oklch(0.18 0.02 230);
		background: oklch(0.985 0.004 230);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}
	.field input::placeholder, .pw-wrap input::placeholder {
		color: oklch(0.62 0.015 230);
	}
	.field input:focus, .pw-wrap input:focus {
		outline: none;
		border-color: oklch(0.46 0.14 165);
		box-shadow: 0 0 0 3px oklch(0.46 0.14 165 / 0.08);
	}

	.err {
		margin: 0;
		font-size: 0.75rem;
		color: oklch(0.52 0.18 25);
	}


	.pw-wrap { position: relative; }
	.pw-wrap input { padding-right: 38px; }
	.eye {
		position: absolute;
		right: 3px;
		top: 50%;
		transform: translateY(-50%);
		width: 32px;
		height: 32px;
		display: grid;
		place-items: center;
		border: none;
		background: none;
		cursor: pointer;
		color: oklch(0.56 0.02 230);
		border-radius: 8px;
	}
	.eye:hover { color: oklch(0.4 0.03 230); background: oklch(0.94 0.008 230); }
	.eye svg { width: 16px; height: 16px; }

	/* ---------- submit ---------- */
	.btn-submit {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		height: 44px;
		border: none;
		border-radius: 10px;
		background: oklch(0.44 0.14 240);
		color: oklch(0.97 0.005 165);
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		margin-top: 4px;
		transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
					box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
					background 0.15s ease;
		box-shadow: 0 2px 6px oklch(0.42 0.13 165 / 0.18);
	}
	.btn-submit:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 14px oklch(0.42 0.13 165 / 0.28);
		background: oklch(0.44 0.14 240);
	}
	.btn-submit:active:not(:disabled) { transform: translateY(0); }
	.btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

	.spinner {
		width: 16px; height: 16px;
		border: 2.5px solid oklch(0.97 0.005 165 / 0.3);
		border-top-color: oklch(0.97 0.005 165);
		border-radius: 50%;
		animation: spin 0.65s linear infinite;
	}

	/* ---------- switch ---------- */
	.switch {
		margin: 24px 0 0;
		text-align: center;
		font-size: 0.8rem;
		color: oklch(0.52 0.02 230);
	}
	.switch a {
		color: oklch(0.44 0.14 240);
		font-weight: 600;
		text-decoration: none;
	}
	.switch a:hover { text-decoration: underline; }

	@keyframes rise {
		from { opacity: 0; transform: translateY(12px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	@media (max-width: 720px) {
		.card { grid-template-columns: 1fr; max-width: 440px; }
		.hero { display: none; }
		.logo-row { position: static; display: flex; justify-content: center; margin-bottom: 16px; }
	}
</style>
