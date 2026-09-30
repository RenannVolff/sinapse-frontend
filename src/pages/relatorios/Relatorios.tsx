import { useState, useEffect, useRef, type FormEvent, type CSSProperties } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, ReferenceLine, Cell, ComposedChart, Scatter
} from 'recharts';
import { BarChart3, User, BrainCircuit, Calendar as CalendarIcon, Sparkles, Settings2, Activity, Info, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
import { isAxiosError } from 'axios';
import { toPng } from 'html-to-image';
import { api } from '../../services/api';
import { getErrorMessage, getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
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

type ModoRelatorio = 'ia' | 'acompanhamento' | 'media-periodo' | 'regressao';

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

interface CicloAcompanhamento {
  ciclo: string;
  fase: Fase;
  mediaScore: number;
  quantidade: number;
}

const CORES_FASE: Record<Fase, string> = {
  LINHA_BASE: '#1F5A56',
  INTERVENCAO: '#D97A3F',
};

// Fica fora do componente porque o recharts chama isso uma vez por ponto;
// dentro, seria recriado a cada render.
function DotFase(props: { cx?: number; cy?: number; payload?: PontoAcompanhamento }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  return <circle cx={cx} cy={cy} r={6} fill={CORES_FASE[payload.fase]} stroke="#fff" strokeWidth={2} />;
}

// Ciclo = sequência de sessões seguidas na mesma fase. Depende de os pontos
// já virem ordenados por data (o backend ordena).
function agruparEmCiclos(pontos: PontoAcompanhamento[]): CicloAcompanhamento[] {
  const grupos: { fase: Fase; scores: number[] }[] = [];

  pontos.forEach((ponto) => {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.fase === ponto.fase) {
      ultimo.scores.push(ponto.score);
    } else {
      grupos.push({ fase: ponto.fase, scores: [ponto.score] });
    }
  });

  return grupos.map((grupo, index) => ({
    ciclo: `Ciclo ${index + 1}`,
    fase: grupo.fase,
    mediaScore: Math.round(grupo.scores.reduce((soma, score) => soma + score, 0) / grupo.scores.length),
    quantidade: grupo.scores.length,
  }));
}

interface RegressaoLinear {
  slope: number;
  intercept: number;
  previstos: number[];
}

interface PontoRegressao {
  data: string;
  score: number;
  fase: Fase;
  previsto?: number;
}

// Mínimos quadrados com x = índice da sessão, não a data: o intervalo entre
// sessões é ignorado de propósito.
function calcularRegressaoLinear(pontos: PontoAcompanhamento[]): RegressaoLinear {
  const n = pontos.length;
  const xs = pontos.map((_, indice) => indice);
  const ys = pontos.map((ponto) => ponto.score);

  const somaX = xs.reduce((soma, x) => soma + x, 0);
  const somaY = ys.reduce((soma, y) => soma + y, 0);
  const somaXY = xs.reduce((soma, x, i) => soma + x * ys[i], 0);
  const somaX2 = xs.reduce((soma, x) => soma + x * x, 0);

  const slope = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);
  const intercept = (somaY - slope * somaX) / n;

  const previstos = xs.map((x) => slope * x + intercept);

  return { slope, intercept, previstos };
}

function ShapePontoRegressao(props: { cx?: number; cy?: number; payload?: PontoRegressao }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  return <circle cx={cx} cy={cy} r={5} fill={CORES_FASE[payload.fase]} stroke="#fff" strokeWidth={1.5} />;
}

type DimensaoGrafico = { width: number; height: number };

// Fora da tela o ResponsiveContainer não consegue medir o pai (fica em -1x-1),
// por isso a exportação usa tamanho fixo em pixel.
const EXPORT_PADDING = 24;
const EXPORT_WRAPPER = { width: 800, height: 420 };
const EXPORT_GRAFICO: DimensaoGrafico = {
  width: EXPORT_WRAPPER.width - EXPORT_PADDING * 2,
  height: EXPORT_WRAPPER.height - EXPORT_PADDING * 2,
};

// Um PNG 800x420 com gráfico tem dezenas de KB; abaixo disso a captura saiu em branco.
const TAMANHO_MINIMO_BASE64 = 5000;

function propsContainer(dimensao?: DimensaoGrafico) {
  return dimensao
    ? { width: dimensao.width, height: dimensao.height, initialDimension: dimensao }
    : { width: '100%' as const, height: '100%' as const };
}

const estiloWrapperExport: CSSProperties = {
  width: EXPORT_WRAPPER.width,
  height: EXPORT_WRAPPER.height,
  padding: EXPORT_PADDING,
  boxSizing: 'border-box',
  background: '#FFFFFF',
};

// Os três gráficos abaixo servem tanto para a tela quanto para o container
// oculto da exportação.
function GraficoAbAbab({ dados, transicoes, dimensao }: { dados: PontoAcompanhamento[]; transicoes: PontoAcompanhamento[]; dimensao?: DimensaoGrafico }) {
  return (
    <ResponsiveContainer {...propsContainer(dimensao)}>
      <LineChart data={dados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
        {transicoes.map((ponto, i) => (
          <ReferenceLine key={`${ponto.data}-${i}`} x={ponto.data} stroke="#6B6560" strokeDasharray="4 4" />
        ))}
        <Line type="monotone" dataKey="score" stroke="#1F5A56" strokeWidth={3} dot={<DotFase />} activeDot={{ r: 8, strokeWidth: 0, fill: '#1F5A56' }} animationDuration={1500} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function GraficoCiclos({ ciclos, dimensao }: { ciclos: CicloAcompanhamento[]; dimensao?: DimensaoGrafico }) {
  return (
    <ResponsiveContainer {...propsContainer(dimensao)}>
      <BarChart data={ciclos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="ciclo" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }} dy={10} />
        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13 }} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
          formatter={(value: number | undefined, _name, item) => {
            const dados = item?.payload as CicloAcompanhamento | undefined;
            if (!dados || value === undefined) return ['-', 'Score Médio'];
            const rotuloFase = dados.fase === 'INTERVENCAO' ? 'Intervenção' : 'Linha de Base';
            const sessoesLabel = dados.quantidade === 1 ? '1 sessão' : `${dados.quantidade} sessões`;
            return [`${value}% (${rotuloFase}, ${sessoesLabel})`, 'Score Médio'];
          }}
        />
        <Bar dataKey="mediaScore" radius={[4, 4, 0, 0]} barSize={60} animationDuration={1500}>
          {ciclos.map((ciclo) => (
            <Cell key={ciclo.ciclo} fill={CORES_FASE[ciclo.fase]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function GraficoRegressao({ dados, dimensao }: { dados: PontoRegressao[]; dimensao?: DimensaoGrafico }) {
  return (
    <ResponsiveContainer {...propsContainer(dimensao)}>
      <ComposedChart data={dados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }} dy={10} />
        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13 }} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
          formatter={(value: number | undefined, name, item) => {
            if (value === undefined) return ['-', name];
            if (name === 'previsto') {
              return [`${Math.round(value)}%`, 'Tendência (regressão)'];
            }
            const fase = (item?.payload as PontoRegressao | undefined)?.fase;
            const rotuloFase = fase === 'INTERVENCAO' ? 'Intervenção' : 'Linha de Base';
            return [`${value}% (${rotuloFase})`, 'Score Real'];
          }}
        />
        <Scatter dataKey="score" fill="#1F5A56" shape={<ShapePontoRegressao />} />
        <Line type="linear" dataKey="previsto" stroke="#6B6560" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={false} animationDuration={1500} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function extrairNomeArquivo(contentDisposition: unknown): string | null {
  if (typeof contentDisposition !== 'string') return null;
  const match = /filename="?([^"]+)"?/.exec(contentDisposition);
  return match ? match[1] : null;
}

export function Relatorios() {
  const { showError, showSuccess } = useToast();

  const [aprendentes, setAprendentes] = useState<AprendenteOpcao[]>([]);

  const [modo, setModo] = useState<ModoRelatorio>('ia');

  const [aprendenteSelecionado, setAprendenteSelecionado] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('linha');

  const [dadosEvolucao, setDadosEvolucao] = useState<EvolucaoData[]>([]);
  const [resumoIa, setResumoIa] = useState<string>('');
  // De quem é o resumoIa. Sem isso, trocar de aprendente e exportar levaria
  // o resumo do anterior pro Word.
  const [resumoIaAprendenteId, setResumoIaAprendenteId] = useState<string>('');

  const [dadosAcompanhamento, setDadosAcompanhamento] = useState<PontoAcompanhamento[]>([]);
  const [loadingAcompanhamento, setLoadingAcompanhamento] = useState<boolean>(false);
  const [errorAcompanhamento, setErrorAcompanhamento] = useState<string>('');
  // Primeira e última sessão do histórico. Vira o período padrão do relatório
  // na exportação quando o usuário exporta sem ter gerado o relatório antes.
  const [intervaloAcompanhamento, setIntervaloAcompanhamento] = useState<{ inicio: string; fim: string } | null>(null);

  const [loadingDados, setLoadingDados] = useState<boolean>(true);
  const [loadingRelatorio, setLoadingRelatorio] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [exportandoDocx, setExportandoDocx] = useState<boolean>(false);
  const refGraficoAbAbab = useRef<HTMLDivElement>(null);
  const refGraficoCiclos = useRef<HTMLDivElement>(null);
  const refGraficoRegressao = useRef<HTMLDivElement>(null);

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

  // Carrega em qualquer modo, não só nas abas de acompanhamento: a exportação
  // precisa dos três gráficos mesmo que o usuário nunca tenha aberto essas abas.
  useEffect(() => {
    if (!aprendenteSelecionado) {
      setDadosAcompanhamento([]);
      setIntervaloAcompanhamento(null);
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

          if (res.data.length > 0) {
            const datasIso = res.data.map((sessao) => sessao.dataAtendimento.slice(0, 10)).sort();
            setIntervaloAcompanhamento({ inicio: datasIso[0], fim: datasIso[datasIso.length - 1] });
          } else {
            setIntervaloAcompanhamento(null);
          }
        })
        .catch((err) => {
          console.error('[Relatorios] Erro ao buscar gráfico de acompanhamento:', getSafeErrorLog(err));
          setErrorAcompanhamento(getErrorMessage(err, 'Falha ao buscar o histórico de acompanhamento.'));
          setDadosAcompanhamento([]);
          setIntervaloAcompanhamento(null);
        })
        .finally(() => {
          setLoadingAcompanhamento(false);
        });
    }

    buscarAcompanhamento();
  }, [aprendenteSelecionado]);

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
        setResumoIaAprendenteId(aprendenteSelecionado);
      })
      .catch((err) => {
        console.error('[Relatorios] Erro ao gerar relatório:', getSafeErrorLog(err));
        setError(getErrorMessage(err, 'Ocorreu um erro ao processar os dados.'));
      })
      .finally(() => {
        setLoadingRelatorio(false);
      });
  };

  async function capturarGraficoBase64(elemento: HTMLDivElement | null): Promise<string> {
    if (!elemento) {
      throw new Error('Gráfico indisponível para captura.');
    }
    const dataUrl = await toPng(elemento, {
      backgroundColor: '#FFFFFF',
      pixelRatio: 2,
      width: EXPORT_WRAPPER.width,
      height: EXPORT_WRAPPER.height,
    });
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    if (base64.length < TAMANHO_MINIMO_BASE64) {
      throw new Error('CAPTURA_VAZIA');
    }
    return base64;
  }

  const handleExportarDocx = async () => {
    if (!aprendenteSelecionado || dadosAcompanhamento.length === 0) {
      return;
    }

    setExportandoDocx(true);

    try {
      let textoResumo = resumoIaAprendenteId === aprendenteSelecionado ? resumoIa : '';

      if (!textoResumo) {
        const inicio = dataInicio || intervaloAcompanhamento?.inicio;
        const fim = dataFim || intervaloAcompanhamento?.fim;

        if (!inicio || !fim) {
          throw new Error('SEM_INTERVALO');
        }

        const res = await api.get<RelatorioResponse>(
          `/aprendentes/${aprendenteSelecionado}/relatorio-ia?inicio=${inicio}&fim=${fim}`
        );
        textoResumo = res.data.resumoIa;
        setResumoIa(textoResumo);
        setResumoIaAprendenteId(aprendenteSelecionado);
      }

      // Dois frames: um só não garante que o SVG dos gráficos ocultos já foi pintado.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const [imagemAbAbab, imagemCiclos, imagemRegressao] = await Promise.all([
        capturarGraficoBase64(refGraficoAbAbab.current),
        capturarGraficoBase64(refGraficoCiclos.current),
        capturarGraficoBase64(refGraficoRegressao.current),
      ]);

      const nomeAprendente = aprendentes.find((a) => a.id === aprendenteSelecionado)?.nomeCompleto ?? '';

      const payload = {
        nomeAprendente,
        resumoIa: textoResumo,
        graficos: [
          { titulo: 'Acompanhamento AB-ABAB', imagemBase64: imagemAbAbab },
          { titulo: 'Média por Período', imagemBase64: imagemCiclos },
          { titulo: 'Regressão Linear', imagemBase64: imagemRegressao },
        ],
      };

      const response = await api.post(`/aprendentes/${aprendenteSelecionado}/exportar-docx`, payload, {
        responseType: 'blob',
      });

      const blobUrl = URL.createObjectURL(response.data as Blob);
      const nomeArquivo = extrairNomeArquivo(response.headers?.['content-disposition'])
        ?? `relatorio-${nomeAprendente.trim().toLowerCase().replace(/\s+/g, '-')}.docx`;

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      showSuccess('Relatório exportado para Word com sucesso.');
    } catch (err) {
      console.error('[Relatorios] Erro ao exportar para Word:', getSafeErrorLog(err));
      // Erro do axios já ganhou toast no interceptor; aqui só o que não passa por lá.
      if (!isAxiosError(err)) {
        showError(
          err instanceof Error && err.message === 'SEM_INTERVALO'
            ? 'Não foi possível determinar o período do relatório. Gere o relatório com IA ou registre atendimentos para este aprendente.'
            : err instanceof Error && err.message === 'CAPTURA_VAZIA'
              ? 'Não foi possível capturar os gráficos para o documento (imagem vazia). Aguarde os gráficos carregarem e tente novamente.'
              : 'Não foi possível gerar o documento Word. Tente novamente.'
        );
      }
    } finally {
      setExportandoDocx(false);
    }
  };

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

  // Viram as linhas tracejadas de troca de fase no gráfico AB-ABAB.
  const transicoesFase = dadosAcompanhamento.filter(
    (ponto, index) => index > 0 && ponto.fase !== dadosAcompanhamento[index - 1].fase
  );
  const possuiIntervencao = dadosAcompanhamento.some((ponto) => ponto.fase === 'INTERVENCAO');
  const ciclosAcompanhamento = agruparEmCiclos(dadosAcompanhamento);

  // Com menos de 3 sessões a reta não diz nada.
  const regressao = dadosAcompanhamento.length >= 3 ? calcularRegressaoLinear(dadosAcompanhamento) : null;
  const dadosRegressao: PontoRegressao[] = dadosAcompanhamento.map((ponto, i) => ({
    data: ponto.data,
    score: ponto.score,
    fase: ponto.fase,
    previsto: regressao ? regressao.previstos[i] : undefined,
  }));
  const tendencia = regressao === null
    ? null
    : Math.abs(regressao.slope) < 0.5
      ? 'estavel'
      : regressao.slope > 0
        ? 'melhora'
        : 'piora';

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Relatório Analítico de Evolução
          </h1>
          <p className="text-text-secondary">Geração autônoma de relatórios e gráficos do aprendente.</p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleExportarDocx}
          isLoading={exportandoDocx}
          disabled={!aprendenteSelecionado || dadosAcompanhamento.length === 0}
          title={
            !aprendenteSelecionado
              ? 'Selecione um aprendente para exportar.'
              : dadosAcompanhamento.length === 0
                ? 'Este aprendente ainda não possui atendimentos registrados para gerar os gráficos do relatório.'
                : undefined
          }
          className="w-full md:w-auto px-6"
        >
          <Download className="h-4 w-4 mr-2" /> Exportar para Word (.docx)
        </Button>
      </div>

      {/* Gráficos fora da tela, em tamanho fixo, só para o html-to-image capturar na exportação */}
      {dadosAcompanhamento.length > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            zIndex: -1,
            width: EXPORT_WRAPPER.width,
            height: EXPORT_WRAPPER.height * 3,
          }}
        >
          <div ref={refGraficoAbAbab} style={estiloWrapperExport}>
            <GraficoAbAbab dados={dadosAcompanhamento} transicoes={transicoesFase} dimensao={EXPORT_GRAFICO} />
          </div>
          <div ref={refGraficoCiclos} style={estiloWrapperExport}>
            <GraficoCiclos ciclos={ciclosAcompanhamento} dimensao={EXPORT_GRAFICO} />
          </div>
          <div ref={refGraficoRegressao} style={estiloWrapperExport}>
            <GraficoRegressao dados={dadosRegressao} dimensao={EXPORT_GRAFICO} />
          </div>
        </div>
      )}

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
        <button
          type="button"
          onClick={() => setModo('media-periodo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            modo === 'media-periodo' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-primary hover:bg-primary-light'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Média por Período
        </button>
        <button
          type="button"
          onClick={() => setModo('regressao')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            modo === 'regressao' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-primary hover:bg-primary-light'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Regressão Linear
        </button>
      </div>

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

        {(modo === 'acompanhamento' || modo === 'media-periodo' || modo === 'regressao') && errorAcompanhamento && (
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
                  <GraficoAbAbab dados={dadosAcompanhamento} transicoes={transicoesFase} />
                </div>

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

      {/* Área de Resultado (Média por Período) */}
      {modo === 'media-periodo' && !!aprendenteSelecionado && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 md:p-8 rounded-xl border border-primary-light shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-text-primary">Média por Período</h3>
              <p className="text-sm text-text-secondary">Score médio por ciclo de fase (Linha de Base / Intervenção), sem uso de IA.</p>
            </div>

            {loadingAcompanhamento ? (
              <div className="flex items-center justify-center h-[300px] text-text-secondary font-medium">
                Carregando histórico...
              </div>
            ) : ciclosAcompanhamento.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-text-secondary font-medium">
                Não há atendimentos registrados para este aprendente.
              </div>
            ) : (
              <>
                <div className="h-[400px] w-full">
                  <GraficoCiclos ciclos={ciclosAcompanhamento} />
                </div>

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

      {/* Área de Resultado (Regressão Linear) */}
      {modo === 'regressao' && !!aprendenteSelecionado && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 md:p-8 rounded-xl border border-primary-light shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-text-primary">Regressão Linear</h3>
              <p className="text-sm text-text-secondary">Tendência de evolução do score ao longo das sessões, sem uso de IA.</p>
            </div>

            {loadingAcompanhamento ? (
              <div className="flex items-center justify-center h-[300px] text-text-secondary font-medium">
                Carregando histórico...
              </div>
            ) : dadosAcompanhamento.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-text-secondary font-medium">
                Não há atendimentos registrados para este aprendente.
              </div>
            ) : dadosAcompanhamento.length < 3 ? (
              <div className="flex items-center gap-2 justify-center h-[300px] text-text-secondary font-medium text-center px-6">
                <Info className="h-4 w-4 shrink-0" />
                São necessárias pelo menos 3 sessões registradas para gerar a análise de regressão linear.
              </div>
            ) : (
              <>
                <div className="h-[400px] w-full">
                  <GraficoRegressao dados={dadosRegressao} />
                </div>

                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-primary-light">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: CORES_FASE.LINHA_BASE }} />
                    Linha de Base
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: CORES_FASE.INTERVENCAO }} />
                    Intervenção
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    <span className="h-3 w-3 rounded-full inline-block border border-dashed border-[#6B6560]" />
                    Tendência (regressão)
                  </div>
                </div>

                {tendencia && (
                  <div className={`flex items-center gap-2 mt-4 pt-4 border-t border-primary-light text-sm font-semibold ${
                    tendencia === 'melhora' ? 'text-primary' : tendencia === 'piora' ? 'text-red-600' : 'text-text-secondary'
                  }`}>
                    {tendencia === 'melhora' && <TrendingUp className="h-4 w-4 shrink-0" />}
                    {tendencia === 'piora' && <TrendingDown className="h-4 w-4 shrink-0" />}
                    {tendencia === 'estavel' && <Minus className="h-4 w-4 shrink-0" />}
                    {tendencia === 'melhora' && 'Tendência de melhora ao longo do tempo.'}
                    {tendencia === 'piora' && 'Tendência de piora ao longo do tempo.'}
                    {tendencia === 'estavel' && 'Desempenho estável, sem tendência clara.'}
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