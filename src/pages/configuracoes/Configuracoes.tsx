import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Save, LogOut, CheckCircle2, AlertCircle, Info, KeyRound } from 'lucide-react';
import { isAxiosError } from 'axios';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface UpdatePayload {
  nome?: string;
  email?: string;
  senha?: string;
}

export function Configuracoes() {
  const { user, signOut, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const handleSalvar = (e: FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setErro('Sessão inválida. Faça login novamente.');
      return;
    }

    setErro('');
    setSucesso('');
    setAviso('');

    // Se o usuário digitou algo no campo de senha, torna a validação obrigatória
    if (novaSenha.length > 0 || confirmarSenha.length > 0) {
      if (novaSenha.length < 6) {
        setErro('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (novaSenha !== confirmarSenha) {
        setErro('As senhas não coincidem. Verifique a digitação.');
        return;
      }
    }

    const payload: UpdatePayload = {};
    
    if (nome.trim() !== '' && nome !== user.nome) payload.nome = nome.trim();
    if (email.trim() !== '' && email !== user.email) payload.email = email.trim();
    if (novaSenha.trim() !== '') payload.senha = novaSenha.trim();

    if (Object.keys(payload).length === 0) {
      setAviso('Nenhuma alteração foi detectada para salvar.');
      return;
    }

    setLoading(true);

    api.patch(`/usuarios/${user.id}`, payload)
      .then((response) => {
        setSucesso('Perfil atualizado com sucesso!');
        // Limpa os campos de senha após o sucesso
        setNovaSenha('');
        setConfirmarSenha('');
        
        // Atualiza o estado global instantaneamente
        updateUser({
          id: user.id,
          nome: response.data.nome,
          email: response.data.email
        });

        setTimeout(() => setSucesso(''), 4000);
      })
      .catch((err: unknown) => {
        console.error('Erro ao atualizar perfil:', err);
        if (isAxiosError(err) && err.response?.data?.message) {
          const msg = err.response.data.message;
          setErro(Array.isArray(msg) ? msg[0] : msg);
        } else {
          setErro('Erro interno no servidor ao tentar salvar os dados.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Minha Conta
          </h1>
          <p className="text-gray-500">Gerencie suas informações pessoais e credenciais.</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-auto px-6 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
          <LogOut className="h-4 w-4 mr-2" />
          Sair do Sistema
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="h-24 w-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center text-primary mb-4 shadow-inner border border-blue-100">
              <User className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user?.nome || 'Profissional'}</h2>
            <p className="text-sm text-gray-500 font-medium break-all">{user?.email}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" /> Conta Autenticada
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSalvar} className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              Dados Cadastrais
            </h3>

            <div className="space-y-5">
              <Input 
                label="Nome Completo" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                icon={<User className="h-5 w-5" />} 
                required
              />
              <Input 
                label="E-mail de Acesso (Login)" 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-5 w-5" />} 
                required
              />
            </div>

            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mt-8">
              Segurança (Alteração de Senha)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input 
                label="Nova Senha" 
                type="password" 
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mín. 6 caracteres" 
                icon={<KeyRound className="h-5 w-5" />} 
              />
              
              <Input 
                label="Confirmar Nova Senha" 
                type="password" 
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha" 
                icon={<Shield className="h-5 w-5" />} 
              />
            </div>
            
            <p className="text-xs text-gray-400 mt-1">
              * Deixe os campos de senha em branco caso não deseje alterá-la.
            </p>

            {aviso && (
              <div className="p-4 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 flex items-center gap-2 animate-in fade-in">
                <Info className="h-5 w-5 flex-shrink-0" /> {aviso}
              </div>
            )}
            {sucesso && (
              <div className="p-4 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> {sucesso}
              </div>
            )}
            {erro && (
              <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="h-5 w-5 flex-shrink-0" /> {erro}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
              <Button type="submit" isLoading={loading} className="w-full md:w-auto px-8">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}