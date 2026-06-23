import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebaseAdmin';

export const runtime = 'nodejs';

/**
 * GET /api/payments/:contributionId/status — polling de status pelo cliente
 * (SPEC-PAYMENTS-MP RT-5). O cliente nao le `contributions` direto (rules
 * admin-only); le aqui via Admin SDK. Nao expoe PII alem do status.
 *
 * Sem Admin SDK, falha explicitamente; status financeiro nao pode ser simulado.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contributionId: string }> },
) {
  const { contributionId } = await params;
  if (!contributionId || !/^[a-zA-Z0-9_-]+$/.test(contributionId)) {
    return NextResponse.json({ error: 'id invalido' }, { status: 400 });
  }

  const adminDb = await getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin SDK nao configurado.' }, { status: 503 });
  }

  const snap = await adminDb.collection('contributions').doc(contributionId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'nao encontrado' }, { status: 404 });
  }

  return NextResponse.json({ status: snap.data()?.status ?? 'pending' });
}
