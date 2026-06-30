import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
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

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
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

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const splitLine = (line: string) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    return cells;
  };

  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function readOperationalOverview() {
  const outputDir = path.join(process.cwd(), 'output', 'convites');
  const summaryPath = path.join(outputDir, 'rsvp-operacional-resumo.json');
  const seedPath = path.join(outputDir, 'planilha-convidados-seed.csv');
  const dispatchPath = path.join(outputDir, 'disparo-primeiro-lote.csv');
  const pendingPath = path.join(outputDir, 'grupos-pendentes-contato.csv');

  if (!fs.existsSync(summaryPath)) {
    return {
      available: false,
      sourceXlsx: null,
      firstLotFamilies: 0,
      firstLotGuests: 0,
      dispatchChannels: 0,
      pendingGroups: 0,
      linksReady: false,
      firstLotFamilyIds: [],
      funnel: [],
      dispatchStatusCounts: {},
      pendingGroupList: [],
    };
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as {
    source_xlsx?: string;
    first_lot_guest_rows_seeded?: number;
    first_lot_families?: number;
    first_lot_dispatch_channels?: number;
    pending_groups?: number;
    links_from_codes_file?: boolean;
  };
  const dispatchRows = fs.existsSync(dispatchPath)
    ? parseCsv(fs.readFileSync(dispatchPath, 'utf8'))
    : [];
  const seedRows = fs.existsSync(seedPath)
    ? parseCsv(fs.readFileSync(seedPath, 'utf8'))
    : [];
  const pendingRows = fs.existsSync(pendingPath)
    ? parseCsv(fs.readFileSync(pendingPath, 'utf8'))
    : [];
  const firstLotFamilyIds = [...new Set(seedRows.map((row) => row.id_familia).filter(Boolean))];

  const dispatchStatusCounts = dispatchRows.reduce<Record<string, number>>((acc, row) => {
    const status = row.status_envio || 'indefinido';
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    available: true,
    sourceXlsx: summary.source_xlsx ?? null,
    firstLotFamilies: summary.first_lot_families ?? 0,
    firstLotGuests: summary.first_lot_guest_rows_seeded ?? 0,
    dispatchChannels: summary.first_lot_dispatch_channels ?? dispatchRows.length,
    pendingGroups: summary.pending_groups ?? pendingRows.length,
    linksReady: summary.links_from_codes_file === true,
    firstLotFamilyIds,
    funnel: [
      { label: 'Base revisada', value: summary.first_lot_families ?? 0 },
      { label: 'Cadastrado no site', value: 0 },
      { label: 'Links reais', value: summary.links_from_codes_file === true ? summary.first_lot_families ?? 0 : 0 },
      { label: 'Mensagens prontas', value: dispatchRows.length },
      { label: 'Enviado', value: 0 },
      { label: 'Confirmado', value: 0 },
    ],
    dispatchStatusCounts,
    pendingGroupList: pendingRows.slice(0, 20).map((row) => ({
      id: row.id_familia,
      name: row.nome_familia || row.id_familia,
      names: row.nomes_grupo,
      status: row.status_pendencia || 'pendente',
    })),
  };
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
    primaryPhone: asString(doc.data().primaryPhone, asString(doc.data().phone)),
    contactPhones: asStringArray(doc.data().contactPhones),
    code: asString(doc.data().code),
    inviteStatus: asString(doc.data().inviteStatus, 'not_sent'),
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
  const familiesWithLinks = families.filter((family) => family.code).length;
  const firebaseDispatchChannels = families.reduce((total, family) => {
    const uniquePhones = new Set(family.contactPhones.length ? family.contactPhones : family.phone ? [family.phone] : []);
    return total + uniquePhones.size;
  }, 0);
  const sentFamilies = families.filter((family) => family.inviteStatus === 'sent').length;
  const pendingFamilies = families
    .filter((family) => !rsvpFamilyIds.has(family.id))
    .map((family) => ({
      id: family.id,
      name: family.name,
      guestsCount: guests.filter((guest) => guest.familyId === family.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const operations = readOperationalOverview();
  const plannedFamilies = operations.firstLotFamilies || totalFamilies;
  const plannedDispatchChannels = operations.dispatchChannels || firebaseDispatchChannels;
  const firstLotFamilyIds = new Set<string>(operations.firstLotFamilyIds);
  const hasFirstLotIds = firstLotFamilyIds.size > 0;
  const registeredFirstLotFamilies = hasFirstLotIds
    ? families.filter((family) => firstLotFamilyIds.has(family.id)).length
    : totalFamilies;
  const firstLotFamiliesWithLinks = hasFirstLotIds
    ? families.filter((family) => firstLotFamilyIds.has(family.id) && family.code).length
    : familiesWithLinks;
  const confirmedFirstLotFamilies = hasFirstLotIds
    ? [...rsvpFamilyIds].filter((familyId) => firstLotFamilyIds.has(familyId)).length
    : confirmedFamilies;
  const extraFirebaseFamilies = hasFirstLotIds
    ? families.filter((family) => !firstLotFamilyIds.has(family.id)).length
    : 0;

  return NextResponse.json({
    adminEmail: admin.email,
    generatedAt: new Date().toISOString(),
    operations: {
      ...operations,
      firstLotFamilies: operations.firstLotFamilies || totalFamilies,
      dispatchChannels: plannedDispatchChannels,
      linksReady: firstLotFamiliesWithLinks >= plannedFamilies && plannedFamilies > 0,
      firebaseFamilies: totalFamilies,
      registeredFirstLotFamilies,
      extraFirebaseFamilies,
      firebaseDispatchChannels,
      familiesWithLinks,
      firstLotFamiliesWithLinks,
      sentFamilies,
      funnel: [
        { label: 'Base revisada', value: plannedFamilies },
        { label: 'Cadastrado no site', value: registeredFirstLotFamilies },
        { label: 'Links reais', value: firstLotFamiliesWithLinks },
        { label: 'Mensagens prontas', value: plannedDispatchChannels },
        { label: 'Enviado', value: sentFamilies },
        { label: 'Confirmado', value: confirmedFirstLotFamilies },
      ],
    },
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
