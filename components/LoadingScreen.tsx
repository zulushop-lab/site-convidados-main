'use client';

import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { IntroAnimation } from './IntroAnimation';

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Initial Load Check
  useEffect(() => {
    setMounted(true);
    const hasSeenIntro = sessionStorage.getItem('hasSeenCathedralIntro');
    if (hasSeenIntro) {
      setIsInitialLoad(false);
      setIsVisible(false); // They've seen it, don't show the initial loader
    }
  }, []);

  // Route Change Load - Synchronized with system events
  useEffect(() => {
    if (isInitialLoad || !mounted) return;

    let timeoutId: NodeJS.Timeout;

    const handleStart = () => {
      setIsVisible(true);
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    const handleComplete = () => {
      setTimeout(() => {
        setIsVisible(false);
        if (timeoutId) clearTimeout(timeoutId);
      }, 600);
    };

    const handleTriggerIntro = () => {
      setIsInitialLoad(true);
      setIsVisible(true);
    };

    window.addEventListener('ais-loading-start', handleStart);
    window.addEventListener('ais-trigger-intro', handleTriggerIntro);
    handleComplete();

    return () => {
      window.removeEventListener('ais-loading-start', handleStart);
      window.removeEventListener('ais-trigger-intro', handleTriggerIntro);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname, isInitialLoad, mounted]);

  const handleIntroComplete = () => {
    setIsVisible(false);
    setIsInitialLoad(false);
    sessionStorage.setItem('hasSeenCathedralIntro', 'true');
  };

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && isInitialLoad && (
        <motion.div
           key="cathedral-intro"
           initial={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 1.5, ease: "easeInOut" }}
           className="fixed inset-0 z-[100] bg-black"
        >
          <IntroAnimation onComplete={handleIntroComplete} />
        </motion.div>
      )}

      {isVisible && !isInitialLoad && (
        <motion.div
          key="loader"
          initial={{ opacity: 0, scale: 1.1, rotateX: 5 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.9, rotateX: -5 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ perspective: 1000 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface/10 backdrop-blur-md"
        >
          <div className="relative flex flex-col items-center scale-90 sm:scale-100 will-change-transform">
            {/* Logo Monogram with Pulse and Shimmer */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
              }}
              transition={{ 
                duration: 0.6, 
                ease: [0.22, 1, 0.36, 1] 
              }}
              className="relative h-20 w-20 md:h-28 md:w-28 mb-4"
            >
              <Image
                src="/matheus-isadora-monogram_charcoal_trim.png"
                alt="Logo"
                fill
                className="object-contain [filter:sepia(1)_saturate(5)_hue-rotate(10deg)]"
                priority
                quality={85}
                sizes="(max-width: 768px) 80px, 112px"
              />
              
              {/* Shimmer Effect Overlay */}
              <motion.div
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 0.5
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
              />
            </motion.div>

            {/* Couple Names with Fade In */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-xl md:text-2xl font-playfair italic text-gold tracking-tight">
                Isadora & Matheus
              </h1>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.4, duration: 1, ease: "easeInOut" }}
                className="h-px bg-gold/30 mt-3 mx-auto"
              />
              <p className="font-label text-[8px] uppercase tracking-[0.4rem] text-gold/50 mt-3">
                Carregando...
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

