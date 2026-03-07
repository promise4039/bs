// 예산 설정 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BudgetConfig, ExpenseCategory } from '../types';
import { DEFAULT_BUDGETS, STORAGE_KEYS } from '../constants';

interface BudgetStore {
  budgets: BudgetConfig;

  setBudget: (category: ExpenseCategory, amount: number) => void;
  setBudgets: (config: BudgetConfig) => void;
  resetToDefaults: () => void;
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
      budgets: { ...DEFAULT_BUDGETS },

      setBudget: (category, amount) =>
        set((state) => ({
          budgets: { ...state.budgets, [category]: amount },
        })),

      setBudgets: (config) => set({ budgets: { ...config } }),

      resetToDefaults: () => set({ budgets: { ...DEFAULT_BUDGETS } }),
    }),
    {
      name: STORAGE_KEYS.BUDGET_CONFIG,
    },
  ),
);
