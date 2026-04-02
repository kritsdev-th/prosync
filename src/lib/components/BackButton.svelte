<script lang="ts">
	let { href, label = 'กลับ' }: { href: string; label?: string } = $props();
</script>

<a {href}
	class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-150"
	style="color: var(--color-slate-600); border: 1px solid var(--color-slate-200)"
	onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-slate-50)'; }}
	onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
	<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
	{label}
</a>
