"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, User, Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaderboardTab = "family" | "individual";

interface LeaderboardEntry {
  id: string;
  name: string;
  amount: number;
  rank: number;
}

const mockFamilyData: LeaderboardEntry[] = [
  { id: "f1", name: "Família Silva", amount: 1500, rank: 1 },
  { id: "f2", name: "Família Santos", amount: 1200, rank: 2 },
  { id: "f3", name: "Família Oliveira", amount: 800, rank: 3 },
  { id: "f4", name: "Família Costa", amount: 450, rank: 4 },
];

const mockIndividualData: LeaderboardEntry[] = [
  { id: "i1", name: "Tio João", amount: 800, rank: 1 },
  { id: "i2", name: "Primo Carlos", amount: 600, rank: 2 },
  { id: "i3", name: "Madrinha Ana", amount: 500, rank: 3 },
  { id: "i4", name: "Amigo Marcos", amount: 300, rank: 4 },
];

export const TieLeaderboard = ({ className }: { className?: string }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("family");

  const currentData = activeTab === "family" ? mockFamilyData : mockIndividualData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400 drop-shadow-md" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300 drop-shadow-md" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600 drop-shadow-md" />;
      default:
        return <span className="font-label text-surface-dim opacity-50">{rank}</span>;
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto rounded-3xl bg-surface-container-high/40 border border-outline-variant/30 backdrop-blur-md overflow-hidden shadow-xl", className)}>
      {/* Header & Tabs */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gold/20 p-2 rounded-full">
            <Trophy className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="font-headline italic text-2xl text-on-surface leading-none">Ranking da Gravata</h3>
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-1">Maiores Contribuições</p>
          </div>
        </div>

        <div className="flex p-1 bg-surface-container-highest/50 rounded-full relative">
          <button
            onClick={() => setActiveTab("family")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-full transition-colors z-10",
              activeTab === "family" ? "text-on-primary" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Users className="w-4 h-4" /> Família
          </button>
          <button
            onClick={() => setActiveTab("individual")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-full transition-colors z-10",
              activeTab === "individual" ? "text-on-primary" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <User className="w-4 h-4" /> Individual
          </button>

          {/* Animated Tab Indicator */}
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

      {/* Leaderboard List */}
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
            {currentData.map((entry) => (
              <div 
                key={entry.id} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-colors",
                  entry.rank <= 3 
                    ? "bg-surface/60 border-gold/20" 
                    : "bg-surface-container/30 border-outline-variant/20"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-highest">
                    {getRankIcon(entry.rank)}
                  </div>
                  <span className="font-body font-medium text-on-surface">{entry.name}</span>
                </div>
                <div className="font-mono text-sm tracking-tight text-on-surface-variant">
                  {formatCurrency(entry.amount)}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
