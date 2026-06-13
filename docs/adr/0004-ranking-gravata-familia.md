# ADR 0004: Ranking Gamificado Duplo (Individual e por Família)

## Contexto
Durante a definição do fluxo de "Gravata do Noivo" (experiência gamificada de arrecadação) e pensando na imersão e retenção dos usuários na Home, decidimos que queremos explorar a competitividade saudável entre os convidados. Como a autorização e o RSVP já associam convidados com seus respectivos núcleos familiares ("Família Silva", "Família Santos", etc.), há a oportunidade de usar essa estrutura para gamificação.

## Decisão
A Home deverá possuir uma Interface de Usuário (UI) que exiba um **Leaderboard (Ranking) Duplo** para os lances realizados na Gravata do Noivo. Esse módulo alternará (ou exibirá simultaneamente de forma clara e limpa) duas visões:
1. **Ranking Individual**: Os convidados que mais contribuíram na Gravata.
2. **Ranking por Família**: Agregação das contribuições totais feitas pelos membros de um mesmo núcleo familiar associado no backend.

## Justificativa (Trade-offs)
* **O Ganho:** Amplifica dramaticamente o fator "gamificação", engajamento e a conversão de arrecadação, incentivando uma disputa lúdica entre grupos familiares que já se conhecem. Agrega valor imediato à Home, tornando-a uma página a ser consultada repetidamente (Daily Active Users para atualizações de quem está vencendo).
* **O Custo:** Aumenta ligeiramente a complexidade da camada de cálculo backend e caches, uma vez que precisamos fazer agregações SQL/NoSQL em tempo real ou ter webhooks atualizando tabelas derivadas para evitar escaneamentos caros nas somas de família para a Home (Performance de Leitura na UI).
