import { test as base, expect, type Page } from '@playwright/test';
import { novoIp } from './api';

// `test` da suíte: toda página já sai com
//  - um IP próprio nas chamadas ao backend (ver novoIp em api.ts);
//  - navigator.webdriver = false, para o banner de cookies aparecer;
//  - opcionalmente, o banner de cookies dispensado sozinho quando ele
//    estiver na frente de um clique (fluxo). A auditoria de acessibilidade
//    desliga isso para o banner entrar na análise como o usuário o vê.

interface OpcoesSuite {
  dispensarBannerCookies: boolean;
}

export const test = base.extend<OpcoesSuite & { ipPorTeste: void }>({
  dispensarBannerCookies: [true, { option: true }],

  ipPorTeste: [
    async ({ page, dispensarBannerCookies }, use) => {
      // O vanilla-cookieconsent esconde o banner de robôs (hideFromBots,
      // via navigator.webdriver). Sem isto o banner nunca aparece nos
      // testes, e a auditoria não o veria como o usuário real vê.
      await page.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
      });

      const ip = novoIp();
      await page.route('**/backend-api/**', (route) =>
        route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': ip } }),
      );

      if (dispensarBannerCookies) {
        await page.addLocatorHandler(
          page.locator('#cc-main').getByRole('button', { name: 'Rejeitar não essenciais' }),
          async (botao) => {
            await botao.click();
          },
        );
      }

      await use();
    },
    { auto: true },
  ],
});

export { expect };

// Espera a tela "assentar": rede ociosa e o cabeçalho da página visível.
export async function aguardarTela(page: Page, titulo: string | RegExp) {
  await expect(page.getByRole('heading', { name: titulo }).first()).toBeVisible({ timeout: 15_000 });
  // Widgets de terceiros (VLibras) podem continuar baixando recursos; a
  // espera é limitada e não falha o teste.
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
}
