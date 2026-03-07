// 거래 타입 정의

export type TransactionType = '수입' | '지출';

export interface Transaction {
  /** 고유 ID (date+time+amount+content 해시) */
  id: string;
  /** 거래 날짜 ISO "2026-03-07" */
  date: string;
  /** 거래 시간 "16:10:17" */
  time: string;
  /** 수입 또는 지출 */
  type: TransactionType;
  /** 대분류 (뱅크샐러드 원본) */
  category: string;
  /** 소분류 */
  subcategory: string;
  /** 거래처/내용 */
  content: string;
  /** 금액 (항상 양수, type으로 수입/지출 구분) */
  amount: number;
  /** 화폐 단위 */
  currency: string;
  /** 결제수단 */
  paymentMethod: string;
  /** 메모 */
  memo: string | null;
  /** 고정 지출 여부 */
  isFixed?: boolean;
  /** 예산에서 제외 여부 */
  excludeFromBudget?: boolean;
}

export interface TransactionFilter {
  monthKey?: string;
  type?: TransactionType;
  category?: string;
  subcategory?: string;
  paymentMethod?: string;
  searchQuery?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
