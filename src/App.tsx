import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard'; // <--- Importe o novo arquivo
import { DefaultLayout } from './components/layout/DefaultLayout';

// Placeholders para as próximas telas
const Alunos = () => <div className="p-8"><h1 className="text-2xl font-bold">Gestão de Alunos (Em breve)</h1></div>;
const Agenda = () => <div className="p-8"><h1 className="text-2xl font-bold">Agenda (Em breve)</h1></div>;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={<DefaultLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/agenda" element={<Agenda />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}