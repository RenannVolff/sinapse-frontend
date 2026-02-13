import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Lock, Mail } from 'lucide-react';

import { useAuth } from '../hooks/useAuth'; // Importa do Hook separado
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Login() {
  const { signIn } = useAuth(); // Uso mais limpo
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, senha);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('E-mail ou senha incorretos. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Lado Esquerdo - Branding (Fixo) */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex items-center gap-3 text-white">
          <BrainCircuit className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight">Sinapse Edu</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Gestão inteligente para neuropsicopedagogia.
          </h1>
          <p className="text-blue-100 text-lg">
            Acompanhe a evolução cognitiva dos seus aprendentes com dados precisos e relatórios automatizados.
          </p>
        </div>
        
        <div className="relative z-10 text-blue-200 text-sm font-medium">
          © 2026 Sinapse Edu Tecnologia.
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Bem-vindo</h2>
            <p className="mt-2 text-gray-600">Insira suas credenciais para acessar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="E-mail Profissional" 
              type="email" 
              placeholder="seu.email@sinapse.edu.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="h-5 w-5" />}
              required
            />

            <Input 
              label="Senha" 
              type="password" 
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              icon={<Lock className="h-5 w-5" />}
              required
            />

            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <Button type="submit" isLoading={loading}>
              Acessar Plataforma
            </Button>
            
            <div className="text-center pt-2">
              <button 
                type="button" 
                className="text-sm text-primary font-medium hover:text-primary-hover hover:underline transition-all"
              >
                Esqueceu a senha?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}