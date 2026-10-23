import { test, expect, aguardarTela } from './support/fixtures';
import { arquivoSessao, lerEstado } from './support/ambiente';
import { chamarApi, criarAprendente, criarAtendimento, emLetras } from './support/api';

// F. Correções pós-teste com especialista: limites, validação por campo,
// período invertido, edição de aprendente/sessão e lista completa de tarefas.

test.use({ storageState: arquivoSessao('a11y') });

test.describe('F. Correções pós-teste', () => {
  test('cadastro de aprendente: telefone colado, data futura, nome inválido e limite', async ({ page }) => {
    await page.goto('/aprendentes/novo');
    await aguardarTela(page, 'Cadastrar Aprendente');

    const nome = page.getByLabel('Nome Completo do Aprendente');
    await nome.fill('A'.repeat(80));
    await expect(nome).toHaveValue('A'.repeat(50)); // maxLength corta o excedente
    // Dígitos e símbolos somem na digitação; ponto é aceito ("Dr.", "Jr.").
    await nome.fill('Dr. João 123 Jr.!');
    await expect(nome).toHaveValue('Dr. João  Jr.');
    await nome.fill('.João');

    const telefone = page.getByLabel('Telefone / WhatsApp');
    await telefone.fill('-1e+999abc');
    await expect(telefone).toHaveValue('(19) 99');
    await telefone.fill('47999990000');
    await expect(telefone).toHaveValue('(47) 99999-0000');

    const futuro = `${new Date().getFullYear() + 1}-01-01`;
    await page.getByLabel('Data de Nascimento').fill(futuro);
    await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();

    await expect(page.getByText('Nome completo: use apenas letras, espaço, ponto, hífen ou apóstrofo.').first()).toBeVisible();
    await expect(page.getByText('Data de nascimento: não pode ser uma data futura.').first()).toBeVisible();
    await expect(page.getByText('Responsável: campo obrigatório.').first()).toBeVisible();
    await expect(page.getByText('Revise os campos destacados:')).toBeVisible();
    await expect(nome).toBeFocused();
  });

  test('editar aprendente e sessão', async ({ page }) => {
    const { a11y } = lerEstado();
    const sufixo = emLetras(Date.now().toString().slice(-5));
    const { id } = await criarAprendente(a11y.token, `Aprendente Editar ${sufixo}`);

    await page.goto('/aprendentes');
    await aguardarTela(page, 'Gestão de Aprendentes');
    await page.getByRole('button', { name: `Editar Aprendente Editar ${sufixo}` }).click();
    await aguardarTela(page, 'Editar Aprendente');
    await expect(page.getByLabel('Nome Completo do Aprendente')).toHaveValue(`Aprendente Editar ${sufixo}`);
    await expect(page.getByLabel('Data de Nascimento')).toHaveValue('2016-03-10');
    await page.getByLabel('Nome Completo do Aprendente').fill(`Aprendente Editado ${sufixo}`);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page).toHaveURL(/\/aprendentes$/);
    await expect(page.getByRole('cell', { name: `Aprendente Editado ${sufixo}`, exact: true })).toBeVisible();

    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 3);
    inicio.setHours(10, 0, 0, 0);
    const sessao = await criarAtendimento(a11y.token, id, inicio, `Sessão Editar ${sufixo}`);
    await page.goto(`/agenda/${sessao.id}/editar`);
    await aguardarTela(page, 'Editar Sessão');
    await expect(page.getByLabel('Foco Principal (Título)')).toHaveValue(`Sessão Editar ${sufixo}`);
    await expect(page.getByRole('button', { name: '10:00', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Foco Principal (Título)').fill(`Sessão Editada ${sufixo}`);
    await page.getByRole('button', { name: '11:00', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page).toHaveURL(/\/agenda$/);

    const atualizada = await chamarApi<{ tituloSessao: string; dataAtendimento: string }>('GET', `/atendimentos/${sessao.id}`, {
      token: a11y.token,
      esperado: 200,
    });
    expect(atualizada.tituloSessao).toBe(`Sessão Editada ${sufixo}`);
    expect(new Date(atualizada.dataAtendimento).getHours()).toBe(11);
  });

  test('relatório: período invertido é trocado com aviso', async ({ page }) => {
    await page.goto('/relatorios');
    await aguardarTela(page, 'Relatório Analítico de Evolução');
    await page.getByLabel('Data de Fim').fill('2026-03-01');
    await page.getByLabel('Data de Início').fill('2026-09-30');
    await expect(page.getByLabel('Data de Início')).toHaveValue('2026-03-01');
    await expect(page.getByLabel('Data de Fim')).toHaveValue('2026-09-30');
    await expect(page.getByText('Período ajustado automaticamente')).toBeVisible();

    const emissao = page.getByLabel('Data de emissão (Word)');
    await expect(emissao).toHaveAttribute('max', /\d{4}-\d{2}-\d{2}/);
  });

  test('PEI: fim antes do início e seção repetida apontam o campo certo', async ({ page }) => {
    const { a11y } = lerEstado();
    await page.goto(`/aprendentes/${a11y.aprendenteId}/pei/novo`);
    await aguardarTela(page, 'Novo PEI');
    await page.getByLabel('Dificuldades').fill('Texto igual');
    await page.getByLabel('Objetivos').fill('Texto igual');
    await page.getByLabel('Estratégias').fill('Outra coisa');
    await page.getByLabel('Data de Início').fill('2026-08-01');
    await page.getByLabel('Data de Fim (opcional)').fill('2026-07-01');
    await page.getByRole('button', { name: 'Cadastrar PEI' }).click();

    await expect(page.getByText('Data de fim: deve ser igual ou posterior à data de início.').first()).toBeVisible();
    await expect(page.getByText(/Objetivos: está igual à seção Dificuldades/).first()).toBeVisible();
    await expect(page.getByLabel('Objetivos')).toBeFocused();
    await expect(page.getByText('0/2000').first()).toBeHidden();
  });

  test('cadastro de usuário: e-mail inválido e sugestão do back', async ({ browser }) => {
    const contexto = await browser.newContext();
    const page = await contexto.newPage();
    await page.goto('/cadastro');
    await aguardarTela(page, 'Crie sua conta');
    await page.getByLabel('Nome Completo').fill('Profissional Teste');
    await page.getByLabel('E-mail Profissional').fill('  Fulano@@exemplo  ');
    await page.getByLabel('Criar Senha').fill('SenhaForte@123');
    await page.getByLabel('Confirmar').fill('SenhaForte@123');
    await page.getByRole('button', { name: 'Cadastrar e Acessar' }).click();
    await expect(page.getByText(/E-mail: informe um e-mail válido/).first()).toBeVisible();

    await page.getByLabel('E-mail Profissional').fill(`  Fulano.${Date.now().toString(36)}@GMIAL.com `);
    await page.getByRole('button', { name: 'Cadastrar e Acessar' }).click();
    const sugestao = page.getByRole('button', { name: /^Usar fulano\..+@gmail\.com$/ });
    await expect(sugestao).toBeVisible();
    await sugestao.click();
    await expect(page.getByLabel('E-mail Profissional')).toHaveValue(/^fulano\..+@gmail\.com$/);
    await contexto.close();
  });

  test('Minhas Tarefas: lista completa com "carregar mais"', async ({ page }) => {
    const { a11y } = lerEstado();
    for (let i = 1; i <= 23; i++) {
      await chamarApi('POST', '/tarefas', { token: a11y.token, corpo: { texto: `Tarefa em lote ${String(i).padStart(2, '0')}` } });
    }
    const todas = await chamarApi<unknown[]>('GET', '/tarefas', { token: a11y.token, esperado: 200 });

    await page.goto('/dashboard');
    await aguardarTela(page, 'Minhas Tarefas');
    await expect(page.getByText(`Mostrando 20 de ${todas.length}`)).toBeVisible();
    await page.getByRole('button', { name: /Carregar mais/ }).click();
    await expect(page.getByText(`${todas.length} no total`)).toBeVisible();
    await page.getByRole('button', { name: /^Todas/ }).click();
    await expect(page.getByRole('button', { name: /^Concluir "Tarefa em lote/ })).toHaveCount(23);
  });
});
