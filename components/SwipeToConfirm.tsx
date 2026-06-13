"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SwipeToConfirmProps {
  onConfirm: () => void;
  guestName: string;
  className?: string;
  resetAfterDelay?: number; // Opcional para resetar o botão
}

export const SwipeToConfirm = ({
  onConfirm,
  guestName,
  className,
  resetAfterDelay,
}: SwipeToConfirmProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const [dragConstraint, setDragConstraint] = useState(0);
  const x = useMotionValue(0);

  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sliderWidth = sliderRef.current?.offsetWidth || 0;
    const handleWidth = handleRef.current?.offsetWidth || 0;
    setDragConstraint(sliderWidth - handleWidth);
  }, []);

  const onDragEnd = (event: any, info: any) => {
    if (info.offset.x > dragConstraint * 0.8) {
      setConfirmed(true);
      // Snap to end
      x.set(dragConstraint);
      onConfirm();
      
      if (resetAfterDelay) {
        setTimeout(() => {
          setConfirmed(false);
          x.set(0);
        }, resetAfterDelay);
      }
    } else {
      // Snap back ao soltar sem completar
      x.set(0);
    }
  };

  // Fading granular do texto durante o swipe (opacity de 1 até 0 de acordo com o drag)
  const textOpacity = useTransform(x, [0, dragConstraint * 0.7], [1, 0]);

  return (
    <div
      className={cn(
        "relative w-full max-w-sm mx-auto overflow-hidden rounded-full p-1",
        "bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]", // Liquid glass effect
        className
      )}
    >
      <div
        ref={sliderRef}
        className="relative h-14 w-full flex items-center justify-between"
      >
        <motion.div
          ref={handleRef}
          drag="x"
          dragConstraints={{ left: 0, right: dragConstraint }}
          dragElastic={0.1}
          style={{ x }}
          onDragEnd={onDragEnd}
          className={cn(
            "absolute left-0 top-0 z-20 flex h-14 w-14 cursor-grab items-center justify-center rounded-full active:cursor-grabbing shadow-lg transition-colors border",
            confirmed 
              ? "bg-green-500/80 border-green-400/50 text-white" 
              : "bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </motion.div>
        
        <motion.span
          style={{ opacity: textOpacity }}
          className={cn(
            "absolute inset-0 flex items-center justify-center w-full text-sm font-medium tracking-wide text-white/90 pointer-events-none select-none z-10 pl-8",
          )}
        >
          {confirmed ? "Confirmado" : `Confirmar ${guestName}`}
        </motion.span>
      </div>
    </div>
  );
};
