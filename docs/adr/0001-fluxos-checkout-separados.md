# ADR 0001: Fluxos de Checkout Separados (Presentes vs. Gravata)

## Contexto
O domínio possui duas principais entidades de arrecadação: "Presentes" (lista tradicional ou Carrinho da Felicidade) e "Gravata do Noivo" (experiência gamificada focada em upsell e interação isolada). O processamento de pagamentos será feito via PagSeguro.

## Decisão
Optamos por manter **fluxos de checkout completamente separados e independentes** para o 'Carrinho de Presentes' e para a 'Gravata do Noivo'.

## Justificativa (Trade-offs)
Um futuro desenvolvedor poderia questionar por que não reaproveitamos o estado global do carrinho para processar também a gravata, já que ambos usam o mesmo gateway de pagamento. 
* **O Ganho:** A separação radical diminui a "fricção" para o usuário. Permite que o lance na gravata aja como uma compra trivial de impulso ou "upsell" (pós-pagamento do presente) sem misturar lógicas do carrinho principal.
* **O Custo:** Teremos provável duplicação no manuseio de APIs do PagSeguro e gestão de formulários/estados de pagamento. Este custo de engenharia foi considerado aceitável em prol da taxa de conversão / UX.
