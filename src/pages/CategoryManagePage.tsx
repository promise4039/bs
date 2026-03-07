// 카테고리 관리 페이지 — 대분류 추가/수정/삭제 + 소분류 관리
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ToggleGroup,
  BottomSheet,
  ConfirmDialog,
} from '../components/ui';
import { useCategoryStore } from '../store/category-store';
import type { CustomCategory } from '../store/category-store';

export default function CategoryManagePage() {
  const navigate = useNavigate();

  // --- 스토어 ---
  const expenseCategories = useCategoryStore((s) => s.expenseCategories);
  const incomeCategories = useCategoryStore((s) => s.incomeCategories);
  const addCategory = useCategoryStore((s) => s.addCategory);
  const updateCategory = useCategoryStore((s) => s.updateCategory);
  const deleteCategory = useCategoryStore((s) => s.deleteCategory);

  // --- 로컬 상태 ---
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [isEditMode, setIsEditMode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);

  // 폼 상태
  const [formEmoji, setFormEmoji] = useState('');
  const [formName, setFormName] = useState('');
  const [formSubcategories, setFormSubcategories] = useState<string[]>([]);
  const [newSubcategory, setNewSubcategory] = useState('');

  // 삭제 확인 다이얼로그
  const [deleteTarget, setDeleteTarget] = useState<CustomCategory | null>(null);

  const categories = activeType === 'expense' ? expenseCategories : incomeCategories;

  // --- 시트 열기: 추가 모드 ---
  const openAddSheet = useCallback(() => {
    setEditingCategory(null);
    setFormEmoji('📎');
    setFormName('');
    setFormSubcategories([]);
    setNewSubcategory('');
    setSheetOpen(true);
  }, []);

  // --- 시트 열기: 수정 모드 ---
  const openEditSheet = useCallback((cat: CustomCategory) => {
    if (isEditMode) return; // 편집 모드에서는 클릭 시 삭제만
    setEditingCategory(cat);
    setFormEmoji(cat.emoji);
    setFormName(cat.name);
    setFormSubcategories([...cat.subcategories]);
    setNewSubcategory('');
    setSheetOpen(true);
  }, [isEditMode]);

  // --- 시트 닫기 ---
  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setEditingCategory(null);
  }, []);

  // --- 소분류 추가 ---
  const handleAddSubcategory = useCallback(() => {
    const trimmed = newSubcategory.trim();
    if (!trimmed || formSubcategories.includes(trimmed)) return;
    setFormSubcategories((prev) => [...prev, trimmed]);
    setNewSubcategory('');
  }, [newSubcategory, formSubcategories]);

  // --- 소분류 제거 ---
  const handleRemoveSubcategory = useCallback((sub: string) => {
    setFormSubcategories((prev) => prev.filter((s) => s !== sub));
  }, []);

  // --- 저장 ---
  const handleSave = useCallback(() => {
    const trimmedName = formName.trim();
    if (!trimmedName) return;

    if (editingCategory) {
      // 수정 모드
      updateCategory(activeType, editingCategory.name, {
        name: trimmedName,
        emoji: formEmoji || '📎',
        subcategories: formSubcategories,
      });

      // 소분류 동기화: 스토어의 addSubcategory/removeSubcategory 대신 updateCategory로 일괄 처리
    } else {
      // 추가 모드
      const newCat: CustomCategory = {
        name: trimmedName,
        emoji: formEmoji || '📎',
        type: activeType,
        subcategories: formSubcategories,
      };
      addCategory(newCat);
    }

    closeSheet();
  }, [editingCategory, formName, formEmoji, formSubcategories, activeType, updateCategory, addCategory, closeSheet]);

  // --- 삭제 확정 ---
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteCategory(deleteTarget.type, deleteTarget.name);
    setDeleteTarget(null);
    setIsEditMode(false);
  }, [deleteTarget, deleteCategory]);

  // --- 시트 내 삭제 버튼 ---
  const handleDeleteFromSheet = useCallback(() => {
    if (!editingCategory) return;
    closeSheet();
    setDeleteTarget(editingCategory);
  }, [editingCategory, closeSheet]);

  return (
    <div className="pb-28 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary transition-colors text-lg"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-text-primary">카테고리 관리</h1>
      </div>

      {/* 수입/지출 토글 */}
      <div className="flex justify-center">
        <ToggleGroup
          options={[
            { label: '지출', value: 'expense' },
            { label: '수입', value: 'income' },
          ]}
          selected={activeType}
          onChange={(v) => {
            setActiveType(v as 'expense' | 'income');
            setIsEditMode(false);
          }}
        />
      </div>

      {/* 카테고리 그리드 */}
      <div className="grid grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className="relative">
            {/* 편집 모드: 삭제 X 버튼 */}
            {isEditMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(cat);
                }}
                className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-expense text-white text-xs flex items-center justify-center shadow-md"
              >
                ×
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isEditMode) {
                  // 편집 모드에서 카테고리 클릭 시 수정 시트 열기
                  setIsEditMode(false);
                  setEditingCategory(cat);
                  setFormEmoji(cat.emoji);
                  setFormName(cat.name);
                  setFormSubcategories([...cat.subcategories]);
                  setNewSubcategory('');
                  setSheetOpen(true);
                } else {
                  openEditSheet(cat);
                }
              }}
              className={`w-full flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors ${
                isEditMode
                  ? 'bg-bg-elevated animate-pulse-subtle'
                  : 'bg-bg-card hover:bg-bg-card-hover'
              }`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-text-primary truncate w-full text-center">
                {cat.name}
              </span>
              {cat.subcategories.length > 0 && (
                <span className="text-[10px] text-text-tertiary">
                  소분류 {cat.subcategories.length}
                </span>
              )}
            </button>
          </div>
        ))}

        {/* 추가 버튼 셀 */}
        {!isEditMode && (
          <button
            type="button"
            onClick={openAddSheet}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 border-dashed border-border-primary hover:border-accent transition-colors"
          >
            <span className="text-2xl text-text-tertiary">+</span>
            <span className="text-xs text-text-tertiary">추가</span>
          </button>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={openAddSheet}
        >
          추가
        </Button>
        <Button
          variant={isEditMode ? 'primary' : 'secondary'}
          fullWidth
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? '완료' : '편집'}
        </Button>
      </div>

      {/* ========== 추가/수정 바텀시트 ========== */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={closeSheet}
        title={editingCategory ? '카테고리 수정' : '카테고리 추가'}
      >
        <div className="space-y-5">
          {/* 이모지 입력 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              이모지
            </label>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{formEmoji || '📎'}</span>
              <input
                type="text"
                value={formEmoji}
                onChange={(e) => {
                  // 마지막 이모지 문자만 사용
                  const val = e.target.value;
                  if (val.length === 0) {
                    setFormEmoji('');
                  } else {
                    // 마지막 이모지/문자 추출
                    const segments = [...val];
                    setFormEmoji(segments[segments.length - 1]);
                  }
                }}
                placeholder="이모지를 붙여넣으세요"
                className="flex-1 bg-bg-elevated text-text-primary rounded-xl px-4 py-3 text-sm outline-none border border-border-primary focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* 카테고리 이름 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              카테고리 이름
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="예: 식비, 교통"
              className="w-full bg-bg-elevated text-text-primary rounded-xl px-4 py-3 text-sm outline-none border border-border-primary focus:border-accent transition-colors"
            />
          </div>

          {/* 소분류 관리 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              소분류
            </label>

            {/* 기존 소분류 태그 */}
            {formSubcategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formSubcategories.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1 bg-bg-elevated text-text-primary text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {sub}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubcategory(sub)}
                      className="text-text-tertiary hover:text-expense ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 소분류 추가 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubcategory();
                  }
                }}
                placeholder="소분류 이름 입력"
                className="flex-1 bg-bg-elevated text-text-primary rounded-xl px-4 py-2.5 text-sm outline-none border border-border-primary focus:border-accent transition-colors"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddSubcategory}
                disabled={!newSubcategory.trim()}
              >
                추가
              </Button>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-2">
            {editingCategory && (
              <Button
                variant="danger"
                fullWidth
                onClick={handleDeleteFromSheet}
              >
                삭제
              </Button>
            )}
            <Button
              variant="primary"
              fullWidth
              onClick={handleSave}
              disabled={!formName.trim()}
            >
              저장
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* ========== 삭제 확인 다이얼로그 ========== */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="카테고리 삭제"
        message={`"${deleteTarget?.emoji} ${deleteTarget?.name}" 카테고리를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
