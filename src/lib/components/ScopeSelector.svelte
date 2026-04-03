<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Province, Agency, OrgUnit } from '$lib/types/dashboard';

	interface Props {
		provinces: Province[];
		agencies: Agency[];
		orgUnits: OrgUnit[];
		selectedProvinceId?: number | null;
		selectedAgencyId?: number | null;
		selectedOrgUnitId?: number | null;
	}

	let {
		provinces,
		agencies,
		orgUnits,
		selectedProvinceId = null,
		selectedAgencyId = null,
		selectedOrgUnitId = null
	}: Props = $props();

	let provinceId = $state(selectedProvinceId);
	let agencyId = $state(selectedAgencyId);
	let orgUnitId = $state(selectedOrgUnitId);

	let filteredAgencies = $derived(
		provinceId
			? agencies.filter((a) => a.province_id === provinceId)
			: agencies
	);

	let filteredOrgUnits = $derived(
		agencyId
			? orgUnits.filter((o) => o.agency_id === agencyId)
			: orgUnits
	);

	function updateUrl() {
		const params = new URLSearchParams();
		if (provinceId) params.set('province_id', String(provinceId));
		if (agencyId) params.set('agency_id', String(agencyId));
		if (orgUnitId) params.set('org_unit_id', String(orgUnitId));
		
		const queryString = params.toString();
		goto(`/dashboard${queryString ? `?${queryString}` : ''}`, { replaceState: true });
	}

	function handleProvinceChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		provinceId = target.value ? parseInt(target.value) : null;
		agencyId = null;
		orgUnitId = null;
		updateUrl();
	}

	function handleAgencyChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		agencyId = target.value ? parseInt(target.value) : null;
		orgUnitId = null;
		updateUrl();
	}

	function handleOrgUnitChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		orgUnitId = target.value ? parseInt(target.value) : null;
		updateUrl();
	}
</script>

<div class="scope-selector">
	<div class="scope-header">
		<h2 class="scope-title">เลือกขอบเขตข้อมูล</h2>
		<p class="scope-subtitle">เลือกจังหวัดและหน่วยงานเพื่อดูข้อมูลเชิงลึก</p>
	</div>

	<div class="scope-fields">
		<div class="field-group">
			<label for="province" class="field-label">จังหวัด</label>
			<select
				id="province"
				class="field-select"
				value={provinceId ?? ''}
				onchange={handleProvinceChange}
			>
				<option value="">-- เลือกจังหวัด --</option>
				{#each provinces as province}
					<option value={province.id}>{province.name}</option>
				{/each}
			</select>
		</div>

		<div class="field-group">
			<label for="agency" class="field-label">หน่วยงาน</label>
			<select
				id="agency"
				class="field-select"
				value={agencyId ?? ''}
				onchange={handleAgencyChange}
				disabled={!provinceId}
			>
				<option value="">-- เลือกหน่วยงาน --</option>
				{#each filteredAgencies as agency}
					<option value={agency.id}>{agency.name}</option>
				{/each}
			</select>
		</div>

		<div class="field-group">
			<label for="orgUnit" class="field-label">หน่วยงานย่อย</label>
			<select
				id="orgUnit"
				class="field-select"
				value={orgUnitId ?? ''}
				onchange={handleOrgUnitChange}
				disabled={!agencyId}
			>
				<option value="">-- เลือกหน่วยงานย่อย --</option>
				{#each filteredOrgUnits as orgUnit}
					<option value={orgUnit.id}>{orgUnit.name}</option>
				{/each}
			</select>
		</div>
	</div>
</div>

<style>
	.scope-selector {
		background: oklch(0.98 0.005 180);
		border: 1px solid oklch(0.88 0.01 180);
		border-radius: 16px;
		padding: 24px;
		margin-bottom: 32px;
		animation: slide-up 0.5s ease-out-expo;
	}

	.scope-header {
		margin-bottom: 20px;
	}

	.scope-title {
		font-size: clamp(1.125rem, 0.9rem + 0.5vw, 1.25rem);
		font-weight: 600;
		color: oklch(0.25 0.02 180);
		margin: 0 0 4px 0;
	}

	.scope-subtitle {
		font-size: 0.875rem;
		color: oklch(0.5 0.02 180);
		margin: 0;
	}

	.scope-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: oklch(0.35 0.02 180);
	}

	.field-select {
		padding: 10px 14px;
		border: 1px solid oklch(0.82 0.015 180);
		border-radius: 10px;
		background: oklch(1 0 0);
		font-family: 'Noto Sans Thai', sans-serif;
		font-size: 0.9375rem;
		color: oklch(0.25 0.02 180);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		cursor: pointer;
	}

	.field-select:hover {
		border-color: oklch(0.75 0.02 180);
	}

	.field-select:focus {
		outline: none;
		border-color: oklch(0.52 0.14 240);
		box-shadow: 0 0 0 3px oklch(0.52 0.14 240 / 0.15);
	}

	.field-select:disabled {
		background: oklch(0.94 0.005 180);
		color: oklch(0.6 0.01 180);
		cursor: not-allowed;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
