"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tubesRef = useRef<any>(null);
  
  // Master progress for syncing Neon Flow
  const masterProgress = useMotionValue(0);

  useEffect(() => {
    setIsMounted(true);
    
    // Stage 0: Discrete Logo Reveal (3s)
    const t1 = setTimeout(() => {
      setStep(1);
      masterProgress.set(0); 
    }, 3200);

    // Stage 1: Cathedral Formation (4s)
    const t2 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 7200);

    // Initial Neon Flow (Tubes) Effect
    let mounted = true;
    const initTubes = async () => {
      if (!canvasRef.current || typeof window === 'undefined') return;
      try {
        const threeModule = await eval(`import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')`);
        const TubesCursor = threeModule.default;
        if (!mounted) return;

        const app = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ["#0a1f33", "#1a2f3d", "#000000"],
            lights: {
              intensity: 150,
              colors: ["#d4af37", "#4ea8de", "#ffffff"]
            }
          }
        });
        tubesRef.current = app;

        // Custom update loop for precision motion
        let frame: number;
        const updateLoop = () => {
          // Optimization: Stop the loop if we are no longer in Step 0
          if (step !== 0) {
            cancelAnimationFrame(frame);
            return;
          }

          if (tubesRef.current && canvasRef.current) {
            const progress = masterProgress.get();
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            let targetX = width / 2;
            let targetY = height / 2;

            if (step === 0) {
              // Logo Step: Very discrete, slow circular motion in center
              const angle = progress * Math.PI * 4;
              const radius = 40 + Math.sin(progress * Math.PI) * 20;
              targetX = width / 2 + Math.cos(angle) * radius;
              targetY = height / 2 + Math.sin(angle) * radius;
              
              tubesRef.current.tubes.setColors(["#0a1f33", "#d4af37", "#1a2f3d"]);
            } else {
              // Cathedral Step: High-granularity vertical trace
              const columns = 16;
              const colIndex = Math.floor(progress * columns);
              const colProgress = (progress * columns) % 1;
              const radius = 240;
              const angle = (colIndex / columns) * Math.PI * 2;
              const txBase = Math.cos(angle) * radius;
              targetX = width / 2 + txBase * (1 - colProgress * 0.35);
              targetY = height - (colProgress * height * 0.9) - 20;
              
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

        return () => cancelAnimationFrame(frame);
      } catch (e) {
        console.error("Neon Flow init failed", e);
      }
    };
    initTubes();

    // Progress animation sync
    let animationControls: any;
    if (step === 0) {
      animationControls = animate(masterProgress, 1, {
        duration: 3,
        ease: "easeInOut"
      });
    } else {
      animationControls = animate(masterProgress, 1, {
        duration: 3,
        ease: "easeOut"
      });
    }

    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      if (animationControls) animationControls.stop();
    };
  }, [step, onComplete, masterProgress]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1520] overflow-hidden pointer-events-none select-none">
      <canvas 
        ref={canvasRef} 
        className={cn(
          "absolute inset-0 w-full h-full block mix-blend-screen transition-opacity duration-1000",
          step === 0 ? "opacity-40" : "opacity-0"
        )}
        style={{ touchAction: 'none' }}
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-gold/5" />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="logo-first"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 0.8 } }}
            className="flex flex-col items-center justify-center w-full h-full relative"
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
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
              <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 100 100" 
                className="absolute inset-0 stroke-[#0a1f33]/90 fill-transparent overflow-visible"
              >
                <defs>
                  <filter id="finalGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <radialGradient id="innerLight" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <g style={{ filter: "drop-shadow(0 0 1px rgba(10, 31, 51, 0.2))" }}>
                  {(() => {
                    const columnsData = Array.from({ length: 16 }).map((_, i) => {
                      const angle = (i / 16) * Math.PI * 2;
                      const sin = Math.sin(angle);
                      const cos = Math.cos(angle);
                      const tilt = 0.35; // Perspective tilt factor

                      const getPt = (r: number, y: number) => ({
                        x: 50 + r * cos,
                        y: y + r * sin * tilt
                      });

                      const p0 = getPt(42, 85); // Base
                      const cp1 = getPt(28, 60); // Lower flare
                      const cp2 = getPt(10, 35);  // Pinch (Waist)
                      const p3 = getPt(18, 8);   // Top flare

                      return {
                        id: i,
                        z: sin,
                        isFront: sin > -0.01,
                        p0, cp1, cp2, p3,
                        d: `M ${p0.x} ${p0.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p3.x} ${p3.y}`
                      };
                    });

                    // Sort for rendering back to front
                    const renderList = [...columnsData].sort((a, b) => a.z - b.z);

                    return (
                      <>
                        {/* Minimalist Base Ring */}
                        <motion.ellipse
                          cx="50" cy="85" rx="42" ry={42 * 0.35}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.25 }}
                          transition={{ delay: 0.5, duration: 2.5, ease: "easeInOut" }}
                          strokeWidth="0.2"
                          fill="none"
                          className="stroke-gold/60"
                        />

                        {/* Rendering Radiant Minimalist Columns */}
                        {renderList.map((col, idx) => (
                           <g key={`col-group-${col.id}`}>
                              {/* Progressive Structural Base Path */}
                              <motion.path
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: col.isFront ? 0.8 : 0.25 }}
                                transition={{ 
                                  duration: 3.5, 
                                  delay: 0.2 + idx * 0.08, 
                                  ease: [0.22, 1, 0.36, 1] 
                                }}
                                d={col.d}
                                strokeWidth={col.isFront ? "0.4" : "0.15"}
                                strokeLinecap="round"
                                className="stroke-gold"
                                fill="none"
                              />

                              {/* Moving Radiant Gold Beams - Multiple layers for glow depth */}
                              <motion.path
                                initial={{ opacity: 0, strokeDasharray: "30 150", strokeDashoffset: 150 }}
                                animate={{ 
                                  opacity: [0, 1, 1, 0], 
                                  strokeDashoffset: [150, -50] 
                                }}
                                transition={{ 
                                  duration: 3.5 + (col.id % 4) * 0.3, 
                                  delay: 1.0 + idx * 0.12, 
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                                d={col.d}
                                strokeWidth={col.isFront ? "2.5" : "1.0"}
                                strokeLinecap="round"
                                className="stroke-gold/20"
                                style={{ filter: "blur(4px)" }}
                                fill="none"
                              />
                              <motion.path
                                initial={{ opacity: 0, strokeDasharray: "15 150", strokeDashoffset: 150 }}
                                animate={{ 
                                  opacity: [0, 1, 1, 0], 
                                  strokeDashoffset: [150, -50] 
                                }}
                                transition={{ 
                                  duration: 3.5 + (col.id % 4) * 0.3, 
                                  delay: 1.0 + idx * 0.12, 
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                                d={col.d}
                                strokeWidth={col.isFront ? "1.2" : "0.5"}
                                strokeLinecap="round"
                                className="stroke-[#ffe58f]"
                                style={{ filter: "url(#goldGlow)" }}
                                fill="none"
                              />
                           </g>
                        ))}

                        {/* Top Crucifix Minimalist Glowing Gold */}
                        <g className="stroke-[#ffe58f]" style={{ filter: "url(#goldGlow)" }}>
                          {/* Main Vertical Beam */}
                          <motion.line
                            x1="50" y1="35"
                            x2="50" y2="0"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.9 }}
                            transition={{ delay: 2.5, duration: 1 }}
                            strokeWidth="0.8"
                            strokeLinecap="round"
                          />
                          {/* Horizontal Beam (Slightly tilted in perspective) */}
                          <motion.line
                            x1="45" y1="8"
                            x2="55" y2="8"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.9 }}
                            transition={{ delay: 2.8, duration: 0.8 }}
                            strokeWidth="0.6"
                            strokeLinecap="round"
                          />
                          {/* Depth Beam of the Cross */}
                          <motion.line
                            x1="48" y1="6.5"
                            x2="52" y2="9.5"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.7 }}
                            transition={{ delay: 3.0, duration: 0.8 }}
                            strokeWidth="0.5"
                            strokeLinecap="round"
                          />
                        </g>

                        {/* Minimalist Luminescent Core */}
                        <motion.circle
                          cx="50"
                          cy="42"
                          r="12"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.4 }}
                          transition={{ delay: 3.2, duration: 2.5 }}
                          fill="url(#innerLight)"
                          style={{ mixBlendMode: 'screen' }}
                        />
                      </>
                    );
                  })()}
                </g>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
