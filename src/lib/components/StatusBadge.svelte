<script lang="ts">
	import { STATUS_COLORS, STATUS_LABELS } from '$lib/utils/format';

	let {
		status,
		label
	}: {
		status: string;
		label?: string;
	} = $props();

	let colorClass = $derived(STATUS_COLORS[status] || 'bg-gray-100 text-gray-700');
	let displayLabel = $derived(label || STATUS_LABELS[status] || status);
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {colorClass}">
	{displayLabel}
</span>
