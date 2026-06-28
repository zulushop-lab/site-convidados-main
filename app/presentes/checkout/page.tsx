'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Banknote, CreditCard, ExternalLink, Loader2, ShieldCheck, Users } from 'lucide-react';
import { useGuest } from '@/lib/context/GuestContext';

const PAYMENT_MAX_AMOUNT = 100000;
const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const parseBrlAmount = (value: string) => {
  const cleanedValue = value.trim().replace(/[^\d,.]/g, '');
  const normalizedValue = cleanedValue.includes(',')
    ? cleanedValue.replace(/\./g, '').replace(',', '.')
    : cleanedValue;

  return Number.parseFloat(normalizedValue);
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { identity } = useGuest();
  const amountStr = searchParams.get('amount') || '0';
  const item = searchParams.get('item') || 'Contribuicao';

  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const amountValue = useMemo(() => parseBrlAmount(amountStr), [amountStr]);
  const isAmountValid =
    Number.isFinite(amountValue) && amountValue > 0 && amountValue <= PAYMENT_MAX_AMOUNT;
  const displayAmount = isAmountValid ? brlFormatter.format(amountValue) : 'valor inválido';
  const amountError = isAmountValid
    ? ''
    : `O valor do pagamento deve ser maior que zero e no maximo ${brlFormatter.format(PAYMENT_MAX_AMOUNT)}.`;

  const identityDefaults = useMemo(() => {
    if (!identity) return null;

    const selectedGuest =
      identity.guests.find((guest) => guest.id === identity.guestId) ??
      identity.guests.find((guest) => guest.isMainGuest) ??
      (identity.guests.length === 1 ? identity.guests[0] : null);

    return {
      familyId: identity.familyId,
      familyName: identity.familyName,
      guestId: identity.guestId,
      guestName: selectedGuest?.name ?? '',
      guestEmail: selectedGuest?.email ?? '',
    };
  }, [identity]);

  useEffect(() => {
    if (!identityDefaults) return;

    if (identityDefaults.guestName) {
      setDonorName((current) => current || identityDefaults.guestName);
    }
    if (identityDefaults.guestEmail) {
      setDonorEmail((current) => current || identityDefaults.guestEmail);
    }
  }, [identityDefaults]);

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isAmountValid) {
      setError('Informe um valor de contribuicao valido.');
      return;
    }
    if (!donorName.trim() || !donorEmail.trim()) {
      setError('Preencha seu nome e e-mail para iniciar o pagamento.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'gift',
          amount: amountValue,
          item,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          ...(identityDefaults?.familyId ? { familyId: identityDefaults.familyId } : {}),
          ...(identityDefaults?.guestId ? { guestId: identityDefaults.guestId } : {}),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel iniciar o pagamento.');
      }
      if (!data.checkoutUrl) {
        throw new Error('Mercado Pago nao retornou a URL de pagamento.');
      }

      window.location.assign(data.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar o pagamento.');
      setIsProcessing(false);
    }
  };

  return (
    <main className="relative min-h-screen pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-3xl mx-auto">
      <Link
        href="/presentes"
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-12 font-label text-xs uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Voltar
      </Link>

      <div className="mb-12">
        <h1 className="font-headline text-5xl italic text-on-surface mb-4">Finalizar Presente</h1>
        <p className="font-body text-on-surface-variant">
          Voce esta contribuindo com{' '}
          <strong className="text-on-surface font-medium">{displayAmount}</strong> para{' '}
          <strong className="text-on-surface font-medium">{item}</strong>.
        </p>
      </div>

      <form onSubmit={handlePayment} className="space-y-8">
        <section className="bg-surface-container-lowest border border-outline-variant/15 p-8 md:p-12">
          <h2 className="font-headline text-2xl italic text-primary mb-6">Seus Dados</h2>

          {identityDefaults?.familyId && (
            <div className="mb-6 border border-outline-variant/20 bg-surface-container-low p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                Vinculado a {identityDefaults.familyName}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="donor-name" className="font-label text-[10px] uppercase tracking-widest text-secondary">
                Seu Nome Completo
              </label>
              <input
                type="text"
                id="donor-name"
                value={donorName}
                onChange={(event) => setDonorName(event.target.value)}
                placeholder="Ex: Roberto Silva"
                required
                className="w-full bg-surface-container-low border border-outline-variant/20 p-4 font-body text-on-surface placeholder:text-outline/50 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="donor-email" className="font-label text-[10px] uppercase tracking-widest text-secondary">
                Seu E-mail
              </label>
              <input
                type="email"
                id="donor-email"
                value={donorEmail}
                onChange={(event) => setDonorEmail(event.target.value)}
                placeholder="Ex: roberto@exemplo.com"
                required
                className="w-full bg-surface-container-low border border-outline-variant/20 p-4 font-body text-on-surface placeholder:text-outline/50 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
              />
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest border border-outline-variant/15 p-8 md:p-12 space-y-8">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-headline text-2xl italic text-primary mb-2">Pagamento Mercado Pago</h2>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                O pagamento sera concluido no ambiente seguro do Mercado Pago. Pix, cartao e outros
                meios disponiveis ficam centralizados la; nenhum dado de cartao passa por este site.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-outline-variant/20 bg-surface-container-low p-4 flex items-center gap-3">
              <Banknote className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                Pix no Mercado Pago
              </span>
            </div>
            <div className="border border-outline-variant/20 bg-surface-container-low p-4 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                Cartao no Mercado Pago
              </span>
            </div>
          </div>

          {error && (
            <div className="border border-primary/30 bg-primary/5 p-4">
              <p className="font-body text-sm text-primary leading-relaxed">{error}</p>
            </div>
          )}

          {amountError && (
            <div className="border border-primary/30 bg-primary/5 p-4">
              <p className="font-body text-sm text-primary leading-relaxed">{amountError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || !isAmountValid}
            className="btn-primary w-full py-5 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Redirecionando...</span>
              </>
            ) : (
              <>
                <span>Pagar com Mercado Pago</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </section>
      </form>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 pb-24 flex items-center justify-center">Carregando...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
