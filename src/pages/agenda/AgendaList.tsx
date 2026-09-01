import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, User, Plus, ChevronRight, CheckCircle2, Trash2, Check, X, Archive, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { getErrorMessage, getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type StatusAtendimento =
  | 'AGENDADO'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CONFIRMADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'FALTA';

interface Sessao {
  id: string;
  dataAtendimento: string;
  tituloSessao: string;
  status: StatusAtendimento;
  concluido: boolean;
  aprendente: { nomeCompleto: string; };
}

const STATUS_CONFIG: Record<StatusAtendimento, { label: string; badgeClass: string; cardClass: string }> = {
  AGENDADO: { label: 'Agendado', badgeClass: 'bg-primary-light text-primary', cardClass: '' },
  AGUARDANDO_CONFIRMACAO: { label: 'Aguardando confirmação', badgeClass: 'bg-amber-100 text-amber-800', cardClass: 'bg-amber-50/70' },
  CONFIRMADO: { label: 'Confirmado', badgeClass: 'bg-green-100 text-green-800', cardClass: 'bg-green-50/60' },
  EM_ANDAMENTO: { label: 'Em andamento', badgeClass: 'bg-blue-100 text-blue-800', cardClass: 'bg-blue-50/50' },
  CONCLUIDO: { label: 'Concluído', badgeClass: 'bg-primary-light text-primary', cardClass: '' },
  CANCELADO: { label: 'Cancelado', badgeClass: 'bg-gray-200 text-gray-600', cardClass: 'bg-gray-50/80' },
  FALTA: { label: 'Falta', badgeClass: 'bg-red-100 text-red-700', cardClass: 'bg-red-50/50' },
};

export function AgendaList() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessaoParaExcluir, setSessaoParaExcluir] = useState<Sessao | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [mostrarCancelados, setMostrarCancelados] = useState(false);
  const [atualizandoStatusId, setAtualizandoStatusId] = useState<string | null>(null);

  useEffect(() => {
    const dataAtual = new Date();
    api.get<Sessao[]>(`/atendimentos/calendario?mes=${dataAtual.getMonth() + 1}&ano=${dataAtual.getFullYear()}`)
      .then((res) => setSessoes(res.data))
      .catch((err) => console.error('[Agenda] Erro ao buscar sessões:', getSafeErrorLog(err)))
      .finally(() => setLoading(false));
  }, []);

  const pendentes = useMemo(
    () => sessoes.filter(s => s.status !== 'CONCLUIDO' && s.status !== 'CANCELADO' && s.status !== 'FALTA'),
    [sessoes],
  );

  const cancelados = useMemo(
    () => sessoes.filter(s => s.status === 'CANCELADO'),
    [sessoes],
  );

  const sessoesExibidas = mostrarCancelados ? cancelados : pendentes;

  const handleExcluirSessao = () => {
    if (!sessaoParaExcluir) return;

    setExcluindo(true);
    api.delete(`/atendimentos/${sessaoParaExcluir.id}`)
      .then(() => {
        setSessoes((prev) => prev.filter((s) => s.id !== sessaoParaExcluir.id));
        showSuccess('Sessão excluída com sucesso.');
        setSessaoParaExcluir(null);
      })
      .catch((err) => console.error('[Agenda] Erro ao excluir sessão:', getSafeErrorLog(err)))
      .finally(() => setExcluindo(false));
  };

  const handleAtualizarStatus = (sessao: Sessao, novoStatus: 'CONFIRMADO' | 'CANCELADO') => {
    setAtualizandoStatusId(sessao.id);
    api.patch<Sessao>(`/atendimentos/${sessao.id}/status`, { status: novoStatus })
      .then(() => {
        setSessoes((prev) => prev.map((s) => (s.id === sessao.id ? { ...s, status: novoStatus } : s)));
        showSuccess(novoStatus === 'CONFIRMADO' ? 'Sessão confirmada.' : 'Sessão cancelada.');
      })
      .catch((err) => {
        console.error('[Agenda] Erro ao atualizar status:', getSafeErrorLog(err));
        showError(getErrorMessage(err, 'Erro ao atualizar o status da sessão.'));
      })
      .finally(() => setAtualizandoStatusId(null));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-primary-light">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" /> {mostrarCancelados ? 'Sessões Canceladas' : 'Agenda de Pendências'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {mostrarCancelados
              ? 'Horários liberados por cancelamento neste mês.'
              : 'Apenas as sessões não finalizadas aparecerão aqui.'}
          </p>
        </div>
        <Button onClick={() => navigate('/agenda/nova')} className="w-full md:w-auto h-12 px-6">
          <Plus className="h-5 w-5 mr-2" /> Agendar Sessão
        </Button>
      </div>

      <button
        onClick={() => setMostrarCancelados((prev) => !prev)}
        className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
      >
        {mostrarCancelados ? (
          <><ArrowLeft className="h-4 w-4" /> Voltar para pendências</>
        ) : (
          <><Archive className="h-4 w-4" /> Ver cancelados {cancelados.length > 0 && `(${cancelados.length})`}</>
        )}
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-primary-light min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-text-secondary font-medium">Carregando...</div>
        ) : sessoesExibidas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-green-50 p-4 rounded-full mb-3"><CheckCircle2 className="h-10 w-10 text-green-500" /></div>
            <h3 className="text-xl font-bold text-text-primary">
              {mostrarCancelados ? 'Nenhuma sessão cancelada.' : 'Nenhuma sessão pendente!'}
            </h3>
            <p className="text-text-secondary text-sm mt-1">
              {mostrarCancelados ? 'Nenhum horário liberado neste mês.' : 'Sua agenda está limpa. Bom trabalho!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-primary-light">
            {sessoesExibidas.map((sessao) => {
              const dataObj = new Date(sessao.dataAtendimento);
              const statusInfo = STATUS_CONFIG[sessao.status];
              const processando = atualizandoStatusId === sessao.id;
              return (
                <div key={sessao.id} className={`p-6 hover:bg-primary-light/40 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group ${statusInfo.cardClass}`}>
                  <div className="flex gap-4 items-center">
                    <div className="h-16 w-16 bg-primary-light border border-primary-light rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary uppercase">{dataObj.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                      <span className="text-2xl font-black text-primary-hover leading-none">{dataObj.getDate()}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-text-primary">{sessao.tituloSessao}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-text-secondary font-medium mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> {dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1 bg-primary-light px-2 py-0.5 rounded-md text-text-primary"><User className="h-4 w-4"/> {sessao.aprendente.nomeCompleto}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                    {sessao.status === 'AGUARDANDO_CONFIRMACAO' && (
                      <>
                        <button
                          onClick={() => handleAtualizarStatus(sessao, 'CONFIRMADO')}
                          disabled={processando}
                          className="flex items-center gap-1 px-3 py-2.5 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" /> Confirmar
                        </button>
                        <button
                          onClick={() => handleAtualizarStatus(sessao, 'CANCELADO')}
                          disabled={processando}
                          className="flex items-center gap-1 px-3 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" /> Cancelar
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSessaoParaExcluir(sessao)}
                      className="p-2.5 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Excluir sessão"
                      aria-label="Excluir sessão"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {!mostrarCancelados && (
                      <Button variant="outline" onClick={() => navigate(`/agenda/${sessao.id}/sessao`)} className="flex-1 sm:flex-none sm:w-auto">
                        {sessao.status === 'EM_ANDAMENTO' ? 'Continuar Sessão' : 'Iniciar Sessão'} <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!sessaoParaExcluir}
        title="Excluir sessão?"
        description={`A sessão "${sessaoParaExcluir?.tituloSessao}" será removida da agenda. Esta ação não pode ser desfeita pela interface.`}
        confirmLabel="Sim, Excluir"
        loading={excluindo}
        onConfirm={handleExcluirSessao}
        onCancel={() => setSessaoParaExcluir(null)}
      />
    </div>
  );
}
