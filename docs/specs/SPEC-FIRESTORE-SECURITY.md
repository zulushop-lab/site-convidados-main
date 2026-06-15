# SPEC-FIRESTORE-SECURITY — Segurança de dados: rules + config

> Status: planejado · Fase original: 1 · Track: A · Depende de: — · Destrava: SPEC-GIFTS-CATALOG, SPEC-CHECKOUT-HONESTY, SPEC-RSVP-AUTH, SPEC-PAYMENTS-MP

## 1. Objetivo
Endurecer a camada de segurança do Firestore (rules + configuração de deploy + higiene de segredos) para que o servidor — e não o cliente anônimo — seja a fonte da verdade do dinheiro. Hoje qualquer visitante pode gravar uma contribuição `status: 'completed'` de valor arbitrário direto do navegador. Esta spec fecha esse buraco ANTES de qualquer outra do Track A, porque os writers (catálogo, checkout, RSVP, pagamentos) precisam casar com rules já endurecidas.

## 2. Contexto atual (verificado em código)
- `firestore.rules:57-58` — `contributions` permite `allow create: if isValidContribution(incoming())` sem exigir autenticação.
- `firestore.rules:50-54` — `isValidContribution` aceita `status in ['pending','completed']` (l.53), `amount > 0` SEM teto (l.51), NÃO usa `keys().hasOnly()` (campos extras passam), NÃO exige `donorEmail`. Não há `allow update`.
- `app/presentes/checkout/page.tsx:37-47` — o cliente grava a contribuição com `status: 'completed'` (l.43) e `amount` vindo de `parseFloat` de um query param (`amountStr`, l.14/35). Ou seja: o "pagamento" é fachada e o status final é decidido pelo navegador.
- `firestore.rules:21-26` — `isValidRSVP` usa `keys().hasAll([...]) && keys().size() >= 3` (l.26) — mínimo, NÃO `hasOnly` → campos extras passam; sem caps em `adults`, `dietary` ou `message`.
- `app/presenca/page.tsx:52-60` — o RSVP grava `adults`, `childrenCount`, `dietary`, `message`, `createdAt`; NÃO há `familyId`/`guestId` (atribuição por família ainda inexiste — destravada por SPEC-RSVP-AUTH).
- `firestore.rules:43-46` — `gifts` com `read`/`list` público (OK) e `write` só admin (OK); seed client-side de gifts colide com isso (tratado em SPEC-GIFTS-CATALOG).
- `firestore.rules:14-18` — `isAdmin()` = `request.auth.token.email == 'matheusrs180@gmail.com' && email_verified == true`.
- NÃO existe `firebase.json` na raiz (confirmado: nenhum match no projeto) → nenhum alvo de deploy de rules declarado; o deploy de rules hoje é manual/implícito.
- Existe `DRAFT_firestore.rules` na raiz — cópia quase idêntica de `firestore.rules` (diverge só por faltar `allow list` em rsvps/contributions). Fonte de confusão "qual arquivo é o canônico".
- `lib/firebase.ts:7` — `getFirestore(app)` usa o banco **default** e IGNORA `firestoreDatabaseId` declarado em `firebase-applet-config.json:6` (`ai-studio-remixmatheusisad-...`). Risco de rules/coleções estarem no banco named, não no default lido pelo app.
- `firebase-applet-config.json` NÃO está no `.gitignore` (`.gitignore` só cobre `node_modules/`, `.next/`, `coverage/`, `.DS_Store`, `*.log`, `.env*`) → a `apiKey` web (`AIzaSyBjIrfUtyY7BJRYBXl9PnXMLh1SEUzv0iY`, l.4) está COMMITADA no histórico.
- `lib/firestore-errors.ts:30-47` — monta `FirestoreErrorInfo` com `userId`/`email`/`emailVerified`/`isAnonymous`/`tenantId`/`providerInfo` (l.33-41), faz `console.error` do JSON (l.46) E `throw new Error(JSON.stringify(errInfo))` (l.47) → PII vaza para console do navegador e para a mensagem de erro propagada à UI.

## 3. Escopo
**Inclui:**
- Reescrita das rules de `contributions` (forçar `status == 'pending'` no create; teto de `amount`; `keys().hasOnly([...])`; exigir `donorEmail`; novo `allow update: if isAdmin()` para promoção de status).
- Reescrita das rules de `rsvps` (`keys().hasOnly([...])` já prevendo `familyId`/`guestId` opcionais; caps em `adults`/`dietary`/`message`).
- Alinhamento do ENUM de status de contribuição/lance a `'pending' | 'processing' | 'completed' | 'failed'`.
- Introdução de `isSignedIn()` como pré-condição dos creates (habilitado por Anonymous Auth — ver Tarefas humanas / cross-dep).
- Criação de `firebase.json` declarando `firestore.rules` como alvo de deploy; remoção de `DRAFT_firestore.rules`.
- Adicionar `firebase-applet-config.json` ao `.gitignore` + commit de `firebase-applet-config.example.json`.
- Refatorar `lib/firestore-errors.ts` para não logar/propagar PII.

**Não inclui:**
- Ajustar os writers cliente (`checkout/page.tsx`, `presenca/page.tsx`) para casarem com as rules novas → isso é SPEC-CHECKOUT-HONESTY e SPEC-RSVP-AUTH. Esta spec endurece as rules PRIMEIRO; espera-se (e documenta-se) que os writers atuais QUEBREM até serem migrados.
- Implementar Anonymous Auth em si (sign-in anônimo no boot) — esta spec só prepara `isSignedIn()` nas rules; o gatilho do sign-in é coordenado com SPEC-RSVP-AUTH/SPEC-CHECKOUT-HONESTY. Ver RT-9.
- Implementar o webhook/Admin SDK que promove status (SPEC-PAYMENTS-MP) — aqui só abrimos a porta `allow update: if isAdmin()`.
- App Check (sprint posterior, decisão travada #5).
- Mudar `lib/firebase.ts` para banco named às cegas — isso é PREFLIGHT (tarefa humana).

## 4. Requisitos técnicos
- **RT-1 — Forçar `status == 'pending'` no create de contributions.** Em `isValidContribution`, trocar `data.status in ['pending','completed']` por `data.status == 'pending'`. O cliente NUNCA cria `'completed'`/`'processing'`/`'failed'`.
- **RT-2 — Teto de valor.** Em `isValidContribution`, exigir `data.amount > 0 && data.amount <= 100000` (R$ 100.000,00 em reais; confirmar unidade — ver RT-13).
- **RT-3 — `keys().hasOnly([...])` em contributions.** Restringir o documento ao conjunto exato de campos permitidos no create: `['amount','giftTitle','donorName','donorEmail','paymentMethod','status','createdAt']` (espelhando `contributionData` de `checkout/page.tsx:37-45`). Combinar com `keys().hasAll([...])` dos obrigatórios.
- **RT-4 — Exigir `donorEmail`.** Em `isValidContribution`, adicionar `data.donorEmail is string && data.donorEmail.size() <= 200 && data.donorEmail.size() > 0`.
- **RT-5 — `allow update: if isAdmin()` em contributions.** Adicionar regra de update que SÓ admin/servidor pode executar, para promover `pending → processing → completed/failed`. O Admin SDK (webhook MP) ignora rules, mas a regra documenta a invariante e bloqueia update via cliente. Validar a transição de status com `isValidStatusTransition(existing().status, incoming().status)` (helper que aceita o ENUM `pending|processing|completed|failed` e proíbe sair de estado terminal).
- **RT-6 — `createdAt`/`updatedAt` consistentes.** Manter `data.createdAt == request.time` no create. No update admin, NÃO reescrever `createdAt`; opcionalmente exigir `incoming().updatedAt == request.time`.
- **RT-7 — `rsvps` com `keys().hasOnly([...])`.** Trocar `hasAll(...) && size() >= 3` por `hasAll(['adults','childrenCount','createdAt']) && hasOnly(['adults','childrenCount','dietary','message','createdAt','familyId','guestId','confirmedBy','updatedBy','updatedAt'])`. `familyId`/`guestId`/`confirmedBy` ficam opcionais aqui (preenchidos quando SPEC-RSVP-AUTH existir) para evitar churn de rules entre specs.
- **RT-8 — Caps em rsvps.** `data.adults is list && data.adults.size() <= 20`; `data.childrenCount is int && data.childrenCount >= 0 && data.childrenCount <= 20`; `(data.dietary == null || (data.dietary is string && data.dietary.size() <= 1000))`; `(data.message == null || (data.message is string && data.message.size() <= 1000))`.
- **RT-9 — `isSignedIn()` nos creates.** Adicionar `isSignedIn()` como pré-condição em `contributions/{id}` create e `rsvps/{id}` create (`allow create: if isSignedIn() && isValid...`). Depende de Anonymous Auth estar ativo no boot; se o sign-in anônimo ainda não estiver implementado no momento do deploy desta spec, deixar a cláusula `isSignedIn()` COMENTADA no arquivo com TODO + nota cruzada para SPEC-RSVP-AUTH, para não derrubar o fluxo anônimo antes do auth existir. A decisão de ativar/comentar é registrada na seção 9.
- **RT-10 — Criar `firebase.json`.** Na raiz, declarar `{ "firestore": { "rules": "firestore.rules" } }` (e `indexes` se aplicável). Isso torna `firebase deploy --only firestore:rules` reprodutível e documenta o alvo canônico.
- **RT-11 — Remover `DRAFT_firestore.rules`.** Apagar o arquivo; `firestore.rules` é o único canônico. Se houver intenção histórica nele, ela já está absorvida pela reescrita.
- **RT-12 — Higiene de segredos.** Adicionar `firebase-applet-config.json` ao `.gitignore`; criar `firebase-applet-config.example.json` (mesma forma, valores placeholder) versionado; documentar no README/spec que a `apiKey` real foi exposta e precisa de rotação/restrição (tarefa humana, seção 9). Nota: remover do tracking (`git rm --cached`) não apaga do histórico — a mitigação real é a restrição/rotação da key.
- **RT-13 — Definir unidade de `amount`.** Decidir e documentar se `amount` é em reais (float, ex. `150.00`) ou centavos (int, ex. `15000`). Mercado Pago opera em valor decimal (reais). Recomendado: manter reais no Firestore para casar com `parseFloat(amountStr...)` (`checkout/page.tsx:35`); o teto de RT-2 segue a mesma unidade (`<= 100000`). Registrar a decisão em `domain/types/index.ts` como comentário no contrato (sem alterar código nesta spec só-docs).
- **RT-14 — Refatorar `lib/firestore-errors.ts`.** (a) NÃO incluir `email`/`providerInfo[].email`/`tenantId` no objeto logado; manter no máximo `userId` (uid não-PII) e `isAnonymous` para diagnóstico. (b) `console.error` apenas em DEV (`if (process.env.NODE_ENV !== 'production')`) e logar objeto estruturado, não JSON com PII. (c) NÃO fazer `throw new Error(JSON.stringify(errInfo))` — lançar um `Error` com mensagem amigável genérica (ex.: "Não foi possível concluir a operação. Tente novamente.") e anexar o `errInfo` estruturado (sem PII) como propriedade não serializada para telemetria.
- **RT-15 — Alinhar ENUM no contrato.** O ENUM de status de contribuição é `'pending' | 'processing' | 'completed' | 'failed'`. `TieBid.status` em `domain/types/index.ts:35` hoje é `'pending' | 'paid'` — sinalizar (cross-dep com SPEC-GRAVATA-LEADERBOARD/SPEC-PAYMENTS-MP) que será migrado para o mesmo ENUM; esta spec NÃO altera o tipo, apenas documenta o alvo.

## 5. Modelo de dados / contratos

### Coleção `contributions` (rules-alvo)
Create (cliente): apenas
```
amount: number        // > 0 && <= 100000 (reais)
giftTitle: string
donorName: string     // <= 200
donorEmail: string    // > 0 && <= 200
paymentMethod: string
status: 'pending'      // FORÇADO; cliente nunca cria outro valor
createdAt: timestamp   // == request.time
```
Update (somente admin/servidor): promove `status` no ENUM `pending → processing → completed|failed`; `createdAt` imutável; `updatedAt == request.time` (opcional).

### Coleção `rsvps` (rules-alvo)
```
adults: list           // size() <= 20
childrenCount: int     // 0..20
dietary?: string       // <= 1000
message?: string       // <= 1000
familyId?: string      // preenchido por SPEC-RSVP-AUTH
guestId?: string       // preenchido por SPEC-RSVP-AUTH
confirmedBy?: string   // preenchido por SPEC-RSVP-AUTH
updatedBy?: string
updatedAt?: timestamp
createdAt: timestamp   // == request.time
```
`hasOnly` cobre o superset acima; `hasAll` exige `['adults','childrenCount','createdAt']`.

### `firebase.json` (novo)
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```
(`indexes` só se `firestore.indexes.json` existir/for criado; caso contrário omitir.)

### Helper de transição de status (rules)
```
function isValidStatusTransition(from, to) {
  return (from == 'pending'    && (to == 'processing' || to == 'completed' || to == 'failed')) ||
         (from == 'processing' && (to == 'completed' || to == 'failed'));
  // estados terminais (completed/failed) não transicionam
}
```

### URLs/payloads
N/A nesta spec (sem novas rotas/URLs; capability URL de RSVP é SPEC-RSVP-AUTH).

## 6. Arquivos afetados
- **Editar:** `firestore.rules` (contributions create+update, rsvps create, helpers `isValidStatusTransition`, uso de `isSignedIn()` conforme RT-9).
- **Criar:** `firebase.json` (raiz, alvo de rules).
- **Criar:** `firebase-applet-config.example.json` (placeholders versionados).
- **Editar:** `.gitignore` (adicionar `firebase-applet-config.json` + `!firebase-applet-config.example.json`).
- **Editar:** `lib/firestore-errors.ts` (remover PII de log/throw; mensagem amigável; gate de ambiente).
- **Remover:** `DRAFT_firestore.rules`.
- **Não tocar (intencional):** `lib/firebase.ts` (decisão de banco named vs default fica para PREFLIGHT humano), `app/presentes/checkout/page.tsx`, `app/presenca/page.tsx` (writers migram em CHECKOUT-HONESTY/RSVP-AUTH), `domain/types/index.ts` (alvo de ENUM apenas documentado).

## 7. Critérios de aceite
- [ ] Create de `contributions` com `status: 'completed'` (ou `'processing'`/`'failed'`) é REJEITADO pelas rules; só `status: 'pending'` passa.
- [ ] Create de `contributions` com `amount > 100000` ou `amount <= 0` é rejeitado.
- [ ] Create de `contributions` sem `donorEmail` (ou vazio) é rejeitado.
- [ ] Create de `contributions` com qualquer campo fora do conjunto permitido (RT-3) é rejeitado.
- [ ] Update de `contributions` por cliente não-admin é rejeitado; update por admin com transição válida do ENUM é aceito; transição inválida (ex.: `completed → pending`) é rejeitada.
- [ ] Create de `rsvps` com campo fora do `hasOnly` é rejeitado; com `adults.size() > 20`, `dietary`/`message` > 1000 chars é rejeitado; payload válido com `familyId`/`guestId` opcionais passa.
- [ ] `firebase.json` existe na raiz e `firebase deploy --only firestore:rules` resolve o alvo `firestore.rules` sem prompt de "qual arquivo".
- [ ] `DRAFT_firestore.rules` não existe mais no repo.
- [ ] `firebase-applet-config.json` está no `.gitignore`; `firebase-applet-config.example.json` versionado; `git check-ignore firebase-applet-config.json` retorna o caminho.
- [ ] `lib/firestore-errors.ts` não emite `email`/`providerInfo`/`tenantId` em `console.error` nem na mensagem do `Error` propagado; a UI recebe mensagem amigável genérica.
- [ ] (Se RT-9 ativado) creates sem `request.auth` são rejeitados; (se comentado) há TODO explícito referenciando SPEC-RSVP-AUTH.
- [ ] `npm run build` continua passando após a refatoração de `firestore-errors.ts`.

## 8. Validação e2e (e2e-validation-gate)
Acionar a skill `e2e-validation-gate` — esta spec toca rules (estado persistente de DB) e código de runtime.
1. **Baseline:** rodar o Firestore Emulator com as rules ATUAIS; executar suíte de testes de rules (`@firebase/rules-unit-testing`) cobrindo: contribuição `completed` anônima (hoje PASSA — provando o buraco), contribuição válida `pending`, RSVP com campo extra (hoje PASSA). Registrar resultados. `npm run build` verde.
2. **Mudança idempotente:** aplicar `firestore.rules` endurecidas no emulator; re-rodar a suíte. Esperado: contribuição `completed` anônima agora FALHA; `pending` válida PASSA; update admin de status PASSA; update cliente FALHA; RSVP com campo extra FALHA. Reaplicar as mesmas rules não muda nenhum resultado (idempotência).
3. **Validar propagação por camada:**
   - Rules layer: testes de unit-testing acima.
   - App layer: confirmar que `checkout/page.tsx` (writer atual, `status:'completed'`) agora recebe `permission-denied` — comportamento ESPERADO e documentado (writer migra em SPEC-CHECKOUT-HONESTY).
   - Error layer: provocar um erro de permissão e verificar no console/UI que NENHUM email/PII aparece (RT-14).
   - Config layer: `firebase deploy --only firestore:rules --dry-run` (ou `firebase emulators:exec`) usando `firebase.json` resolve o alvo sem ambiguidade.
4. **Reverter:** restaurar `firestore.rules` original (git stash/checkout) no emulator; confirmar que a suíte volta ao baseline (buraco reaberto).
5. **Revalidar:** reaplicar a versão endurecida; confirmar resultados do passo 2 de novo. Só então marcar concluído.
> Nota: os testes de emulator rodam no banco default do emulator. Em produção, o gate só é "verde de verdade" após o PREFLIGHT (seção 9) confirmar em qual banco (named vs default) as coleções/regras vivem.

## 9. Tarefas humanas / dependências externas
- **PREFLIGHT (bloqueante):** no Firebase Console, verificar qual banco — **named** (`ai-studio-remixmatheusisad-...`, declarado em `firebase-applet-config.json:6`) ou **default** (lido por `lib/firebase.ts:7`) — efetivamente contém as coleções (`contributions`, `rsvps`, `gifts`) e onde as rules estão provisionadas. SÓ ENTÃO decidir se `lib/firebase.ts` precisa passar `databaseId` (decisão travada #11). Deployar rules no banco ERRADO não protege nada.
- **Rotação/restrição de chave (bloqueante de segurança):** a `apiKey` web (`firebase-applet-config.json:4`) está commitada. No Google Cloud Console: restringir a key por referrer HTTP (domínio do site) e por API (somente as APIs Firebase necessárias) e/ou rotacionar. Usar a skill `secret-env-refresh` se a key migrar para env var.
- **Decisão de unidade de `amount`** (RT-13): confirmar reais vs centavos antes de SPEC-PAYMENTS-MP (o brick/QR do MP precisa casar).
- **Decisão sobre RT-9** (`isSignedIn()` ativo ou comentado): depende de Anonymous Auth estar implementado no boot. Coordenar com SPEC-RSVP-AUTH; registrar a escolha no PR.
- **Deploy das rules em produção:** após PREFLIGHT, rodar `firebase deploy --only firestore:rules` (requer login `firebase` CLI do usuário).

## 10. Riscos e mitigação
- **Risco: endurecer rules quebra os writers atuais (checkout grava `completed`; RSVP sem `familyId`).** Mitigação: é INTENCIONAL e documentado (decisão travada: endurecer rules ANTES dos writers). Sequenciar deploy junto/imediatamente antes de SPEC-CHECKOUT-HONESTY e SPEC-RSVP-AUTH para minimizar janela de fluxo quebrado; comunicar no PR que `pending` é o único create válido.
- **Risco: deploy no banco errado (named vs default).** Mitigação: PREFLIGHT bloqueante (seção 9) antes de qualquer deploy.
- **Risco: `git rm --cached`/`.gitignore` não remove a apiKey do histórico.** Mitigação: a defesa real é restrição/rotação da key no GCP (seção 9); o `.gitignore` só evita reincidência. Considerar `git filter-repo`/BFG apenas se a política exigir limpeza de histórico (fora do escopo desta spec).
- **Risco: `allow update: if isAdmin()` dá falsa sensação de que o cliente promove status.** Mitigação: a promoção real é via Admin SDK (webhook MP, SPEC-PAYMENTS-MP), que ignora rules; a regra de update existe para BLOQUEAR o cliente e documentar a invariante, não para habilitá-lo.
- **Risco: `hasOnly` em rsvps muito restrito derruba campos legítimos futuros.** Mitigação: o superset já inclui `familyId`/`guestId`/`confirmedBy`/`updatedBy`/`updatedAt` (RT-7) para evitar churn de rules entre specs; novos campos exigem update consciente das rules.
- **Risco: regressão silenciosa em `firestore-errors.ts` (perder diagnóstico).** Mitigação: manter `userId` (uid, não-PII) + `isAnonymous` + `operationType` + `path` no objeto estruturado; só remover o que é PII (`email`/`providerInfo`/`tenantId`).
