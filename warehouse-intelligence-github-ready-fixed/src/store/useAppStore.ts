import { create } from 'zustand';
import { Facility } from '../types';
import { facilityApi } from '../services/api';

interface AppState {
  activeFacility: Facility | null;
  isLoading: boolean;
  error: string | null;
  setActiveFacility: (facility: Facility | null) => void;
  fetchFacility: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  activeFacility: null,
  isLoading: false,
  error: null,
  setActiveFacility: (facility) => set({ activeFacility: facility }),
  fetchFacility: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await facilityApi.getAll();
      const facilities = res.data;
      if (facilities && facilities.length > 0) {
        set({ activeFacility: facilities[0], isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));
