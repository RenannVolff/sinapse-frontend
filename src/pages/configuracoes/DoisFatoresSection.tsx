import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { ShieldCheck, ShieldOff, Smartphone, KeyRound, Copy, AlertTriangle, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { getErrorMessage, getSafeErrorLog } from '../../services/apiError';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type Etapa = 'inativo' | 'configurando' | 'codigosBackup' | 'ativo';

interface GerarSegredoResponse {
  segredo: string;
  qrCodeBase64: string;
}

interface AtivarResponse {
  codigosBackup: string[];
}

export function DoisFatoresSection() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [etapa, setEtapa] = useState<Etapa>(user?.duploFatorAtivo ? 'ativo' : 'inativo');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [segredo, setSegredo] = useState<GerarSegredoResponse | null>(null);
  const [codigo, setCodigo] = useState('');
  const [codigosBackup, setCodigosBackup] = useState<string[]>([]);

  const [dialogDesativarAberto, setDialogDesativarAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [erroDesativar, setErroDesativar] = useState('');

  // Os códigos de backup não podem ser recuperados depois: avisa antes de
  // recarregar/fechar a aba enquanto ainda não foram confirmados como salvos.
  useEffect(() => {
    if (etapa !== 'codigosBackup') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [etapa]);

  const marcarDuploFator = (ativo: boolean) => {
    if (user) updateUser({ ...user, duploFatorAtivo: ativo });
  };

  const handleGerar = () => {
    setLoading(true);
    setErro('');

    api.post<GerarSegredoResponse>('/auth/2fa/gerar')
      .then((response) => {
        setSegredo(response.data);
        setCodigo('');
        setEtapa('configurando');
      })
      .catch((err: unknown) => {
        // 409: o 2FA já estava ativo (ex: ativado em outro dispositivo).
        if (isAxiosError(err) && err.response?.status === 409) {
          marcarDuploFator(true);
          setEtapa('ativo');
          return;
        }
        console.error('[DoisFatores] Erro ao gerar segredo:', getSafeErrorLog(err));
        setErro(getErrorMessage(err, 'Não foi possível iniciar a configuração. Tente novamente.'));
      })
      .finally(() => setLoading(false));
  };

  const handleAtivar = (e: FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!/^\d{6}$/.test(codigo.trim())) {
      setErro('O código deve ter 6 dígitos.');
      return;
    }

    setLoading(true);

    api.post<AtivarResponse>('/auth/2fa/ativar', { codigo: codigo.trim() })
      .then((response) => {
        setCodigosBackup(response.data.codigosBackup);
        setSegredo(null);
        setCodigo('');
        marcarDuploFator(true);
        setEtapa('codigosBackup');
      })
      .catch((err: unknown) => {
        console.error('[DoisFatores] Erro ao ativar:', getSafeErrorLog(err));
        setErro(getErrorMessage(err, 'Código inválido. Tente novamente.'));
      })
      .finally(() => setLoading(false));
  };

  const handleCancelarConfiguracao = () => {
    setSegredo(null);
    setCodigo('');
    setErro('');
    setEtapa('inativo');
  };

  const handleCopiarCodigos = () => {
    navigator.clipboard.writeText(codigosBackup.join('\n'))
      .then(() => showSuccess('Códigos de backup copiados.'))
      .catch(() => showError('Não foi possível copiar. Anote os códigos manualmente.'));
  };

  const handleConfirmarCodigosSalvos = () => {
    setCodigosBackup([]);
    setEtapa('ativo');
    showSuccess('Autenticação de dois fatores ativada.');
  };

  const fecharDialogDesativar = () => {
    setDialogDesativarAberto(false);
    setSenhaAtual('');
    setErroDesativar('');
  };

  const handleDesativar = () => {
    if (!senhaAtual) {
      setErroDesativar('Informe sua senha atual.');
      return;
    }

    setLoading(true);
    setErroDesativar('');

    api.post('/auth/2fa/desativar', { senha: senhaAtual })
      .then(() => {
        marcarDuploFator(false);
        fecharDialogDesativar();
        setEtapa('inativo');
        showSuccess('Autenticação de dois fatores desativada.');
      })
      .catch((err: unknown) => {
        console.error('[DoisFatores] Erro ao desativar:', getSafeErrorLog(err));
        setErroDesativar(getErrorMessage(err, 'Não foi possível desativar. Tente novamente.'));
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border border-primary-light shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-text-primary border-b border-primary-light pb-2 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        Autenticação de dois fatores
      </h3>

      {etapa === 'inativo' && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Adicione uma camada extra de proteção à sua conta: além da senha, será pedido um código
            gerado por um app autenticador (Google Authenticator, Microsoft Authenticator, Authy etc.).
          </p>
          <Button onClick={handleGerar} isLoading={loading} className="w-full md:w-auto px-6">
            <ShieldCheck className="h-4 w-4" />
            Ativar autenticação de dois fatores
          </Button>
        </div>
      )}

      {etapa === 'configurando' && segredo && (
        <form onSubmit={handleAtivar} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
            <div className="flex justify-center">
              <img
                src={segredo.qrCodeBase64}
                alt="QR code para configurar o app autenticador"
                className="h-44 w-44 rounded-lg border border-primary-light p-2 bg-white"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <Smartphone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold text-text-primary">1.</span> Escaneie o QR code com o seu app autenticador.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-text-secondary">
                  Não consegue escanear? Digite esta chave manualmente no app:
                </p>
                <code className="block w-full break-all bg-background border border-primary-light rounded-lg px-3 py-2 text-sm font-mono font-bold text-text-primary tracking-wider select-all">
                  {segredo.segredo}
                </code>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <KeyRound className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold text-text-primary">2.</span> Digite o código de 6 dígitos exibido no app para confirmar.
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Código do app autenticador"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            icon={<KeyRound className="h-5 w-5" />}
            className="tracking-[0.3em] font-bold"
            required
          />

          {erro && (
            <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-5 w-5 flex-shrink-0" /> {erro}
            </div>
          )}

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t border-primary-light">
            <Button type="button" variant="outline" onClick={handleCancelarConfiguracao} disabled={loading} className="w-full md:w-auto px-6">
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading} className="w-full md:w-auto px-6">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar e ativar
            </Button>
          </div>
        </form>
      )}

      {etapa === 'codigosBackup' && (
        <div className="space-y-5">
          <div className="p-4 bg-amber-50 text-amber-800 text-sm font-medium rounded-lg border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Salve estes códigos de backup agora.</span> Eles não serão exibidos
              novamente. Cada código pode ser usado uma única vez para entrar caso você perca acesso ao app
              autenticador.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-3 p-5 bg-background border-2 border-dashed border-primary rounded-xl">
            {codigosBackup.map((c) => (
              <li key={c} className="font-mono text-lg font-bold text-text-primary tracking-widest text-center select-all">
                {c}
              </li>
            ))}
          </ul>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t border-primary-light">
            <Button type="button" variant="outline" onClick={handleCopiarCodigos} className="w-full md:w-auto px-6">
              <Copy className="h-4 w-4" />
              Copiar códigos
            </Button>
            <Button type="button" onClick={handleConfirmarCodigosSalvos} className="w-full md:w-auto px-6">
              <CheckCircle2 className="h-4 w-4" />
              Já salvei meus códigos
            </Button>
          </div>
        </div>
      )}

      {etapa === 'ativo' && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 text-green-700 text-sm font-bold rounded-lg border border-green-200 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            Autenticação de dois fatores está ativa.
          </div>
          <p className="text-sm text-text-secondary">
            Ao entrar, será pedido o código do seu app autenticador (ou um código de backup).
          </p>
          <Button
            variant="outline"
            onClick={() => setDialogDesativarAberto(true)}
            className="w-full md:w-auto px-6 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <ShieldOff className="h-4 w-4" />
            Desativar
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={dialogDesativarAberto}
        title="Desativar 2FA?"
        description="Sua conta voltará a ser protegida apenas pela senha. Confirme sua senha atual para continuar."
        confirmLabel="Desativar"
        loading={loading}
        confirmDisabled={!senhaAtual}
        onConfirm={handleDesativar}
        onCancel={fecharDialogDesativar}
      >
        <div className="space-y-3">
          <Input
            label="Senha atual"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleDesativar(); }}
            autoComplete="current-password"
            icon={<Lock className="h-5 w-5" />}
            autoFocus
            error={erroDesativar || undefined}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
