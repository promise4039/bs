// 거래 내역 리스트 아이템 — 뱅크샐러드 스타일 (IMG_1501 레이아웃, 스와이프 삭제 지원)
// 왼쪽: 카테고리 아이콘 (둥근 배경) / 중앙: 거래명 + 소분류|결제수단 / 오른쪽: 금액

import { useState, useRef, useCallback } from 'react';
import type { Transaction } from '../../types';
import { formatKRW } from '../../utils/currency';
import { CategoryIcon } from './CategoryIcon';

export interface TransactionListItemProps {
  transaction: Transaction;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

const DELETE_THRESHOLD = 60;

export function TransactionListItem({ transaction, onClick, onDelete }: TransactionListItemProps) {
  const { type, category, subcategory, content, amount, paymentMethod, memo } = transaction;

  // 스와이프 상태
  const [offsetX, setOffsetX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    isDraggingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = startXRef.current - e.touches[0].clientX;
    if (diff > 10) isDraggingRef.current = true;
    // 왼쪽으로만 스와이프 허용
    const clamped = Math.max(0, Math.min(diff, DELETE_THRESHOLD + 20));
    currentXRef.current = clamped;
    setOffsetX(clamped);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (currentXRef.current > DELETE_THRESHOLD) {
      setOffsetX(DELETE_THRESHOLD);
      setShowDelete(true);
    } else {
      setOffsetX(0);
      setShowDelete(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isDraggingRef.current) return;
    if (showDelete) {
      setOffsetX(0);
      setShowDelete(false);
      return;
    }
    onClick?.();
  }, [showDelete, onClick]);

  // 지출은 "-40,330원", 수입은 "+30원"
  const sign = type === '지출' ? '-' : '+';
  const amountText = `${sign}${formatKRW(amount)}`;

  // 서브정보: 소분류 | 결제수단
  const subInfo = [subcategory, paymentMethod].filter(Boolean).join(' | ');

  return (
    <div className="relative overflow-hidden">
      {/* 삭제 버튼 (뒤에 숨어있음) */}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(transaction.id)}
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-expense text-white font-medium text-[13px]"
          style={{ width: DELETE_THRESHOLD }}
        >
          삭제
        </button>
      )}

      {/* 메인 콘텐츠 */}
      <div
        className="relative bg-bg-app transition-transform duration-150 ease-out"
        style={{ transform: `translateX(-${offsetX}px)` }}
        onTouchStart={onDelete ? handleTouchStart : undefined}
        onTouchMove={onDelete ? handleTouchMove : undefined}
        onTouchEnd={onDelete ? handleTouchEnd : undefined}
        onClick={handleClick}
      >
        <div
          className={`flex items-center gap-3 py-3 px-2 border-b border-border-primary/30${
            onClick ? ' cursor-pointer active:bg-bg-elevated/50' : ''
          }`}
        >
          {/* 왼쪽: 카테고리 아이콘 */}
          <CategoryIcon category={category} size="md" />

          {/* 중앙: 거래명 + 서브정보 */}
          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            <span className="text-[14px] text-text-primary font-medium truncate leading-tight">
              {content}
            </span>
            {subInfo && (
              <span className="text-[11px] text-text-tertiary truncate leading-tight">
                {subInfo}
              </span>
            )}
            {memo && (
              <span className="text-[11px] text-text-tertiary/70 truncate leading-tight">
                {memo}
              </span>
            )}
          </div>

          {/* 오른쪽: 금액 */}
          <span
            className={`font-semibold text-[14px] whitespace-nowrap tabular-nums ${
              type === '수입' ? 'text-income' : 'text-text-primary'
            }`}
          >
            {amountText}
          </span>
        </div>
      </div>
    </div>
  );
}
