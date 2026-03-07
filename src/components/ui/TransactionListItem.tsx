// 거래 내역 리스트 아이템 — 뱅크샐러드 스타일

import type { Transaction } from '../../types';
import { formatKRW } from '../../utils/currency';
import { CategoryIcon } from './CategoryIcon';

export interface TransactionListItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionListItem({ transaction, onClick }: TransactionListItemProps) {
  const { type, category, subcategory, content, amount, paymentMethod, memo } = transaction;

  // 지출은 "-40,330원", 수입은 "+30원"
  const sign = type === '지출' ? '-' : '+';
  const amountText = `${sign}${formatKRW(amount)}`;

  return (
    <div
      className={`flex items-center gap-3 py-3 px-1 border-b border-border-primary last:border-b-0${
        onClick ? ' cursor-pointer hover:bg-bg-card-hover rounded-xl transition-colors' : ''
      }`}
      onClick={onClick}
    >
      {/* 왼쪽: 카테고리 아이콘 */}
      <CategoryIcon category={category} size="md" />

      {/* 중앙: 내용 + 서브정보 */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-text-primary text-sm font-medium truncate">
          {content}
        </span>
        <span className="text-xs text-text-tertiary truncate">
          {subcategory} | {paymentMethod}
        </span>
        {memo && (
          <span className="text-xs text-text-tertiary truncate">
            {memo}
          </span>
        )}
      </div>

      {/* 오른쪽: 금액 */}
      <span
        className={`font-semibold text-sm whitespace-nowrap ${
          type === '수입' ? 'text-income' : 'text-text-primary'
        }`}
      >
        {amountText}
      </span>
    </div>
  );
}
