import { useEffect } from 'react';

/**
 * Empilha Sienna (embaixo) e VLibras (em cima) no canto inferior direito.
 * Os dois são scripts de terceiros com `position: fixed` próprio; o
 * `top`/`left` inline com `!important` ganha tanto do
 * `left: var(--asw-left, 30px)` do Sienna quanto do CSS da shadow root do
 * VLibras, porque nenhum deles usa `!important`.
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

// Distância do topo da barra de cookies até o fundo da tela. É medida em vez
// de fixa porque em tela estreita o texto quebra e a barra cresce.
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

    // Os scripts inserem os botões quando bem entendem, então reagimos a
    // mudanças no DOM em vez de adivinhar o timing. Só childList: observar
    // `style` entraria em loop, já que a gente mesmo escreve `style` neles.
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    schedule();

    // A barra de cookies aparece/some trocando class/transform, o que não
    // dispara childList. O poll de 1s cobre isso e custa quase nada.
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
