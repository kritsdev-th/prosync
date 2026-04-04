<script lang="ts">
	let {
		value = $bindable(''),
		name = '',
		required = false,
		disabled = false,
		id = '',
		min = '',
		max = '',
		placeholder = 'เลือกวันที่',
		class: className = ''
	}: {
		value?: string;
		name?: string;
		required?: boolean;
		disabled?: boolean;
		id?: string;
		min?: string;
		max?: string;
		placeholder?: string;
		class?: string;
	} = $props();

	let open = $state(false);
	let triggerEl = $state<HTMLButtonElement | null>(null);
	let ddTop = $state(0);
	let ddLeft = $state(0);
	let ddWidth = $state(0);

	// Calendar state
	let viewDate = $state(value ? new Date(value + 'T00:00:00') : new Date());
	const _uid = Math.random().toString(36).slice(2, 10);

	const DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
	const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

	let displayLabel = $derived(() => {
		if (!value) return '';
		const d = new Date(value + 'T00:00:00');
		return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
	});

	let calendarDays = $derived(() => {
		const y = viewDate.getFullYear();
		const m = viewDate.getMonth();
		const firstDay = new Date(y, m, 1).getDay();
		const daysInMonth = new Date(y, m + 1, 0).getDate();
		const days: { date: number; iso: string; disabled: boolean; today: boolean; selected: boolean; currentMonth: boolean }[] = [];

		// Previous month padding
		const prevMonthDays = new Date(y, m, 0).getDate();
		for (let i = firstDay - 1; i >= 0; i--) {
			const d = prevMonthDays - i;
			const dt = new Date(y, m - 1, d);
			const iso = fmt(dt);
			days.push({ date: d, iso, disabled: isDisabled(iso), today: false, selected: iso === value, currentMonth: false });
		}

		// Current month
		const today = fmt(new Date());
		for (let d = 1; d <= daysInMonth; d++) {
			const dt = new Date(y, m, d);
			const iso = fmt(dt);
			days.push({ date: d, iso, disabled: isDisabled(iso), today: iso === today, selected: iso === value, currentMonth: true });
		}

		// Next month padding (fill to 35 = 5 weeks)
		const remaining = 35 - days.length;
		for (let d = 1; d <= Math.max(0, remaining); d++) {
			const dt = new Date(y, m + 1, d);
			const iso = fmt(dt);
			days.push({ date: d, iso, disabled: isDisabled(iso), today: false, selected: iso === value, currentMonth: false });
		}

		return days;
	});

	function fmt(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function isDisabled(iso: string): boolean {
		if (min && iso < min) return true;
		if (max && iso > max) return true;
		return false;
	}

	function prevMonth() {
		viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
	}
	function nextMonth() {
		viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
	}

	function selectDate(iso: string) {
		value = iso;
		open = false;
	}

	function clearDate() {
		value = '';
		open = false;
	}

	function reposition() {
		if (!triggerEl) return;
		const r = triggerEl.getBoundingClientRect();
		ddTop = r.bottom + 4;
		ddLeft = r.left;
		ddWidth = Math.max(r.width, 280);
	}

	function toggle() {
		if (disabled) return;
		if (open) { open = false; return; }
		document.dispatchEvent(new CustomEvent('cs:closeall'));
		if (value) viewDate = new Date(value + 'T00:00:00');
		reposition();
		open = true;
		requestAnimationFrame(() => { reposition(); });
	}

	// Close on global close event or click outside
	$effect(() => {
		const handler = () => { if (open) open = false; };
		document.addEventListener('cs:closeall', handler);
		return () => document.removeEventListener('cs:closeall', handler);
	});

	function handleClick(e: MouseEvent) {
		if (!open) return;
		const t = e.target as Node;
		if (triggerEl?.contains(t)) return;
		const dd = document.getElementById(`dp-dd-${_uid}`);
		if (dd?.contains(t)) return;
		open = false;
	}
</script>

<svelte:window onclick={handleClick} />

<div class="dp-wrap {className}">
	{#if name}<input type="hidden" {name} value={value} />{/if}
	<button type="button" bind:this={triggerEl}
		class="dp-trigger" class:open class:disabled class:has-value={!!value}
		{disabled} {id} onclick={toggle}>
		<svg class="dp-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" /></svg>
		<span class="dp-label">{displayLabel() || placeholder}</span>
		<svg class="dp-chevron" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
	</button>
</div>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="dp-dropdown" id="dp-dd-{_uid}"
		style="position:fixed; top:{ddTop}px; left:{ddLeft}px; width:{ddWidth}px; z-index:9999;"
		onclick={(e) => e.stopPropagation()}>

		<!-- Header: month/year nav -->
		<div class="dp-header">
			<button type="button" class="dp-nav" onclick={prevMonth}>
				<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" /></svg>
			</button>
			<span class="dp-month-label">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear() + 543}</span>
			<button type="button" class="dp-nav" onclick={nextMonth}>
				<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" /></svg>
			</button>
		</div>

		<!-- Day names -->
		<div class="dp-days-header">
			{#each DAYS as day}
				<span class="dp-day-name">{day}</span>
			{/each}
		</div>

		<!-- Days grid -->
		<div class="dp-days">
			{#each calendarDays() as day}
				<button type="button"
					class="dp-day"
					class:other={!day.currentMonth}
					class:today={day.today}
					class:selected={day.selected}
					disabled={day.disabled}
					onclick={() => selectDate(day.iso)}>
					{day.date}
				</button>
			{/each}
		</div>

		<!-- Footer -->
		<div class="dp-footer">
			<button type="button" class="dp-today-btn" onclick={() => { viewDate = new Date(); selectDate(fmt(new Date())); }}>วันนี้</button>
			{#if value && !required}
				<button type="button" class="dp-clear-btn" onclick={clearDate}>ล้าง</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.dp-wrap {
		position: relative;
		display: flex;
		width: 100%;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
	}
	.dp-trigger {
		display: flex; align-items: center; gap: 8px;
		width: 100%; padding: 7px 10px 7px 12px;
		border: 1.5px solid oklch(0.88 0.01 230);
		border-radius: 10px;
		background: oklch(0.993 0.003 230);
		font-family: inherit; font-size: 0.8125rem;
		color: oklch(0.25 0.02 230);
		cursor: pointer; text-align: left; min-height: 36px;
		transition: border-color 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s cubic-bezier(0.16,1,0.3,1);
	}
	.dp-trigger:hover:not(.disabled) { border-color: oklch(0.72 0.03 230); }
	.dp-trigger:focus { outline: none; border-color: oklch(0.52 0.14 240); box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.08); }
	.dp-trigger.open { border-color: oklch(0.52 0.14 240); box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.08); }
	.dp-trigger.disabled { opacity: 0.45; cursor: not-allowed; }
	.dp-trigger:not(.has-value) .dp-label { color: oklch(0.6 0.015 230); }
	.dp-icon { width: 16px; height: 16px; color: oklch(0.52 0.12 240); flex-shrink: 0; }
	.dp-label { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
	.dp-chevron { width: 14px; height: 14px; color: oklch(0.55 0.02 230); flex-shrink: 0; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1); }
	.dp-trigger.open .dp-chevron { transform: rotate(180deg); }
</style>

<svelte:head>
<style>
	.dp-dropdown {
		background: oklch(0.995 0.003 230);
		border: 1px solid oklch(0.9 0.01 230);
		border-radius: 14px;
		box-shadow: 0 4px 6px oklch(0.3 0.02 230 / 0.04), 0 10px 24px oklch(0.3 0.02 230 / 0.08);
		animation: _dpDown 0.15s cubic-bezier(0.16,1,0.3,1);
		overflow: hidden;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
		padding: 12px;
	}
	.dp-header {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: 10px;
	}
	.dp-nav {
		display: flex; align-items: center; justify-content: center;
		width: 30px; height: 30px; border-radius: 8px;
		border: none; background: transparent; cursor: pointer;
		color: oklch(0.45 0.02 230);
		transition: background 0.1s;
	}
	.dp-nav:hover { background: oklch(0.94 0.008 230); }
	.dp-nav svg { width: 18px; height: 18px; }
	.dp-month-label {
		font-size: 0.875rem; font-weight: 600;
		color: oklch(0.2 0.02 230);
	}
	.dp-days-header {
		display: grid; grid-template-columns: repeat(7, 1fr);
		margin-bottom: 4px;
	}
	.dp-day-name {
		text-align: center; font-size: 0.6875rem; font-weight: 600;
		color: oklch(0.55 0.02 230);
		padding: 4px 0;
	}
	.dp-days {
		display: grid; grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}
	.dp-day {
		display: flex; align-items: center; justify-content: center;
		width: 100%; aspect-ratio: 1;
		border: none; border-radius: 8px;
		background: transparent; cursor: pointer;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
		font-size: 0.8125rem; color: oklch(0.3 0.02 230);
		transition: background 0.1s;
	}
	.dp-day:hover:not(:disabled):not(.selected) { background: oklch(0.94 0.008 230); }
	.dp-day.other { color: oklch(0.7 0.01 230); }
	.dp-day.today { font-weight: 700; color: oklch(0.52 0.14 240); box-shadow: inset 0 0 0 1.5px oklch(0.52 0.14 240 / 0.3); }
	.dp-day.selected { background: oklch(0.48 0.14 240); color: #fff; font-weight: 600; }
	.dp-day.selected:hover { background: oklch(0.44 0.14 240); }
	.dp-day:disabled { opacity: 0.3; cursor: not-allowed; }
	.dp-footer {
		display: flex; align-items: center; gap: 8px;
		margin-top: 8px; padding-top: 8px;
		border-top: 1px solid oklch(0.94 0.006 230);
	}
	.dp-today-btn, .dp-clear-btn {
		padding: 4px 12px; border-radius: 6px; border: none;
		font-family: 'Noto Sans Thai', system-ui, sans-serif;
		font-size: 0.75rem; font-weight: 500; cursor: pointer;
		transition: background 0.1s;
	}
	.dp-today-btn { background: oklch(0.52 0.14 240 / 0.08); color: oklch(0.42 0.14 240); }
	.dp-today-btn:hover { background: oklch(0.52 0.14 240 / 0.14); }
	.dp-clear-btn { background: transparent; color: oklch(0.55 0.02 230); }
	.dp-clear-btn:hover { background: oklch(0.94 0.008 230); }
	@keyframes _dpDown {
		from { opacity: 0; transform: translateY(-6px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
</svelte:head>
