// 거래 필터링 훅 — 스토어의 transactions를 필터 조건에 따라 필터링/정렬
import { useMemo } from 'react';
import { useTransactionStore } from '../store';
import type { Transaction, TransactionFilter } from '../types';

/**
 * 필터 조건에 맞는 거래 목록을 반환한다.
 * 날짜+시간 내림차순(최신순) 정렬.
 */
export function useFilteredTransactions(filter?: TransactionFilter): Transaction[] {
  const transactions = useTransactionStore((s) => s.transactions);

  // filter 객체의 각 필드를 개별 dependency로 사용
  const monthKey = filter?.monthKey;
  const type = filter?.type;
  const category = filter?.category;
  const subcategory = filter?.subcategory;
  const paymentMethod = filter?.paymentMethod;
  const searchQuery = filter?.searchQuery;
  const dateRangeStart = filter?.dateRange?.start;
  const dateRangeEnd = filter?.dateRange?.end;

  return useMemo(() => {
    let result = transactions;

    // monthKey 필터: date가 해당 월에 속하는지
    if (monthKey) {
      result = result.filter((tx) => tx.date.startsWith(monthKey));
    }

    // type 필터: 수입/지출
    if (type) {
      result = result.filter((tx) => tx.type === type);
    }

    // category 필터: 대분류 일치
    if (category) {
      result = result.filter((tx) => tx.category === category);
    }

    // subcategory 필터: 소분류 일치
    if (subcategory) {
      result = result.filter((tx) => tx.subcategory === subcategory);
    }

    // paymentMethod 필터: 결제수단 일치
    if (paymentMethod) {
      result = result.filter((tx) => tx.paymentMethod === paymentMethod);
    }

    // dateRange 필터: 날짜 범위
    if (dateRangeStart && dateRangeEnd) {
      result = result.filter(
        (tx) => tx.date >= dateRangeStart && tx.date <= dateRangeEnd,
      );
    }

    // searchQuery 필터: content 또는 memo에 포함 (대소문자 무시)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((tx) => {
        const content = tx.content.toLowerCase();
        const memo = (tx.memo ?? '').toLowerCase();
        return content.includes(q) || memo.includes(q);
      });
    }

    // 날짜+시간 내림차순 정렬 (최신 순)
    return [...result].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
  }, [
    transactions,
    monthKey,
    type,
    category,
    subcategory,
    paymentMethod,
    searchQuery,
    dateRangeStart,
    dateRangeEnd,
  ]);
}
