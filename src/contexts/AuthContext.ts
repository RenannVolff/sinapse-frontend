import { createContext } from 'react';

export interface User {
  id: string;
  nome: string;
  email: string;
  // Opcional porque sessões salvas antes do 2FA não têm o campo no localStorage.
  duploFatorAtivo?: boolean;
}

// Com 2FA ativo, a senha sozinha não autentica: vem um token temporário que
// é trocado, junto com o código, em confirmarDoisFatores().
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

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);
