// 통계 페이지 — 뱅크샐러드 스타일 도넛 차트 + 카테고리 비중 + 지출 속도 라인 차트
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  EmptyState,
  DonutChart,
  SpendingLineChart,
} from '../components/ui';
import { useMonthNavigation, useMonthlySummary, useFilteredTransactions } from '../hooks';
import { CATEGORY_COLORS } from '../constants';
import type { ExpenseCategory } from '../types';
import { formatKRW, formatPercent } from '../utils/currency';
import { shiftMonth, getMonthRange, formatMonthLabel } from '../utils/date';

export default function StatsPage() {
  const navigate = useNavigate();
  const { currentMonth, setMonth, canGoNext } = useMonthNavigation();
  const [viewType, setViewType] = useState<'expense' | 'income'>('expense');
  const [spendingPeriod, setSpendingPeriod] = useState<'monthly' | 'weekly' | 'daily'>('daily');

  // 월간 요약 데이터
  const summary = useMonthlySummary(currentMonth);

  // 이번 달, 지난 달 거래 (지출 속도 차트용)
  const prevMonth = shiftMonth(currentMonth, -1);
  const currentTxns = useFilteredTransactions({ monthKey: currentMonth, type: '지출' });
  const prevTxns = useFilteredTransactions({ monthKey: prevMonth, type: '지출' });

  // 도넛 차트 데이터
  const donutData = useMemo(() => {
    const categories = viewType === 'expense'
      ? summary.expenseByCategory
      : summary.incomeByCategory;

    return categories
      .filter((c) => c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((c) => ({
        label: c.category,
        value: c.totalAmount,
        color: CATEGORY_COLORS[c.category as ExpenseCategory] || '#AEB6BF',
      }));
  }, [summary, viewType]);

  // 전체 합계
  const totalAmount = viewType === 'expense' ? summary.totalExpense : summary.totalIncome;

  // 카테고리별 비중 데이터 (범례용)
  const legendData = useMemo(() => {
    return donutData.map((d) => ({
      ...d,
      percent: totalAmount > 0 ? d.value / totalAmount : 0,
    }));
  }, [donutData, totalAmount]);

  // 지출 속도 차트 데이터 계산
  const { currentCumulative, prevCumulative, xLabels } = useMemo(() => {
    const { end: currentEnd } = getMonthRange(currentMonth);
    const daysInMonth = currentEnd.getDate();

    // 날짜별 지출 합산 함수
    const buildDailyCumulative = (txns: typeof currentTxns, monthKey: string) => {
      const { end } = getMonthRange(monthKey);
      const days = end.getDate();
      const dailyAmounts = new Array(days).fill(0);

      for (const tx of txns) {
        const day = new Date(tx.date).getDate();
        if (day >= 1 && day <= days) {
          dailyAmounts[day - 1] += tx.amount;
        }
      }

      // 누적합 계산
      const cumulative: number[] = [];
      let runningTotal = 0;
      for (let i = 0; i < days; i++) {
        runningTotal += dailyAmounts[i];
        cumulative.push(runningTotal);
      }
      return cumulative;
    };

    const currentCum = buildDailyCumulative(currentTxns, currentMonth);
    const prevCum = buildDailyCumulative(prevTxns, prevMonth);

    // xLabels: 5일 간격으로 라벨 표시
    const labels = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      if (day === 1 || day % 5 === 0 || day === daysInMonth) {
        return `${day}일`;
      }
      return '';
    });

    return {
      currentCumulative: currentCum,
      prevCumulative: prevCum,
      xLabels: labels,
    };
  }, [currentTxns, prevTxns, currentMonth, prevMonth]);

  // 주별 지출 데이터 계산
  const { weeklyData, weeklyLabels, weeklyAvg } = useMemo(() => {
    const { end } = getMonthRange(currentMonth);
    const daysInMonth = end.getDate();
    const weeks: number[] = [];
    const labels: string[] = [];

    let weekTotal = 0;
    let weekNum = 1;
    const year = parseInt(currentMonth.split('-')[0]);
    const month = parseInt(currentMonth.split('-')[1]) - 1;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayAmount = currentTxns
        .filter((tx) => new Date(tx.date).getDate() === d)
        .reduce((sum, tx) => sum + tx.amount, 0);
      weekTotal += dayAmount;

      const dayOfWeek = new Date(year, month, d).getDay();
      if (dayOfWeek === 6 || d === daysInMonth) {
        weeks.push(weekTotal);
        labels.push(`${weekNum}주`);
        weekTotal = 0;
        weekNum++;
      }
    }

    const avg = weeks.length > 0 ? weeks.reduce((a, b) => a + b, 0) / weeks.length : 0;
    return { weeklyData: weeks, weeklyLabels: labels, weeklyAvg: avg };
  }, [currentTxns, currentMonth]);

  // 월별 지출 데이터 (최근 6개월)
  const monthlyBarMonths = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(shiftMonth(currentMonth, -i));
    }
    return months;
  }, [currentMonth]);

  const prevMonth2 = shiftMonth(currentMonth, -2);
  const prevMonth3 = shiftMonth(currentMonth, -3);
  const prevMonth4 = shiftMonth(currentMonth, -4);
  const prevMonth5 = shiftMonth(currentMonth, -5);

  const txnsM2 = useFilteredTransactions({ monthKey: prevMonth2, type: '지출' });
  const txnsM3 = useFilteredTransactions({ monthKey: prevMonth3, type: '지출' });
  const txnsM4 = useFilteredTransactions({ monthKey: prevMonth4, type: '지출' });
  const txnsM5 = useFilteredTransactions({ monthKey: prevMonth5, type: '지출' });

  const monthlyBarData = useMemo(() => {
    const txnsByMonth: Record<string, typeof currentTxns> = {
      [currentMonth]: currentTxns,
      [prevMonth]: prevTxns,
      [prevMonth2]: txnsM2,
      [prevMonth3]: txnsM3,
      [prevMonth4]: txnsM4,
      [prevMonth5]: txnsM5,
    };

    return monthlyBarMonths.map((m) => {
      const txns = txnsByMonth[m] || [];
      const total = txns.reduce((sum, tx) => sum + tx.amount, 0);
      const label = `${parseInt(m.split('-')[1])}월`;
      return { month: m, label, total };
    });
  }, [monthlyBarMonths, currentTxns, prevTxns, txnsM2, txnsM3, txnsM4, txnsM5, currentMonth, prevMonth, prevMonth2, prevMonth3, prevMonth4, prevMonth5]);

  const monthlyAvg = useMemo(() => {
    const totals = monthlyBarData.map((d) => d.total);
    return totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  }, [monthlyBarData]);

  // 데이터 존재 여부
  const hasData = donutData.length > 0;

  // 월 네비게이션
  const prevMonthNav = shiftMonth(currentMonth, -1);
  const nextMonthNav = shiftMonth(currentMonth, 1);
  const effectiveMax = canGoNext ? undefined : currentMonth;
  const canGoNextMonth = !effectiveMax || nextMonthNav <= effectiveMax;

  // 지난달 대비 차이
  const prevMonthSummary = useMonthlySummary(prevMonth);
  const expenseDiff = summary.totalExpense - prevMonthSummary.totalExpense;

  return (
    <div className="pb-28 animate-fade-in">
      {/* ========== 헤더 ========== */}
      <div className="flex items-center justify-between pt-2 pb-4 px-1">
        <h1 className="text-[22px] font-bold text-text-primary tracking-tight">통계</h1>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="text-[14px] text-accent font-medium bg-transparent border-none cursor-pointer"
        >
          설정
        </button>
      </div>

      {/* ========== 월 네비게이터 ========== */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => setMonth(prevMonthNav)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-accent/15 text-accent text-lg font-bold transition-all active:scale-95"
        >
          &lsaquo;
        </button>
        <span className="text-[18px] font-bold text-text-primary min-w-[4rem] text-center">
          {formatMonthLabel(currentMonth)}
        </span>
        <button
          type="button"
          disabled={!canGoNextMonth}
          onClick={() => canGoNextMonth && setMonth(nextMonthNav)}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold transition-all active:scale-95 ${
            canGoNextMonth
              ? 'bg-accent/15 text-accent'
              : 'bg-bg-elevated text-text-tertiary opacity-40 cursor-not-allowed'
          }`}
        >
          &rsaquo;
        </button>
      </div>

      {/* ========== 지출/수입 요약 배너 ========== */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-5">
            <button
              type="button"
              onClick={() => setViewType('expense')}
              className={`bg-transparent border-none cursor-pointer transition-colors ${
                viewType === 'expense' ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <p className="text-[12px] text-text-tertiary mb-0.5">지출</p>
              <p className="text-[20px] font-bold text-expense">{formatKRW(summary.totalExpense)}</p>
            </button>
            <button
              type="button"
              onClick={() => setViewType('income')}
              className={`bg-transparent border-none cursor-pointer transition-colors ${
                viewType === 'income' ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <p className="text-[12px] text-text-tertiary mb-0.5">수입</p>
              <p className="text-[20px] font-bold text-income">{formatKRW(summary.totalIncome)}</p>
            </button>
          </div>
          {viewType === 'expense' && expenseDiff !== 0 && (
            <div className={`text-[12px] px-2.5 py-1 rounded-full font-medium ${
              expenseDiff > 0
                ? 'bg-expense/15 text-expense'
                : 'bg-income/15 text-income'
            }`}>
              {expenseDiff > 0 ? '+' : ''}{formatKRW(expenseDiff)}
            </div>
          )}
        </div>
      </Card>

      {!hasData ? (
        <EmptyState
          icon={viewType === 'expense' ? '📊' : '💰'}
          title={`${viewType === 'expense' ? '지출' : '수입'} 데이터가 없습니다`}
          description="설정에서 뱅크샐러드 엑셀 파일을 import 해주세요."
        />
      ) : (
        <div className="space-y-4">
          {/* ========== 도넛 차트 섹션 ========== */}
          <Card className="flex flex-col items-center py-6">
            <DonutChart
              data={donutData}
              centerLabel={viewType === 'expense' ? '총 지출' : '총 수입'}
              centerValue={formatKRW(totalAmount)}
              size={220}
              onSegmentClick={(label) => navigate(`/category/${encodeURIComponent(label)}`)}
            />
          </Card>

          {/* ========== 카테고리 범례 리스트 ========== */}
          <Card className="!p-0">
            <div className="divide-y divide-border-primary/40">
              {legendData.map((item, idx) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(`/category/${encodeURIComponent(item.label)}`)}
                  className={`flex items-center w-full py-3.5 px-4 hover:bg-bg-card-hover transition-colors cursor-pointer bg-transparent border-none text-left ${
                    idx === 0 ? 'rounded-t-[16px]' : ''
                  } ${idx === legendData.length - 1 ? 'rounded-b-[16px]' : ''}`}
                >
                  {/* 순위 번호 */}
                  <span className="text-[12px] text-text-tertiary font-medium w-5 shrink-0">
                    {idx + 1}
                  </span>

                  {/* 컬러 도트 */}
                  <span
                    className="w-3 h-3 rounded-full shrink-0 mr-2.5"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* 카테고리명 + 퍼센트 */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[14px] text-text-primary font-medium truncate">
                      {item.label}
                    </span>
                    <span className="text-[12px] text-text-tertiary shrink-0">
                      {formatPercent(item.percent)}
                    </span>
                  </div>

                  {/* 금액 + 화살표 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[14px] font-semibold text-text-primary tabular-nums">
                      {formatKRW(item.value)}
                    </span>
                    <span className="text-text-tertiary text-[14px]">&rsaquo;</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* ========== 지출 속도 섹션 (지출 모드일 때만) ========== */}
          {viewType === 'expense' && (
            <section className="mt-6">
              <div className="flex items-center justify-between px-1 mb-4">
                <h2 className="text-[17px] font-bold text-text-primary">지출 속도</h2>
              </div>

              {/* 기간 토글 — 뱅크샐러드 pill 스타일 */}
              <div className="flex gap-2 mb-4 px-1">
                {(['monthly', 'weekly', 'daily'] as const).map((period) => {
                  const isActive = spendingPeriod === period;
                  return (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setSpendingPeriod(period)}
                      className={`px-4 py-2 text-[13px] rounded-full border transition-all ${
                        isActive
                          ? 'bg-text-primary border-text-primary text-bg-app font-semibold'
                          : 'bg-transparent border-border-secondary text-text-secondary hover:border-text-tertiary'
                      }`}
                    >
                      {period === 'monthly' ? '월별' : period === 'weekly' ? '주별' : '일별'}
                    </button>
                  );
                })}
              </div>

              <Card>
                {/* 일별: 기존 누적 라인 차트 */}
                {spendingPeriod === 'daily' && (
                  <>
                    <SpendingLineChart
                      datasets={[
                        {
                          label: '이번 달',
                          data: currentCumulative,
                          color: '#6c9fff',
                        },
                        {
                          label: '지난 달',
                          data: prevCumulative,
                          color: '#636366',
                          dashed: true,
                        },
                      ]}
                      xLabels={xLabels}
                      height={200}
                    />
                    {/* 범례 */}
                    <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border-primary/60">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1 rounded-full bg-[#6c9fff]" />
                        <span className="text-[12px] text-text-secondary">
                          {parseInt(currentMonth.split('-')[1])}월 {formatKRW(summary.totalExpense)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1 rounded-full bg-[#636366]" />
                        <span className="text-[12px] text-text-tertiary">
                          {parseInt(prevMonth.split('-')[1])}월 {formatKRW(prevMonthSummary.totalExpense)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* 주별: 바 차트 */}
                {spendingPeriod === 'weekly' && (
                  <div>
                    <div className="flex items-end gap-3 h-[180px] px-2 relative">
                      {/* 평균선 */}
                      {weeklyData.length > 0 && Math.max(...weeklyData) > 0 && (
                        <div
                          className="absolute left-0 right-0 border-t border-dashed border-text-tertiary/40 pointer-events-none"
                          style={{
                            bottom: `${(weeklyAvg / Math.max(...weeklyData)) * 160 + 20}px`,
                          }}
                        >
                          <span className="absolute right-0 -top-4 text-[10px] text-text-tertiary bg-bg-card px-1">
                            평균
                          </span>
                        </div>
                      )}
                      {weeklyData.map((amount, i) => {
                        const maxVal = Math.max(...weeklyData, 1);
                        const height = (amount / maxVal) * 160;
                        return (
                          <div
                            key={weeklyLabels[i]}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <span className="text-[10px] text-text-secondary font-medium tabular-nums">
                              {Math.round(amount / 10000)}만
                            </span>
                            <div
                              className="w-full rounded-t-lg transition-all"
                              style={{
                                height: `${Math.max(height, 4)}px`,
                                background: 'linear-gradient(180deg, #6c9fff 0%, #6c9fff88 100%)',
                              }}
                            />
                            <span className="text-[11px] text-text-tertiary font-medium">
                              {weeklyLabels[i]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-border-primary/60">
                      <span className="text-[13px] text-text-secondary">주별 평균지출</span>
                      <span className="text-[14px] font-bold text-accent tabular-nums">
                        {Math.round(weeklyAvg).toLocaleString('ko-KR')}원
                      </span>
                    </div>
                  </div>
                )}

                {/* 월별: 최근 6개월 바 차트 */}
                {spendingPeriod === 'monthly' && (
                  <div>
                    <div className="flex items-end gap-3 h-[180px] px-2 relative">
                      {/* 평균선 */}
                      {monthlyBarData.length > 0 && Math.max(...monthlyBarData.map((d) => d.total)) > 0 && (
                        <div
                          className="absolute left-0 right-0 border-t border-dashed border-text-tertiary/40 pointer-events-none"
                          style={{
                            bottom: `${(monthlyAvg / Math.max(...monthlyBarData.map((d) => d.total))) * 160 + 20}px`,
                          }}
                        >
                          <span className="absolute right-0 -top-4 text-[10px] text-text-tertiary bg-bg-card px-1">
                            평균
                          </span>
                        </div>
                      )}
                      {monthlyBarData.map((item) => {
                        const maxVal = Math.max(...monthlyBarData.map((d) => d.total), 1);
                        const height = (item.total / maxVal) * 160;
                        const isCurrent = item.month === currentMonth;
                        return (
                          <div
                            key={item.month}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <span className="text-[10px] text-text-secondary font-medium tabular-nums">
                              {item.total >= 10000
                                ? `${Math.round(item.total / 10000)}만`
                                : item.total > 0
                                  ? `${Math.round(item.total / 1000)}천`
                                  : '0'}
                            </span>
                            <div
                              className="w-full rounded-t-lg transition-all"
                              style={{
                                height: `${Math.max(height, 4)}px`,
                                background: isCurrent
                                  ? 'linear-gradient(180deg, #6c9fff 0%, #6c9fff88 100%)'
                                  : 'linear-gradient(180deg, #48484a 0%, #48484a88 100%)',
                              }}
                            />
                            <span
                              className={`text-[11px] font-medium ${isCurrent ? 'text-accent' : 'text-text-tertiary'}`}
                            >
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-border-primary/60">
                      <span className="text-[13px] text-text-secondary">월별 평균지출</span>
                      <span className="text-[14px] font-bold text-accent tabular-nums">
                        {Math.round(monthlyAvg).toLocaleString('ko-KR')}원
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            </section>
          )}

          {/* ========== 월별 비교 분석 버튼 ========== */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/comparison')}
              className="w-full py-3 rounded-[12px] bg-bg-elevated text-text-primary text-[14px] font-medium hover:bg-bg-card-hover transition-colors"
            >
              월별 비교 분석
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
