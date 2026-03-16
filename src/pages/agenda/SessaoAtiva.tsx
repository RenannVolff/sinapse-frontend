import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Save, 
  FileText, 
  BrainCircuit, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// --- Tipagens Rigorosas ---
interface ItemChecklist {
  id: string;
  nome: string; 
  realizado: boolean;
}

interface Atividade {
  id: string;
  titulo: string;
  nivelDificuldade: number;
  observacao?: string | null;
  itensChecklist: ItemChecklist[];
}

interface AtendimentoDetalhe {
  id: string;
  dataAtendimento: string;
  tituloSessao: string;
  observacoes?: string | null;
  aluno: {
    nomeCompleto: string;
  };
  atividades: Atividade[];
}

export function SessaoAtiva() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados principais
  const [atendimento, setAtendimento] = useState<AtendimentoDetalhe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDificuldade, setNovaDificuldade] = useState<number>(1);
  const [loadingAdd, setLoadingAdd] = useState(false);

  const carregarSessao = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<AtendimentoDetalhe>(`/atendimentos/${id}`);
      setAtendimento(response.data);
    } catch (err) {
      console.error('Erro ao buscar sessão:', err);
      setError('Não foi possível carregar os dados desta sessão. Verifique se ela existe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      carregarSessao();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddAtividade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    setLoadingAdd(true);
    try {
      await api.post('/atividades', {
        atendimentoId: id,
        titulo: novoTitulo,
        nivelDificuldade: novaDificuldade,
      });

      setNovoTitulo('');
      setNovaDificuldade(1);
      
      await carregarSessao();
    } catch (err) {
      console.error('Erro ao adicionar atividade:', err);
      alert('Erro ao criar a atividade. Tente novamente.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleToggleChecklist = async (atividadeId: string, itemId: string, statusAtual: boolean) => {
    try {

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

      await api.patch(`/atividades/checklist/${itemId}`, {
        realizado: !statusAtual
      });

    } catch (err) {
      console.error('Erro ao atualizar checklist:', err);

      await carregarSessao();
    }
  };

  // --- RENDERS DE ESTADO (Carregando e Erro) ---
  
  if (loading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 font-medium">Carregando dados da sessão...</p>
      </div>
    );
  }

  if (error || !atendimento) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center px-4">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h2>
        <p className="text-gray-600 mb-6 max-w-md">{error || 'Sessão não encontrada.'}</p>
        <Button onClick={() => navigate('/agenda')} className="w-auto px-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Agenda
        </Button>
      </div>
    );
  }

  // --- RENDER PRINCIPAL (Sessão Carregada) ---
  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">
      
      {/* 1. Cabeçalho da Sessão */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <button 
          onClick={() => navigate('/agenda')}
          className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors hidden md:block"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{atendimento.tituloSessao}</h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
              Sessão Ativa
            </span>
          </div>
          <p className="text-gray-500 flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-sm">
            <span>Paciente: <strong className="text-gray-700">{atendimento.aluno.nomeCompleto}</strong></span>
            <span className="hidden md:inline text-gray-300">•</span>
            <span>Data: {new Date(atendimento.dataAtendimento).toLocaleDateString('pt-BR')}</span>
          </p>
        </div>
        <Button onClick={() => navigate('/agenda')} variant="outline" className="w-full md:w-auto">
          <Save className="h-4 w-4 mr-2" /> Salvar e Fechar
        </Button>
      </div>

      {/* 2. Formulário para Adicionar Atividade */}
      <form onSubmit={handleAddAtividade} className="bg-blue-50/70 p-6 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4 items-end shadow-sm">
        <div className="flex-1 w-full">
          <Input 
            label="Novo Exercício / Atividade" 
            placeholder="Ex: Jogo da Memória Numérico"
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            icon={<BrainCircuit className="h-5 w-5" />}
            required
          />
        </div>
        <div className="w-full md:w-48">
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nível Dificuldade</label>
          <select 
            value={novaDificuldade}
            onChange={(e) => setNovaDificuldade(Number(e.target.value))}
            className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
          >
            <option value={1}>1 - Muito Fácil</option>
            <option value={2}>2 - Fácil</option>
            <option value={3}>3 - Moderado</option>
            <option value={4}>4 - Difícil</option>
            <option value={5}>5 - Muito Difícil</option>
          </select>
        </div>
        <Button type="submit" isLoading={loadingAdd} className="w-full md:w-auto h-[50px] px-8">
          <Plus className="h-5 w-5 mr-2" /> Adicionar
        </Button>
      </form>

      {/* 3. Lista de Atividades e Checklists */}
      <div className="space-y-4">
        {atendimento.atividades.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg text-gray-600 font-medium">Nenhuma atividade registrada ainda.</p>
            <p className="text-sm text-gray-400 mt-1">Crie a primeira atividade acima para gerar os checklists de tentativas.</p>
          </div>
        ) : (
          atendimento.atividades.map((atividade, index) => (
            <div key={atividade.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all duration-300">
              
              {/* Cabeçalho da Atividade */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                    <span className="bg-primary text-white h-7 w-7 rounded-full flex items-center justify-center text-sm shadow-sm">
                      {index + 1}
                    </span>
                    {atividade.titulo}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dificuldade</span>
                  <div className="flex items-center gap-1 mt-1 justify-end" title={`Nível ${atividade.nivelDificuldade} de 5`}>
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <div 
                        key={estrela} 
                        className={`h-2.5 w-6 rounded-full transition-colors ${estrela <= atividade.nivelDificuldade ? 'bg-orange-400 shadow-sm' : 'bg-gray-100'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Checklists (As 5 Caixas) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {atividade.itensChecklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleToggleChecklist(atividade.id, item.id, item.realizado)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 group relative overflow-hidden
                      ${item.realizado 
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-primary/50 hover:bg-blue-50'
                      }
                    `}
                  >
                    {item.realizado ? (
                      <CheckCircle2 className="h-8 w-8 mb-2 text-green-500 drop-shadow-sm" />
                    ) : (
                      <Circle className="h-8 w-8 mb-2 text-gray-300 group-hover:text-primary/40 transition-colors" />
                    )}
                    <span className="text-sm font-bold text-center leading-tight">
                      {item.nome}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}