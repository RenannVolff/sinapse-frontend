import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { BrainCircuit, Mail, Lock, Loader2, AlertCircle, ArrowRight, RefreshCw, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';
import { getErrorMessage, getSafeErrorLog } from '../services/apiError';
import { SynapseBackground } from '../components/ui/SynapseBackground';
import { HoneypotField } from '../components/ui/HoneypotField';

export function Login() {
  const navigate = useNavigate();
  const { signIn, confirmarDoisFatores } = useAuth();
  const { showSuccess } = useToast();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [website, setWebsite] = useState(''); // honeypot anti-bot
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 403 = email não verificado (oferece reenvio); 401 = senha errada.
  const [emailNaoVerificado, setEmailNaoVerificado] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  // Preenchido quando o login volta pendente2fa; troca o form pelo do código.
  const [tokenTemporario, setTokenTemporario] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [usandoBackup, setUsandoBackup] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');
    setEmailNaoVerificado(false);

    signIn(email, senha, website)
      .then((resultado) => {
        if (resultado.pendente2fa) {
          setTokenTemporario(resultado.tokenTemporario);
          return;
        }
        navigate('/dashboard');
      })
      .catch((err: unknown) => {
        if (isAxiosError(err) && err.response?.status === 403) {
          setEmailNaoVerificado(true);
          setError('Confirme seu email antes de fazer login.');
        } else {
          setError('Acesso negado. E-mail ou senha incorretos.');
        }
      })
      .finally(() => setLoading(false));
  };

  const handleVerificarCodigo = (e: FormEvent) => {
    e.preventDefault();
    if (!tokenTemporario) return;

    if (!codigo.trim()) {
      setError('Por favor, informe o código de verificação.');
      return;
    }

    setLoading(true);
    setError('');

    confirmarDoisFatores(tokenTemporario, codigo.trim())
      .then(() => navigate('/dashboard'))
      .catch((err: unknown) => {
        // A mensagem do backend distingue código errado de token temporário
        // expirado (5 min). Pode mostrar direto, nenhuma das duas vaza nada.
        setError(getErrorMessage(err, 'Código de verificação inválido.'));
      })
      .finally(() => setLoading(false));
  };

  const handleVoltarParaSenha = () => {
    setTokenTemporario(null);
    setCodigo('');
    setUsandoBackup(false);
    setSenha('');
    setError('');
  };

  const handleReenviarVerificacao = () => {
    setReenviando(true);

    api.post('/auth/reenviar-verificacao', { email })
      .then(() => showSuccess('Email de verificação reenviado. Verifique sua caixa de entrada.'))
      .catch((err: unknown) => {
        console.error('[Login] Erro ao reenviar verificação:', getSafeErrorLog(err));
      })
      .finally(() => setReenviando(false));
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0F2B29] via-[#153F3B] to-[#1F5A56] p-4">

      <SynapseBackground className="absolute inset-0 w-full h-full text-white/[0.12]" />

      <div className="relative z-10 w-full max-w-[420px] animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/50 border border-white/20 p-8 sm:p-10">

          <div className="flex flex-col items-center mb-10">
            <div className="h-20 w-20 bg-gradient-to-tr from-primary to-primary-hover rounded-3xl flex items-center justify-center mb-5 shadow-lg shadow-primary/30 transform transition-transform hover:scale-105 duration-300">
              <BrainCircuit className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight">Sinapse Edu</h1>
            <p className="text-sm font-medium text-text-secondary mt-2 text-center">
              Aplicação Neuropsicopedagógica
            </p>
          </div>

          {tokenTemporario ? (
            /* Senha já conferida; falta o código do app autenticador */
            <form onSubmit={handleVerificarCodigo} className="space-y-5 animate-in fade-in">
              <div className="flex items-start gap-3 p-4 bg-primary-light/60 rounded-xl border border-primary-light">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary font-medium">
                  {usandoBackup
                    ? 'Digite um dos seus códigos de backup. Cada código só pode ser usado uma vez.'
                    : 'Digite o código de 6 dígitos exibido no seu app autenticador.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">
                  {usandoBackup ? 'Código de Backup' : 'Código de Verificação'}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    disabled={loading}
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode={usandoBackup ? 'text' : 'numeric'}
                    maxLength={20}
                    placeholder={usandoBackup ? 'XXXXXXXX' : '000000'}
                    className="w-full bg-background border-2 border-primary-light rounded-xl py-3.5 pl-11 pr-4 outline-none text-text-primary font-bold tracking-[0.3em] transition-all duration-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="flex justify-between -mt-2">
                <button
                  type="button"
                  onClick={handleVoltarParaSenha}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-primary transition-colors disabled:opacity-60"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => { setUsandoBackup((v) => !v); setCodigo(''); setError(''); }}
                  disabled={loading}
                  className="text-xs font-bold text-primary hover:text-primary-hover transition-colors disabled:opacity-60"
                >
                  {usandoBackup ? 'Usar o app autenticador' : 'Usar um código de backup'}
                </button>
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  {error}
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
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        Verificar
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          ) : (
          <>
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

            <div className="flex justify-end -mt-2">
              <Link to="/esqueci-senha" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">
                Esqueci minha senha
              </Link>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  {error}
                </div>
                {emailNaoVerificado && (
                  <button
                    type="button"
                    onClick={handleReenviarVerificacao}
                    disabled={reenviando}
                    className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {reenviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Reenviar email de verificação
                  </button>
                )}
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

            <HoneypotField value={website} onChange={setWebsite} />
          </form>

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
          </>
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