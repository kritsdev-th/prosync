export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

let toasts = $state<Toast[]>([]);
let nextId = 0;

export function showToast(message: string, type: ToastType = 'success') {
	const id = ++nextId;
	toasts = [...toasts, { id, message, type }];
	setTimeout(() => {
		toasts = toasts.filter((t) => t.id !== id);
	}, 3000);
}

export function getToasts(): Toast[] {
	return toasts;
}

/**
 * Watch a SvelteKit form result and show a toast when it changes.
 * Prevents duplicate toasts by tracking the previous reference.
 * Call this inside a component's `<script>` block.
 */
export function watchFormResult(getFormResult: () => any) {
	let lastRef: any = undefined;
	$effect(() => {
		const fr = getFormResult();
		if (fr && fr !== lastRef) {
			lastRef = fr;
			if (fr.message) {
				showToast(fr.message, fr.success === false ? 'error' : 'success');
			} else if (fr.error) {
				showToast(fr.error, 'error');
			}
		}
	});
}
