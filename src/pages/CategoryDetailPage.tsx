// 카테고리 상세 페이지 — 예산 대비 현황 + 소분류 분해 + 거래 내역
import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  ProgressBar,
  Badge,
  AmountText,
  EmptyState,
  SectionHeader,
  CategoryIcon,
  TransactionListItem,
  DateDivider,
  MonthNavigator,
} from '../components/ui';
import {
  useMonthNavigation,
  useMonthlySummary,
  useBudgetComparison,
  useFilteredTransactions,
} from '../hooks';
import { formatKRW } from '../utils/currency';

export default function CategoryDetailPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { currentMonth, setMonth, canGoNext } = useMonthNavigation();

  // URL 디코딩
  const decodedCategory = decodeURIComponent(categoryName ?? '');

  // 해당 카테고리의 거래 필터링
  const transactions = useFilteredTransactions({
    monthKey: currentMonth,
    category: decodedCategory,
  });

  // 예산 비교 데이터
  const budgetComparisons = useBudgetComparison(currentMonth);
  const budgetData = budgetComparisons.find((b) => b.category === decodedCategory);

  // 월간 요약에서 해당 카테고리의 소분류 데이터
  const summary = useMonthlySummary(currentMonth);
  const categorySummary = summary.expenseByCategory.find(
    (c) => c.category === decodedCategory,
  ) ?? summary.incomeByCategory.find(
    (c) => c.category === decodedCategory,
  );

  // 소분류 데이터
  const subcategories = categorySummary?.subcategories ?? [];
  const categoryTotal = categorySummary?.totalAmount ?? 0;

  // 날짜별 거래 그룹핑
  const groupedTransactions = useMemo(() => {
    const groups = new Map<
      string,
      { income: number; expense: number; transactions: typeof transactions }
    >();

    for (const tx of transactions) {
      const existing = groups.get(tx.date);
      if (existing) {
        if (tx.type === '수입') {
          existing.income += tx.amount;
        } else {
          existing.expense += tx.amount;
        }
        existing.transactions.push(tx);
      } else {
        groups.set(tx.date, {
          income: tx.type === '수입' ? tx.amount : 0,
          expense: tx.type === '지출' ? tx.amount : 0,
          transactions: [tx],
        });
      }
    }

    // 날짜 내림차순 정렬
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({ date, ...data }));
  }, [transactions]);

  // 예산 관련 계산
  const budget = budgetData?.budget ?? 0;
  const spent = budgetData?.spent ?? 0;
  const remaining = budgetData?.remaining ?? 0;
  const ratio = budgetData?.ratio ?? 0;
  const isOverBudget = remaining < 0;

  return (
    <div className="pb-28 space-y-5">
      {/* 헤더: 뒤로가기 + 카테고리명 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer text-lg"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-text-primary">{decodedCategory}</h1>
      </div>

      {/* 월 네비게이터 */}
      <MonthNavigator
        monthKey={currentMonth}
        onChange={setMonth}
        maxMonth={canGoNext ? undefined : currentMonth}
      />

      {/* 요약 카드 */}
      <Card className="space-y-4">
        {/* 카테고리 아이콘 + 이름 */}
        <div className="flex items-center gap-3">
          <CategoryIcon category={decodedCategory} size="lg" />
          <div className="flex flex-col">
            <span className="text-base font-semibold text-text-primary">
              {decodedCategory}
            </span>
            <span className="text-xs text-text-tertiary">
              {categorySummary?.transactionCount ?? 0}건 거래
            </span>
          </div>
        </div>

        {/* 사용액 / 예산액 */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-tertiary">사용</span>
            <AmountText amount={spent} type="expense" size="lg" />
          </div>
          {budget > 0 && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-text-tertiary">예산</span>
              <AmountText amount={budget} type="neutral" size="md" />
            </div>
          )}
        </div>

        {/* 프로그레스 바 */}
        {budget > 0 && (
          <ProgressBar value={spent} max={budget} size="md" showLabel />
        )}

        {/* 잔여액 또는 초과 Badge */}
        {budget > 0 && (
          <div className="flex justify-end">
            {isOverBudget ? (
              <Badge
                text={`${formatKRW(Math.abs(remaining))} 초과`}
                color="red"
              />
            ) : (
              <Badge
                text={`${formatKRW(remaining)} 남음`}
                color={ratio >= 0.7 ? 'yellow' : 'green'}
              />
            )}
          </div>
        )}
      </Card>

      {/* 소분류별 분해 */}
      {subcategories.length > 0 && (
        <section>
          <SectionHeader title="소분류별" />
          <Card className="space-y-1">
            {subcategories.map((sub) => {
              return (
                <div
                  key={sub.name}
                  className="flex items-center gap-3 py-2.5 px-1"
                >
                  {/* 소분류명 + 건수 */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-sm text-text-primary truncate">
                      {sub.name}
                    </span>
                    <span className="text-xs text-text-tertiary shrink-0">
                      {sub.count}건
                    </span>
                  </div>

                  {/* 금액 */}
                  <span className="text-sm font-medium text-text-primary shrink-0 mr-2">
                    {formatKRW(sub.amount)}
                  </span>

                  {/* 미니 프로그레스 바 (해당 소분류 / 카테고리 전체 비중) */}
                  <div className="w-16 shrink-0">
                    <ProgressBar value={sub.amount} max={categoryTotal} size="sm" />
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
      )}

      {/* 거래 내역 */}
      <section>
        <SectionHeader title="거래 내역" />

        {groupedTransactions.length === 0 ? (
          <EmptyState
            icon="📭"
            title="거래 내역이 없습니다"
            description="이 카테고리에 해당하는 거래가 없습니다."
          />
        ) : (
          <Card className="space-y-0">
            {groupedTransactions.map((group) => (
              <div key={group.date}>
                <DateDivider
                  date={group.date}
                  income={group.income}
                  expense={group.expense}
                />
                {group.transactions.map((tx) => (
                  <TransactionListItem key={tx.id} transaction={tx} />
                ))}
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
