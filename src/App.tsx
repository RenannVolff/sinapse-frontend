import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { Login } from './pages/Login';
import { DefaultLayout } from './components/layout/DefaultLayout';

// Componentes temporários (Placeholders) para testar a navegação
const Dashboard = () => <h1 className="text-2xl font-bold">📊 Dashboard Geral</h1>;
const Alunos = () => <h1 className="text-2xl font-bold">🎓 Gestão de Alunos</h1>;
const Agenda = () => <h1 className="text-2xl font-bold">📅 Agenda de Sessões</h1>;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<Login />} />

          {/* Rotas Privadas (Protegidas pelo Layout) */}
          <Route element={<DefaultLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/agenda" element={<Agenda />} />
            
            {/* Redireciona qualquer rota desconhecida para o dashboard se estiver logado */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}