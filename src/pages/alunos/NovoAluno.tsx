import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Calendar, Phone, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function NovoAluno() {
  const navigate = useNavigate();
  const { user } = useAuth();


  const [formData, setFormData] = useState({
    nomeCompleto: '',
    dataNascimento: '',
    responsavel: '',
    contato: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');


    if (!user?.id) {
      setError('Erro crítico: Usuário logado não identificado. Faça login novamente.');
      setLoading(false);
      return;
    }

    try {


      const dataIsoFormatada = new Date(`${formData.dataNascimento}T12:00:00Z`).toISOString();

      await api.post('/alunos', {
        nomeCompleto: formData.nomeCompleto,
        dataNascimento: dataIsoFormatada,
        responsavel: formData.responsavel,
        contato: formData.contato,
        usuarioId: user.id,
      });


      navigate('/alunos');
    } catch (err: unknown) {
      console.error('Erro detalhado da API:', err);


      if (isAxiosError(err) && err.response?.data) {
        const mensagens = err.response.data.message;
        
        if (Array.isArray(mensagens)) {

          setError(`Erro de Validação: ${mensagens.join(' | ')}`);
        } else if (typeof mensagens === 'string') {

          setError(`Aviso: ${mensagens}`);
        } else {
          setError('Erro ao cadastrar aluno. Verifique o console para mais detalhes.');
        }
      } else {
        setError('Erro de conexão. Verifique se o backend está rodando.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={() => navigate('/alunos')}
          className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Aluno</h1>
          <p className="text-gray-500">Preencha os dados básicos do paciente.</p>
        </div>
      </div>

      {/* Caixa do Formulário */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome Completo do Aluno"
            name="nomeCompleto"
            value={formData.nomeCompleto}
            onChange={handleChange}
            icon={<User className="h-5 w-5" />}
            placeholder="Ex: João da Silva"
            required
          />

          <Input
            label="Data de Nascimento"
            type="date"
            name="dataNascimento"
            value={formData.dataNascimento}
            onChange={handleChange}
            icon={<Calendar className="h-5 w-5" />}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome do Responsável Legal"
              name="responsavel"
              value={formData.responsavel}
              onChange={handleChange}
              icon={<User className="h-5 w-5" />}
              placeholder="Ex: Maria da Silva"
              required
            />

            <Input
              label="Contato (WhatsApp / E-mail)"
              name="contato"
              value={formData.contato}
              onChange={handleChange}
              icon={<Phone className="h-5 w-5" />}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          {/* Área de Exibição do Erro (Agora muito mais inteligente) */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex gap-3 animate-in fade-in">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/alunos')}
              className="w-auto px-6"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              isLoading={loading}
              className="w-auto px-6"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Cadastro
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
