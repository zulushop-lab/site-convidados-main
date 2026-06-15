"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { SwipeToConfirm } from "@/components/SwipeToConfirm";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/lib/store/useAppStore";
import { db, ensureAnonymousAuth } from "@/lib/firebase";
import { doc, getDoc, query, collection, where, getDocs, setDoc, serverTimestamp } from "firebase/firestore";

type LoadingState = "loading" | "ready" | "confirming" | "success" | "error";

interface Guest {
  id: string;
  name: string;
  familyId: string;
  isMainGuest: boolean;
}

const Monogram = ({ className = "" }: { className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    className={`relative w-40 h-40 md:w-48 md:h-48 ${className}`}
  >
    <Image
      src="/matheus-isadora-monogram_gold_trim.png"
      alt="Matheus & Isadora"
      fill
      sizes="(max-width: 768px) 160px, 192px"
      className="object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      priority
      referrerPolicy="no-referrer"
    />
  </motion.div>
);

function RSVPAuthContent({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setHomeState } = useAppStore();

  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [familyId, setFamilyId] = useState<string>("");
  const [familyName, setFamilyName] = useState<string>("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Inicializar na montagem
  useEffect(() => {
    const initRSVP = async () => {
      try {
        const { code } = await params;

        // Auth anônima
        await ensureAnonymousAuth();

        // Lookup: codes/<code> → familyId
        const codeDoc = await getDoc(doc(db, "codes", code));
        if (!codeDoc.exists()) {
          setErrorMessage("Convite não encontrado. Verifique o link recebido.");
          setLoadingState("error");
          return;
        }

        const { familyId: fId } = codeDoc.data();
        setFamilyId(fId);

        // Lookup: families/<familyId> → nome
        const familyDoc = await getDoc(doc(db, "families", fId));
        if (!familyDoc.exists()) {
          setErrorMessage("Família não encontrada.");
          setLoadingState("error");
          return;
        }
        setFamilyName(familyDoc.data().name);

        // Lookup: guests where familyId == fId
        const guestsSnapshot = await getDocs(
          query(collection(db, "guests"), where("familyId", "==", fId))
        );
        const guestsList = guestsSnapshot.docs.map((d) => d.data() as Guest);

        if (guestsList.length === 0) {
          setErrorMessage("Nenhum convidado encontrado para esta família.");
          setLoadingState("error");
          return;
        }
        setGuests(guestsList);

        // Pré-selecionar: ?c=<guestId> ou todos por padrão
        const preselected = searchParams.get("c");
        if (preselected && guestsList.some((g) => g.id === preselected)) {
          setSelectedIds([preselected]);
        } else {
          setSelectedIds(guestsList.map((g) => g.id));
        }

        setLoadingState("ready");
      } catch (error) {
        console.error("RSVP init error:", error);
        setErrorMessage("Erro ao carregar o convite. Tente novamente.");
        setLoadingState("error");
      }
    };

    initRSVP();
  }, [params, searchParams]);

  const toggleGuest = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(guests.map((g) => g.id));

  const handleConfirm = async () => {
    if (selectedIds.length === 0 || !familyId) return;

    setLoadingState("confirming");

    try {
      await setDoc(
        doc(db, "rsvps", familyId),
        {
          familyId,
          confirmedBy: selectedIds[0],
          attendees: selectedIds,
          adults: selectedIds.length,
          childrenCount: 0,
          createdAt: serverTimestamp(),
        },
        { merge: false }
      );

      setLoadingState("success");
      setHomeState("ANIMATING_LOADING");

      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (error) {
      console.error("RSVP confirm error:", error);
      setErrorMessage("Não foi possível confirmar. Tente novamente.");
      setLoadingState("ready");
    }
  };

  const allSelected = guests.length > 0 && selectedIds.length === guests.length;
  const confirmLabel =
    selectedIds.length === 0
      ? "Selecione"
      : selectedIds.length === guests.length && guests.length > 1
      ? "Nós dois"
      : guests.find((g) => g.id === selectedIds[0])?.name || "";

  return (
    <main className="relative min-h-screen bg-[#0a1520] overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Atmosfera de fundo (consistente com a IntroAnimation) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-gold/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),transparent_70%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {loadingState === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(12px)" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center z-10"
          >
            <Monogram />
            <motion.p
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="font-body text-white/40 text-sm mt-8 tracking-wide"
            >
              Abrindo seu convite…
            </motion.p>
          </motion.div>
        )}

        {loadingState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center z-10 text-center max-w-sm"
          >
            <Monogram />
            <p className="font-body text-white/70 mt-8 mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push("/")}
              className="font-label text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors"
            >
              Voltar para o início
            </button>
          </motion.div>
        )}

        {(loadingState === "ready" || loadingState === "confirming") && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(16px)", transition: { duration: 0.8 } }}
            className="w-full max-w-sm flex flex-col items-center z-10"
          >
            <Monogram />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="text-center mt-8 mb-10 space-y-3"
            >
              <h1 className="font-headline italic text-3xl md:text-4xl text-white">
                {familyName}
              </h1>
              <p className="font-body text-white/60 text-sm leading-relaxed px-2">
                Sua presença é muito especial para nós.
                <br />
                Confirme para acessar nosso portal.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="w-full space-y-6"
            >
              {/* Seleção de quem confirma (multi) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-label font-light">
                    Quem confirma presença?
                  </span>
                  {guests.length > 1 && (
                    <button
                      onClick={selectAll}
                      className={`text-[10px] uppercase tracking-[0.15em] font-label transition-colors ${
                        allSelected ? "text-gold/80" : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      Nós dois
                    </button>
                  )}
                </div>

                {guests.map((guest) => {
                  const checked = selectedIds.includes(guest.id);
                  return (
                    <button
                      key={guest.id}
                      onClick={() => toggleGuest(guest.id)}
                      className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                        checked
                          ? "bg-white/10 border-gold/40 text-white shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                          : "bg-white/[0.03] border-white/15 text-white/60 hover:border-white/30"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all ${
                          checked
                            ? "bg-gold/90 border-gold"
                            : "border-white/30 group-hover:border-white/50"
                        }`}
                      >
                        {checked && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            width="11"
                            height="11"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="#0a1520"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </motion.svg>
                        )}
                      </span>
                      <span className="font-body text-sm">{guest.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* SwipeToConfirm */}
              <div className="flex flex-col gap-2 pt-2">
                <SwipeToConfirm
                  key={selectedIds.length}
                  guestName={confirmLabel}
                  onConfirm={handleConfirm}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {loadingState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center z-10"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <Monogram className="w-48 h-48 md:w-56 md:h-56" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="font-headline italic text-2xl text-white mt-6"
            >
              Presença confirmada
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="font-body text-white/50 text-sm mt-2"
            >
              Entrando no portal…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function RSVPAuthPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen bg-[#0a1520] flex items-center justify-center" />
      }
    >
      <RSVPAuthContent params={params} />
    </Suspense>
  );
}
