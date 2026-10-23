import { AlertCircle } from 'lucide-react';
import type { ErrosCampo } from '../../utils/validacao';

interface FormErrorSummaryProps {
  errors: ErrosCampo;
  // Campos que o formulário exibe. Erro de campo que não está na tela (ex.:
  // um id enviado pelo sistema) só aparece aqui, então o resumo surge mesmo
  // com um único erro desse tipo.
  campos: string[];
}

// Resumo no topo do formulário quando há mais de um erro. Cada item leva ao
// campo correspondente.
export function FormErrorSummary({ errors, campos }: FormErrorSummaryProps) {
  const entradas = Object.entries(errors);
  const temErroForaDaTela = entradas.some(([campo]) => !campos.includes(campo));
  if (entradas.length === 0 || (entradas.length === 1 && !temErroForaDaTela)) return null;

  const irParaCampo = (campo: string) => {
    const el = document.querySelector<HTMLElement>(`[name="${CSS.escape(campo)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
  };

  return (
    <div
      data-form-erros
      tabIndex={-1}
      role="alert"
      className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 outline-none"
    >
      <p className="flex items-center gap-2 text-sm font-bold">
        <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        Revise os campos destacados:
      </p>
      <ul className="mt-2 space-y-1 pl-7 list-disc text-sm">
        {entradas.map(([campo, mensagem]) => (
          <li key={campo} className="break-words">
            {campos.includes(campo) ? (
              <button type="button" onClick={() => irParaCampo(campo)} className="text-left underline underline-offset-2 hover:text-red-800">
                {mensagem}
              </button>
            ) : (
              mensagem
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
