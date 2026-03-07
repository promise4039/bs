// 카테고리 메타데이터 (이모지, 색상, 고정지출 여부)

import type { CategoryInfo, ExpenseCategory } from '../types';

export const CATEGORY_META: Record<ExpenseCategory, CategoryInfo> = {
  '식비':       { name: '식비',       emoji: '🍚', color: 'var(--color-cat-food)',      isFixed: false },
  '자동차':     { name: '자동차',     emoji: '🚗', color: 'var(--color-cat-car)',       isFixed: false },
  '주거/통신':  { name: '주거/통신',  emoji: '🏠', color: 'var(--color-cat-housing)',   isFixed: true },
  '금융':       { name: '금융',       emoji: '🏦', color: 'var(--color-cat-finance)',   isFixed: true },
  '의료/건강':  { name: '의료/건강',  emoji: '🏥', color: 'var(--color-cat-medical)',   isFixed: false },
  '온라인쇼핑': { name: '온라인쇼핑', emoji: '🛒', color: 'var(--color-cat-online)',    isFixed: false },
  '뷰티/미용':  { name: '뷰티/미용',  emoji: '💇', color: 'var(--color-cat-beauty)',    isFixed: false },
  '생활':       { name: '생활',       emoji: '🧹', color: 'var(--color-cat-living)',    isFixed: false },
  '패션/쇼핑':  { name: '패션/쇼핑',  emoji: '👕', color: 'var(--color-cat-fashion)',   isFixed: false },
  '문화/여가':  { name: '문화/여가',  emoji: '🎬', color: 'var(--color-cat-culture)',   isFixed: false },
  '술/유흥':    { name: '술/유흥',    emoji: '🍺', color: 'var(--color-cat-drink)',     isFixed: false },
  '카페/간식':  { name: '카페/간식',  emoji: '☕', color: 'var(--color-cat-cafe)',      isFixed: false },
  '경조/선물':  { name: '경조/선물',  emoji: '🎁', color: 'var(--color-cat-gift)',      isFixed: false },
  '교통':       { name: '교통',       emoji: '🚌', color: 'var(--color-cat-transport)', isFixed: false },
  '교육/학습':  { name: '교육/학습',  emoji: '📚', color: 'var(--color-cat-education)', isFixed: false },
  '여행/숙박':  { name: '여행/숙박',  emoji: '✈️', color: 'var(--color-cat-travel)',    isFixed: false },
  '미분류':     { name: '미분류',     emoji: '📎', color: 'var(--color-cat-etc)',       isFixed: false },
};

// 차트용 HEX 색상 배열 (CSS var 대신 직접 값)
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  '식비':       '#FF6B6B',
  '자동차':     '#4ECDC4',
  '주거/통신':  '#45B7D1',
  '금융':       '#96CEB4',
  '의료/건강':  '#FFEAA7',
  '온라인쇼핑': '#DDA0DD',
  '뷰티/미용':  '#F8B4D9',
  '생활':       '#87CEEB',
  '패션/쇼핑':  '#FFB347',
  '문화/여가':  '#98D8C8',
  '술/유흥':    '#F7DC6F',
  '카페/간식':  '#D4A574',
  '경조/선물':  '#BB8FCE',
  '교통':       '#85C1E9',
  '교육/학습':  '#82E0AA',
  '여행/숙박':  '#F1948A',
  '미분류':     '#AEB6BF',
};
