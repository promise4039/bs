// 월간 요약 타입 정의

export interface CategorySummary {
  category: string;
  totalAmount: number;
  transactionCount: number;
  subcategories: {
    name: string;
    amount: number;
    count: number;
  }[];
}

export interface MonthlySummary {
  monthKey: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  expenseByCategory: CategorySummary[];
  incomeByCategory: CategorySummary[];
}
