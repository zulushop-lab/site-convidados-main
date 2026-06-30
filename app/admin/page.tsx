'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Database,
  FileSpreadsheet,
  Link2,
  Loader2,
  LogOut,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { signOutFromFirebase } from '@/lib/firebase';
import { cn } from '@/lib/utils';

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'unknown';
type PaymentType = 'gift' | 'tie_bid';
type Tone = 'neutral' | 'warning' | 'success' | 'info' | 'danger';
type PendingFamilyType = 'first_lot' | 'extra';

interface StatusBucket {
  count: number;
  amount: number;
}

interface PendingGuest {
  id: string;
  name: string;
  isChild: boolean;
  isMainGuest: boolean;
}

interface PendingFamily {
  id: string;
  name: string;
  guestsCount: number;
  listType?: PendingFamilyType;
  guests?: PendingGuest[];
}

interface OperationalOverview {
  available: boolean;
  sourceXlsx: string | null;
  firstLotFamilies: number;
  firstLotGuests: number;
  dispatchChannels: number;
  pendingGroups: number;
  linksReady: boolean;
  firebaseFamilies: number;
  registeredFirstLotFamilies: number;
  extraFirebaseFamilies: number;
  firebaseDispatchChannels: number;
  familiesWithLinks: number;
  firstLotFamiliesWithLinks: number;
  sentFamilies: number;
  firstLotFamilyIds: string[];
  funnel: Array<{
    label: string;
    value: number;
  }>;
  dispatchStatusCounts: Record<string, number>;
  pendingGroupList: Array<{
    id: string;
    name: string;
    names: string;
    status: string;
  }>;
}

interface AdminOverview {
  adminEmail: string;
  generatedAt: string;
  operations: OperationalOverview;
  rsvp: {
    totalFamilies: number;
    confirmedFamilies: number;
    pendingFamilies: number;
    pendingFirstLotFamilies?: number;
    pendingExtraFamilies?: number;
    totalGuests: number;
    confirmedGuests: number;
    pendingGuests: number;
    childGuests: number;
    recent: Array<{
      id: string;
      familyName: string;
      attendeesCount: number;
      attendees: string[];
      confirmedBy: string;
      createdAt: string | null;
    }>;
    pendingFamilyList: PendingFamily[];
  };
  payments: {
    summary: Record<PaymentStatus, StatusBucket>;
    totalCount: number;
    completedAmount: number;
    pendingAmount: number;
    recent: Array<{
      id: string;
      type: PaymentType;
      status: PaymentStatus;
      amount: number;
      donorName: string;
      donorEmail: string;
      label: string;
      createdAt: string | null;
    }>;
  };
}

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

const toneClasses: Record<
  Tone,
  {
    panel: string;
    icon: string;
    pill: string;
    accent: string;
    progress: string;
  }
> = {
  neutral: {
    panel: 'bg-surface-container-lowest ring-outline-variant/10',
    icon: 'bg-outline-variant/15 text-on-surface',
    pill: 'bg-surface-container text-on-surface-variant ring-outline-variant/20',
    accent: 'bg-outline',
    progress: 'bg-outline',
  },
  warning: {
    panel: 'bg-amber-500/10 ring-amber-500/25',
    icon: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
    pill: 'bg-amber-500/10 text-amber-800 ring-amber-500/30 dark:text-amber-200',
    accent: 'bg-amber-500',
    progress: 'bg-amber-500',
  },
  success: {
    panel: 'bg-emerald-500/10 ring-emerald-500/25',
    icon: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
    pill: 'bg-emerald-500/10 text-emerald-800 ring-emerald-500/30 dark:text-emerald-200',
    accent: 'bg-emerald-500',
    progress: 'bg-emerald-500',
  },
  info: {
    panel: 'bg-sky-500/10 ring-sky-500/25',
    icon: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
    pill: 'bg-sky-500/10 text-sky-800 ring-sky-500/30 dark:text-sky-200',
    accent: 'bg-sky-500',
    progress: 'bg-sky-500',
  },
  danger: {
    panel: 'bg-rose-500/10 ring-rose-500/25',
    icon: 'bg-rose-500/15 text-rose-800 dark:text-rose-200',
    pill: 'bg-rose-500/10 text-rose-800 ring-rose-500/30 dark:text-rose-200',
    accent: 'bg-rose-500',
    progress: 'bg-rose-500',
  },
};

function formatDate(value: string | null): string {
  if (!value) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatStatus(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Concluido',
    failed: 'Falhou',
    unknown: 'Indefinido',
  };

  return labels[status];
}

function formatPaymentType(type: PaymentType): string {
  return type === 'tie_bid' ? 'Gravata' : 'Presente';
}

function formatPercent(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((current / total) * 100);
}

function compactStatus(status: string): string {
  return status
    .replaceAll('_', ' ')
    .replaceAll(';', ' / ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fileLabel(value: string | null): string {
  if (!value) return 'Sem arquivo local';
  return value.split(/[\\/]/).pop() ?? value;
}

function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-md px-2.5 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.12em] ring-1',
        toneClasses[tone].pill,
      )}
    >
      {children}
    </span>
  );
}

function LinearProgress({ value, tone = 'neutral' }: { value: number; tone?: Tone }) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-outline-variant/15">
      <div
        className={cn('h-full rounded-full transition-all', toneClasses[tone].progress)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  meta,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  meta?: string;
  tone?: Tone;
}) {
  return (
    <article
      className={cn(
        'relative min-h-[168px] overflow-hidden rounded-lg p-4 shadow-sm ring-1 sm:p-5',
        toneClasses[tone].panel,
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', toneClasses[tone].accent)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            {label}
          </p>
          <p className="mt-4 break-words font-label text-3xl font-semibold leading-none text-on-surface sm:text-4xl">
            {value}
          </p>
        </div>
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', toneClasses[tone].icon)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 font-label text-sm leading-relaxed text-on-surface-variant">{detail}</p>
      {meta && (
        <p className="mt-3 font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">
          {meta}
        </p>
      )}
    </article>
  );
}

function Gauge({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  detail: string;
  tone?: Tone;
}) {
  const color = {
    neutral: 'rgba(119, 124, 121, 0.86)',
    warning: 'rgba(245, 158, 11, 0.95)',
    success: 'rgba(16, 185, 129, 0.95)',
    info: 'rgba(14, 165, 233, 0.95)',
    danger: 'rgba(244, 63, 94, 0.95)',
  }[tone];
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <article className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10">
      <div
        className="grid h-20 w-20 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(120, 120, 120, 0.14) 0deg)`,
        }}
        aria-label={`${label}: ${clamped}%`}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-background shadow-inner">
          <span className="font-label text-xs font-semibold uppercase tracking-[0.08em] text-on-surface">
            {clamped}%
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
          {label}
        </p>
        <p className="mt-2 font-label text-sm leading-relaxed text-on-surface-variant">{detail}</p>
      </div>
    </article>
  );
}

function Funnel({
  steps,
}: {
  steps: Array<{ label: string; value: number; tone?: Tone }>;
}) {
  const max = Math.max(1, ...steps.map((step) => step.value));

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
      {steps.map((step, index) => {
        const tone = step.tone ?? 'neutral';
        const width = Math.round((step.value / max) * 100);

        return (
          <article
            key={`${step.label}-${index}`}
            className="rounded-lg bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">
                {index + 1}. {step.label}
              </p>
              <span className={cn('mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full', toneClasses[tone].accent)} />
            </div>
            <p className="mt-4 font-label text-3xl font-semibold leading-none text-on-surface">
              {numberFormatter.format(step.value)}
            </p>
            <div className="mt-4">
              <LinearProgress value={width} tone={tone} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EmptyState({
  title,
  detail,
  tone = 'neutral',
  icon: Icon = AlertTriangle,
}: {
  title: string;
  detail: string;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <div className={cn('rounded-lg p-5 ring-1', toneClasses[tone].panel)}>
      <div className="flex items-start gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', toneClasses[tone].icon)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-label text-sm font-semibold text-on-surface">{title}</p>
          <p className="mt-1 font-label text-sm leading-relaxed text-on-surface-variant">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function SectionShell({
  title,
  eyebrow,
  detail,
  icon: Icon,
  aside,
  children,
}: {
  title: string;
  eyebrow: string;
  detail?: string;
  icon: LucideIcon;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10 sm:p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2.5 text-secondary">
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="font-label text-[10px] font-semibold uppercase tracking-[0.18em]">
              {eyebrow}
            </span>
          </div>
          <h2 className="font-label text-xl font-semibold leading-tight text-on-surface sm:text-2xl">
            {title}
          </h2>
          {detail && (
            <p className="mt-2 max-w-3xl font-label text-sm leading-relaxed text-on-surface-variant">
              {detail}
            </p>
          )}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function PendingFamilyCard({
  family,
  isOpen,
  onToggle,
}: {
  family: PendingFamily;
  isOpen: boolean;
  onToggle: (familyId: string) => void;
}) {
  const guests = family.guests ?? [];
  const isExtra = family.listType === 'extra';
  const preview = guests.length
    ? `${guests.slice(0, 3).map((guest) => guest.name).join(', ')}${guests.length > 3 ? ` +${guests.length - 3}` : ''}`
    : 'Integrantes nao encontrados no cadastro.';

  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm ring-1',
        isExtra ? 'ring-amber-500/25' : 'ring-outline-variant/10',
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(family.id)}
        aria-expanded={isOpen}
        aria-controls={`family-guests-${family.id}`}
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-label text-sm font-semibold leading-snug text-on-surface">
              {family.name}
            </h3>
            {isExtra && <StatusPill tone="warning">Lista extra</StatusPill>}
          </div>
          <p className="mt-2 break-words font-label text-xs leading-relaxed text-on-surface-variant">
            {preview}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-md bg-surface-container px-2 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
            {family.guestsCount} pessoa(s)
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-secondary transition-transform', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </div>
      </button>

      <div id={`family-guests-${family.id}`} hidden={!isOpen} className="px-4 pb-4">
        {guests.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {guests.map((guest) => (
              <li
                key={guest.id}
                className="flex min-w-0 items-start gap-3 rounded-lg bg-surface-container-low p-3"
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    guest.isChild ? 'bg-sky-500' : guest.isMainGuest ? 'bg-emerald-500' : 'bg-outline',
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="break-words font-label text-sm font-medium leading-snug text-on-surface">
                    {guest.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {guest.isMainGuest && <StatusPill tone="success">Responsavel principal</StatusPill>}
                    {guest.isChild && <StatusPill tone="info">Crianca</StatusPill>}
                    {!guest.isMainGuest && !guest.isChild && <StatusPill>Convidado</StatusPill>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Sem integrantes vinculados"
            detail="A familia existe no cadastro, mas a lista de convidados nao veio na resposta."
            tone="warning"
          />
        )}
      </div>
    </article>
  );
}

function PendingFamilyGroup({
  title,
  detail,
  families,
  openFamilyIds,
  onToggle,
}: {
  title: string;
  detail: string;
  families: PendingFamily[];
  openFamilyIds: Set<string>;
  onToggle: (familyId: string) => void;
}) {
  if (families.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-label text-sm font-semibold text-on-surface">{title}</h3>
          <p className="font-label text-xs leading-relaxed text-on-surface-variant">{detail}</p>
        </div>
        <StatusPill tone="warning">{families.length} em aberto</StatusPill>
      </div>
      <div className="grid gap-3">
        {families.map((family) => (
          <PendingFamilyCard
            key={family.id}
            family={family}
            isOpen={openFamilyIds.has(family.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function PendingListBlock({
  title,
  detail,
  groupedFamilies,
  individualInvites,
  openFamilyIds,
  onToggle,
}: {
  title: string;
  detail: string;
  groupedFamilies: PendingFamily[];
  individualInvites: PendingFamily[];
  openFamilyIds: Set<string>;
  onToggle: (familyId: string) => void;
}) {
  if (groupedFamilies.length === 0 && individualInvites.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-outline-variant/10 pt-5 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-label text-base font-semibold text-on-surface">{title}</h3>
          <p className="font-label text-xs leading-relaxed text-on-surface-variant">{detail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="warning">{groupedFamilies.length} familia(s)</StatusPill>
          <StatusPill tone="info">{individualInvites.length} individual(is)</StatusPill>
        </div>
      </div>

      <PendingFamilyGroup
        title="Familias"
        detail="Grupos com duas ou mais pessoas no mesmo convite."
        families={groupedFamilies}
        openFamilyIds={openFamilyIds}
        onToggle={onToggle}
      />
      <PendingFamilyGroup
        title="Convites individuais"
        detail="Familias com apenas uma pessoa no grupo."
        families={individualInvites}
        openFamilyIds={openFamilyIds}
        onToggle={onToggle}
      />
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [openFamilyIds, setOpenFamilyIds] = useState<Set<string>>(new Set());

  const fetchOverview = useCallback(async () => {
    if (!user || user.isAnonymous || !isAdmin) return;

    setIsFetching(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/overview', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await response.json().catch(() => ({}))) as AdminOverview & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel carregar o painel.');
      }

      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar o painel.');
    } finally {
      setIsFetching(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.isAnonymous || !isAdmin) {
      router.replace('/admin/login');
    }
  }, [isAdmin, isLoading, router, user]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (!overview?.rsvp.pendingFamilyList.length) return;

    setOpenFamilyIds((current) => {
      if (current.size > 0) return current;
      return new Set([overview.rsvp.pendingFamilyList[0].id]);
    });
  }, [overview?.rsvp.pendingFamilyList]);

  const toggleFamily = useCallback((familyId: string) => {
    setOpenFamilyIds((current) => {
      const next = new Set(current);
      if (next.has(familyId)) {
        next.delete(familyId);
      } else {
        next.add(familyId);
      }
      return next;
    });
  }, []);

  const rsvpRate = useMemo(() => {
    if (!overview?.rsvp.totalFamilies) return 0;
    return Math.round((overview.rsvp.confirmedFamilies / overview.rsvp.totalFamilies) * 100);
  }, [overview]);

  const plannedFamilies = overview?.operations.available
    ? overview.operations.firstLotFamilies
    : overview?.rsvp.totalFamilies ?? 0;
  const registeredFirstLotFamilies = overview
    ? overview.operations.registeredFirstLotFamilies ?? overview.rsvp.totalFamilies
    : 0;
  const cadastroCoverage = overview ? formatPercent(registeredFirstLotFamilies, plannedFamilies) : 0;
  const cadastroGap = overview ? Math.max(plannedFamilies - registeredFirstLotFamilies, 0) : 0;
  const dispatchPendingCadastro = overview?.operations.dispatchStatusCounts.pendente_seed_rsvp ?? 0;
  const paymentOpenCount = overview
    ? overview.payments.summary.pending.count + overview.payments.summary.processing.count
    : 0;
  const firstLotFamiliesWithLinks = overview
    ? overview.operations.firstLotFamiliesWithLinks ?? overview.operations.familiesWithLinks
    : 0;
  const linksGap = overview ? Math.max(plannedFamilies - firstLotFamiliesWithLinks, 0) : 0;
  const linksCoverage = overview ? formatPercent(firstLotFamiliesWithLinks, plannedFamilies) : 0;
  const canSendInvites = overview
    ? cadastroGap === 0 && linksGap === 0 && overview.operations.dispatchChannels > 0
    : false;
  const pendingFamilyList = overview?.rsvp.pendingFamilyList ?? [];
  const pendingFirstLotFamilies = pendingFamilyList.filter((family) => family.listType !== 'extra');
  const pendingExtraFamilies = pendingFamilyList.filter((family) => family.listType === 'extra');
  const firstLotGroupedFamilies = pendingFirstLotFamilies.filter((family) => family.guestsCount > 1);
  const firstLotIndividualInvites = pendingFirstLotFamilies.filter((family) => family.guestsCount <= 1);
  const extraGroupedFamilies = pendingExtraFamilies.filter((family) => family.guestsCount > 1);
  const extraIndividualInvites = pendingExtraFamilies.filter((family) => family.guestsCount <= 1);
  const noConfirmationsYet = (overview?.rsvp.confirmedFamilies ?? 0) === 0;

  const executiveStatus = canSendInvites
    ? {
        title: 'Links reais prontos para conferencia final',
        detail:
          'O primeiro lote esta cadastrado no site e os links existem. O proximo passo ainda e revisao humana antes de qualquer WhatsApp.',
        tone: 'success' as Tone,
        pill: 'Conferir antes de enviar',
      }
    : {
        title: 'Nao enviar WhatsApp ainda',
        detail:
          cadastroGap > 0
            ? `${cadastroGap} familia(s) do primeiro lote ainda precisam aparecer no cadastro do site.`
            : `${linksGap} familia(s) ainda precisam de link real antes das mensagens prontas.`,
        tone: 'warning' as Tone,
        pill: 'Proximo passo pendente',
      };

  const funnelSteps = overview
    ? overview.operations.funnel.map((step) => ({
        ...step,
        tone:
          step.label === 'Base revisada' || step.label === 'Mensagens prontas'
            ? 'success' as Tone
            : step.value > 0 && step.value >= plannedFamilies
              ? 'success' as Tone
              : step.value > 0
                ? 'warning' as Tone
                : 'neutral' as Tone,
      }))
    : [];

  const handleSignOut = async () => {
    await signOutFromFirebase();
    router.replace('/admin/login');
  };

  if (isLoading || (!overview && isFetching)) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-28 font-label">
        <div className="rounded-lg bg-surface-container-lowest p-5 shadow-sm ring-1 ring-outline-variant/10">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Carregando painel dos noivos
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden px-3 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-24 font-label sm:px-5 md:px-8 md:pb-28 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-lg bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10 sm:p-5 md:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 rounded-md px-1 text-xs font-semibold uppercase tracking-[0.12em] text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar ao site
              </Link>
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusPill tone="info">Painel somente leitura</StatusPill>
                {overview && <StatusPill>Atualizado {formatDate(overview.generatedAt)}</StatusPill>}
              </div>
              <h1 className="mt-4 max-w-4xl font-label text-3xl font-semibold leading-tight text-on-surface sm:text-4xl md:text-5xl">
                Cockpit dos noivos
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
                Visao operacional da lista, dos links reais, das confirmacoes e dos pagamentos, sem misturar o primeiro lote com a lista extra.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <button
                type="button"
                onClick={fetchOverview}
                disabled={isFetching}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-surface-container px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary ring-1 ring-outline-variant/20 transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )}
                Atualizar
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-surface-container px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary ring-1 ring-outline-variant/20 transition-colors hover:bg-surface-container-high"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            </div>
          </div>
        </header>

        {error && (
          <EmptyState
            title="Erro ao carregar o painel"
            detail={error}
            tone="danger"
            icon={AlertTriangle}
          />
        )}

        {overview && (
          <>
            <section className={cn('rounded-lg p-4 shadow-sm ring-1 sm:p-5 md:p-6', toneClasses[executiveStatus.tone].panel)}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 max-w-4xl">
                  <div className="mb-3 flex items-center gap-3 text-secondary">
                    {executiveStatus.tone === 'success' ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                      Proximo passo
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold leading-tight text-on-surface sm:text-3xl">
                    {executiveStatus.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                    {executiveStatus.detail}
                  </p>
                </div>
                <StatusPill tone={executiveStatus.tone}>{executiveStatus.pill}</StatusPill>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon={Database}
                label="Cadastro no site"
                value={`${cadastroCoverage}%`}
                detail={`${registeredFirstLotFamilies} de ${plannedFamilies} familias do primeiro lote estao cadastradas.`}
                meta={cadastroGap > 0 ? `${cadastroGap} familia(s) faltando` : 'Primeiro lote alinhado'}
                tone={cadastroGap > 0 ? 'warning' : 'success'}
              />
              <KpiCard
                icon={Link2}
                label="Links reais"
                value={`${linksCoverage}%`}
                detail={`${firstLotFamiliesWithLinks} familia(s) do primeiro lote com link persistido.`}
                meta={linksGap > 0 ? `${linksGap} link(s) pendente(s)` : 'Links prontos'}
                tone={linksGap > 0 ? 'warning' : 'success'}
              />
              <KpiCard
                icon={UserCheck}
                label="Confirmacoes"
                value={`${rsvpRate}%`}
                detail={`${overview.rsvp.confirmedFamilies} de ${overview.rsvp.totalFamilies} familias responderam pelo site.`}
                meta={noConfirmationsYet ? 'Sem confirmacoes ainda' : `${overview.rsvp.pendingFamilies} familia(s) sem RSVP`}
                tone={noConfirmationsYet ? 'neutral' : 'info'}
              />
              <KpiCard
                icon={MessageSquareText}
                label="Mensagens prontas"
                value={numberFormatter.format(overview.operations.dispatchChannels)}
                detail={`${overview.operations.firebaseDispatchChannels} canal(is) no cadastro do site.`}
                meta={overview.operations.linksReady ? 'Links reais disponiveis' : `${dispatchPendingCadastro} canal(is) aguardando link`}
                tone={overview.operations.linksReady ? 'success' : 'warning'}
              />
            </section>

            <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <Gauge
                label="Cadastro no site"
                value={cadastroCoverage}
                detail={`${registeredFirstLotFamilies} de ${plannedFamilies} familias do primeiro lote.`}
                tone={cadastroGap > 0 ? 'warning' : 'success'}
              />
              <Gauge
                label="Links reais"
                value={linksCoverage}
                detail={`${firstLotFamiliesWithLinks} familia(s) com codigo pronto para mensagem.`}
                tone={linksGap > 0 ? 'warning' : 'success'}
              />
              <Gauge
                label="Confirmacoes"
                value={rsvpRate}
                detail={`${overview.rsvp.confirmedGuests} de ${overview.rsvp.totalGuests} convidados confirmados.`}
                tone={rsvpRate > 0 ? 'info' : 'neutral'}
              />
            </section>

            <SectionShell
              title="Funil de convites"
              eyebrow="Da lista revisada ao RSVP"
              detail="Os numeros mostram o primeiro lote como base principal. Lista extra fica separada para nao inflar a cobertura."
              icon={FileSpreadsheet}
              aside={<StatusPill>Arquivo: {fileLabel(overview.operations.sourceXlsx)}</StatusPill>}
            >
              {funnelSteps.length > 0 ? (
                <Funnel steps={funnelSteps} />
              ) : (
                <EmptyState
                  title="Resumo operacional ausente"
                  detail="O painel carregou o cadastro do site, mas nao encontrou os arquivos locais do funil."
                  tone="warning"
                />
              )}
            </SectionShell>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <SectionShell
                title="Status operacional"
                eyebrow="Checklist"
                detail="A ordem correta e cadastro no site, links reais, conferencia humana e so depois mensagens."
                icon={ShieldCheck}
              >
                <div className="grid gap-3">
                  {[
                    {
                      label: 'Base revisada',
                      detail: `${overview.operations.firstLotGuests} convidados em ${overview.operations.firstLotFamilies} familias do primeiro lote.`,
                      progress: overview.operations.available ? 100 : 0,
                      done: overview.operations.available,
                    },
                    {
                      label: 'Cadastro no site',
                      detail: cadastroGap > 0 ? `${cadastroGap} familia(s) ainda fora do cadastro.` : 'Primeiro lote cadastrado.',
                      progress: cadastroCoverage,
                      done: cadastroGap === 0 && plannedFamilies > 0,
                    },
                    {
                      label: 'Links reais',
                      detail: overview.operations.linksReady
                        ? 'Links reais disponiveis para as mensagens prontas.'
                        : `${dispatchPendingCadastro} canal(is) ainda aguardam codigo persistido.`,
                      progress: linksCoverage,
                      done: overview.operations.linksReady,
                    },
                  ].map((item) => (
                    <article key={item.label} className="rounded-lg bg-surface-container-low p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface">{item.label}</p>
                          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{item.detail}</p>
                        </div>
                        <StatusPill tone={item.done ? 'success' : 'warning'}>
                          {item.done ? 'OK' : 'Pendente'}
                        </StatusPill>
                      </div>
                      <div className="mt-4">
                        <LinearProgress value={item.progress} tone={item.done ? 'success' : 'warning'} />
                      </div>
                    </article>
                  ))}
                </div>
              </SectionShell>

              <SectionShell
                title="Lista extra"
                eyebrow="Fora do primeiro lote"
                detail={`${overview.operations.extraFirebaseFamilies} familia(s) ja existem no site fora do primeiro lote. Os grupos abaixo seguem fora do disparo inicial.`}
                icon={Users}
                aside={<StatusPill tone={overview.operations.pendingGroupList.length > 0 ? 'warning' : 'neutral'}>{overview.operations.pendingGroupList.length} grupo(s)</StatusPill>}
              >
                <div className="grid gap-3">
                  {overview.operations.pendingGroupList.length > 0 ? (
                    overview.operations.pendingGroupList.map((group) => (
                      <article key={group.id} className="rounded-lg bg-surface-container-low p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-semibold text-on-surface">{group.name}</h3>
                            <p className="mt-2 break-words text-xs leading-relaxed text-on-surface-variant">
                              {group.names}
                            </p>
                          </div>
                          <StatusPill>{compactStatus(group.status)}</StatusPill>
                        </div>
                      </article>
                    ))
                  ) : (
                    <EmptyState
                      title="Nenhum grupo extra pendente"
                      detail="Nao ha grupos adicionais no arquivo operacional local."
                      tone="success"
                      icon={CheckCircle2}
                    />
                  )}
                </div>
              </SectionShell>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
              <SectionShell
                title="Familias sem confirmacao"
                eyebrow="RSVP em aberto"
                detail="Separado por lista e por tipo de convite. Cada cartao abre os integrantes, incluindo criancas e responsavel principal quando informado."
                icon={Users}
                aside={
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="warning">{pendingFirstLotFamilies.length} primeiro lote</StatusPill>
                    <StatusPill tone="info">
                      {firstLotIndividualInvites.length + extraIndividualInvites.length} individual(is)
                    </StatusPill>
                    {pendingExtraFamilies.length > 0 && (
                      <StatusPill tone="warning">{pendingExtraFamilies.length} lista extra</StatusPill>
                    )}
                  </div>
                }
              >
                <div className="grid gap-6">
                  {pendingFamilyList.length > 0 ? (
                    <>
                      <PendingListBlock
                        title="Primeiro lote"
                        detail="Familias planejadas para o disparo inicial."
                        groupedFamilies={firstLotGroupedFamilies}
                        individualInvites={firstLotIndividualInvites}
                        openFamilyIds={openFamilyIds}
                        onToggle={toggleFamily}
                      />
                      <PendingListBlock
                        title="Lista extra no site"
                        detail="Familias cadastradas fora do primeiro lote, preservadas no painel."
                        groupedFamilies={extraGroupedFamilies}
                        individualInvites={extraIndividualInvites}
                        openFamilyIds={openFamilyIds}
                        onToggle={toggleFamily}
                      />
                    </>
                  ) : (
                    <EmptyState
                      title="Todas as familias cadastradas ja confirmaram"
                      detail="Nao ha RSVP pendente no cadastro atual."
                      tone="success"
                      icon={CheckCircle2}
                    />
                  )}
                </div>
              </SectionShell>

              <SectionShell
                title="Confirmacoes recentes"
                eyebrow="Respostas no site"
                detail={noConfirmationsYet ? 'Ainda nao chegou nenhuma confirmacao.' : `Atualizado em ${formatDate(overview.generatedAt)}.`}
                icon={UserCheck}
              >
                <div className="grid gap-3">
                  {overview.rsvp.recent.length > 0 ? (
                    overview.rsvp.recent.map((rsvp) => (
                      <article key={rsvp.id} className="rounded-lg bg-surface-container-low p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-semibold text-on-surface">
                              {rsvp.familyName}
                            </h3>
                            <p className="mt-2 break-words text-sm leading-relaxed text-on-surface-variant">
                              {rsvp.attendeesCount} confirmado(s)
                              {rsvp.attendees.length > 0 ? `: ${rsvp.attendees.join(', ')}` : ''}
                            </p>
                            {rsvp.confirmedBy && (
                              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">
                                Por {rsvp.confirmedBy}
                              </p>
                            )}
                          </div>
                          <time className="text-xs text-on-surface-variant sm:text-right">
                            {formatDate(rsvp.createdAt)}
                          </time>
                        </div>
                      </article>
                    ))
                  ) : (
                    <EmptyState
                      title="Sem confirmacoes ainda"
                      detail="Quando os convidados responderem pelo site, os ultimos registros aparecem aqui."
                      tone="neutral"
                      icon={Clock3}
                    />
                  )}
                </div>
              </SectionShell>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(280px,0.4fr)_minmax(0,0.6fr)]">
              <SectionShell
                title="Pagamentos"
                eyebrow="Presentes e gravata"
                detail={`${overview.payments.totalCount} registro(s), com ${paymentOpenCount} em aberto.`}
                icon={CreditCard}
              >
                <div className="grid gap-3">
                  {(['completed', 'pending', 'processing', 'failed', 'unknown'] as PaymentStatus[]).map((status) => (
                    <article key={status} className="rounded-lg bg-surface-container-low p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                          <span className="text-sm font-semibold text-on-surface">{formatStatus(status)}</span>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-on-surface">
                            {brlFormatter.format(overview.payments.summary[status].amount)}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                            {overview.payments.summary[status].count} item(ns)
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </SectionShell>

              <SectionShell
                title="Movimentos recentes"
                eyebrow="Registros financeiros"
                detail="Entradas mais novas de presentes e gravata."
                icon={Clock3}
                aside={<StatusPill>{brlFormatter.format(overview.payments.pendingAmount)} em aberto</StatusPill>}
              >
                {overview.payments.recent.length > 0 ? (
                  <>
                    <div className="grid gap-3 md:hidden">
                      {overview.payments.recent.map((payment) => (
                        <article key={`${payment.type}-${payment.id}`} className="rounded-lg bg-surface-container-low p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                                {formatPaymentType(payment.type)} - {formatStatus(payment.status)}
                              </p>
                              <h3 className="mt-2 break-words text-sm font-semibold text-on-surface">{payment.label}</h3>
                              <p className="mt-1 break-words text-xs leading-relaxed text-on-surface-variant">
                                {payment.donorName}
                                {payment.donorEmail ? ` | ${payment.donorEmail}` : ''}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-on-surface">{brlFormatter.format(payment.amount)}</p>
                              <time className="mt-1 block text-[10px] text-on-surface-variant">
                                {formatDate(payment.createdAt)}
                              </time>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="hidden md:block">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-outline-variant/10 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">
                            <th className="px-3 py-3 font-semibold">Tipo</th>
                            <th className="px-3 py-3 font-semibold">Registro</th>
                            <th className="px-3 py-3 font-semibold">Status</th>
                            <th className="px-3 py-3 text-right font-semibold">Valor</th>
                            <th className="px-3 py-3 text-right font-semibold">Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {overview.payments.recent.map((payment) => (
                            <tr key={`${payment.type}-${payment.id}`} className="text-sm">
                              <td className="px-3 py-4 text-on-surface-variant">
                                {formatPaymentType(payment.type)}
                              </td>
                              <td className="px-3 py-4">
                                <p className="font-semibold text-on-surface">{payment.label}</p>
                                <p className="mt-1 break-words text-xs text-on-surface-variant">
                                  {payment.donorName}
                                  {payment.donorEmail ? ` | ${payment.donorEmail}` : ''}
                                </p>
                              </td>
                              <td className="px-3 py-4 text-on-surface-variant">
                                {formatStatus(payment.status)}
                              </td>
                              <td className="px-3 py-4 text-right font-semibold text-on-surface">
                                {brlFormatter.format(payment.amount)}
                              </td>
                              <td className="px-3 py-4 text-right text-on-surface-variant">
                                {formatDate(payment.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="Nenhum pagamento registrado"
                    detail="Quando houver presentes ou gravata, os registros aparecem aqui."
                    tone="neutral"
                    icon={CreditCard}
                  />
                )}
              </SectionShell>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
