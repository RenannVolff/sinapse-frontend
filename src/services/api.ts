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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log seguro: nunca o objeto de erro cru (pode conter payload de Aprendente/responsável).
    console.error('[API Error]', getSafeErrorLog(error));

    const isLoginAttempt = error.config?.url?.includes('/auth/login');

    if (
      error.response &&
      error.response.status === 401 &&
      !isLoginAttempt
    ) {
      emitToast('Sua sessão expirou. Faça login novamente.', 'error');

      localStorage.removeItem('@SinapseEdu:user');
      localStorage.removeItem('@SinapseEdu:token');

      window.location.href = '/';
    } else if (!isLoginAttempt) {
      // Login tem tratamento de erro próprio (mensagem genérica por segurança).
      emitToast(getErrorMessage(error), 'error');
    }

    return Promise.reject(error);
  }
);
