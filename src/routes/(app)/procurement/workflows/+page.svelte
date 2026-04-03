<script lang="ts">
	import { enhance } from '$app/forms';
	import BackButton from '$lib/components/BackButton.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { STEP_TYPES, STEP_TYPE_LABELS, COMMITTEE_TYPES, COMMITTEE_LABELS, inferStepType, getStepConfigSummary, type StepType } from '$lib/types/workflow';

	let { data, form: formResult } = $props();
	let showCreateWfModal = $state(false);
	let editingWorkflow = $state<any>(null);
	let expandedId = $state<number | null>(null);

	// Step creation state
	let showStepModal = $state(false);
	let stepWorkflowId = $state<number | null>(null);
	let stepName = $state('');
	let stepType = $state<StepType | null>(null);
	let stepIsFinal = $state(false);
	let insertAfterSeq = $state(0); // 0 = append at end

	// Template configs
	let approverIds = $state<number[]>([]);
	let uploadMode = $state<'single' | 'multi'>('single');
	let requiredPdfs = $state<string[]>(['']);
	let committeeTypes = $state<string[]>([]);
	let minVendors = $state(3);

	function getSteps(workflowId: number) {
		return data.steps.filter((s: any) => s.workflow_id === workflowId).sort((a: any, b: any) => a.step_sequence - b.step_sequence);
	}

	function openStepModal(wfId: number, afterSeq: number = 0) {
		stepWorkflowId = wfId;
		stepName = '';
		stepType = null;
		stepIsFinal = false;
		insertAfterSeq = afterSeq;
		approverIds = [];
		uploadMode = 'single';
		requiredPdfs = [''];
		committeeTypes = [];
		minVendors = 3;
		showStepModal = true;
	}

	function buildTemplateConfig(): string {
		if (!stepType) return '{}';
		switch (stepType) {
			case 'APPROVAL':
				return JSON.stringify({
					approvers: approverIds.map((uid) => {
						const u = data.users.find((u: any) => u.id === uid);
						return { user_id: uid, name: u?.name || '' };
					})
				});
			case 'DOCUMENT_UPLOAD':
				return JSON.stringify({
					upload_mode: uploadMode,
					required_pdfs: requiredPdfs.filter((p) => p.trim())
				});
			case 'COMMITTEE':
				return JSON.stringify({ committee_types: committeeTypes });
			case 'VENDOR_SCORING':
				return JSON.stringify({ min_vendors: minVendors });
		}
	}

	function addPdfField() { requiredPdfs = [...requiredPdfs, '']; }
	function removePdfField(i: number) { requiredPdfs = requiredPdfs.filter((_, idx) => idx !== i); }

	function toggleCommitteeType(ct: string) {
		if (committeeTypes.includes(ct)) committeeTypes = committeeTypes.filter((c) => c !== ct);
		else committeeTypes = [...committeeTypes, ct];
	}

	function toggleApprover(uid: number) {
		if (approverIds.includes(uid)) approverIds = approverIds.filter((id) => id !== uid);
		else if (approverIds.length < 5) approverIds = [...approverIds, uid];
	}
</script>

<div>
	<BackButton href="/procurement" label="กลับหน้าจัดซื้อจัดจ้าง" />

	<div class="page-header">
		<div>
			<h1 class="page-title">จัดการวิธีจัดซื้อจัดจ้าง</h1>
			<p class="page-subtitle">
				สร้าง แก้ไข วิธีการจัดซื้อและกำหนดขั้นตอน
				<span class="item-count">{data.workflows.length} วิธี</span>
			</p>
		</div>
		<button onclick={() => (showCreateWfModal = true)} class="btn-primary">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
			เพิ่มวิธีจัดซื้อ
		</button>
	</div>

	{#if formResult?.message}
		<div class="toast-success">{formResult.message}</div>
	{/if}
	{#if formResult?.error}
		<div class="toast-error">{formResult.error}</div>
	{/if}

	<!-- Workflow List -->
	<div class="wf-list">
		{#each data.workflows as wf}
			{@const steps = getSteps(wf.id)}
			<div class="wf-card" class:expanded={expandedId === wf.id}>
				<div class="wf-header">
					<button class="wf-toggle" onclick={() => (expandedId = expandedId === wf.id ? null : wf.id)}>
						<svg class="toggle-icon" class:rotated={expandedId === wf.id} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
					<div class="wf-info">
						<h3 class="wf-name">{wf.name}</h3>
						<span class="wf-meta">{steps.length} ขั้นตอน</span>
					</div>
					<div class="wf-actions">
						<button onclick={() => (editingWorkflow = wf)} class="act-btn edit">แก้ไข</button>
						<button onclick={() => openStepModal(wf.id)} class="act-btn add">+ ขั้นตอน</button>
						<form method="POST" action="?/deleteWorkflow" use:enhance class="inline-form">
							<input type="hidden" name="id" value={wf.id} />
							<button type="submit" onclick={(e) => { if (!confirm(`ลบ "${wf.name}"?`)) e.preventDefault(); }} class="act-btn del">ลบ</button>
						</form>
					</div>
				</div>

				{#if expandedId === wf.id}
					<div class="steps-panel">
						{#if steps.length === 0}
							<div class="steps-empty">ยังไม่มีขั้นตอน — กดปุ่ม "+ ขั้นตอน" เพื่อเพิ่ม</div>
						{:else}
							<div class="steps-tl">
								{#each steps as step, i}
									{@const stype = inferStepType(step.ui_schema)}
									{@const stypeInfo = stype ? STEP_TYPE_LABELS[stype] : null}
									<div class="tl-item">
										<div class="tl-connector">
											<div class="tl-dot" style={stypeInfo ? `background: ${stypeInfo.color};` : ''}>
												{step.step_sequence}
											</div>
											<div class="tl-line-area">
												<div class="tl-line"></div>
												<!-- Insert button between steps -->
												<button
													type="button"
													class="insert-btn"
													title="แทรกขั้นตอนหลังขั้นที่ {step.step_sequence}"
													onclick={() => openStepModal(wf.id, step.step_sequence)}
												>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
												</button>
											</div>
										</div>
										<div class="tl-content">
											<div class="tl-row">
												<div>
													<h4 class="tl-name">{step.step_name}</h4>
													<div class="tl-badges">
														{#if stypeInfo}
															<span class="type-badge" style="background: {stypeInfo.bg}; color: {stypeInfo.color};">{stypeInfo.label}</span>
														{/if}
														{#if step.is_final_step}
															<span class="final-badge">ขั้นตอนสุดท้าย</span>
														{/if}
													</div>
													{#if stype}
														<p class="tl-summary">{getStepConfigSummary(step.ui_schema, stype)}</p>
													{/if}
												</div>
												<form method="POST" action="?/deleteStep" use:enhance class="inline-form">
													<input type="hidden" name="id" value={step.id} />
													<button type="submit" onclick={(e) => { if (!confirm('ลบขั้นตอนนี้?')) e.preventDefault(); }} class="step-del">
														<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
													</button>
												</form>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="empty-state">ยังไม่มีวิธีจัดซื้อจัดจ้างในระบบ</div>
		{/each}
	</div>
</div>

<!-- Create Workflow Modal -->
{#if showCreateWfModal}
	<div class="modal-bg" onclick={() => (showCreateWfModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-title">เพิ่มวิธีจัดซื้อจัดจ้าง</h2>
			<form method="POST" action="?/createWorkflow" use:enhance={() => { return async ({ update }) => { showCreateWfModal = false; await update(); }; }}>
				<div class="modal-body">
					<div class="ff">
						<label class="fl">ชื่อวิธีจัดซื้อ <span class="req">*</span></label>
						<input name="name" required class="fi" placeholder="เช่น วิธีเฉพาะเจาะจง" />
					</div>
				</div>
				<div class="modal-foot">
					<button type="button" onclick={() => (showCreateWfModal = false)} class="btn-ghost">ยกเลิก</button>
					<button type="submit" class="btn-primary">สร้าง</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Workflow Modal -->
{#if editingWorkflow}
	<div class="modal-bg" onclick={() => (editingWorkflow = null)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-title">แก้ไขวิธีจัดซื้อจัดจ้าง</h2>
			<form method="POST" action="?/updateWorkflow" use:enhance={() => { return async ({ update }) => { editingWorkflow = null; await update(); }; }}>
				<input type="hidden" name="id" value={editingWorkflow.id} />
				<div class="modal-body">
					<div class="ff"><label class="fl">ชื่อ</label><input name="name" value={editingWorkflow.name} required class="fi" /></div>
				</div>
				<div class="modal-foot">
					<button type="button" onclick={() => (editingWorkflow = null)} class="btn-ghost">ยกเลิก</button>
					<button type="submit" class="btn-primary">บันทึก</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Add Step Modal (with template) -->
{#if showStepModal && stepWorkflowId}
	<div class="modal-bg" onclick={() => (showStepModal = false)}>
		<div class="modal modal-lg" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-title">เพิ่มขั้นตอน</h2>
			<form method="POST" action="?/createStep" use:enhance={() => { return async ({ update }) => { showStepModal = false; await update(); }; }}>
				<input type="hidden" name="workflow_id" value={stepWorkflowId} />
				<input type="hidden" name="template_config" value={buildTemplateConfig()} />
				<input type="hidden" name="is_final_step" value={stepIsFinal ? 'true' : 'false'} />
				<input type="hidden" name="step_type" value={stepType || ''} />
				<input type="hidden" name="insert_after" value={insertAfterSeq} />

				<div class="modal-body">
					<!-- Step Name -->
					<div class="ff">
						<label class="fl">ชื่อขั้นตอน <span class="req">*</span></label>
						<input name="step_name" required bind:value={stepName} class="fi" placeholder="เช่น จัดทำรายงานขอซื้อขอจ้าง" />
					</div>

					<!-- Insert Position -->
					{#if stepWorkflowId && getSteps(stepWorkflowId).length > 0}
						<div class="ff">
							<label class="fl">ตำแหน่งที่จะแทรก</label>
							<select class="fi" bind:value={insertAfterSeq}>
								<option value={0}>เพิ่มท้ายสุด (ขั้นตอนที่ {getSteps(stepWorkflowId).length + 1})</option>
								<option value={-1}>เพิ่มก่อนขั้นตอนที่ 1</option>
								{#each getSteps(stepWorkflowId) as s}
									<option value={s.step_sequence}>แทรกหลังขั้นที่ {s.step_sequence}: {s.step_name}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Step Type Selection -->
					<div class="ff">
						<label class="fl">ประเภทขั้นตอน <span class="req">*</span></label>
						<div class="type-grid">
							{#each STEP_TYPES as t}
								{@const info = STEP_TYPE_LABELS[t]}
								<button type="button" class="type-card" class:type-selected={stepType === t} onclick={() => (stepType = t)} style={stepType === t ? `border-color: ${info.color}; background: ${info.bg};` : ''}>
									<span class="type-card-label" style={stepType === t ? `color: ${info.color};` : ''}>{info.label}</span>
									<span class="type-card-desc">{info.desc}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Template Config -->
					{#if stepType === 'APPROVAL'}
						<div class="config-box">
							<h4 class="config-title">เลือกผู้อนุมัติ (สูงสุด 5 คน)</h4>
							<div class="user-list">
								{#each data.users as u}
									<label class="user-item" class:user-selected={approverIds.includes(u.id)}>
										<input type="checkbox" checked={approverIds.includes(u.id)} onchange={() => toggleApprover(u.id)} class="user-check" />
										<span class="user-name">{u.name}</span>
										{#if u.position}
											<span class="user-pos">{u.position}</span>
										{/if}
									</label>
								{/each}
							</div>
							{#if approverIds.length >= 5}
								<p class="config-hint">เลือกได้สูงสุด 5 คน</p>
							{/if}
						</div>
					{:else if stepType === 'DOCUMENT_UPLOAD'}
						<div class="config-box">
							<h4 class="config-title">กำหนดเอกสาร</h4>
							<div class="ff">
								<label class="fl">รูปแบบอัปโหลด</label>
								<div class="radio-row">
									<label class="radio-item">
										<input type="radio" name="_upload_mode" value="single" checked={uploadMode === 'single'} onchange={() => (uploadMode = 'single')} />
										<span>ไฟล์เดียว</span>
									</label>
									<label class="radio-item">
										<input type="radio" name="_upload_mode" value="multi" checked={uploadMode === 'multi'} onchange={() => (uploadMode = 'multi')} />
										<span>หลายไฟล์</span>
									</label>
								</div>
							</div>
							<div class="ff">
								<label class="fl">รายชื่อเอกสารที่ต้องอัปโหลด</label>
								{#each requiredPdfs as pdf, i}
									<div class="pdf-row">
										<input class="fi" placeholder="ชื่อเอกสาร เช่น รายงานขอซื้อขอจ้าง" bind:value={requiredPdfs[i]} />
										{#if requiredPdfs.length > 1}
											<button type="button" onclick={() => removePdfField(i)} class="pdf-remove">
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
											</button>
										{/if}
									</div>
								{/each}
								<button type="button" onclick={addPdfField} class="add-pdf-btn">+ เพิ่มเอกสาร</button>
							</div>
						</div>
					{:else if stepType === 'COMMITTEE'}
						<div class="config-box">
							<h4 class="config-title">เลือกประเภทคณะกรรมการ</h4>
							<div class="ct-grid">
								{#each COMMITTEE_TYPES as ct}
									<label class="ct-item" class:ct-selected={committeeTypes.includes(ct)}>
										<input type="checkbox" checked={committeeTypes.includes(ct)} onchange={() => toggleCommitteeType(ct)} class="user-check" />
										<span>{COMMITTEE_LABELS[ct]}</span>
									</label>
								{/each}
							</div>
						</div>
					{:else if stepType === 'VENDOR_SCORING'}
						<div class="config-box">
							<h4 class="config-title">กำหนดเงื่อนไข Vendor</h4>
							<div class="ff">
								<label class="fl">จำนวน vendor ขั้นต่ำ</label>
								<input type="number" min="1" max="20" bind:value={minVendors} class="fi fi-sm" />
							</div>
						</div>
					{/if}

					<!-- Final step toggle -->
					<label class="check-row">
						<input type="checkbox" bind:checked={stepIsFinal} class="user-check" />
						<span>ขั้นตอนสุดท้าย (เมื่อผ่านจะส่งเรื่องเบิกจ่าย)</span>
					</label>
				</div>

				<div class="modal-foot">
					<button type="button" onclick={() => (showStepModal = false)} class="btn-ghost">ยกเลิก</button>
					<button type="submit" disabled={!stepName || !stepType} class="btn-primary">เพิ่มขั้นตอน</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* ── Page Header ── */
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin: 20px 0 24px; gap: 16px; }
	.page-title { margin: 0 0 4px 0; font-size: clamp(1.375rem, 1.1rem + 0.7vw, 1.625rem); font-weight: 700; color: oklch(0.2 0.02 180); }
	.page-subtitle { margin: 0; font-size: 0.875rem; color: oklch(0.5 0.02 180); display: flex; align-items: center; gap: 10px; }
	.item-count { padding: 2px 10px; border-radius: 6px; background: oklch(0.55 0.12 280 / 0.08); color: oklch(0.45 0.1 280); font-size: 0.75rem; font-weight: 600; }

	/* ── Buttons ── */
	.btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 10px; border: none; background: oklch(0.52 0.14 240); color: oklch(0.98 0.005 180); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
	.btn-primary:hover { opacity: 0.88; }
	.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-ghost { padding: 8px 16px; border-radius: 10px; border: none; background: none; color: oklch(0.45 0.02 180); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
	.btn-ghost:hover { background: oklch(0.95 0.005 180); }
	.btn-icon { width: 16px; height: 16px; }

	/* ── Toast ── */
	.toast-success { padding: 12px 18px; margin-bottom: 12px; border-radius: 10px; background: oklch(0.54 0.16 150 / 0.08); color: oklch(0.38 0.14 150); font-size: 0.875rem; border-left: 3px solid oklch(0.54 0.16 150); }
	.toast-error { padding: 12px 18px; margin-bottom: 12px; border-radius: 10px; background: oklch(0.58 0.2 25 / 0.08); color: oklch(0.45 0.18 25); font-size: 0.875rem; border-left: 3px solid oklch(0.58 0.2 25); }

	/* ── Workflow List ── */
	.wf-list { display: flex; flex-direction: column; gap: 12px; }
	.wf-card { border-radius: 14px; border: 1px solid oklch(0.92 0.005 180); background: oklch(0.995 0.002 180); overflow: hidden; transition: box-shadow 0.15s ease; }
	.wf-card:hover { box-shadow: 0 4px 16px oklch(0.52 0.14 240 / 0.06); }
	.wf-card.expanded { border-color: oklch(0.52 0.14 240 / 0.15); }

	.wf-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; }
	.wf-toggle { width: 28px; height: 28px; border-radius: 8px; border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: oklch(0.5 0.02 180); flex-shrink: 0; }
	.wf-toggle:hover { background: oklch(0.92 0.005 180); }
	.toggle-icon { width: 14px; height: 14px; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
	.toggle-icon.rotated { transform: rotate(90deg); }
	.wf-info { flex: 1; min-width: 0; }
	.wf-name { margin: 0; font-size: 1rem; font-weight: 600; color: oklch(0.2 0.02 180); }
	.wf-meta { font-size: 0.8125rem; color: oklch(0.5 0.02 180); }
	.wf-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s ease; flex-shrink: 0; }
	.wf-card:hover .wf-actions { opacity: 1; }
	.act-btn { padding: 5px 12px; border-radius: 8px; border: none; background: none; font-size: 0.8125rem; font-weight: 500; cursor: pointer; }
	.act-btn.edit { color: oklch(0.52 0.14 240); }
	.act-btn.edit:hover { background: oklch(0.52 0.14 240 / 0.08); }
	.act-btn.add { color: oklch(0.54 0.16 150); }
	.act-btn.add:hover { background: oklch(0.54 0.16 150 / 0.08); }
	.act-btn.del { color: oklch(0.58 0.2 25); }
	.act-btn.del:hover { background: oklch(0.58 0.2 25 / 0.08); }
	.inline-form { display: inline; }

	/* ── Steps Panel ── */
	.steps-panel { border-top: 1px solid oklch(0.92 0.005 180); padding: 20px 20px 20px 60px; animation: expand 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
	.steps-empty { text-align: center; padding: 20px; font-size: 0.875rem; color: oklch(0.55 0.02 180); }

	/* Timeline */
	.steps-tl { display: flex; flex-direction: column; }
	.tl-item { display: flex; gap: 16px; }
	.tl-connector { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
	.tl-dot { width: 28px; height: 28px; border-radius: 50%; background: oklch(0.52 0.14 240); color: oklch(0.98 0.005 180); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }
	.tl-line-area { position: relative; display: flex; flex-direction: column; align-items: center; flex: 1; min-height: 20px; }
	.tl-line { width: 2px; flex: 1; background: oklch(0.88 0.01 180); }
	.insert-btn {
		position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
		width: 20px; height: 20px; border-radius: 50%;
		border: 1.5px dashed oklch(0.52 0.14 240 / 0.4); background: oklch(0.98 0.005 180);
		color: oklch(0.52 0.14 240); cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		opacity: 0; transition: opacity 0.15s ease, transform 0.15s ease;
	}
	.insert-btn svg { width: 12px; height: 12px; }
	.tl-item:hover .insert-btn { opacity: 1; }
	.insert-btn:hover { opacity: 1; border-style: solid; background: oklch(0.52 0.14 240 / 0.08); transform: translate(-50%, -50%) scale(1.15); }
	.tl-content { flex: 1; padding-bottom: 16px; }
	.tl-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
	.tl-name { margin: 0 0 4px 0; font-size: 0.9375rem; font-weight: 500; color: oklch(0.2 0.02 180); line-height: 28px; }
	.tl-badges { display: flex; gap: 6px; flex-wrap: wrap; }
	.type-badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
	.final-badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: 4px; background: oklch(0.54 0.16 150 / 0.12); color: oklch(0.4 0.14 150); font-weight: 500; }
	.tl-summary { margin: 4px 0 0 0; font-size: 0.75rem; color: oklch(0.5 0.02 180); }
	.step-del { width: 24px; height: 24px; border-radius: 6px; border: none; background: none; color: oklch(0.6 0.01 180); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.step-del svg { width: 14px; height: 14px; }
	.step-del:hover { background: oklch(0.58 0.2 25 / 0.08); color: oklch(0.58 0.2 25); }

	.empty-state { text-align: center; padding: 48px 24px; font-size: 0.9375rem; color: oklch(0.55 0.02 180); background: oklch(0.98 0.005 180); border: 1px solid oklch(0.92 0.005 180); border-radius: 14px; }

	/* ── Modal ── */
	.modal-bg { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: oklch(0.15 0.02 180 / 0.5); backdrop-filter: blur(4px); }
	.modal { width: 100%; max-width: 520px; background: oklch(0.995 0.002 180); border-radius: 18px; padding: 28px; box-shadow: 0 20px 60px oklch(0.15 0.02 180 / 0.2); animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); max-height: 90vh; overflow-y: auto; }
	.modal-lg { max-width: 640px; }
	.modal-title { margin: 0 0 20px 0; font-size: 1.125rem; font-weight: 600; color: oklch(0.2 0.02 180); }
	.modal-body { display: flex; flex-direction: column; gap: 18px; }
	.modal-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid oklch(0.92 0.005 180); }

	/* Form */
	.ff { display: flex; flex-direction: column; gap: 6px; }
	.fl { font-size: 0.8125rem; font-weight: 500; color: oklch(0.35 0.02 180); }
	.req { color: oklch(0.58 0.2 25); }
	.fi { padding: 10px 14px; border: 1px solid oklch(0.82 0.015 180); border-radius: 10px; background: oklch(0.995 0.002 180); font-family: 'Noto Sans Thai', sans-serif; font-size: 0.9375rem; color: oklch(0.25 0.02 180); }
	.fi:focus { outline: none; border-color: oklch(0.52 0.14 240); box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.12); }
	.fi-sm { max-width: 120px; }

	/* ── Step Type Grid ── */
	.type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
	.type-card { padding: 14px; border-radius: 12px; border: 2px solid oklch(0.92 0.005 180); background: oklch(0.995 0.002 180); cursor: pointer; text-align: left; transition: border-color 0.15s ease, background 0.15s ease; }
	.type-card:hover { border-color: oklch(0.82 0.015 180); }
	.type-selected { border-width: 2px; }
	.type-card-label { display: block; font-size: 0.875rem; font-weight: 600; color: oklch(0.3 0.02 180); margin-bottom: 2px; }
	.type-card-desc { display: block; font-size: 0.75rem; color: oklch(0.5 0.02 180); }

	/* ── Config Box ── */
	.config-box { padding: 16px; border-radius: 12px; background: oklch(0.97 0.005 180); border: 1px solid oklch(0.92 0.005 180); display: flex; flex-direction: column; gap: 12px; }
	.config-title { margin: 0; font-size: 0.875rem; font-weight: 600; color: oklch(0.3 0.02 180); }
	.config-hint { margin: 0; font-size: 0.75rem; color: oklch(0.62 0.18 60); }

	/* User list (approvers) */
	.user-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
	.user-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 0.8125rem; transition: background 0.1s ease; }
	.user-item:hover { background: oklch(0.94 0.005 180); }
	.user-selected { background: oklch(0.62 0.18 60 / 0.08); }
	.user-check { width: 16px; height: 16px; accent-color: oklch(0.52 0.14 240); flex-shrink: 0; }
	.user-name { font-weight: 500; color: oklch(0.25 0.02 180); }
	.user-pos { font-size: 0.75rem; color: oklch(0.5 0.02 180); }

	/* Radio */
	.radio-row { display: flex; gap: 16px; }
	.radio-item { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; color: oklch(0.35 0.02 180); cursor: pointer; }
	.radio-item input { accent-color: oklch(0.52 0.14 240); }

	/* PDF rows */
	.pdf-row { display: flex; gap: 8px; align-items: center; margin-top: 6px; }
	.pdf-row .fi { flex: 1; }
	.pdf-remove { width: 28px; height: 28px; border-radius: 6px; border: none; background: none; color: oklch(0.55 0.02 180); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.pdf-remove svg { width: 14px; height: 14px; }
	.pdf-remove:hover { background: oklch(0.58 0.2 25 / 0.08); color: oklch(0.58 0.2 25); }
	.add-pdf-btn { align-self: flex-start; margin-top: 4px; padding: 4px 12px; border-radius: 6px; border: 1px dashed oklch(0.82 0.015 180); background: none; color: oklch(0.52 0.14 240); font-size: 0.8125rem; cursor: pointer; }
	.add-pdf-btn:hover { background: oklch(0.52 0.14 240 / 0.04); }

	/* Committee grid */
	.ct-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
	.ct-item { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; border: 1px solid oklch(0.92 0.005 180); cursor: pointer; font-size: 0.8125rem; color: oklch(0.3 0.02 180); transition: background 0.1s ease; }
	.ct-item:hover { background: oklch(0.95 0.005 180); }
	.ct-selected { background: oklch(0.55 0.12 280 / 0.06); border-color: oklch(0.55 0.12 280 / 0.3); }

	/* Check row */
	.check-row { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: oklch(0.35 0.02 180); cursor: pointer; }

	@keyframes expand { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
	@keyframes scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

	@media (max-width: 768px) { .page-header { flex-direction: column; } .wf-actions { opacity: 1; } .steps-panel { padding-left: 20px; } .type-grid { grid-template-columns: 1fr; } .ct-grid { grid-template-columns: 1fr; } }
</style>
