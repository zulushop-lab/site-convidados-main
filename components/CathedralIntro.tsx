"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppStore, shouldSkipCover } from "@/lib/store/useAppStore";
import { useReducedMotionPreference } from "@/lib/hooks/useReducedMotionPreference";
import { NoiseOverlay } from "@/components/NoiseOverlay";

// Paleta localizada do "save the date" azul (MJ): azul-marinho + dourado + creme.
const NAVY = "#1e3a5f";
const NAVY_DEEP = "#0a1f33";
const GOLD = "#C5A059";

// Canto ornamental da moldura (espelhado via transform conforme a posição).
function FrameCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 2 L2 30 M2 2 L30 2"
        stroke={NAVY}
        strokeWidth="1.5"
      />
      <path
        d="M10 10 L10 24 M10 10 L24 10"
        stroke={GOLD}
        strokeWidth="1"
      />
      <path
        d="M14 14 C 30 14, 30 30, 46 30 M14 14 C 14 30, 30 30, 30 46"
        stroke={NAVY}
        strokeWidth="0.9"
        opacity="0.55"
      />
      <circle cx="14" cy="14" r="2" fill={GOLD} />
    </svg>
  );
}

/**
 * Capa do convite (estilo papel / aquarela), na paleta azul do "save the date".
 * Primeira tela vista pelo convidado: monograma, nomes em script, data, a
 * Catedral em aquarela e UM unico botao de entrada para o fluxo de presenca.
 *
 * Reaproveita a FSM `homeState`: enquanto !== 'TRANSITIONED' a capa cobre a
 * viewport; o botao dispensa a capa (TRANSITIONED) e navega para /presenca.
 * A antiga animação 3D foi movida para depois da confirmação (CathedralReveal).
 */
export const CathedralIntro = () => {
  const { homeState, setHomeState } = useAppStore();
  const router = useRouter();
  const reducedMotion = useReducedMotionPreference();

  // Se o convidado acabou de confirmar pelo link /rsvp/<code>, a animação 3D já
  // rodou — dispensa a capa no cliente (sem hydration mismatch: o servidor
  // sempre renderiza a capa; a flag só existe no sessionStorage do cliente).
  useEffect(() => {
    if (shouldSkipCover()) setHomeState("TRANSITIONED");
  }, [setHomeState]);

  const handleEnter = () => {
    setHomeState("TRANSITIONED");
    router.push("/presenca");
  };

  const ease = [0.22, 1, 0.36, 1] as const;
  const d = (delay: number) => (reducedMotion ? 0 : delay);

  return (
    <AnimatePresence>
      {homeState !== "TRANSITIONED" && (
        <motion.div
          key="invite-cover"
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-surface text-on-surface px-4 py-8 md:py-12"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: reducedMotion ? 0.2 : 1, ease },
          }}
        >
          {/* Textura de papel */}
          <NoiseOverlay />

          {/* Cartão do convite com moldura azul dupla */}
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 24, scale: reducedMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reducedMotion ? 0.2 : 1, ease }}
            className="relative w-full max-w-md mx-auto my-auto"
          >
            {/* Moldura externa + interna */}
            <div
              className="relative flex flex-col items-center text-center px-6 py-10 sm:px-10 sm:py-12"
              style={{
                border: `1.5px solid ${NAVY}`,
                boxShadow: `inset 0 0 0 6px rgba(250,249,247,1), inset 0 0 0 7.5px ${GOLD}33`,
              }}
            >
              {/* Cantos ornamentais */}
              <FrameCorner className="absolute top-1.5 left-1.5 w-12 h-12 sm:w-14 sm:h-14" />
              <FrameCorner className="absolute top-1.5 right-1.5 w-12 h-12 sm:w-14 sm:h-14 -scale-x-100" />
              <FrameCorner className="absolute bottom-1.5 left-1.5 w-12 h-12 sm:w-14 sm:h-14 -scale-y-100" />
              <FrameCorner className="absolute bottom-1.5 right-1.5 w-12 h-12 sm:w-14 sm:h-14 -scale-100" />

              {/* Monograma */}
              <motion.div
                initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: d(0.25), duration: reducedMotion ? 0.2 : 0.9, ease }}
                className="relative w-24 h-24 sm:w-28 sm:h-28 mb-2"
              >
                <Image
                  src="/matheus-isadora-monogram_gold_trim.png"
                  alt="Monograma de Isadora e Matheus"
                  fill
                  sizes="(max-width: 640px) 96px, 112px"
                  className="object-contain"
                  priority
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Save the date */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d(0.4), duration: reducedMotion ? 0.2 : 0.8 }}
                className="font-label text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-3"
                style={{ color: NAVY }}
              >
                Save the Date
              </motion.span>

              {/* Nomes em script */}
              <motion.h1
                initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: d(0.5), duration: reducedMotion ? 0.2 : 1, ease }}
                className="font-alex-brush leading-none mb-1"
                style={{ color: NAVY_DEEP, fontSize: "clamp(2.75rem, 12vw, 4.25rem)" }}
              >
                Isadora &amp; Matheus
              </motion.h1>

              {/* Linha decorativa */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "60%", opacity: 1 }}
                transition={{ delay: d(0.7), duration: reducedMotion ? 0.2 : 0.9, ease }}
                className="h-px my-4"
                style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
              />

              {/* Data + local */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d(0.8), duration: reducedMotion ? 0.2 : 0.8 }}
                className="flex flex-col items-center gap-1 mb-5"
              >
                <span
                  className="font-label text-sm sm:text-base tracking-[0.3em]"
                  style={{ color: NAVY }}
                >
                  03 . 09 . 2026
                </span>
                <span
                  className="font-label text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: NAVY, opacity: 0.7 }}
                >
                  Brasília, DF
                </span>
              </motion.div>

              {/* Ilustração em aquarela (Catedral) */}
              <motion.div
                initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: d(0.9), duration: reducedMotion ? 0.2 : 1, ease }}
                className="relative w-full h-40 sm:h-48 mb-7"
              >
                <Image
                  src="/catedral-brasilia.png"
                  alt="Catedral de Brasília em aquarela"
                  fill
                  sizes="(max-width: 640px) 320px, 400px"
                  className="object-contain"
                  priority
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Botao unico: orienta o convidado sobre o RSVP personalizado. */}
              <motion.button
                initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: d(1.05), duration: reducedMotion ? 0.2 : 0.9, ease }}
                onClick={handleEnter}
                whileHover={reducedMotion ? undefined : { scale: 1.03 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                className="font-label text-[11px] sm:text-xs uppercase tracking-[0.3em] px-10 py-4 rounded-full transition-colors duration-300"
                style={{
                  color: NAVY_DEEP,
                  border: `1px solid ${NAVY}`,
                  boxShadow: `inset 0 0 0 1px ${GOLD}33`,
                  background: "rgba(255,255,255,0.4)",
                }}
                aria-label="Como confirmar presenca"
              >
                Como confirmar
              </motion.button>

              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d(1.2), duration: reducedMotion ? 0.2 : 0.8 }}
                className="font-label text-[9px] uppercase tracking-[0.3em] mt-4"
                style={{ color: NAVY, opacity: 0.55 }}
              >
                Toque para entrar
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
