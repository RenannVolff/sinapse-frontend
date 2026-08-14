import { isAxiosError } from 'axios';

// Formato padronizado retornado pelo GlobalExceptionFilter do backend
export interface ApiErrorPayload {
  statusCode: number;
  message: string | string[];
  timestamp?: string;
  path?: string;
}

const DEFAULT_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';
const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor. Verifique sua conexão.';

/** Extrai uma mensagem amigável de um erro do axios no formato padronizado da API. */
export function getErrorMessage(error: unknown, fallback: string = DEFAULT_ERROR_MESSAGE): string {
  if (!isAxiosError<ApiErrorPayload>(error)) {
    return fallback;
  }

  if (!error.response) {
    return NETWORK_ERROR_MESSAGE;
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

export interface SafeErrorLog {
  statusCode?: number;
  message: string;
  path?: string;
}

/**
 * Retorna apenas dados seguros para log (statusCode/message/path).
 * Nunca inclui o payload da requisição/resposta, que pode conter PII de Aprendente.
 */
export function getSafeErrorLog(error: unknown): SafeErrorLog {
  if (isAxiosError<ApiErrorPayload>(error)) {
    return {
      statusCode: error.response?.status,
      message: getErrorMessage(error),
      path: error.config?.url,
    };
  }

  return { message: DEFAULT_ERROR_MESSAGE };
}
