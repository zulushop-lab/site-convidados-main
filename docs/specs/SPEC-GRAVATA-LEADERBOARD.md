# SPEC-GRAVATA-LEADERBOARD — Gravata do Noivo `/presentes/gravata` + leaderboard real
> Status: 🟡 scaffold parcial (16/06 — `app/presentes/gravata/page.tsx` existe e grava `tieBid` pending; `TieLeaderboard` sem mocks, estado vazio honesto + TODO de leitura real). ⚠️ Esta spec descreve um código ANTIGO (404 na gravata, mocks no leaderboard) que não corresponde mais; ler §requisitos como guia do que falta. Resta: IA ler `leaderboards/*`+agregação; humano infra Functions + credenciais MP · Fase original: 5 · Track: A · Depende de: SPEC-PAYMENTS-MP, SPEC-RSVP-AUTH (e transitivamente SPEC-FIRESTORE-SECURITY, SPEC-CHECKOUT-HONESTY) · Destrava: —

## 1. Objetivo
Entregar a experiência de "Gravata do Noivo" de ponta a ponta: criar a página `/presentes/gravata` (hoje inexistente — o botão "Dar meu Lance" leva a 404) como um fluxo de leilão/lance com **checkout ISOLADO** que reusa o pipeline Mercado Pago da SPEC-PAYMENTS-MP, persistir os lances na coleção `tieBids` (schema = `TieBid`), e fazer o `TieLeaderboard` parar de exibir dados mock e passar a **ler ranking real, duplo** (individual + família agregada por `familyId`, conforme ADR-0004). A agregação dos somatórios por família é derivada por servidor (webhook/cloud function) para leitura barata na Home.

## 2. Contexto atual (verificado em código)
- `app/presentes/gravata/page.tsx` **NÃO existe** (Glob de `app/presentes/**/*` retorna apenas `app/presentes/page.tsx` e `app/presentes/checkout/page.tsx`).
- `app/page.tsx:294` — `<Link href="/presentes/gravata" aria-label="Dar um lance na gravata">` envolvendo o botão "Dar meu Lance" (`l.300-301`, ícone `Banknote`). Como a rota não existe, o clique resulta em **404 ao vivo**.
- `app/page.tsx:272-307` — seção `#gravata` da Home já renderiza `<TieLeaderboard />` (`l.291`) e o CTA (`l.293-304`). A copy fala em "disputa lance a lance" e "família mais animada" (`l.286`) — promete leaderboard real por família.
- `components/TieLeaderboard.tsx` é **100% mock**:
  - `mockFamilyData` (`l.17-22`) e `mockIndividualData` (`l.24-29`) são arrays hardcoded.
  - `currentData` (`l.34`) alterna entre os dois mocks conforme a aba (`activeTab`, `l.8,32`).
  - Tipo interno `LeaderboardEntry {id,name,amount,rank}` (`l.10-15`) **NÃO bate** com o contrato real `TieBid {id,amount,guestId,familyId,message?,createdAt,status}` (`domain/types/index.ts:28-36`): falta `name` no `TieBid` (precisa de lookup `guestId`/`familyId`→nome) e `rank`/agregação não existem como campo (precisam ser derivados).
  - A UI já tem as duas abas "Família"/"Individual" (`l.71-88`), ícones de pódio por `rank` (`getRankIcon`, `l.43-54`) e formatação BRL (`formatCurrency`, `l.36-41`) — só falta a fonte de dados real.
- `domain/types/index.ts:28-36` define `TieBid { id, amount, guestId, familyId, message?, createdAt, status: 'pending' | 'paid' }`. O `status` aqui está **desalinhado do ENUM travado** (`'pending' | 'processing' | 'completed' | 'failed'`) — esta spec realinha (ver §5/RT-2).
- `domain/types/index.ts` é arquivo **órfão** (zero imports no app, verificado em SPEC-RSVP-AUTH §2); `familyId`/`guestId` só passam a existir como dado real após SPEC-RSVP-AUTH carimbar identidade.
- `firestore.rules` **não tem** `match /tieBids/{...}` — só `rsvps` (`l.29-33`), `gifts` (`l.43-47`) e `contributions` (`l.57-61`); a default-deny (`l.5-7`) bloqueia `tieBids` hoje. Helpers `isSignedIn()` (`l.10`), `isValidId()` (`l.11`), `isAdmin()` (`l.14-18`) já existem para reuso.
- Não existe `functions/` nem `firebase.json` (Glob vazio) — a cloud function de agregação ainda **não tem scaffold**; é introduzida (ou estendida) junto com a infra de webhook da SPEC-PAYMENTS-MP.
- `app/presentes/checkout/page.tsx` é o checkout do **Carrinho de Presentes** (`contributions`). Por ADR-0001, o checkout da Gravata é **separado e isolado** — esta spec NÃO reusa essa página; reusa o **pipeline MP** (preferência/QR/brick/webhook) da SPEC-PAYMENTS-MP num fluxo próprio.
- `docs/adr/0001-fluxos-checkout-separados.md:6-11` decide checkouts separados (Presentes vs. Gravata) — base desta spec; (esse ADR é atualizado de PagSeguro→Mercado Pago por SPEC-CHECKOUT-HONESTY, não aqui).
- `docs/adr/0004-ranking-gravata-familia.md:7-9` decide **leaderboard duplo** (individual + família agregada por núcleo familiar) e `l.13` antecipa "webhooks atualizando tabelas derivadas para evitar escaneamentos caros nas somas de família" — exatamente a estratégia desta spec.

## 3. Escopo
**Inclui:**
- Criar a página `app/presentes/gravata/page.tsx`: experiência de leilão/lance (escolha/entrada de valor + mensagem opcional) com **checkout ISOLADO** que reusa o pipeline Mercado Pago da SPEC-PAYMENTS-MP, e **upsell pós-pagamento** (CTA de volta para presentes / convite a subir o lance / compartilhar ranking).
- Coleção `tieBids` (schema = `TieBid`), com `status` realinhado ao ENUM travado; cliente cria apenas `'pending'`; promoção a `'completed'`/`'failed'` é exclusiva do servidor (webhook + Admin SDK).
- Regras Firestore para `tieBids` (sobre a base de SPEC-FIRESTORE-SECURITY): create restrito a `pending` + `isSignedIn()`, read público controlado para alimentar o leaderboard, write de status admin/servidor-only.
- Reescrever `components/TieLeaderboard.tsx` para **ler dados reais**: ranking duplo (individual e família) ordenado desc por `amount`, com `rank` atribuído dinamicamente, e mapeamento `guestId`→nome / `familyId`→nome de família. Remover `mockFamilyData`/`mockIndividualData`.
- Agregação derivada por servidor (cloud function/webhook) que mantém somatórios por `familyId` e por `guestId` em documentos de leitura barata (ex.: `leaderboards/family`, `leaderboards/individual`), atualizados quando um `tieBid` é promovido a `'completed'`.
- Matar o 404 do botão "Dar meu Lance" (`app/page.tsx:294`), confirmando a rota destino.
- Realinhar/confirmar **ADR-0004** (manter decisão do ranking duplo; registrar a escolha concreta de agregação derivada via webhook e a fonte dos nomes).

**Não inclui:**
- Implementação real do pipeline Mercado Pago (preferência, QR Pix dinâmico, webhook de pagamento, brick de cartão) — pertence a **SPEC-PAYMENTS-MP**; esta spec **consome** esse pipeline. Em "modo simulado" (decisão travada #2), o lance nasce e permanece `'pending'` até as chaves MP chegarem.
- Auth de convidado / Anonymous Auth / GuestGate / coleções `families`/`guests`/`codes` e o carimbo de `familyId`/`guestId` — pertence a **SPEC-RSVP-AUTH**; esta spec **consome** `familyId`/`guestId` e o lookup de nomes via roster.
- Endurecimento base das rules de `rsvps`/`contributions`/`gifts` — pertence a **SPEC-FIRESTORE-SECURITY**; esta spec apenas **adiciona** o bloco `tieBids` por cima.
- Correção de honestidade do checkout de presentes e do ADR-0001 — pertence a **SPEC-CHECKOUT-HONESTY**.
- Implementação efetiva agora (decisão travada #13: entregável deste ciclo = só o plano).

## 4. Requisitos técnicos
**RT-1 — Página `app/presentes/gravata/page.tsx`.** Criar a rota (`'use client'`, padrão do projeto) que mata o 404 do `app/page.tsx:294`. Estrutura: cabeçalho temático da Gravata (reusar copy/estética da seção `#gravata`), entrada do **valor do lance** (input numérico/seleção de "pacotes" pré-definidos), **mensagem opcional** (`TieBid.message`), e botão "Confirmar Lance" que aciona o checkout isolado (RT-3). Quando houver identidade (de `GuestContext` da SPEC-RSVP-AUTH), pré-personalizar com nome/família; quando anônimo, fluxo segue (soft gate, decisão travada #3) — o lance pode nascer sem `familyId`/`guestId` (campos só destravam o ranking por família após RSVP-AUTH).

**RT-2 — Contrato `TieBid` realinhado ao ENUM.** Em `domain/types/index.ts:35`, alterar `status: 'pending' | 'paid'` para `status: TieBidStatus` com `export type TieBidStatus = 'pending' | 'processing' | 'completed' | 'failed'` (ENUM travado, decisão #4). Migrar qualquer leitura que assuma `'paid'` para `'completed'`. Manter os demais campos (`id, amount, guestId, familyId, message?, createdAt`). `domain/types/index.ts` continua sendo o **contrato único**.

**RT-3 — Checkout ISOLADO reusando o pipeline MP.** O fluxo de pagamento do lance é **separado** do checkout de `contributions` (ADR-0001). Reusar a camada de pipeline da SPEC-PAYMENTS-MP (criação de preferência/ordem MP, geração de QR Pix dinâmico, brick de cartão, e o webhook que promove status) — NÃO duplicar a integração MP, e NÃO reusar `app/presentes/checkout/page.tsx`. O cliente cria o `tieBid` com `status: 'pending'` e dispara a criação do pagamento MP; o convidado paga; o **webhook** (servidor) promove para `'completed'`/`'failed'`. Em "modo simulado" (sem chaves MP), o lance fica honestamente `'pending'` / "aguardando pagamento".

**RT-4 — Coleção `tieBids` (writer cliente).** O cliente grava um documento em `tieBids` com `{ amount, message?, status: 'pending', createdAt: serverTimestamp(), guestId?, familyId? }`. O cliente **nunca** grava `'processing'`/`'completed'`/`'failed'`. `amount > 0`. `guestId`/`familyId` vêm de `GuestContext` (SPEC-RSVP-AUTH) quando presentes; omitidos quando anônimo. Tratamento de erro via `handleFirestoreError(error, OperationType.CREATE, 'tieBids')` (padrão de `app/presentes/checkout/page.tsx:54`).

**RT-5 — Regras Firestore para `tieBids`.** Adicionar a `firestore.rules` (sobre a base de SPEC-FIRESTORE-SECURITY) um `match /tieBids/{bidId}` com:
- `function isValidTieBid(data)` exigindo `data.amount is number && data.amount > 0`, `data.status == 'pending'` (cliente só cria pending), `data.createdAt == request.time`, e `data.message == null || (data.message is string && data.message.size() <= 500)`; `familyId`/`guestId` opcionais validados por `isValidId()` quando presentes.
- `allow create: if isSignedIn() && isValidTieBid(incoming());` (Anonymous Auth já satisfaz `isSignedIn()`, decisão #5).
- `allow update: if isAdmin();` (promoção de status é servidor/Admin SDK via webhook — Admin SDK ignora rules, mas a rule barra qualquer cliente de promover; manter explícito por defesa em profundidade).
- `allow read, list: if true;` **ou** estratégia de leitura via documentos derivados (RT-7) — escolher uma (ver §10 risco de privacidade). Default recomendado: `read/list` público apenas dos campos necessários ao ranking, com os somatórios servidos por `leaderboards/*` (RT-7) para não expor lances individuais brutos se não desejado.

**RT-6 — `TieLeaderboard` lê dados reais (ranking duplo).** Reescrever `components/TieLeaderboard.tsx`:
- Remover `mockFamilyData`/`mockIndividualData` (`l.17-29`) e o `currentData` baseado em mock (`l.34`).
- Aba "Individual": ler o ranking individual real (somatório de `amount` por `guestId` sobre `tieBids` com `status == 'completed'`), ordenar **desc por `amount`**, atribuir `rank` dinâmico (1,2,3…), mapear `guestId`→nome (via roster/`guests` de SPEC-RSVP-AUTH).
- Aba "Família": ler o ranking por `familyId` (somatório agregado), ordenar desc por `amount`, `rank` dinâmico, mapear `familyId`→`familyName`.
- Manter a UI existente (abas `l.71-88`, `getRankIcon` `l.43-54`, `formatCurrency` `l.36-41`); o tipo interno de exibição (`{id,name,amount,rank}`) é derivado da agregação, não do mock.
- Fonte de dados = documentos derivados de `leaderboards/*` (RT-7) para leitura barata (preferido para a Home), com fallback documentado. Estados de loading/empty (sem lances ainda → mensagem "Seja o primeiro a dar um lance!").

**RT-7 — Agregação derivada por servidor.** Especificar a cloud function/extensão do webhook que, ao promover um `tieBid` para `'completed'` (RT-3), **atualiza somatórios derivados** para leitura barata na Home (ADR-0004 `l.13`):
- `leaderboards/family` → `{ entries: [{ familyId, familyName, total, bidCount }] }` (ou subcoleção `leaderboards/family/items/{familyId}`).
- `leaderboards/individual` → `{ entries: [{ guestId, name, total, bidCount }] }`.
- Recalcular incrementalmente (somar o `amount` do bid recém-`completed` ao total do `familyId`/`guestId`) ou recomputar a partir de `tieBids where status=='completed'`. Reusar a infra de webhook/Admin SDK da SPEC-PAYMENTS-MP (não criar pipeline MP novo). Nomes resolvidos a partir de `guests`/`families` (SPEC-RSVP-AUTH); cachear o nome no documento derivado para evitar joins na leitura. Idempotência: cada `tieBid` contribui para o total exatamente uma vez (guardar marca de "já agregado" ou recomputar determinístico).

**RT-8 — Upsell pós-pagamento.** Após o retorno do pagamento (sucesso `'completed'` ou pendência em modo simulado), exibir tela de agradecimento + **upsell isolado** (ADR-0001 trata o lance como compra de impulso/upsell): CTAs "Dar outro lance" (sobe na disputa), "Ver o ranking" (rola até `#gravata` na Home), "Ver lista de presentes" (`/presentes`). A copy deve ser honesta quanto ao status (não afirmar "vencedor"/"pago" se ainda `pending`; em modo simulado, "lance registrado, aguardando pagamento").

**RT-9 — Eliminação verificável do 404.** Confirmar que `app/page.tsx:294` (`href="/presentes/gravata"`) resolve para a nova página (HTTP 200, sem `not-found`). Manter o `aria-label` existente.

**RT-10 — Confirmar/atualizar ADR-0004.** Atualizar `docs/adr/0004-ranking-gravata-familia.md` registrando as decisões concretas desta spec: (a) agregação **derivada via webhook** em `leaderboards/*` (já antecipada em `l.13`), (b) ranking **duplo** mantido (individual + família), (c) `rank` atribuído dinamicamente na leitura por ordenação desc de `amount`, (d) nomes resolvidos via roster de SPEC-RSVP-AUTH e cacheados no documento derivado. Não revogar a decisão; concretizá-la.

## 5. Modelo de dados / contratos
**`domain/types/index.ts` (RT-2 — realinhar `TieBid`):**
```ts
export type TieBidStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TieBid {
  id: string;
  amount: number;          // > 0
  guestId?: string;        // de GuestContext (SPEC-RSVP-AUTH); ausente se anônimo
  familyId?: string;       // desnormalizado p/ agregação por família (ADR-0004)
  message?: string;        // até 500 chars
  createdAt: number;       // serverTimestamp resolvido
  status: TieBidStatus;    // cliente sempre cria 'pending'; servidor promove
}
```
> Nota: `guestId`/`familyId` passam a opcionais (eram obrigatórios em `index.ts:31-32`) para suportar lance anônimo no soft gate; o ranking por família só conta lances com `familyId`.

**Coleção `tieBids/{auto}`** (criado pelo cliente):
```jsonc
{
  "amount": 150,
  "message": "Que vença a família mais animada!",   // opcional
  "status": "pending",                                // cliente SEMPRE 'pending'
  "guestId": "g_isadora",                             // opcional (identidade)
  "familyId": "fam_silva",                            // opcional (identidade)
  "createdAt": "<serverTimestamp>",
  "mpPaymentId": "..."                                // opcional, gravado pelo servidor (SPEC-PAYMENTS-MP)
}
```

**Documentos derivados de leaderboard (RT-7) — leitura barata na Home:**
```jsonc
// leaderboards/family
{ "entries": [ { "familyId": "fam_silva", "familyName": "Família Silva", "total": 1500, "bidCount": 3 } ],
  "updatedAt": "<serverTimestamp>" }

// leaderboards/individual
{ "entries": [ { "guestId": "g_joao", "name": "Tio João", "total": 800, "bidCount": 2 } ],
  "updatedAt": "<serverTimestamp>" }
```
> `rank` NÃO é persistido: é derivado no cliente ordenando `entries` desc por `total`/`amount` e indexando (1,2,3…), conforme a UI atual de `TieLeaderboard` (`getRankIcon`).

**ENUM de status (travado, fonte da verdade):** `'pending' | 'processing' | 'completed' | 'failed'`. Cliente cria só `'pending'`; promoção exclusiva do servidor (webhook + Admin SDK) — mesma regra de `contributions` (decisão #4). Somente lances `'completed'` entram nos somatórios do leaderboard.

**Rules (delta) — texto-guia (RT-5), sobre a base de SPEC-FIRESTORE-SECURITY:**
```
function isValidTieBid(data) {
  return data.amount is number && data.amount > 0 &&
         data.status == 'pending' &&
         data.createdAt == request.time &&
         (data.message == null || (data.message is string && data.message.size() <= 500)) &&
         (!('familyId' in data) || isValidId(data.familyId)) &&
         (!('guestId'  in data) || isValidId(data.guestId));
}
match /tieBids/{bidId} {
  allow create: if isSignedIn() && isValidTieBid(incoming());
  allow update: if isAdmin();           // promoção de status = servidor/Admin SDK
  allow read, list: if true;            // ranking público (ver §10 p/ alternativa via leaderboards/*)
}
match /leaderboards/{doc} {
  allow read: if true;                  // leitura barata na Home
  allow write: if isAdmin();            // só servidor/Admin SDK escreve agregados
}
```

**URL / rota:** `/presentes/gravata` (página) — destino do `app/page.tsx:294`. Sem subrota de checkout própria (o pipeline MP da SPEC-PAYMENTS-MP define seus endpoints/retornos); o lance é confirmado dentro de `/presentes/gravata`.

## 6. Arquivos afetados
- **Criar** `app/presentes/gravata/page.tsx` — experiência de lance + checkout isolado + upsell (RT-1, RT-3, RT-4, RT-8, RT-9).
- **Editar** `domain/types/index.ts` — `TieBidStatus` + `TieBid` realinhado, `guestId`/`familyId` opcionais (RT-2).
- **Reescrever** `components/TieLeaderboard.tsx` — remover mocks, ler `leaderboards/*` reais, ranking duplo, `rank` dinâmico, lookup de nomes, loading/empty (RT-6).
- **Editar** `firestore.rules` — bloco `match /tieBids/{bidId}` + `isValidTieBid` + `match /leaderboards/{doc}` (RT-5).
- **Criar/Editar** a cloud function de agregação (provavelmente `functions/` — não existe ainda; criar junto da infra de webhook da SPEC-PAYMENTS-MP) que mantém `leaderboards/*` (RT-7).
- **Editar** `docs/adr/0004-ranking-gravata-familia.md` — concretizar a decisão (RT-10).
- **Editar** (verificar) `app/page.tsx` — apenas confirmar que `href="/presentes/gravata"` (`l.294`) resolve; nenhuma mudança de markup necessária se a rota passar a existir.

## 7. Critérios de aceite
- [ ] `app/presentes/gravata/page.tsx` existe; clicar "Dar meu Lance" na Home (`app/page.tsx:294`) abre a página (HTTP 200, **sem 404**).
- [ ] Submeter um lance cria **1** doc em `tieBids` com `status: 'pending'` e `amount > 0`; nenhum caminho do cliente grava `'processing'`/`'completed'`/`'failed'` (grep por `'completed'`/`'paid'` no writer do lance = 0).
- [ ] `domain/types/index.ts` exporta `TieBidStatus` com o ENUM travado e `TieBid.status` o usa; nenhum código referencia mais `'paid'`.
- [ ] `firestore.rules` tem `match /tieBids` que: aceita `create` de `pending` por usuário assinado, **nega** `create` de `completed` pelo cliente, e restringe `update` de status a admin/servidor; tem `match /leaderboards` write-admin-only.
- [ ] `components/TieLeaderboard.tsx` **não contém** `mockFamilyData`/`mockIndividualData`; ambas as abas exibem dados reais agregados (família por `familyId`, individual por `guestId`), ordenados desc por valor, com `rank` 1..N atribuído dinamicamente.
- [ ] Nomes aparecem corretamente (lookup `guestId`→nome e `familyId`→nome de família via roster de SPEC-RSVP-AUTH); sem IDs crus na UI.
- [ ] Sem lances `completed`, o leaderboard mostra estado vazio honesto ("Seja o primeiro a dar um lance!"), não os mocks antigos.
- [ ] Quando o webhook promove um `tieBid` a `'completed'`, os somatórios em `leaderboards/family` e `leaderboards/individual` refletem o novo total (idempotente: re-processar o mesmo bid não duplica o total).
- [ ] Upsell pós-pagamento aparece com copy honesta quanto ao status (não afirma "pago"/"vencedor" se `pending`/modo simulado).
- [ ] Checkout do lance é ISOLADO (não reusa `app/presentes/checkout/page.tsx`) e reusa o pipeline MP da SPEC-PAYMENTS-MP (sem duplicar a integração MP).
- [ ] `docs/adr/0004-ranking-gravata-familia.md` registra as decisões concretas (agregação derivada via webhook, ranking duplo, rank dinâmico, nomes cacheados).
- [ ] `npm run build` passa sem novos erros de tipo/lint; `domain/types/index.ts` deixa de ser órfão (importado por `TieLeaderboard`/página/seed).

## 8. Validação e2e (e2e-validation-gate)
Esta spec toca runtime user-visível, estado persistente (`tieBids`/`leaderboards`), rules e (via dependência) webhook/cloud function — passa pelo gate.
1. **Baseline:** rodar `npm run build` (deve passar). Confirmar que `/presentes/gravata` hoje dá 404 e que `TieLeaderboard` mostra os mocks (`Família Silva 1500`, `Tio João 800`). Registrar ausência de `match /tieBids` em `firestore.rules` e ausência de `leaderboards/*`.
2. **Mudança idempotente:** criar a página, realinhar `TieBid`, adicionar rules de `tieBids`/`leaderboards`, reescrever `TieLeaderboard`, especificar/implementar a agregação. Edições de código/string e adição de campos são re-rodáveis sem efeito colateral acumulado; o seed de bids de teste deve ser idempotente (id determinístico ou limpeza prévia).
3. **Validar propagação por camada:**
   - *Rota/UI:* `/presentes/gravata` retorna 200; clicar "Dar meu Lance" não dá 404.
   - *Write (cliente):* submeter lance → doc em `tieBids` com `status:'pending'`, `amount`, identidade (se houver). Tentar gravar `status:'completed'` direto → **negado** pelas rules.
   - *Servidor (webhook):* promover um bid de teste a `'completed'` (via Admin SDK / fluxo MP de SPEC-PAYMENTS-MP, ou simulação no emulador) → `leaderboards/family` e `leaderboards/individual` atualizam o total do `familyId`/`guestId`.
   - *Leaderboard:* recarregar a Home → `TieLeaderboard` mostra o lance real no ranking correto (família e individual), ordenado desc, `rank` certo, nome resolvido. Nenhum dado mock visível.
   - *Idempotência da agregação:* re-disparar o webhook para o mesmo bid → total **não** dobra.
   - *Modo simulado:* sem chaves MP, o lance fica `pending` e a UI/upsell comunica honestamente "aguardando pagamento".
4. **Reverter:** `git checkout` nos arquivos; apagar bids/leaderboards de teste; rules revertem em staging se aplicável. Confirmar que o leaderboard volta ao baseline e a rota some.
5. **Revalidar:** `npm run build` verde após revert e após reaplicar; comportamento esperado restaurado.

## 9. Tarefas humanas / dependências externas
- **Dependência de SPEC-PAYMENTS-MP (bloqueante):** o checkout do lance reusa o pipeline MP (preferência, QR Pix dinâmico, brick, webhook que promove status). Sem essa spec, o lance só pode nascer/ficar `'pending'` (modo simulado). Coordenar a ordem: SPEC-PAYMENTS-MP **antes** ou junto.
- **Dependência de SPEC-RSVP-AUTH (bloqueante para ranking por família):** `familyId`/`guestId` e o lookup de nomes (roster `guests`/`families`) vêm dessa spec. Sem ela, lances não têm família/nome e o ranking por família fica vazio/degradado para anônimo.
- **Credenciais Mercado Pago:** não chegam nesta spec; enquanto ausentes, "modo simulado" (decisão travada #2). Quando chegarem, validar promoção `pending`→`completed` ponta a ponta.
- **PREFLIGHT de banco (decisão travada #11):** confirmar no Firebase Console qual banco (default vs. nomeado) tem coleções/rules provisionadas antes de validar o e2e e antes de o webhook escrever `tieBids`/`leaderboards`. `lib/firebase.ts:7` usa `getFirestore(app)` (default). Alinhar `databaseId` no app, no Admin SDK do webhook e na cloud function juntos. **Não mudar às cegas.**
- **Scaffold de Functions/webhook:** não existe `functions/` nem `firebase.json` hoje; a infra (provisionada por SPEC-PAYMENTS-MP) precisa estar de pé para a agregação derivada de `leaderboards/*` rodar.
- **Decisão de produto:** valores/pacotes de lance pré-definidos (se houver) e copy do upsell — definir com o casal.
- **Decisão de privacidade do ranking:** `tieBids` com `read/list` público vs. somente `leaderboards/*` agregados públicos (RT-5/§10). Default sugerido: expor só os agregados de `leaderboards/*`.

## 10. Riscos e mitigação
- **Risco: ranking por família vazio sem SPEC-RSVP-AUTH** (lances anônimos sem `familyId`). *Mitigação:* tratar a aba família com estado vazio honesto até identidade existir; ordem de execução (RSVP-AUTH antes); lance anônimo ainda conta no individual se houver `guestId`, senão fica fora do ranking (aceito).
- **Risco: privacidade — expor lances individuais brutos** ao tornar `tieBids` `read/list` público (valores e mensagens de cada convidado). *Mitigação:* servir o leaderboard apenas de `leaderboards/*` (agregados) e manter `tieBids` `read` admin-only, OU expor só campos não sensíveis. Decisão registrada em §9.
- **Risco: agregação duplicada/divergente** (webhook reprocessa o mesmo bid; soma diverge dos `tieBids` reais). *Mitigação:* idempotência por marca "agregado" no bid OU recomputo determinístico de `sum(amount) where status=='completed'`; job de reconciliação opcional comparando agregado vs. soma bruta.
- **Risco: cliente forja `status:'completed'`** para subir no ranking sem pagar. *Mitigação:* rule `tieBids` aceita só `'pending'` no `create` e `update` admin-only; promoção exclusiva do webhook MP; leaderboard conta só `'completed'`.
- **Risco: nomes desatualizados/órfãos** (bid com `guestId` cujo guest foi renomeado/removido). *Mitigação:* cachear nome no doc derivado no momento da agregação; fallback "Convidado" / `familyName` quando o lookup falhar; nunca exibir ID cru.
- **Risco: 404 persistir** se o `href` da Home não casar com o nome do arquivo de rota. *Mitigação:* RT-9 exige checagem explícita de 200; manter exatamente `/presentes/gravata`.
- **Risco: desalinhamento de status com o resto do sistema** (`TieBid` usava `'paid'`). *Mitigação:* RT-2 realinha ao ENUM travado e remove `'paid'`; grep de aceite garante zero referências remanescentes.
- **Risco: dependência de infra de Functions inexistente.** *Mitigação:* agregação só vai a produção junto/depois de SPEC-PAYMENTS-MP; em modo simulado, leaderboard mostra apenas o que já está `'completed'` (possivelmente vazio), de forma honesta.

## 11. Metas auditáveis (Definition of Done verificável por LLM)
> Objetivos quantitativos. Cada meta tem um método de auditoria executável e um alvo binário (PASS/FAIL). Uma LLM executora deve rodar a auditoria e reportar o resultado sem julgamento subjetivo. **SPEC entregue ⇔ todas as metas não-[humano] = PASS.** Os comandos assumem a raiz do repositório como diretório de trabalho.

| # | Meta (objetivo) | Como auditar (comando / checagem) | Alvo (PASS) |
|---|---|---|---|
| M-1 | Rota `/presentes/gravata` existe (mata o 404 do `app/page.tsx:294`) — RT-1, RT-9 | `test -f app/presentes/gravata/page.tsx; echo $?` | sai `0` (arquivo existe) |
| M-2 | Página é client component no padrão do projeto — RT-1 | `rg -n "^'use client'" app/presentes/gravata/page.tsx` | retorna `>=1` linha |
| M-3 | ENUM `TieBidStatus` travado exportado e usado em `TieBid` — RT-2, AC §7 | `rg -n "export type TieBidStatus = 'pending' \| 'processing' \| 'completed' \| 'failed'" domain/types/index.ts` e `rg -n "status: TieBidStatus" domain/types/index.ts` | ambos retornam `>=1` linha |
| M-4 | Status `'paid'` eliminado de todo o código — RT-2, AC §7, risco §10 | `rg -n "'paid'" app/ components/ domain/ lib/ functions/` | retorna `0` ocorrências |
| M-5 | Cliente nunca grava status promovido (writer do lance cria só `'pending'`) — RT-4, AC §7 | `rg -n "status:\s*'(processing\|completed\|failed)'" app/presentes/gravata/page.tsx` | retorna `0` ocorrências |
| M-6 | Writer do lance cria com `status: 'pending'` — RT-4 | `rg -n "status:\s*'pending'" app/presentes/gravata/page.tsx` | retorna `>=1` ocorrência |
| M-7 | Tratamento de erro de escrita reusa o padrão do projeto — RT-4 | `rg -n "handleFirestoreError\(.*OperationType\.CREATE.*'tieBids'\)" app/presentes/gravata/page.tsx` | retorna `>=1` ocorrência |
| M-8 | `firestore.rules` tem bloco `tieBids` com create-pending/update-admin — RT-5, AC §7 | `rg -n "match /tieBids/\{" firestore.rules` e `rg -n "function isValidTieBid" firestore.rules` e `rg -n "allow update: if isAdmin\(\)" firestore.rules` | os três retornam `>=1` linha |
| M-9 | `firestore.rules` tem bloco `leaderboards` write-admin-only — RT-5, RT-7, AC §7 | `rg -n "match /leaderboards/" firestore.rules` | retorna `>=1` linha |
| M-10 | Rule de `tieBids` valida `amount > 0`, `status == 'pending'` e `createdAt == request.time` — RT-5 | `rg -n "data.amount > 0" firestore.rules` e `rg -n "data.status == 'pending'" firestore.rules` e `rg -n "data.createdAt == request.time" firestore.rules` | os três retornam `>=1` linha |
| M-11 | Rule bloqueia cliente forjando `completed` (teste de emulador) — RT-5, AC §7, risco §10 | teste `@firebase/rules-unit-testing`: `create` em `tieBids` com `status:'completed'` por usuário assinado → `assertFails`; `create` com `status:'pending'` válido → `assertSucceeds` | ambas as asserções passam (PASS) |
| M-12 | Mocks removidos do `TieLeaderboard` — RT-6, AC §7 | `rg -n "mockFamilyData\|mockIndividualData" components/TieLeaderboard.tsx` | retorna `0` ocorrências |
| M-13 | `TieLeaderboard` lê fonte real de agregados (`leaderboards/*`) — RT-6, RT-7 | `rg -n "leaderboards" components/TieLeaderboard.tsx` | retorna `>=1` ocorrência |
| M-14 | Estado vazio honesto quando não há lances `completed` — RT-6, AC §7 | `rg -n "Seja o primeiro a dar um lance" components/TieLeaderboard.tsx` | retorna `>=1` ocorrência |
| M-15 | `domain/types/index.ts` deixa de ser órfão (importado pelo leaderboard/página) — RT-2, AC §7 | `rg -n "from ['\"].*domain/types" components/TieLeaderboard.tsx app/presentes/gravata/page.tsx` | retorna `>=1` ocorrência |
| M-16 | Build/lint passa sem novos erros — AC §7, e2e §8 | `npm run build` | sai com código `0` |
| M-17 | Agregação derivada é idempotente (re-processar o mesmo bid não dobra o total) — RT-7, AC §7, risco §10 | teste no emulador: promover bid de teste a `'completed'` e re-disparar o webhook para o mesmo bid → `total` em `leaderboards/family` e `leaderboards/individual` permanece igual após a 2ª chamada | total não muda entre 1ª e 2ª chamada (assertEqual PASS) |
| M-18 | ADR-0004 concretizado (webhook + ranking duplo + rank dinâmico + nomes cacheados) — RT-10, AC §7 | `rg -ni "webhook" docs/adr/0004-ranking-gravata-familia.md` e `rg -ni "leaderboards" docs/adr/0004-ranking-gravata-familia.md` | ambos retornam `>=1` linha |
| M-19 | [humano] Rota responde HTTP 200 e botão "Dar meu Lance" não dá 404 — RT-9, AC §7 | `npm run dev` e abrir `/presentes/gravata`; clicar o CTA na Home; observar status 200 e ausência de `not-found` | navegação retorna 200, sem 404 (verificação humana) |
| M-20 | [humano] Upsell pós-pagamento e leaderboard com copy honesta de status — RT-8, AC §7 | inspeção visual da tela de agradecimento/upsell em modo simulado: não afirma "pago"/"vencedor" com bid `pending` | copy honesta confirmada (verificação humana) |
