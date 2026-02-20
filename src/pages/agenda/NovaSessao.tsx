import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// Tipagem simplificada só para preencher o select
interface AlunoOpcao {
  id: string;
  nomeCompleto: string;
}

export function NovaSessao() {
  const navigate = useNavigate();
  
  const [alunos, setAlunos] = useState<AlunoOpcao[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  // Estados separados para Data e Hora (mais fácil pro usuário preencher)
  const [alunoId, setAlunoId] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [tituloSessao, setTituloSessao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Busca a lista de alunos ao abrir a tela
  useEffect(() => {
    async function carregarAlunos() {
      try {
        const response = await api.get<AlunoOpcao[]>('/alunos');
        setAlunos(response.data);
      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
        setError('Não foi possível carregar a lista de pacientes.');
      } finally {
        setLoadingDados(false);
      }
    }
    carregarAlunos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError('');

    if (!alunoId) {
      setError('Por favor, selecione um aluno.');
      setLoadingSubmit(false);
      return;
    }

    try {
      // Junta a data e a hora no formato ISO 8601 (Ex: 2026-05-20T14:30:00Z)
      // O 'T' separa a data da hora, e o ':00Z' garante os segundos
      const dataHoraCompleta = new Date(`${data}T${hora}:00`).toISOString();

      await api.post('/atendimentos', {
        alunoId,
        dataAtendimento: dataHoraCompleta,
        tituloSessao,
        observacoes,
      });

      navigate('/agenda');
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data) {
        const msg = err.response.data.message;
        setError(Array.isArray(msg) ? msg.join(' | ') : msg);
      } else {
        setError('Erro ao agendar a sessão.');
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={() => navigate('/agenda')}
          className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendar Nova Sessão</h1>
          <p className="text-gray-500">Marque um atendimento para seus pacientes.</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Campo de Seleção Customizado (Estilizado igual ao nosso Input) */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Selecione o Paciente</label>
            <select
              value={alunoId}
              onChange={(e) => setAlunoId(e.target.value)}
              disabled={loadingDados}
              className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 text-gray-900"
              required
            >
              <option value="" disabled>
                {loadingDados ? 'Carregando pacientes...' : 'Clique para escolher um paciente'}
              </option>
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nomeCompleto}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Título / Foco da Sessão"
            value={tituloSessao}
            onChange={(e) => setTituloSessao(e.target.value)}
            icon={<FileText className="h-5 w-5" />}
            placeholder="Ex: Avaliação de Leitura e Escrita"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Data da Sessão"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              icon={<Calendar className="h-5 w-5" />}
              required
            />

            <Input
              label="Horário"
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              icon={<Clock className="h-5 w-5" />}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Observações Prévias (Opcional)</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Ex: Levar o material de blocos lógicos..."
              className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 text-gray-900 resize-none"
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/agenda')}
              className="w-auto px-6"
              disabled={loadingSubmit}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              isLoading={loadingSubmit}
              className="w-auto px-6"
            >
              <Save className="h-4 w-4 mr-2" />
              Confirmar Agendamento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
