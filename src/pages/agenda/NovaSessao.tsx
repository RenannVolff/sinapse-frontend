import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft, AlertCircle, Timer } from 'lucide-react';
import { api } from '../../services/api';
import { getErrorMessage, getSafeErrorLog } from '../../services/apiError';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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

const DURACOES = [30, 45, 60, 90] as const;
const HORA_INICIO = 8;
const HORA_FIM = 18;
const PASSO_MINUTOS = 30;

function getHojeISODate(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
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

export function NovaSessao() {
  const navigate = useNavigate();
  const [aprendentes, setAprendentes] = useState<AprendenteOpcao[]>([]);
  const dataMinima = getHojeISODate();

  const [aprendenteId, setAprendenteId] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [titulo, setTitulo] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(60);

  const [atendimentosDoDia, setAtendimentosDoDia] = useState<AtendimentoCalendario[]>([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get<AprendenteOpcao[]>('/aprendentes')
      .then((res) => setAprendentes(res.data))
      .catch(() => setErro('Erro ao carregar lista de aprendentes.'));
  }, []);

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
  }, [data]);

  const intervalosOcupados = useMemo(() => {
    return atendimentosDoDia.map((atendimento) => {
      const inicio = new Date(atendimento.dataAtendimento);
      const fim = new Date(inicio.getTime() + atendimento.duracaoMinutos * 60000);
      return { inicio, fim };
    });
  }, [atendimentosDoDia]);

  const horariosDisponibilidade = useMemo(() => {
    if (!data) return [];

    return BLOCOS_HORARIO.map((horaBloco) => {
      const inicioBloco = new Date(`${data}T${horaBloco}`);
      const fimBloco = new Date(inicioBloco.getTime() + duracaoMinutos * 60000);

      const ocupado = intervalosOcupados.some(
        (intervalo) => inicioBloco < intervalo.fim && fimBloco > intervalo.inicio,
      );

      return { horario: horaBloco, ocupado };
    });
  }, [data, duracaoMinutos, intervalosOcupados]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!aprendenteId || !data || !hora || !titulo) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setErro('');

    const dataAtendimento = new Date(`${data}T${hora}`).toISOString();

    api.post('/atendimentos', {
      aprendenteId,
      dataAtendimento,
      duracaoMinutos,
      tituloSessao: titulo,
    })
      .then(() => {
        navigate('/agenda');
      })
      .catch((err: unknown) => {
        console.error('[NovaSessao] Erro ao agendar:', getSafeErrorLog(err));
        setErro(getErrorMessage(err, 'Erro interno ao agendar a sessão. Tente novamente.'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in pb-12">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-primary-light">
        <button onClick={() => navigate('/agenda')} className="p-2 hover:bg-primary-light rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Agendar Nova Sessão</h1>
          <p className="text-sm text-text-secondary mt-1">Defina o aprendente e o horário do atendimento.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-primary-light space-y-6">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-text-primary flex items-center gap-2">
            <User className="h-4 w-4 text-text-secondary" /> Aprendente
          </label>
          <select
            value={aprendenteId}
            onChange={(e) => setAprendenteId(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-primary-light focus:ring-2 focus:ring-primary outline-none bg-background focus:bg-white transition-all font-medium text-text-primary"
            required
            disabled={loading}
          >
            <option value="" disabled>Selecione o aprendente...</option>
            {aprendentes.map(aprendente => (
              <option key={aprendente.id} value={aprendente.id}>{aprendente.nomeCompleto}</option>
            ))}
          </select>
        </div>

        <Input
          label="Foco Principal (Título)"
          icon={<Clock className="h-5 w-5"/>}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Avaliação Inicial, Jogos Cognitivos..."
          required
          disabled={loading}
        />

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Timer className="h-4 w-4 text-text-secondary" /> Duração da Sessão
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURACOES.map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setDuracaoMinutos(opcao)}
                disabled={loading}
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
        </div>

        <Input
          label="Data da Sessão"
          type="date"
          icon={<Calendar className="h-5 w-5"/>}
          value={data}
          onChange={(e) => { setData(e.target.value); setHora(''); }}
          min={dataMinima}
          required
          disabled={loading}
        />

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-secondary" /> Horário
          </label>

          {!data ? (
            <p className="text-sm text-text-secondary italic p-4 bg-background rounded-xl border border-primary-light">
              Selecione uma data para ver os horários disponíveis.
            </p>
          ) : carregandoHorarios ? (
            <p className="text-sm text-text-secondary italic p-4 bg-background rounded-xl border border-primary-light">
              Carregando disponibilidade...
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {horariosDisponibilidade.map(({ horario, ocupado }) => (
                <button
                  key={horario}
                  type="button"
                  disabled={ocupado || loading}
                  onClick={() => setHora(horario)}
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

        {erro && (
          <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {erro}
          </div>
        )}

        <div className="pt-4 border-t border-primary-light flex justify-end">
          <Button type="submit" isLoading={loading} className="w-full md:w-auto px-10 h-12">
            Confirmar Agendamento
          </Button>
        </div>
      </form>
    </div>
  );
}
