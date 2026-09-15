import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Lock, Loader2, AlertCircle, CheckCircle2, KeyRound, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { getErrorMessage, getSafeErrorLog } from '../services/apiError';
import { SynapseBackground } from '../components/ui/SynapseBackground';

type Status = 'formulario' | 'sucesso' | 'tokenInvalido';

export function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>(token ? 'formulario' : 'tokenInvalido');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!token) {
      setStatus('tokenInvalido');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    api.post('/auth/redefinir-senha', { token, novaSenha })
      .then(() => setStatus('sucesso'))
      .catch((err: unknown) => {
        console.error('[RedefinirSenha] Erro ao redefinir senha:', getSafeErrorLog(err));
        if (isAxiosError(err) && err.response?.status === 400) {
          setStatus('tokenInvalido');
        } else {
          setErro(getErrorMessage(err, 'Não foi possível redefinir sua senha. Tente novamente.'));
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0F2B29] via-[#153F3B] to-[#1F5A56] p-4">
      <SynapseBackground className="absolute inset-0 w-full h-full text-white/[0.12]" />

      <div className="relative z-10 w-full max-w-[440px] animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/50 border border-white/20 p-8 sm:p-10">

          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-16 w-16 bg-gradient-to-tr from-primary to-primary-hover rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">Redefinir senha</h1>
          </div>

          {status === 'tokenInvalido' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-14 w-14 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
              <p className="text-red-700 font-bold text-sm">
                Link de redefinição inválido ou expirado.
              </p>
              <p className="text-text-secondary text-sm">
                Solicite um novo link para continuar com a recuperação de senha.
              </p>

              <Link to="/esqueci-senha" className="w-full pt-2">
                <button
                  type="button"
                  className="w-full relative group overflow-hidden rounded-xl bg-primary text-white font-bold h-14 transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    Solicitar nova recuperação
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </Link>

              <Link to="/" className="text-sm text-primary font-bold hover:text-primary-hover transition-colors">
                Voltar para o login
              </Link>
            </div>
          )}

          {status === 'sucesso' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-text-primary font-bold">
                Senha redefinida com sucesso. Você já pode fazer login.
              </p>

              <Link to="/" className="w-full pt-2">
                <button
                  type="button"
                  className="w-full relative group overflow-hidden rounded-xl bg-primary text-white font-bold h-14 transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    Ir para o login
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </Link>
            </div>
          )}

          {status === 'formulario' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">Nova senha</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    disabled={loading}
                    required
                    placeholder="••••••••"
                    className="w-full bg-background border-2 border-primary-light rounded-xl py-3.5 pl-11 pr-4 outline-none text-text-primary font-medium transition-all duration-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">Confirmar nova senha</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    disabled={loading}
                    required
                    placeholder="••••••••"
                    className="w-full bg-background border-2 border-primary-light rounded-xl py-3.5 pl-11 pr-4 outline-none text-text-primary font-medium transition-all duration-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              <p className="text-xs text-text-secondary ml-1">
                Mínimo 8 caracteres, com 1 letra maiúscula, 1 minúscula e 1 número ou símbolo.
              </p>

              {erro && (
                <div className="p-3.5 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  {erro}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl bg-primary text-white font-bold h-14 transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Redefinir senha'}
                  </span>
                </button>
              </div>
            </form>
          )}

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
