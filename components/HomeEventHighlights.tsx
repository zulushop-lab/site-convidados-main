import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, MapPin } from 'lucide-react';

const eventHighlights = [
  {
    label: 'Cerimônia',
    title: 'Catedral',
    time: '19:00 - 21:00',
    place: 'Esplanada dos Ministérios, lote 12',
  },
  {
    label: 'Recepção',
    title: 'NAU Frutos do Mar - Lago',
    time: '21:00 - 02:00',
    place: 'SCES Trecho 2, Conjunto 31/32',
  },
];

export function HomeEventHighlights() {
  return (
    <section id="eventos-resumo" className="relative z-10 bg-surface px-6 py-20 md:px-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <span className="mb-4 block font-label text-[10px] uppercase tracking-[0.3em] text-secondary">
            Informações do evento
          </span>
          <h2 className="font-headline text-4xl italic leading-tight text-on-surface md:text-6xl">
            O essencial do grande dia, sem caçar informação.
          </h2>
          <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-on-surface-variant">
            Cerimônia, recepção, deslocamento, traje e hospedagem ficam concentrados na página de eventos.
          </p>
          <Link
            href="/eventos"
            className="mt-8 inline-flex items-center gap-3 rounded-sm border border-gold/40 bg-gold px-6 py-3 font-label text-xs uppercase tracking-[0.24em] text-black transition-colors hover:bg-yellow-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Ver Eventos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {eventHighlights.map((item) => (
            <article
              key={item.label}
              className="rounded-sm border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <span className="font-label text-[10px] uppercase tracking-[0.28em] text-secondary">
                  {item.label}
                </span>
                <CalendarDays className="h-5 w-5 text-gold" strokeWidth={1.7} />
              </div>
              <h3 className="font-headline text-3xl italic leading-tight text-on-surface">
                {item.title}
              </h3>
              <div className="mt-6 space-y-3 font-body text-sm leading-relaxed text-on-surface-variant">
                <p className="flex items-center gap-3">
                  <Clock className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.7} />
                  <span>{item.time}</span>
                </p>
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.7} />
                  <span>{item.place}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
