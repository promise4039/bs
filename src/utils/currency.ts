// 금액/비율 포맷팅 유틸

/** "1,234,567원" 형태로 포맷 */
export function formatKRW(amount: number): string {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

/** "1,234,567" 형태 (원 없이) */
export function formatNumber(amount: number): string {
  return Math.round(amount).toLocaleString('ko-KR');
}

/** "78.5%" 형태 */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
