'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Church, UtensilsCrossed, Sparkles, Hotel, HeartHandshake, MailCheck, Glasses } from 'lucide-react';

interface IllustrativeAssetProps {
  type: "cerimonia" | "recepcao" | "traje" | "hospedagem" | "presentes" | "rsvp";
  className?: string;
}

export function IllustrativeAsset({ type, className }: IllustrativeAssetProps) {
  // Config mapping for each type
  const configs = {
    cerimonia: {
      Icon: Church,
      color: "text-[#d4af37]",
      bgGlow: "bg-gradient-to-br from-[#d4af37]/20 via-[#f2d780]/10 to-transparent",
      elements: (
        <>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute inset-20 border border-[#d4af37]/30 rounded-full border-dashed opacity-40 shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-12 border border-[#d4af37]/15 rounded-full opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(212,175,55,0.15),transparent_70%)]" />
        </>
      )
    },
    recepcao: {
      Icon: UtensilsCrossed,
      color: "text-[#ffe58f]",
      bgGlow: "bg-gradient-to-tr from-[#ffe58f]/20 via-[#d4af37]/10 to-transparent",
      elements: (
        <>
          <motion.div animate={{ scale: [1, 1.05, 1], rotate: [45, 50, 45] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-16 border border-[#ffe58f]/40 rounded-[48px] opacity-40 shadow-[0_0_20px_rgba(255,229,143,0.15)]" />
          <motion.div animate={{ scale: [1.05, 1, 1.05], rotate: [-45, -50, -45] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-16 border border-[#ffe58f]/15 rounded-[48px] opacity-30" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_rgba(255,229,143,0.1),transparent_60%)]" />
        </>
      )
    },
    traje: {
      Icon: Glasses,
      color: "text-[#c2a331]",
      bgGlow: "bg-gradient-to-b from-[#c2a331]/20 to-transparent",
      elements: (
        <>
          <motion.div animate={{ y: [-15, 15, -15] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 left-10 w-32 h-64 border border-[#c2a331]/30 rounded-full opacity-25" />
          <motion.div animate={{ y: [15, -15, 15] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-10 right-10 w-40 h-40 border border-[#c2a331]/15 rounded-full opacity-20" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,_rgba(194,163,49,0.1)_25%,transparent_25%,transparent_50%,_rgba(194,163,49,0.1)_50%,_rgba(194,163,49,0.1)_75%,transparent_75%,transparent)] bg-[length:24px_24px] opacity-10" />
        </>
      )
    },
    hospedagem: {
      Icon: Hotel,
      color: "text-white",
      bgGlow: "bg-gradient-to-tl from-white/20 via-transparent to-transparent",
      elements: (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.15),transparent_80%)] opacity-60" />
          <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-12 border-x border-white/25 shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px]" />
        </>
      )
    },
    presentes: {
      Icon: HeartHandshake,
      color: "text-[#d4af37]",
      bgGlow: "bg-gradient-to-bl from-[#d4af37]/20 via-[#f2d780]/5 to-transparent",
      elements: (
        <>
          <motion.div animate={{ scale: [1, 1.03, 1], rotate: [0, 3, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-14 border border-[#d4af37]/40 shadow-[0_0_25px_rgba(212,175,55,0.15)] rounded-sm" />
          <motion.div animate={{ scale: [1.03, 1, 1.03], rotate: [0, -3, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-20 border border-[#d4af37]/20 rounded-sm" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(212,175,55,0.2),transparent_60%)]" />
        </>
      )
    },
    rsvp: {
      Icon: MailCheck,
      color: "text-white",
      bgGlow: "bg-gradient-to-r from-white/15 to-transparent",
      elements: (
        <>
          <motion.div animate={{ opacity: [0.1, 0.4, 0.1], scaleX: [1, 1.1, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-x-12 top-1/2 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <motion.div animate={{ opacity: [0.1, 0.4, 0.1], scaleY: [1, 1.1, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }} className="absolute inset-y-12 left-1/2 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.1),transparent_50%)]" />
        </>
      )
    }
  };

  const config = configs[type];
  const Icon = config.Icon;

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-surface-container flex items-center justify-center", className)}>
      {/* Dynamic Background Glow */}
      <div className={cn("absolute inset-0 blur-3xl opacity-50", config.bgGlow)} />

      {/* Abstract Animated Elements */}
      {config.elements}

      {/* Central Icon Container */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true }}
        className="relative z-10 p-8 md:p-12 rounded-full border border-outline-variant/30 bg-surface/50 backdrop-blur-md shadow-2xl"
      >
        <Icon strokeWidth={1} className={cn("w-20 h-20 md:w-32 md:h-32", config.color)} />
      </motion.div>
    </div>
  );
}
