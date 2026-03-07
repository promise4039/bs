// 카테고리 관리 스토어 — 사용자 커스텀 카테고리 추가/수정/삭제
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CATEGORY_META } from '../constants';
import { EXPENSE_CATEGORY_LIST, INCOME_CATEGORY_LIST } from '../types';
import type { ExpenseCategory } from '../types';

export interface CustomCategory {
  name: string;
  emoji: string;
  type: 'expense' | 'income';
  /** 소분류 목록 */
  subcategories: string[];
}

interface CategoryStore {
  /** 사용자 커스텀 카테고리 (기본 카테고리 포함) */
  expenseCategories: CustomCategory[];
  incomeCategories: CustomCategory[];

  addCategory: (cat: CustomCategory) => void;
  updateCategory: (type: 'expense' | 'income', oldName: string, updates: Partial<CustomCategory>) => void;
  deleteCategory: (type: 'expense' | 'income', name: string) => void;
  addSubcategory: (type: 'expense' | 'income', categoryName: string, subcategoryName: string) => void;
  removeSubcategory: (type: 'expense' | 'income', categoryName: string, subcategoryName: string) => void;
}

// 수입 카테고리 이모지 매핑
function getIncomeEmoji(name: string): string {
  const map: Record<string, string> = {
    '금융수입': '🏦',
    '급여': '💰',
    '기타수입': '📥',
    '더치페이': '🤝',
    '사업수입': '💼',
    '상여금': '🎉',
    '용돈': '💵',
    '미분류': '📎',
  };
  return map[name] || '📎';
}

// 뱅크샐러드 기본 소분류 매핑 (뱅크샐러드 앱 실제 소분류 기준)
const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  '식비': ['한식', '중식', '일식', '양식', '아시아음식', '뷔페', '고기', '치킨', '피자', '패스트푸드', '배달', '식재료', '구내식당'],
  '카페/간식': ['커피/음료', '베이커리', '디저트/떡', '도넛/핫도그', '아이스크림/빙수', '기타간식'],
  '술/유흥': ['맥주/호프', '이자카야', '와인', '바(BAR)', '요리주점', '민속주점', '유흥시설'],
  '생활': ['생필품', '편의점', '마트', '생활서비스', '세탁', '목욕', '가구/가전'],
  '온라인쇼핑': ['인터넷쇼핑', '홈쇼핑', '결제/충전', '앱스토어', '서비스구독'],
  '패션/쇼핑': ['패션', '신발', '아울렛/몰', '스포츠의류', '백화점'],
  '뷰티/미용': ['화장품', '헤어샵', '미용관리', '미용용품', '네일', '성형외과', '피부과'],
  '교통': ['택시', '대중교통', '철도', '시외버스'],
  '자동차': ['주유', '주차', '세차', '통행료', '할부/리스', '정비/수리', '차량보험', '대리운전'],
  '주거/통신': ['휴대폰', '인터넷', '월세', '관리비', '가스비', '전기세', '보일러'],
  '의료/건강': ['약국', '종합병원', '피부과', '소아과', '산부인과', '안과', '이비인후과', '비뇨기과', '성형외과', '내과/가정의학', '정형외과', '치과', '한의원', '기타병원', '보조식품', '건강용품', '운동'],
  '금융': ['보험', '은행', '증권/투자', '카드', '이자/대출', '세금/과태료'],
  '문화/여가': ['영화', '도서', '게임', '음악', '공연', '전시/관람', '취미/체험', '테마파크', '스포츠', '마사지/스파'],
  '여행/숙박': ['숙박비', '항공권', '여행', '관광', '여행용품', '해외결제'],
  '교육/학습': ['학원/강의', '학습교재', '학교', '시험료'],
  '경조/선물': ['축의금', '부의금', '기부/헌금', '선물', '회비'],
  '미분류': ['기타'],
};

const DEFAULT_INCOME_SUBCATEGORIES: Record<string, string[]> = {
  '금융수입': ['이자', '배당', '환급'],
  '급여': ['월급', '상여금', '수당'],
  '기타수입': ['기타'],
  '더치페이': ['더치페이'],
  '사업수입': ['사업소득'],
  '상여금': ['성과급', '명절상여'],
  '용돈': ['용돈'],
  '미분류': ['기타'],
};

// 기본 지출 카테고리 초기값
const defaultExpenseCategories: CustomCategory[] = EXPENSE_CATEGORY_LIST.map((name) => ({
  name,
  emoji: CATEGORY_META[name as ExpenseCategory]?.emoji || '📎',
  type: 'expense' as const,
  subcategories: DEFAULT_SUBCATEGORIES[name] || [],
}));

// 기본 수입 카테고리 초기값
const defaultIncomeCategories: CustomCategory[] = INCOME_CATEGORY_LIST.map((name) => ({
  name,
  emoji: getIncomeEmoji(name),
  type: 'income' as const,
  subcategories: DEFAULT_INCOME_SUBCATEGORIES[name] || [],
}));

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set) => ({
      expenseCategories: defaultExpenseCategories,
      incomeCategories: defaultIncomeCategories,

      addCategory: (cat) =>
        set((state) => {
          if (cat.type === 'expense') {
            return { expenseCategories: [...state.expenseCategories, cat] };
          }
          return { incomeCategories: [...state.incomeCategories, cat] };
        }),

      updateCategory: (type, oldName, updates) =>
        set((state) => {
          const key = type === 'expense' ? 'expenseCategories' : 'incomeCategories';
          return {
            [key]: state[key].map((c) =>
              c.name === oldName ? { ...c, ...updates } : c
            ),
          };
        }),

      deleteCategory: (type, name) =>
        set((state) => {
          const key = type === 'expense' ? 'expenseCategories' : 'incomeCategories';
          return {
            [key]: state[key].filter((c) => c.name !== name),
          };
        }),

      addSubcategory: (type, categoryName, subcategoryName) =>
        set((state) => {
          const key = type === 'expense' ? 'expenseCategories' : 'incomeCategories';
          return {
            [key]: state[key].map((c) =>
              c.name === categoryName
                ? { ...c, subcategories: [...c.subcategories, subcategoryName] }
                : c
            ),
          };
        }),

      removeSubcategory: (type, categoryName, subcategoryName) =>
        set((state) => {
          const key = type === 'expense' ? 'expenseCategories' : 'incomeCategories';
          return {
            [key]: state[key].map((c) =>
              c.name === categoryName
                ? { ...c, subcategories: c.subcategories.filter((s) => s !== subcategoryName) }
                : c
            ),
          };
        }),
    }),
    {
      name: 'bs_categories',
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { expenseCategories: CustomCategory[]; incomeCategories: CustomCategory[] };
        if (version < 2) {
          // Migrate v0/v1 → v2: 빈 소분류 배열에 기본 소분류 채워넣기
          state.expenseCategories = state.expenseCategories.map((c) => ({
            ...c,
            subcategories: c.subcategories.length === 0
              ? (DEFAULT_SUBCATEGORIES[c.name] || [])
              : c.subcategories,
          }));
          state.incomeCategories = state.incomeCategories.map((c) => ({
            ...c,
            subcategories: c.subcategories.length === 0
              ? (DEFAULT_INCOME_SUBCATEGORIES[c.name] || [])
              : c.subcategories,
          }));
        }
        if (version < 3) {
          // Migrate v2 → v3: 뱅크샐러드 실제 소분류로 교체
          // 기존 기본값은 뱅크샐러드 기준이 아니었으므로 새 기본값으로 일괄 교체
          state.expenseCategories = state.expenseCategories.map((c) => ({
            ...c,
            subcategories: DEFAULT_SUBCATEGORIES[c.name] || c.subcategories,
          }));
        }
        return state;
      },
    },
  ),
);
