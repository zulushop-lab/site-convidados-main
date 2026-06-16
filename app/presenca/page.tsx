'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

import { PageHero } from '@/components/PageHero';
import { useGuest } from '@/lib/context/GuestContext';

export default function PresencaPage() {
  const { identity } = useGuest();
  const guestNames = identity?.guests.map((guest) => guest.name).join(', ');

  return (
    <main className="relative pb-32 min-h-screen overflow-x-hidden">
      <PageHero
        title="Confirme pelo seu convite"
        subtitle="Presenca"
        imageSrc="/imagem-2.jpg"
        imageAlt="Isadora e Matheus"
        objectPosition="center 5%"
      />

      <section className="px-6 md:px-12 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 md:grid-cols-12 md:items-center"
        >
          <div className="md:col-span-5">
            <div className="relative h-[420px] overflow-hidden border border-outline-variant/15">
              <Image
                src="/imagem-3.jpg"
                alt="Isadora e Matheus"
                fill
                priority
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                quality={85}
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="mb-8 flex items-center gap-3 text-primary">
              <Heart className="h-5 w-5" fill="currentColor" aria-hidden="true" />
              <span className="font-label text-[10px] uppercase tracking-[0.25em]">
                RSVP personalizado
              </span>
            </div>

            <h1 className="font-headline text-4xl italic leading-tight text-on-surface md:text-5xl">
              A confirmacao de presenca agora acontece pelo link individual da familia.
            </h1>

            <div className="mt-8 space-y-5 font-body text-base leading-relaxed text-on-surface-variant">
              <p>
                Para proteger a lista de convidados e evitar confirmacoes duplicadas, o RSVP
                valido usa o link enviado pelos noivos no WhatsApp.
              </p>

              {identity ? (
                <p>
                  Identidade carregada para <strong>{identity.familyName}</strong>
                  {guestNames ? `: ${guestNames}.` : '.'} Reabra o link recebido para revisar
                  ou editar a confirmacao.
                </p>
              ) : (
                <p>
                  Se voce chegou por aqui pela capa do site, peca aos noivos o convite
                  personalizado antes de confirmar.
                </p>
              )}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-primary px-8 py-4 font-label text-xs uppercase tracking-[0.15rem] text-on-primary transition-colors duration-300 hover:bg-primary-dim"
              >
                Voltar ao convite
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/presentes"
                className="inline-flex items-center justify-center gap-2 border border-outline-variant/30 px-8 py-4 font-label text-xs uppercase tracking-[0.15rem] text-primary transition-colors duration-300 hover:bg-surface-container-low"
              >
                Ver presentes
                <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-10 flex items-start gap-3 border-l-2 border-primary/60 bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="font-body leading-relaxed">
                O link personalizado protege sua resposta e evita duplicidade. Por isso,
                confirmacoes sem convite nao sao registradas aqui.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
