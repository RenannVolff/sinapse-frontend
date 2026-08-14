export type ToastType = 'error' | 'success' | 'info';
type ToastHandler = (message: string, type: ToastType) => void;

// Permite que código fora da árvore React (ex: interceptor do axios) dispare toasts.
let handler: ToastHandler | null = null;

export function registerToastHandler(fn: ToastHandler | null) {
  handler = fn;
}

export function emitToast(message: string, type: ToastType = 'info') {
  handler?.(message, type);
}
