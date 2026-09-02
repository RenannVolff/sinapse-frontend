import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, ChevronDown, Circle, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';

interface Tarefa {
  id: string;
  texto: string;
  concluida: boolean;
  notas: string | null;
}

export function ListaTarefas() {
  const { showSuccess } = useToast();

  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaTarefa, setNovaTarefa] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [tarefaExpandidaId, setTarefaExpandidaId] = useState<string | null>(null);
  const [notaRascunho, setNotaRascunho] = useState('');
  const [salvandoNotaId, setSalvandoNotaId] = useState<string | null>(null);
  const salvandoNotaRef = useRef<string | null>(null);

  useEffect(() => {
    api.get<Tarefa[]>('/tarefas')
      .then((res) => setTarefas(res.data))
      .catch((err) => console.error('[ListaTarefas] Erro ao buscar tarefas:', getSafeErrorLog(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleAddTarefa = (e: FormEvent) => {
    e.preventDefault();
    const texto = novaTarefa.trim();
    if (!texto) return;

    setAdicionando(true);
    api.post<Tarefa>('/tarefas', { texto })
      .then((res) => {
        setTarefas((prev) => [res.data, ...prev]);
        setNovaTarefa('');
      })
      .catch((err) => console.error('[ListaTarefas] Erro ao adicionar tarefa:', getSafeErrorLog(err)))
      .finally(() => setAdicionando(false));
  };

  const toggleTarefa = (tarefa: Tarefa) => {
    const concluida = !tarefa.concluida;
    setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, concluida } : t)));

    api.patch(`/tarefas/${tarefa.id}`, { concluida })
      .catch((err) => {
        console.error('[ListaTarefas] Erro ao atualizar tarefa:', getSafeErrorLog(err));
        setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, concluida: tarefa.concluida } : t)));
      });
  };

  const deletarTarefa = (id: string) => {
    const anterior = tarefas;
    setTarefas((prev) => prev.filter((t) => t.id !== id));
    if (tarefaExpandidaId === id) setTarefaExpandidaId(null);

    api.delete(`/tarefas/${id}`)
      .catch((err) => {
        console.error('[ListaTarefas] Erro ao excluir tarefa:', getSafeErrorLog(err));
        setTarefas(anterior);
      });
  };

  const alternarNotas = (tarefa: Tarefa) => {
    if (tarefaExpandidaId === tarefa.id) {
      setTarefaExpandidaId(null);
      return;
    }
    setTarefaExpandidaId(tarefa.id);
    setNotaRascunho(tarefa.notas ?? '');
  };

  const salvarNota = (tarefa: Tarefa) => {
    if (salvandoNotaRef.current === tarefa.id) return;

    const nota = notaRascunho;
    if (nota === (tarefa.notas ?? '')) return;

    salvandoNotaRef.current = tarefa.id;
    setSalvandoNotaId(tarefa.id);
    api.patch(`/tarefas/${tarefa.id}`, { notas: nota })
      .then(() => {
        setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, notas: nota } : t)));
        showSuccess('Nota salva.');
      })
      .catch((err) => console.error('[ListaTarefas] Erro ao salvar nota:', getSafeErrorLog(err)))
      .finally(() => {
        salvandoNotaRef.current = null;
        setSalvandoNotaId(null);
      });
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-primary-light shadow-sm p-6 flex flex-col h-[400px]">
      <h2 className="text-xl font-bold text-text-primary mb-4 border-b border-primary-light pb-3">
        Minhas Tarefas
      </h2>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary">
            <Loader2 className="h-6 w-6 mb-2 animate-spin text-primary" />
            <p className="text-sm">Carregando tarefas...</p>
          </div>
        ) : tarefas.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary">
            <CheckCircle2 className="h-12 w-12 mb-2 opacity-20" />
            <p>Nenhuma tarefa pendente. Tudo limpo!</p>
          </div>
        ) : (
          tarefas.map((tarefa) => {
            const expandida = tarefaExpandidaId === tarefa.id;

            return (
              <div key={tarefa.id} className={`rounded-xl border transition-all ${tarefa.concluida ? 'bg-background border-primary-light opacity-60' : 'bg-white border-primary-light shadow-sm'}`}>
                <div className="flex items-center gap-3 p-3">
                  <button onClick={() => toggleTarefa(tarefa)} className="flex-shrink-0" aria-label="Alternar conclusão da tarefa">
                    {tarefa.concluida ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-text-secondary" />
                    )}
                  </button>

                  <button onClick={() => alternarNotas(tarefa)} className="flex-1 flex items-center justify-between gap-2 text-left">
                    <span className={`font-medium ${tarefa.concluida ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                      {tarefa.texto}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-text-secondary flex-shrink-0 transition-transform ${expandida ? 'rotate-180' : ''}`} />
                  </button>

                  <button onClick={() => deletarTarefa(tarefa.id)} className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" aria-label="Excluir tarefa">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {expandida && (
                  <div className="px-3 pb-3">
                    <textarea
                      autoFocus
                      value={notaRascunho}
                      onChange={(e) => setNotaRascunho(e.target.value)}
                      onBlur={() => salvarNota(tarefa)}
                      placeholder="Adicionar anotação..."
                      rows={2}
                      className="w-full text-sm bg-background border border-primary-light rounded-lg p-2 outline-none focus:border-primary focus:bg-white transition-colors resize-none"
                    />
                    <div className="flex justify-end mt-1">
                      <button
                        onClick={() => salvarNota(tarefa)}
                        disabled={salvandoNotaId === tarefa.id}
                        className="text-xs font-bold text-primary hover:text-primary-hover disabled:opacity-50 transition-colors"
                      >
                        {salvandoNotaId === tarefa.id ? 'Salvando...' : 'Salvar nota'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddTarefa} className="flex gap-2 pt-2 border-t border-primary-light">
        <input
          type="text"
          value={novaTarefa}
          onChange={(e) => setNovaTarefa(e.target.value)}
          placeholder="Adicionar nova tarefa..."
          disabled={adicionando}
          className="flex-1 bg-background border border-primary-light rounded-xl px-4 outline-none focus:border-primary focus:bg-white transition-colors disabled:opacity-60"
        />
        <button type="submit" disabled={!novaTarefa.trim() || adicionando} className="bg-primary hover:bg-primary-hover text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {adicionando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
