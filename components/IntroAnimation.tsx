"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CathedralSVG } from "@/components/CathedralSVG";
import { useReducedMotionPreference } from "@/lib/hooks/useReducedMotionPreference";

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tubesRef = useRef<any>(null);
  const reducedMotion = useReducedMotionPreference();
  const masterProgress = useMotionValue(0);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStep(1);
      masterProgress.set(0);
    }, 3200);

    const t2 = setTimeout(() => {
      onComplete();
    }, 7200);

    let mounted = true;
    let frame: number | undefined;

    const initTubes = async () => {
      const browserReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion || browserReducedMotion || !canvasRef.current || typeof window === "undefined") return;

      try {
        const threeModule = await import("threejs-components/build/cursors/tubes1.min.js");
        const TubesCursor = threeModule.default;
        if (!mounted || !canvasRef.current) return;

        const app = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ["#0a1f33", "#1a2f3d", "#000000"],
            lights: {
              intensity: 150,
              colors: ["#d4af37", "#4ea8de", "#ffffff"],
            },
          },
        });
        tubesRef.current = app;

        const updateLoop = () => {
          if (step !== 0) {
            if (frame) cancelAnimationFrame(frame);
            return;
          }

          if (tubesRef.current && canvasRef.current) {
            const progress = masterProgress.get();
            const width = window.innerWidth;
            const height = window.innerHeight;

            let targetX = width / 2;
            let targetY = height / 2;

            if (step === 0) {
              const angle = progress * Math.PI * 4;
              const radius = 40 + Math.sin(progress * Math.PI) * 20;
              targetX = width / 2 + Math.cos(angle) * radius;
              targetY = height / 2 + Math.sin(angle) * radius;

              tubesRef.current.tubes.setColors(["#0a1f33", "#d4af37", "#1a2f3d"]);
            } else {
              const columns = 16;
              const colIndex = Math.floor(progress * columns);
              const colProgress = (progress * columns) % 1;
              const radius = 240;
              const angle = (colIndex / columns) * Math.PI * 2;
              const txBase = Math.cos(angle) * radius;
              targetX = width / 2 + txBase * (1 - colProgress * 0.35);
              targetY = height - colProgress * height * 0.9 - 20;

              tubesRef.current.tubes.setColors(
                progress > 0.5
                  ? ["#d4af37", "#f0f5fa", "#4ea8de"]
                  : ["#1a2f3d", "#0a1f33", "#2a1f0d"]
              );
            }

            if (tubesRef.current.pointer) {
              tubesRef.current.pointer.x = (targetX / width) * 2 - 1;
              tubesRef.current.pointer.y = -(targetY / height) * 2 + 1;
              tubesRef.current.pointer.moved = true;
            }
          }

          frame = requestAnimationFrame(updateLoop);
        };

        updateLoop();
      } catch (e) {
        console.error("Neon Flow init failed", e);
      }
    };

    initTubes();

    const animationControls = animate(masterProgress, 1, {
      duration: reducedMotion ? 0 : 3,
      ease: step === 0 ? "easeInOut" : "easeOut",
    });

    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      if (frame) cancelAnimationFrame(frame);
      animationControls.stop();
    };
  }, [step, onComplete, masterProgress, reducedMotion]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1520] overflow-hidden pointer-events-none select-none">
      <canvas
        ref={canvasRef}
        data-motion-canvas="intro"
        className={cn(
          "absolute inset-0 w-full h-full block mix-blend-screen transition-opacity duration-1000",
          step === 0 && !reducedMotion ? "opacity-40" : "opacity-0"
        )}
        style={{ touchAction: "none" }}
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-gold/5" />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="logo-first"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: reducedMotion ? 0.2 : 0.8 } }}
            className="flex flex-col items-center justify-center w-full h-full relative"
          >
            <motion.div
              initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0.2 : 1.5, ease: "easeOut" }}
              className="relative w-64 h-64 md:w-80 md:h-80"
            >
              <Image
                src="/matheus-isadora-monogram_gold_trim.png"
                alt="Logo"
                fill
                sizes="(max-width: 768px) 256px, 320px"
                className="object-contain"
                priority
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="cathedral-hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center w-full h-full relative"
          >
            <div className="relative w-[380px] h-[380px] md:w-[650px] md:h-[650px] flex items-center justify-center transform-gpu will-change-transform">
              <CathedralSVG reduced={reducedMotion} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
