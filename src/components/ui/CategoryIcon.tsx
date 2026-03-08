// 카테고리 아이콘 — 뱅크샐러드 스타일 (카테고리별 고유 색상 배경 + 둥근 사각형)

import { CATEGORY_META, CATEGORY_COLORS } from '../../constants';
import type { ExpenseCategory } from '../../types';

export interface CategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_STYLES = {
  sm: { box: 'w-8 h-8 rounded-[10px]', emoji: '14px' },
  md: { box: 'w-10 h-10 rounded-[12px]', emoji: '18px' },
  lg: { box: 'w-14 h-14 rounded-[14px]', emoji: '24px' },
} as const;

export function CategoryIcon({ category, size = 'md' }: CategoryIconProps) {
  const meta = CATEGORY_META[category as ExpenseCategory];
  const emoji = meta?.emoji ?? '📎';
  const hex = CATEGORY_COLORS[category as ExpenseCategory] ?? '#636366';
  const s = SIZE_STYLES[size];

  return (
    <div
      className={`${s.box} flex items-center justify-center shrink-0`}
      style={{ backgroundColor: `${hex}22` }}
    >
      <span style={{ fontSize: s.emoji, lineHeight: 1 }}>{emoji}</span>
    </div>
  );
}
