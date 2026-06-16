"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IntroAnimation } from "@/components/IntroAnimation";
import { playGlobalIntroAudio } from "@/components/GlobalAudioPlayer";

/**
 * Animação cinematográfica da Catedral, disparada SOB DEMANDA (ex.: após a
 * confirmação de presença) — independente da FSM `homeState` da home.
 *
 * Reaproveita a `IntroAnimation` (que já é standalone, com `onComplete` e
 * fallback de CSP no import dos tubos 3D). Quando `play` vira true, exibe o
 * overlay full-screen, toca o áudio de intro e, ao terminar (~7,2s), faz
 * fade-out e chama `onComplete` para liberar a UI por baixo.
 */
export function CathedralReveal({
  play,
  onComplete,
}: {
  play: boolean;
  onComplete?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!play) return;
    setVisible(true);
    // Áudio acompanha a animação (degrada silenciosamente se o autoplay
    // for bloqueado — ver GlobalAudioPlayer).
    try {
      playGlobalIntroAudio();
    } catch (err) {
      console.warn("Autoplay bloqueado ou erro de áudio:", err);
    }
  }, [play]);

  const handleComplete = () => {
    setVisible(false);
    onComplete?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cathedral-reveal"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[110]"
        >
          <IntroAnimation onComplete={handleComplete} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
