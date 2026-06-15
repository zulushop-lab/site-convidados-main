"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotionPreference } from "@/lib/hooks/useReducedMotionPreference";

interface CathedralSVGProps {
  className?: string;
  reduced?: boolean;
}

export function CathedralSVG({ className, reduced }: CathedralSVGProps) {
  const reducedMotion = useReducedMotionPreference();
  const isReduced = reduced ?? reducedMotion;
  const idBase = useId().replace(/:/g, "");
  const finalGlowId = `${idBase}-finalGlow`;
  const goldGlowId = `${idBase}-goldGlow`;
  const innerLightId = `${idBase}-innerLight`;

  const columnsData = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const tilt = 0.35;

    const getPt = (r: number, y: number) => ({
      x: 50 + r * cos,
      y: y + r * sin * tilt,
    });

    const p0 = getPt(42, 85);
    const cp1 = getPt(28, 60);
    const cp2 = getPt(10, 35);
    const p3 = getPt(18, 8);

    return {
      id: i,
      z: sin,
      isFront: sin > -0.01,
      d: `M ${p0.x} ${p0.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p3.x} ${p3.y}`,
    };
  });

  const renderList = [...columnsData].sort((a, b) => a.z - b.z);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      className={cn(
        "absolute inset-0 stroke-[#0a1f33]/90 fill-transparent overflow-visible",
        className
      )}
    >
      <defs>
        <filter id={finalGlowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id={goldGlowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={innerLightId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g style={{ filter: "drop-shadow(0 0 1px rgba(10, 31, 51, 0.2))" }}>
        <motion.ellipse
          cx="50"
          cy="85"
          rx="42"
          ry={42 * 0.35}
          initial={isReduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.25 }}
          transition={isReduced ? { duration: 0 } : { delay: 0.5, duration: 2.5, ease: "easeInOut" }}
          strokeWidth="0.2"
          fill="none"
          className="stroke-gold/60"
        />

        {renderList.map((col, idx) => {
          const beamTransition = isReduced
            ? { duration: 0 }
            : {
                duration: 3.5 + (col.id % 4) * 0.3,
                delay: 1.0 + idx * 0.12,
                repeat: Infinity,
                ease: "linear" as const,
              };

          return (
            <g key={`col-group-${col.id}`}>
              <motion.path
                initial={isReduced ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: col.isFront ? 0.8 : 0.25 }}
                transition={
                  isReduced
                    ? { duration: 0 }
                    : {
                        duration: 3.5,
                        delay: 0.2 + idx * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
                d={col.d}
                strokeWidth={col.isFront ? "0.4" : "0.15"}
                strokeLinecap="round"
                className="stroke-gold"
                fill="none"
              />

              <motion.path
                initial={isReduced ? false : { opacity: 0, strokeDasharray: "30 150", strokeDashoffset: 150 }}
                animate={
                  isReduced
                    ? { opacity: col.isFront ? 0.18 : 0.08, strokeDashoffset: 0 }
                    : {
                        opacity: [0, 1, 1, 0],
                        strokeDashoffset: [150, -50],
                      }
                }
                transition={beamTransition}
                d={col.d}
                strokeWidth={col.isFront ? "2.5" : "1.0"}
                strokeLinecap="round"
                className="stroke-gold/20"
                style={{ filter: "blur(4px)" }}
                fill="none"
              />
              <motion.path
                initial={isReduced ? false : { opacity: 0, strokeDasharray: "15 150", strokeDashoffset: 150 }}
                animate={
                  isReduced
                    ? { opacity: col.isFront ? 0.45 : 0.2, strokeDashoffset: 0 }
                    : {
                        opacity: [0, 1, 1, 0],
                        strokeDashoffset: [150, -50],
                      }
                }
                transition={beamTransition}
                d={col.d}
                strokeWidth={col.isFront ? "1.2" : "0.5"}
                strokeLinecap="round"
                className="stroke-[#ffe58f]"
                style={{ filter: `url(#${goldGlowId})` }}
                fill="none"
              />
            </g>
          );
        })}

        <g className="stroke-[#ffe58f]" style={{ filter: `url(#${goldGlowId})` }}>
          <motion.line
            x1="50"
            y1="35"
            x2="50"
            y2="0"
            initial={isReduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={isReduced ? { duration: 0 } : { delay: 2.5, duration: 1 }}
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <motion.line
            x1="45"
            y1="8"
            x2="55"
            y2="8"
            initial={isReduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={isReduced ? { duration: 0 } : { delay: 2.8, duration: 0.8 }}
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          <motion.line
            x1="48"
            y1="6.5"
            x2="52"
            y2="9.5"
            initial={isReduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={isReduced ? { duration: 0 } : { delay: 3.0, duration: 0.8 }}
            strokeWidth="0.5"
            strokeLinecap="round"
          />
        </g>

        <motion.circle
          cx="50"
          cy="42"
          r="12"
          initial={isReduced ? false : { opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={isReduced ? { duration: 0 } : { delay: 3.2, duration: 2.5 }}
          fill={`url(#${innerLightId})`}
          style={{ mixBlendMode: "screen" }}
        />
      </g>
    </svg>
  );
}
