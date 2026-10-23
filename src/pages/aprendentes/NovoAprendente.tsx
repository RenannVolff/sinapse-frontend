import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserPlus, User, Calendar, Phone, Shield, ArrowLeft, Loader2, Pencil, Save } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
import { useFormErrors } from '../../hooks/useFormErrors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { LIMITES } from '../../constants/limits';
import { anosAtrasIso, extrairDia, hojeIso } from '../../utils/datas';
import {
  coletarErros,
  filtrarNomePessoa,
  formatarTelefone,
  validarDataDia,
  validarNomePessoa,
  validarTelefone,
} from '../../utils/validacao';

interface AprendenteApi {
  nomeCompleto: string;
  dataNascimento: string;
  responsavel: string;
  contato: string;
}

const CAMPOS = ['nomeCompleto', 'dataNascimento', 'responsavel', 'contato'];

// Cadastro e edição (rota /aprendentes/:id/editar) usam o mesmo formulário,
// com as mesmas validações e limites do back.
export function NovoAprendente() {
  const { id } = useParams<{ id: string }>();
  const editando = !!id;
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { errors, formRef, showErrors, applyApiError, clearError } = useFormErrors();

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [contato, setContato] = useState('');

  const [carregando, setCarregando] = useState(editando);
  const [erroCarregar, setErroCarregar] = useState('');
  const [loading, setLoading] = useState(false);

  const dataMinima = anosAtrasIso(LIMITES.IDADE_MAX_ANOS);
  const dataMaxima = hojeIso();

  useEffect(() => {
    if (!id) return;
    api.get<AprendenteApi>(`/aprendentes/${id}`)
      .then(({ data }) => {
        setNomeCompleto(data.nomeCompleto);
        setDataNascimento(extrairDia(data.dataNascimento) ?? '');
        setResponsavel(data.responsavel);
        setContato(data.contato);
      })
      .catch((err) => {
        console.error('[NovoAprendente] Erro ao carregar aprendente:', getSafeErrorLog(err));
        setErroCarregar('Não foi possível carregar os dados deste aprendente.');
      })
      .finally(() => setCarregando(false));
  }, [id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const erros = coletarErros({
      nomeCompleto: validarNomePessoa('Nome completo', nomeCompleto),
      dataNascimento: validarDataDia('Data de nascimento', dataNascimento, {
        naoFutura: true,
        anosAtrasMax: LIMITES.IDADE_MAX_ANOS,
      }),
      responsavel: validarNomePessoa('Responsável', responsavel),
      contato: validarTelefone('Contato', contato),
    });
    if (showErrors(erros)) return;

    setLoading(true);

    const payload = {
      nomeCompleto: nomeCompleto.trim(),
      dataNascimento,
      responsavel: responsavel.trim(),
      contato: contato.trim(),
    };
    const requisicao = editando
      ? api.patch(`/aprendentes/${id}`, payload)
      : api.post('/aprendentes', payload);

    requisicao
      .then(() => {
        showSuccess(editando ? 'Dados do aprendente atualizados.' : 'Aprendente cadastrado com sucesso!');
        navigate('/aprendentes');
      })
      .catch((err) => {
        console.error('[NovoAprendente] Erro ao salvar:', getSafeErrorLog(err));
        // Mensagem geral já sai no toast do interceptor; aqui vão os campos.
        applyApiError(err);
      })
      .finally(() => setLoading(false));
  };

  const campo = (nome: string, setter: (valor: string) => void) => (valor: string) => {
    setter(valor);
    clearError(nome);
  };

  if (carregando) {
    return (
      <div className="flex flex-col h-[60dvh] items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-text-secondary font-medium">Carregando dados do aprendente...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">

      {/* Cabeçalho */}
      <div className="flex items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-primary-light shadow-sm">
        <button
          onClick={() => navigate('/aprendentes')}
          className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors flex-shrink-0"
          aria-label="Voltar para a lista de aprendentes"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 break-words">
            {editando ? <Pencil className="h-6 w-6 text-primary flex-shrink-0" /> : <UserPlus className="h-6 w-6 text-primary flex-shrink-0" />}
            {editando ? 'Editar Aprendente' : 'Cadastrar Aprendente'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {editando ? 'Atualize os dados cadastrais do aprendente.' : 'Preencha os dados para iniciar o prontuário.'}
          </p>
        </div>
      </div>

      {erroCarregar ? (
        <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">{erroCarregar}</div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl border border-primary-light shadow-sm space-y-8 relative overflow-hidden">

          {/* Decoração de Fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

          <FormErrorSummary errors={errors} campos={CAMPOS} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <Input
              label="Nome Completo do Aprendente"
              name="nomeCompleto"
              value={nomeCompleto}
              onChange={(e) => campo('nomeCompleto', setNomeCompleto)(filtrarNomePessoa(e.target.value))}
              icon={<User className="h-5 w-5" />}
              placeholder="Ex: João da Silva"
              maxLength={LIMITES.NOME_PESSOA}
              showCounter
              autoComplete="off"
              error={errors.nomeCompleto}
              required
              disabled={loading}
            />

            <Input
              label="Data de Nascimento"
              name="dataNascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => campo('dataNascimento', setDataNascimento)(e.target.value)}
              icon={<Calendar className="h-5 w-5" />}
              min={dataMinima}
              max={dataMaxima}
              error={errors.dataNascimento}
              required
              disabled={loading}
            />

            <Input
              label="Nome do Responsável Legal"
              name="responsavel"
              value={responsavel}
              onChange={(e) => campo('responsavel', setResponsavel)(filtrarNomePessoa(e.target.value))}
              icon={<Shield className="h-5 w-5" />}
              placeholder="Ex: Maria da Silva"
              maxLength={LIMITES.NOME_PESSOA}
              showCounter
              autoComplete="off"
              error={errors.responsavel}
              required
              disabled={loading}
            />

            <Input
              label="Telefone / WhatsApp"
              name="contato"
              type="tel"
              inputMode="numeric"
              value={contato}
              onChange={(e) => campo('contato', setContato)(formatarTelefone(e.target.value))}
              icon={<Phone className="h-5 w-5" />}
              placeholder="(00) 00000-0000"
              maxLength={LIMITES.TELEFONE}
              autoComplete="off"
              error={errors.contato}
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-primary-light">
            {editando && (
              <Button type="button" variant="outline" onClick={() => navigate('/aprendentes')} disabled={loading} className="w-full sm:w-auto px-8 h-12">
                Cancelar
              </Button>
            )}
            <Button type="submit" isLoading={loading} className="w-full sm:w-auto px-10 h-12 text-base">
              {editando ? <Save className="h-5 w-5 mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
              {editando ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
