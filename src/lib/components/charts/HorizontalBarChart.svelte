<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string;
		items: Array<{
			label: string;
			value: number;
			sublabel?: string;
			color?: string;
		}>;
		formatValue?: (value: number) => string;
	}

	let { title, subtitle, items, formatValue }: Props = $props();

	let maxValue = $derived(Math.max(...items.map((i) => i.value), 1));

	const defaultColors = [
		'oklch(0.52 0.14 240)',
		'oklch(0.54 0.16 150)',
		'oklch(0.62 0.18 60)',
		'oklch(0.58 0.2 25)',
		'oklch(0.55 0.12 280)'
	];

	function fmt(value: number): string {
		if (formatValue) return formatValue(value);
		return value.toLocaleString();
	}
</script>

<div class="hbar-card">
	<div class="hbar-header">
		<h3 class="hbar-title">{title}</h3>
		{#if subtitle}
			<p class="hbar-subtitle">{subtitle}</p>
		{/if}
	</div>

	<div class="hbar-list">
		{#each items as item, index (item.label)}
			{@const pct = (item.value / maxValue) * 100}
			{@const color = item.color ?? defaultColors[index % defaultColors.length]}
			<div class="hbar-item" style="animation-delay: {index * 0.06}s;">
				<div class="hbar-rank">{index + 1}</div>
				<div class="hbar-content">
					<div class="hbar-meta">
						<span class="hbar-label">{item.label}</span>
						{#if item.sublabel}
							<span class="hbar-sublabel">{item.sublabel}</span>
						{/if}
					</div>
					<div class="hbar-bar-row">
						<div class="hbar-track">
							<div
								class="hbar-fill"
								style="width: {pct}%; background: {color};"
							></div>
						</div>
						<span class="hbar-value" style="color: {color};">{fmt(item.value)}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.hbar-card {
		background: oklch(0.995 0.002 180);
		border: 1px solid oklch(0.9 0.005 180);
		border-radius: 16px;
		padding: 24px;
		animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.hbar-header {
		margin-bottom: 20px;
	}

	.hbar-title {
		font-size: clamp(1rem, 0.85rem + 0.4vw, 1.125rem);
		font-weight: 600;
		color: oklch(0.25 0.02 180);
		margin: 0 0 4px 0;
	}

	.hbar-subtitle {
		font-size: 0.8125rem;
		color: oklch(0.5 0.02 180);
		margin: 0;
	}

	.hbar-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.hbar-item {
		display: flex;
		gap: 14px;
		align-items: flex-start;
		animation: slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
	}

	.hbar-rank {
		width: 26px;
		height: 26px;
		border-radius: 8px;
		background: oklch(0.94 0.005 180);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: oklch(0.45 0.02 180);
		flex-shrink: 0;
		margin-top: 2px;
	}

	.hbar-content {
		flex: 1;
		min-width: 0;
	}

	.hbar-meta {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 6px;
		gap: 8px;
	}

	.hbar-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: oklch(0.3 0.02 180);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hbar-sublabel {
		font-size: 0.75rem;
		color: oklch(0.55 0.02 180);
		flex-shrink: 0;
	}

	.hbar-bar-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.hbar-track {
		flex: 1;
		height: 8px;
		background: oklch(0.94 0.005 180);
		border-radius: 4px;
		overflow: hidden;
	}

	.hbar-fill {
		height: 100%;
		border-radius: 4px;
		animation: grow-right 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
	}

	.hbar-value {
		font-size: 0.8125rem;
		font-weight: 700;
		flex-shrink: 0;
		min-width: 60px;
		text-align: right;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(-12px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes grow-right {
		from { width: 0 !important; opacity: 0; }
		to { opacity: 1; }
	}
</style>
