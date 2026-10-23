import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Info, LayoutTemplate, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { useFormErrors } from '../../hooks/useFormErrors';
import { Button } from '../../components/ui/Button';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { PeiCampos } from './PeiCampos';
import { CAMPOS_PEI, validarPei, type ValoresPei } from './peiValidacao';

interface PeiTemplateOpcao {
  id: string;
  nome: string;
  dificuldades: string;
  objetivos: string;
  estrategias: string;
}

export function NovoPei() {
  const { aprendenteId } = useParams<{ aprendenteId: string }>();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<PeiTemplateOpcao[]>([]);
  const [templateSelecionadoId, setTemplateSelecionadoId] = useState('');
  const [templateOrigemId, setTemplateOrigemId] = useState('');

  const [valores, setValores] = useState<ValoresPei>({
    dificuldades: '',
    objetivos: '',
    estrategias: '',
    dataInicio: '',
    dataFim: '',
  });
  const { errors, formRef, showErrors, applyApiError, clearError } = useFormErrors();

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');

  const alterarCampo = (campo: keyof ValoresPei, valor: string) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    clearError(campo);
  };

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
      setValores((prev) => ({
        ...prev,
        dificuldades: template.dificuldades,
        objetivos: template.objetivos,
        estrategias: template.estrategias,
      }));
      clearError('dificuldades');
      clearError('objetivos');
      clearError('estrategias');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSucesso('');

    if (!aprendenteId) {
      showErrors({ aprendenteId: 'Aprendente não identificado. Volte e tente novamente.' });
      return;
    }
    if (showErrors(validarPei(valores))) return;

    setLoading(true);

    api.post('/peis', {
      aprendenteId,
      dificuldades: valores.dificuldades.trim(),
      objetivos: valores.objetivos.trim(),
      estrategias: valores.estrategias.trim(),
      dataInicio: valores.dataInicio,
      dataFim: valores.dataFim || null,
      templateOrigemId: templateOrigemId || undefined,
    })
      .then(() => {
        setSucesso('PEI cadastrado com sucesso! Redirecionando...');
        setTimeout(() => navigate(`/aprendentes/${aprendenteId}/pei`), 2000);
      })
      .catch((err) => {
        console.error('[NovoPei] Erro no cadastro:', getSafeErrorLog(err));
        applyApiError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">

      {/* Cabeçalho */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-primary-light shadow-sm">
        <button
          onClick={() => navigate(`/aprendentes/${aprendenteId}/pei`)}
          className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
          aria-label="Voltar para os PEIs do aprendente"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Novo PEI
          </h1>
          <p className="text-text-secondary text-sm mt-1">Registre o Plano Educacional Individualizado do aprendente.</p>
        </div>
      </div>

      {/* Aviso informativo fixo */}
      <aside className="bg-primary-light border border-primary-light rounded-2xl p-5 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-text-primary leading-relaxed">
          O PEI é um esboço de idealização do suporte que o profissional cria para acompanhar o aprendente
          de acordo com suas dificuldades específicas — cada PEI é único e deve ser adaptado individualmente,
          mesmo partindo de um modelo.
        </p>
      </aside>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl border border-primary-light shadow-sm space-y-8 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

        <FormErrorSummary errors={errors} campos={CAMPOS_PEI} />

        <div className="relative z-10 space-y-1.5">
          <label htmlFor="novopei-molde" className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-text-secondary" /> Partir de um modelo (opcional)
          </label>
          <select
            id="novopei-molde"
            value={templateSelecionadoId}
            onChange={(e) => handleSelecionarTemplate(e.target.value)}
            className="w-full min-w-0 p-3.5 rounded-xl border border-primary-light focus:ring-2 focus:ring-primary outline-none bg-background focus:bg-white transition-all font-medium"
            disabled={loading || !!sucesso}
          >
            <option value="">Começar em branco...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.nome}</option>
            ))}
          </select>
          <p className="text-xs text-text-secondary">Os campos abaixo serão pré-preenchidos, mas continuam livremente editáveis.</p>
        </div>

        <PeiCampos
          idPrefixo="novopei"
          valores={valores}
          onChange={alterarCampo}
          errors={errors}
          disabled={loading || !!sucesso}
        />

        {sucesso && (
          <div className="p-4 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> {sucesso}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-primary-light">
          <Button type="submit" isLoading={loading} disabled={!!sucesso} className="w-full md:w-auto px-10 h-12 text-base">
            <ClipboardList className="h-5 w-5 mr-2" /> Cadastrar PEI
          </Button>
        </div>
      </form>
    </div>
  );
}
