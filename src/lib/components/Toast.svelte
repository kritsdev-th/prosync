<script lang="ts">
	import { getToasts, type ToastType } from '$lib/stores/toast.svelte';

	let toasts = $derived(getToasts());

	function getIcon(type: ToastType): string {
		switch (type) {
			case 'success': return 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'error': return 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'warning': return 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z';
			case 'info': return 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z';
		}
	}

	function getStyles(type: ToastType) {
		switch (type) {
			case 'success': return {
				bg: 'oklch(0.98 0.02 150)',
				border: 'oklch(0.82 0.1 150)',
				icon: 'oklch(0.48 0.16 150)',
				text: 'oklch(0.30 0.08 150)',
				bar: 'oklch(0.54 0.16 150)'
			};
			case 'error': return {
				bg: 'oklch(0.97 0.02 25)',
				border: 'oklch(0.80 0.12 25)',
				icon: 'oklch(0.52 0.2 25)',
				text: 'oklch(0.35 0.1 25)',
				bar: 'oklch(0.58 0.2 25)'
			};
			case 'warning': return {
				bg: 'oklch(0.98 0.03 80)',
				border: 'oklch(0.84 0.12 80)',
				icon: 'oklch(0.55 0.16 60)',
				text: 'oklch(0.35 0.08 60)',
				bar: 'oklch(0.62 0.18 60)'
			};
			case 'info': return {
				bg: 'oklch(0.97 0.02 240)',
				border: 'oklch(0.84 0.08 240)',
				icon: 'oklch(0.52 0.14 240)',
				text: 'oklch(0.30 0.06 240)',
				bar: 'oklch(0.52 0.14 240)'
			};
		}
	}
</script>

{#if toasts.length > 0}
	<div class="toast-container">
		{#each toasts as toast (toast.id)}
			{@const s = getStyles(toast.type)}
			<div
				class="toast-item"
				style="background: {s.bg}; border: 1px solid {s.border}; --bar-color: {s.bar};"
			>
				<div class="toast-icon" style="color: {s.icon};">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d={getIcon(toast.type)} />
					</svg>
				</div>
				<p class="toast-message" style="color: {s.text};">{toast.message}</p>
				<div class="toast-progress"></div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		top: 24px;
		right: 24px;
		z-index: 99999;
		display: flex;
		flex-direction: column;
		gap: 10px;
		pointer-events: none;
	}

	.toast-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 20px;
		border-radius: 14px;
		box-shadow:
			0 8px 24px oklch(0.15 0.02 180 / 0.1),
			0 2px 6px oklch(0.15 0.02 180 / 0.06);
		min-width: 320px;
		max-width: 440px;
		pointer-events: auto;
		animation: toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(8px);
	}

	.toast-icon {
		flex-shrink: 0;
		width: 22px;
		height: 22px;
	}
	.toast-icon svg {
		width: 100%;
		height: 100%;
	}

	.toast-message {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1.4;
		font-family: 'Noto Sans Thai', sans-serif;
	}

	.toast-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		background: var(--bar-color);
		border-radius: 0 0 14px 14px;
		animation: toast-progress 3s linear forwards;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateX(60px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
	}

	@keyframes toast-progress {
		from { width: 100%; }
		to { width: 0%; }
	}

	@media (max-width: 480px) {
		.toast-container {
			right: 12px;
			left: 12px;
		}
		.toast-item {
			min-width: 0;
			max-width: none;
		}
	}
</style>
