// 예산 대비 지출 비교 훅 — 카테고리별 예산 소진율 계산
import { useMemo } from 'react';
import { useBudgetStore } from '../store';
import { useMonthlySummary } from './useMonthlySummary';
import { EXPENSE_CATEGORY_LIST } from '../types';
import type { BudgetComparison, ExpenseCategory } from '../types';

/**
 * 주어진 월의 카테고리별 예산 vs 실지출 비교 데이터를 반환한다.
 * 소진율(ratio) 내림차순으로 정렬.
 */
export function useBudgetComparison(monthKey: string): BudgetComparison[] {
  const budgets = useBudgetStore((s) => s.budgets);
  const { expenseByCategory } = useMonthlySummary(monthKey);

  return useMemo(() => {
    // 카테고리명 → 지출액 맵 생성
    const spentMap = new Map<string, number>();
    for (const cs of expenseByCategory) {
      spentMap.set(cs.category, cs.totalAmount);
    }

    const comparisons: BudgetComparison[] = EXPENSE_CATEGORY_LIST.map((cat) => {
      const budget = budgets[cat] ?? 0;
      const spent = spentMap.get(cat) ?? 0;
      const remaining = budget - spent;
      const ratio = budget > 0 ? spent / budget : 0;

      return {
        category: cat as ExpenseCategory,
        budget,
        spent,
        remaining,
        ratio,
      };
    });

    // 소진율 내림차순 정렬
    return comparisons.sort((a, b) => b.ratio - a.ratio);
  }, [budgets, expenseByCategory]);
}
