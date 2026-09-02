import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ToastProvider } from './contexts/ToastProvider';
import { Cadastro } from './pages/Cadastro';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DefaultLayout } from './components/layout/DefaultLayout';
import { PrivateRoute } from './components/auth/PrivateRoute';

import { AprendentesList } from './pages/aprendentes/AprendentesList';
import { NovoAprendente } from './pages/aprendentes/NovoAprendente';
import { AprendenteDetalhes } from './pages/aprendentes/AprendenteDetalhes';

import { PeiList } from './pages/pei/PeiList';
import { NovoPei } from './pages/pei/NovoPei';
import { PeiDetalhes } from './pages/pei/PeiDetalhes';

import { PeiTemplatesList } from './pages/pei-templates/PeiTemplatesList';
import { NovoPeiTemplate } from './pages/pei-templates/NovoPeiTemplate';

import { AgendaList } from './pages/agenda/AgendaList';
import { NovaSessao } from './pages/agenda/NovaSessao';
import { SessaoAtiva } from './pages/agenda/SessaoAtiva';

import { Relatorios } from './pages/relatorios/Relatorios';
import { Auditoria } from './pages/auditoria/Auditoria';
import { Configuracoes } from './pages/configuracoes/Configuracoes';
import { NotFound } from './pages/NotFound'; // <-- Rota 404
import { VLibrasWidget } from './components/ui/VLibrasWidget';
import { CookieBanner } from './components/ui/CookieBanner';
import { AccessibilityWidgetsPositioner } from './components/ui/AccessibilityWidgetsPositioner';

export default function App() {
  return (
    <BrowserRouter>
      <CookieBanner />
      <VLibrasWidget />
      <AccessibilityWidgetsPositioner />
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Rota Pública */}
            <Route path="/" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Rotas Privadas */}
            <Route element={<PrivateRoute />}>
              <Route element={<DefaultLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/aprendentes" element={<AprendentesList />} />
                <Route path="/aprendentes/novo" element={<NovoAprendente />} />
                <Route path="/aprendentes/:id" element={<AprendenteDetalhes />} />

                <Route path="/aprendentes/:aprendenteId/pei" element={<PeiList />} />
                <Route path="/aprendentes/:aprendenteId/pei/novo" element={<NovoPei />} />
                <Route path="/pei/:id" element={<PeiDetalhes />} />

                <Route path="/pei-templates" element={<PeiTemplatesList />} />
                <Route path="/pei-templates/novo" element={<NovoPeiTemplate />} />

                <Route path="/agenda" element={<AgendaList />} />
                <Route path="/agenda/nova" element={<NovaSessao />} />
                <Route path="/agenda/:id/sessao" element={<SessaoAtiva />} />

                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/auditoria" element={<Auditoria />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
              </Route>
            </Route>

            {/* Rota "Pega Tudo" para links quebrados */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}