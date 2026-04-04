<script lang="ts">
	interface Props {
		initialCount?: number;
	}

	let { initialCount = 0 }: Props = $props();

	let unreadCount = $state(initialCount);
	let showDropdown = $state(false);
	let notifications = $state<any[]>([]);
	let loading = $state(false);

	// Poll for count every 60s
	$effect(() => {
		const interval = setInterval(async () => {
			try {
				const res = await fetch('/api/notifications?limit=1');
				if (res.ok) {
					const data = await res.json();
					unreadCount = data.unreadCount;
				}
			} catch {}
		}, 60000);
		return () => clearInterval(interval);
	});

	async function toggleDropdown() {
		showDropdown = !showDropdown;
		if (showDropdown && notifications.length === 0) {
			await loadNotifications();
		}
	}

	async function loadNotifications() {
		loading = true;
		try {
			const res = await fetch('/api/notifications?limit=10');
			if (res.ok) {
				const data = await res.json();
				notifications = data.notifications;
				unreadCount = data.unreadCount;
			}
		} finally {
			loading = false;
		}
	}

	async function handleClick(notif: any, e: MouseEvent) {
		e.stopPropagation();
		const url = notif.action_url;

		// Mark as read in background (don't await)
		if (!notif.is_read) {
			fetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'read', id: notif.id })
			});
			notif.is_read = true;
			unreadCount = Math.max(0, unreadCount - 1);
		}

		showDropdown = false;

		if (url) {
			// Use window.location for reliable navigation
			window.location.href = url;
		}
	}

	async function markAllRead() {
		await fetch('/api/notifications', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'read-all' })
		});
		notifications = notifications.map((n) => ({ ...n, is_read: true }));
		unreadCount = 0;
	}

	function closeDropdown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.notif-container')) {
			showDropdown = false;
		}
	}

	function timeAgo(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'เมื่อสักครู่';
		if (mins < 60) return `${mins} นาทีที่แล้ว`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours} ชม.ที่แล้ว`;
		const days = Math.floor(hours / 24);
		return `${days} วันที่แล้ว`;
	}

	function getTypeIcon(type: string): string {
		switch (type) {
			case 'APPROVAL_REQUIRED': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'COMMITTEE_REQUIRED': return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z';
			case 'UPLOAD_REQUIRED': return 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12';
			case 'DOCUMENT_REJECTED': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
			default: return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
		}
	}

	function getTypeColor(type: string): string {
		switch (type) {
			case 'APPROVAL_REQUIRED': return 'oklch(0.48 0.14 60)';
			case 'COMMITTEE_REQUIRED': return 'oklch(0.45 0.1 280)';
			case 'UPLOAD_REQUIRED': return 'oklch(0.42 0.12 240)';
			case 'DOCUMENT_REJECTED': return 'oklch(0.58 0.2 25)';
			default: return 'oklch(0.52 0.14 240)';
		}
	}
</script>

<svelte:window onclick={closeDropdown} />

<div class="notif-container">
	<button class="bell-btn" onclick={toggleDropdown} aria-label="แจ้งเตือน">
		<svg class="bell-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
		</svg>
		{#if unreadCount > 0}
			<span class="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
		{/if}
	</button>

	{#if showDropdown}
		<div class="dropdown">
			<div class="dropdown-header">
				<h3 class="dropdown-title">แจ้งเตือน</h3>
				{#if unreadCount > 0}
					<button class="mark-all-btn" onclick={markAllRead}>อ่านทั้งหมด</button>
				{/if}
			</div>

			<div class="dropdown-body">
				{#if loading}
					<div class="loading-state">กำลังโหลด...</div>
				{:else if notifications.length === 0}
					<div class="empty-state">ไม่มีการแจ้งเตือน</div>
				{:else}
					{#each notifications as notif}
						<button
							class="notif-item"
							class:unread={!notif.is_read}
							onclick={(e: MouseEvent) => handleClick(notif, e)}
						>
							<div class="notif-icon" style="color: {getTypeColor(notif.notification_type)};">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<path stroke-linecap="round" stroke-linejoin="round" d={getTypeIcon(notif.notification_type)} />
								</svg>
							</div>
							<div class="notif-content">
								<p class="notif-title">{notif.title}</p>
								<p class="notif-message">{notif.message}</p>
								<span class="notif-time">{timeAgo(notif.created_at)}</span>
							</div>
							{#if !notif.is_read}
								<div class="unread-dot"></div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.notif-container { position: relative; }

	.bell-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.bell-btn:hover { background: oklch(0.95 0.01 240); }
	.bell-icon { width: 20px; height: 20px; color: oklch(0.55 0.03 180); }

	.badge {
		position: absolute;
		top: 2px;
		right: 2px;
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		border-radius: 8px;
		background: oklch(0.58 0.2 25);
		color: white;
		font-size: 0.625rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.dropdown {
		position: absolute;
		top: 44px;
		right: 0;
		width: 380px;
		max-height: 480px;
		background: oklch(0.995 0.002 180);
		border: 1px solid oklch(0.92 0.005 180);
		border-radius: 16px;
		box-shadow: 0 16px 48px oklch(0.15 0.02 180 / 0.15);
		z-index: 60;
		overflow: hidden;
		animation: dropdown-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.dropdown-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 18px 12px;
		border-bottom: 1px solid oklch(0.92 0.005 180);
	}
	.dropdown-title { margin: 0; font-size: 0.9375rem; font-weight: 600; color: oklch(0.2 0.02 180); }
	.mark-all-btn {
		padding: 4px 10px;
		border-radius: 6px;
		border: none;
		background: oklch(0.52 0.14 240 / 0.08);
		color: oklch(0.52 0.14 240);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		font-family: 'Noto Sans Thai', sans-serif;
	}
	.mark-all-btn:hover { background: oklch(0.52 0.14 240 / 0.15); }

	.dropdown-body { max-height: 400px; overflow-y: auto; }

	.loading-state, .empty-state {
		padding: 32px 18px;
		text-align: center;
		font-size: 0.875rem;
		color: oklch(0.55 0.02 180);
	}

	.notif-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		width: 100%;
		padding: 14px 18px;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		border-bottom: 1px solid oklch(0.95 0.003 180);
		transition: background 0.1s ease;
		font-family: 'Noto Sans Thai', sans-serif;
	}
	.notif-item:hover { background: oklch(0.97 0.005 240 / 0.5); }
	.notif-item.unread { background: oklch(0.52 0.14 240 / 0.03); }

	.notif-icon { width: 32px; height: 32px; flex-shrink: 0; padding: 6px; border-radius: 8px; background: oklch(0.95 0.01 240); }
	.notif-icon svg { width: 100%; height: 100%; }

	.notif-content { flex: 1; min-width: 0; }
	.notif-title { margin: 0; font-size: 0.8125rem; font-weight: 600; color: oklch(0.25 0.02 180); line-height: 1.4; }
	.notif-message { margin: 2px 0 0 0; font-size: 0.75rem; color: oklch(0.5 0.02 180); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
	.notif-time { font-size: 0.6875rem; color: oklch(0.6 0.01 180); }

	.unread-dot { width: 8px; height: 8px; border-radius: 50%; background: oklch(0.52 0.14 240); flex-shrink: 0; margin-top: 6px; }

	@keyframes dropdown-in { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

	@media (max-width: 480px) { .dropdown { width: calc(100vw - 32px); right: -8px; } }
</style>
