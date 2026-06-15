'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Minus, Plus, Info, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

import { PageHero } from '@/components/PageHero';

export default function PresencaPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);
  const [dietary, setDietary] = useState('');
  const [message, setMessage] = useState('');
  const [adults, setAdults] = useState([
    { name: 'Convidado 1', confirmed: true },
  ]);

  const addAdult = () => {
    setAdults([...adults, { name: '', confirmed: true }]);
  };

  const updateAdultName = (index: number, name: string) => {
    const newAdults = [...adults];
    newAdults[index].name = name;
    setAdults(newAdults);
  };

  const toggleAdult = (index: number) => {
    const newAdults = [...adults];
    newAdults[index].confirmed = !newAdults[index].confirmed;
    setAdults(newAdults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (adults.some(a => a.confirmed && !a.name.trim())) {
      alert("Por favor, preencha o nome de todos os convidados confirmados.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const rsvpData = {
        adults: adults.filter(a => a.confirmed),
        childrenCount,
        dietary,
        message,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'rsvps'), rsvpData);
      
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      setIsSubmitting(false);
      handleFirestoreError(error, OperationType.CREATE, 'rsvps');
    }
  };

  if (isSubmitted) {
    return (
      <main className="relative min-h-screen pb-32 flex flex-col items-center justify-center px-6 overflow-x-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-0 bg-surface-container-lowest shadow-[0_-4px_40px_rgba(47,51,49,0.04)]"
        >
          {/* Visual Side */}
          <div className="md:col-span-5 relative h-[500px] md:h-auto overflow-hidden">
            <Image
              src="/imagem-2.jpg"
              alt="Isadora e Matheus em um momento íntimo"
              fill
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
              quality={85}
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-primary/5 mix-blend-multiply"></div>
          </div>
          {/* Message Side */}
          <div className="md:col-span-7 p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-8"
            >
              <Heart className="text-primary w-10 h-10 mb-4" fill="currentColor" />
              <h2 className="font-headline italic text-4xl md:text-5xl text-on-surface leading-tight mb-4">
                Obrigado por fazer parte da nossa história.
              </h2>
              <p className="font-body text-lg text-secondary leading-relaxed max-w-md">
                Sua presença e carinho significam tudo para nós. Recebemos sua confirmação com sucesso e mal podemos esperar para celebrar este momento juntos.
              </p>
            </motion.div>
            {/* Status Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="space-y-4 mb-12"
            >
              <div className="bg-surface-container-low p-6 border-l-2 border-primary">
                <p className="font-label text-[10px] uppercase tracking-[0.2rem] text-outline mb-1">Status da Confirmação</p>
                <p className="font-body text-on-surface font-semibold">
                  Presença Confirmada para {adults.filter(a => a.confirmed).length + childrenCount} Convidados
                </p>
              </div>
            </motion.div>
            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/presentes" className="bg-primary text-on-primary px-8 py-4 font-label text-xs uppercase tracking-[0.15rem] hover:bg-primary-dim transition-colors duration-300 flex items-center justify-center gap-2">
                Ver Lista de Presentes
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/" className="bg-transparent border border-outline-variant/30 text-primary px-8 py-4 font-label text-xs uppercase tracking-[0.15rem] hover:bg-surface-container-low transition-colors duration-300 text-center">
                Voltar para o Início
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Secondary Affirmation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-16 text-center max-w-xl"
        >
          <hr className="w-12 border-outline-variant/30 mx-auto mb-8" />
          <p className="font-headline italic text-xl text-secondary">
            &quot;Amar e ser amado é sentir o sol de ambos os lados.&quot;
          </p>
          <p className="font-label text-[10px] uppercase tracking-[0.2rem] text-outline mt-4">— David Viscott</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative pb-32 min-h-screen overflow-x-hidden">
      <PageHero 
        title="Junte-se à nossa celebração" 
        subtitle="Confirme sua presença" 
        imageSrc="/imagem-2.jpg" 
        imageAlt="Isadora e Matheus" 
        objectPosition="center 5%"
      />

      <div className="flex flex-col items-center px-6 lg:px-0">
        {/* RSVP Form Container */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/15 p-8 md:p-12"
        >
        <form onSubmit={handleSubmit} className="space-y-16">
          {/* Group Selection: Adultos Convidados */}
          <div className="space-y-6">
            <div className="flex items-baseline justify-between border-b border-outline-variant/20 pb-4">
              <h3 className="font-headline text-2xl italic text-primary">Sua Presença</h3>
              <span className="font-label text-[10px] uppercase tracking-wider text-outline">Adultos Convidados</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {adults.map((adult, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-surface-container-low gap-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-5 h-5 border border-primary flex items-center justify-center transition-all focus-within:ring-2 ring-primary ring-offset-2 ring-offset-background relative cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adult.confirmed}
                        onChange={() => toggleAdult(index)}
                        className="opacity-0 absolute w-5 h-5 cursor-pointer peer outline-none"
                      />
                      <Check className={`text-primary w-4 h-4 transition-opacity ${adult.confirmed ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                    </div>
                    <input
                      type="text"
                      value={adult.name}
                      onChange={(e) => updateAdultName(index, e.target.value)}
                      placeholder="Nome completo do convidado"
                      className={`font-body text-lg bg-transparent border-b border-transparent focus:border-primary outline-none transition-opacity w-full ${!adult.confirmed && 'opacity-60'}`}
                    />
                  </div>
                  <span className={`font-label text-[10px] uppercase tracking-widest transition-opacity ${adult.confirmed ? 'text-outline' : 'text-outline opacity-0 group-hover:opacity-100'}`}>
                    {adult.confirmed ? 'Confirmado' : 'Selecionar'}
                  </span>
                </motion.div>
              ))}
              <button
                type="button"
                onClick={addAdult}
                className="mt-4 flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.2em] text-primary hover:text-primary-dim transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar mais um convidado
              </button>
            </div>
          </div>

          {/* Convidados Mirins */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-baseline justify-between border-b border-outline-variant/20 pb-4">
              <h3 className="font-headline text-2xl italic text-primary">Convidados Mirins</h3>
              <span className="font-label text-[10px] uppercase tracking-wider text-outline">Até 13 anos</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-surface-container-low gap-6">
              <div className="space-y-1">
                <p className="font-body text-on-surface font-medium">Quantas crianças irão participar?</p>
                <p className="font-body text-sm text-outline leading-relaxed">Crianças contam como assento e serviço de buffet completo.</p>
              </div>
              <div className="flex items-center border border-outline-variant/30 bg-surface rounded-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
                <button
                  type="button"
                  onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                  className="w-12 h-12 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors focus-visible:outline-none focus-visible:bg-surface-container-high"
                  aria-label="Diminuir quantidade de crianças"
                >
                  <Minus className="w-5 h-5" aria-hidden="true" />
                </button>
                <span 
                  className="w-12 h-12 flex items-center justify-center font-body text-lg font-bold border-x border-outline-variant/30 text-on-surface"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {childrenCount}
                </span>
                <button
                  type="button"
                  onClick={() => setChildrenCount(childrenCount + 1)}
                  className="w-12 h-12 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors focus-visible:outline-none focus-visible:bg-surface-container-high"
                  aria-label="Aumentar quantidade de crianças"
                >
                  <Plus className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Detalhes Adicionais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-8"
          >
            <div className="flex items-baseline justify-between border-b border-outline-variant/20 pb-4">
              <h3 className="font-headline text-2xl italic text-primary">Detalhes Adicionais</h3>
              <span className="font-label text-[10px] uppercase tracking-wider text-outline">Personalize sua experiência</span>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div className="flex flex-col gap-2">
                <label htmlFor="dietary" className="font-label text-[10px] uppercase tracking-widest text-secondary">
                  Restrições Alimentares ou Observações
                </label>
                <input 
                  type="text" 
                  id="dietary"
                  name="dietary"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="Ex: Alergia a frutos do mar, vegetariano..."
                  className="w-full bg-surface-container-low border border-outline-variant/20 p-4 font-body text-on-surface placeholder:text-outline/50 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="font-label text-[10px] uppercase tracking-widest text-secondary">
                  Mensagem para os Noivos
                </label>
                <textarea 
                  id="message"
                  name="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Deixe uma mensagem carinhosa aqui..."
                  className="w-full bg-surface-container-low border border-outline-variant/20 p-4 font-body text-on-surface placeholder:text-outline/50 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Policy & Action */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="space-y-8 pt-8 border-t border-outline-variant/20"
          >
            <div className="flex items-start gap-3 text-secondary-dim/70">
              <Info className="w-4 h-4 mt-0.5" aria-hidden="true" />
              <p className="font-body text-xs italic">
                Alterações ou cancelamentos são permitidos até 30 dias antes do evento para garantir a precisão do nosso buffet.
              </p>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full py-5 flex items-center justify-center gap-3 duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Processando...</span>
                </>
              ) : (
                <span>Confirmar Presença</span>
              )}
            </button>
            <p className="text-center font-body text-sm text-outline">
              Precisa de ajuda? <Link href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Fale com nosso concierge</Link>
            </p>
          </motion.div>
        </form>
      </motion.section>

      {/* Asymmetric Detail Image Section */}
      <section className="relative w-full max-w-4xl mt-24 grid grid-cols-12 gap-8 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="col-span-12 md:col-span-7 relative h-[600px]"
        >
          <Image
            src="/imagem-3.jpg"
            alt="O Casal"
            fill
            priority
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            quality={85}
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover filter grayscale-[0.2] contrast-[1.05]"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="col-span-12 md:col-span-5 md:-ml-20 bg-surface p-10 shadow-[-20px_20px_40px_rgba(47,51,49,0.04)] z-10"
        >
          <h4 className="font-headline text-3xl italic text-on-surface mb-4">Pequenos Detalhes</h4>
          <p className="font-body text-secondary leading-relaxed mb-6">
            Nossa celebração é pensada como uma experiência de galeria curada, onde cada elemento — do menu à música — reflete nossa jornada compartilhada.
          </p>
          <div className="h-[1px] w-12 bg-outline-variant/40"></div>
        </motion.div>
      </section>
      </div>
    </main>
  );
}
