// Escala de fonte do painel de acessibilidade (Sienna).
//
// O Sienna aumenta a fonte gravando `font-size` em px, elemento por elemento,
// só no que já está na tela, até 200%. Numa SPA isso quebrava o layout: textos
// crescem dentro de caixas de tamanho fixo e as telas abertas depois ficam sem
// escala. Aqui os botões +/- do Sienna são interceptados e a escala vai na
// fonte raiz (<html>), que o Tailwind usa em rem: texto, espaçamento e larguras
// crescem juntos, em todas as telas, dentro de uma faixa que o layout suporta.

export const ESCALA_FONTE_MIN = 0.8;
export const ESCALA_FONTE_MAX = 1.5;
const PASSO = 0.1;

const CHAVE_ESCALA = '@SinapseEdu:escalaFonte';
const CHAVE_SIENNA = 'asw-user-settings';
const SELETOR_CONTROLE = '.asw-plus[data-key="font-size"], .asw-minus[data-key="font-size"]';
const SELETOR_RESET = '.asw-menu-reset';

function limitar(valor: number): number {
  const arredondado = Math.round(valor * 10) / 10;
  return Math.min(ESCALA_FONTE_MAX, Math.max(ESCALA_FONTE_MIN, arredondado));
}

function lerEscala(): number {
  try {
    const valor = Number(localStorage.getItem(CHAVE_ESCALA));
    return valor ? limitar(valor) : 1;
  } catch {
    return 1;
  }
}

function atualizarRotulo(escala: number) {
  const texto = `${Math.round(escala * 100)}%`;
  document.querySelectorAll('.asw-amount').forEach((el) => {
    if (el.textContent !== texto) el.textContent = texto;
  });
}

function aplicarEscala(escala: number) {
  document.documentElement.style.fontSize = escala === 1 ? '' : `${escala * 100}%`;
  try {
    localStorage.setItem(CHAVE_ESCALA, String(escala));
  } catch {
    // localStorage indisponível (ex.: modo privado): vale só nesta aba.
  }
  atualizarRotulo(escala);
}

// Escala que o Sienna tinha salvo (de antes desta correção) vira a nossa, e a
// dele volta para 1, para ele não reaplicar px ao carregar.
function migrarEscalaDoSienna() {
  try {
    const bruto = localStorage.getItem(CHAVE_SIENNA);
    if (!bruto) return;
    const config = JSON.parse(bruto);
    const escalaSienna = Number(config?.states?.fontSize);
    if (!escalaSienna || escalaSienna === 1) return;

    if (localStorage.getItem(CHAVE_ESCALA) === null) {
      localStorage.setItem(CHAVE_ESCALA, String(limitar(escalaSienna)));
    }
    config.states.fontSize = 1;
    localStorage.setItem(CHAVE_SIENNA, JSON.stringify(config));
  } catch {
    // Config do Sienna ilegível: ele mesmo trata.
  }
}

function alterarEscala(controle: Element) {
  const delta = controle.classList.contains('asw-plus') ? PASSO : -PASSO;
  aplicarEscala(limitar(lerEscala() + delta));
}

// Mesmo com a escala em 1, o Sienna grava `font-size` em px nos textos ao
// iniciar e a cada opção ligada no menu. Inline vence as classes e trava o
// tamanho, então tiramos esse valor dos elementos que ele marcou.
function removerFontSizeDoSienna(raiz: ParentNode) {
  raiz.querySelectorAll<HTMLElement>('[data-asw-org-font-size]').forEach((el) => {
    if (el.style.fontSize) el.style.removeProperty('font-size');
  });
}

export function iniciarEscalaFonte() {
  migrarEscalaDoSienna();
  aplicarEscala(lerEscala());

  // Fase de captura no document: roda antes do listener do próprio botão do
  // Sienna, que assim nunca recebe o clique.
  document.addEventListener(
    'click',
    (evento) => {
      const alvo = evento.target instanceof Element ? evento.target : null;
      if (!alvo) return;

      if (alvo.closest(SELETOR_RESET)) {
        aplicarEscala(1); // o reset do Sienna segue normalmente
        return;
      }

      const controle = alvo.closest(SELETOR_CONTROLE);
      if (!controle) return;
      evento.stopPropagation();
      evento.preventDefault();
      alterarEscala(controle);
    },
    true,
  );

  // Os botões +/- do Sienna têm role="button" e tabindex, mas não respondem ao
  // teclado; aqui Enter/Espaço passam a funcionar.
  document.addEventListener(
    'keydown',
    (evento) => {
      if (evento.key !== 'Enter' && evento.key !== ' ') return;
      const alvo = evento.target instanceof Element ? evento.target : null;
      const controle = alvo?.closest(SELETOR_CONTROLE);
      if (!controle) return;
      evento.preventDefault();
      alterarEscala(controle);
    },
    true,
  );

  const observer = new MutationObserver((mutacoes) => {
    let menuMudou = false;
    for (const mutacao of mutacoes) {
      if (mutacao.type === 'attributes') {
        const el = mutacao.target as HTMLElement;
        if (el.dataset.aswOrgFontSize && el.style.fontSize) el.style.removeProperty('font-size');
      } else if (mutacao.addedNodes.length > 0) {
        menuMudou = true;
      }
    }
    // O menu do Sienna é montado depois e começa mostrando "100%".
    if (menuMudou) atualizarRotulo(lerEscala());
  });

  const observar = () => {
    removerFontSizeDoSienna(document.body);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style'],
    });
  };

  if (document.body) observar();
  else document.addEventListener('DOMContentLoaded', observar, { once: true });
}
