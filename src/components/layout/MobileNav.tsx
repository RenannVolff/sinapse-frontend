import { useEffect, useRef, type RefObject } from 'react';
import { BrainCircuit, X } from 'lucide-react';
import { NavLinks } from './NavLinks';

export const MOBILE_NAV_ID = 'menu-navegacao';

const FOCAVEIS = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface MobileNavProps {
  onClose: () => void;
  // Botão que abriu o menu: recebe o foco de volta quando ele fecha.
  triggerRef: RefObject<HTMLButtonElement | null>;
}

// Menu lateral das telas abaixo de lg (a Sidebar só aparece a partir de lg).
// Montado só enquanto aberto; quem decide abrir/fechar é o Header.
export function MobileNav({ onClose, triggerRef }: MobileNavProps) {
  const painelRef = useRef<HTMLDivElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    fecharRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !painelRef.current) return;

      // Foco preso no painel: do último volta ao primeiro e vice-versa.
      const focaveis = Array.from(painelRef.current.querySelectorAll<HTMLElement>(FOCAVEIS));
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const ativo = document.activeElement;
      const dentro = painelRef.current.contains(ativo);

      if (e.shiftKey && (ativo === primeiro || !dentro)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (ativo === ultimo || !dentro)) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflowAnterior;
      trigger?.focus();
    };
  }, [onClose, triggerRef]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={painelRef}
        id={MOBILE_NAV_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white border-r border-primary-light shadow-2xl flex flex-col overflow-y-auto motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200"
      >
        <div className="h-16 flex items-center justify-between gap-2 pl-6 pr-3 border-b border-primary-light shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <BrainCircuit className="h-6 w-6 text-primary shrink-0" />
            <span className="text-xl font-bold text-text-primary tracking-tight truncate">Sinapse Edu</span>
          </div>
          <button
            ref={fecharRef}
            type="button"
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors shrink-0"
            aria-label="Fechar menu de navegação"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1" aria-label="Navegação principal">
          <NavLinks itemClassName="min-h-11" onItemClick={onClose} />
        </nav>
      </div>
    </div>
  );
}
