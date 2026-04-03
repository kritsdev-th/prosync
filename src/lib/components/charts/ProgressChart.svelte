<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string;
		items: Array<{
			label: string;
			value: number;
			max: number;
			color?: string;
		}>;
	}

	let { title, subtitle, items }: Props = $props();

	const defaultColors = [
		'oklch(0.52 0.14 240)',
		'oklch(0.54 0.16 150)',
		'oklch(0.62 0.18 60)',
		'oklch(0.58 0.2 25)'
	];
</script>

<div class="progress-chart-card">
	<div class="chart-header">
		<div>
			<h3 class="chart-title">{title}</h3>
			{#if subtitle}
				<p class="chart-subtitle">{subtitle}</p>
			{/if}
		</div>
	</div>

	<div class="chart-content">
		{#each items as item, index (item.label)}
			{@const percentage = Math.min((item.value / item.max) * 100, 100)}
			<div class="progress-item">
				<div class="progress-header">
					<span class="progress-label">{item.label}</span>
					<div class="progress-values">
						<span class="progress-value">{item.value.toLocaleString()}</span>
						<span class="progress-max">/ {item.max.toLocaleString()}</span>
						<span class="progress-percentage" style="color: {item.color ?? defaultColors[index % defaultColors.length]};">
							{percentage.toFixed(1)}%
						</span>
					</div>
				</div>
				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {percentage}%; background: {item.color ?? defaultColors[index % defaultColors.length]}; animation-delay: {index * 0.1}s;"
					></div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.progress-chart-card {
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
		flex-direction: column;
		gap: 20px;
	}

	.progress-item {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.progress-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: oklch(0.35 0.02 180);
	}

	.progress-values {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.progress-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: oklch(0.25 0.02 180);
	}

	.progress-max {
		font-size: 0.75rem;
		color: oklch(0.6 0.015 180);
	}

	.progress-percentage {
		font-size: 0.8125rem;
		font-weight: 600;
		margin-left: 8px;
	}

	.progress-bar {
		height: 8px;
		background: oklch(0.94 0.005 180);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 4px;
		animation: grow-right 0.8s ease-out-expo backwards;
		transition: width 0.6s ease-out-expo;
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

	@keyframes grow-right {
		from {
			width: 0 !important;
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
