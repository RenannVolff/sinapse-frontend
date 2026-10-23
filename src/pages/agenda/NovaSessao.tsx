import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft, Timer, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
import { useFormErrors } from '../../hooks/useFormErrors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { dispararAtualizacaoNotificacoes } from '../../utils/notificacoesBus';
import { LIMITES } from '../../constants/limits';
import { diaLocal, hojeIso } from '../../utils/datas';
import { coletarErros, validarTexto } from '../../utils/validacao';

interface AprendenteOpcao {
  id: string;
  nomeCompleto: string;
}

interface AtendimentoCalendario {
  id: string;
  dataAtendimento: string;
  duracaoMinutos: number;
  status: string;
}

interface AtendimentoApi {
  id: string;
  aprendenteId: string;
  dataAtendimento: string;
  duracaoMinutos: number;
  tituloSessao: string;
}

const DURACOES = [30, 45, 60, 90];
const HORA_INICIO = 0;
const HORA_FIM = 24;
const PASSO_MINUTOS = 30;

const CAMPOS = ['aprendenteId', 'tituloSessao', 'duracaoMinutos', 'dataAtendimento'];

function horaLocal(data: Date): string {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

function gerarBlocosHorario(): string[] {
  const blocos: string[] = [];
  for (let minutos = HORA_INICIO * 60; minutos < HORA_FIM * 60; minutos += PASSO_MINUTOS) {
    const h = String(Math.floor(minutos / 60)).padStart(2, '0');
    const m = String(minutos % 60).padStart(2, '0');
    blocos.push(`${h}:${m}`);
  }
  return blocos;
}

const BLOCOS_HORARIO = gerarBlocosHorario();

// Agendamento (/agenda/nova) e edição (/agenda/:id/editar) no mesmo formulário.
export function NovaSessao() {
  const { id } = useParams<{ id: string }>();
  const editando = !!id;
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { errors, formRef, showErrors, applyApiError, clearError } = useFormErrors();

  const [aprendentes, setAprendentes] = useState<AprendenteOpcao[]>([]);
  const [erroAprendentes, setErroAprendentes] = useState('');

  const [aprendenteId, setAprendenteId] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [titulo, setTitulo] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(60);
  // Data/hora gravadas, na edição: reenviar a mesma data no passado é aceito.
  const [original, setOriginal] = useState<{ data: string; hora: string; iso: string } | null>(null);

  const [atendimentosDoDia, setAtendimentosDoDia] = useState<AtendimentoCalendario[]>([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  const [carregando, setCarregando] = useState(editando);
  const [erroCarregar, setErroCarregar] = useState('');
  const [loading, setLoading] = useState(false);

  const hoje = hojeIso();
  const dataMinima = original && original.data < hoje ? original.data : hoje;

  useEffect(() => {
    api.get<AprendenteOpcao[]>('/aprendentes')
      .then((res) => setAprendentes(res.data))
      .catch(() => setErroAprendentes('Erro ao carregar a lista de aprendentes.'));
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get<AtendimentoApi>(`/atendimentos/${id}`)
      .then(({ data: sessao }) => {
        const inicio = new Date(sessao.dataAtendimento);
        setAprendenteId(sessao.aprendenteId);
        setTitulo(sessao.tituloSessao);
        setDuracaoMinutos(sessao.duracaoMinutos);
        setData(diaLocal(inicio));
        setHora(horaLocal(inicio));
        setOriginal({ data: diaLocal(inicio), hora: horaLocal(inicio), iso: sessao.dataAtendimento });
      })
      .catch((err) => {
        console.error('[NovaSessao] Erro ao carregar sessão:', getSafeErrorLog(err));
        setErroCarregar('Não foi possível carregar os dados desta sessão.');
      })
      .finally(() => setCarregando(false));
  }, [id]);

  useEffect(() => {
    async function fetchHorariosOcupados() {
      if (!data) return;

      const [ano, mes, dia] = data.split('-').map(Number);
      setCarregandoHorarios(true);

      try {
        const res = await api.get<AtendimentoCalendario[]>(`/atendimentos/calendario?mes=${mes}&ano=${ano}`);
        const doDia = res.data.filter((atendimento) => {
          const dataAtendimento = new Date(atendimento.dataAtendimento);
          return (
            atendimento.id !== id && // na edição, a própria sessão não ocupa o horário
            atendimento.status !== 'CANCELADO' &&
            dataAtendimento.getFullYear() === ano &&
            dataAtendimento.getMonth() + 1 === mes &&
            dataAtendimento.getDate() === dia
          );
        });
        setAtendimentosDoDia(doDia);
      } catch (err) {
        console.error('[NovaSessao] Erro ao buscar horários ocupados:', getSafeErrorLog(err));
      } finally {
        setCarregandoHorarios(false);
      }
    }

    fetchHorariosOcupados();
  }, [data, id]);

  const intervalosOcupados = useMemo(() => {
    return atendimentosDoDia.map((atendimento) => {
      const inicio = new Date(atendimento.dataAtendimento);
      const fim = new Date(inicio.getTime() + atendimento.duracaoMinutos * 60000);
      return { inicio, fim };
    });
  }, [atendimentosDoDia]);

  const horariosDisponibilidade = useMemo(() => {
    if (!data) return [];

    // Sessão antiga fora da grade de 30 min (ex.: 14:15) continua selecionável.
    const blocos = original && original.data === data && !BLOCOS_HORARIO.includes(original.hora)
      ? [...BLOCOS_HORARIO, original.hora].sort()
      : BLOCOS_HORARIO;

    return blocos.map((horaBloco) => {
      const inicioBloco = new Date(`${data}T${horaBloco}`);
      const fimBloco = new Date(inicioBloco.getTime() + duracaoMinutos * 60000);

      const ocupado = intervalosOcupados.some(
        (intervalo) => inicioBloco < intervalo.fim && fimBloco > intervalo.inicio,
      );

      return { horario: horaBloco, ocupado };
    });
  }, [data, duracaoMinutos, intervalosOcupados, original]);

  // Na edição, a duração gravada pode não ser uma das opções (ex.: 50 min).
  const duracoes = DURACOES.includes(duracaoMinutos) ? DURACOES : [...DURACOES, duracaoMinutos].sort((a, b) => a - b);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const mesmaDataHora = !!original && original.data === data && original.hora === hora;
    const inicio = data && hora ? new Date(`${data}T${hora}`) : null;

    const erros = coletarErros({
      aprendenteId: aprendenteId ? null : 'Aprendente: selecione o aprendente.',
      tituloSessao: validarTexto('Título da sessão', titulo, LIMITES.TITULO),
      dataAtendimento: !data
        ? 'Data da sessão: campo obrigatório.'
        : !hora
          ? 'Horário: selecione um horário disponível.'
          : !mesmaDataHora && inicio && inicio.getTime() < Date.now()
            ? 'Data da sessão: não é possível agendar no passado.'
            : null,
    });
    if (showErrors(erros)) return;

    setLoading(true);

    const dataAtendimento = mesmaDataHora && original ? original.iso : new Date(`${data}T${hora}`).toISOString();
    const requisicao = editando
      ? api.patch(`/atendimentos/${id}`, { dataAtendimento, duracaoMinutos, tituloSessao: titulo.trim() })
      : api.post('/atendimentos', { aprendenteId, dataAtendimento, duracaoMinutos, tituloSessao: titulo.trim() });

    requisicao
      .then(() => {
        dispararAtualizacaoNotificacoes();
        showSuccess(editando ? 'Sessão atualizada com sucesso.' : 'Sessão agendada com sucesso.');
        navigate('/agenda');
      })
      .catch((err: unknown) => {
        console.error('[NovaSessao] Erro ao salvar sessão:', getSafeErrorLog(err));
        applyApiError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (carregando) {
    return (
      <div className="flex flex-col h-[60dvh] items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-text-secondary font-medium">Carregando sessão...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in pb-12">
      <div className="flex items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-primary-light">
        <button type="button" onClick={() => navigate('/agenda')} className="p-2 hover:bg-primary-light rounded-full transition-colors flex-shrink-0" aria-label="Voltar para a agenda">
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-text-primary break-words">{editando ? 'Editar Sessão' : 'Agendar Nova Sessão'}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {editando ? 'Altere o título, a duração ou o horário da sessão.' : 'Defina o aprendente e o horário do atendimento.'}
          </p>
        </div>
      </div>

      {erroCarregar ? (
        <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">{erroCarregar}</div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-primary-light space-y-6">
          <FormErrorSummary errors={errors} campos={CAMPOS} />

          <div className="space-y-1.5">
            <label htmlFor="novasessao-aprendente" className="text-sm font-bold text-text-primary flex items-center gap-2">
              <User className="h-4 w-4 text-text-secondary" /> Aprendente
            </label>
            <select
              id="novasessao-aprendente"
              name="aprendenteId"
              value={aprendenteId}
              onChange={(e) => {
                setAprendenteId(e.target.value);
                clearError('aprendenteId');
              }}
              aria-invalid={errors.aprendenteId ? true : undefined}
              aria-describedby={errors.aprendenteId ? 'novasessao-aprendente-erro' : editando ? 'novasessao-aprendente-dica' : undefined}
              className={`w-full min-w-0 p-3.5 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-background focus:bg-white transition-all font-medium text-text-primary disabled:opacity-70 ${
                errors.aprendenteId ? 'border-red-500 border-2' : 'border-primary-light'
              }`}
              required
              disabled={loading || editando}
            >
              <option value="" disabled>Selecione o aprendente...</option>
              {aprendentes.map(aprendente => (
                <option key={aprendente.id} value={aprendente.id}>{aprendente.nomeCompleto}</option>
              ))}
            </select>
            {editando && (
              <p id="novasessao-aprendente-dica" className="text-xs text-text-secondary">O aprendente de uma sessão já agendada não pode ser trocado.</p>
            )}
            {(errors.aprendenteId || erroAprendentes) && (
              <p id="novasessao-aprendente-erro" className="flex items-start gap-1 text-xs text-red-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 mt-px flex-shrink-0" aria-hidden="true" />
                {errors.aprendenteId || erroAprendentes}
              </p>
            )}
          </div>

          <Input
            label="Foco Principal (Título)"
            name="tituloSessao"
            icon={<Clock className="h-5 w-5"/>}
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value);
              clearError('tituloSessao');
            }}
            placeholder="Ex: Avaliação Inicial, Jogos Cognitivos..."
            maxLength={LIMITES.TITULO}
            showCounter
            error={errors.tituloSessao}
            required
            disabled={loading}
          />

          {/* Grupo de botões, não um campo: o título nomeia o grupo (aria-labelledby). */}
          <div className="space-y-1.5">
            <span id="novasessao-duracao" className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Timer className="h-4 w-4 text-text-secondary" /> Duração da Sessão
            </span>
            <div role="group" aria-labelledby="novasessao-duracao" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {duracoes.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setDuracaoMinutos(opcao)}
                  disabled={loading}
                  aria-pressed={duracaoMinutos === opcao}
                  className={`py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                    duracaoMinutos === opcao
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'border-primary-light text-text-secondary hover:border-primary/40 hover:text-text-primary'
                  }`}
                >
                  {opcao} min
                </button>
              ))}
            </div>
            {errors.duracaoMinutos && (
              <p className="flex items-start gap-1 text-xs text-red-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 mt-px flex-shrink-0" aria-hidden="true" />
                {errors.duracaoMinutos}
              </p>
            )}
          </div>

          <Input
            label="Data da Sessão"
            name="dataAtendimento"
            type="date"
            icon={<Calendar className="h-5 w-5"/>}
            value={data}
            onChange={(e) => {
              setData(e.target.value);
              setHora(original && e.target.value === original.data ? original.hora : '');
              clearError('dataAtendimento');
            }}
            min={dataMinima}
            max={LIMITES.DATA_MAX}
            error={errors.dataAtendimento}
            required
            disabled={loading}
          />

          <div className="space-y-1.5">
            <span id="novasessao-horario" className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-text-secondary" /> Horário
            </span>

            {!data ? (
              <p className="text-sm text-text-secondary italic p-4 bg-background rounded-xl border border-primary-light">
                Selecione uma data para ver os horários disponíveis.
              </p>
            ) : carregandoHorarios ? (
              <p className="text-sm text-text-secondary italic p-4 bg-background rounded-xl border border-primary-light">
                Carregando disponibilidade...
              </p>
            ) : (
              <div role="group" aria-labelledby="novasessao-horario" className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                {horariosDisponibilidade.map(({ horario, ocupado }) => (
                  <button
                    key={horario}
                    type="button"
                    disabled={ocupado || loading}
                    onClick={() => {
                      setHora(horario);
                      clearError('dataAtendimento');
                    }}
                    aria-pressed={hora === horario}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      ocupado
                        ? 'bg-background border-primary-light text-text-secondary/50 cursor-not-allowed line-through'
                        : hora === horario
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'border-primary-light text-text-primary hover:border-primary/40 hover:bg-primary-light/40'
                    }`}
                  >
                    {horario}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-primary-light flex flex-col-reverse sm:flex-row justify-end gap-3">
            {editando && (
              <Button type="button" variant="outline" onClick={() => navigate('/agenda')} disabled={loading} className="w-full sm:w-auto px-8 h-12">
                Cancelar
              </Button>
            )}
            <Button type="submit" isLoading={loading} className="w-full sm:w-auto px-10 h-12">
              {editando ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
