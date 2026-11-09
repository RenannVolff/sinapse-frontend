import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutTemplate, ArrowLeft, Loader2, Pencil, Save } from 'lucide-react';
import { getSafeErrorLog } from '../../services/apiError';
import {
  atualizarPeiTemplate,
  buscarPeiTemplate,
  criarPeiTemplate,
  listarPeiTemplates,
} from '../../services/peiTemplates';
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

interface ModeloExistente {
  id: string;
  nome: string;
}

const normalizarNome = (nome: string) => nome.trim().toLowerCase();

// Cadastro e edição (rota /pei-templates/:id/editar) usam o mesmo formulário,
// com as mesmas validações e limites do back.
export function NovoPeiTemplate() {
  const { id } = useParams<{ id: string }>();
  const editando = !!id;
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { errors, formRef, showErrors, applyApiError, clearError } = useFormErrors();

  const [nome, setNome] = useState('');
  const [secoes, setSecoes] = useState<Record<CampoSecao, string>>({
    dificuldades: '',
    objetivos: '',
    estrategias: '',
  });
  // Modelos já cadastrados, para avisar de nome repetido antes de enviar. Na
  // edição, o próprio modelo fica de fora da checagem.
  const [modelosExistentes, setModelosExistentes] = useState<ModeloExistente[]>([]);

  const [carregando, setCarregando] = useState(editando);
  const [erroCarregar, setErroCarregar] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listarPeiTemplates()
      .then((lista) => setModelosExistentes(lista.map(({ id: idModelo, nome: nomeModelo }) => ({ id: idModelo, nome: nomeModelo }))))
      .catch((err) => console.error('[NovoPeiTemplate] Erro ao buscar modelos:', getSafeErrorLog(err)));
  }, []);

  useEffect(() => {
    if (!id) return;
    buscarPeiTemplate(id)
      .then((modelo) => {
        setNome(modelo.nome);
        setSecoes({
          dificuldades: modelo.dificuldades,
          objetivos: modelo.objetivos,
          estrategias: modelo.estrategias,
        });
      })
      .catch((err) => {
        console.error('[NovoPeiTemplate] Erro ao carregar modelo:', getSafeErrorLog(err));
        setErroCarregar('Não foi possível carregar os dados deste modelo.');
      })
      .finally(() => setCarregando(false));
  }, [id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const erros = coletarErros({
      nome: validarTexto('Nome do modelo', nome, LIMITES.TITULO),
      dificuldades: validarTexto('Dificuldades', secoes.dificuldades, LIMITES.TEXTO_LONGO),
      objetivos: validarTexto('Objetivos', secoes.objetivos, LIMITES.TEXTO_LONGO),
      estrategias: validarTexto('Estratégias', secoes.estrategias, LIMITES.TEXTO_LONGO),
    });
    const nomeRepetido = modelosExistentes.some(
      (modelo) => modelo.id !== id && normalizarNome(modelo.nome) === normalizarNome(nome),
    );
    if (!erros.nome && nomeRepetido) {
      erros.nome = 'Nome do modelo: já existe um modelo com este nome.';
    }
    if (showErrors(erros)) return;

    setLoading(true);

    const payload = {
      nome: nome.trim(),
      dificuldades: secoes.dificuldades.trim(),
      objetivos: secoes.objetivos.trim(),
      estrategias: secoes.estrategias.trim(),
    };
    const requisicao = id ? atualizarPeiTemplate(id, payload) : criarPeiTemplate(payload);

    requisicao
      .then(() => {
        showSuccess(editando ? 'Modelo atualizado com sucesso!' : 'Modelo cadastrado com sucesso!');
        navigate('/pei-templates');
      })
      .catch((err) => {
        console.error('[NovoPeiTemplate] Erro ao salvar:', getSafeErrorLog(err));
        // Mensagem geral já sai no toast do interceptor; aqui vão os campos.
        applyApiError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (carregando) {
    return (
      <div className="flex flex-col h-[60dvh] items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-text-secondary font-medium">Carregando dados do modelo...</p>
      </div>
    );
  }

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
            {editando ? <Pencil className="h-6 w-6 text-primary flex-shrink-0" /> : <LayoutTemplate className="h-6 w-6 text-primary flex-shrink-0" />}
            {editando ? 'Editar Modelo de PEI' : 'Novo Modelo de PEI'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {editando
              ? 'Atualize o nome e o conteúdo deste modelo.'
              : 'Crie um modelo reutilizável para agilizar a criação de novos PEIs.'}
          </p>
        </div>
      </div>

      {erroCarregar ? (
        <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">{erroCarregar}</div>
      ) : (
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

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-primary-light">
            {editando && (
              <Button type="button" variant="outline" onClick={() => navigate('/pei-templates')} disabled={loading} className="w-full sm:w-auto px-8 h-12">
                Cancelar
              </Button>
            )}
            <Button type="submit" isLoading={loading} className="w-full sm:w-auto px-10 h-12 text-base">
              {editando ? <Save className="h-5 w-5 mr-2" /> : <LayoutTemplate className="h-5 w-5 mr-2" />}
              {editando ? 'Salvar Alterações' : 'Cadastrar Modelo'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
