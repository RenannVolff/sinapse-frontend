import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Users, ChevronRight, Loader2, User, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export interface Aprendente {
  id: string;
  nomeCompleto: string;
  responsavel: string;
  contato: string;
}

export function AprendentesList() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [aprendentes, setAprendentes] = useState<Aprendente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busca, setBusca] = useState<string>('');
  const [aprendenteParaExcluir, setAprendenteParaExcluir] = useState<Aprendente | null>(null);
  const [excluindo, setExcluindo] = useState<boolean>(false);

  useEffect(() => {
    api.get<Aprendente[]>('/aprendentes')
      .then((response) => setAprendentes(response.data))
      .catch((error) => console.error('[AprendentesList] Erro ao buscar aprendentes:', getSafeErrorLog(error)))
      .finally(() => setLoading(false));
  }, []);

  const handleExcluirAprendente = () => {
    if (!aprendenteParaExcluir) return;

    setExcluindo(true);
    api.delete(`/aprendentes/${aprendenteParaExcluir.id}`)
      .then(() => {
        setAprendentes((prev) => prev.filter((a) => a.id !== aprendenteParaExcluir.id));
        showSuccess('Aprendente excluído com sucesso.');
        setAprendenteParaExcluir(null);
      })
      .catch((error) => console.error('[AprendentesList] Erro ao excluir aprendente:', getSafeErrorLog(error)))
      .finally(() => setExcluindo(false));
  };

  const aprendentesFiltrados = aprendentes.filter((aprendente) =>
    aprendente.nomeCompleto.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-12">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Gestão de Aprendentes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Acesse prontuários e gerencie seus aprendentes ativos.</p>
        </div>
        <Button onClick={() => navigate('/aprendentes/novo')} className="w-full md:w-auto px-6 h-12">
          <Plus className="h-5 w-5 mr-2" />
          Novo Aprendente
        </Button>
      </div>

      {/* Barra de Pesquisa Premium */}
      <div className="bg-white p-2 pl-4 rounded-2xl border border-gray-200 shadow-sm flex items-center focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar aprendente pelo nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 bg-transparent border-none py-3 px-4 outline-none text-gray-700 placeholder-gray-400"
        />
        <div className="pr-4 hidden md:block">
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
            {aprendentesFiltrados.length} Registros
          </span>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Buscando registros...</p>
          </div>
        ) : aprendentesFiltrados.length === 0 ? (
          <div className="text-center p-16">
            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Nenhum aprendente encontrado</h3>
            <p className="text-gray-500 mt-2">Nenhum resultado corresponde à sua pesquisa atual.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-5 font-bold">Aprendente</th>
                  <th className="p-5 font-bold">Responsável</th>
                  <th className="p-5 font-bold">Contato</th>
                  <th className="p-5 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {aprendentesFiltrados.map((aprendente) => (
                  <tr
                    key={aprendente.id}
                    onClick={() => navigate(`/aprendentes/${aprendente.id}`)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{aprendente.nomeCompleto}</span>
                      </div>
                    </td>
                    <td className="p-5 text-gray-600 font-medium">{aprendente.responsavel}</td>
                    <td className="p-5 text-gray-600">{aprendente.contato}</td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAprendenteParaExcluir(aprendente);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir aprendente"
                          aria-label="Excluir aprendente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="flex items-center gap-1 text-sm font-bold text-blue-600">
                          Ver Prontuário <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!aprendenteParaExcluir}
        title="Excluir aprendente?"
        description={`Esta ação removerá "${aprendenteParaExcluir?.nomeCompleto}" da sua lista de aprendentes ativos. Esta ação não pode ser desfeita pela interface.`}
        confirmLabel="Sim, Excluir"
        loading={excluindo}
        onConfirm={handleExcluirAprendente}
        onCancel={() => setAprendenteParaExcluir(null)}
      />
    </div>
  );
}