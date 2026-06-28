'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Banknote,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useGuest } from '@/lib/context/GuestContext';

const TIE_BID_MIN_AMOUNT = 50;
const MESSAGE_MAX = 500;
const SUGGESTED_BIDS = [50, 100, 200, 500];

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

export default function GravataPage() {
  const { identity } = useGuest();
  const [amountStr, setAmountStr] = useState('');
  const [message, setMessage] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

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
      setDisplayName((current) => current || identityDefaults.guestName);
    }
    if (identityDefaults.guestEmail) {
      setDonorEmail((current) => current || identityDefaults.guestEmail);
    }
  }, [identityDefaults]);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmountStr(event.target.value.replace(/[^0-9,]/g, ''));
  };

  const handleSuggested = (value: number) => {
    setAmountStr(value.toFixed(2).replace('.', ','));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const amountValue = parseBrlAmount(amountStr);
    if (!Number.isFinite(amountValue) || amountValue < TIE_BID_MIN_AMOUNT) {
      setError('O lance minimo e R$ 50.');
      return;
    }
    if (!donorName.trim() || !donorEmail.trim()) {
      setError('Preencha seu nome e e-mail para iniciar o pagamento.');
      return;
    }

    const publicName = (displayName || donorName).trim();
    if (!publicName) {
      setError('Informe o nome que aparecera no ranking.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tie_bid',
          amount: amountValue,
          item: 'Gravata do Noivo',
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          displayName: publicName,
          message: message.trim(),
          ...(identityDefaults?.familyId
            ? {
                familyId: identityDefaults.familyId,
                familyName: identityDefaults.familyName,
              }
            : {}),
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

  const remainingChars = MESSAGE_MAX - message.length;

  return (
    <main className="relative min-h-screen pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-3xl mx-auto">
      <Link
        href="/#gravata"
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-12 font-label text-xs uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Voltar
      </Link>

      <div className="mb-12">
        <span className="inline-flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.3em] text-primary mb-4">
          <Sparkles className="w-4 h-4" aria-hidden="true" /> Gravata do Noivo
        </span>
        <h1 className="font-headline text-5xl italic text-on-surface mb-4">Dar meu Lance</h1>
        <p className="font-body text-on-surface-variant leading-relaxed">
          Uma disputa de brincadeira: quem somar mais lances confirmados sobe no ranking.
          Lance registrado sem pagamento nao conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-surface-container-lowest border border-outline-variant/15 p-8 md:p-12">
          <h2 className="font-headline text-2xl italic text-primary mb-6">Valor do Lance</h2>

          <div className="flex flex-wrap gap-2 mb-8">
            {SUGGESTED_BIDS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSuggested(value)}
                className="px-5 py-2.5 border border-outline-variant/30 font-label text-[10px] uppercase tracking-widest hover:bg-surface-container-low transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {brlFormatter.format(value)}
              </button>
            ))}
          </div>

          <div className="relative">
            <label htmlFor="bid-amount" className="font-label text-[10px] uppercase tracking-widest text-secondary block mb-2">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-0 bottom-3 font-body text-xl text-on-surface-variant">R$</span>
              <input
                id="bid-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amountStr}
                onChange={handleAmountChange}
                required
                className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 pl-8 focus:outline-none focus:border-primary font-body text-xl transition-colors text-on-surface"
              />
            </div>
            <p className="mt-3 font-body text-xs text-on-surface-variant">
              Lance minimo: {brlFormatter.format(TIE_BID_MIN_AMOUNT)}.
            </p>
          </div>
        </section>

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
                Nome do pagador
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
                E-mail do pagamento
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
            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="display-name" className="font-label text-[10px] uppercase tracking-widest text-secondary">
                Nome no ranking
              </label>
              <input
                type="text"
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Como seu nome deve aparecer no Top 10"
                className="w-full bg-surface-container-low border border-outline-variant/20 p-4 font-body text-on-surface placeholder:text-outline/50 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <label htmlFor="bid-message" className="font-label text-[10px] uppercase tracking-widest text-secondary">
              Mensagem privada aos noivos (opcional)
            </label>
            <textarea
              id="bid-message"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, MESSAGE_MAX))}
              maxLength={MESSAGE_MAX}
              rows={3}
              placeholder="Que venca a familia mais animada!"
              className="w-full bg-surface-container-low border border-outline-variant/20 p-4 font-body text-on-surface placeholder:text-outline/50 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all resize-none"
            />
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 self-end">
              {remainingChars} caracteres restantes
            </span>
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
                Seu lance so entra no Top 10 depois que o Mercado Pago confirmar o pagamento.
                Pix, cartao e demais meios disponiveis ficam no checkout deles.
              </p>
            </div>
          </div>

          <div className="border border-outline-variant/20 bg-surface-container-low p-4 flex items-center gap-3">
            <Banknote className="w-5 h-5 text-primary" aria-hidden="true" />
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              Confirmacao automatica por webhook
            </span>
          </div>

          {error && (
            <div className="border border-primary/30 bg-primary/5 p-4">
              <p className="font-body text-sm text-primary leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="btn-primary w-full py-5 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Redirecionando...</span>
              </>
            ) : (
              <>
                <span>Pagar Lance com Mercado Pago</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </section>
      </form>
    </main>
  );
}
