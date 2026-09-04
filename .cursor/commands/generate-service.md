# generate-service

Gere um service Angular alinhado as pastas do repo.

## Entrada esperada

- Nome do service
- Camada: `domains` (padrao para negocio/API), `core` (infra), ou `shared`

## Regras

1. `@Injectable({ providedIn: "root" })` salvo escopo pedido
2. Preferir `inject()`
3. Estado com `signal` quando fizer sentido; RxJS na borda HTTP
4. **Nao** importar componentes/features
5. Exportar tipos/models proximos ao service em `domains` se necessario
6. Incluir spec basica se houver logica

## Saida

- Path do arquivo
- Exemplo curto de consumo em um componente de feature
