"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Crown, Medal, Trophy, User, Users } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import type { TieLeaderboardEntry } from "@/domain/types";

type LeaderboardTab = "family" | "individual";

interface RankedEntry extends TieLeaderboardEntry {
  rank: number;
}

const TOP_LIMIT = 10;

function parseEntries(value: unknown): TieLeaderboardEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is TieLeaderboardEntry => {
      return (
        entry &&
        typeof entry === "object" &&
        typeof entry.id === "string" &&
        typeof entry.name === "string" &&
        typeof entry.total === "number" &&
        typeof entry.bidCount === "number" &&
        typeof entry.lastCompletedAt === "number"
      );
    })
    .filter((entry) => entry.total > 0 && entry.name.trim())
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.lastCompletedAt - b.lastCompletedAt;
    })
    .slice(0, TOP_LIMIT);
}

export const TieLeaderboard = ({ className }: { className?: string }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("family");
  const [familyData, setFamilyData] = useState<TieLeaderboardEntry[]>([]);
  const [individualData, setIndividualData] = useState<TieLeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState({ family: false, individual: false });
  const [error, setError] = useState("");

  useEffect(() => {
    const familyUnsubscribe = onSnapshot(
      doc(db, "leaderboards", "family"),
      (snapshot) => {
        setFamilyData(parseEntries(snapshot.data()?.entries));
        setLoaded((current) => ({ ...current, family: true }));
        setError("");
      },
      (err) => {
        console.error("Tie family leaderboard read failed:", err);
        setLoaded((current) => ({ ...current, family: true }));
        setError("Nao foi possivel carregar o ranking agora.");
      },
    );

    const individualUnsubscribe = onSnapshot(
      doc(db, "leaderboards", "individual"),
      (snapshot) => {
        setIndividualData(parseEntries(snapshot.data()?.entries));
        setLoaded((current) => ({ ...current, individual: true }));
        setError("");
      },
      (err) => {
        console.error("Tie individual leaderboard read failed:", err);
        setLoaded((current) => ({ ...current, individual: true }));
        setError("Nao foi possivel carregar o ranking agora.");
      },
    );

    return () => {
      familyUnsubscribe();
      individualUnsubscribe();
    };
  }, []);

  const currentData: RankedEntry[] = useMemo(() => {
    const source = activeTab === "family" ? familyData : individualData;
    return source.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [activeTab, familyData, individualData]);

  const isLoading = !loaded.family || !loaded.individual;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400 drop-shadow-md" aria-hidden="true" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300 drop-shadow-md" aria-hidden="true" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600 drop-shadow-md" aria-hidden="true" />;
      default:
        return <span className="font-label text-surface-dim opacity-50">{rank}</span>;
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto rounded-3xl bg-surface-container-high/40 border border-outline-variant/30 backdrop-blur-md overflow-hidden shadow-xl",
        className,
      )}
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gold/20 p-2 rounded-full">
            <Trophy className="w-6 h-6 text-gold" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-headline italic text-2xl text-on-surface leading-none">
              Ranking da Gravata
            </h3>
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-1">
              Top 10 confirmados
            </p>
          </div>
        </div>

        <div className="flex p-1 bg-surface-container-highest/50 rounded-full relative">
          <button
            type="button"
            onClick={() => setActiveTab("family")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-full transition-colors z-10",
              activeTab === "family"
                ? "text-on-primary"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <Users className="w-4 h-4" aria-hidden="true" /> Familia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("individual")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-full transition-colors z-10",
              activeTab === "individual"
                ? "text-on-primary"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <User className="w-4 h-4" aria-hidden="true" /> Individual
          </button>

          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gold rounded-full z-0 pointer-events-none"
            initial={false}
            animate={{
              left: activeTab === "family" ? "4px" : "calc(50%)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      <div className="p-6 relative min-h-[320px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-3"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center text-center min-h-[280px] gap-4 px-4">
                <Trophy className="w-8 h-8 text-gold animate-pulse" aria-hidden="true" />
                <p className="font-body text-sm text-on-surface-variant">
                  Carregando ranking...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center text-center min-h-[280px] gap-4 px-4">
                <div className="bg-gold/10 p-4 rounded-full">
                  <Trophy className="w-8 h-8 text-gold" aria-hidden="true" />
                </div>
                <p className="font-body text-sm text-on-surface-variant max-w-xs">{error}</p>
              </div>
            ) : currentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center min-h-[280px] gap-4 px-4">
                <div className="bg-gold/10 p-4 rounded-full">
                  <Trophy className="w-8 h-8 text-gold" aria-hidden="true" />
                </div>
                <p className="font-headline italic text-xl text-on-surface">
                  Seja o primeiro a dar um lance!
                </p>
                <p className="font-body text-sm text-on-surface-variant max-w-xs">
                  O Top 10 aparece aqui assim que os primeiros pagamentos forem confirmados.
                </p>
              </div>
            ) : (
              currentData.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-colors",
                    entry.rank <= 3
                      ? "bg-surface/60 border-gold/20"
                      : "bg-surface-container/30 border-outline-variant/20",
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-highest shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>
                    <span className="font-body font-medium text-on-surface truncate">
                      {entry.name}
                    </span>
                  </div>
                  <div className="font-mono text-sm tracking-tight text-on-surface-variant shrink-0 ml-4">
                    {formatCurrency(entry.total)}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
