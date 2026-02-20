import { LogOut, Bell, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
    const { user, signOut } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:ml-64 transition-all duration-300">
            {/* Lado Esquerdo: Título da Página (Podemos deixar dinâmico depois) */}
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Painel de Controle
                </h2>
            </div>

            {/* Lado Direito: Ações e Perfil */}
            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-full transition-colors relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold">
                        <User className="h-4 w-4" />
                    </div>

                    <button
                        onClick={signOut}
                        className="p-2 ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sair do sistema"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}