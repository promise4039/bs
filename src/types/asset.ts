// 자산 타입 정의

export type AssetType = 'account' | 'card' | 'cash' | 'loan' | 'securities' | 'pay';

/** 자산 (계좌, 카드, 현금, 대출, 증권, 페이머니) */
export interface Asset {
  id: string;
  type: AssetType;
  /** 자산명 (예: "KB국민ONE통장-보통예금") */
  name: string;
  /** 기관명 (예: "국민은행", "토스증권") */
  institution: string;
  /** 잔액/평가금 (대출은 잔여 원금) */
  balance: number;
  /** 메모 */
  memo?: string;

  // 계좌 전용
  /** 계좌번호 */
  accountNumber?: string;
  /** 이율 (%) */
  interestRate?: number;

  // 카드 전용
  /** 카드 종류 */
  cardType?: 'credit' | 'debit' | 'check';
  /** 결제일 (매월 N일) */
  billingDay?: number;

  // 대출 전용
  /** 대출 원금 */
  loanPrincipal?: number;
  /** 대출 이율 (%) */
  loanRate?: number;
  /** 월 상환액 */
  monthlyPayment?: number;
  /** 만기일 */
  maturityDate?: string;
  /** 대출 시작일 */
  loanStartDate?: string;
  /** 대출 기간 (개월) */
  loanTermMonths?: number;
  /** 상환 방식 */
  repaymentMethod?: 'equal_principal' | 'equal_payment' | 'bullet';
  /** 매월 상환일 */
  repaymentDay?: number;

  // 투자 전용 — 증권 계좌의 보유 종목
  holdings?: InvestmentHolding[];
}

/** 투자 보유 종목 */
export interface InvestmentHolding {
  id: string;
  /** 종목명 (예: "KODEX 200", "SPY") */
  name: string;
  /** 증권사 */
  broker: string;
  /** 평균 매수가 */
  avgPrice: number;
  /** 보유 수량 */
  quantity: number;
  /** 현재 평가금 */
  currentPrice: number;
  /** 메모 */
  memo?: string;
}

/** 자산 타입별 한글 라벨 */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  account: '계좌',
  card: '카드',
  cash: '현금',
  loan: '대출',
  securities: '투자',
  pay: '페이머니',
};

/** 자산 타입별 아이콘 */
export const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  account: '🏦',
  card: '💳',
  cash: '💵',
  loan: '📉',
  securities: '📈',
  pay: '📱',
};
