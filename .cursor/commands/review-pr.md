# review-pr

Revise a parte/patch atual (diff do branch vs `main`) com o checklist do handily-commerce-frontend.

## Checklist

1. **Escopo**: um tema so? Diff pequeno?
2. **Arquitetura**: fronteiras core/domains/features/shared respeitadas?
3. **Features**: sem import cruzado entre features?
4. **Angular**: standalone, signals quando adequado, sem NgModules novos?
5. **Aliases**: `@core` `@domains` `@features` `@shared`?
6. **Testes**: specs atualizadas quando a logica mudou?
7. **Estilo**: encapsulado; sem hacks frageis?
8. **Vocabulario / ops**: nao pedir PAT; usar parte/patch (nao "fatia")

## Saida

- Resumo em portugues (riscos + sugestoes)
- Lista de bloqueadores vs nitpicks
