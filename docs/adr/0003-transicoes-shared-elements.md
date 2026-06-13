# ADR 0003: Transições de Rota com Shared Elements (Framer Motion)

## Contexto
O design estabeleceu que a página inicial ("Home") possui Cards "Teasers" que oferecem um vislumbre e um link direto para subpáginas (como Presentes, Presença, Gravata). No entanto, transições normais de rotas web (hard switches) resultam em recarregamento abrupto que quebra a imersão e reduz a percepção de uma experiência luxuosa (Experience N2N). O objetivo primordial é uma experiência mobile-first (90%) similar a um aplicativo nativo.

## Decisão
Implementaremos **Shared Element Transitions (Expansão Orgânica)** entre as páginas. Quando o usuário interagir com um Card Teaser na Home, a imagem/card subjacente se expandirá elasticamente para formar o cabeçalho/fundo da subpágina de destino, em vez de um roteamento visualmente abrupto. Esta orquestração contínua de rotas e elementos será implementada na camada UI com bibliotecas como o `framer-motion` (propriedades `layoutId`).

## Justificativa (Trade-offs)
* **O Ganho:** Confere ao site um "estilo app nativo", eliminando interrupções no contexto do usuário e mascarando possíveis pequenas esperas por dados ou renderizações complexas da nova rota. Eleva significativamente o valor percebido da interface (design premium).
* **O Custo:** A complexidade da gestão de roteamento em frameworks client-side aumenta substancialmente. Será necessário um cuidado extra na arquitetura do Next.js (App Router vs Pages router ou AnimatePresence customizado) para garantir que a transição ocorra de modo consistente sem remounts indesejados. O `framer-motion` acoplará componentes destas páginas à root layout de certa forma.
