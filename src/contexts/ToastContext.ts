import { createContext } from 'react';
import type { ToastType } from '../services/toastBridge';

export interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export const ToastContext = createContext<ToastContextData>({} as ToastContextData);
