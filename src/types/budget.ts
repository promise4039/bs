// 예산 타입 정의

import type { ExpenseCategory } from './category';

export type BudgetConfig = Record<ExpenseCategory, number>;

export interface BudgetComparison {
  category: ExpenseCategory;
  budget: number;
  spent: number;
  remaining: number;
  /** spent / budget 비율 (0~1+, 초과 시 1 초과) */
  ratio: number;
}
