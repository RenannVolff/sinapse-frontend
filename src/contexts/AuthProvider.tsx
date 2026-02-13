import { useState, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';
import { AuthContext, type User } from './AuthContext'; // Importa do arquivo do Passo 1

interface AuthResponse {
    access_token: string;
    usuario: User;
}

const STORAGE_KEY_TOKEN = 'sinapse.token';
const STORAGE_KEY_USER = 'sinapse.user';

export function AuthProvider({ children }: { children: ReactNode }) {
    // Lazy Initialization
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem(STORAGE_KEY_USER);
        const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

        if (storedUser && storedToken) {
            try {
                return JSON.parse(storedUser) as User;
            } catch {
                return null;
            }
        }
        return null;
    });

    const signIn = useCallback(async (email: string, senha: string) => {
        const response = await api.post<AuthResponse>('/auth/login', {
            email,
            senha,
        });

        const { access_token, usuario } = response.data;

        localStorage.setItem(STORAGE_KEY_TOKEN, access_token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(usuario));

        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        setUser(usuario);
    }, []);

    const signOut = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);

        delete api.defaults.headers.common['Authorization'];

        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, isAuthenticated: !!user, signIn, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
}
