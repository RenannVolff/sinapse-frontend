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

export function AuthProvider({ children }: AuthProviderProps) {
  
    // Estado do usuário, inicialmente tenta puxar do localStorage para manter a sessão
  const [user, setUser] = useState<User | null>(() => {
    const storageUser = localStorage.getItem('@SinapseEdu:user');
    const storageToken = localStorage.getItem('@SinapseEdu:token');

    if (storageUser && storageToken) {
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
    localStorage.removeItem('@SinapseEdu:user');
    localStorage.removeItem('@SinapseEdu:token');
    delete api.defaults.headers.common['Authorization'];
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