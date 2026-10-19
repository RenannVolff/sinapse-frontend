# Suíte de navegador (Playwright)

Testes de ponta a ponta no Chromium, contra o frontend em dev e o backend real
ligado ao banco **de teste**:

- `fluxo.spec.ts` — **A. Fluxo entre páginas** (login, cadastro, aprendente,
  agenda com grade de horários e conflito, PEI a partir de molde, Relatórios
  nos 4 modos, exportação .docx, ConfirmDialog, sessão sem token — inclusive
  com duas abas abertas —, 2FA).
- `acessibilidade.spec.ts` — **B. Acessibilidade** (axe-core com as tags
  `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, e navegação só por
  teclado em login e cadastro). Gera
  [`relatorio-acessibilidade.md`](./relatorio-acessibilidade.md). Violações
  **não** falham os testes: o relatório é a entrega.
  [`relatorio-acessibilidade-inicial.md`](./relatorio-acessibilidade-inicial.md)
  é a auditoria feita antes das correções e não deve ser regenerado nem
  editado (é o "antes" do TCC).
- `idioma.spec.ts` — **C. Idioma** (percorre todas as rotas e alguns estados,
  como erro de login, diálogo de exclusão e relatório emitido, coletando o
  texto visível e `aria-label`/`placeholder`/`title`/`alt`; falha se achar
  termo comum de interface em inglês). Sienna e VLibras ficam de fora da
  verificação; um teste à parte só registra em que idioma eles aparecem.

## Pré-requisitos

1. Dependências instaladas nos dois repositórios, lado a lado:
   `C:\Projetos\sinapse-frontend` e `C:\Projetos\sinapse-backend`
   (`npm install` em cada um).
2. Navegador do Playwright: `npx playwright install chromium`.
3. Postgres **local** com o banco `sinapse_db_test` já migrado. O caminho
   mais simples é rodar uma vez a suíte e2e do backend (`npm run test:e2e`
   no backend), que cria o banco e aplica as migrations.
4. `DATABASE_URL_TEST` definida: como variável de ambiente ou no
   `../sinapse-backend/.env.test` (veja `.env.test.example` no backend).
5. Portas **3000** e **5173** livres: pare o `npm run start:dev` do backend
   e o `npm run dev` do frontend antes de rodar.

## Como rodar

```bash
npm run test:browser                                    # tudo
npx playwright test -c test-browser fluxo               # só o fluxo (A)
npx playwright test -c test-browser acessibilidade      # só acessibilidade (B)
npx playwright test -c test-browser idioma              # só idioma (C)
npx playwright show-report playwright-report            # relatório HTML da execução
```

Leva cerca de 2 a 3 minutos (a maior parte é a compilação do backend).

## O que o `npm run test:browser` faz

1. **Trava do banco** (`support/ambiente.ts`, executada ao carregar a config):
   a `DATABASE_URL_TEST` precisa apontar para `localhost`/`127.0.0.1` e o
   nome do banco precisa terminar em `_test`. Caso contrário, aborta antes de
   subir qualquer coisa. Nunca usa `sinapse_db` nem Neon.
2. **Sobe o backend em modo teste** (`webServer` em `playwright.config.ts`):
   `npm run start` em `../sinapse-backend` com estas variáveis, que vencem o
   `.env` do backend (o ConfigModule e o Prisma não sobrescrevem o que já está
   no ambiente):

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | a `DATABASE_URL_TEST` |
   | `JWT_SECRET` | segredo próprio da suíte |
   | `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | vazias → relatório cai na heurística |
   | `GMAIL_USER`, `GMAIL_APP_PASSWORD` | vazias → nenhum e-mail é enviado |
   | `NODE_ENV` | `test` |

   Para subir o backend assim à mão (PowerShell, no `sinapse-backend`):

   ```powershell
   $env:DATABASE_URL = "postgresql://postgres:SENHA@localhost:5432/sinapse_db_test?schema=public"
   $env:JWT_SECRET = "segredo-exclusivo-da-suite-playwright-nao-usar-em-producao"
   $env:GEMINI_API_KEY = ""; $env:GROQ_API_KEY = ""; $env:OPENROUTER_API_KEY = ""
   $env:GMAIL_USER = ""; $env:GMAIL_APP_PASSWORD = ""; $env:NODE_ENV = "test"
   npm run start
   ```

   `reuseExistingServer` é `false`: se já houver algo na porta 3000 (talvez um
   backend ligado ao banco real), a suíte falha em vez de usá-lo.
3. **Sobe o frontend** com `npm run dev` na porta 5173 (proxy `/backend-api`).
4. **Global setup** (`global-setup.ts`): cria pela API os terapeutas da suíte
   (e-mails `@playwright.sinapse.test`) e marca `emailVerificado = true` direto
   no banco de teste com `pg` (o token de verificação só existe em hash). Se o
   UPDATE não achar o usuário, o backend não está no banco de teste e a suíte
   aborta. Também prepara dados fictícios (aprendente, sessões, molde de PEI)
   e grava sessões de login em `test-browser/.estado/` (ignorado pelo git).
5. **Global teardown** (`global-teardown.ts`): monta
   `relatorio-acessibilidade.md` e apaga do banco de teste tudo o que pertence
   aos usuários `@playwright.sinapse.test`. Nada mais no banco é tocado.

## Detalhes

- **Rate limit:** o backend limita requisições por IP. Como a suíte e2e do
  backend, cada teste usa um `X-Forwarded-For` próprio (o backend confia no
  primeiro proxy), então os limites de cadastro e login não interferem.
- **Banner de cookies:** o vanilla-cookieconsent se esconde de navegadores
  automatizados (`navigator.webdriver`). A suíte desliga essa detecção para o
  banner aparecer como para o usuário real. Nos testes de fluxo ele é
  dispensado sozinho quando fica na frente de um clique. Enquanto está aberto,
  o foco do teclado fica circulando dentro dele até o usuário responder; isso
  é do widget e foi mantido de propósito (o consentimento exige resposta).
- **Datas:** a Agenda só mostra o mês corrente, então as sessões da agenda são
  criadas em horários futuros do mês atual. Nas últimas horas do último dia do
  mês, os testes que dependem disso são pulados (`skip`).
- **Saídas:** `test-results/` (traces e screenshots de falhas) e
  `playwright-report/` ficam fora do git.
