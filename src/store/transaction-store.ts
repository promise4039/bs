// 거래 내역 스토어
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '../types';
import { STORAGE_KEYS } from '../constants';

interface LastImportInfo {
  date: string;
  fileName: string;
  rowCount: number;
}

interface TransactionStore {
  transactions: Transaction[];
  lastImport: LastImportInfo | null;

  setTransactions: (txns: Transaction[]) => void;
  addTransactions: (txns: Transaction[], mode: 'merge' | 'replace') => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;
  setLastImport: (info: LastImportInfo) => void;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      lastImport: null,

      setTransactions: (txns) => set({ transactions: txns }),

      addTransactions: (txns, mode) =>
        set((state) => {
          if (mode === 'replace') {
            return { transactions: txns };
          }
          // merge: 기존 데이터에서 새 데이터의 id와 중복되는 항목 제거 후 합침
          const newIds = new Set(txns.map((t) => t.id));
          const filtered = state.transactions.filter((t) => !newIds.has(t.id));
          return { transactions: [...filtered, ...txns] };
        }),

      addTransaction: (tx) =>
        set((state) => ({
          transactions: [tx, ...state.transactions],
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      clearTransactions: () => set({ transactions: [], lastImport: null }),

      setLastImport: (info) => set({ lastImport: info }),
    }),
    {
      name: STORAGE_KEYS.TRANSACTIONS,
    },
  ),
);
