// 싱킹펀드 타입 정의

export interface SinkingFundItem {
  id: string;
  name: string;
  emoji: string;
  /** 연간 목표 금액 */
  annualTarget: number;
  /** 월 적립액 */
  monthlyContribution: number;
  /** 현재 적립 누적액 */
  currentAmount: number;
  /** 납부 월 (1~12), null이면 비정기/수시 */
  dueMonth: number | null;
  /** 납부 시기 설명 ("9월", "비정기", "수시") */
  dueDescription: string;
  payments: SinkingFundPayment[];
}

export interface SinkingFundPayment {
  id: string;
  date: string;
  /** 양수: 적립, 음수: 인출/납부 */
  amount: number;
  memo: string;
}

export interface SinkingFundState {
  items: SinkingFundItem[];
  lastUpdated: string;
}
