import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, User, Calendar, Phone, Shield, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function NovoAluno() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [contato, setContato] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!user?.id) {
      setErro('Sessão inválida. Faça login novamente.');
      return;
    }

    if (contato.length < 10) {
      setErro('Insira um número de contato válido com DDD.');
      return;
    }

    setLoading(true);

    api.post('/alunos', {
      nomeCompleto,
      dataNascimento,
      responsavel,
      contato,
      usuarioId: user.id
    })
      .then(() => {
        setSucesso('Aprendente cadastrado com sucesso! Redirecionando...');
        setTimeout(() => navigate('/alunos'), 2000);
      })
      .catch((err) => {
        console.error('Erro no cadastro:', err);
        setErro('Ocorreu um erro ao cadastrar o aprendente. Verifique os dados.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <button 
          onClick={() => navigate('/alunos')}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            Cadastrar Aprendente
          </h1>
          <p className="text-gray-500 text-sm mt-1">Preencha os dados para iniciar o prontuário.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">
        
        {/* Decoração de Fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <Input 
            label="Nome Completo do Aprendente" 
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            icon={<User className="h-5 w-5" />}
            placeholder="Ex: João da Silva"
            required
            disabled={loading || !!sucesso}
          />
          
          <Input 
            label="Data de Nascimento" 
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            icon={<Calendar className="h-5 w-5" />}
            required
            disabled={loading || !!sucesso}
          />
          
          <Input 
            label="Nome do Responsável Legal" 
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            icon={<Shield className="h-5 w-5" />}
            placeholder="Ex: Maria da Silva"
            required
            disabled={loading || !!sucesso}
          />
          
          <Input 
            label="Telefone / WhatsApp" 
            type="tel"
            value={contato}
            onChange={(e) => setContato(e.target.value)}
            icon={<Phone className="h-5 w-5" />}
            placeholder="(00) 00000-0000"
            required
            disabled={loading || !!sucesso}
          />
        </div>

        {/* Pop-ups Animados de Feedback */}
        {erro && (
          <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {erro}
          </div>
        )}

        {sucesso && (
          <div className="p-4 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> {sucesso}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Button type="submit" isLoading={loading} disabled={!!sucesso} className="w-full md:w-auto px-10 h-12 text-base">
            <UserPlus className="h-5 w-5 mr-2" /> Cadastrar
          </Button>
        </div>
      </form>
    </div>
  );
}