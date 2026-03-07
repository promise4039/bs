// UI 상태 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';
import { getCurrentMonthKey } from '../utils/date';

interface UIStore {
  selectedMonth: string; // "2026-03" 형태

  setSelectedMonth: (month: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      selectedMonth: getCurrentMonthKey(),

      setSelectedMonth: (month) => set({ selectedMonth: month }),
    }),
    {
      name: STORAGE_KEYS.UI_STATE,
    },
  ),
);
