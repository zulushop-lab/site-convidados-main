import { NextResponse } from 'next/server';
import { isAllowedAdminEmail, normalizeAdminEmail } from '@/lib/adminAccess';
import { getAdminAuth, getAdminDb } from '@/lib/server/firebaseAdmin';

export const runtime = 'nodejs';

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'unknown';
type PaymentType = 'gift' | 'tie_bid';

interface AdminIdentity {
  email: string;
}

interface FirestoreTimestampLike {
  toDate?: () => Date;
  seconds?: number;
  _seconds?: number;
}

const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'processing', 'completed', 'failed', 'unknown'];

function unauthorized(status: 401 | 403, error: string) {
  return NextResponse.json({ error }, { status });
}

async function requireAdmin(request: Request): Promise<AdminIdentity | NextResponse> {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return unauthorized(401, 'Token ausente.');

  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: 'Firebase Admin SDK nao configurado.' }, { status: 503 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = normalizeAdminEmail(decoded.email);
    if (!email || decoded.email_verified !== true || !isAllowedAdminEmail(email)) {
      return unauthorized(403, 'Acesso restrito aos noivos.');
    }

    return { email };
  } catch {
    return unauthorized(401, 'Token invalido.');
  }
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asStatus(value: unknown): PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus) ? (value as PaymentStatus) : 'unknown';
}

function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  const timestamp = value as FirestoreTimestampLike;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000);
  if (typeof timestamp._seconds === 'number') return new Date(timestamp._seconds * 1000);

  return null;
}

function toIso(value: unknown): string | null {
  const date = asDate(value);
  return date ? date.toISOString() : null;
}

function sortByCreatedAtDesc<T extends { createdAt: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = a.createdAt ? Date.parse(a.createdAt) : 0;
    const right = b.createdAt ? Date.parse(b.createdAt) : 0;
    return right - left;
  });
}
function makeStatusSummary() {
  return {
    pending: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    unknown: { count: 0, amount: 0 },
  };
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const adminDb = await getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin SDK nao configurado.' }, { status: 503 });
  }

  const [familiesSnapshot, guestsSnapshot, rsvpsSnapshot, contributionsSnapshot, tieBidsSnapshot] =
    await Promise.all([
      adminDb.collection('families').get(),
      adminDb.collection('guests').get(),
      adminDb.collection('rsvps').get(),
      adminDb.collection('contributions').get(),
      adminDb.collection('tieBids').get(),
    ]);

  const families = familiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: asString(doc.data().name, doc.id),
    phone: asString(doc.data().phone),
  }));
  const guests = guestsSnapshot.docs.map((doc) => ({
    id: doc.id,
    familyId: asString(doc.data().familyId),
    name: asString(doc.data().name, doc.id),
    isChild: doc.data().isChild === true,
  }));

  const familyById = new Map(families.map((family) => [family.id, family]));
  const guestById = new Map(guests.map((guest) => [guest.id, guest]));
  const rsvpFamilyIds = new Set<string>();
  const confirmedGuestIds = new Set<string>();

  const recentRsvps = rsvpsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const familyId = asString(data.familyId, doc.id);
    const attendees = Array.isArray(data.attendees)
      ? data.attendees.filter((id): id is string => typeof id === 'string')
      : [];

    rsvpFamilyIds.add(familyId);
    attendees.forEach((guestId) => confirmedGuestIds.add(guestId));

    const confirmedBy = asString(data.confirmedBy);

    return {
      id: doc.id,
      familyId,
      familyName: familyById.get(familyId)?.name ?? familyId,
      attendeesCount: attendees.length || asNumber(data.adults),
      attendees: attendees.map((guestId) => guestById.get(guestId)?.name ?? guestId),
      confirmedBy: guestById.get(confirmedBy)?.name ?? confirmedBy,
      createdAt: toIso(data.createdAt),
    };
  });

  const paymentSummary = makeStatusSummary();
  const addPayment = (type: PaymentType, id: string, data: FirebaseFirestore.DocumentData) => {
    const status = asStatus(data.status);
    const amount = asNumber(data.amount);
    paymentSummary[status].count += 1;
    paymentSummary[status].amount += amount;

    return {
      id,
      type,
      status,
      amount,
      donorName: asString(data.donorName, 'Sem nome'),
      donorEmail: asString(data.donorEmail),
      label:
        type === 'tie_bid'
          ? asString(data.displayName, asString(data.familyName, 'Gravata do Noivo'))
          : asString(data.giftTitle, 'Presente'),
      createdAt: toIso(data.createdAt),
    };
  };

  const payments = [
    ...contributionsSnapshot.docs.map((doc) => addPayment('gift', doc.id, doc.data())),
    ...tieBidsSnapshot.docs.map((doc) => addPayment('tie_bid', doc.id, doc.data())),
  ];

  const confirmedFamilies = rsvpFamilyIds.size;
  const totalFamilies = families.length;
  const totalGuests = guests.length;
  const confirmedGuests = confirmedGuestIds.size;
  const pendingFamilies = families
    .filter((family) => !rsvpFamilyIds.has(family.id))
    .map((family) => ({
      id: family.id,
      name: family.name,
      guestsCount: guests.filter((guest) => guest.familyId === family.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return NextResponse.json({
    adminEmail: admin.email,
    generatedAt: new Date().toISOString(),
    rsvp: {
      totalFamilies,
      confirmedFamilies,
      pendingFamilies: Math.max(totalFamilies - confirmedFamilies, 0),
      totalGuests,
      confirmedGuests,
      pendingGuests: Math.max(totalGuests - confirmedGuests, 0),
      childGuests: guests.filter((guest) => guest.isChild).length,
      recent: sortByCreatedAtDesc(recentRsvps).slice(0, 10),
      pendingFamilyList: pendingFamilies.slice(0, 20),
    },
    payments: {
      summary: paymentSummary,
      totalCount: payments.length,
      completedAmount: paymentSummary.completed.amount,
      pendingAmount: paymentSummary.pending.amount + paymentSummary.processing.amount,
      recent: sortByCreatedAtDesc(payments).slice(0, 12),
    },
  });
}
