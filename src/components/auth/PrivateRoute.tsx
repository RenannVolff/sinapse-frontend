import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { TOKEN_STORAGE_KEY } from '../../services/api';
import { isTokenExpired } from '../../utils/jwt';

// Guarda de rota: bloqueia o acesso às rotas privadas antes mesmo de renderizá-las,
// sem depender de uma chamada de API falhar primeiro. useLocation faz a guarda
// renderizar de novo a cada troca de rota (inclusive pelo menu), então o token
// é reavaliado em toda navegação, não só no carregamento da página.
export function PrivateRoute() {
  const { signed, signOut } = useAuth();
  const location = useLocation();

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const sessaoValida = signed && !!token && !isTokenExpired(token);

  useEffect(() => {
    if (signed && !sessaoValida) signOut();
  }, [signed, sessaoValida, signOut, location.key]);

  if (!sessaoValida) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
