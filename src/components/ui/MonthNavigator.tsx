// 월 선택 네비게이터 — < 3월 >

import { formatMonthLabel, shiftMonth, getCurrentMonthKey } from '../../utils/date';

export interface MonthNavigatorProps {
  monthKey: string;
  onChange: (monthKey: string) => void;
  minMonth?: string;
  maxMonth?: string;
}

export function MonthNavigator({
  monthKey,
  onChange,
  minMonth,
  maxMonth,
}: MonthNavigatorProps) {
  const effectiveMax = maxMonth ?? getCurrentMonthKey();
  const prevMonth = shiftMonth(monthKey, -1);
  const nextMonth = shiftMonth(monthKey, 1);

  const canGoPrev = !minMonth || prevMonth >= minMonth;
  const canGoNext = nextMonth <= effectiveMax;

  return (
    <div className="flex items-center justify-center gap-2">
      {/* 이전 달 */}
      <button
        type="button"
        disabled={!canGoPrev}
        onClick={() => canGoPrev && onChange(prevMonth)}
        className={`w-10 h-10 flex items-center justify-center rounded-full text-2xl transition-colors ${
          canGoPrev
            ? 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            : 'text-text-tertiary opacity-30 cursor-not-allowed'
        }`}
        aria-label="이전 달"
      >
        ‹
      </button>

      {/* 현재 월 라벨 */}
      <span className="text-lg font-bold text-text-primary min-w-[3.5rem] text-center">
        {formatMonthLabel(monthKey)}
      </span>

      {/* 다음 달 */}
      <button
        type="button"
        disabled={!canGoNext}
        onClick={() => canGoNext && onChange(nextMonth)}
        className={`w-10 h-10 flex items-center justify-center rounded-full text-2xl transition-colors ${
          canGoNext
            ? 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            : 'text-text-tertiary opacity-30 cursor-not-allowed'
        }`}
        aria-label="다음 달"
      >
        ›
      </button>
    </div>
  );
}
