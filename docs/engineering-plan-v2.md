# Plano de Engenharia v2 — Site Isadora & Matheus

> ⚠️ **STATUS DESATUALIZADO (revisado em 2026-06-16).** O "Sumário executivo" abaixo descreve o
> **núcleo de fachada original** que **já foi corrigido**: o pagamento grava `pending` (não `completed`),
> o RSVP autentica de verdade (sem nome hardcoded), `firestore.rules` está endurecido (`test:rules:hardened`
> 15/15 PASS), a Gravata **tem página** (não é mais 404), e a intro **não usa** `eval()`/CDN. Os status
> "execução pendente" valem só para **SPEC-PAYMENTS-MP** e **SPEC-GRAVATA-LEADERBOARD** (scaffold, faltam
> credenciais/infra) e para as **tarefas humanas** (PREFLIGHT, planilhas, deploy).
> **Fonte de verdade:** `C:\Users\CARRE\.claude\plans\wortree-atualizada-verifique-o-squishy-eich.md`
> e os cabeçalhos de status corrigidos em cada `docs/specs/SPEC-*.md`.
>
> Status: **aprovado como plano (execução pendente)** · Data: 2026-06-15
> Origem: verificação multi-agente do código atual + `/grill-me`. Supera e detalha o [engineering-backlog-plan.md](engineering-backlog-plan.md) (6 fases → **8 SPECs** + sprints).
> Trilha de engenharia. A trilha de design vive no [DESIGN.md](../DESIGN.md) e no [design-upgrade-agreement.html](design-upgrade-agreement.html).
> Acordo `/grill-me` deste ciclo: [engineering-agreement.html](engineering-agreement.html).

## Sumário executivo

O site é um protótipo visual de altíssima fidelidade com o **núcleo transacional de fachada**: pagamento grava `completed` sem cobrar, RSVP não autentica nada (`code` ignorado, nome `'Rafael'` hardcoded), `firestore.rules` deixam qualquer anônimo gravar contribuição `completed` de valor arbitrário, a Gravata do Noivo é 404, e a intro usa `eval()` de CDN. Este plano transforma esse núcleo em algo **real e honesto**, dividido em **8 SPECs** (`docs/specs/`) organizadas em **2 tracks paralelos** e **6 sprints**, com cada entrega que toca runtime/DB passando pelo `e2e-validation-gate`. Entregável deste ciclo: **só o plano** (documentação); a implementação vem depois.

## Decisões travadas (atualizado via /grill-me — 2026-06-15)

| # | Tema | Decisão |
|---|---|---|
| 1 | Provedor de pagamento | **Mercado Pago** (Pix dinâmico + webhooks). Executado **por último** no fluxo de presentes: primeiro o **catálogo real**, depois o pagamento. ADR-0001 (hoje PagSeguro) será atualizada. |
| 2 | Credenciais MP | Indisponíveis → **scaffold com env placeholders**; fluxo fica honestamente `pending` / "modo simulado" até as chaves chegarem (via `secret-env-refresh`). |
| 3 | GuestGate | **SOFT** — personaliza e carimba identidade, **não bloqueia** navegação anônima. |
| 4 | Status de contribuição/lance | **ENUM** `pending \| processing \| completed \| failed`. Cliente só cria `pending`; **só o servidor** (webhook + Admin SDK) promove. |
| 5 | Autenticação | **Anonymous Auth agora** (uid carimba writes + habilita `isSignedIn()`); **App Check depois** (sprint posterior). |
| 6 | Modelo de auth do convidado | **Capability URL** (magic link) por **WhatsApp pessoal**. O segredo é o **código de alta entropia** na URL (8–10 chars, ~40+ bits, inadivinhável). |
| 7 | Granularidade do código | **Um código por FAMÍLIA + sub-identificação**. Base `/rsvp/<código>`; sem dica → "quem é você?" (roster); link individual opcional `/rsvp/<código>?c=<guestId>` pré-seleciona (conveniência, não barreira). |
| 8 | RSVP | Por **família** — 1 doc em `rsvps` por `familyId`. Um membro confirma por todos; **qualquer membro edita** (`updatedBy`); reentrada de já-confirmado → tela "já confirmado" (**resumo + [Editar] + [Ir para Home/Presentes]**). |
| 9 | Ferramenta de seed | **Script admin** (não há painel): gera código + monta **mensagem de WhatsApp pronta** por família. Disparo automático via WhatsApp Cloud API = SPEC futura **opcional**. |
| 10 | Planilhas | Não existem ainda → o plano define **Modelo de Planilha de Convidados** e **Modelo de Planilha de Presentes** como **artefatos + tarefas humanas**. |
| 11 | Banco Firestore (named vs default) | `lib/firebase.ts:7` usa `getFirestore(app)` (default) e ignora `firestoreDatabaseId`. **Não mudar às cegas** → **PREFLIGHT**: verificar no Console qual banco tem coleções/regras antes de tocar. |
| 12 | Seed de `gifts` | **Parar o seed client-side** (colide com rules admin-only + re-semeia destrutivamente). Seed = script admin; cliente só lê. |
| 13 | Entregável deste ciclo | **Só o plano** (documentação). Sem implementação agora. |

## Princípio de sequência & tracks

Ordenação **seguro → arriscado**, respeitando dependências. Dois tracks paralelos (lógicos — com 1 dev, o Track B encaixa nos sprints iniciais e o resto é sequencial):

- **Track A — Segurança & Transação** (sequencial): `FIRESTORE-SECURITY` → (`GIFTS-CATALOG` + `CHECKOUT-HONESTY`) → `RSVP-AUTH` → `PAYMENTS-MP` → `GRAVATA-LEADERBOARD`.
- **Track B — Higiene & Experiência** (independente): `HYGIENE` (primeiro) → `MOTION-CSP` (a qualquer momento).
- **Regra de ouro:** endurecer rules **antes** de ajustar writers; tudo que toca runtime/DB passa pelo `e2e-validation-gate`.

## Índice de SPECs

| SPEC | Fase | Track | Depende de | Destrava | Doc |
|---|---|---|---|---|---|
| **SPEC-HYGIENE** | 0 | B | — | build limpo | [↗](specs/SPEC-HYGIENE.md) |
| **SPEC-FIRESTORE-SECURITY** | 1 | A | — | todos os writers | [↗](specs/SPEC-FIRESTORE-SECURITY.md) |
| **SPEC-GIFTS-CATALOG** | 2a | A | FIRESTORE-SECURITY | CHECKOUT, PAYMENTS | [↗](specs/SPEC-GIFTS-CATALOG.md) |
| **SPEC-CHECKOUT-HONESTY** | 2b | A | FIRESTORE-SECURITY | PAYMENTS | [↗](specs/SPEC-CHECKOUT-HONESTY.md) |
| **SPEC-RSVP-AUTH** | 3 | A | FIRESTORE-SECURITY | GRAVATA, atribuição família | [↗](specs/SPEC-RSVP-AUTH.md) |
| **SPEC-PAYMENTS-MP** | 4 | A | FIRESTORE-SECURITY, CHECKOUT-HONESTY | GRAVATA | [↗](specs/SPEC-PAYMENTS-MP.md) |
| **SPEC-GRAVATA-LEADERBOARD** | 5 | A | PAYMENTS-MP, RSVP-AUTH | mata 404 da Home | [↗](specs/SPEC-GRAVATA-LEADERBOARD.md) |
| **SPEC-MOTION-CSP** | 6 | B | — | CSP sem unsafe-eval | [↗](specs/SPEC-MOTION-CSP.md) |
| *SPEC-WHATSAPP-DISPATCH* | futura | — | RSVP-AUTH | disparo em lote | *(opcional, não escrita)* |

## Mapa de dependências

```
HYGIENE ───────────────► (build limpo, base de todas)
MOTION-CSP ────────────► (independente; paralelo)

FIRESTORE-SECURITY
   ├──► GIFTS-CATALOG ───┐
   ├──► CHECKOUT-HONESTY ─┼──► PAYMENTS-MP ──┐
   └──► RSVP-AUTH ────────┘                  ├──► GRAVATA-LEADERBOARD
        └──────────────── (familyId/guestId) ┘
```

`domain/types/index.ts` (Family / Guest / Gift / TieBid) é o **contrato único de schema** — estendido, nunca recriado. Hoje é órfão (zero imports); deixa de ser a partir da SPEC-RSVP-AUTH/GIFTS-CATALOG.

## Divisão em Sprints

### Sprint 0 — Fundação & Preflight *(seguro, paralelo)*
- **SPEC-HYGIENE** (Track B): corrige o **bug de render** `--primary-fixed-dim` (usado em `tailwind.config.ts:18` + `eventos/page.tsx:244`, nunca definido), remove código morto/deps/fontes, conserta typos e identidade do projeto.
- **Setup do Firebase Emulator Suite** como harness de verificação para todos os sprints seguintes.
- **[Humano] PREFLIGHT do banco** (named vs default) no Firebase Console.
- **[Humano] Iniciar** o preenchimento das planilhas (convidados e presentes).
- *Saída:* `npm run build` verde, harness pronto, banco confirmado.

### Sprint 1 — Segurança de dados + Motion *(paralelo)*
- **Track A — SPEC-FIRESTORE-SECURITY:** endurece `firestore.rules` (força `status=='pending'`, teto de `amount`, `hasOnly`, exige `donorEmail`, `update` só admin, caps de RSVP), cria `firebase.json`, remove `DRAFT_firestore.rules`, gitignora a config, para de logar PII, alinha o ENUM, prepara `isSignedIn()`.
- **Track B — SPEC-MOTION-CSP:** troca `eval()` por deps `three`/`threejs-components` versionadas, consolida o SVG duplicado, adiciona CSP sem `unsafe-eval`, implementa `prefers-reduced-motion`.
- **[Humano] Rotacionar/restringir** a `apiKey` web exposta no Google Cloud Console.
- *Saída:* banco seguro, sem `eval`, CSP ativa. ⚠️ `e2e-validation-gate` + testes de rules no emulador.

### Sprint 2 — Catálogo de presentes real & honesto *(Track A · depende S1)*
- **SPEC-GIFTS-CATALOG:** estende `Gift` com categoria, monta o catálogo categorizado, **para o seed client-side** (cliente só lê), cria o script admin `seed:gifts`, conserta o spinner/seed destrutivo.
- **SPEC-CHECKOUT-HONESTY:** grava `status:'pending'`, copy de sucesso honesta, cartão "em breve", remove o card fake "Cotas de Lua de Mel — Finalizada" de `/presenca`, atualiza ADR-0001.
- **[Humano] Preencher** a Planilha de Presentes (alimenta `seed:gifts`).
- *Saída:* página de presentes real e honesta — **sem pagamento ainda**.

### Sprint 3 — RSVP-First real *(Track A · depende S1)*
- **SPEC-RSVP-AUTH:** capability URL via WhatsApp, Anonymous Auth, GuestGate soft, lookup por `codes/{code}` (sem enumeração), roster real + dica `?c=`, RSVP por família (1 doc/`familyId`, reentrada com resumo+editar), carimbo de `familyId/guestId`, script admin `seed:families`.
- **[Humano] Preencher** a Planilha de Convidados → rodar `seed:families` → **distribuir os links por WhatsApp**.
- *Saída:* RSVP real autenticado por código, identidade carimbada em `rsvps` e `contributions`.

### Sprint 4 — Pagamento Mercado Pago *(Track A · depende S2 + S1 · bloqueio: credenciais)*
- **SPEC-PAYMENTS-MP:** `POST /api/pix` (Pix dinâmico real), `POST /api/webhook/mercadopago` (assinatura verificada; Admin SDK promove `pending → completed/failed`), brick de cartão, QR real, env placeholders com degradação para "modo simulado".
- **[Humano] Obter e inserir** as credenciais MP (sandbox + prod) via `secret-env-refresh`.
- *Saída:* Pix de sandbox percorre create → webhook → `completed`; sem chaves, degrada para `pending` sem quebrar.

### Sprint 5 — Gravata do Noivo *(Track A · depende S4 + S3)*
- **SPEC-GRAVATA-LEADERBOARD:** cria `/presentes/gravata` (leilão + checkout isolado reusando o pipeline MP), coleção `tieBids`, `TieLeaderboard` lendo dados **reais** agregados por `familyId` (ranking duplo individual+família, ADR-0004), mata o **404** do botão "Dar meu Lance".
- *Saída:* feature central completa; leaderboard real.

### Futuro / opcional
- **SPEC-WHATSAPP-DISPATCH:** disparo automático dos links via WhatsApp Cloud API (exige número aprovado na Meta). Escopo separado.

## Tarefas humanas (consolidadas)

| Quando | Tarefa | Bloqueia |
|---|---|---|
| Sprint 0 | **PREFLIGHT:** confirmar no Firebase Console qual banco (named vs default) tem coleções/regras | Toda mudança de rules/writer |
| Sprint 0→ | Preencher **Modelo de Planilha de Presentes** (nome, descrição, foto, categoria, preço, cotas) | `seed:gifts` (Sprint 2) |
| Sprint 0→ | Preencher **Modelo de Planilha de Convidados** (`id_familia`, `nome_familia`, `telefone_whatsapp`, integrantes, `é_criança?`, observações) | `seed:families` (Sprint 3) |
| Sprint 1 | **Rotacionar/restringir** a `apiKey` web no Google Cloud Console (já está no histórico do git) | — |
| Sprint 2/3 | Gerar **service account** do Firebase Admin SDK (chave JSON local, fora do git) | Scripts de seed |
| Sprint 3 | Decidir entropia final do código + **host de produção** dos links; **distribuir links por WhatsApp** | Convites |
| Sprint 4 | **Obter + inserir credenciais Mercado Pago** (sandbox/prod) via `secret-env-refresh` | SPEC-PAYMENTS-MP |

## Estratégia de Verificação

O **localhost é o palco principal**, com 3 reforços. Cada tipo de sprint usa as camadas que precisa:

| Camada | Para quê | Ferramenta | Toca produção? |
|---|---|---|---|
| **1. Build + localhost** | UI, copy, render, CSP, motion | `npm run build` + `npm run dev` (`:3000`) | Não |
| **2. Emulador Firebase** | Rules, Firestore, Anonymous Auth, seeds | `firebase emulators:start` + `@firebase/rules-unit-testing` | **Não** (banco fake local) |
| **3. Sandbox + túnel/preview** | Pix real (create→webhook→completed) | MP **sandbox** + `ngrok`/`cloudflared` **ou** preview deploy | Não (sandbox) |
| **4. Console (nuvem)** | Preflight named-DB, rotação de `apiKey` | Firebase / Google Cloud Console | Sim (config/leitura) |

**Por sprint:**
- **HYGIENE / MOTION-CSP** → camada 1. CSP: DevTools → Network/headers (sem `unsafe-eval`); motion: DevTools → *Emulate `prefers-reduced-motion: reduce`*.
- **FIRESTORE-SECURITY** → camada 2 **obrigatória**: testes de rules no emulador (ex.: "anônimo não grava `completed`"). Nunca publicar rules sem passar no emulador. Preflight = camada 4.
- **GIFTS-CATALOG / CHECKOUT-HONESTY / RSVP-AUTH** → camadas 1+2: localhost apontando para o emulador, rodar seeds, executar o fluxo, conferir docs gravados, **reverter** (`e2e-validation-gate`).
- **PAYMENTS-MP / GRAVATA-LEADERBOARD** → camadas 1+2+3: o webhook exige URL pública → **túnel ou preview deploy**; testar com chaves **sandbox**.

> **Recomendação:** montar o Emulator Suite no Sprint 0/1 para que todo sprint posterior tenha um banco descartável e seguro.

## Riscos transversais

- **Banco nomeado vs default** (`getFirestore(app)` ignora `firestoreDatabaseId`): mudança errada fala com o banco errado e quebra tudo → **PREFLIGHT antes** (decisão #11).
- **Ordem rules → writers:** endurecer `firestore.rules` **antes** de ajustar checkout/RSVP, senão derruba produção; mas os writers precisam migrar logo em seguida (cliente para de gravar `completed`).
- **Capability URL encaminhada:** risco baixo no contexto (público conhecido); mitigado por revisão admin + App Check futuro.
- **`rsvps` legados** sem `familyId` (criados por `addDoc`): tratar como descartáveis (protótipo) ou migração one-off.
- **Re-seed regenerando códigos:** idempotência por `id_familia`; nunca regenerar código de família já semeada (invalidaria links enviados).

## Artefatos a produzir

- `docs/templates/planilha-convidados.csv` — Modelo de Planilha de Convidados.
- `docs/templates/planilha-presentes.csv` — Modelo de Planilha de Presentes.
- `scripts/seed-families.ts`, `scripts/seed-gifts.ts` — seeds admin (Firebase Admin SDK).
- `firebase.json` — alvo de deploy de rules.
- `app/api/pix/route.ts`, `app/api/webhook/mercadopago/route.ts`, `app/api/payments/[id]/status/route.ts` — backend MP.
- Atualização de `ADR-0001` (PagSeguro → Mercado Pago) e confirmação de `ADR-0004`.
