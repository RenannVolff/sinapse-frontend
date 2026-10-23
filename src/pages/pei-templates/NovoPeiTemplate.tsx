import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
import { useFormErrors } from '../../hooks/useFormErrors';
import { Button } from '../../components/ui/Button';
import { Input, TextArea } from '../../components/ui/Input';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { LIMITES } from '../../constants/limits';
import { coletarErros, validarTexto } from '../../utils/validacao';

const CAMPOS = ['nome', 'dificuldades', 'objetivos', 'estrategias'];

const SECOES = [
  { campo: 'dificuldades', rotulo: 'Dificuldades', placeholder: 'Descreva as dificuldades típicas cobertas por este modelo...' },
  { campo: 'objetivos', rotulo: 'Objetivos', placeholder: 'Descreva os objetivos padrão deste modelo...' },
  { campo: 'estrategias', rotulo: 'Estratégias', placeholder: 'Descreva as estratégias de suporte padrão deste modelo...' },
] as const;

type CampoSecao = (typeof SECOES)[number]['campo'];

export function NovoPeiTemplate() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { errors, formRef, showErrors, applyApiError, clearError } = useFormErrors();

  const [nome, setNome] = useState('');
  const [secoes, setSecoes] = useState<Record<CampoSecao, string>>({
    dificuldades: '',
    objetivos: '',
    estrategias: '',
  });
  // Nomes já usados, para avisar de modelo repetido antes de enviar.
  const [nomesExistentes, setNomesExistentes] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ nome: string }[]>('/pei-templates')
      .then((res) => setNomesExistentes(res.data.map((t) => t.nome.trim().toLowerCase())))
      .catch((err) => console.error('[NovoPeiTemplate] Erro ao buscar modelos:', getSafeErrorLog(err)));
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const erros = coletarErros({
      nome: validarTexto('Nome do modelo', nome, LIMITES.TITULO),
      dificuldades: validarTexto('Dificuldades', secoes.dificuldades, LIMITES.TEXTO_LONGO),
      objetivos: validarTexto('Objetivos', secoes.objetivos, LIMITES.TEXTO_LONGO),
      estrategias: validarTexto('Estratégias', secoes.estrategias, LIMITES.TEXTO_LONGO),
    });
    if (!erros.nome && nomesExistentes.includes(nome.trim().toLowerCase())) {
      erros.nome = 'Nome do modelo: já existe um modelo com este nome.';
    }
    if (showErrors(erros)) return;

    setLoading(true);

    api.post('/pei-templates', {
      nome: nome.trim(),
      dificuldades: secoes.dificuldades.trim(),
      objetivos: secoes.objetivos.trim(),
      estrategias: secoes.estrategias.trim(),
    })
      .then(() => {
        showSuccess('Modelo cadastrado com sucesso!');
        navigate('/pei-templates');
      })
      .catch((err) => {
        console.error('[NovoPeiTemplate] Erro no cadastro:', getSafeErrorLog(err));
        applyApiError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">

      {/* Cabeçalho */}
      <div className="flex items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-primary-light shadow-sm">
        <button
          onClick={() => navigate('/pei-templates')}
          className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors flex-shrink-0"
          aria-label="Voltar para os modelos de PEI"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 break-words">
            <LayoutTemplate className="h-6 w-6 text-primary flex-shrink-0" />
            Novo Modelo de PEI
          </h1>
          <p className="text-text-secondary text-sm mt-1">Crie um modelo reutilizável para agilizar a criação de novos PEIs.</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl border border-primary-light shadow-sm space-y-8 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

        <FormErrorSummary errors={errors} campos={CAMPOS} />

        <div className="relative z-10">
          <Input
            label="Nome do Modelo"
            name="nome"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              clearError('nome');
            }}
            placeholder="Ex: Suporte para Dificuldades de Leitura"
            maxLength={LIMITES.TITULO}
            showCounter
            error={errors.nome}
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 relative z-10">
          {SECOES.map(({ campo, rotulo, placeholder }) => (
            <TextArea
              key={campo}
              id={`novopeitemplate-${campo}`}
              name={campo}
              label={rotulo}
              value={secoes[campo]}
              onChange={(e) => {
                const valor = e.target.value;
                setSecoes((prev) => ({ ...prev, [campo]: valor }));
                clearError(campo);
              }}
              placeholder={placeholder}
              maxLength={LIMITES.TEXTO_LONGO}
              error={errors[campo]}
              required
              disabled={loading}
            />
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-primary-light">
          <Button type="submit" isLoading={loading} className="w-full md:w-auto px-10 h-12 text-base">
            <LayoutTemplate className="h-5 w-5 mr-2" /> Cadastrar Modelo
          </Button>
        </div>
      </form>
    </div>
  );
}
