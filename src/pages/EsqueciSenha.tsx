import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Mail, Loader2, MailCheck } from 'lucide-react';
import { api } from '../services/api';
import { getSafeErrorLog } from '../services/apiError';
import { SynapseBackground } from '../components/ui/SynapseBackground';

export function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    // A resposta do backend é sempre genérica (não revela se o email existe),
    // então sempre mostramos a mesma tela de sucesso, independente do resultado.
    api.post('/auth/esqueci-senha', { email })
      .catch((err: unknown) => {
        console.error('[EsqueciSenha] Erro ao solicitar redefinição:', getSafeErrorLog(err));
      })
      .finally(() => {
        setLoading(false);
        setEnviado(true);
      });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0F2B29] via-[#153F3B] to-[#1F5A56] p-4">
      <SynapseBackground className="absolute inset-0 w-full h-full text-white/[0.12]" />

      <div className="relative z-10 w-full max-w-[420px] animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/50 border border-white/20 p-8 sm:p-10">

          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-16 w-16 bg-gradient-to-tr from-primary to-primary-hover rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <BrainCircuit className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">Recuperar senha</h1>
            <p className="text-sm font-medium text-text-secondary mt-2">
              {enviado
                ? 'Verifique sua caixa de entrada.'
                : 'Informe seu e-mail para receber o link de recuperação.'}
            </p>
          </div>

          {enviado ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center">
                <MailCheck className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-text-primary font-medium">
                Se esse email estiver cadastrado, você receberá um link de recuperação.
              </p>

              <Link to="/" className="text-sm text-primary font-bold hover:text-primary-hover transition-colors pt-2">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl bg-primary text-white font-bold h-14 transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Enviar link de recuperação'}
                  </span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link to="/" className="text-sm text-primary font-bold hover:text-primary-hover transition-colors">
                  Voltar para o login
                </Link>
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
