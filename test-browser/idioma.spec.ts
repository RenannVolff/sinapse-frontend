import type { Page, TestInfo } from '@playwright/test';
import { test, expect, aguardarTela } from './support/fixtures';
import { arquivoSessao, lerEstado } from './support/ambiente';
import { WIDGETS_TERCEIROS } from './support/auditoria-a11y';
import { chamarApi } from './support/api';

// C. Idioma: percorre todas as rotas (e alguns estados que só aparecem
// depois de uma ação), coleta o texto visível e os atributos acessíveis e
// falha se achar termo comum de interface em inglês.
//
// Fica de fora o que está dentro do Sienna e do VLibras (widgets de
// terceiros, conferidos à parte no fim do arquivo, sem falhar). O banner de
// cookies entra: os textos dele são configurados em CookieBanner.tsx.

const WIDGETS_IGNORADOS = WIDGETS_TERCEIROS.filter((w) => !w.seletor.includes('#cc-main'));

// Termos procurados como palavra inteira, sem diferenciar maiúsculas.
const TERMOS_INGLES = [
  'Cancel', 'Save', 'Loading', 'Error', 'Submit', 'Login', 'Log in', 'Logout', 'Log out',
  'Sign in', 'Sign up', 'Sign out', 'Password', 'Username', 'Search', 'Back', 'Next',
  'Previous', 'Delete', 'Edit', 'Close', 'Yes', 'Success', 'Successfully', 'Failed',
  'Invalid', 'Required', 'Please', 'Confirm', 'Continue', 'Settings', 'Profile',
  'Dashboard', 'Template', 'Templates', 'Score', 'Backup', 'Upload', 'Download', 'Welcome',
  'Home', 'Forgot', 'Remember me', 'Not found', 'Try again', 'Something went wrong',
  'Unknown', 'Warning', 'Notifications', 'Add', 'Remove', 'Update', 'Send', 'Retry',
  'Show', 'Hide', 'Select', 'Filter', 'View', 'Details', 'Today', 'Week', 'Month', 'Year',
  'Email', 'Website', 'Feedback', 'Puzzle', 'Unauthorized', 'Forbidden',
  'Too many requests', 'Network Error', 'Request failed', 'Internal server error',
  'Bad request', 'must be', 'should not be', 'is required',
  'the', 'and', 'your', 'you', 'with', 'not', 'of',
];

// "No" também é português ("No período…"): só conta se for o texto inteiro.
const TERMOS_TEXTO_INTEIRO = ['No'];

// Nomes próprios e dados que podem conter um termo da lista sem ser
// tradução faltando. Saem do texto antes da busca.
const IGNORAR: RegExp[] = [
  /\S+@\S+/g, // e-mails (seu@email.com.br, usuários da suíte)
  /Sinapse Edu/g,
  /WhatsApp/g,
  /Word \(\.docx\)/g,
];

const LETRA = '[\\p{L}\\p{N}]';
const PADROES = TERMOS_INGLES.map((t) => ({
  termo: t,
  re: new RegExp(`(?<!${LETRA}|[-_])${t.replace(/ /g, '\\s+')}(?!${LETRA}|[-_])`, 'iu'),
}));

interface Trecho {
  origem: string;
  texto: string;
}

interface Achado {
  termo: string;
  origem: string;
  trecho: string;
}

async function coletarTextos(page: Page): Promise<Trecho[]> {
  return page.evaluate((widgets) => {
    const seletorWidgets = widgets.map((w) => w.seletor).join(', ');
    const deWidget = (el: Element) => !!el.closest(seletorWidgets);
    const trechos: { origem: string; texto: string }[] = [{ origem: 'document.title', texto: document.title }];

    const andador = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let no = andador.nextNode(); no; no = andador.nextNode()) {
      const texto = no.textContent?.trim();
      const pai = no.parentElement;
      if (!texto || !pai || deWidget(pai)) continue;
      if (pai.closest('script, style, noscript, template')) continue;
      // Opções de <select> fechado não são "visíveis", mas o usuário as vê.
      const visivel = pai.closest('option') ? true : pai.checkVisibility({ visibilityProperty: true });
      if (!visivel) continue;
      trechos.push({ origem: `texto <${pai.tagName.toLowerCase()}>`, texto });
    }

    const atributos = ['aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'placeholder', 'title', 'alt'];
    for (const el of Array.from(document.querySelectorAll('*'))) {
      if (deWidget(el)) continue;
      for (const a of atributos) {
        const v = el.getAttribute(a)?.trim();
        if (v) trechos.push({ origem: `${a} em <${el.tagName.toLowerCase()}>`, texto: v });
      }
      if (el instanceof HTMLInputElement && ['submit', 'button', 'reset'].includes(el.type) && el.value) {
        trechos.push({ origem: `value em <input type=${el.type}>`, texto: el.value });
      }
    }
    return trechos;
  }, WIDGETS_IGNORADOS);
}

function procurarIngles(trechos: Trecho[]): Achado[] {
  const achados: Achado[] = [];
  const vistos = new Set<string>();
  for (const { origem, texto } of trechos) {
    let limpo = texto.replace(/\s+/g, ' ');
    for (const re of IGNORAR) limpo = limpo.replace(re, ' ');

    const termos = PADROES.filter((p) => p.re.test(limpo)).map((p) => p.termo);
    if (TERMOS_TEXTO_INTEIRO.includes(limpo.trim())) {
      termos.push(limpo.trim());
    }
    for (const termo of termos) {
      const chave = `${termo}|${origem}|${texto}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      achados.push({ termo, origem, trecho: texto.length > 140 ? `${texto.slice(0, 140)}…` : texto });
    }
  }
  return achados;
}

async function verificarIdioma(page: Page, testInfo: TestInfo) {
  const trechos = await coletarTextos(page);
  const achados = procurarIngles(trechos);
  testInfo.annotations.push({
    type: 'idioma',
    description: `${trechos.length} trecho(s) verificado(s); ${achados.length} termo(s) em inglês`,
  });
  expect(trechos.length, 'nenhum texto coletado: a tela não carregou?').toBeGreaterThan(5);
  expect(achados, `termos em inglês em ${new URL(page.url()).pathname}`).toEqual([]);
}

test.describe('C. Idioma — telas públicas', () => {
  test('login', async ({ page }, testInfo) => {
    await page.goto('/');
    await aguardarTela(page, 'Sinapse Edu');
    await verificarIdioma(page, testInfo);
  });

  test('login com senha errada (mensagem de erro do backend)', async ({ page }, testInfo) => {
    await page.goto('/');
    await aguardarTela(page, 'Sinapse Edu');
    await page.getByPlaceholder('admin@sinapse.edu.br').fill('ninguem@playwright.sinapse.test');
    await page.getByPlaceholder('••••••••').fill('SenhaErrada@123');
    await page.getByRole('button', { name: 'Entrar na Clínica' }).click();
    await expect(page.locator('form .bg-red-50').first()).toBeVisible();
    await verificarIdioma(page, testInfo);
  });

  test('cadastro', async ({ page }, testInfo) => {
    await page.goto('/cadastro');
    await aguardarTela(page, 'Crie sua conta');
    await verificarIdioma(page, testInfo);
  });

  test('esqueci a senha', async ({ page }, testInfo) => {
    await page.goto('/esqueci-senha');
    await aguardarTela(page, 'Recuperar senha');
    await verificarIdioma(page, testInfo);
  });

  test('verificar e-mail (link sem token)', async ({ page }, testInfo) => {
    await page.goto('/verificar-email');
    await aguardarTela(page, 'Sinapse Edu');
    await expect(page.getByText('Link de verificação inválido')).toBeVisible();
    await verificarIdioma(page, testInfo);
  });

  test('redefinir senha (link sem token)', async ({ page }, testInfo) => {
    await page.goto('/redefinir-senha');
    await aguardarTela(page, 'Redefinir senha');
    await verificarIdioma(page, testInfo);
  });

  test('página inexistente (404)', async ({ page }, testInfo) => {
    await page.goto('/rota-que-nao-existe');
    await aguardarTela(page, /Deu batata!|Página não encontrada/);
    await verificarIdioma(page, testInfo);
  });
});

test.describe('C. Idioma — telas autenticadas', () => {
  test.use({ storageState: arquivoSessao('a11y') });

  // IDs que só existem depois do global setup: um atendimento do histórico
  // semeado (janeiro de daqui a dois anos) e um PEI criado aqui. O PEI cai
  // junto com o aprendente na limpeza da suíte.
  let atendimentoId: string;
  let peiId: string;

  test.beforeAll(async () => {
    const { a11y } = lerEstado();
    const ano = new Date().getFullYear() + 2;
    const sessoes = await chamarApi<{ id: string }[]>('GET', `/atendimentos/calendario?mes=1&ano=${ano}`, { token: a11y.token });
    atendimentoId = sessoes[0].id;
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
    peiId = pei.id;
  });

  test('dashboard (com o painel de notificações aberto)', async ({ page }, testInfo) => {
    await page.goto('/dashboard');
    await aguardarTela(page, /Olá, Terapeuta!/);
    await expect(page.getByText('Carregando tarefas...')).toBeHidden();
    await page.getByTitle('Notificações').click();
    await verificarIdioma(page, testInfo);
  });

  test('lista de aprendentes', async ({ page }, testInfo) => {
    await page.goto('/aprendentes');
    await aguardarTela(page, 'Gestão de Aprendentes');
    await expect(page.getByRole('cell', { name: 'Aprendente Fictício A11y' })).toBeVisible();
    await verificarIdioma(page, testInfo);
  });

  test('novo aprendente', async ({ page }, testInfo) => {
    await page.goto('/aprendentes/novo');
    await aguardarTela(page, 'Cadastrar Aprendente');
    await verificarIdioma(page, testInfo);
  });

  test('detalhes do aprendente (com o diálogo de exclusão aberto)', async ({ page }, testInfo) => {
    const { a11y } = lerEstado();
    await page.goto(`/aprendentes/${a11y.aprendenteId}`);
    await aguardarTela(page, 'Aprendente Fictício A11y');
    await page.getByRole('button', { name: 'Excluir aprendente' }).click();
    await expect(page.getByRole('heading', { name: 'Excluir aprendente?' })).toBeVisible();
    await verificarIdioma(page, testInfo);
  });

  test('PEIs do aprendente', async ({ page }, testInfo) => {
    const { a11y } = lerEstado();
    await page.goto(`/aprendentes/${a11y.aprendenteId}/pei`);
    await aguardarTela(page, /PEIs de Aprendente Fictício A11y/);
    await verificarIdioma(page, testInfo);
  });

  test('novo PEI', async ({ page }, testInfo) => {
    const { a11y } = lerEstado();
    await page.goto(`/aprendentes/${a11y.aprendenteId}/pei/novo`);
    await aguardarTela(page, 'Novo PEI');
    await verificarIdioma(page, testInfo);
  });

  test('detalhes do PEI', async ({ page }, testInfo) => {
    await page.goto(`/pei/${peiId}`);
    await aguardarTela(page, 'Plano Educacional Individualizado');
    await verificarIdioma(page, testInfo);
  });

  test('modelos de PEI', async ({ page }, testInfo) => {
    await page.goto('/pei-templates');
    await aguardarTela(page, 'Modelos de PEI');
    await expect(page.getByText('Molde de leitura (a11y)')).toBeVisible();
    await verificarIdioma(page, testInfo);
  });

  test('novo modelo de PEI', async ({ page }, testInfo) => {
    await page.goto('/pei-templates/novo');
    await aguardarTela(page, 'Novo Modelo de PEI');
    await verificarIdioma(page, testInfo);
  });

  test('agenda', async ({ page }, testInfo) => {
    await page.goto('/agenda');
    await aguardarTela(page, 'Agenda de Pendências');
    await expect(page.getByText('Carregando...')).toBeHidden();
    await verificarIdioma(page, testInfo);
  });

  test('nova sessão', async ({ page }, testInfo) => {
    await page.goto('/agenda/nova');
    await aguardarTela(page, 'Agendar Nova Sessão');
    await verificarIdioma(page, testInfo);
  });

  test('sessão ativa', async ({ page }, testInfo) => {
    await page.goto(`/agenda/${atendimentoId}/sessao`);
    await aguardarTela(page, /Sessão de histórico/);
    await verificarIdioma(page, testInfo);
  });

  test.describe('relatórios', () => {
    async function abrirRelatorios(page: Page) {
      await page.goto('/relatorios');
      await aguardarTela(page, 'Relatório Analítico de Evolução');
      await page.locator('form select').first().selectOption({ label: 'Aprendente Fictício A11y' });
      await expect(page.getByRole('button', { name: 'Exportar para Word (.docx)' })).toBeEnabled();
    }

    test('relatórios — relatório emitido', async ({ page }, testInfo) => {
      await abrirRelatorios(page);
      const hoje = new Date();
      await page.locator('input[type="date"]').nth(0).fill(`${hoje.getFullYear()}-01-01`);
      await page.locator('input[type="date"]').nth(1).fill(`${hoje.getFullYear() + 2}-12-31`);
      await page.getByRole('button', { name: 'Emitir Relatório' }).click();
      await expect(page.getByRole('heading', { name: 'Relatório Automático Sistêmico' })).toBeVisible({ timeout: 30_000 });
      await verificarIdioma(page, testInfo);
    });

    for (const modo of ['Acompanhamento (AB-ABAB)', 'Média por Período', 'Regressão Linear']) {
      test(`relatórios — ${modo}`, async ({ page }, testInfo) => {
        await abrirRelatorios(page);
        await page.getByRole('button', { name: modo }).click();
        await expect(page.locator('main .recharts-surface').first()).toBeVisible();
        // Passa o mouse no gráfico para o tooltip (rótulo da série) aparecer.
        // Há também uma cópia fora da tela (captura para o .docx): usa a
        // primeira que está dentro da página.
        const graficos = page.locator('main .recharts-surface');
        for (let i = 0; i < (await graficos.count()); i++) {
          const caixa = await graficos.nth(i).boundingBox();
          if (caixa && caixa.x >= 0 && caixa.y >= 0) {
            await graficos.nth(i).scrollIntoViewIfNeeded();
            await graficos.nth(i).hover();
            break;
          }
        }
        await verificarIdioma(page, testInfo);
      });
    }
  });

  test('auditoria', async ({ page }, testInfo) => {
    await page.goto('/auditoria');
    await aguardarTela(page, 'Registro de Auditoria');
    await verificarIdioma(page, testInfo);
  });

  test('configurações', async ({ page }, testInfo) => {
    await page.goto('/configuracoes');
    await aguardarTela(page, 'Minha Conta');
    await verificarIdioma(page, testInfo);
  });
});

// Informativo (não falha): em que idioma os widgets de terceiros aparecem.
// O pacote de idioma do Sienna vem do CDN, então a resposta depende da rede.
test.describe('C. Idioma — widgets de terceiros (informativo)', () => {
  test('Sienna e VLibras', async ({ page }, testInfo) => {
    await page.goto('/');
    await aguardarTela(page, 'Sinapse Edu');
    const relatar = (widget: string, textos: string[]) => {
      const achados = procurarIngles(textos.map((texto) => ({ origem: widget, texto })));
      const termos = [...new Set(achados.map((a) => a.termo))];
      const descricao = `${widget}: ${textos.length} trecho(s); em inglês: ${termos.length ? termos.join(', ') : 'nenhum'}`;
      testInfo.annotations.push({ type: 'widget', description: descricao });
      console.log(`[idioma] ${descricao}`);
      if (achados.length) console.log(`[idioma] exemplos (${widget}): ${achados.slice(0, 8).map((a) => `"${a.trecho}"`).join(' | ')}`);
    };

    const textosDe = (seletor: string) =>
      page.evaluate((s) => {
        const saida: string[] = [];
        for (const el of Array.from(document.querySelectorAll(s))) {
          for (const a of ['aria-label', 'title', 'placeholder', 'alt']) {
            const v = el.getAttribute(a)?.trim();
            if (v) saida.push(v);
          }
          if (el.childElementCount === 0 && el.textContent?.trim()) saida.push(el.textContent.trim());
        }
        return [...new Set(saida)];
      }, seletor);

    const botaoSienna = page.locator('.asw-menu-btn');
    if (await botaoSienna.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true, () => false)) {
      await botaoSienna.click();
      await page.locator('.asw-menu').waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      // Dá tempo de o pacote de idioma (CDN) ser aplicado.
      await page.waitForTimeout(1_500);
      relatar('Sienna', await textosDe('.asw-widget, .asw-widget *, .asw-menu, .asw-menu *'));
    } else {
      relatar('Sienna (não carregou)', []);
    }

    const vlibras = WIDGETS_TERCEIROS.find((w) => w.nome === 'VLibras')!;
    relatar('VLibras', await textosDe(vlibras.seletor.split(',').map((s) => `${s.trim()}, ${s.trim()} *`).join(', ')));
  });
});
