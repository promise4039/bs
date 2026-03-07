// 가계부 내역 페이지 — 날짜별 그룹 거래 리스트
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MonthNavigator,
  ToggleGroup,
  DateDivider,
  TransactionListItem,
  EmptyState,
} from '../components/ui';
import { TransactionFormSheet } from '../components/ui/TransactionFormSheet';
import { useMonthNavigation, useMonthlySummary, useFilteredTransactions } from '../hooks';
import { useTransactionStore } from '../store';
import type { Transaction, TransactionType } from '../types';
import { formatNumber } from '../utils/currency';

type TypeFilter = 'all' | '수입' | '지출';

const TOGGLE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '수입', value: '수입' },
  { label: '지출', value: '지출' },
];

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { currentMonth, setMonth } = useMonthNavigation();
  const { totalIncome, totalExpense } = useMonthlySummary(currentMonth);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  // 검색/필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'content' | 'tag'>('content');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 결제수단 필터 상태
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showPaymentFilter, setShowPaymentFilter] = useState(false);

  // 거래 CRUD 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);

  // 태그 추출용: 검색 필터 없이 월/타입만 적용한 거래 목록
  const allMonthTransactions = useFilteredTransactions({
    monthKey: currentMonth,
    type: typeFilter !== 'all' ? (typeFilter as TransactionType) : undefined,
  });

  // 필터링된 거래 목록 (검색 쿼리 + 결제수단 필터 적용)
  const filteredTransactions = useFilteredTransactions({
    monthKey: currentMonth,
    type: typeFilter !== 'all' ? (typeFilter as TransactionType) : undefined,
    searchQuery: searchMode === 'content'
      ? searchQuery || undefined
      : selectedTag ? `#${selectedTag}` : undefined,
    paymentMethod: selectedPaymentMethod || undefined,
  });

  // 결제수단 목록 추출
  const paymentMethods = useMemo(() => {
    const methods = new Set<string>();
    for (const tx of allMonthTransactions) {
      if (tx.paymentMethod) methods.add(tx.paymentMethod);
    }
    return Array.from(methods).sort();
  }, [allMonthTransactions]);

  // 메모에서 해시태그 추출
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const tx of allMonthTransactions) {
      if (tx.memo) {
        const matches = tx.memo.match(/#[\w가-힣]+/g);
        if (matches) matches.forEach((t) => tags.add(t.slice(1)));
      }
    }
    return Array.from(tags).sort();
  }, [allMonthTransactions]);

  // 검색 활성 여부
  const isSearchActive = searchMode === 'content' ? searchQuery.length > 0 : selectedTag !== null;
  const isFilterActive = selectedPaymentMethod !== null;

  // 날짜별 그룹핑 (날짜 내림차순)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filteredTransactions) {
      const existing = map.get(tx.date);
      if (existing) {
        existing.push(tx);
      } else {
        map.set(tx.date, [tx]);
      }
    }
    // Map은 삽입 순서를 유지하고, filteredTransactions가 이미 날짜 내림차순이므로
    // 그대로 사용하면 된다
    return map;
  }, [filteredTransactions]);

  // 각 날짜별 수입/지출 합계 계산
  const dateSummaries = useMemo(() => {
    const summaries = new Map<string, { income: number; expense: number }>();
    for (const [date, txns] of groupedByDate) {
      let income = 0;
      let expense = 0;
      for (const tx of txns) {
        if (tx.type === '수입') {
          income += tx.amount;
        } else {
          expense += tx.amount;
        }
      }
      summaries.set(date, { income, expense });
    }
    return summaries;
  }, [groupedByDate]);

  const hasTransactions = filteredTransactions.length > 0;

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      {/* 헤더: 가계부 + 카테고리 관리 + 총 지출 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">가계부</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/categories')}
            className="text-text-tertiary hover:text-accent text-sm bg-transparent border-none cursor-pointer transition-colors"
            title="카테고리 관리"
          >
            ⚙️
          </button>
          <span className="text-lg font-bold text-text-primary">
            {formatNumber(totalExpense)}원
          </span>
        </div>
      </div>

      {/* 월 네비게이터 */}
      <MonthNavigator monthKey={currentMonth} onChange={setMonth} />

      {/* 월 요약 바 */}
      <div className="flex items-center justify-center gap-4 py-2.5 px-4 bg-bg-card rounded-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-secondary">수입</span>
          <span className="text-sm font-semibold text-income">
            +{formatNumber(totalIncome)}원
          </span>
        </div>
        <div className="w-px h-4 bg-border-primary" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-secondary">지출</span>
          <span className="text-sm font-semibold text-text-primary">
            -{formatNumber(totalExpense)}원
          </span>
        </div>
      </div>

      {/* 목록 | 달력 + 타입 필터 토글 */}
      <div className="flex items-center justify-between">
        <ToggleGroup
          options={TOGGLE_OPTIONS}
          selected={typeFilter}
          onChange={(val) => setTypeFilter(val as TypeFilter)}
        />
        <div className="flex items-center bg-bg-card rounded-lg overflow-hidden">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-accent/15 text-accent"
          >
            <span className="text-[11px]">☰</span>
            <span>목록</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <span className="text-[11px]">📅</span>
            <span>달력</span>
          </button>
        </div>
      </div>

      {/* 검색/필터 바 */}
      <div className="flex flex-col gap-2.5">
        {/* 검색 입력 + 모드 토글 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 bg-bg-card rounded-[12px] px-4 py-3">
            <span className="text-text-tertiary text-base flex-shrink-0">🔍</span>
            {searchMode === 'content' ? (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="거래처 및 메모 내용을 입력하세요"
                className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-tertiary"
              />
            ) : (
              <span className="flex-1 text-sm text-text-tertiary">
                {selectedTag ? `#${selectedTag}` : '태그를 선택하세요'}
              </span>
            )}
            {/* 검색 초기화 버튼 */}
            {isSearchActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                }}
                className="bg-transparent border-none cursor-pointer text-text-tertiary hover:text-text-primary text-sm transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          {/* 모드 토글: 내역·메모 | 태그 */}
          <div className="flex items-center bg-bg-card rounded-[10px] overflow-hidden flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setSearchMode('content');
                setSelectedTag(null);
              }}
              className={`px-3 py-2 text-xs font-medium border-none cursor-pointer transition-colors ${
                searchMode === 'content'
                  ? 'bg-accent/15 text-accent'
                  : 'bg-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              내역·메모
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode('tag');
                setSearchQuery('');
              }}
              className={`px-3 py-2 text-xs font-medium border-none cursor-pointer transition-colors ${
                searchMode === 'tag'
                  ? 'bg-accent/15 text-accent'
                  : 'bg-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              태그
            </button>
          </div>
        </div>

        {/* 태그 모드: 태그 칩 목록 */}
        {searchMode === 'tag' && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border cursor-pointer transition-colors ${
                  selectedTag === tag
                    ? 'bg-accent/15 text-accent border-accent'
                    : 'bg-bg-elevated text-text-secondary border-transparent hover:border-border-primary'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        {searchMode === 'tag' && allTags.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-2">
            이 달의 메모에 해시태그가 없습니다
          </p>
        )}

        {/* 결제수단 필터 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPaymentFilter(!showPaymentFilter)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border cursor-pointer transition-colors flex items-center gap-1.5 ${
              isFilterActive
                ? 'bg-accent/15 text-accent border-accent'
                : 'bg-bg-card text-text-secondary border-transparent hover:border-border-primary'
            }`}
          >
            <span>💳</span>
            <span>{selectedPaymentMethod ?? '결제수단'}</span>
            {isFilterActive && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPaymentMethod(null);
                }}
                className="ml-0.5 hover:text-text-primary"
              >
                ✕
              </span>
            )}
          </button>
        </div>

        {/* 결제수단 칩 목록 */}
        {showPaymentFilter && paymentMethods.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setSelectedPaymentMethod(
                    selectedPaymentMethod === method ? null : method
                  );
                  setShowPaymentFilter(false);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border cursor-pointer transition-colors ${
                  selectedPaymentMethod === method
                    ? 'bg-accent/15 text-accent border-accent'
                    : 'bg-bg-elevated text-text-secondary border-transparent hover:border-border-primary'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        )}
        {showPaymentFilter && paymentMethods.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-2">
            이 달의 결제수단 정보가 없습니다
          </p>
        )}

        {/* 검색/필터 결과 건수 */}
        {(isSearchActive || isFilterActive) && (
          <p className="text-xs text-text-secondary">
            검색결과 <span className="font-semibold text-accent">{filteredTransactions.length}</span>건
          </p>
        )}
      </div>

      {/* 날짜별 거래 리스트 */}
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
                <div className="bg-bg-card rounded-[12px] px-3">
                  {txns.map((tx) => (
                    <TransactionListItem
                      key={tx.id}
                      transaction={tx}
                      onClick={() => setEditingTx(tx)}
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

      {/* 거래 추가 FAB 버튼 */}
      <button
        type="button"
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-accent text-white text-2xl font-bold shadow-lg hover:bg-accent-hover transition-colors flex items-center justify-center"
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
        onDelete={(id) => {
          deleteTransaction(id);
          setEditingTx(null);
        }}
      />
    </div>
  );
}
