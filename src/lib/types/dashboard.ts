export interface Province {
	id: number;
	name: string;
}

export interface Agency {
	id: number;
	name: string;
	agency_type: string | null;
	province_id: number;
}

export interface OrgUnit {
	id: number;
	agency_id: number;
	name: string;
	parent_id: number | null;
	head_of_unit_id: number | null;
}

export interface FiscalYear {
	id: number;
	year: number;
	start_date: string;
	end_date: string;
	is_active: boolean;
	agency_id: number;
}

export interface Document {
	id: number;
	document_number: string;
	title: string;
	status: string;
	created_at: string;
	agency_id: number;
}

export interface DikaVoucher {
	id: number;
	voucher_number: string;
	description: string;
	status: string;
	amount: string;
	created_at: string;
	agency_id: number;
}

export interface DashboardStats {
	totalAgencies?: number;
	totalUsers?: number;
	fiscalYear: FiscalYear | null;
	activeDocuments: number;
	pendingDikaVouchers: number;
	systemStatus: 'online' | 'offline' | 'maintenance';
}

export interface ChartData {
	label: string;
	value: number;
	color?: string;
}

export interface TimeSeriesData {
	date: string;
	value: number;
	category?: string;
}
