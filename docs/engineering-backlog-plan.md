# Plano de Engenharia — Backlog do Site Isadora & Matheus

> Status: **aprovado como plano (execução pendente)** · Data: 2026-06-13
> Origem: análise crítica multi-agente + `/grill-me`. Complementa o [DESIGN.md](../DESIGN.md) (trilha de design) — este documento é a **trilha de engenharia**.

## Decisões travadas
| Tema | Decisão |
|---|---|
| Provedor de pagamento | **Mercado Pago** (Pix dinâmico + webhooks). ADR-0001 será atualizada (hoje diz PagSeguro). |
| Credenciais | **Ainda não disponíveis** → construir scaffold com env placeholders; contribuições ficam honestamente `pending` até plugar as chaves (via skill `secret-env-refresh`). |
| `eval()` de CDN | **Substituir por dependência npm versionada** (`three` + `threejs-components`); consolidar `CathedralIntro`/`IntroAnimation`. |
| Ordenação | Seguro→arriscado; toda fase que toca runtime/DB passa pelo `e2e-validation-gate` antes de fechar. |

## Princípio de sequência
Fases **0→2** são seguras e sem credencial (executáveis a qualquer momento). **3→5** dependem de decisões de modelo de dados e/ou das chaves do Mercado Pago. **6** é técnica/independente. Dependências: `2⇐1`, `4⇐1`, `5⇐4`, `5⇐3`.

---

## FASE 0 — Higiene & quick wins
*Risco nulo · sem dependências · sem impacto de runtime relevante*

| Tarefa | Arquivo(s) | Aceite |
|---|---|---|
| Deletar código morto (confirmar zero-import antes) | `components/CardTeaser.tsx`, `components/NavigationThemeToggle.tsx`, `components/ThemeToggle.tsx` | `npm run build` ok; nenhum import quebrado |
| Remover deps órfãs | `package.json` (`@google/genai`, `@hookform/resolvers`) | build ok; lockfile atualizado |
| Remover fontes mortas | `app/layout.tsx` (Newsreader, Zeyada) | nenhuma `var(--font-newsreader/zeyada)` restante |
| Remover CSS morto | `app/globals.css` (`.liquid-glass`) | zero consumidores |
| Definir token fantasma | `app/globals.css` (`--primary-fixed-dim` light/dark) | timeline de eventos visível |
| Corrigir typos | `app/presentes/page.tsx` (`descatologados`→"restantes"; `Refechar`→"Fechar modal") | texto correto |
| Corrigir identidade do projeto | `README.md`, `package.json` (`name`) | sem resíduo "AI Studio" |

**Não-objetivo:** aplicar tokens novos do DESIGN.md (isso é a trilha de design, ciclo separado).

---

## FASE 1 — Segurança de dados (rules + config)
*Alto valor · sem credencial · ⚠️ altera regras de segurança — validar no emulador/console*

1. **Endurecer `firestore.rules`:**
   - `contributions`: forçar `status == 'pending'` no `create`; teto `amount <= 100000`; `keys().hasOnly([...])`; exigir `donorEmail`; `allow update: if isAdmin()` (só admin promove a `completed`).
   - `rsvps`: `keys().hasOnly([...])`; `adults.size() <= 20`; caps de `dietary`/`message` (≤ 1000).
   - `gifts`: alinhar `isValidGift` ao shape real semeado **ou** (preferido) parar de semear pelo cliente (ver item 5).
2. **Remover `DRAFT_firestore.rules`** + criar `firebase.json` declarando `firestore.rules` como alvo de deploy.
3. **`.gitignore`** → adicionar `firebase-applet-config.json`. ⚠️ A `apiKey` já está no histórico do git → **rotacionar e restringir** a chave no Google Cloud Console (restrição por domínio/API). *(Nota: apiKey web do Firebase não é segredo per se, mas deve ser restrita.)*
4. **`lib/firestore-errors.ts`:** parar de serializar PII (email/uid) no `console`/`throw`; retornar objeto de erro estruturado + mensagem amigável para a UI consumir.
5. **Parar o seeding client-side de `gifts`** (`app/presentes/page.tsx`): colide com as rules (write=admin) e dispara re-seed destrutivo. Seed passa a ser script admin único; cliente só lê.

**Aceite:** convidado anônimo NÃO consegue gravar `contribution` com `status:'completed'`; RSVP anônimo continua funcionando; nenhum PII em log; um só arquivo de rules versionado e declarado.

---

## FASE 2 — Checkout & RSVP honestos
*Depende da FASE 1*

- **`app/presentes/checkout/page.tsx`:**
  - Gravar `status:'pending'` (verdade até o webhook confirmar).
  - Trocar a tela que afirma "confirmada com sucesso" por: *"Recebemos sua intenção de presente — confirmamos assim que o pagamento for processado."*
  - Corrigir texto do provedor para **Mercado Pago** (coerente com a decisão).
  - Form de cartão (campos sem `state`, nunca lidos) → desabilitar/rotular "em breve" até a FASE 4.
- **`app/presenca/page.tsx`:** remover o card fake hardcoded *"Cotas de Lua de Mel — Finalizada"* (mente sobre presente). Sucesso reflete só os dados reais do RSVP.
- **`app/presentes/page.tsx`:** corrigir seed destrutivo/spinner travado — garantir `setIsLoading(false)` em todos os ramos; não re-semear por divergência de contagem.

**Aceite:** nenhuma tela afirma pagamento/presente que não aconteceu; spinner nunca trava; e2e gate (RSVP→Firestore→painel admin) verde.

---

## FASE 3 — RSVP-First real (auth + guards)
*Decisão de modelo de dados · recomendado Anonymous Auth + App Check*

- Popular `families`/`guests` (ou `codes`) com códigos de convite — usar o `domain/types/index.ts` (hoje órfão).
- `app/rsvp/[code]/page.tsx`: `const { code } = await params` (Next 15), lookup no Firestore, gravar contexto do convidado (zustand + `sessionStorage`), tratar reentrada de quem já confirmou.
- `GuestGate` (guard client-side, já que tudo é `'use client'`) — decidir rigor: **soft** (personaliza + grava identidade) vs **hard** (bloqueia `/presentes` sem código). Recomendado começar soft.
- Gravar `familyId/guestId` em `rsvps` e `contributions` → destrava a agregação por família (ADR-0004).
- Auth: **Firebase Anonymous Auth + App Check** + lookup por código (sem fricção de login); permite endurecer rules com `isSignedIn()` sem barrar convidados.

**Aceite:** acessar `/rsvp/<código-válido>` personaliza e identifica; código inválido é tratado; identidade persiste e aparece nos writes.

---

## FASE 4 — Pagamento real (Mercado Pago)
*Bloqueante por credenciais — scaffold agora, ligar depois*

- **Backend** (Route Handlers do Next em `app/api/**` ou Firebase Functions):
  - `POST /api/pix` → cria pagamento Pix dinâmico (valor/itens reais) e retorna QR + copia-e-cola.
  - `POST /api/webhook/mercadopago` → valida assinatura; ao confirmar, **promove `contribution.status='completed'` via Admin SDK** (server-side; cliente nunca promove).
- **Cliente:** checkout consome a resposta do servidor (QR real em vez de `[QR Code Mock]`); form de cartão usa o brick/checkout do Mercado Pago.
- **Env placeholders** (via `secret-env-refresh`): `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_PUBLIC_KEY`. Enquanto ausentes, fluxo permanece `pending` e o scaffold loga "modo simulado".
- Atualizar **ADR-0001** (PagSeguro → Mercado Pago) e manter a decisão de checkouts isolados.

**Aceite:** com chaves de sandbox, um Pix de teste percorre create→webhook→`completed` no painel admin; sem chaves, degrada para `pending` sem quebrar.

---

## FASE 5 — Gravata do Noivo (`/presentes/gravata`)
*Feature · depende da 4 (lance real) e da 3 (familyId)*

- Criar `app/presentes/gravata/page.tsx`: experiência de leilão/lance + **checkout isolado** (ADR-0001) + upsell pós-pagamento.
- Coleção `tieBids` (já tipada em `TieBid`); `components/TieLeaderboard.tsx` passa a **ler dados reais** agregados por `familyId` — ranking duplo individual+família (ADR-0004). Mata o **404** do botão "Dar meu Lance" na Home.
- Aggregação: cloud function/webhook atualiza somatórios derivados para leitura barata na Home (ADR-0004).

**Aceite:** botão "Dar meu Lance" abre rota real; leaderboard mostra lances reais (não `mockFamilyData`); ranking por família soma corretamente.

---

## FASE 6 — Remover eval() + acessibilidade de motion
*Técnica · independente*

- Instalar `three` + `threejs-components` como **deps versionadas**; substituir `eval(import('jsdelivr'))` por import normal em `CathedralIntro`/`IntroAnimation`.
- Consolidar a duplicação (~180 linhas de SVG) em um `CathedralSVG` compartilhado + 2 wrappers.
- Adicionar **CSP** em `next.config.ts`; remover `picsum.photos` (placeholder) dos `remotePatterns`.
- Aplicar o tier `prefers-reduced-motion` do DESIGN.md (FloatingBackground 20 partículas infinitas, parallax, tilt, shimmer).

**Aceite:** zero `eval`; CSP sem `unsafe-eval`; intro funciona com a dep; `prefers-reduced-motion: reduce` desliga animações infinitas.

---

## Riscos transversais a vigiar
- **Banco Firestore nomeado vs default** (`getFirestore(app)` ignora `firestoreDatabaseId`): **não alterar às cegas** — primeiro verificar no console qual banco tem as coleções/regras provisionadas; só então decidir passar (ou não) o `databaseId`. Mudança errada quebra o app.
- Endurecer rules **antes** de ajustar os writers (FASE 1→2 na ordem) para não derrubar RSVP/checkout em produção.
- Toda alteração de runtime/DB: rodar `e2e-validation-gate` (baseline → mudança idempotente → validar propagação → reverter → revalidar).
