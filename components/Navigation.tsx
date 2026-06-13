'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Heart, Calendar, UserCheck, Gift, Sun, Moon, Menu, X, ChevronRight, ExternalLink } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const triggerLoading = (href?: string) => {
  if (typeof window !== 'undefined') {
    // Only trigger if we are navigating to a different page or the route starts with /
    const currentPath = window.location.pathname;
    if (href && (href.startsWith('/#') || href === currentPath)) {
      return;
    }
    window.dispatchEvent(new Event('ais-loading-start'));
  }
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) setMounted(true);
  }, [mounted]);

  if (!mounted) {
    return <div className="w-8 h-8" />; // placeholder
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full text-gold dark:text-secondary hover:bg-surface-container/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary relative overflow-hidden"
      aria-label="Alternar tema"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: 20, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLinkClick = (href: string) => {
    if (pathname !== href) {
      window.dispatchEvent(new Event('ais-loading-start'));
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = pathname === '/';
  const isHeroPage = isHome || pathname === '/eventos' || pathname === '/presenca' || pathname === '/presentes';

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-[60] transition-all duration-500 flex justify-between items-center px-6 py-4 border-b ${
          isScrolled
            ? 'bg-surface/80 backdrop-blur-xl border-outline-variant/10 py-3 shadow-sm' 
            : isHeroPage 
              ? 'bg-transparent border-transparent py-6' 
              : 'bg-surface border-outline-variant/5'
        }`}
      >
        <Link 
          href="/"
          onClick={() => handleLinkClick('/')}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-2 group transition-all active:scale-95"
          aria-label="Ir para a página inicial"
        >
          <div className="relative h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
            <Image 
              src="/matheus-isadora-monogram_charcoal_trim.png" 
              alt="Logo" 
              fill
              quality={85}
              sizes="(max-width: 768px) 40px, 48px"
              className={`object-contain dark:hidden transition-all duration-500 ${
                !isScrolled && isHeroPage ? 'brightness-0 invert' : '[filter:sepia(1)_saturate(5)_hue-rotate(10deg)]'
              } group-hover:scale-110`}
              priority
            />
            <Image 
              src="/matheus-isadora-monogram_charcoal_trim.png" 
              alt="Logo" 
              fill
              quality={85}
              sizes="(max-width: 768px) 40px, 48px"
              className={`object-contain hidden dark:block transition-all duration-500 ${
                !isScrolled && isHeroPage ? 'brightness-0 invert' : '[filter:sepia(1)_saturate(5)_hue-rotate(10deg)]'
              } group-hover:scale-110`}
              priority
            />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className={`text-xl md:text-2xl font-playfair italic transition-all duration-700 tracking-tight drop-shadow-sm ${
              !isScrolled && isHeroPage 
                ? 'text-white opacity-0 md:opacity-100 -translate-x-4 pointer-events-none' 
                : 'text-gold opacity-100 translate-x-0'
            }`}>
              Isadora & Matheus
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}


