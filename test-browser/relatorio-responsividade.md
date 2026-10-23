# Relatório de responsividade — Sinapse Edu

Gerado automaticamente por `npm run test:browser` (`responsividade.spec.ts`) em 22/10/2026 às 17:15. Chromium, larguras `320x568`, `360x740`, `390x844`, `768x1024`, `1024x768`, `1366x768`, `1920x1080`. Dados exibidos fictícios, criados pela suíte no banco de teste.

Em cada tela e largura a suíte confere:

1. **Rolagem horizontal:** `scrollWidth <= clientWidth` no documento e no `<main>` do layout; lista os elementos que passam da borda (↳ = elemento mais interno).
2. **Menu de navegação** (telas com o layout autenticado, abaixo de 1024px): o botão existe — a falta dele **falha o teste** —, abre o painel (`role="dialog"`, `aria-modal`, `aria-expanded`), prende o foco, trava a rolagem, fecha com Esc devolvendo o foco ao botão, itens com 44px de altura; a partir de 1024px o botão fica oculto. Um teste à parte clica em cada link do painel em cada largura.
3. **Alvos interativos menores que 24×24 px** (WCAG 2.5.8), com as exceções de link dentro de texto e de espaçamento; o rótulo de checkbox/radio conta como parte do alvo.
4. **Modais** (ConfirmDialog e os modais da sessão ativa): a caixa cabe na janela e, se o conteúdo for maior, rola por dentro.
5. **Campos com fonte menor que 16 px** abaixo de 768px (o Safari do iOS dá zoom ao focar esses campos).
6. **Elementos cobertos** pelos botões do Sienna e do VLibras ou pelo banner de cookies: em nenhuma posição de rolagem o centro do elemento fica livre.
7. **Captura de tela inteira** em `test-browser/capturas/<tela>-<largura>.png`.

> Este relatório mostra o estado **depois dos ajustes de layout**; o estado anterior está congelado em [`relatorio-responsividade-inicial.md`](./relatorio-responsividade-inicial.md) e não deve ser regenerado.

Telas públicas são medidas como no primeiro acesso, com o banner de cookies aberto; telas autenticadas, depois de o banner ser respondido, como no uso diário (mesma convenção da auditoria de acessibilidade).

## Resumo

165 combinações (tela × largura) medidas; 0 com algum problema.

| Categoria | Ocorrências |
|---|---:|
| Rolagem horizontal | 0 |
| Menu de navegação | 0 |
| Alvo interativo < 24×24 px | 0 |
| Modal não cabe na tela | 0 |
| Campo com fonte < 16 px | 0 |
| Coberto por botão flutuante/banner | 0 |
| **Total** | **0** |

## Tela × largura

✅ = nenhum problema; número = ocorrências encontradas; — = não medida.

| Tela | Rota | 320 | 360 | 390 | 768 | 1024 | 1366 | 1920 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Login | `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cadastro | `/cadastro` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Verificar e-mail (link sem token) | `/verificar-email` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Esqueci a senha | `/esqueci-senha` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Redefinir senha (link sem token) | `/redefinir-senha` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Página inexistente (404) | `/rota-que-nao-existe` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Painel | `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
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
| Sessão ativa | `/agenda/:id/sessao` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatórios | `/relatorios` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatórios — relatório emitido | `/relatorios` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatórios — gráfico Acompanhamento (AB-ABAB) | `/relatorios` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auditoria | `/auditoria` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configurações | `/configuracoes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Menu de navegação — cada link do painel | `/dashboard` | ✅ | ✅ | ✅ | ✅ | — | — | — |

## Problemas por tela

Nenhum problema encontrado em nenhuma combinação.

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
