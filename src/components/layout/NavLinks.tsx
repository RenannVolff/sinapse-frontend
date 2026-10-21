import { NavLink } from 'react-router-dom';
import { navItems } from './navItems';

interface NavLinksProps {
  // Classes extras de cada link (o menu móvel pede alvo de toque de 44px).
  itemClassName?: string;
  // Chamado ao clicar em qualquer item, inclusive o da rota atual.
  onItemClick?: () => void;
}

export function NavLinks({ itemClassName = '', onItemClick }: NavLinksProps) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onItemClick}
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${isActive
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-text-secondary hover:bg-primary-light hover:text-primary'
            }
            ${itemClassName}
          `}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </>
  );
}
