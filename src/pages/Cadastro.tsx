import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrainCircuit, Mail, Lock, User, UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import { api } from '../services/api';

export function Cadastro() {
  const navigate = useNavigate();
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleCadastro = (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    api.post('/usuarios', {
      nome,
      email,
      senha
    })
      .then(() => {
        setSucesso('Conta criada! Redirecionando...');
        setTimeout(() => {
          navigate('/'); 
        }, 2000);
      })
      .catch((err: unknown) => {
        console.error('Erro ao cadastrar:', err);
        if (isAxiosError(err) && err.response?.data?.message) {
          const msg = err.response.data.message;
          setErro(Array.isArray(msg) ? msg[0] : msg);
        } else {
          setErro('Erro no servidor. Tente novamente.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    // Removido o py-12 para centralização absoluta
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-4">
      
      {/* Elementos Flutuantes de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-[460px] animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
        {/* Padding interno do card reduzido (p-6 sm:p-8) */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/50 border border-white/20 p-6 sm:p-8">
          
          {/* Logo e Cabeçalho mais compactos */}
          <div className="flex flex-col items-center mb-5">
            <div className="h-14 w-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30 transform transition-transform hover:scale-105 duration-300">
              <BrainCircuit className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Crie sua conta</h1>
            <p className="text-xs font-medium text-gray-500 mt-1 text-center">
              Acesse a plataforma Sinapse Edu
            </p>
          </div>

          {/* Espaçamento entre inputs reduzido (space-y-3) */}
          <form onSubmit={handleCadastro} className="space-y-3">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 ml-1">Nome Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <User className="h-4 w-4" />
                </div>
                {/* Altura dos inputs reduzida (py-2.5) */}
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={loading || !!sucesso}
                  required
                  placeholder="Ex: Dr. João Silva"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-2.5 pl-10 pr-4 outline-none text-gray-900 text-sm font-medium transition-all duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 ml-1">E-mail Profissional</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || !!sucesso}
                  required
                  placeholder="seu@email.com.br"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-2.5 pl-10 pr-4 outline-none text-gray-900 text-sm font-medium transition-all duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Gap reduzido (gap-3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 ml-1">Criar Senha</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={loading || !!sucesso}
                    required
                    placeholder="Mín. 6 char"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-2.5 pl-10 pr-4 outline-none text-gray-900 text-sm font-medium transition-all duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 ml-1">Confirmar</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    disabled={loading || !!sucesso}
                    required
                    placeholder="Repita a senha"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-2.5 pl-10 pr-4 outline-none text-gray-900 text-sm font-medium transition-all duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Avisos */}
            {erro && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                {sucesso}
              </div>
            )}

            {/* Botão mais estreito (h-12) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !!sucesso}
                className="w-full relative group overflow-hidden rounded-xl bg-blue-600 text-white font-bold h-12 transition-all duration-300 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative flex items-center justify-center gap-2 text-sm">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Cadastrar e Acessar
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Margens do rodapé reduzidas */}
          <div className="mt-5 pt-4 border-t border-gray-100/60 text-center">
            <p className="text-xs text-gray-600 font-medium">
              Já possui uma conta?{' '}
              <Link to="/" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                Faça login aqui
              </Link>
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