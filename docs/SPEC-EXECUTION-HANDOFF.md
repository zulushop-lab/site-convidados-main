> ⚠️ **DOCUMENTO HISTÓRICO / DESATUALIZADO (arquivado em 2026-06-16).**
> O estado descrito abaixo reflete a worktree de **15/06** e **não** corresponde mais ao código atual.
> Verificações de 16/06 contra o código real divergem deste snapshot em pontos críticos:
> - `firestore.rules` **JÁ está endurecido** e `npm run test:rules:hardened` passa **15/15** (aqui consta "ainda NÃO endurecido" / "hardened falhou").
> - `SPEC-GIFTS-CATALOG`, `SPEC-CHECKOUT-HONESTY` e `SPEC-RSVP-AUTH` estão **implementadas** (aqui constam "não executadas").
> - As rotas Mercado Pago (`/api/pix`, `/api/webhook`, `/api/payments/[id]/status`) **já existem** (aqui consta "sem rotas MP").
>
> **Fonte de verdade atual:** o roadmap verificado em
> `C:\Users\CARRE\.claude\plans\wortree-atualizada-verifique-o-squishy-eich.md`.
> Mantido apenas como registro do que se sabia em 15/06.

---

# Context Snapshot | SPEC Execution | 2026-06-15

## Objetivo
Continuar a execucao das SPECs do site de convidados Isadora & Matheus em `c:\Users\CARRE\Pictures\site-convidados-main`, sem reabrir decisoes ja tomadas e sem tocar em Firestore rules/writers enquanto os bloqueios manuais principais nao forem resolvidos.

## Decisoes tomadas
- Firestore database preflight continua pendente. O usuario ainda nao sabe responder. Atencao: isso nao depende da planilha de convidados; precisa ser confirmado no Firebase Console: banco `(default)` vs banco nomeado `ai-studio-remixmatheusisad-2704bafb-b28b-4074-97fe-0650887857e8`.
- A API key Firebase exposta sera rotacionada/restringida depois. Ate la, nao tratar `.gitignore` como mitigacao completa; ele so evita reincidencia.
- Unidade de `amount`: usar a unidade mais facil para Mercado Pago, ou seja, reais/BRL decimal no contrato de produto. Ainda nao alterar rules agora.
- Seguir com as Firestore rules atuais por enquanto. Nao endurecer `firestore.rules`, nao mexer em writers transacionais e nao alterar `getFirestore(app)` sem PREFLIGHT.
- Validacao CSP/motion ainda nao foi feita manualmente. Quando for feita, validar fluxo completo, incluindo envio/teste do link por WhatsApp.
- README, `.env.example` e token visual `--primary-fixed-dim` foram aprovados pelo usuario.
- Proximas tarefas devem priorizar o que nao depende de planilhas. Planilhas de presentes/convidados serao enviadas depois.
- Credenciais Mercado Pago ainda nao existem.
- Decisoes de Gravata/leaderboard ficam para depois.

## Estado confirmado
- Branch local: `main`.
- Commits criados antes deste snapshot:
  - `d786323 chore(deps): align runtime dependencies and rules test scripts`
  - `313f499 chore(hygiene): remove stale scaffold and dead UI code`
  - `57b623c feat(motion-csp): replace CDN intro runtime and add CSP`
  - `f4ead35 chore(firebase): add rules scaffolding and remove tracked config`
  - `e20445d chore(workspace): update Claude terminal preference`
- `SPEC-HYGIENE`: implementada mecanicamente. Metas estaticas passaram.
- `SPEC-MOTION-CSP`: implementada mecanicamente. `eval`, jsdelivr e picsum removidos; CSP adicionada; reduced-motion aplicado; `three` e `threejs-components` versionados.
- `SPEC-FIRESTORE-SECURITY`: parcial. Existem `firebase.json`, config example, scripts de teste e `firestore-errors` sem PII sensivel, mas `firestore.rules` ainda NAO esta endurecido.
- `SPEC-GIFTS-CATALOG`: nao executada. Cliente ainda tem seed/writes de gifts.
- `SPEC-CHECKOUT-HONESTY`: nao executada. Checkout ainda grava `completed`.
- `SPEC-RSVP-AUTH`: nao executada. RSVP ainda nao tem Anonymous Auth/identidade real.
- `SPEC-PAYMENTS-MP`: nao executada. Sem credenciais e sem rotas MP.
- `SPEC-GRAVATA-LEADERBOARD`: nao executada. Rota `/presentes/gravata` ainda nao existe.
- `lib/firebase.ts` continua usando `getFirestore(app)`, portanto banco default no codigo atual.
- `firebase-applet-config.json` foi removido do tracking e esta ignorado, mas o arquivo local pode existir para desenvolvimento.

## Validacao ja rodada
- `git diff --check`: passou antes do snapshot.
- `npm.cmd run lint`: passou.
- `npm.cmd run build`: passou com Next 15.5.19.
- `npm.cmd ls three threejs-components`: passou.
- `npm.cmd audit --omit=dev`: passou com 0 vulnerabilidades.
- `npm.cmd run test:rules:baseline`: passou e confirmou o buraco atual das rules.
- `npm.cmd run test:rules:hardened`: falhou, esperado no estado atual, porque as rules ainda permitem create de contribution com status final pelo cliente.

## Riscos e mitigacoes
- Risco: confundir teste baseline verde com seguranca entregue. Mitigacao: baseline verde significa vulnerabilidade reproduzida; hardened ainda falha.
- Risco: deployar rules no banco errado. Mitigacao: PREFLIGHT no Firebase Console antes de qualquer deploy ou alteracao de `getFirestore(app)`.
- Risco: app quebrar em producao por CSP. Mitigacao: validar preview/producao no browser antes de considerar `SPEC-MOTION-CSP` totalmente fechada.
- Risco: commitar segredos novamente. Mitigacao: `firebase-applet-config.json` esta no `.gitignore`; nunca colar ou commitar service account, MP tokens ou `.env.local`.
- Risco: continuar produto transacional fake. Mitigacao: proxima etapa tecnica deve ser Firestore/security ou tarefas sem planilha que nao aumentem o buraco.

## Execucao esperada
1. Confirmar que a branch remota `origin/main` contem os commits deste lote.
2. Se for continuar sem planilhas, trabalhar em tarefas que nao dependem delas: revisar CSP em browser, documentar unidade de `amount`, preparar hardening de rules em branch/local sem deploy, ou preparar estrutura de scripts admin sem dados reais.
3. Antes de tocar em writers, rules ou Admin SDK: resolver PREFLIGHT do banco.
4. Antes de Mercado Pago: obter credenciais sandbox/prod e webhook secret.
5. Antes de RSVP real: preencher planilha de convidados e confirmar host final para links de WhatsApp.

## Validacao minima para proxima sessao
```powershell
git status --short --branch
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
npm.cmd run test:rules:baseline
```

Nao esperar `npm.cmd run test:rules:hardened` verde ate `firestore.rules` ser realmente endurecido.

## Prompt de retomada
Leia `docs/SPEC-EXECUTION-HANDOFF.md`, `docs/specs/SPEC-FIRESTORE-SECURITY.md` e `docs/specs/SPEC-MOTION-CSP.md`.

Continue a execucao das SPECs a partir do estado confirmado em 2026-06-15. Nao altere `getFirestore(app)`, `firestore.rules` nem writers transacionais sem PREFLIGHT do banco. O usuario aprovou README/.env/token visual, decidiu usar `amount` em BRL decimal para casar com Mercado Pago, ainda nao tem planilhas nem credenciais MP, e quer priorizar tarefas que nao dependem de planilha. Valide com comandos antes de encerrar e seja explicito sobre PASS/FAIL.
