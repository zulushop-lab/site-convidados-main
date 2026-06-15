# SPEC-RSVP-AUTH — RSVP-First real: capability URL via WhatsApp + Anonymous Auth + GuestGate soft
> Status: planejado · Fase original: 3 · Track: A · Depende de: SPEC-FIRESTORE-SECURITY · Destrava: SPEC-GRAVATA-LEADERBOARD, atribuição por família em `rsvps`/`contributions`

## 1. Objetivo
Transformar o RSVP de fachada (`app/rsvp/[code]/page.tsx` com nome hardcoded e zero lookup) em fluxo real: o convidado abre uma **capability URL** entregue por WhatsApp, ganha um `uid` via **Anonymous Auth**, o código de família é resolvido contra o Firestore, e a identidade (`familyId`/`guestId`) é carimbada em todas as escritas (`rsvps`, `contributions`). Implanta o **GuestGate SOFT** (personaliza e identifica, mas não bloqueia navegação anônima). Isso destrava a agregação por família do leaderboard (ADR-0004) e o RSVP por núcleo familiar.

## 2. Contexto atual (verificado em código)
- `app/rsvp/[code]/page.tsx:11` recebe `params: Promise<{ code: string }>` mas **nunca** lê `code`; não há `await params`.
- `app/rsvp/[code]/page.tsx:15` `guestName` hardcoded `'Rafael'` ("Mocked for simplicity").
- `app/rsvp/[code]/page.tsx:22-33` `handleConfirm` só faz `setHomeState('ANIMATING_LOADING')` e `router.push('/')` — sem lookup no Firestore, sem captura de identidade, sem persistência de RSVP.
- `app/rsvp/[code]/page.tsx:78` rótulo "Minha Família (4)" é literal estático; não vem de roster.
- `domain/types/index.ts` define `Family {id,name,code}` (l.3-7), `Guest {id,familyId,name,phone?,email?,rsvpStatus,isMainGuest?}` (l.9-17), `Gift`, `TieBid {…,guestId,familyId,status:'pending'|'paid'}` (l.28-36). É arquivo **órfão** (zero imports no app).
- `lib/store/useAppStore.ts` guarda apenas `homeState` (FSM de animação, ADR-0002); sem identidade do convidado, sem `sessionStorage`, sem `AuthContext`/`GuestGate`/middleware.
- `lib/firebase.ts:2,8` expõe `getAuth(app)` e `signInWithGoogle` (popup Google), mas **nenhum** `signInAnonymously`; App Check ausente.
- `app/presenca/page.tsx:52-60` grava em `rsvps` `{adults, childrenCount, dietary, message, createdAt}` via `addDoc` (gera ID aleatório) **sem** `familyId`/`guestId` → impossível deduplicar por família ou atribuir confirmação.
- `app/presentes/checkout/page.tsx:37-47` grava em `contributions` `{amount, giftTitle, donorName, donorEmail, paymentMethod, status:'completed', createdAt}` **sem** `familyId`/`guestId` (e com `status:'completed'` client-side — corrigido em SPEC-CHECKOUT-HONESTY).
- `firestore.rules:20-33` `isValidRSVP` exige `adults` (list), `childrenCount` (int≥0), `createdAt==request.time` e `keys().size()>=3`; `create` permitido a **qualquer um** (`if isValidRSVP(incoming())`, sem `isSignedIn()`). Não há regra para coleções `families`/`guests`/`codes`.
- `firestore.rules:50-61` `isValidContribution` exige `status in ['pending','completed']` e `createdAt==request.time`; sem campos de família.
- Não existem coleções `families`, `guests` nem `codes` semeadas. Não há script admin de seed de convidados.

## 3. Escopo
**Inclui:**
- Modelo de dados `families`/`guests` (estendendo `domain/types/index.ts` como contrato único) e regras Firestore para leitura pública somente-leitura controlada do código de família.
- Capability URL `/rsvp/<códigoFamília>` + dica opcional `?c=<guestId>`; resolução real de `code` (`const { code } = await params`).
- Anonymous Auth (`signInAnonymously`) em `lib/firebase.ts` + `AuthContext` que garante `uid` antes de qualquer escrita.
- `GuestContext`/`GuestGate` SOFT: resolve `familyId`/`guestId`, persiste em Zustand + `sessionStorage`, personaliza UI; **não** bloqueia navegação.
- Reescrita do fluxo `app/rsvp/[code]/page.tsx`: lookup → seleção de quem-é-você (roster) → personalização → confirmação.
- RSVP por **família**: 1 doc em `rsvps` com ID determinístico = `familyId`; campos `familyId`, `confirmedBy`, `updatedBy`, `confirmedAt`, `updatedAt`, `adults[]`, `childrenCount`; reentrada de já-confirmado → tela "já confirmado" com resumo + [Editar resposta] + [Ir para Home/Presentes].
- Carimbo de `familyId`/`guestId` em `rsvps` **e** `contributions` (writers atualizados; rules estendidas).
- Artefato "Modelo de Planilha de Convidados" + tarefa humana de preenchimento.
- Especificação do script admin `seed:families` (gera código por família + `guestId`s, grava `families`/`guests` via Admin SDK, imprime links de família + individuais + mensagem de WhatsApp pronta).

**Não inclui:**
- App Check (sprint posterior; decisão travada #5).
- Disparo automático de WhatsApp via Cloud API (SPEC-WHATSAPP-DISPATCH futura, opcional).
- Pagamento real Mercado Pago (SPEC-PAYMENTS-MP) e UI do leaderboard (SPEC-GRAVATA-LEADERBOARD) — esta spec só carimba os dados que eles consomem.
- Endurecimento geral de rules de `rsvps`/`contributions`/`gifts` para escopo de validação base (pertence a SPEC-FIRESTORE-SECURITY, que esta spec depende e estende).
- Login Google de convidado (mantém-se Anonymous; Google segue só para admin).
- Implementação efetiva (decisão travada #13: entregável deste ciclo = só o plano).

## 4. Requisitos técnicos
**RT-1 — Anonymous Auth no bootstrap.** Adicionar `signInAnonymously` em `lib/firebase.ts` e um helper `ensureAnonymousAuth(): Promise<User>` que: se `auth.currentUser` existir, retorna; senão chama `signInAnonymously(auth)` e aguarda. Idempotente. Não substitui `signInWithGoogle` (admin). Sem App Check nesta spec.

**RT-2 — AuthContext.** Criar `lib/context/AuthContext.tsx` (`'use client'`) com `onAuthStateChanged`, expondo `{ user, uid, isLoading, isAdmin }`. Monta no layout raiz, dispara `ensureAnonymousAuth()` no mount. Garante `uid` disponível antes de qualquer write. Não preserva sessão Google de admin com anonymous (admin loga via Google explicitamente; anonymous é o default do convidado).

**RT-3 — Resolução do código (capability URL).** Em `app/rsvp/[code]/page.tsx`, ler `const { code } = await params` (Next 15). Buscar a família cujo `code === code` via query `where('code','==',code)` na coleção `families` (ver RT-9 para indexação/lookup). Tratar: código inexistente → tela "convite não encontrado" com instrução "peça o link aos noivos pelo WhatsApp"; múltiplos resultados (não deve ocorrer; `code` único) → log + tratar como inválido.

**RT-4 — Vinculação de identidade (GuestContext).** Criar `lib/context/GuestContext.tsx` + store de identidade (estender `lib/store/useAppStore.ts` ou novo `useGuestStore`) com `{ familyId, familyName, guests: Guest[], guestId | null, source: 'hint' | 'roster' | null }`. Ao resolver o código (RT-3): grava `familyId`, `familyName`, `guests` (roster) em Zustand **e** `sessionStorage` (chave `guest.identity.v1`). Reidrata de `sessionStorage` no reload para não exigir reabrir o link na mesma sessão.

**RT-5 — Seleção "quem é você?" (roster).**
- Com dica `?c=<guestId>` válida (pertence ao `familyId` resolvido): pré-seleciona o `guestId`, define `source:'hint'`. A dica é **conveniência**, não barreira; se `?c=` for inválida ou de outra família, ignora silenciosamente e cai no fluxo sem dica.
- Sem dica (ou dica inválida): renderiza pergunta "Quem é você?" listando `guests` da família (roster real, substituindo o "Minha Família (4)" hardcoded em `app/rsvp/[code]/page.tsx:78`). Ao escolher, grava `guestId`, `source:'roster'`.
- Personalização: substituir `guestName` hardcoded (`app/rsvp/[code]/page.tsx:15`) pelo nome real do guest selecionado (ou `familyName` antes da seleção).

**RT-6 — GuestGate SOFT.** Componente/hook que: (a) injeta identidade em páginas que escrevem (`/presenca`, `/presentes`, `/presentes/checkout`); (b) personaliza saudações; (c) **NÃO** redireciona nem bloqueia navegação anônima — convidado sem código ainda pode navegar e confirmar (RSVP fica sem `familyId` ou com flag `selfRegistered:true`). Sem middleware de bloqueio. (Hardening real = App Check, spec futura.)

**RT-7 — RSVP por família (ID determinístico).** Reescrever a escrita de `app/presenca/page.tsx:52-60` (e a confirmação de `app/rsvp/[code]/page.tsx`) para usar `setDoc(doc(db,'rsvps',familyId), data, { merge:false })` em vez de `addDoc` — ID do doc = `familyId`, garantindo **1 doc por família** (idempotência/deduplicação). Payload: `{ familyId, adults[], childrenCount, dietary, message, confirmedBy:guestId, confirmedAt, updatedBy:guestId, updatedAt }`. Em edição posterior, atualiza `updatedBy`/`updatedAt` preservando `confirmedBy`/`confirmedAt` originais. `createdAt`/`confirmedAt`/`updatedAt` via `serverTimestamp()`.

**RT-8 — Reentrada de já-confirmado.** Ao montar `/rsvp/[code]` (ou `/presenca` com identidade), ler `getDoc(doc(db,'rsvps',familyId))`. Se existir → renderizar tela "já confirmado" com **resumo**: quem confirmou (`confirmedBy` → nome via roster), quando (`confirmedAt`), quem vai (`adults[]` + `childrenCount`), e botões `[Editar resposta]` (entra no form pré-preenchido com o doc atual) e `[Ir para Home]` / `[Ir para Presentes]`. Qualquer membro da família pode editar (carimba `updatedBy`).

**RT-9 — Lookup do código sem expor o roster inteiro.** O cliente precisa resolver `code → familyId` e ler o roster **apenas da própria família**. Opção adotada: documento de índice em coleção `codes/{code}` `{ familyId }` (read público por ID, never list) — o cliente lê `codes/<code>` por ID (precisa conhecer o código = barreira), obtém `familyId`, então lê `families/<familyId>` e `guests where familyId==familyId`. Evita `list` em `families` (que vazaria todos os códigos). Alternativa documentada (não adotada): query `where('code','==',code)` com rule que só permite `get`/query restrita — rejeitada por exigir `list` que expõe enumeração.

**RT-10 — Regras Firestore (estende SPEC-FIRESTORE-SECURITY).** Adicionar a `firestore.rules`:
- `match /codes/{code}`: `allow get: if true;` (read por ID, conhecer o código é a barreira); `allow list: if isAdmin();` `allow write: if isAdmin();`.
- `match /families/{familyId}`: `allow get: if true;` (precisa do `familyId` obtido via `codes`); `allow list: if isAdmin();` `allow write: if isAdmin();`.
- `match /guests/{guestId}`: `allow get: if true;`; `allow list: if isSignedIn();` (roster da família — leitura ampla aceitável no contexto; endurecível com query por `familyId` + App Check depois); `allow write: if isAdmin();`.
- Estender `isValidRSVP` (`firestore.rules:21-27`) para exigir `familyId` (string, `isValidId`), `confirmedBy` (string) e permitir `adults`/`childrenCount`; permitir `update` quando `isSignedIn()` e `incoming().familyId == existing().familyId` (qualquer membro edita; servidor/admin não exigido para RSVP). `create` passa a exigir `isSignedIn()`.
- Estender `isValidContribution` (`firestore.rules:50-55`) para aceitar campos opcionais `familyId`/`guestId` (strings, `isValidId` quando presentes). Mantém regra de status do SPEC-CHECKOUT-HONESTY (cliente só cria `'pending'`).

**RT-11 — Carimbo em `contributions`.** Atualizar `app/presentes/checkout/page.tsx:37-47` para incluir `familyId` e `guestId` (de `GuestContext`) no `contributionData` quando houver identidade; quando anônimo, omitir (campos opcionais). Isso destrava a agregação por família do ADR-0004 / SPEC-GRAVATA-LEADERBOARD. (A correção de `status` para `'pending'` pertence a SPEC-CHECKOUT-HONESTY; aqui só somamos os campos de identidade.)

**RT-12 — Script admin `seed:families`.** Criar `scripts/seed-families.ts` (Node + Firebase Admin SDK, service account local) que: lê a Planilha de Convidados (CSV/XLSX — ver §9); para cada família gera `code` de **alta entropia** (8–10 chars, ~40+ bits, alfabeto sem ambíguos `0/O/1/l/I`, **nunca** sequencial nem derivado de nome) único (checa colisão em `codes`); gera `guestId` por integrante; grava `families/<familyId>`, `guests/<guestId>` e `codes/<code>={familyId}` via Admin SDK (respeita rules admin-only por ser Admin SDK); imprime, por família, o link base `/rsvp/<code>`, os links individuais `/rsvp/<code>?c=<guestId>` e a **mensagem de WhatsApp pronta**. Idempotência: re-rodar não deve duplicar nem regenerar códigos de famílias já semeadas (chave por nome/telefone ou coluna `id` explícita na planilha).

**RT-13 — Honestidade documentada.** Documentar no código/README do script: a dica `?c=` é conveniência (não barreira); a barreira é o `code` de família (alta entropia); capability URLs podem ser encaminhadas — risco **baixo** no contexto (casamento, público conhecido), mitigado por revisão admin dos RSVPs e por App Check em spec futura. Recuperação de link perdido = casal reenvia pelo WhatsApp (consequência aceita do soft gate).

## 5. Modelo de dados / contratos

**`domain/types/index.ts` (estender — contrato único):**
```ts
export interface Family {
  id: string;
  name: string;          // "Família Silva"
  code: string;          // alta entropia, único; barreira de acesso
  phone?: string;        // WhatsApp (E.164), usado pelo seed para montar a mensagem
}

export interface Guest {
  id: string;
  familyId: string;
  name: string;
  isChild?: boolean;     // alinhar com a planilha (é_criança?)
  phone?: string;
  email?: string;
  rsvpStatus?: RSVPGuestStatus;
  isMainGuest?: boolean;
}
```

**Coleção `codes/{code}`** (índice de lookup):
```jsonc
{ "familyId": "fam_silva" }   // doc id = o próprio code
```

**Coleção `families/{familyId}`**: `{ id, name, code, phone? }`.
**Coleção `guests/{guestId}`**: `{ id, familyId, name, isChild?, phone?, email? }`.

**Coleção `rsvps/{familyId}`** (doc id determinístico = `familyId`):
```jsonc
{
  "familyId": "fam_silva",
  "adults": [{ "name": "...", "confirmed": true }],
  "childrenCount": 1,
  "dietary": "",
  "message": "",
  "confirmedBy": "g_isadora",   // guestId de quem confirmou
  "confirmedAt": "<serverTimestamp>",
  "updatedBy": "g_matheus",     // guestId do último editor
  "updatedAt": "<serverTimestamp>"
}
```

**Coleção `contributions/{auto}`** (adiciona identidade, campos opcionais):
```jsonc
{
  "amount": 100, "giftTitle": "...", "donorName": "...", "donorEmail": "...",
  "paymentMethod": "pix", "status": "pending",
  "familyId": "fam_silva", "guestId": "g_isadora",
  "createdAt": "<serverTimestamp>"
}
```

**Formato de URL / payload:**
- Base de família: `https://<host>/rsvp/<code>`
- Individual (dica): `https://<host>/rsvp/<code>?c=<guestId>`
- `sessionStorage` chave `guest.identity.v1`: `{ familyId, familyName, guests, guestId, source }`.

**Rules (delta) — ver RT-9, RT-10 para o texto integral.**

## 6. Arquivos afetados
- **Editar** `domain/types/index.ts` — adicionar `phone?` a `Family`, `isChild?` a `Guest` (contrato).
- **Editar** `lib/firebase.ts` — `signInAnonymously` + `ensureAnonymousAuth`.
- **Criar** `lib/context/AuthContext.tsx` — provider de auth (uid/admin).
- **Criar** `lib/context/GuestContext.tsx` — identidade do convidado.
- **Editar** `lib/store/useAppStore.ts` (ou **criar** `lib/store/useGuestStore.ts`) — estado de identidade + sessionStorage.
- **Editar** `app/layout.tsx` — montar `AuthContext`/`GuestContext` (verificar caminho real do layout raiz).
- **Reescrever** `app/rsvp/[code]/page.tsx` — `await params`, lookup, roster, personalização, reentrada, confirmação por família.
- **Editar** `app/presenca/page.tsx` — `setDoc(doc(db,'rsvps',familyId))` + campos de identidade; tela "já confirmado".
- **Editar** `app/presentes/checkout/page.tsx` — carimbar `familyId`/`guestId` em `contributions`.
- **Editar** `firestore.rules` — `codes`/`families`/`guests` + `isValidRSVP`/`isValidContribution` estendidos (sobre a base de SPEC-FIRESTORE-SECURITY).
- **Criar** `scripts/seed-families.ts` — seed admin + geração de links/mensagem WhatsApp.
- **Criar** `docs/templates/planilha-convidados.csv` (ou `.md`) — Modelo de Planilha de Convidados (artefato).
- **Atualizar** `DRAFT_firestore.rules` em paralelo se ainda for o staging de rules.

## 7. Critérios de aceite
- [ ] `app/rsvp/[code]/page.tsx` lê `const { code } = await params` e resolve a família real via `codes`→`families`; nome hardcoded `'Rafael'` removido.
- [ ] Abrir `/rsvp/<código válido>` autentica anonimamente (existe `auth.currentUser` com `isAnonymous:true`), carrega o roster real e personaliza com o nome correto.
- [ ] Abrir `/rsvp/<código inválido>` mostra "convite não encontrado" e não quebra.
- [ ] `?c=<guestId válido>` pré-seleciona a pessoa (`source:'hint'`); `?c=` inválido cai no fluxo "quem é você?" sem erro.
- [ ] Sem dica, a lista "quem é você?" vem do roster da família (não mais "Minha Família (4)" hardcoded).
- [ ] Confirmar gera **1** doc em `rsvps` com id = `familyId`, contendo `familyId`, `confirmedBy`, `confirmedAt`; confirmar de novo NÃO cria segundo doc (sobrescreve/edita o mesmo).
- [ ] Reentrada de família já confirmada mostra tela "já confirmado" com resumo (quem confirmou, quando, quem vai) + `[Editar resposta]` + `[Ir para Home/Presentes]`.
- [ ] Edição por outro membro registra novo `updatedBy`/`updatedAt` e preserva `confirmedBy`/`confirmedAt`.
- [ ] `contributions` criado com identidade contém `familyId`/`guestId`; criado por anônimo omite os campos sem violar rules.
- [ ] GuestGate é SOFT: navegação anônima em `/presentes` e `/presenca` continua funcionando (sem redirect/bloqueio).
- [ ] `firestore.rules` permite `get` de `codes`/`families` por ID, nega `list` a não-admin, e exige `isSignedIn()` no `create` de `rsvps`.
- [ ] `scripts/seed-families.ts` (dry-run) gera códigos de alta entropia únicos, `guestId`s, e imprime links + mensagem de WhatsApp por família; re-rodar é idempotente.
- [ ] `npm run build` passa; `domain/types/index.ts` deixa de ser órfão (importado por context/seed).
- [ ] Modelo de Planilha de Convidados existe como artefato com as colunas exatas (§9).

## 8. Validação e2e (e2e-validation-gate)
1. **Baseline:** estado atual — `app/rsvp/[code]/page.tsx` ignora `code`; `rsvps` sem `familyId`; sem `codes`/`families`/`guests`. Registrar (count de docs em `rsvps`, ausência das coleções).
2. **Provisionar dados de teste (idempotente):** rodar `seed:families` (dry-run + run) para 1 família de teste; confirmar `codes/<code>`, `families/<famId>`, `guests/*` criados; re-rodar e confirmar **sem** duplicação.
3. **Propagação por camada:**
   - *Auth:* abrir `/rsvp/<code>` → `auth.currentUser.isAnonymous === true`.
   - *Lookup/UI:* roster correto e nome personalizado; `?c=` pré-seleciona.
   - *Write:* confirmar → existe `rsvps/<familyId>` com `confirmedBy`/`confirmedAt`; reconfirmar → mesmo doc, sem duplicata.
   - *Rules:* tentar `list` de `families`/`codes` como não-admin → negado; `get codes/<code>` → permitido; `create rsvps` sem auth → negado.
   - *Contributions:* checkout com identidade → doc com `familyId`/`guestId`; anônimo → doc sem eles, aceito.
   - *Soft gate:* navegar `/presentes` e `/presenca` sem código → sem bloqueio.
4. **Reverter:** apagar a família/guests/code/rsvp de teste; confirmar contagem de `rsvps` igual ao baseline; rules revertem em staging se aplicável.
5. **Revalidar:** `npm run build` verde; coleções de teste removidas; baseline restaurado.

## 9. Tarefas humanas / dependências externas
- **Preencher a "Modelo de Planilha de Convidados"** antes do seed. Colunas exatas:
  - `id_familia` (opcional, para idempotência — se vazio, derivar de `nome_familia`+`telefone_whatsapp`)
  - `nome_familia` (ex.: "Família Silva")
  - `telefone_whatsapp` (E.164, ex.: `+5511999998888`)
  - `integrantes` / `nomes` (lista de nomes — 1 por linha ou separados por `;`)
  - `e_crianca` (sim/não por integrante — alinhar formato com `integrantes`)
  - `observacoes` (livre)
- **Service account** do projeto Firebase (`gen-lang-client-0435917056`) com chave JSON local para o Admin SDK rodar `seed:families` (não commitar a chave).
- **PREFLIGHT de banco** (decisão travada #11): confirmar no Firebase Console **qual banco** (default vs nomeado `ai-studio-remixmatheusisad-…`, `firebase-applet-config.json:6`) tem coleções/rules provisionadas; `lib/firebase.ts:7` hoje usa `getFirestore(app)` (default) e ignora `firestoreDatabaseId`. Só então decidir passar `databaseId` ao SDK do app e ao Admin SDK no seed. **Não mudar às cegas.**
- **Decidir e registrar a entropia final do código** (8–10 chars; alfabeto sem ambíguos) e o **host de produção** que entra nos links da mensagem de WhatsApp.
- **Distribuição dos links** = casal envia por WhatsApp pessoal (e reenvia em caso de link perdido).

## 10. Riscos e mitigação
- **Capability URL encaminhada / vazada:** terceiro abre o RSVP da família. *Mitigação:* risco baixo no contexto (público conhecido); revisão admin dos `rsvps`/`contributions`; App Check em spec futura; soft gate é decisão consciente (#3).
- **Enumeração de códigos:** se `families`/`codes` permitissem `list`, todos os convites vazariam. *Mitigação:* RT-9/RT-10 — `get` por ID apenas, `list` admin-only; código de alta entropia inviabiliza brute-force.
- **Banco errado (default vs nomeado):** seed grava num banco e o app lê de outro → "coleções vazias". *Mitigação:* PREFLIGHT obrigatório (§9) antes de qualquer escrita; alinhar `databaseId` em app e Admin SDK juntos.
- **Colisão / regeneração de código no re-seed:** re-rodar o seed poderia regenerar códigos e invalidar links já enviados. *Mitigação:* idempotência por `id_familia`; checagem de colisão em `codes`; nunca regenerar código de família já semeada.
- **Dependência de SPEC-FIRESTORE-SECURITY:** alterar rules de `rsvps`/`contributions` antes do hardening base causaria divergência. *Mitigação:* endurecer rules (SPEC-FIRESTORE-SECURITY) **antes**; esta spec apenas estende `isValidRSVP`/`isValidContribution` e adiciona `codes`/`families`/`guests`.
- **Migração de `rsvps` legados (sem `familyId`):** docs antigos criados por `addDoc` (`app/presenca/page.tsx:60`) não têm id = `familyId`. *Mitigação:* tratar legados como descartáveis (protótipo) ou script de migração one-off; documentar que a fonte da verdade passa a ser `rsvps/<familyId>`.
- **Quebra de personalização anônima:** convidado sem código vê UI genérica. *Mitigação:* fallback de saudação neutra; soft gate garante que o fluxo ainda funciona (RSVP `selfRegistered`).
