import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Plus, ChevronRight, Loader2, Target, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { Button } from '../../components/ui/Button';

export interface Pei {
  id: string;
  aprendenteId: string;
  dificuldades: string;
  objetivos: string;
  estrategias: string;
  dataInicio: string;
  dataFim: string | null;
  criadoEm: string;
}

interface AprendenteResumo {
  id: string;
  nomeCompleto: string;
}

export function PeiList() {
  const { aprendenteId } = useParams<{ aprendenteId: string }>();
  const navigate = useNavigate();

  const [aprendente, setAprendente] = useState<AprendenteResumo | null>(null);
  const [peis, setPeis] = useState<Pei[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!aprendenteId) return;

    Promise.all([
      api.get<AprendenteResumo>(`/aprendentes/${aprendenteId}`),
      api.get<Pei[]>('/peis', { params: { aprendenteId } }),
    ])
      .then(([aprendenteRes, peiRes]) => {
        setAprendente(aprendenteRes.data);
        setPeis(peiRes.data);
      })
      .catch((error) => console.error('[PeiList] Erro ao buscar PEIs:', getSafeErrorLog(error)))
      .finally(() => setLoading(false));
  }, [aprendenteId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-12">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-primary-light shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/aprendentes/${aprendenteId}`)}
            className="p-2 text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              PEIs {aprendente ? `de ${aprendente.nomeCompleto}` : ''}
            </h1>
            <p className="text-text-secondary text-sm mt-1">Planos Educacionais Individualizados registrados para este aprendente.</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/aprendentes/${aprendenteId}/pei/novo`)} className="w-full md:w-auto px-6 h-12">
          <Plus className="h-5 w-5 mr-2" />
          Novo PEI
        </Button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-primary-light shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-text-secondary font-medium">Buscando PEIs...</p>
          </div>
        ) : peis.length === 0 ? (
          <div className="text-center p-16">
            <div className="bg-background h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-10 w-10 text-text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Nenhum PEI cadastrado</h3>
            <p className="text-text-secondary mt-2">Crie o primeiro Plano Educacional Individualizado deste aprendente.</p>
          </div>
        ) : (
          <div className="divide-y divide-primary-light">
            {peis.map((pei) => (
              <div
                key={pei.id}
                onClick={() => navigate(`/pei/${pei.id}`)}
                className="p-5 flex items-center justify-between gap-4 hover:bg-primary-light/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-primary-light text-primary rounded-lg mt-0.5 flex-shrink-0">
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-text-primary group-hover:text-primary-hover transition-colors truncate">
                      {pei.objetivos}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary font-medium mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Início em {new Date(pei.dataInicio).toLocaleDateString('pt-BR')}
                      {pei.dataFim && ` · Fim em ${new Date(pei.dataFim).toLocaleDateString('pt-BR')}`}
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-1 text-sm font-bold text-primary flex-shrink-0">
                  Ver PEI <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
