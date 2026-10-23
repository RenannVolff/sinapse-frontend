import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Mail, Loader2, MailCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { getRateLimitMessage, getSafeErrorLog } from '../services/apiError';
import { SynapseBackground } from '../components/ui/SynapseBackground';
import { LIMITES } from '../constants/limits';

export function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErro('');

    // A resposta do backend é sempre genérica (não revela se o email existe),
    // então mostramos a mesma tela de sucesso independente do resultado. A
    // exceção é o limite de tentativas: aí o pedido nem foi processado.
    api.post('/auth/esqueci-senha', { email })
      .then(() => setEnviado(true))
      .catch((err: unknown) => {
        console.error('[EsqueciSenha] Erro ao solicitar redefinição:', getSafeErrorLog(err));
        const limite = getRateLimitMessage(err);
        if (limite) setErro(limite);
        else setEnviado(true);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen min-h-dvh relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0F2B29] via-[#153F3B] to-[#1F5A56] p-4 max-lg:pb-[calc(var(--cookie-bar-altura,0px)+1rem)]">
      <SynapseBackground className="absolute inset-0 w-full h-full text-white/[0.12]" />

      <div className="relative z-10 w-full max-w-[26.25rem] animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
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
                Se esse e-mail estiver cadastrado, você receberá um link de recuperação.
              </p>

              <Link to="/" className="text-sm text-primary font-bold hover:text-primary-hover transition-colors pt-2">
                Voltar para a tela de entrada
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="esquecisenha-email" className="text-sm font-bold text-text-primary ml-1">E-mail Profissional</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="esquecisenha-email"
                    type="email"
                    maxLength={LIMITES.EMAIL_LOGIN}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    placeholder="admin@sinapse.edu.br"
                    className="w-full bg-background border-2 border-primary-light rounded-xl py-3.5 pl-11 pr-4 outline-none text-text-primary font-medium transition-all duration-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              {erro && (
                <div role="alert" className="p-3.5 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
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
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Enviar link de recuperação'}
                  </span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link to="/" className="text-sm text-primary font-bold hover:text-primary-hover transition-colors">
                  Voltar para a tela de entrada
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
