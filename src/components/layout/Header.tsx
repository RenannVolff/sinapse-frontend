import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, Bell, User, Calendar, ListTodo, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import { MobileNav, MOBILE_NAV_ID } from './MobileNav';

export function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { sessoes, tarefas, naoLidasCount, marcarComoLidas } = useNotificacoes();
  const [painelAberto, setPainelAberto] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuBotaoRef = useRef<HTMLButtonElement>(null);
  const fecharMenu = useCallback(() => setMenuAberto(false), []);

  // Trocou de rota (link do menu, voltar do navegador...): o menu fecha.
  const { pathname } = useLocation();
  const [rotaAtual, setRotaAtual] = useState(pathname);
  if (rotaAtual !== pathname) {
    setRotaAtual(pathname);
    setMenuAberto(false);
  }

  useEffect(() => {
    if (!painelAberto) return;

    const handleClickFora = (e: MouseEvent) => {
      if (painelRef.current && !painelRef.current.contains(e.target as Node)) {
        setPainelAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [painelAberto]);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const handleAbrirPainel = () => {
    setPainelAberto((prev) => {
      const abrindo = !prev;
      if (abrindo) marcarComoLidas();
      return abrindo;
    });
  };

  const handleClickNotificacao = (destino: '/agenda' | '/dashboard') => {
    setPainelAberto(false);
    navigate(destino);
  };

  const semNotificacoes = sessoes.length === 0 && tarefas.length === 0;

  return (
    <header className="h-16 bg-white border-b border-primary-light flex items-center justify-between gap-2 px-4 sm:px-6 lg:gap-0 transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-4 max-lg:min-w-0">
        <button
          ref={menuBotaoRef}
          type="button"
          onClick={() => setMenuAberto(true)}
          className="lg:hidden -ml-2 h-11 w-11 shrink-0 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
          aria-label="Abrir menu de navegação"
          aria-expanded={menuAberto}
          aria-controls={MOBILE_NAV_ID}
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-xs sm:text-sm font-bold text-text-secondary uppercase tracking-wider max-lg:truncate">
          Área do Profissional
        </h2>
      </div>

      {/* Ações e Perfil do Usuário */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <div className="relative" ref={painelRef}>
          <button
            onClick={handleAbrirPainel}
            className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light rounded-full transition-colors relative"
            title="Notificações"
          >
            <Bell className="h-5 w-5" />
            {naoLidasCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full border border-white">
                {naoLidasCount > 9 ? '9+' : naoLidasCount}
              </span>
            )}
          </button>

          {painelAberto && (
            <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-2 sm:w-80 bg-white border border-primary-light rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-primary-light">
                <h3 className="text-sm font-bold text-text-primary">Notificações</h3>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {semNotificacoes ? (
                  <div className="px-4 py-8 text-center text-sm text-text-secondary">
                    Nenhuma notificação no momento
                  </div>
                ) : (
                  <>
                    {sessoes.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Sessões
                        </p>
                        {sessoes.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleClickNotificacao('/agenda')}
                            className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-primary-light/50 transition-colors"
                          >
                            <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-text-primary">{n.texto}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {tarefas.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Tarefas
                        </p>
                        {tarefas.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleClickNotificacao('/dashboard')}
                            className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-primary-light/50 transition-colors"
                          >
                            <ListTodo className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-text-primary">{n.texto}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-primary-light mx-1"></div>

        <div className="flex items-center gap-3">
          {/* Dados do Usuário */}
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-text-primary">{user?.nome || 'Terapeuta'}</p>
            <p className="text-xs font-medium text-text-secondary">{user?.email}</p>
          </div>

          <button
            onClick={() => navigate('/configuracoes')}
            className="h-9 w-9 bg-primary-light hover:bg-primary-light/70 border border-primary-light rounded-full flex items-center justify-center text-primary font-bold transition-colors shadow-sm"
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

      {menuAberto && <MobileNav onClose={fecharMenu} triggerRef={menuBotaoRef} />}
    </header>
  );
}
