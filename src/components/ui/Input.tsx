import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, icon, className, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-text-primary">
        {label}
      </label>

      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors duration-200">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          className={`
            w-full bg-white border rounded-lg py-3 px-4 outline-none transition-all duration-200
            placeholder:text-text-secondary/70
            ${icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-500 focus:ring-4 focus:ring-red-500/10 text-red-600'
              : 'border-primary-light focus:border-primary focus:ring-4 focus:ring-primary/10 text-text-primary hover:border-primary/30'
            }
            ${className || ''}
          `}
          {...props}
        />
      </div>

      {error && (
        <span className="text-xs text-red-500 font-medium animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
