// 홈 대시보드 — 예산 소진율 + 최근 거래 미리보기
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  ProgressBar,
  Badge,
  EmptyState,
  CategoryIcon,
  TransactionListItem,
} from '../components/ui';
import { TransactionFormSheet } from '../components/ui/TransactionFormSheet';
import { useMonthNavigation, useBudgetComparison, useMonthlySummary, useFilteredTransactions } from '../hooks';
import { useTransactionStore } from '../store';
import { TOTAL_MONTHLY_BUDGET } from '../constants';
import { formatKRW, formatNumber } from '../utils/currency';
import { formatMonthLabel, shiftMonth, getCurrentMonthKey } from '../utils/date';
import type { Transaction } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const { currentMonth, setMonth, canGoNext } = useMonthNavigation();

  // 거래 CRUD 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const budgetComparisons = useBudgetComparison(currentMonth);
  const { totalIncome, totalExpense } = useMonthlySummary(currentMonth);
  const prevMonthKey = shiftMonth(currentMonth, -1);
  const { totalExpense: prevMonthExpense } = useMonthlySummary(prevMonthKey);

  // 월 네비게이션
  const prevMonth = shiftMonth(currentMonth, -1);
  const nextMonth = shiftMonth(currentMonth, 1);
  const effectiveMax = canGoNext ? undefined : currentMonth;
  const canGoNextMonth = !effectiveMax || nextMonth <= effectiveMax;
  const isCurrentMonth = currentMonth === getCurrentMonthKey();

  // 지난달 대비 차이 계산
  const expenseDiff = isCurrentMonth && prevMonthExpense > 0
    ? prevMonthExpense - totalExpense
    : null;

  // 최근 거래 5건
  const recentTransactions = useFilteredTransactions({ monthKey: currentMonth }).slice(0, 5);

  // 전체 예산 소진율
  const totalBudget = TOTAL_MONTHLY_BUDGET;
  const totalRatio = totalBudget > 0 ? totalExpense / totalBudget : 0;
  const hasTransactions = recentTransactions.length > 0;

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      {/* ========== 헤더: 홈 + 설정 ========== */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-xl font-bold text-text-primary">홈</h1>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="text-text-secondary hover:text-text-primary transition-colors text-xl bg-transparent border-none cursor-pointer"
          aria-label="설정"
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

      {/* ========== 지난달 비교 배너 ========== */}
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

      {/* ========== 이번 달 예산 요약 ========== */}
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary mb-1">이번 달 예산</p>
              <p className="text-xl font-bold text-text-primary">{formatNumber(totalExpense)}원 <span className="text-sm font-normal text-text-tertiary">/ {formatKRW(totalBudget)}</span></p>
            </div>
            {totalRatio > 1 && <Badge text="초과" color="red" />}
          </div>
          <ProgressBar value={totalExpense} max={totalBudget} size="md" showLabel />
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors self-end"
          >
            설정하기 ›
          </button>
        </div>
      </Card>

      {/* ========== 카테고리별 예산 소진율 ========== */}
      <div>
        <div className="flex justify-between items-center px-1 mb-3">
          <h2 className="text-[15px] font-semibold text-text-primary">카테고리별 예산</h2>
          <button
            className="text-[13px] text-text-tertiary hover:text-text-secondary transition-colors bg-transparent border-none cursor-pointer"
            onClick={() => navigate('/stats')}
          >
            더보기 ›
          </button>
        </div>
        <Card className="!p-0">
          <div className="divide-y divide-border-primary/40">
            {budgetComparisons.map((item) => (
              <div
                key={item.category}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-bg-card-hover transition-colors first:rounded-t-[16px] last:rounded-b-[16px]"
                onClick={() => navigate(`/category/${encodeURIComponent(item.category)}`)}
              >
                <CategoryIcon category={item.category} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-text-primary">
                        {item.category}
                      </span>
                      {item.ratio > 1 && <Badge text="초과" color="red" />}
                    </div>
                    <span className="text-xs text-text-secondary whitespace-nowrap">
                      {formatKRW(item.spent)}
                      <span className="text-text-tertiary"> / {formatKRW(item.budget)}</span>
                    </span>
                  </div>
                  <ProgressBar value={item.spent} max={item.budget} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ========== 최근 거래 ========== */}
      <div>
        <div className="flex justify-between items-center px-1 mb-3">
          <h2 className="text-[15px] font-semibold text-text-primary">최근 거래</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-[13px] text-accent cursor-pointer hover:text-accent-hover transition-colors bg-transparent border-none font-medium"
            >
              + 추가
            </button>
            <button
              className="text-[13px] text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors bg-transparent border-none"
              onClick={() => navigate('/transactions')}
            >
              더보기 ›
            </button>
          </div>
        </div>

        {hasTransactions ? (
          <div className="px-1">
            {recentTransactions.map((tx) => (
              <TransactionListItem
                key={tx.id}
                transaction={tx}
                onClick={() => setEditingTx(tx)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📊"
            title="거래 내역이 없습니다"
            description="뱅크샐러드 엑셀 파일을 import해주세요"
            actionLabel="설정으로 이동"
            onAction={() => navigate('/settings')}
          />
        )}
      </div>

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
