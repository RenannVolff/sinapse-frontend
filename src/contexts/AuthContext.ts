import { createContext } from 'react';

// Tipagem rigorosa do usuário que fica na memória
export interface User {
  id: string;
  nome: string;
  email: string;
  // Vem do backend no login; opcional porque sessões salvas antes desse campo
  // existir não o têm no localStorage.
  duploFatorAtivo?: boolean;
}

// Com 2FA ativo, o login por senha não autentica: devolve um token temporário
// que precisa ser trocado junto com o código em confirmarDoisFatores().
export type SignInResult =
  | { pendente2fa: false }
  | { pendente2fa: true; tokenTemporario: string };

export interface AuthContextData {
  signed: boolean;
  user: User | null;
  signIn: (email: string, senha: string, website?: string) => Promise<SignInResult>;
  confirmarDoisFatores: (tokenTemporario: string, codigo: string) => Promise<void>;
  signOut: () => void;
  updateUser: (user: User) => void;
}

// Cria o contexto vazio, mas possivelmente terá o formato AuthContextData
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);
