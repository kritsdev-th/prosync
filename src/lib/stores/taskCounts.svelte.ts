let procurementCount = $state(0);
let financeCount = $state(0);

export function initCounts(procurement: number, finance: number) {
	procurementCount = procurement;
	financeCount = finance;
}

export function decrementProcurement() {
	if (procurementCount > 0) procurementCount--;
}

export function decrementFinance() {
	if (financeCount > 0) financeCount--;
}

export function getProcurementCount(): number {
	return procurementCount;
}

export function getFinanceCount(): number {
	return financeCount;
}

export function getTotalCount(): number {
	return procurementCount + financeCount;
}
