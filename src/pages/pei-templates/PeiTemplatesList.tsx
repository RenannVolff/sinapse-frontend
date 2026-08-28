import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Plus, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { getSafeErrorLog } from '../../services/apiError';
import { Button } from '../../components/ui/Button';

export interface PeiTemplate {
  id: string;
  nome: string;
  dificuldades: string;
  objetivos: string;
  estrategias: string;
}

export function PeiTemplatesList() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PeiTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get<PeiTemplate[]>('/pei-templates')
      .then((response) => setTemplates(response.data))
      .catch((error) => console.error('[PeiTemplatesList] Erro ao buscar templates:', getSafeErrorLog(error)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-12">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-blue-600" />
            Templates de PEI
          </h1>
          <p className="text-gray-500 text-sm mt-1">Modelos reutilizáveis para agilizar a criação de novos PEIs.</p>
        </div>
        <Button onClick={() => navigate('/pei-templates/novo')} className="w-full md:w-auto px-6 h-12">
          <Plus className="h-5 w-5 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Buscando templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center p-16">
            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutTemplate className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Nenhum template cadastrado</h3>
            <p className="text-gray-500 mt-2">Crie um template para reutilizar ao criar novos PEIs.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {templates.map((template) => (
              <div key={template.id} className="p-5">
                <p className="font-bold text-gray-900">{template.nome}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.dificuldades}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
