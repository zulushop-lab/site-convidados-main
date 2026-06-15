'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useReducedMotionPreference } from '@/lib/hooks/useReducedMotionPreference';

export function FloatingBackground() {
  const { scrollYProgress } = useScroll();
  const reducedMotion = useReducedMotionPreference();
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    setParticles(
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.3 + 0.1,
        depth: Math.random() * 200 + 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -600]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background layer 1 (Slow) */}
      <motion.div style={{ y: reducedMotion ? 0 : y1 }} className="absolute inset-0">
        {particles.slice(0, 10).map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: reducedMotion ? p.opacity : 0 }}
            animate={reducedMotion ? { opacity: p.opacity, y: 0, x: 0 } : {
              opacity: [p.opacity, p.opacity * 1.5, p.opacity],
              y: [0, -20, 0],
              x: [0, 10, 0],
            }}
            transition={reducedMotion ? { duration: 0 } : {
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
            className="absolute bg-gold/20 rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              filter: `blur(${p.size / 2}px)`,
            }}
          />
        ))}
      </motion.div>

      {/* Background layer 2 (Faster - Closer) */}
      <motion.div style={{ y: reducedMotion ? 0 : y2 }} className="absolute inset-0">
        {particles.slice(10).map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: reducedMotion ? p.opacity : 0 }}
            animate={reducedMotion ? { opacity: p.opacity, y: 0, x: 0 } : {
              opacity: [p.opacity, p.opacity * 2, p.opacity],
              y: [0, -40, 0],
              x: [0, -15, 0],
            }}
            transition={reducedMotion ? { duration: 0 } : {
              duration: p.duration * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
            className="absolute bg-gold/10 rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size * 1.5,
              height: p.size * 1.5,
              filter: `blur(${p.size}px)`,
            }}
          />
        ))}
      </motion.div>

      {/* Radial overlay to soften everything */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(var(--background),0.5)_100%)]" />
    </div>
  );
}
