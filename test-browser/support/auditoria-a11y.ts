import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { PASTA_RESULTADOS_A11Y } from './ambiente';

// Roda o axe-core numa tela, separa o que é do sistema do que é de widget
// de terceiros e grava o resultado em JSON (um arquivo por tela). O
// relatório em Markdown é montado no global teardown a partir desses
// arquivos, então um teste que falhe no meio não apaga o das outras telas.

const require = createRequire(import.meta.url);
export const VERSAO_AXE: string = require('axe-core/package.json').version;

// O AxeBuilder não expõe axe.configure, então o locale vai junto do código
// do axe injetado na página: textos de ajuda e "como corrigir" em pt-BR.
const FONTE_AXE_PT_BR =
  fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') +
  `\n;axe.configure({ locale: ${fs.readFileSync(require.resolve('axe-core/locales/pt_BR.json'), 'utf8')} });`;

export const TAGS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Raízes dos widgets de terceiros injetados no DOM. Ficam fora do código do
// sistema, então o que o axe achar dentro delas vai para uma seção própria.
export const WIDGETS_TERCEIROS: { nome: string; seletor: string }[] = [
  { nome: 'Banner de cookies (vanilla-cookieconsent)', seletor: '#cc-main' },
  { nome: 'VLibras', seletor: '[vw], #vlibras-access-wrapper, [vw-access-button], [vw-plugin-wrapper]' },
  { nome: 'Sienna (menu de acessibilidade)', seletor: '.asw-widget, .asw-menu, [class*="asw-"]' },
];

export type Impacto = 'critical' | 'serious' | 'moderate' | 'minor';

export interface NoViolacao {
  alvo: string;
  html: string;
  resumoFalha: string;
  widget?: string;
}

export interface Violacao {
  regra: string;
  impacto: Impacto;
  ajuda: string;
  descricao: string;
  urlAjuda: string;
  criterios: string[];
  nos: NoViolacao[];
}

export interface ResultadoTela {
  tipo: 'axe';
  ordem: number;
  tela: string;
  url: string;
  sistema: Violacao[];
  terceiros: Violacao[];
  regrasAprovadas: number;
  regrasIncompletas: number;
}

export interface ParadaTeclado {
  descricao: string;
  focoVisivel: boolean;
  widget?: string;
}

export interface ResultadoTeclado {
  tipo: 'teclado';
  ordem: number;
  tela: string;
  ordemEsperada: string[];
  ordemObtida: string[];
  // Elemento para onde o Tab voltou ao fechar o ciclo (ausente se o foco
  // saiu da página ou o limite de paradas acabou antes).
  cicloPara?: string;
  paradas: ParadaTeclado[];
}

// "wcag143" → "1.4.3"; "wcag2a" etc. são níveis, não critérios.
function criteriosWcag(tags: string[]): string[] {
  return tags
    .filter((t) => /^wcag\d{3,4}$/.test(t))
    .map((t) => {
      const d = t.replace('wcag', '');
      return `${d[0]}.${d[1]}.${d.slice(2)}`;
    });
}

function nomeArquivo(ordem: number, tela: string): string {
  const slug = tela
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return path.join(PASTA_RESULTADOS_A11Y, `${String(ordem).padStart(2, '0')}-${slug}.json`);
}

export function gravarResultado(resultado: ResultadoTela | ResultadoTeclado): void {
  fs.mkdirSync(PASTA_RESULTADOS_A11Y, { recursive: true });
  fs.writeFileSync(nomeArquivo(resultado.ordem, resultado.tela), JSON.stringify(resultado, null, 2));
}

// Para cada nó, descobre se o elemento está dentro de um widget de terceiro.
// O primeiro seletor do alvo é sempre do documento principal (host de shadow
// DOM ou iframe, quando houver), então `closest` nele basta.
async function classificarNos(page: Page, alvos: string[]): Promise<(string | null)[]> {
  return page.evaluate(
    ({ alvos, widgets }) =>
      alvos.map((alvo) => {
        let el: Element | null = null;
        try {
          el = document.querySelector(alvo);
        } catch {
          el = null;
        }
        for (const w of widgets) {
          if (el?.closest(w.seletor)) return w.nome;
        }
        return null;
      }),
    { alvos, widgets: WIDGETS_TERCEIROS },
  );
}

// Plano B quando o elemento já saiu do DOM: pistas no seletor/HTML.
function widgetPorTexto(alvo: string, html: string): string | null {
  const texto = `${alvo} ${html}`;
  if (/#cc-main|\bcm__|\bpm__|cc-/.test(texto)) return WIDGETS_TERCEIROS[0].nome;
  if (/\[vw|vw-|vlibras/i.test(texto)) return WIDGETS_TERCEIROS[1].nome;
  if (/asw-/.test(texto)) return WIDGETS_TERCEIROS[2].nome;
  return null;
}

export async function auditarTela(page: Page, ordem: number, tela: string): Promise<ResultadoTela> {
  const resultados = await new AxeBuilder({ page, axeSource: FONTE_AXE_PT_BR })
    .withTags(TAGS_WCAG)
    .analyze();

  const sistema: Violacao[] = [];
  const terceiros: Violacao[] = [];

  for (const v of resultados.violations) {
    const alvos = v.nodes.map((n) => n.target.map((t) => (Array.isArray(t) ? t.join(' >>> ') : t))[0]);
    const widgets = await classificarNos(page, alvos);

    const base = {
      regra: v.id,
      impacto: (v.impact ?? 'minor') as Impacto,
      ajuda: v.help,
      descricao: v.description,
      urlAjuda: v.helpUrl,
      criterios: criteriosWcag(v.tags),
    };
    const nosSistema: NoViolacao[] = [];
    const nosTerceiros: NoViolacao[] = [];

    v.nodes.forEach((n, i) => {
      const alvoCompleto = n.target.map((t) => (Array.isArray(t) ? t.join(' >>> ') : t)).join(' → ');
      const widget = widgets[i] ?? widgetPorTexto(alvoCompleto, n.html);
      // E-mails gerados pela suíte (prefixo.<timestamp>.<aleatório>) mudam a
      // cada execução; mascarados, o relatório fica igual entre execuções.
      const html = n.html.replace(/\.\d{10,}\.\d*/g, '.<id>');
      const no: NoViolacao = {
        alvo: alvoCompleto,
        html: html.length > 220 ? `${html.slice(0, 220)}…` : html,
        resumoFalha: n.failureSummary ?? '',
      };
      if (widget) nosTerceiros.push({ ...no, widget });
      else nosSistema.push(no);
    });

    if (nosSistema.length) sistema.push({ ...base, nos: nosSistema });
    if (nosTerceiros.length) terceiros.push({ ...base, nos: nosTerceiros });
  }

  const resultado: ResultadoTela = {
    tipo: 'axe',
    ordem,
    tela,
    // IDs (UUID) viram ":id", para o relatório não mudar a cada execução.
    url: new URL(page.url()).pathname.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id'),
    sistema,
    terceiros,
    regrasAprovadas: resultados.passes.length,
    regrasIncompletas: resultados.incomplete.length,
  };
  gravarResultado(resultado);
  return resultado;
}
