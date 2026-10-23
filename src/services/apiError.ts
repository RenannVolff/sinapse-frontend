import { isAxiosError } from 'axios';

// Contrato de erro do backend. 400 de validação:
// { statusCode, code: 'VALIDATION_ERROR', message, errors: [{ field, message }] }
// (`field` pode ser caminho aninhado, ex.: graficos.0.titulo). Demais erros:
// { statusCode, code, message }.
export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  statusCode: number;
  code?: string;
  message: string | string[];
  errors?: ApiFieldError[];
}

export const CODIGO_ERRO_VALIDACAO = 'VALIDATION_ERROR';

const DEFAULT_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';
const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
const SERVER_ERROR_MESSAGE = 'O servidor não conseguiu concluir a operação. Tente novamente em instantes.';

function errosDeCampo(error: unknown): ApiFieldError[] {
  if (!isAxiosError<ApiErrorPayload>(error)) return [];
  const errors = error.response?.data?.errors;
  if (!Array.isArray(errors)) return [];
  return errors.filter(
    (e): e is ApiFieldError => typeof e?.field === 'string' && typeof e?.message === 'string',
  );
}

/**
 * Erros de validação por campo (primeira mensagem de cada campo), ou null se
 * a resposta não for um VALIDATION_ERROR com `errors[]`.
 */
export function getFieldErrors(error: unknown): Record<string, string> | null {
  const errors = errosDeCampo(error);
  if (errors.length === 0) return null;

  const porCampo: Record<string, string> = {};
  for (const { field, message } of errors) {
    if (!(field in porCampo)) porCampo[field] = message;
  }
  return porCampo;
}

/** Extrai uma mensagem amigável de um erro do axios no formato padronizado da API. */
export function getErrorMessage(error: unknown, fallback: string = DEFAULT_ERROR_MESSAGE): string {
  if (!isAxiosError<ApiErrorPayload>(error)) {
    return fallback;
  }

  if (!error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  // 5xx nunca mostra o texto do servidor, só a mensagem fixa.
  if (error.response.status >= 500) {
    return SERVER_ERROR_MESSAGE;
  }

  // Um único campo inválido: a mensagem dele diz mais que o genérico
  // "Revise os campos destacados."
  const errors = errosDeCampo(error);
  if (errors.length === 1) {
    return errors[0].message;
  }

  const message = error.response.data?.message;

  if (Array.isArray(message) && message.length > 0) {
    return String(message[0]);
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

export const RATE_LIMIT_MESSAGE = 'Muitas tentativas em pouco tempo. Aguarde cerca de 1 minuto e tente novamente.';

export function isRateLimitError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 429;
}

/**
 * 429 (rate limit do backend): mensagem fixa com quanto esperar. O texto do
 * backend é ignorado (ele já diz "aguarde um momento" e sairia repetido).
 * Retorna null para qualquer outro erro, para a tela seguir com a mensagem dela.
 */
export function getRateLimitMessage(error: unknown): string | null {
  return isRateLimitError(error) ? RATE_LIMIT_MESSAGE : null;
}

export interface SafeErrorLog {
  statusCode?: number;
  code?: string;
}

/**
 * Só o que é seguro mostrar no console: status e código do erro. Nada de
 * payload (pode ter dados de Aprendente), mensagem do servidor ou rota da API.
 * O build de produção ainda remove todo `console.*` (ver vite.config.ts).
 */
export function getSafeErrorLog(error: unknown): SafeErrorLog {
  if (isAxiosError<ApiErrorPayload>(error)) {
    return {
      statusCode: error.response?.status,
      code: error.response?.data?.code ?? error.code,
    };
  }

  return {};
}
