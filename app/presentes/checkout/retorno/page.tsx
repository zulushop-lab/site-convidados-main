'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock3, Gift, Loader2, XCircle } from 'lucide-react';

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

function normalizeStatus(value: unknown): PaymentStatus {
  if (value === 'completed' || value === 'failed' || value === 'processing') return value;
  return 'pending';
}

function ReturnContent() {
  const searchParams = useSearchParams();
  const kind = searchParams.get('kind') === 'tie_bid' ? 'tie_bid' : 'gift';
  const id = searchParams.get('id') ?? '';
  const result = searchParams.get('result') ?? '';

  const [status, setStatus] = useState<PaymentStatus>(() =>
    result === 'failure' ? 'failed' : result === 'pending' ? 'pending' : 'processing',
  );
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError('Nao recebemos o identificador do pagamento.');
      return;
    }

    let active = true;

    const loadStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status?kind=${kind}&id=${encodeURIComponent(id)}`, {
          cache: 'no-store',
        });
        const data = (await response.json().catch(() => ({}))) as {
          status?: string;
          error?: string;
        };

        if (!active) return;

        if (!response.ok) {
          throw new Error(data.error || 'Nao foi possivel consultar o pagamento.');
        }

        setStatus(normalizeStatus(data.status));
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Falha ao consultar o pagamento.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadStatus();
    const interval = window.setInterval(loadStatus, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [id, kind]);

  const content = useMemo(() => {
    if (status === 'completed') {
      return {
        icon: <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" strokeWidth={1} />,
        title: 'Pagamento confirmado',
        message:
          kind === 'tie_bid'
            ? 'Seu lance foi confirmado e ja pode entrar no ranking da Gravata do Noivo.'
            : 'Recebemos seu presente. Obrigado por fazer parte deste momento.',
      };
    }

    if (status === 'failed') {
      return {
        icon: <XCircle className="w-16 h-16 text-primary mx-auto mb-6" strokeWidth={1} />,
        title: 'Pagamento nao aprovado',
        message:
          'O Mercado Pago nao confirmou esta transacao. Voce pode tentar novamente ou escolher outro meio de pagamento.',
      };
    }

    return {
      icon: <Clock3 className="w-16 h-16 text-primary mx-auto mb-6" strokeWidth={1} />,
      title: 'Aguardando confirmacao',
      message:
        'O Mercado Pago ainda esta processando a transacao. Esta pagina atualiza automaticamente a cada poucos segundos.',
    };
  }, [kind, status]);

  const retryHref = kind === 'tie_bid' ? '/presentes/gravata' : '/presentes';

  return (
    <main className="relative min-h-screen pt-32 pb-24 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full bg-surface-container-lowest p-10 md:p-12 text-center border border-outline-variant/15 shadow-sm">
        {isLoading ? <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" strokeWidth={1} /> : content.icon}

        <h1 className="font-headline text-4xl italic text-on-surface mb-4">{content.title}</h1>
        <p className="font-body text-on-surface-variant leading-relaxed mb-8">{content.message}</p>

        {error && (
          <div className="border border-primary/30 bg-primary/5 p-4 mb-8 text-left">
            <p className="font-body text-sm text-primary leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {status === 'failed' ? (
            <Link
              href={retryHref}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              Tentar novamente
            </Link>
          ) : (
            <Link
              href={kind === 'tie_bid' ? '/#gravata' : '/presentes'}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" aria-hidden="true" />
              {kind === 'tie_bid' ? 'Ver ranking' : 'Voltar para presentes'}
            </Link>
          )}

          <Link
            href="/"
            className="w-full py-4 border border-outline-variant/30 font-label text-[10px] uppercase tracking-[0.2em] hover:bg-surface-container-low transition-colors rounded-sm"
          >
            Voltar ao inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function MercadoPagoReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 pb-24 flex items-center justify-center">Carregando...</div>}>
      <ReturnContent />
    </Suspense>
  );
}
