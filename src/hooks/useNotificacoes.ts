import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { getSafeErrorLog } from '../services/apiError';

const CHAVE_LIDAS = '@SinapseEdu:notificacoesLidas';
const INTERVALO_MS = 60_000;
const JANELA_HORAS = 24;
const LIMITE_TAREFAS = 5;

type StatusAtendimento =
  | 'AGENDADO'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CONFIRMADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'FALTA';

const STATUS_IGNORADOS: StatusAtendimento[] = ['CANCELADO', 'CONCLUIDO', 'FALTA'];

interface SessaoApi {
  id: string;
  dataAtendimento: string;
  tituloSessao: string;
  status: StatusAtendimento;
  aprendente: { nomeCompleto: string };
}

interface TarefaApi {
  id: string;
  texto: string;
  concluida: boolean;
  criadoEm?: string;
}

export interface NotificacaoSessao {
  id: string;
  tipo: 'sessao';
  texto: string;
  sessaoId: string;
}

export interface NotificacaoTarefa {
  id: string;
  tipo: 'tarefa';
  texto: string;
  tarefaId: string;
}

function lerLidas(): Set<string> {
  try {
    const bruto = localStorage.getItem(CHAVE_LIDAS);
    const lista = bruto ? JSON.parse(bruto) : [];
    return new Set(Array.isArray(lista) ? lista : []);
  } catch {
    return new Set();
  }
}

function salvarLidas(ids: Set<string>) {
  try {
    localStorage.setItem(CHAVE_LIDAS, JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage indisponível (ex: modo privado) — degrada sem quebrar o painel.
  }
}

export function useNotificacoes() {
  const [sessoes, setSessoes] = useState<NotificacaoSessao[]>([]);
  const [tarefas, setTarefas] = useState<NotificacaoTarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [lidas, setLidas] = useState<Set<string>>(() => lerLidas());

  useEffect(() => {
    let cancelado = false;

    const buscar = () => {
      const agora = new Date();

      const promiseSessoes = api
        .get<SessaoApi[]>(`/atendimentos/calendario?mes=${agora.getMonth() + 1}&ano=${agora.getFullYear()}`)
        .then((res) => res.data)
        .catch((err) => {
          console.error('[useNotificacoes] Erro ao buscar sessões:', getSafeErrorLog(err));
          return [] as SessaoApi[];
        });

      const promiseTarefas = api
        .get<TarefaApi[]>('/tarefas')
        .then((res) => res.data)
        .catch((err) => {
          console.error('[useNotificacoes] Erro ao buscar tarefas:', getSafeErrorLog(err));
          return [] as TarefaApi[];
        });

      Promise.all([promiseSessoes, promiseTarefas]).then(([sessoesApi, tarefasApi]) => {
        if (cancelado) return;

        const limite = new Date(agora.getTime() + JANELA_HORAS * 60 * 60 * 1000);

        const proximasSessoes = sessoesApi
          .filter((s) => !STATUS_IGNORADOS.includes(s.status))
          .filter((s) => {
            const data = new Date(s.dataAtendimento);
            return data >= agora && data <= limite;
          })
          .sort((a, b) => new Date(a.dataAtendimento).getTime() - new Date(b.dataAtendimento).getTime())
          .map((s): NotificacaoSessao => {
            const hora = new Date(s.dataAtendimento).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return {
              id: `sessao-${s.id}`,
              tipo: 'sessao',
              texto: `Sessão com ${s.aprendente.nomeCompleto} às ${hora}`,
              sessaoId: s.id,
            };
          });

        const tarefasPendentes = tarefasApi
          .filter((t) => !t.concluida)
          .sort((a, b) => {
            if (!a.criadoEm || !b.criadoEm) return 0;
            return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
          })
          .slice(0, LIMITE_TAREFAS)
          .map((t): NotificacaoTarefa => ({
            id: `tarefa-${t.id}`,
            tipo: 'tarefa',
            texto: `Tarefa pendente: ${t.texto}`,
            tarefaId: t.id,
          }));

        setSessoes(proximasSessoes);
        setTarefas(tarefasPendentes);
        setLoading(false);
      });
    };

    buscar();
    const intervalo = setInterval(buscar, INTERVALO_MS);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  const naoLidasCount = [...sessoes, ...tarefas].filter((n) => !lidas.has(n.id)).length;

  const marcarComoLidas = useCallback(() => {
    setLidas((prev) => {
      const atualizado = new Set(prev);
      [...sessoes, ...tarefas].forEach((n) => atualizado.add(n.id));
      salvarLidas(atualizado);
      return atualizado;
    });
  }, [sessoes, tarefas]);

  return { sessoes, tarefas, loading, naoLidasCount, marcarComoLidas };
}
