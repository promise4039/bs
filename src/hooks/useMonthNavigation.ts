// 월 네비게이션 훅 — 월 이동 및 사용 가능한 월 목록 관리
import { useMemo, useCallback } from 'react';
import { useUIStore, useTransactionStore } from '../store';
import { getCurrentMonthKey, shiftMonth } from '../utils/date';

interface UseMonthNavigationReturn {
  /** 현재 선택된 월 (monthKey) */
  currentMonth: string;
  /** 특정 월로 이동 */
  setMonth: (month: string) => void;
  /** 다음 달로 이동 */
  goNext: () => void;
  /** 이전 달로 이동 */
  goPrev: () => void;
  /** 다음 달로 이동 가능 여부 (현재 월 초과 불가) */
  canGoNext: boolean;
  /** 거래 데이터가 존재하는 월 목록 (정렬됨) */
  availableMonths: string[];
}

/**
 * 월 네비게이션 상태와 액션을 제공한다.
 */
export function useMonthNavigation(): UseMonthNavigationReturn {
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const setSelectedMonth = useUIStore((s) => s.setSelectedMonth);
  const transactions = useTransactionStore((s) => s.transactions);

  // 거래 데이터에서 고유한 월 목록 추출 후 정렬
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    for (const tx of transactions) {
      // date: "2026-03-07" → monthKey: "2026-03"
      const mk = tx.date.substring(0, 7);
      monthSet.add(mk);
    }
    return Array.from(monthSet).sort();
  }, [transactions]);

  // 현재 월 이후로는 이동 불가
  const canGoNext = selectedMonth < getCurrentMonthKey();

  const setMonth = useCallback(
    (month: string) => {
      setSelectedMonth(month);
    },
    [setSelectedMonth],
  );

  const goNext = useCallback(() => {
    const next = shiftMonth(selectedMonth, 1);
    // 현재 월을 초과하지 않도록 제한
    if (next <= getCurrentMonthKey()) {
      setSelectedMonth(next);
    }
  }, [selectedMonth, setSelectedMonth]);

  const goPrev = useCallback(() => {
    const prev = shiftMonth(selectedMonth, -1);
    setSelectedMonth(prev);
  }, [selectedMonth, setSelectedMonth]);

  return {
    currentMonth: selectedMonth,
    setMonth,
    goNext,
    goPrev,
    canGoNext,
    availableMonths,
  };
}
