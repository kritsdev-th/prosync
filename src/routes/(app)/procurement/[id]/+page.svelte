<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatThaiDateTime, formatBaht, formatNumber } from '$lib/utils/format';

	let { data, form: formResult } = $props();

	function getStepStatus(step: any) {
		if (!data.currentStep) return 'pending';
		if (step.step_sequence < data.currentStep.step_sequence) return 'completed';
		if (step.id === data.currentStep.id) return 'current';
		return 'pending';
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
		<a href="/procurement" class="text-sm text-blue-600 hover:underline">← กลับไปรายการเอกสาร</a>
		<h1 class="mt-2 text-2xl font-bold text-gray-900">เอกสาร #{data.document.id}</h1>
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
	<div class="mb-6 overflow-x-auto rounded-xl border bg-white p-4">
		<div class="flex gap-2">
			{#each data.steps as step}
				{@const status = getStepStatus(step)}
				<div class="flex min-w-[140px] flex-col items-center text-center">
					<div class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
						{status === 'completed' ? 'bg-green-500 text-white' : status === 'current' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}">
						{step.step_sequence}
					</div>
					<p class="mt-1 text-xs {status === 'current' ? 'font-medium text-blue-700' : 'text-gray-500'}">
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

			{#if uiSchema?.components}
				<div class="mt-4 space-y-4">
					{#each uiSchema.components as comp}
						{@const compType = typeof comp === 'string' ? comp : comp.type}

						{#if compType === 'budget_input'}
							<div>
								<label for="budget_amount" class="block text-sm font-medium text-gray-700">วงเงินงบประมาณ (บาท)</label>
								<input type="number" step="0.01" id="budget_amount" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
							</div>
						{/if}

						{#if compType === 'single_pdf_uploader' || compType === 'multi_pdf_uploader'}
							<div>
								<label class="block text-sm font-medium text-gray-700">อัปโหลดไฟล์ PDF</label>
								<input type="file" accept=".pdf" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
								<p class="mt-1 text-xs text-gray-400">รองรับไฟล์ PDF สูงสุด 20MB</p>
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
									</div>
								{/each}
								<form method="POST" action="?/addCommittee" use:enhance class="mt-3 flex gap-2">
									<input type="hidden" name="committee_type" value={committeeType} />
									<select name="user_id" required class="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm">
										<option value="">-- เลือกบุคคล --</option>
										{#each data.users as u}
											<option value={u.id}>{u.name}</option>
										{/each}
									</select>
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
									<select name="vendor_id" required class="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm">
										<option value="">-- เลือก Vendor --</option>
										{#each data.vendors as v}
											<option value={v.id}>{v.company_name} ({v.tax_id})</option>
										{/each}
									</select>
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
								<form method="POST" action="?/approve" use:enhance class="mt-4 space-y-3">
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
										<select name="payment_bank_account_id" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
											{#each data.bankAccounts.filter((a) => !a.is_tax_pool) as account}
												<option value={account.id}>{account.account_name} ({account.account_number})</option>
											{/each}
										</select>
									</div>
									<div>
										<label class="block text-sm font-medium text-gray-700">บัญชีพักภาษี</label>
										<select name="tax_pool_account_id" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
											<option value="">-- ไม่มี --</option>
											{#each data.bankAccounts.filter((a) => a.is_tax_pool) as account}
												<option value={account.id}>{account.account_name} ({account.account_number})</option>
											{/each}
										</select>
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
						<form method="POST" action="?/advanceStep" use:enhance>
							<input type="hidden" name="step_data" value={'{}'} />
							<button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
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

	<!-- Payload History -->
	{#if Object.keys(data.document.payload || {}).length > 0}
		<div class="mt-6 rounded-xl border bg-white p-6">
			<h2 class="text-lg font-bold text-gray-900">ข้อมูล Payload</h2>
			<pre class="mt-3 overflow-auto rounded-lg bg-gray-50 p-4 text-xs">{JSON.stringify(data.document.payload, null, 2)}</pre>
		</div>
	{/if}
</div>
