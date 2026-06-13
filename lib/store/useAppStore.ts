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
