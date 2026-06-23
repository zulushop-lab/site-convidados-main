# SPEC-PRESENTES-FOTOS — Fotos reais dos cards de presente + remoção de card

> Status: 🟡 a implementar (22/06) · Track: Conteúdo/Catálogo · Depende de: SPEC-GIFTS-CATALOG (contrato `GiftCatalogItem`) · Relacionada: [[SPEC-PRESENTES-CARD-UX]]

## 1. Objetivo
Substituir as fotos genéricas/`local-generated` dos cards de presente por imagens reais e coerentes com cada item (lugares específicos de Trancoso e produtos específicos de casa), e remover o card que o usuário não quer mais ("Fundo para contas de água e luz"). As imagens são **buscadas na Web e salvas localmente** em `public/presentes/` (decisão travada do usuário), sem alterar a CSP nem `next.config.ts`. O catálogo continua sendo a fonte de dados do cliente (`domain/gifts/catalog.ts`); só mudam os arquivos de imagem e o metadado `imageSourceUrl`.

## 2. Contexto atual (verificado em código)
- `domain/gifts/catalog.ts:9-565` — `GIFT_CATALOG` com 37 itens; o cliente lê este array (`app/presentes/page.tsx:13,30`).
- Cada item tem `imageSrc: '/presentes/<id>.jpg'` (caminho local em `public/presentes/`) e `imageSourceUrl` (rastreabilidade: hoje vários são `local-generated:*` ou URLs antigas do Unsplash que não batem com o item).
- `public/presentes/*.jpg` — 37 imagens (`pp_01..10`, `lm_01..12`, `cs_01..15`), ~900×675, 4:3.
- `app/presentes/page.tsx:428-440` — render via `next/image` em container `aspect-[4/3]` + `object-cover`; logo, qualquer imagem paisagem funciona (o framework reotimiza/recorta em runtime).
- `next.config.ts:8,45-55` — CSP `img-src 'self' data: blob: https://images.unsplash.com` e `remotePatterns` só com `images.unsplash.com`. **Imagens locais (`'self'`) cobrem 100% deste plano** — por isso baixamos para `public/`, sem tocar na config.

## 3. Escopo
**Inclui:**
- Remover o item `pp_03` do `GIFT_CATALOG` e apagar `public/presentes/pp_03.jpg`.
- Substituir 25 arquivos `.jpg` em `public/presentes/` por fotos novas coerentes (mesmo nome de arquivo → `imageSrc` inalterado).
- Atualizar `imageSourceUrl` dos 25 itens para a URL real de origem da nova foto (rastreabilidade).

**Não inclui:**
- Mudança de layout/preço/botões do card (→ [[SPEC-PRESENTES-CARD-UX]]).
- Migração do catálogo para Firestore / seed (→ SPEC-GIFTS-CATALOG).
- Alteração de CSP, `remotePatterns` ou hospedagem externa de imagem.
- Reescrita de `title`/`description`/preços dos itens.

## 4. Requisitos técnicos
- **RT-1 — Remover card pp_03.** Excluir o objeto `id: 'pp_03'` (`domain/gifts/catalog.ts:40-54`) do array. Não renumerar ids (`pp_04..pp_10` permanecem); o "buraco" em `order` é aceitável (a UI ordena por `order` ascendente, sem exigir contiguidade). Apagar `public/presentes/pp_03.jpg` (arquivo órfão).
- **RT-2 — Substituir 25 imagens.** Para cada id da tabela §5, salvar a foto nova em `public/presentes/<id>.jpg` (sobrescrever). Preferir paisagem ~900×675 (4:3); não é obrigatório o tamanho exato, mas evitar retrato/quadrado para não recortar mal no `object-cover`.
- **RT-3 — Atualizar `imageSourceUrl`.** Para cada um dos 25 itens, trocar `imageSourceUrl` pela URL pública de origem da imagem usada (ou um marcador honesto, ex. `web:<fonte>`); não deixar `local-generated:*` em itens cuja foto mudou.
- **RT-4 — Praias distintas.** As fotos de `lm_01`, `lm_04` e `lm_07` devem ser **três praias visualmente diferentes** (pedido explícito do usuário: o day use não pode repetir a foto do café da manhã; a Praia do Espelho é outra).
- **RT-5 — Coerência item↔foto.** Itens "produto" (`cs_*`) devem mostrar o produto correspondente; itens "lugar" devem mostrar o lugar; itens "temático" podem usar foto que evoque o conceito (ver coluna Tipo na §5).
- **RT-6 — Sem quebra de referência.** Nenhum `imageSrc` pode apontar para arquivo inexistente após a mudança; `pp_03` não pode mais ser referenciado em lugar nenhum.

## 5. Mapa de substituição

| id | Card (`title`) | Foto nova (assunto) | Tipo |
|---|---|---|---|
| pp_04 | Kit Limpeza Extrema | kit de produtos de limpeza | temático |
| pp_06 | Reserva de Emergência da Casa | economia da casa (cofre/poupança) | temático |
| lm_01 | Café da manhã em Trancoso | praia de Trancoso (≠ lm_04, ≠ lm_07) | específico |
| lm_02 | Passeio de barco pelo litoral de Trancoso | barco no litoral de Trancoso | específico |
| lm_03 | Jantar romântico no Quadrado | jantar romântico (ver nota Quadrato/Quadrado) | específico |
| lm_04 | Day use em praia de Trancoso | praia de Trancoso distinta de lm_01 | específico |
| lm_05 | Passeio pelo Quadrado histórico | Quadrado histórico de Trancoso (igreja/casario) | específico |
| lm_06 | Jantar de despedida em Trancoso | jantar em Trancoso | específico |
| lm_07 | Visita à Praia do Espelho | Praia do Espelho (Trancoso) | específico |
| lm_08 | Drinks ao pôr do sol | drinks ao pôr do sol numa praia | temático |
| lm_09 | Transfer Porto Seguro-Trancoso | transfer/van em Porto Seguro | específico |
| lm_10 | Noite de música no Quadrado | noite de música no Quadrado (Trancoso) | temático |
| lm_11 | Almoço de frutos do mar | almoço chic de frutos do mar | temático |
| lm_12 | Hospedagem especial em Trancoso | Club Med Trancoso | específico (marca) |
| cs_01 | Robô Aspirador Inteligente | robô aspirador | produto |
| cs_03 | Jogo de Panelas Antiaderentes | jogo de panelas antiaderentes | produto |
| cs_04 | Air Fryer 5 Litros | air fryer ~5L | produto |
| cs_06 | Faqueiro Inox 32 Peças | faqueiro inox | produto |
| cs_08 | Micro-ondas Espelhado 32L | micro-ondas espelhado | produto |
| cs_09 | Jogo de Taças de Cristal | jogo de taças de cristal | produto |
| cs_10 | Liquidificador Potente | liquidificador | produto |
| cs_11 | Aparelho de Jantar 30 Peças | aparelho de jantar | produto |
| cs_12 | Kit de Tábuas e Facas do Chef | kit de tábuas e facas | produto |
| cs_13 | Ferro de Passar a Vapor | ferro de passar a vapor | produto |
| cs_15 | Geladeira Frost Free Inox | geladeira frost free inox | produto |

**Inalterados** (não citados pelo usuário): `pp_01, pp_02, pp_05, pp_07, pp_08, pp_09, pp_10, cs_02, cs_05, cs_07, cs_14`.

## 6. Arquivos afetados
- **Editar** `domain/gifts/catalog.ts` — RT-1 (remover pp_03), RT-3 (atualizar `imageSourceUrl` dos 25).
- **Substituir** 25 arquivos `public/presentes/*.jpg` (RT-2); **apagar** `public/presentes/pp_03.jpg` (RT-1).
- **(Documento)** este arquivo.

## 7. Critérios de aceite
- [ ] `GIFT_CATALOG` não contém mais `pp_03`; `public/presentes/pp_03.jpg` não existe.
- [ ] Os 25 arquivos da §5 foram substituídos; abrir `/presentes` mostra a foto nova coerente em cada um.
- [ ] `lm_01`, `lm_04` e `lm_07` exibem praias visivelmente diferentes.
- [ ] Nenhum `imageSrc` aponta para arquivo inexistente; nenhum item alterado mantém `imageSourceUrl: 'local-generated:*'`.
- [ ] `npm run build` passa sem erro.

## 8. Validação e2e (e2e-validation-gate)
Pipeline crítico: **`catalog.ts` → `next/image` em `/presentes` (grade + modal) → UI**.
1. **Baseline:** `git status` limpo antes; rodar `npm run build` (verde) e abrir `/presentes`.
2. **Mudança:** aplicar RT-1..RT-6.
3. **Validar por camada:** (a) build verde; (b) grade sem o card "Fundo para contas de água e luz"; (c) cada card da §5 com a foto nova; (d) abrir o modal de alguns itens e confirmar que a mesma imagem carrega; (e) Network sem 404 em `/presentes/*.jpg`.
4. **Reverter:** `git checkout -- domain/gifts/catalog.ts public/presentes` (mudança 100% versionada).
5. **Revalidar:** build verde após revert e após reaplicar.

## 9. Tarefas humanas / dependências externas
- **Curadoria/licenciamento das imagens:** as fotos vêm da Web; para um site privado de casamento é uso pessoal (decisão do usuário). Preferir fontes livres (Unsplash/Pexels/Wikimedia) quando a especificidade permitir; para marcas/lugares/produtos específicos, o usuário pode substituir manualmente por uma foto oficial depois.
- **Decisão Quadrato vs Quadrado (lm_03):** se o usuário quiser a foto do restaurante "Quadrato" especificamente (e não a praça "Quadrado"), trocar manualmente a foto de `lm_03.jpg`.

## 10. Riscos e mitigação
- **Foto pouco fiel ao item específico** (ex.: Club Med Trancoso, Praia do Espelho): difícil garantir foto oficial via busca automática. Mitigação: usar a melhor correspondência disponível e marcar em `imageSourceUrl` a origem; usuário pode trocar pontualmente.
- **Imagem em retrato/quadrado recortando mal** no `object-cover`: Mitigação RT-2 (preferir paisagem ~4:3).
- **Referência órfã a pp_03** após remoção: Mitigação RT-6 + grep no aceite/metas.
- **Direitos autorais:** Mitigação — preferência por fontes livres (§9); escopo é uso privado.

## 11. Metas auditáveis (Definition of Done verificável por LLM)
| # | Meta | Como auditar | Alvo (PASS) |
|---|---|---|---|
| M-1 | Card pp_03 removido do catálogo (RT-1) | `rg -n "pp_03" domain/gifts/catalog.ts` | 0 ocorrências |
| M-2 | Imagem órfã pp_03 apagada (RT-1) | `test -f public/presentes/pp_03.jpg` | arquivo NÃO existe |
| M-3 | Catálogo com 36 itens (37 − pp_03) (RT-1) | contar objetos `id:` em `domain/gifts/catalog.ts` | = 36 |
| M-4 | Nenhum item alterado mantém `local-generated` (RT-3) | `rg -n "local-generated" domain/gifts/catalog.ts` | 0 ocorrências |
| M-5 | Todos os `imageSrc` apontam para arquivo existente (RT-6) | para cada `imageSrc` em catalog.ts, conferir arquivo em `public/presentes/` | todos existem |
| M-6 | 25 imagens da §5 modificadas (RT-2) | `git status --porcelain public/presentes` lista os 25 `.jpg` como modificados + pp_03 deletado | 25 modificados + 1 deletado |
| M-7 | Build sem erro (aceite) | `npm run build` | exit code 0 |
| M-8 | [humano] Coerência item↔foto e praias distintas (RT-4/RT-5) | auditoria visual em `/presentes` | confirmação humana |

## 12. Rodada 2 — re-sourcing pós-conferência (22/06)
Após conferência visual do usuário, 7 fotos foram trocadas de novo (mantendo `imageSrc`; `imageSourceUrl` atualizado). Fonte: Openverse (CC — rawpixel CC0 / Flickr / Wikimedia).

| id | Card | Motivo da troca | Nova foto |
|---|---|---|---|
| lm_02 | Passeio de barco pelo litoral de Trancoso | a anterior mostrava pescadores num píer | veleiro/barco em mar turquesa |
| lm_08 | Drinks ao pôr do sol | a anterior estava de **noite** | coquetel com pôr do sol no mar |
| cs_06 | Faqueiro Inox 32 Peças | a anterior era mesa posta | set de talheres inox (fundo branco) |
| cs_08 | Micro-ondas Espelhado 32L | a anterior era micro-ondas vintage | cozinha moderna com micro-ondas inox embutido |
| cs_12 | Kit de Tábuas e Facas do Chef | a anterior só tinha facas | tábua de madeira com faca do chef |
| cs_13 | Ferro de Passar a Vapor | pouco nítida | ferro a vapor (produto, fundo branco) |
| cs_15 | Geladeira Frost Free Inox | a anterior era close do logo | geladeira completa (side-by-side) |

**Caveats (CC):** `cs_08` (micro-ondas) ficou como cozinha moderna com micro-ondas embutido e `cs_15` (geladeira) ficou uma geladeira completa **branca** — o acervo CC não tinha um shot de produto inox isolado para esses dois; são trocáveis manualmente por uma foto oficial quando desejado.
