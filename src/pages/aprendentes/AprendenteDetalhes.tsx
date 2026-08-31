import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Clock,
  FileText,
  Loader2,
  AlertTriangle,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// Tipagem rigorosa
interface AtendimentoHist {
  id: string;
  dataAtendimento: string;
  tituloSessao: string;
  observacoes: string | null;
}

interface AprendentePerfil {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  responsavel: string;
  contato: string;
  criadoEm: string;
  atendimentos: AtendimentoHist[];
}

export function AprendenteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const [aprendente, setAprendente] = useState<AprendentePerfil | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [modalExcluirOpen, setModalExcluirOpen] = useState<boolean>(false);
  const [excluindo, setExcluindo] = useState<boolean>(false);

  useEffect(() => {
    async function fetchAprendenteDetalhes() {
      if (!id) return;

      try {
        setLoading(true);
        setError('');
        const response = await api.get<AprendentePerfil>(`/aprendentes/${id}`);
        setAprendente(response.data);
      } catch (err) {
        console.error('[AprendenteDetalhes] Erro ao buscar detalhes:', getSafeErrorLog(err));
        setError('Não foi possível carregar o perfil deste paciente.');
      } finally {
        setLoading(false);
      }
    }

    fetchAprendenteDetalhes();
  }, [id]);

  const handleExcluirAprendente = () => {
    if (!id) return;

    setExcluindo(true);
    api.delete(`/aprendentes/${id}`)
      .then(() => {
        showSuccess('Aprendente excluído com sucesso.');
        navigate('/aprendentes');
      })
      .catch((err) => console.error('[AprendenteDetalhes] Erro ao excluir aprendente:', getSafeErrorLog(err)))
      .finally(() => setExcluindo(false));
  };

  // Função para calcular a idade
  const calcularIdade = (dataIso: string) => {
    const nascimento = new Date(dataIso);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-text-secondary font-medium">Carregando prontuário...</p>
      </div>
    );
  }

  if (error || !aprendente) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center px-4">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Ops! Algo deu errado.</h2>
        <p className="text-text-secondary mb-6 max-w-md">{error}</p>
        <Button onClick={() => navigate('/aprendentes')} className="w-auto px-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a Lista
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-xl border border-primary-light shadow-sm">
        <button
          onClick={() => navigate('/aprendentes')}
          className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">{aprendente.nomeCompleto}</h1>
          <p className="text-text-secondary text-sm mt-1 flex items-center gap-2">
            Paciente ativo desde {new Date(aprendente.criadoEm).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <button
          onClick={() => setModalExcluirOpen(true)}
          className="p-2.5 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Excluir aprendente"
          aria-label="Excluir aprendente"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <Button onClick={() => navigate(`/aprendentes/${id}/pei`)} variant="outline" className="w-auto px-6 hidden sm:flex">
          <ClipboardList className="h-4 w-4 mr-2" /> Ver PEIs
        </Button>
        <Button onClick={() => navigate('/agenda/nova')} className="w-auto px-6 hidden sm:flex">
          <Calendar className="h-4 w-4 mr-2" /> Agendar Sessão
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Dados Cadastrais */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-primary-light shadow-sm">
            <h3 className="text-lg font-bold text-text-primary mb-4 border-b pb-2 border-primary-light">
              Dados Pessoais
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="p-2 bg-primary-light text-primary rounded-lg mt-0.5">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase">Idade</p>
                  <p className="text-sm font-medium text-text-primary">
                    {calcularIdade(aprendente.dataNascimento)} anos
                  </p>
                  <p className="text-xs text-text-secondary">
                    Nascido em {new Date(aprendente.dataNascimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mt-0.5">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase">Responsável</p>
                  <p className="text-sm font-medium text-text-primary">{aprendente.responsavel}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg mt-0.5">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase">Contato</p>
                  <p className="text-sm font-medium text-text-primary">{aprendente.contato}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Coluna Direita: Histórico de Sessões */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-primary-light shadow-sm h-full">
            <h3 className="text-lg font-bold text-text-primary mb-6 border-b pb-2 border-primary-light flex items-center gap-2">
              <Clock className="h-5 w-5 text-text-secondary" />
              Histórico de Atendimentos
            </h3>

            {aprendente.atendimentos.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-primary-light rounded-xl">
                <FileText className="h-10 w-10 text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary text-sm font-medium">Nenhum atendimento registrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aprendente.atendimentos.map((sessao) => (
                  <div key={sessao.id} className="p-4 bg-background rounded-lg border border-primary-light flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:bg-primary-light/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-text-primary text-sm mb-1">{sessao.tituloSessao}</h4>
                      <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(sessao.dataAtendimento).toLocaleDateString('pt-BR')} às {new Date(sessao.dataAtendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/agenda/${sessao.id}/sessao`)}
                      className="text-xs py-2 px-3 h-auto"
                    >
                      Ver Sessão
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={modalExcluirOpen}
        title="Excluir aprendente?"
        description={`Esta ação removerá "${aprendente.nomeCompleto}" da sua lista de aprendentes ativos, junto de seu histórico de atendimentos. Esta ação não pode ser desfeita pela interface.`}
        confirmLabel="Sim, Excluir"
        loading={excluindo}
        onConfirm={handleExcluirAprendente}
        onCancel={() => setModalExcluirOpen(false)}
      />
    </div>
  );
}