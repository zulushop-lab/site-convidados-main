'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

export function Footer() {
  const triggerLoading = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ais-loading-start'));
    }
  };

  return (
    <div className="w-full px-4 md:px-8 pb-32 md:pb-32 pt-10 flex justify-center z-10 relative">
      <motion.footer
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        className="wedding-glass w-full max-w-7xl rounded-[2rem] p-8 md:p-12 text-on-background/80 flex flex-col items-center justify-center text-center"
      >
        <div className="relative h-20 w-20 md:h-24 md:w-24 mb-6 transition-transform duration-700 hover:scale-105">
          <Image
            src="/matheus-isadora-monogram_charcoal_trim.png"
            alt="Isadora & Matheus"
            fill
            quality={85}
            sizes="(max-width: 768px) 96px, 112px"
            className="object-contain dark:hidden [filter:sepia(1)_saturate(5)_hue-rotate(10deg)]"
          />
          <Image
            src="/matheus-isadora-monogram_charcoal_trim.png"
            alt="Isadora & Matheus"
            fill
            quality={85}
            sizes="(max-width: 768px) 96px, 112px"
            className="object-contain hidden dark:block [filter:sepia(1)_saturate(5)_hue-rotate(10deg)] invert opacity-80"
          />
        </div>
        <h3 className="text-2xl md:text-3xl font-playfair italic text-gold mb-6 mt-2">Isadora & Matheus</h3>
        
        <div className="pt-8 border-t border-gold/10 w-full max-w-md flex flex-col items-center justify-center gap-4">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('ais-trigger-intro'));
                import('./GlobalAudioPlayer').then(m => m.playGlobalIntroAudio());
              }
            }}
            className="text-[10px] font-label uppercase tracking-[0.3em] text-gold/60 hover:text-gold transition-colors duration-300 border border-gold/20 hover:border-gold/40 px-6 py-2.5 rounded-full"
          >
            Refazer Animação de Entrada
          </button>
          
          <p className="text-sm font-headline italic opacity-80">
            2026... até o amor <Heart className="inline w-3 h-3 text-gold mx-1 fill-gold/50" />
          </p>
        </div>
      </motion.footer>
    </div>
  );
}

