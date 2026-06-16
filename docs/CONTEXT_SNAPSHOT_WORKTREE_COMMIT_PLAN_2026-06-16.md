# Context Snapshot | Worktree Commit Plan | 2026-06-16

## Objetivo
Organizar a worktree em commits profissionais e coerentes antes de publicar qualquer mudanca. A prioridade nao e "commitar tudo"; e separar entregas reais, corrigir inconsistencias de contrato e evitar commits que prometem mais do que implementam.

## Decisoes tomadas
- Nao transformar a worktree atual em um unico commit.
- `tsconfig.tsbuildinfo` nao deve entrar no commit; e artefato gerado.
- As rotas Mercado Pago devem ser tratadas como infraestrutura/backend parcial enquanto o checkout nao consumir `/api/pix` nem fizer polling de status.
- A mudanca visual da capa/Catedral deve ser separada da mudanca de Firestore/Auth/Pagamentos.
- Antes de commitar a capa mandando para `/presenca`, resolver a incompatibilidade: `/presenca` ainda grava RSVP no contrato antigo e conflita com `firestore.rules` endurecido.
- O fluxo visual pos-RSVP agora tem contrato proprio: `/rsvp/[code]` exibe `CathedralReveal`, chama `markSkipCover()`, faz hard navigation para `/`, e `CathedralIntro` le `shouldSkipCover()` para nao repetir a capa. O footer limpa essa flag com `clearSkipCover()` ao "Rever o Convite".
- O arquivo deste snapshot e artefato de handoff. Nao incluir em commits de feature sem decisao explicita.

## Estado confirmado
- Workspace: `c:\Users\CARRE\Pictures\site-convidados-main`.
- Data da analise: 2026-06-16.
- Branch: `main`, alinhada com `origin/main` no inicio da analise.
- Nao havia nada staged.
- Arquivos modificados rastreados: `.env.example`, `app/layout.tsx`, `app/presenca/page.tsx`, `app/rsvp/[code]/page.tsx`, `components/CathedralIntro.tsx`, `components/Footer.tsx`, `components/LoadingScreen.tsx`, `firestore.rules`, `lib/store/useAppStore.ts`, `next.config.ts`, `package.json`, `package-lock.json`, `scripts/.cathedral-small.png`, `scripts/generate-invite.mjs`, `scripts/test-firestore-rules-hardened.mjs`, `tsconfig.tsbuildinfo`.
- Arquivos novos relevantes: `app/api/pix/route.ts`, `app/api/webhook/mercadopago/route.ts`, `app/api/payments/[contributionId]/status/route.ts`, `components/CathedralReveal.tsx`, `lib/context/AuthContext.tsx`, `lib/context/GuestContext.tsx`, `lib/server/firebaseAdmin.ts`, `lib/server/mercadopago.ts`, `scripts/.alex-brush.ttf`, `scripts/.corner-ornament.svg`, `scripts/seed-families.mjs`, `scripts/seed-gifts.mjs`.
- Mudancas novas incorporadas ao plano: `app/rsvp/[code]/page.tsx` cresceu para acionar `CathedralReveal` no estado `success`; `components/CathedralIntro.tsx` passou a importar `shouldSkipCover()` e dispensar a capa quando a flag de sessao existe; `components/Footer.tsx` passou a limpar a flag com `clearSkipCover()` antes de reabrir o convite.
- `npm run lint` passou.
- `git diff --check` nao apontou erros de whitespace, apenas avisos LF/CRLF.

## Riscos e mitigacoes
- Risco: `/presenca` quebrar apos hardening das rules. Mitigacao: antes do commit visual, decidir se `/presenca` sera removida/redirecionada para `/rsvp/[code]` ou adaptada ao contrato novo (`familyId`, `confirmedBy`, `attendees`, `adults` numerico, auth). O fluxo `/rsvp/[code]` ja esta mais alinhado ao contrato e agora aciona `CathedralReveal` antes de voltar para a home.
- Risco: flag `home.skipCover.v1` deixar a capa invisivel quando o usuario queria rever o convite. Mitigacao: validar o botao "Rever o Convite" no footer; ele deve chamar `clearSkipCover()`, setar `homeState` para `ANIMATING_LOADING` e navegar para `/`.
- Risco: flicker/hydration na home: o servidor ainda renderiza a capa, e o cliente so depois le `sessionStorage`. Mitigacao: validar visualmente o retorno de `/rsvp/[code]` para `/` em desktop/mobile e WebView; se houver piscada ruim, mover a decisao para um estado `mounted` antes de renderizar a capa.
- Risco: dead state `READY_FOR_INTERACTION` permanecer na FSM sem uso apos remover a intro 3D antiga. Mitigacao: revisar `useAppStore.ts` e usos de `homeState`; remover o estado morto em commit proprio se nao houver consumidor real.
- Risco: commit "Mercado Pago" mentiroso. Mitigacao: nomear como backend parcial, ou completar a integracao do checkout antes.
- Risco: scripts/cache binarios versionados por acidente. Mitigacao: revisar `scripts/.cathedral-small.png`, `scripts/.alex-brush.ttf` e `scripts/.corner-ornament.svg`; mover para `public/`/assets ou ignorar/cachear se forem gerados.
- Risco: conflito com PREFLIGHT de banco Firestore. Mitigacao: confirmar no Firebase Console se o app usa `(default)` ou banco nomeado antes de deploy/rules/seed real.
- Risco: `firebase-admin` em `devDependencies` mas usado por route handlers em producao. Mitigacao: mover para `dependencies` se o deploy precisar instalar apenas deps de producao, ou confirmar comportamento do host.
- Risco: encoding mojibake em comentarios/docs. Mitigacao: checar arquivos alterados em UTF-8 antes de commit.

## Execucao esperada
1. Limpar staging mental: criar branch de organizacao, confirmar que nada esta staged e remover do plano `tsconfig.tsbuildinfo`.
2. Corrigir o bloqueador de contrato RSVP: alinhar `/presenca`, `CathedralIntro` e `firestore.rules`.
3. Separar commits nesta ordem:
   - `chore(auth): add guest auth providers and seed scripts` para providers, scripts de seed e envs relacionados, se validados.
   - `test(firestore): harden rules for rsvp and payments` para `firestore.rules` e teste hardened.
   - `feat(invite): refresh cathedral cover and reveal flow` para capa, loading, footer, reveal, `app/rsvp/[code]`, `lib/store/useAppStore.ts` e assets visuais. Este commit deve documentar explicitamente o contrato `markSkipCover -> hard navigation -> shouldSkipCover -> clearSkipCover`.
   - `feat(payments): add mercado pago server routes` somente como backend parcial, ou completar checkout antes e entao usar nome de feature completa.
   - `chore(invite): update invite generation assets` para `generate-invite.mjs` e assets/cache de convite, depois de decidir o que e fonte vs gerado.
4. Para cada commit, usar `git add -p` ou paths explicitos. Nao usar `git add .`.
5. Rodar validacao minima antes de qualquer commit final.

## Validacao minima
```powershell
git status --short --branch
git diff --check
npm run lint
npm run build
npm run test:rules:hardened
```

Validacao manual obrigatoria depois dos ajustes:
- fluxo `/rsvp/<code>` com familia seeded de teste;
- capa inicial e botao principal;
- pos-confirmacao em `/rsvp/<code>`: `CathedralReveal` roda, a home abre sem repetir a capa, e o footer "Rever o Convite" reexibe a capa;
- `/presenca` decidido: removido, redirecionado ou funcional;
- checkout Pix: se rotas MP forem commitadas como feature completa, UI deve chamar `/api/pix` e polling deve chamar `/api/payments/[id]/status`.

## Prompt de retomada
Abra `c:\Users\CARRE\Pictures\site-convidados-main`. Leia primeiro `AGENTS.md` se existir, depois `docs/CONTEXT_SNAPSHOT_WORKTREE_COMMIT_PLAN_2026-06-16.md`, `docs/SPEC-EXECUTION-HANDOFF.md`, `docs/specs/SPEC-RSVP-AUTH.md`, `docs/specs/SPEC-FIRESTORE-SECURITY.md` e `docs/specs/SPEC-PAYMENTS-MP.md`.

Tarefa: organizar a worktree em commits profissionais. Nao faca `git add .`. Comece com `git status --short --branch`, `git diff --name-status` e confirme que nada esta staged. Trate como bloqueador a incoerencia entre `CathedralIntro -> /presenca`, `/presenca` gravando RSVP antigo e `firestore.rules` exigindo contrato novo. Remova `tsconfig.tsbuildinfo` do escopo de commit. Separe visual, auth/rules, backend MP, seed scripts e gerador de convite em commits distintos. Se Mercado Pago nao for ligado ao checkout, nomeie como backend parcial. Valide com `git diff --check`, `npm run lint`, `npm run build` e `npm run test:rules:hardened` antes de commitar.
