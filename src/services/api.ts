import axios from 'axios';
import { getErrorMessage, getSafeErrorLog } from './apiError';
import { emitToast } from './toastBridge';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem('@SinapseEdu:token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Falhas de rede/timeout (sem resposta do servidor) não indicam token inválido,
// então só forçam logout depois de algumas falhas seguidas — não numa falha isolada.
const MAX_CONSECUTIVE_NETWORK_FAILURES = 3;
let consecutiveNetworkFailures = 0;

api.interceptors.response.use(
  (response) => {
    consecutiveNetworkFailures = 0;
    return response;
  },
  (error) => {
    // Log seguro: nunca o objeto de erro cru (pode conter payload de Aprendente/responsável).
    console.error('[API Error]', getSafeErrorLog(error));

    const isLoginAttempt = error.config?.url?.includes('/auth/login');
    const hasResponse = !!error.response;

    if (hasResponse && error.response.status === 401 && !isLoginAttempt) {
      // Token realmente rejeitado pelo servidor.
      consecutiveNetworkFailures = 0;
      emitToast('Sua sessão expirou. Faça login novamente.', 'error');

      localStorage.removeItem('@SinapseEdu:user');
      localStorage.removeItem('@SinapseEdu:token');

      window.location.href = '/';
    } else if (!hasResponse && !isLoginAttempt) {
      // Sem resposta nenhuma (rede/timeout) — não é necessariamente sessão inválida.
      consecutiveNetworkFailures += 1;

      if (consecutiveNetworkFailures >= MAX_CONSECUTIVE_NETWORK_FAILURES) {
        consecutiveNetworkFailures = 0;
        emitToast('Não foi possível confirmar sua sessão. Faça login novamente.', 'error');

        localStorage.removeItem('@SinapseEdu:user');
        localStorage.removeItem('@SinapseEdu:token');

        window.location.href = '/';
      } else {
        emitToast(getErrorMessage(error), 'error');
      }
    } else if (!isLoginAttempt) {
      // Login tem tratamento de erro próprio (mensagem genérica por segurança).
      emitToast(getErrorMessage(error), 'error');
    }

    return Promise.reject(error);
  }
);
