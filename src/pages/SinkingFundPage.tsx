// 싱킹펀드 페이지 — 연간 지출 항목별 적립 추적 대시보드
import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  ProgressBar,
  NumberInput,
  BottomSheet,
  ConfirmDialog,
} from '../components/ui';
import { useSinkingFundStore } from '../store';
import { formatKRW, formatPercent } from '../utils/currency';
import { calcDday } from '../utils/date';
import type { SinkingFundItem } from '../types';

/** D-day 텍스트 포맷: 양수 "D-N", 0 "D-Day", 음수 "D+N" */
function formatDday(dday: number): string {
  if (dday > 0) return `D-${dday}`;
  if (dday === 0) return 'D-Day';
  return `D+${Math.abs(dday)}`;
}

/** D-day Badge 색상 결정 */
function getDdayColor(dday: number | null): 'red' | 'yellow' | 'green' | 'gray' {
  if (dday === null) return 'gray';
  if (dday <= 0) return 'red';
  if (dday <= 30) return 'yellow';
  return 'green';
}

export default function SinkingFundPage() {
  // --- 스토어 ---
  const funds = useSinkingFundStore((s) => s.funds);
  const updateFund = useSinkingFundStore((s) => s.updateFund);
  const resetFund = useSinkingFundStore((s) => s.resetFund);

  // --- 로컬 상태 ---
  const [editingFund, setEditingFund] = useState<SinkingFundItem | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [resetTarget, setResetTarget] = useState<SinkingFundItem | null>(null);

  // --- 전체 합계 ---
  const totalCurrent = funds.reduce((sum, f) => sum + f.currentAmount, 0);
  const totalTarget = funds.reduce((sum, f) => sum + f.annualTarget, 0);
  const totalMonthly = funds.reduce((sum, f) => sum + f.monthlyContribution, 0);

  /** 적립액 수정 시트 열기 */
  const handleOpenEdit = useCallback((fund: SinkingFundItem) => {
    setEditingFund(fund);
    setEditAmount(fund.currentAmount);
  }, []);

  /** 자동 계산: 월 적립액 x 올해 경과 월수 */
  const handleAutoCalc = useCallback(() => {
    if (!editingFund) return;
    const now = new Date();
    const elapsedMonths = now.getMonth(); // 0-based (1월=0 → 0개월 경과... 실제로는 현재 월까지 적립)
    // 1월부터 적립 시작이므로 현재 월수 = getMonth() (0-based)
    // 3월이면 getMonth()=2 → 1월, 2월 적립 완료 = 2개월분
    // 현재 월 포함 시 getMonth()+1 사용 가능. 여기서는 경과 완료 월수 사용.
    const autoAmount = editingFund.monthlyContribution * elapsedMonths;
    setEditAmount(autoAmount);
  }, [editingFund]);

  /** 적립액 저장 */
  const handleSaveAmount = useCallback(() => {
    if (!editingFund) return;
    updateFund(editingFund.id, { currentAmount: editAmount });
    setEditingFund(null);
  }, [editingFund, editAmount, updateFund]);

  /** 리셋 확정 */
  const handleConfirmReset = useCallback(() => {
    if (!resetTarget) return;
    resetFund(resetTarget.id);
    setResetTarget(null);
  }, [resetTarget, resetFund]);

  return (
    <div className="pb-28 space-y-6">
      {/* 헤더 */}
      <h1 className="text-xl font-bold text-text-primary pt-2">싱킹펀드</h1>

      {/* ========== 전체 요약 카드 ========== */}
      <Card>
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-text-secondary">총 적립</span>
            <div className="text-right">
              <span className="text-lg font-bold text-text-primary">
                {formatKRW(totalCurrent)}
              </span>
              <span className="text-sm text-text-tertiary">
                {' '}
                / {formatKRW(totalTarget)}
              </span>
            </div>
          </div>
          <ProgressBar value={totalCurrent} max={totalTarget} size="lg" />
          <p className="text-xs text-text-tertiary">
            월 적립: {formatKRW(totalMonthly)}
          </p>
        </div>
      </Card>

      {/* ========== 개별 항목 카드 ========== */}
      <div className="space-y-3">
        {funds.map((fund) => {
          const dday = calcDday(fund.dueMonth);
          const ratio =
            fund.annualTarget > 0
              ? fund.currentAmount / fund.annualTarget
              : 0;

          return (
            <Card key={fund.id} className="space-y-3">
              {/* 상단: 이모지 + 이름 + D-day 뱃지 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{fund.emoji}</span>
                  <span className="text-base font-semibold text-text-primary">
                    {fund.name}
                  </span>
                </div>
                <Badge
                  text={
                    dday !== null ? formatDday(dday) : fund.dueDescription
                  }
                  color={getDdayColor(dday)}
                />
              </div>

              {/* 프로그레스 바 */}
              <ProgressBar
                value={fund.currentAmount}
                max={fund.annualTarget}
                size="md"
              />

              {/* 금액 텍스트 */}
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-text-primary">
                  {formatKRW(fund.currentAmount)}{' '}
                  <span className="text-text-tertiary">
                    / {formatKRW(fund.annualTarget)}
                  </span>
                </span>
                <span className="text-sm font-medium text-accent">
                  {formatPercent(ratio)}
                </span>
              </div>

              {/* 월 적립 서브텍스트 */}
              <p className="text-xs text-text-tertiary">
                월 {formatKRW(fund.monthlyContribution)} 적립
              </p>

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenEdit(fund)}
                >
                  적립액 수정
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setResetTarget(fund)}
                >
                  리셋
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ========== 적립액 수정 BottomSheet ========== */}
      <BottomSheet
        isOpen={editingFund !== null}
        onClose={() => setEditingFund(null)}
        title="적립액 수정"
      >
        {editingFund && (
          <div className="space-y-5">
            {/* 항목명 */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{editingFund.emoji}</span>
              <span className="text-base font-semibold text-text-primary">
                {editingFund.name}
              </span>
            </div>

            {/* 현재 적립액 입력 */}
            <div className="space-y-2">
              <label className="text-sm text-text-secondary">
                현재 적립액
              </label>
              <NumberInput
                value={editAmount}
                onChange={setEditAmount}
                suffix="원"
              />
            </div>

            {/* 자동 계산 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAutoCalc}
              className="w-full text-center"
            >
              자동 계산 (월 {formatKRW(editingFund.monthlyContribution)} x
              경과 월수)
            </Button>

            {/* 저장 버튼 */}
            <Button variant="primary" fullWidth onClick={handleSaveAmount}>
              저장
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* ========== 리셋 확인 다이얼로그 ========== */}
      <ConfirmDialog
        isOpen={resetTarget !== null}
        title="싱킹펀드 리셋"
        message={
          resetTarget
            ? `"${resetTarget.name}"의 적립액과 납부 기록을 모두 초기화합니다. 계속하시겠습니까?`
            : ''
        }
        confirmLabel="리셋"
        onConfirm={handleConfirmReset}
        onCancel={() => setResetTarget(null)}
        variant="danger"
      />
    </div>
  );
}
