"use client";

/**
 * GuestContext — identidade do convidado (SPEC-RSVP-AUTH RT-4/RT-6).
 *
 * Guarda a familia resolvida (via capability URL /rsvp/<code>) e o roster, e
 * persiste em sessionStorage (chave versionada `guest.identity.v1`) para
 * reidratar no reload sem reabrir o link na mesma sessao.
 *
 * GuestGate SOFT: este provider personaliza e identifica, mas NAO bloqueia
 * navegacao anonima — convidado sem codigo continua navegando (decisao #3).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Guest } from "@/domain/types";

export const GUEST_IDENTITY_KEY = "guest.identity.v1";

export type GuestIdentitySource = "hint" | "roster" | null;

export interface GuestIdentity {
  familyId: string;
  familyName: string;
  guests: Guest[];
  guestId: string | null;
  source: GuestIdentitySource;
}

interface GuestContextValue {
  identity: GuestIdentity | null;
  hasIdentity: boolean;
  setIdentity: (identity: GuestIdentity) => void;
  selectGuest: (guestId: string, source?: GuestIdentitySource) => void;
  clearIdentity: () => void;
}

const GuestContext = createContext<GuestContextValue | undefined>(undefined);

function readFromSession(): GuestIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GUEST_IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestIdentity;
    if (!parsed.familyId || !Array.isArray(parsed.guests)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeToSession(identity: GuestIdentity | null) {
  if (typeof window === "undefined") return;
  try {
    if (identity) {
      window.sessionStorage.setItem(GUEST_IDENTITY_KEY, JSON.stringify(identity));
    } else {
      window.sessionStorage.removeItem(GUEST_IDENTITY_KEY);
    }
  } catch {
    // sessionStorage indisponivel (modo privado/iframe) — degrada para memoria.
  }
}

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentityState] = useState<GuestIdentity | null>(null);

  // Reidrata da sessao no mount (cliente).
  useEffect(() => {
    const stored = readFromSession();
    if (stored) setIdentityState(stored);
  }, []);

  const setIdentity = useCallback((next: GuestIdentity) => {
    setIdentityState(next);
    writeToSession(next);
  }, []);

  const selectGuest = useCallback(
    (guestId: string, source: GuestIdentitySource = "roster") => {
      setIdentityState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, guestId, source };
        writeToSession(next);
        return next;
      });
    },
    [],
  );

  const clearIdentity = useCallback(() => {
    setIdentityState(null);
    writeToSession(null);
  }, []);

  const value = useMemo<GuestContextValue>(
    () => ({
      identity,
      hasIdentity: !!identity,
      setIdentity,
      selectGuest,
      clearIdentity,
    }),
    [identity, setIdentity, selectGuest, clearIdentity],
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest(): GuestContextValue {
  const ctx = useContext(GuestContext);
  if (ctx === undefined) {
    throw new Error("useGuest deve ser usado dentro de <GuestProvider>.");
  }
  return ctx;
}
