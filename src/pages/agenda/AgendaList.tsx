import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock,
  User, 
  ChevronRight, 
  Loader2 
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';


export interface Atendimento {
  id: string;
  dataAtendimento: string;
  tituloSessao: string;
  observacoes: string | null;
  aluno: {
    nomeCompleto: string;
  };
}

export function AgendaList() {
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchAgenda() {
      try {

        const dataAtual = new Date();
        const mes = dataAtual.getMonth() + 1; // getMonth é de 0 a 11
        const ano = dataAtual.getFullYear();

        const response = await api.get<Atendimento[]>(`/atendimentos/calendario?mes=${mes}&ano=${ano}`);
        

        const agendamentosOrdenados = response.data.sort((a, b) => 
          new Date(a.dataAtendimento).getTime() - new Date(b.dataAtendimento).getTime()
        );

        setAtendimentos(agendamentosOrdenados);
      } catch (error) {
        console.error('Erro ao buscar agenda:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAgenda();
  }, []);


  const formatarData = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  };

  const formatarHora = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Agenda de Sessões
          </h1>
          <p className="text-gray-500">Acompanhe seus próximos atendimentos deste mês.</p>
        </div>
        <Button onClick={() => navigate('/agenda/nova')} className="w-auto px-6">
          <Plus className="h-4 w-4 mr-2" />
          Agendar Sessão
        </Button>
      </div>

      {/* Lista de Atendimentos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : atendimentos.length === 0 ? (
          <div className="text-center p-12">
            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Sua agenda está livre</h3>
            <p className="text-gray-500 mt-1">Não há sessões programadas para este mês.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {atendimentos.map((sessao) => (
              <div key={sessao.id} className="p-5 hover:bg-blue-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                
                {/* Info Esquerda: Data e Hora */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  {/* --- O ÍCONE DE RELÓGIO FOI ADICIONADO AQUI --- */}
                  <div className="bg-primary/10 text-primary p-2.5 rounded-lg flex items-center justify-center gap-1.5 min-w-[85px]">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-bold">{formatarHora(sessao.dataAtendimento)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {formatarData(sessao.dataAtendimento)}
                    </p>
                  </div>
                </div>

                {/* Info Central: Aluno e Título */}
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    {sessao.tituloSessao}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{sessao.aluno.nomeCompleto}</span>
                  </div>
                </div>

                {/* Info Direita: Ação */}
                <div className="flex items-center">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-blue-200 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    Iniciar Atividade
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
