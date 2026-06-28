import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebaseAdmin';
import {
  getPayment,
  mapMpStatus,
  parsePaymentReference,
  verifyWebhookSignature,
} from '@/lib/server/mercadopago';
import { aggregateCompletedTieBid } from '@/lib/server/tieLeaderboard';

export const runtime = 'nodejs';

/**
 * POST /api/webhook/mercadopago: promotes financial records through Admin SDK.
 * The Mercado Pago payment lookup is the source of truth; the request body is
 * never trusted for status changes.
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
  const dataId = payload?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id');

  if (!verifyWebhookSignature({ xSignature, xRequestId, dataId: dataId ?? null })) {
    return NextResponse.json({ error: 'Assinatura invalida' }, { status: 401 });
  }

  if (payload.type && payload.type !== 'payment') {
    return NextResponse.json({ received: true });
  }
  if (!dataId) return NextResponse.json({ received: true });

  const adminDb = await getAdminDb();
  if (!adminDb) {
    console.error('[MP] webhook recebido sem Admin SDK; status nao promovido.');
    return NextResponse.json({ error: 'Firebase Admin SDK nao configurado.' }, { status: 500 });
  }

  const payment = await getPayment(dataId);
  if (!payment || !payment.externalReference) {
    return NextResponse.json({ received: true });
  }

  const paymentReference = parsePaymentReference(payment.externalReference);
  if (!paymentReference) {
    return NextResponse.json({ received: true });
  }

  const nextStatus = mapMpStatus(payment.status);
  const ref = adminDb.collection(paymentReference.collection).doc(paymentReference.docId);
  const { FieldValue } = await import('firebase-admin/firestore');

  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ received: true });

  const current = snap.data()?.status as string | undefined;
  if (current && TERMINAL.has(current)) {
    if (paymentReference.kind === 'tieBid' && current === 'completed') {
      const aggregation = await aggregateCompletedTieBid(
        adminDb,
        paymentReference.docId,
        FieldValue,
      );
      return NextResponse.json({ received: true, idempotent: true, aggregation });
    }

    return NextResponse.json({ received: true, idempotent: true });
  }

  await ref.update({
    status: nextStatus,
    mpStatus: payment.status,
    mpStatusDetail: payment.statusDetail,
    mpPaymentId: dataId,
    mpPaymentMethodId: payment.paymentMethodId,
    mpPaymentTypeId: payment.paymentTypeId,
    updatedAt: FieldValue.serverTimestamp(),
    ...(nextStatus === 'completed' ? { paidAt: FieldValue.serverTimestamp() } : {}),
  });

  const aggregation =
    paymentReference.kind === 'tieBid' && nextStatus === 'completed'
      ? await aggregateCompletedTieBid(adminDb, paymentReference.docId, FieldValue)
      : null;

  return NextResponse.json({
    received: true,
    status: nextStatus,
    kind: paymentReference.kind,
    aggregation,
  });
}
