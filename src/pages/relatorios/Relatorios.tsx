import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BarChart3, User, Loader2, BrainCircuit } from 'lucide-react';
import { api } from '../../services/api';

interface AlunoOpcao {
  id: string;
  nomeCompleto: string;
}

interface EvolucaoData {
  data: string;
  titulo: string;
  score: number;
}

export function Relatorios() {
  const [alunos, setAlunos] = useState<AlunoOpcao[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>('');
  
  const [dadosEvolucao, setDadosEvolucao] = useState<EvolucaoData[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega a lista de alunos para o select
  useEffect(() => {
    async function fetchAlunos() {
      try {
        const res = await api.get<AlunoOpcao[]>('/alunos');
        setAlunos(res.data);
      } catch (error) {
        console.error('Erro ao buscar alunos', error);
      }
    }
    fetchAlunos();
  }, []);

  // Quando o usuário escolhe um aluno, busca o gráfico dele
  useEffect(() => {
    if (!alunoSelecionado) return;

    async function fetchEvolucao() {
      setLoading(true);
      try {
        const res = await api.get<EvolucaoData[]>(`/alunos/${alunoSelecionado}/evolucao`);
        setDadosEvolucao(res.data);
      } catch (error) {
        console.error('Erro ao buscar evolução', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvolucao();
  }, [alunoSelecionado]);

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Relatórios de Evolução
          </h1>
          <p className="text-gray-500">Acompanhe o desempenho cognitivo individual dos pacientes.</p>
        </div>
      </div>

      {/* Seletor de Aluno */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          Selecione o Paciente para análise:
        </label>
        <select
          value={alunoSelecionado}
          onChange={(e) => setAlunoSelecionado(e.target.value)}
          className="w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 text-gray-900 cursor-pointer"
        >
          <option value="" disabled>Escolha um paciente da lista...</option>
          {alunos.map(aluno => (
            <option key={aluno.id} value={aluno.id}>{aluno.nomeCompleto}</option>
          ))}
        </select>
      </div>

      {/* Área do Gráfico */}
      {alunoSelecionado && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Calculando algoritmos de evolução...</p>
            </div>
          ) : dadosEvolucao.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <BrainCircuit className="h-16 w-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">Dados Insuficientes</h3>
              <p className="text-gray-500 max-w-md mt-2">
                Este paciente ainda não tem sessões com atividades finalizadas. Faça um atendimento e marque os checklists para gerar o gráfico.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900">Score Cognitivo Global</h3>
                <p className="text-sm text-gray-500">Média de desempenho baseada em acertos e nível de dificuldade.</p>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="data" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 13, fontWeight: 500 }} 
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 13 }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                      formatter={(value: number | undefined) => value !== undefined ? [`${value}% de Desempenho`, 'Score'] : ['-', 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#2563EB" 
                      strokeWidth={4} 
                      dot={{ fill: '#2563EB', strokeWidth: 3, r: 6, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#1D4ED8' }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}