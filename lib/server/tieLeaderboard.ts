import crypto from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';

const AGGREGATION_VERSION = 1;
const TOP_LIMIT = 10;
const TIE_BID_MIN_AMOUNT_CENTS = 5000;

type FieldValueFactory = typeof import('firebase-admin/firestore').FieldValue;

interface TieBidData {
  amount?: unknown;
  status?: unknown;
  donorName?: unknown;
  donorEmail?: unknown;
  displayName?: unknown;
  guestId?: unknown;
  familyId?: unknown;
  familyName?: unknown;
  paidAt?: unknown;
  updatedAt?: unknown;
  aggregatedAt?: unknown;
  aggregationVersion?: unknown;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  total: number;
  bidCount: number;
  lastCompletedAt: number;
}

interface ScopeRef {
  scope: 'individual' | 'family';
  id: string;
  name: string;
  totalRef: FirebaseFirestore.DocumentReference;
  publicRef: FirebaseFirestore.DocumentReference;
}

interface ScopeContext extends ScopeRef {
  totalData: FirebaseFirestore.DocumentData;
  publicData: FirebaseFirestore.DocumentData;
}

interface AggregationResult {
  aggregated: boolean;
  reason?: string;
}

const SAFE_ID = /^[a-zA-Z0-9_-]{1,128}$/;

function cleanString(value: unknown, fallback: string, maxLength = 200): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function cents(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

function toBrl(centsValue: number): number {
  return Math.round(centsValue) / 100;
}

function safeDocumentId(prefix: string, value: string): string {
  if (SAFE_ID.test(value)) return `${prefix}_${value}`;
  return `${prefix}_${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function anonymousIndividualId(email: string, bidId: string): string {
  const source = email ? email.toLowerCase() : bidId;
  return `anon_${crypto.createHash('sha256').update(source).digest('hex')}`;
}

function timestampMillis(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof value.toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  return fallback;
}

function rankedTop(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries
    .filter((entry) => entry.total > 0 && entry.name.trim())
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.lastCompletedAt - b.lastCompletedAt;
    })
    .slice(0, TOP_LIMIT);
}

function mergeTopEntry(current: unknown, next: LeaderboardEntry): LeaderboardEntry[] {
  const entries = Array.isArray(current)
    ? current.filter((entry): entry is LeaderboardEntry => {
        return (
          entry &&
          typeof entry === 'object' &&
          typeof entry.id === 'string' &&
          typeof entry.name === 'string' &&
          typeof entry.total === 'number' &&
          typeof entry.bidCount === 'number' &&
          typeof entry.lastCompletedAt === 'number'
        );
      })
    : [];

  return rankedTop([...entries.filter((entry) => entry.id !== next.id), next]);
}

function buildScope(params: {
  db: Firestore;
  scope: 'individual' | 'family';
  id: string;
  name: string;
}): ScopeRef {
  return {
    scope: params.scope,
    id: params.id,
    name: params.name,
    totalRef: params.db
      .collection('leaderboardTotals')
      .doc(params.scope)
      .collection('items')
      .doc(params.id),
    publicRef: params.db.collection('leaderboards').doc(params.scope),
  };
}

function writeScope(params: {
  tx: FirebaseFirestore.Transaction;
  FieldValue: FieldValueFactory;
  context: ScopeContext;
  amountCents: number;
  completedAt: number;
}) {
  const nextTotalCents = cents(params.context.totalData.total) + params.amountCents;
  const nextBidCount =
    typeof params.context.totalData.bidCount === 'number' &&
    Number.isFinite(params.context.totalData.bidCount)
      ? params.context.totalData.bidCount + 1
      : 1;

  const entry: LeaderboardEntry = {
    id: params.context.id,
    name: params.context.name,
    total: toBrl(nextTotalCents),
    bidCount: nextBidCount,
    lastCompletedAt: params.completedAt,
  };

  params.tx.set(
    params.context.totalRef,
    {
      id: entry.id,
      name: entry.name,
      total: entry.total,
      bidCount: entry.bidCount,
      lastCompletedAt: entry.lastCompletedAt,
      updatedAt: params.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  params.tx.set(
    params.context.publicRef,
    {
      entries: mergeTopEntry(params.context.publicData.entries, entry),
      updatedAt: params.FieldValue.serverTimestamp(),
      source: 'mercadopago_webhook',
      aggregationVersion: AGGREGATION_VERSION,
    },
    { merge: true },
  );
}

export async function aggregateCompletedTieBid(
  db: Firestore,
  bidId: string,
  FieldValue: FieldValueFactory,
): Promise<AggregationResult> {
  const bidRef = db.collection('tieBids').doc(bidId);

  return db.runTransaction(async (tx) => {
    const bidSnap = await tx.get(bidRef);
    if (!bidSnap.exists) return { aggregated: false, reason: 'bid_missing' };

    const bid = bidSnap.data() as TieBidData;
    if (bid.status !== 'completed') {
      return { aggregated: false, reason: 'bid_not_completed' };
    }
    if (bid.aggregatedAt && bid.aggregationVersion === AGGREGATION_VERSION) {
      return { aggregated: false, reason: 'already_aggregated' };
    }

    const amountCents = cents(bid.amount);
    if (amountCents < TIE_BID_MIN_AMOUNT_CENTS) {
      return { aggregated: false, reason: 'amount_below_minimum' };
    }

    const now = Date.now();
    const completedAt = timestampMillis(bid.paidAt, timestampMillis(bid.updatedAt, now));
    const displayName = cleanString(bid.displayName, cleanString(bid.donorName, 'Convidado'));
    const donorEmail = cleanString(bid.donorEmail, '', 320);
    const guestId = cleanString(bid.guestId, '');
    const individualId = guestId
      ? safeDocumentId('guest', guestId)
      : anonymousIndividualId(donorEmail, bidId);

    const scopeRefs = [
      buildScope({
        db,
        scope: 'individual',
        id: individualId,
        name: displayName,
      }),
    ];

    const familyId = cleanString(bid.familyId, '');
    if (familyId && SAFE_ID.test(familyId)) {
      scopeRefs.push(
        buildScope({
          db,
          scope: 'family',
          id: safeDocumentId('family', familyId),
          name: cleanString(bid.familyName, 'Familia'),
        }),
      );
    }

    const scopeContexts: ScopeContext[] = [];
    for (const scopeRef of scopeRefs) {
      const [totalSnap, publicSnap] = await Promise.all([
        tx.get(scopeRef.totalRef),
        tx.get(scopeRef.publicRef),
      ]);

      scopeContexts.push({
        ...scopeRef,
        totalData: totalSnap.data() ?? {},
        publicData: publicSnap.data() ?? {},
      });
    }

    for (const context of scopeContexts) {
      writeScope({
        tx,
        FieldValue,
        context,
        amountCents,
        completedAt,
      });
    }

    tx.update(bidRef, {
      aggregatedAt: FieldValue.serverTimestamp(),
      aggregationVersion: AGGREGATION_VERSION,
    });

    return { aggregated: true };
  });
}
