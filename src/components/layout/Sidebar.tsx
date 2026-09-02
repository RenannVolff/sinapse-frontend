import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  BrainCircuit,
  Settings,
  History
} from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/aprendentes', label: 'Meus Aprendentes', icon: Users },
    { path: '/agenda', label: 'Agenda', icon: Calendar },
    { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    { path: '/auditoria', label: 'Auditoria', icon: History },
    { path: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-primary-light hidden lg:flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-primary-light">
        <BrainCircuit className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold text-text-primary tracking-tight">Sinapse Edu</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-text-secondary hover:bg-primary-light hover:text-primary'
              }
            `}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-light">
        <div className="bg-primary-light rounded-lg p-4 text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            Sistema Seguro
          </p>
          <p className="text-[10px] text-text-secondary">v1.0.0 (Estável)</p>
        </div>
      </div>
    </aside>
  );
}