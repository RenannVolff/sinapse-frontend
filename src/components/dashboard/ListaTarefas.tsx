import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, ChevronDown, Circle, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { getFieldErrors, getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TextArea } from '../ui/Input';
import { dispararAtualizacaoNotificacoes } from '../../utils/notificacoesBus';
import { LIMITES } from '../../constants/limits';
import { validarTexto } from '../../utils/validacao';

interface Tarefa {
  id: string;
  texto: string;
  concluida: boolean;
  notas: string | null;
  criadoEm?: string;
}

interface PaginaTarefas {
  itens: Tarefa[];
  total: number;
  pagina: number;
  porPagina: number;
}

// Teto do back para `porPagina`.
const MAX_POR_PAGINA = 100;

type Filtro = 'pendentes' | 'concluidas' | 'todas';

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'pendentes', rotulo: 'Pendentes' },
  { valor: 'concluidas', rotulo: 'Concluídas' },
  { valor: 'todas', rotulo: 'Todas' },
];

// Mesma ordem do back: pendentes primeiro, depois as mais recentes. Refeita
// no cliente para a tarefa marcada/desmarcada mudar de lugar na hora.
function ordenarTarefas(tarefas: Tarefa[]): Tarefa[] {
  return [...tarefas].sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    return (b.criadoEm ?? '').localeCompare(a.criadoEm ?? '');
  });
}

export function ListaTarefas() {
  const { showSuccess } = useToast();

  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [total, setTotal] = useState(0);
  const [limite, setLimite] = useState<number>(LIMITES.POR_PAGINA_TAREFAS);
  const [loading, setLoading] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroLista, setErroLista] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('pendentes');

  const [novaTarefa, setNovaTarefa] = useState('');
  const [erroNovaTarefa, setErroNovaTarefa] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [tarefaExpandidaId, setTarefaExpandidaId] = useState<string | null>(null);
  const [notaRascunho, setNotaRascunho] = useState('');
  const [erroNota, setErroNota] = useState('');
  const [salvandoNotaId, setSalvandoNotaId] = useState<string | null>(null);
  const salvandoNotaRef = useRef<string | null>(null);
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState<Tarefa | null>(null);

  // Busca as `quantidade` primeiras tarefas na ordem do back e substitui a
  // lista. "Carregar mais" aumenta a quantidade em vez de pedir a página
  // seguinte: depois de concluir/excluir uma tarefa aqui, os deslocamentos
  // das páginas mudam no back e a página seguinte pularia ou repetiria itens.
  // Os indicadores de carregamento são ligados por quem chama (o estado
  // inicial já começa carregando).
  const carregar = useCallback((quantidade: number) => {
    const porPagina = Math.min(MAX_POR_PAGINA, quantidade);
    const paginas = Math.ceil(quantidade / porPagina);
    Promise.all(
      Array.from({ length: paginas }, (_, i) =>
        api.get<PaginaTarefas>('/tarefas', { params: { pagina: i + 1, porPagina } }),
      ),
    )
      .then((respostas) => {
        const itens = respostas.flatMap(({ data }) => data.itens).slice(0, quantidade);
        setTotal(respostas[respostas.length - 1].data.total);
        setLimite(quantidade);
        setTarefas(ordenarTarefas(itens));
        setErroLista('');
      })
      .catch((err) => {
        console.error('[ListaTarefas] Erro ao buscar tarefas:', getSafeErrorLog(err));
        setErroLista('Não foi possível carregar as tarefas.');
      })
      .finally(() => {
        setLoading(false);
        setCarregandoMais(false);
      });
  }, []);

  useEffect(() => {
    carregar(LIMITES.POR_PAGINA_TAREFAS);
  }, [carregar]);

  const recarregar = () => {
    setLoading(true);
    setErroLista('');
    carregar(limite);
  };

  const carregarMais = () => {
    setCarregandoMais(true);
    carregar(limite + LIMITES.POR_PAGINA_TAREFAS);
  };

  const pendentes = tarefas.filter((t) => !t.concluida).length;
  const concluidas = tarefas.length - pendentes;
  const haMais = tarefas.length < total;

  const tarefasVisiveis = useMemo(() => {
    if (filtro === 'pendentes') return tarefas.filter((t) => !t.concluida);
    if (filtro === 'concluidas') return tarefas.filter((t) => t.concluida);
    return tarefas;
  }, [tarefas, filtro]);

  const handleAddTarefa = (e: FormEvent) => {
    e.preventDefault();
    const texto = novaTarefa.trim();
    const erro = validarTexto('Tarefa', texto, LIMITES.TITULO);
    if (erro) {
      setErroNovaTarefa(erro);
      return;
    }

    setAdicionando(true);
    api.post<Tarefa>('/tarefas', { texto })
      .then((res) => {
        setTarefas((prev) => ordenarTarefas([res.data, ...prev]));
        setTotal((prev) => prev + 1);
        setNovaTarefa('');
        setErroNovaTarefa('');
        if (filtro === 'concluidas') setFiltro('pendentes');
        dispararAtualizacaoNotificacoes();
      })
      .catch((err) => {
        console.error('[ListaTarefas] Erro ao adicionar tarefa:', getSafeErrorLog(err));
        const erros = getFieldErrors(err);
        if (erros?.texto) setErroNovaTarefa(erros.texto);
      })
      .finally(() => setAdicionando(false));
  };

  const toggleTarefa = (tarefa: Tarefa) => {
    const concluida = !tarefa.concluida;
    setTarefas((prev) => ordenarTarefas(prev.map((t) => (t.id === tarefa.id ? { ...t, concluida } : t))));

    api.patch(`/tarefas/${tarefa.id}`, { concluida })
      .then(() => dispararAtualizacaoNotificacoes())
      .catch((err) => {
        console.error('[ListaTarefas] Erro ao atualizar tarefa:', getSafeErrorLog(err));
        setTarefas((prev) =>
          ordenarTarefas(prev.map((t) => (t.id === tarefa.id ? { ...t, concluida: tarefa.concluida } : t))),
        );
      });
  };

  const deletarTarefa = () => {
    if (!tarefaParaExcluir) return;
    const { id } = tarefaParaExcluir;
    setTarefaParaExcluir(null);

    const anterior = tarefas;
    setTarefas((prev) => prev.filter((t) => t.id !== id));
    setTotal((prev) => prev - 1);
    if (tarefaExpandidaId === id) setTarefaExpandidaId(null);

    api.delete(`/tarefas/${id}`)
      .then(() => dispararAtualizacaoNotificacoes())
      .catch((err) => {
        console.error('[ListaTarefas] Erro ao excluir tarefa:', getSafeErrorLog(err));
        setTarefas(anterior);
        setTotal((prev) => prev + 1);
      });
  };

  const alternarDetalhe = (tarefa: Tarefa) => {
    if (tarefaExpandidaId === tarefa.id) {
      setTarefaExpandidaId(null);
      return;
    }
    setTarefaExpandidaId(tarefa.id);
    setNotaRascunho(tarefa.notas ?? '');
    setErroNota('');
  };

  const salvarNota = (tarefa: Tarefa) => {
    if (salvandoNotaRef.current === tarefa.id) return;

    const nota = notaRascunho;
    if (nota === (tarefa.notas ?? '')) return;
    if (nota.length > LIMITES.TEXTO_MEDIO) {
      setErroNota(`Notas: máximo de ${LIMITES.TEXTO_MEDIO} caracteres.`);
      return;
    }

    salvandoNotaRef.current = tarefa.id;
    setSalvandoNotaId(tarefa.id);
    api.patch(`/tarefas/${tarefa.id}`, { notas: nota })
      .then(() => {
        setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? { ...t, notas: nota } : t)));
        setErroNota('');
        showSuccess('Nota salva.');
        dispararAtualizacaoNotificacoes();
      })
      .catch((err) => {
        console.error('[ListaTarefas] Erro ao salvar nota:', getSafeErrorLog(err));
        const erros = getFieldErrors(err);
        if (erros?.notas) setErroNota(erros.notas);
      })
      .finally(() => {
        salvandoNotaRef.current = null;
        setSalvandoNotaId(null);
      });
  };

  const contagem: Record<Filtro, number> = { pendentes, concluidas, todas: tarefas.length };

  return (
    <section
      aria-labelledby="lista-tarefas-titulo"
      className="lg:col-span-2 bg-white rounded-2xl border border-primary-light shadow-sm p-4 sm:p-6 flex flex-col min-w-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4 border-b border-primary-light pb-3">
        <h2 id="lista-tarefas-titulo" className="text-xl font-bold text-text-primary">
          Minhas Tarefas
        </h2>
        {!loading && total > 0 && (
          <span className="text-xs font-semibold text-text-secondary">
            {tarefas.length < total ? `Mostrando ${tarefas.length} de ${total}` : `${total} no total`}
          </span>
        )}
      </div>

      <div role="group" aria-label="Filtrar tarefas" className="flex flex-wrap gap-2 mb-3">
        {FILTROS.map(({ valor, rotulo }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltro(valor)}
            aria-pressed={filtro === valor}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              filtro === valor
                ? 'bg-primary border-primary text-white'
                : 'border-primary-light text-text-secondary hover:text-primary hover:border-primary/40'
            }`}
          >
            {rotulo} ({contagem[valor]})
          </button>
        ))}
      </div>

      {/* Altura acompanha o conteúdo; acima de ~10 itens a lista rola (em rem,
          cresce junto com a escala de fonte). */}
      <div className="max-h-[30rem] overflow-y-auto pr-1 space-y-2 mb-4">
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-text-secondary">
            <Loader2 className="h-6 w-6 mb-2 animate-spin text-primary" />
            <p className="text-sm">Carregando tarefas...</p>
          </div>
        ) : erroLista ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-center text-text-secondary">
            <p className="text-sm">{erroLista}</p>
            <button type="button" onClick={recarregar} className="text-sm font-bold text-primary hover:text-primary-hover">
              Tentar novamente
            </button>
          </div>
        ) : tarefasVisiveis.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center text-text-secondary">
            <CheckCircle2 className="h-12 w-12 mb-2 opacity-20" />
            <p>
              {filtro === 'concluidas'
                ? 'Nenhuma tarefa concluída por aqui.'
                : filtro === 'pendentes'
                  ? 'Nenhuma tarefa pendente. Tudo limpo!'
                  : 'Nenhuma tarefa cadastrada.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tarefasVisiveis.map((tarefa) => {
              const expandida = tarefaExpandidaId === tarefa.id;
              const detalheId = `tarefa-detalhe-${tarefa.id}`;

              return (
                <li
                  key={tarefa.id}
                  className={`rounded-xl border transition-all ${tarefa.concluida ? 'bg-background border-primary-light' : 'bg-white border-primary-light shadow-sm'}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3">
                    <button
                      type="button"
                      onClick={() => toggleTarefa(tarefa)}
                      className="flex-shrink-0 p-1"
                      aria-label={tarefa.concluida ? `Marcar "${tarefa.texto}" como pendente` : `Concluir "${tarefa.texto}"`}
                    >
                      {tarefa.concluida ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-text-secondary" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => alternarDetalhe(tarefa)}
                      aria-expanded={expandida}
                      aria-controls={detalheId}
                      className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left"
                    >
                      <span
                        title={tarefa.texto}
                        className={`min-w-0 font-medium ${expandida ? 'break-words' : 'truncate'} ${tarefa.concluida ? 'text-text-secondary line-through' : 'text-text-primary'}`}
                      >
                        {tarefa.texto}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-text-secondary flex-shrink-0 transition-transform ${expandida ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTarefaParaExcluir(tarefa)}
                      className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      aria-label={`Excluir tarefa "${tarefa.texto}"`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {!expandida && tarefa.notas?.trim() && (
                    <p className="px-3 pb-2 -mt-1 ml-9 sm:ml-11 text-xs text-text-secondary truncate" title={tarefa.notas}>
                      {tarefa.notas}
                    </p>
                  )}

                  {expandida && (
                    <div id={detalheId} className="px-3 pb-3">
                      <TextArea
                        label={`Anotação da tarefa ${tarefa.texto}`}
                        hideLabel
                        autoFocus
                        name="notas"
                        value={notaRascunho}
                        onChange={(e) => {
                          setNotaRascunho(e.target.value);
                          setErroNota('');
                        }}
                        onBlur={() => salvarNota(tarefa)}
                        placeholder="Adicionar anotação..."
                        maxLength={LIMITES.TEXTO_MEDIO}
                        error={erroNota}
                        rows={3}
                        className="text-base md:text-sm bg-background focus:bg-white min-h-[5rem]"
                      />
                      <div className="flex justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => salvarNota(tarefa)}
                          disabled={salvandoNotaId === tarefa.id}
                          className="text-xs font-bold text-primary hover:text-primary-hover disabled:opacity-50 transition-colors"
                        >
                          {salvandoNotaId === tarefa.id ? 'Salvando...' : 'Salvar nota'}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!loading && haMais && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={carregarMais}
              disabled={carregandoMais}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-primary border border-primary-light hover:bg-primary-light disabled:opacity-60"
            >
              {carregandoMais && <Loader2 className="h-4 w-4 animate-spin" />}
              Carregar mais ({total - tarefas.length} restantes)
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleAddTarefa} noValidate className="pt-3 border-t border-primary-light">
        <div className="flex gap-2">
          <label htmlFor="nova-tarefa" className="sr-only">Nova tarefa</label>
          <input
            id="nova-tarefa"
            name="texto"
            type="text"
            value={novaTarefa}
            onChange={(e) => {
              setNovaTarefa(e.target.value);
              setErroNovaTarefa('');
            }}
            maxLength={LIMITES.TITULO}
            placeholder="Adicionar nova tarefa..."
            aria-invalid={erroNovaTarefa ? true : undefined}
            aria-describedby={erroNovaTarefa ? 'nova-tarefa-erro nova-tarefa-contador' : 'nova-tarefa-contador'}
            disabled={adicionando}
            className={`flex-1 min-w-0 bg-background border rounded-xl px-4 py-3 outline-none focus:bg-white transition-colors disabled:opacity-60 ${
              erroNovaTarefa ? 'border-red-500 border-2' : 'border-primary-light focus:border-primary'
            }`}
          />
          <button type="submit" disabled={!novaTarefa.trim() || adicionando} aria-label="Adicionar tarefa" className="bg-primary hover:bg-primary-hover text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
            {adicionando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex items-start justify-between gap-3 mt-1 min-w-0">
          <span id="nova-tarefa-erro" className="text-xs text-red-600 font-medium min-w-0 break-words">
            {erroNovaTarefa}
          </span>
          <span id="nova-tarefa-contador" className="text-xs text-text-secondary tabular-nums flex-shrink-0">
            {novaTarefa.length}/{LIMITES.TITULO}
            <span className="sr-only"> caracteres</span>
          </span>
        </div>
      </form>

      <ConfirmDialog
        open={!!tarefaParaExcluir}
        title="Excluir tarefa?"
        description={
          tarefaParaExcluir?.notas?.trim()
            ? `A tarefa "${tarefaParaExcluir.texto}" e sua anotação serão removidas. Esta ação não pode ser desfeita.`
            : `A tarefa "${tarefaParaExcluir?.texto}" será removida. Esta ação não pode ser desfeita.`
        }
        confirmLabel="Sim, Excluir"
        onConfirm={deletarTarefa}
        onCancel={() => setTarefaParaExcluir(null)}
      />
    </section>
  );
}
