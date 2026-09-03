# Arquitetura

Angular 21, standalone, signals-first. Uma pasta, uma responsabilidade.

| Pasta | Papel |
| --- | --- |
| `src/app/core` | Infra da app (interceptors, guards). Sem regra de negócio. |
| `src/app/domains` | Models e services. Features importam daqui. |
| `src/app/features` | UI e rotas. Uma feature **não** importa outra. |
| `src/app/shared` | UI/util reutilizável, sem domínio. |

Aliases TypeScript: `@core`, `@domains`, `@features`, `@shared`.

O Hello World atual vive em `features/hello-world`. `App` é só o shell.
