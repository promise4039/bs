import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { useAssetStore } from '../../store';
import type { Asset, AssetType } from '../../types/asset';

const ASSET_TYPE_OPTIONS: { label: string; value: AssetType }[] = [
  { label: '계좌', value: 'account' },
  { label: '카드', value: 'card' },
  { label: '현금', value: 'cash' },
  { label: '대출', value: 'loan' },
  { label: '투자', value: 'securities' },
  { label: '페이', value: 'pay' },
];

function generateId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface AssetFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editAsset?: Asset | null;
}

export function AssetFormSheet({ isOpen, onClose, editAsset }: AssetFormSheetProps) {
  const navigate = useNavigate();
  const addAsset = useAssetStore((s) => s.addAsset);
  const updateAsset = useAssetStore((s) => s.updateAsset);

  const [type, setType] = useState<AssetType>('account');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [balance, setBalance] = useState(0);
  const [memo, setMemo] = useState('');
  // Account fields
  const [accountNumber, setAccountNumber] = useState('');
  const [interestRate, setInterestRate] = useState('');
  // Card fields
  const [cardType, setCardType] = useState<'credit' | 'debit' | 'check'>('check');
  const [billingDay, setBillingDay] = useState('');
  // Loan fields
  const [loanPrincipal, setLoanPrincipal] = useState('');
  const [loanRate, setLoanRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [loanStartDate, setLoanStartDate] = useState('');
  const [loanTermMonths, setLoanTermMonths] = useState('');
  const [repaymentMethod, setRepaymentMethod] = useState<'equal_principal' | 'equal_payment' | 'bullet'>('equal_principal');
  const [repaymentDay, setRepaymentDay] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editAsset) {
        setType(editAsset.type);
        setName(editAsset.name);
        setInstitution(editAsset.institution);
        setBalance(editAsset.balance);
        setMemo(editAsset.memo || '');
        setAccountNumber(editAsset.accountNumber || '');
        setInterestRate(editAsset.interestRate?.toString() || '');
        setCardType(editAsset.cardType || 'check');
        setBillingDay(editAsset.billingDay?.toString() || '');
        setLoanPrincipal(editAsset.loanPrincipal?.toString() || '');
        setLoanRate(editAsset.loanRate?.toString() || '');
        setMonthlyPayment(editAsset.monthlyPayment?.toString() || '');
        setMaturityDate(editAsset.maturityDate || '');
        setLoanStartDate(editAsset.loanStartDate || '');
        setLoanTermMonths(editAsset.loanTermMonths?.toString() || '');
        setRepaymentMethod(editAsset.repaymentMethod || 'equal_principal');
        setRepaymentDay(editAsset.repaymentDay?.toString() || '');
      } else {
        setType('account');
        setName('');
        setInstitution('');
        setBalance(0);
        setMemo('');
        setAccountNumber('');
        setInterestRate('');
        setCardType('check');
        setBillingDay('');
        setLoanPrincipal('');
        setLoanRate('');
        setMonthlyPayment('');
        setMaturityDate('');
        setLoanStartDate('');
        setLoanTermMonths('');
        setRepaymentMethod('equal_principal');
        setRepaymentDay('');
      }
    }
  }, [isOpen, editAsset]);

  // 월 상환액 자동 계산
  const calculatedMonthlyPayment = useMemo(() => {
    const principal = loanPrincipal ? parseInt(loanPrincipal) : 0;
    const rate = loanRate ? parseFloat(loanRate) / 100 / 12 : 0;
    const term = loanTermMonths ? parseInt(loanTermMonths) : 0;
    if (!principal || !rate || !term) return null;

    if (repaymentMethod === 'equal_payment') {
      const factor = Math.pow(1 + rate, term);
      return Math.round(principal * rate * factor / (factor - 1));
    } else if (repaymentMethod === 'equal_principal') {
      const principalPart = principal / term;
      const avgInterest = principal * rate * (term + 1) / (2 * term);
      return Math.round(principalPart + avgInterest);
    }
    return null; // bullet
  }, [loanPrincipal, loanRate, loanTermMonths, repaymentMethod]);

  // 대출 잔액 자동 계산 (상환 스케줄 기반)
  const calculatedLoanBalance = useMemo(() => {
    const p = loanPrincipal ? parseInt(loanPrincipal) : 0;
    const r = loanRate ? parseFloat(loanRate) / 100 / 12 : 0;
    const term = loanTermMonths ? parseInt(loanTermMonths) : 0;
    const start = loanStartDate ? new Date(loanStartDate) : null;
    if (!p || !term || !start) return null;

    const now = new Date();
    // 경과 개월 수 계산
    let elapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const day = repaymentDay ? parseInt(repaymentDay) : start.getDate();
    // 이번 달 상환일이 아직 안 지났으면 이번 달은 미상환
    if (now.getDate() < day) elapsed--;
    elapsed = Math.max(0, Math.min(elapsed, term));

    if (elapsed === 0) return p;

    let remaining = p;
    for (let i = 1; i <= elapsed; i++) {
      const interest = Math.round(remaining * r);
      let principalPay: number;
      if (repaymentMethod === 'equal_principal') {
        principalPay = Math.round(p / term);
      } else if (repaymentMethod === 'equal_payment') {
        const factor = Math.pow(1 + r, term);
        const totalPayment = Math.round(p * r * factor / (factor - 1));
        principalPay = totalPayment - interest;
      } else {
        principalPay = i === term ? p : 0;
      }
      if (i === term) principalPay = remaining;
      remaining = Math.max(0, remaining - principalPay);
    }
    return remaining;
  }, [loanPrincipal, loanRate, loanTermMonths, loanStartDate, repaymentMethod, repaymentDay]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setBalance(raw === '' ? 0 : parseInt(raw, 10));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    // 대출이면 자동 계산된 잔액 사용
    const finalBalance = type === 'loan' && calculatedLoanBalance !== null
      ? -calculatedLoanBalance  // 대출은 음수로 저장
      : balance;

    const asset: Asset = {
      id: editAsset?.id || generateId(),
      type,
      name: name.trim(),
      institution: institution.trim(),
      balance: finalBalance,
      memo: memo.trim() || undefined,
      // Conditionally include type-specific fields
      ...(type === 'account' && {
        accountNumber: accountNumber.trim() || undefined,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
      }),
      ...(type === 'card' && {
        cardType,
        billingDay: billingDay ? parseInt(billingDay) : undefined,
      }),
      ...(type === 'loan' && {
        loanPrincipal: loanPrincipal ? parseInt(loanPrincipal) : undefined,
        loanRate: loanRate ? parseFloat(loanRate) : undefined,
        monthlyPayment: calculatedMonthlyPayment || (monthlyPayment ? parseInt(monthlyPayment) : undefined),
        loanStartDate: loanStartDate || undefined,
        loanTermMonths: loanTermMonths ? parseInt(loanTermMonths) : undefined,
        repaymentMethod,
        repaymentDay: repaymentDay ? parseInt(repaymentDay) : undefined,
        maturityDate: maturityDate || undefined,
      }),
      // Preserve holdings when editing
      ...(editAsset?.holdings && { holdings: editAsset.holdings }),
    };

    if (editAsset) {
      updateAsset(editAsset.id, asset);
    } else {
      addAsset(asset);
    }
    onClose();
    if (!editAsset) {
      navigate('/assets');
    }
  };

  const inputClass = "w-full bg-bg-input border border-border-primary rounded-[12px] px-4 py-3 text-text-primary focus:border-accent outline-none transition-colors";

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editAsset ? '자산 수정' : '자산 추가'}>
      <div className="flex flex-col gap-4">
        {/* Asset type toggle - scrollable */}
        <div>
          <label className="text-sm text-text-secondary mb-1 block">자산 유형</label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ASSET_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-full border whitespace-nowrap transition-colors shrink-0 ${
                  type === opt.value
                    ? 'bg-accent/15 border-accent text-accent font-medium'
                    : 'bg-bg-input border-border-primary text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-sm text-text-secondary mb-1 block">자산명</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: KB국민ONE통장" className={inputClass} />
        </div>

        {/* Institution */}
        <div>
          <label className="text-sm text-text-secondary mb-1 block">기관명</label>
          <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="예: 국민은행" className={inputClass} />
        </div>

        {/* Balance — 대출은 자동 계산이므로 숨김 */}
        {type !== 'loan' && (
          <div>
            <label className="text-sm text-text-secondary mb-1 block">잔액</label>
            <div className="relative">
              <input type="text" inputMode="numeric" value={balance === 0 ? '' : balance.toLocaleString('ko-KR')} onChange={handleBalanceChange} placeholder="0" className={inputClass} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm">원</span>
            </div>
          </div>
        )}

        {/* Account-specific fields */}
        {type === 'account' && (
          <>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">계좌번호</label>
              <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="선택" className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">금리 (%)</label>
              <input type="text" inputMode="decimal" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="선택" className={inputClass} />
            </div>
          </>
        )}

        {/* Card-specific fields */}
        {type === 'card' && (
          <>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">카드 종류</label>
              <div className="flex gap-2">
                {(['credit', 'debit', 'check'] as const).map((ct) => (
                  <button key={ct} type="button" onClick={() => setCardType(ct)}
                    className={`flex-1 py-2 text-sm rounded-[10px] border transition-colors ${
                      cardType === ct ? 'bg-accent/15 border-accent text-accent' : 'bg-bg-input border-border-primary text-text-secondary'
                    }`}>
                    {ct === 'credit' ? '신용' : ct === 'debit' ? '직불' : '체크'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">결제일</label>
              <input type="text" inputMode="numeric" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} placeholder="예: 15" className={inputClass} />
            </div>
          </>
        )}

        {/* Loan-specific fields */}
        {type === 'loan' && (
          <>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">대출 원금</label>
              <input type="text" inputMode="numeric" value={loanPrincipal} onChange={(e) => setLoanPrincipal(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">이율 (연 %)</label>
              <input type="text" inputMode="decimal" value={loanRate} onChange={(e) => setLoanRate(e.target.value)} placeholder="예: 4.78" className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">대출 시작일</label>
              <input type="date" value={loanStartDate} onChange={(e) => setLoanStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">대출 기간 (개월)</label>
              <input type="text" inputMode="numeric" value={loanTermMonths} onChange={(e) => setLoanTermMonths(e.target.value.replace(/[^0-9]/g, ''))} placeholder="예: 24" className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">상환 방식</label>
              <div className="flex gap-2">
                {([
                  { value: 'equal_principal', label: '원금균등' },
                  { value: 'equal_payment', label: '원리금균등' },
                  { value: 'bullet', label: '만기일시' },
                ] as const).map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setRepaymentMethod(opt.value)}
                    className={`flex-1 py-2 text-xs rounded-[10px] border transition-colors ${
                      repaymentMethod === opt.value ? 'bg-accent/15 border-accent text-accent' : 'bg-bg-input border-border-primary text-text-secondary'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">매월 상환일</label>
              <input type="text" inputMode="numeric" value={repaymentDay} onChange={(e) => setRepaymentDay(e.target.value.replace(/[^0-9]/g, ''))} placeholder="예: 25" className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">만기일</label>
              <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className={inputClass} />
            </div>
            {/* Auto-calculated displays */}
            {(calculatedMonthlyPayment || calculatedLoanBalance !== null) && (
              <div className="bg-bg-elevated rounded-[12px] p-3 space-y-2">
                {calculatedMonthlyPayment && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">예상 월 상환액 (평균)</p>
                    <p className="text-lg font-bold text-accent">{calculatedMonthlyPayment.toLocaleString('ko-KR')}원</p>
                  </div>
                )}
                {calculatedLoanBalance !== null && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">현재 대출 잔액 (자동 계산)</p>
                    <p className="text-lg font-bold text-expense">{calculatedLoanBalance.toLocaleString('ko-KR')}원</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Memo */}
        <div>
          <label className="text-sm text-text-secondary mb-1 block">메모</label>
          <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (선택)" className={inputClass} />
        </div>

        {/* Save button */}
        <Button variant="primary" size="lg" fullWidth onClick={handleSave} disabled={!name.trim()} className="mt-2">
          저장
        </Button>
      </div>
    </BottomSheet>
  );
}
