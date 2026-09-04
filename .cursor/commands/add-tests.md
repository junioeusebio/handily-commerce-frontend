# add-tests

Adicione ou complete testes para o codigo tocado nesta parte/patch.

## Preferencias

- Unit: Vitest (planejado) / runner atual do repo
- E2E critico: Playwright (planejado)
- Spec ao lado do fonte (`*.spec.ts`)
- Stub de HTTP/domains; nao depender de rede

## Foco

1. Services e `computed`/validadores
2. Componentes: inputs, estados de erro/loading, outputs
3. Nao testar detalhes de framework irrelevantes

## Saida

- Arquivos de teste criados/atualizados
- Como rodar (script do `package.json` quando existir)
