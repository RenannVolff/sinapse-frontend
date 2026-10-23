import { extrairSugestaoEmail } from '../../utils/validacao';

interface SugestaoEmailProps {
  erro?: string;
  onAceitar: (email: string) => void;
}

// Quando o back devolve "Você quis dizer nome@gmail.com?", oferece um botão
// para aplicar a correção com um toque.
export function SugestaoEmail({ erro, onAceitar }: SugestaoEmailProps) {
  const sugestao = extrairSugestaoEmail(erro);
  if (!sugestao) return null;

  return (
    <button
      type="button"
      onClick={() => onAceitar(sugestao)}
      className="self-start text-xs font-bold text-primary hover:text-primary-hover underline underline-offset-2 break-all text-left"
    >
      Usar {sugestao}
    </button>
  );
}
