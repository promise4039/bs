// 엑셀 파싱 관련 타입 정의

import type { Transaction } from './transaction';
import type { Asset } from './asset';

export interface RawTransactionRow {
  날짜: string | number;
  시간: string;
  타입: string;
  대분류: string;
  소분류: string;
  내용: string;
  금액: number;
  화폐: string;
  결제수단: string;
  메모?: string;
}

export interface MonthlyOverviewData {
  months: string[];
  income: Record<string, Record<string, number>>;
  expense: Record<string, Record<string, number>>;
  totalIncome: Record<string, number>;
  totalExpense: Record<string, number>;
  netIncome: Record<string, number>;
}

export interface ParseError {
  sheet: string;
  row?: number;
  column?: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface ExcelParseResult {
  transactions: Transaction[];
  overview: MonthlyOverviewData | null;
  /** 뱅샐현황 시트에서 파싱한 자산 목록 */
  assets: Asset[];
  errors: ParseError[];
  stats: {
    totalRows: number;
    parsedRows: number;
    skippedRows: number;
    dateRange: { earliest: string; latest: string } | null;
    /** 파싱된 자산 수 */
    assetCount: number;
  };
}
