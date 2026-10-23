import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Mail, Lock, User, UserPlus, Loader2, AlertCircle, MailCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { getErrorMessage, getRateLimitMessage, getSafeErrorLog } from '../services/apiError';
import { useToast } from '../hooks/useToast';
import { SynapseBackground } from '../components/ui/SynapseBackground';
import { HoneypotField } from '../components/ui/HoneypotField';
import { DICA_SENHA_FORTE, MENSAGEM_SENHA_FRACA, senhaEhForte } from '../utils/senha';
import { useFormErrors } from '../hooks/useFormErrors';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
import { SugestaoEmail } from '../components/ui/SugestaoEmail';
import { LIMITES } from '../constants/limits';
import { coletarErros, filtrarNomePessoa, normalizarEmail, validarEmail, validarNomePessoa } from '../utils/validacao';

const CAMPOS = ['nome', 'email', 'senha', 'confirmarSenha'];

const CLASSE_CAMPO =
  'w-full min-w-0 bg-background border-2 rounded-xl py-2.5 pl-10 pr-4 outline-none text-text-primary text-base md:text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-4';

function classeCampo(erro?: string) {
  return `${CLASSE_CAMPO} ${erro ? 'border-red-500 focus:ring-red-500/10' : 'border-primary-light focus:border-primary focus:ring-primary/10'}`;
}

// Mensagem do campo (ligada por aria-describedby) e, se houver, o contador.
function RodapeCampo({ id, erro, tamanho, maximo }: { id: string; erro?: string; tamanho?: number; maximo?: number }) {
  if (!erro && maximo === undefined) return null;
  return (
    <div className="flex items-start justify-between gap-2 ml-1 min-w-0">
      <span id={`${id}-erro`} className="flex items-start gap-1 text-xs text-red-600 font-medium min-w-0 break-words">
        {erro && <AlertCircle className="h-3.5 w-3.5 mt-px flex-shrink-0" aria-hidden="true" />}
        {erro}
      </span>
      {maximo !== undefined && (
        <span id={`${id}-contador`} className="text-xs text-text-secondary tabular-nums flex-shrink-0">
          {tamanho ?? 0}/{maximo}
          <span className="sr-only"> caracteres</span>
        </span>
      )}
    </div>
  );
}

export function Cadastro() {
  const { showSuccess, showError } = useToast();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [website, setWebsite] = useState(''); // honeypot anti-bot

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const { errors, formRef, showErrors, applyApiError, clearError } = useFormErrors();

  // Preenchido após o cadastro ser concluído — troca o formulário pela tela
  // de confirmação, já que o usuário não pode logar antes de verificar o e-mail.
  const [emailCadastrado, setEmailCadastrado] = useState('');
  const [reenviando, setReenviando] = useState(false);

  const handleCadastro = (e: FormEvent) => {
    e.preventDefault();
    setErro('');

    const emailNormalizado = normalizarEmail(email);
    const erros = coletarErros({
      nome: validarNomePessoa('Nome', nome),
      email: validarEmail('E-mail', emailNormalizado),
      senha: !senhaEhForte(senha)
        ? `Senha: ${MENSAGEM_SENHA_FRACA}`
        : senha.length > LIMITES.SENHA_MAX
          ? `Senha: máximo de ${LIMITES.SENHA_MAX} caracteres.`
          : null,
      confirmarSenha: senha !== confirmarSenha ? 'Confirmar: as senhas não coincidem.' : null,
    });
    if (showErrors(erros)) return;

    setEmail(emailNormalizado);
    setLoading(true);

    api.post('/usuarios', {
      nome: nome.trim(),
      email: emailNormalizado,
      senha,
      website
    })
      .then(() => {
        setEmailCadastrado(emailNormalizado);
      })
      .catch((err: unknown) => {
        console.error('[Cadastro] Erro ao cadastrar:', getSafeErrorLog(err));
        // Erro por campo (inclui a sugestão "Você quis dizer...?") vai para o
        // campo; o resto (limite de tentativas, servidor) fica no aviso geral.
        if (!applyApiError(err)) {
          setErro(getRateLimitMessage(err) ?? getErrorMessage(err, 'Erro no servidor. Tente novamente.'));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleReenviarVerificacao = () => {
    setReenviando(true);

    api.post('/auth/reenviar-verificacao', { email: emailCadastrado })
      .then(() => showSuccess('E-mail de confirmação reenviado. Verifique sua caixa de entrada.'))
      .catch((err: unknown) => {
        console.error('[Cadastro] Erro ao reenviar verificação:', getSafeErrorLog(err));
        const limite = getRateLimitMessage(err);
        if (limite) showError(limite);
      })
      .finally(() => setReenviando(false));
  };

  return (
    // Removido o py-12 para centralização absoluta
    <div className="min-h-screen min-h-dvh relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0F2B29] via-[#153F3B] to-[#1F5A56] p-4 pb-[calc(var(--cookie-bar-altura,0px)+1rem)]">

      {/* Assinatura visual sutil: rede de sinapses atrás do card */}
      <SynapseBackground className="absolute inset-0 w-full h-full text-white/[0.12]" />

      <div className="relative z-10 w-full max-w-[28.75rem] animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
        {/* Padding interno do card reduzido (p-6 sm:p-8) */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/50 border border-white/20 p-6 sm:p-8">

          {emailCadastrado ? (
            /* Tela de confirmação pós-cadastro: o usuário ainda não pode
               logar até verificar o e-mail, então não redirecionamos. */
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-black text-text-primary tracking-tight">Cadastro realizado!</h1>
                <p className="text-sm text-text-secondary mt-2">
                  Enviamos um e-mail de confirmação para{' '}
                  <span className="font-bold text-text-primary">{emailCadastrado}</span>.
                  Verifique sua caixa de entrada (e o spam) para ativar sua conta.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReenviarVerificacao}
                disabled={reenviando}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {reenviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Reenviar e-mail
              </button>

              <div className="w-full pt-4 mt-2 border-t border-primary-light/60">
                <Link to="/" className="text-xs text-text-secondary font-medium">
                  Voltar para a{' '}
                  <span className="text-primary font-bold hover:text-primary-hover transition-colors">tela de entrada</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Logo e Cabeçalho mais compactos */}
              <div className="flex flex-col items-center mb-5">
                <div className="h-14 w-14 bg-gradient-to-tr from-primary to-primary-hover rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary/30 transform transition-transform hover:scale-105 duration-300">
                  <BrainCircuit className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-xl font-black text-text-primary tracking-tight">Crie sua conta</h1>
                <p className="text-xs font-medium text-text-secondary mt-1 text-center">
                  Acesse a plataforma Sinapse Edu
                </p>
              </div>

              {/* Espaçamento entre inputs reduzido (space-y-3) */}
              <form ref={formRef} onSubmit={handleCadastro} noValidate className="space-y-3">

                <FormErrorSummary errors={errors} campos={CAMPOS} />

                <div className="space-y-1">
                  <label htmlFor="cadastro-nome-completo" className="text-xs font-bold text-text-primary ml-1">Nome Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                    {/* Altura dos inputs reduzida (py-2.5) */}
                    <input
                      id="cadastro-nome-completo"
                      name="nome"
                      type="text"
                      value={nome}
                      onChange={(e) => {
                        setNome(filtrarNomePessoa(e.target.value));
                        clearError('nome');
                      }}
                      disabled={loading}
                      required
                      maxLength={LIMITES.NOME_PESSOA}
                      autoComplete="name"
                      aria-invalid={errors.nome ? true : undefined}
                      aria-describedby="cadastro-nome-completo-erro cadastro-nome-completo-contador"
                      placeholder="Ex: João Silva"
                      className={classeCampo(errors.nome)}
                    />
                  </div>
                  <RodapeCampo id="cadastro-nome-completo" erro={errors.nome} tamanho={nome.length} maximo={LIMITES.NOME_PESSOA} />
                </div>

                <div className="space-y-1">
                  <label htmlFor="cadastro-email" className="text-xs font-bold text-text-primary ml-1">E-mail Profissional</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="cadastro-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError('email');
                      }}
                      onBlur={() => setEmail((atual) => normalizarEmail(atual))}
                      disabled={loading}
                      required
                      maxLength={LIMITES.EMAIL}
                      autoComplete="email"
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby="cadastro-email-erro cadastro-email-contador"
                      placeholder="seu@email.com.br"
                      className={classeCampo(errors.email)}
                    />
                  </div>
                  <RodapeCampo id="cadastro-email" erro={errors.email} tamanho={email.length} maximo={LIMITES.EMAIL} />
                  <div className="ml-1 flex">
                    <SugestaoEmail
                      erro={errors.email}
                      onAceitar={(sugestao) => {
                        setEmail(sugestao);
                        clearError('email');
                      }}
                    />
                  </div>
                </div>

                {/* Gap reduzido (gap-3) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1 min-w-0">
                    <label htmlFor="cadastro-criar-senha" className="text-xs font-bold text-text-primary ml-1">Criar Senha</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="cadastro-criar-senha"
                        name="senha"
                        type="password"
                        value={senha}
                        onChange={(e) => {
                          setSenha(e.target.value);
                          clearError('senha');
                        }}
                        disabled={loading}
                        required
                        maxLength={LIMITES.SENHA_MAX}
                        autoComplete="new-password"
                        aria-invalid={errors.senha ? true : undefined}
                        aria-describedby="cadastro-criar-senha-erro"
                        placeholder="Mín. 8 caracteres"
                        className={classeCampo(errors.senha)}
                      />
                    </div>
                    <RodapeCampo id="cadastro-criar-senha" erro={errors.senha} />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="cadastro-confirmar" className="text-xs font-bold text-text-primary ml-1">Confirmar</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="cadastro-confirmar"
                        name="confirmarSenha"
                        type="password"
                        value={confirmarSenha}
                        onChange={(e) => {
                          setConfirmarSenha(e.target.value);
                          clearError('confirmarSenha');
                        }}
                        disabled={loading}
                        required
                        maxLength={LIMITES.SENHA_MAX}
                        autoComplete="new-password"
                        aria-invalid={errors.confirmarSenha ? true : undefined}
                        aria-describedby="cadastro-confirmar-erro"
                        placeholder="Repita a senha"
                        className={classeCampo(errors.confirmarSenha)}
                      />
                    </div>
                    <RodapeCampo id="cadastro-confirmar" erro={errors.confirmarSenha} />
                  </div>
                </div>

                <p className="text-xs text-text-secondary ml-1">
                  {DICA_SENHA_FORTE}
                </p>

                {/* Avisos */}
                {erro && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {erro}
                  </div>
                )}

                {/* Botão mais estreito (h-12) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative group overflow-hidden rounded-xl bg-primary text-white font-bold h-12 transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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

                <HoneypotField value={website} onChange={setWebsite} />
              </form>

              {/* Margens do rodapé reduzidas */}
              <div className="mt-5 pt-4 border-t border-primary-light/60 text-center">
                <p className="text-xs text-text-secondary font-medium">
                  Já possui uma conta?{' '}
                  <Link to="/" className="text-primary font-bold hover:text-primary-hover transition-colors">
                    Entre aqui
                  </Link>
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