import type { Page, TestInfo } from '@playwright/test';
import { test, expect, aguardarTela } from './support/fixtures';
import { arquivoSessao, lerEstado } from './support/ambiente';
import {
  WIDGETS_TERCEIROS,
  auditarTela,
  gravarResultado,
  type ParadaTeclado,
  type ResultadoTela,
} from './support/auditoria-a11y';
import { horariosFuturosNoMes } from './support/horarios';

// B. Auditoria de acessibilidade (WCAG 2.2 AA via axe-core).
//
// Os testes NÃO falham por violação: cada tela grava o resultado e o
// relatório test-browser/relatorio-acessibilidade.md é a entrega. Um teste
// só falha se não conseguir chegar à tela ou rodar a análise.

// O banner de cookies não é dispensado automaticamente: cada auditoria
// decide se ele fica aberto (ver `auditar`), e os testes de teclado o
// encontram como no primeiro acesso.
test.use({ dispensarBannerCookies: false });

// Espera os widgets externos aparecerem (até alguns segundos, sem falhar)
// e as animações de entrada terminarem, para o contraste não ser medido
// no meio de um fade-in.
async function estabilizar(page: Page) {
  for (const w of WIDGETS_TERCEIROS) {
    await page.locator(w.seletor).first().waitFor({ state: 'attached', timeout: 6_000 }).catch(() => {});
  }
  await page
    .evaluate(() =>
      Promise.race([
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => undefined)),
        ),
        new Promise((r) => setTimeout(r, 3_000)),
      ]),
    )
    .catch(() => {});

  // Gráficos (Recharts anima por JS, ~1,5 s) e widgets continuam mexendo no
  // DOM depois do carregamento: espera 1 s sem mutações (máx. 10 s), para o
  // resultado não depender de em que instante o axe rodou.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let ocioso: ReturnType<typeof setTimeout>;
        const fim = () => {
          observador.disconnect();
          resolve();
        };
        const observador = new MutationObserver(() => {
          clearTimeout(ocioso);
          ocioso = setTimeout(fim, 1_000);
        });
        observador.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
        ocioso = setTimeout(fim, 1_000);
        setTimeout(fim, 10_000);
      }),
  );
}

// Telas públicas são auditadas como no primeiro acesso, com o banner de
// cookies aberto (é ali que ele entra na análise). Nas autenticadas o
// usuário já respondeu o banner: com ele aberto, o axe deixa de reportar
// regras do sistema (verificado com aria-hidden-focus em Relatórios).
async function auditar(page: Page, testInfo: TestInfo, ordem: number, tela: string, opcoes: { comBannerCookies: boolean }) {
  if (!opcoes.comBannerCookies) {
    const rejeitar = page.locator('#cc-main').getByRole('button', { name: 'Rejeitar não essenciais' });
    await rejeitar.waitFor({ state: 'visible', timeout: 6_000 }).catch(() => {});
    if (await rejeitar.isVisible()) {
      await rejeitar.click();
      await expect(page.locator('html')).not.toHaveClass(/show--consent/);
    }
  }
  await estabilizar(page);
  const r: ResultadoTela = await auditarTela(page, ordem, tela);
  const elementos = r.sistema.reduce((s, v) => s + v.nos.length, 0);
  testInfo.annotations.push({
    type: 'axe',
    description: `${r.sistema.length} regra(s) violada(s) no sistema (${elementos} elemento(s)); ${r.terceiros.length} em widgets de terceiros`,
  });
}

test.describe('B. Acessibilidade — telas públicas', () => {
  test('login', async ({ page }, testInfo) => {
    await page.goto('/');
    await aguardarTela(page, 'Sinapse Edu');
    await auditar(page, testInfo, 1, 'Login', { comBannerCookies: true });
  });

  test('cadastro', async ({ page }, testInfo) => {
    await page.goto('/cadastro');
    await aguardarTela(page, 'Crie sua conta');
    await auditar(page, testInfo, 2, 'Cadastro', { comBannerCookies: true });
  });

  test('esqueci a senha', async ({ page }, testInfo) => {
    await page.goto('/esqueci-senha');
    await aguardarTela(page, 'Recuperar senha');
    await auditar(page, testInfo, 3, 'Esqueci a senha', { comBannerCookies: true });
  });
});

test.describe('B. Acessibilidade — telas autenticadas', () => {
  test.use({ storageState: arquivoSessao('a11y') });

  test('dashboard', async ({ page }, testInfo) => {
    await page.goto('/dashboard');
    await aguardarTela(page, /Olá, Terapeuta!/);
    await expect(page.getByText('Carregando tarefas...')).toBeHidden();
    await auditar(page, testInfo, 4, 'Dashboard', { comBannerCookies: false });
  });

  test('lista de aprendentes', async ({ page }, testInfo) => {
    await page.goto('/aprendentes');
    await aguardarTela(page, 'Gestão de Aprendentes');
    await expect(page.getByRole('cell', { name: 'Aprendente Fictício A11y' })).toBeVisible();
    await auditar(page, testInfo, 5, 'Lista de aprendentes', { comBannerCookies: false });
  });

  test('novo aprendente', async ({ page }, testInfo) => {
    await page.goto('/aprendentes/novo');
    await aguardarTela(page, 'Cadastrar Aprendente');
    await auditar(page, testInfo, 6, 'Novo aprendente', { comBannerCookies: false });
  });

  test('agenda', async ({ page }, testInfo) => {
    await page.goto('/agenda');
    await aguardarTela(page, 'Agenda de Pendências');
    await expect(page.getByText('Carregando...')).toBeHidden();
    await auditar(page, testInfo, 7, 'Agenda', { comBannerCookies: false });
  });

  test('nova sessão (com a grade de horários aberta)', async ({ page }, testInfo) => {
    await page.goto('/agenda/nova');
    await aguardarTela(page, 'Agendar Nova Sessão');
    await page.locator('select').selectOption({ label: 'Aprendente Fictício A11y' });
    // Dia da sessão semeada: a grade mostra horários livres e ocupados.
    const dia = horariosFuturosNoMes()[0]?.data;
    if (dia) {
      await page.locator('input[type="date"]').fill(dia);
      await expect(page.getByText('Carregando disponibilidade...')).toBeHidden();
      await expect(page.getByRole('button', { name: '12:00', exact: true })).toBeVisible();
    }
    await auditar(page, testInfo, 8, 'Nova sessão', { comBannerCookies: false });
  });

  test.describe('Relatórios (4 modos)', () => {
    async function abrirRelatorios(page: Page) {
      await page.goto('/relatorios');
      await aguardarTela(page, 'Relatório Analítico de Evolução');
      await page.locator('form select').first().selectOption({ label: 'Aprendente Fictício A11y' });
      await expect(page.getByRole('button', { name: 'Exportar para Word (.docx)' })).toBeEnabled();
    }

    test('relatórios — Relatório com IA (heurística)', async ({ page }, testInfo) => {
      await abrirRelatorios(page);
      const hoje = new Date();
      await page.locator('input[type="date"]').nth(0).fill(`${hoje.getFullYear()}-01-01`);
      await page.locator('input[type="date"]').nth(1).fill(`${hoje.getFullYear() + 2}-12-31`);
      await page.getByRole('button', { name: 'Emitir Relatório' }).click();
      await expect(page.getByRole('heading', { name: 'Relatório Automático Sistêmico' })).toBeVisible({ timeout: 30_000 });
      await auditar(page, testInfo, 9, 'Relatórios — Relatório com IA', { comBannerCookies: false });
    });

    test('relatórios — Acompanhamento (AB-ABAB)', async ({ page }, testInfo) => {
      await abrirRelatorios(page);
      await page.getByRole('button', { name: 'Acompanhamento (AB-ABAB)' }).click();
      await expect(page.getByRole('heading', { name: 'Gráfico de Acompanhamento (AB-ABAB)' })).toBeVisible();
      await expect(page.locator('main .recharts-surface').first()).toBeVisible();
      await auditar(page, testInfo, 10, 'Relatórios — Acompanhamento (AB-ABAB)', { comBannerCookies: false });
    });

    test('relatórios — Média por Período', async ({ page }, testInfo) => {
      await abrirRelatorios(page);
      await page.getByRole('button', { name: 'Média por Período' }).click();
      await expect(page.getByRole('heading', { name: 'Média por Período' })).toBeVisible();
      await expect(page.locator('main .recharts-surface').first()).toBeVisible();
      await auditar(page, testInfo, 11, 'Relatórios — Média por Período', { comBannerCookies: false });
    });

    test('relatórios — Regressão Linear', async ({ page }, testInfo) => {
      await abrirRelatorios(page);
      await page.getByRole('button', { name: 'Regressão Linear' }).click();
      await expect(page.getByRole('heading', { name: 'Regressão Linear' })).toBeVisible();
      await expect(page.getByText(/Tendência de melhora|Tendência de piora|Desempenho estável/)).toBeVisible();
      await auditar(page, testInfo, 12, 'Relatórios — Regressão Linear', { comBannerCookies: false });
    });
  });

  test('novo PEI (a partir de um molde)', async ({ page }, testInfo) => {
    const { a11y } = lerEstado();
    await page.goto(`/aprendentes/${a11y.aprendenteId}/pei/novo`);
    await aguardarTela(page, 'Novo PEI');
    await page.locator('select').selectOption({ label: 'Molde de leitura (a11y)' });
    await expect(page.getByPlaceholder('Descreva os objetivos do plano...')).not.toHaveValue('');
    await auditar(page, testInfo, 13, 'Novo PEI', { comBannerCookies: false });
  });

  test('configurações', async ({ page }, testInfo) => {
    await page.goto('/configuracoes');
    await aguardarTela(page, 'Minha Conta');
    await auditar(page, testInfo, 14, 'Configurações', { comBannerCookies: false });
  });
});

// ---------------------------------------------------------------------------
// Navegação só por teclado
// ---------------------------------------------------------------------------

interface EstiloFoco {
  outline: string;
  outlineVisivel: boolean;
  boxShadow: string;
  borda: string;
  fundo: string;
  sublinhado: string;
}

interface InfoParada {
  chave: string;
  descricao: string;
  widget: string | null;
  focado: EstiloFoco;
}

// Pressiona Tab a partir do início da página e, para cada parada, compara o
// estilo calculado do elemento com foco e depois que o foco sai dele. Se
// nada muda (e não há outline visível), o foco não é perceptível.
type ParadaComChave = ParadaTeclado & { chave: string };

async function percorrerComTab(page: Page, maxParadas = 30): Promise<{ paradas: ParadaComChave[]; cicloPara?: string }> {
  await page.evaluate(() => {
    (window as unknown as { __paradasTab: Element[] }).__paradasTab = [];
    (document.activeElement as HTMLElement | null)?.blur();
  });

  const paradas: (InfoParada & { semFoco?: EstiloFoco })[] = [];
  let cicloPara: string | undefined;
  for (let i = 0; i < maxParadas; i++) {
    await page.keyboard.press('Tab');
    // Deixa as transições de foco (transition-all duration-300) terminarem.
    await page.waitForTimeout(350);

    const info = await page.evaluate(
      ({ widgets }) => {
        const ler = (el: Element): EstiloFoco => {
          const s = getComputedStyle(el);
          const cor = s.outlineColor;
          const transparente = /rgba\(.*,\s*0\)$/.test(cor) || cor === 'transparent';
          return {
            outline: `${s.outlineStyle} ${s.outlineWidth} ${cor}`,
            outlineVisivel: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && !transparente,
            boxShadow: s.boxShadow,
            borda: `${s.borderColor} ${s.borderWidth}`,
            fundo: s.backgroundColor,
            sublinhado: s.textDecorationLine,
          };
        };
        const reg = (window as unknown as { __paradasTab: Element[] }).__paradasTab;
        const anterior = reg[reg.length - 1];
        const semFocoAnterior = anterior ? ler(anterior) : null;

        const el = document.activeElement;
        if (!el || el === document.body) {
          return { semFocoAnterior, parada: null, repetido: -1 };
        }
        // Elemento já visitado: o Tab fechou um ciclo.
        const repetido = reg.indexOf(el);
        if (repetido >= 0) return { semFocoAnterior, parada: null, repetido };
        reg.push(el);

        const html = el as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const texto = (html.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        const placeholder = el.getAttribute('placeholder');
        let chave: string;
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          chave = `campo "${placeholder ?? el.getAttribute('name') ?? el.getAttribute('type') ?? tag}"`;
        } else if (tag === 'a') {
          chave = `link "${texto}"`;
        } else if (tag === 'button') {
          chave = `botão "${texto}"`;
        } else {
          chave = `${tag} "${texto}"`;
        }
        const tipo = tag === 'input' ? ` type=${el.getAttribute('type') ?? 'text'}` : '';
        let widget: string | null = null;
        for (const w of widgets) {
          if (el.closest(w.seletor)) {
            widget = w.nome;
            break;
          }
        }
        return {
          semFocoAnterior,
          parada: { chave, descricao: `${chave} (<${tag}${tipo}>)`, widget, focado: ler(el) },
          repetido: -1,
        };
      },
      { widgets: WIDGETS_TERCEIROS },
    );

    if (paradas.length && info.semFocoAnterior) paradas[paradas.length - 1].semFoco = info.semFocoAnterior;
    if (info.repetido >= 0) {
      cicloPara = paradas[info.repetido].descricao;
      break;
    }
    if (!info.parada) break;
    paradas.push(info.parada);
  }

  const resultado = paradas.map((p) => {
    const f = p.focado;
    const s = p.semFoco;
    const mudou = s ? f.boxShadow !== s.boxShadow || f.borda !== s.borda || f.fundo !== s.fundo || f.sublinhado !== s.sublinhado : false;
    return {
      chave: p.chave,
      descricao: p.descricao,
      focoVisivel: f.outlineVisivel || mudou,
      ...(p.widget ? { widget: p.widget } : {}),
    };
  });
  return { paradas: resultado, cicloPara };
}

async function auditarTeclado(page: Page, testInfo: TestInfo, ordem: number, tela: string, ordemEsperada: string[]) {
  await estabilizar(page);
  const { paradas, cicloPara } = await percorrerComTab(page);
  const doSistema = paradas.filter((p) => !p.widget);
  const ordemObtida = doSistema.map((p) => p.chave);

  gravarResultado({
    tipo: 'teclado',
    ordem,
    tela: `Teclado — ${tela}`,
    ordemEsperada,
    ordemObtida,
    cicloPara,
    paradas: paradas.map(({ descricao, focoVisivel, widget }) => ({ descricao, focoVisivel, ...(widget ? { widget } : {}) })),
  });

  const ordemOk = JSON.stringify(ordemObtida) === JSON.stringify(ordemEsperada);
  const semFoco = doSistema.filter((p) => !p.focoVisivel).length;
  testInfo.annotations.push({
    type: 'teclado',
    description: `ordem ${ordemOk ? 'correta' : 'diferente da esperada'}; foco visível ausente em ${semFoco} de ${doSistema.length} parada(s) do sistema`,
  });

  // Sanidade do próprio teste (não é critério de acessibilidade): o Tab
  // precisa ter chegado a algum elemento do sistema.
  expect(doSistema.length, 'nenhum elemento do sistema recebeu foco com Tab').toBeGreaterThan(0);
}

test.describe('B. Acessibilidade — navegação só por teclado', () => {
  test('teclado: login (Tab percorre os campos na ordem, com foco visível)', async ({ page }, testInfo) => {
    await page.goto('/');
    await aguardarTela(page, 'Sinapse Edu');
    await auditarTeclado(page, testInfo, 15, 'Login', [
      'campo "admin@sinapse.edu.br"',
      'campo "••••••••"',
      'link "Esqueci minha senha"',
      'botão "Entrar na Clínica"',
      'link "Cadastre-se aqui"',
    ]);
  });

  test('teclado: cadastro (Tab percorre os campos na ordem, com foco visível)', async ({ page }, testInfo) => {
    await page.goto('/cadastro');
    await aguardarTela(page, 'Crie sua conta');
    await auditarTeclado(page, testInfo, 16, 'Cadastro', [
      'campo "Ex: Dr. João Silva"',
      'campo "seu@email.com.br"',
      'campo "Mín. 8 char"',
      'campo "Repita a senha"',
      'botão "Cadastrar e Acessar"',
      'link "Faça login aqui"',
    ]);
  });
});
