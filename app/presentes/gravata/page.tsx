'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, ensureAnonymousAuth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import type { TieBidStatus } from '@/domain/types';

type TieBidCreateInput = {
  amount: number;
  message?: string;
  donorName: string;
  donorEmail: string;
  status: Extract<TieBidStatus, 'pending'>;
  createdAt: ReturnType<typeof serverTimestamp>;
};

// Espelha parseBrlAmount de app/presentes/checkout/page.tsx (normalizacao BRL).
const parseBrlAmount = (value: string) => {
  const cleanedValue = value.trim().replace(/[^\d,.]/g, '');
  const normalizedValue = cleanedValue.includes(',')
    ? cleanedValue.replace(/\./g, '').replace(',', '.')
    : cleanedValue;

  return Number.parseFloat(normalizedValue);
};

const MESSAGE_MAX = 500;

// Pacotes sugeridos de lance (valores simbolicos; ajustaveis no campo livre).
const SUGGESTED_BIDS = [50, 100, 200, 500];

export default function GravataPage() {
  const [amountStr, setAmountStr] = useState('');
  const [message, setMessage] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountStr(e.target.value.replace(/[^0-9,]/g, ''));
  };

  const handleSuggested = (value: number) => {
    setAmountStr(value.toFixed(2).replace('.', ','));
  };

  const resetForNewBid = () => {
    setAmountStr('');
    setMessage('');
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!donorName.trim() || !donorEmail.trim()) {
      alert('Por favor, preencha seu nome e e-mail.');
      return;
    }

    const amountValue = parseBrlAmount(amountStr);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      alert('Informe um valor de lance valido.');
      return;
    }

    setIsProcessing(true);

    try {
      await ensureAnonymousAuth();

      const trimmedMessage = message.trim();
      const tieBidData: TieBidCreateInput = {
        amount: amountValue,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        ...(trimmedMessage ? { message: trimmedMessage.slice(0, MESSAGE_MAX) } : {}),
      };

      await addDoc(collection(db, 'tieBids'), tieBidData satisfies TieBidCreateInput);

      setIsProcessing(false);
      setIsSuccess(true);
    } catch (error) {
      setIsProcessing(false);
      handleFirestoreError(error, OperationType.CREATE, 'tieBids');
    }
  };

  if (isSuccess) {
    return (
      <main className="relative min-h-screen pt-32 pb-24 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full bg-surface-container-lowest p-12 text-center border border-outline-variant/15 shadow-sm">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" strokeWidth={1} />
          <h2 className="font-headline text-4xl italic text-on-surface mb-4">Lance Registrado!</h2>
          <div className="space-y-4 mb-10">
            <p className="font-body text-on-surface-variant leading-relaxed">
              Recebemos sua inten&ccedil;&atilde;o de lance na Gravata do Noivo. A confirma&ccedil;&atilde;o
              acontece assim que o pagamento for processado.
            </p>
            <p className="font-body text-on-surface-variant/70 text-sm leading-relaxed">
              Em breve o Pix real ser&aacute; emitido pelo Mercado Pago. Seu lance entra no ranking
              quando o pagamento for confirmado.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={resetForNewBid}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              Dar outro lance
            </button>
            <Link
              href="/#gravata"
              className="w-full py-4 border border-outline-variant/30 font-label text-[10px] uppercase tracking-[0.2em] hover:bg-surface-container-low transition-colors rounded-sm"
            >
              Ver o ranking
            </Link>
            <Link
              href="/presentes"
              className="w-full py-4 border border-outline-variant/30 font-label text-[10px] uppercase tracking-[0.2em] hover:bg-surface-container-low transition-colors rounded-sm"
            >
              Ver lista de presentes
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
          Uma disputa de brincadeira: quem der o maior lance leva a gl&oacute;ria no ranking. Que
          ven&ccedil;a a fam&iacute;lia mais animada!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Valor do lance */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 p-8 md:p-12">
          <h3 className="font-headline text-2xl italic text-primary mb-6">Valor do Lance</h3>

          <div className="flex flex-wrap gap-2 mb-8">
            {SUGGESTED_BIDS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSuggested(value)}
                className="px-5 py-2.5 border border-outline-variant/30 font-label text-[10px] uppercase tracking-widest hover:bg-surface-container-low transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
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
          </div>
        </div>

        {/* Seus dados */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 p-8 md:p-12">
          <h3 className="font-headline text-2xl italic text-primary mb-6">Seus Dados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="donor-name" className="font-label text-[10px] uppercase tracking-widest text-secondary">
                Seu Nome Completo
              </label>
              <input
                type="text"
                id="donor-name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
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
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="Ex: roberto@exemplo.com"
                required
                className="w-full bg-surface-container-low border border-outline-variant/20 p-4 font-body text-on-surface placeholder:text-outline/50 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <label htmlFor="bid-message" className="font-label text-[10px] uppercase tracking-widest text-secondary">
              Mensagem (opcional)
            </label>
            <textarea
              id="bid-message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
              maxLength={MESSAGE_MAX}
              rows={3}
              placeholder="Que vença a família mais animada!"
              className="w-full bg-surface-container-low border border-outline-variant/20 p-4 font-body text-on-surface placeholder:text-outline/50 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all resize-none"
            />
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 self-end">
              {remainingChars} caracteres restantes
            </span>
          </div>
        </div>

        {/* Modo simulado + confirmacao */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 p-8 md:p-12 space-y-8">
          <div className="bg-surface-container-low border border-outline-variant/20 p-6 text-left">
            <p className="font-label text-[10px] uppercase tracking-widest text-primary mb-2">Modo simulado</p>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Este passo registra sua inten&ccedil;&atilde;o de lance. Nenhum QR Code ou c&oacute;digo
              pag&aacute;vel &eacute; exibido nesta vers&atilde;o &mdash; o Pix real ser&aacute; emitido
              pelo Mercado Pago quando a integra&ccedil;&atilde;o estiver dispon&iacute;vel. O lance fica
              <strong> pendente</strong> at&eacute; o pagamento ser confirmado.
            </p>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="btn-primary w-full py-5 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span>Registrar meu lance</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
