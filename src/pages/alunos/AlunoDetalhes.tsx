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
  AlertTriangle 
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';

// Tipagem rigorosa
interface AtendimentoHist {
  id: string;
  dataAtendimento: string;
  tituloSessao: string;
  observacoes: string | null;
}

interface AlunoPerfil {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  responsavel: string;
  contato: string;
  criadoEm: string;
  atendimentos: AtendimentoHist[];
}

export function AlunoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [aluno, setAluno] = useState<AlunoPerfil | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchAlunoDetalhes() {
      if (!id) return;
      
      try {
        setLoading(true);
        setError('');
        const response = await api.get<AlunoPerfil>(`/alunos/${id}`);
        setAluno(response.data);
      } catch (err) {
        console.error('Erro ao buscar detalhes do aluno:', err);
        setError('Não foi possível carregar o perfil deste paciente.');
      } finally {
        setLoading(false);
      }
    }

    fetchAlunoDetalhes();
  }, [id]);

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
        <p className="text-gray-500 font-medium">Carregando prontuário...</p>
      </div>
    );
  }

  if (error || !aluno) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center px-4">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h2>
        <p className="text-gray-600 mb-6 max-w-md">{error}</p>
        <Button onClick={() => navigate('/alunos')} className="w-auto px-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a Lista
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <button 
          onClick={() => navigate('/alunos')}
          className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{aluno.nomeCompleto}</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            Paciente ativo desde {new Date(aluno.criadoEm).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button onClick={() => navigate('/agenda/nova')} className="w-auto px-6 hidden sm:flex">
          <Calendar className="h-4 w-4 mr-2" /> Agendar Sessão
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Dados Cadastrais */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 border-gray-100">
              Dados Pessoais
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-primary rounded-lg mt-0.5">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Idade</p>
                  <p className="text-sm font-medium text-gray-900">
                    {calcularIdade(aluno.dataNascimento)} anos
                  </p>
                  <p className="text-xs text-gray-400">
                    Nascido em {new Date(aluno.dataNascimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mt-0.5">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Responsável</p>
                  <p className="text-sm font-medium text-gray-900">{aluno.responsavel}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg mt-0.5">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Contato</p>
                  <p className="text-sm font-medium text-gray-900">{aluno.contato}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Coluna Direita: Histórico de Sessões */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2 border-gray-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Histórico de Atendimentos
            </h3>

            {aluno.atendimentos.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-gray-100 rounded-xl">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">Nenhum atendimento registrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aluno.atendimentos.map((sessao) => (
                  <div key={sessao.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:bg-blue-50/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{sessao.tituloSessao}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
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
    </div>
  );
}