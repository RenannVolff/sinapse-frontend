import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BrainCircuit, Mail, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { getErrorMessage, getRateLimitMessage, getSafeErrorLog } from '../services/apiError';
import { useToast } from '../hooks/useToast';
import { SynapseBackground } from '../components/ui/SynapseBackground';

type Status = 'carregando' | 'sucesso' | 'erro';

export function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { showSuccess } = useToast();

  const [status, setStatus] = useState<Status>(token ? 'carregando' : 'erro');
  const [mensagemErro, setMensagemErro] = useState(
    token ? '' : 'Link de verificação inválido: token ausente.'
  );

  const [emailReenvio, setEmailReenvio] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [erroReenvio, setErroReenvio] = useState('');

  // Token é de uso único: evita a segunda chamada do StrictMode em dev
  const jaChamouRef = useRef(false);

  useEffect(() => {
    if (!token || jaChamouRef.current) {
      return;
    }
    jaChamouRef.current = true;

    api.get(`/auth/verificar-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus('sucesso'))
      .catch((err: unknown) => {
        console.error('[VerificarEmail] Erro ao verificar email:', getSafeErrorLog(err));
        setMensagemErro(getRateLimitMessage(err) ?? getErrorMessage(err, 'Token de verificação inválido ou expirado.'));
        setStatus('erro');
      });
  }, [token]);

  const handleReenviar = (e: FormEvent) => {
    e.preventDefault();
    if (!emailReenvio) return;

    setReenviando(true);
    setErroReenvio('');

    api.post('/auth/reenviar-verificacao', { email: emailReenvio })
      .then(() => showSuccess('Se este e-mail estiver cadastrado, um novo link de confirmação foi enviado.'))
      .catch((err: unknown) => {
        console.error('[VerificarEmail] Erro ao reenviar verificação:', getSafeErrorLog(err));
        const limite = getRateLimitMessage(err);
        if (limite) setErroReenvio(limite);
      })
      .finally(() => setReenviando(false));
  };

  return (
    <div className="min-h-screen min-h-dvh relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0F2B29] via-[#153F3B] to-[#1F5A56] p-4 max-lg:pb-[calc(var(--cookie-bar-altura,0px)+1rem)]">
      <SynapseBackground className="absolute inset-0 w-full h-full text-white/[0.12]" />

      <div className="relative z-10 w-full max-w-[440px] animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/50 border border-white/20 p-8 sm:p-10">

          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-16 w-16 bg-gradient-to-tr from-primary to-primary-hover rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <BrainCircuit className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">Sinapse Edu</h1>
            <p className="text-sm font-medium text-text-secondary mt-1">Verificação de e-mail</p>
          </div>

          {status === 'carregando' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-text-secondary font-medium">Confirmando seu e-mail...</p>
            </div>
          )}

          {status === 'sucesso' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-text-primary font-bold">
                E-mail confirmado! Você já pode entrar.
              </p>

              <Link to="/" className="w-full pt-2">
                <button
                  type="button"
                  className="w-full relative group overflow-hidden rounded-xl bg-primary text-white font-bold h-14 transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    Ir para a tela de entrada
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </Link>
            </div>
          )}

          {status === 'erro' && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="h-14 w-14 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
              <p className="text-red-700 font-bold text-sm">{mensagemErro}</p>

              <form onSubmit={handleReenviar} className="w-full space-y-4 text-left">
                <div className="space-y-1.5">
                  <label htmlFor="verificaremail-email" className="text-sm font-bold text-text-primary ml-1">Reenviar verificação para</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="verificaremail-email"
                      type="email"
                      value={emailReenvio}
                      onChange={(e) => setEmailReenvio(e.target.value)}
                      disabled={reenviando}
                      required
                      placeholder="seu@email.com.br"
                      className="w-full bg-background border-2 border-primary-light rounded-xl py-3.5 pl-11 pr-4 outline-none text-text-primary font-medium transition-all duration-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>

                {erroReenvio && (
                  <div role="alert" className="p-3.5 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {erroReenvio}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reenviando}
                  className="w-full relative group overflow-hidden rounded-xl bg-primary text-white font-bold h-14 transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    {reenviando ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Reenviar e-mail de verificação'}
                  </span>
                </button>
              </form>

              <Link to="/" className="text-sm text-primary font-bold hover:text-primary-hover transition-colors">
                Voltar para a tela de entrada
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
