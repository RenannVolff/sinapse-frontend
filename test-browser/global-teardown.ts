import { limparDadosDaSuite } from './support/banco';
import { ARQUIVO_RELATORIO_A11Y } from './support/ambiente';
import { gerarRelatorioAcessibilidade } from './support/relatorio-a11y';
import { ARQUIVO_RELATORIO_RESP } from './support/responsividade';
import { gerarRelatorioResponsividade } from './support/relatorio-responsividade';

// Monta os relatórios de acessibilidade e de responsividade (os que rodaram)
// e apaga do banco de teste tudo o que a suíte criou.
export default async function globalTeardown(): Promise<void> {
  if (gerarRelatorioAcessibilidade()) {
    console.log(`\n[test:browser] Relatório de acessibilidade: ${ARQUIVO_RELATORIO_A11Y}`);
  }
  if (gerarRelatorioResponsividade()) {
    console.log(`[test:browser] Relatório de responsividade: ${ARQUIVO_RELATORIO_RESP}`);
  }

  const removidos = await limparDadosDaSuite();
  console.log(`[test:browser] Limpeza: ${removidos} usuário(s) da suíte e seus dados removidos do banco de teste.`);
}
