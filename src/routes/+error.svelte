<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} | ProSync ERP</title>
</svelte:head>

<div class="error-page">
	<div class="error-content">
		<!-- Decorative background -->
		<div class="error-bg-circle c1"></div>
		<div class="error-bg-circle c2"></div>

		<!-- Status code -->
		<div class="error-code">{$page.status}</div>

		<!-- Message -->
		<h1 class="error-title">
			{#if $page.status === 404}
				ไม่พบหน้าที่ค้นหา
			{:else if $page.status === 403}
				ไม่มีสิทธิ์เข้าถึง
			{:else if $page.status === 500}
				เกิดข้อผิดพลาดภายในระบบ
			{:else}
				เกิดข้อผิดพลาด
			{/if}
		</h1>

		<p class="error-desc">
			{#if $page.status === 404}
				หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่
			{:else if $page.status === 403}
				คุณไม่มีสิทธิ์เพียงพอในการเข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ
			{:else if $page.status === 500}
				ระบบเกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
			{:else}
				{$page.error?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'}
			{/if}
		</p>

		<!-- Actions -->
		<div class="error-actions">
			<a href="/dashboard" class="error-btn primary">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
				</svg>
				กลับหน้าหลัก
			</a>
			<button onclick={() => history.back()} class="error-btn ghost">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
				</svg>
				ย้อนกลับ
			</button>
		</div>

		<!-- Branding -->
		<div class="error-footer">
			<img src="/prosync-erp.png" alt="ProSync ERP" class="error-logo" />
			<span>ProSync ERP</span>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(160deg, oklch(0.97 0.01 240 / 0.5), oklch(0.98 0.008 150 / 0.3), oklch(0.96 0.005 180));
		padding: clamp(24px, 4vw, 48px);
		position: relative;
		overflow: hidden;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
	}

	.error-content {
		position: relative;
		z-index: 1;
		text-align: center;
		max-width: 520px;
		animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.error-bg-circle {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
	}
	.error-bg-circle.c1 {
		width: 400px;
		height: 400px;
		top: -100px;
		right: -150px;
		background: oklch(0.52 0.14 240 / 0.04);
	}
	.error-bg-circle.c2 {
		width: 300px;
		height: 300px;
		bottom: -80px;
		left: -120px;
		background: oklch(0.54 0.16 150 / 0.04);
	}

	.error-code {
		font-size: clamp(4.5rem, 10vw, 7rem);
		font-weight: 800;
		letter-spacing: -0.04em;
		background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.54 0.16 150));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1;
		margin-bottom: 12px;
	}

	.error-title {
		font-size: clamp(1.25rem, 2vw, 1.625rem);
		font-weight: 700;
		color: oklch(0.2 0.02 180);
		margin: 0 0 12px 0;
		letter-spacing: -0.01em;
	}

	.error-desc {
		font-size: clamp(0.875rem, 1.2vw, 1rem);
		color: oklch(0.5 0.02 180);
		margin: 0 0 32px 0;
		line-height: 1.6;
	}

	.error-actions {
		display: flex;
		gap: 12px;
		justify-content: center;
		margin-bottom: 40px;
	}

	.error-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		border: none;
		cursor: pointer;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
	}
	.error-btn:hover {
		transform: translateY(-2px);
	}

	.error-btn.primary {
		background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.48 0.12 240));
		color: oklch(0.98 0.005 180);
		box-shadow: 0 4px 12px oklch(0.52 0.14 240 / 0.2);
	}
	.error-btn.primary:hover {
		box-shadow: 0 6px 20px oklch(0.52 0.14 240 / 0.3);
	}

	.error-btn.ghost {
		background: oklch(0.98 0.005 180);
		color: oklch(0.4 0.02 180);
		border: 1px solid oklch(0.88 0.01 180);
	}
	.error-btn.ghost:hover {
		box-shadow: 0 4px 12px oklch(0.5 0.02 180 / 0.08);
	}

	.btn-icon {
		width: 16px;
		height: 16px;
	}

	.error-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		opacity: 0.4;
	}
	.error-logo {
		height: 20px;
		width: auto;
	}
	.error-footer span {
		font-size: 0.75rem;
		font-weight: 600;
		color: oklch(0.4 0.02 180);
	}

	@keyframes fade-up {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
