import { useEffect, useState } from 'react';
import { History, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';

type AcaoAuditoria = 'CREATE' | 'UPDATE' | 'DELETE' | string;

interface AuditLog {
  id: string;
  criadoEm: string;
  acao: AcaoAuditoria;
  recurso: string;
  resumo: string;
}

const ACAO_BADGE: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-700 border-green-100',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-100',
  DELETE: 'bg-red-50 text-red-700 border-red-100',
};

const ACAO_LABEL: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Edição',
  DELETE: 'Exclusão',
};

export function Auditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Backend filtra automaticamente por usuarioId (via @CurrentUser()) e já
    // retorna apenas os últimos 50 registros, sem paginação.
    api.get<AuditLog[]>('/audit-logs')
      .then((response) => setLogs(response.data))
      .catch((error) => console.error('[Auditoria] Erro ao buscar logs:', getSafeErrorLog(error)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-primary-light shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Log de Auditoria
          </h1>
          <p className="text-text-secondary text-sm mt-1">Últimas 50 ações realizadas na sua conta.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-primary-light shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-text-secondary font-medium">Carregando registros...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center p-16">
            <div className="bg-background h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-10 w-10 text-text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Nenhuma ação registrada</h3>
            <p className="text-text-secondary mt-2">Assim que você criar, editar ou excluir algo, o histórico aparecerá aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-primary-light text-xs text-text-secondary uppercase tracking-wider">
                  <th className="p-5 font-bold">Data/Hora</th>
                  <th className="p-5 font-bold">Ação</th>
                  <th className="p-5 font-bold">Recurso</th>
                  <th className="p-5 font-bold">Resumo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-light">
                {logs.map((log) => {
                  const dataObj = new Date(log.criadoEm);
                  return (
                    <tr key={log.id} className="hover:bg-primary-light/30 transition-colors">
                      <td className="p-5 text-text-secondary font-medium whitespace-nowrap">
                        {dataObj.toLocaleDateString('pt-BR')} às {dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${ACAO_BADGE[log.acao] ?? 'bg-primary-light text-text-primary border-primary-light'}`}>
                          {ACAO_LABEL[log.acao] ?? log.acao}
                        </span>
                      </td>
                      <td className="p-5 text-text-primary font-medium">{log.recurso}</td>
                      <td className="p-5 text-text-secondary">{log.resumo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
