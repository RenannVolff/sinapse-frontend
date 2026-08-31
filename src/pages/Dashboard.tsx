import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar as CalendarIcon, BrainCircuit, TrendingUp, 
  CheckCircle2, Circle, Plus, Trash2, ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { getSafeErrorLog } from '../services/apiError';
import { SynapseBackground } from '../components/ui/SynapseBackground';

interface Tarefa {
  id: string;
  texto: string;
  concluida: boolean;
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados para Estatísticas
  const [totalAprendentes, setTotalAprendentes] = useState(0);
  const [sessoesMes, setSessoesMes] = useState(0);

  // Estados para a Lista de Afazeres
  const [tarefas, setTarefas] = useState<Tarefa[]>(() => {
    const salvas = localStorage.getItem('@SinapseEdu:tarefas');
    return salvas ? JSON.parse(salvas) : [];
  });
  const [novaTarefa, setNovaTarefa] = useState('');

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

  // Salva as tarefas no navegador sempre que a lista mudar
  useEffect(() => {
    localStorage.setItem('@SinapseEdu:tarefas', JSON.stringify(tarefas));
  }, [tarefas]);

  // Funções da Lista de Afazeres
  const handleAddTarefa = (e: FormEvent) => {
    e.preventDefault();
    if (!novaTarefa.trim()) return;

    const tarefa: Tarefa = {
      id: crypto.randomUUID(),
      texto: novaTarefa,
      concluida: false
    };

    setTarefas([...tarefas, tarefa]);
    setNovaTarefa('');
  };

  const toggleTarefa = (id: string) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, concluida: !t.concluida } : t));
  };

  const deletarTarefa = (id: string) => {
    setTarefas(tarefas.filter(t => t.id !== id));
  };

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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-primary-light shadow-sm p-6 flex flex-col h-[400px]">
          <h2 className="text-xl font-bold text-text-primary mb-4 border-b border-primary-light pb-3">
            Minhas Tarefas
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4 custom-scrollbar">
            {tarefas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                <CheckCircle2 className="h-12 w-12 mb-2 opacity-20" />
                <p>Nenhuma tarefa pendente. Tudo limpo!</p>
              </div>
            ) : (
              tarefas.map(tarefa => (
                <div key={tarefa.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${tarefa.concluida ? 'bg-background border-primary-light opacity-60' : 'bg-white border-primary-light shadow-sm'}`}>
                  <button onClick={() => toggleTarefa(tarefa.id)} className="flex items-center gap-3 flex-1 text-left">
                    {tarefa.concluida ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-6 w-6 text-text-secondary flex-shrink-0" />
                    )}
                    <span className={`font-medium ${tarefa.concluida ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                      {tarefa.texto}
                    </span>
                  </button>
                  <button onClick={() => deletarTarefa(tarefa.id)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddTarefa} className="flex gap-2 pt-2 border-t border-primary-light">
            <input
              type="text"
              value={novaTarefa}
              onChange={(e) => setNovaTarefa(e.target.value)}
              placeholder="Adicionar nova tarefa..."
              className="flex-1 bg-background border border-primary-light rounded-xl px-4 outline-none focus:border-primary focus:bg-white transition-colors"
            />
            <button type="submit" disabled={!novaTarefa.trim()} className="bg-primary hover:bg-primary-hover text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}