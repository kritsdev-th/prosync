<script lang="ts">
	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		trend?: {
			value: number;
			label: string;
			positive?: boolean;
		};
		icon?: any;
		color?: string;
	}

	let { title, value, subtitle, trend, icon: Icon, color = 'oklch(0.52 0.14 240)' }: Props = $props();
</script>

<div class="kpi-card">
	<div class="kpi-header">
		{#if Icon}
			<div class="kpi-icon" style="background: {color}15;">
				<svelte:component this={Icon} style="color: {color};" />
			</div>
		{/if}
		<div class="kpi-title-group">
			<h3 class="kpi-title">{title}</h3>
			{#if subtitle}
				<p class="kpi-subtitle">{subtitle}</p>
			{/if}
		</div>
	</div>

	<div class="kpi-body">
		<div class="kpi-value" style="color: {color};">{value}</div>
		{#if trend}
			<div class="kpi-trend {trend.positive !== false ? 'positive' : 'negative'}">
				{#if trend.positive !== false}
					<svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M7 17l5-5 5 5M7 7l5 5 5-5" />
					</svg>
				{:else}
					<svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M7 7l5 5 5-5M7 17l5-5 5 5" />
					</svg>
				{/if}
				<span>{trend.value}% {trend.label}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.kpi-card {
		background: oklch(1 0 0);
		border: 1px solid oklch(0.9 0.005 180);
		border-radius: 16px;
		padding: 20px;
		animation: slide-up 0.5s ease-out-expo;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.kpi-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px oklch(0.52 0.14 240 / 0.08);
	}

	.kpi-header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 16px;
	}

	.kpi-icon {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.kpi-icon :global(svg) {
		width: 20px;
		height: 20px;
	}

	.kpi-title-group {
		flex: 1;
	}

	.kpi-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: oklch(0.5 0.02 180);
		margin: 0 0 2px 0;
	}

	.kpi-subtitle {
		font-size: 0.6875rem;
		color: oklch(0.6 0.015 180);
		margin: 0;
	}

	.kpi-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.kpi-value {
		font-size: clamp(1.75rem, 1.5rem + 0.6vw, 2.25rem);
		font-weight: 700;
		line-height: 1;
	}

	.kpi-trend {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.kpi-trend.positive {
		color: oklch(0.54 0.16 150);
	}

	.kpi-trend.negative {
		color: oklch(0.58 0.2 25);
	}

	.trend-icon {
		width: 14px;
		height: 14px;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
