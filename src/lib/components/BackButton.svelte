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

<a href={resolvedHref} class="back-btn">
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
	</svg>
	{label}
</a>

<style>
	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 500;
		color: oklch(0.4 0.02 180);
		background: oklch(0.97 0.005 180);
		border: 1px solid oklch(0.9 0.005 180);
		text-decoration: none;
		transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
	}

	.back-btn:hover {
		background: oklch(0.52 0.14 240 / 0.08);
		color: oklch(0.52 0.14 240);
		transform: translateX(-2px);
	}

	.back-btn svg {
		width: 16px;
		height: 16px;
	}
</style>
