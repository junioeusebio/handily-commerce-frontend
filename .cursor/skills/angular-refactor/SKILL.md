---
name: angular-refactor
description: Refatora codigo Angular para respeitar fronteiras core/domains/features/shared, signals e standalone.
---

# Skill: angular-refactor

## Quando usar

Extrair componentes, mover codigo entre camadas, substituir padroes legados (NgModule, `@Input`, `*ngIf`) sem mudar comportamento.

## Passos

1. Mapear dependencias atuais e a direcao permitida (ver rule `architecture-boundaries`).
2. Mover models/services de feature → `domains` quando forem reutilizaveis.
3. Extrair UI generica → `shared`.
4. Trocar para signals/`input()`/`output()` e control flow moderno quando tocar no arquivo.
5. Manter a parte/patch pequena; nao misturar refactor cosmetico com feature nova.
6. Atualizar imports para aliases.
7. Garantir que testes continuam passando (ou atualizar specs).

## Criterio de pronto

- Sem imports feature→feature
- App shell continua fino
- Diff revisavel
