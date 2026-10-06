import { defineConfig, devices } from '@playwright/test';
import { RAIZ_BACKEND, RAIZ_FRONTEND, URL_BACKEND, URL_FRONTEND, ambienteBackendTeste, resolverBancoTeste } from './support/ambiente';

// Suíte de navegador (fluxo entre páginas + auditoria de acessibilidade).
// Roda com `npm run test:browser`; pré-requisitos em test-browser/README.md.
//
// A trava do banco roda aqui, no carregamento da config, antes de qualquer
// servidor subir: DATABASE_URL_TEST precisa ser Postgres local e terminar
// em _test. Nunca sinapse_db, nunca Neon.
const { nomeBanco } = resolverBancoTeste();
console.log(`[test:browser] Banco de teste: ${nomeBanco} (local)`);

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: '../test-results/browser',
  // Um worker, em ordem: os testes dividem o mesmo backend e o mesmo banco,
  // e o resultado precisa ser reprodutível para o relatório.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: '../playwright-report', open: 'never' }]],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  use: {
    baseURL: URL_FRONTEND,
    viewport: { width: 1280, height: 800 },
    locale: 'pt-BR',
    timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    acceptDownloads: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
  webServer: [
    {
      // Backend real apontando para o banco de teste, sem e-mail e sem IA.
      // reuseExistingServer: false de propósito: se já houver um backend na
      // porta 3000 (talvez ligado ao sinapse_db/Neon), a suíte não sobe em
      // vez de usá-lo.
      name: 'backend (teste)',
      command: 'npm run start',
      cwd: RAIZ_BACKEND,
      url: `${URL_BACKEND}/api/docs`,
      env: ambienteBackendTeste(),
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      // VITE_API_URL vazio força o proxy /backend-api → localhost:3000 do vite.config.ts.
      name: 'frontend (vite dev)',
      command: 'npm run dev -- --port 5173 --strictPort',
      cwd: RAIZ_FRONTEND,
      url: URL_FRONTEND,
      env: { VITE_API_URL: '' },
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
