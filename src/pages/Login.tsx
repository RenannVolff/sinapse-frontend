import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrainCircuit, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    signIn(email, senha)
      .then(() => navigate('/dashboard'))
      .catch(() => setError('Acesso negado. E-mail ou senha incorretos.'))
      .finally(() => setLoading(false));
  };

  return (
    // Fundo Premium com Gradiente Animado (Estilo Deep Blue/Indigo)
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-hover to-primary p-4">

      {/* Elementos Flutuantes de Fundo (Decoração) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-primary-hover/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Card de Login (Glassmorphism sutil e Sombras Profundas) */}
      <div className="relative z-10 w-full max-w-[420px] animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/50 border border-white/20 p-8 sm:p-10">

          {/* Logo Animada */}
          <div className="flex flex-col items-center mb-10">
            <div className="h-20 w-20 bg-gradient-to-tr from-primary to-primary-hover rounded-3xl flex items-center justify-center mb-5 shadow-lg shadow-primary/30 transform transition-transform hover:scale-105 duration-300">
              <BrainCircuit className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight">Sinapse Edu</h1>
            <p className="text-sm font-medium text-text-secondary mt-2 text-center">
              Gestão Neuropsicopedagógica
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input E-mail Customizado para esta tela */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-primary ml-1">E-mail Profissional</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="admin@sinapse.edu.br"
                  className="w-full bg-background border-2 border-primary-light rounded-xl py-3.5 pl-11 pr-4 outline-none text-text-primary font-medium transition-all duration-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* Input Senha Customizado */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-primary ml-1">Senha de Acesso</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="••••••••"
                  className="w-full bg-background border-2 border-primary-light rounded-xl py-3.5 pl-11 pr-4 outline-none text-text-primary font-medium transition-all duration-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Botão Premium */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-xl bg-primary text-white font-bold h-14 transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {/* Efeito de brilho passando pelo botão */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      Entrar na Clínica
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Rodapé Elegante com o link para cadastro */}
          <div className="mt-8 pt-6 border-t border-primary-light/60 text-center space-y-4">
            <p className="text-sm text-text-secondary font-medium">
              Não possui uma conta?{' '}
              <Link to="/cadastro" className="text-primary font-bold hover:text-primary-hover transition-colors">
                Cadastre-se aqui
              </Link>
            </p>
            <p className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">
              Acesso exclusivo e monitorado
            </p>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}