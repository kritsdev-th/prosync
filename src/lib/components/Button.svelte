<script lang="ts">
	import { slideUp, fadeIn } from 'svelte/transition';

	export let icon: string;
	export let label: string;
	export let variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let loading = false;
	export let href: string | undefined = undefined;
	export let class: string | undefined = undefined;

	const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ease-out-quart focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100';

	const variants = {
		primary: 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md hover:shadow-lg hover:shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98]',
		secondary: 'bg-white text-gray-700 border hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98]',
		ghost: 'text-gray-600 hover:bg-gray-100 hover:scale-105 active:scale-95',
		danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98]'
	};

	const sizes = {
		sm: 'h-8 px-3 text-xs',
		md: 'h-10 px-4 text-sm',
		lg: 'h-12 px-6 text-base'
	};

	const styleClasses = $derived(`${baseStyles} ${variants[variant]} ${sizes[size]} ${class ?? ''}`);
</script>

{#if href}
	<a {href} class={styleClasses}>
		{#if loading}
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		{:else}
			{@render icon}
		{/if}
		{label}
	</a>
{:else}
	<button type="button" class={styleClasses} {disabled} {loading}>
		{#if loading}
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		{:else}
			{@render icon}
		{/if}
		{label}
	</button>
{/if}
