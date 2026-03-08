// 날짜별 거래 그룹 구분선 — 뱅크샐러드 스타일 (IMG_1501 레이아웃)
// "28일 토요일  +4,000원 -34,400원"

import { formatNumber } from '../../utils/currency';

export interface DateDividerProps {
  date: string;
  income?: number;
  expense?: number;
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

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
    <div className="sticky top-0 z-10 flex items-center justify-between h-[40px] px-4 bg-bg-app/95 backdrop-blur-sm border-b border-border-primary/30">
      {/* 왼쪽: 날짜 라벨 */}
      <span className="text-[14px] text-text-primary font-semibold tracking-tight">
        {label}
      </span>

      {/* 오른쪽: 수입/지출 합계 */}
      <div className="flex items-center gap-3 text-[13px]">
        {income > 0 && (
          <span className="text-income font-medium tabular-nums">+{formatNumber(income)}원</span>
        )}
        {expense > 0 && (
          <span className="text-text-secondary font-medium tabular-nums">-{formatNumber(expense)}원</span>
        )}
      </div>
    </div>
  );
}
