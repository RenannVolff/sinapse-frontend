import axios, { AxiosError } from 'axios';
import { getErrorMessage, getSafeErrorLog } from './apiError';
import { emitToast } from './toastBridge';

export const TOKEN_STORAGE_KEY = '@SinapseEdu:token';
export const USER_STORAGE_KEY = '@SinapseEdu:user';

// O fallback /backend-api só existe no proxy do Vite em desenvolvimento;
// em produção a URL do backend tem que vir de VITE_API_URL.
const apiUrl = import.meta.env.VITE_API_URL;

// Build de produção sem VITE_API_URL: /backend-api não existe na Vercel (o
// rewrite devolveria o index.html). Cada chamada falha na hora como erro de
// rede, e a tela mostra "Não foi possível conectar ao servidor", sem log. O
// aviso para quem publica sai no log do build (vite.config.ts).
const apiNaoConfigurada = !apiUrl && import.meta.env.PROD;

export const api = axios.create({
  baseURL: apiUrl || '/backend-api',
});

api.interceptors.request.use(
  (config) => {
    if (apiNaoConfigurada) {
      return Promise.reject(new AxiosError('API não configurada', AxiosError.ERR_NETWORK, config));
    }

    // O localStorage é a única fonte do token: sem ele, a requisição sai
    // sem Authorization, mesmo que algum valor antigo tenha ficado no config.
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.delete('Authorization');
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

const ROTAS_TELAS_DE_ACESSO = [
  '/auth/login',
  '/auth/2fa/verificar-login',
  '/auth/esqueci-senha',
  '/auth/redefinir-senha',
  '/auth/reenviar-verificacao',
  '/auth/verificar-email',
];
let consecutiveNetworkFailures = 0;

api.interceptors.response.use(
  (response) => {
    consecutiveNetworkFailures = 0;
    return response;
  },
  (error) => {
    // Nunca logar o erro cru: pode carregar dados de aprendente/responsável.
    // Só em desenvolvimento, e só status/código (sem rota nem mensagem).
    if (import.meta.env.DEV) {
      console.error('[API Error]', getSafeErrorLog(error));
    }

    // Código 2FA errado também volta 401, mas não pode derrubar a sessão.
    const url: string | undefined = error.config?.url;
    const isLoginAttempt = !!url && (url.includes('/auth/login') || url.includes('/auth/2fa/verificar-login'));
    const hasResponse = !!error.response;

    // Telas de acesso mostram o 429 elas mesmas (com o tempo de espera); o
    // toast genérico aqui só duplicaria o aviso.
    const isRateLimitOnAccessScreen =
      hasResponse &&
      error.response.status === 429 &&
      !!url &&
      (ROTAS_TELAS_DE_ACESSO.some((rota) => url.startsWith(rota)) ||
        (url === '/usuarios' && error.config?.method === 'post'));

    if (isRateLimitOnAccessScreen) {
      // Nada a fazer: a tela trata.
    } else if (hasResponse && error.response.status === 401 && !isLoginAttempt) {
      consecutiveNetworkFailures = 0;
      emitToast('Sua sessão expirou. Entre novamente.', 'error');

      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);

      window.location.href = '/';
    } else if (!hasResponse && !isLoginAttempt) {
      consecutiveNetworkFailures += 1;

      if (consecutiveNetworkFailures >= MAX_CONSECUTIVE_NETWORK_FAILURES) {
        consecutiveNetworkFailures = 0;
        emitToast('Não foi possível confirmar sua sessão. Entre novamente.', 'error');

        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);

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
