/**
 * Common Icon Components
 * Reusable SVG icons for ProSync ERP
 */

interface IconProps {
	class?: string;
	size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
	sm: 'h-4 w-4',
	md: 'h-5 w-5',
	lg: 'h-6 w-6'
};

export function DashboardIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
	</svg>`;
}

export function PlanIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
	</svg>`;
}

export function ProcurementIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
	</svg>`;
}

export function FinanceIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>`;
}

export function AuditIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>`;
}

export function AdminIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
	</svg>`;
}

export function ChevronRightIcon({ class: className = '', size = 'sm' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
	</svg>`;
}

export function MenuIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
	</svg>`;
}

export function LogoutIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
	</svg>`;
}

export function CheckIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
	</svg>`;
}

export function InfoIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>`;
}

export function SpinnerIcon({ class: className = '', size = 'md' }: IconProps) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className} animate-spin" viewBox="0 0 24 24" fill="none">
		<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
		<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
	</svg>`;
}
