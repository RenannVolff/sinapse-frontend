import * as fs from 'node:fs';
import {
  ARQUIVO_ESTADO,
  PASTA_ESTADO,
  PASTA_RESULTADOS_A11Y,
  URL_FRONTEND,
  arquivoSessao,
  resolverBancoTeste,
  type EstadoSuite,
  type UsuarioSuite,
} from './support/ambiente';
import { criarAprendente, criarAtendimento, criarTemplatePei, criarUsuarioVerificado, login, registrarAtividade, semearHistorico } from './support/api';
import { limparDadosDaSuite } from './support/banco';
import { horariosFuturosNoMes } from './support/horarios';

// Roda depois de o Playwright subir backend e frontend (webServer).
// Cria os terapeutas da suíte pela API, já verificados, e deixa uma sessão
// salva (localStorage) para os testes que não são sobre o login.
export default async function globalSetup(): Promise<void> {
  // Falha aqui antes de qualquer escrita, mesmo que o config já tenha checado.
  resolverBancoTeste();

  // Restos de uma execução interrompida (teardown que não rodou).
  await limparDadosDaSuite();

  fs.rmSync(PASTA_ESTADO, { recursive: true, force: true });
  fs.mkdirSync(PASTA_RESULTADOS_A11Y, { recursive: true });

  const fluxo = await criarUsuarioVerificado('fluxo', 'Terapeuta Fluxo');
  const doisFatores = await criarUsuarioVerificado('dois-fatores', 'Terapeuta Dois Fatores');
  const a11y = await criarUsuarioVerificado('a11y', 'Terapeuta Acessibilidade');

  // Dados para as telas auditadas não aparecerem vazias: um aprendente com
  // histórico (gráficos e regressão nos Relatórios), uma sessão no mês
  // corrente (Agenda) e um molde de PEI (Novo PEI).
  const aprendente = await criarAprendente(a11y.token, 'Aprendente Fictício Acessível');
  await semearHistorico(a11y.token, aprendente.id, [1, 3, 4]);
  const [horarioAgenda] = horariosFuturosNoMes();
  if (horarioAgenda) {
    const { id } = await criarAtendimento(a11y.token, aprendente.id, horarioAgenda.inicio, 'Sessão da agenda');
    await registrarAtividade(a11y.token, id, 2);
  }
  const template = await criarTemplatePei(a11y.token, 'Molde de leitura (a11y)');

  const estado: EstadoSuite = {
    fluxo,
    doisFatores,
    a11y: { ...a11y, aprendenteId: aprendente.id, templateId: template.id },
  };
  fs.writeFileSync(ARQUIVO_ESTADO, JSON.stringify(estado, null, 2));

  for (const chave of ['fluxo', 'doisFatores', 'a11y'] as const) {
    await salvarSessao(chave, estado[chave]);
  }
}

// Mesmo formato que o AuthProvider grava após o login pela tela.
async function salvarSessao(chave: keyof EstadoSuite, usuario: UsuarioSuite) {
  const { token, usuario: dadosUsuario } = await login(usuario.email, usuario.senha);
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: URL_FRONTEND,
        localStorage: [
          { name: '@SinapseEdu:token', value: token },
          { name: '@SinapseEdu:user', value: JSON.stringify(dadosUsuario) },
        ],
      },
    ],
  };
  fs.writeFileSync(arquivoSessao(chave), JSON.stringify(storageState, null, 2));
}
