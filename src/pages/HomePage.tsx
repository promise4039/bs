// 홈 대시보드 — 뱅크샐러드 스타일 예산 소진율 + 최근 거래 미리보기
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
    <div className="flex flex-col gap-5 pb-6 animate-fade-in">
      {/* ========== 헤더: 홈 + 설정 ========== */}
      <div className="flex items-center justify-between pt-2 px-1">
        <h1 className="text-[22px] font-bold text-text-primary tracking-tight">홈</h1>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-elevated transition-colors bg-transparent border-none cursor-pointer"
          aria-label="설정"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* ========== 월 네비게이터 + 지출/수입 총계 ========== */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
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
        <div className="text-right flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-[11px] text-text-tertiary">지출</span>
            <span className="text-[18px] font-bold text-text-primary tabular-nums">
              {formatNumber(totalExpense)}
              <span className="text-[13px] font-medium text-text-secondary ml-0.5">원</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-[11px] text-text-tertiary">수입</span>
            <span className="text-[14px] font-semibold text-income tabular-nums">
              +{formatNumber(totalIncome)}
              <span className="text-[11px] font-medium ml-0.5">원</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========== 지난달 비교 배너 ========== */}
      {expenseDiff !== null && (
        <div className="flex items-center justify-between bg-bg-card rounded-[14px] px-4 py-3.5 mx-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[18px]">{expenseDiff > 0 ? '😊' : '😰'}</span>
            <span className="text-[13px] text-text-primary leading-snug">
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
            className="text-[12px] text-text-tertiary bg-bg-elevated px-3 py-1.5 rounded-lg hover:bg-bg-card-hover transition-colors font-medium border-none cursor-pointer"
          >
            분석
          </button>
        </div>
      )}

      {/* ========== 이번 달 예산 요약 ========== */}
      <Card>
        <div className="flex flex-col gap-3.5">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-text-tertiary font-medium">이번 달 예산</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[22px] font-bold text-text-primary tabular-nums">
                  {formatNumber(totalExpense)}
                  <span className="text-[13px] font-normal text-text-secondary">원</span>
                </span>
                <span className="text-[12px] text-text-tertiary">
                  / {formatKRW(totalBudget)}
                </span>
              </div>
            </div>
            {totalRatio > 1 && <Badge text="초과" color="red" />}
          </div>
          <ProgressBar value={totalExpense} max={totalBudget} size="md" showLabel />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="text-[12px] text-text-tertiary hover:text-text-secondary transition-colors font-medium bg-transparent border-none cursor-pointer"
            >
              설정하기 ›
            </button>
          </div>
        </div>
      </Card>

      {/* ========== 카테고리별 예산 소진율 ========== */}
      <div>
        <div className="flex justify-between items-center px-1 mb-3">
          <h2 className="text-[15px] font-bold text-text-primary">카테고리별 예산</h2>
          <button
            className="text-[12px] text-text-tertiary hover:text-text-secondary transition-colors bg-transparent border-none cursor-pointer font-medium"
            onClick={() => navigate('/stats')}
          >
            더보기 ›
          </button>
        </div>
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-border-primary/30">
            {budgetComparisons.map((item) => (
              <button
                key={item.category}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-bg-card-hover transition-colors first:rounded-t-[16px] last:rounded-b-[16px] bg-transparent border-none text-left"
                onClick={() => navigate(`/category/${encodeURIComponent(item.category)}`)}
              >
                <CategoryIcon category={item.category} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-text-primary">
                        {item.category}
                      </span>
                      {item.ratio > 1 && <Badge text="초과" color="red" />}
                    </div>
                    <div className="flex items-baseline gap-0.5 tabular-nums">
                      <span className="text-[13px] font-semibold text-text-primary">
                        {formatKRW(item.spent)}
                      </span>
                      <span className="text-[11px] text-text-tertiary">
                        / {formatKRW(item.budget)}
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={item.spent} max={item.budget} size="sm" />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ========== 최근 거래 ========== */}
      <div>
        <div className="flex justify-between items-center px-1 mb-3">
          <h2 className="text-[15px] font-bold text-text-primary">최근 거래</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-[12px] text-accent cursor-pointer hover:text-accent-hover transition-colors bg-transparent border-none font-bold"
            >
              + 추가
            </button>
            <button
              className="text-[12px] text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors bg-transparent border-none font-medium"
              onClick={() => navigate('/transactions')}
            >
              더보기 ›
            </button>
          </div>
        </div>

        {hasTransactions ? (
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-border-primary/20">
              {recentTransactions.map((tx) => (
                <TransactionListItem
                  key={tx.id}
                  transaction={tx}
                  onClick={() => setEditingTx(tx)}
                />
              ))}
            </div>
          </Card>
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
