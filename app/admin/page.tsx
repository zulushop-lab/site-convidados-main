'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
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

interface AdminOverview {
  adminEmail: string;
  generatedAt: string;
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

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-h-36 border border-outline-variant/15 bg-surface-lowest p-5">
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="font-label text-[10px] uppercase tracking-[0.22em] text-secondary">
          {label}
        </span>
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <p className="font-headline text-4xl italic text-on-surface">{value}</p>
      <p className="mt-2 font-body text-sm text-on-surface-variant">{detail}</p>
    </div>
  );
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
    <main className="relative min-h-screen px-4 py-28 md:px-8 lg:px-12">
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
              Confirmacoes, familias pendentes e pagamentos registrados pelo site.
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
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric
                icon={UserCheck}
                label="Presenca"
                value={`${rsvpRate}%`}
                detail={`${overview.rsvp.confirmedFamilies} de ${overview.rsvp.totalFamilies} familias`}
              />
              <Metric
                icon={Users}
                label="Convidados"
                value={numberFormatter.format(overview.rsvp.confirmedGuests)}
                detail={`${overview.rsvp.pendingGuests} convidados ainda sem confirmacao`}
              />
              <Metric
                icon={Banknote}
                label="Arrecadado"
                value={brlFormatter.format(overview.payments.completedAmount)}
                detail={`${overview.payments.summary.completed.count} pagamento(s) concluido(s)`}
              />
              <Metric
                icon={Clock3}
                label="Em aberto"
                value={brlFormatter.format(overview.payments.pendingAmount)}
                detail={`${overview.payments.summary.pending.count + overview.payments.summary.processing.count} pagamento(s) pendente(s)`}
              />
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
                  <h2 className="font-headline text-2xl italic text-on-surface">Familias pendentes</h2>
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
