---
name: angular-generator
description: Gera componentes, services e rotas Angular 21 standalone no layout core/domains/features/shared com aliases e signals.
---

# Skill: angular-generator

## Quando usar

Criar artefatos novos no handily-commerce-frontend sem quebrar a arquitetura de pastas.

## Passos

1. Confirmar a camada correta (`features` vs `shared` vs `domains` vs `core`).
2. Criar arquivos kebab-case; classe PascalCase.
3. Componente: standalone, OnPush, `input`/`output` signals, template com `@if`/`@for`.
4. Service: `providedIn: "root"`, `inject()`, signals/RxJS na borda.
5. Rota: `loadComponent` / `loadChildren`; sem NgModule.
6. Usar aliases `@core` `@domains` `@features` `@shared`.
7. Nao importar outra feature.
8. Opcional: spec minima.

## Anti-padroes

- Gerar Module/NgModule
- Colocar regra de negocio em `shared`
- Cross-import de features
