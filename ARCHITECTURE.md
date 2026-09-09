# Arquitetura

Angular 21, standalone, signals-first. Uma pasta, uma responsabilidade.

| Pasta | Papel |
| --- | --- |
| `src/app/core` | Infra da app (interceptors, guards, config/environment). Sem regra de negócio. |
| `src/app/domains` | Models e services. Features importam daqui. |
| `src/app/features` | UI e rotas. Uma feature **não** importa outra. |
| `src/app/shared` | UI/util reutilizável, sem domínio. |

Aliases TypeScript: `@core`, `@domains`, `@features`, `@shared`.

O Handily Commerce Frontend atual vive em `features/handily-commerce-frontend`. `App` é só o shell.

Environments (`src/environments/`) hold `apiBaseUrl` / `apiVersion`. `core/config` exposes them via `APP_ENVIRONMENT`, `resolveApiRoot()`, and `APP_VERSION` (from `package.json`). `provideHttpClient()` is registered in `app.config.ts`; the feature footer loads `GET {apiRoot}/apiVersion`.

## Styles (SCSS design tokens)

Global styles live in `src/styles.scss`, which `@use`s the tokens layer under `src/styles/`:

| File | Role |
| --- | --- |
| `_colors.scss` | Color SCSS variables |
| `_spacing.scss` | Spacing scale |
| `_typography.scss` | Font family / size / weight |
| `_radius.scss` | Border radius |
| `_tokens.scss` | Emits CSS custom properties on `:root` |

Components consume tokens via `var(--token-name)` (e.g. `--color-text`, `--space-5`). Prefer CSS variables over importing SCSS maps into every component so theming stays centralized.
