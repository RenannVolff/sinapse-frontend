import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect, aguardarTela } from './support/fixtures';
import { PASTA_SUITE, arquivoSessao, lerEstado } from './support/ambiente';
import { chamarApi } from './support/api';
import { aguardarLayout, medirTela, type Largura } from './support/responsividade';

// E. Escala de fonte (painel de acessibilidade). O app limita a escala a
// 80%–150% e aplica na fonte raiz (rem). Aqui: cada tela autenticada na escala
// máxima, em celular e desktop, não pode criar rolagem horizontal nem
// elemento passando da borda; e os botões +/- do Sienna respeitam o teto sem
// gravar font-size em px nos textos. Capturas em test-results/escala-fonte/.

const ESCALA_MAXIMA = 1.5;
const PASTA_CAPTURAS = path.join(PASTA_SUITE, '..', 'test-results', 'escala-fonte');

const LARGURAS_ESCALA: Largura[] = [
  { largura: 390, altura: 844 },
  { largura: 1366, altura: 768 },
];

interface Ids {
  aprendenteId: string;
  atendimentoId: string;
  peiId: string;
}

interface Tela {
  slug: string;
  rota: (ids: Ids) => string;
  titulo: string | RegExp;
  preparar?: (page: Page) => Promise<void>;
}

const TELAS: Tela[] = [
  {
    slug: 'dashboard',
    rota: () => '/dashboard',
    titulo: /Olá, Terapeuta!/,
    preparar: async (page) => {
      await expect(page.getByText('Carregando tarefas...')).toBeHidden();
    },
  },
  { slug: 'aprendentes', rota: () => '/aprendentes', titulo: 'Gestão de Aprendentes' },
  { slug: 'aprendente-novo', rota: () => '/aprendentes/novo', titulo: 'Cadastrar Aprendente' },
  { slug: 'aprendente-editar', rota: (ids) => `/aprendentes/${ids.aprendenteId}/editar`, titulo: 'Editar Aprendente' },
  { slug: 'aprendente-detalhes', rota: (ids) => `/aprendentes/${ids.aprendenteId}`, titulo: 'Aprendente Fictício Acessível' },
  { slug: 'pei-lista', rota: (ids) => `/aprendentes/${ids.aprendenteId}/pei`, titulo: /PEIs de Aprendente Fictício Acessível/ },
  { slug: 'pei-novo', rota: (ids) => `/aprendentes/${ids.aprendenteId}/pei/novo`, titulo: 'Novo PEI' },
  { slug: 'pei-detalhes', rota: (ids) => `/pei/${ids.peiId}`, titulo: 'Plano Educacional Individualizado' },
  { slug: 'pei-modelos', rota: () => '/pei-templates', titulo: 'Modelos de PEI' },
  { slug: 'pei-modelo-novo', rota: () => '/pei-templates/novo', titulo: 'Novo Modelo de PEI' },
  {
    slug: 'agenda',
    rota: () => '/agenda',
    titulo: 'Agenda de Pendências',
    preparar: async (page) => {
      await expect(page.getByText('Carregando...')).toBeHidden();
    },
  },
  { slug: 'agenda-nova-sessao', rota: () => '/agenda/nova', titulo: 'Agendar Nova Sessão' },
  { slug: 'agenda-editar-sessao', rota: (ids) => `/agenda/${ids.atendimentoId}/editar`, titulo: 'Editar Sessão' },
  { slug: 'sessao-ativa', rota: (ids) => `/agenda/${ids.atendimentoId}/sessao`, titulo: /Sessão de histórico/ },
  {
    slug: 'relatorios',
    rota: () => '/relatorios',
    titulo: 'Relatório Analítico de Evolução',
    preparar: async (page) => {
      await page.locator('form select').first().selectOption({ label: 'Aprendente Fictício Acessível' });
      await expect(page.getByRole('button', { name: 'Exportar para Word (.docx)' })).toBeEnabled();
    },
  },
  { slug: 'configuracoes', rota: () => '/configuracoes', titulo: 'Minha Conta' },
];

let ids: Ids;

test.use({ storageState: arquivoSessao('a11y') });

test.beforeAll(async () => {
  fs.mkdirSync(PASTA_CAPTURAS, { recursive: true });
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

const fonteRaiz = (page: Page) =>
  page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));

test.describe('E. Escala de fonte — escala máxima', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((escala) => {
      localStorage.setItem('@SinapseEdu:escalaFonte', String(escala));
    }, ESCALA_MAXIMA);
  });

  for (const t of TELAS) {
    test(t.slug, async ({ page }) => {
      test.setTimeout(120_000);
      for (const l of LARGURAS_ESCALA) {
        await page.setViewportSize({ width: l.largura, height: l.altura });
        await page.goto(t.rota(ids));
        await aguardarTela(page, t.titulo);
        await t.preparar?.(page);
        await aguardarLayout(page);

        expect(await fonteRaiz(page)).toBeCloseTo(16 * ESCALA_MAXIMA, 1);

        const medicao = await medirTela(page, { conferirFonte: false });
        await page.screenshot({ path: path.join(PASTA_CAPTURAS, `${t.slug}-${l.largura}.png`), fullPage: true });

        expect(
          { rolagem: medicao.scrollWidth > medicao.clientWidth, transbordam: medicao.transbordam },
          `${t.slug} em ${l.largura}px`,
        ).toEqual({ rolagem: false, transbordam: [] });
      }
    });
  }
});

test.describe('E. Escala de fonte — painel do Sienna', () => {
  test('os botões +/- respeitam 80%–150% e não gravam px nos textos', async ({ page }) => {
    await page.goto('/dashboard');
    await aguardarTela(page, /Olá, Terapeuta!/);

    const botaoSienna = page.locator('.asw-menu-btn');
    const carregou = await botaoSienna.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true, () => false);
    test.skip(!carregou, 'Sienna não carregou (CDN fora do ar)');

    await botaoSienna.click();
    const mais = page.locator('.asw-plus[data-key="font-size"]');
    const menos = page.locator('.asw-minus[data-key="font-size"]');
    await expect(mais).toBeVisible();

    for (let i = 0; i < 10; i++) await mais.click();
    expect(await fonteRaiz(page)).toBeCloseTo(16 * ESCALA_MAXIMA, 1);
    await expect(page.locator('.asw-amount')).toHaveText('150%');

    for (let i = 0; i < 15; i++) await menos.click();
    expect(await fonteRaiz(page)).toBeCloseTo(16 * 0.8, 1);
    await expect(page.locator('.asw-amount')).toHaveText('80%');

    // Nenhum texto da aplicação com font-size inline do Sienna.
    const comPx = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll<HTMLElement>('[data-asw-org-font-size]')).filter(
          (el) => !el.closest('.asw-menu, .asw-widget') && el.style.fontSize,
        ).length,
    );
    expect(comPx).toBe(0);

    // A escala vale para a próxima tela e sobrevive ao recarregar.
    await page.goto('/aprendentes');
    await aguardarTela(page, 'Gestão de Aprendentes');
    expect(await fonteRaiz(page)).toBeCloseTo(16 * 0.8, 1);
  });
});
