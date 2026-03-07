// 설정 페이지 — 예산 설정 + 데이터 관리 (엑셀 import, 초기화)
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Badge,
  SectionHeader,
  NumberInput,
  ConfirmDialog,
  Spinner,
  CategoryIcon,
  ToggleGroup,
  DropZone,
} from '../components/ui';
import { useExcelImport } from '../hooks';
import { useBudgetStore, useTransactionStore } from '../store';
import { useAuthStore, hashPin } from '../store/auth-store';
import { CATEGORY_META } from '../constants';
import { EXPENSE_CATEGORY_LIST } from '../types';
import type { ExpenseCategory } from '../types';
import { formatKRW } from '../utils/currency';

export default function SettingsPage() {
  const navigate = useNavigate();

  // --- 스토어 ---
  const budgets = useBudgetStore((s) => s.budgets);
  const setBudget = useBudgetStore((s) => s.setBudget);
  const resetToDefaults = useBudgetStore((s) => s.resetToDefaults);

  const transactions = useTransactionStore((s) => s.transactions);
  const clearTransactions = useTransactionStore((s) => s.clearTransactions);

  const pinHash = useAuthStore((s) => s.pinHash);
  const setPinHash = useAuthStore((s) => s.setPinHash);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // --- 엑셀 import ---
  const { importFile, isImporting, result, error, confirmImport, reset } =
    useExcelImport();

  // --- 로컬 상태 ---
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importDone, setImportDone] = useState(false);
  const [showResetBudgetDialog, setShowResetBudgetDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);

  // --- debounce용 타이머 ref (카테고리별) ---
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /** 예산 변경 — 500ms debounce 후 스토어 반영 */
  const handleBudgetChange = useCallback(
    (category: ExpenseCategory, value: number) => {
      // 기존 타이머 취소
      if (timersRef.current[category]) {
        clearTimeout(timersRef.current[category]);
      }
      // 즉시 로컬 UI 반영을 위해 스토어 직접 호출 대신 debounce
      timersRef.current[category] = setTimeout(() => {
        setBudget(category, value);
        delete timersRef.current[category];
      }, 500);
      // 낙관적 업데이트: 즉시 스토어에도 반영 (타이핑 중 UI 깜빡임 방지)
      setBudget(category, value);
    },
    [setBudget],
  );

  /** 파일 드롭 핸들러 */
  const handleFileDrop = useCallback(
    async (file: File) => {
      setImportDone(false);
      try {
        await importFile(file);
      } catch {
        // error 상태는 훅 내부에서 관리
      }
    },
    [importFile],
  );

  /** Import 확정 */
  const handleConfirmImport = useCallback(() => {
    confirmImport(importMode);
    setImportDone(true);
  }, [confirmImport, importMode]);

  /** 예산 초기화 확정 */
  const handleResetBudgets = useCallback(() => {
    resetToDefaults();
    setShowResetBudgetDialog(false);
  }, [resetToDefaults]);

  /** 데이터 초기화 확정 */
  const handleClearData = useCallback(() => {
    clearTransactions();
    reset();
    setImportDone(false);
    setShowClearDataDialog(false);
  }, [clearTransactions, reset]);

  // --- 예산 합계 계산 ---
  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);

  return (
    <div className="pb-28 space-y-6">
      {/* 헤더 */}
      <h1 className="text-xl font-bold text-text-primary pt-2">설정</h1>

      {/* ========== 예산 설정 ========== */}
      <section>
        <SectionHeader
          title="예산 설정"
          rightLabel="초기화"
          onRightClick={() => setShowResetBudgetDialog(true)}
        />

        {/* 합계 표시 */}
        <Card className="mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">월 예산 합계</span>
            <span className="text-base font-bold text-text-primary">
              {formatKRW(totalBudget)}
            </span>
          </div>
        </Card>

        {/* 17개 카테고리 예산 리스트 */}
        <div className="space-y-2">
          {EXPENSE_CATEGORY_LIST.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <Card key={cat} className="flex items-center gap-3">
                <CategoryIcon category={cat} size="sm" />
                <span className="text-sm font-medium text-text-primary min-w-[72px]">
                  {meta.name}
                </span>
                <div className="flex-1">
                  <NumberInput
                    value={budgets[cat]}
                    onChange={(v) => handleBudgetChange(cat, v)}
                    suffix="원"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========== 카테고리 관리 ========== */}
      <section>
        <SectionHeader title="카테고리" />
        <Button variant="secondary" fullWidth onClick={() => navigate('/categories')}>
          카테고리 관리
        </Button>
      </section>

      {/* 구분선 */}
      <hr className="border-border-primary" />

      {/* ========== 보안 설정 ========== */}
      <section className="space-y-3">
        <SectionHeader title="보안" />

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary font-medium">PIN 잠금</p>
              <p className="text-xs text-text-tertiary">앱 접속 시 PIN 입력 필요</p>
            </div>
            <Badge text={pinHash ? '설정됨' : '미설정'} color={pinHash ? 'green' : 'gray'} />
          </div>

          {!showPinSetup ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowPinSetup(true); setNewPin(''); setConfirmPin(''); setPinError(''); }}
              >
                {pinHash ? 'PIN 변경' : 'PIN 설정'}
              </Button>
              {pinHash && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { setPinHash(null); }}
                >
                  PIN 해제
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => { setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); setPinError(''); }}
                placeholder="새 PIN (4자리)"
                className="w-full bg-bg-input border border-border-primary rounded-[12px] px-4 py-3 text-text-primary focus:border-accent outline-none transition-colors"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => { setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); setPinError(''); }}
                placeholder="PIN 확인"
                className="w-full bg-bg-input border border-border-primary rounded-[12px] px-4 py-3 text-text-primary focus:border-accent outline-none transition-colors"
              />
              {pinError && <p className="text-xs text-expense">{pinError}</p>}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    if (newPin.length !== 4) { setPinError('PIN은 4자리여야 합니다'); return; }
                    if (newPin !== confirmPin) { setPinError('PIN이 일치하지 않습니다'); return; }
                    const hash = await hashPin(newPin);
                    setPinHash(hash);
                    setShowPinSetup(false);
                    setNewPin('');
                    setConfirmPin('');
                  }}
                >
                  저장
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowPinSetup(false)}>
                  취소
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* 구분선 */}
      <hr className="border-border-primary" />

      {/* ========== 데이터 관리 ========== */}
      <section className="space-y-4">
        <SectionHeader title="데이터 관리" />

        {/* 엑셀 파일 업로드 */}
        <DropZone onFileDrop={handleFileDrop} />

        {/* 파싱 중 스피너 */}
        {isImporting && (
          <div className="flex justify-center py-6">
            <Spinner size="md" />
          </div>
        )}

        {/* 파싱 에러 */}
        {error && (
          <Card className="border border-expense/30">
            <p className="text-sm text-expense">{error}</p>
          </Card>
        )}

        {/* 파싱 결과 미리보기 */}
        {result && !isImporting && !importDone && (
          <Card className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">
                {result.stats.parsedRows}건 거래 파싱 완료
                {result.stats.dateRange && (
                  <span className="text-text-secondary">
                    {' '}
                    ({result.stats.dateRange.earliest} ~{' '}
                    {result.stats.dateRange.latest})
                  </span>
                )}
              </p>

              {result.stats.assetCount > 0 && (
                <Badge
                  text={`자산 ${result.stats.assetCount}건 감지`}
                  color="blue"
                />
              )}

              {result.stats.skippedRows > 0 && (
                <Badge
                  text={`${result.stats.skippedRows}건 스킵`}
                  color="yellow"
                />
              )}

              {/* 에러/경고 표시 */}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <p
                      key={i}
                      className={`text-xs ${
                        err.severity === 'error'
                          ? 'text-expense'
                          : 'text-progress-warning'
                      }`}
                    >
                      [{err.sheet}
                      {err.row ? ` row ${err.row}` : ''}] {err.message}
                    </p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs text-text-tertiary">
                      ...외 {result.errors.length - 5}건
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 병합/교체 토글 */}
            <ToggleGroup
              options={[
                { label: '기존 데이터에 병합', value: 'merge' },
                { label: '기존 데이터 교체', value: 'replace' },
              ]}
              selected={importMode}
              onChange={(v) => setImportMode(v as 'merge' | 'replace')}
            />

            {/* Import 확인 버튼 */}
            <Button
              variant="primary"
              fullWidth
              onClick={handleConfirmImport}
              disabled={result.stats.parsedRows === 0 && result.stats.assetCount === 0}
            >
              Import 확인 (거래 {result.stats.parsedRows}건{result.stats.assetCount > 0 ? ` + 자산 ${result.stats.assetCount}건` : ''})
            </Button>
          </Card>
        )}

        {/* Import 성공 메시지 */}
        {importDone && result && (
          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge text="완료" color="green" />
              <p className="text-sm text-text-primary">
                {result.stats.parsedRows}건 거래를{' '}
                {importMode === 'merge' ? '병합' : '교체'}했습니다.
              </p>
            </div>
            {result.stats.assetCount > 0 && (
              <p className="text-xs text-text-secondary">
                자산 {result.stats.assetCount}건 자동 동기화 완료
              </p>
            )}
          </Card>
        )}

        {/* 구분선 */}
        <hr className="border-border-primary" />

        {/* 현재 데이터 정보 */}
        <Card>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">
              저장된 거래 데이터
            </span>
            <span className="text-sm font-medium text-text-primary">
              {transactions.length}건
            </span>
          </div>
        </Card>

        {/* 데이터 초기화 버튼 */}
        <Button
          variant="danger"
          fullWidth
          onClick={() => setShowClearDataDialog(true)}
          disabled={transactions.length === 0}
        >
          데이터 초기화
        </Button>
      </section>

      {/* ========== 다이얼로그 ========== */}
      <ConfirmDialog
        isOpen={showResetBudgetDialog}
        title="예산 초기화"
        message="모든 카테고리의 예산을 기본값으로 되돌립니다. 계속하시겠습니까?"
        confirmLabel="초기화"
        onConfirm={handleResetBudgets}
        onCancel={() => setShowResetBudgetDialog(false)}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showClearDataDialog}
        title="데이터 초기화"
        message={`저장된 ${transactions.length}건의 거래 데이터를 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        onConfirm={handleClearData}
        onCancel={() => setShowClearDataDialog(false)}
        variant="danger"
      />
    </div>
  );
}
