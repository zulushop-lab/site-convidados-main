'use client';

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, MapPin, Gift, Camera, UserCheck, CalendarHeart, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { TiltCard } from "./TiltCard";
import Image from "next/image";
import { NoiseOverlay } from "./NoiseOverlay";

interface MenuCardProps {
  title: string;
  excerpt: string;
  image: string;
  href: string;
  icon: React.ElementType;
  className?: string;
}

function MenuCard({
  title,
  excerpt,
  image,
  href,
  icon: Icon,
  index,
  className,
}: MenuCardProps & { index: number }) {
  const formattedIndex = (index + 1).toString().padStart(2, '0');
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanding, setIsExpanding] = useState(false);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === href) return;
    
    setIsExpanding(true);
    window.dispatchEvent(new Event('ais-loading-start'));
    
    setTimeout(() => {
      router.push(href);
    }, 700);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
        className={cn("w-full h-full relative", className)}
      >
        <TiltCard tiltLimit={5} scale={1.02} spotlight className="h-full">
          <div onClick={handleContainerClick} className="block h-full w-full">
            <motion.div layoutId={`card-container-${href}`} className="group relative h-full overflow-hidden rounded-[2rem] border border-outline-variant/30 bg-surface-container-high/30 backdrop-blur-md transition-all duration-500 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/10 flex flex-col cursor-pointer">
              <NoiseOverlay />
              
              {/* Image Section */}
              <div className="relative aspect-[4/3] overflow-hidden w-full">
                <motion.div layoutId={`card-image-${href}`} className="absolute inset-0 w-full h-full">
                  <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent opacity-80" />
                </motion.div>
                
                <div className="absolute top-4 left-4">
                <div className="bg-surface/50 backdrop-blur-md p-3 rounded-full border border-white/10 text-gold shadow-lg group-hover:bg-gold/10 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              
              {/* Number with Gradient */}
              <div className="absolute top-[18px] right-6">
                <span className="text-6xl md:text-7xl font-headline italic font-extralight tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-[#F2D780] to-gold drop-shadow-[0_4px_15px_rgba(212,175,55,0.6)] opacity-90 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 ease-[0.22,1,0.36,1] origin-right select-none">
                  {formattedIndex}
                </span>
              </div>
              
              {/* Hover Overlay Action */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] opacity-0 transition-all duration-500 group-hover:opacity-100">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-3 rounded-full bg-gradient-to-r from-gold via-[#F2D780] to-gold px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-surface shadow-[0_10px_30px_rgba(212,175,55,0.4)] font-label"
                >
                  Explorar
                  <ArrowRight className="h-4 w-4" />
                </motion.div>
              </div>
            </div>

              {/* Content Section */}
              <div className="flex flex-col gap-4 p-8 flex-1 justify-between bg-gradient-to-b from-surface/50 to-surface relative overflow-hidden">
                {/* Subtle glass texture overlay on content */}
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                
                <motion.div layoutId={`card-content-${href}`} className="space-y-5 relative z-10">
                  <h3 className="text-3xl md:text-4xl font-headline italic text-on-surface transition-all duration-500 group-hover:text-gold group-hover:translate-x-1 flex items-center">
                    {title}
                  </h3>
                  <p className="line-clamp-2 text-base md:text-lg italic text-on-surface-variant font-body leading-relaxed group-hover:text-on-surface transition-colors duration-500">
                    {excerpt}
                  </p>
                </motion.div>
              </div>
              
            </motion.div>
          </div>
        </TiltCard>
      </motion.div>

      <AnimatePresence>
        {isExpanding && (
          <motion.div
            layoutId={`card-container-${href}`}
            style={{ borderRadius: 0 }}
            className="fixed inset-0 z-[100] bg-surface cursor-default overflow-hidden flex flex-col"
          >
            <motion.div layoutId={`card-image-${href}`} className="absolute top-0 inset-x-0 h-[50vh] w-full">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-surface" />
            </motion.div>

            <div className="absolute inset-x-0 bottom-0 top-[40vh] bg-surface rounded-t-3xl p-8 z-10 flex flex-col items-center">
              <motion.div layoutId={`card-content-${href}`} className="w-full max-w-3xl flex flex-col items-center text-center">
                <h3 className="font-headline italic text-5xl md:text-6xl text-on-surface mb-4">
                  {title}
                </h3>
                <p className="font-body text-on-surface-variant text-lg max-w-lg">
                  {excerpt}
                </p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-12 flex space-x-2"
                >
                  <div className="w-2 h-2 bg-on-surface rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-on-surface rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-on-surface rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function HomeMenuCards() {
  const cards = [
    {
      title: "Confirmar Presença",
      excerpt: "Sua presença é essencial. Por favor, confirme para nos ajudar a organizar tudo com perfeição.",
      image: "/imagem-3.jpg",
      href: "/presenca",
      icon: UserCheck,
    },
    {
      title: "O Grande Dia",
      excerpt: "Toda a programação, horários e detalhes para celebrar esse momento conosco.",
      image: "/imagem-1.jpg",
      href: "/eventos",
      icon: CalendarHeart,
    },
    {
      title: "Nossa Jornada",
      excerpt: "Conheça nossos momentos mais especiais e a história que construímos.",
      image: "/imagem-2.jpg",
      href: "/#historia",
      icon: Heart,
    },
    {
      title: "Presentes",
      excerpt: "Preparamos uma lista especial com muito carinho para quem desejar nos presentear.",
      image: "/imagem-3.jpg",
      href: "/presentes",
      icon: Gift,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {cards.map((card, index) => (
          <MenuCard key={index} index={index} {...card} />
        ))}
      </div>
    </div>
  );
}
