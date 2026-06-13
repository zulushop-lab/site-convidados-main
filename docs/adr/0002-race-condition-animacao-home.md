# ADR 0002: Gestão de Estado e Race Conditions na Animação da Home

## Contexto
O fluxo de chegada à Home exige uma sincronia milimétrica: a animação da "renderização da Catedral" amarra-se visualmente ao primeiro card do carrossel. Imediatamente após a primeira interação do usuário (clique/touch) *terminada* a animação, ocorre a transição para as fotos do casal. 
Isso introduz um risco de "Race Condition": o que acontece se o usuário clicar furiosamente *durante* a animação? Ou tentar rolar a página antes dos assets estarem prontos em tela?

## Decisão
Implementaremos uma **Máquina de Estados Finita (FSM)** estrita no frontend para o fluxo de entrada. Os estados serão: `[ANIMATING_LOADING -> READY_FOR_INTERACTION -> TRANSITIONED]`.
Eventos de interação (touch, click, scroll) serão ignorados ou cacheados (na medida do possível) se o sistema não estiver explicitamente no estado `READY_FOR_INTERACTION`. 

## Justificativa (Trade-offs)
* **O Ganho:** Garante a "Experience N2N" sem que interações prematuras ou lentidão do dispositivo quebrem a continuidade visual milimétrica planejada. Evita que a interface fique travada em um estado intermediário (a catedral sumindo enquanto as fotos ainda não carregaram).
* **O Custo:** Maior complexidade na gestão do estado (React Context/Zustand + hooks de eventos globais), não sendo possível resolver isso puramente em animações CSS ou configurações simples do Framer Motion.
