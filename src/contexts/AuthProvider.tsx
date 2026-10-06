import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext, type SignInResult, type User } from './AuthContext';
import { api, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../services/api';
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

// O cabeçalho Authorization não é guardado no axios: o interceptor de
// request lê o token do localStorage a cada chamada.
function clearAuthStorage() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: AuthProviderProps) {

  // Restaura a sessão do localStorage, descartando token ausente ou expirado.
  const [user, setUser] = useState<User | null>(() => {
    const storageUser = localStorage.getItem(USER_STORAGE_KEY);
    const storageToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storageToken || isTokenExpired(storageToken)) {
      clearAuthStorage();
      return null;
    }

    return storageUser ? JSON.parse(storageUser) : null;
  });

  const signOut = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  // Logout em outra aba (ou token apagado nela) encerra a sessão nesta também.
  // O evento "storage" só dispara nas outras abas da mesma origem.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const tokenRemovido = event.key === null || (event.key === TOKEN_STORAGE_KEY && !event.newValue);
      if (tokenRemovido) signOut();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [signOut]);

  const iniciarSessao = (token: string, usuario: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
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

  const updateUser = (updatedUser: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, confirmarDoisFatores, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
