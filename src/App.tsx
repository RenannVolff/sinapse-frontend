import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DefaultLayout } from './components/layout/DefaultLayout';

import { AlunosList } from './pages/alunos/AlunosList';
import { NovoAluno } from './pages/alunos/NovoAluno';
import { AlunoDetalhes } from './pages/alunos/AlunoDetalhes';

import { AgendaList } from './pages/agenda/AgendaList';
import { NovaSessao } from './pages/agenda/NovaSessao';
import { SessaoAtiva } from './pages/agenda/SessaoAtiva';

import { Relatorios } from './pages/relatorios/Relatorios';
import { Configuracoes } from './pages/configuracoes/Configuracoes';
import { NotFound } from './pages/NotFound'; // <-- Rota 404

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<Login />} />

          {/* Rotas Privadas */}
          <Route element={<DefaultLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/alunos" element={<AlunosList />} />
            <Route path="/alunos/novo" element={<NovoAluno />} />
            <Route path="/alunos/:id" element={<AlunoDetalhes />} />
            
            <Route path="/agenda" element={<AgendaList />} />
            <Route path="/agenda/nova" element={<NovaSessao />} />
            <Route path="/agenda/:id/sessao" element={<SessaoAtiva />} />
            
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Rota "Pega Tudo" para links quebrados */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}