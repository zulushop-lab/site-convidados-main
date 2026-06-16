import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebaseAdmin';
import { createPixPayment, hasMpCredentials } from '@/lib/server/mercadopago';

export const runtime = 'nodejs';

/**
 * POST /api/pix — cria a contribuicao 'pending' (Admin SDK) e gera o Pix
 * dinamico no Mercado Pago (SPEC-PAYMENTS-MP RT-3).
 *
 * Modo simulado (sem credenciais MP e/ou sem service account): NAO chama o MP,
 * retorna { simulated: true, status: 'pending', qrCode: null } e loga o aviso.
 * Nunca quebra a navegacao por falta de chave.
 */

interface PixBody {
  amount?: unknown;
  item?: unknown;
  donorName?: unknown;
  donorEmail?: unknown;
  paymentMethod?: unknown;
  familyId?: unknown;
  guestId?: unknown;
}

const asString = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function POST(request: Request) {
  if (request.headers.get('content-type')?.includes('application/json') !== true) {
    return NextResponse.json({ error: 'Content-Type deve ser application/json' }, { status: 415 });
  }

  let body: PixBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount);
  const item = asString(body.item);
  const donorName = asString(body.donorName);
  const donorEmail = asString(body.donorEmail);

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return NextResponse.json({ error: 'Valor invalido' }, { status: 400 });
  }
  if (!item || item.length > 200) return NextResponse.json({ error: 'Item invalido' }, { status: 400 });
  if (!donorName || donorName.length > 200) return NextResponse.json({ error: 'Nome invalido' }, { status: 400 });
  if (!donorEmail || donorEmail.length > 200 || !donorEmail.includes('@')) {
    return NextResponse.json({ error: 'E-mail invalido' }, { status: 400 });
  }

  const adminDb = await getAdminDb();
  const credentials = hasMpCredentials();

  // Sem infra server (Admin SDK) nao ha onde persistir 'pending' de forma segura.
  if (!adminDb) {
    console.log('[MP] modo simulado: credenciais ausentes (sem Admin SDK).');
    return NextResponse.json({
      contributionId: null,
      qrCodeBase64: null,
      qrCode: null,
      status: 'pending',
      simulated: true,
    });
  }

  // Cria a contribuicao 'pending' (servidor e a fonte da verdade do status).
  const docRef = adminDb.collection('contributions').doc();
  const { FieldValue } = await import('firebase-admin/firestore');
  const base = {
    amount,
    giftTitle: item,
    donorName,
    donorEmail,
    paymentMethod: 'pix',
    status: 'pending',
    externalReference: docRef.id,
    createdAt: FieldValue.serverTimestamp(),
    ...(asString(body.familyId) ? { familyId: asString(body.familyId) } : {}),
    ...(asString(body.guestId) ? { guestId: asString(body.guestId) } : {}),
  };

  if (!credentials) {
    console.log('[MP] modo simulado: credenciais ausentes (Pix nao emitido).');
    await docRef.set(base);
    return NextResponse.json({
      contributionId: docRef.id,
      qrCodeBase64: null,
      qrCode: null,
      status: 'pending',
      simulated: true,
    });
  }

  try {
    await docRef.set(base);
    const pix = await createPixPayment({
      amount,
      description: item,
      payerEmail: donorEmail,
      payerName: donorName,
      externalReference: docRef.id,
      notificationUrl: process.env.MP_WEBHOOK_URL,
    });
    await docRef.update({ mpPaymentId: pix.mpPaymentId, updatedAt: FieldValue.serverTimestamp() });

    return NextResponse.json({
      contributionId: docRef.id,
      qrCodeBase64: pix.qrCodeBase64,
      qrCode: pix.qrCode,
      status: 'pending',
      simulated: false,
    });
  } catch (error) {
    console.error('[MP] Falha ao criar Pix:', error);
    return NextResponse.json({ error: 'Falha ao gerar o pagamento. Tente novamente.' }, { status: 502 });
  }
}
