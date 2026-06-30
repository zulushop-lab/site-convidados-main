"use client";

/**
 * AuthContext — sessao do convidado (SPEC-RSVP-AUTH RT-2).
 *
 * Garante um `uid` (Anonymous Auth) antes de qualquer write que dependa de
 * `isSignedIn()` nas rules, e expoe o estado de auth para a UI. O admin loga
 * via Google explicitamente (signInWithGoogle); o convidado e anonimo por padrao.
 *
 * Monte <AuthProvider> uma vez no layout raiz (app/layout.tsx), por fora dos
 * componentes que escrevem no Firestore.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, ensureAnonymousAuth } from "@/lib/firebase";
import { isAllowedAdminEmail } from "@/lib/adminAccess";

interface AuthContextValue {
  user: User | null;
  uid: string | null;
  isLoading: boolean;
  isAnonymous: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isAdminRoute = pathname?.startsWith("/admin") ?? false;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);

      // Sem sessao ainda -> dispara sign-in anonimo. O proprio listener reentra
      // quando o uid for emitido, atualizando o estado. Idempotente.
      if (!nextUser && !isAdminRoute) {
        ensureAnonymousAuth().catch((error) => {
          console.error("Anonymous auth failed:", error);
        });
      }
    });

    return unsubscribe;
  }, [pathname]);

  const value = useMemo<AuthContextValue>(() => {
    const email = user?.email ?? null;
    const emailVerified = user?.emailVerified ?? false;
    return {
      user,
      uid: user?.uid ?? null,
      isLoading,
      isAnonymous: user?.isAnonymous ?? false,
      isAdmin: isAllowedAdminEmail(email) && emailVerified,
    };
  }, [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  }
  return ctx;
}
