import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

interface CampoProps {
  label: string;
  error?: string;
  // Mostra "x/limite" abaixo do campo (exige maxLength).
  showCounter?: boolean;
  // Rótulo só para leitor de tela (o campo já tem contexto visual).
  hideLabel?: boolean;
}

// Mensagem de erro + contador, ligados ao campo por aria-describedby.
function RodapeCampo({
  erroId,
  contadorId,
  error,
  tamanho,
  maxLength,
  showCounter,
}: {
  erroId: string;
  contadorId: string;
  error?: string;
  tamanho: number;
  maxLength?: number;
  showCounter?: boolean;
}) {
  const mostrarContador = showCounter && maxLength !== undefined;
  if (!error && !mostrarContador) return null;

  return (
    <div className="flex items-start justify-between gap-3 min-w-0">
      {error ? (
        <span id={erroId} className="flex items-start gap-1 text-xs text-red-600 font-medium min-w-0 break-words">
          <AlertCircle className="h-3.5 w-3.5 mt-px flex-shrink-0" aria-hidden="true" />
          <span className="min-w-0">{error}</span>
        </span>
      ) : (
        <span />
      )}
      {mostrarContador && (
        <span
          id={contadorId}
          className={`text-xs tabular-nums flex-shrink-0 ${tamanho >= maxLength ? 'text-red-600 font-semibold' : 'text-text-secondary'}`}
        >
          {tamanho}/{maxLength}
          <span className="sr-only"> caracteres</span>
        </span>
      )}
    </div>
  );
}

function descricao(error: string | undefined, erroId: string, contador: boolean, contadorId: string) {
  const ids = [error ? erroId : '', contador ? contadorId : ''].filter(Boolean).join(' ');
  return ids || undefined;
}

function tamanhoDoValor(value: unknown): number {
  return typeof value === 'string' ? value.length : 0;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, CampoProps {
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, showCounter, hideLabel, maxLength, value, ...props }, ref) => {
    // O rótulo visível é o nome acessível do campo (htmlFor/id), não o placeholder.
    const idGerado = useId();
    const inputId = id ?? idGerado;
    const erroId = `${inputId}-erro`;
    const contadorId = `${inputId}-contador`;
    const comContador = !!showCounter && maxLength !== undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full min-w-0">
        <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'text-sm font-semibold text-text-primary'}>
          {label}
        </label>

        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors duration-200 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            value={value}
            maxLength={maxLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={descricao(error, erroId, comContador, contadorId)}
            className={`
              w-full min-w-0 bg-white border rounded-lg py-3 px-4 outline-none transition-all duration-200
              placeholder:text-text-secondary/70
              ${icon ? 'pl-10' : ''}
              ${error
                ? 'border-red-500 border-2 focus:ring-4 focus:ring-red-500/10 text-text-primary'
                : 'border-primary-light focus:border-primary focus:ring-4 focus:ring-primary/10 text-text-primary hover:border-primary/30'
              }
              ${className || ''}
            `}
            {...props}
          />
        </div>

        <RodapeCampo
          erroId={erroId}
          contadorId={contadorId}
          error={error}
          tamanho={tamanhoDoValor(value)}
          maxLength={maxLength}
          showCounter={showCounter}
        />
      </div>
    );
  },
);

Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, CampoProps {
  maxLength: number;
}

// Textarea com limite obrigatório e contador "x/limite" por padrão.
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, id, showCounter = true, hideLabel, maxLength, value, ...props }, ref) => {
    const idGerado = useId();
    const campoId = id ?? idGerado;
    const erroId = `${campoId}-erro`;
    const contadorId = `${campoId}-contador`;

    return (
      <div className="flex flex-col gap-1.5 w-full min-w-0">
        <label htmlFor={campoId} className={hideLabel ? 'sr-only' : 'text-sm font-semibold text-text-primary'}>
          {label}
        </label>

        <textarea
          ref={ref}
          id={campoId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={descricao(error, erroId, showCounter, contadorId)}
          className={`
            w-full min-w-0 bg-white border rounded-lg py-3 px-4 outline-none transition-all duration-200
            placeholder:text-text-secondary text-text-primary min-h-[7rem] resize-y break-words
            disabled:bg-background disabled:text-text-secondary
            ${error
              ? 'border-red-500 border-2 focus:ring-4 focus:ring-red-500/10'
              : 'border-primary-light focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30'
            }
            ${className || ''}
          `}
          {...props}
        />

        <RodapeCampo
          erroId={erroId}
          contadorId={contadorId}
          error={error}
          tamanho={tamanhoDoValor(value)}
          maxLength={maxLength}
          showCounter={showCounter}
        />
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';
