# AGENTS.md — handily-commerce-frontend

Guia rapido para agentes (Cursor) neste repositorio.

## Projeto

- Angular **21**, **standalone**, **signals-first**
- Pastas: core/, domains/, features/, shared/
- Aliases: @core, @domains, @features, @shared
- Detalhes: ARCHITECTURE.md e .cursor/rules/

## Stack

- Testes unitarios: **Vitest**
- E2E: **Playwright** (planejado)
- Estilo: **Tailwind CSS v4** + **SCSS** design tokens

## Agentes especializados

| Agente | Arquivo | Foco |
| --- | --- | --- |
| Frontend | .cursor/agents/frontend-agent.md | Componentes, templates, UI |
| Arquitetura | .cursor/agents/architecture-agent.md | Fronteiras e dependencias |
| Testing | .cursor/agents/testing-agent.md | Vitest / Playwright |
| SCSS / tokens | .cursor/agents/scss-agent.md | Tokens SCSS; component SCSS raro |
| Tailwind | .cursor/agents/tailwind-agent.md | Utilities Tailwind nos templates |
| Styles review | .cursor/agents/styles-review-agent.md | Review de PRs de estilo (nao implementa) |

## Skills

- .cursor/skills/angular-generator — gerar component/service/rota
- .cursor/skills/angular-refactor — mover/extrair respeitando boundaries
- .cursor/skills/angular-testing — adicionar testes

## Comandos Cursor

- generate-component, generate-service, review-pr, add-tests em .cursor/commands/

## Regras de ouro

1. Um PR = uma parte/patch focada (nao use a palavra fatia).
2. Feature nao importa outra feature.
3. Sem NgModules novos.
4. Nao alterar codigo da app em PRs so de config Cursor, salvo necessidade explicita.
5. Nunca solicitar PAT; usar gh autenticado no ambiente.
