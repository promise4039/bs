// 설정 페이지 — 뱅크샐러드 스타일 예산 설정 + 데이터 관리 (엑셀 import, 초기화)
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Badge,
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

// localStorage에서 앱 데이터를 모두 내보내기
const ALL_STORAGE_KEYS = [
  'bs_transactions',
  'bs_budget_config',
  'bs_sinking_fund',
  'bs_last_import',
  'bs_ui_state',
  'bs_assets',
  'bs_auth',
  'bs_categories',
];

function exportAllData() {
  const data: Record<string, unknown> = {};
  for (const key of ALL_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gagebu_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importAllData(file: File): Promise<{ keys: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (typeof data !== 'object' || data === null) {
          reject(new Error('올바른 백업 파일이 아닙니다'));
          return;
        }
        let count = 0;
        for (const key of ALL_STORAGE_KEYS) {
          if (key in data) {
            localStorage.setItem(
              key,
              typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]),
            );
            count++;
          }
        }
        resolve({ keys: count });
      } catch {
        reject(new Error('JSON 파싱에 실패했습니다'));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다'));
    reader.readAsText(file);
  });
}

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

  // --- JSON 내보내기/가져오기 ---
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleJsonImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { keys } = await importAllData(file);
      setSyncMessage({ type: 'success', text: `${keys}개 항목 복원 완료. 페이지를 새로고침합니다...` });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setSyncMessage({ type: 'error', text: (err as Error).message });
    }
    // input 초기화
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  }, []);

  // --- 예산 합계 계산 ---
  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);

  return (
    <div className="pb-28 animate-fade-in">
      {/* ========== 헤더 ========== */}
      <div className="pt-2 pb-5 px-1">
        <h1 className="text-[22px] font-bold text-text-primary tracking-tight">설정</h1>
      </div>

      <div className="space-y-6">
        {/* ================================================================ */}
        {/* 예산 설정 섹션                                                    */}
        {/* ================================================================ */}
        <section>
          <div className="flex justify-between items-center px-1 mb-3">
            <h2 className="text-[15px] font-semibold text-text-primary">예산 설정</h2>
            <button
              className="text-[13px] text-expense cursor-pointer hover:text-expense/80 transition-colors bg-transparent border-none"
              onClick={() => setShowResetBudgetDialog(true)}
            >
              초기화
            </button>
          </div>

          {/* 합계 배너 */}
          <Card className="mb-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-text-secondary">월 예산 합계</span>
              <span className="text-[18px] font-bold text-text-primary tabular-nums">
                {formatKRW(totalBudget)}
              </span>
            </div>
          </Card>

          {/* 17개 카테고리 예산 리스트 */}
          <Card className="!p-0">
            <div className="divide-y divide-border-primary/40">
              {EXPENSE_CATEGORY_LIST.map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat} className="flex items-center gap-3 px-4 py-3.5 first:rounded-t-[16px] last:rounded-b-[16px]">
                    <CategoryIcon category={cat} size="sm" />
                    <span className="text-[14px] font-medium text-text-primary min-w-[72px]">
                      {meta.name}
                    </span>
                    <div className="flex-1">
                      <NumberInput
                        value={budgets[cat]}
                        onChange={(v) => handleBudgetChange(cat, v)}
                        suffix="원"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* ================================================================ */}
        {/* 카테고리 관리                                                      */}
        {/* ================================================================ */}
        <section>
          <Card
            onClick={() => navigate('/categories')}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-[18px]">🏷</span>
              <div>
                <p className="text-[14px] font-medium text-text-primary">카테고리 관리</p>
                <p className="text-[12px] text-text-tertiary">소분류 편집, 추가, 삭제</p>
              </div>
            </div>
            <span className="text-text-tertiary text-[16px]">&rsaquo;</span>
          </Card>
        </section>

        {/* ================================================================ */}
        {/* 보안 설정                                                         */}
        {/* ================================================================ */}
        <section>
          <div className="flex justify-between items-center px-1 mb-3">
            <h2 className="text-[15px] font-semibold text-text-primary">보안</h2>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-[18px]">🔒</span>
                <div>
                  <p className="text-[14px] text-text-primary font-medium">PIN 잠금</p>
                  <p className="text-[12px] text-text-tertiary">앱 접속 시 PIN 입력 필요</p>
                </div>
              </div>
              <Badge text={pinHash ? '설정됨' : '미설정'} color={pinHash ? 'green' : 'gray'} />
            </div>

            {!showPinSetup ? (
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 text-[13px] font-medium rounded-[12px] bg-bg-elevated text-text-secondary border border-border-secondary hover:bg-bg-card-hover transition-colors cursor-pointer"
                  onClick={() => { setShowPinSetup(true); setNewPin(''); setConfirmPin(''); setPinError(''); }}
                >
                  {pinHash ? 'PIN 변경' : 'PIN 설정'}
                </button>
                {pinHash && (
                  <button
                    className="flex-1 py-2.5 text-[13px] font-medium rounded-[12px] bg-expense/10 text-expense border border-expense/20 hover:bg-expense/20 transition-colors cursor-pointer"
                    onClick={() => { setPinHash(null); }}
                  >
                    PIN 해제
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 mt-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => { setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); setPinError(''); }}
                  placeholder="새 PIN (4자리)"
                  className="w-full bg-bg-input border border-border-primary rounded-[12px] px-4 py-3 text-[14px] text-text-primary placeholder:text-text-placeholder focus:border-accent outline-none transition-colors"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => { setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); setPinError(''); }}
                  placeholder="PIN 확인"
                  className="w-full bg-bg-input border border-border-primary rounded-[12px] px-4 py-3 text-[14px] text-text-primary placeholder:text-text-placeholder focus:border-accent outline-none transition-colors"
                />
                {pinError && <p className="text-[12px] text-expense px-1">{pinError}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    className="flex-1 py-2.5 text-[13px] font-semibold rounded-[12px] bg-accent text-white transition-colors hover:bg-accent-hover cursor-pointer border-none"
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
                  </button>
                  <button
                    className="flex-1 py-2.5 text-[13px] font-medium rounded-[12px] bg-bg-elevated text-text-secondary border border-border-secondary hover:bg-bg-card-hover transition-colors cursor-pointer"
                    onClick={() => setShowPinSetup(false)}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* ================================================================ */}
        {/* 기기 간 동기화                                                     */}
        {/* ================================================================ */}
        <section>
          <div className="flex justify-between items-center px-1 mb-3">
            <h2 className="text-[15px] font-semibold text-text-primary">기기 간 동기화</h2>
          </div>

          <Card className="space-y-3">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[18px]">🔄</span>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                PC에서 데이터를 내보내고, 스마트폰에서 가져오면 동일한 데이터를 사용할 수 있습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-3 text-[13px] font-medium rounded-[12px] bg-bg-elevated text-text-secondary border border-border-secondary hover:bg-bg-card-hover transition-colors cursor-pointer"
                onClick={exportAllData}
              >
                내보내기 (JSON)
              </button>
              <button
                className="flex-1 py-3 text-[13px] font-semibold rounded-[12px] bg-accent text-white border-none hover:bg-accent-hover transition-colors cursor-pointer"
                onClick={() => jsonInputRef.current?.click()}
              >
                가져오기
              </button>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleJsonImport}
              />
            </div>
            {syncMessage && (
              <p className={`text-[12px] px-1 ${syncMessage.type === 'success' ? 'text-income' : 'text-expense'}`}>
                {syncMessage.text}
              </p>
            )}
          </Card>
        </section>

        {/* ================================================================ */}
        {/* 데이터 관리                                                        */}
        {/* ================================================================ */}
        <section>
          <div className="flex justify-between items-center px-1 mb-3">
            <h2 className="text-[15px] font-semibold text-text-primary">데이터 관리</h2>
          </div>

          <div className="space-y-3">
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
                <p className="text-[13px] text-expense">{error}</p>
              </Card>
            )}

            {/* 파싱 결과 미리보기 */}
            {result && !isImporting && !importDone && (
              <Card className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[14px] font-medium text-text-primary">
                    {result.stats.parsedRows}건 거래 파싱 완료
                    {result.stats.dateRange && (
                      <span className="text-text-secondary">
                        {' '}
                        ({result.stats.dateRange.earliest} ~{' '}
                        {result.stats.dateRange.latest})
                      </span>
                    )}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
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
                  </div>

                  {/* 에러/경고 표시 */}
                  {result.errors.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <p
                          key={i}
                          className={`text-[11px] ${
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
                        <p className="text-[11px] text-text-tertiary">
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
                  compact
                />

                {/* Import 확인 버튼 */}
                <button
                  className="w-full py-3 text-[14px] font-semibold rounded-[12px] bg-accent text-white border-none hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleConfirmImport}
                  disabled={result.stats.parsedRows === 0 && result.stats.assetCount === 0}
                >
                  Import 확인 (거래 {result.stats.parsedRows}건{result.stats.assetCount > 0 ? ` + 자산 ${result.stats.assetCount}건` : ''})
                </button>
              </Card>
            )}

            {/* Import 성공 메시지 */}
            {importDone && result && (
              <Card className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge text="완료" color="green" />
                  <p className="text-[13px] text-text-primary">
                    {result.stats.parsedRows}건 거래를{' '}
                    {importMode === 'merge' ? '병합' : '교체'}했습니다.
                  </p>
                </div>
                {result.stats.assetCount > 0 && (
                  <p className="text-[12px] text-text-secondary">
                    자산 {result.stats.assetCount}건 자동 동기화 완료
                  </p>
                )}
              </Card>
            )}

            {/* 현재 데이터 정보 */}
            <Card>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="text-[16px]">💾</span>
                  <span className="text-[13px] text-text-secondary">저장된 거래 데이터</span>
                </div>
                <span className="text-[14px] font-semibold text-text-primary tabular-nums">
                  {transactions.length.toLocaleString('ko-KR')}건
                </span>
              </div>
            </Card>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 위험 영역                                                          */}
        {/* ================================================================ */}
        <section>
          <div className="flex justify-between items-center px-1 mb-3">
            <h2 className="text-[15px] font-semibold text-expense">위험 영역</h2>
          </div>

          <Card className="border border-expense/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[18px]">⚠️</span>
                <div>
                  <p className="text-[14px] font-medium text-text-primary">데이터 초기화</p>
                  <p className="text-[12px] text-text-tertiary">모든 거래 데이터를 삭제합니다</p>
                </div>
              </div>
              <button
                className="px-4 py-2 text-[13px] font-semibold rounded-[12px] bg-expense/15 text-expense border border-expense/30 hover:bg-expense/25 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={() => setShowClearDataDialog(true)}
                disabled={transactions.length === 0}
              >
                초기화
              </button>
            </div>
          </Card>
        </section>
      </div>

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
