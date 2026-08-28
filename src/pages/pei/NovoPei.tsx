import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Info, Calendar, LayoutTemplate, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { getErrorMessage, getSafeErrorLog } from '../../services/apiError';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface PeiTemplateOpcao {
  id: string;
  nome: string;
  dificuldades: string;
  objetivos: string;
  estrategias: string;
}

const textareaClassName =
  'w-full bg-white border border-gray-200 rounded-lg py-3 px-4 outline-none transition-all duration-200 placeholder:text-gray-400 text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-300 min-h-[110px] resize-y';

export function NovoPei() {
  const { aprendenteId } = useParams<{ aprendenteId: string }>();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<PeiTemplateOpcao[]>([]);
  const [templateSelecionadoId, setTemplateSelecionadoId] = useState('');
  const [templateOrigemId, setTemplateOrigemId] = useState('');

  const [dificuldades, setDificuldades] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [estrategias, setEstrategias] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get<PeiTemplateOpcao[]>('/pei-templates')
      .then((res) => setTemplates(res.data))
      .catch((error) => console.error('[NovoPei] Erro ao buscar templates:', getSafeErrorLog(error)));
  }, []);

  const handleSelecionarTemplate = (id: string) => {
    setTemplateSelecionadoId(id);
    setTemplateOrigemId(id);

    const template = templates.find((t) => t.id === id);
    if (template) {
      setDificuldades(template.dificuldades);
      setObjetivos(template.objetivos);
      setEstrategias(template.estrategias);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!aprendenteId) {
      setErro('Aprendente não identificado. Volte e tente novamente.');
      return;
    }

    setLoading(true);

    api.post('/peis', {
      aprendenteId,
      dificuldades,
      objetivos,
      estrategias,
      dataInicio,
      dataFim: dataFim || null,
      templateOrigemId: templateOrigemId || undefined,
    })
      .then(() => {
        setSucesso('PEI cadastrado com sucesso! Redirecionando...');
        setTimeout(() => navigate(`/aprendentes/${aprendenteId}/pei`), 2000);
      })
      .catch((err) => {
        console.error('[NovoPei] Erro no cadastro:', getSafeErrorLog(err));
        setErro(getErrorMessage(err, 'Ocorreu um erro ao cadastrar o PEI. Verifique os dados.'));
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
          onClick={() => navigate(`/aprendentes/${aprendenteId}/pei`)}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Novo PEI
          </h1>
          <p className="text-gray-500 text-sm mt-1">Registre o Plano Educacional Individualizado do aprendente.</p>
        </div>
      </div>

      {/* Aviso informativo fixo */}
      <aside className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 leading-relaxed">
          O PEI é um esboço de idealização do suporte que o profissional cria para acompanhar o aprendente
          de acordo com suas dificuldades específicas — cada PEI é único e deve ser adaptado individualmente,
          mesmo partindo de um template.
        </p>
      </aside>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

        <div className="relative z-10 space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-gray-400" /> Partir de um template (opcional)
          </label>
          <select
            value={templateSelecionadoId}
            onChange={(e) => handleSelecionarTemplate(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all font-medium"
            disabled={loading || !!sucesso}
          >
            <option value="">Começar em branco...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.nome}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400">Os campos abaixo serão pré-preenchidos, mas continuam livremente editáveis.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 relative z-10">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Dificuldades</label>
            <textarea
              value={dificuldades}
              onChange={(e) => setDificuldades(e.target.value)}
              placeholder="Descreva as dificuldades específicas do aprendente..."
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
              placeholder="Descreva os objetivos do plano..."
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
              placeholder="Descreva as estratégias de suporte que serão adotadas..."
              className={textareaClassName}
              required
              disabled={loading || !!sucesso}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <Input
            label="Data de Início"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            icon={<Calendar className="h-5 w-5" />}
            required
            disabled={loading || !!sucesso}
          />

          <Input
            label="Data de Fim (opcional)"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            icon={<Calendar className="h-5 w-5" />}
            disabled={loading || !!sucesso}
          />
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
            <ClipboardList className="h-5 w-5 mr-2" /> Cadastrar PEI
          </Button>
        </div>
      </form>
    </div>
  );
}
