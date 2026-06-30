'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) setMounted(true);
  }, [mounted]);

  if (!mounted) {
    return <div className="w-8 h-8" />; // placeholder
  }

  const activeTheme = resolvedTheme ?? theme ?? 'light';
  const isDark = activeTheme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full text-gold transition-colors hover:bg-surface-container/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-secondary"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTheme}
          initial={{ y: 20, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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

