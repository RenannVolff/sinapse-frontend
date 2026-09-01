import { useState, type ReactNode } from 'react';
import { AuthContext, type User } from './AuthContext';
import { api } from '../services/api';

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  token: string;
  usuario: User;
}

interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

// Decodifica só o payload (parte do meio) do JWT, sem verificar assinatura.
// A verificação de assinatura é responsabilidade exclusiva do backend.
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    // Sem 'exp' no payload não há como afirmar que expirou; o backend segue como fonte da verdade.
    return false;
  }

  return payload.exp < Date.now() / 1000;
}

function clearAuthStorage() {
  localStorage.removeItem('@SinapseEdu:user');
  localStorage.removeItem('@SinapseEdu:token');
  delete api.defaults.headers.common['Authorization'];
}

export function AuthProvider({ children }: AuthProviderProps) {

    // Estado do usuário, inicialmente tenta puxar do localStorage para manter a sessão
  const [user, setUser] = useState<User | null>(() => {
    const storageUser = localStorage.getItem('@SinapseEdu:user');
    const storageToken = localStorage.getItem('@SinapseEdu:token');

    if (storageUser && storageToken) {
      if (isTokenExpired(storageToken)) {
        clearAuthStorage();
        return null;
      }

      // Injeta o token no Axios instantaneamente antes mesmo da tela piscar
      api.defaults.headers.common['Authorization'] = `Bearer ${storageToken}`;
      return JSON.parse(storageUser);
    }

    return null;
  });

  const signIn = (email: string, senha: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      api.post<LoginResponse>('/auth/login', { email, senha })
        .then((response) => {
          const { token, usuario } = response.data;

          localStorage.setItem('@SinapseEdu:user', JSON.stringify(usuario));
          localStorage.setItem('@SinapseEdu:token', token);

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(usuario);
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  // Função de Logout segura
  const signOut = () => {
    clearAuthStorage();
    setUser(null);
  };

  // Atualização em tempo real (Usado na tela de configurações)
  const updateUser = (updatedUser: User) => {
    localStorage.setItem('@SinapseEdu:user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}