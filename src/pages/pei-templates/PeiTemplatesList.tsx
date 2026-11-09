import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Plus, Loader2, Pencil, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getErrorMessage, getSafeErrorLog } from '../../services/apiError';
import {
  excluirPeiTemplate,
  listarPeiTemplates,
  type PeiTemplate,
} from '../../services/peiTemplates';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SearchBar } from '../../components/ui/SearchBar';
import { SortableHeader } from '../../components/ui/SortableHeader';
import { LIMITES } from '../../constants/limits';
import { ordenarPeiTemplates, type DirecaoOrdenacao } from '../../utils/ordenacao';

// Busca sem diferenciar maiúsculas nem acentos ("leitura" acha "Leitura").
const normalizarBusca = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function PeiTemplatesList() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [templates, setTemplates] = useState<PeiTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string>('');
  const [tentativa, setTentativa] = useState<number>(0);
  const [busca, setBusca] = useState<string>('');
  const [order, setOrder] = useState<DirecaoOrdenacao>('asc');
  const [templateParaExcluir, setTemplateParaExcluir] = useState<PeiTemplate | null>(null);
  const [excluindo, setExcluindo] = useState<boolean>(false);

  // Mesmo esquema da lista de aprendentes: a troca de direção pede a lista de
  // novo à API, mas a tela já reordena no cliente sem mostrar spinner.
  useEffect(() => {
    let ativo = true;
    listarPeiTemplates({ order })
      .then((lista) => {
        if (!ativo) return;
        setTemplates(lista);
        setErro('');
      })
      .catch((error) => {
        console.error('[PeiTemplatesList] Erro ao buscar templates:', getSafeErrorLog(error));
        if (ativo) setErro(getErrorMessage(error, 'Não foi possível carregar os modelos.'));
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [order, tentativa]);

  const handleTentarNovamente = () => {
    setLoading(true);
    setErro('');
    setTentativa((t) => t + 1);
  };

  const handleExcluirTemplate = () => {
    if (!templateParaExcluir) return;

    setExcluindo(true);
    excluirPeiTemplate(templateParaExcluir.id)
      .then(() => {
        setTemplates((prev) => prev.filter((t) => t.id !== templateParaExcluir.id));
        showSuccess('Modelo excluído com sucesso.');
        setTemplateParaExcluir(null);
      })
      // O toast de erro sai no interceptor da API.
      .catch((error) => console.error('[PeiTemplatesList] Erro ao excluir template:', getSafeErrorLog(error)))
      .finally(() => setExcluindo(false));
  };

  const templatesFiltrados = useMemo(() => {
    const termo = normalizarBusca(busca.trim());
    return ordenarPeiTemplates(templates, order).filter(
      (template) =>
        normalizarBusca(template.nome).includes(termo) || normalizarBusca(template.dificuldades).includes(termo),
    );
  }, [templates, order, busca]);

  const semCadastro = templates.length === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-12">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-primary-light shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-primary" />
            Modelos de PEI
          </h1>
          <p className="text-text-secondary text-sm mt-1">Modelos reutilizáveis para agilizar a criação de novos PEIs.</p>
        </div>
        <Button onClick={() => navigate('/pei-templates/novo')} className="w-full md:w-auto px-6 h-12">
          <Plus className="h-5 w-5 mr-2" />
          Novo Modelo
        </Button>
      </div>

      <SearchBar
        value={busca}
        onChange={setBusca}
        placeholder="Buscar modelo pelo título ou descrição..."
        ariaLabel="Buscar modelo pelo título ou descrição"
        maxLength={LIMITES.TITULO}
        totalRegistros={templatesFiltrados.length}
      />

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-primary-light shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-text-secondary font-medium">Buscando modelos...</p>
          </div>
        ) : erro && semCadastro ? (
          <div className="text-center p-16" role="alert">
            <div className="bg-red-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Não foi possível carregar os modelos</h3>
            <p className="text-text-secondary mt-2 mb-6">{erro}</p>
            <Button variant="outline" onClick={handleTentarNovamente} className="w-auto px-6 mx-auto">
              <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
            </Button>
          </div>
        ) : templatesFiltrados.length === 0 ? (
          <div className="text-center p-16">
            <div className="bg-background h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutTemplate className="h-10 w-10 text-text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">
              {semCadastro ? 'Nenhum modelo cadastrado' : 'Nenhum modelo encontrado'}
            </h3>
            <p className="text-text-secondary mt-2">
              {semCadastro
                ? 'Crie um modelo para reutilizar ao criar novos PEIs.'
                : 'Nenhum resultado corresponde à sua pesquisa atual.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-primary-light text-xs text-text-secondary uppercase tracking-wider">
                  <SortableHeader
                    ativo
                    direcao={order}
                    onOrdenar={() => setOrder((atual) => (atual === 'asc' ? 'desc' : 'asc'))}
                  >
                    Modelo
                  </SortableHeader>
                  <th scope="col" className="p-5 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-light">
                {templatesFiltrados.map((template) => (
                  <tr key={template.id} className="hover:bg-primary-light/30 transition-colors">
                    <td className="p-5 min-w-0">
                      <p className="font-bold text-text-primary break-words">{template.nome}</p>
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2 break-words">{template.dificuldades}</p>
                    </td>
                    <td className="p-5 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/pei-templates/${template.id}/editar`)}
                          className="inline-flex items-center gap-1 px-2.5 py-2 text-sm font-semibold text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                          aria-label={`Editar ${template.nome}`}
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateParaExcluir(template)}
                          className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir modelo"
                          aria-label={`Excluir ${template.nome}`}
                        >
                          <Trash2 className="h-4 w-4" />
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
        open={!!templateParaExcluir}
        title="Excluir modelo?"
        description={`Tem certeza? O modelo "${templateParaExcluir?.nome}" deixará de aparecer na sua lista e ao criar novos PEIs. PEIs já criados a partir dele não são alterados.`}
        confirmLabel="Sim, Excluir"
        loading={excluindo}
        onConfirm={handleExcluirTemplate}
        onCancel={() => setTemplateParaExcluir(null)}
      />
    </div>
  );
}
