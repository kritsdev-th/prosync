<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { formatThaiDateTime, formatBaht, formatNumber } from '$lib/utils/format';
	import { goto } from '$app/navigation';

	let { data, form: formResult } = $props();

	// After successful step advance or approval, redirect if user can't act on next step
	function handleStepComplete() {
		return async ({ result, update }: any) => {
			if (result.type === 'success') {
				// Redirect to tasks page since the step has moved on
				window.location.href = '/procurement/tasks';
				return;
			}
			await update();
		};
	}

	// Check if current user already approved/rejected this step
	let hasAlreadyApproved = $derived(
		data.currentStep
			? data.approvals.some((a: any) => a.step_id === data.currentStep?.id && a.user_name === data.user.name)
			: false
	);

	function getStepStatus(step: any): 'completed' | 'current' | 'rejected' | 'upcoming' | 'disabled' {
		const isRejected = data.document.status === 'REJECTED';

		if (isRejected) {
			// Find which step was rejected via approvals
			const rejectedApproval = data.approvals.find((a: any) => a.action === 'REJECTED');
			const rejectedStepId = rejectedApproval?.step_id;

			if (rejectedStepId) {
				const rejectedStep = data.steps.find((s: any) => s.id === rejectedStepId);
				if (rejectedStep) {
					if (step.step_sequence < rejectedStep.step_sequence) return 'completed';
					if (step.id === rejectedStepId) return 'rejected';
					return 'disabled'; // steps after rejected = gray
				}
			}
			// Fallback: current step is the rejected one
			if (!data.currentStep) return 'disabled';
			if (step.step_sequence < data.currentStep.step_sequence) return 'completed';
			if (step.id === data.currentStep.id) return 'rejected';
			return 'disabled';
		}

		if (!data.currentStep) return 'upcoming';
		if (step.step_sequence < data.currentStep.step_sequence) return 'completed';
		if (step.id === data.currentStep.id) return 'current';
		return 'upcoming'; // not yet reached = blue
	}

	function getPayloadForStep(stepSequence: number) {
		const payload = data.document.payload as Record<string, unknown>;
		const key = Object.keys(payload).find((k) => k.startsWith(`step_${stepSequence}_`));
		return key ? payload[key] : null;
	}

	let uiSchema = $derived(data.currentStep?.ui_schema as any);
</script>

<div>
	<div class="mb-6">
		<BackButton href="/procurement/documents" label="กลับหน้าเอกสารดำเนินการ" />
		<h1 style="margin: 8px 0 4px 0; font-size: clamp(1.375rem, 1.1rem + 0.7vw, 1.625rem); font-weight: 700; color: oklch(0.2 0.02 180);">เอกสาร #{data.document.id}</h1>
		<p class="text-sm text-gray-500">
			{data.workflow.name} | แผน: {data.plan.title}
		</p>
		<div class="mt-2">
			<StatusBadge status={data.document.status} />
		</div>
	</div>

	{#if formResult?.message}
		<div class="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{formResult.message}</div>
	{/if}

	<!-- Step Progress -->
	<div class="step-progress-container">
		<div class="step-progress-track">
			{#each data.steps as step, i}
				{@const status = getStepStatus(step)}
				{@const isLast = i === data.steps.length - 1}
				<div class="step-item">
					<div class="step-indicator-row">
						<div class="step-circle step-circle--{status}">
							{#if status === 'completed'}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							{:else if status === 'rejected'}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							{:else}
								{step.step_sequence}
							{/if}
						</div>
						{#if !isLast}
							<div class="step-connector step-connector--{status}"></div>
						{/if}
					</div>
					<p class="step-label step-label--{status}">
						{step.step_name}
					</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Current Step Actions -->
	{#if data.currentStep && data.document.status === 'IN_PROGRESS'}
		<div class="rounded-xl border bg-white p-6 shadow-sm">
			<h2 class="text-lg font-bold text-gray-900">
				ขั้นตอนที่ {data.currentStep.step_sequence}: {data.currentStep.step_name}
			</h2>

			{#if !data.canActOnStep}
				<div class="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
					ขั้นตอนนี้รอผู้ที่มีสิทธิ์ดำเนินการ — คุณสามารถดูสถานะได้แต่ไม่สามารถดำเนินการในขั้นนี้ได้
				</div>
			{/if}

			{#if uiSchema?.components && data.canActOnStep}
				<div class="mt-4 space-y-4">
					{#each uiSchema.components as comp}
						{@const compType = typeof comp === 'string' ? comp : comp.type}

						{#if compType === 'budget_input'}
							<div>
								<label for="budget_amount" class="block text-sm font-medium text-gray-700">วงเงินงบประมาณ (บาท)</label>
								<input type="number" step="0.01" id="budget_amount" value={data.plan.estimated_amount} readonly class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600" />
								<p class="mt-1 text-xs text-gray-400">อิงจากงบประมาณคาดการณ์ในแผนงาน "{data.plan.title}"</p>
							</div>
						{/if}

						{#if compType === 'single_pdf_uploader' || compType === 'multi_pdf_uploader'}
							<div class="pdf-upload-box">
								<label class="block text-sm font-medium text-gray-700">
									อัปโหลดไฟล์ PDF
									{#if uiSchema?.required_pdfs?.length}
										<span class="text-xs text-gray-400 ml-1">({uiSchema.required_pdfs.join(', ')})</span>
									{/if}
								</label>
								<input type="file" name="pdf_file" accept=".pdf" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:text-blue-600" />
								<p class="mt-1 text-xs text-gray-400">รองรับไฟล์ PDF สูงสุด 20MB — ไฟล์จะถูกบันทึกเข้าระบบ</p>
							</div>
						{/if}

						{#if compType === 'committee_selector'}
							{@const committeeType = comp.committee_type}
							<div class="rounded-lg border p-4">
								<h3 class="font-medium text-gray-800">
									คณะกรรมการ: {committeeType}
								</h3>
								{#each data.committees.filter((c) => c.committee_type === committeeType) as member}
									<div class="mt-2 flex items-center gap-2 text-sm">
										<span class="font-medium">{member.user_name}</span>
										<span class="text-gray-500">({member.role_in_committee})</span>
										<form method="POST" action="?/removeCommittee" use:enhance class="inline">
											<input type="hidden" name="committee_id" value={member.id} />
											<button type="submit" class="ml-1 rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600" title="ลบ"
												onclick={(e) => { if (!confirm(`ลบ "${member.user_name}" ออกจากคณะกรรมการ?`)) e.preventDefault(); }}>
												<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
											</button>
										</form>
									</div>
								{/each}
								<form method="POST" action="?/addCommittee" use:enhance class="mt-3 flex gap-2">
									<input type="hidden" name="committee_type" value={committeeType} />
									<CustomSelect
										name="user_id"
										required
										placeholder="-- เลือกบุคคล --"
										class="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
										options={data.users.map((u) => ({ value: String(u.id), label: u.name }))}
									/>
									<input name="role_in_committee" placeholder="ตำแหน่งในคณะ" required class="rounded-lg border border-gray-300 px-2 py-1 text-sm" />
									<button type="submit" class="rounded-lg bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">เพิ่ม</button>
								</form>
							</div>
						{/if}

						{#if compType === 'vendor_multi_selector'}
							<div class="rounded-lg border p-4">
								<h3 class="font-medium text-gray-800">เลือกผู้ประกอบการ {uiSchema.min_vendors ? `(ขั้นต่ำ ${uiSchema.min_vendors} ราย)` : ''}</h3>
								{#each data.bidders as bidder}
									<div class="mt-2 text-sm">{bidder.vendor_name} - {bidder.proposed_price ? formatBaht(bidder.proposed_price) : 'รอเสนอราคา'}</div>
								{/each}
								<form method="POST" action="?/addBidder" use:enhance class="mt-3 flex gap-2">
									<CustomSelect
										name="vendor_id"
										required
										placeholder="-- เลือก Vendor --"
										class="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
										options={data.vendors.map((v) => ({ value: String(v.id), label: `${v.company_name} (${v.tax_id})` }))}
									/>
									<button type="submit" class="rounded-lg bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">เพิ่ม</button>
								</form>
							</div>
						{/if}

						{#if compType === 'vendor_proposal_receiver'}
							<div class="rounded-lg border p-4">
								<h3 class="font-medium text-gray-800">รับซองข้อเสนอ</h3>
								{#each data.bidders as bidder}
									<form method="POST" action="?/addBidder" use:enhance class="mt-2 flex items-center gap-2 text-sm">
										<input type="hidden" name="vendor_id" value={bidder.vendor_id} />
										<span class="w-40">{bidder.vendor_name}</span>
										<input name="proposed_price" type="number" step="0.01" placeholder="ราคาที่เสนอ (บาท)" value={bidder.proposed_price || ''} class="rounded border px-2 py-1 text-sm" />
										<button type="submit" class="rounded bg-blue-600 px-2 py-1 text-xs text-white">บันทึก</button>
									</form>
								{/each}
							</div>
						{/if}

						{#if compType === 'bidders_scoring_board'}
							<div class="rounded-lg border p-4">
								<h3 class="font-medium text-gray-800">ตารางให้คะแนน</h3>
								<table class="mt-2 w-full text-sm">
									<thead>
										<tr class="border-b">
											<th class="px-2 py-1 text-left">บริษัท</th>
											<th class="px-2 py-1 text-right">ราคาเสนอ (บาท)</th>
											<th class="px-2 py-1 text-center">คะแนน</th>
											<th class="px-2 py-1"></th>
										</tr>
									</thead>
									<tbody>
										{#each data.bidders as bidder}
											<tr class="border-b">
												<td class="px-2 py-1">{bidder.vendor_name}</td>
												<td class="px-2 py-1 text-right font-mono">{bidder.proposed_price ? formatNumber(bidder.proposed_price) : '-'}</td>
												<td class="px-2 py-1 text-center">
													<form method="POST" action="?/updateBidderScore" use:enhance class="inline-flex gap-1">
														<input type="hidden" name="bidder_id" value={bidder.id} />
														<input name="score" type="number" step="0.01" value={bidder.score || ''} class="w-16 rounded border px-1 py-0.5 text-center text-sm" />
														<label class="flex items-center gap-1 text-xs">
															<input type="checkbox" name="is_winner" value="true" checked={bidder.is_winner} />
															ชนะ
														</label>
														<button type="submit" class="rounded bg-blue-600 px-2 py-0.5 text-xs text-white">บันทึก</button>
													</form>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}

						{#if compType === 'approval_summary'}
							<div class="rounded-lg border p-4">
								<h3 class="font-medium text-gray-800">สรุปผลเพื่ออนุมัติ</h3>
								<div class="mt-2 text-sm text-gray-600">
									<p>แผนงาน: {data.plan.title}</p>
									<p>งบประมาณ: {formatBaht(data.plan.estimated_amount)}</p>
									{#each data.bidders.filter((b) => b.is_winner) as winner}
										<p class="mt-1 font-medium text-green-700">ผู้ชนะ: {winner.vendor_name} ({formatBaht(winner.proposed_price || 0)})</p>
									{/each}
								</div>
								<!-- Show uploaded documents from previous steps for review -->
								{#each [Object.entries((data.document.payload as Record<string, any>) || {}).filter(([, v]) => v?.uploaded_pdf)] as prevDocs}
								{#if prevDocs.length > 0}
									<div class="mt-3 rounded-lg bg-gray-50 p-3">
										<p class="text-xs font-medium text-gray-500 mb-2">เอกสารประกอบจากขั้นตอนก่อนหน้า:</p>
										{#each prevDocs as [key, val]}
											<a href={val.uploaded_pdf} target="_blank" class="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-1">
												<svg class="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
												{val.uploaded_filename || key.replace(/^step_\d+_/, '')}
											</a>
										{/each}
									</div>
								{/if}
								{/each}
								{#if hasAlreadyApproved}
									<div class="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
										คุณได้อนุมัติ/ตรวจสอบขั้นตอนนี้ไปแล้ว
									</div>
								{:else}
									<form method="POST" action="?/approve" use:enhance={handleStepComplete} class="mt-4 space-y-3">
										<input type="hidden" name="step_id" value={data.currentStep?.id} />
										<div>
											<label for="approval-comment" class="block text-sm font-medium text-gray-700">หมายเหตุ</label>
											<textarea id="approval-comment" name="comment" placeholder="หมายเหตุ (บังคับเมื่อปฏิเสธ)" rows="2" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"></textarea>
										</div>
										<div class="flex gap-2">
											<button type="submit" name="action" value="APPROVED" class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">อนุมัติ</button>
											<button type="submit" name="action" value="REJECTED" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">ปฏิเสธ</button>
										</div>
									</form>
								{/if}
							</div>
						{/if}

						{#if compType === 'contract_details_form'}
							<div>
								<label for="contract_no" class="block text-sm font-medium text-gray-700">เลขที่สัญญา</label>
								<input type="text" id="contract_no" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label for="contract_start" class="block text-sm font-medium text-gray-700">วันที่เริ่มสัญญา</label>
									<input type="date" id="contract_start" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
								</div>
								<div>
									<label for="contract_end" class="block text-sm font-medium text-gray-700">วันที่สิ้นสุดสัญญา</label>
									<input type="date" id="contract_end" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
								</div>
							</div>
						{/if}

						{#if compType === 'inspection_form'}
							<div>
								<label for="delivery_date" class="block text-sm font-medium text-gray-700">วันที่ส่งมอบ</label>
								<input type="date" id="delivery_date" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
							</div>
						{/if}

						{#if compType === 'fine_calculator'}
							<div class="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
								<p class="text-sm font-medium text-yellow-800">คำนวณค่าปรับ</p>
								<div class="mt-2 grid grid-cols-2 gap-3">
									<div>
										<label for="days_late" class="text-xs text-gray-600">จำนวนวันล่าช้า</label>
										<input type="number" id="days_late" value="0" class="mt-1 block w-full rounded border px-2 py-1 text-sm" />
									</div>
									<div>
										<label for="fine_amount" class="text-xs text-gray-600">ค่าปรับ (บาท)</label>
										<input type="number" step="0.01" id="fine_amount" value="0" class="mt-1 block w-full rounded border px-2 py-1 text-sm" />
									</div>
								</div>
							</div>
						{/if}

						{#if compType === 'send_to_finance_button'}
							<div class="rounded-lg border p-4">
								<h3 class="font-medium text-gray-800">ส่งเรื่องเบิกจ่าย (สร้างฎีกา)</h3>
								<form method="POST" action="?/generateDika" use:enhance class="mt-3 space-y-3">
									<div>
										<label class="block text-sm font-medium text-gray-700">ยอดเต็ม (บาท) <span class="text-red-500">*</span></label>
										<input name="gross_amount" type="number" step="0.01" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
									</div>
									<div class="grid grid-cols-2 gap-3">
										<div>
											<label class="block text-sm font-medium text-gray-700">ค่าปรับ (บาท)</label>
											<input name="fine_amount" type="number" step="0.01" value="0" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700">ภาษี (บาท)</label>
											<input name="tax_amount" type="number" step="0.01" value="0" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
										</div>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700">บัญชีจ่ายเงิน <span class="text-red-500">*</span></label>
										<CustomSelect
											name="payment_bank_account_id"
											required
											placeholder="-- เลือกบัญชี --"
											class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
											options={data.bankAccounts.filter((a) => !a.is_tax_pool).map((account) => ({ value: String(account.id), label: `${account.account_name} (${account.account_number})` }))}
										/>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700">บัญชีพักภาษี</label>
										<CustomSelect
											name="tax_pool_account_id"
											placeholder="-- ไม่มี --"
											class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
											options={[{ value: '', label: '-- ไม่มี --' }, ...data.bankAccounts.filter((a) => a.is_tax_pool).map((account) => ({ value: String(account.id), label: `${account.account_name} (${account.account_number})` }))]}
										/>
									</div>
									<button type="submit" class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
										สร้างฎีกาเบิกจ่าย
									</button>
								</form>
							</div>
						{/if}
					{/each}

					<!-- Generic advance button for steps without special components -->
					{#if !uiSchema.components.some((c: any) => {
						const t = typeof c === 'string' ? c : c.type;
						return ['approval_summary', 'send_to_finance_button'].includes(t);
					})}
						{@const hasUpload = uiSchema.components.some((c: any) => { const t = typeof c === 'string' ? c : c.type; return t === 'single_pdf_uploader' || t === 'multi_pdf_uploader'; })}
						{@const hasCommittee = uiSchema.components.some((c: any) => (typeof c === 'string' ? c : c.type) === 'committee_selector')}
						{@const committeeTypes = uiSchema.components.filter((c: any) => (typeof c === 'string' ? c : c.type) === 'committee_selector').map((c: any) => c.committee_type)}
						{@const committeesMissing = committeeTypes.some((ct: string) => data.committees.filter((c: any) => c.committee_type === ct).length === 0)}

						<form method="POST" action="?/advanceStep" enctype="multipart/form-data" use:enhance={handleStepComplete}>
							<input type="hidden" name="step_data" value={'{}'} />
							<input type="hidden" name="agency_id" value={data.document.agency_id} />
							<input type="hidden" name="step_seq" value={data.currentStep?.step_sequence} />

							{#if hasCommittee && committeesMissing}
								<p class="mb-2 text-sm text-amber-600">กรุณาเพิ่มกรรมการอย่างน้อย 1 คนในแต่ละประเภทก่อนดำเนินการต่อ</p>
							{/if}

							<button type="submit" disabled={hasCommittee && committeesMissing}
								class="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
								style="background: oklch(0.52 0.14 240);">
								บันทึกและไปขั้นตอนถัดไป
							</button>
						</form>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Approval History -->
	{#if data.approvals.length > 0}
		<div class="mt-6 rounded-xl border bg-white p-6">
			<h2 class="text-lg font-bold text-gray-900">ประวัติการอนุมัติ</h2>
			<div class="mt-3 space-y-2">
				{#each data.approvals as approval}
					<div class="flex items-center gap-3 rounded-lg border p-3">
						<StatusBadge status={approval.action} />
						<span class="text-sm font-medium">{approval.user_name}</span>
						{#if approval.comment}
							<span class="text-sm text-gray-500">- {approval.comment}</span>
						{/if}
						<span class="ml-auto text-xs text-gray-400">{formatThaiDateTime(approval.created_at)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Step History from Payload -->
	{#each [Object.entries((data.document.payload as Record<string, any>) || {}).filter(([k]) => k.startsWith('step_'))] as stepEntries}
	{#if stepEntries.length > 0}
		<div class="mt-6 rounded-xl border bg-white p-6">
			<h2 class="text-lg font-bold text-gray-900">ประวัติการดำเนินการ</h2>
			<div class="mt-3 space-y-3">
				{#each stepEntries as [key, value]}
					{@const stepName = key.replace(/^step_\d+_/, '').replace(/_/g, ' ')}
					<div class="rounded-lg border p-3">
						<div class="flex items-center gap-2">
							<span class="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">ผ่านแล้ว</span>
							<span class="text-sm font-medium text-gray-800">{stepName}</span>
						</div>
						{#if value && typeof value === 'object'}
							<div class="mt-2 text-xs text-gray-500 space-y-0.5">
								{#if value.approved}
									<p>อนุมัติโดย: {value.approved_by_name || data.users.find((u: any) => u.id === value.approved_by)?.name || `User #${value.approved_by}`}</p>
								{/if}
								{#if value.approved_at}
									<p>เมื่อ: {new Date(value.approved_at).toLocaleString('th-TH')}</p>
								{/if}
								{#if value.comment}
									<p>หมายเหตุ: {value.comment}</p>
								{/if}
								{#if value.completed}
									<p>ดำเนินการเสร็จสิ้น</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
	{/each}
</div>

<style>
	/* Step Progress */
	.step-progress-container {
		margin-bottom: 24px;
		overflow-x: auto;
		border-radius: 16px;
		border: 1px solid oklch(0.9 0.005 180);
		background: oklch(1 0 0);
		padding: 24px;
	}

	.step-progress-track {
		display: flex;
		gap: 0;
		min-width: max-content;
	}

	.step-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 140px;
		flex: 1;
	}

	.step-indicator-row {
		display: flex;
		align-items: center;
		width: 100%;
	}

	.step-circle {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		font-weight: 700;
		transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s;
	}

	.step-circle svg {
		width: 16px;
		height: 16px;
	}

	/* Completed = green */
	.step-circle--completed {
		background: oklch(0.54 0.16 150);
		color: oklch(1 0 0);
	}

	/* Current = yellow/amber */
	.step-circle--current {
		background: oklch(0.75 0.15 85);
		color: oklch(0.3 0.08 85);
		box-shadow: 0 0 0 4px oklch(0.75 0.15 85 / 0.25);
	}

	/* Rejected = red */
	.step-circle--rejected {
		background: oklch(0.58 0.2 25);
		color: oklch(1 0 0);
		box-shadow: 0 0 0 4px oklch(0.58 0.2 25 / 0.2);
	}

	/* Upcoming = soft blue (not yet reached, normal flow) */
	.step-circle--upcoming {
		background: oklch(0.88 0.06 240);
		color: oklch(0.45 0.14 240);
	}

	/* Disabled = gray (after a rejected step) */
	.step-circle--disabled {
		background: oklch(0.92 0.005 180);
		color: oklch(0.55 0.02 180);
	}

	/* Connector line */
	.step-connector {
		flex: 1;
		height: 3px;
		border-radius: 2px;
		min-width: 24px;
	}

	.step-connector--completed {
		background: oklch(0.54 0.16 150);
	}

	.step-connector--current {
		background: linear-gradient(90deg, oklch(0.54 0.16 150), oklch(0.75 0.15 85));
	}

	.step-connector--rejected {
		background: linear-gradient(90deg, oklch(0.54 0.16 150), oklch(0.58 0.2 25));
	}

	.step-connector--upcoming {
		background: oklch(0.88 0.06 240);
	}

	.step-connector--disabled {
		background: oklch(0.92 0.005 180);
	}

	/* Labels */
	.step-label {
		margin-top: 8px;
		font-size: 0.75rem;
		text-align: center;
		max-width: 120px;
		line-height: 1.4;
	}

	.step-label--completed {
		color: oklch(0.45 0.1 150);
		font-weight: 500;
	}

	.step-label--current {
		color: oklch(0.4 0.1 85);
		font-weight: 600;
	}

	.step-label--rejected {
		color: oklch(0.5 0.15 25);
		font-weight: 600;
	}

	.step-label--upcoming {
		color: oklch(0.45 0.14 240);
	}

	.step-label--disabled {
		color: oklch(0.6 0.01 180);
	}
</style>
