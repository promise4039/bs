// 거래 추가/수정 폼 — 뱅크샐러드 스타일 (IMG_1501 레이아웃)
import { useState, useEffect, type ChangeEvent } from 'react';
import { BottomSheet } from './BottomSheet';
import { CategoryPickerSheet } from './CategoryPickerSheet';
import type { Transaction, TransactionType } from '../../types/transaction';
import { CATEGORY_META } from '../../constants/categories';
import { useAssetStore } from '../../store/asset-store';
import type { ExpenseCategory } from '../../types';

export interface TransactionFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
  defaultDate?: string;
  onSave: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

const ASSET_TYPE_ICONS_MAP: Record<string, string> = {
  account: '🏦', card: '💳', cash: '💵', loan: '📉', securities: '📈', pay: '📱',
};

const INCOME_CATEGORY_EMOJI: Record<string, string> = {
  '금융수입': '💰', '급여': '💵', '기타수입': '📥', '더치페이': '🤝',
  '사업수입': '💼', '상여금': '🎉', '용돈': '💸', '미분류': '📎',
};

function generateId(): string {
  return `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatAmount(value: number): string {
  if (value === 0) return '';
  return value.toLocaleString('ko-KR');
}

function formatDateKR(dateStr: string): string {
  const d = new Date(dateStr);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}년 ${mm}월 ${dd}일`;
}

function formatTimeKR(timeStr: string): string {
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h < 12 ? '오전' : '오후';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${ampm} ${String(h).padStart(2, '0')}:${m}`;
}

// 각 행의 높이 클래스 (IMG_1501 기준 ~64px)
const ROW = 'flex items-center min-h-[60px] border-b border-border-primary';

export function TransactionFormSheet({
  isOpen,
  onClose,
  editTransaction,
  defaultDate,
  onSave,
}: TransactionFormSheetProps) {
  const [type, setType] = useState<TransactionType>('지출');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('미분류');
  const [subcategory, setSubcategory] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].slice(0, 5));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [memo, setMemo] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [excludeFromBudget, setExcludeFromBudget] = useState(false);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const assets = useAssetStore((s) => s.assets);

  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setType(editTransaction.type);
        setAmount(editTransaction.amount);
        setCategory(editTransaction.category);
        setSubcategory(editTransaction.subcategory);
        setContent(editTransaction.content);
        setDate(editTransaction.date);
        setTime(editTransaction.time.slice(0, 5));
        setPaymentMethod(editTransaction.paymentMethod);
        setMemo(editTransaction.memo ?? '');
        setIsFixed(editTransaction.isFixed ?? false);
        setExcludeFromBudget(editTransaction.excludeFromBudget ?? false);
      } else {
        setType('지출');
        setAmount(0);
        setCategory('미분류');
        setSubcategory('');
        setContent('');
        setDate(defaultDate ?? new Date().toISOString().split('T')[0]);
        setTime(new Date().toTimeString().split(' ')[0].slice(0, 5));
        setPaymentMethod('');
        setMemo('');
        setIsFixed(false);
        setExcludeFromBudget(false);
      }
      setShowCategoryPicker(false);
      setShowPaymentPicker(false);
      setShowDatePicker(false);
    }
  }, [isOpen, editTransaction, defaultDate]);

  useEffect(() => {
    if (!editTransaction) {
      setCategory('미분류');
      setSubcategory('');
    }
  }, [type, editTransaction]);

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmount(raw === '' ? 0 : parseInt(raw, 10));
  };

  const handleSave = () => {
    if (amount <= 0) return;
    const tx: Transaction = {
      id: editTransaction?.id ?? generateId(),
      date,
      time: time.length === 5 ? `${time}:00` : time,
      type,
      category,
      subcategory,
      content: content || '직접입력',
      amount,
      currency: 'KRW',
      paymentMethod: paymentMethod || '직접입력',
      memo: memo || null,
      isFixed,
      excludeFromBudget,
    };
    onSave(tx);
    onClose();
  };

  const currentEmoji = type === '지출'
    ? (CATEGORY_META[category as ExpenseCategory]?.emoji ?? '📎')
    : (INCOME_CATEGORY_EMOJI[category] ?? '📎');

  const categoryDisplay = subcategory ? `${category} > ${subcategory}` : category;

  const typeOptions = [
    { label: '수입', value: '수입' },
    { label: '지출', value: '지출' },
    { label: '이체', value: '이체' },
  ];

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col min-h-full">
          {/* 스크롤 콘텐츠 */}
          <div className="flex-1 pb-24">
            {/* 금액 입력 — 좌측 정렬 (IMG_1501 스타일) */}
            <div className="py-6 border-b border-border-primary">
              <div className="flex items-baseline gap-0.5">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatAmount(amount)}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="bg-transparent text-[32px] font-bold text-text-primary outline-none w-auto max-w-[80%]"
                  style={{ caretColor: 'var(--color-accent)' }}
                  size={Math.max(1, formatAmount(amount).length || 1)}
                />
                <span className="text-[24px] font-bold text-text-secondary">원</span>
              </div>
              {amount <= 0 && (
                <p className="text-xs text-expense mt-2">금액을 입력해주세요</p>
              )}
            </div>

            {/* 분류 — 테두리 pill 토글 (IMG_1501: 녹색 테두리 선택) */}
            <div className={ROW}>
              <span className="text-[15px] text-text-tertiary w-24 shrink-0">분류</span>
              <div className="flex-1 flex gap-2 justify-end">
                {typeOptions.map((opt) => {
                  const isSelected = opt.value === type;
                  const isDisabled = opt.value === '이체';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { if (!isDisabled) setType(opt.value as TransactionType); }}
                      disabled={isDisabled}
                      className={`rounded-full px-5 py-2 text-[15px] font-medium border-2 transition-all ${
                        isSelected
                          ? 'border-income text-income bg-transparent'
                          : isDisabled
                            ? 'border-border-primary text-text-tertiary/40 cursor-not-allowed'
                            : 'border-border-primary text-text-tertiary hover:border-text-tertiary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 카테고리 */}
            <button
              type="button"
              onClick={() => setShowCategoryPicker(true)}
              className={`${ROW} w-full text-left`}
            >
              <span className="text-[15px] text-text-tertiary w-24 shrink-0">카테고리</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-lg">{currentEmoji}</span>
                <span className="text-[15px] text-text-primary flex-1">{categoryDisplay}</span>
                <span className="text-text-tertiary text-base">›</span>
              </div>
            </button>

            {/* 거래처 */}
            <div className={ROW}>
              <span className="text-[15px] text-text-tertiary w-24 shrink-0">거래처</span>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="입력하세요"
                className="flex-1 text-[15px] bg-transparent text-text-primary placeholder:text-text-tertiary outline-none"
              />
            </div>

            {/* 결제수단 */}
            <button
              type="button"
              onClick={() => setShowPaymentPicker(!showPaymentPicker)}
              className={`${ROW} w-full text-left`}
            >
              <span className="text-[15px] text-text-tertiary w-24 shrink-0">결제 수단</span>
              <div className="flex-1 flex items-center gap-2">
                <span className={`text-[15px] flex-1 ${paymentMethod ? 'text-text-primary' : 'text-text-tertiary'}`}>
                  {paymentMethod || '선택하세요'}
                </span>
                <span className="text-text-tertiary text-base">›</span>
              </div>
            </button>

            {/* 결제수단 선택 목록 */}
            {showPaymentPicker && (() => {
              const payableAssets = assets.filter((a) => a.type !== 'loan' && a.type !== 'securities');
              return (
                <div className="bg-bg-elevated rounded-xl p-3 my-2 space-y-1 max-h-48 overflow-y-auto">
                  {payableAssets.length > 0 ? (
                    payableAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => { setPaymentMethod(asset.name); setShowPaymentPicker(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg text-left transition-colors ${
                          paymentMethod === asset.name
                            ? 'bg-accent/15 border border-accent'
                            : 'hover:bg-bg-card-hover border border-transparent'
                        }`}
                      >
                        <span className="text-base">{ASSET_TYPE_ICONS_MAP[asset.type]}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[15px] truncate ${paymentMethod === asset.name ? 'text-accent' : 'text-text-primary'}`}>
                            {asset.name}
                          </p>
                          <p className="text-xs text-text-tertiary">{asset.institution}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-text-tertiary text-center py-2">등록된 자산이 없습니다</p>
                  )}
                  <div className="pt-2 border-t border-border-primary mt-2">
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="직접 입력"
                      className="w-full bg-bg-input border border-border-primary rounded-lg px-3 py-2.5 text-[15px] text-text-primary focus:border-accent outline-none transition-colors"
                    />
                  </div>
                </div>
              );
            })()}

            {/* 날짜·시간 */}
            <div
              className={`${ROW} cursor-pointer`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <span className="text-[15px] text-text-tertiary w-24 shrink-0">날짜·시간</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[15px] text-text-primary flex-1">
                  {formatDateKR(date)} | {formatTimeKR(time)}
                </span>
                <span className="text-text-tertiary text-base">›</span>
              </div>
            </div>

            {showDatePicker && (
              <div className="grid grid-cols-2 gap-3 py-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-bg-input border border-border-primary rounded-lg px-3 py-3 text-[15px] text-text-primary focus:border-accent outline-none transition-colors"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-bg-input border border-border-primary rounded-lg px-3 py-3 text-[15px] text-text-primary focus:border-accent outline-none transition-colors"
                />
              </div>
            )}

            {/* 메모·태그 */}
            <div className={ROW}>
              <span className="text-[15px] text-text-tertiary w-24 shrink-0">메모·태그</span>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="입력하세요"
                className="flex-1 text-[15px] bg-transparent text-text-primary placeholder:text-text-tertiary outline-none"
              />
            </div>

            {/* 예산에서 제외 */}
            <div className={`${ROW} justify-between`}>
              <span className="text-[15px] text-text-primary">예산에서 제외</span>
              <button
                type="button"
                onClick={() => setExcludeFromBudget(!excludeFromBudget)}
                className={`w-12 h-7 rounded-full transition-colors relative ${excludeFromBudget ? 'bg-accent' : 'bg-text-tertiary/30'}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${excludeFromBudget ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>

            {/* 고정 지출 */}
            {type === '지출' && (
              <div className={`${ROW} justify-between`}>
                <span className="text-[15px] text-text-primary">고정 지출에 추가</span>
                <button
                  type="button"
                  onClick={() => setIsFixed(!isFixed)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${isFixed ? 'bg-accent' : 'bg-text-tertiary/30'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${isFixed ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            )}
          </div>

          {/* 저장 버튼 — 하단 고정 (IMG_1501: 큰 초록색 라운드 버튼) */}
          <div className="sticky bottom-0 pt-3 pb-6 bg-bg-card">
            <button
              type="button"
              onClick={handleSave}
              disabled={amount <= 0}
              className={`w-full py-4 rounded-2xl text-[17px] font-bold transition-colors ${
                amount > 0
                  ? 'bg-income text-white active:bg-income/90'
                  : 'bg-text-tertiary/20 text-text-tertiary cursor-not-allowed'
              }`}
            >
              저장
            </button>
          </div>
        </div>
      </BottomSheet>

      <CategoryPickerSheet
        isOpen={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        type={type}
        selectedCategory={category}
        selectedSubcategory={subcategory}
        onSelect={(cat, sub) => { setCategory(cat); setSubcategory(sub); }}
      />
    </>
  );
}
