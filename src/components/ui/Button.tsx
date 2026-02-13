import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utilitário para mesclar classes (opcional, mas recomendado para clean code)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
}

export function Button({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 disabled:bg-primary/70",
    outline: "border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary disabled:bg-gray-50",
    ghost: "text-gray-500 hover:text-primary hover:bg-primary/5",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], className)} 
      disabled={isLoading || disabled} 
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : children}
    </button>
  );
}
