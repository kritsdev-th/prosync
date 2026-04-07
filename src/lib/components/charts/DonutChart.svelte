<script lang="ts">
	import type { ChartData } from '$lib/types/dashboard';

	interface Props {
		data: ChartData[];
		title: string;
		subtitle?: string;
		total?: number;
	}

	let { data, title, subtitle, total }: Props = $props();

	let displayTotal = $derived(total ?? data.reduce((sum, item) => sum + item.value, 0));

	const colors = [
		'oklch(0.52 0.14 240)',
		'oklch(0.54 0.16 150)',
		'oklch(0.62 0.18 60)',
		'oklch(0.58 0.2 25)',
		'oklch(0.55 0.12 280)',
		'oklch(0.5 0.14 200)'
	];
</script>

<div class="donut-chart-card">
	<div class="chart-header">
		<div>
			<h3 class="chart-title">{title}</h3>
			{#if subtitle}
				<p class="chart-subtitle">{subtitle}</p>
			{/if}
		</div>
		<div class="chart-total">
			<span class="total-value">{displayTotal.toLocaleString()}</span>
			<span class="total-label">รวมทั้งหมด</span>
		</div>
	</div>

	<div class="chart-content">
		<div class="donut-container">
			<svg class="donut-svg" viewBox="0 0 160 160">
				{#snippet circleContent()}
					{@const circumference = 2 * Math.PI * 50}
					{@const totalValue = data.reduce((sum, item) => sum + item.value, 0)}
					{#each data as item, index (item.label)}
						{@const percentage = item.value / totalValue}
						{@const arcLength = percentage * circumference}
						{@const offset = data.slice(0, index).reduce((sum, d) => sum + (d.value / totalValue) * circumference, 0)}
						<circle
							class="donut-segment"
							cx="80"
							cy="80"
							r="50"
							fill="none"
							stroke={item.color ?? colors[index % colors.length]}
							stroke-width="24"
							stroke-dasharray="{arcLength} {circumference - arcLength}"
							stroke-dashoffset={-offset}
							transform="rotate(-90 80 80)"
							style="transition: stroke-dasharray 0.6s ease-out-expo, stroke-dashoffset 0.6s ease-out-expo;"
						/>
					{/each}
				{/snippet}
				{#if data.length > 0}
					{@render circleContent()}
				{/if}
			</svg>
			<div class="donut-center">
				<span class="center-value">{displayTotal.toLocaleString()}</span>
				<span class="center-label">รายการ</span>
			</div>
		</div>

		<div class="chart-legend">
			{#each data as item, index (item.label)}
				<div class="legend-item">
					<div class="legend-color" style="background: {item.color ?? colors[index % colors.length]}"></div>
					<div class="legend-info">
						<span class="legend-label">{item.label}</span>
						<span class="legend-value">{item.value.toLocaleString()}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.donut-chart-card {
		background: oklch(1 0 0);
		border: 1px solid oklch(0.9 0.005 180);
		border-radius: 16px;
		padding: 24px;
		animation: fade-in 0.5s ease-out-expo;
	}

	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 24px;
		gap: 16px;
	}

	.chart-title {
		font-size: clamp(1rem, 0.85rem + 0.4vw, 1.125rem);
		font-weight: 600;
		color: oklch(0.25 0.02 180);
		margin: 0 0 4px 0;
	}

	.chart-subtitle {
		font-size: 0.8125rem;
		color: oklch(0.5 0.02 180);
		margin: 0;
	}

	.chart-total {
		text-align: right;
	}

	.total-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: oklch(0.52 0.14 240);
		line-height: 1;
	}

	.total-label {
		display: block;
		font-size: 0.75rem;
		color: oklch(0.5 0.02 180);
		margin-top: 4px;
	}

	.chart-content {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 24px;
		align-items: center;
	}

	.donut-container {
		position: relative;
		width: 160px;
		height: 160px;
	}

	.donut-svg {
		width: 100%;
		height: 100%;
	}

	.donut-segment {
		transition: opacity 0.2s ease;
	}

	.donut-segment:hover {
		opacity: 0.8;
	}

	.donut-center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
	}

	.center-value {
		display: block;
		font-size: 1.25rem;
		font-weight: 700;
		color: oklch(0.25 0.02 180);
		line-height: 1;
	}

	.center-label {
		display: block;
		font-size: 0.6875rem;
		color: oklch(0.5 0.02 180);
		margin-top: 2px;
	}

	.chart-legend {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.legend-info {
		display: flex;
		justify-content: space-between;
		flex: 1;
		gap: 16px;
	}

	.legend-label {
		font-size: 0.875rem;
		color: oklch(0.35 0.02 180);
	}

	.legend-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: oklch(0.25 0.02 180);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.chart-content {
			grid-template-columns: 1fr;
		}

		.donut-container {
			margin: 0 auto;
		}
	}
</style>
