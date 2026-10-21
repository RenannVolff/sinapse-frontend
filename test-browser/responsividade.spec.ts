import * as fs from 'node:fs';
import type { Locator, Page } from '@playwright/test';
import { test, expect, aguardarTela } from './support/fixtures';
import { arquivoSessao, lerEstado } from './support/ambiente';
import { chamarApi } from './support/api';
import {
  ALVO_TOQUE_MENU,
  BREAKPOINT_LG,
  BREAKPOINT_MD,
  LARGURAS,
  PASTA_CAPTURAS,
  aguardarLayout,
  caminhoCaptura,
  gravarResultadoResponsividade,
  interativosSobWidgets,
  medirModal,
  medirTela,
  problemasDaMedicao,
  type Largura,
  type Problema,
} from './support/responsividade';

// D. Responsividade: cada rota do App.tsx (e alguns estados, como relatório
// emitido) em sete larguras, de 320px a 1920px. O que for encontrado vai
// para test-browser/relatorio-responsividade.md; só a falta do botão de menu
// abaixo de lg falha o teste. O relatório é montado no global teardown.

// O banner fica aberto nas telas públicas (primeiro acesso) e é respondido
// à mão nas autenticadas, como na auditoria de acessibilidade.
test.use({ dispensarBannerCookies: false });

const ITENS_MENU: { rotulo: string; rota: string }[] = [
  { rotulo: 'Painel', rota: '/dashboard' },
  { rotulo: 'Meus Aprendentes', rota: '/aprendentes' },
  { rotulo: 'Agenda', rota: '/agenda' },
  { rotulo: 'Modelos de PEI', rota: '/pei-templates' },
  { rotulo: 'Relatórios', rota: '/relatorios' },
  { rotulo: 'Auditoria', rota: '/auditoria' },
  { rotulo: 'Configurações', rota: '/configuracoes' },
];

interface Modal {
  nome: string;
  // Botão da tela que abre o modal; o modal só é medido se ele existir.
  gatilho: (page: Page) => Locator;
  titulo: string;
  // Botão do próprio modal que fecha sem fazer nada.
  fechar: string;
}

interface Tela {
  slug: string;
  tela: string;
  autenticada: boolean;
  rota: (ids: Ids) => string;
  titulo: string | RegExp;
  preparar?: (page: Page) => Promise<void>;
  modais?: Modal[];
}

interface Ids {
  aprendenteId: string;
  atendimentoId: string;
  peiId: string;
}

const confirmExcluirAprendente: Modal = {
  nome: 'ConfirmDialog "Excluir aprendente?"',
  gatilho: (page) => page.getByRole('button', { name: 'Excluir aprendente' }).first(),
  titulo: 'Excluir aprendente?',
  fechar: 'Cancelar',
};

const TELAS: Tela[] = [
  { slug: 'login', tela: 'Login', autenticada: false, rota: () => '/', titulo: 'Sinapse Edu' },
  { slug: 'cadastro', tela: 'Cadastro', autenticada: false, rota: () => '/cadastro', titulo: 'Crie sua conta' },
  {
    slug: 'verificar-email',
    tela: 'Verificar e-mail (link sem token)',
    autenticada: false,
    rota: () => '/verificar-email',
    titulo: 'Sinapse Edu',
    preparar: async (page) => {
      await expect(page.getByText('Link de verificação inválido')).toBeVisible();
    },
  },
  { slug: 'esqueci-senha', tela: 'Esqueci a senha', autenticada: false, rota: () => '/esqueci-senha', titulo: 'Recuperar senha' },
  { slug: 'redefinir-senha', tela: 'Redefinir senha (link sem token)', autenticada: false, rota: () => '/redefinir-senha', titulo: 'Redefinir senha' },
  { slug: 'nao-encontrada', tela: 'Página inexistente (404)', autenticada: false, rota: () => '/rota-que-nao-existe', titulo: /Deu batata!|Página não encontrada/ },
  {
    slug: 'dashboard',
    tela: 'Painel',
    autenticada: true,
    rota: () => '/dashboard',
    titulo: /Olá, Terapeuta!/,
    preparar: async (page) => {
      await expect(page.getByText('Carregando tarefas...')).toBeHidden();
    },
  },
  {
    slug: 'aprendentes',
    tela: 'Lista de aprendentes',
    autenticada: true,
    rota: () => '/aprendentes',
    titulo: 'Gestão de Aprendentes',
    preparar: async (page) => {
      await expect(page.getByText('Aprendente Fictício A11y').first()).toBeVisible();
    },
    modais: [confirmExcluirAprendente],
  },
  { slug: 'aprendente-novo', tela: 'Novo aprendente', autenticada: true, rota: () => '/aprendentes/novo', titulo: 'Cadastrar Aprendente' },
  {
    slug: 'aprendente-detalhes',
    tela: 'Detalhes do aprendente',
    autenticada: true,
    rota: (ids) => `/aprendentes/${ids.aprendenteId}`,
    titulo: 'Aprendente Fictício A11y',
    modais: [confirmExcluirAprendente],
  },
  { slug: 'pei-lista', tela: 'PEIs do aprendente', autenticada: true, rota: (ids) => `/aprendentes/${ids.aprendenteId}/pei`, titulo: /PEIs de Aprendente Fictício A11y/ },
  { slug: 'pei-novo', tela: 'Novo PEI', autenticada: true, rota: (ids) => `/aprendentes/${ids.aprendenteId}/pei/novo`, titulo: 'Novo PEI' },
  { slug: 'pei-detalhes', tela: 'Detalhes do PEI', autenticada: true, rota: (ids) => `/pei/${ids.peiId}`, titulo: 'Plano Educacional Individualizado' },
  {
    slug: 'pei-modelos',
    tela: 'Modelos de PEI',
    autenticada: true,
    rota: () => '/pei-templates',
    titulo: 'Modelos de PEI',
    preparar: async (page) => {
      await expect(page.getByText('Molde de leitura (a11y)')).toBeVisible();
    },
  },
  { slug: 'pei-modelo-novo', tela: 'Novo modelo de PEI', autenticada: true, rota: () => '/pei-templates/novo', titulo: 'Novo Modelo de PEI' },
  {
    slug: 'agenda',
    tela: 'Agenda',
    autenticada: true,
    rota: () => '/agenda',
    titulo: 'Agenda de Pendências',
    preparar: async (page) => {
      await expect(page.getByText('Carregando...')).toBeHidden();
    },
    modais: [
      {
        nome: 'ConfirmDialog "Excluir sessão?"',
        gatilho: (page) => page.getByRole('button', { name: 'Excluir sessão' }).first(),
        titulo: 'Excluir sessão?',
        fechar: 'Cancelar',
      },
    ],
  },
  { slug: 'agenda-nova-sessao', tela: 'Nova sessão', autenticada: true, rota: () => '/agenda/nova', titulo: 'Agendar Nova Sessão' },
  {
    slug: 'sessao-ativa',
    tela: 'Sessão ativa',
    autenticada: true,
    rota: (ids) => `/agenda/${ids.atendimentoId}/sessao`,
    titulo: /Sessão de histórico/,
    modais: [
      {
        nome: 'Modal "Encerrar Sessão?"',
        gatilho: (page) => page.getByRole('button', { name: 'Encerrar Sessão' }),
        titulo: 'Encerrar Sessão?',
        fechar: 'Cancelar',
      },
      {
        nome: 'Modal "Marcar Falta?"',
        gatilho: (page) => page.getByRole('button', { name: 'Marcar Falta' }),
        titulo: 'Marcar Falta?',
        fechar: 'Voltar',
      },
      {
        nome: 'Modal "Cancelar Sessão?"',
        gatilho: (page) => page.getByRole('button', { name: 'Cancelar', exact: true }),
        titulo: 'Cancelar Sessão?',
        fechar: 'Voltar',
      },
      {
        nome: 'ConfirmDialog "Excluir sessão?"',
        gatilho: (page) => page.getByRole('button', { name: 'Excluir sessão' }),
        titulo: 'Excluir sessão?',
        fechar: 'Cancelar',
      },
    ],
  },
  {
    slug: 'relatorios',
    tela: 'Relatórios',
    autenticada: true,
    rota: () => '/relatorios',
    titulo: 'Relatório Analítico de Evolução',
  },
  {
    slug: 'relatorios-emitido',
    tela: 'Relatórios — relatório emitido',
    autenticada: true,
    rota: () => '/relatorios',
    titulo: 'Relatório Analítico de Evolução',
    preparar: async (page) => {
      await selecionarAprendente(page);
      const hoje = new Date();
      await page.locator('input[type="date"]').nth(0).fill(`${hoje.getFullYear()}-01-01`);
      await page.locator('input[type="date"]').nth(1).fill(`${hoje.getFullYear() + 2}-12-31`);
      await page.getByRole('button', { name: 'Emitir Relatório' }).click();
      await expect(page.getByRole('heading', { name: 'Relatório Automático Sistêmico' })).toBeVisible({ timeout: 30_000 });
    },
  },
  {
    slug: 'relatorios-acompanhamento',
    tela: 'Relatórios — gráfico Acompanhamento (AB-ABAB)',
    autenticada: true,
    rota: () => '/relatorios',
    titulo: 'Relatório Analítico de Evolução',
    preparar: async (page) => {
      await selecionarAprendente(page);
      await page.getByRole('button', { name: 'Acompanhamento (AB-ABAB)' }).click();
      await expect(page.locator('main .recharts-surface').first()).toBeVisible();
    },
  },
  { slug: 'auditoria', tela: 'Auditoria', autenticada: true, rota: () => '/auditoria', titulo: 'Registro de Auditoria' },
  { slug: 'configuracoes', tela: 'Configurações', autenticada: true, rota: () => '/configuracoes', titulo: 'Minha Conta' },
];

async function selecionarAprendente(page: Page) {
  await page.locator('form select').first().selectOption({ label: 'Aprendente Fictício A11y' });
  await expect(page.getByRole('button', { name: 'Exportar para Word (.docx)' })).toBeEnabled();
}

async function responderBannerCookies(page: Page) {
  const rejeitar = page.locator('#cc-main').getByRole('button', { name: 'Rejeitar não essenciais' });
  await rejeitar.waitFor({ state: 'visible', timeout: 6_000 }).catch(() => {});
  if (await rejeitar.isVisible()) {
    await rejeitar.click();
    await expect(page.locator('html')).not.toHaveClass(/show--consent/);
  }
}

// Os botões flutuantes vêm de CDN; espera um pouco por eles para a
// verificação de "coberto" valer, sem falhar se a rede não os trouxer.
async function aguardarWidgets(page: Page) {
  await page.locator('.asw-menu-btn').waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
  await page
    .waitForFunction(() => !!document.getElementById('vlibras-access-wrapper')?.shadowRoot?.getElementById('vlibras-access'), null, {
      timeout: 5_000,
    })
    .catch(() => {});
  // A folga das telas públicas acompanha a altura da barra de cookies, que
  // o AccessibilityWidgetsPositioner mede (e remede a cada 1 s enquanto a
  // barra entra animada). Espera os dois baterem.
  await page
    .waitForFunction(
      () => {
        const barra = document.querySelector('#cc-main .cm');
        const r = barra?.getBoundingClientRect();
        const esperado = r && r.height > 0 ? Math.max(0, innerHeight - r.top) : 0;
        const atual = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cookie-bar-altura')) || 0;
        return Math.abs(esperado - atual) < 1;
      },
      null,
      { timeout: 4_000 },
    )
    .catch(() => {});
}

const botaoMenu = (page: Page) => page.getByRole('button', { name: 'Abrir menu de navegação' });
const painelMenu = (page: Page) => page.getByRole('dialog', { name: 'Menu de navegação' });

async function focoDentro(painel: Locator): Promise<boolean> {
  return painel.evaluate((p) => p.contains(document.activeElement));
}

async function rolagemTravada(page: Page): Promise<boolean> {
  return page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden');
}

// (2) Abaixo de lg: botão com aria, painel modal, foco preso e devolvido,
// rolagem travada, Esc e clique fora fecham, itens com 44px. Em lg+, o
// botão fica oculto.
async function conferirMenu(page: Page, l: Largura): Promise<{ problemas: Problema[]; botaoAusente: boolean }> {
  const problemas: Problema[] = [];
  const falha = (detalhe: string) => problemas.push({ categoria: 'menu', detalhe });
  const botao = botaoMenu(page);

  if (l.largura >= BREAKPOINT_LG) {
    if (await botao.isVisible()) falha('botão de menu visível a partir de lg (a Sidebar já está na tela)');
    return { problemas, botaoAusente: false };
  }

  if (!(await botao.isVisible())) {
    falha('botão "Abrir menu de navegação" ausente abaixo de lg');
    return { problemas, botaoAusente: true };
  }

  if ((await botao.getAttribute('aria-expanded')) !== 'false') falha('aria-expanded do botão não é "false" com o menu fechado');
  const controla = await botao.getAttribute('aria-controls');
  if (!controla) falha('botão sem aria-controls');
  const caixaBotao = await botao.boundingBox();
  if (caixaBotao && caixaBotao.height < ALVO_TOQUE_MENU) falha(`botão de menu com ${Math.round(caixaBotao.height)}px de altura (< 44px)`);

  await botao.click();
  const painel = painelMenu(page);
  if (!(await painel.waitFor({ state: 'visible', timeout: 3_000 }).then(() => true, () => false))) {
    falha('o clique no botão não abriu o painel (role="dialog" com nome "Menu de navegação")');
    return { problemas, botaoAusente: false };
  }
  await aguardarLayout(page);

  if ((await painel.getAttribute('aria-modal')) !== 'true') falha('painel sem aria-modal="true"');
  if (controla && (await painel.getAttribute('id')) !== controla) falha(`aria-controls="${controla}" não aponta para o painel`);
  if ((await botao.getAttribute('aria-expanded')) !== 'true') falha('aria-expanded do botão não vira "true" com o menu aberto');
  if (!(await focoDentro(painel))) falha('o foco não vai para dentro do painel ao abrir');
  if (!(await rolagemTravada(page))) falha('a rolagem da página não fica travada com o menu aberto');

  const links = painel.getByRole('link');
  const rotulos = (await links.allInnerTexts()).map((t) => t.trim());
  const faltando = ITENS_MENU.filter((i) => !rotulos.includes(i.rotulo)).map((i) => i.rotulo);
  if (faltando.length) falha(`itens ausentes no painel: ${faltando.join(', ')}`);
  for (const alvo of [...(await links.all()), painel.getByRole('button', { name: 'Fechar menu de navegação' })]) {
    const caixa = await alvo.boundingBox();
    if (caixa && caixa.height < ALVO_TOQUE_MENU - 0.5) {
      falha(`"${(await alvo.innerText()) || (await alvo.getAttribute('aria-label'))}" com ${Math.round(caixa.height)}px de altura (< 44px)`);
    }
  }
  for (const nome of await interativosSobWidgets(painel)) falha(`"${nome}" do painel fica sob um botão flutuante`);

  // Foco preso: mais Tabs do que há itens, nos dois sentidos.
  for (let i = 0; i < ITENS_MENU.length + 3; i++) await page.keyboard.press('Tab');
  if (!(await focoDentro(painel))) falha('Tab tira o foco de dentro do painel');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+Tab');
  if (!(await focoDentro(painel))) falha('Shift+Tab tira o foco de dentro do painel');

  await page.keyboard.press('Escape');
  if (!(await painel.waitFor({ state: 'hidden', timeout: 2_000 }).then(() => true, () => false))) {
    falha('Esc não fecha o painel');
  } else {
    if (!(await botao.evaluate((b) => b === document.activeElement))) falha('ao fechar com Esc o foco não volta ao botão');
    if (await rolagemTravada(page)) falha('a rolagem continua travada depois de fechar');
  }

  // Clique no fundo escuro, à direita do painel (que ocupa no máximo 85% da largura).
  if (!(await painel.isVisible())) {
    await botao.click();
    await painel.waitFor({ state: 'visible', timeout: 2_000 }).catch(() => {});
    await page.mouse.click(l.largura - 8, 120);
    if (!(await painel.waitFor({ state: 'hidden', timeout: 2_000 }).then(() => true, () => false))) {
      falha('clique no fundo escuro não fecha o painel');
      await page.keyboard.press('Escape');
    }
  }

  return { problemas, botaoAusente: false };
}

async function conferirModais(page: Page, modais: Modal[]): Promise<{ problemas: Problema[]; notas: string[] }> {
  const problemas: Problema[] = [];
  const notas: string[] = [];
  for (const m of modais) {
    const gatilho = m.gatilho(page);
    if (!(await gatilho.isVisible())) {
      notas.push(`${m.nome}: gatilho não exibido (não medido)`);
      continue;
    }
    await gatilho.click();
    const titulo = page.getByRole('heading', { name: m.titulo });
    await expect(titulo).toBeVisible();
    await aguardarLayout(page);
    problemas.push(...(await medirModal(titulo, m.nome)));
    notas.push(`${m.nome} medido`);
    const overlay = page.locator('div.fixed.inset-0').filter({ has: titulo });
    await overlay.getByRole('button', { name: m.fechar, exact: true }).click();
    await expect(titulo).toBeHidden();
  }
  return { problemas, notas };
}

let ids: Ids;

test.beforeAll(async () => {
  fs.mkdirSync(PASTA_CAPTURAS, { recursive: true });
  // Mesmos dados fictícios da suíte de idioma: um atendimento do histórico
  // semeado e um PEI criado aqui (cai junto com o aprendente na limpeza).
  const { a11y } = lerEstado();
  const ano = new Date().getFullYear() + 2;
  const sessoes = await chamarApi<{ id: string }[]>('GET', `/atendimentos/calendario?mes=1&ano=${ano}`, { token: a11y.token });
  const pei = await chamarApi<{ id: string }>('POST', '/peis', {
    token: a11y.token,
    corpo: {
      aprendenteId: a11y.aprendenteId,
      dificuldades: 'Dificuldade de decodificação na leitura.',
      objetivos: 'Ler palavras dissílabas com autonomia.',
      estrategias: 'Jogos fonológicos e leitura compartilhada.',
      dataInicio: `${new Date().getFullYear()}-01-01`,
    },
  });
  ids = { aprendenteId: a11y.aprendenteId, atendimentoId: sessoes[0].id, peiId: pei.id };
});

for (const [ordem, t] of TELAS.entries()) {
  test.describe(`D. Responsividade — ${t.autenticada ? 'autenticada' : 'pública'}`, () => {
    if (t.autenticada) test.use({ storageState: arquivoSessao('a11y') });

    test(`${t.tela}`, async ({ page }, testInfo) => {
      test.setTimeout(420_000);

      const semBotaoMenu: string[] = [];
      for (const [i, l] of LARGURAS.entries()) {
        // A tela é carregada de novo em cada largura, e não só
        // redimensionada: o Sienna grava o font-size calculado de cada texto
        // como estilo inline (data-asw-org-font-size) ao carregar, e as
        // fontes responsivas ficariam presas no tamanho da primeira largura.
        await page.setViewportSize({ width: l.largura, height: l.altura });
        await page.goto(t.rota(ids));
        await aguardarTela(page, t.titulo);
        // A resposta ao banner fica no cookie do contexto: só aparece uma vez.
        if (t.autenticada && i === 0) await responderBannerCookies(page);
        await t.preparar?.(page);
        await aguardarWidgets(page);
        await aguardarLayout(page);
        await page.evaluate(() => window.scrollTo(0, 0));

        const medicao = await medirTela(page, { conferirFonte: l.largura < BREAKPOINT_MD });
        const problemas = problemasDaMedicao(medicao);
        const notas: string[] = [];
        notas.push(
          medicao.widgetsPresentes.length
            ? `flutuantes presentes: ${medicao.widgetsPresentes.join(', ')}`
            : 'nenhum botão flutuante carregou',
        );

        if (t.autenticada) {
          const menu = await conferirMenu(page, l);
          problemas.push(...menu.problemas);
          if (menu.botaoAusente) semBotaoMenu.push(`${l.largura}x${l.altura}`);
          if (l.largura < BREAKPOINT_LG) notas.push('menu de navegação conferido');
        } else {
          notas.push('fora do layout autenticado: sem menu de navegação');
        }

        if (t.modais?.length) {
          const modais = await conferirModais(page, t.modais);
          problemas.push(...modais.problemas);
          notas.push(...modais.notas);
        }

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: caminhoCaptura(t.slug, l), fullPage: true });

        gravarResultadoResponsividade({
          ordem,
          tela: t.tela,
          slug: t.slug,
          rota: new URL(page.url()).pathname,
          largura: l.largura,
          altura: l.altura,
          problemas,
          notas,
        });
        testInfo.annotations.push({ type: 'responsividade', description: `${l.largura}x${l.altura}: ${problemas.length} problema(s)` });
      }

      expect(semBotaoMenu, 'botão de menu ausente abaixo de lg').toEqual([]);
    });
  });
}

test.describe('D. Responsividade — links do menu de navegação', () => {
  test.use({ storageState: arquivoSessao('a11y') });

  for (const l of LARGURAS.filter((x) => x.largura < BREAKPOINT_LG)) {
    test(`${l.largura}x${l.altura}`, async ({ page }) => {
      await page.setViewportSize({ width: l.largura, height: l.altura });
      await page.goto('/dashboard');
      await aguardarTela(page, /Olá, Terapeuta!/);
      await responderBannerCookies(page);

      const problemas: Problema[] = [];
      const botao = botaoMenu(page);
      await expect(botao, 'botão de menu ausente abaixo de lg').toBeVisible();

      for (const item of ITENS_MENU) {
        await botao.click();
        const painel = painelMenu(page);
        await expect(painel).toBeVisible();
        await painel.getByRole('link', { name: item.rotulo }).click();
        const navegou = await page.waitForURL(`**${item.rota}`, { timeout: 5_000 }).then(() => true, () => false);
        if (!navegou) problemas.push({ categoria: 'menu', detalhe: `"${item.rotulo}" não levou a ${item.rota}` });
        if (!(await painel.waitFor({ state: 'hidden', timeout: 2_000 }).then(() => true, () => false))) {
          problemas.push({ categoria: 'menu', detalhe: `painel continua aberto depois de clicar em "${item.rotulo}"` });
          await page.keyboard.press('Escape');
        }
        if (await rolagemTravada(page)) problemas.push({ categoria: 'menu', detalhe: `rolagem travada depois de navegar para ${item.rota}` });
      }

      gravarResultadoResponsividade({
        ordem: TELAS.length,
        tela: 'Menu de navegação — cada link do painel',
        slug: 'menu-links',
        rota: '/dashboard',
        largura: l.largura,
        altura: l.altura,
        problemas,
        notas: [`${ITENS_MENU.length} links clicados a partir do painel`],
      });
    });
  }
});
