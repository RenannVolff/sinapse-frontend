import * as fs from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect, aguardarTela } from './support/fixtures';
import { SENHA_PADRAO, URL_FRONTEND, arquivoSessao, lerEstado } from './support/ambiente';
import { criarAprendente, criarAtendimento, emailUnico, semearHistorico } from './support/api';
import { horariosFuturosNoMes } from './support/horarios';
import { gerarCodigoTotp } from './support/totp';

// A. Fluxo entre páginas, pela interface, contra o backend real (banco de
// teste). Dados que não são o foco de um teste são preparados pela API.

async function tokenDaPagina(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('@SinapseEdu:token'));
  expect(token, 'token de sessão no localStorage').toBeTruthy();
  return token!;
}

function menuLateral(page: Page) {
  return page.locator('aside nav');
}

// Cada sessão da Agenda é uma linha `div.group` com título, aprendente,
// horário, status e ações.
function cartaoDaSessao(page: Page, titulo: string) {
  return page.locator('div.group').filter({ has: page.getByRole('heading', { name: titulo }) });
}

test.describe('A. Fluxo entre páginas', () => {
  test('sem login, abrir /dashboard redireciona para a tela de login (/)', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(`${URL_FRONTEND}/`);
    await expect(page.getByRole('button', { name: 'Entrar na Clínica' })).toBeVisible();
  });

  test('cadastro mostra a tela de confirmação de e-mail', async ({ page }) => {
    const email = emailUnico('cadastro');

    await page.goto('/cadastro');
    await aguardarTela(page, 'Crie sua conta');
    await page.getByPlaceholder('Ex: Dr. João Silva').fill('Terapeuta Cadastro');
    await page.getByPlaceholder('seu@email.com.br').fill(email);
    await page.getByPlaceholder('Mín. 8 char').fill(SENHA_PADRAO);
    await page.getByPlaceholder('Repita a senha').fill(SENHA_PADRAO);
    await page.getByRole('button', { name: 'Cadastrar e Acessar' }).click();

    await expect(page.getByRole('heading', { name: 'Cadastro realizado!' })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reenviar email' })).toBeVisible();
    // Não entra direto no sistema: o login exige e-mail verificado.
    await expect(page).toHaveURL(`${URL_FRONTEND}/cadastro`);
  });

  test('jornada principal: login → dashboard → aprendente → sessão → agenda → PEI por molde → Relatórios (4 modos) → exportação .docx', async ({ page }, testInfo) => {
    const { fluxo } = lerEstado();
    const sufixo = Date.now().toString().slice(-5);
    const nomeAprendente = `Aprendente Fluxo ${sufixo}`;
    const tituloSessao = `Sessão de leitura ${sufixo}`;
    const nomeMolde = `Molde de leitura ${sufixo}`;

    // Um horário com folga de 1 h antes e depois no mesmo dia, para a
    // checagem de conflito enxergar os vizinhos na mesma grade.
    const horario = horariosFuturosNoMes().find((h) => h.inicio.getHours() >= 1 && h.inicio.getHours() <= 21);
    test.skip(!horario, 'Sem horário futuro no mês corrente (últimas horas do último dia do mês).');
    if (!horario) return;

    await test.step('login pela tela leva ao dashboard', async () => {
      await page.goto('/');
      await page.getByPlaceholder('admin@sinapse.edu.br').fill(fluxo.email);
      await page.getByPlaceholder('••••••••').fill(fluxo.senha);
      await page.getByRole('button', { name: 'Entrar na Clínica' }).click();

      await expect(page).toHaveURL(`${URL_FRONTEND}/dashboard`);
      await aguardarTela(page, /Olá, Terapeuta!/);
    });

    await test.step('cadastrar aprendente', async () => {
      await menuLateral(page).getByRole('link', { name: 'Meus Aprendentes' }).click();
      await aguardarTela(page, 'Gestão de Aprendentes');
      await page.getByRole('button', { name: 'Novo Aprendente' }).click();

      await aguardarTela(page, 'Cadastrar Aprendente');
      await page.getByPlaceholder('Ex: João da Silva').fill(nomeAprendente);
      await page.locator('input[type="date"]').fill('2017-05-20');
      await page.getByPlaceholder('Ex: Maria da Silva').fill('Responsável Fictício');
      await page.getByPlaceholder('(00) 00000-0000').fill('(41) 98888-7777');
      await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();

      await expect(page.getByText('Aprendente cadastrado com sucesso!')).toBeVisible();
      await expect(page).toHaveURL(`${URL_FRONTEND}/aprendentes`, { timeout: 10_000 });
      await expect(page.getByRole('cell', { name: nomeAprendente })).toBeVisible();
    });

    await test.step('agendar sessão pela grade de horários', async () => {
      await menuLateral(page).getByRole('link', { name: 'Agenda' }).click();
      await aguardarTela(page, 'Agenda de Pendências');
      await page.getByRole('button', { name: 'Agendar Sessão' }).click();

      await aguardarTela(page, 'Agendar Nova Sessão');
      await page.locator('select').selectOption({ label: nomeAprendente });
      await page.getByPlaceholder('Ex: Avaliação Inicial, Jogos Cognitivos...').fill(tituloSessao);
      await expect(page.getByText('Selecione uma data para ver os horários disponíveis.')).toBeVisible();
      await page.locator('input[type="date"]').fill(horario.data);
      const botaoHorario = page.getByRole('button', { name: horario.hora, exact: true });
      await expect(botaoHorario).toBeEnabled();
      await botaoHorario.click();
      await page.getByRole('button', { name: 'Confirmar Agendamento' }).click();

      await expect(page).toHaveURL(`${URL_FRONTEND}/agenda`);
    });

    await test.step('ver a sessão na agenda', async () => {
      await aguardarTela(page, 'Agenda de Pendências');
      const cartao = cartaoDaSessao(page, tituloSessao);
      await expect(cartao).toBeVisible();
      await expect(cartao).toContainText(nomeAprendente);
      await expect(cartao).toContainText('Aguardando confirmação');
      await expect(cartao).toContainText(horario.hora);
    });

    await test.step('horário em conflito fica bloqueado na grade', async () => {
      await page.getByRole('button', { name: 'Agendar Sessão' }).click();
      await aguardarTela(page, 'Agendar Nova Sessão');
      await page.locator('input[type="date"]').fill(horario.data);

      // Com 60 min de duração, começar 30 min antes ou 30 min depois
      // invadiria a sessão: bloqueado. 60 min antes/depois encosta sem
      // sobrepor: liberado.
      const deslocado = (min: number) => {
        const t = new Date(horario.inicio.getTime() + min * 60 * 1000);
        return page.getByRole('button', {
          name: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`,
          exact: true,
        });
      };
      await expect(deslocado(0)).toBeDisabled();
      await expect(deslocado(0)).toHaveClass(/line-through/);
      await expect(deslocado(-30)).toBeDisabled();
      await expect(deslocado(30)).toBeDisabled();
      await expect(deslocado(-60)).toBeEnabled();
      await expect(deslocado(60)).toBeEnabled();
    });

    await test.step('criar molde (template) de PEI', async () => {
      await menuLateral(page).getByRole('link', { name: 'Modelos de PEI' }).click();
      await aguardarTela(page, 'Templates de PEI');
      await page.getByRole('button', { name: 'Novo Template' }).click();
      await aguardarTela(page, 'Novo Template de PEI');
      await page.getByPlaceholder('Ex: Suporte para Dificuldades de Leitura').fill(nomeMolde);
      await page.getByPlaceholder('Descreva as dificuldades típicas cobertas por este template...').fill('Troca de fonemas surdos/sonoros.');
      await page.getByPlaceholder('Descreva os objetivos padrão deste template...').fill('Discriminar pares mínimos em 80% das tentativas.');
      await page.getByPlaceholder('Descreva as estratégias de suporte padrão deste template...').fill('Consciência fonológica com apoio visual.');
      await page.getByRole('button', { name: 'Cadastrar Template' }).click();

      await expect(page.getByText('Template cadastrado com sucesso!')).toBeVisible();
      await expect(page).toHaveURL(`${URL_FRONTEND}/pei-templates`, { timeout: 10_000 });
      await expect(page.getByText(nomeMolde)).toBeVisible();
    });

    await test.step('criar PEI do aprendente a partir do molde', async () => {
      await menuLateral(page).getByRole('link', { name: 'Meus Aprendentes' }).click();
      await page.getByRole('cell', { name: nomeAprendente }).click();
      await aguardarTela(page, nomeAprendente);
      await page.getByRole('button', { name: 'Ver PEIs' }).click();
      await aguardarTela(page, `PEIs de ${nomeAprendente}`);
      await page.getByRole('button', { name: 'Novo PEI' }).click();

      await aguardarTela(page, 'Novo PEI');
      await page.locator('select').selectOption({ label: nomeMolde });
      // O molde pré-preenche os três campos, que continuam editáveis.
      await expect(page.getByPlaceholder('Descreva as dificuldades específicas do aprendente...')).toHaveValue('Troca de fonemas surdos/sonoros.');
      await expect(page.getByPlaceholder('Descreva os objetivos do plano...')).toHaveValue('Discriminar pares mínimos em 80% das tentativas.');
      await expect(page.getByPlaceholder('Descreva as estratégias de suporte que serão adotadas...')).toHaveValue('Consciência fonológica com apoio visual.');
      await page.getByPlaceholder('Descreva os objetivos do plano...').fill('Discriminar pares mínimos em 90% das tentativas.');
      await page.locator('input[type="date"]').first().fill(horario.data);
      await page.getByRole('button', { name: 'Cadastrar PEI' }).click();

      await expect(page.getByText('PEI cadastrado com sucesso!')).toBeVisible();
      await expect(page).toHaveURL(/\/aprendentes\/[^/]+\/pei$/, { timeout: 10_000 });
      await expect(page.getByText('Discriminar pares mínimos em 90% das tentativas.').or(page.getByText('Troca de fonemas surdos/sonoros.')).first()).toBeVisible();
    });

    await test.step('abrir Relatórios nos 4 modos', async () => {
      // Duas sessões a mais (com atividades) pela API, para a regressão
      // linear ter os 3 pontos mínimos.
      const aprendenteId = page.url().match(/\/aprendentes\/([^/]+)\/pei$/)![1];
      await semearHistorico(await tokenDaPagina(page), aprendenteId, [2, 4]);

      await menuLateral(page).getByRole('link', { name: 'Relatórios' }).click();
      await aguardarTela(page, 'Relatório Analítico de Evolução');
      const exportar = page.getByRole('button', { name: 'Exportar para Word (.docx)' });
      await expect(exportar).toBeDisabled();
      await page.locator('form select').first().selectOption({ label: nomeAprendente });
      await expect(exportar).toBeEnabled();

      // 1) Relatório com IA — sem chave de IA, cai na heurística.
      await page.locator('input[type="date"]').nth(0).fill(horario.data);
      await page.locator('input[type="date"]').nth(1).fill(`${new Date().getFullYear() + 2}-12-31`);
      await page.getByRole('button', { name: 'Emitir Relatório' }).click();
      await expect(page.getByRole('heading', { name: 'Relatório Automático Sistêmico' })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole('heading', { name: 'Análise Cognitiva Gráfica' })).toBeVisible();

      // 2) Acompanhamento AB-ABAB
      await page.getByRole('button', { name: 'Acompanhamento (AB-ABAB)' }).click();
      await expect(page.getByRole('heading', { name: 'Gráfico de Acompanhamento (AB-ABAB)' })).toBeVisible();
      await expect(page.locator('main .recharts-surface').first()).toBeVisible();

      // 3) Média por Período
      await page.getByRole('button', { name: 'Média por Período' }).click();
      await expect(page.getByRole('heading', { name: 'Média por Período' })).toBeVisible();
      await expect(page.locator('main .recharts-bar-rectangle').first()).toBeVisible();

      // 4) Regressão Linear
      await page.getByRole('button', { name: 'Regressão Linear' }).click();
      await expect(page.getByRole('heading', { name: 'Regressão Linear' })).toBeVisible();
      await expect(page.getByText(/Tendência de melhora|Tendência de piora|Desempenho estável/)).toBeVisible();
    });

    await test.step('exportar .docx e conferir que o download aconteceu', async () => {
      const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
      await page.getByRole('button', { name: 'Exportar para Word (.docx)' }).click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.docx$/);
      const destino = testInfo.outputPath(download.suggestedFilename());
      await download.saveAs(destino);
      const conteudo = fs.readFileSync(destino);
      expect(conteudo.length).toBeGreaterThan(10_000);
      // .docx é um zip: começa com "PK".
      expect(conteudo.subarray(0, 2).toString('latin1')).toBe('PK');
      await expect(page.getByText('Relatório exportado para Word com sucesso.')).toBeVisible();
    });
  });

  test.describe('com sessão já iniciada', () => {
    test.use({ storageState: arquivoSessao('fluxo') });

    test('ConfirmDialog antes de excluir tarefa', async ({ page }) => {
      const texto = `Ligar para a escola ${Date.now().toString().slice(-5)}`;

      await page.goto('/dashboard');
      await aguardarTela(page, 'Minhas Tarefas');
      await page.getByPlaceholder('Adicionar nova tarefa...').fill(texto);
      await page.getByPlaceholder('Adicionar nova tarefa...').press('Enter');
      const tarefa = page.locator('div').filter({ hasText: texto }).filter({ has: page.getByRole('button', { name: 'Excluir tarefa' }) }).last();
      await expect(tarefa).toBeVisible();

      // Cancelar no diálogo não exclui.
      await tarefa.getByRole('button', { name: 'Excluir tarefa' }).click();
      await expect(page.getByRole('heading', { name: 'Excluir tarefa?' })).toBeVisible();
      await expect(page.getByText(`A tarefa "${texto}" será removida.`)).toBeVisible();
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Excluir tarefa?' })).toBeHidden();
      await expect(tarefa).toBeVisible();

      // Confirmar exclui, e a exclusão persiste após recarregar.
      await tarefa.getByRole('button', { name: 'Excluir tarefa' }).click();
      await page.getByRole('button', { name: 'Sim, Excluir' }).click();
      await expect(page.getByText(texto)).toBeHidden();
      await page.reload();
      await aguardarTela(page, 'Minhas Tarefas');
      await expect(page.getByText(texto)).toBeHidden();
    });

    test('ConfirmDialog antes de cancelar sessão', async ({ page }) => {
      const horarios = horariosFuturosNoMes();
      test.skip(horarios.length < 8, 'Sem horários futuros suficientes no mês corrente (fim do último dia do mês).');
      const titulo = `Sessão a cancelar ${Date.now().toString().slice(-5)}`;

      await page.goto('/dashboard');
      const token = await tokenDaPagina(page);
      const { id: aprendenteId } = await criarAprendente(token, `Aprendente Cancelamento ${Date.now().toString().slice(-5)}`);
      // O último horário do mês: longe do primeiro, usado pela jornada principal.
      await criarAtendimento(token, aprendenteId, horarios[horarios.length - 1].inicio, titulo);

      await page.goto('/agenda');
      await aguardarTela(page, 'Agenda de Pendências');
      const cartao = cartaoDaSessao(page, titulo);
      await expect(cartao).toBeVisible();

      // "Voltar" no diálogo mantém a sessão.
      await cartao.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Cancelar sessão?' })).toBeVisible();
      await expect(page.getByText(`A sessão "${titulo}" será marcada como cancelada`)).toBeVisible();
      await page.getByRole('button', { name: 'Voltar', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Cancelar sessão?' })).toBeHidden();
      await expect(cartao).toContainText('Aguardando confirmação');

      // Confirmar cancela: sai das pendências e aparece em "Ver cancelados".
      await cartao.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await page.getByRole('button', { name: 'Sim, Cancelar' }).click();
      await expect(page.getByText('Sessão cancelada.')).toBeVisible();
      await expect(page.getByRole('heading', { name: titulo })).toBeHidden();
      await page.getByRole('button', { name: /Ver cancelados/ }).click();
      await aguardarTela(page, 'Sessões Canceladas');
      const cancelada = cartaoDaSessao(page, titulo);
      await expect(cancelada).toContainText('Cancelado');
    });

    // Dois caminhos de "próxima navegação": carregar uma URL (endereço,
    // F5, link externo) e clicar no menu (navegação interna do React Router).
    test('token removido do localStorage: a próxima navegação por URL volta para /', async ({ page }) => {
      await page.goto('/dashboard');
      await aguardarTela(page, /Olá, Terapeuta!/);

      await page.evaluate(() => localStorage.removeItem('@SinapseEdu:token'));
      await page.goto('/agenda');

      await expect(page).toHaveURL(`${URL_FRONTEND}/`);
      await expect(page.getByRole('button', { name: 'Entrar na Clínica' })).toBeVisible();
    });

    // Duas abas da mesma sessão. Na aba B o token é apagado com a página
    // aberta: ela só descobre na próxima navegação pelo menu (o evento
    // "storage" não dispara na própria aba). A aba A recebe o evento e sai
    // sozinha, sem precisar navegar.
    test('token removido com duas abas abertas: a outra aba sai na hora e a aba atual sai ao navegar pelo menu', async ({ page, context }) => {
      const abaA = page;
      await abaA.goto('/dashboard');
      await aguardarTela(abaA, /Olá, Terapeuta!/);

      const abaB = await context.newPage();
      await abaB.goto('/dashboard');
      await aguardarTela(abaB, /Olá, Terapeuta!/);

      await abaB.evaluate(() => localStorage.removeItem('@SinapseEdu:token'));

      await expect(abaA).toHaveURL(`${URL_FRONTEND}/`);
      await expect(abaA.getByRole('button', { name: 'Entrar na Clínica' })).toBeVisible();
      expect(await abaA.evaluate(() => localStorage.getItem('@SinapseEdu:user')), 'usuário apagado do localStorage').toBeNull();

      await expect(abaB).toHaveURL(`${URL_FRONTEND}/dashboard`);
      await menuLateral(abaB).getByRole('link', { name: 'Agenda' }).click();
      await expect(abaB).toHaveURL(`${URL_FRONTEND}/`);
      await expect(abaB.getByRole('button', { name: 'Entrar na Clínica' })).toBeVisible();
    });
  });

  test.describe('2FA', () => {
    test.use({ storageState: arquivoSessao('doisFatores') });

    test('ativar 2FA em Configurações até exibir os códigos de backup', async ({ page }) => {
      await page.goto('/configuracoes');
      await aguardarTela(page, 'Minha Conta');
      await page.getByRole('button', { name: 'Ativar autenticação de dois fatores' }).click();

      await expect(page.getByRole('img', { name: 'QR code para configurar o app autenticador' })).toBeVisible();
      const segredo = (await page.locator('code').first().innerText()).trim();
      expect(segredo).toMatch(/^[A-Z2-7]+=*$/);

      // O que o app autenticador mostraria para esse segredo.
      await page.getByPlaceholder('000000').fill(gerarCodigoTotp(segredo));
      await page.getByRole('button', { name: 'Confirmar e ativar' }).click();

      await expect(page.getByText('Salve estes códigos de backup agora.')).toBeVisible();
      const codigos = page.locator('li.font-mono');
      await expect(codigos).toHaveCount(8);
      for (const codigo of await codigos.allInnerTexts()) {
        expect(codigo.trim()).toMatch(/^[A-Za-z0-9-]{6,}$/);
      }
      await expect(page.getByRole('button', { name: 'Já salvei meus códigos' })).toBeVisible();
    });
  });
});
