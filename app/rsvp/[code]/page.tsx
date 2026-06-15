"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SwipeToConfirm } from "@/components/SwipeToConfirm";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/lib/store/useAppStore";
import { FadeIn } from "@/components/FadeIn";
import { db, ensureAnonymousAuth } from "@/lib/firebase";
import { doc, getDoc, query, collection, where, getDocs, setDoc, serverTimestamp } from "firebase/firestore";

type LoadingState = "loading" | "ready" | "confirming" | "success" | "error";

interface Guest {
  id: string;
  name: string;
  familyId: string;
  isMainGuest: boolean;
}

export default function RSVPAuthPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setHomeState } = useAppStore();

  const [code, setCode] = useState<string>("");
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [familyId, setFamilyId] = useState<string>("");
  const [familyName, setFamilyName] = useState<string>("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Inicializar na montagem
  useEffect(() => {
    const initRSVP = async () => {
      try {
        // Resolver params
        const resolvedParams = await params;
        const codeValue = resolvedParams.code;
        setCode(codeValue);

        // Auth anônima
        await ensureAnonymousAuth();

        // Lookup: codes/<code> → familyId
        const codeDoc = await getDoc(doc(db, "codes", codeValue));
        if (!codeDoc.exists()) {
          setErrorMessage("Convite não encontrado. Verifique o código.");
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
        const guestsQuery = query(
          collection(db, "guests"),
          where("familyId", "==", fId)
        );
        const guestsSnapshot = await getDocs(guestsQuery);
        const guestsList: Guest[] = guestsSnapshot.docs.map((d) => d.data() as Guest);

        if (guestsList.length === 0) {
          setErrorMessage("Nenhum convidado encontrado na família.");
          setLoadingState("error");
          return;
        }

        setGuests(guestsList);

        // Pré-selecionar se vem ?c=<guestId> na URL
        const preselected = searchParams.get("c");
        if (preselected && guestsList.some((g) => g.id === preselected)) {
          setSelectedGuestId(preselected);
        } else {
          setSelectedGuestId(guestsList[0].id);
        }

        setLoadingState("ready");
      } catch (error) {
        console.error("RSVP init error:", error);
        setErrorMessage("Erro ao carregar convite. Tente novamente.");
        setLoadingState("error");
      }
    };

    initRSVP();
  }, [params, searchParams]);

  const handleConfirm = async () => {
    if (!selectedGuestId || !familyId) return;

    setLoadingState("confirming");

    try {
      // Gravar rsvps/<familyId> com familyId + confirmedBy + timestamp
      await setDoc(
        doc(db, "rsvps", familyId),
        {
          familyId,
          confirmedBy: selectedGuestId,
          adults: guests.length,
          childrenCount: 0,
          createdAt: serverTimestamp(),
        },
        { merge: false }
      );

      // Sucesso
      setLoadingState("success");
      setHomeState("ANIMATING_LOADING");

      setTimeout(() => {
        router.push("/");
      }, 800);
    } catch (error) {
      console.error("RSVP confirm error:", error);
      setErrorMessage("Erro ao confirmar presença. Tente novamente.");
      setLoadingState("ready");
    }
  };

  return (
    <main className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center p-6">
      <AnimatePresence>
        {loadingState === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm flex flex-col items-center z-10"
          >
            <div className="font-alex-brush text-5xl md:text-6xl text-white drop-shadow-2xl mb-12">
              I & M
            </div>
            <p className="text-white/50">Carregando convite...</p>
          </motion.div>
        )}

        {loadingState === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm flex flex-col items-center z-10"
          >
            <div className="font-alex-brush text-5xl md:text-6xl text-white drop-shadow-2xl mb-12">
              I & M
            </div>
            <p className="text-center text-white/70 mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push("/")}
              className="text-white/50 hover:text-white text-sm underline"
            >
              Voltar para home
            </button>
          </motion.div>
        )}

        {(loadingState === "ready" || loadingState === "confirming") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="w-full max-w-sm flex flex-col items-center z-10"
          >
            <FadeIn>
              <div className="font-alex-brush text-5xl md:text-6xl text-white drop-shadow-2xl mb-12">
                I & M
              </div>
            </FadeIn>

            <FadeIn delay={0.2} className="text-center mb-10 space-y-4">
              <h1 className="font-headline italic text-3xl text-white">
                Bem-vindo, {familyName}
              </h1>
              <p className="font-body text-white/70 text-sm">
                Sua presença é muito especial para nós. Confirme para acessar nosso portal.
              </p>
            </FadeIn>

            <FadeIn delay={0.4} className="w-full space-y-6">
              {/* Seleção de quem confirma */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-label font-light px-4">
                  Quem é você?
                </span>
                {guests.map((guest) => (
                  <button
                    key={guest.id}
                    onClick={() => setSelectedGuestId(guest.id)}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      selectedGuestId === guest.id
                        ? "bg-white/10 border-white/50 text-white"
                        : "bg-white/5 border-white/20 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {guest.name}
                  </button>
                ))}
              </div>

              {/* SwipeToConfirm */}
              <div className="flex flex-col gap-2 relative mt-6">
                <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-label font-light px-4">
                  Confirmar presença
                </span>
                <SwipeToConfirm
                  guestName={guests.find((g) => g.id === selectedGuestId)?.name || ""}
                  onConfirm={handleConfirm}
                />
              </div>
            </FadeIn>
          </motion.div>
        )}

        {loadingState === "success" && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale-[20%]"
              style={{ backgroundImage: 'url("/catedral-brasilia.png")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
