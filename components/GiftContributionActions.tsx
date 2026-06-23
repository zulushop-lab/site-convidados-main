'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface GiftContributionActionsProps {
  /** Título do presente — vai para o checkout como `item`, preservando o presente escolhido. */
  giftTitle: string;
  /** Cota mínima do presente (R$). É o piso e o valor pré-preenchido do "Ajustar Valor". */
  minimum: number;
  /** Valor total do presente (R$). É o valor enviado pelo botão "Contribuir Total". */
  total: number;
  /** Ajusta tamanhos para o card da grade ou para o modal de detalhes. */
  layout?: 'modal' | 'card';
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata um número como string com vírgula decimal (ex.: 50 -> "50,00"), igual aos links existentes. */
function toAmountParam(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/** Converte o texto do input (dígitos + vírgula) para número. Vazio/invalido -> NaN. */
function parseAmount(text: string): number {
  if (!text) return NaN;
  return Number(text.replace(/\./g, '').replace(',', '.'));
}

export function GiftContributionActions({ giftTitle, minimum, total, layout = 'card' }: GiftContributionActionsProps) {
  const router = useRouter();
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [amount, setAmount] = useState(() => toAmountParam(minimum));

  const isCard = layout === 'card';
  const checkoutHref = (amountParam: string) =>
    `/presentes/checkout?amount=${amountParam}&item=${encodeURIComponent(giftTitle)}`;

  const parsed = parseAmount(amount);
  const isValid = Number.isFinite(parsed) && parsed >= minimum;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value.replace(/[^0-9,]/g, ''));
  };

  const submitAdjusted = () => {
    if (!isValid) return;
    router.push(checkoutHref(amount));
  };

  // Tamanhos por layout, espelhando os botões originais do modal e do card.
  const primaryBtn = isCard
    ? 'btn-primary w-full py-3 block text-center shadow-lg shadow-primary/10 hover:shadow-primary/30 transition-shadow text-xs font-semibold'
    : 'flex-1 btn-primary py-5 px-8 flex items-center justify-center gap-3 text-sm font-semibold';
  const secondaryBtn = isCard
    ? 'w-full py-2.5 border border-outline-variant/30 font-label text-[8px] uppercase tracking-[0.2em] hover:bg-surface-container-low transition-colors rounded-sm'
    : 'flex-1 px-8 py-5 border border-outline-variant/30 font-label text-[10px] uppercase tracking-widest hover:bg-surface-container-low transition-colors';

  if (isAdjusting) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="text-left">
          <label
            htmlFor={`adjust-${layout}`}
            className="font-label text-[10px] uppercase tracking-widest text-secondary block mb-2"
          >
            Valor da contribuição (R$)
          </label>
          <div className="relative">
            <span className="absolute left-0 bottom-2 font-body text-base text-on-surface-variant">R$</span>
            <input
              id={`adjust-${layout}`}
              type="text"
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={handleAmountChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitAdjusted();
                }
              }}
              aria-label={`Valor da contribuição para ${giftTitle}`}
              className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-2 pl-8 focus:outline-none focus:border-primary font-body text-base transition-colors text-on-surface"
            />
          </div>
          {!isValid && amount !== '' && (
            <p className="mt-2 font-body text-[10px] text-primary/80">
              O valor mínimo é {currency.format(minimum)}.
            </p>
          )}
        </div>

        <div className={isCard ? 'flex flex-col gap-2' : 'flex flex-col sm:flex-row gap-3'}>
          <button
            type="button"
            onClick={submitAdjusted}
            disabled={!isValid}
            aria-label={`Contribuir com o valor ajustado para ${giftTitle}`}
            className={`${primaryBtn} ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Contribuir <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsAdjusting(false)}
            aria-label="Voltar"
            className={secondaryBtn}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-3 h-3" /> Voltar
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isCard ? 'flex flex-col gap-3' : 'flex flex-col sm:flex-row gap-4'}>
      <button
        type="button"
        onClick={() => router.push(checkoutHref(toAmountParam(total)))}
        aria-label={`Contribuir com o valor total (${currency.format(total)}) para ${giftTitle}`}
        className={primaryBtn}
      >
        Contribuir Total {!isCard && <ArrowRight className="w-5 h-5" />}
      </button>
      <button
        type="button"
        onClick={() => {
          setAmount(toAmountParam(minimum));
          setIsAdjusting(true);
        }}
        aria-label={`Ajustar valor da contribuição para ${giftTitle}`}
        className={secondaryBtn}
      >
        Ajustar Valor
      </button>
    </div>
  );
}
