import { create } from 'zustand';

interface AppState {
  domain: string;
  region: string;
  setDomain: (d: string) => void;
  setRegion: (r: string) => void;
}

export const useStore = create<AppState>((set) => ({
  domain: '',
  region: 'msk',
  setDomain: (domain) => set({ domain }),
  setRegion: (region) => set({ region }),
}));
