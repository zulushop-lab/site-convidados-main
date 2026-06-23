# Context Snapshot | Mercado Pago em Producao | 2026-06-23

## Objetivo
Continuar a partir da integracao Mercado Pago ja implementada, publicada na Vercel e configurada com variaveis de producao, sem reabrir decisoes basicas de arquitetura.

## Decisoes tomadas
- Usar Mercado Pago Checkout Pro para todos os pagamentos, nao Checkout Transparente.
- Presentes e lances da Gravata do Noivo passam pelo backend antes de redirecionar para o Mercado Pago.
- Cliente nao cria mais `contributions` nem `tieBids` diretamente no Firestore.
- Confirmacao financeira depende de webhook Mercado Pago em `/api/webhook/mercadopago`.
- `MP_PUBLIC_KEY` nao e necessaria no fluxo atual de Checkout Pro.
- Tunnels (`ngrok`/`cloudflared`) sao apenas desenvolvimento; webhook definitivo aponta para Vercel.

## Estado confirmado
- Workspace: `C:\Users\CARRE\Pictures\site-convidados-main`
- Branch: `main`
- Ultimo commit: `a4a792f feat(payments): route payments through Mercado Pago`
- `main` esta alinhada com `origin/main` e `vercel/main`.
- Producao Vercel publicada e alias aplicado:
  - `https://site-convidados-main.vercel.app`
- Deploy especifico publicado:
  - `https://site-convidados-main-ajspcr0bn-matheusrs180-3983s-projects.vercel.app`
- Projeto Vercel: `matheusrs180-3983s-projects/site-convidados-main`
- Variaveis Vercel Production configuradas e criptografadas:
  - `MP_ACCESS_TOKEN`
  - `MP_WEBHOOK_SECRET`
  - `MP_WEBHOOK_URL`
  - `MP_SITE_URL`
  - `MP_ENVIRONMENT`
  - `FIREBASE_SERVICE_ACCOUNT_BASE64`
- URL de webhook de producao esperada no Mercado Pago:
  - `https://site-convidados-main.vercel.app/api/webhook/mercadopago`
- Arquivos temporarios com segredo foram apagados:
  - `C:\Users\CARRE\secrets\mp_access_token.txt`
  - `C:\Users\CARRE\secrets\mp_webhook_secret.txt`
- `.env.local` local foi sobrescrito pelo `vercel link`; producao esta OK, mas localhost pode precisar de reconfiguracao.

## Riscos e mitigacoes
- Risco: webhook Mercado Pago nao estar cadastrado exatamente na URL de producao.
  Mitigacao: conferir no painel Mercado Pago, modo producao, evento `Pagamentos`.
- Risco: usar token de teste em producao.
  Mitigacao: validar no painel Mercado Pago que `MP_ACCESS_TOKEN` vem de credenciais de producao.
- Risco: pagamento aprovado ficar `pending` se assinatura do webhook falhar.
  Mitigacao: testar pagamento real pequeno e verificar logs Vercel da rota `/api/webhook/mercadopago`.
- Risco: ambiente local quebrado apos `vercel link`.
  Mitigacao: recriar `.env.local` local apenas se precisar testar localhost.

## Execucao esperada
1. Validar no Mercado Pago que o webhook de producao esta salvo com:
   `https://site-convidados-main.vercel.app/api/webhook/mercadopago`
2. Fazer um pagamento de teste/baixo valor pela pagina de presentes em producao.
3. Verificar se o usuario retorna para `/presentes/checkout/retorno`.
4. Verificar no Firestore se o documento em `contributions` ou `tieBids` muda de `pending` para `completed`.
5. Se nao completar, abrir logs Vercel da function `/api/webhook/mercadopago`.

## Validacao minima
- `npm run lint`
- `npm run build`
- `npm run test:rules:baseline`
- `npm run test:rules:hardened`
- `vercel env ls`
- Checar webhook no painel Mercado Pago sem expor secrets.

## Prompt de retomada
Continue no workspace `C:\Users\CARRE\Pictures\site-convidados-main`. Leia primeiro:
- `docs/CONTEXT_SNAPSHOT_MERCADO_PAGO_PROD_2026-06-23.md`
- `lib/server/mercadopago.ts`
- `app/api/mercadopago/checkout/route.ts`
- `app/api/webhook/mercadopago/route.ts`
- `app/presentes/checkout/page.tsx`
- `app/presentes/checkout/retorno/page.tsx`

Tarefa: validar fim-a-fim a integracao Mercado Pago em producao no site `https://site-convidados-main.vercel.app`, sem expor tokens. Confirme webhook no Mercado Pago, rode um pagamento teste/baixo valor se o usuario autorizar, inspecione logs Vercel se o status nao promover, e mantenha a regra: cliente nunca cria registro financeiro direto no Firestore.
