import { bankLists } from 'thai-banks-logo';

// Map our DB bank_codes to thai-banks-logo symbols
const codeMapping: Record<string, string> = {
	BBL: 'BBL',
	KBANK: 'KBANK',
	KTB: 'KTB',
	SCB: 'SCB',
	TTB: 'TTB',
	BAY: 'BAY',
	KKP: 'KKP',
	CIMBT: 'CIMB',
	TISCO: 'TISCO',
	UOBT: 'UOB',
	LHFG: 'LHB',
	ICBCT: 'ICBC',
	GSB: 'GSB',
	BAAC: 'BAAC',
	GHB: 'GHB',
	HSBC: 'HSBC',
	IBANK: 'IBANK',
	CITI: 'CITI',
	TCRB: 'TCRB',
	LHB: 'LHB',
	UOB: 'UOB',
	CIMB: 'CIMB',
	ICBC: 'ICBC',
	PromptPay: 'PromptPay',
	TrueMoney: 'TrueMoney'
};

export interface BankLogoInfo {
	icon: string;
	color: string;
	name: string;
	fullname: string;
}

export function getBankLogo(bankCode: string | null | undefined): BankLogoInfo | null {
	if (!bankCode) return null;
	const symbol = codeMapping[bankCode] || bankCode;
	const bank = (bankLists as Record<string, any>)[symbol];
	if (!bank) return null;
	return {
		icon: bank.icon,
		color: bank.color,
		name: bank.name,
		fullname: bank.fullname
	};
}

export { bankLists };
