// 카테고리 타입 정의

export const EXPENSE_CATEGORY_LIST = [
  '식비', '자동차', '주거/통신', '금융', '의료/건강',
  '온라인쇼핑', '뷰티/미용', '생활', '패션/쇼핑', '문화/여가',
  '술/유흥', '카페/간식', '경조/선물', '교통', '교육/학습',
  '여행/숙박', '미분류',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORY_LIST[number];

export const INCOME_CATEGORY_LIST = [
  '금융수입', '급여', '기타수입', '더치페이',
  '사업수입', '상여금', '용돈', '미분류',
] as const;

export type IncomeCategory = typeof INCOME_CATEGORY_LIST[number];

export interface CategoryInfo {
  name: string;
  emoji: string;
  color: string;
  isFixed: boolean;
}
