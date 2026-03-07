// 월간 요약 훅 — 해당 월의 수입/지출 총계 및 카테고리별 집계
import { useMemo } from 'react';
import { useFilteredTransactions } from './useFilteredTransactions';
import { EXPENSE_CATEGORY_LIST, INCOME_CATEGORY_LIST } from '../types';
import type { MonthlySummary, CategorySummary } from '../types';

/**
 * 주어진 monthKey에 해당하는 월간 요약 데이터를 반환한다.
 */
export function useMonthlySummary(monthKey: string): MonthlySummary {
  const transactions = useFilteredTransactions({ monthKey });

  return useMemo(() => {
    // 수입/지출 분리
    const incomeTxns = transactions.filter((tx) => tx.type === '수입');
    const expenseTxns = transactions.filter((tx) => tx.type === '지출');

    const totalIncome = incomeTxns.reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpense = expenseTxns.reduce((sum, tx) => sum + tx.amount, 0);
    const netIncome = totalIncome - totalExpense;

    // 지출 카테고리별 집계
    const expenseByCategory: CategorySummary[] = EXPENSE_CATEGORY_LIST.map(
      (cat) => {
        const catTxns = expenseTxns.filter((tx) => tx.category === cat);
        const totalAmount = catTxns.reduce((sum, tx) => sum + tx.amount, 0);

        // 소분류별 집계
        const subMap = new Map<string, { amount: number; count: number }>();
        for (const tx of catTxns) {
          const key = tx.subcategory || '(없음)';
          const existing = subMap.get(key);
          if (existing) {
            existing.amount += tx.amount;
            existing.count += 1;
          } else {
            subMap.set(key, { amount: tx.amount, count: 1 });
          }
        }

        const subcategories = Array.from(subMap.entries())
          .map(([name, data]) => ({ name, amount: data.amount, count: data.count }))
          .sort((a, b) => b.amount - a.amount);

        return {
          category: cat,
          totalAmount,
          transactionCount: catTxns.length,
          subcategories,
        };
      },
    );

    // 수입 카테고리별 집계
    const incomeByCategory: CategorySummary[] = INCOME_CATEGORY_LIST.map(
      (cat) => {
        const catTxns = incomeTxns.filter((tx) => tx.category === cat);
        const totalAmount = catTxns.reduce((sum, tx) => sum + tx.amount, 0);

        const subMap = new Map<string, { amount: number; count: number }>();
        for (const tx of catTxns) {
          const key = tx.subcategory || '(없음)';
          const existing = subMap.get(key);
          if (existing) {
            existing.amount += tx.amount;
            existing.count += 1;
          } else {
            subMap.set(key, { amount: tx.amount, count: 1 });
          }
        }

        const subcategories = Array.from(subMap.entries())
          .map(([name, data]) => ({ name, amount: data.amount, count: data.count }))
          .sort((a, b) => b.amount - a.amount);

        return {
          category: cat,
          totalAmount,
          transactionCount: catTxns.length,
          subcategories,
        };
      },
    );

    return {
      monthKey,
      totalIncome,
      totalExpense,
      netIncome,
      expenseByCategory,
      incomeByCategory,
    };
  }, [transactions, monthKey]);
}
