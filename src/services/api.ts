import axios from 'axios';
import { getErrorMessage, getSafeErrorLog } from './apiError';
import { emitToast } from './toastBridge';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/backend-api',
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

// Sem resposta do servidor (rede/timeout) não quer dizer token inválido, então
// só desloga depois de algumas falhas seguidas.
const MAX_CONSECUTIVE_NETWORK_FAILURES = 3;
let consecutiveNetworkFailures = 0;

api.interceptors.response.use(
  (response) => {
    consecutiveNetworkFailures = 0;
    return response;
  },
  (error) => {
    // Nunca logar o erro cru: pode carregar dados de aprendente/responsável.
    console.error('[API Error]', getSafeErrorLog(error));

    // Código 2FA errado também volta 401, mas não pode derrubar a sessão.
    const url: string | undefined = error.config?.url;
    const isLoginAttempt = !!url && (url.includes('/auth/login') || url.includes('/auth/2fa/verificar-login'));
    const hasResponse = !!error.response;

    if (hasResponse && error.response.status === 401 && !isLoginAttempt) {
      consecutiveNetworkFailures = 0;
      emitToast('Sua sessão expirou. Faça login novamente.', 'error');

      localStorage.removeItem('@SinapseEdu:user');
      localStorage.removeItem('@SinapseEdu:token');

      window.location.href = '/';
    } else if (!hasResponse && !isLoginAttempt) {
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
      // Login fica de fora: a tela mostra mensagem genérica própria, por segurança.
      emitToast(getErrorMessage(error), 'error');
    }

    return Promise.reject(error);
  }
);
