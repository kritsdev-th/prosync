<script lang="ts">
	import type { ChartData } from '$lib/types/dashboard';

	interface Props {
		data: ChartData[];
		title: string;
		subtitle?: string;
		maxValue?: number;
	}

	let { data, title, subtitle, maxValue }: Props = $props();

	let displayMax = $derived(maxValue ?? Math.max(...data.map((d) => d.value)) * 1.1);

	const colors = [
		'oklch(0.52 0.14 240)',
		'oklch(0.54 0.16 150)',
		'oklch(0.62 0.18 60)',
		'oklch(0.58 0.2 25)',
		'oklch(0.55 0.12 280)',
		'oklch(0.5 0.14 200)'
	];
</script>

<div class="bar-chart-card">
	<div class="chart-header">
		<div>
			<h3 class="chart-title">{title}</h3>
			{#if subtitle}
				<p class="chart-subtitle">{subtitle}</p>
			{/if}
		</div>
	</div>

	<div class="chart-content">
		<div class="bars-container">
			{#each data as item, index (item.label)}
				{@const barHeight = Math.max((item.value / displayMax) * 100, 2)}
				<div class="bar-item">
					<div class="bar-value">{item.value.toLocaleString()}</div>
					<div class="bar-wrapper">
						<div
							class="bar-fill"
							style="height: {barHeight}%; background: {item.color ?? colors[index % colors.length]}; animation-delay: {index * 0.05}s;"
						></div>
					</div>
					<div class="bar-label">{item.label}</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.bar-chart-card {
		background: oklch(1 0 0);
		border: 1px solid oklch(0.9 0.005 180);
		border-radius: 16px;
		padding: 24px;
		animation: fade-in 0.5s ease-out-expo;
	}

	.chart-header {
		margin-bottom: 24px;
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

	.chart-content {
		display: flex;
		align-items: flex-end;
		justify-content: space-around;
		height: 280px;
		gap: 12px;
		padding-top: 20px;
	}

	.bars-container {
		display: flex;
		gap: 12px;
		flex: 1;
		height: 100%;
		align-items: flex-end;
		justify-content: space-around;
	}

	.bar-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		flex: 1;
		max-width: 80px;
	}

	.bar-value {
		font-size: 0.8125rem;
		font-weight: 600;
		color: oklch(0.25 0.02 180);
	}

	.bar-wrapper {
		width: 100%;
		height: 200px;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.bar-fill {
		width: 100%;
		max-width: 48px;
		border-radius: 8px 8px 4px 4px;
		animation: grow-up 0.6s ease-out-expo backwards;
		transition: opacity 0.2s ease;
	}

	.bar-fill:hover {
		opacity: 0.85;
	}

	.bar-label {
		font-size: 0.75rem;
		color: oklch(0.5 0.02 180);
		text-align: center;
		line-height: 1.3;
		word-break: break-word;
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

	@keyframes grow-up {
		from {
			height: 0 !important;
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (max-width: 640px) {
		.chart-content {
			height: 220px;
		}

		.bar-wrapper {
			height: 150px;
		}

		.bar-label {
			font-size: 0.6875rem;
		}
	}
</style>
