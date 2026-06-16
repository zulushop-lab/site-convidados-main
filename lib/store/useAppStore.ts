import { create } from 'zustand';

// Máquina de Estados Finita (FSM) para controle rígido do fluxo de entrada (ADR-0002)
export type HomeState = 'ANIMATING_LOADING' | 'READY_FOR_INTERACTION' | 'TRANSITIONED';

interface AppStore {
  homeState: HomeState;
  setHomeState: (state: HomeState) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  homeState: 'ANIMATING_LOADING', // Começa no carregamento da animação
  setHomeState: (state) => set({ homeState: state }),
}));

/**
 * Flag "pular a capa do convite" na home (chave versionada, padrão do
 * GuestContext). Setada após o convidado confirmar presença pelo link
 * /rsvp/<code> — a animação 3D (CathedralReveal) já roda nesse momento, então a
 * capa CathedralIntro não deve reaparecer na home pós-redirect (hard nav).
 *
 * sessionStorage (não query param) porque: sobrevive à hard navigation, não
 * polui a URL e é por-sessão — a capa volta numa sessão nova. Degrada
 * silenciosamente quando sessionStorage está indisponível (modo privado/iframe).
 */
export const SKIP_COVER_KEY = 'home.skipCover.v1';

export function markSkipCover() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SKIP_COVER_KEY, '1');
  } catch {
    // sessionStorage indisponível — segue com a capa visível.
  }
}

export function clearSkipCover() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SKIP_COVER_KEY);
  } catch {
    // ignore
  }
}

export function shouldSkipCover(): boolean {
  if (typeof window === 'undefined') return false; // SSR: nunca pular no servidor
  try {
    return window.sessionStorage.getItem(SKIP_COVER_KEY) === '1';
  } catch {
    return false;
  }
}
