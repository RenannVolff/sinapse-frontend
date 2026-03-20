import { useState, useEffect, type FormEvent } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import { BarChart3, User, BrainCircuit, Calendar as CalendarIcon, Sparkles, Settings2 } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface AlunoOpcao {
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

export function Relatorios() {
  const [alunos, setAlunos] = useState<AlunoOpcao[]>([]);
  
  // Estados do Formulário
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('linha');
  
  // Estados de Resultado
  const [dadosEvolucao, setDadosEvolucao] = useState<EvolucaoData[]>([]);
  const [resumoIa, setResumoIa] = useState<string>('');
  
  // Estados de Controle (Sem async/await)
  const [loadingDados, setLoadingDados] = useState<boolean>(true);
  const [loadingRelatorio, setLoadingRelatorio] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Busca inicial dos alunos
  useEffect(() => {
    api.get<AlunoOpcao[]>('/alunos')
      .then((res) => {
        setAlunos(res.data);
        setError('');
      })
      .catch((err) => {
        console.error('Erro ao buscar alunos:', err);
        setError('Falha ao conectar com o servidor.');
      })
      .finally(() => {
        setLoadingDados(false);
      });
  }, []);

  // Submissão do Formulário
  const handleGerarRelatorio = (e: FormEvent) => {
    e.preventDefault();
    
    if (!alunoSelecionado || !dataInicio || !dataFim) {
      setError('Por favor, preencha o paciente e o período selecionado.');
      return;
    }

    setLoadingRelatorio(true);
    setError('');

    api.get<RelatorioResponse>(`/alunos/${alunoSelecionado}/relatorio-ia?inicio=${dataInicio}&fim=${dataFim}`)
      .then((res) => {
        setDadosEvolucao(res.data.dadosGrafico);
        setResumoIa(res.data.resumoIa);
      })
      .catch((err) => {
        console.error('Erro ao gerar relatório:', err);
        setError('Ocorreu um erro ao processar os dados.');
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

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Relatório Analítico de Evolução
          </h1>
          <p className="text-gray-500">Geração autônoma de laudos e gráficos do paciente.</p>
        </div>
      </div>

      {/* Caixa de Filtros (Formulário) */}
      <form onSubmit={handleGerarRelatorio} className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1.5 w-full md:col-span-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" /> Paciente
            </label>
            <select
              value={alunoSelecionado}
              onChange={(e) => setAlunoSelecionado(e.target.value)}
              disabled={loadingDados}
              className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-gray-900 cursor-pointer"
            >
              <option value="" disabled>
                {loadingDados ? 'Carregando lista...' : 'Escolha o paciente...'}
              </option>
              {alunos.map(aluno => (
                <option key={aluno.id} value={aluno.id}>{aluno.nomeCompleto}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Data de Início" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} icon={<CalendarIcon className="h-5 w-5" />} required />
            <Input label="Data de Fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} icon={<CalendarIcon className="h-5 w-5" />} required />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-6">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-gray-400" />
            <select
              value={tipoGrafico}
              onChange={(e) => setTipoGrafico(e.target.value as TipoGrafico)}
              className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 outline-none focus:border-primary cursor-pointer"
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
      </form>

      {/* Área de Resultado */}
      {!loadingRelatorio && resumoIa && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Caixa de Laudo da Inteligência Heurística */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="h-32 w-32 text-primary" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Laudo Automático Sistêmico
              </h3>
              <p className="text-gray-700 leading-relaxed font-medium">
                {resumoIa}
              </p>
            </div>
          </div>

          {/* Gráfico Analítico (Dinâmico) */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900">Análise Cognitiva Gráfica</h3>
              <p className="text-sm text-gray-500">Média de desempenho (Score) no período selecionado.</p>
            </div>

            {dadosEvolucao.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400 font-medium">
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
    </div>
  );
}