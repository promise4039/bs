// 가계부 내역 페이지 — 뱅크샐러드 스타일 (IMG_1500 레이아웃)
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DateDivider,
  TransactionListItem,
  EmptyState,
} from '../components/ui';
import { TransactionFormSheet } from '../components/ui/TransactionFormSheet';
import { useMonthNavigation, useMonthlySummary, useFilteredTransactions } from '../hooks';
import { useTransactionStore } from '../store';
import type { Transaction, TransactionType } from '../types';
import { formatNumber } from '../utils/currency';
import { formatMonthLabel, shiftMonth, getCurrentMonthKey } from '../utils/date';

type TypeFilter = 'all' | '수입' | '지출';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { currentMonth, setMonth, canGoNext } = useMonthNavigation();
  const { totalIncome, totalExpense } = useMonthlySummary(currentMonth);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  // 검색 상태
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 결제수단 필터
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showPaymentFilter, setShowPaymentFilter] = useState(false);

  // 거래 CRUD
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);

  // 월 네비게이션
  const effectiveMax = canGoNext ? undefined : currentMonth;
  const prevMonth = shiftMonth(currentMonth, -1);
  const nextMonth = shiftMonth(currentMonth, 1);
  const canGoNextMonth = !effectiveMax || nextMonth <= effectiveMax;

  // 이전 달 비교
  const prevMonthKey = shiftMonth(currentMonth, -1);
  const { totalExpense: prevTotalExpense } = useMonthlySummary(prevMonthKey);
  const isCurrentMonth = currentMonth === getCurrentMonthKey();

  const allMonthTransactions = useFilteredTransactions({
    monthKey: currentMonth,
    type: typeFilter !== 'all' ? (typeFilter as TransactionType) : undefined,
  });

  const filteredTransactions = useFilteredTransactions({
    monthKey: currentMonth,
    type: typeFilter !== 'all' ? (typeFilter as TransactionType) : undefined,
    searchQuery: searchQuery || undefined,
    paymentMethod: selectedPaymentMethod || undefined,
  });

  // 결제수단 목록
  const paymentMethods = useMemo(() => {
    const methods = new Set<string>();
    for (const tx of allMonthTransactions) {
      if (tx.paymentMethod) methods.add(tx.paymentMethod);
    }
    return Array.from(methods).sort();
  }, [allMonthTransactions]);

  const isFilterActive = selectedPaymentMethod !== null;

  // 날짜별 그룹핑
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filteredTransactions) {
      const existing = map.get(tx.date);
      if (existing) existing.push(tx);
      else map.set(tx.date, [tx]);
    }
    return map;
  }, [filteredTransactions]);

  // 날짜별 합계
  const dateSummaries = useMemo(() => {
    const summaries = new Map<string, { income: number; expense: number }>();
    for (const [date, txns] of groupedByDate) {
      let income = 0, expense = 0;
      for (const tx of txns) {
        if (tx.type === '수입') income += tx.amount;
        else expense += tx.amount;
      }
      summaries.set(date, { income, expense });
    }
    return summaries;
  }, [groupedByDate]);

  // 지난달 비교
  const expenseDiff = useMemo(() => {
    if (!isCurrentMonth || prevTotalExpense === 0) return null;
    const diff = prevTotalExpense - totalExpense;
    return diff;
  }, [isCurrentMonth, prevTotalExpense, totalExpense]);

  const hasTransactions = filteredTransactions.length > 0;

  return (
    <div className="flex flex-col gap-3 pb-24 animate-fade-in">
      {/* ========== 헤더: 가계부 + 아이콘 ========== */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-xl font-bold text-text-primary">가계부</h1>
        <button
          type="button"
          onClick={() => navigate('/categories')}
          className="text-text-tertiary hover:text-accent text-lg bg-transparent border-none cursor-pointer transition-colors"
          title="카테고리 관리"
        >
          ⚙️
        </button>
      </div>

      {/* ========== 월 네비게이터 + 지출/수입 총계 (같은 줄) ========== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
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

      {/* ========== 지난달 비교 카드 ========== */}
      {expenseDiff !== null && (
        <div className="flex items-center justify-between bg-bg-card rounded-[14px] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{expenseDiff > 0 ? '😊' : '😰'}</span>
            <span className="text-[14px] text-text-primary">
              지난달 이때보다{' '}
              <span className={expenseDiff > 0 ? 'text-income font-semibold' : 'text-expense font-semibold'}>
                {formatNumber(Math.abs(expenseDiff))}원
              </span>
              {expenseDiff > 0 ? ' 덜' : ' 더'} 쓰는 중
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/stats')}
            className="text-[13px] text-text-tertiary bg-bg-elevated px-3 py-1.5 rounded-lg hover:bg-bg-card-hover transition-colors"
          >
            분석
          </button>
        </div>
      )}

      {/* ========== 툴바: 목록/달력/필터 + 검색/추가 아이콘 ========== */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* 목록/달력 토글 */}
          <div className="flex items-center bg-bg-elevated rounded-full p-1">
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-full bg-bg-card text-text-primary shadow-sm"
            >
              <span className="text-[14px]">☰</span>
              <span>목록</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/calendar')}
              className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-full text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <span className="text-[14px]">📅</span>
              <span>달력</span>
            </button>
          </div>

          {/* 필터 드롭다운 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPaymentFilter(!showPaymentFilter)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-full transition-colors ${
                typeFilter !== 'all' || isFilterActive
                  ? 'bg-accent/15 text-accent'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>필터</span>
              <span className="text-[11px]">▾</span>
            </button>
            {showPaymentFilter && (
              <div className="absolute top-full left-0 mt-1 z-30 bg-bg-elevated border border-border-primary rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                {/* 타입 필터 */}
                <div className="px-3 py-2 text-[11px] text-text-tertiary font-medium border-b border-border-primary">분류</div>
                {(['all', '수입', '지출'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                      typeFilter === t ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-bg-card-hover'
                    }`}
                  >
                    {t === 'all' ? '전체' : t}
                  </button>
                ))}
                {/* 결제수단 필터 */}
                {paymentMethods.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-[11px] text-text-tertiary font-medium border-t border-border-primary">결제수단</div>
                    <button
                      type="button"
                      onClick={() => { setSelectedPaymentMethod(null); setShowPaymentFilter(false); }}
                      className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                        !selectedPaymentMethod ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-bg-card-hover'
                      }`}
                    >
                      전체
                    </button>
                    {paymentMethods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => { setSelectedPaymentMethod(method); setShowPaymentFilter(false); }}
                        className={`w-full px-4 py-3 text-sm text-left transition-colors truncate ${
                          selectedPaymentMethod === method ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-bg-card-hover'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 검색 아이콘 */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              showSearch ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}
          >
            <span className="text-lg">🔍</span>
          </button>
          {/* 추가 아이콘 */}
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <span className="text-2xl font-light">+</span>
          </button>
        </div>
      </div>

      {/* ========== 검색바 (토글) ========== */}
      {showSearch && (
        <div className="flex items-center gap-2 bg-bg-card rounded-[14px] px-4 py-3">
          <span className="text-text-tertiary text-sm flex-shrink-0">🔍</span>
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
              className="bg-transparent border-none cursor-pointer text-text-tertiary hover:text-text-primary text-sm transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* 활성 필터 뱃지 */}
      {(searchQuery || isFilterActive || typeFilter !== 'all') && (
        <div className="flex items-center gap-2 flex-wrap">
          {typeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-accent/10 text-accent">
              {typeFilter}
              <button type="button" onClick={() => setTypeFilter('all')} className="hover:text-text-primary">✕</button>
            </span>
          )}
          {isFilterActive && (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-accent/10 text-accent">
              💳 {selectedPaymentMethod}
              <button type="button" onClick={() => setSelectedPaymentMethod(null)} className="hover:text-text-primary">✕</button>
            </span>
          )}
          {searchQuery && (
            <span className="text-xs text-text-secondary">
              검색결과 <span className="font-semibold text-accent">{filteredTransactions.length}</span>건
            </span>
          )}
        </div>
      )}

      {/* ========== 날짜별 거래 리스트 ========== */}
      {hasTransactions ? (
        <div className="flex flex-col">
          {Array.from(groupedByDate.entries()).map(([date, txns]) => {
            const summary = dateSummaries.get(date);
            return (
              <div key={date}>
                <DateDivider
                  date={date}
                  income={summary?.income}
                  expense={summary?.expense}
                />
                <div className="px-1">
                  {txns.map((tx) => (
                    <TransactionListItem
                      key={tx.id}
                      transaction={tx}
                      onClick={() => setEditingTx(tx)}
                      onDelete={deleteTransaction}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="📋"
          title="거래 내역이 없습니다"
          description="이 달의 거래 기록이 없습니다"
        />
      )}

      {/* FAB — 뱅크샐러드 스타일 원형 + 버튼 */}
      <button
        type="button"
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-24 right-5 z-20 w-14 h-14 rounded-full bg-accent text-white text-2xl shadow-lg hover:bg-accent-hover transition-colors flex items-center justify-center"
        aria-label="거래 추가"
      >
        +
      </button>

      {/* 거래 추가 폼 */}
      <TransactionFormSheet
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
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
      />

      {/* 필터 오버레이 */}
      {showPaymentFilter && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowPaymentFilter(false)}
        />
      )}
    </div>
  );
}
