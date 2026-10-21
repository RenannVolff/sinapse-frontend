import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ARQUIVO_RELATORIO_RESP,
  BREAKPOINT_LG,
  LARGURAS,
  PASTA_RESULTADOS_RESP,
  ROTULO_CATEGORIA,
  chaveLargura,
  type Categoria,
  type ResultadoResponsividade,
} from './responsividade';

// Monta test-browser/relatorio-responsividade.md a partir dos JSON gravados
// por tela × largura. Só reescreve o relatório se a suíte rodou nesta execução.

const CATEGORIAS = Object.keys(ROTULO_CATEGORIA) as Categoria[];

// Problemas que continuam de propósito, com o motivo (por exemplo, quando a
// correção mudaria o desenho do desktop). Hoje não há nenhum.
const PENDENCIAS_MANTIDAS: { quando: (r: ResultadoResponsividade, detalhe: string) => boolean; motivo: string }[] = [];

function celula(texto: string): string {
  return texto.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function codigo(texto: string): string {
  return `\`${texto.replace(/`/g, "'")}\``;
}

export function gerarRelatorioResponsividade(): boolean {
  if (!fs.existsSync(PASTA_RESULTADOS_RESP)) return false;
  const arquivos = fs.readdirSync(PASTA_RESULTADOS_RESP).filter((a) => a.endsWith('.json')).sort();
  if (arquivos.length === 0) return false;

  const resultados = arquivos.map(
    (a) => JSON.parse(fs.readFileSync(path.join(PASTA_RESULTADOS_RESP, a), 'utf8')) as ResultadoResponsividade,
  );

  // Telas na ordem da suíte; cada uma com o resultado de cada largura.
  const telas = new Map<string, { tela: string; rota: string; ordem: number; porLargura: Map<number, ResultadoResponsividade> }>();
  for (const r of resultados) {
    const t = telas.get(r.slug) ?? { tela: r.tela, rota: r.rota, ordem: r.ordem, porLargura: new Map() };
    t.porLargura.set(r.largura, r);
    telas.set(r.slug, t);
  }
  const ordenadas = [...telas.entries()].sort((a, b) => a[1].ordem - b[1].ordem);

  const md: string[] = [];
  const agora = new Date();
  md.push('# Relatório de responsividade — Sinapse Edu');
  md.push('');
  md.push(
    `Gerado automaticamente por \`npm run test:browser\` (\`responsividade.spec.ts\`) em ${agora.toLocaleDateString('pt-BR')} às ` +
      `${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Chromium, larguras ` +
      `${LARGURAS.map((l) => codigo(chaveLargura(l))).join(', ')}. Dados exibidos fictícios, criados pela suíte no banco de teste.`,
  );
  md.push('');
  md.push('Em cada tela e largura a suíte confere:');
  md.push('');
  md.push('1. **Rolagem horizontal:** `scrollWidth <= clientWidth` no documento e no `<main>` do layout; lista os elementos que passam da borda (↳ = elemento mais interno).');
  md.push(`2. **Menu de navegação** (telas com o layout autenticado, abaixo de ${BREAKPOINT_LG}px): o botão existe — a falta dele **falha o teste** —, abre o painel (\`role="dialog"\`, \`aria-modal\`, \`aria-expanded\`), prende o foco, trava a rolagem, fecha com Esc devolvendo o foco ao botão, itens com 44px de altura; a partir de ${BREAKPOINT_LG}px o botão fica oculto. Um teste à parte clica em cada link do painel em cada largura.`);
  md.push('3. **Alvos interativos menores que 24×24 px** (WCAG 2.5.8), com as exceções de link dentro de texto e de espaçamento; o rótulo de checkbox/radio conta como parte do alvo.');
  md.push('4. **Modais** (ConfirmDialog e os modais da sessão ativa): a caixa cabe na janela e, se o conteúdo for maior, rola por dentro.');
  md.push('5. **Campos com fonte menor que 16 px** abaixo de 768px (o Safari do iOS dá zoom ao focar esses campos).');
  md.push('6. **Elementos cobertos** pelos botões do Sienna e do VLibras ou pelo banner de cookies: em nenhuma posição de rolagem o centro do elemento fica livre.');
  md.push('7. **Captura de tela inteira** em `test-browser/capturas/<tela>-<largura>.png`.');
  md.push('');
  md.push(
    '> Este relatório mostra o estado **depois dos ajustes de layout**; o estado anterior está congelado em ' +
      '[`relatorio-responsividade-inicial.md`](./relatorio-responsividade-inicial.md) e não deve ser regenerado.',
  );
  md.push('');
  md.push(
    'Telas públicas são medidas como no primeiro acesso, com o banner de cookies aberto; telas autenticadas, depois de o banner ' +
      'ser respondido, como no uso diário (mesma convenção da auditoria de acessibilidade).',
  );
  md.push('');

  // Totais por categoria
  const totais: Record<Categoria, number> = Object.fromEntries(CATEGORIAS.map((c) => [c, 0])) as Record<Categoria, number>;
  let combinacoesComProblema = 0;
  for (const r of resultados) {
    for (const p of r.problemas) totais[p.categoria]++;
    if (r.problemas.length) combinacoesComProblema++;
  }
  md.push('## Resumo');
  md.push('');
  md.push(`${resultados.length} combinações (tela × largura) medidas; ${combinacoesComProblema} com algum problema.`);
  md.push('');
  md.push('| Categoria | Ocorrências |');
  md.push('|---|---:|');
  for (const c of CATEGORIAS) md.push(`| ${ROTULO_CATEGORIA[c]} | ${totais[c]} |`);
  md.push(`| **Total** | **${CATEGORIAS.reduce((s, c) => s + totais[c], 0)}** |`);
  md.push('');

  md.push('## Tela × largura');
  md.push('');
  md.push('✅ = nenhum problema; número = ocorrências encontradas; — = não medida.');
  md.push('');
  md.push(`| Tela | Rota | ${LARGURAS.map((l) => l.largura).join(' | ')} |`);
  md.push(`|---|---|${LARGURAS.map(() => ':---:').join('|')}|`);
  for (const [, t] of ordenadas) {
    const cels = LARGURAS.map((l) => {
      const r = t.porLargura.get(l.largura);
      if (!r) return '—';
      return r.problemas.length ? `⚠️ ${r.problemas.length}` : '✅';
    });
    md.push(`| ${celula(t.tela)} | ${codigo(t.rota)} | ${cels.join(' | ')} |`);
  }
  md.push('');

  md.push('## Problemas por tela');
  md.push('');
  let algum = false;
  for (const [, t] of ordenadas) {
    const comProblema = LARGURAS.map((l) => t.porLargura.get(l.largura)).filter(
      (r): r is ResultadoResponsividade => !!r && r.problemas.length > 0,
    );
    if (comProblema.length === 0) continue;
    algum = true;
    md.push(`### ${t.tela} (${codigo(t.rota)})`);
    md.push('');
    for (const r of comProblema) {
      md.push(`- **${r.largura}×${r.altura}**`);
      for (const c of CATEGORIAS) {
        const doTipo = r.problemas.filter((p) => p.categoria === c);
        if (doTipo.length === 0) continue;
        md.push(`  - ${ROTULO_CATEGORIA[c]} (${doTipo.length}):`);
        for (const p of doTipo.slice(0, 12)) md.push(`    - ${codigo(p.detalhe)}`);
        if (doTipo.length > 12) md.push(`    - … e mais ${doTipo.length - 12}.`);
      }
    }
    md.push('');
  }
  if (!algum) {
    md.push('Nenhum problema encontrado em nenhuma combinação.');
    md.push('');
  }

  const mantidas = PENDENCIAS_MANTIDAS.map((p) => ({
    motivo: p.motivo,
    casos: resultados.flatMap((r) => r.problemas.filter((x) => p.quando(r, x.detalhe)).map((x) => `${r.tela} ${r.largura}×${r.altura}: ${x.detalhe}`)),
  })).filter((p) => p.casos.length > 0);
  if (mantidas.length) {
    md.push('## Pendências mantidas');
    md.push('');
    for (const p of mantidas) {
      md.push(`- **Motivo:** ${p.motivo}`);
      for (const c of p.casos) md.push(`  - ${codigo(c)}`);
    }
    md.push('');
  }

  md.push('## O que foi conferido');
  md.push('');
  for (const [, t] of ordenadas) {
    const notas = [...new Set([...t.porLargura.values()].flatMap((r) => r.notas))];
    if (notas.length === 0) continue;
    md.push(`- **${t.tela}:** ${notas.join('; ')}`);
  }
  md.push('');

  fs.writeFileSync(ARQUIVO_RELATORIO_RESP, md.join('\n'));
  return true;
}
