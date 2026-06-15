# SPEC-PAYMENTS-MP — Pagamento real Mercado Pago (Pix dinâmico + Checkout Bricks + webhook)
> Status: planejado · Fase original: 4 · Track: A · Depende de: SPEC-FIRESTORE-SECURITY, SPEC-CHECKOUT-HONESTY · Destrava: SPEC-GRAVATA-LEADERBOARD

## 1. Objetivo
Substituir a fachada de pagamento do checkout por uma integração real com o **Mercado Pago**: um backend server-side (Route Handlers Next em `app/api/**`) que cria pagamento **Pix dinâmico** (QR + copia-e-cola com valor/itens reais) e recebe **webhooks** para promover a contribuição de `pending` → `completed`/`failed` via **Firebase Admin SDK**. O cliente passa a consumir o QR real e, no cartão, o **Checkout Bricks** oficial do MP. Como ainda **não há credenciais MP** (decisão travada nº 2), esta spec entrega **scaffold com env placeholders** que degrada honestamente para `pending`/"modo simulado" e só liga de verdade quando as chaves chegarem. É a **última** etapa do fluxo de presentes (catálogo real primeiro).

## 2. Contexto atual (verificado em código)
- **Não existe `app/api/**`** no projeto (glob `app/api/**/*` → "No files found"). Não há nenhum backend server-side hoje.
- `app/presentes/checkout/page.tsx:24-56` — `handlePayment` apenas faz `addDoc(collection(db, 'contributions'), …)` com **`status: 'completed'` hardcoded** (`:43`) e finge um `setTimeout(…, 1500)` (`:48`). Não há SDK do MP, nem chamada HTTP a backend.
- `app/presentes/checkout/page.tsx:59` e `:166` — **copia-e-cola Pix hardcoded** (string BR Code fixa); `:159-161` — QR é placeholder textual `[QR Code Mock]`.
- `app/presentes/checkout/page.tsx:195-271` — formulário de **cartão é um form HTML comum** (campos `cc-number`/`cc-name`/`cc-exp`/`cc-csc`), sem tokenização; o texto `:253` já menciona "Mercado Pago" mas **não há integração**. (Esta spec assume que SPEC-CHECKOUT-HONESTY já desabilitou/sinalizou esse form como não-funcional.)
- `app/presentes/checkout/page.tsx:14-15` — origem do valor: query params `amount` (ex.: `"84,99"`, vírgula decimal) e `item` (título do presente). `:35` faz `parseFloat(amountStr.replace(',', '.'))`.
- `firestore.rules:50-61` — `contributions`: `create` exige `isValidContribution` que hoje aceita **`status in ['pending', 'completed']`** (`:53`) e `createdAt == request.time`; `read`/`list` só `isAdmin()`. **Cliente ainda consegue criar `completed`** — SPEC-FIRESTORE-SECURITY deve endurecer para `status == 'pending'` no create do cliente (ver §5).
- `lib/firebase.ts:6-8` — usa `getFirestore(app)` (banco **default**) e **ignora** `firestoreDatabaseId` de `firebase-applet-config.json:6` (`ai-studio-remixmatheusisad-…`). Preflight pendente (decisão travada nº 11).
- `firebase-applet-config.json:1-9` — config do cliente Firebase (projectId `gen-lang-client-0435917056`). **Não há service account** versionada (correto), nem `firebase-admin` em `package.json`.
- `package.json:11-29` — Next `15.1.0`, `firebase ^12.13.0`. **Sem** `firebase-admin`, **sem** `mercadopago`.
- `.env.example:1-9` — só `GEMINI_API_KEY` e `APP_URL`. **Nenhuma env de MP**.
- `next.config.ts:1-30` — sem `headers()`/CSP. O Brick do MP injeta script de `https://sdk.mercadopago.com` → impacto de `script-src` (cross-ref SPEC-MOTION-CSP).
- `docs/adr/0001-fluxos-checkout-separados.md:4,12` — **diz "PagSeguro"**; precisa ser atualizado para Mercado Pago (decisão travada nº 1), mantendo a decisão de **checkouts isolados** (presentes vs. gravata).
- `domain/types/index.ts:28-36` — `TieBid.status: 'pending' | 'paid'` (contrato da gravata, reutilizado depois por SPEC-GRAVATA-LEADERBOARD). `Gift`/`Contribution` ainda não modelam o ENUM completo de 4 estados.

## 3. Escopo
**Inclui:**
- Backend server-side em `app/api/**` (Route Handlers Next, runtime Node.js):
  - `POST /api/pix` — cria pagamento Pix dinâmico no MP e retorna `{ qrCodeBase64, qrCode (copia-e-cola), contributionId, status }`.
  - `POST /api/webhook/mercadopago` — valida assinatura (`x-signature`) e promove `contributions/{id}.status` para `completed`/`failed` via Admin SDK.
  - `GET /api/payments/:contributionId/status` — polling de status pelo cliente (read server-side via Admin SDK; cliente não lê `contributions` por causa das rules admin-only).
- Camada de domínio: módulo MP isolado (`lib/server/mercadopago.ts`) e Admin SDK isolado (`lib/server/firebaseAdmin.ts`), ambos **server-only**.
- Cliente: checkout consome `/api/pix` (QR real no lugar do mock); aba cartão renderiza o **Checkout Bricks** (Card Payment Brick) do MP; polling de status com `serverTimestamp`/estados de UI.
- ENUM de status de contribuição = `'pending' | 'processing' | 'completed' | 'failed'` (decisão travada nº 4): cliente só cria `pending`; servidor (webhook/Admin SDK) promove.
- Env placeholders via skill `secret-env-refresh`: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_PUBLIC_KEY` (+ `NEXT_PUBLIC_MP_PUBLIC_KEY` para o Brick), `FIREBASE_SERVICE_ACCOUNT_*`, `APP_URL`/`MP_WEBHOOK_URL`.
- **Modo simulado**: sem chaves MP, o backend NÃO chama o MP, cria a contribuição `pending`, retorna QR fictício marcado como simulado e loga `"[MP] modo simulado: credenciais ausentes"`. Degrada sem quebrar.
- Atualização do ADR-0001 (PagSeguro → Mercado Pago) mantendo checkouts isolados.

**Não inclui:**
- Checkout da **gravata** (lance) — fica em SPEC-GRAVATA-LEADERBOARD, que **reusa** o pipeline aqui criado.
- **App Check** (decisão travada nº 5: depois) e CSP/headers definitivos (SPEC-MOTION-CSP) — aqui só documentamos o requisito de `script-src` do Brick.
- Catálogo real de presentes e correção do seed client-side (SPEC-GIFTS-CATALOG) — apenas consumimos o valor/título já vindos do catálogo.
- Endurecimento das rules de `contributions` (pertence a SPEC-FIRESTORE-SECURITY); aqui apenas declaramos o contrato esperado e validamos compatibilidade.
- Reconciliação/estornos, split de pagamento, parcelamento >1x, e-mail transacional de recibo.
- Persistência de PII de cartão (nunca; o Brick tokeniza no browser).

## 4. Requisitos técnicos
**RT-1 — Isolar SDK do Mercado Pago (server-only).** Criar `lib/server/mercadopago.ts` exportando `createPixPayment({ amount, description, payerEmail, payerName, externalReference, notificationUrl })` e `verifyWebhookSignature({ xSignature, xRequestId, dataId })`. Usar o SDK `mercadopago` (Node) ou `fetch` direto à API `https://api.mercadopago.com/v1/payments`. O arquivo deve ter `import 'server-only'` e nunca ser importado por componente cliente. Ler `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` de `process.env` (nunca `NEXT_PUBLIC_*`).

**RT-2 — Isolar Firebase Admin SDK (server-only).** Criar `lib/server/firebaseAdmin.ts` que inicializa `firebase-admin` (singleton, evitando reinit em hot-reload) a partir de `FIREBASE_SERVICE_ACCOUNT_*` (ou `GOOGLE_APPLICATION_CREDENTIALS`). Exportar `adminDb`. **Preflight de databaseId (decisão nº 11):** o Admin SDK deve apontar para o MESMO banco que o cliente; enquanto não confirmado se é o `default` ou o nomeado (`firebase-applet-config.json:6`), parametrizar via `FIREBASE_DATABASE_ID` (vazio = default) — NÃO hardcodar.

**RT-3 — `POST /api/pix` (criar Pix dinâmico).** `app/api/pix/route.ts` (runtime `nodejs`). Recebe `{ amount, item, donorName, donorEmail, paymentMethod: 'pix' }`. Fluxo:
  1. Validar payload server-side (`amount` número > 0; strings com limite; e-mail válido). Rejeitar com `400` se inválido.
  2. Criar `contributions/{id}` via Admin SDK com `status: 'pending'`, `amount`, `giftTitle`, `donorName`, `donorEmail`, `paymentMethod: 'pix'`, `provider: 'mercadopago'`, `createdAt: FieldValue.serverTimestamp()`, `externalReference: id`.
  3. Se houver credenciais MP → chamar `createPixPayment(...)` com `notification_url = MP_WEBHOOK_URL`, `external_reference = id`. Persistir `mpPaymentId` no doc. Retornar `{ contributionId, qrCodeBase64, qrCode, status: 'pending', simulated: false }`.
  4. Se **não** houver credenciais → **modo simulado**: não chamar MP, logar `"[MP] modo simulado…"`, retornar `{ contributionId, qrCodeBase64: null, qrCode: null, status: 'pending', simulated: true }`.

**RT-4 — `POST /api/webhook/mercadopago` (promover status, server-only).** `app/api/webhook/mercadopago/route.ts` (runtime `nodejs`). Fluxo:
  1. Ler headers `x-signature` e `x-request-id` + `data.id` do corpo/query; chamar `verifyWebhookSignature(...)`. Assinatura inválida → `401` (sem efeito colateral).
  2. Buscar o pagamento no MP por `data.id` (`GET /v1/payments/:id`) — **fonte da verdade**, nunca confiar só no corpo do webhook.
  3. Mapear status MP → ENUM: `approved → completed`; `rejected|cancelled → failed`; `pending|in_process|authorized → processing`.
  4. Localizar a contribuição por `external_reference` (= `contributionId`) e atualizar `status`, `mpStatus`, `mpStatusDetail`, `paidAt`, `updatedAt: serverTimestamp()` via Admin SDK. **Idempotente:** se já estiver `completed`/`failed`, não regredir; ignorar reentregas.
  5. Sempre responder `200` rapidamente para webhooks reconhecidos/idempotentes (evitar retries infinitos do MP).

**RT-5 — `GET /api/payments/:contributionId/status` (polling).** `app/api/payments/[contributionId]/status/route.ts`. Lê o doc via Admin SDK e retorna `{ status }` (ENUM). Não expõe PII além do necessário. Cliente faz polling a cada ~3s até `completed`/`failed` ou timeout (~10 min, validade do Pix).

**RT-6 — Cliente: Pix real no checkout.** Em `app/presentes/checkout/page.tsx`, substituir o `handlePayment` Pix (`:24-56`) por chamada `fetch('/api/pix', …)`. Renderizar o QR real (`qrCodeBase64` → `<img>`/`next/image`) no lugar de `[QR Code Mock]` (`:159-161`) e o copia-e-cola retornado (`qrCode`) no lugar da string hardcoded (`:59`, `:166`). Botão "Já realizei o pagamento" deixa de marcar sucesso local; o sucesso passa a vir do **polling** (RT-5). Em `simulated: true`, exibir aviso honesto "modo simulado — pagamento não processado" e manter o estado `pending`.

**RT-7 — Cliente: Cartão via Checkout Bricks.** Substituir o form de cartão (`:195-271`) pelo **Card Payment Brick** do MP, carregando `https://sdk.mercadopago.com/js/v2` com `NEXT_PUBLIC_MP_PUBLIC_KEY`. O Brick tokeniza no browser; o `onSubmit` envia o `token` a um handler `POST /api/card` (análogo a `/api/pix`, RT-3/RT-4, criando `pending` e processando server-side). Sem `NEXT_PUBLIC_MP_PUBLIC_KEY` → manter o estado desabilitado/honesto herdado de SPEC-CHECKOUT-HONESTY (não renderizar Brick).

**RT-8 — ENUM de status em 4 estados.** Adotar `'pending' | 'processing' | 'completed' | 'failed'` para `contributions.status`. Atualizar `domain/types/index.ts` adicionando/expondo o tipo `ContributionStatus` e a interface `Contribution` (contrato único — decisão nº "domain/types/index.ts é a fonte da verdade"). Cliente NUNCA escreve `processing/completed/failed`.

**RT-9 — Env placeholders e degradação.** Adicionar a `.env.example`: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_PUBLIC_KEY`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_WEBHOOK_URL`, `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON) ou `FIREBASE_SERVICE_ACCOUNT_BASE64`, `FIREBASE_DATABASE_ID`. Todo acesso a essas envs deve checar presença e, ausente, ativar **modo simulado** (Pix) ou ocultar o Brick (cartão), sempre logando `"[MP] modo simulado…"`. **Nunca** quebrar o build nem a navegação por falta de chave.

**RT-10 — Atualizar ADR-0001.** Editar `docs/adr/0001-fluxos-checkout-separados.md` trocando "PagSeguro" (`:4`, `:12`) por "Mercado Pago" e registrando ADR de superação (ou nota) que cristaliza a decisão travada nº 1; manter a decisão de **checkouts isolados** (presentes vs. gravata).

**RT-11 — Segurança server-side.** Nenhum segredo MP/Admin em código cliente (`NEXT_PUBLIC_*` só para `MP_PUBLIC_KEY` do Brick). `.gitignore` deve cobrir `.env*` e qualquer `serviceAccount*.json`. Handlers de API validam Content-Type e tamanho do corpo. Webhook é a **única** rota que promove status.

## 5. Modelo de dados / contratos

**Coleção `contributions/{contribId}` (estado-alvo):**
```ts
// domain/types/index.ts (adicionar)
export type ContributionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Contribution {
  id: string;
  amount: number;            // BRL, > 0
  giftTitle: string;         // origem: query "item"
  donorName: string;
  donorEmail: string;
  paymentMethod: 'pix' | 'credit_card';
  provider: 'mercadopago';
  status: ContributionStatus; // cliente cria 'pending'; servidor promove
  externalReference: string;  // == contribId (idempotência do webhook)
  mpPaymentId?: string;
  mpStatus?: string;          // status bruto do MP (auditoria)
  mpStatusDetail?: string;
  createdAt: Timestamp;       // serverTimestamp()
  updatedAt?: Timestamp;
  paidAt?: Timestamp;
  // futuro (SPEC-RSVP-AUTH): familyId?, guestId?, createdBy(uid)
}
```

**Contrato de rules esperado (definido em SPEC-FIRESTORE-SECURITY; esta spec depende dele):**
`firestore.rules:50-55` hoje aceita `status in ['pending', 'completed']`. **Alvo:** o `create` do cliente deve exigir **`incoming().status == 'pending'`** (não mais `completed`); transições para `processing/completed/failed` só pelo **Admin SDK** (que ignora rules). Read/list permanecem `isAdmin()` (por isso o cliente precisa de `/api/payments/:id/status`). O backend desta spec assume esse endurecimento já aplicado; se rodar antes, o create direto a `completed` ainda passaria — daí a ordem de dependência (endurecer rules ANTES).

**Payloads de API:**
```http
POST /api/pix
→ { amount: number, item: string, donorName: string, donorEmail: string, paymentMethod: "pix" }
← 200 { contributionId, qrCodeBase64, qrCode, status: "pending", simulated: boolean }
← 400 { error }

POST /api/webhook/mercadopago     (chamado pelo MP)
headers: x-signature, x-request-id
body: { type: "payment", data: { id } }
← 200 (idempotente)  |  401 (assinatura inválida)

GET /api/payments/{contributionId}/status
← 200 { status: ContributionStatus }
```

**Mapa de status MP → ENUM:** `approved→completed` · `rejected|cancelled→failed` · `pending|in_process|authorized→processing` · (criação inicial) `→pending`.

**Variáveis de ambiente (placeholders):**
| Var | Escopo | Uso |
|---|---|---|
| `MP_ACCESS_TOKEN` | server | Auth na API MP (criar pagamento / consultar) |
| `MP_WEBHOOK_SECRET` | server | Validar `x-signature` do webhook |
| `MP_PUBLIC_KEY` | server | Referência/diagnóstico |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | client | Inicializar Checkout Bricks no browser |
| `MP_WEBHOOK_URL` | server | `notification_url` enviado ao MP |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | server | Init do Admin SDK |
| `FIREBASE_DATABASE_ID` | server | Banco (vazio=default; ou o nomeado — ver preflight) |

## 6. Arquivos afetados
**Criar:**
- `app/api/pix/route.ts` (RT-3)
- `app/api/card/route.ts` (RT-7; análogo a `/api/pix`)
- `app/api/webhook/mercadopago/route.ts` (RT-4)
- `app/api/payments/[contributionId]/status/route.ts` (RT-5)
- `lib/server/mercadopago.ts` (RT-1)
- `lib/server/firebaseAdmin.ts` (RT-2)

**Editar:**
- `app/presentes/checkout/page.tsx` — Pix real (RT-6), Brick de cartão (RT-7), polling de status; remover mock `:59`/`:159-161`/`:166` e o `status:'completed'` local `:43`.
- `domain/types/index.ts` — `ContributionStatus` + `Contribution` (RT-8).
- `.env.example` — novas envs (RT-9).
- `docs/adr/0001-fluxos-checkout-separados.md` — PagSeguro → Mercado Pago (RT-10).
- `package.json` — adicionar deps `mercadopago` e `firebase-admin`.
- `.gitignore` — garantir `.env*` e `serviceAccount*.json` (RT-11), se ainda não cobertos.
- `next.config.ts` — (cross-ref SPEC-MOTION-CSP) permitir `script-src https://sdk.mercadopago.com` quando CSP existir; não obrigatório nesta spec.

**Remover:** nada (substituições in-place no checkout).

## 7. Critérios de aceite
- [ ] Existe `app/api/pix`, `app/api/webhook/mercadopago` e `app/api/payments/[contributionId]/status` com runtime Node.js.
- [ ] **Com chaves de sandbox**, um Pix de teste percorre `create → webhook → completed` e o status aparece como `completed` para o admin (Firestore/console).
- [ ] **Sem chaves**, o checkout degrada: cria `contributions` `pending`, mostra "modo simulado", loga `"[MP] modo simulado…"`, e **não quebra** build nem navegação.
- [ ] Cliente NUNCA grava `processing/completed/failed`; apenas o webhook/Admin SDK promove (verificável: tentativa de create cliente com `status != 'pending'` é negada pelas rules endurecidas).
- [ ] QR real (`qrCodeBase64`/copia-e-cola) substitui `[QR Code Mock]` e a string hardcoded; nada de `setTimeout(1500)` fingindo sucesso.
- [ ] Aba cartão usa Checkout Bricks com `NEXT_PUBLIC_MP_PUBLIC_KEY`; sem a chave, permanece honestamente desabilitada.
- [ ] Webhook é **idempotente** (reentrega não regride status) e rejeita assinatura inválida com `401`.
- [ ] `contributions.status` segue o ENUM de 4 estados em `domain/types/index.ts`.
- [ ] ADR-0001 não menciona mais "PagSeguro"; cita "Mercado Pago" e mantém checkouts isolados.
- [ ] Nenhum segredo server vazado em `NEXT_PUBLIC_*` (exceto `MP_PUBLIC_KEY` do Brick); `.env*`/service account no `.gitignore`.
- [ ] `npm run build` passa.

## 8. Validação e2e (e2e-validation-gate)
Pipeline crítico: `checkout (cliente) → POST /api/pix (Admin SDK cria 'pending') → MP cria Pix → MP envia webhook → POST /api/webhook/mercadopago (Admin SDK promove) → GET /api/payments/:id/status (cliente faz polling) → UI sucesso`.

1. **Baseline:** `npm run build` verde sem as novas rotas; registrar que o checkout atual marca `completed` localmente (comportamento-fachada a substituir).
2. **Mudança idempotente (sandbox):** com `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` de sandbox:
   - `POST /api/pix` com valor de teste → confirmar doc `pending` no Firestore + retorno com `qrCodeBase64`.
   - Pagar o Pix no ambiente de teste do MP **ou** simular o webhook com payload assinado válido → confirmar promoção a `completed` (e doc `mpPaymentId`/`paidAt`).
   - Reenviar o MESMO webhook → status permanece `completed` (idempotência), nada duplica.
   - `GET /api/payments/:id/status` → `completed`.
3. **Validar propagação por camada:** (a) API responde 200; (b) Firestore tem o doc no status correto; (c) console admin lista a contribuição; (d) UI do cliente sai de "aguardando" para "sucesso" via polling.
4. **Caminho de falha:** webhook com `x-signature` inválida → `401`, status NÃO muda. Pagamento `rejected` → `failed` na UI.
5. **Modo simulado:** remover envs MP → `POST /api/pix` cria `pending`, retorna `simulated: true`, loga aviso; UI mostra "modo simulado"; nada promove a `completed`.
6. **Reverter:** restaurar baseline (remover/feature-flag das rotas) e revalidar que o app sobe sem as envs e sem quebrar.
7. **Revalidar:** `npm run build` verde no estado final scaffolded (modo simulado), sem credenciais.

## 9. Tarefas humanas / dependências externas
- **Obter credenciais Mercado Pago** (conta + aplicação): `Access Token` e `Public Key` de **sandbox** e de **produção**, e o **Webhook Secret**. Inserir via skill `secret-env-refresh` (NÃO colar no chat): `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_PUBLIC_KEY`, `NEXT_PUBLIC_MP_PUBLIC_KEY`.
- **Cadastrar o webhook** no painel MP apontando para `MP_WEBHOOK_URL` (URL pública de produção/preview do app, ex.: `https://<APP_URL>/api/webhook/mercadopago`).
- **Service account Firebase** (Admin SDK): gerar no console, fornecer via `FIREBASE_SERVICE_ACCOUNT_BASE64` por `secret-env-refresh`; nunca commitar o JSON.
- **Preflight de databaseId (decisão nº 11):** confirmar no Firebase Console se as coleções/rules estão no banco `default` ou no nomeado (`firebase-applet-config.json:6`) e definir `FIREBASE_DATABASE_ID` conforme — antes de o webhook escrever.
- **Dependência de specs:** SPEC-FIRESTORE-SECURITY (rules endurecidas: create cliente só `pending`) e SPEC-CHECKOUT-HONESTY (mock removido / cartão sinalizado) devem estar concluídas.

## 10. Riscos e mitigação
- **Cliente promovendo status (fraude):** se rodar antes de SPEC-FIRESTORE-SECURITY, o cliente ainda cria `completed` (`firestore.rules:53`). **Mitigação:** respeitar a ordem de dependência; backend nunca confia no status vindo do cliente; só o webhook promove.
- **Webhook forjado:** **Mitigação:** validar `x-signature` (RT-4) e reconsultar o pagamento no MP (`GET /v1/payments/:id`) como fonte da verdade; nunca promover só com o corpo do webhook.
- **Reentrega/duplicação de webhook:** **Mitigação:** idempotência por `external_reference` (= `contributionId`) e guarda de não-regressão de status.
- **Banco errado (default vs. nomeado):** Admin SDK escrevendo em banco diferente do cliente faz o status "sumir" para o admin. **Mitigação:** preflight nº 11 + `FIREBASE_DATABASE_ID` parametrizado.
- **Segredos vazando para o browser:** **Mitigação:** `import 'server-only'` nos módulos `lib/server/*`, segredos fora de `NEXT_PUBLIC_*`, `.gitignore` para `.env*`/service account.
- **CSP bloqueando o Brick:** quando SPEC-MOTION-CSP adicionar CSP, `script-src` precisa liberar `https://sdk.mercadopago.com`. **Mitigação:** documentar o requisito (RT-7) e coordenar com SPEC-MOTION-CSP.
- **Expiração do Pix vs. polling:** Pix dinâmico expira (~10–30 min). **Mitigação:** timeout de polling alinhado à validade + estado de UI "expirado, gerar novo".
- **Ausência de credenciais bloqueia entrega:** **Mitigação central:** modo simulado (RT-9) entrega scaffold funcional e honesto agora; ligar é trocar env + cadastrar webhook.
