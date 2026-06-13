'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';
import { IllustrativeAsset } from './IllustrativeAsset';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export interface ProjectData {
  number: string;
  category: string;
  title: string;
  description?: string;
  href?: string;
  assetId?: "cerimonia" | "recepcao" | "traje" | "hospedagem" | "presentes" | "rsvp";
}

export function StickyStack({ items }: { items: ProjectData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div ref={containerRef} className="relative pb-[10vh] mt-24">
      {items.map((item, index) => {
        const topOffset = index * 28;
        
        return (
          <StickyCard 
            key={index}
            item={item} 
            index={index} 
            totalCards={items.length} 
            scrollYProgress={scrollYProgress}
            topOffset={topOffset}
          />
        );
      })}
    </div>
  );
}

function StickyCard({ item, index, totalCards, scrollYProgress, topOffset }: { item: ProjectData, index: number, totalCards: number, scrollYProgress: MotionValue<number>, topOffset: number }) {
  const targetScale = 1 - ((totalCards - 1 - index) * 0.03);
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (item.href && pathname !== item.href) {
      window.dispatchEvent(new Event('ais-loading-start'));
    }
  };

  const startTarget = index / totalCards;
  const endTarget = 1;
  const scale = useTransform(scrollYProgress, [startTarget, endTarget], [1, targetScale]);
  
  const CardContent = (
    <motion.div 
      style={{ scale }}
      className={`w-full max-w-5xl h-full bg-surface-container-high rounded-[32px] md:rounded-[48px] border border-outline-variant/30 p-6 md:p-12 shadow-2xl relative overflow-hidden group ${item.href ? 'cursor-pointer hover:border-gold/30 transition-colors duration-500' : ''} flex flex-col`}
    >
      <div className="flex flex-col md:flex-row flex-1 gap-4 md:gap-16 min-h-0">
        
        {/* Left Side / Content */}
        <div className="flex flex-col flex-1 shrink-0 justify-start">
           <span className="text-6xl md:text-[6rem] font-headline italic leading-none mb-2 md:mb-6 bg-clip-text text-transparent bg-gradient-to-br from-gold via-[#F2D780] to-[#B38728] drop-shadow-md">{item.number}</span>
           <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-label font-semibold mb-1 md:mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gold via-yellow-400 to-gold drop-shadow-sm">{item.category}</span>
           <h3 className="text-3xl md:text-5xl font-headline italic text-on-surface mb-3 md:mb-6">{item.title}</h3>
           
           {item.description && (
             <p className="font-body italic text-on-surface-variant/90 text-lg md:text-2xl leading-relaxed max-w-md mb-4 md:mb-8">
               {item.description}
             </p>
           )}

           {item.href && (
             <div className="flex items-center gap-3 w-fit font-label text-[9px] md:text-[10px] uppercase tracking-[0.2em] border border-gold/40 px-5 py-2.5 md:px-7 md:py-3.5 rounded-full md:mt-auto mb-4 transition-all duration-300 text-gold hover:bg-gradient-to-r hover:from-gold hover:to-[#B38728] hover:text-surface hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:border-transparent">
               VER DETALHES <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
             </div>
           )}
        </div>

        {/* Right Side / Asset Container */}
        <div className="flex-[1.2] flex flex-col min-h-0 relative">
          {/* Decorative lines */}
          <div className="flex flex-col gap-[8px] md:gap-[10px] mb-4 md:mb-8 w-full opacity-20">
            <div className="h-[1px] bg-on-surface w-full"></div>
            <div className="h-[1px] bg-on-surface w-full"></div>
            <div className="h-[1px] bg-on-surface w-full"></div>
          </div>
          
          <div className="flex-1 flex gap-4 min-h-[100px] md:min-h-0">
            <div className={`flex-1 rounded-[16px] md:rounded-[24px] overflow-hidden relative shadow-inner border border-outline-variant/10 group-hover:border-gold/20 transition-colors duration-500`}>
              {item.assetId && (
                <div className="absolute inset-0">
                   <IllustrativeAsset type={item.assetId} className="group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );

  return (
    <div className="sticky h-[85dvh] md:h-[85vh] flex items-center justify-center p-4 md:p-8 w-full" style={{ top: `calc(10dvh + ${topOffset}px)` }}>
      {item.href ? (
        <Link href={item.href} onClick={handleLinkClick} className="w-full h-full flex justify-center items-center">
          {CardContent}
        </Link>
      ) : (
        CardContent
      )}
    </div>
  );
}
