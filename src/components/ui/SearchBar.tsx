import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  ariaLabel: string;
  maxLength: number;
  totalRegistros: number;
}

// Barra de busca com contador de registros, usada nas listagens.
export function SearchBar({ value, onChange, placeholder, ariaLabel, maxLength, totalRegistros }: SearchBarProps) {
  return (
    <div className="bg-white p-2 pl-4 rounded-2xl border border-primary-light shadow-sm flex items-center focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
      <Search className="h-5 w-5 text-text-secondary" />
      <input
        type="text"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="flex-1 min-w-0 bg-transparent border-none py-3 px-4 outline-none text-text-primary placeholder-text-secondary"
      />
      <div className="pr-4 hidden md:block">
        <span className="px-3 py-1 bg-primary-light text-text-primary text-xs font-bold rounded-full">
          {totalRegistros} Registros
        </span>
      </div>
    </div>
  );
}
