import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar as CalendarIcon, BrainCircuit, TrendingUp, 
  CheckCircle2, Circle, Plus, Trash2, ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface Tarefa {
  id: string;
  texto: string;
  concluida: boolean;
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados para Estatísticas
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [sessoesMes, setSessoesMes] = useState(0);

  // Estados para a Lista de Afazeres
  const [tarefas, setTarefas] = useState<Tarefa[]>(() => {
    const salvas = localStorage.getItem('@SinapseEdu:tarefas');
    return salvas ? JSON.parse(salvas) : [];
  });
  const [novaTarefa, setNovaTarefa] = useState('');

  // Busca as métricas reais do banco de dados (Sem async/await)
  useEffect(() => {
    // Busca total de alunos
    api.get('/alunos')
      .then((res) => setTotalAlunos(res.data.length))
      .catch((err) => console.error('Erro ao buscar alunos:', err));

    // Busca sessões do mês atual
    const dataAtual = new Date();
    api.get(`/atendimentos/calendario?mes=${dataAtual.getMonth() + 1}&ano=${dataAtual.getFullYear()}`)
      .then((res) => setSessoesMes(res.data.length))
      .catch((err) => console.error('Erro ao buscar sessões:', err));
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
          <BrainCircuit className="h-64 w-64" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Olá, {user?.nome?.split(' ')[0] || 'Profissional'}! 👋</h1>
          <p className="text-blue-100 text-lg">Aqui está o resumo do seu consultório hoje.</p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Total de Aprendentes</p>
            <h3 className="text-2xl font-black text-gray-900">{totalAlunos}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <CalendarIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Sessões neste Mês</p>
            <h3 className="text-2xl font-black text-gray-900">{sessoesMes}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="h-14 w-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Status do Sistema</p>
            <h3 className="text-xl font-black text-gray-900 mt-1">Operacional</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ações Rápidas (Sem pontas soltas) */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            Ações Rápidas
          </h2>
          
          <button onClick={() => navigate('/alunos/novo')} className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Users className="h-5 w-5" /></div>
              <span className="font-semibold text-gray-700 group-hover:text-blue-700">Novo Aprendente</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
          </button>

          <button onClick={() => navigate('/agenda/nova')} className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><CalendarIcon className="h-5 w-5" /></div>
              <span className="font-semibold text-gray-700 group-hover:text-indigo-700">Agendar Sessão</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
          </button>

          <button onClick={() => navigate('/relatorios')} className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-green-300 hover:bg-green-50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-600 p-2 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
              <span className="font-semibold text-gray-700 group-hover:text-green-700">Emitir Relatório</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Lista de Afazeres (To-Do List) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-[400px]">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
            Minhas Tarefas
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4 custom-scrollbar">
            {tarefas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <CheckCircle2 className="h-12 w-12 mb-2 opacity-20" />
                <p>Nenhuma tarefa pendente. Tudo limpo!</p>
              </div>
            ) : (
              tarefas.map(tarefa => (
                <div key={tarefa.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${tarefa.concluida ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-blue-100 shadow-sm'}`}>
                  <button onClick={() => toggleTarefa(tarefa.id)} className="flex items-center gap-3 flex-1 text-left">
                    {tarefa.concluida ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={`font-medium ${tarefa.concluida ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {tarefa.texto}
                    </span>
                  </button>
                  <button onClick={() => deletarTarefa(tarefa.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddTarefa} className="flex gap-2 pt-2 border-t border-gray-100">
            <input 
              type="text" 
              value={novaTarefa}
              onChange={(e) => setNovaTarefa(e.target.value)}
              placeholder="Adicionar nova tarefa..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <button type="submit" disabled={!novaTarefa.trim()} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}