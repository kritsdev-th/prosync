/**
 * Common Icon Components
 * Reusable SVG icons for ProSync ERP
 * Usage: <svelte:component this={DashboardIcon} /> or {@render icon()}
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

export function DashboardIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
	</svg>`;
}

export function PlanIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
	</svg>`;
}

export function ProcurementIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
	</svg>`;
}

export function FinanceIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>`;
}

export function AuditIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>`;
}

export function AdminIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
	</svg>`;
}

export function ChevronRightIcon({ class: className = '', size = 'sm' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
	</svg>`;
}

export function ChevronLeftIcon({ class: className = '', size = 'sm' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
	</svg>`;
}

export function ChevronDownIcon({ class: className = '', size = 'sm' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
	</svg>`;
}

export function MenuIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
	</svg>`;
}

export function CloseIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
	</svg>`;
}

export function LogoutIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
	</svg>`;
}

export function CheckIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
	</svg>`;
}

export function CheckCircleIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>`;
}

export function InfoIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>`;
}

export function WarningIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
	</svg>`;
}

export function ErrorIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>`;
}

export function SpinnerIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className} animate-spin" viewBox="0 0 24 24" fill="none">
		<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
		<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
	</svg>`;
}

export function SearchIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
	</svg>`;
}

export function PlusIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
	</svg>`;
}

export function TrashIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
	</svg>`;
}

export function EditIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5a2.25 2.25 0 01-2.25-2.25V10A2.25 2.25 0 015 7.75h4.75" />
	</svg>`;
}

export function EyeIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
		<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
	</svg>`;
}

export function EyeOffIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
	</svg>`;
}

export function UserIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
	</svg>`;
}

export function UsersIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
	</svg>`;
}

export function BuildingIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5M12 6.75h1.5M15 6.75h1.5M9 10.5h1.5M12 10.5h1.5M15 10.5h1.5M9 14.25h1.5M12 14.25h1.5M15 14.25h1.5M9 18h1.5M12 18h1.5M15 18h1.5" />
	</svg>`;
}

export function DocumentIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
	</svg>`;
}

export function ChartBarIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
	</svg>`;
}

export function ArrowRightIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
	</svg>`;
}

export function ArrowLeftIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
	</svg>`;
}

export function CalendarIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
	</svg>`;
}

export function MailIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
	</svg>`;
}

export function LockIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
	</svg>`;
}

export function IdCardIcon({ class: className = '', size = 'md' }: IconProps = {}) {
	const sizeClass = sizeClasses[size];
	return `<svg class="${sizeClass} ${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
	</svg>`;
}
