// 싱킹펀드 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SinkingFundItem, SinkingFundPayment } from '../types';
import { DEFAULT_SINKING_FUNDS, STORAGE_KEYS } from '../constants';

interface SinkingFundStore {
  funds: SinkingFundItem[];
  lastUpdated: string;

  updateFund: (id: string, updates: Partial<SinkingFundItem>) => void;
  addPayment: (fundId: string, payment: SinkingFundPayment) => void;
  resetFund: (id: string) => void;
  addFund: (fund: SinkingFundItem) => void;
  removeFund: (id: string) => void;
  setFunds: (funds: SinkingFundItem[]) => void;
}

export const useSinkingFundStore = create<SinkingFundStore>()(
  persist(
    (set) => ({
      funds: [...DEFAULT_SINKING_FUNDS],
      lastUpdated: new Date().toISOString(),

      updateFund: (id, updates) =>
        set((state) => ({
          funds: state.funds.map((f) =>
            f.id === id ? { ...f, ...updates } : f,
          ),
          lastUpdated: new Date().toISOString(),
        })),

      addPayment: (fundId, payment) =>
        set((state) => ({
          funds: state.funds.map((f) =>
            f.id === fundId
              ? {
                  ...f,
                  payments: [...f.payments, payment],
                  currentAmount: f.currentAmount + payment.amount,
                }
              : f,
          ),
          lastUpdated: new Date().toISOString(),
        })),

      resetFund: (id) =>
        set((state) => ({
          funds: state.funds.map((f) =>
            f.id === id ? { ...f, currentAmount: 0, payments: [] } : f,
          ),
          lastUpdated: new Date().toISOString(),
        })),

      addFund: (fund) =>
        set((state) => ({
          funds: [...state.funds, fund],
          lastUpdated: new Date().toISOString(),
        })),

      removeFund: (id) =>
        set((state) => ({
          funds: state.funds.filter((f) => f.id !== id),
          lastUpdated: new Date().toISOString(),
        })),

      setFunds: (funds) =>
        set({
          funds: [...funds],
          lastUpdated: new Date().toISOString(),
        }),
    }),
    {
      name: STORAGE_KEYS.SINKING_FUND,
    },
  ),
);
