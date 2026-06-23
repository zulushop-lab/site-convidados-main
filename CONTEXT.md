# Contexto do Domínio (Casamento Digital)

## Glossário Vivo

* **Presente**: Item ou cota financeira listada para compra pelos convidados.
* **Carrinho da Felicidade**: Nomenclatura oficial para o carrinho de compras da aplicação. Focado em atrito mínimo.
* **Gravata do Noivo (Leilão Online)**: Entidade independente do domínio. Consiste em uma experiência gamificada de arrecadação de fundos. Possui roteamento próprio aninhado na seção de presentes (ex: `/presentes/gravata`). (Detalhes detalhados do modelo de domínio pendentes).
* **Lance na Gravata**: Ação/Call-to-action ("Dê um lance na gravata") que aciona a contribuição para a gamificação da gravata.
* **Provedor de Pagamento**: Mercado Pago via Checkout Pro. Presentes e lances da Gravata do Noivo são iniciados pelo backend, pagos no ambiente do Mercado Pago e confirmados por webhook antes de entrarem como `completed`.
* **Autenticação Base (RSVP-First)**: Estratégia de fluxo onde o acesso à plataforma principal (Home, Presentes) exige prévia identificação/auth via rota de RSVP e Convite.
* **Swipe-to-Confirm (Componente UI)**: Botão de confirmação de presença (arraste esquerda para direita, com fading granular do nome durante o arrasto, e snap-back automático). Traz estética de glasmorphism / liquid glass com atrito lúdico e mínimo.
* **Home "Experience N2N"**: A página inicial funciona como um agregador sequencial ("End-to-End"), onde o scrolling conta a história e condensa o acesso prático ao resto do site com baixa fricção.
* **Cards "Teasers" & Shared Element Transitions**: Componentes navegáveis na Home que oferecem um "sabor" das subpáginas. Em vez de uma navegação de rota padrão, o card expande-se elasticamente ("Shared Element" via framer-motion `layoutId`) assumindo o layout da nova página sem quebras da imersão (estilo app nativo iOS/Android).


## Decisões de Fluxo e Design

* **Mobile-First Extremo**: A interface é projetada para o padrão 90% mobile e 10% desktop.
* **Fricção Mínima de Checkout**: Ao selecionar um presente via lista, o usuário é questionado via modal (Direcionamento de Pagamento vs Adicionar ao Carrinho da Felicidade).
* **Checkouts Isolados**: Os fluxos de pagamento da Tela de Presentes e da Gravata do Noivo são completamente desacoplados. Abre-se mão de reuso de código do checkout (DRY) focado em taxa de conversão e zero atrito UX.
* **Upsell Pós-Pagamento**: Após a confirmação do pagamento de um presente, o usuário é direcionado para a gamificação da Gravata do Noivo através de um Call-to-action de "Dê um lance na gravata".
* **Animação Bipartida de Carregamento**: (1) Tela de entrada (RSVP/Auth) exibe animação apenas da logo; (2) Ao confirmar e transitar para a Home, uma segunda animação aciona a "renderização da Catedral".
* **Reentrada de Usuários Logados**: Se um convidado que já completou o RSVP clicar no link do PDF novamente, o sistema reconhece o estado, pula o RSVP e exibe diretamente a animação da Catedral conduzindo fluentemente à Home.
* **Continuidade Visual (Catedral) & Race Conditions**: O primeiro card do carrossel principal é a Catedral, amarrando a animação de loading à interface. A transição para as fotos ocorre na primeira interação após a animação. Para evitar *race conditions* (ex: cliques durante a animação), toda a sequência será guiada por uma Máquina de Estados Finita rigorosa no frontend, ignorando inputs prematuros (ADR 0002).
* **Ranking Gamificado (UI na Home)**: A arrecadação da "Gravata do Noivo" será promovida na Home através de um Leaderboard Duplo (Individual e por Família). A exibição agregada por família incentiva engajamento lúdico. O backend deverá preparar a soma agregada dos lances agrupando-os pelos núcleos familiares vinculados no RSVP (ADR 0004).
