export const STEP_TYPES = [
	'APPROVAL',
	'DOCUMENT_UPLOAD',
	'COMMITTEE',
	'VENDOR_SCORING',
	'VENDOR_SCORING_WITH_UPLOAD',
	'VENDOR_PROPOSAL_WITH_UPLOAD',
	'EVALUATION_WITH_SCORING'
] as const;
export type StepType = (typeof STEP_TYPES)[number];

export const STEP_TYPE_LABELS: Record<StepType, { label: string; desc: string; color: string; bg: string }> = {
	APPROVAL: {
		label: 'การอนุมัติ',
		desc: 'ให้ผู้มีอำนาจอนุมัติ (สูงสุด 5 คน)',
		color: 'oklch(0.48 0.14 60)',
		bg: 'oklch(0.62 0.18 60 / 0.1)'
	},
	DOCUMENT_UPLOAD: {
		label: 'ส่งเอกสาร',
		desc: 'อัปโหลดไฟล์ PDF เข้าระบบ',
		color: 'oklch(0.42 0.12 240)',
		bg: 'oklch(0.52 0.14 240 / 0.1)'
	},
	COMMITTEE: {
		label: 'แต่งตั้งกรรมการ',
		desc: 'กำหนดคณะกรรมการตามประเภท',
		color: 'oklch(0.45 0.1 280)',
		bg: 'oklch(0.55 0.12 280 / 0.1)'
	},
	VENDOR_SCORING: {
		label: 'คู่ค้าและคะแนน',
		desc: 'เลือก vendor ให้คะแนน ประกาศผู้ชนะ',
		color: 'oklch(0.4 0.14 150)',
		bg: 'oklch(0.54 0.16 150 / 0.1)'
	},
	VENDOR_SCORING_WITH_UPLOAD: {
		label: 'ส่งเชิญชวน + เอกสาร',
		desc: 'ส่งหนังสือเชิญชวนพร้อมอัปโหลดเอกสารต่อ vendor',
		color: 'oklch(0.44 0.13 200)',
		bg: 'oklch(0.54 0.15 200 / 0.1)'
	},
	VENDOR_PROPOSAL_WITH_UPLOAD: {
		label: 'รับข้อเสนอ + เอกสาร',
		desc: 'รับใบเสนอราคาพร้อมเอกสารจาก vendor',
		color: 'oklch(0.46 0.12 180)',
		bg: 'oklch(0.56 0.14 180 / 0.1)'
	},
	EVALUATION_WITH_SCORING: {
		label: 'พิจารณาผล + คะแนน',
		desc: 'ประกาศคะแนนและอัปโหลดเอกสารรายงานผล',
		color: 'oklch(0.42 0.15 130)',
		bg: 'oklch(0.52 0.17 130 / 0.1)'
	}
};

export const COMMITTEE_TYPES = ['TOR', 'MEDIAN_PRICE', 'PROCUREMENT', 'INSPECTION'] as const;
export type CommitteeType = (typeof COMMITTEE_TYPES)[number];

export const COMMITTEE_LABELS: Record<CommitteeType, string> = {
	TOR: 'กรรมการ TOR',
	MEDIAN_PRICE: 'กรรมการราคากลาง',
	PROCUREMENT: 'กรรมการจัดซื้อจัดจ้าง',
	INSPECTION: 'กรรมการตรวจรับ'
};

/** Infer step type from legacy ui_schema without explicit type field */
export function inferStepType(uiSchema: any): StepType | null {
	if (!uiSchema) return null;
	if (uiSchema.type && STEP_TYPES.includes(uiSchema.type)) return uiSchema.type;

	const comps = uiSchema.components;
	if (!Array.isArray(comps)) return null;

	const flat = comps.map((c: any) => (typeof c === 'string' ? c : c.type || '')).join(',');

	if (flat.includes('vendor_invitation_pdf_uploader') || flat.includes('vendor_per_item_pdf_uploader')) {
		if (flat.includes('vendor_proposal_receiver')) return 'VENDOR_PROPOSAL_WITH_UPLOAD';
		return 'VENDOR_SCORING_WITH_UPLOAD';
	}
	if (flat.includes('bidders_scoring_board') && flat.includes('pdf_uploader')) return 'EVALUATION_WITH_SCORING';
	if (flat.includes('approval_summary')) return 'APPROVAL';
	if (flat.includes('committee_selector')) return 'COMMITTEE';
	if (flat.includes('vendor_multi_selector') || flat.includes('bidders_scoring_board') || flat.includes('vendor_proposal_receiver')) return 'VENDOR_SCORING';
	if (flat.includes('pdf_uploader') || flat.includes('budget_input') || flat.includes('contract_details_form') || flat.includes('inspection_form') || flat.includes('send_to_finance_button')) return 'DOCUMENT_UPLOAD';

	return null;
}

/** Build ui_schema from step type and config */
export function buildUiSchema(type: StepType, config: any): Record<string, any> {
	switch (type) {
		case 'APPROVAL':
			return {
				type: 'approval',
				approvers: config.approvers || [],
				components: ['approval_summary']
			};
		case 'DOCUMENT_UPLOAD':
			return {
				type: 'document_upload',
				components: [config.upload_mode === 'multi' ? 'multi_pdf_uploader' : 'single_pdf_uploader'],
				required_pdfs: config.required_pdfs || []
			};
		case 'COMMITTEE':
			return {
				type: 'committee',
				components: (config.committee_types || []).map((ct: string) => ({
					type: 'committee_selector',
					committee_type: ct
				}))
			};
		case 'VENDOR_SCORING':
			return {
				type: 'vendor_scoring',
				components: ['vendor_multi_selector', 'bidders_scoring_board'],
				min_vendors: config.min_vendors || 3
			};
		case 'VENDOR_SCORING_WITH_UPLOAD':
			return {
				type: 'vendor_scoring_with_upload',
				components: ['vendor_multi_selector', 'vendor_invitation_pdf_uploader'],
				min_vendors: config.min_vendors || 3,
				required_pdfs: ['หนังสือเชิญชวน']
			};
		case 'VENDOR_PROPOSAL_WITH_UPLOAD':
			return {
				type: 'vendor_proposal_with_upload',
				components: ['vendor_proposal_receiver', 'vendor_per_item_pdf_uploader'],
				write_to_table: 'document_bidders'
			};
		case 'EVALUATION_WITH_SCORING':
			return {
				type: 'evaluation_with_scoring',
				components: ['bidders_scoring_board', 'single_pdf_uploader'],
				read_from_table: 'document_bidders',
				required_pdfs: config.required_pdfs || ['ใบรายงานผลพิจารณา']
			};
	}
}

/** Get a human-readable summary of ui_schema config */
export function getStepConfigSummary(uiSchema: any, type: StepType | null): string {
	if (!type) return '';
	switch (type) {
		case 'APPROVAL': {
			const approvers = uiSchema?.approvers || [];
			return approvers.length > 0 ? `${approvers.length} ผู้อนุมัติ` : 'ยังไม่กำหนดผู้อนุมัติ';
		}
		case 'DOCUMENT_UPLOAD': {
			const pdfs = uiSchema?.required_pdfs || [];
			const mode = (uiSchema?.components || []).includes('multi_pdf_uploader') ? 'หลายไฟล์' : 'ไฟล์เดียว';
			return pdfs.length > 0 ? `${pdfs.length} เอกสาร (${mode})` : mode;
		}
		case 'COMMITTEE': {
			const comps = uiSchema?.components || [];
			const types = comps.map((c: any) => c.committee_type).filter(Boolean);
			return types.length > 0 ? types.join(' + ') : 'ยังไม่กำหนดประเภท';
		}
		case 'VENDOR_SCORING': {
			const min = uiSchema?.min_vendors || 3;
			return `ขั้นต่ำ ${min} ราย`;
		}
		case 'VENDOR_SCORING_WITH_UPLOAD': {
			const min = uiSchema?.min_vendors || 3;
			return `ส่งเชิญชวน ${min} ราย + อัปโหลดเอกสาร`;
		}
		case 'VENDOR_PROPOSAL_WITH_UPLOAD': {
			return 'รับใบเสนอราคา + เอกสารจาก vendor';
		}
		case 'EVALUATION_WITH_SCORING': {
			const pdfs = uiSchema?.required_pdfs || [];
			return pdfs.length > 0 ? `ให้คะแนน + ${pdfs.join(', ')}` : 'ให้คะแนน + ประกาศผล';
		}
	}
}
