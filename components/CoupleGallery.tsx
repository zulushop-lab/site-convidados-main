'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Camera, ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { cn } from '@/lib/utils';
import type { GalleryImage } from '@/lib/gallery';

const aspectByOrientation: Record<GalleryImage['orientation'], string> = {
  portrait: 'aspect-[4/5]',
  landscape: 'aspect-[5/4]',
  square: 'aspect-square',
};

type CoupleGalleryProps = {
  items: GalleryImage[];
};

export function CoupleGallery({ items }: CoupleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeImage = activeIndex === null ? null : items[activeIndex] ?? null;

  const featured = useMemo(() => items.filter((item) => item.featured), [items]);
  const regular = useMemo(() => items.filter((item) => !item.featured), [items]);
  const displayItems = featured.length > 0 ? [...featured, ...regular] : items;

  const openImage = (id: string) => {
    const index = items.findIndex((item) => item.id === id);
    if (index >= 0) setActiveIndex(index);
  };

  const move = useCallback((step: number) => {
    setActiveIndex((current) => {
      if (current === null || items.length === 0) return current;
      return (current + step + items.length) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, move]);

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[42vh] w-full max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-low text-gold shadow-sm">
          <Images className="h-7 w-7" strokeWidth={1.7} />
        </div>
        <p className="mb-3 font-label text-xs uppercase tracking-normal text-secondary">Selecao em andamento</p>
        <h2 className="font-headline text-4xl italic leading-tight text-on-surface md:text-5xl">
          As fotos escolhidas entram aqui.
        </h2>
        <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">
          A pagina ja esta preparada para receber as imagens WebP otimizadas do pre-wedding assim que a lista final for definida.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 pb-28 sm:px-6 md:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayItems.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => openImage(item.id)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '80px' }}
              transition={{ duration: 0.6, delay: Math.min(index * 0.04, 0.24), ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'group relative overflow-hidden rounded-sm bg-surface-container-low text-left shadow-sm outline-none transition-all duration-500 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-gold',
                item.featured ? 'sm:col-span-2 lg:row-span-2' : '',
                aspectByOrientation[item.orientation]
              )}
              aria-label={`Abrir foto ${index + 1}`}
            >
              <ImageWithSkeleton
                src={item.src}
                alt={item.alt}
                fill
                priority={index < 2}
                quality={88}
                sizes={item.featured ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw'}
                className="object-cover transition duration-700 group-hover:scale-105 group-hover:brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-md transition-opacity duration-500 group-hover:opacity-100">
                <Camera className="h-4 w-4" strokeWidth={1.8} />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {activeImage && activeIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveIndex(null)}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex(null);
              }}
              className="absolute right-4 top-4 z-[130] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white md:right-6 md:top-6"
              aria-label="Fechar galeria"
            >
              <X className="h-5 w-5" />
            </button>

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    move(-1);
                  }}
                  className="absolute left-3 top-1/2 z-[130] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white md:left-6"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    move(1);
                  }}
                  className="absolute right-3 top-1/2 z-[130] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white md:right-6"
                  aria-label="Proxima foto"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.div
              key={activeImage.id}
              className="relative h-[82vh] w-full max-w-6xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                priority
                quality={95}
                sizes="100vw"
                className="object-contain"
              />
              <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/45 px-4 py-2 font-label text-xs text-white backdrop-blur-md">
                <span>{activeIndex + 1}</span>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                <span>{items.length}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
