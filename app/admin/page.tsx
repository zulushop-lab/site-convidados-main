'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  FileSpreadsheet,
  Loader2,
  LogOut,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { signOutFromFirebase } from '@/lib/firebase';

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'unknown';
type PaymentType = 'gift' | 'tie_bid';

interface StatusBucket {
  count: number;
  amount: number;
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
    pendingFamilyList: Array<{
      id: string;
      name: string;
      guestsCount: number;
    }>;
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

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  subdetail,
  tone = 'default',
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
  subdetail?: string;
  tone?: 'default' | 'warning' | 'success';
}) {
  const toneClass = {
    default: 'border-outline-variant/15 bg-surface-lowest',
    warning: 'border-primary/40 bg-primary/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
  }[tone];

  return (
    <div className={`min-h-36 border p-5 ${toneClass}`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="font-label text-[10px] uppercase tracking-[0.22em] text-secondary">
          {label}
        </span>
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <p className="font-headline text-4xl italic text-on-surface">{value}</p>
      <p className="mt-2 font-body text-sm text-on-surface-variant">{detail}</p>
      {subdetail && (
        <p className="mt-2 font-label text-[10px] uppercase tracking-[0.16em] text-secondary">
          {subdetail}
        </p>
      )}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden bg-outline-variant/15">
      <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}

function Gauge({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string;
  value: number;
  detail: string;
  tone?: 'default' | 'warning' | 'success';
}) {
  const color = {
    default: 'rgba(130, 112, 74, 0.9)',
    warning: 'rgba(184, 134, 11, 0.95)',
    success: 'rgba(52, 120, 86, 0.95)',
  }[tone];
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-4 border border-outline-variant/15 bg-surface-lowest p-4">
      <div
        className="grid h-20 w-20 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(120, 120, 120, 0.16) 0deg)`,
        }}
        aria-label={`${label}: ${clamped}%`}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-background">
          <span className="font-label text-xs uppercase tracking-[0.12em] text-on-surface">
            {clamped}%
          </span>
        </div>
      </div>
      <div>
        <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">{label}</p>
        <p className="mt-2 font-body text-sm leading-relaxed text-on-surface-variant">{detail}</p>
      </div>
    </div>
  );
}

function Funnel({ steps }: { steps: Array<{ label: string; value: number; tone?: 'default' | 'warning' | 'success' }> }) {
  const max = Math.max(...steps.map((step) => step.value), 1);

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-6">
      {steps.map((step, index) => {
        const tone = step.tone ?? 'default';
        const className = {
          default: 'border-outline-variant/15 bg-surface-lowest',
          warning: 'border-primary/40 bg-primary/5',
          success: 'border-emerald-500/30 bg-emerald-500/5',
        }[tone];

        return (
          <div key={`${step.label}-${index}`} className={`min-h-28 border p-4 ${className}`}>
            <p className="font-label text-[10px] uppercase tracking-[0.16em] text-secondary">
              {index + 1}. {step.label}
            </p>
            <p className="mt-4 font-headline text-3xl italic text-on-surface">
              {numberFormatter.format(step.value)}
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden bg-outline-variant/15">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.round((step.value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ children, tone = 'default' }: { children: string; tone?: 'default' | 'warning' | 'success' }) {
  const className = {
    default: 'border-outline-variant/20 text-on-surface-variant',
    warning: 'border-primary/40 bg-primary/5 text-primary',
    success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200',
  }[tone];

  return (
    <span className={`inline-flex w-fit items-center border px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.16em] ${className}`}>
      {children}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="p-5 font-body text-sm text-on-surface-variant">{message}</p>;
}
export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);

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
  const seedCoverage = overview ? formatPercent(registeredFirstLotFamilies, plannedFamilies) : 0;
  const seedGap = overview ? Math.max(plannedFamilies - registeredFirstLotFamilies, 0) : 0;
  const dispatchPendingSeed = overview?.operations.dispatchStatusCounts.pendente_seed_rsvp ?? 0;
  const paymentOpenCount = overview
    ? overview.payments.summary.pending.count + overview.payments.summary.processing.count
    : 0;
  const firstLotFamiliesWithLinks = overview
    ? overview.operations.firstLotFamiliesWithLinks ?? overview.operations.familiesWithLinks
    : 0;
  const linksGap = overview ? Math.max(plannedFamilies - firstLotFamiliesWithLinks, 0) : 0;
  const linksCoverage = overview ? formatPercent(firstLotFamiliesWithLinks, plannedFamilies) : 0;
  const canSendInvites = overview
    ? seedGap === 0 && linksGap === 0 && overview.operations.dispatchChannels > 0
    : false;
  const executiveStatus = canSendInvites
    ? {
        title: 'Convites prontos para conferencia final',
        detail: 'As familias do lote estao cadastradas e os links RSVP reais existem. Falta apenas conferencia humana antes de qualquer envio.',
        tone: 'success' as const,
      }
    : {
        title: 'Convites ainda nao prontos para envio',
        detail: seedGap > 0
          ? `${seedGap} familia(s) do primeiro lote ainda precisam ser cadastradas no site.`
          : `${linksGap} familia(s) ainda precisam de link RSVP real.`,
        tone: 'warning' as const,
      };
  const funnelSteps = overview
    ? overview.operations.funnel.map((step) => ({
        ...step,
        tone:
          step.label === 'Base revisada' || step.label === 'Mensagens prontas'
            ? 'success' as const
            : step.value > 0 && step.value >= plannedFamilies
              ? 'success' as const
              : step.value > 0
                ? 'warning' as const
                : 'default' as const,
      }))
    : [];

  const handleSignOut = async () => {
    await signOutFromFirebase();
    router.replace('/admin/login');
  };

  if (isLoading || (!overview && isFetching)) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-28">
        <div className="flex items-center gap-3 font-label text-xs uppercase tracking-[0.18em] text-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Carregando painel
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 pb-44 pt-28 md:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <header className="flex flex-col gap-6 border-b border-outline-variant/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 rounded-sm px-1 font-label text-xs uppercase tracking-widest text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar ao site
            </Link>
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <span className="font-label text-[10px] uppercase tracking-[0.28em]">
                Painel somente leitura
              </span>
            </div>
            <h1 className="mt-4 font-headline text-4xl italic leading-tight text-on-surface md:text-6xl">
              Gestao dos noivos
            </h1>
            <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-on-surface-variant">
              Leitura operacional separando lista revisada, cadastro no site, confirmacoes e pagamentos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={fetchOverview}
              disabled={isFetching}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-outline-variant/30 px-5 py-3 font-label text-xs uppercase tracking-[0.14em] text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
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
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-outline-variant/30 px-5 py-3 font-label text-xs uppercase tracking-[0.14em] text-primary transition-colors hover:bg-surface-container-low"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </div>
        </header>

        {error && (
          <section className="border border-outline-variant/20 bg-surface-container-low p-5 font-body text-sm text-on-surface-variant">
            {error}
          </section>
        )}

        {overview && (
          <>
            <section className={`border p-5 md:p-6 ${executiveStatus.tone === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-primary/40 bg-primary/5'}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl">
                  <div className="mb-3 flex items-center gap-3 text-primary">
                    {executiveStatus.tone === 'success' ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    )}
                    <span className="font-label text-[10px] uppercase tracking-[0.24em]">
                      Status dos convites
                    </span>
                  </div>
                  <h2 className="font-headline text-3xl italic leading-tight text-on-surface md:text-4xl">
                    {executiveStatus.title}
                  </h2>
                  <p className="mt-3 font-body text-sm leading-relaxed text-on-surface-variant">
                    {executiveStatus.detail}
                    {overview.operations.extraFirebaseFamilies > 0
                      ? ` Ha ${overview.operations.extraFirebaseFamilies} familia(s) ja no Firebase fora do primeiro lote; elas nao entram na cobertura do lote.`
                      : ''}
                  </p>
                </div>
                <StatusPill tone={executiveStatus.tone}>
                  {canSendInvites ? 'Conferir antes de enviar' : 'Nao enviar WhatsApp'}
                </StatusPill>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Gauge
                label="Cadastro no site"
                value={seedCoverage}
                detail={`${registeredFirstLotFamilies} de ${plannedFamilies} familias do primeiro lote ja existem no site.`}
                tone={seedGap > 0 ? 'warning' : 'success'}
              />
              <Gauge
                label="Links RSVP reais"
                value={linksCoverage}
                detail={`${firstLotFamiliesWithLinks} familia(s) do primeiro lote com codigo persistido.`}
                tone={linksGap > 0 ? 'warning' : 'success'}
              />
              <Gauge
                label="Confirmacoes"
                value={rsvpRate}
                detail={`${overview.rsvp.confirmedFamilies} familia(s) responderam pelo site.`}
                tone={rsvpRate > 0 ? 'success' : 'default'}
              />
            </section>

            <section className="border border-outline-variant/15 bg-surface-lowest p-5 md:p-6">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-3 text-primary">
                    <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
                    <span className="font-label text-[10px] uppercase tracking-[0.24em]">
                      Funil de convites
                    </span>
                  </div>
                  <h2 className="font-headline text-2xl italic text-on-surface">Do arquivo revisado ate a confirmacao</h2>
                </div>
                <p className="font-body text-xs text-on-surface-variant">
                  Fonte: {overview.operations.sourceXlsx ?? 'Firebase'}
                </p>
              </div>
              <Funnel steps={funnelSteps} />
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric
                icon={Database}
                label="No site"
                value={`${seedCoverage}%`}
                detail={`${registeredFirstLotFamilies} de ${plannedFamilies} familias do lote cadastradas`}
                subdetail={seedGap > 0 ? `${seedGap} familia(s) faltando` : 'Cadastro alinhado'}
                tone={seedGap > 0 ? 'warning' : 'success'}
              />
              <Metric
                icon={UserCheck}
                label="Confirmacoes"
                value={`${rsvpRate}%`}
                detail={`${overview.rsvp.confirmedFamilies} de ${overview.rsvp.totalFamilies} familias responderam`}
                subdetail={`${overview.rsvp.pendingFamilies} familia(s) sem RSVP`}
              />
              <Metric
                icon={MessageSquareText}
                label="Mensagens"
                value={numberFormatter.format(overview.operations.dispatchChannels)}
                detail="telefones unicos cadastrados"
                subdetail={overview.operations.linksReady ? 'links reais disponiveis' : 'aguardando links reais'}
                tone={overview.operations.linksReady ? 'success' : 'warning'}
              />
              <Metric
                icon={Clock3}
                label="Em aberto"
                value={brlFormatter.format(overview.payments.pendingAmount)}
                detail={`${paymentOpenCount} pagamento(s) pendente(s)`}
              />
            </section>

            <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
              <div className="border border-outline-variant/15 bg-surface-lowest">
                <div className="border-b border-outline-variant/15 p-5">
                  <h2 className="font-headline text-2xl italic text-on-surface">Checklist operacional</h2>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    Ordem correta antes de WhatsApp: cadastrar no site, gerar links reais, conferir e so depois enviar.
                  </p>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {[
                    {
                      label: 'Base revisada',
                      detail: `${overview.operations.firstLotGuests} convidados, ${overview.operations.firstLotFamilies} familias no primeiro lote`,
                      done: overview.operations.available,
                    },
                    {
                      label: 'Cadastro no site',
                      detail: seedGap > 0 ? `${seedGap} familia(s) ainda precisam entrar no site` : 'Familias planejadas cadastradas',
                      done: seedGap === 0 && plannedFamilies > 0,
                    },
                    {
                      label: 'Links RSVP',
                      detail: overview.operations.linksReady
                        ? 'Links reais disponiveis'
                        : `${dispatchPendingSeed} canal(is) aguardando codigo persistido`,
                      done: overview.operations.linksReady,
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 p-5">
                      <div>
                        <p className="font-body text-sm font-medium text-on-surface">{item.label}</p>
                        <p className="mt-1 font-body text-xs leading-relaxed text-on-surface-variant">
                          {item.detail}
                        </p>
                      </div>
                      <StatusPill tone={item.done ? 'success' : 'warning'}>
                        {item.done ? 'OK' : 'Pendente'}
                      </StatusPill>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-outline-variant/15 bg-surface-lowest">
                <div className="border-b border-outline-variant/15 p-5">
                  <h2 className="font-headline text-2xl italic text-on-surface">Fora do primeiro lote</h2>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    Lista extra mantida fora do disparo inicial.
                  </p>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {overview.operations.pendingGroupList.length > 0 ? (
                    overview.operations.pendingGroupList.map((group) => (
                      <div key={group.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
                        <div>
                          <p className="font-body text-sm font-medium text-on-surface">{group.name}</p>
                          <p className="mt-1 break-words font-body text-xs leading-relaxed text-on-surface-variant">
                            {group.names}
                          </p>
                        </div>
                        <StatusPill>{compactStatus(group.status)}</StatusPill>
                      </div>
                    ))
                  ) : (
                    <EmptyState message="Nenhum grupo pendente informado no artefato operacional." />
                  )}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              <div className="border border-outline-variant/15 bg-surface-lowest">
                <div className="border-b border-outline-variant/15 p-5">
                  <h2 className="font-headline text-2xl italic text-on-surface">Confirmacoes recentes</h2>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    Atualizado em {formatDate(overview.generatedAt)}
                  </p>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {overview.rsvp.recent.length > 0 ? (
                    overview.rsvp.recent.map((rsvp) => (
                      <article key={rsvp.id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_160px]">
                        <div>
                          <h3 className="font-body text-base font-medium text-on-surface">
                            {rsvp.familyName}
                          </h3>
                          <p className="mt-1 font-body text-sm text-on-surface-variant">
                            {rsvp.attendeesCount} confirmado(s)
                            {rsvp.attendees.length > 0 ? `: ${rsvp.attendees.join(', ')}` : ''}
                          </p>
                          {rsvp.confirmedBy && (
                            <p className="mt-2 font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                              Confirmado por {rsvp.confirmedBy}
                            </p>
                          )}
                        </div>
                        <time className="font-body text-sm text-on-surface-variant md:text-right">
                          {formatDate(rsvp.createdAt)}
                        </time>
                      </article>
                    ))
                  ) : (
                    <p className="p-5 font-body text-sm text-on-surface-variant">
                      Nenhuma confirmacao registrada.
                    </p>
                  )}
                </div>
              </div>

              <div className="border border-outline-variant/15 bg-surface-lowest">
                <div className="border-b border-outline-variant/15 p-5">
                  <h2 className="font-headline text-2xl italic text-on-surface">Familias sem confirmacao</h2>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    {overview.rsvp.pendingFamilies} familia(s) sem RSVP
                  </p>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {overview.rsvp.pendingFamilyList.length > 0 ? (
                    overview.rsvp.pendingFamilyList.map((family) => (
                      <div key={family.id} className="flex items-center justify-between gap-4 p-4">
                        <span className="font-body text-sm text-on-surface">{family.name}</span>
                        <span className="shrink-0 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                          {family.guestsCount} convidado(s)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="p-5 font-body text-sm text-on-surface-variant">
                      Todas as familias cadastradas ja confirmaram.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="border border-outline-variant/15 bg-surface-lowest">
                <div className="border-b border-outline-variant/15 p-5">
                  <h2 className="font-headline text-2xl italic text-on-surface">Pagamentos</h2>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    {overview.payments.totalCount} registro(s)
                  </p>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {(['completed', 'pending', 'processing', 'failed', 'unknown'] as PaymentStatus[]).map((status) => (
                    <div key={status} className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="font-body text-sm text-on-surface">{formatStatus(status)}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-body text-sm text-on-surface">
                          {brlFormatter.format(overview.payments.summary[status].amount)}
                        </p>
                        <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
                          {overview.payments.summary[status].count} item(ns)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-outline-variant/15 bg-surface-lowest">
                <div className="border-b border-outline-variant/15 p-5">
                  <h2 className="font-headline text-2xl italic text-on-surface">Movimentos recentes</h2>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    Presentes e gravata, ordenados por criacao
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/15 font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                        <th className="px-5 py-4 font-medium">Tipo</th>
                        <th className="px-5 py-4 font-medium">Registro</th>
                        <th className="px-5 py-4 font-medium">Status</th>
                        <th className="px-5 py-4 text-right font-medium">Valor</th>
                        <th className="px-5 py-4 text-right font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {overview.payments.recent.length > 0 ? (
                        overview.payments.recent.map((payment) => (
                          <tr key={`${payment.type}-${payment.id}`} className="font-body text-sm">
                            <td className="px-5 py-4 text-on-surface-variant">
                              {formatPaymentType(payment.type)}
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-medium text-on-surface">{payment.label}</p>
                              <p className="mt-1 text-xs text-on-surface-variant">
                                {payment.donorName}
                                {payment.donorEmail ? ` | ${payment.donorEmail}` : ''}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-on-surface-variant">
                              {formatStatus(payment.status)}
                            </td>
                            <td className="px-5 py-4 text-right text-on-surface">
                              {brlFormatter.format(payment.amount)}
                            </td>
                            <td className="px-5 py-4 text-right text-on-surface-variant">
                              {formatDate(payment.createdAt)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-6 font-body text-sm text-on-surface-variant">
                            Nenhum pagamento registrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
