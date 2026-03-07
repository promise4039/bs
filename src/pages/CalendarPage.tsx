// 캘린더 페이지 — 뱅크샐러드 스타일 월간 캘린더 뷰
// 월 총계, 목록/달력 토글, 필터, 검색, 일별 수입/지출 표시
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  SectionHeader,
  TransactionListItem,
  EmptyState,
  Badge,
} from '../components/ui';
import { TransactionFormSheet } from '../components/ui/TransactionFormSheet';
import { useMonthNavigation, useFilteredTransactions, useMonthlySummary } from '../hooks';
import { useTransactionStore } from '../store';
import { formatNumber, formatKRW } from '../utils/currency';
import { formatMonthLabel, shiftMonth, getCurrentMonthKey } from '../utils/date';
import type { Transaction } from '../types';

/** 해당 월의 일수 및 첫째 날 요일 정보 */
function getMonthInfo(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  return { year, month, firstDayOfWeek, daysInMonth };
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarPage() {
  const navigate = useNavigate();
  const { currentMonth, setMonth, canGoNext } = useMonthNavigation();
  const { totalIncome, totalExpense } = useMonthlySummary(currentMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // 검색 상태
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 필터 상태
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState<'all' | '수입' | '지출'>('all');

  // 거래 CRUD 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormDate, setAddFormDate] = useState('');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);

  // 해당 월의 모든 거래
  const allTransactions = useFilteredTransactions({
    monthKey: currentMonth,
    searchQuery: searchQuery || undefined,
  });

  const { year, month, firstDayOfWeek, daysInMonth } = useMemo(
    () => getMonthInfo(currentMonth),
    [currentMonth],
  );

  const today = getTodayString();
  const currentMonthKey = getCurrentMonthKey();
  const isCurrentMonth = currentMonth === currentMonthKey;

  // 이전 달 데이터 (비교 분석용)
  const prevMonthKey = shiftMonth(currentMonth, -1);
  const { totalExpense: prevTotalExpense } = useMonthlySummary(prevMonthKey);

  // 일별 수입/지출 합계 계산
  const dailySummary = useMemo(() => {
    const map = new Map<number, { income: number; expense: number; hasEvent: boolean }>();
    for (const tx of allTransactions) {
      const day = parseInt(tx.date.split('-')[2], 10);
      const existing = map.get(day) || { income: 0, expense: 0, hasEvent: false };
      if (tx.type === '수입') {
        existing.income += tx.amount;
      } else {
        existing.expense += tx.amount;
      }
      map.set(day, existing);
    }
    return map;
  }, [allTransactions]);

  // 일별 전체 거래 (선택된 날 상세용)
  const dailyTransactions = useMemo(() => {
    const map = new Map<number, Transaction[]>();
    for (const tx of allTransactions) {
      const day = parseInt(tx.date.split('-')[2], 10);
      const existing = map.get(day);
      if (existing) {
        existing.push(tx);
      } else {
        map.set(day, [tx]);
      }
    }
    return map;
  }, [allTransactions]);

  // 무지출일 계산 (오늘까지만)
  const noSpendDayCount = useMemo(() => {
    const todayDate = new Date();
    const maxDay = isCurrentMonth
      ? Math.min(todayDate.getDate(), daysInMonth)
      : daysInMonth;
    let count = 0;
    for (let d = 1; d <= maxDay; d++) {
      const summary = dailySummary.get(d);
      if (!summary || summary.expense === 0) count++;
    }
    return count;
  }, [dailySummary, daysInMonth, isCurrentMonth]);

  // 이번 달 동기 대비 지출 비교
  const expenseDiff = useMemo(() => {
    if (!isCurrentMonth) return null;
    const todayDay = new Date().getDate();
    // 이번 달 오늘까지 지출
    let currentSpend = 0;
    for (const [day, summary] of dailySummary) {
      if (day <= todayDay) currentSpend += summary.expense;
    }
    const diff = prevTotalExpense - currentSpend;
    return { diff, currentSpend, prevTotal: prevTotalExpense };
  }, [dailySummary, prevTotalExpense, isCurrentMonth]);

  // 선택된 날의 거래 목록
  const selectedDayTransactions = useMemo(() => {
    if (selectedDay === null) return [];
    const txns = dailyTransactions.get(selectedDay) || [];
    if (filterType === 'all') return txns;
    return txns.filter((tx) => tx.type === filterType);
  }, [selectedDay, dailyTransactions, filterType]);

  const handleDayClick = useCallback((day: number) => {
    setSelectedDay((prev) => (prev === day ? null : day));
  }, []);

  const isFutureDay = (day: number): boolean => {
    if (!isCurrentMonth) return currentMonth > currentMonthKey;
    return day > new Date().getDate();
  };

  const isToday = (day: number): boolean => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === today;
  };

  // 금액 포맷 (캘린더 셀용 — 간결하게)
  const formatCellAmount = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 10000).toFixed(0)}만`;
    if (amount >= 10000) return formatNumber(amount);
    return formatNumber(amount);
  };

  // 캘린더 그리드 셀
  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDayOfWeek, daysInMonth]);

  // 월 네비게이션
  const effectiveMax = canGoNext ? undefined : currentMonth;
  const prevMonth = shiftMonth(currentMonth, -1);
  const nextMonth = shiftMonth(currentMonth, 1);
  const canGoPrev = true;
  const canGoNextMonth = !effectiveMax || nextMonth <= effectiveMax;

  return (
    <div className="pb-28 space-y-3">
      {/* ========== 헤더: 가계부 + 월 총계 ========== */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-text-primary">가계부</h1>
      </div>

      {/* 월 네비게이터 + 지출/수입 총계 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => setMonth(prevMonth)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-xl text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            ‹
          </button>
          <span className="text-lg font-bold text-text-primary min-w-[3rem] text-center">
            {formatMonthLabel(currentMonth)}
          </span>
          <button
            type="button"
            disabled={!canGoNextMonth}
            onClick={() => canGoNextMonth && setMonth(nextMonth)}
            className={`w-9 h-9 flex items-center justify-center rounded-full text-xl transition-colors ${
              canGoNextMonth
                ? 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                : 'text-text-tertiary opacity-30 cursor-not-allowed'
            }`}
          >
            ›
          </button>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-text-secondary">지출</span>
            <span className="text-lg font-bold text-text-primary">
              {formatNumber(totalExpense)}원
            </span>
          </div>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xs text-text-secondary">수입</span>
            <span className="text-sm font-semibold text-income">
              {formatNumber(totalIncome)}원
            </span>
          </div>
        </div>
      </div>

      {/* ========== 지난달 비교 분석 카드 ========== */}
      {expenseDiff && expenseDiff.prevTotal > 0 && (
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{expenseDiff.diff > 0 ? '😊' : '😰'}</span>
              <span className="text-sm text-text-primary">
                지난달 이때보다{' '}
                <span className={expenseDiff.diff > 0 ? 'text-income font-semibold' : 'text-expense font-semibold'}>
                  {formatKRW(Math.abs(expenseDiff.diff))}
                </span>
                {expenseDiff.diff > 0 ? ' 덜' : ' 더'} 쓰는 중
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/comparison')}
              className="text-xs text-text-tertiary bg-bg-elevated px-3 py-1.5 rounded-lg hover:bg-bg-card-hover transition-colors"
            >
              분석
            </button>
          </div>
        </Card>
      )}

      {/* ========== 툴바: 목록/달력 + 필터 + 검색 + 추가 ========== */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* 목록/달력 토글 */}
          <div className="flex items-center bg-bg-elevated rounded-full p-1">
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-full text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <span className="text-[14px]">☰</span>
              <span>목록</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-full bg-bg-card text-text-primary shadow-sm"
            >
              <span className="text-[14px]">📅</span>
              <span>달력</span>
            </button>
          </div>

          {/* 필터 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-full transition-colors ${
                filterType !== 'all'
                  ? 'bg-accent/15 text-accent'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>필터</span>
              <span className="text-[11px]">▾</span>
            </button>
            {showFilter && (
              <div className="absolute top-full left-0 mt-1 z-30 bg-bg-elevated border border-border-primary rounded-xl shadow-lg overflow-hidden min-w-[100px]">
                {(['all', '수입', '지출'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setFilterType(type); setShowFilter(false); }}
                    className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                      filterType === type
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-text-secondary hover:bg-bg-card-hover'
                    }`}
                  >
                    {type === 'all' ? '전체' : type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 검색 */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              showSearch ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}
          >
            <span className="text-lg">🔍</span>
          </button>

          {/* 거래 추가 */}
          <button
            type="button"
            onClick={() => {
              if (selectedDay !== null) {
                setAddFormDate(`${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`);
              } else {
                setAddFormDate('');
              }
              setShowAddForm(true);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <span className="text-2xl font-light">+</span>
          </button>
        </div>
      </div>

      {/* 검색 바 (토글) */}
      {showSearch && (
        <div className="flex items-center gap-2 bg-bg-card rounded-xl px-4 py-3">
          <span className="text-text-tertiary text-sm flex-shrink-0">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="거래처, 메모 검색..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-tertiary"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="bg-transparent border-none cursor-pointer text-text-tertiary hover:text-text-primary text-sm transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ========== 무지출 배너 ========== */}
      {noSpendDayCount > 0 && (
        <div className="flex items-center justify-between bg-bg-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff6b9d]" />
            <span className="text-sm text-text-primary">이번 달 무지출</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-text-primary">총 {noSpendDayCount}일</span>
            <span className="text-text-tertiary text-xs">›</span>
          </div>
        </div>
      )}

      {/* ========== 캘린더 그리드 ========== */}
      <div className="px-1">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS.map((header, i) => (
            <div
              key={header}
              className={`text-center text-xs font-medium py-1.5 ${
                i === 0 ? 'text-expense' : i === 6 ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              {header}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {calendarCells.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[64px]" />;
            }

            const summary = dailySummary.get(day);
            const expense = summary?.expense || 0;
            const income = summary?.income || 0;
            const future = isFutureDay(day);
            const todayFlag = isToday(day);
            const selected = selectedDay === day;
            const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
            const hasBothTypes = expense > 0 && income > 0;

            return (
              <button
                key={day}
                type="button"
                onClick={() => !future && handleDayClick(day)}
                disabled={future}
                className={`
                  min-h-[64px] flex flex-col items-center pt-1.5 pb-1 gap-[1px]
                  transition-all text-center border-t border-border-primary/30
                  ${future ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}
                  ${selected ? 'bg-accent/10' : ''}
                  ${todayFlag && !selected ? 'bg-bg-elevated/50' : ''}
                `}
              >
                {/* 날짜 숫자 */}
                <span
                  className={`text-xs leading-none ${
                    future
                      ? 'text-text-tertiary'
                      : todayFlag
                        ? 'text-accent font-bold'
                        : dayOfWeek === 0
                          ? 'text-expense/80'
                          : dayOfWeek === 6
                            ? 'text-accent/80'
                            : 'text-text-primary'
                  }`}
                >
                  {day}
                </span>

                {/* 거래 도트 (수입+지출 동시) */}
                {hasBothTypes && !future && (
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-expense" />
                    <span className="w-1 h-1 rounded-full bg-income" />
                  </div>
                )}

                {/* 지출 금액 */}
                {!future && expense > 0 && (
                  <span className="text-[10px] leading-tight text-text-primary font-medium truncate w-full px-0.5">
                    -{formatCellAmount(expense)}
                  </span>
                )}

                {/* 수입 금액 */}
                {!future && income > 0 && (
                  <span className="text-[10px] leading-tight text-income font-medium truncate w-full px-0.5">
                    +{formatCellAmount(income)}
                  </span>
                )}

                {/* 무지출 표시 (지출도 수입도 없는 과거 날짜) */}
                {!future && expense === 0 && income === 0 && !isFutureDay(day) && (
                  <span className="text-[9px] leading-none text-text-tertiary mt-1">·</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== 선택된 날짜의 거래 상세 ========== */}
      {selectedDay !== null && (
        <Card className="space-y-2">
          <SectionHeader
            title={`${month}월 ${selectedDay}일`}
            rightLabel="+ 추가"
            onRightClick={() => {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
              setAddFormDate(dateStr);
              setShowAddForm(true);
            }}
          />

          {/* 해당 날짜 수입/지출 소계 */}
          {(() => {
            const s = dailySummary.get(selectedDay);
            if (!s) return null;
            return (
              <div className="flex items-center gap-3 text-xs pb-1">
                {s.expense > 0 && (
                  <span className="text-text-secondary">
                    지출 <span className="font-semibold text-text-primary">{formatKRW(s.expense)}</span>
                  </span>
                )}
                {s.income > 0 && (
                  <span className="text-text-secondary">
                    수입 <span className="font-semibold text-income">{formatKRW(s.income)}</span>
                  </span>
                )}
              </div>
            );
          })()}

          {selectedDayTransactions.length > 0 ? (
            <div className="overflow-hidden rounded-xl">
              {selectedDayTransactions.map((tx) => (
                <TransactionListItem
                  key={tx.id}
                  transaction={tx}
                  onClick={() => setEditingTx(tx)}
                  onDelete={deleteTransaction}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="✨"
              title="무지출 달성!"
              description="이 날은 지출이 없습니다"
            />
          )}
        </Card>
      )}

      {/* ========== 필터 결과 표시 ========== */}
      {(searchQuery || filterType !== 'all') && (
        <div className="flex items-center gap-2 px-1">
          {searchQuery && (
            <Badge text={`"${searchQuery}" 검색 중`} color="blue" />
          )}
          {filterType !== 'all' && (
            <Badge text={`${filterType}만 표시`} color={filterType === '수입' ? 'green' : 'red'} />
          )}
        </div>
      )}

      {/* ========== 거래 추가 폼 ========== */}
      <TransactionFormSheet
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        defaultDate={addFormDate || undefined}
        onSave={(tx) => {
          addTransaction(tx);
          setShowAddForm(false);
        }}
      />

      {/* 거래 편집 폼 */}
      <TransactionFormSheet
        isOpen={editingTx !== null}
        onClose={() => setEditingTx(null)}
        editTransaction={editingTx}
        onSave={(tx) => {
          updateTransaction(tx.id, tx);
          setEditingTx(null);
        }}
        onDelete={(id) => {
          deleteTransaction(id);
          setEditingTx(null);
        }}
      />

      {/* 필터 오버레이 클릭 닫기 */}
      {showFilter && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
