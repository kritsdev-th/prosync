<script lang="ts">
	import { page } from '$app/state';

	let { href, label = 'กลับ' }: { href: string; label?: string } = $props();

	// Preserve province_id and agency_id from current URL when navigating back
	let resolvedHref = $derived.by(() => {
		const currentParams = page.url.searchParams;
		const provinceId = currentParams.get('province_id');
		const agencyId = currentParams.get('agency_id');

		if (!provinceId && !agencyId) return href;

		const url = new URL(href, page.url.origin);
		if (provinceId) url.searchParams.set('province_id', provinceId);
		if (agencyId) url.searchParams.set('agency_id', agencyId);
		return url.pathname + url.search;
	});
</script>

<a href={resolvedHref} class="back-link">
	<svg class="back-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
	</svg>
	<span>{label}</span>
</a>

<style>
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px 6px 8px;
		border-radius: 8px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: oklch(0.52 0.14 240);
		background: transparent;
		text-decoration: none;
		transition: background 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
		margin-bottom: 8px;
	}

	.back-link:hover {
		background: oklch(0.52 0.14 240 / 0.06);
		transform: translateX(-3px);
	}

	.back-arrow {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.back-link:hover .back-arrow {
		transform: translateX(-2px);
	}
</style>
