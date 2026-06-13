"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CathedralIntro } from "@/components/CathedralIntro";
import { SwipeToConfirm } from "@/components/SwipeToConfirm";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/lib/store/useAppStore";
import { FadeIn } from "@/components/FadeIn";

export default function RSVPAuthPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { setHomeState } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [guestName, setGuestName] = useState("Rafael"); // Mocked for simplicity
  const [isFamily, setIsFamily] = useState(false); 

  // Em um cenário real, aqui teríamos:
  // 1. Fetch backend on mount com params.code (ex: código vindo do PDF individual)
  // 2. AuthContext login se válido.
  
  const handleConfirm = () => {
    // Autenticado (Swipe completado)
    setIsAuthenticated(true);
    
    // Como a Home usa a Catedral como Loader de "Entrada", a gente garante que:
    setHomeState('ANIMATING_LOADING');
    
    // Transita para a Home
    setTimeout(() => {
      router.push("/");
    }, 800); 
  };

  return (
    <main className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center p-6">
      
      {/* Cenário 1: Tela Inicial de Convite (RSVP Auth) */}
      <AnimatePresence>
        {!isAuthenticated && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="w-full max-w-sm flex flex-col items-center z-10"
          >
            {/* Logo Inicial Isolada */}
            <FadeIn>
               <div className="font-alex-brush text-5xl md:text-6xl text-white drop-shadow-2xl mb-12">
                  I & M
               </div>
            </FadeIn>

            <FadeIn delay={0.2} className="text-center mb-10 space-y-4">
              <h1 className="font-headline italic text-3xl text-white">Bem-vindo, {guestName}</h1>
              <p className="font-body text-white/70 text-sm">
                Sua presença é muito especial para nós. Confirme para acessar nosso portal.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.4} className="w-full space-y-6">
              {/* Opção 1: Individual */}
              <div className="flex flex-col gap-2 relative">
                <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-label font-light px-4">
                  Apenas eu
                </span>
                <SwipeToConfirm 
                  guestName="Presença"
                  onConfirm={handleConfirm}
                  resetAfterDelay={1000} // Se não saísse da tela
                />
              </div>

               {/* Opção 2: Familia toda (Se tiver dependentes) */}
               <div className="flex flex-col gap-2 relative mt-4">
                <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-label font-light px-4">
                  Minha Família (4)
                </span>
                <SwipeToConfirm 
                  guestName="Família Inteira"
                  onConfirm={handleConfirm}
                  resetAfterDelay={1000}
                  className="bg-white/5 border-white/10" // Levemente mais translúcido
                />
              </div>
            </FadeIn>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        A Animação da Catedral entra SOMENTE depois da camada de Auth (logo solta) 
        Isso obedece perfeitamente o ADR-0002 e a Animação Bipartida (CONTEXT.md). 
        Como redirecionamos o Router, a Home continuará de ANIMATING_LOADING e montará a mesma Catedral.
      */}
      {isAuthenticated && (
        <motion.div 
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale-[20%]"
            style={{ backgroundImage: 'url("https://picsum.photos/seed/cathedral/1920/1080")' }} 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </motion.div>
      )}

    </main>
  );
}
