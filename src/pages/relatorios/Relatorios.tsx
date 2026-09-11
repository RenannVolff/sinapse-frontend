import { useState, useEffect, type FormEvent } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, ReferenceLine
} from 'recharts';
import { BarChart3, User, BrainCircuit, Calendar as CalendarIcon, Sparkles, Settings2, Activity, Info } from 'lucide-react';
import { api } from '../../services/api';
import { getErrorMessage, getSafeErrorLog } from '../../services/apiError';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface AprendenteOpcao {
  id: string;
  nomeCompleto: string;
}

interface EvolucaoData {
  data: string;
  titulo: string;
  score: number;
}

interface RelatorioResponse {
  resumoIa: string;
  dadosGrafico: EvolucaoData[];
}

type TipoGrafico = 'linha' | 'barra' | 'area';

type ModoRelatorio = 'ia' | 'acompanhamento';

type Fase = 'LINHA_BASE' | 'INTERVENCAO';

interface SessaoAcompanhamento {
  id: string;
  dataAtendimento: string;
  score: number;
  fase: Fase;
  status: string;
}

interface PontoAcompanhamento {
  data: string;
  score: number;
  fase: Fase;
}

const CORES_FASE: Record<Fase, string> = {
  LINHA_BASE: '#1F5A56',
  INTERVENCAO: '#D97A3F',
};

// Dot customizado do gráfico de acompanhamento: pinta cada ponto pela fase.
// Declarado fora do componente para não ser recriado a cada render (recharts o invoca por ponto).
function DotFase(props: { cx?: number; cy?: number; payload?: PontoAcompanhamento }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  return <circle cx={cx} cy={cy} r={6} fill={CORES_FASE[payload.fase]} stroke="#fff" strokeWidth={2} />;
}

export function Relatorios() {
  const [aprendentes, setAprendentes] = useState<AprendenteOpcao[]>([]);

  // Modo do relatório: IA (comportamento atual) ou Acompanhamento AB-ABAB
  const [modo, setModo] = useState<ModoRelatorio>('ia');

  // Estados do Formulário
  const [aprendenteSelecionado, setAprendenteSelecionado] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('linha');

  // Estados de Resultado
  const [dadosEvolucao, setDadosEvolucao] = useState<EvolucaoData[]>([]);
  const [resumoIa, setResumoIa] = useState<string>('');

  // Estados do modo Acompanhamento (AB-ABAB)
  const [dadosAcompanhamento, setDadosAcompanhamento] = useState<PontoAcompanhamento[]>([]);
  const [loadingAcompanhamento, setLoadingAcompanhamento] = useState<boolean>(false);
  const [errorAcompanhamento, setErrorAcompanhamento] = useState<string>('');

  // Estados de Controle (Sem async/await)
  const [loadingDados, setLoadingDados] = useState<boolean>(true);
  const [loadingRelatorio, setLoadingRelatorio] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Busca inicial dos aprendentes
  useEffect(() => {
    api.get<AprendenteOpcao[]>('/aprendentes')
      .then((res) => {
        setAprendentes(res.data);
        setError('');
      })
      .catch((err) => {
        console.error('[Relatorios] Erro ao buscar aprendentes:', getSafeErrorLog(err));
        setError(getErrorMessage(err, 'Falha ao conectar com o servidor.'));
      })
      .finally(() => {
        setLoadingDados(false);
      });
  }, []);

  // Busca do histórico de acompanhamento (sem IA) ao trocar de modo ou de aprendente
  useEffect(() => {
    if (modo !== 'acompanhamento' || !aprendenteSelecionado) {
      return;
    }

    function buscarAcompanhamento() {
      setLoadingAcompanhamento(true);
      setErrorAcompanhamento('');

      api.get<SessaoAcompanhamento[]>(`/aprendentes/${aprendenteSelecionado}/graficos-acompanhamento`)
        .then((res) => {
          const pontos: PontoAcompanhamento[] = res.data.map((sessao) => ({
            data: new Date(sessao.dataAtendimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            score: sessao.score,
            fase: sessao.fase,
          }));
          setDadosAcompanhamento(pontos);
        })
        .catch((err) => {
          console.error('[Relatorios] Erro ao buscar gráfico de acompanhamento:', getSafeErrorLog(err));
          setErrorAcompanhamento(getErrorMessage(err, 'Falha ao buscar o histórico de acompanhamento.'));
          setDadosAcompanhamento([]);
        })
        .finally(() => {
          setLoadingAcompanhamento(false);
        });
    }

    buscarAcompanhamento();
  }, [modo, aprendenteSelecionado]);

  // Submissão do Formulário
  const handleGerarRelatorio = (e: FormEvent) => {
    e.preventDefault();
    
    if (!aprendenteSelecionado || !dataInicio || !dataFim) {
      setError('Por favor, preencha o aprendente e o período selecionado.');
      return;
    }

    setLoadingRelatorio(true);
    setError('');

    api.get<RelatorioResponse>(`/aprendentes/${aprendenteSelecionado}/relatorio-ia?inicio=${dataInicio}&fim=${dataFim}`)
      .then((res) => {
        setDadosEvolucao(res.data.dadosGrafico);
        setResumoIa(res.data.resumoIa);
      })
      .catch((err) => {
        console.error('[Relatorios] Erro ao gerar relatório:', getSafeErrorLog(err));
        setError(getErrorMessage(err, 'Ocorreu um erro ao processar os dados.'));
      })
      .finally(() => {
        setLoadingRelatorio(false);
      });
  };

  // Função auxiliar para renderizar o gráfico escolhido
  const renderizarGrafico = () => {
    const commonProps = {
      data: dadosEvolucao,
      margin: { top: 10, right: 10, left: -20, bottom: 0 }
    };

    const EixosETootip = (
      <>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }} dy={10} />
        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13 }} />
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
          formatter={(value: number | undefined) => value !== undefined ? [`${value}% de Desempenho`, 'Score'] : ['-', 'Score']}
        />
      </>
    );

    switch (tipoGrafico) {
      case 'barra':
        return (
          <BarChart {...commonProps}>
            {EixosETootip}
            <Bar dataKey="score" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500} />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {EixosETootip}
            <Area type="monotone" dataKey="score" stroke="#2563EB" fill="#DBEAFE" strokeWidth={3} animationDuration={1500} />
          </AreaChart>
        );
      case 'linha':
      default:
        return (
          <LineChart {...commonProps}>
            {EixosETootip}
            <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={4} dot={{ fill: '#2563EB', strokeWidth: 3, r: 6, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#1D4ED8' }} animationDuration={1500} />
          </LineChart>
        );
    }
  };

  // Pontos onde a fase muda em relação ao ponto anterior (marca os ciclos AB-ABAB)
  const transicoesFase = dadosAcompanhamento.filter(
    (ponto, index) => index > 0 && ponto.fase !== dadosAcompanhamento[index - 1].fase
  );
  const possuiIntervencao = dadosAcompanhamento.some((ponto) => ponto.fase === 'INTERVENCAO');

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Relatório Analítico de Evolução
          </h1>
          <p className="text-text-secondary">Geração autônoma de relatórios e gráficos do aprendente.</p>
        </div>
      </div>

      {/* Alternador de Modo */}
      <div className="inline-flex items-center gap-1 p-1 bg-white border border-primary-light rounded-lg shadow-sm">
        <button
          type="button"
          onClick={() => setModo('ia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            modo === 'ia' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-primary hover:bg-primary-light'
          }`}
        >
          <Sparkles className="h-4 w-4" /> Relatório com IA
        </button>
        <button
          type="button"
          onClick={() => setModo('acompanhamento')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            modo === 'acompanhamento' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-primary hover:bg-primary-light'
          }`}
        >
          <Activity className="h-4 w-4" /> Acompanhamento (AB-ABAB)
        </button>
      </div>

      {/* Caixa de Filtros (Formulário) */}
      <form onSubmit={handleGerarRelatorio} className="bg-white p-6 md:p-8 rounded-xl border border-primary-light shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1.5 w-full md:col-span-1">
            <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <User className="h-4 w-4 text-text-secondary" /> Aprendente
            </label>
            <select
              value={aprendenteSelecionado}
              onChange={(e) => setAprendenteSelecionado(e.target.value)}
              disabled={loadingDados}
              className="w-full bg-white border border-primary-light rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-text-primary cursor-pointer"
            >
              <option value="" disabled>
                {loadingDados ? 'Carregando lista...' : 'Escolha o aprendente...'}
              </option>
              {aprendentes.map(aprendente => (
                <option key={aprendente.id} value={aprendente.id}>{aprendente.nomeCompleto}</option>
              ))}
            </select>
          </div>

          {modo === 'ia' && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Data de Início" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} icon={<CalendarIcon className="h-5 w-5" />} required />
              <Input label="Data de Fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} icon={<CalendarIcon className="h-5 w-5" />} required />
            </div>
          )}
        </div>

        {modo === 'ia' && error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {modo === 'acompanhamento' && errorAcompanhamento && (
          <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
            {errorAcompanhamento}
          </div>
        )}

        {modo === 'ia' && (
          <div className="flex justify-between items-center pt-2 border-t border-primary-light mt-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-text-secondary" />
              <select
                value={tipoGrafico}
                onChange={(e) => setTipoGrafico(e.target.value as TipoGrafico)}
                className="text-sm font-medium text-text-primary bg-background border border-primary-light rounded-lg py-2 px-3 outline-none focus:border-primary cursor-pointer"
              >
                <option value="linha">Gráfico de Linha</option>
                <option value="barra">Gráfico de Barras</option>
                <option value="area">Gráfico de Área</option>
              </select>
            </div>

            <Button type="submit" isLoading={loadingRelatorio} className="w-full md:w-auto px-8">
              <Sparkles className="h-4 w-4 mr-2" /> Emitir Relatório
            </Button>
          </div>
        )}
      </form>

      {/* Área de Resultado (Relatório com IA) */}
      {modo === 'ia' && !loadingRelatorio && resumoIa && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Caixa de Relatório da Inteligência Heurística */}
          <div className="bg-primary-light p-6 md:p-8 rounded-xl border border-primary-light shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="h-32 w-32 text-primary" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Relatório Automático Sistêmico
              </h3>
              <p className="text-text-primary leading-relaxed font-medium">
                {resumoIa}
              </p>
            </div>
          </div>

          {/* Gráfico Analítico (Dinâmico) */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-primary-light shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-text-primary">Análise Cognitiva Gráfica</h3>
              <p className="text-sm text-text-secondary">Média de desempenho (Score) no período selecionado.</p>
            </div>

            {dadosEvolucao.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-text-secondary font-medium">
                Não há dados matemáticos consolidados para este período.
              </div>
            ) : (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {renderizarGrafico()}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Área de Resultado (Acompanhamento AB-ABAB) */}
      {modo === 'acompanhamento' && !!aprendenteSelecionado && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 md:p-8 rounded-xl border border-primary-light shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-text-primary">Gráfico de Acompanhamento (AB-ABAB)</h3>
              <p className="text-sm text-text-secondary">Score por sessão, sem uso de IA — dados calculados matematicamente.</p>
            </div>

            {loadingAcompanhamento ? (
              <div className="flex items-center justify-center h-[300px] text-text-secondary font-medium">
                Carregando histórico...
              </div>
            ) : dadosAcompanhamento.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-text-secondary font-medium">
                Não há atendimentos registrados para este aprendente.
              </div>
            ) : (
              <>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosAcompanhamento} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }} dy={10} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                        formatter={(value: number | undefined, _name, item) => {
                          const fase = (item?.payload as PontoAcompanhamento | undefined)?.fase;
                          const rotuloFase = fase === 'INTERVENCAO' ? 'Intervenção' : 'Linha de Base';
                          return value !== undefined ? [`${value}% (${rotuloFase})`, 'Score'] : ['-', 'Score'];
                        }}
                      />
                      {transicoesFase.map((ponto, i) => (
                        <ReferenceLine key={`${ponto.data}-${i}`} x={ponto.data} stroke="#6B6560" strokeDasharray="4 4" />
                      ))}
                      <Line type="monotone" dataKey="score" stroke="#1F5A56" strokeWidth={3} dot={<DotFase />} activeDot={{ r: 8, strokeWidth: 0, fill: '#1F5A56' }} animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda das fases */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-primary-light">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: CORES_FASE.LINHA_BASE }} />
                    Linha de Base
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: CORES_FASE.INTERVENCAO }} />
                    Intervenção
                  </div>
                </div>

                {!possuiIntervencao && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-text-secondary">
                    <Info className="h-4 w-4 shrink-0" />
                    Ainda não há dados de intervenção registrados para comparação — todas as sessões estão em Linha de Base.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}