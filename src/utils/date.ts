// 날짜 유틸리티

/** Date → "2026-03" 형태 monthKey */
export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** "2026-03" → { start: Date, end: Date } */
export function getMonthRange(monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end };
}

/** 현재 월의 monthKey */
export function getCurrentMonthKey(): string {
  return toMonthKey(new Date());
}

/** monthKey에서 이전/다음 달 계산 */
export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthKey(d);
}

/** "2026-03-07" → "7일 금요일" 형태 */
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${day}일 ${weekdays[d.getDay()]}`;
}

/** "2026-03" → "3월" */
export function formatMonthLabel(monthKey: string): string {
  const m = parseInt(monthKey.split('-')[1], 10);
  return `${m}월`;
}

/** "2026-03" → "2026년 3월" */
export function formatMonthFull(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  return `${y}년 ${parseInt(m, 10)}월`;
}

/** D-day 계산 (납부월 기준, 올해 또는 내년) */
export function calcDday(dueMonth: number | null): number | null {
  if (dueMonth === null) return null;
  const now = new Date();
  const thisYear = now.getFullYear();
  let dueDate = new Date(thisYear, dueMonth - 1, 1);
  if (dueDate < now) {
    dueDate = new Date(thisYear + 1, dueMonth - 1, 1);
  }
  const diff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}
