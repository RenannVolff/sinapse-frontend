import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DefaultLayout } from './components/layout/DefaultLayout';

import { AlunosList } from './pages/alunos/AlunosList';
import { NovoAluno } from './pages/alunos/NovoAluno';

// --- Novas importações da Agenda ---
import { AgendaList } from './pages/agenda/AgendaList';
import { NovaSessao } from './pages/agenda/NovaSessao';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={<DefaultLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/alunos" element={<AlunosList />} />
            <Route path="/alunos/novo" element={<NovoAluno />} />
            
            {/* --- Novas rotas da Agenda --- */}
            <Route path="/agenda" element={<AgendaList />} />
            <Route path="/agenda/nova" element={<NovaSessao />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}