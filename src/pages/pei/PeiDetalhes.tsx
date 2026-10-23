import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  AlertTriangle,
  Pencil,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
import { useFormErrors } from '../../hooks/useFormErrors';
import { Button } from '../../components/ui/Button';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { extrairDia, formatarDiaBr } from '../../utils/datas';
import { PeiCampos } from './PeiCampos';
import { CAMPOS_PEI, validarPei, type ValoresPei } from './peiValidacao';

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

function valoresDoPei(pei: Pei): ValoresPei {
  return {
    dificuldades: pei.dificuldades,
    objetivos: pei.objetivos,
    estrategias: pei.estrategias,
    dataInicio: extrairDia(pei.dataInicio) ?? '',
    dataFim: extrairDia(pei.dataFim) ?? '',
  };
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
  const { errors, formRef, showErrors, applyApiError, clearError, reset } = useFormErrors();

  const [valores, setValores] = useState<ValoresPei>({
    dificuldades: '',
    objetivos: '',
    estrategias: '',
    dataInicio: '',
    dataFim: '',
  });

  const alterarCampo = (campo: keyof ValoresPei, valor: string) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    clearError(campo);
  };

  useEffect(() => {
    async function fetchPei() {
      if (!id) return;

      try {
        setLoading(true);
        setError('');
        const response = await api.get<Pei>(`/peis/${id}`);
        setPei(response.data);
        setValores(valoresDoPei(response.data));
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
    setValores(valoresDoPei(pei));
    reset();
    setEditando(false);
  };

  const handleSalvar = (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (showErrors(validarPei(valores))) return;

    setSalvando(true);

    api.patch<Pei>(`/peis/${id}`, {
      dificuldades: valores.dificuldades.trim(),
      objetivos: valores.objetivos.trim(),
      estrategias: valores.estrategias.trim(),
      dataInicio: valores.dataInicio,
      dataFim: valores.dataFim || null,
    })
      .then((response) => {
        // Reabre com o que o back gravou (texto sanitizado, datas normalizadas).
        setPei(response.data);
        setValores(valoresDoPei(response.data));
        reset();
        setEditando(false);
        showSuccess('PEI atualizado com sucesso.');
      })
      .catch((err) => {
        console.error('[PeiDetalhes] Erro ao salvar PEI:', getSafeErrorLog(err));
        applyApiError(err);
      })
      .finally(() => setSalvando(false));
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[60dvh] items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-text-secondary font-medium">Carregando PEI...</p>
      </div>
    );
  }

  if (error || !pei) {
    return (
      <div className="flex flex-col h-[60dvh] items-center justify-center text-center px-4">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Ops! Algo deu errado.</h2>
        <p className="text-text-secondary mb-6 max-w-md">{error}</p>
        <Button onClick={() => navigate('/aprendentes')} className="w-auto px-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a Lista
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 sm:p-6 rounded-xl border border-primary-light shadow-sm">
        <button
          onClick={() => navigate(`/aprendentes/${pei.aprendenteId}/pei`)}
          className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
          title="Voltar"
          aria-label="Voltar para os PEIs do aprendente"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 break-words">
            <ClipboardList className="h-6 w-6 text-primary flex-shrink-0" />
            Plano Educacional Individualizado
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Criado em {new Date(pei.criadoEm).toLocaleDateString('pt-BR')}
            {' · '}Vigência: {formatarDiaBr(pei.dataInicio)}
            {pei.dataFim ? ` a ${formatarDiaBr(pei.dataFim)}` : ' (sem data de fim)'}
          </p>
        </div>
        {!editando && (
          <Button onClick={() => setEditando(true)} variant="outline" className="w-full sm:w-auto px-6">
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </Button>
        )}
      </div>

      <form ref={formRef} onSubmit={handleSalvar} noValidate className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl border border-primary-light shadow-sm space-y-8">
        <FormErrorSummary errors={errors} campos={CAMPOS_PEI} />

        <PeiCampos
          idPrefixo="peidetalhes"
          valores={valores}
          onChange={alterarCampo}
          errors={errors}
          disabled={!editando || salvando}
        />

        {editando && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-primary-light">
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
