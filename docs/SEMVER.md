# Versionamento semântico (FE)

Processo de release por labels em cada Pull Request.

## Labels → bump

| Label | Bump | Significado |
| --- | --- | --- |
| `Release Major` | **X**.0.0 | Breaking change |
| `Release Mirror` | x.**Y**.0 | Feature / minor (**Mirror = minor** neste projeto) |
| `Release Patch` | x.y.**Z** | Correção / patch |

Exatamente **um** desses labels é obrigatório em todo PR.

## Fonte da versão (FE)

A versão do frontend é a de `package.json`. Ela aparece no rodapé da aplicação como **WEB** (ex.: `WEB 0.1.0`).

Quem abre o PR deve:

1. Aplicar o label correto (`Release Major` | `Release Mirror` | `Release Patch`).
2. Atualizar `package.json` com o bump correspondente.
3. Incluir `Signed-off-by: Júnio Eusébio` e pedir review de `junioeusebio`.

Não há bump automático: o workflow só valida se o label está presente.
