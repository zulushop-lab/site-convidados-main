/**
 * Wrapper do Mercado Pago (server-only) — SPEC-PAYMENTS-MP RT-1.
 *
 * NOTA: sem `import 'server-only'` (quebra a coleta de page-data de Route
 * Handlers no Next 15.5). Garantia server-only por contrato: importado apenas
 * por rotas app/api/** e le segredos de process.env (nunca NEXT_PUBLIC_).
 *
 * Usa a API REST via fetch (sem dependencia `mercadopago`, evitando peso no
 * bundle server). Le MP_ACCESS_TOKEN / MP_WEBHOOK_SECRET de process.env
 * (NUNCA NEXT_PUBLIC_*). Quando o token esta ausente, hasMpCredentials() e
 * false e o chamador entra em "modo simulado" (a spec exige degradacao honesta).
 */

import crypto from 'node:crypto';

const MP_API = 'https://api.mercadopago.com';

export function hasMpCredentials(): boolean {
  return !!process.env.MP_ACCESS_TOKEN;
}

export interface CreatePixParams {
  amount: number;
  description: string;
  payerEmail: string;
  payerName?: string;
  externalReference: string;
  notificationUrl?: string;
}

export interface PixResult {
  mpPaymentId: string;
  status: string;
  qrCodeBase64: string | null;
  qrCode: string | null;
}

/**
 * Cria um pagamento Pix dinamico no MP. So deve ser chamado quando
 * hasMpCredentials() === true. Lanca em erro de rede/credencial.
 */
export async function createPixPayment(params: CreatePixParams): Promise<PixResult> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN ausente.');

  const body = {
    transaction_amount: params.amount,
    description: params.description,
    payment_method_id: 'pix',
    external_reference: params.externalReference,
    ...(params.notificationUrl ? { notification_url: params.notificationUrl } : {}),
    payer: {
      email: params.payerEmail,
      ...(params.payerName ? { first_name: params.payerName } : {}),
    },
  };

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      // Idempotencia no MP por external_reference.
      'X-Idempotency-Key': params.externalReference,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MP createPixPayment falhou (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const tx = data?.point_of_interaction?.transaction_data ?? {};
  return {
    mpPaymentId: String(data.id),
    status: String(data.status ?? 'pending'),
    qrCodeBase64: tx.qr_code_base64 ?? null,
    qrCode: tx.qr_code ?? null,
  };
}

/** Consulta um pagamento no MP — fonte da verdade do webhook. */
export async function getPayment(paymentId: string): Promise<{ status: string; statusDetail: string; externalReference: string } | null> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN ausente.');

  const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    status: String(data.status ?? ''),
    statusDetail: String(data.status_detail ?? ''),
    externalReference: String(data.external_reference ?? ''),
  };
}

/**
 * Valida a assinatura do webhook MP (header x-signature: "ts=...,v1=...").
 * Manifest: id:<dataId>;request-id:<xRequestId>;ts:<ts>;
 * Sem MP_WEBHOOK_SECRET configurado, retorna false (caller deve rejeitar).
 */
export function verifyWebhookSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !opts.xSignature || !opts.dataId) return false;

  const parts = Object.fromEntries(
    opts.xSignature.split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k?.trim(), v?.trim()];
    }),
  );
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  const manifest = `id:${opts.dataId};request-id:${opts.xRequestId ?? ''};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

/** Mapeia status bruto do MP para o ENUM de Contribution/TieBid. */
export function mapMpStatus(mpStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
  switch (mpStatus) {
    case 'approved':
      return 'completed';
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'failed';
    case 'in_process':
    case 'authorized':
    case 'in_mediation':
      return 'processing';
    default:
      return 'pending';
  }
}
