import { useEffect } from 'react';

/**
 * Sienna e VLibras sao scripts de terceiros que se posicionam com
 * `position: fixed` relativo ao viewport. Ambos ficam empilhados no canto
 * inferior direito (Sienna embaixo, VLibras logo acima dele) em qualquer
 * resolucao — sobrescrevemos o `top`/`left` inline de cada um com
 * `!important`, que sempre vence a regra `left: var(--asw-left, 30px)`
 * (Sienna) e a regra da propria shadow root (VLibras), ja que nenhuma das
 * duas usa `!important` na posicao.
 *
 * A margem inferior reservada e dinamica: quando a barra de cookies esta
 * visivel ela pode passar dos 24px base (a altura real varia com o quanto o
 * texto quebra), entao medimos a altura real dela em tempo de execucao para
 * nunca ficar por baixo.
 */

const SIENNA_BUTTON_SELECTOR = '.asw-menu-btn';
const VLIBRAS_WRAPPER_ID = 'vlibras-access-wrapper';
const VLIBRAS_BUTTON_ID = 'vlibras-access';
// vanilla-cookieconsent (layout "bar"): container real com altura visível.
const COOKIE_BAR_SELECTOR = '#cc-main .cm';

const RIGHT_MARGIN = 24;
const BASE_BOTTOM = 24; // igual ao data-offset do Sienna em index.html
const GAP_ABOVE_COOKIE_BAR = 16;
const STACK_GAP = 14; // espaço entre o topo do Sienna e a base do VLibras
const SIENNA_FALLBACK_HEIGHT = 58; // usado só antes do botão do Sienna existir

/**
 * Quando a barra de cookies esta visivel, devolve a distancia (em px) do
 * topo dela ate o fundo da viewport — a "altura reservada" que os botões
 * precisam respeitar para nao ficar por baixo dela. Medido em tempo real
 * (nao um numero fixo) porque a altura da barra varia com o tamanho da tela
 * (o texto quebra em mais linhas em telas estreitas).
 */
function getCookieBarClearance(): number {
  const bar = document.querySelector<HTMLElement>(COOKIE_BAR_SELECTOR);
  if (!bar) return 0;
  const rect = bar.getBoundingClientRect();
  if (rect.height === 0) return 0;
  return Math.max(0, window.innerHeight - rect.top);
}

function getReservedBottom(): number {
  const clearance = getCookieBarClearance();
  return clearance > 0 ? clearance + GAP_ABOVE_COOKIE_BAR : BASE_BOTTOM;
}

function applyFixedRect(el: HTMLElement, top: number, left: number) {
  el.style.setProperty('position', 'fixed', 'important');
  el.style.setProperty('top', `${top}px`, 'important');
  el.style.setProperty('left', `${left}px`, 'important');
  el.style.setProperty('right', 'auto', 'important');
  el.style.setProperty('bottom', 'auto', 'important');
}

function positionSienna() {
  const btn = document.querySelector<HTMLElement>(SIENNA_BUTTON_SELECTOR);
  if (!btn) return;

  const size = btn.getBoundingClientRect();
  const bottom = getReservedBottom();
  const top = window.innerHeight - bottom - size.height;
  const left = window.innerWidth - RIGHT_MARGIN - size.width;
  applyFixedRect(btn, top, left);
}

function positionVLibras() {
  const shadowRoot = document.getElementById(VLIBRAS_WRAPPER_ID)?.shadowRoot;
  const btn = shadowRoot?.getElementById(VLIBRAS_BUTTON_ID);
  if (!btn) return;

  const siennaBtn = document.querySelector<HTMLElement>(SIENNA_BUTTON_SELECTOR);
  const siennaHeight = siennaBtn
    ? siennaBtn.getBoundingClientRect().height
    : SIENNA_FALLBACK_HEIGHT;

  const size = btn.getBoundingClientRect();
  const bottom = getReservedBottom() + siennaHeight + STACK_GAP;
  const top = window.innerHeight - bottom - size.height;
  const left = window.innerWidth - RIGHT_MARGIN - size.width;
  applyFixedRect(btn, top, left);
}

export function AccessibilityWidgetsPositioner() {
  useEffect(() => {
    function repositionAll() {
      positionSienna();
      positionVLibras();
    }

    let raf = 0;
    function schedule() {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(repositionAll);
    }

    // Reagimos a qualquer mudança no DOM (carregamento assíncrono do
    // Sienna/VLibras insere os botões) em vez de tentar adivinhar o timing
    // exato — o rAF garante no máximo um reposicionamento por frame.
    // Observamos só childList (não attributes/style) para não entrar em
    // loop: nós mesmos escrevemos `style` nos botões a cada reposicionamento.
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    schedule();

    // A barra de cookies entra/sai com animação (troca de class/transform),
    // o que não gera mutação de childList — sem isso, o reposicionamento
    // poderia nao refletir o momento em que ela aparece/some. Um poll leve
    // (1x/s, poucas leituras de layout) cobre esse caso pelo resto da vida
    // do app a um custo desprezível.
    const pollId = window.setInterval(schedule, 1000);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(raf);
      window.clearInterval(pollId);
    };
  }, []);

  return null;
}
