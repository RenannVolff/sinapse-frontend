import { createContext } from 'react';

// Tipagem rigorosa do usuário que fica na memória
export interface User {
  id: string;
  nome: string;
  email: string;
}
export interface AuthContextData {
  signed: boolean;
  user: User | null;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => void;
  updateUser: (user: User) => void;
}

// Cria o contexto vazio, mas possivelmente terá o formato AuthContextData
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);