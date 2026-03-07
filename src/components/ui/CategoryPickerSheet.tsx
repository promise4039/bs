// 카테고리 선택 풀스크린 바텀시트 — 뱅크샐러드 스타일
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryStore } from '../../store/category-store';
import { CATEGORY_META } from '../../constants/categories';
import type { ExpenseCategory } from '../../types';

// 수입 카테고리 이모지 매핑
const INCOME_CATEGORY_EMOJI: Record<string, string> = {
  '금융수입': '💰',
  '급여': '💵',
  '기타수입': '📥',
  '더치페이': '🤝',
  '사업수입': '💼',
  '상여금': '🎉',
  '용돈': '💸',
  '미분류': '📎',
};

export interface CategoryPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  type: '지출' | '수입';
  selectedCategory: string;
  selectedSubcategory: string;
  onSelect: (category: string, subcategory: string) => void;
}

export function CategoryPickerSheet({
  isOpen,
  onClose,
  type,
  selectedCategory,
  selectedSubcategory,
  onSelect,
}: CategoryPickerSheetProps) {
  const navigate = useNavigate();
  const { expenseCategories, incomeCategories } = useCategoryStore();

  // 로컬 선택 상태 (저장 버튼 누르기 전까지 임시)
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localSubcategory, setLocalSubcategory] = useState(selectedSubcategory);

  // 시트가 열릴 때 선택값 동기화
  if (isOpen && localCategory !== selectedCategory && localCategory === '') {
    setLocalCategory(selectedCategory);
    setLocalSubcategory(selectedSubcategory);
  }

  if (!isOpen) return null;

  const categories = type === '지출' ? expenseCategories : incomeCategories;

  // 카테고리의 이모지 가져오기
  const getEmoji = (name: string): string => {
    if (type === '지출') {
      return CATEGORY_META[name as ExpenseCategory]?.emoji ?? '📎';
    }
    return INCOME_CATEGORY_EMOJI[name] ?? '📎';
  };

  // 4열 그리드를 위해 행별로 분할
  const COLS = 4;
  const rows: typeof categories[] = [];
  for (let i = 0; i < categories.length; i += COLS) {
    rows.push(categories.slice(i, i + COLS));
  }

  // 선택된 카테고리의 소분류 목록
  const selectedCatData = categories.find((c) => c.name === localCategory);
  const subcategories = selectedCatData?.subcategories ?? [];

  // 저장 핸들러
  const handleSave = () => {
    onSelect(localCategory, localSubcategory);
    onClose();
  };

  // 카테고리 관리 페이지로 이동
  const handleManageCategories = () => {
    onClose();
    navigate('/categories');
  };

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/60 z-[60] animate-fade-overlay" onClick={onClose} />

      {/* 풀스크린 시트 */}
      <div className="fixed inset-0 z-[70] flex justify-center animate-slide-up">
      <div className="w-full max-w-lg bg-bg-primary flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-primary">
          <h2 className="text-lg font-bold text-text-primary">
            {type === '지출' ? '지출' : '수입'} 카테고리 선택
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 카테고리 그리드 — 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {rows.map((row, rowIdx) => {
            // 이 행에 선택된 카테고리가 있는지 확인
            const hasSelected = row.some((c) => c.name === localCategory);

            return (
              <div key={rowIdx}>
                {/* 카테고리 카드 행 */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {row.map((cat) => {
                    const isSelected = cat.name === localCategory;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          setLocalCategory(cat.name);
                          setLocalSubcategory('');
                        }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10'
                            : 'border-border-primary bg-bg-card hover:border-text-tertiary'
                        }`}
                      >
                        <span className="text-2xl">{getEmoji(cat.name)}</span>
                        <span className={`text-xs leading-tight text-center font-medium ${
                          isSelected ? 'text-accent' : 'text-text-secondary'
                        }`}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 소분류 칩 — 선택된 카테고리가 이 행에 있으면 바로 아래에 표시 */}
                {hasSelected && subcategories.length > 0 && (
                  <div className="bg-bg-elevated rounded-xl p-3 mb-3">
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map((sub) => {
                        const isSubSelected = sub === localSubcategory;
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setLocalSubcategory(isSubSelected ? '' : sub)}
                            className={`px-3.5 py-1.5 text-sm rounded-full transition-all ${
                              isSubSelected
                                ? 'bg-accent/15 border-2 border-accent text-accent font-medium'
                                : 'bg-bg-card border border-border-primary text-text-secondary hover:border-accent'
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 카테고리 관리 카드 — 그리드 마지막에 */}
          <div className="grid grid-cols-4 gap-2 mt-1">
            <button
              type="button"
              onClick={handleManageCategories}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-dashed border-border-primary bg-bg-card hover:border-accent transition-all"
            >
              <span className="text-2xl">⚙️</span>
              <span className="text-xs leading-tight text-center font-medium text-text-tertiary">
                카테고리 관리
              </span>
            </button>
          </div>
        </div>

        {/* 하단 저장 버튼 */}
        <div className="px-5 pb-8 pt-3 border-t border-border-primary">
          <button
            type="button"
            onClick={handleSave}
            disabled={!localCategory}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-income hover:bg-income/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            저장
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
