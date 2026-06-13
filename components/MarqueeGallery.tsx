'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import Image from 'next/image';

export function MarqueeGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const x1 = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const x2 = useTransform(scrollYProgress, [0, 1], [-500, 0]);

  const images1 = [
    '/imagem-1.jpg',
    '/imagem-2.jpg',
    '/imagem-3.jpg',
    '/imagem-1.jpg',
    '/imagem-2.jpg',
  ];

  const images2 = [
    '/imagem-3.jpg',
    '/imagem-1.jpg',
    '/imagem-2.jpg',
    '/imagem-3.jpg',
    '/imagem-1.jpg',
  ];

  return (
    <>
      <section ref={containerRef} className="py-24 overflow-hidden bg-surface relative">
        <div className="flex flex-col gap-8">
          <motion.div style={{ x: x1 }} className="flex gap-8 w-max">
            {images1.map((src, idx) => (
              <div 
                key={idx} 
                onClick={() => setFullscreenImage(src)}
                className="relative w-64 h-80 md:w-80 md:h-96 rounded-2xl overflow-hidden shrink-0 cursor-pointer group"
              >
                <ImageWithSkeleton src={src} fill alt={`Galeria ${idx}`} className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110" />
              </div>
            ))}
          </motion.div>
          <motion.div style={{ x: x2 }} className="flex gap-8 w-max">
            {images2.map((src, idx) => (
              <div 
                key={idx} 
                onClick={() => setFullscreenImage(src)}
                className="relative w-64 h-80 md:w-80 md:h-96 rounded-2xl overflow-hidden shrink-0 cursor-pointer group"
              >
                <ImageWithSkeleton src={src} fill alt={`Galeria ${idx}`} className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-8"
            onClick={() => setFullscreenImage(null)}
          >
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-[110]"
              onClick={() => setFullscreenImage(null)}
              aria-label="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </motion.button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl aspect-video md:aspect-[4/3] lg:aspect-video rounded-xl overflow-hidden shadow-2xl isolate"
              onClick={(e) => e.stopPropagation()}
            >
              <Image 
                src={fullscreenImage} 
                alt="Imagem em tela cheia" 
                fill 
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-contain"
                quality={100}
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
