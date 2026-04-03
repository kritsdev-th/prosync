<script lang="ts">
	interface Props {
		title: string;
		subtitle: string;
		userName?: string;
		isSuperAdmin?: boolean;
		isDirector?: boolean;
		compact?: boolean;
	}

	let { title, subtitle, userName, isSuperAdmin = false, isDirector = false, compact = false }: Props = $props();
</script>

<div class="page-header-banner" class:compact>
	<div class="header-content">
		<div>
			<h1 class="header-title">{title}</h1>
			<p class="header-subtitle">
				{#if userName}
					ยินดีต้อนรับกลับ, <span class="user-name">{userName}</span>
					{#if isSuperAdmin}
						<span class="admin-badge">
							<svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
							Super Admin
						</span>
					{:else if isDirector}
						<span class="admin-badge director">
							<svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							ผู้อำนวยการ
						</span>
					{/if}
				{:else}
					{subtitle}
				{/if}
			</p>
		</div>
	</div>
	<div class="header-decoration"></div>
</div>

<style>
	.page-header-banner {
		position: relative;
		overflow: hidden;
		margin-bottom: 20px;
		border-radius: 18px;
		background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.54 0.16 150));
		padding: 24px 28px;
		box-shadow: 0 6px 24px oklch(0.52 0.14 240 / 0.12);
	}

	.page-header-banner.compact {
		padding: 16px 24px;
		margin-bottom: 14px;
		border-radius: 14px;
		box-shadow: 0 4px 16px oklch(0.52 0.14 240 / 0.1);
	}

	.compact .header-title {
		font-size: clamp(1.125rem, 1rem + 0.4vw, 1.375rem);
		margin-bottom: 2px;
	}

	.compact .header-subtitle {
		font-size: 0.8125rem;
	}

	.compact .header-decoration {
		width: 140px;
		height: 140px;
		top: -30px;
		right: -30px;
	}

	.header-content {
		position: relative;
		z-index: 1;
	}

	.header-title {
		margin: 0 0 6px 0;
		font-size: clamp(1.5rem, 1.2rem + 0.8vw, 2rem);
		font-weight: 700;
		color: oklch(0.98 0.005 180);
		letter-spacing: -0.02em;
	}

	.header-subtitle {
		margin: 0;
		font-size: clamp(0.875rem, 0.75rem + 0.4vw, 1rem);
		color: oklch(0.98 0.005 180 / 0.8);
		line-height: 1.6;
	}

	.user-name {
		font-weight: 600;
		color: oklch(0.98 0.005 180);
	}

	.admin-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-left: 8px;
		padding: 4px 12px;
		border-radius: 999px;
		background: oklch(0.98 0.005 180 / 0.2);
		backdrop-filter: blur(8px);
		font-size: 0.75rem;
		font-weight: 500;
		color: oklch(0.98 0.005 180);
	}

	.admin-badge.director {
		background: oklch(0.54 0.16 150 / 0.3);
	}

	.badge-icon {
		width: 14px;
		height: 14px;
	}

	.header-decoration {
		position: absolute;
		top: -40px;
		right: -40px;
		width: 200px;
		height: 200px;
		border-radius: 50%;
		background: oklch(0.98 0.005 180 / 0.08);
		pointer-events: none;
	}

	@media (max-width: 640px) {
		.page-header-banner { padding: 24px; }
	}
</style>
