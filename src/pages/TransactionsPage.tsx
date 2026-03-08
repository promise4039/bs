// 가계부 내역 페이지 — 뱅크샐러드 스타일 (IMG_1501 레이아웃)
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

  // 검색 상태 (항상 표시)
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
    <div className="flex flex-col pb-24 animate-fade-in">
      {/* ========== 헤더: 가계부 + 설정아이콘 + 총 지출 (뱅크샐러드 스타일) ========== */}
      <div className="flex items-center justify-between pt-2 pb-1 px-1">
        <h1 className="text-[22px] font-bold text-text-primary tracking-tight">가계부</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors bg-transparent border-none cursor-pointer"
            title="설정"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <span className="text-[15px] font-bold text-text-primary tabular-nums">
            {formatNumber(totalExpense)}<span className="text-[12px] text-text-secondary font-medium">원</span>
          </span>
        </div>
      </div>

      {/* ========== 월 네비게이터 ========== */}
      <div className="flex items-center justify-between px-1 py-1">
        {/* 좌측: < 3월 > */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth(prevMonth)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors bg-transparent border-none cursor-pointer"
          >
            ‹
          </button>
          <span className="text-[17px] font-bold text-text-primary min-w-[3rem] text-center">
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
      </div>

      {/* ========== 수입/지출 요약 ========== */}
      <div className="flex items-center gap-4 px-2 pb-2">
        <span className="text-[13px]">
          <span className="text-text-tertiary">수입 </span>
          <span className="text-income font-semibold tabular-nums">+{formatNumber(totalIncome)}원</span>
        </span>
        <span className="text-[13px]">
          <span className="text-text-tertiary">지출 </span>
          <span className="text-text-primary font-semibold tabular-nums">-{formatNumber(totalExpense)}원</span>
        </span>
      </div>

      {/* ========== 지난달 비교 배너 ========== */}
      {expenseDiff !== null && (
        <div className="flex items-center justify-between bg-bg-card rounded-[14px] px-4 py-3 mx-1 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-[#fbbf24]/20 flex items-center justify-center text-[14px]">🪙</span>
            <span className="text-[13px] text-text-primary">
              지난달 이때보다{' '}
              <span className={`font-bold ${expenseDiff > 0 ? 'text-income' : 'text-expense'}`}>
                {formatNumber(Math.abs(expenseDiff))}원
              </span>
              {expenseDiff > 0 ? ' 덜' : ' 더'} 쓰는 중
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/stats')}
            className="text-[12px] text-text-secondary bg-bg-elevated px-3 py-1.5 rounded-full hover:bg-bg-card-hover transition-colors font-medium border-none cursor-pointer"
          >
            분석
          </button>
        </div>
      )}

      {/* ========== 목록/달력 탭 (뱅크샐러드 세그먼트 컨트롤) ========== */}
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        {/* 좌측: 목록/달력 토글 */}
        <div className="flex items-center bg-bg-elevated rounded-full p-0.5">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded-full bg-bg-card text-text-primary shadow-sm border-none"
          >
            <span className="text-[12px]">☰</span>
            <span>목록</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded-full text-text-tertiary hover:text-text-secondary transition-colors bg-transparent border-none cursor-pointer"
          >
            <span className="text-[12px]">📅</span>
            <span>달력</span>
          </button>
        </div>

        {/* 우측: 전체 수입지출 드롭다운 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPaymentFilter(!showPaymentFilter)}
            className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer"
          >
            <span>{typeFilter === 'all' ? '전체' : typeFilter}</span>
            <span className="text-[11px]">수입지출</span>
            <span className="text-[10px] ml-0.5">▾</span>
          </button>
          {showPaymentFilter && (
            <div className="absolute top-full right-0 mt-1 z-30 bg-bg-elevated border border-border-primary rounded-xl shadow-lg overflow-hidden min-w-[140px]">
              {/* 타입 필터 */}
              <div className="px-3 py-1.5 text-[11px] text-text-tertiary font-medium border-b border-border-primary">분류</div>
              {(['all', '수입', '지출'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTypeFilter(t); setShowPaymentFilter(false); }}
                  className={`w-full px-4 py-2.5 text-[13px] text-left transition-colors border-none cursor-pointer ${
                    typeFilter === t ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-bg-card-hover bg-transparent'
                  }`}
                >
                  {t === 'all' ? '전체' : t}
                </button>
              ))}
              {/* 결제수단 필터 */}
              {paymentMethods.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[11px] text-text-tertiary font-medium border-t border-border-primary">결제수단</div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPaymentMethod(null); setShowPaymentFilter(false); }}
                    className={`w-full px-4 py-2.5 text-[13px] text-left transition-colors border-none cursor-pointer ${
                      !selectedPaymentMethod ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-bg-card-hover bg-transparent'
                    }`}
                  >
                    전체
                  </button>
                  {paymentMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => { setSelectedPaymentMethod(method); setShowPaymentFilter(false); }}
                      className={`w-full px-4 py-2.5 text-[13px] text-left transition-colors truncate border-none cursor-pointer ${
                        selectedPaymentMethod === method ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-bg-card-hover bg-transparent'
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

      {/* ========== 검색바 (항상 표시 — 뱅크샐러드 스타일) ========== */}
      <div className="flex items-center gap-2 bg-bg-card rounded-[12px] px-3.5 py-2.5 mx-1 mb-2">
        <span className="text-text-tertiary text-[13px] flex-shrink-0">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="거래처 및 메모 내용을 입력하세요"
          className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-tertiary"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="bg-transparent border-none cursor-pointer text-text-tertiary hover:text-text-primary text-[12px] transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* ========== 필터 칩 (내역/메모/태그 + 결제수단) ========== */}
      <div className="flex items-center gap-1.5 px-2 pb-2">
        <button
          type="button"
          className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-bg-elevated text-text-secondary border-none cursor-pointer"
        >
          내역/메모/태그
        </button>
        {paymentMethods.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPaymentFilter(!showPaymentFilter)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full border-none cursor-pointer transition-colors ${
                isFilterActive ? 'bg-accent/15 text-accent' : 'bg-bg-elevated text-text-secondary'
              }`}
            >
              결제수단 {isFilterActive && '✓'}
            </button>
          </div>
        )}
        {/* 활성 필터 표시 */}
        {typeFilter !== 'all' && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium bg-accent/10 text-accent">
            {typeFilter}
            <button type="button" onClick={() => setTypeFilter('all')} className="hover:text-text-primary ml-0.5 bg-transparent border-none cursor-pointer text-accent">✕</button>
          </span>
        )}
        {isFilterActive && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium bg-accent/10 text-accent">
            💳 {selectedPaymentMethod}
            <button type="button" onClick={() => setSelectedPaymentMethod(null)} className="hover:text-text-primary ml-0.5 bg-transparent border-none cursor-pointer text-accent">✕</button>
          </span>
        )}
        {searchQuery && (
          <span className="text-[11px] text-text-secondary ml-auto">
            검색결과 <span className="font-semibold text-accent">{filteredTransactions.length}</span>건
          </span>
        )}
      </div>

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
                <div>
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

      {/* FAB — 뱅크샐러드 스타일 원형 초록 + 버튼 (IMG_1501 우하단) */}
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
