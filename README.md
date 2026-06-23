# Site de Convidados

Site de casamento de Isadora & Matheus, construido com Next.js 15, Tailwind CSS e Firebase.

## Desenvolvimento local

**Pre-requisito:** Node.js 20 ou superior.

```bash
npm install
npm run dev
```

O app fica disponivel em `http://localhost:3000`.

## Verificacao

```bash
npm run lint
npm run build
```

## Variaveis de ambiente

Use `.env.local` para credenciais reais. Consulte `.env.example` para os placeholders atuais.

## Pagamentos

Presentes e lances da Gravata do Noivo sao processados pelo Mercado Pago via Checkout Pro.
O site cria o pedido no backend, redireciona o convidado para o Mercado Pago e confirma o
status por webhook em `/api/webhook/mercadopago`.

Variaveis principais:

```bash
MP_ACCESS_TOKEN="..."
MP_WEBHOOK_SECRET="..."
MP_WEBHOOK_URL="https://seu-dominio.com/api/webhook/mercadopago"
MP_SITE_URL="https://seu-dominio.com"
MP_ENVIRONMENT="sandbox" # sandbox ou production
```
