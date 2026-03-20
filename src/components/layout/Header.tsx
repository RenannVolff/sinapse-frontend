import { LogOut, Bell, User, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();


  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:ml-64 transition-all duration-300">
      
      
      <div className="flex items-center gap-4 sm:flex">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Área do Profissional
        </h2>
      </div>

      {/* Ações e Perfil do Usuário */}
      <div className="flex items-center gap-4 ml-auto">
        <button 
          className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-full transition-colors relative"
          title="Notificações"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-3">
          {/* Dados do Usuário */}
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-900">{user?.nome || 'Terapeuta'}</p>
            <p className="text-xs font-medium text-gray-500">{user?.email}</p>
          </div>
          
          <button 
            onClick={() => navigate('/configuracoes')}
            className="h-9 w-9 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-full flex items-center justify-center text-primary font-bold transition-colors shadow-sm"
            title="Acessar Perfil"
          >
            <User className="h-4 w-4" />
          </button>

          <button 
            onClick={handleLogout}
            className="p-2 ml-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            title="Sair com segurança"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}