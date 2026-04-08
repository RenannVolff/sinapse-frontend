import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, User, Plus, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';

type StatusAtendimento = 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

interface Sessao {
  id: string;
  dataAtendimento: string;
  tituloSessao: string;
  status: StatusAtendimento;
  concluido: boolean;
  aluno: { nomeCompleto: string; };
}

export function AgendaList() {
  const navigate = useNavigate();
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataAtual = new Date();
    api.get<Sessao[]>(`/atendimentos/calendario?mes=${dataAtual.getMonth() + 1}&ano=${dataAtual.getFullYear()}`)
      .then((res) => {
        const pendentes = res.data.filter(s => s.status !== 'CONCLUIDO' && s.status !== 'CANCELADO');
        setSessoes(pendentes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" /> Agenda de Pendências
          </h1>
          <p className="text-gray-500 text-sm mt-1">Apenas as sessões não finalizadas aparecerão aqui.</p>
        </div>
        <Button onClick={() => navigate('/agenda/nova')} className="w-full md:w-auto h-12 px-6">
          <Plus className="h-5 w-5 mr-2" /> Agendar Sessão
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-400 font-medium">Carregando...</div>
        ) : sessoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-green-50 p-4 rounded-full mb-3"><CheckCircle2 className="h-10 w-10 text-green-500" /></div>
            <h3 className="text-xl font-bold text-gray-900">Nenhuma sessão pendente!</h3>
            <p className="text-gray-500 text-sm mt-1">Sua agenda está limpa. Bom trabalho!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sessoes.map((sessao) => {
              const dataObj = new Date(sessao.dataAtendimento);
              return (
                <div key={sessao.id} className="p-6 hover:bg-blue-50/40 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                  <div className="flex gap-4 items-center">
                    <div className="h-16 w-16 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-500 uppercase">{dataObj.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                      <span className="text-2xl font-black text-blue-700 leading-none">{dataObj.getDate()}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{sessao.tituloSessao}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> {dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md text-gray-700"><User className="h-4 w-4"/> {sessao.aluno.nomeCompleto}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate(`/agenda/${sessao.id}/sessao`)} className="w-full sm:w-auto">
                    {sessao.status === 'EM_ANDAMENTO' ? 'Continuar Sessão' : 'Iniciar Sessão'} <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}