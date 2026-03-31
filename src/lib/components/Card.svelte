<script lang="ts">
	import { slideUp, fadeIn } from 'svelte/transition';

	export let title: string | undefined = undefined;
	export let subtitle: string | undefined = undefined;
	export let icon: string | undefined = undefined;
	export let iconBg: 'brand' | 'health' | 'purple' | 'orange' | 'gray' = 'brand';
	export let hoverLift = true;
	export let animateIn = true;
	export let class: string | undefined = undefined;

	const iconBgClasses = $derived({
		brand: 'from-brand-100 to-brand-50 text-brand-600',
		health: 'from-health-100 to-health-50 text-health-600',
		purple: 'from-purple-100 to-purple-50 text-purple-600',
		orange: 'from-orange-100 to-orange-50 text-orange-600',
		gray: 'from-slate-100 to-slate-50 text-slate-600'
	}[iconBg]);
</script>

<div
	class="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 {hoverLift ? 'hover:-translate-y-1 hover:shadow-lg' : ''} {class ?? ''}"
	style="box-shadow: 0 1px 3px 0 oklch(0.58 0.030 180 / 0.08);"
>
	{#if title || icon}
		<div class="mb-4 flex items-start justify-between">
			<div class="flex items-center gap-3">
				{#if icon}
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-transform duration-300 {iconBgClasses}">
						{@render icon}
					</div>
				{/if}
				<div>
					{#if title}
						<h3 class="text-base font-semibold" style="color: oklch(0.38 0.040 180);">{title}</h3>
					{/if}
					{#if subtitle}
						<p class="mt-0.5 text-sm" style="color: oklch(0.58 0.030 180);">{subtitle}</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<div class="{title || icon ? '' : ''}">
		{@render children}
	</div>
</div>
