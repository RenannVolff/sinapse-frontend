import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Users,
  Calendar,
  Trophy,
  Activity,
  ArrowUpRight,
  Plus,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

// --- Interfaces (Tipagem para evitar 'any') ---

interface DashboardStats {
  totalAlunos: number;
  atendimentosHoje: number;
  atividadesRealizadas: number;
  mediaEvolucao: number;
}

interface GraficoSemanalItem {
  nome: string;
  atendimentos: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  color: string;
  loading?: boolean;
}

// --- Componente Auxiliar: Card de Estatística ---
function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  loading,
}: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
        <span className="text-green-600 font-medium">{description}</span>
      </div>
    </div>
  );
}

// --- Componente Principal: Dashboard ---
export function Dashboard() {
  // Estado dos contadores (Cards)
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    atendimentosHoje: 0,
    atividadesRealizadas: 0,
    mediaEvolucao: 0,
  });

  // Estado do Gráfico
  const [graficoData, setGraficoData] = useState<GraficoSemanalItem[]>([]);
  
  // Estado de Carregamento
  const [loading, setLoading] = useState(true);

  // Busca dados reais ao carregar a página
  useEffect(() => {
    async function fetchDados() {
      try {
        // Chamada paralela para as duas rotas que criamos no Backend
        const [statsResponse, graficoResponse] = await Promise.all([
          api.get<DashboardStats>('/dashboard/stats'),
          api.get<GraficoSemanalItem[]>('/dashboard/graficos'),
        ]);

        setStats(statsResponse.data);
        setGraficoData(graficoResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDados();
  }, []);

  // Dados Mockados apenas para o Gráfico de Evolução (Linha)
  // Pois ainda não criamos um endpoint específico de histórico mensal no backend
  const dadosEvolucaoMock = [
    { nome: 'Jan', evolucao: 65 },
    { nome: 'Fev', evolucao: 72 },
    { nome: 'Mar', evolucao: stats.mediaEvolucao || 75 }, // Usa a média real como último ponto
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* 1. Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-gray-500">
            Acompanhe o desempenho da sua clínica em tempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="w-auto px-6">
            <Calendar className="h-4 w-4 mr-2" />
            Ver Agenda
          </Button>
          <Button className="w-auto px-6">
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </div>
      </div>

      {/* 2. Grid de Cards Estatísticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Alunos"
          value={stats.totalAlunos}
          icon={Users}
          color="bg-blue-500"
          description="Ativos no sistema"
          loading={loading}
        />
        <StatCard
          title="Atendimentos Hoje"
          value={stats.atendimentosHoje}
          icon={Calendar}
          color="bg-purple-500"
          description={new Date().toLocaleDateString('pt-BR')}
          loading={loading}
        />
        <StatCard
          title="Média de Evolução"
          value={`${stats.mediaEvolucao}%`}
          icon={Activity}
          color="bg-green-500"
          description="Score Ponderado Geral"
          loading={loading}
        />
        <StatCard
          title="Atividades Realizadas"
          value={stats.atividadesRealizadas}
          icon={Trophy}
          color="bg-orange-500"
          description="Total acumulado"
          loading={loading}
        />
      </div>

      {/* 3. Área de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Barras (Dados Reais do Backend) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Fluxo Semanal</h3>
            <p className="text-sm text-gray-500">Quantidade de atendimentos nos últimos 7 dias</p>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficoData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="nome"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar
                  dataKey="atendimentos"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                  name="Sessões"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Linha (Dados Mistos: Mock + Real na ponta) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
           <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Evolução Cognitiva</h3>
            <p className="text-sm text-gray-500">Média ponderada de desempenho mensal</p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosEvolucaoMock}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="nome"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="evolucao"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Score Médio"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
