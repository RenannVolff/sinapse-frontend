import * as fs from 'node:fs';
import * as path from 'node:path';
import { ARQUIVO_RELATORIO_A11Y, PASTA_RESULTADOS_A11Y } from './ambiente';
import {
  TAGS_WCAG,
  VERSAO_AXE,
  type Impacto,
  type ResultadoTeclado,
  type ResultadoTela,
  type Violacao,
} from './auditoria-a11y';

// Monta test-browser/relatorio-acessibilidade.md a partir dos JSON gravados
// por tela. Só reescreve o relatório se a auditoria rodou nesta execução.

const IMPACTOS: Impacto[] = ['critical', 'serious', 'moderate', 'minor'];
const ROTULO_IMPACTO: Record<Impacto, string> = {
  critical: 'Crítico',
  serious: 'Sério',
  moderate: 'Moderado',
  minor: 'Menor',
};

function celula(texto: string): string {
  return texto.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function codigo(texto: string): string {
  // Crases dentro do trecho quebrariam o inline code do Markdown.
  return `\`${texto.replace(/`/g, "'")}\``;
}

// "Corrija qualquer um dos itens a seguir:\n  a\n  b" → "a; b"
function comoCorrigir(v: Violacao): string {
  const resumo = v.nos[0]?.resumoFalha ?? '';
  const linhas = resumo
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const cabecalho = linhas[0]?.endsWith(':') ? linhas.shift() : undefined;
  const itens = linhas.join('; ');
  return `${cabecalho ? `${cabecalho} ` : ''}${itens}`.trim();
}

function contarPorImpacto(telas: ResultadoTela[], campo: 'sistema' | 'terceiros') {
  const regras: Record<Impacto, Set<string>> = { critical: new Set(), serious: new Set(), moderate: new Set(), minor: new Set() };
  const ocorrencias: Record<Impacto, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const porTela: Record<Impacto, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const t of telas) {
    for (const v of t[campo]) {
      regras[v.impacto].add(v.regra);
      ocorrencias[v.impacto] += v.nos.length;
      porTela[v.impacto] += 1;
    }
  }
  return { regras, ocorrencias, porTela };
}

function tabelaResumo(telas: ResultadoTela[], campo: 'sistema' | 'terceiros'): string[] {
  const { regras, ocorrencias, porTela } = contarPorImpacto(telas, campo);
  const linhas = [
    '| Impacto | Regras distintas | Violações (regra × tela) | Elementos afetados |',
    '|---|---:|---:|---:|',
  ];
  let totalRegras = new Set<string>();
  let totalTela = 0;
  let totalOcorrencias = 0;
  for (const i of IMPACTOS) {
    linhas.push(`| ${ROTULO_IMPACTO[i]} | ${regras[i].size} | ${porTela[i]} | ${ocorrencias[i]} |`);
    totalRegras = new Set([...totalRegras, ...regras[i]]);
    totalTela += porTela[i];
    totalOcorrencias += ocorrencias[i];
  }
  linhas.push(`| **Total** | **${totalRegras.size}** | **${totalTela}** | **${totalOcorrencias}** |`);
  return linhas;
}

function secaoViolacoes(v: Violacao, mostrarWidget: boolean): string[] {
  const linhas: string[] = [];
  linhas.push(`#### ${codigo(v.regra)} — ${ROTULO_IMPACTO[v.impacto]}`);
  linhas.push('');
  linhas.push(`- **Problema:** ${v.ajuda}.`);
  if (v.criterios.length) linhas.push(`- **Critério(s) WCAG:** ${v.criterios.join(', ')}`);
  linhas.push(`- **Como corrigir:** ${comoCorrigir(v)} ([referência](${v.urlAjuda}))`);
  linhas.push(`- **Elementos (${v.nos.length}):**`);
  const limite = 8;
  for (const no of v.nos.slice(0, limite)) {
    const widget = mostrarWidget && no.widget ? ` _(${no.widget})_` : '';
    linhas.push(`  - ${codigo(no.alvo)}${widget} — ${codigo(no.html)}`);
  }
  if (v.nos.length > limite) linhas.push(`  - … e mais ${v.nos.length - limite} elemento(s).`);
  linhas.push('');
  return linhas;
}

function ordenar(violacoes: Violacao[]): Violacao[] {
  return [...violacoes].sort((a, b) => IMPACTOS.indexOf(a.impacto) - IMPACTOS.indexOf(b.impacto) || a.regra.localeCompare(b.regra));
}

export function gerarRelatorioAcessibilidade(): boolean {
  if (!fs.existsSync(PASTA_RESULTADOS_A11Y)) return false;
  const arquivos = fs.readdirSync(PASTA_RESULTADOS_A11Y).filter((a) => a.endsWith('.json')).sort();
  if (arquivos.length === 0) return false;

  const lidos = arquivos.map((a) => JSON.parse(fs.readFileSync(path.join(PASTA_RESULTADOS_A11Y, a), 'utf8')) as ResultadoTela | ResultadoTeclado);
  const telas = lidos.filter((r): r is ResultadoTela => r.tipo === 'axe').sort((a, b) => a.ordem - b.ordem);
  const teclado = lidos.filter((r): r is ResultadoTeclado => r.tipo === 'teclado').sort((a, b) => a.ordem - b.ordem);

  const md: string[] = [];
  const agora = new Date();
  md.push('# Relatório de acessibilidade — Sinapse Edu');
  md.push('');
  md.push(
    `Gerado automaticamente por \`npm run test:browser\` em ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. ` +
      `Ferramenta: axe-core ${VERSAO_AXE} (via @axe-core/playwright, textos em pt-BR), Chromium, viewport 1280×800. ` +
      `Regras: tags ${TAGS_WCAG.map(codigo).join(', ')} (WCAG 2.2 nível AA).`,
  );
  md.push('');
  md.push(
    'Telas públicas (login, cadastro, esqueci a senha) são auditadas como no primeiro acesso, com o banner de ' +
      'cookies aberto; é nelas que o banner entra na análise. Telas autenticadas são auditadas depois de o banner ' +
      'ser respondido ("Rejeitar não essenciais"), como o usuário as vê no dia a dia: com o banner aberto o axe ' +
      'deixa de reportar ao menos uma regra do sistema (verificado na auditoria inicial com `aria-hidden-focus` em ' +
      'Relatórios). Os dados exibidos ' +
      '(aprendente, sessões, molde de PEI) são fictícios, criados pela própria suíte no banco de teste.',
  );
  md.push('');
  md.push(
    '> Este relatório mostra o estado **depois das correções**; o estado anterior, sem nenhuma correção, está ' +
      'congelado em [`relatorio-acessibilidade-inicial.md`](./relatorio-acessibilidade-inicial.md). Testes automáticos detectam ' +
      'uma parte das barreiras (em geral estimada entre 30% e 50%); leitor de tela, zoom de 200% e uso real ' +
      'continuam necessários para uma avaliação completa.',
  );
  md.push('');

  md.push('## Resumo — sistema');
  md.push('');
  md.push(...tabelaResumo(telas, 'sistema'));
  md.push('');
  md.push('"Violações (regra × tela)" conta uma regra uma vez por tela em que aparece; telas com o mesmo layout (cabeçalho, menu lateral) repetem as mesmas regras.');
  md.push('');

  md.push('### Por tela');
  md.push('');
  md.push('| Tela | Rota | Crítico | Sério | Moderado | Menor | Elementos | Regras aprovadas |');
  md.push('|---|---|---:|---:|---:|---:|---:|---:|');
  for (const t of telas) {
    const n = (i: Impacto) => t.sistema.filter((v) => v.impacto === i).length;
    const elementos = t.sistema.reduce((s, v) => s + v.nos.length, 0);
    md.push(`| ${celula(t.tela)} | ${codigo(t.url)} | ${n('critical')} | ${n('serious')} | ${n('moderate')} | ${n('minor')} | ${elementos} | ${t.regrasAprovadas} |`);
  }
  md.push('');

  md.push('## Violações do sistema por tela');
  md.push('');
  for (const t of telas) {
    md.push(`### ${t.tela} (${codigo(t.url)})`);
    md.push('');
    if (t.sistema.length === 0) {
      md.push('Nenhuma violação automática encontrada.');
      md.push('');
      continue;
    }
    md.push('| Regra | Impacto | Elementos | Como corrigir |');
    md.push('|---|---|---:|---|');
    for (const v of ordenar(t.sistema)) {
      md.push(`| ${codigo(v.regra)} | ${ROTULO_IMPACTO[v.impacto]} | ${v.nos.length} | ${celula(v.ajuda)} |`);
    }
    md.push('');
    for (const v of ordenar(t.sistema)) md.push(...secaoViolacoes(v, false));
  }

  md.push('## Navegação só por teclado');
  md.push('');
  md.push(
    'A partir do carregamento da página, a tecla Tab é pressionada repetidamente. Para cada parada registra-se o ' +
      'elemento focado e se há indicador de foco visível (o estilo calculado do elemento muda ao receber foco: ' +
      'outline, sombra/anel, borda ou fundo). Critérios WCAG 2.1.1, 2.4.3 e 2.4.7.',
  );
  md.push('');
  md.push(
    '**Banner de cookies (decisão mantida):** enquanto o banner do vanilla-cookieconsent está aberto, o Tab ' +
      'percorre os campos da tela e depois fica circulando dentro do banner, sem voltar ao início da página, até o ' +
      'usuário aceitar, rejeitar ou gerenciar as preferências. O comportamento é do widget e não foi alterado: o ' +
      'consentimento precisa de uma resposta explícita, e depois dela o foco volta a circular normalmente.',
  );
  md.push('');
  for (const k of teclado) {
    const ordemOk = JSON.stringify(k.ordemObtida) === JSON.stringify(k.ordemEsperada);
    const semFoco = k.paradas.filter((p) => !p.widget && !p.focoVisivel);
    md.push(`### ${k.tela}`);
    md.push('');
    md.push(`- **Ordem dos campos:** ${ordemOk ? 'correta' : 'DIFERENTE da esperada'} — ${k.ordemObtida.map(codigo).join(' → ')}`);
    if (!ordemOk) md.push(`  - Esperada: ${k.ordemEsperada.map(codigo).join(' → ')}`);
    md.push(`- **Foco visível:** ${semFoco.length === 0 ? 'presente em todas as paradas do sistema' : `ausente em ${semFoco.length} parada(s)`}`);
    if (k.cicloPara) {
      const ultima = k.paradas[k.paradas.length - 1];
      const preso = ultima?.widget && k.paradas.find((p) => p.descricao === k.cicloPara)?.widget === ultima.widget;
      md.push(
        `- **Ciclo do Tab:** depois da parada ${k.paradas.length}, o foco volta para ${codigo(k.cicloPara)}` +
          (preso ? ` — o foco fica preso dentro do widget "${ultima.widget}" até o usuário agir nele.` : '.'),
      );
    }
    md.push('');
    md.push('| # | Elemento focado | Foco visível | Origem |');
    md.push('|---:|---|---|---|');
    k.paradas.forEach((p, i) => {
      md.push(`| ${i + 1} | ${celula(p.descricao)} | ${p.focoVisivel ? 'sim' : '**não**'} | ${p.widget ?? 'sistema'} |`);
    });
    md.push('');
  }

  md.push('## Widgets de terceiros (fora do código do sistema)');
  md.push('');
  md.push(
    'Violações encontradas dentro do Sienna (menu de acessibilidade), do VLibras e do banner de cookies ' +
      '(vanilla-cookieconsent). São componentes externos: a correção depende do fornecedor, de configuração ' +
      'ou de substituição, não do código das telas. Ficam separadas para não distorcer os números do sistema.',
  );
  md.push('');
  md.push(...tabelaResumo(telas, 'terceiros'));
  md.push('');

  // Os widgets são iguais em todas as telas: agrupa por regra+widget e lista
  // em quais telas apareceram, em vez de repetir tudo por tela.
  const agrupado = new Map<string, { v: Violacao; widget: string; telas: string[] }>();
  for (const t of telas) {
    for (const v of t.terceiros) {
      const porWidget = new Map<string, Violacao>();
      for (const no of v.nos) {
        const w = no.widget ?? 'Desconhecido';
        const atual = porWidget.get(w) ?? { ...v, nos: [] };
        atual.nos.push(no);
        porWidget.set(w, atual);
      }
      for (const [widget, vw] of porWidget) {
        const chave = `${widget}::${v.regra}`;
        const existente = agrupado.get(chave);
        if (existente) {
          existente.telas.push(t.tela);
          if (vw.nos.length > existente.v.nos.length) existente.v = vw;
        } else {
          agrupado.set(chave, { v: vw, widget, telas: [t.tela] });
        }
      }
    }
  }
  const widgets = [...new Set([...agrupado.values()].map((a) => a.widget))].sort();
  if (widgets.length === 0) {
    md.push('Nenhuma violação encontrada nos widgets de terceiros.');
    md.push('');
  }
  for (const w of widgets) {
    md.push(`### ${w}`);
    md.push('');
    const itens = [...agrupado.values()]
      .filter((a) => a.widget === w)
      .sort((a, b) => IMPACTOS.indexOf(a.v.impacto) - IMPACTOS.indexOf(b.v.impacto) || a.v.regra.localeCompare(b.v.regra));
    md.push('| Regra | Impacto | Elementos (máx. por tela) | Telas |');
    md.push('|---|---|---:|---|');
    for (const a of itens) {
      const telasTxt = a.telas.length === telas.length ? 'todas' : a.telas.join(', ');
      md.push(`| ${codigo(a.v.regra)} | ${ROTULO_IMPACTO[a.v.impacto]} | ${a.v.nos.length} | ${celula(telasTxt)} |`);
    }
    md.push('');
    for (const a of itens) md.push(...secaoViolacoes(a.v, false));
  }

  fs.writeFileSync(ARQUIVO_RELATORIO_A11Y, md.join('\n'));
  return true;
}
