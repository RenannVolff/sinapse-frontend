import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Save, LogOut, CheckCircle2, AlertCircle, Info, KeyRound } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { useFormErrors } from '../../hooks/useFormErrors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { SugestaoEmail } from '../../components/ui/SugestaoEmail';
import { LIMITES } from '../../constants/limits';
import { DICA_SENHA_FORTE, MENSAGEM_SENHA_FRACA, senhaEhForte } from '../../utils/senha';
import { coletarErros, filtrarNomePessoa, normalizarEmail, validarEmail, validarNomePessoa } from '../../utils/validacao';
import { DoisFatoresSection } from './DoisFatoresSection';

const CAMPOS = ['nome', 'email', 'senha', 'confirmarSenha'];

interface UpdatePayload {
  nome?: string;
  email?: string;
  senha?: string;
}

export function Configuracoes() {
  const { user, signOut, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const { errors, formRef, showErrors, applyApiError, clearError, reset } = useFormErrors();

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const handleSalvar = (e: FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setErro('Sessão inválida. Entre novamente.');
      return;
    }

    setErro('');
    setSucesso('');
    setAviso('');
    reset();

    const alterandoSenha = novaSenha.length > 0 || confirmarSenha.length > 0;
    const erros = coletarErros({
      nome: validarNomePessoa('Nome', nome),
      email: validarEmail('E-mail', email),
      senha: alterandoSenha && !senhaEhForte(novaSenha) ? `Nova senha: ${MENSAGEM_SENHA_FRACA}` : null,
      confirmarSenha: alterandoSenha && novaSenha !== confirmarSenha ? 'Confirmar senha: as senhas não coincidem.' : null,
    });
    if (showErrors(erros)) return;

    const payload: UpdatePayload = {};
    const emailNormalizado = normalizarEmail(email);

    if (nome.trim() !== user.nome) payload.nome = nome.trim();
    if (emailNormalizado !== user.email) payload.email = emailNormalizado;
    if (novaSenha.trim() !== '') payload.senha = novaSenha.trim();

    if (Object.keys(payload).length === 0) {
      setAviso('Nenhuma alteração foi detectada para salvar.');
      return;
    }

    setLoading(true);

    api.patch(`/usuarios/${user.id}`, payload)
      .then((response) => {
        if (payload.senha) {
          setSucesso('Senha alterada com sucesso! Redirecionando para a tela de entrada...');
          
          setTimeout(() => {
            signOut();
            navigate('/');
          }, 2500);
          
          return;
        }

        setSucesso('Perfil atualizado com sucesso!');
        setNovaSenha('');
        setConfirmarSenha('');
        
        updateUser({
          ...user,
          nome: response.data.nome,
          email: response.data.email
        });

        setTimeout(() => setSucesso(''), 4000);
      })
      .catch((err: unknown) => {
        console.error('[Configuracoes] Erro ao atualizar perfil:', getSafeErrorLog(err));
        // Erros por campo vão para o campo; os demais já saem no toast.
        applyApiError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Minha Conta
          </h1>
          <p className="text-text-secondary">Gerencie suas informações pessoais e credenciais.</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-auto px-6 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
          <LogOut className="h-4 w-4 mr-2" />
          Sair do Sistema
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-primary-light shadow-sm flex flex-col items-center text-center">
            <div className="h-24 w-24 bg-primary-light rounded-full flex items-center justify-center text-primary mb-4 shadow-inner border border-primary-light">
              <User className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-bold text-text-primary break-words max-w-full">{user?.nome || 'Profissional'}</h2>
            <p className="text-sm text-text-secondary font-medium break-all">{user?.email}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" /> Conta Autenticada
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6 min-w-0">
          <form ref={formRef} onSubmit={handleSalvar} noValidate className="bg-white p-4 sm:p-6 md:p-8 rounded-xl border border-primary-light shadow-sm space-y-6 min-w-0">
            <h3 className="text-lg font-bold text-text-primary border-b border-primary-light pb-2">
              Dados Cadastrais
            </h3>

            <FormErrorSummary errors={errors} campos={CAMPOS} />

            <div className="space-y-5">
              <Input
                label="Nome Completo"
                name="nome"
                value={nome}
                onChange={(e) => {
                  setNome(filtrarNomePessoa(e.target.value));
                  clearError('nome');
                }}
                icon={<User className="h-5 w-5" />}
                maxLength={LIMITES.NOME_PESSOA}
                showCounter
                autoComplete="name"
                error={errors.nome}
                required
              />
              <div className="flex flex-col gap-1">
                <Input
                  label="E-mail de Acesso"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError('email');
                  }}
                  onBlur={() => setEmail((atual) => normalizarEmail(atual))}
                  icon={<Mail className="h-5 w-5" />}
                  maxLength={LIMITES.EMAIL}
                  showCounter
                  autoComplete="email"
                  error={errors.email}
                  required
                />
                <SugestaoEmail
                  erro={errors.email}
                  onAceitar={(sugestao) => {
                    setEmail(sugestao);
                    clearError('email');
                  }}
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-text-primary border-b border-primary-light pb-2 mt-8">
              Segurança (Alteração de Senha)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Nova Senha"
                name="senha"
                type="password"
                value={novaSenha}
                onChange={(e) => {
                  setNovaSenha(e.target.value);
                  clearError('senha');
                }}
                placeholder="Mín. 8 caracteres"
                icon={<KeyRound className="h-5 w-5" />}
                maxLength={LIMITES.SENHA_MAX}
                showCounter
                autoComplete="new-password"
                error={errors.senha}
              />

              <Input
                label="Confirmar Nova Senha"
                name="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  clearError('confirmarSenha');
                }}
                placeholder="Repita a nova senha"
                icon={<Shield className="h-5 w-5" />}
                maxLength={LIMITES.SENHA_MAX}
                showCounter
                autoComplete="new-password"
                error={errors.confirmarSenha}
              />
            </div>
            
            <p className="text-xs text-text-secondary mt-1">
              {DICA_SENHA_FORTE}
              <br />
              * Deixe os campos de senha em branco caso não deseje alterá-la.
            </p>

            {aviso && (
              <div className="p-4 bg-primary-light text-primary-hover text-sm font-medium rounded-lg border border-primary-light flex items-center gap-2 animate-in fade-in">
                <Info className="h-5 w-5 flex-shrink-0" /> {aviso}
              </div>
            )}
            {sucesso && (
              <div className="p-4 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> {sucesso}
              </div>
            )}
            {erro && (
              <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="h-5 w-5 flex-shrink-0" /> {erro}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-primary-light mt-6">
              <Button type="submit" isLoading={loading} className="w-full md:w-auto px-8">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </form>

          <DoisFatoresSection />
        </div>
      </div>
    </div>
  );
}