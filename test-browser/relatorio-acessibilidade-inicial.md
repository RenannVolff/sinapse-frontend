# Relatório de acessibilidade — Sinapse Edu

Gerado automaticamente por `npm run test:browser` em 05/10/2026 às 20:23. Ferramenta: axe-core 4.13.0 (via @axe-core/playwright, textos em pt-BR), Chromium, viewport 1280×800. Regras: tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` (WCAG 2.2 nível AA).

Telas públicas (login, cadastro, esqueci a senha) são auditadas como no primeiro acesso, com o banner de cookies aberto; é nelas que o banner entra na análise. Telas autenticadas são auditadas depois de o banner ser respondido ("Rejeitar não essenciais"), como o usuário as vê no dia a dia: com o banner aberto o axe deixa de reportar ao menos uma regra do sistema (`aria-hidden-focus` em Relatórios). Os dados exibidos (aprendente, sessões, molde de PEI) são fictícios, criados pela própria suíte no banco de teste.

> Este relatório **só registra** os problemas encontrados; nada foi corrigido. Testes automáticos detectam uma parte das barreiras (em geral estimada entre 30% e 50%); leitor de tela, zoom de 200% e uso real continuam necessários para uma avaliação completa.

## Resumo — sistema

| Impacto | Regras distintas | Violações (regra × tela) | Elementos afetados |
|---|---:|---:|---:|
| Crítico | 3 | 15 | 19 |
| Sério | 2 | 5 | 5 |
| Moderado | 0 | 0 | 0 |
| Menor | 0 | 0 | 0 |
| **Total** | **5** | **20** | **24** |

"Violações (regra × tela)" conta uma regra uma vez por tela em que aparece; telas com o mesmo layout (cabeçalho, menu lateral) repetem as mesmas regras.

### Por tela

| Tela | Rota | Crítico | Sério | Moderado | Menor | Elementos | Regras aprovadas |
|---|---|---:|---:|---:|---:|---:|---:|
| Login | `/` | 0 | 0 | 0 | 0 | 0 | 26 |
| Cadastro | `/cadastro` | 0 | 0 | 0 | 0 | 0 | 26 |
| Esqueci a senha | `/esqueci-senha` | 0 | 0 | 0 | 0 | 0 | 25 |
| Dashboard | `/dashboard` | 1 | 0 | 0 | 0 | 1 | 25 |
| Lista de aprendentes | `/aprendentes` | 0 | 0 | 0 | 0 | 0 | 27 |
| Novo aprendente | `/aprendentes/novo` | 2 | 0 | 0 | 0 | 2 | 25 |
| Agenda | `/agenda` | 0 | 1 | 0 | 0 | 1 | 23 |
| Nova sessão | `/agenda/nova` | 3 | 0 | 0 | 0 | 3 | 26 |
| Relatórios — Relatório com IA | `/relatorios` | 2 | 1 | 0 | 0 | 5 | 24 |
| Relatórios — Acompanhamento (AB-ABAB) | `/relatorios` | 1 | 1 | 0 | 0 | 2 | 26 |
| Relatórios — Média por Período | `/relatorios` | 1 | 1 | 0 | 0 | 2 | 26 |
| Relatórios — Regressão Linear | `/relatorios` | 1 | 1 | 0 | 0 | 2 | 26 |
| Novo PEI | `/aprendentes/:id/pei/novo` | 3 | 0 | 0 | 0 | 4 | 25 |
| Configurações | `/configuracoes` | 1 | 0 | 0 | 0 | 2 | 25 |

## Violações do sistema por tela

### Login (`/`)

Nenhuma violação automática encontrada.

### Cadastro (`/cadastro`)

Nenhuma violação automática encontrada.

### Esqueci a senha (`/esqueci-senha`)

Nenhuma violação automática encontrada.

### Dashboard (`/dashboard`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `button-name` | Crítico | 1 | Botões devem ter texto discernível |

#### `button-name` — Crítico

- **Problema:** Botões devem ter texto discernível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento não tem texto interno que seja visível aos leitores de tela; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/button-name?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `.hover\:bg-primary-hover` — `<button type="submit" disabled="" class="bg-primary hover:bg-primary-hover text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">`

### Lista de aprendentes (`/aprendentes`)

Nenhuma violação automática encontrada.

### Novo aprendente (`/aprendentes/novo`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `button-name` | Crítico | 1 | Botões devem ter texto discernível |
| `label` | Crítico | 1 | Elementos de formulário devem ter rótulos |

#### `button-name` — Crítico

- **Problema:** Botões devem ter texto discernível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento não tem texto interno que seja visível aos leitores de tela; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/button-name?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `.rounded-2xl.gap-4.p-6 > .p-2.hover\:text-primary.hover\:bg-primary-light` — `<button class="p-2 text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors">`

#### `label` — Crítico

- **Problema:** Elementos de formulário devem ter rótulos.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; O elemento não tem um atributo 'placeholder'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/label?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `input[type="date"]` — `<input class="
            w-full ..." required="" type="date" value="">`

### Agenda (`/agenda`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `color-contrast` | Sério | 1 | Os elementos devem ter contraste de cor suficiente |

#### `color-contrast` — Sério

- **Problema:** Os elementos devem ter contraste de cor suficiente.
- **Critério(s) WCAG:** 1.4.3
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento tem contraste insuficiente no valor de 4.41 (cor do primeiro plano: #dc2626, cor de fundo: #fef2f2, tamanho da fonte: 10.5pt (14px), normal/negrito: normal). Contraste esperado no valor de 4.5:1 ([referência](https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `.text-red-600` — `<button class="flex items-center gap-1 px-3 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">`

### Nova sessão (`/agenda/nova`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `button-name` | Crítico | 1 | Botões devem ter texto discernível |
| `label` | Crítico | 1 | Elementos de formulário devem ter rótulos |
| `select-name` | Crítico | 1 | O elemento 'select' deve ter um nome acessível |

#### `button-name` — Crítico

- **Problema:** Botões devem ter texto discernível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento não tem texto interno que seja visível aos leitores de tela; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/button-name?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `.rounded-2xl.gap-4.p-6 > .p-2.rounded-full.transition-colors` — `<button class="p-2 hover:bg-primary-light rounded-full transition-colors">`

#### `label` — Crítico

- **Problema:** Elementos de formulário devem ter rótulos.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; O elemento não tem um atributo 'placeholder'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/label?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `input[min="2026-10-05"]` — `<input class="
            w-full ..." min="2026-10-05" required="" type="date" value="2026-10-05">`

#### `select-name` — Crítico

- **Problema:** O elemento 'select' deve ter um nome acessível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/select-name?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `select` — `<select class="w-full p-3.5 rounded-xl border border-primary-light focus:ring-2 focus:ring-primary outline-none bg-background focus:bg-white transition-all font-medium text-text-primary" required="">`

### Relatórios — Relatório com IA (`/relatorios`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `label` | Crítico | 2 | Elementos de formulário devem ter rótulos |
| `select-name` | Crítico | 2 | O elemento 'select' deve ter um nome acessível |
| `aria-hidden-focus` | Sério | 1 | Elementos ocultados através de ARIA não devem conter elementos focalizáveis |

#### `label` — Crítico

- **Problema:** Elementos de formulário devem ter rótulos.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; O elemento não tem um atributo 'placeholder'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/label?application=playwright&lang=pt-BR))
- **Elementos (2):**
  - `input[value="2026-01-01"]` — `<input class="
            w-full ..." required="" type="date" value="2026-01-01">`
  - `input[value="2028-12-31"]` — `<input class="
            w-full ..." required="" type="date" value="2028-12-31">`

#### `select-name` — Crítico

- **Problema:** O elemento 'select' deve ter um nome acessível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/select-name?application=playwright&lang=pt-BR))
- **Elementos (2):**
  - `.md\:col-span-1 > select` — `<select class="w-full bg-white border border-primary-light rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-text-primary cursor-pointer">`
  - `.gap-2.items-center.flex:nth-child(1) > select` — `<select class="text-sm font-medium text-text-primary bg-background border border-primary-light rounded-lg py-2 px-3 outline-none focus:border-primary cursor-pointer">`

#### `aria-hidden-focus` — Sério

- **Problema:** Elementos ocultados através de ARIA não devem conter elementos focalizáveis.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija todos os itens a seguir: Conteúdo focalizável deve ter tabindex='-1' ou ser removido do DOM ([referência](https://dequeuniversity.com/rules/axe/4.13/aria-hidden-focus?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `.max-w-5xl > div[aria-hidden="true"]` — `<div aria-hidden="true" style="position: fixed; top: 0px; left: -9999px; z-index: -1; width: 800px; height: 1260px;">`

### Relatórios — Acompanhamento (AB-ABAB) (`/relatorios`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `select-name` | Crítico | 1 | O elemento 'select' deve ter um nome acessível |
| `aria-hidden-focus` | Sério | 1 | Elementos ocultados através de ARIA não devem conter elementos focalizáveis |

#### `select-name` — Crítico

- **Problema:** O elemento 'select' deve ter um nome acessível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/select-name?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `select` — `<select class="w-full bg-white border border-primary-light rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-text-primary cursor-pointer">`

#### `aria-hidden-focus` — Sério

- **Problema:** Elementos ocultados através de ARIA não devem conter elementos focalizáveis.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija todos os itens a seguir: Conteúdo focalizável deve ter tabindex='-1' ou ser removido do DOM ([referência](https://dequeuniversity.com/rules/axe/4.13/aria-hidden-focus?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `.max-w-5xl > div[aria-hidden="true"]` — `<div aria-hidden="true" style="position: fixed; top: 0px; left: -9999px; z-index: -1; width: 800px; height: 1260px;">`

### Relatórios — Média por Período (`/relatorios`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `select-name` | Crítico | 1 | O elemento 'select' deve ter um nome acessível |
| `aria-hidden-focus` | Sério | 1 | Elementos ocultados através de ARIA não devem conter elementos focalizáveis |

#### `select-name` — Crítico

- **Problema:** O elemento 'select' deve ter um nome acessível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/select-name?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `select` — `<select class="w-full bg-white border border-primary-light rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-text-primary cursor-pointer">`

#### `aria-hidden-focus` — Sério

- **Problema:** Elementos ocultados através de ARIA não devem conter elementos focalizáveis.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija todos os itens a seguir: Conteúdo focalizável deve ter tabindex='-1' ou ser removido do DOM ([referência](https://dequeuniversity.com/rules/axe/4.13/aria-hidden-focus?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `.max-w-5xl > div[aria-hidden="true"]` — `<div aria-hidden="true" style="position: fixed; top: 0px; left: -9999px; z-index: -1; width: 800px; height: 1260px;">`

### Relatórios — Regressão Linear (`/relatorios`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `select-name` | Crítico | 1 | O elemento 'select' deve ter um nome acessível |
| `aria-hidden-focus` | Sério | 1 | Elementos ocultados através de ARIA não devem conter elementos focalizáveis |

#### `select-name` — Crítico

- **Problema:** O elemento 'select' deve ter um nome acessível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/select-name?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `select` — `<select class="w-full bg-white border border-primary-light rounded-lg py-3 px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-text-primary cursor-pointer">`

#### `aria-hidden-focus` — Sério

- **Problema:** Elementos ocultados através de ARIA não devem conter elementos focalizáveis.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija todos os itens a seguir: Conteúdo focalizável deve ter tabindex='-1' ou ser removido do DOM ([referência](https://dequeuniversity.com/rules/axe/4.13/aria-hidden-focus?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `.max-w-5xl > div[aria-hidden="true"]` — `<div aria-hidden="true" style="position: fixed; top: 0px; left: -9999px; z-index: -1; width: 800px; height: 1260px;">`

### Novo PEI (`/aprendentes/:id/pei/novo`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `button-name` | Crítico | 1 | Botões devem ter texto discernível |
| `label` | Crítico | 2 | Elementos de formulário devem ter rótulos |
| `select-name` | Crítico | 1 | O elemento 'select' deve ter um nome acessível |

#### `button-name` — Crítico

- **Problema:** Botões devem ter texto discernível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento não tem texto interno que seja visível aos leitores de tela; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/button-name?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `.gap-4.p-6.rounded-2xl > .p-2.transition-colors.hover\:text-primary` — `<button class="p-2 text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors">`

#### `label` — Crítico

- **Problema:** Elementos de formulário devem ter rótulos.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; O elemento não tem um atributo 'placeholder'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/label?application=playwright&lang=pt-BR))
- **Elementos (2):**
  - `.gap-1\.5.flex-col.w-full:nth-child(1) > .group.relative > input` — `<input class="
            w-full ..." required="" type="date" value="">`
  - `.gap-1\.5.flex-col.w-full:nth-child(2) > .group.relative > input` — `<input class="
            w-full ..." type="date" value="">`

#### `select-name` — Crítico

- **Problema:** O elemento 'select' deve ter um nome acessível.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/select-name?application=playwright&lang=pt-BR))
- **Elementos (1):**
  - `select` — `<select class="w-full p-3.5 rounded-xl border border-primary-light focus:ring-2 focus:ring-primary outline-none bg-background focus:bg-white transition-all font-medium">`

### Configurações (`/configuracoes`)

| Regra | Impacto | Elementos | Como corrigir |
|---|---|---:|---|
| `label` | Crítico | 2 | Elementos de formulário devem ter rótulos |

#### `label` — Crítico

- **Problema:** Elementos de formulário devem ter rótulos.
- **Critério(s) WCAG:** 4.1.2
- **Como corrigir:** Corrija qualquer um dos itens a seguir: O elemento de formulário não tem <label> implícito (envolvido); O elemento de formulário não tem um <label> explícito; O atributo 'aria-label' não existe ou está vazio; O atributo 'aria-labelledby' não existe, referencia elementos que não existem ou são vazios; O elemento não tem um atributo 'title'; O elemento não tem um atributo 'placeholder'; A semântica padrão do elemento não foi sobrescrita com role="none" or role="presentation" ([referência](https://dequeuniversity.com/rules/axe/4.13/label?application=playwright&lang=pt-BR))
- **Elementos (2):**
  - `input[value="Terapeuta Acessibilidade"]` — `<input class="
            w-full ..." required="" value="Terapeuta Acessibili...">`
  - `input[type="email"]` — `<input class="
            w-full ..." required="" type="email" value="a11y.<id>...">`

## Navegação só por teclado

A partir do carregamento da página, a tecla Tab é pressionada repetidamente. Para cada parada registra-se o elemento focado e se há indicador de foco visível (o estilo calculado do elemento muda ao receber foco: outline, sombra/anel, borda ou fundo). Critérios WCAG 2.1.1, 2.4.3 e 2.4.7.

### Teclado — Login

- **Ordem dos campos:** correta — `campo "admin@sinapse.edu.br"` → `campo "••••••••"` → `link "Esqueci minha senha"` → `botão "Entrar na Clínica"` → `link "Cadastre-se aqui"`
- **Foco visível:** presente em todas as paradas do sistema
- **Ciclo do Tab:** depois da parada 8, o foco volta para `botão "Aceitar todos" (<button>)` — o foco fica preso dentro do widget "Banner de cookies (vanilla-cookieconsent)" até o usuário agir nele.

| # | Elemento focado | Foco visível | Origem |
|---:|---|---|---|
| 1 | campo "admin@sinapse.edu.br" (<input type=email>) | sim | sistema |
| 2 | campo "••••••••" (<input type=password>) | sim | sistema |
| 3 | link "Esqueci minha senha" (<a>) | sim | sistema |
| 4 | botão "Entrar na Clínica" (<button>) | sim | sistema |
| 5 | link "Cadastre-se aqui" (<a>) | sim | sistema |
| 6 | botão "Aceitar todos" (<button>) | sim | Banner de cookies (vanilla-cookieconsent) |
| 7 | botão "Rejeitar não essenciais" (<button>) | sim | Banner de cookies (vanilla-cookieconsent) |
| 8 | botão "Gerenciar preferências" (<button>) | sim | Banner de cookies (vanilla-cookieconsent) |

### Teclado — Cadastro

- **Ordem dos campos:** correta — `campo "Ex: Dr. João Silva"` → `campo "seu@email.com.br"` → `campo "Mín. 8 char"` → `campo "Repita a senha"` → `botão "Cadastrar e Acessar"` → `link "Faça login aqui"`
- **Foco visível:** presente em todas as paradas do sistema
- **Ciclo do Tab:** depois da parada 9, o foco volta para `botão "Aceitar todos" (<button>)` — o foco fica preso dentro do widget "Banner de cookies (vanilla-cookieconsent)" até o usuário agir nele.

| # | Elemento focado | Foco visível | Origem |
|---:|---|---|---|
| 1 | campo "Ex: Dr. João Silva" (<input type=text>) | sim | sistema |
| 2 | campo "seu@email.com.br" (<input type=email>) | sim | sistema |
| 3 | campo "Mín. 8 char" (<input type=password>) | sim | sistema |
| 4 | campo "Repita a senha" (<input type=password>) | sim | sistema |
| 5 | botão "Cadastrar e Acessar" (<button>) | sim | sistema |
| 6 | link "Faça login aqui" (<a>) | sim | sistema |
| 7 | botão "Aceitar todos" (<button>) | sim | Banner de cookies (vanilla-cookieconsent) |
| 8 | botão "Rejeitar não essenciais" (<button>) | sim | Banner de cookies (vanilla-cookieconsent) |
| 9 | botão "Gerenciar preferências" (<button>) | sim | Banner de cookies (vanilla-cookieconsent) |

## Widgets de terceiros (fora do código do sistema)

Violações encontradas dentro do Sienna (menu de acessibilidade), do VLibras e do banner de cookies (vanilla-cookieconsent). São componentes externos: a correção depende do fornecedor, de configuração ou de substituição, não do código das telas. Ficam separadas para não distorcer os números do sistema.

| Impacto | Regras distintas | Violações (regra × tela) | Elementos afetados |
|---|---:|---:|---:|
| Crítico | 0 | 0 | 0 |
| Sério | 0 | 0 | 0 |
| Moderado | 0 | 0 | 0 |
| Menor | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** |

Nenhuma violação encontrada nos widgets de terceiros.
