import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebaseAdmin';

export const runtime = 'nodejs';

type PaymentKind = 'gift' | 'tie_bid';

function resolveCollection(kind: PaymentKind): 'contributions' | 'tieBids' {
  return kind === 'tie_bid' ? 'tieBids' : 'contributions';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') === 'tie_bid' ? 'tie_bid' : 'gift';
  const id = url.searchParams.get('id') ?? '';

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: 'id invalido' }, { status: 400 });
  }

  const adminDb = await getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin SDK nao configurado.' }, { status: 503 });
  }

  const snap = await adminDb.collection(resolveCollection(kind as PaymentKind)).doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'nao encontrado' }, { status: 404 });
  }

  const data = snap.data();
  return NextResponse.json({
    id,
    kind,
    status: data?.status ?? 'pending',
    mpStatus: data?.mpStatus ?? null,
    paymentMethod: data?.paymentMethod ?? null,
  });
}
