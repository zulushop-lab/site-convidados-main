import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebaseAdmin';
import { getPayment, mapMpStatus, verifyWebhookSignature } from '@/lib/server/mercadopago';

export const runtime = 'nodejs';

/**
 * POST /api/webhook/mercadopago — promove contributions/{id}.status via Admin SDK
 * (SPEC-PAYMENTS-MP RT-4). UNICA rota que promove status.
 *
 * 1. valida x-signature -> 401 se invalida (sem efeito colateral)
 * 2. reconsulta o pagamento no MP (fonte da verdade; nunca confia so no corpo)
 * 3. mapeia status MP -> ENUM e atualiza por external_reference
 * 4. idempotente: nao regride estado terminal; reentrega nao duplica
 * 5. responde 200 para eventos reconhecidos (evita retries infinitos do MP)
 */

const TERMINAL = new Set(['completed', 'failed']);

export async function POST(request: Request) {
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');

  let payload: { type?: string; data?: { id?: string } } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const url = new URL(request.url);
  const dataId = payload?.data?.id ?? url.searchParams.get('data.id');

  if (!verifyWebhookSignature({ xSignature, xRequestId, dataId: dataId ?? null })) {
    return NextResponse.json({ error: 'Assinatura invalida' }, { status: 401 });
  }

  // So tratamos eventos de pagamento; o resto e reconhecido com 200 (idempotente).
  if (payload.type && payload.type !== 'payment') {
    return NextResponse.json({ received: true });
  }
  if (!dataId) return NextResponse.json({ received: true });

  const adminDb = await getAdminDb();
  if (!adminDb) {
    console.log('[MP] modo simulado: webhook recebido sem Admin SDK; nada promovido.');
    return NextResponse.json({ received: true, simulated: true });
  }

  const payment = await getPayment(dataId);
  if (!payment || !payment.externalReference) {
    return NextResponse.json({ received: true });
  }

  const nextStatus = mapMpStatus(payment.status);
  const ref = adminDb.collection('contributions').doc(payment.externalReference);
  const { FieldValue } = await import('firebase-admin/firestore');

  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ received: true });

  const current = snap.data()?.status as string | undefined;
  if (current && TERMINAL.has(current)) {
    // ja finalizado — idempotente, nao regride
    return NextResponse.json({ received: true, idempotent: true });
  }

  await ref.update({
    status: nextStatus,
    mpStatus: payment.status,
    mpStatusDetail: payment.statusDetail,
    updatedAt: FieldValue.serverTimestamp(),
    ...(nextStatus === 'completed' ? { paidAt: FieldValue.serverTimestamp() } : {}),
  });

  return NextResponse.json({ received: true, status: nextStatus });
}
