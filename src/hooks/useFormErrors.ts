import { useCallback, useRef, useState } from 'react';
import { getFieldErrors } from '../services/apiError';
import type { ErrosCampo } from '../utils/validacao';

// Erros por campo de um formulário, vindos da validação no cliente ou do
// `errors[]` do backend. O campo é achado pelo atributo `name` (que usa o
// mesmo nome/caminho do back, ex.: "nomeCompleto" ou "metas.0.descricao").
// Ao mostrar erros, rola até o primeiro campo inválido e põe o foco nele.
export function useFormErrors() {
  const [errors, setErrors] = useState<ErrosCampo>({});
  const formRef = useRef<HTMLFormElement>(null);

  const focarPrimeiro = useCallback((erros: ErrosCampo) => {
    // Espera o React pintar as mensagens antes de medir/rolar.
    requestAnimationFrame(() => {
      const form = formRef.current;
      if (!form) return;

      // Primeiro na ordem visual do formulário, não na ordem do objeto.
      const campos = Array.from(form.querySelectorAll<HTMLElement>('[name]'));
      const alvo =
        campos.find((el) => erros[el.getAttribute('name') ?? '']) ??
        form.querySelector<HTMLElement>('[data-form-erros]');
      if (!alvo) return;

      alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alvo.focus({ preventScroll: true });
    });
  }, []);

  const showErrors = useCallback((erros: ErrosCampo): boolean => {
    setErrors(erros);
    const temErro = Object.keys(erros).length > 0;
    if (temErro) focarPrimeiro(erros);
    return temErro;
  }, [focarPrimeiro]);

  // true se a resposta trouxe erros por campo (e eles foram exibidos).
  const applyApiError = useCallback((error: unknown): boolean => {
    const erros = getFieldErrors(error);
    if (!erros) return false;
    showErrors(erros);
    return true;
  }, [showErrors]);

  const clearError = useCallback((campo: string) => {
    setErrors((prev) => {
      if (!(campo in prev)) return prev;
      const resto = { ...prev };
      delete resto[campo];
      return resto;
    });
  }, []);

  const reset = useCallback(() => setErrors({}), []);

  return { errors, formRef, showErrors, applyApiError, clearError, reset };
}
