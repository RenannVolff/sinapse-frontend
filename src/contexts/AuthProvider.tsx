import { useState, type ReactNode } from 'react';
import { AuthContext, type SignInResult, type User } from './AuthContext';
import { api } from '../services/api';
import { isTokenExpired } from '../utils/jwt';

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  token: string;
  usuario: User;
}

interface PendenteDoisFatoresResponse {
  pendente2fa: true;
  tokenTemporario: string;
}

function clearAuthStorage() {
  localStorage.removeItem('@SinapseEdu:user');
  localStorage.removeItem('@SinapseEdu:token');
  delete api.defaults.headers.common['Authorization'];
}

export function AuthProvider({ children }: AuthProviderProps) {

  // Restaura a sessão do localStorage, descartando token já expirado.
  const [user, setUser] = useState<User | null>(() => {
    const storageUser = localStorage.getItem('@SinapseEdu:user');
    const storageToken = localStorage.getItem('@SinapseEdu:token');

    if (storageUser && storageToken) {
      if (isTokenExpired(storageToken)) {
        clearAuthStorage();
        return null;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${storageToken}`;
      return JSON.parse(storageUser);
    }

    return null;
  });

  const iniciarSessao = (token: string, usuario: User) => {
    localStorage.setItem('@SinapseEdu:user', JSON.stringify(usuario));
    localStorage.setItem('@SinapseEdu:token', token);

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(usuario);
  };

  const signIn = (email: string, senha: string, website?: string): Promise<SignInResult> => {
    return api.post<LoginResponse | PendenteDoisFatoresResponse>('/auth/login', { email, senha, website })
      .then((response) => {
        const data = response.data;

        if ('pendente2fa' in data && data.pendente2fa) {
          return { pendente2fa: true, tokenTemporario: data.tokenTemporario };
        }

        const { token, usuario } = data as LoginResponse;
        iniciarSessao(token, usuario);
        return { pendente2fa: false };
      });
  };

  const confirmarDoisFatores = (tokenTemporario: string, codigo: string): Promise<void> => {
    return api.post<LoginResponse>('/auth/2fa/verificar-login', { tokenTemporario, codigo })
      .then((response) => {
        const { token, usuario } = response.data;
        iniciarSessao(token, usuario);
      });
  };

  const signOut = () => {
    clearAuthStorage();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('@SinapseEdu:user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, confirmarDoisFatores, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}