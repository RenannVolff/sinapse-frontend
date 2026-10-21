import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { PASTA_ESTADO, PASTA_SUITE } from './ambiente';
import { WIDGETS_TERCEIROS } from './auditoria-a11y';

// Medições de responsividade feitas dentro da página (scroll horizontal,
// alvos pequenos, fonte de campos, elementos sob os botões flutuantes e
// modais) e a gravação por tela × largura em JSON. O relatório em Markdown
// é montado no global teardown a partir desses arquivos, como o de
// acessibilidade.

export const PASTA_RESULTADOS_RESP = path.join(PASTA_ESTADO, 'responsividade');
export const PASTA_CAPTURAS = path.join(PASTA_SUITE, 'capturas');
export const ARQUIVO_RELATORIO_RESP = path.join(PASTA_SUITE, 'relatorio-responsividade.md');

export interface Largura {
  largura: number;
  altura: number;
}

export const LARGURAS: Largura[] = [
  { largura: 320, altura: 568 },
  { largura: 360, altura: 740 },
  { largura: 390, altura: 844 },
  { largura: 768, altura: 1024 },
  { largura: 1024, altura: 768 },
  { largura: 1366, altura: 768 },
  { largura: 1920, altura: 1080 },
];

// Breakpoint lg do Tailwind: daqui para cima vale a Sidebar fixa.
export const BREAKPOINT_LG = 1024;
// Abaixo do md (768) conta como celular para a regra dos 16px do iOS.
export const BREAKPOINT_MD = 768;
export const ALVO_MINIMO = 24; // WCAG 2.5.8 (AA)
export const ALVO_TOQUE_MENU = 44;
export const FONTE_MINIMA_CAMPO = 16;

export type Categoria = 'rolagem' | 'menu' | 'alvo' | 'modal' | 'fonte' | 'coberto';

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  rolagem: 'Rolagem horizontal',
  menu: 'Menu de navegação',
  alvo: 'Alvo interativo < 24×24 px',
  modal: 'Modal não cabe na tela',
  fonte: 'Campo com fonte < 16 px',
  coberto: 'Coberto por botão flutuante/banner',
};

export interface Problema {
  categoria: Categoria;
  detalhe: string;
}

export interface ResultadoResponsividade {
  ordem: number;
  tela: string;
  slug: string;
  rota: string;
  largura: number;
  altura: number;
  problemas: Problema[];
  // O que foi conferido e não é problema (ex.: modais medidos), para o relatório.
  notas: string[];
}

export function chaveLargura(l: Largura): string {
  return `${l.largura}x${l.altura}`;
}

function mascarar(texto: string): string {
  return texto
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\S+@\S+/g, '<e-mail>')
    // E-mail da suíte cortado antes do "@" (prefixo.<timestamp>.<aleatório>).
    .replace(/\.\d{10,}\.\d*/g, '.<id>');
}

export function gravarResultadoResponsividade(r: ResultadoResponsividade): void {
  fs.mkdirSync(PASTA_RESULTADOS_RESP, { recursive: true });
  const nome = `${String(r.ordem).padStart(2, '0')}-${r.slug}-${String(r.largura).padStart(4, '0')}.json`;
  const limpo = {
    ...r,
    rota: mascarar(r.rota),
    problemas: r.problemas.map((p) => ({ ...p, detalhe: mascarar(p.detalhe) })),
    notas: r.notas.map(mascarar),
  };
  fs.writeFileSync(path.join(PASTA_RESULTADOS_RESP, nome), JSON.stringify(limpo, null, 2));
}

// Espera o layout assentar depois de trocar o tamanho da janela (reflow,
// ResizeObserver dos gráficos e o reposicionamento dos widgets flutuantes).
export async function aguardarLayout(page: Page) {
  await page.evaluate(
    () => new Promise<void>((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok()))),
  );
  await page.waitForTimeout(350);
}

interface Medicao {
  scrollWidth: number;
  clientWidth: number;
  transbordam: string[];
  alvosPequenos: string[];
  camposFonte: string[];
  cobertos: string[];
  widgetsPresentes: string[];
}

// (1) rolagem horizontal, (3) alvos pequenos, (5) fonte dos campos e
// (6) elementos sob os botões flutuantes/banner, numa passada só.
export async function medirTela(page: Page, opcoes: { conferirFonte: boolean }): Promise<Medicao> {
  return page.evaluate(
    ({ seletorWidgets, alvoMinimo, fonteMinima, conferirFonte }) => {
      const doc = document.documentElement;
      const largura = doc.clientWidth;

      const deWidget = (el: Element) => !!el.closest(seletorWidgets);
      const descrever = (el: Element) => {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const classes =
          typeof el.className === 'string'
            ? el.className
                .trim()
                .split(/\s+/)
                .filter((c) => c && !c.includes(':'))
                .slice(0, 5)
                .map((c) => `.${c}`)
                .join('')
            : '';
        const nome = (
          el.getAttribute('aria-label') ||
          el.getAttribute('title') ||
          el.getAttribute('placeholder') ||
          el.textContent ||
          ''
        )
          .trim()
          .replace(/\s+/g, ' ');
        return `${tag}${id}${classes}${nome ? ` "${nome.length > 50 ? `${nome.slice(0, 50)}…` : nome}"` : ''}`;
      };
      const emFixo = (el: Element) => {
        for (let a: Element | null = el; a; a = a.parentElement) {
          if (getComputedStyle(a).position === 'fixed') return true;
        }
        return false;
      };
      const oculto = (el: Element) =>
        !el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) ||
        !!el.closest('[aria-hidden="true"], [inert]');

      // (1) Elementos que passam da borda direita e não estão dentro de um
      // container que recorta/rola na horizontal.
      const transbordando: Element[] = [];
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (deWidget(el) || (el.closest('svg') && el.tagName.toLowerCase() !== 'svg')) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= largura + 0.5) continue;
        if (emFixo(el)) continue;
        let recortado = false;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          // O <main> do layout rola na vertical (e por isso também na
          // horizontal): estourar dentro dele é estourar a página.
          if (a.tagName === 'MAIN') continue;
          if (getComputedStyle(a).overflowX !== 'visible') {
            recortado = true;
            break;
          }
        }
        if (!recortado) transbordando.push(el);
      }
      const conjunto = new Set(transbordando);
      const raizes = transbordando.filter((el) => {
        for (let a = el.parentElement; a; a = a.parentElement) if (conjunto.has(a)) return false;
        return true;
      });
      const folhas = transbordando.filter((el) => !Array.from(el.children).some((c) => conjunto.has(c)));
      const transbordam = [
        ...raizes.slice(0, 6).map((el) => `${descrever(el)} (borda direita em ${Math.round(el.getBoundingClientRect().right)}px)`),
        ...folhas
          .filter((el) => !raizes.includes(el))
          .slice(0, 6)
          .map((el) => `↳ ${descrever(el)} (borda direita em ${Math.round(el.getBoundingClientRect().right)}px)`),
      ];

      // Interativos do sistema visíveis na página.
      const interativos = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="switch"], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => {
        if (deWidget(el) || oculto(el)) return false;
        if ((el as HTMLButtonElement).disabled) return false;
        const r = el.getBoundingClientRect();
        // sr-only (1px) e cópias fora da tela não são alvos.
        if (r.width <= 1 || r.height <= 1 || r.right < 0 || r.left > largura) return false;
        return true;
      });

      // (3) Alvo efetivo: o rótulo associado conta como parte do alvo de
      // checkbox/radio. Exceções do WCAG 2.5.8: link dentro de texto e
      // espaçamento (círculo de 24px no centro não toca outro alvo).
      const caixa = (el: HTMLElement) => {
        let { left, top, right, bottom } = el.getBoundingClientRect();
        const rotulos = (el as HTMLInputElement).labels;
        if (rotulos) {
          for (const l of Array.from(rotulos)) {
            const r = l.getBoundingClientRect();
            if (r.width === 0) continue;
            left = Math.min(left, r.left);
            top = Math.min(top, r.top);
            right = Math.max(right, r.right);
            bottom = Math.max(bottom, r.bottom);
          }
        }
        return { left, top, right, bottom, w: right - left, h: bottom - top };
      };
      const caixas = interativos.map((el) => ({ el, c: caixa(el) }));
      const pequenos = caixas.filter(({ el, c }) => {
        if (c.w >= alvoMinimo - 0.5 && c.h >= alvoMinimo - 0.5) return false;
        if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') {
          const textoPai = el.parentElement?.textContent?.trim() ?? '';
          if (textoPai.length > (el.textContent?.trim().length ?? 0)) return false;
        }
        return true;
      });
      const alvosPequenos: string[] = [];
      for (const p of pequenos) {
        const cx = (p.c.left + p.c.right) / 2;
        const cy = (p.c.top + p.c.bottom) / 2;
        const raio = alvoMinimo / 2;
        const toca = caixas.some((o) => {
          if (o.el === p.el || o.el.contains(p.el) || p.el.contains(o.el)) return false;
          if (pequenos.some((q) => q.el === o.el)) {
            const ox = (o.c.left + o.c.right) / 2;
            const oy = (o.c.top + o.c.bottom) / 2;
            return Math.hypot(ox - cx, oy - cy) < alvoMinimo;
          }
          const dx = Math.max(o.c.left - cx, 0, cx - o.c.right);
          const dy = Math.max(o.c.top - cy, 0, cy - o.c.bottom);
          return Math.hypot(dx, dy) < raio;
        });
        if (toca) alvosPequenos.push(`${descrever(p.el)} (${Math.round(p.c.w)}×${Math.round(p.c.h)} px)`);
      }

      // (5) iOS dá zoom em campo com fonte < 16px ao focar.
      const camposFonte: string[] = [];
      if (conferirFonte) {
        const campos = interativos.filter((el) => {
          if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
          if (!(el instanceof HTMLInputElement)) return false;
          return !['checkbox', 'radio', 'range', 'submit', 'button', 'reset', 'file', 'image', 'color'].includes(el.type);
        });
        for (const el of campos) {
          const tamanho = parseFloat(getComputedStyle(el).fontSize);
          if (tamanho < fonteMinima - 0.01) camposFonte.push(`${descrever(el)} (${tamanho}px)`);
        }
      }

      // (6) Retângulos dos botões flutuantes e do banner de cookies.
      const widgets: { nome: string; r: DOMRect }[] = [];
      const sienna = document.querySelector('.asw-menu-btn');
      if (sienna) widgets.push({ nome: 'Sienna', r: sienna.getBoundingClientRect() });
      const vlibras =
        document.getElementById('vlibras-access-wrapper')?.shadowRoot?.getElementById('vlibras-access') ??
        document.querySelector('[vw-access-button]');
      if (vlibras) widgets.push({ nome: 'VLibras', r: vlibras.getBoundingClientRect() });
      const banner = document.querySelector('#cc-main .cm');
      if (banner && banner.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
        widgets.push({ nome: 'banner de cookies', r: banner.getBoundingClientRect() });
      }
      const visiveis = widgets.filter((w) => w.r.width > 0 && w.r.height > 0 && w.r.bottom > 0 && w.r.top < window.innerHeight);

      // Coberto = em nenhuma posição de rolagem o centro do elemento fica
      // livre. Elemento em camada fixa (modal, painel) não rola: vale a
      // posição atual.
      const rolagemMax = Math.max(0, doc.scrollHeight - window.innerHeight);
      const cobertos: string[] = [];
      for (const { el } of caixas) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cyTela = r.top + r.height / 2;
        const fixo = emFixo(el);
        const cyDoc = cyTela + window.scrollY;
        for (const w of visiveis) {
          if (cx < w.r.left || cx > w.r.right) continue;
          const preso = fixo
            ? cyTela >= w.r.top && cyTela <= w.r.bottom
            : cyDoc - rolagemMax >= w.r.top && cyDoc <= w.r.bottom;
          if (preso) {
            cobertos.push(`${descrever(el)} sob ${w.nome}`);
            break;
          }
        }
      }

      const main = document.querySelector('main');
      return {
        scrollWidth: Math.max(doc.scrollWidth, main ? main.scrollWidth + (largura - main.clientWidth) : 0),
        clientWidth: largura,
        transbordam,
        alvosPequenos,
        camposFonte,
        cobertos,
        widgetsPresentes: visiveis.map((w) => w.nome),
      };
    },
    {
      seletorWidgets: WIDGETS_TERCEIROS.map((w) => w.seletor).join(', '),
      alvoMinimo: ALVO_MINIMO,
      fonteMinima: FONTE_MINIMA_CAMPO,
      conferirFonte: opcoes.conferirFonte,
    },
  );
}

export function problemasDaMedicao(m: Medicao): Problema[] {
  const problemas: Problema[] = [];
  if (m.scrollWidth > m.clientWidth) {
    problemas.push({
      categoria: 'rolagem',
      detalhe: `scrollWidth ${m.scrollWidth}px > clientWidth ${m.clientWidth}px${m.transbordam.length ? `: ${m.transbordam.join('; ')}` : ''}`,
    });
  }
  for (const a of m.alvosPequenos) problemas.push({ categoria: 'alvo', detalhe: a });
  for (const c of m.camposFonte) problemas.push({ categoria: 'fonte', detalhe: c });
  for (const c of m.cobertos) problemas.push({ categoria: 'coberto', detalhe: c });
  return problemas;
}

// (4) A caixa do modal (filho do overlay fixo) cabe na janela; se o conteúdo
// for maior que a caixa, ela precisa rolar por dentro. Também confere se
// algum botão do modal fica sob os botões flutuantes.
export async function medirModal(titulo: Locator, nome: string): Promise<Problema[]> {
  const r = await titulo.evaluate((h) => {
    const overlay = h.closest('.fixed');
    const box = overlay?.firstElementChild as HTMLElement | null;
    if (!box) return null;
    const c = box.getBoundingClientRect();
    const estilo = getComputedStyle(box);
    const rola = (v: string) => v === 'auto' || v === 'scroll';
    const cortadoV = box.scrollHeight > box.clientHeight + 1 && !rola(estilo.overflowY);
    const cortadoH = box.scrollWidth > box.clientWidth + 1 && !rola(estilo.overflowX);
    const widgets: DOMRect[] = [];
    const sienna = document.querySelector('.asw-menu-btn');
    if (sienna) widgets.push(sienna.getBoundingClientRect());
    const vlibras = document.getElementById('vlibras-access-wrapper')?.shadowRoot?.getElementById('vlibras-access');
    if (vlibras) widgets.push(vlibras.getBoundingClientRect());
    const sob = Array.from(box.querySelectorAll('button, a[href], input, select, textarea'))
      .filter((b) => {
        const br = b.getBoundingClientRect();
        const cx = br.left + br.width / 2;
        const cy = br.top + br.height / 2;
        return widgets.some((w) => w.width > 0 && cx >= w.left && cx <= w.right && cy >= w.top && cy <= w.bottom);
      })
      .map((b) => (b.getAttribute('aria-label') || b.textContent || b.tagName).trim());
    return {
      left: c.left,
      top: c.top,
      right: c.right,
      bottom: c.bottom,
      vw: document.documentElement.clientWidth,
      vh: window.innerHeight,
      cortadoV,
      cortadoH,
      sob,
    };
  });
  if (!r) return [{ categoria: 'modal', detalhe: `${nome}: caixa do modal não encontrada` }];
  const problemas: Problema[] = [];
  const fora: string[] = [];
  if (r.left < -0.5) fora.push(`esquerda ${Math.round(r.left)}px`);
  if (r.top < -0.5) fora.push(`topo ${Math.round(r.top)}px`);
  if (r.right > r.vw + 0.5) fora.push(`direita ${Math.round(r.right)}px > ${r.vw}px`);
  if (r.bottom > r.vh + 0.5) fora.push(`base ${Math.round(r.bottom)}px > ${r.vh}px`);
  if (fora.length) problemas.push({ categoria: 'modal', detalhe: `${nome}: passa da janela (${fora.join(', ')})` });
  if (r.cortadoV || r.cortadoH) problemas.push({ categoria: 'modal', detalhe: `${nome}: conteúdo cortado sem rolagem interna` });
  for (const b of r.sob) problemas.push({ categoria: 'coberto', detalhe: `${nome}: botão "${b}" sob botão flutuante` });
  return problemas;
}

export function caminhoCaptura(slug: string, l: Largura): string {
  return path.join(PASTA_CAPTURAS, `${slug}-${l.largura}.png`);
}

// Interativos de um container fixo (painel do menu) cujo centro está sob o
// Sienna ou o VLibras.
export async function interativosSobWidgets(container: Locator): Promise<string[]> {
  return container.evaluate((c) => {
    const widgets: DOMRect[] = [];
    const sienna = document.querySelector('.asw-menu-btn');
    if (sienna) widgets.push(sienna.getBoundingClientRect());
    const vlibras = document.getElementById('vlibras-access-wrapper')?.shadowRoot?.getElementById('vlibras-access');
    if (vlibras) widgets.push(vlibras.getBoundingClientRect());
    return Array.from(c.querySelectorAll('a[href], button'))
      .filter((b) => {
        const r = b.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return widgets.some((w) => w.width > 0 && cx >= w.left && cx <= w.right && cy >= w.top && cy <= w.bottom);
      })
      .map((b) => (b.getAttribute('aria-label') || b.textContent || b.tagName).trim());
  });
}
