<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form: formResult } = $props();
	let isEditing = $state(false);
	let editName = $state(data.profile.name);
	let editPosition = $state(data.profile.position || '');
	let editPositionRank = $state(data.profile.position_rank || '');
	let editEmail = $state(data.profile.email || '');
	let editPhone = $state(data.profile.phone || '');

	// ผอ./รองผอ. ไม่สามารถแก้ position_rank ตัวเองได้ — ต้อง super admin เท่านั้น
	let canEditRank = $derived(!data.user.is_director && !data.user.is_super_admin);

	function startEdit() {
		editName = data.profile.name;
		editPosition = data.profile.position || '';
		editPositionRank = data.profile.position_rank || '';
		editEmail = data.profile.email || '';
		editPhone = data.profile.phone || '';
		isEditing = true;
	}
</script>

<div class="profile-page">
	<!-- Header -->
	<div class="profile-header">
		<div class="header-bg"></div>
		<div class="header-content">
			<!-- Avatar Section -->
			<div class="avatar-section">
				<div class="avatar-wrapper">
					{#if data.profile.profile_picture}
						<img src={data.profile.profile_picture} alt={data.profile.name} class="avatar-img" />
					{:else}
						<div class="avatar-placeholder">
							{data.profile.name.charAt(0)}
						</div>
					{/if}
					<form method="POST" action="?/uploadAvatar" enctype="multipart/form-data" use:enhance class="avatar-upload-form">
						<label class="avatar-upload-btn" title="เปลี่ยนรูปโปรไฟล์">
							<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" class="sr-only"
								onchange={(e) => (e.target as HTMLFormElement).form?.requestSubmit()} />
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
							</svg>
						</label>
					</form>
				</div>
				<div class="header-info">
					<h1 class="profile-name">{data.profile.name}</h1>
					<p class="profile-role">{data.roleName || data.profile.position_rank || 'ผู้ใช้งาน'}</p>
					{#if data.agencyName}
						<p class="profile-agency">{data.agencyName}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Toast -->
	{#if formResult?.message}
		<div class="toast-success">{formResult.message}</div>
	{/if}
	{#if formResult?.error}
		<div class="toast-error">{formResult.error}</div>
	{/if}

	<!-- Info Cards -->
	<div class="info-grid">
		<!-- Personal Info -->
		<div class="info-card">
			<div class="card-header">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
					</svg>
				</div>
				<h2 class="card-title">ข้อมูลส่วนตัว</h2>
				{#if !isEditing}
					<button onclick={startEdit} class="edit-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
						</svg>
						แก้ไข
					</button>
				{/if}
			</div>

			{#if isEditing}
				<form method="POST" action="?/updateProfile" use:enhance={() => {
					return async ({ update }) => { isEditing = false; await update(); };
				}}>
					<div class="form-grid">
						<div class="form-field">
							<label class="field-label">ยศ/คำนำหน้า</label>
							<input name="position" bind:value={editPosition} class="field-input" placeholder="เช่น นาย, นาง, นพ." />
						</div>
						<div class="form-field">
							<label class="field-label">ชื่อ-นามสกุล</label>
							<input name="name" bind:value={editName} required class="field-input" />
						</div>
						<div class="form-field">
							<label class="field-label">ระดับตำแหน่ง</label>
							{#if canEditRank}
								<input name="position_rank" bind:value={editPositionRank} class="field-input" placeholder="เช่น เจ้าพนักงานพัสดุชำนาญงาน" />
							{:else}
								<input name="position_rank" value={data.profile.position_rank || ''} readonly class="field-input field-readonly" />
								<p class="field-hint">ผอ./รองผอ. แก้ไขระดับตำแหน่งได้โดย Super Admin เท่านั้น</p>
							{/if}
						</div>
						<div class="form-field">
							<label class="field-label">อีเมล</label>
							<input name="email" type="email" bind:value={editEmail} class="field-input" placeholder="email@example.com" />
						</div>
						<div class="form-field">
							<label class="field-label">เบอร์โทร</label>
							<input name="phone" bind:value={editPhone} class="field-input" placeholder="08x-xxx-xxxx" />
						</div>
					</div>
					<div class="form-actions">
						<button type="button" onclick={() => (isEditing = false)} class="btn-cancel">ยกเลิก</button>
						<button type="submit" class="btn-save">บันทึก</button>
					</div>
				</form>
			{:else}
				<div class="info-rows">
					<div class="info-row">
						<span class="info-label">ยศ/คำนำหน้า</span>
						<span class="info-value">{data.profile.position || '—'}</span>
					</div>
					<div class="info-row">
						<span class="info-label">ชื่อ-นามสกุล</span>
						<span class="info-value">{data.profile.name}</span>
					</div>
					<div class="info-row">
						<span class="info-label">ระดับตำแหน่ง</span>
						<span class="info-value">{data.profile.position_rank || '—'}</span>
					</div>
					<div class="info-row">
						<span class="info-label">อีเมล</span>
						<span class="info-value">{data.profile.email || '—'}</span>
					</div>
					<div class="info-row">
						<span class="info-label">เบอร์โทร</span>
						<span class="info-value">{data.profile.phone || '—'}</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Organization Info (read-only) -->
		<div class="info-card">
			<div class="card-header">
				<div class="card-icon org">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
					</svg>
				</div>
				<h2 class="card-title">ข้อมูลองค์กร</h2>
			</div>
			<div class="info-rows">
				<div class="info-row">
					<span class="info-label">เลขบัตรประชาชน</span>
					<span class="info-value mono">{data.profile.id_card}</span>
				</div>
				<div class="info-row">
					<span class="info-label">บทบาท</span>
					<span class="info-value">{data.roleName || '—'}</span>
				</div>
				<div class="info-row">
					<span class="info-label">หน่วยงาน</span>
					<span class="info-value">{data.agencyName || '—'}</span>
				</div>
				<div class="info-row">
					<span class="info-label">แผนก</span>
					<span class="info-value">{data.orgUnitName || '—'}</span>
				</div>
			</div>
			<p class="readonly-note">ข้อมูลส่วนนี้ไม่สามารถแก้ไขได้</p>
		</div>
	</div>
</div>

<style>
	.profile-page { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1); }

	/* Header */
	.profile-header {
		position: relative;
		border-radius: 18px;
		overflow: hidden;
		margin-bottom: 24px;
	}
	.header-bg {
		height: 120px;
		background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.54 0.16 150));
	}
	.header-content {
		padding: 0 28px 24px;
		margin-top: -40px;
		position: relative;
	}
	.avatar-section { display: flex; align-items: flex-end; gap: 20px; }

	.avatar-wrapper { position: relative; flex-shrink: 0; }
	.avatar-img, .avatar-placeholder {
		width: 88px; height: 88px; border-radius: 50%;
		border: 4px solid oklch(0.995 0.002 180);
		box-shadow: 0 4px 16px oklch(0.52 0.14 240 / 0.15);
	}
	.avatar-img { object-fit: cover; }
	.avatar-placeholder {
		display: flex; align-items: center; justify-content: center;
		background: linear-gradient(135deg, oklch(0.52 0.14 240), oklch(0.54 0.16 150));
		color: oklch(0.98 0.005 180); font-size: 2rem; font-weight: 700;
	}
	.avatar-upload-form { position: absolute; bottom: 0; right: 0; }
	.avatar-upload-btn {
		display: flex; align-items: center; justify-content: center;
		width: 30px; height: 30px; border-radius: 50%;
		background: oklch(0.995 0.002 180);
		border: 2px solid oklch(0.92 0.005 180);
		cursor: pointer;
		box-shadow: 0 2px 6px oklch(0.5 0.02 180 / 0.15);
		transition: background 0.15s ease;
	}
	.avatar-upload-btn:hover { background: oklch(0.52 0.14 240 / 0.08); }
	.avatar-upload-btn svg { width: 14px; height: 14px; color: oklch(0.52 0.14 240); }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

	.header-info { padding-bottom: 4px; }
	.profile-name { margin: 0 0 2px 0; font-size: 1.375rem; font-weight: 700; color: oklch(0.2 0.02 180); }
	.profile-role { margin: 0; font-size: 0.875rem; color: oklch(0.5 0.02 180); }
	.profile-agency { margin: 2px 0 0 0; font-size: 0.75rem; color: oklch(0.6 0.01 180); }

	/* Toast */
	.toast-success { padding: 12px 18px; margin-bottom: 16px; border-radius: 10px; background: oklch(0.54 0.16 150 / 0.08); color: oklch(0.38 0.14 150); font-size: 0.875rem; border-left: 3px solid oklch(0.54 0.16 150); }
	.toast-error { padding: 12px 18px; margin-bottom: 16px; border-radius: 10px; background: oklch(0.58 0.2 25 / 0.08); color: oklch(0.45 0.18 25); font-size: 0.875rem; border-left: 3px solid oklch(0.58 0.2 25); }

	/* Info Cards */
	.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
	.info-card {
		background: oklch(0.995 0.002 180);
		border: 1px solid oklch(0.92 0.005 180);
		border-radius: 16px;
		padding: 24px;
	}
	.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
	.card-icon {
		width: 36px; height: 36px; border-radius: 10px;
		display: flex; align-items: center; justify-content: center;
		background: oklch(0.52 0.14 240 / 0.08); color: oklch(0.52 0.14 240);
	}
	.card-icon.org { background: oklch(0.54 0.16 150 / 0.08); color: oklch(0.54 0.16 150); }
	.card-icon svg { width: 18px; height: 18px; }
	.card-title { margin: 0; font-size: 1rem; font-weight: 600; color: oklch(0.2 0.02 180); flex: 1; }

	.edit-btn {
		display: inline-flex; align-items: center; gap: 4px;
		padding: 5px 12px; border-radius: 8px; border: none;
		background: oklch(0.52 0.14 240 / 0.06);
		color: oklch(0.52 0.14 240); font-size: 0.75rem; font-weight: 500;
		cursor: pointer; font-family: 'Noto Sans Thai', sans-serif;
		transition: background 0.15s ease;
	}
	.edit-btn:hover { background: oklch(0.52 0.14 240 / 0.12); }
	.edit-btn svg { width: 14px; height: 14px; }

	/* Info Rows */
	.info-rows { display: flex; flex-direction: column; gap: 12px; }
	.info-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
	.info-label { font-size: 0.8125rem; color: oklch(0.5 0.02 180); flex-shrink: 0; }
	.info-value { font-size: 0.875rem; font-weight: 500; color: oklch(0.25 0.02 180); text-align: right; }
	.info-value.mono { font-family: 'SF Mono', monospace; letter-spacing: 0.5px; }

	.readonly-note {
		margin: 16px 0 0 0; padding: 10px 14px; border-radius: 8px;
		background: oklch(0.97 0.005 180); font-size: 0.75rem;
		color: oklch(0.55 0.02 180); text-align: center;
	}

	/* Form */
	.form-grid { display: flex; flex-direction: column; gap: 14px; }
	.form-field { display: flex; flex-direction: column; gap: 4px; }
	.field-label { font-size: 0.8125rem; font-weight: 500; color: oklch(0.4 0.02 180); }
	.field-input {
		padding: 9px 14px; border-radius: 10px;
		border: 1px solid oklch(0.82 0.015 180);
		font-family: 'Noto Sans Thai', sans-serif; font-size: 0.875rem;
		color: oklch(0.25 0.02 180); background: oklch(0.995 0.002 180);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	.field-input:focus { outline: none; border-color: oklch(0.52 0.14 240); box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.1); }
	.field-input.field-readonly { background: oklch(0.96 0.003 180); color: oklch(0.5 0.02 180); cursor: not-allowed; }
	.field-hint { margin: 4px 0 0 0; font-size: 0.6875rem; color: oklch(0.55 0.02 180); }

	.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
	.btn-cancel {
		padding: 8px 16px; border-radius: 8px; border: none;
		background: none; color: oklch(0.5 0.02 180); font-size: 0.8125rem;
		font-weight: 500; cursor: pointer; font-family: 'Noto Sans Thai', sans-serif;
	}
	.btn-cancel:hover { background: oklch(0.95 0.005 180); }
	.btn-save {
		padding: 8px 20px; border-radius: 8px; border: none;
		background: oklch(0.52 0.14 240); color: oklch(0.98 0.005 180);
		font-size: 0.8125rem; font-weight: 500; cursor: pointer;
		font-family: 'Noto Sans Thai', sans-serif;
	}
	.btn-save:hover { opacity: 0.9; }

	@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

	@media (max-width: 768px) {
		.info-grid { grid-template-columns: 1fr; }
		.avatar-section { flex-direction: column; align-items: center; text-align: center; }
		.header-content { padding: 0 16px 20px; }
	}
</style>
