// 홈 대시보드 — 예산 소진율 + 최근 거래 미리보기
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  ProgressBar,
  Badge,
  EmptyState,
  SectionHeader,
  CategoryIcon,
  TransactionListItem,
  MonthNavigator,
} from '../components/ui';
import { TransactionFormSheet } from '../components/ui/TransactionFormSheet';
import { useMonthNavigation, useBudgetComparison, useMonthlySummary, useFilteredTransactions } from '../hooks';
import { useTransactionStore } from '../store';
import { TOTAL_MONTHLY_BUDGET } from '../constants';
import { formatKRW, formatNumber } from '../utils/currency';
import { shiftMonth } from '../utils/date';
import type { Transaction } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const { currentMonth, setMonth } = useMonthNavigation();

  // 거래 CRUD 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const budgetComparisons = useBudgetComparison(currentMonth);
  const { totalExpense } = useMonthlySummary(currentMonth);
  const prevMonthKey = shiftMonth(currentMonth, -1);
  const { totalExpense: prevMonthExpense } = useMonthlySummary(prevMonthKey);

  // 지난달 대비 차이 계산
  const expenseDiff = totalExpense - prevMonthExpense;
  const diffText = expenseDiff > 0
    ? `지난달 이때보다 ${formatNumber(expenseDiff)}원 더 쓰는 중`
    : expenseDiff < 0
    ? `지난달 이때보다 ${formatNumber(Math.abs(expenseDiff))}원 덜 쓰는 중`
    : '';

  // 최근 거래 5건
  const recentTransactions = useFilteredTransactions({ monthKey: currentMonth }).slice(0, 5);

  // 전체 예산 소진율
  const totalBudget = TOTAL_MONTHLY_BUDGET;
  const totalRatio = totalBudget > 0 ? totalExpense / totalBudget : 0;
  const hasTransactions = recentTransactions.length > 0;

  return (
    <div className="flex flex-col gap-5 pb-4 animate-fade-in">
      {/* 헤더: 타이틀 + 지출액 + 설정 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">홈</h1>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-text-primary">
            {formatNumber(totalExpense)}원
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="text-text-secondary hover:text-text-primary transition-colors text-xl bg-transparent border-none cursor-pointer"
            aria-label="설정"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* 월 네비게이터 */}
      <MonthNavigator monthKey={currentMonth} onChange={setMonth} />

      {/* 지난달 비교 배너 */}
      {diffText && (
        <div className={`rounded-[12px] px-4 py-3 text-sm font-medium ${
          expenseDiff > 0
            ? 'bg-progress-warning/10 text-progress-warning'
            : 'bg-income/10 text-income'
        }`}>
          {diffText}
        </div>
      )}

      {/* 이번 달 지출 요약 카드 */}
      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-text-secondary mb-1">이번 달 지출</p>
            <p className="text-2xl font-bold text-text-primary">{formatNumber(totalExpense)}원</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">예산</span>
            <span className="text-xs text-text-secondary">{formatKRW(totalBudget)}</span>
            {totalRatio > 1 && (
              <Badge text="초과" color="red" />
            )}
          </div>
          <ProgressBar value={totalExpense} max={totalBudget} size="lg" showLabel />
        </div>
      </Card>

      {/* 카테고리별 예산 소진율 리스트 */}
      <div>
        <SectionHeader title="카테고리별 예산" />
        <Card className="!p-0">
          <div className="divide-y divide-border-primary">
            {budgetComparisons.map((item) => (
              <div
                key={item.category}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-card-hover transition-colors first:rounded-t-[16px] last:rounded-b-[16px]"
                onClick={() => navigate(`/category/${encodeURIComponent(item.category)}`)}
              >
                {/* 카테고리 아이콘 */}
                <CategoryIcon category={item.category} size="sm" />

                {/* 카테고리 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {item.category}
                      </span>
                      {item.ratio > 1 && (
                        <Badge text="초과" color="red" />
                      )}
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

      {/* 최근 거래 */}
      <div>
        <div className="flex justify-between items-center px-1 mb-3">
          <h2 className="text-base font-semibold text-text-primary">최근 거래</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-sm text-accent cursor-pointer hover:text-accent-hover transition-colors bg-transparent border-none font-medium"
              aria-label="거래 추가"
            >
              + 추가
            </button>
            <button
              className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors bg-transparent border-none"
              onClick={() => navigate('/transactions')}
            >
              더보기
            </button>
          </div>
        </div>

        {hasTransactions ? (
          <Card className="!p-2">
            {recentTransactions.map((tx) => (
              <TransactionListItem
                key={tx.id}
                transaction={tx}
                onClick={() => setEditingTx(tx)}
              />
            ))}
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
