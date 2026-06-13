'use client';

import * as React from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageWithSkeleton } from "./ImageWithSkeleton";
import Image from "next/image";
import Link from "next/link";
import { NoiseOverlay } from "./NoiseOverlay";

export type FocusRailItem = {
  id: string | number;
  title: string;
  description?: string;
  imageSrc: string;
  href?: string;
  meta?: string;
};

interface FocusRailProps {
  items: FocusRailItem[];
  initialIndex?: number;
  loop?: boolean;
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

function wrap(min: number, max: number, v: number) {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

const BASE_SPRING = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 1,
};

const TAP_SPRING = {
  type: "spring" as const,
  stiffness: 450,
  damping: 18,
  mass: 1,
};

export function FocusRail({
  items,
  initialIndex = 0,
  loop = true,
  autoPlay = true,
  interval = 3500,
  className,
}: FocusRailProps) {
  const [active, setActive] = React.useState(initialIndex);
  const [isHovering, setIsHovering] = React.useState(false);
  const [fullscreenImage, setFullscreenImage] = React.useState<string | null>(null);

  const count = items.length;
  const activeIndex = wrap(0, count, active);
  const activeItem = items[activeIndex];

  const handlePrev = React.useCallback(() => {
    if (!loop && active === 0) return;
    setActive((p) => p - 1);
  }, [loop, active]);

  const handleNext = React.useCallback(() => {
    if (!loop && active === count - 1) return;
    setActive((p) => p + 1);
  }, [loop, active, count]);

  React.useEffect(() => {
    if (!autoPlay || isHovering || fullscreenImage) return;
    const timer = setInterval(() => handleNext(), interval);
    return () => clearInterval(timer);
  }, [autoPlay, isHovering, handleNext, interval, fullscreenImage]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (fullscreenImage) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [fullscreenImage]);

  const visibleIndices = [-2, -1, 0, 1, 2];

  return (
    <>
      <div
        className={cn(
          "group relative flex h-[500px] md:h-[600px] w-full flex-col overflow-hidden bg-surface outline-none select-none overflow-x-hidden",
          className
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <NoiseOverlay />
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`bg-${activeItem.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={activeItem.imageSrc}
                alt=""
                fill
                sizes="100vw"
                className="object-cover blur-3xl saturate-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-4 md:px-8 overflow-hidden">
          <div className="relative mx-auto flex h-[320px] md:h-[360px] w-full max-w-6xl items-center justify-center perspective-[1200px]">
            {visibleIndices.map((offset) => {
              const absIndex = active + offset;
              const index = wrap(0, count, absIndex);
              const item = items[index];

              if (!loop && (absIndex < 0 || absIndex >= count)) return null;

              const isCenter = offset === 0;
              const dist = Math.abs(offset);

              const xOffset = offset * 260; // Slightly tighter for mobile
              const zOffset = -dist * 150;
              const scale = isCenter ? 1 : 0.85;
              const rotateY = offset * -15;

              const opacity = isCenter ? 1 : Math.max(0.1, 1 - dist * 0.4);
              const blur = isCenter ? 0 : dist * 4;
              const brightness = isCenter ? 1 : 0.7;

              return (
                <motion.div
                  key={absIndex}
                  className={cn(
                    "absolute aspect-[3/4] w-[200px] md:w-[280px] rounded-2xl border border-outline-variant/20 bg-surface-container-high shadow-2xl transition-shadow duration-300",
                    isCenter ? "z-20 shadow-gold/10" : "z-10 cursor-pointer"
                  )}
                  initial={false}
                  animate={{
                    x: xOffset,
                    z: zOffset,
                    scale: scale,
                    rotateY: rotateY,
                    opacity: opacity,
                    filter: `blur(${blur}px) brightness(${brightness})`,
                  }}
                  transition={{
                    default: BASE_SPRING,
                    scale: TAP_SPRING
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                  onClick={() => {
                    if (offset !== 0) {
                      setActive((p) => p + offset);
                    }
                  }}
                >
                  <NoiseOverlay />
                  <div className="relative w-full h-full rounded-2xl overflow-hidden pointer-events-none">
                    <ImageWithSkeleton src={item.imageSrc} alt={item.title} fill className={cn("object-cover", !isCenter && "grayscale-[30%]")} />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
                  
                  {/* Fullscreen Button */}
                  <AnimatePresence>
                    {isCenter && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute bottom-4 right-4 z-30"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenImage(item.imageSrc);
                          }}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                          aria-label="Ver imagem em tela cheia"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                          </svg>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="mx-auto mt-8 md:mt-12 flex w-full max-w-4xl flex-col items-center justify-between gap-4 md:gap-6 md:flex-row z-20">
            <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left md:h-32 justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem.id}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1 md:space-y-2"
                >
                  {activeItem.meta && (
                    <span className="text-[10px] md:text-[11px] font-label uppercase tracking-[0.3em] font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gold via-yellow-200 to-gold drop-shadow-sm block">
                      {activeItem.meta}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-headline italic tracking-tight text-on-surface">
                    {activeItem.title}
                  </h2>
                  {activeItem.description && (
                    <p className="max-w-md text-on-surface-variant font-body italic text-sm md:text-lg">
                      {activeItem.description}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-5">
                <button
                  onClick={handlePrev}
                  className="rounded-full p-3.5 md:p-4 text-on-surface-variant transition-all border border-outline-variant/30 hover:bg-gold hover:text-surface hover:border-transparent active:scale-90 bg-white/5 backdrop-blur-xl shadow-lg hover:shadow-gold/20"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
                </button>
                
                {activeItem.href && (
                  <Link
                    href={activeItem.href}
                    className="group relative flex items-center gap-3 rounded-full border border-gold/40 bg-white/5 backdrop-blur-2xl px-10 py-3.5 md:py-4 text-[10px] md:text-xs font-label uppercase tracking-[0.3em] text-on-surface transition-all hover:bg-gold hover:text-surface active:scale-95 shadow-xl shadow-gold/10 overflow-hidden"
                  >
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">DESCUBRIR MAIS</span>
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:translate-x-1 relative z-10" />
                  </Link>
                )}
                
                <button
                  onClick={handleNext}
                  className="rounded-full p-3.5 md:p-4 text-on-surface-variant transition-all border border-outline-variant/30 hover:bg-gold hover:text-surface hover:border-transparent active:scale-90 bg-white/5 backdrop-blur-xl shadow-lg hover:shadow-gold/20"
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
                </button>
              </div>
              
              <div className="flex gap-2 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-sm border border-white/[0.05]">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActive(idx)}
                    className={cn(
                      "h-1 rounded-full transition-all duration-700 ease-[0.22,1,0.36,1]",
                      idx === activeIndex 
                        ? "w-10 bg-gradient-to-r from-[#d4af37] to-[#f2d780] shadow-[0_0_10px_rgba(212,175,55,0.4)]" 
                        : "w-2 bg-outline-variant/30 hover:bg-gold/40"
                    )}
                    aria-label={`Ir para a imagem ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
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
