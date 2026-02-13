import { createContext } from 'react';

// Definição dos Tipos
export interface User {
    id: string;
    nome: string;
    email: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (email: string, senha: string) => Promise<void>;
    signOut: () => void;
}

// Criação do Contexto (exportamos daqui para ser usado no Hook e no Provider)
export const AuthContext = createContext<AuthContextType | undefined>(undefined);