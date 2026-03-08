// 캘린더 페이지 — 뱅크샐러드 스타일 월간 캘린더 뷰
// 월 총계, 목록/달력 토글, 필터, 검색, 일별 수입/지출 표시
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
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
    <div className="pb-28 flex flex-col gap-4 animate-fade-in">
      {/* ========== 헤더: 가계부 타이틀 + 총계 ========== */}
      <div className="flex items-center justify-between pt-2 px-1">
        <h1 className="text-[22px] font-bold text-text-primary tracking-tight">가계부</h1>
        <div className="flex items-baseline gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary mr-1">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-[15px] font-bold text-text-primary tabular-nums">
            {formatNumber(totalExpense)}원
          </span>
        </div>
      </div>

      {/* ========== 월 네비게이터 + 수입/지출 총계 ========== */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => setMonth(prevMonth)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors bg-transparent border-none cursor-pointer"
          >
            ‹
          </button>
          <span className="text-[17px] font-bold text-text-primary min-w-[3.5rem] text-center">
            {formatMonthLabel(currentMonth)}
          </span>
          <button
            type="button"
            disabled={!canGoNextMonth}
            onClick={() => canGoNextMonth && setMonth(nextMonth)}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors bg-transparent border-none ${
              canGoNextMonth
                ? 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer'
                : 'text-text-tertiary opacity-30 cursor-not-allowed'
            }`}
          >
            ›
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] text-text-tertiary">수입</span>
            <span className="text-[13px] font-semibold text-income tabular-nums">
              +{formatNumber(totalIncome)}원
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] text-text-tertiary">지출</span>
            <span className="text-[13px] font-semibold text-text-primary tabular-nums">
              -{formatNumber(totalExpense)}원
            </span>
          </div>
        </div>
      </div>

      {/* ========== 지난달 비교 배너 ========== */}
      {expenseDiff && expenseDiff.prevTotal > 0 && (
        <div className="flex items-center justify-between bg-bg-card rounded-[14px] px-4 py-3.5 mx-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[18px]">{expenseDiff.diff > 0 ? '😊' : '😰'}</span>
            <span className="text-[13px] text-text-primary leading-snug">
              지난달 이때보다{' '}
              <span className={`font-bold ${expenseDiff.diff > 0 ? 'text-income' : 'text-expense'}`}>
                {formatNumber(Math.abs(expenseDiff.diff))}원
              </span>
              {expenseDiff.diff > 0 ? ' 덜' : ' 더'} 쓰는 중
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/comparison')}
            className="text-[12px] text-text-tertiary bg-bg-elevated px-3 py-1.5 rounded-lg hover:bg-bg-card-hover transition-colors font-medium border-none cursor-pointer"
          >
            분석
          </button>
        </div>
      )}

      {/* ========== 툴바: 목록/달력 토글 + 필터 + 검색 + 추가 ========== */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          {/* 목록/달력 토글 */}
          <div className="flex items-center bg-bg-elevated rounded-full p-0.5">
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1 px-3.5 py-1.5 text-[13px] font-medium rounded-full text-text-tertiary hover:text-text-secondary transition-colors bg-transparent border-none cursor-pointer"
            >
              <span className="text-[12px]">☰</span>
              <span>목록</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 px-3.5 py-1.5 text-[13px] font-medium rounded-full bg-bg-card text-text-primary shadow-sm border-none"
            >
              <span className="text-[12px]">📅</span>
              <span>달력</span>
            </button>
          </div>

          {/* 필터 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-1 px-3.5 py-1.5 text-[13px] font-medium rounded-full transition-colors border-none cursor-pointer ${
                filterType !== 'all'
                  ? 'bg-accent/15 text-accent'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>필터</span>
              <span className="text-[10px]">▾</span>
            </button>
            {showFilter && (
              <div className="absolute top-full left-0 mt-1.5 z-30 bg-bg-elevated border border-border-primary rounded-xl shadow-lg overflow-hidden min-w-[100px]">
                {(['all', '수입', '지출'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setFilterType(type); setShowFilter(false); }}
                    className={`w-full px-4 py-2.5 text-[13px] text-left transition-colors border-none cursor-pointer ${
                      filterType === type
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-text-secondary hover:bg-bg-card-hover bg-transparent'
                    }`}
                  >
                    {type === 'all' ? '전체' : type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {/* 검색 */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors border-none cursor-pointer ${
              showSearch ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated bg-transparent'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
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
            className="w-9 h-9 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors bg-transparent border-none cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* 검색 바 (토글) */}
      {showSearch && (
        <div className="flex items-center gap-2.5 bg-bg-card rounded-[14px] px-4 py-3 mx-0.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary flex-shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="거래처 및 메모 내용을 입력하세요"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-text-primary placeholder:text-text-tertiary"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-bg-elevated text-text-tertiary hover:text-text-primary text-[11px] transition-colors border-none cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ========== 무지출 챌린지 배너 ========== */}
      {noSpendDayCount > 0 && (
        <div className="flex items-center justify-between bg-bg-card rounded-[14px] px-4 py-3.5 mx-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[18px]">🐷</span>
            <span className="text-[13px] text-text-primary font-medium">이번 달 무지출 챌린지</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold text-accent">{noSpendDayCount}회</span>
            <span className="text-[11px] text-text-tertiary">성공</span>
          </div>
        </div>
      )}

      {/* ========== 캘린더 그리드 ========== */}
      <Card className="!p-3">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((header, i) => (
            <div
              key={header}
              className={`text-center text-[11px] font-semibold py-2 ${
                i === 0 ? 'text-expense/70' : i === 6 ? 'text-accent/70' : 'text-text-tertiary'
              }`}
            >
              {header}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {calendarCells.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[62px]" />;
            }

            const summary = dailySummary.get(day);
            const expense = summary?.expense || 0;
            const income = summary?.income || 0;
            const future = isFutureDay(day);
            const todayFlag = isToday(day);
            const selected = selectedDay === day;
            const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
            const noSpend = !future && expense === 0 && income === 0;

            return (
              <button
                key={day}
                type="button"
                onClick={() => !future && handleDayClick(day)}
                disabled={future}
                className={`
                  min-h-[62px] flex flex-col items-center pt-1.5 pb-1 gap-[2px] rounded-lg
                  transition-all text-center border-none
                  ${future ? 'opacity-20 cursor-not-allowed bg-transparent' : 'cursor-pointer bg-transparent'}
                  ${selected ? 'bg-accent/10 ring-1 ring-accent/30' : ''}
                  ${todayFlag && !selected ? 'bg-bg-elevated/60' : ''}
                  ${!selected && !todayFlag && !future ? 'hover:bg-bg-elevated/40' : ''}
                `}
              >
                {/* 날짜 숫자 */}
                <span
                  className={`text-[12px] leading-none w-6 h-6 flex items-center justify-center rounded-full ${
                    todayFlag
                      ? 'bg-accent text-white font-bold'
                      : future
                        ? 'text-text-tertiary'
                        : dayOfWeek === 0
                          ? 'text-expense/80 font-medium'
                          : dayOfWeek === 6
                            ? 'text-accent/80 font-medium'
                            : 'text-text-primary font-medium'
                  }`}
                >
                  {day}
                </span>

                {/* 지출 금액 */}
                {!future && expense > 0 && (
                  <span className="text-[9px] leading-tight text-text-primary/80 font-medium truncate w-full px-0.5 tabular-nums">
                    -{formatCellAmount(expense)}
                  </span>
                )}

                {/* 수입 금액 */}
                {!future && income > 0 && (
                  <span className="text-[9px] leading-tight text-income/80 font-medium truncate w-full px-0.5 tabular-nums">
                    +{formatCellAmount(income)}
                  </span>
                )}

                {/* 무지출 표시 (돼지 아이콘) */}
                {noSpend && (
                  <span className="text-[11px] leading-none mt-0.5 opacity-40">🐷</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ========== 선택된 날짜의 거래 상세 ========== */}
      {selectedDay !== null && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-text-primary">
                {month}월 {selectedDay}일
              </h3>
              {(() => {
                const s = dailySummary.get(selectedDay);
                if (!s) return null;
                return (
                  <div className="flex items-center gap-2">
                    {s.expense > 0 && (
                      <span className="text-[11px] text-text-tertiary">
                        지출 <span className="font-semibold text-text-secondary tabular-nums">{formatKRW(s.expense)}</span>
                      </span>
                    )}
                    {s.income > 0 && (
                      <span className="text-[11px] text-text-tertiary">
                        수입 <span className="font-semibold text-income tabular-nums">{formatKRW(s.income)}</span>
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
            <button
              type="button"
              onClick={() => {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                setAddFormDate(dateStr);
                setShowAddForm(true);
              }}
              className="text-[12px] text-accent font-bold bg-transparent border-none cursor-pointer hover:text-accent-hover transition-colors"
            >
              + 추가
            </button>
          </div>

          {selectedDayTransactions.length > 0 ? (
            <Card className="!p-0 overflow-hidden">
              <div className="divide-y divide-border-primary/20">
                {selectedDayTransactions.map((tx) => (
                  <TransactionListItem
                    key={tx.id}
                    transaction={tx}
                    onClick={() => setEditingTx(tx)}
                    onDelete={deleteTransaction}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon="✨"
                title="무지출 달성!"
                description="이 날은 지출이 없습니다"
              />
            </Card>
          )}
        </div>
      )}

      {/* ========== 필터/검색 결과 뱃지 표시 ========== */}
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
