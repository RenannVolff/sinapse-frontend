import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Users, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';

export interface Aluno {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  responsavel: string;
  contato: string;
  criadoEm: string;
}

export function AlunosList() {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busca, setBusca] = useState<string>('');

  useEffect(() => {
    async function fetchAlunos() {
      try {
        const response = await api.get<Aluno[]>('/alunos');
        setAlunos(response.data);
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAlunos();
  }, []);

  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.nomeCompleto.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestão de Alunos
          </h1>
          <p className="text-gray-500">Gerencie seus pacientes e acompanhe históricos.</p>
        </div>
        <Button onClick={() => navigate('/alunos/novo')} className="w-auto px-6">
          <Plus className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            label=""
            placeholder="Buscar aluno por nome..."
            value={busca}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
            icon={<Search className="h-5 w-5" />}
          />
        </div>
        <div className="text-sm text-gray-500 font-medium pt-2">
          {alunosFiltrados.length} {alunosFiltrados.length === 1 ? 'resultado' : 'resultados'}
        </div>
      </div>

      {/* Tabela / Lista de Alunos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : alunosFiltrados.length === 0 ? (
          <div className="text-center p-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum aluno encontrado</h3>
            <p className="text-gray-500 mt-1">Que tal cadastrar seu primeiro paciente?</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                  <th className="p-4 font-semibold">Nome do Aluno</th>
                  <th className="p-4 font-semibold">Responsável</th>
                  <th className="p-4 font-semibold">Contato</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunosFiltrados.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-4 font-medium text-gray-900">{aluno.nomeCompleto}</td>
                    <td className="p-4 text-gray-600">{aluno.responsavel}</td>
                    <td className="p-4 text-gray-600">{aluno.contato}</td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-primary bg-white rounded-lg border border-transparent hover:border-blue-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}