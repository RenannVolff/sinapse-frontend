import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Configuração compartilhada pela playwright.config.ts, pelo global setup/
// teardown e pelos testes. Tudo que decide "em qual banco a suíte mexe"
// passa por resolverBancoTeste(), que aborta antes de qualquer coisa subir.

const AQUI = path.dirname(fileURLToPath(import.meta.url));

export const RAIZ_FRONTEND = path.resolve(AQUI, '..', '..');
export const RAIZ_BACKEND = path.resolve(RAIZ_FRONTEND, '..', 'sinapse-backend');
export const PASTA_SUITE = path.resolve(AQUI, '..');
export const PASTA_ESTADO = path.join(PASTA_SUITE, '.estado');
export const PASTA_RESULTADOS_A11Y = path.join(PASTA_ESTADO, 'a11y');
export const ARQUIVO_RELATORIO_A11Y = path.join(PASTA_SUITE, 'relatorio-acessibilidade.md');

export const URL_FRONTEND = 'http://localhost:5173';
export const URL_BACKEND = 'http://localhost:3000';

// Todo usuário criado pela suíte usa este domínio, e a limpeza só apaga
// usuários dele. Assim, nada que os testes de backend (ou alguém) criou
// no mesmo banco é tocado.
export const DOMINIO_EMAIL_SUITE = 'playwright.sinapse.test';
export const SENHA_PADRAO = 'SenhaForte@123';

// Segredo próprio: tokens emitidos aqui nunca valem no ambiente real.
export const JWT_SECRET_SUITE = 'segredo-exclusivo-da-suite-playwright-nao-usar-em-producao';

const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export interface BancoTeste {
  url: string;
  nomeBanco: string;
}

function lerDoEnvTestDoBackend(): string | undefined {
  const arquivo = path.join(RAIZ_BACKEND, '.env.test');
  if (!fs.existsSync(arquivo)) return undefined;
  const linha = fs.readFileSync(arquivo, 'utf8').match(/^\s*DATABASE_URL_TEST\s*=\s*(.+)\s*$/m);
  return linha?.[1].trim().replace(/^["']|["']$/g, '');
}

function abortar(motivo: string): never {
  throw new Error(`\n[test:browser] ABORTADO: ${motivo}\n`);
}

// Mesma trava da suíte e2e do backend: só Postgres LOCAL e banco *_test.
// Nunca sinapse_db, nunca Neon.
export function resolverBancoTeste(): BancoTeste {
  const url = process.env.DATABASE_URL_TEST?.trim() || lerDoEnvTestDoBackend();
  if (!url) {
    abortar(
      'DATABASE_URL_TEST não definida. Defina a variável de ambiente ou crie ' +
        '../sinapse-backend/.env.test (veja .env.test.example no backend).',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    abortar('DATABASE_URL_TEST não é uma URL válida.');
  }

  const nomeBanco = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!nomeBanco.endsWith('_test')) {
    abortar(`o banco da DATABASE_URL_TEST ("${nomeBanco}") não termina em _test.`);
  }
  if (!HOSTS_LOCAIS.has(parsed.hostname)) {
    abortar(`a DATABASE_URL_TEST aponta para "${parsed.hostname}"; a suíte só roda contra o Postgres local.`);
  }

  return { url, nomeBanco };
}

// Variáveis com que o backend sobe para a suíte. O ConfigModule e o Prisma
// não sobrescrevem o que já está em process.env, então estes valores vencem
// o .env do backend. Strings vazias (e não ausentes) para o .env não
// preencher as chaves: sem chave de IA o relatório cai na heurística, e sem
// SMTP nenhum e-mail é enviado.
export function ambienteBackendTeste(): Record<string, string> {
  const { url } = resolverBancoTeste();
  return {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: url,
    JWT_SECRET: JWT_SECRET_SUITE,
    GEMINI_API_KEY: '',
    GROQ_API_KEY: '',
    OPENROUTER_API_KEY: '',
    GMAIL_USER: '',
    GMAIL_APP_PASSWORD: '',
    FRONTEND_URL: URL_FRONTEND,
  };
}

export interface UsuarioSuite {
  id: string;
  nome: string;
  email: string;
  senha: string;
  token: string;
}

// Gravado pelo global setup e lido pelos testes.
export interface EstadoSuite {
  fluxo: UsuarioSuite;
  a11y: UsuarioSuite & { aprendenteId: string; templateId: string };
  doisFatores: UsuarioSuite;
}

export const ARQUIVO_ESTADO = path.join(PASTA_ESTADO, 'estado.json');

export function lerEstado(): EstadoSuite {
  return JSON.parse(fs.readFileSync(ARQUIVO_ESTADO, 'utf8')) as EstadoSuite;
}

export function arquivoSessao(chave: keyof EstadoSuite): string {
  return path.join(PASTA_ESTADO, `sessao-${chave}.json`);
}
