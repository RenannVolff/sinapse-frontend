import { DOMINIO_EMAIL_SUITE, SENHA_PADRAO, URL_BACKEND, type UsuarioSuite } from './ambiente';
import { marcarEmailVerificado } from './banco';

// Chamadas diretas à API do backend, para preparar dados que não são o foco
// do teste (o que é foco passa pela interface).

let contadorIp = 0;

// O ThrottlerGuard limita por IP e o backend confia no primeiro proxy
// (trust proxy = 1), então o X-Forwarded-For define o IP visto pelo rate
// limit. Mesmo recurso usado pela suíte e2e do backend: cada chamada (ou
// cada teste, no navegador) sai de um IP próprio e não esbarra nos limites
// de cadastro/login, que não são o que esta suíte verifica.
export function novoIp(): string {
  contadorIp++;
  const base = (process.pid % 200) + 20;
  return `10.${base}.${(contadorIp >> 8) & 255}.${contadorIp & 255}`;
}

// Nome de pessoa só aceita letras, espaço, hífen e apóstrofo: troca cada
// dígito de um sufixo único por uma letra (0→a ... 9→j).
export function emLetras(texto: string): string {
  return texto.replace(/\d/g, (d) => 'abcdefghij'[Number(d)]);
}

// O cadastro aceita e-mail de até 50 caracteres: data e sorteio em base 36
// para caber junto com o domínio da suíte (24 caracteres).
export function emailUnico(prefixo: string): string {
  const sufixo = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  return `${prefixo.slice(0, 12)}.${sufixo}@${DOMINIO_EMAIL_SUITE}`;
}

export async function chamarApi<T = unknown>(
  metodo: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  rota: string,
  opcoes: { token?: string; corpo?: unknown; esperado?: number } = {},
): Promise<T> {
  const resposta = await fetch(`${URL_BACKEND}${rota}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': novoIp(),
      ...(opcoes.token ? { Authorization: `Bearer ${opcoes.token}` } : {}),
    },
    body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
  });

  const esperado = opcoes.esperado ?? (metodo === 'POST' ? 201 : 200);
  const texto = await resposta.text();
  if (resposta.status !== esperado) {
    throw new Error(`${metodo} ${rota} respondeu ${resposta.status} (esperado ${esperado}): ${texto}`);
  }
  return (texto ? JSON.parse(texto) : undefined) as T;
}

// Cadastro pela API → e-mail marcado como verificado direto no banco de
// teste (o token só existe em hash) → login pela API.
export async function criarUsuarioVerificado(prefixo: string, nome: string): Promise<UsuarioSuite> {
  const email = emailUnico(prefixo);
  const cadastro = await chamarApi<{ id: string }>('POST', '/usuarios', {
    corpo: { nome, email, senha: SENHA_PADRAO },
  });
  await marcarEmailVerificado(email);
  const { token } = await login(email, SENHA_PADRAO);
  return { id: cadastro.id, nome, email, senha: SENHA_PADRAO, token };
}

export async function login(email: string, senha: string) {
  return chamarApi<{ token: string; usuario: Record<string, unknown> }>('POST', '/auth/login', {
    corpo: { email, senha },
    esperado: 200,
  });
}

export async function criarAprendente(token: string, nomeCompleto: string) {
  return chamarApi<{ id: string }>('POST', '/aprendentes', {
    token,
    corpo: {
      nomeCompleto,
      dataNascimento: '2016-03-10',
      responsavel: 'Responsável Fictício',
      contato: '(41) 99999-0000',
    },
  });
}

export async function criarTemplatePei(token: string, nome: string) {
  return chamarApi<{ id: string }>('POST', '/pei-templates', {
    token,
    corpo: {
      nome,
      dificuldades: 'Dificuldade de decodificação na leitura.',
      objetivos: 'Ler palavras dissílabas com autonomia.',
      estrategias: 'Jogos fonológicos e leitura compartilhada.',
    },
  });
}

export async function criarAtendimento(token: string, aprendenteId: string, inicio: Date, tituloSessao: string) {
  return chamarApi<{ id: string }>('POST', '/atendimentos', {
    token,
    corpo: { aprendenteId, dataAtendimento: inicio.toISOString(), duracaoMinutos: 60, tituloSessao },
  });
}

// Uma atividade (5 tentativas) com `acertos` tentativas marcadas: dá um
// score diferente por sessão, para os gráficos e a regressão terem forma.
export async function registrarAtividade(token: string, atendimentoId: string, acertos: number) {
  await chamarApi('POST', '/atividades', {
    token,
    corpo: { atendimentoId, titulo: 'Leitura de palavras', nivelDificuldade: 3 },
  });
  const sessao = await chamarApi<{ atividades: { itensChecklist: { id: string }[] }[] }>(
    'GET',
    `/atendimentos/${atendimentoId}`,
    { token },
  );
  const itens = sessao.atividades[0].itensChecklist.slice(0, acertos);
  for (const item of itens) {
    await chamarApi('PATCH', `/atividades/checklist/${item.id}`, { token, corpo: { realizado: true } });
  }
}

// Histórico para Relatórios: sessões em janeiro de daqui a dois anos (o
// backend recusa agendamento no passado), longe de qualquer horário que os
// testes usam na agenda do mês corrente.
export async function semearHistorico(token: string, aprendenteId: string, acertosPorSessao: number[]) {
  const ano = new Date().getFullYear() + 2;
  for (const [i, acertos] of acertosPorSessao.entries()) {
    const inicio = new Date(ano, 0, 5 + i * 7, 9, 0);
    const { id } = await criarAtendimento(token, aprendenteId, inicio, `Sessão de histórico ${i + 1}`);
    await registrarAtividade(token, id, acertos);
  }
}
