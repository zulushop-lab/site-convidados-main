'use client';

import { useState, useEffect } from 'react';
import { Home, CalendarHeart, Gift, Mail, Camera } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

export function GlobalNavigationOptions() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme === 'system' ? resolvedTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

  useEffect(() => {
    if (pathname !== '/') {
      setIsVisible(true);
    } else {
      setIsVisible(window.scrollY > window.innerHeight * 0.25);
    }
  }, [pathname]);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      if (pathname === '/') {
        if (latest > window.innerHeight * 0.25) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    });
  }, [pathname, scrollY]);

  const items = [
    { label: 'Início', icon: Home, href: '/' },
    { label: 'Fotos', icon: Camera, href: '/galeria' },
    { label: 'Evento', icon: CalendarHeart, href: '/eventos' },
    { label: 'Presentes', icon: Gift, href: '/presentes' },
    { label: 'Presença', icon: Mail, href: '/presenca' }
  ];

  const handleLinkClick = (href: string) => {
    if (pathname !== href) {
      window.dispatchEvent(new Event('ais-loading-start'));
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="dock-menu"
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[100] w-full"
        >
        <motion.div 
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={{ backgroundColor: isDark ? "rgba(10,10,10,0.25)" : "rgba(255,255,255,0.35)" }} 
          className={cn(
            "w-full h-[84px] md:h-[91px] flex justify-center items-center px-4 md:px-8 border-t overflow-visible relative transition-colors duration-500",
            "backdrop-blur-[24px] saturate-150",
            isDark ? "border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.3)]" : "border-white/50 shadow-[0_-20px_40px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]"
          )}
        >
          {/* subtle noise texture for realism */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Liquid glass top edge highlight */}
          <div className={cn("absolute inset-x-0 top-0 h-[1px] pointer-events-none", isDark ? "bg-gradient-to-r from-transparent via-white/15 to-transparent" : "bg-gradient-to-r from-transparent via-white/80 to-transparent")} />
          
          {/* Refined gold accent top line spanning the whole width with glow */}
          <div className={cn("absolute top-0 inset-x-0 h-[1px]", isDark ? "bg-gradient-to-r from-transparent via-gold/40 to-transparent shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "bg-gradient-to-r from-transparent via-gold/40 to-transparent shadow-[0_1px_15px_rgba(212,175,55,0.3)]")} />
          
          <div className="flex justify-around items-center w-full max-w-3xl px-1 relative z-10">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-[60px] sm:w-[70px] md:w-[85px] h-[61px] transition-all duration-500 group",
                    isActive 
                      ? isDark ? "text-gold" : "text-[#8C6A0A]" // Darker gold in light mode for better readability
                      : isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
                  )}
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 flex flex-col items-center gap-1"
                  >
                    <Icon strokeWidth={isActive ? 2 : 1.75} className={cn("w-[22px] h-[22px] md:w-[26px] md:h-[26px] transition-all duration-500", isActive && isDark && "drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]", !isDark && "drop-shadow-sm")} />
                    <span className={cn(
                      "text-[7px] sm:text-[8px] md:text-[9.5px] font-label uppercase tracking-[0.08em] sm:tracking-[0.14em] md:tracking-[0.25em] whitespace-nowrap transition-all duration-500",
                      isActive ? "opacity-100 font-semibold" : "opacity-90 font-medium",
                      !isDark && "drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]"
                    )}>
                      {item.label}
                    </span>
                  </motion.div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="active-dock-bg"
                      className={cn(
                        "absolute inset-0 backdrop-blur-md rounded-2xl z-0 transition-colors duration-500 border",
                        isDark 
                          ? "bg-gradient-to-br from-white/10 to-white/5 border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_0_4px_12px_rgba(0,0,0,0.2)]" 
                          : "bg-gradient-to-br from-gold/30 via-gold/15 to-gold/5 border-white/60 shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),_inset_0_-1px_2px_rgba(212,175,55,0.1),_0_4px_12px_rgba(212,175,55,0.15)]"
                      )}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
