'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Banknote, CreditCard, ArrowLeft, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amountStr = searchParams.get('amount') || '0';
  const item = searchParams.get('item') || 'Contribuição';
  const [method, setMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!donorName.trim() || !donorEmail.trim()) {
      alert("Por favor, preencha seu nome e e-mail.");
      return;
    }

    setIsProcessing(true);
    
    try {
      const amountValue = parseFloat(amountStr.replace(',', '.'));

      const contributionData = {
        amount: amountValue,
        giftTitle: item,
        donorName,
        donorEmail,
        paymentMethod: method,
        status: 'completed',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'contributions'), contributionData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsProcessing(false);
      setIsSuccess(true);
    } catch (error) {
      setIsProcessing(false);
      handleFirestoreError(error, OperationType.CREATE, 'contributions');
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Matheus Silva6009Sao Paulo62070503***63041234');
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  if (isSuccess) {
    return (
      <main className="relative min-h-screen pt-32 pb-24 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full bg-surface-container-lowest p-12 text-center border border-outline-variant/15 shadow-sm">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" strokeWidth={1} />
          <h2 className="font-headline text-4xl italic text-on-surface mb-4">Muito Obrigado!</h2>
          <div className="space-y-4 mb-10">
            <p className="font-body text-on-surface-variant leading-relaxed">
              Ficamos imensamente felizes com seu carinho! Sua contribuição para <strong>&quot;{item}&quot;</strong> foi confirmada com sucesso.
            </p>
            <p className="font-body text-on-surface-variant/70 text-sm leading-relaxed">
              Agradecemos de coração por fazer parte deste capítulo tão importante da nossa história. Seu gesto nos ajuda a tornar nossos sonhos realidade.
            </p>
          </div>
          <Link href="/presentes" className="inline-block bg-primary text-on-primary px-8 py-4 font-label text-xs uppercase tracking-[0.15rem] hover:bg-primary-dim transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-sm">
            Voltar para a Lista
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-3xl mx-auto">
      <Link href="/presentes" className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-12 font-label text-xs uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Voltar
      </Link>

      <div className="mb-12">
        <h1 className="font-headline text-5xl italic text-on-surface mb-4">Finalizar Presente</h1>
        <p className="font-body text-on-surface-variant">Você está contribuindo com <strong className="text-on-surface font-medium">R$ {amountStr}</strong> para <strong className="text-on-surface font-medium">{item}</strong>.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/15 p-8 md:p-12 mb-8">
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
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/15 p-8 md:p-12">
        <div className="flex gap-4 mb-10 border-b border-outline-variant/20 pb-6" role="tablist" aria-label="Método de pagamento">
          <button
            type="button"
            role="tab"
            aria-selected={method === 'pix'}
            onClick={() => setMethod('pix')}
            className={`flex-1 py-4 flex flex-col items-center gap-2 border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm ${method === 'pix' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}
          >
            <Banknote className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
            <span className="font-label text-[10px] uppercase tracking-widest">Pix</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={method === 'credit_card'}
            onClick={() => setMethod('credit_card')}
            className={`flex-1 py-4 flex flex-col items-center gap-2 border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm ${method === 'credit_card' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}
          >
            <CreditCard className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
            <span className="font-label text-[10px] uppercase tracking-widest">Cartão (1x)</span>
          </button>
        </div>

        {method === 'pix' ? (
          <div className="space-y-8 animate-in fade-in duration-500" role="tabpanel">
            <div className="text-center space-y-4">
              <p className="font-body text-sm text-on-surface-variant">Escaneie o QR Code ou copie o código Pix abaixo para realizar o pagamento no seu aplicativo do banco.</p>
              <div className="w-48 h-48 bg-surface-container-high mx-auto flex items-center justify-center border border-outline-variant/20" aria-hidden="true">
                <span className="font-label text-xs text-secondary uppercase tracking-widest">[QR Code Mock]</span>
              </div>
              <div className="flex items-center gap-2 max-w-md mx-auto">
                <input 
                  type="text" 
                  readOnly 
                  value="00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3..." 
                  className="flex-1 bg-surface-container-low border border-outline-variant/30 py-3 px-4 font-mono text-xs text-on-surface-variant outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                  aria-label="Código Pix copia e cola"
                />
                <button 
                  onClick={copyPixCode}
                  className="bg-surface-container-high border border-outline-variant/30 p-3 hover:bg-surface-container transition-colors text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                  aria-label={pixCopied ? "Código Pix copiado com sucesso" : "Copiar código Pix"}
                >
                  {pixCopied ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="btn-primary w-full py-5 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Processando...</span>
                </>
              ) : (
                <span>Já realizei o pagamento</span>
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={handlePayment} className="space-y-8 animate-in fade-in duration-500" role="tabpanel">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="cc-number" className="font-label text-[10px] uppercase tracking-widest text-secondary">Número do Cartão</label>
                <input
                  id="cc-number"
                  name="cc-number"
                  type="text"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  required
                  placeholder="0000 0000 0000 0000"
                  className="w-full bg-transparent border-b border-outline-variant/30 py-3 font-body text-on-surface focus:outline-none focus:border-primary focus:ring-0 transition-colors placeholder:text-outline-variant/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="cc-name" className="font-label text-[10px] uppercase tracking-widest text-secondary">Nome do Titular</label>
                <input
                  id="cc-name"
                  name="cc-name"
                  type="text"
                  autoComplete="cc-name"
                  required
                  placeholder="Como impresso no cartão"
                  className="w-full bg-transparent border-b border-outline-variant/30 py-3 font-body text-on-surface focus:outline-none focus:border-primary focus:ring-0 transition-colors placeholder:text-outline-variant/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="cc-exp" className="font-label text-[10px] uppercase tracking-widest text-secondary">Validade</label>
                  <input
                    id="cc-exp"
                    name="cc-exp"
                    type="text"
                    autoComplete="cc-exp"
                    required
                    placeholder="MM/AA"
                    className="w-full bg-transparent border-b border-outline-variant/30 py-3 font-body text-on-surface focus:outline-none focus:border-primary focus:ring-0 transition-colors placeholder:text-outline-variant/50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="cc-csc" className="font-label text-[10px] uppercase tracking-widest text-secondary">CVV</label>
                  <input
                    id="cc-csc"
                    name="cc-csc"
                    type="text"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    required
                    placeholder="123"
                    className="w-full bg-transparent border-b border-outline-variant/30 py-3 font-body text-on-surface focus:outline-none focus:border-primary focus:ring-0 transition-colors placeholder:text-outline-variant/50"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-surface-container-low p-4 border-l-2 border-primary">
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Pagamento processado de forma segura pelo <strong>Mercado Pago</strong>. O valor será cobrado em 1x no seu cartão de crédito.
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
                <span>Pagar R$ {amountStr}</span>
              )}
            </button>
          </form>
        )}
      </div>
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
