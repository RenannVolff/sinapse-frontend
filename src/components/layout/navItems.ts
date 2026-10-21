import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  History,
  LayoutTemplate,
  type LucideIcon,
} from 'lucide-react';

// Itens da navegação principal, usados pela Sidebar (lg+) e pelo menu
// lateral das telas menores (MobileNav).
export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { path: '/aprendentes', label: 'Meus Aprendentes', icon: Users },
  { path: '/agenda', label: 'Agenda', icon: Calendar },
  { path: '/pei-templates', label: 'Modelos de PEI', icon: LayoutTemplate },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { path: '/auditoria', label: 'Auditoria', icon: History },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];
