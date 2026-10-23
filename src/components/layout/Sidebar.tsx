import { BrainCircuit } from 'lucide-react';
import { NavLinks } from './NavLinks';

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-primary-light hidden lg:flex flex-col h-screen h-dvh fixed left-0 top-0 z-10">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-primary-light">
        <BrainCircuit className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold text-text-primary tracking-tight">Sinapse Edu</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        <NavLinks />
      </nav>

      <div className="p-4 border-t border-primary-light">
        <div className="bg-primary-light rounded-lg p-4 text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            Sistema Seguro
          </p>
          <p className="text-[0.625rem] text-text-secondary">v1.0.0 (Estável)</p>
        </div>
      </div>
    </aside>
  );
}
