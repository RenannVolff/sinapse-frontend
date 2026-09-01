import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isTokenExpired } from '../../contexts/AuthProvider';

// Guarda de rota: bloqueia o acesso às rotas privadas antes mesmo de renderizá-las,
// sem depender de uma chamada de API falhar primeiro.
export function PrivateRoute() {
  const { signed, signOut } = useAuth();

  if (!signed) {
    return <Navigate to="/" replace />;
  }

  const token = localStorage.getItem('@SinapseEdu:token');

  if (!token || isTokenExpired(token)) {
    signOut();
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
