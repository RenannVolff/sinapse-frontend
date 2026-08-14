import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ToastProvider } from './contexts/ToastProvider';
import { Cadastro } from './pages/Cadastro';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DefaultLayout } from './components/layout/DefaultLayout';

import { AprendentesList } from './pages/aprendentes/AprendentesList';
import { NovoAprendente } from './pages/aprendentes/NovoAprendente';
import { AprendenteDetalhes } from './pages/aprendentes/AprendenteDetalhes';

import { AgendaList } from './pages/agenda/AgendaList';
import { NovaSessao } from './pages/agenda/NovaSessao';
import { SessaoAtiva } from './pages/agenda/SessaoAtiva';

import { Relatorios } from './pages/relatorios/Relatorios';
import { Auditoria } from './pages/auditoria/Auditoria';
import { Configuracoes } from './pages/configuracoes/Configuracoes';
import { NotFound } from './pages/NotFound'; // <-- Rota 404

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Rota Pública */}
            <Route path="/" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Rotas Privadas */}
            <Route element={<DefaultLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/aprendentes" element={<AprendentesList />} />
              <Route path="/aprendentes/novo" element={<NovoAprendente />} />
              <Route path="/aprendentes/:id" element={<AprendenteDetalhes />} />

              <Route path="/agenda" element={<AgendaList />} />
              <Route path="/agenda/nova" element={<NovaSessao />} />
              <Route path="/agenda/:id/sessao" element={<SessaoAtiva />} />

              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>

            {/* Rota "Pega Tudo" para links quebrados */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}