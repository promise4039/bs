// 월별 비교 페이지 — 두 달의 지출을 카테고리별로 비교
import { useState, useMemo } from 'react';
import {
  Card,
  SectionHeader,
  MonthNavigator,
  EmptyState,
} from '../components/ui';
import { useMonthlySummary } from '../hooks';
import { EXPENSE_CATEGORY_LIST } from '../types';
import { CATEGORY_META } from '../constants';
import { formatKRW, formatPercent } from '../utils/currency';
import { shiftMonth, getCurrentMonthKey, formatMonthLabel } from '../utils/date';
import type { ExpenseCategory } from '../types';

export default function ComparisonPage() {
  const currentMonthKey = getCurrentMonthKey();
  const [monthA, setMonthA] = useState(currentMonthKey);
  const [monthB, setMonthB] = useState(shiftMonth(currentMonthKey, -1));

  const summaryA = useMonthlySummary(monthA);
  const summaryB = useMonthlySummary(monthB);

  // 카테고리별 비교 데이터
  const categoryComparison = useMemo(() => {
    return EXPENSE_CATEGORY_LIST.map((cat) => {
      const catA = summaryA.expenseByCategory.find((c) => c.category === cat);
      const catB = summaryB.expenseByCategory.find((c) => c.category === cat);
      const amountA = catA?.totalAmount || 0;
      const amountB = catB?.totalAmount || 0;
      const diff = amountA - amountB;
      const percentChange = amountB > 0 ? diff / amountB : amountA > 0 ? 1 : 0;

      return {
        category: cat,
        amountA,
        amountB,
        diff,
        percentChange,
        absDiff: Math.abs(diff),
      };
    });
  }, [summaryA, summaryB]);

  // 차트 최대값 (바 너비 계산용)
  const maxAmount = useMemo(() => {
    let max = 0;
    for (const c of categoryComparison) {
      if (c.amountA > max) max = c.amountA;
      if (c.amountB > max) max = c.amountB;
    }
    return max || 1;
  }, [categoryComparison]);

  // 지출이 있는 카테고리만 필터
  const activeCategories = useMemo(
    () => categoryComparison.filter((c) => c.amountA > 0 || c.amountB > 0),
    [categoryComparison],
  );

  // 가장 많이 변한 카테고리 (상위 3 증가 / 감소)
  const { topIncreased, topDecreased } = useMemo(() => {
    const sorted = [...categoryComparison]
      .filter((c) => c.diff !== 0)
      .sort((a, b) => b.diff - a.diff);

    const increased = sorted.filter((c) => c.diff > 0).slice(0, 3);
    const decreased = sorted.filter((c) => c.diff < 0).slice(-3).reverse();

    return { topIncreased: increased, topDecreased: decreased };
  }, [categoryComparison]);

  // 총 지출 차이
  const totalDiff = summaryA.totalExpense - summaryB.totalExpense;
  const totalPercentChange =
    summaryB.totalExpense > 0
      ? totalDiff / summaryB.totalExpense
      : summaryA.totalExpense > 0
        ? 1
        : 0;

  const hasData = summaryA.totalExpense > 0 || summaryB.totalExpense > 0;

  return (
    <div className="pb-28 space-y-4">
      {/* 헤더 */}
      <h1 className="text-xl font-bold text-text-primary pt-2">월별 비교</h1>

      {/* 두 달 선택 */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="text-center text-xs text-text-secondary mb-1">기준 월</div>
          <MonthNavigator monthKey={monthA} onChange={setMonthA} />
        </div>
        <span className="text-text-tertiary font-bold text-lg mt-4">vs</span>
        <div className="flex-1">
          <div className="text-center text-xs text-text-secondary mb-1">비교 월</div>
          <MonthNavigator monthKey={monthB} onChange={setMonthB} />
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon="📊"
          title="비교할 데이터가 없습니다"
          description="두 달 모두 지출 데이터가 필요합니다"
        />
      ) : (
        <>
          {/* 총 지출 비교 카드 */}
          <Card className="space-y-3">
            <SectionHeader title="총 지출 비교" />
            <div className="flex items-end justify-between">
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs text-text-secondary">{formatMonthLabel(monthA)}</span>
                <span className="text-lg font-bold text-text-primary">
                  {formatKRW(summaryA.totalExpense)}
                </span>
              </div>
              <div className="flex flex-col items-center px-4">
                <span
                  className={`text-sm font-bold ${
                    totalDiff > 0 ? 'text-expense' : totalDiff < 0 ? 'text-income' : 'text-text-secondary'
                  }`}
                >
                  {totalDiff > 0 ? '+' : ''}{formatKRW(totalDiff)}
                </span>
                {totalPercentChange !== 0 && (
                  <span
                    className={`text-xs ${
                      totalDiff > 0 ? 'text-expense' : 'text-income'
                    }`}
                  >
                    ({totalDiff > 0 ? '+' : ''}{formatPercent(totalPercentChange)})
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xs text-text-secondary">{formatMonthLabel(monthB)}</span>
                <span className="text-lg font-bold text-text-primary">
                  {formatKRW(summaryB.totalExpense)}
                </span>
              </div>
            </div>
          </Card>

          {/* 카테고리별 비교 바 차트 */}
          <Card className="space-y-3">
            <SectionHeader title="카테고리별 비교" />
            <div className="space-y-4">
              {activeCategories.map((item) => {
                const meta = CATEGORY_META[item.category as ExpenseCategory];
                const widthA = maxAmount > 0 ? (item.amountA / maxAmount) * 100 : 0;
                const widthB = maxAmount > 0 ? (item.amountB / maxAmount) * 100 : 0;

                return (
                  <div key={item.category} className="space-y-1.5">
                    {/* 카테고리명 + 차이 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">
                        {meta?.emoji || '📎'} {item.category}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          item.diff > 0
                            ? 'text-expense'
                            : item.diff < 0
                              ? 'text-income'
                              : 'text-text-tertiary'
                        }`}
                      >
                        {item.diff !== 0 && (item.diff > 0 ? '+' : '')}
                        {formatKRW(item.diff)}
                      </span>
                    </div>

                    {/* 기준 월 바 */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-tertiary w-8 shrink-0">
                        {formatMonthLabel(monthA)}
                      </span>
                      <div className="flex-1 h-4 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-income transition-all duration-300"
                          style={{ width: `${Math.max(widthA, widthA > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-text-secondary w-16 text-right shrink-0">
                        {formatKRW(item.amountA)}
                      </span>
                    </div>

                    {/* 비교 월 바 */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-tertiary w-8 shrink-0">
                        {formatMonthLabel(monthB)}
                      </span>
                      <div className="flex-1 h-4 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-text-tertiary transition-all duration-300"
                          style={{ width: `${Math.max(widthB, widthB > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-text-secondary w-16 text-right shrink-0">
                        {formatKRW(item.amountB)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 가장 많이 변한 카테고리 */}
          {(topIncreased.length > 0 || topDecreased.length > 0) && (
            <Card className="space-y-3">
              <SectionHeader title="가장 많이 변한 카테고리" />

              {/* 증가 TOP 3 */}
              {topIncreased.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-expense">지출 증가</span>
                  {topIncreased.map((item, i) => {
                    const meta = CATEGORY_META[item.category as ExpenseCategory];
                    return (
                      <div
                        key={item.category}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-red-500/5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-tertiary font-bold w-4">{i + 1}</span>
                          <span className="text-sm">{meta?.emoji || '📎'}</span>
                          <span className="text-sm text-text-primary">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-expense">
                            +{formatKRW(item.diff)}
                          </span>
                          {item.percentChange !== 0 && isFinite(item.percentChange) && (
                            <span className="text-xs text-expense">
                              (+{formatPercent(item.percentChange)})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 감소 TOP 3 */}
              {topDecreased.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-income">지출 감소</span>
                  {topDecreased.map((item, i) => {
                    const meta = CATEGORY_META[item.category as ExpenseCategory];
                    return (
                      <div
                        key={item.category}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-green-500/5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-tertiary font-bold w-4">{i + 1}</span>
                          <span className="text-sm">{meta?.emoji || '📎'}</span>
                          <span className="text-sm text-text-primary">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-income">
                            {formatKRW(item.diff)}
                          </span>
                          {item.percentChange !== 0 && isFinite(item.percentChange) && (
                            <span className="text-xs text-income">
                              ({formatPercent(item.percentChange)})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
