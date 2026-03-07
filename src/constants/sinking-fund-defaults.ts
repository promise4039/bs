// 싱킹펀드 기본 4개 항목

import type { SinkingFundItem } from '../types';

export const DEFAULT_SINKING_FUNDS: SinkingFundItem[] = [
  {
    id: 'sf-car-insurance',
    name: '자동차 보험',
    emoji: '🚗',
    annualTarget: 700_000,
    monthlyContribution: 58_333,
    currentAmount: 0,
    dueMonth: 9,
    dueDescription: '9월',
    payments: [],
  },
  {
    id: 'sf-car-maintenance',
    name: '차량 정비',
    emoji: '🔧',
    annualTarget: 600_000,
    monthlyContribution: 50_000,
    currentAmount: 0,
    dueMonth: null,
    dueDescription: '비정기',
    payments: [],
  },
  {
    id: 'sf-rent',
    name: '집세 (영농회)',
    emoji: '🏡',
    annualTarget: 2_000_000,
    monthlyContribution: 166_667,
    currentAmount: 0,
    dueMonth: 10,
    dueDescription: '10월',
    payments: [],
  },
  {
    id: 'sf-supplements',
    name: '보충제',
    emoji: '💊',
    annualTarget: 990_000,
    monthlyContribution: 82_500,
    currentAmount: 0,
    dueMonth: null,
    dueDescription: '수시',
    payments: [],
  },
];

export const TOTAL_MONTHLY_SINKING = DEFAULT_SINKING_FUNDS.reduce(
  (sum, f) => sum + f.monthlyContribution, 0,
);
