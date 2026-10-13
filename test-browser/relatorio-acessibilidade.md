# Relatório de acessibilidade — Sinapse Edu

Gerado automaticamente por `npm run test:browser` em 09/10/2026 às 15:19. Ferramenta: axe-core 4.13.0 (via @axe-core/playwright, textos em pt-BR), Chromium, viewport 1280×800. Regras: tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` (WCAG 2.2 nível AA).

Telas públicas (login, cadastro, esqueci a senha) são auditadas como no primeiro acesso, com o banner de cookies aberto; é nelas que o banner entra na análise. Telas autenticadas são auditadas depois de o banner ser respondido ("Rejeitar não essenciais"), como o usuário as vê no dia a dia: com o banner aberto o axe deixa de reportar ao menos uma regra do sistema (verificado na auditoria inicial com `aria-hidden-focus` em Relatórios). Os dados exibidos (aprendente, sessões, molde de PEI) são fictícios, criados pela própria suíte no banco de teste.

> Este relatório mostra o estado **depois das correções**; o estado anterior, sem nenhuma correção, está congelado em [`relatorio-acessibilidade-inicial.md`](./relatorio-acessibilidade-inicial.md). Testes automáticos detectam uma parte das barreiras (em geral estimada entre 30% e 50%); leitor de tela, zoom de 200% e uso real continuam necessários para uma avaliação completa.

## Resumo — sistema

| Impacto | Regras distintas | Violações (regra × tela) | Elementos afetados |
|---|---:|---:|---:|
| Crítico | 0 | 0 | 0 |
| Sério | 0 | 0 | 0 |
| Moderado | 0 | 0 | 0 |
| Menor | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** |

"Violações (regra × tela)" conta uma regra uma vez por tela em que aparece; telas com o mesmo layout (cabeçalho, menu lateral) repetem as mesmas regras.

### Por tela

| Tela | Rota | Crítico | Sério | Moderado | Menor | Elementos | Regras aprovadas |
|---|---|---:|---:|---:|---:|---:|---:|
| Login | `/` | 0 | 0 | 0 | 0 | 0 | 26 |
| Cadastro | `/cadastro` | 0 | 0 | 0 | 0 | 0 | 26 |
| Esqueci a senha | `/esqueci-senha` | 0 | 0 | 0 | 0 | 0 | 25 |
| Dashboard | `/dashboard` | 0 | 0 | 0 | 0 | 0 | 25 |
| Lista de aprendentes | `/aprendentes` | 0 | 0 | 0 | 0 | 0 | 27 |
| Novo aprendente | `/aprendentes/novo` | 0 | 0 | 0 | 0 | 0 | 25 |
| Agenda | `/agenda` | 0 | 0 | 0 | 0 | 0 | 23 |
| Nova sessão | `/agenda/nova` | 0 | 0 | 0 | 0 | 0 | 27 |
| Relatórios — Relatório com IA | `/relatorios` | 0 | 0 | 0 | 0 | 0 | 26 |
| Relatórios — Acompanhamento (AB-ABAB) | `/relatorios` | 0 | 0 | 0 | 0 | 0 | 27 |
| Relatórios — Média por Período | `/relatorios` | 0 | 0 | 0 | 0 | 0 | 27 |
| Relatórios — Regressão Linear | `/relatorios` | 0 | 0 | 0 | 0 | 0 | 27 |
| Novo PEI | `/aprendentes/:id/pei/novo` | 0 | 0 | 0 | 0 | 0 | 26 |
| Configurações | `/configuracoes` | 0 | 0 | 0 | 0 | 0 | 25 |

## Violações do sistema por tela

### Login (`/`)

Nenhuma violação automática encontrada.

### Cadastro (`/cadastro`)

Nenhuma violação automática encontrada.

### Esqueci a senha (`/esqueci-senha`)

Nenhuma violação automática encontrada.

### Dashboard (`/dashboard`)

Nenhuma violação automática encontrada.

### Lista de aprendentes (`/aprendentes`)

Nenhuma violação automática encontrada.

### Novo aprendente (`/aprendentes/novo`)

Nenhuma violação automática encontrada.

### Agenda (`/agenda`)

Nenhuma violação automática encontrada.

### Nova sessão (`/agenda/nova`)

Nenhuma violação automática encontrada.

### Relatórios — Relatório com IA (`/relatorios`)

Nenhuma violação automática encontrada.

### Relatórios — Acompanhamento (AB-ABAB) (`/relatorios`)

Nenhuma violação automática encontrada.

### Relatórios — Média por Período (`/relatorios`)

Nenhuma violação automática encontrada.

### Relatórios — Regressão Linear (`/relatorios`)

Nenhuma violação automática encontrada.

### Novo PEI (`/aprendentes/:id/pei/novo`)

Nenhuma violação automática encontrada.

### Configurações (`/configuracoes`)

Nenhuma violação automática encontrada.

## Navegação só por teclado

A partir do carregamento da página, a tecla Tab é pressionada repetidamente. Para cada parada registra-se o elemento focado e se há indicador de foco visível (o estilo calculado do elemento muda ao receber foco: outline, sombra/anel, borda ou fundo). Critérios WCAG 2.1.1, 2.4.3 e 2.4.7.

**Banner de cookies (decisão mantida):** enquanto o banner do vanilla-cookieconsent está aberto, o Tab percorre os campos da tela e depois fica circulando dentro do banner, sem voltar ao início da página, até o usuário aceitar, rejeitar ou gerenciar as preferências. O comportamento é do widget e não foi alterado: o consentimento precisa de uma resposta explícita, e depois dela o foco volta a circular normalmente.

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
