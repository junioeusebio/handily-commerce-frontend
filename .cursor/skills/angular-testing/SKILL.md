---
name: angular-testing
description: Adiciona testes unitarios (Vitest planejado) e e2e (Playwright planejado) para Angular standalone/signals.
---

# Skill: angular-testing

## Quando usar

Cobrir services/componentes novos ou regressoes em uma parte/patch.

## Unit

- Preferir Vitest quando configurado; senao, runner atual do repo.
- TestBed para componentes; stubs de HTTP.
- Cobrir branches de erro/loading e `computed` relevantes.

## E2E

- Playwright para fluxos criticos (navegar, render handily-world, futuros forms).
- Seletores estaveis (roles/labels); evitar CSS fragil.

## Boas praticas

- Spec ao lado do codigo
- Nomes em portugues ou ingles consistente com o arquivo vizinho
- Nao acoplar a outras features
