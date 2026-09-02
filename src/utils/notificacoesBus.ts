const EVENTO_ATUALIZAR_NOTIFICACOES = 'sinapse:notificacoes:atualizar';

/** Dispara para que qualquer painel de notificações montado refaça a busca imediatamente. */
export function dispararAtualizacaoNotificacoes() {
  window.dispatchEvent(new CustomEvent(EVENTO_ATUALIZAR_NOTIFICACOES));
}

/** Inscreve um callback no evento de atualização de notificações; retorna a função de limpeza. */
export function ouvirAtualizacaoNotificacoes(callback: () => void): () => void {
  window.addEventListener(EVENTO_ATUALIZAR_NOTIFICACOES, callback);
  return () => window.removeEventListener(EVENTO_ATUALIZAR_NOTIFICACOES, callback);
}
