import axios from 'axios';

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
    if (
      error.response && 
      error.response.status === 401 && 
      !error.config?.url?.includes('/auth/login')
    ) {
      console.warn('Sessão expirada ou token inválido. Deslogando...');
      
      localStorage.removeItem('@SinapseEdu:user');
      localStorage.removeItem('@SinapseEdu:token');
      
      window.location.href = '/'; 
    }
    
    return Promise.reject(error);
  }
);