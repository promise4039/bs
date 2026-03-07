// 카테고리 아이콘 컴포넌트 — 원형 배경 + 이모지

import { CATEGORY_META } from '../../constants';
import type { ExpenseCategory } from '../../types';

export interface CategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-11 h-11 text-xl',
  lg: 'w-14 h-14 text-2xl',
} as const;

export function CategoryIcon({ category, size = 'md' }: CategoryIconProps) {
  const meta = CATEGORY_META[category as ExpenseCategory];
  const emoji = meta?.emoji ?? '📎';

  return (
    <div
      className={`${SIZE_CLASSES[size]} bg-bg-elevated rounded-full flex items-center justify-center shrink-0`}
    >
      {emoji}
    </div>
  );
}
