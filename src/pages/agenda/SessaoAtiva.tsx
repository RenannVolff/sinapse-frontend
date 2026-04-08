import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, CheckCircle2, Circle, FileText, 
  BrainCircuit, Loader2, AlertTriangle, CheckCheck, Save, Star, Unlock, X
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';

interface ItemChecklist {
  id: string;
  nome: string; 
  realizado: boolean;
}

interface Atividade {
  id: string;
  titulo: string;
  nivelDificuldade: number;
  itensChecklist: ItemChecklist[];
}

interface AtendimentoDetalhe {
  id: string;
  dataAtendimento: string;
  tituloSessao: string;
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  observacoes: string | null;
  aluno: { nomeCompleto: string; };
  atividades: Atividade[];
}

export function SessaoAtiva() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados de Dados
  const [atendimento, setAtendimento] = useState<AtendimentoDetalhe | null>(null);
  const [observacoes, setObservacoes] = useState('');
  
  // Estados de Controle de Interface e Requisições
  const [loading, setLoading] = useState(true);
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDificuldade, setNovaDificuldade] = useState<number>(1);
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Estados para os Modais (Pop-ups)
  const [modalEncerrarOpen, setModalEncerrarOpen] = useState(false);
  const [modalReabrirOpen, setModalReabrirOpen] = useState(false);

  const carregarSessao = () => {
    if (!id) return;
    setLoading(true);
    api.get<AtendimentoDetalhe>(`/atendimentos/${id}`)
      .then((res) => {
        setAtendimento(res.data);
        setObservacoes(res.data.observacoes || '');
      })
      .catch(() => alert('Erro ao carregar os dados da sessão.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarSessao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Ação: Adicionar Nova Atividade
  const handleAddAtividade = (e: FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim() || !id) return;

    setLoadingAdd(true);
    api.post('/atividades', { 
      atendimentoId: id, 
      titulo: novoTitulo, 
      nivelDificuldade: novaDificuldade 
    })
      .then(() => {
        setNovoTitulo('');
        setNovaDificuldade(1);
        carregarSessao(); // Recarrega para mostrar a nova atividade
      })
      .catch(() => alert('Erro ao criar atividade.'))
      .finally(() => setLoadingAdd(false));
  };

  // Ação: Marcar/Desmarcar tentativa no checklist
  const handleToggleChecklist = (atividadeId: string, itemId: string, statusAtual: boolean) => {
    if (atendimento?.status === 'CONCLUIDO') return;

    setAtendimento((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        atividades: prev.atividades.map(ativ => {
          if (ativ.id !== atividadeId) return ativ;
          return {
            ...ativ,
            itensChecklist: ativ.itensChecklist.map(item => 
              item.id === itemId ? { ...item, realizado: !statusAtual } : item
            )
          };
        })
      };
    });

    api.patch(`/atividades/checklist/${itemId}`, { realizado: !statusAtual })
      .catch(() => carregarSessao()); // Se falhar no banco, volta ao estado anterior
  };

  // Ação: Salvar e Pausar (Mantém na agenda)
  const handlePausar = () => {
    if (!id) return;
    setLoadingAcao(true);
    api.patch(`/atendimentos/${id}`, { status: 'EM_ANDAMENTO', observacoes })
      .then(() => navigate('/agenda'))
      .catch(() => alert('Erro ao salvar progresso.'))
      .finally(() => setLoadingAcao(false));
  };

  // Ação: Confirmação do Modal de Encerrar
  const confirmarEncerramento = () => {
    if (!id) return;
    setLoadingAcao(true);
    
    api.patch(`/atendimentos/${id}`, { 
      status: 'CONCLUIDO', 
      concluido: true, 
      observacoes 
    })
      .then(() => {
        setModalEncerrarOpen(false);
        navigate('/agenda');
      })
      .catch(() => alert('Erro ao tentar encerrar a sessão.'))
      .finally(() => setLoadingAcao(false));
  };

  // Ação: Confirmação do Modal de Reabrir
  const confirmarReabertura = () => {
    if (!id) return;
    setLoadingAcao(true);

    api.patch(`/atendimentos/${id}`, { 
      status: 'EM_ANDAMENTO', 
      concluido: false 
    })
      .then(() => {
        setModalReabrirOpen(false);
        carregarSessao(); // Recarrega a tela para destravar os botões
      })
      .catch(() => alert('Erro ao tentar reabrir a sessão.'))
      .finally(() => setLoadingAcao(false));
  };

  if (loading) return (
    <div className="flex flex-col h-[60vh] items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="text-gray-500 font-medium">Carregando prontuário do aprendente...</p>
    </div>
  );

  if (!atendimento) return (
    <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-200">
      <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
      <p className="text-gray-500 font-bold">Sessão não encontrada.</p>
    </div>
  );

  const isFinalizada = atendimento.status === 'CONCLUIDO';

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-12 relative">
      
      {/* Cabeçalho de Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-4 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/agenda')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">{atendimento.tituloSessao}</h1>
            <p className="text-sm text-gray-500 font-medium">Aprendente: <span className="text-blue-600">{atendimento.aluno.nomeCompleto}</span></p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {!isFinalizada ? (
            <>
              <Button variant="outline" onClick={handlePausar} isLoading={loadingAcao} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <Save className="h-4 w-4 mr-2" /> Salvar e Pausar
              </Button>
              <Button onClick={() => setModalEncerrarOpen(true)} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20">
                <CheckCheck className="h-5 w-5 mr-2" /> Encerrar Sessão
              </Button>
            </>
          ) : (
            <>
              <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> SESSÃO CONCLUÍDA
              </div>
              <Button onClick={() => setModalReabrirOpen(true)} isLoading={loadingAcao} className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 text-white">
                <Unlock className="h-5 w-5 mr-2" /> Reabrir Sessão
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Formulário de Nova Atividade */}
      {!isFinalizada && (
        <form onSubmit={handleAddAtividade} className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 md:p-6 rounded-3xl shadow-xl shadow-blue-900/10 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-black text-blue-100 uppercase tracking-widest ml-1 mb-2 block">Nova Atividade para esta Sessão</label>
            <input 
              type="text" 
              value={novoTitulo} 
              onChange={(e) => setNovoTitulo(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 outline-none focus:bg-white focus:text-gray-900 transition-all text-white placeholder-white/50 font-medium"
              placeholder="Ex: Identificação de Fonemas, Puzzle Lógico..."
              required
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-xs font-black text-blue-100 uppercase tracking-widest ml-1 mb-2 block">Dificuldade</label>
            <select 
              value={novaDificuldade} 
              onChange={(e) => setNovaDificuldade(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 outline-none focus:bg-white focus:text-gray-900 transition-all text-white font-bold cursor-pointer"
            >
              <option value={1} className="text-gray-900">1 - Iniciante</option>
              <option value={2} className="text-gray-900">2 - Fácil</option>
              <option value={3} className="text-gray-900">3 - Médio</option>
              <option value={4} className="text-gray-900">4 - Desafiador</option>
              <option value={5} className="text-gray-900">5 - Avançado</option>
            </select>
          </div>
          <Button type="submit" isLoading={loadingAdd} className="w-full md:w-auto bg-white text-blue-600 hover:bg-blue-50 h-[50px] px-6 shadow-lg shadow-black/10">
            <Plus className="h-5 w-5 mr-2" /> Adicionar
          </Button>
        </form>
      )}

      {/* Listagem de Atividades */}
      <div className="space-y-6">
        {atendimento.atividades.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-16 text-center">
            <BrainCircuit className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-gray-400 font-bold text-lg">Nenhuma atividade registrada ainda.</h3>
            <p className="text-gray-300 text-sm">Adicione uma atividade acima para começar o registro.</p>
          </div>
        ) : (
          atendimento.atividades.map((atividade, idx) => (
            <div key={atividade.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <div className="flex items-center gap-4">
                  <span className="h-8 w-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/20">{idx + 1}</span>
                  <h3 className="text-lg font-bold text-gray-900">{atividade.titulo}</h3>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  <Star className="h-4 w-4 fill-indigo-600" />
                  <span className="text-xs font-black uppercase tracking-tight">Nível {atividade.nivelDificuldade}</span>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
                {atividade.itensChecklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isFinalizada}
                    onClick={() => handleToggleChecklist(atividade.id, item.id, item.realizado)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group relative ${
                      item.realizado 
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-inner' 
                      : 'border-gray-100 bg-white text-gray-400 hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                  >
                    {item.realizado ? (
                      <CheckCircle2 className="h-8 w-8 mb-2 text-green-600" />
                    ) : (
                      <Circle className="h-8 w-8 mb-2 text-gray-200 group-hover:text-blue-300 transition-colors" />
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest text-center leading-tight ${item.realizado ? 'text-green-700' : 'text-gray-400 group-hover:text-blue-600'}`}>
                      {item.nome}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Observações Finais */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600" /> Parecer Técnico / Observações
        </label>
        <textarea 
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          disabled={isFinalizada}
          placeholder={isFinalizada ? "Nenhuma observação registrada." : "Descreva aqui os detalhes do desempenho, comportamento e evolução observados nesta sessão..."}
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 outline-none focus:bg-white focus:border-blue-500 transition-all text-gray-700 leading-relaxed h-40 resize-none font-medium placeholder-gray-300 disabled:opacity-70 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>


      {/* ================= MODAIS (POP-UPS) ================= */}

      {/* Modal: Encerrar Sessão */}
      {modalEncerrarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCheck className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Encerrar Sessão?</h2>
              <p className="text-gray-500 mb-6">
                Ao encerrar, esta sessão será marcada como concluída, travada para edições e movida para o histórico do aprendente.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setModalEncerrarOpen(false)} className="flex-1 bg-gray-50">
                  Cancelar
                </Button>
                <Button onClick={confirmarEncerramento} isLoading={loadingAcao} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  Sim, Encerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reabrir Sessão */}
      {modalReabrirOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 text-center relative">
              <button onClick={() => setModalReabrirOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="mx-auto w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                <Unlock className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reabrir Sessão?</h2>
              <p className="text-gray-500 mb-6">
                Esta ação destravará a edição do checklist e das observações. A sessão voltará para a lista de pendências da sua agenda.
              </p>
              <div className="flex gap-3">
                <Button onClick={confirmarReabertura} isLoading={loadingAcao} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Sim, Reabrir e Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}