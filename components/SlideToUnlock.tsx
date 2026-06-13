"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SlideToUnlockProps {
  children?: React.ReactNode;
  onUnlock: () => void;
  sliderText?: string;
  unlockedContent: React.ReactNode;
  className?: string;
  shimmer?: boolean;
}

export const SlideToUnlock = ({
  children,
  onUnlock,
  sliderText = "Deslize para abrir o presente",
  unlockedContent,
  className,
  shimmer = true,
}: SlideToUnlockProps) => {
  const [unlocked, setUnlocked] = useState(false);
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
      setUnlocked(true);
      onUnlock();
    } else {
      x.set(0);
    }
  };

  const textOpacity = useTransform(x, (value) => {
    if (dragConstraint === 0) return 1;
    return Math.max(0, 1 - value / dragConstraint);
  });

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div
            key="slider"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div
              ref={sliderRef}
              className="relative h-12 w-full rounded-sm bg-surface-container-high/80 border border-outline-variant/10 shadow-inner"
            >
              <motion.div
                ref={handleRef}
                drag="x"
                dragConstraints={{ left: 0, right: dragConstraint }}
                dragElastic={0.1}
                style={{ x }}
                onDragEnd={onDragEnd}
                className="absolute left-0 top-0 z-20 flex h-12 w-16 cursor-grab items-center justify-center rounded-sm bg-primary active:cursor-grabbing hover:bg-primary-hover shadow-lg transition-colors border border-primary-dim"
              >
                <ChevronRight className="h-6 w-6 text-on-primary" />
              </motion.div>
              <motion.span
                style={{ opacity: textOpacity }}
                className={cn(
                  "absolute inset-0 flex items-center justify-start font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant pl-20 pr-4 pointer-events-none select-none z-10",
                  shimmer && "animate-pulse"
                )}
              >
                {sliderText}
              </motion.span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {unlockedContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
