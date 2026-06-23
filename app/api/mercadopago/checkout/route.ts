import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebaseAdmin';
import {
  buildPaymentReference,
  createCheckoutPreference,
  hasMpCredentials,
  type PaymentReferenceKind,
} from '@/lib/server/mercadopago';

export const runtime = 'nodejs';

type CheckoutKind = 'gift' | 'tie_bid';

interface CheckoutBody {
  type?: unknown;
  amount?: unknown;
  item?: unknown;
  donorName?: unknown;
  donorEmail?: unknown;
  message?: unknown;
  familyId?: unknown;
  guestId?: unknown;
}

const MESSAGE_MAX = 500;

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function getPublicOrigin(request: Request): string {
  const configured = process.env.MP_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, '');

  return new URL(request.url).origin;
}

function getCheckoutUrlMode(): 'sandbox' | 'production' {
  if (process.env.MP_ENVIRONMENT === 'sandbox') return 'sandbox';
  if (process.env.MP_ENVIRONMENT === 'production') return 'production';

  return process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
}

export async function POST(request: Request) {
  if (request.headers.get('content-type')?.includes('application/json') !== true) {
    return NextResponse.json({ error: 'Content-Type deve ser application/json' }, { status: 415 });
  }

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const checkoutKind: CheckoutKind = body.type === 'tie_bid' ? 'tie_bid' : 'gift';
  const referenceKind: PaymentReferenceKind = checkoutKind === 'tie_bid' ? 'tieBid' : 'contribution';
  const collectionName = checkoutKind === 'tie_bid' ? 'tieBids' : 'contributions';

  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount);
  const rawItem = asString(body.item);
  const item = checkoutKind === 'tie_bid' ? 'Gravata do Noivo' : rawItem;
  const donorName = asString(body.donorName);
  const donorEmail = asString(body.donorEmail);
  const message = asString(body.message).slice(0, MESSAGE_MAX);
  const familyId = asString(body.familyId);
  const guestId = asString(body.guestId);

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return NextResponse.json({ error: 'Valor invalido' }, { status: 400 });
  }
  if (!item || item.length > 200) {
    return NextResponse.json({ error: 'Item invalido' }, { status: 400 });
  }
  if (!donorName || donorName.length > 200) {
    return NextResponse.json({ error: 'Nome invalido' }, { status: 400 });
  }
  if (!donorEmail || donorEmail.length > 200 || !donorEmail.includes('@')) {
    return NextResponse.json({ error: 'E-mail invalido' }, { status: 400 });
  }

  if (!hasMpCredentials()) {
    return NextResponse.json(
      { error: 'Mercado Pago nao configurado.', configured: false },
      { status: 503 },
    );
  }

  const adminDb = await getAdminDb();
  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin SDK nao configurado.', configured: false },
      { status: 503 },
    );
  }

  const { FieldValue } = await import('firebase-admin/firestore');
  const docRef = adminDb.collection(collectionName).doc();
  const externalReference = buildPaymentReference(referenceKind, docRef.id);
  const createdAt = FieldValue.serverTimestamp();

  const basePaymentData =
    checkoutKind === 'tie_bid'
      ? {
          amount,
          donorName,
          donorEmail,
          status: 'pending',
          externalReference,
          provider: 'mercadopago',
          checkoutType: 'checkout_pro',
          createdAt,
          ...(message ? { message } : {}),
          ...(familyId ? { familyId } : {}),
          ...(guestId ? { guestId } : {}),
        }
      : {
          amount,
          giftTitle: item,
          donorName,
          donorEmail,
          paymentMethod: 'mercadopago',
          status: 'pending',
          externalReference,
          provider: 'mercadopago',
          checkoutType: 'checkout_pro',
          createdAt,
          ...(familyId ? { familyId } : {}),
          ...(guestId ? { guestId } : {}),
        };

  await docRef.set(basePaymentData);

  const origin = getPublicOrigin(request);
  const returnBase = `${origin}/presentes/checkout/retorno?kind=${checkoutKind}&id=${docRef.id}`;
  const notificationUrl = process.env.MP_WEBHOOK_URL || `${origin}/api/webhook/mercadopago`;

  try {
    const preference = await createCheckoutPreference({
      amount,
      title: item,
      payerEmail: donorEmail,
      payerName: donorName,
      externalReference,
      notificationUrl,
      backUrls: {
        success: `${returnBase}&result=success`,
        pending: `${returnBase}&result=pending`,
        failure: `${returnBase}&result=failure`,
      },
    });

    const checkoutUrlMode = getCheckoutUrlMode();
    const checkoutUrl =
      checkoutUrlMode === 'sandbox'
        ? preference.sandboxInitPoint ?? preference.initPoint
        : preference.initPoint ?? preference.sandboxInitPoint;

    if (!checkoutUrl) {
      throw new Error('Mercado Pago nao retornou URL de checkout.');
    }

    await docRef.update({
      mpPreferenceId: preference.preferenceId,
      mpCheckoutUrlMode: checkoutUrlMode,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      id: docRef.id,
      kind: checkoutKind,
      preferenceId: preference.preferenceId,
      checkoutUrl,
    });
  } catch (error) {
    console.error('[MP] Falha ao criar preferencia Checkout Pro:', error);
    await docRef
      .update({
        status: 'failed',
        mpError: error instanceof Error ? error.message.slice(0, 500) : 'Erro desconhecido',
        updatedAt: FieldValue.serverTimestamp(),
      })
      .catch(() => undefined);

    return NextResponse.json(
      { error: 'Falha ao iniciar o pagamento no Mercado Pago.' },
      { status: 502 },
    );
  }
}
