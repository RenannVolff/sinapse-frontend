import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar as CalendarIcon, BrainCircuit, TrendingUp, ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { getSafeErrorLog } from '../services/apiError';
import { SynapseBackground } from '../components/ui/SynapseBackground';
import { ListaTarefas } from '../components/dashboard/ListaTarefas';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados para Estatísticas
  const [totalAprendentes, setTotalAprendentes] = useState(0);
  const [sessoesMes, setSessoesMes] = useState(0);

  // Busca as métricas reais do banco de dados (Sem async/await)
  useEffect(() => {
    // Busca total de aprendentes
    api.get('/aprendentes')
      .then((res) => setTotalAprendentes(res.data.length))
      .catch((err) => console.error('[Dashboard] Erro ao buscar aprendentes:', getSafeErrorLog(err)));

    // Busca sessões do mês atual
    const dataAtual = new Date();
    api.get(`/atendimentos/calendario?mes=${dataAtual.getMonth() + 1}&ano=${dataAtual.getFullYear()}`)
      .then((res) => setSessoesMes(res.data.length))
      .catch((err) => console.error('[Dashboard] Erro ao buscar sessões:', getSafeErrorLog(err)));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in pb-12">
      
      {/* Cabeçalho de Boas-Vindas */}
      <div className="bg-gradient-to-r from-primary to-primary-hover rounded-2xl p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <SynapseBackground className="absolute inset-0 w-full h-full text-white/[0.12] pointer-events-none" />
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
          <BrainCircuit className="h-64 w-64" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Olá, {user?.nome?.split(' ')[0] || 'Profissional'}! 👋</h1>
          <p className="text-primary-light text-lg">Aqui está o resumo do seu consultório hoje.</p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-white p-6 rounded-2xl border border-primary-light shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="h-14 w-14 bg-primary-light text-primary rounded-xl flex items-center justify-center">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-secondary uppercase">Total de Aprendentes</p>
            <h3 className="text-2xl font-black text-text-primary">{totalAprendentes}</h3>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 delay-75 bg-white p-6 rounded-2xl border border-primary-light shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="h-14 w-14 bg-primary-light text-primary rounded-xl flex items-center justify-center">
            <CalendarIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-secondary uppercase">Sessões neste Mês</p>
            <h3 className="text-2xl font-black text-text-primary">{sessoesMes}</h3>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 delay-150 bg-white p-6 rounded-2xl border border-primary-light shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="h-14 w-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-secondary uppercase">Status do Sistema</p>
            <h3 className="text-xl font-black text-text-primary mt-1">Operacional</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ações Rápidas (Sem pontas soltas) */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            Ações Rápidas
          </h2>

          <button onClick={() => navigate('/aprendentes/novo')} className="w-full flex items-center justify-between p-4 bg-white border border-primary-light rounded-xl shadow-sm hover:shadow-md hover:shadow-primary/10 hover:border-primary/30 hover:bg-primary-light transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="bg-primary-light text-primary p-2 rounded-lg"><Users className="h-5 w-5" /></div>
              <span className="font-semibold text-text-primary group-hover:text-primary-hover">Novo Aprendente</span>
            </div>
            <ArrowRight className="h-5 w-5 text-text-secondary group-hover:text-primary transition-transform group-hover:translate-x-1" />
          </button>

          <button onClick={() => navigate('/agenda/nova')} className="w-full flex items-center justify-between p-4 bg-white border border-primary-light rounded-xl shadow-sm hover:shadow-md hover:shadow-primary/10 hover:border-primary/30 hover:bg-primary-light transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="bg-primary-light text-primary p-2 rounded-lg"><CalendarIcon className="h-5 w-5" /></div>
              <span className="font-semibold text-text-primary group-hover:text-primary-hover">Agendar Sessão</span>
            </div>
            <ArrowRight className="h-5 w-5 text-text-secondary group-hover:text-primary transition-transform group-hover:translate-x-1" />
          </button>

          <button onClick={() => navigate('/relatorios')} className="w-full flex items-center justify-between p-4 bg-white border border-primary-light rounded-xl shadow-sm hover:shadow-md hover:shadow-green-500/10 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-600 p-2 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
              <span className="font-semibold text-text-primary group-hover:text-green-700">Emitir Relatório</span>
            </div>
            <ArrowRight className="h-5 w-5 text-text-secondary group-hover:text-green-600 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Lista de Afazeres (To-Do List) */}
        <ListaTarefas />
      </div>
    </div>
  );
}