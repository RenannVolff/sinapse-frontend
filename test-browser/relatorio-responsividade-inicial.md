# Relatório de responsividade — Sinapse Edu

Gerado automaticamente por `npm run test:browser` (`responsividade.spec.ts`) em 20/10/2026 às 15:32. Chromium, larguras `320x568`, `360x740`, `390x844`, `768x1024`, `1024x768`, `1366x768`, `1920x1080`. Dados exibidos fictícios, criados pela suíte no banco de teste.

Em cada tela e largura a suíte confere:

1. **Rolagem horizontal:** `scrollWidth <= clientWidth` no documento e no `<main>` do layout; lista os elementos que passam da borda (↳ = elemento mais interno).
2. **Menu de navegação** (telas com o layout autenticado, abaixo de 1024px): o botão existe — a falta dele **falha o teste** —, abre o painel (`role="dialog"`, `aria-modal`, `aria-expanded`), prende o foco, trava a rolagem, fecha com Esc devolvendo o foco ao botão, itens com 44px de altura; a partir de 1024px o botão fica oculto. Um teste à parte clica em cada link do painel em cada largura.
3. **Alvos interativos menores que 24×24 px** (WCAG 2.5.8), com as exceções de link dentro de texto e de espaçamento; o rótulo de checkbox/radio conta como parte do alvo.
4. **Modais** (ConfirmDialog e os modais da sessão ativa): a caixa cabe na janela e, se o conteúdo for maior, rola por dentro.
5. **Campos com fonte menor que 16 px** abaixo de 768px (o Safari do iOS dá zoom ao focar esses campos).
6. **Elementos cobertos** pelos botões do Sienna e do VLibras ou pelo banner de cookies: em nenhuma posição de rolagem o centro do elemento fica livre.
7. **Captura de tela inteira** em `test-browser/capturas/<tela>-<largura>.png`.

> **Medição inicial, antes dos ajustes de layout** (parte C), já com o menu de navegação das telas pequenas (parte A). Arquivo congelado: não deve ser regenerado nem editado. O estado atual está em [`relatorio-responsividade.md`](./relatorio-responsividade.md).

Telas públicas são medidas como no primeiro acesso, com o banner de cookies aberto; telas autenticadas, depois de o banner ser respondido, como no uso diário (mesma convenção da auditoria de acessibilidade).

## Resumo

165 combinações (tela × largura) medidas; 37 com algum problema.

| Categoria | Ocorrências |
|---|---:|
| Rolagem horizontal | 15 |
| Menu de navegação | 0 |
| Alvo interativo < 24×24 px | 0 |
| Modal não cabe na tela | 0 |
| Campo com fonte < 16 px | 18 |
| Coberto por botão flutuante/banner | 52 |
| **Total** | **85** |

## Tela × largura

✅ = nenhum problema; número = ocorrências encontradas; — = não medida.

| Tela | Rota | 320 | 360 | 390 | 768 | 1024 | 1366 | 1920 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Login | `/` | ⚠️ 3 | ⚠️ 4 | ⚠️ 3 | ✅ | ⚠️ 1 | ⚠️ 1 | ✅ |
| Cadastro | `/cadastro` | ⚠️ 6 | ⚠️ 8 | ⚠️ 7 | ✅ | ⚠️ 1 | ⚠️ 1 | ✅ |
| Verificar e-mail (link sem token) | `/verificar-email` | ⚠️ 3 | ⚠️ 3 | ⚠️ 3 | ✅ | ✅ | ✅ | ✅ |
| Esqueci a senha | `/esqueci-senha` | ⚠️ 3 | ⚠️ 3 | ⚠️ 2 | ✅ | ✅ | ✅ | ✅ |
| Redefinir senha (link sem token) | `/redefinir-senha` | ⚠️ 3 | ⚠️ 3 | ⚠️ 3 | ✅ | ✅ | ✅ | ✅ |
| Página inexistente (404) | `/rota-que-nao-existe` | ⚠️ 1 | ⚠️ 1 | ⚠️ 1 | ✅ | ✅ | ✅ | ✅ |
| Painel | `/dashboard` | ⚠️ 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lista de aprendentes | `/aprendentes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Novo aprendente | `/aprendentes/novo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Detalhes do aprendente | `/aprendentes/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PEIs do aprendente | `/aprendentes/:id/pei` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Novo PEI | `/aprendentes/:id/pei/novo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Detalhes do PEI | `/pei/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modelos de PEI | `/pei-templates` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Novo modelo de PEI | `/pei-templates/novo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agenda | `/agenda` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nova sessão | `/agenda/nova` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sessão ativa | `/agenda/:id/sessao` | ⚠️ 1 | ⚠️ 1 | ⚠️ 1 | ⚠️ 1 | ⚠️ 1 | ✅ | ✅ |
| Relatórios | `/relatorios` | ⚠️ 2 | ⚠️ 2 | ⚠️ 2 | ✅ | ✅ | ✅ | ✅ |
| Relatórios — relatório emitido | `/relatorios` | ⚠️ 2 | ⚠️ 2 | ⚠️ 2 | ✅ | ✅ | ✅ | ✅ |
| Relatórios — gráfico Acompanhamento (AB-ABAB) | `/relatorios` | ⚠️ 1 | ⚠️ 1 | ⚠️ 1 | ✅ | ✅ | ✅ | ✅ |
| Auditoria | `/auditoria` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configurações | `/configuracoes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Menu de navegação — cada link do painel | `/dashboard` | ✅ | ✅ | ✅ | ✅ | — | — | — |

## Problemas por tela

### Login (`/`)

- **320×568**
  - Coberto por botão flutuante/banner (3):
    - `input#login-senha-de-acesso.w-full.bg-background.border-2.border-primary-light.rounded-xl "••••••••" sob banner de cookies`
    - `a.text-xs.font-bold.text-primary.transition-colors "Esqueci minha senha" sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Entrar na Clínica" sob banner de cookies`
- **360×740**
  - Coberto por botão flutuante/banner (4):
    - `input#login-senha-de-acesso.w-full.bg-background.border-2.border-primary-light.rounded-xl "••••••••" sob banner de cookies`
    - `a.text-xs.font-bold.text-primary.transition-colors "Esqueci minha senha" sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Entrar na Clínica" sob banner de cookies`
    - `a.text-primary.font-bold.transition-colors "Cadastre-se aqui" sob banner de cookies`
- **390×844**
  - Coberto por botão flutuante/banner (3):
    - `a.text-xs.font-bold.text-primary.transition-colors "Esqueci minha senha" sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Entrar na Clínica" sob banner de cookies`
    - `a.text-primary.font-bold.transition-colors "Cadastre-se aqui" sob banner de cookies`
- **1024×768**
  - Coberto por botão flutuante/banner (1):
    - `a.text-primary.font-bold.transition-colors "Cadastre-se aqui" sob banner de cookies`
- **1366×768**
  - Coberto por botão flutuante/banner (1):
    - `a.text-primary.font-bold.transition-colors "Cadastre-se aqui" sob banner de cookies`

### Cadastro (`/cadastro`)

- **320×568**
  - Campo com fonte < 16 px (4):
    - `input#cadastro-nome-completo.w-full.bg-background.border-2.border-primary-light.rounded-xl "Ex: Dr. João Silva" (14px)`
    - `input#cadastro-email.w-full.bg-background.border-2.border-primary-light.rounded-xl <e-mail> (14px)`
    - `input#cadastro-criar-senha.w-full.bg-background.border-2.border-primary-light.rounded-xl "Mín. 8 caracteres" (14px)`
    - `input#cadastro-confirmar.w-full.bg-background.border-2.border-primary-light.rounded-xl "Repita a senha" (14px)`
  - Coberto por botão flutuante/banner (2):
    - `input#cadastro-criar-senha.w-full.bg-background.border-2.border-primary-light.rounded-xl "Mín. 8 caracteres" sob banner de cookies`
    - `input#cadastro-confirmar.w-full.bg-background.border-2.border-primary-light.rounded-xl "Repita a senha" sob banner de cookies`
- **360×740**
  - Campo com fonte < 16 px (4):
    - `input#cadastro-nome-completo.w-full.bg-background.border-2.border-primary-light.rounded-xl "Ex: Dr. João Silva" (14px)`
    - `input#cadastro-email.w-full.bg-background.border-2.border-primary-light.rounded-xl <e-mail> (14px)`
    - `input#cadastro-criar-senha.w-full.bg-background.border-2.border-primary-light.rounded-xl "Mín. 8 caracteres" (14px)`
    - `input#cadastro-confirmar.w-full.bg-background.border-2.border-primary-light.rounded-xl "Repita a senha" (14px)`
  - Coberto por botão flutuante/banner (4):
    - `input#cadastro-criar-senha.w-full.bg-background.border-2.border-primary-light.rounded-xl "Mín. 8 caracteres" sob banner de cookies`
    - `input#cadastro-confirmar.w-full.bg-background.border-2.border-primary-light.rounded-xl "Repita a senha" sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Cadastrar e Acessar" sob banner de cookies`
    - `a.text-primary.font-bold.transition-colors "Entre aqui" sob banner de cookies`
- **390×844**
  - Campo com fonte < 16 px (4):
    - `input#cadastro-nome-completo.w-full.bg-background.border-2.border-primary-light.rounded-xl "Ex: Dr. João Silva" (14px)`
    - `input#cadastro-email.w-full.bg-background.border-2.border-primary-light.rounded-xl <e-mail> (14px)`
    - `input#cadastro-criar-senha.w-full.bg-background.border-2.border-primary-light.rounded-xl "Mín. 8 caracteres" (14px)`
    - `input#cadastro-confirmar.w-full.bg-background.border-2.border-primary-light.rounded-xl "Repita a senha" (14px)`
  - Coberto por botão flutuante/banner (3):
    - `input#cadastro-confirmar.w-full.bg-background.border-2.border-primary-light.rounded-xl "Repita a senha" sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Cadastrar e Acessar" sob banner de cookies`
    - `a.text-primary.font-bold.transition-colors "Entre aqui" sob banner de cookies`
- **1024×768**
  - Coberto por botão flutuante/banner (1):
    - `a.text-primary.font-bold.transition-colors "Entre aqui" sob banner de cookies`
- **1366×768**
  - Coberto por botão flutuante/banner (1):
    - `a.text-primary.font-bold.transition-colors "Entre aqui" sob banner de cookies`

### Verificar e-mail (link sem token) (`/verificar-email`)

- **320×568**
  - Coberto por botão flutuante/banner (3):
    - `input#verificaremail-email.w-full.bg-background.border-2.border-primary-light.rounded-xl <e-mail> sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Reenviar e-mail de verificação" sob banner de cookies`
    - `a.text-sm.text-primary.font-bold.transition-colors "Voltar para a tela de entrada" sob banner de cookies`
- **360×740**
  - Coberto por botão flutuante/banner (3):
    - `input#verificaremail-email.w-full.bg-background.border-2.border-primary-light.rounded-xl <e-mail> sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Reenviar e-mail de verificação" sob banner de cookies`
    - `a.text-sm.text-primary.font-bold.transition-colors "Voltar para a tela de entrada" sob banner de cookies`
- **390×844**
  - Coberto por botão flutuante/banner (3):
    - `input#verificaremail-email.w-full.bg-background.border-2.border-primary-light.rounded-xl <e-mail> sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Reenviar e-mail de verificação" sob banner de cookies`
    - `a.text-sm.text-primary.font-bold.transition-colors "Voltar para a tela de entrada" sob banner de cookies`

### Esqueci a senha (`/esqueci-senha`)

- **320×568**
  - Coberto por botão flutuante/banner (3):
    - `input#esquecisenha-email.w-full.bg-background.border-2.border-primary-light.rounded-xl <e-mail> sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Enviar link de recuperação" sob banner de cookies`
    - `a.text-sm.text-primary.font-bold.transition-colors "Voltar para a tela de entrada" sob banner de cookies`
- **360×740**
  - Coberto por botão flutuante/banner (3):
    - `input#esquecisenha-email.w-full.bg-background.border-2.border-primary-light.rounded-xl <e-mail> sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Enviar link de recuperação" sob banner de cookies`
    - `a.text-sm.text-primary.font-bold.transition-colors "Voltar para a tela de entrada" sob banner de cookies`
- **390×844**
  - Coberto por botão flutuante/banner (2):
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Enviar link de recuperação" sob banner de cookies`
    - `a.text-sm.text-primary.font-bold.transition-colors "Voltar para a tela de entrada" sob banner de cookies`

### Redefinir senha (link sem token) (`/redefinir-senha`)

- **320×568**
  - Coberto por botão flutuante/banner (3):
    - `a.w-full.pt-2 "Solicitar nova recuperação" sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Solicitar nova recuperação" sob banner de cookies`
    - `a.text-sm.text-primary.font-bold.transition-colors "Voltar para a tela de entrada" sob banner de cookies`
- **360×740**
  - Coberto por botão flutuante/banner (3):
    - `a.w-full.pt-2 "Solicitar nova recuperação" sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Solicitar nova recuperação" sob banner de cookies`
    - `a.text-sm.text-primary.font-bold.transition-colors "Voltar para a tela de entrada" sob banner de cookies`
- **390×844**
  - Coberto por botão flutuante/banner (3):
    - `a.w-full.pt-2 "Solicitar nova recuperação" sob banner de cookies`
    - `button.w-full.relative.group.overflow-hidden.rounded-xl "Solicitar nova recuperação" sob banner de cookies`
    - `a.text-sm.text-primary.font-bold.transition-colors "Voltar para a tela de entrada" sob banner de cookies`

### Página inexistente (404) (`/rota-que-nao-existe`)

- **320×568**
  - Coberto por botão flutuante/banner (1):
    - `button.py-3.px-4.rounded-lg.font-medium.transition-all "Voltar para o Início" sob banner de cookies`
- **360×740**
  - Coberto por botão flutuante/banner (1):
    - `button.py-3.px-4.rounded-lg.font-medium.transition-all "Voltar para o Início" sob banner de cookies`
- **390×844**
  - Coberto por botão flutuante/banner (1):
    - `button.py-3.px-4.rounded-lg.font-medium.transition-all "Voltar para o Início" sob banner de cookies`

### Painel (`/dashboard`)

- **320×568**
  - Rolagem horizontal (1):
    - `scrollWidth 350px > clientWidth 320px: button.bg-primary.text-white.p-3.rounded-xl.transition-colors "Adicionar tarefa" (borda direita em 350px); ↳ svg (borda direita em 338px)`

### Sessão ativa (`/agenda/:id/sessao`)

- **320×568**
  - Rolagem horizontal (1):
    - `scrollWidth 640px > clientWidth 320px: button.w-full.py-3.px-4.rounded-lg.font-medium "O aprendente não compareceu à sessão" (borda direita em 348px); button.w-full.py-3.px-4.rounded-lg.font-medium "A sessão não vai ocorrer (decisão do terapeuta ou …" (borda direita em 494px); button.w-full.py-3.px-4.rounded-lg.font-medium "Encerrar Sessão" (borda direita em 640px); ↳ svg (borda direita em 393px); ↳ svg (borda direita em 534px)`
- **360×740**
  - Rolagem horizontal (1):
    - `scrollWidth 640px > clientWidth 360px: button.w-full.py-3.px-4.rounded-lg.font-medium "A sessão não vai ocorrer (decisão do terapeuta ou …" (borda direita em 494px); button.w-full.py-3.px-4.rounded-lg.font-medium "Encerrar Sessão" (borda direita em 640px); ↳ svg (borda direita em 393px); ↳ svg (borda direita em 534px)`
- **390×844**
  - Rolagem horizontal (1):
    - `scrollWidth 640px > clientWidth 390px: button.w-full.py-3.px-4.rounded-lg.font-medium "A sessão não vai ocorrer (decisão do terapeuta ou …" (borda direita em 494px); button.w-full.py-3.px-4.rounded-lg.font-medium "Encerrar Sessão" (borda direita em 640px); ↳ svg (borda direita em 393px); ↳ svg (borda direita em 534px)`
- **768×1024**
  - Rolagem horizontal (1):
    - `scrollWidth 798px > clientWidth 768px: div.flex.gap-3 "Salvar e Pausar Marcar Falta Cancelar Encerrar Ses…" (borda direita em 798px); ↳ button.w-full.py-3.px-4.rounded-lg.font-medium "Encerrar Sessão" (borda direita em 798px)`
- **1024×768**
  - Rolagem horizontal (1):
    - `scrollWidth 1054px > clientWidth 1024px: div.flex.gap-3 "Salvar e Pausar Marcar Falta Cancelar Encerrar Ses…" (borda direita em 1054px); ↳ button.w-full.py-3.px-4.rounded-lg.font-medium "Encerrar Sessão" (borda direita em 1054px)`

### Relatórios (`/relatorios`)

- **320×568**
  - Rolagem horizontal (1):
    - `scrollWidth 578px > clientWidth 320px: div.inline-flex.items-center.gap-1.p-1.bg-white "Relatório com IA Acompanhamento (AB-ABAB) Média po…" (borda direita em 578px); button.py-3.rounded-lg.font-medium.transition-all.duration-200 "Emitir Relatório" (borda direita em 405px); ↳ button.flex.items-center.gap-2.px-4.py-2 "Acompanhamento (AB-ABAB)" (borda direita em 329px); ↳ svg (borda direita em 357px); ↳ svg (borda direita em 472px)`
  - Campo com fonte < 16 px (1):
    - `select#relatorios-tipo-grafico.text-sm.font-medium.text-text-primary.bg-background.border "Gráfico de LinhaGráfico de BarrasGráfico de Área" (14px)`
- **360×740**
  - Rolagem horizontal (1):
    - `scrollWidth 578px > clientWidth 360px: div.inline-flex.items-center.gap-1.p-1.bg-white "Relatório com IA Acompanhamento (AB-ABAB) Média po…" (borda direita em 578px); button.py-3.rounded-lg.font-medium.transition-all.duration-200 "Emitir Relatório" (borda direita em 405px); ↳ button.flex.items-center.gap-2.px-4.py-2 "Média por Período" (borda direita em 442px); ↳ svg (borda direita em 472px)`
  - Campo com fonte < 16 px (1):
    - `select#relatorios-tipo-grafico.text-sm.font-medium.text-text-primary.bg-background.border "Gráfico de LinhaGráfico de BarrasGráfico de Área" (14px)`
- **390×844**
  - Rolagem horizontal (1):
    - `scrollWidth 578px > clientWidth 390px: div.inline-flex.items-center.gap-1.p-1.bg-white "Relatório com IA Acompanhamento (AB-ABAB) Média po…" (borda direita em 578px); button.py-3.rounded-lg.font-medium.transition-all.duration-200 "Emitir Relatório" (borda direita em 405px); ↳ button.flex.items-center.gap-2.px-4.py-2 "Média por Período" (borda direita em 442px); ↳ svg (borda direita em 472px)`
  - Campo com fonte < 16 px (1):
    - `select#relatorios-tipo-grafico.text-sm.font-medium.text-text-primary.bg-background.border "Gráfico de LinhaGráfico de BarrasGráfico de Área" (14px)`

### Relatórios — relatório emitido (`/relatorios`)

- **320×568**
  - Rolagem horizontal (1):
    - `scrollWidth 578px > clientWidth 320px: div.inline-flex.items-center.gap-1.p-1.bg-white "Relatório com IA Acompanhamento (AB-ABAB) Média po…" (borda direita em 493px); ↳ button.flex.items-center.gap-2.px-4.py-2 "Média por Período" (borda direita em 357px); ↳ svg (borda direita em 387px)`
  - Campo com fonte < 16 px (1):
    - `select#relatorios-tipo-grafico.text-sm.font-medium.text-text-primary.bg-background.border "Gráfico de LinhaGráfico de BarrasGráfico de Área" (14px)`
- **360×740**
  - Rolagem horizontal (1):
    - `scrollWidth 578px > clientWidth 360px: div.inline-flex.items-center.gap-1.p-1.bg-white "Relatório com IA Acompanhamento (AB-ABAB) Média po…" (borda direita em 533px); ↳ button.flex.items-center.gap-2.px-4.py-2 "Média por Período" (borda direita em 397px); ↳ svg (borda direita em 427px)`
  - Campo com fonte < 16 px (1):
    - `select#relatorios-tipo-grafico.text-sm.font-medium.text-text-primary.bg-background.border "Gráfico de LinhaGráfico de BarrasGráfico de Área" (14px)`
- **390×844**
  - Rolagem horizontal (1):
    - `scrollWidth 578px > clientWidth 390px: div.inline-flex.items-center.gap-1.p-1.bg-white "Relatório com IA Acompanhamento (AB-ABAB) Média po…" (borda direita em 563px); ↳ button.flex.items-center.gap-2.px-4.py-2 "Média por Período" (borda direita em 427px); ↳ svg (borda direita em 457px)`
  - Campo com fonte < 16 px (1):
    - `select#relatorios-tipo-grafico.text-sm.font-medium.text-text-primary.bg-background.border "Gráfico de LinhaGráfico de BarrasGráfico de Área" (14px)`

### Relatórios — gráfico Acompanhamento (AB-ABAB) (`/relatorios`)

- **320×568**
  - Rolagem horizontal (1):
    - `scrollWidth 578px > clientWidth 320px: div.inline-flex.items-center.gap-1.p-1.bg-white "Relatório com IA Acompanhamento (AB-ABAB) Média po…" (borda direita em 569px); ↳ svg (borda direita em 348px); ↳ svg (borda direita em 463px)`
- **360×740**
  - Rolagem horizontal (1):
    - `scrollWidth 578px > clientWidth 360px: div.inline-flex.items-center.gap-1.p-1.bg-white "Relatório com IA Acompanhamento (AB-ABAB) Média po…" (borda direita em 578px); ↳ button.flex.items-center.gap-2.px-4.py-2 "Média por Período" (borda direita em 442px); ↳ svg (borda direita em 472px)`
- **390×844**
  - Rolagem horizontal (1):
    - `scrollWidth 578px > clientWidth 390px: div.inline-flex.items-center.gap-1.p-1.bg-white "Relatório com IA Acompanhamento (AB-ABAB) Média po…" (borda direita em 578px); ↳ button.flex.items-center.gap-2.px-4.py-2 "Média por Período" (borda direita em 442px); ↳ svg (borda direita em 472px)`

## Pendências mantidas

- **Motivo:** Em telas públicas a partir de 1024px, com a barra de cookies ainda aberta (primeiro acesso), o link do rodapé do cartão fica sob a barra e a página não rola, porque o cartão é centralizado na altura da tela. Abaixo de 1024px a tela ganha folga embaixo do tamanho da barra (variável --cookie-bar-altura); no desktop isso deslocaria o cartão para cima enquanto a barra estiver aberta, então não foi aplicado. A barra some assim que o usuário responde, e o link fica livre.
  - `Login 1024×768: a.text-primary.font-bold.transition-colors "Cadastre-se aqui" sob banner de cookies`
  - `Login 1366×768: a.text-primary.font-bold.transition-colors "Cadastre-se aqui" sob banner de cookies`
  - `Cadastro 1024×768: a.text-primary.font-bold.transition-colors "Entre aqui" sob banner de cookies`
  - `Cadastro 1366×768: a.text-primary.font-bold.transition-colors "Entre aqui" sob banner de cookies`

## O que foi conferido

- **Login:** flutuantes presentes: Sienna, VLibras, banner de cookies; fora do layout autenticado: sem menu de navegação
- **Cadastro:** flutuantes presentes: Sienna, VLibras, banner de cookies; fora do layout autenticado: sem menu de navegação
- **Verificar e-mail (link sem token):** flutuantes presentes: Sienna, VLibras, banner de cookies; fora do layout autenticado: sem menu de navegação
- **Esqueci a senha:** flutuantes presentes: Sienna, VLibras, banner de cookies; fora do layout autenticado: sem menu de navegação
- **Redefinir senha (link sem token):** flutuantes presentes: Sienna, VLibras, banner de cookies; fora do layout autenticado: sem menu de navegação
- **Página inexistente (404):** flutuantes presentes: Sienna, VLibras, banner de cookies; fora do layout autenticado: sem menu de navegação
- **Painel:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Lista de aprendentes:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido; ConfirmDialog "Excluir aprendente?" medido
- **Novo aprendente:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Detalhes do aprendente:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido; ConfirmDialog "Excluir aprendente?" medido
- **PEIs do aprendente:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Novo PEI:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Detalhes do PEI:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Modelos de PEI:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Novo modelo de PEI:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Agenda:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido; ConfirmDialog "Excluir sessão?" medido
- **Nova sessão:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Sessão ativa:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido; Modal "Encerrar Sessão?" medido; Modal "Marcar Falta?" medido; Modal "Cancelar Sessão?" medido; ConfirmDialog "Excluir sessão?" medido
- **Relatórios:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Relatórios — relatório emitido:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Relatórios — gráfico Acompanhamento (AB-ABAB):** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Auditoria:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Configurações:** flutuantes presentes: Sienna, VLibras; menu de navegação conferido
- **Menu de navegação — cada link do painel:** 7 links clicados a partir do painel
