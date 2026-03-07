// 엑셀 임포트 훅 — 뱅크샐러드 엑셀 파일 파싱 및 거래/자산 데이터 저장
import { useState, useCallback } from 'react';
import { useTransactionStore } from '../store';
import { useAssetStore } from '../store/asset-store';
import { parseExcelFile } from '../utils/excel-parser';
import type { ExcelParseResult } from '../types';

interface UseExcelImportReturn {
  /** 파일을 파싱하여 미리보기 결과를 반환 */
  importFile: (file: File) => Promise<ExcelParseResult>;
  /** 파싱 진행 중 여부 */
  isImporting: boolean;
  /** 마지막 파싱 결과 */
  result: ExcelParseResult | null;
  /** 에러 메시지 */
  error: string | null;
  /** 파싱 결과를 확정하여 스토어에 저장 */
  confirmImport: (mode: 'merge' | 'replace') => void;
  /** 상태 초기화 */
  reset: () => void;
}

/**
 * 뱅크샐러드 엑셀 파일 import 워크플로우를 관리한다.
 * importFile → 미리보기 → confirmImport 순서로 사용.
 */
export function useExcelImport(): UseExcelImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ExcelParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addTransactions = useTransactionStore((s) => s.addTransactions);
  const upsertAssets = useAssetStore((s) => s.upsertAssets);

  const importFile = useCallback(async (file: File): Promise<ExcelParseResult> => {
    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const parseResult = await parseExcelFile(file);
      setResult(parseResult);
      return parseResult;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '파일 파싱 중 오류가 발생했습니다.';
      setError(message);
      throw err;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const confirmImport = useCallback(
    (mode: 'merge' | 'replace') => {
      if (!result) return;
      addTransactions(result.transactions, mode);
      // 자산 데이터도 자동 반영 (upsert: 있으면 잔액 갱신, 없으면 추가)
      if (result.assets.length > 0) {
        upsertAssets(result.assets);
      }
      // 확정 후 result는 유지 (UI에서 완료 상태 표시용)
    },
    [result, addTransactions, upsertAssets],
  );

  const reset = useCallback(() => {
    setIsImporting(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    importFile,
    isImporting,
    result,
    error,
    confirmImport,
    reset,
  };
}
