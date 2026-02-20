import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardCheck,
    BarChart3,
    BrainCircuit
} from 'lucide-react';

export function Sidebar() {
    // Lista de links para facilitar a manutenção
    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/alunos', label: 'Meus Alunos', icon: Users },
        { path: '/agenda', label: 'Agenda', icon: Calendar },
        { path: '/atividades', label: 'Atividades', icon: ClipboardCheck },
        { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col h-screen fixed left-0 top-0 z-10">
            {/* Logo da Sidebar */}
            <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-100">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-gray-800 tracking-tight">
                    Sinapse Edu
                </span>
            </div>

            {/* Menu de Navegação */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                                ? 'bg-primary text-white shadow-md shadow-blue-200'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-primary'
                            }
            `}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Rodapé da Sidebar */}
            <div className="p-4 border-t border-gray-100">
                <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                        Status do Sistema
                    </h4>
                    <p className="text-xs text-blue-600">
                        Versão 1.0.0 (Estável)
                    </p>
                </div>
            </div>
        </aside>
    );
}
