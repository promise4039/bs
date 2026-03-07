// 날짜별 거래 그룹 구분선 — "7일 오늘  +30원 -16,210원"

import { formatNumber } from '../../utils/currency';

export interface DateDividerProps {
  date: string;
  income?: number;
  expense?: number;
}

/** 오늘 날짜인지 확인 */
function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/** 어제 날짜인지 확인 */
function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(dateStr);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

/** "7일 오늘" / "6일 어제" / "5일 수요일" 형태 */
function formatDateWithRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  if (isToday(dateStr)) return `${day}일 오늘`;
  if (isYesterday(dateStr)) return `${day}일 어제`;
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${day}일 ${weekdays[d.getDay()]}`;
}

export function DateDivider({ date, income = 0, expense = 0 }: DateDividerProps) {
  const label = formatDateWithRelative(date);

  return (
    <div className="flex justify-between items-center py-2.5 px-1 sticky top-0 z-10 bg-bg-app/90 backdrop-blur-sm">
      {/* 왼쪽: 날짜 라벨 */}
      <span className="text-sm text-text-primary font-semibold">
        {label}
      </span>

      {/* 오른쪽: 수입/지출 합계 */}
      <div className="flex gap-3 text-xs">
        {income > 0 && (
          <span className="text-income font-medium">+{formatNumber(income)}원</span>
        )}
        {expense > 0 && (
          <span className="text-text-secondary font-medium">-{formatNumber(expense)}원</span>
        )}
      </div>
    </div>
  );
}
