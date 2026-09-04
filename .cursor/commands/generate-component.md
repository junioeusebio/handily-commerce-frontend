# generate-component

Gere um componente Angular 21 **standalone** alinhado a este repo.

## Entrada esperada

- Nome (PascalCase ou kebab-case)
- Destino: `features/<feature>/`, `shared/`, ou outro path explicito
- Se precisa de pasta propria com `.html` / `.css`

## Regras

1. Standalone + `ChangeDetectionStrategy.OnPush`
2. `input()` / `output()` signal-based quando houver API
3. Control flow novo (`@if` / `@for`) no template
4. Imports via aliases (`@shared`, `@domains`, etc.)
5. **Nao** criar NgModule
6. Se for feature nova: nao importar outras features
7. Opcional: spec Vitest/Jasmine ao lado

## Saida

- Arquivos criados/alterados
- Como registrar na rota (se aplicavel) com `loadComponent`
