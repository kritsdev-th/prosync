<script lang="ts">
	type Option = { value: string; label: string };

	let {
		options = [] as Option[],
		value = $bindable(''),
		placeholder = '-- เลือก --',
		name = '',
		required = false,
		disabled = false,
		id = '',
		onchange = undefined as ((value: string) => void) | undefined,
		class: className = ''
	}: {
		options?: Option[];
		value?: string;
		placeholder?: string;
		name?: string;
		required?: boolean;
		disabled?: boolean;
		id?: string;
		onchange?: ((value: string) => void) | undefined;
		class?: string;
	} = $props();

	let open = $state(false);
	let triggerEl = $state<HTMLButtonElement | null>(null);
	let searchQuery = $state('');
	let highlightIndex = $state(-1);
	let ddTop = $state(0);
	let ddLeft = $state(0);
	let ddWidth = $state(0);

	let selectedLabel = $derived(options.find((o) => o.value === value)?.label || '');
	let filtered = $derived(
		searchQuery ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase())) : options
	);
	let showSearch = $derived(options.length > 5);

	function reposition() {
		if (!triggerEl) return;
		const r = triggerEl.getBoundingClientRect();
		ddTop = r.bottom + 4;
		ddLeft = r.left;
		ddWidth = r.width;
	}

	function openDropdown() {
		if (disabled) return;
		document.dispatchEvent(new CustomEvent('cs:closeall'));
		reposition();
		open = true;
		searchQuery = '';
		highlightIndex = -1;
		// Double rAF: first lets Svelte render the dropdown, second positions it accurately
		requestAnimationFrame(() => {
			reposition();
			requestAnimationFrame(() => {
				reposition();
				document.getElementById(`cs-dd-${_uid}`)?.querySelector<HTMLInputElement>('.cs-search')?.focus();
			});
		});
	}

	function toggle() {
		if (open) close(); else openDropdown();
	}

	function close() { open = false; searchQuery = ''; }

	function select(opt: Option) { value = opt.value; close(); onchange?.(opt.value); }
	function clear() { value = ''; close(); onchange?.(''); }

	// Unique ID for this instance
	const _uid = Math.random().toString(36).slice(2, 10);

	// Listen for global close event
	$effect(() => {
		const handler = () => { if (open) close(); };
		document.addEventListener('cs:closeall', handler);
		return () => document.removeEventListener('cs:closeall', handler);
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') { close(); triggerEl?.focus(); }
		else if (e.key === 'ArrowDown') { e.preventDefault(); highlightIndex = Math.min(highlightIndex + 1, filtered.length - 1); scrollHL(); }
		else if (e.key === 'ArrowUp') { e.preventDefault(); highlightIndex = Math.max(highlightIndex - 1, 0); scrollHL(); }
		else if (e.key === 'Enter' && highlightIndex >= 0 && highlightIndex < filtered.length) { e.preventDefault(); select(filtered[highlightIndex]); }
	}

	function scrollHL() {
		requestAnimationFrame(() => {
			document.getElementById(`cs-dd-${_uid}`)?.querySelector('.cs-item.hl')?.scrollIntoView({ block: 'nearest' });
		});
	}

	function handleClick(e: MouseEvent) {
		if (!open) return;
		const t = e.target as Node;
		if (triggerEl?.contains(t)) return;
		const dd = document.getElementById(`cs-dd-${_uid}`);
		if (dd?.contains(t)) return;
		close();
	}
</script>

<svelte:window onclick={handleClick} onkeydown={handleKeydown} />

<!-- Trigger (in normal flow) -->
<div class="cs-wrap {className}">
	{#if name}<input type="hidden" {name} value={value} />{/if}
	<button type="button" bind:this={triggerEl}
		class="cs-trigger" class:open class:disabled class:has-value={!!value}
		{disabled} {id} onclick={toggle} aria-haspopup="listbox" aria-expanded={open}>
		<span class="cs-label">{selectedLabel || placeholder}</span>
		<svg class="cs-chevron" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
	</button>
</div>

<!-- Dropdown (rendered at body level via Svelte's #if + fixed positioning) -->
{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="cs-dd-portal" id="cs-dd-{_uid}"
		style="position:fixed; top:{ddTop}px; left:{ddLeft}px; width:{ddWidth}px; z-index:9999;"
		onclick={(e) => e.stopPropagation()}>
		{#if showSearch}
			<div class="cs-dd-search">
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="6" /><path stroke-linecap="round" d="m14 14 4 4" /></svg>
				<input type="text" placeholder="ค้นหา..." bind:value={searchQuery} />
			</div>
		{/if}
		<ul class="cs-dd-list" role="listbox">
			{#if !required && value}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li class="cs-dd-item cs-dd-clear" role="option" aria-selected={false} onclick={clear}>
					<svg viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
					ล้างการเลือก
				</li>
			{/if}
			{#each filtered as opt, i}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li class="cs-dd-item" class:selected={opt.value === value} class:hl={i === highlightIndex}
					role="option" aria-selected={opt.value === value} onclick={() => select(opt)}>
					<span class="cs-dd-item-text">{opt.label}</span>
					{#if opt.value === value}
						<svg class="cs-dd-check" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" /></svg>
					{/if}
				</li>
			{:else}
				<li class="cs-dd-empty">ไม่พบรายการ</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	/* ── Trigger wrapper ── */
	.cs-wrap {
		position: relative;
		display: flex;
		width: 100%;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
	}
	.cs-trigger {
		display: flex; align-items: center; gap: 6px;
		width: 100%; padding: 7px 10px 7px 13px;
		border: 1.5px solid oklch(0.88 0.01 230);
		border-radius: 10px;
		background: oklch(0.993 0.003 230);
		font-family: inherit; font-size: 0.8125rem;
		color: oklch(0.25 0.02 230);
		cursor: pointer; text-align: left; min-height: 36px;
		transition: border-color 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s cubic-bezier(0.16,1,0.3,1), background 0.15s ease;
	}
	.cs-trigger:hover:not(.disabled) { border-color: oklch(0.72 0.03 230); background: oklch(0.985 0.004 230); }
	.cs-trigger:focus { outline: none; border-color: oklch(0.52 0.14 240); box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.08); }
	.cs-trigger.open { border-color: oklch(0.52 0.14 240); box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.08); }
	.cs-trigger.disabled { opacity: 0.45; cursor: not-allowed; background: oklch(0.96 0.005 230); }
	.cs-trigger:not(.has-value) .cs-label { color: oklch(0.6 0.015 230); }
	.cs-label { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
	.cs-chevron { width: 16px; height: 16px; color: oklch(0.55 0.02 230); flex-shrink: 0; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1); }
	.cs-trigger.open .cs-chevron { transform: rotate(180deg); color: oklch(0.52 0.14 240); }
</style>

<!-- Global styles for the fixed-position dropdown (outside component tree) -->
<svelte:head>
<style>
	.cs-dd-portal {
		background: oklch(0.995 0.003 230);
		border: 1px solid oklch(0.9 0.01 230);
		border-radius: 12px;
		box-shadow: 0 4px 6px oklch(0.3 0.02 230 / 0.04), 0 10px 24px oklch(0.3 0.02 230 / 0.08);
		animation: _csDown 0.15s cubic-bezier(0.16,1,0.3,1);
		overflow: hidden;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
	}
	.cs-dd-search {
		display: flex; align-items: center; gap: 8px;
		padding: 9px 12px;
		border-bottom: 1px solid oklch(0.94 0.006 230);
		background: oklch(0.98 0.004 230);
	}
	.cs-dd-search svg { width: 15px; height: 15px; color: oklch(0.6 0.02 230); flex-shrink: 0; }
	.cs-dd-search input {
		flex: 1; border: none; outline: none;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
		font-size: 0.8125rem; color: oklch(0.25 0.02 230); background: transparent;
	}
	.cs-dd-search input::placeholder { color: oklch(0.6 0.015 230); }
	.cs-dd-list {
		list-style: none; margin: 0; padding: 4px;
		max-height: calc(5 * 38px);
		overflow-y: auto; overscroll-behavior: contain;
	}
	.cs-dd-list::-webkit-scrollbar { width: 4px; }
	.cs-dd-list::-webkit-scrollbar-track { background: transparent; }
	.cs-dd-list::-webkit-scrollbar-thumb { background: oklch(0.82 0.01 230); border-radius: 10px; }
	.cs-dd-item {
		display: flex; align-items: center; justify-content: space-between;
		gap: 8px; padding: 8px 12px; border-radius: 8px;
		font-size: 0.8125rem; color: oklch(0.3 0.02 230);
		cursor: pointer; transition: background 0.1s ease;
	}
	.cs-dd-item:hover, .cs-dd-item.hl { background: oklch(0.52 0.14 240 / 0.06); }
	.cs-dd-item.selected { background: oklch(0.52 0.14 240 / 0.08); color: oklch(0.42 0.14 240); font-weight: 600; }
	.cs-dd-item.selected:hover { background: oklch(0.52 0.14 240 / 0.12); }
	.cs-dd-item-text { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
	.cs-dd-item.cs-dd-clear {
		color: oklch(0.6 0.02 230); font-size: 0.75rem; gap: 5px;
		justify-content: flex-start;
		border-bottom: 1px solid oklch(0.94 0.006 230); margin-bottom: 2px;
	}
	.cs-dd-item.cs-dd-clear svg { width: 13px; height: 13px; }
	.cs-dd-item.cs-dd-clear:hover { color: oklch(0.5 0.18 25); background: oklch(0.58 0.2 25 / 0.05); }
	.cs-dd-check { width: 16px; height: 16px; color: oklch(0.52 0.14 240); flex-shrink: 0; }
	.cs-dd-empty { padding: 16px 12px; font-size: 0.8125rem; color: oklch(0.6 0.015 230); text-align: center; list-style: none; }
	@keyframes _csDown {
		from { opacity: 0; transform: translateY(-6px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
</svelte:head>
