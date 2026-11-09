import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { clsx as cn } from 'clsx';
import type { DirecaoOrdenacao } from '../../utils/ordenacao';

interface SortableHeaderProps {
  children: ReactNode;
  ativo: boolean;
  direcao: DirecaoOrdenacao;
  onOrdenar: () => void;
  className?: string;
}

// Cabeçalho de coluna ordenável. O <button> dá foco e Enter/Espaço de graça;
// aria-sort só vai na coluna ativa, como recomenda o padrão de tabela da WAI.
export function SortableHeader({ children, ativo, direcao, onOrdenar, className }: SortableHeaderProps) {
  const Icone = !ativo ? ArrowUpDown : direcao === 'asc' ? ArrowUp : ArrowDown;
  const proxima = ativo && direcao === 'asc' ? 'decrescente' : 'crescente';

  return (
    <th
      scope="col"
      aria-sort={ativo ? (direcao === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn('p-0 font-bold', className)}
    >
      <button
        type="button"
        onClick={onOrdenar}
        title={`Ordenar em ordem ${proxima}`}
        className={cn(
          'w-full flex items-center gap-1.5 p-5 text-left uppercase tracking-wider font-bold cursor-pointer select-none transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary rounded-lg',
          ativo && 'text-text-primary',
        )}
      >
        {children}
        <Icone
          className={cn('h-3.5 w-3.5 flex-shrink-0', ativo ? 'text-primary' : 'opacity-40')}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}
