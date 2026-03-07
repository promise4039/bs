import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, SectionHeader, TransactionListItem, DateDivider, EmptyState } from '../components/ui';
import { AssetFormSheet } from '../components/ui/AssetFormSheet';
import { useAssetStore, useTransactionStore } from '../store';
import { formatNumber } from '../utils/currency';
import { ASSET_TYPE_LABELS, ASSET_TYPE_ICONS } from '../types/asset';
import type { Transaction } from '../types';

// 오늘 날짜 기준
const TODAY = new Date('2026-03-08');

/** 두 날짜 사이의 일수 차이 (future - now) */
function diffDays(future: Date, now: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((future.getTime() - now.getTime()) / msPerDay);
}

/** 날짜를 "YYYY.MM.DD" 형태로 포맷 */
function fmtDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** 날짜를 "YYYY-MM-DD" 형태로 포맷 */
function fmtDateDash(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 다음 상환일 계산 */
function getNextRepaymentDate(repaymentDay: number, from: Date): Date {
  const y = from.getFullYear();
  const m = from.getMonth();
  // 이번 달 상환일이 아직 안 지났으면 이번 달, 지났으면 다음 달
  const thisMonth = new Date(y, m, repaymentDay);
  if (thisMonth > from) return thisMonth;
  return new Date(y, m + 1, repaymentDay);
}

/** 남은 개월 수 계산 */
function getRemainingMonths(startDate: string, termMonths: number, now: Date): number {
  const start = new Date(startDate);
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + termMonths);
  const diffMs = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
}

/** 상환 스케줄 항목 */
interface ScheduleItem {
  month: number;
  date: Date;
  principalPay: number;
  interest: number;
  total: number;
  remainingAfter: number;
}

/** 전체 상환 스케줄 생성 */
function buildSchedule(
  principal: number,
  ratePercent: number,
  termMonths: number,
  method: 'equal_principal' | 'equal_payment' | 'bullet',
  startDate: string,
  repaymentDay?: number,
): ScheduleItem[] {
  const monthlyRate = ratePercent / 100 / 12;
  const start = new Date(startDate);
  const schedule: ScheduleItem[] = [];
  let remaining = principal;

  for (let i = 1; i <= termMonths; i++) {
    const interest = Math.round(remaining * monthlyRate);
    let principalPay: number;

    if (method === 'equal_principal') {
      principalPay = Math.round(principal / termMonths);
    } else if (method === 'equal_payment') {
      const factor = Math.pow(1 + monthlyRate, termMonths);
      const totalPayment = Math.round(principal * monthlyRate * factor / (factor - 1));
      principalPay = totalPayment - interest;
    } else {
      principalPay = i === termMonths ? principal : 0;
    }

    if (i === termMonths) principalPay = remaining;
    remaining = Math.max(0, remaining - principalPay);

    const date = new Date(start);
    date.setMonth(date.getMonth() + i);
    if (repaymentDay) date.setDate(repaymentDay);

    schedule.push({ month: i, date, principalPay, interest, total: principalPay + interest, remainingAfter: remaining });
  }

  return schedule;
}

/** 상환 방식 한글 라벨 */
function repaymentMethodLabel(m?: string): string {
  if (m === 'equal_principal') return '원금균등분할상환';
  if (m === 'equal_payment') return '원리금균등상환';
  if (m === 'bullet') return '만기일시상환';
  return '-';
}

// ─── 대출 상세 페이지 (BankSalad 스타일) ─────────────────────────────

function LoanDetailView({
  asset,
  linkedTxns,
  onEdit,
  onDelete,
  onBack,
}: {
  asset: NonNullable<ReturnType<typeof useAssetStore.getState>['assets'][number]>;
  linkedTxns: Transaction[];
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const [expandedUpcoming, setExpandedUpcoming] = useState(false);
  const [showLoanInfo, setShowLoanInfo] = useState(false);

  const principal = asset.loanPrincipal || 0;
  const rate = asset.loanRate || 0;
  const termMonths = asset.loanTermMonths || 0;
  const method = asset.repaymentMethod || 'equal_principal';
  const repaymentDay = asset.repaymentDay || 1;
  const startDateStr = asset.loanStartDate || '2026-02-04';

  const remainingMonths = asset.loanStartDate && asset.loanTermMonths
    ? getRemainingMonths(asset.loanStartDate, asset.loanTermMonths, TODAY)
    : 0;

  // 다음 상환일
  const nextPayDate = getNextRepaymentDate(repaymentDay, TODAY);
  const dDay = diffDays(nextPayDate, TODAY);

  // 전체 스케줄
  const schedule = useMemo(() => {
    if (!principal || !rate || !termMonths) return [];
    return buildSchedule(principal, rate, termMonths, method, startDateStr, repaymentDay);
  }, [principal, rate, termMonths, method, startDateStr, repaymentDay]);

  // 잔액을 스케줄에서 자동 계산 (마지막으로 지난 상환 항목의 remainingAfter)
  const balance = useMemo(() => {
    if (schedule.length === 0) return Math.abs(asset.balance);
    const pastItems = schedule.filter((s) => s.date < TODAY);
    if (pastItems.length === 0) return principal;
    return pastItems[pastItems.length - 1].remainingAfter;
  }, [schedule, principal, asset.balance]);

  const paidPrincipal = principal - balance;
  const progressRatio = principal > 0 ? paidPrincipal / principal : 0;

  // 다음 상환 예정 정보 (스케줄에서 미래 항목 중 가장 가까운 것)
  const upcomingPayment = useMemo(() => {
    return schedule.find((s) => s.date >= TODAY);
  }, [schedule]);

  // 과거 상환 내역 (스케줄 기반 + 실제 거래와 매칭)
  const pastScheduleItems = useMemo(() => {
    return schedule.filter((s) => s.date < TODAY).reverse();
  }, [schedule]);

  // 대출 관련 거래 (대출 상환 거래)
  const loanTxns = useMemo(() => {
    return linkedTxns.filter(
      (tx) => tx.category === '금융' || tx.subcategory === '대출상환' || tx.content?.includes('대출')
    );
  }, [linkedTxns]);

  // 만기일
  const maturityDate = useMemo(() => {
    if (asset.maturityDate) return asset.maturityDate;
    if (asset.loanStartDate && asset.loanTermMonths) {
      const d = new Date(asset.loanStartDate);
      d.setMonth(d.getMonth() + asset.loanTermMonths);
      return fmtDateDash(d);
    }
    return '-';
  }, [asset]);

  return (
    <div className="pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-4">
        <button type="button" onClick={onBack} className="text-text-tertiary hover:text-text-primary bg-transparent border-none cursor-pointer text-lg p-2">
          ←
        </button>
        <h1 className="text-lg font-bold text-text-primary flex-1 text-center">{asset.name}</h1>
        <button type="button" onClick={onEdit} className="text-accent text-sm font-medium bg-transparent border-none cursor-pointer p-2">
          편집
        </button>
      </div>

      {/* ── Section 1: Loan Overview Card ── */}
      <div className="bg-bg-card rounded-[20px] p-5 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
        {/* 소제목 */}
        <p className="text-text-tertiary text-xs mb-1">
          남은 대출금 | {asset.name}
        </p>
        {/* 잔액 */}
        <p className="text-[28px] font-bold text-text-primary tracking-tight mb-3">
          {formatNumber(balance)}원
        </p>
        {/* Pill badges */}
        <div className="flex gap-2 mb-5">
          <span className="inline-flex items-center rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-text-secondary">
            연 {rate}%
          </span>
          <span className="inline-flex items-center rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-text-secondary">
            {remainingMonths}개월 남음
          </span>
        </div>
        {/* Progress bar */}
        <div className="mb-2">
          <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progressRatio * 100, 100)}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-accent">갚은 돈 {formatNumber(paidPrincipal)}원</span>
          <span className="text-text-tertiary">원금 {formatNumber(principal)}원</span>
        </div>
      </div>

      {/* ── Section 2: Repayment Timeline ── */}
      <div className="px-1 mb-6">
        <SectionHeader title="상환 내역" />

        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border-secondary" />

          {/* ─ FUTURE: 다음 상환 예정 ─ */}
          {upcomingPayment && (
            <div className="relative mb-5">
              {/* Red dot */}
              <div className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full bg-expense flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-bg-app" />
              </div>
              {/* Date + D-day badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-text-primary">{fmtDate(nextPayDate)}</span>
                <span className="inline-flex items-center rounded-full bg-expense/15 px-2 py-0.5 text-[10px] font-bold text-expense">
                  D-{dDay}
                </span>
              </div>
              {/* Expandable card */}
              <button
                type="button"
                onClick={() => setExpandedUpcoming(!expandedUpcoming)}
                className="w-full text-left bg-bg-card rounded-[14px] p-4 border border-border-secondary cursor-pointer hover:bg-bg-card-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    상환 예정 {formatNumber(upcomingPayment.total)}원
                  </span>
                  <span className={`text-text-tertiary text-xs transition-transform duration-200 ${expandedUpcoming ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
                {expandedUpcoming && (
                  <div className="mt-3 pt-3 border-t border-border-primary space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-tertiary">이자</span>
                      <span className="text-text-secondary">{formatNumber(upcomingPayment.interest)}원 예상</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-tertiary">원금</span>
                      <span className="text-text-secondary">{formatNumber(upcomingPayment.principalPay)}원 예상</span>
                    </div>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* ─ PAST: 과거 상환 내역 ─ */}
          {pastScheduleItems.map((item) => {
            // 해당 월의 실제 거래 찾기
            const matchedTx = loanTxns.find((tx) => {
              const txDate = new Date(tx.date);
              return txDate.getFullYear() === item.date.getFullYear() && txDate.getMonth() === item.date.getMonth();
            });
            const actualAmount = matchedTx ? Math.abs(matchedTx.amount) : item.total;

            return (
              <div key={item.month} className="relative mb-4">
                {/* Gray dot */}
                <div className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full bg-bg-elevated flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-text-tertiary" />
                </div>
                {/* Date */}
                <p className="text-xs text-text-tertiary mb-1.5">{fmtDate(item.date)}</p>
                {/* Card */}
                <div className="bg-bg-card rounded-[14px] p-3.5 border border-border-primary">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary">대출 상환</span>
                    <span className="text-sm font-medium text-expense">-{formatNumber(actualAmount)}원</span>
                  </div>
                  <p className="text-[11px] text-text-tertiary">
                    이자 {formatNumber(item.interest)}원 / 원금 {formatNumber(item.principalPay)}원
                  </p>
                </div>
              </div>
            );
          })}

          {/* ─ FIRST: 대출 실행 ─ */}
          {asset.loanStartDate && (
            <div className="relative mb-4">
              {/* Accent dot */}
              <div className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full bg-accent flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-bg-app" />
              </div>
              <p className="text-xs text-text-tertiary mb-1.5">{asset.loanStartDate.replace(/-/g, '.')}</p>
              <div className="bg-bg-card rounded-[14px] p-3.5 border border-border-primary">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">대출 실행</span>
                  <span className="text-sm font-medium text-accent">+{formatNumber(principal)}원</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom text */}
          <p className="text-xs text-text-tertiary text-center mt-2 mb-2">마지막 내역입니다.</p>
        </div>
      </div>

      {/* ── Section 3: Loan Detail Info ── */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowLoanInfo(!showLoanInfo)}
          className="w-full bg-transparent border-none cursor-pointer p-0"
        >
          <SectionHeader title="대출 상세 정보" rightLabel={showLoanInfo ? '접기' : '펼치기'} />
        </button>

        {showLoanInfo && (
          <Card className="divide-y divide-border-primary !p-0">
            {[
              { label: '대출명', value: asset.name },
              { label: '대출 잔액', value: `${formatNumber(balance)}원` },
              { label: '대출 원금', value: `${formatNumber(principal)}원` },
              { label: '적용 금리', value: `${rate}%` },
              { label: '상환방법', value: repaymentMethodLabel(asset.repaymentMethod) },
              { label: '상환일', value: repaymentDay ? `${repaymentDay}일` : '-' },
              { label: '대출일', value: asset.loanStartDate?.replace(/-/g, '.') || '-' },
              { label: '만기일', value: maturityDate.replace(/-/g, '.') },
              { label: '메모', value: asset.memo || '-' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-3.5 px-4">
                <span className="text-sm text-text-tertiary">{row.label}</span>
                <span className="text-sm text-text-primary font-medium">{row.value}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="w-full py-3 rounded-[12px] text-expense text-sm font-medium bg-expense/10 border-none cursor-pointer hover:bg-expense/20 transition-colors"
      >
        자산 삭제
      </button>
    </div>
  );
}

// ─── 일반 자산 상세 뷰 (기존 레이아웃 정리) ─────────────────────────

function GeneralAssetDetailView({
  asset,
  linkedTxns,
  groupedByDate,
  onEdit,
  onDelete,
  onBack,
}: {
  asset: NonNullable<ReturnType<typeof useAssetStore.getState>['assets'][number]>;
  linkedTxns: Transaction[];
  groupedByDate: Map<string, Transaction[]>;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  return (
    <div className="pb-28 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="text-text-tertiary hover:text-text-primary bg-transparent border-none cursor-pointer text-lg p-2">←</button>
        <h1 className="text-lg font-bold text-text-primary flex-1 text-center">{asset.name}</h1>
        <button type="button" onClick={onEdit} className="text-accent text-sm font-medium bg-transparent border-none cursor-pointer p-2">편집</button>
      </div>

      {/* Asset info card */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{ASSET_TYPE_ICONS[asset.type]}</span>
          <div>
            <p className="text-lg font-bold text-text-primary">{formatNumber(asset.balance)}원</p>
            <p className="text-xs text-text-tertiary">{asset.institution} · {ASSET_TYPE_LABELS[asset.type]}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {asset.accountNumber && (
            <div><p className="text-text-tertiary text-xs">계좌번호</p><p className="text-text-primary">{asset.accountNumber}</p></div>
          )}
          {asset.interestRate !== undefined && asset.interestRate > 0 && (
            <div><p className="text-text-tertiary text-xs">금리</p><p className="text-text-primary">{asset.interestRate}%</p></div>
          )}
          {asset.cardType && (
            <div><p className="text-text-tertiary text-xs">카드 종류</p><p className="text-text-primary">{asset.cardType === 'credit' ? '신용' : asset.cardType === 'debit' ? '직불' : '체크'}</p></div>
          )}
          {asset.billingDay && (
            <div><p className="text-text-tertiary text-xs">결제일</p><p className="text-text-primary">매월 {asset.billingDay}일</p></div>
          )}
        </div>
        {asset.memo && (
          <p className="text-xs text-text-tertiary border-t border-border-primary pt-2">{asset.memo}</p>
        )}
      </Card>

      {/* Holdings (securities only) */}
      {asset.type === 'securities' && asset.holdings && asset.holdings.length > 0 && (
        <section>
          <SectionHeader title="보유 종목" />
          <Card className="divide-y divide-border-primary">
            {asset.holdings.map((h) => {
              const invested = h.avgPrice * h.quantity;
              const diff = h.currentPrice - invested;
              const pct = invested > 0 ? (diff / invested) * 100 : 0;
              return (
                <div key={h.id} className="flex items-center justify-between py-3 px-1">
                  <div>
                    <p className="text-sm text-text-primary font-medium">{h.name}</p>
                    <p className="text-xs text-text-tertiary">{h.broker} · {h.quantity}주 · 매수가 {formatNumber(h.avgPrice)}원</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-primary">{formatNumber(h.currentPrice)}원</p>
                    <p className={`text-xs ${diff >= 0 ? 'text-expense' : 'text-blue-400'}`}>
                      {diff >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(diff))}원({Math.abs(pct).toFixed(2)}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
      )}

      {/* Linked transactions */}
      <section>
        <SectionHeader title="연결된 거래내역" rightLabel={`${linkedTxns.length}건`} />
        {linkedTxns.length > 0 ? (
          <div className="flex flex-col">
            {Array.from(groupedByDate.entries()).map(([date, txns]) => (
              <div key={date}>
                <DateDivider date={date} />
                <Card className="px-3">
                  {txns.map((tx) => (
                    <TransactionListItem key={tx.id} transaction={tx} />
                  ))}
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-text-tertiary text-center py-4">연결된 거래내역이 없습니다</p>
          </Card>
        )}
      </section>

      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="w-full py-3 rounded-[12px] text-expense text-sm font-medium bg-expense/10 border-none cursor-pointer hover:bg-expense/20 transition-colors"
      >
        자산 삭제
      </button>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────

export default function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const assets = useAssetStore((s) => s.assets);
  const deleteAsset = useAssetStore((s) => s.deleteAsset);
  const transactions = useTransactionStore((s) => s.transactions);
  const [showEditForm, setShowEditForm] = useState(false);

  const asset = assets.find((a) => a.id === assetId);

  // 연결된 거래 (paymentMethod가 자산명과 일치)
  const linkedTxns = useMemo(() => {
    if (!asset) return [];
    return transactions
      .filter((tx) => tx.paymentMethod === asset.name)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
      .slice(0, 50);
  }, [asset, transactions]);

  // 날짜별 그룹 (일반 자산 뷰용)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of linkedTxns) {
      const existing = map.get(tx.date);
      if (existing) existing.push(tx);
      else map.set(tx.date, [tx]);
    }
    return map;
  }, [linkedTxns]);

  if (!asset) {
    return (
      <div className="pb-28 animate-fade-in">
        <EmptyState icon="❌" title="자산을 찾을 수 없습니다" description="" />
        <button type="button" onClick={() => navigate('/assets')} className="mt-4 text-accent text-sm mx-auto block bg-transparent border-none cursor-pointer">
          돌아가기
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('이 자산을 삭제하시겠습니까?')) {
      deleteAsset(asset.id);
      navigate('/assets');
    }
  };

  const isLoan = asset.type === 'loan';

  return (
    <>
      {isLoan ? (
        <LoanDetailView
          asset={asset}
          linkedTxns={linkedTxns}
          onEdit={() => setShowEditForm(true)}
          onDelete={handleDelete}
          onBack={() => navigate('/assets')}
        />
      ) : (
        <GeneralAssetDetailView
          asset={asset}
          linkedTxns={linkedTxns}
          groupedByDate={groupedByDate}
          onEdit={() => setShowEditForm(true)}
          onDelete={handleDelete}
          onBack={() => navigate('/assets')}
        />
      )}

      {/* Edit form (공통) */}
      <AssetFormSheet
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        editAsset={asset}
      />
    </>
  );
}
