import { useContext } from 'react';
import { ToastContext, type ToastContextData } from '../contexts/ToastContext';

export function useToast(): ToastContextData {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }

  return context;
}
