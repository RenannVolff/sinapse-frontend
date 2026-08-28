import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { getErrorMessage, getSafeErrorLog } from '../../services/apiError';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const textareaClassName =
  'w-full bg-white border border-gray-200 rounded-lg py-3 px-4 outline-none transition-all duration-200 placeholder:text-gray-400 text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-300 min-h-[110px] resize-y';

export function NovoPeiTemplate() {
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [dificuldades, setDificuldades] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [estrategias, setEstrategias] = useState('');

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    api.post('/pei-templates', {
      nome,
      dificuldades,
      objetivos,
      estrategias,
    })
      .then(() => {
        setSucesso('Template cadastrado com sucesso! Redirecionando...');
        setTimeout(() => navigate('/pei-templates'), 2000);
      })
      .catch((err) => {
        console.error('[NovoPeiTemplate] Erro no cadastro:', getSafeErrorLog(err));
        setErro(getErrorMessage(err, 'Ocorreu um erro ao cadastrar o template. Verifique os dados.'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">

      {/* Cabeçalho */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={() => navigate('/pei-templates')}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-blue-600" />
            Novo Template de PEI
          </h1>
          <p className="text-gray-500 text-sm mt-1">Crie um modelo reutilizável para agilizar a criação de novos PEIs.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

        <div className="relative z-10">
          <Input
            label="Nome do Template"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Suporte para Dificuldades de Leitura"
            required
            disabled={loading || !!sucesso}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 relative z-10">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Dificuldades</label>
            <textarea
              value={dificuldades}
              onChange={(e) => setDificuldades(e.target.value)}
              placeholder="Descreva as dificuldades típicas cobertas por este template..."
              className={textareaClassName}
              required
              disabled={loading || !!sucesso}
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Objetivos</label>
            <textarea
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
              placeholder="Descreva os objetivos padrão deste template..."
              className={textareaClassName}
              required
              disabled={loading || !!sucesso}
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Estratégias</label>
            <textarea
              value={estrategias}
              onChange={(e) => setEstrategias(e.target.value)}
              placeholder="Descreva as estratégias de suporte padrão deste template..."
              className={textareaClassName}
              required
              disabled={loading || !!sucesso}
            />
          </div>
        </div>

        {erro && (
          <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {erro}
          </div>
        )}

        {sucesso && (
          <div className="p-4 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> {sucesso}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Button type="submit" isLoading={loading} disabled={!!sucesso} className="w-full md:w-auto px-10 h-12 text-base">
            <LayoutTemplate className="h-5 w-5 mr-2" /> Cadastrar Template
          </Button>
        </div>
      </form>
    </div>
  );
}
