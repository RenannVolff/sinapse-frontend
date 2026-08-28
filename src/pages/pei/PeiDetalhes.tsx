import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  Loader2,
  AlertTriangle,
  Pencil,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { getErrorMessage, getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Pei {
  id: string;
  aprendenteId: string;
  dificuldades: string;
  objetivos: string;
  estrategias: string;
  dataInicio: string;
  dataFim: string | null;
  criadoEm: string;
}

const textareaClassName =
  'w-full bg-white border border-gray-200 rounded-lg py-3 px-4 outline-none transition-all duration-200 placeholder:text-gray-400 text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-300 min-h-[110px] resize-y disabled:bg-gray-50 disabled:text-gray-600';

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function PeiDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const [pei, setPei] = useState<Pei | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');

  const [dificuldades, setDificuldades] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [estrategias, setEstrategias] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    async function fetchPei() {
      if (!id) return;

      try {
        setLoading(true);
        setError('');
        const response = await api.get<Pei>(`/peis/${id}`);
        setPei(response.data);
        setDificuldades(response.data.dificuldades);
        setObjetivos(response.data.objetivos);
        setEstrategias(response.data.estrategias);
        setDataInicio(toDateInputValue(response.data.dataInicio));
        setDataFim(toDateInputValue(response.data.dataFim));
      } catch (err) {
        console.error('[PeiDetalhes] Erro ao buscar PEI:', getSafeErrorLog(err));
        setError('Não foi possível carregar este PEI.');
      } finally {
        setLoading(false);
      }
    }

    fetchPei();
  }, [id]);

  const handleCancelarEdicao = () => {
    if (!pei) return;
    setDificuldades(pei.dificuldades);
    setObjetivos(pei.objetivos);
    setEstrategias(pei.estrategias);
    setDataInicio(toDateInputValue(pei.dataInicio));
    setDataFim(toDateInputValue(pei.dataFim));
    setErroSalvar('');
    setEditando(false);
  };

  const handleSalvar = (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setErroSalvar('');
    setSalvando(true);

    api.patch<Pei>(`/peis/${id}`, {
      dificuldades,
      objetivos,
      estrategias,
      dataInicio,
      dataFim: dataFim || null,
    })
      .then((response) => {
        setPei(response.data);
        setEditando(false);
        showSuccess('PEI atualizado com sucesso.');
      })
      .catch((err) => {
        console.error('[PeiDetalhes] Erro ao salvar PEI:', getSafeErrorLog(err));
        setErroSalvar(getErrorMessage(err, 'Ocorreu um erro ao salvar as alterações.'));
      })
      .finally(() => setSalvando(false));
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 font-medium">Carregando PEI...</p>
      </div>
    );
  }

  if (error || !pei) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center px-4">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h2>
        <p className="text-gray-600 mb-6 max-w-md">{error}</p>
        <Button onClick={() => navigate('/aprendentes')} className="w-auto px-8">
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
          onClick={() => navigate(`/aprendentes/${pei.aprendenteId}/pei`)}
          className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Plano Educacional Individualizado
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Criado em {new Date(pei.criadoEm).toLocaleDateString('pt-BR')}
          </p>
        </div>
        {!editando && (
          <Button onClick={() => setEditando(true)} variant="outline" className="w-auto px-6 hidden sm:flex">
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </Button>
        )}
      </div>

      <form onSubmit={handleSalvar} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Dificuldades</label>
            <textarea
              value={dificuldades}
              onChange={(e) => setDificuldades(e.target.value)}
              className={textareaClassName}
              required
              disabled={!editando || salvando}
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Objetivos</label>
            <textarea
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
              className={textareaClassName}
              required
              disabled={!editando || salvando}
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Estratégias</label>
            <textarea
              value={estrategias}
              onChange={(e) => setEstrategias(e.target.value)}
              className={textareaClassName}
              required
              disabled={!editando || salvando}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Data de Início"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            icon={<Calendar className="h-5 w-5" />}
            required
            disabled={!editando || salvando}
          />

          <Input
            label="Data de Fim (opcional)"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            icon={<Calendar className="h-5 w-5" />}
            disabled={!editando || salvando}
          />
        </div>

        {erroSalvar && (
          <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {erroSalvar}
          </div>
        )}

        {editando && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelarEdicao}
              disabled={salvando}
              className="w-full sm:w-auto px-8 h-12"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={salvando} className="w-full sm:w-auto px-10 h-12 text-base">
              <CheckCircle2 className="h-5 w-5 mr-2" /> Salvar Alterações
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
