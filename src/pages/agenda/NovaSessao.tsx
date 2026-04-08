import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface AlunoOpcao {
  id: string;
  nomeCompleto: string;
}

export function NovaSessao() {
  const navigate = useNavigate();
  const [aprendentes, setAprendentes] = useState<AlunoOpcao[]>([]);
  
  const [alunoId, setAlunoId] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [titulo, setTitulo] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get<AlunoOpcao[]>('/alunos')
      .then((res) => setAprendentes(res.data))
      .catch(() => setErro('Erro ao carregar lista de aprendentes.'));
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!alunoId || !data || !hora || !titulo) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setErro('');

    const dataAtendimento = new Date(`${data}T${hora}`).toISOString();

    api.post('/atendimentos', {
      alunoId,
      dataAtendimento,
      tituloSessao: titulo,
    })
      .then(() => {
        navigate('/agenda');
      })
      .catch((err: unknown) => {
        console.error('Erro ao agendar:', err);
        if (isAxiosError(err) && err.response?.data?.message) {
          const msg = err.response.data.message;
          setErro(Array.isArray(msg) ? msg[0] : msg);
        } else {
          setErro('Erro interno ao agendar a sessão. Tente novamente.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in pb-12">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => navigate('/agenda')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendar Nova Sessão</h1>
          <p className="text-sm text-gray-500 mt-1">Defina o aprendente e o horário do atendimento.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" /> Aprendente
          </label>
          <select 
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all font-medium"
            required
            disabled={loading}
          >
            <option value="" disabled>Selecione o aprendente...</option>
            {aprendentes.map(aprendente => (
              <option key={aprendente.id} value={aprendente.id}>{aprendente.nomeCompleto}</option>
            ))}
          </select>
        </div>

        <Input 
          label="Foco Principal (Título)" 
          icon={<Clock className="h-5 w-5"/>} 
          value={titulo} 
          onChange={(e) => setTitulo(e.target.value)} 
          placeholder="Ex: Avaliação Inicial, Jogos Cognitivos..." 
          required 
          disabled={loading} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Data da Sessão" 
            type="date" 
            icon={<Calendar className="h-5 w-5"/>} 
            value={data} 
            onChange={(e) => setData(e.target.value)} 
            required 
            disabled={loading} 
          />
          <Input 
            label="Horário" 
            type="time" 
            icon={<Clock className="h-5 w-5"/>} 
            value={hora} 
            onChange={(e) => setHora(e.target.value)} 
            required 
            disabled={loading} 
          />
        </div>

        {erro && (
          <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {erro}
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <Button type="submit" isLoading={loading} className="w-full md:w-auto px-10 h-12">
            Confirmar Agendamento
          </Button>
        </div>
      </form>
    </div>
  );
}