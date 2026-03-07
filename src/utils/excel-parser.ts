// 뱅크샐러드 엑셀 파싱 유틸리티
// SheetJS(xlsx)를 사용하여 뱅크샐러드 내보내기 엑셀을 파싱한다.

import * as XLSX from 'xlsx';
import type { Transaction, TransactionType } from '../types/transaction';
import type { Asset, InvestmentHolding } from '../types/asset';
import type {
  RawTransactionRow,
  MonthlyOverviewData,
  ParseError,
  ExcelParseResult,
} from '../types/excel';

// ─── 헬퍼 함수 ───────────────────────────────────────────────

/**
 * 거래 고유 ID 생성
 * date+time+amount+content를 btoa로 인코딩하여 충돌 최소화
 */
function generateTransactionId(
  date: string,
  time: string,
  amount: number,
  content: string
): string {
  const raw = `${date}|${time}|${amount}|${content}`;
  return btoa(encodeURIComponent(raw));
}

/**
 * 날짜 정규화
 * Date 객체, Excel serial number, 문자열 등을 "YYYY-MM-DD" 형식으로 변환
 */
function normalizeDate(raw: string | number | Date): string {
  // Date 객체
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) {
      throw new Error(`유효하지 않은 Date 객체`);
    }
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Excel serial number (숫자)
  if (typeof raw === 'number') {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (!parsed || parsed.y === 0) {
      throw new Error(`Excel 시리얼 넘버 파싱 실패: ${raw}`);
    }
    const y = parsed.y;
    const m = String(parsed.m).padStart(2, '0');
    const d = String(parsed.d).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 문자열
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    // "YYYY-MM-DD" 형식 검증
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    // "YYYY/MM/DD" 형식도 허용
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
      return trimmed.replace(/\//g, '-');
    }
    // "YYYY.MM.DD" 형식도 허용
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(trimmed)) {
      return trimmed.replace(/\./g, '-');
    }
    throw new Error(`인식할 수 없는 날짜 형식: "${trimmed}"`);
  }

  throw new Error(`지원하지 않는 날짜 타입: ${typeof raw}`);
}

/**
 * 시간 정규화
 * Date 객체에서 시간 부분 추출하거나, 문자열 그대로 반환
 */
function normalizeTime(raw: unknown): string {
  if (raw instanceof Date) {
    const h = String(raw.getHours()).padStart(2, '0');
    const m = String(raw.getMinutes()).padStart(2, '0');
    const s = String(raw.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  if (typeof raw === 'string') {
    return raw.trim();
  }
  // 숫자인 경우 (Excel 시간 serial: 0~1 범위)
  if (typeof raw === 'number') {
    const totalSeconds = Math.round(raw * 86400);
    const h = String(Math.floor(totalSeconds / 3600) % 24).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return '00:00:00';
}

/**
 * 시트명 퍼지 탐색
 * 목표 키워드를 포함하는 시트명을 찾는다
 */
function findSheetName(
  sheetNames: string[],
  keywords: string[]
): string | null {
  // 정확한 이름 매칭 우선
  for (const name of sheetNames) {
    for (const kw of keywords) {
      if (name === kw) return name;
    }
  }
  // 키워드 포함 매칭
  for (const name of sheetNames) {
    for (const kw of keywords) {
      if (name.includes(kw)) return name;
    }
  }
  return null;
}

/**
 * 셀 값 읽기 헬퍼
 */
function getCellValue(
  worksheet: XLSX.WorkSheet,
  col: number,
  row: number
): unknown {
  const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
  const cell = worksheet[cellAddress];
  return cell ? cell.v : undefined;
}

/**
 * 셀 값을 숫자로 읽기
 */
function getCellNumber(
  worksheet: XLSX.WorkSheet,
  col: number,
  row: number
): number {
  const val = getCellValue(worksheet, col, row);
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

/**
 * 셀 값을 문자열로 읽기
 */
function getCellString(
  worksheet: XLSX.WorkSheet,
  col: number,
  row: number
): string {
  const val = getCellValue(worksheet, col, row);
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

// ─── 메인 파싱 함수 ──────────────────────────────────────────

/**
 * 메인 진입점: 뱅크샐러드 엑셀 파일을 파싱한다
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  const errors: ParseError[] = [];

  // File → ArrayBuffer를 Promise로 래핑
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });

  // 엑셀 파싱
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  // 거래 내역 시트 탐색
  const txSheetName = findSheetName(workbook.SheetNames, [
    '가계부 내역',
    '가계부내역',
    '가계부',
    '내역',
  ]);

  // 월별 현황 시트 탐색
  const ovSheetName = findSheetName(workbook.SheetNames, [
    '뱅샐현황',
    '현황',
    '월별현황',
  ]);

  // 거래 내역 파싱
  let transactions: Transaction[] = [];
  let assets: Asset[] = [];
  let stats: ExcelParseResult['stats'] = {
    totalRows: 0,
    parsedRows: 0,
    skippedRows: 0,
    dateRange: null,
    assetCount: 0,
  };

  if (txSheetName) {
    const txSheet = workbook.Sheets[txSheetName];
    const result = parseTransactionSheet(txSheet);
    transactions = result.transactions;
    errors.push(...result.errors);

    // 통계 계산
    stats.totalRows = result.totalRows;
    stats.parsedRows = transactions.length;
    stats.skippedRows = result.totalRows - transactions.length;

    if (transactions.length > 0) {
      const dates = transactions.map((t) => t.date).sort();
      stats.dateRange = {
        earliest: dates[0],
        latest: dates[dates.length - 1],
      };
    }
  } else {
    errors.push({
      sheet: '(없음)',
      message: `거래 내역 시트를 찾을 수 없습니다. 시트 목록: [${workbook.SheetNames.join(', ')}]`,
      severity: 'error',
    });
  }

  // 월별 현황 파싱
  let overview: MonthlyOverviewData | null = null;

  if (ovSheetName) {
    const ovSheet = workbook.Sheets[ovSheetName];
    const result = parseOverviewSheet(ovSheet);
    overview = result.overview;
    errors.push(...result.errors);

    // 자산 파싱 (재무현황 + 투자현황 + 대출현황)
    const assetResult = parseAssetsFromOverview(ovSheet);
    assets = assetResult.assets;
    stats.assetCount = assets.length;
    errors.push(...assetResult.errors);
  } else {
    errors.push({
      sheet: '(없음)',
      message: `월별 현황 시트를 찾을 수 없습니다. 시트 목록: [${workbook.SheetNames.join(', ')}]`,
      severity: 'warning',
    });
  }

  return { transactions, overview, assets, errors, stats };
}

/**
 * 가계부 내역 시트를 파싱하여 Transaction 배열로 변환
 */
export function parseTransactionSheet(worksheet: XLSX.WorkSheet): {
  transactions: Transaction[];
  errors: ParseError[];
  totalRows: number;
} {
  const errors: ParseError[] = [];
  const transactions: Transaction[] = [];

  // sheet_to_json으로 행 배열 변환
  const rows = XLSX.utils.sheet_to_json<RawTransactionRow>(worksheet, {
    defval: '',
  });

  const totalRows = rows.length;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 엑셀 기준 행 번호 (헤더=1행, 데이터=2행~)

    // 빈 행 skip (금액이 없거나 0인 경우)
    if (row.금액 === undefined || row.금액 === null || row.금액 === 0) {
      continue;
    }
    // 금액이 문자열인 경우 숫자 변환 시도
    const rawAmount = Number(row.금액);
    if (isNaN(rawAmount) || rawAmount === 0) {
      continue;
    }

    // 날짜 파싱
    let date: string;
    try {
      if (!row.날짜 && row.날짜 !== 0) {
        // 날짜 없으면 skip
        continue;
      }
      date = normalizeDate(row.날짜 as string | number | Date);
    } catch (e) {
      errors.push({
        sheet: '가계부 내역',
        row: rowNum,
        column: '날짜',
        message: `날짜 파싱 실패: ${e instanceof Error ? e.message : String(e)}`,
        severity: 'warning',
      });
      continue;
    }

    // 시간 파싱
    const time = normalizeTime(row.시간);

    // 타입 검증
    const rawType = String(row.타입 || '').trim();
    if (rawType !== '수입' && rawType !== '지출') {
      errors.push({
        sheet: '가계부 내역',
        row: rowNum,
        column: '타입',
        message: `알 수 없는 거래 타입: "${rawType}" (수입/지출만 허용)`,
        severity: 'warning',
      });
      continue;
    }
    const type: TransactionType = rawType;

    // 금액: 항상 양수로 변환 (지출은 원본이 음수)
    const amount = Math.abs(rawAmount);

    // 나머지 필드
    const category = String(row.대분류 || '').trim() || '미분류';
    const subcategory = String(row.소분류 || '').trim() || '';
    const content = String(row.내용 || '').trim() || '';
    const currency = String(row.화폐 || 'KRW').trim();
    const paymentMethod = String(row.결제수단 || '').trim() || '';
    const memo = row.메모 ? String(row.메모).trim() : null;

    // ID 생성
    const id = generateTransactionId(date, time, amount, content);

    transactions.push({
      id,
      date,
      time,
      type,
      category,
      subcategory,
      content,
      amount,
      currency,
      paymentMethod,
      memo,
    });
  }

  return { transactions, errors, totalRows };
}

/**
 * 뱅샐현황 시트를 파싱하여 월별 수입/지출 요약 데이터로 변환
 *
 * 고정 레이아웃 기반이지만, A열에서 "월수입", "월지출", "순수입" 텍스트를
 * 동적으로 탐색하여 행 번호를 감지한다.
 */
export function parseOverviewSheet(worksheet: XLSX.WorkSheet): {
  overview: MonthlyOverviewData;
  errors: ParseError[];
} {
  const errors: ParseError[] = [];

  // 시트 범위 파악
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const maxRow = range.e.r;
  const maxCol = range.e.c;

  // ── 1단계: 주요 행 위치 동적 탐색 ──
  // A열을 스캔하여 "월수입", "월지출", "순수입" 행을 찾는다
  let monthHeaderRow = -1;
  let totalIncomeRow = -1;
  let totalExpenseRow = -1;
  let netIncomeRow = -1;

  for (let r = 0; r <= maxRow; r++) {
    const cellVal = getCellString(worksheet, 0, r);

    if (cellVal.includes('월수입')) {
      totalIncomeRow = r;
      // 월 헤더는 월수입 행 기준으로 위쪽에서 탐색
      // 일반적으로 수입 카테고리들 시작 전의 헤더 행
    } else if (cellVal.includes('월지출')) {
      totalExpenseRow = r;
    } else if (cellVal.includes('순수입')) {
      netIncomeRow = r;
    }
  }

  // 월 헤더 행 탐색: totalIncomeRow 위로 올라가면서 날짜 형식 헤더를 찾는다
  if (totalIncomeRow > 0) {
    for (let r = totalIncomeRow - 1; r >= 0; r--) {
      // B열(col=1)에서 날짜 형식(YYYY-MM 또는 YYYY.MM 등) 확인
      const val = getCellString(worksheet, 1, r);
      if (/\d{4}[-./]\d{2}/.test(val)) {
        monthHeaderRow = r;
        break;
      }
      // Date 객체일 수도 있으므로 원본 셀 값도 확인
      const rawVal = getCellValue(worksheet, 1, r);
      if (rawVal instanceof Date) {
        monthHeaderRow = r;
        break;
      }
    }
  }

  // 폴백: 고정 위치 (0-indexed row 10 = 엑셀 11행)
  if (monthHeaderRow === -1) monthHeaderRow = 10;
  if (totalIncomeRow === -1) totalIncomeRow = 19;
  if (totalExpenseRow === -1) totalExpenseRow = 37;
  if (netIncomeRow === -1) netIncomeRow = 38;

  // ── 2단계: 월 헤더 파싱 ──
  const months: string[] = [];
  const monthCols: number[] = []; // 각 월에 해당하는 컬럼 인덱스

  for (let c = 1; c <= maxCol; c++) {
    const rawVal = getCellValue(worksheet, c, monthHeaderRow);
    let monthStr = '';

    if (rawVal instanceof Date) {
      const y = rawVal.getFullYear();
      const m = String(rawVal.getMonth() + 1).padStart(2, '0');
      monthStr = `${y}-${m}`;
    } else if (typeof rawVal === 'string') {
      const trimmed = rawVal.trim();
      // "YYYY-MM" 또는 "YYYY.MM" 등
      const match = trimmed.match(/(\d{4})[-./](\d{1,2})/);
      if (match) {
        monthStr = `${match[1]}-${match[2].padStart(2, '0')}`;
      }
    } else if (typeof rawVal === 'number') {
      // Excel serial number일 수 있음
      try {
        const parsed = XLSX.SSF.parse_date_code(rawVal);
        if (parsed && parsed.y > 2000) {
          monthStr = `${parsed.y}-${String(parsed.m).padStart(2, '0')}`;
        }
      } catch {
        // 무시
      }
    }

    if (monthStr) {
      months.push(monthStr);
      monthCols.push(c);
    }
  }

  if (months.length === 0) {
    errors.push({
      sheet: '뱅샐현황',
      row: monthHeaderRow + 1,
      message: '월 헤더를 찾을 수 없습니다',
      severity: 'error',
    });
    return {
      overview: {
        months: [],
        income: {},
        expense: {},
        totalIncome: {},
        totalExpense: {},
        netIncome: {},
      },
      errors,
    };
  }

  // ── 3단계: 수입 카테고리 파싱 ──
  // monthHeaderRow+1 ~ totalIncomeRow-1 이 수입 카테고리 행
  const income: Record<string, Record<string, number>> = {};
  const incomeStartRow = monthHeaderRow + 1;

  for (let r = incomeStartRow; r < totalIncomeRow; r++) {
    const categoryName = getCellString(worksheet, 0, r);
    if (!categoryName) continue;

    income[categoryName] = {};
    for (let mi = 0; mi < months.length; mi++) {
      const val = getCellNumber(worksheet, monthCols[mi], r);
      income[categoryName][months[mi]] = val;
    }
  }

  // ── 4단계: 지출 카테고리 파싱 ──
  // totalIncomeRow+1 ~ totalExpenseRow-1 이 지출 카테고리 행
  const expense: Record<string, Record<string, number>> = {};
  const expenseStartRow = totalIncomeRow + 1;

  for (let r = expenseStartRow; r < totalExpenseRow; r++) {
    const categoryName = getCellString(worksheet, 0, r);
    if (!categoryName) continue;

    expense[categoryName] = {};
    for (let mi = 0; mi < months.length; mi++) {
      const val = getCellNumber(worksheet, monthCols[mi], r);
      expense[categoryName][months[mi]] = Math.abs(val);
    }
  }

  // ── 5단계: 총계 행 파싱 ──
  const totalIncome: Record<string, number> = {};
  const totalExpense: Record<string, number> = {};
  const netIncome: Record<string, number> = {};

  for (let mi = 0; mi < months.length; mi++) {
    const month = months[mi];
    const col = monthCols[mi];

    totalIncome[month] = getCellNumber(worksheet, col, totalIncomeRow);
    totalExpense[month] = Math.abs(getCellNumber(worksheet, col, totalExpenseRow));
    netIncome[month] = getCellNumber(worksheet, col, netIncomeRow);
  }

  return {
    overview: {
      months,
      income,
      expense,
      totalIncome,
      totalExpense,
      netIncome,
    },
    errors,
  };
}

// ─── 자산 파싱 ──────────────────────────────────────────────

/** 상품명에서 기관명 추론 */
function inferInstitution(name: string): string {
  if (/^KB|국민/i.test(name)) return '국민은행';
  if (/^NH|농협|올바른/.test(name)) return 'NH농협';
  if (/토스뱅크/.test(name)) return '토스뱅크';
  if (/토스증권|토스머니/.test(name)) return '토스';
  if (/카카오/.test(name)) return '카카오';
  if (/네이버/.test(name)) return '네이버';
  if (/삼성/.test(name)) return '삼성';
  if (/신한/.test(name)) return '신한';
  if (/하나/.test(name)) return '하나';
  if (/우리/.test(name)) return '우리은행';
  if (/보통예탁금|종합계좌|기본계좌|옵션계좌/.test(name)) return '증권사';
  if (/입출금통장/.test(name)) return '은행';
  if (/저축예금/.test(name)) return '은행';
  return '';
}

/** 자산 ID 생성 (이름+행 기반, 동명 계좌 구분) */
function generateAssetId(type: string, name: string, rowIndex?: number): string {
  const suffix = rowIndex !== undefined ? `_r${rowIndex}` : '';
  return `bs_${type}_${btoa(encodeURIComponent(name))}${suffix}`;
}

/** Excel serial number를 YYYY-MM-DD 문자열로 변환 */
function excelDateToString(serial: unknown): string | undefined {
  if (serial === undefined || serial === null || serial === '') return undefined;
  if (typeof serial === 'number') {
    const parsed = XLSX.SSF.parse_date_code(serial);
    if (parsed && parsed.y > 2000) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  if (serial instanceof Date && !isNaN(serial.getTime())) {
    const y = serial.getFullYear();
    const m = String(serial.getMonth() + 1).padStart(2, '0');
    const d = String(serial.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof serial === 'string' && /\d{4}[-./]\d{2}[-./]\d{2}/.test(serial)) {
    return serial.replace(/[./]/g, '-');
  }
  return undefined;
}

/**
 * 뱅샐현황 시트에서 자산(계좌, 페이, 투자, 대출) 목록을 파싱한다.
 *
 * 섹션 구조:
 * - 3.재무현황: 자유입출금 자산, 전자금융 자산, 투자성 자산, 부채
 * - 5.투자현황: 투자 종목 상세 (원금, 평가금, 수익률)
 * - 6.대출현황: 대출 상세 (원금, 잔액, 금리, 시작/만기일)
 */
export function parseAssetsFromOverview(worksheet: XLSX.WorkSheet): {
  assets: Asset[];
  errors: ParseError[];
} {
  const errors: ParseError[] = [];
  const assets: Asset[] = [];
  const holdingsMap = new Map<string, InvestmentHolding>(); // 종목명 → 상세 정보

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const maxRow = range.e.r;

  // ── 섹션 헤더 행 탐색 ──
  let financeRow = -1;  // 3.재무현황
  let investRow = -1;   // 5.투자현황
  let loanRow = -1;     // 6.대출현황

  for (let r = 0; r <= maxRow; r++) {
    const val = getCellString(worksheet, 1, r); // B열
    if (val.includes('3.재무현황')) financeRow = r;
    else if (val.includes('5.투자현황')) investRow = r;
    else if (val.includes('6.대출현황')) loanRow = r;
  }

  // ── 5.투자현황 파싱 (먼저 파싱하여 holdingsMap 구성) ──
  // 컬럼: B(1)=투자상품종류 C(2)=금융사 D(3)=상품명 E(4)=빈 F(5)=투자원금 G(6)=평가금액
  if (investRow >= 0) {
    for (let r = investRow + 3; r <= maxRow; r++) {
      if (getCellString(worksheet, 1, r) === '총계') break;

      const broker = getCellString(worksheet, 2, r);
      const name = getCellString(worksheet, 3, r);
      if (!name) continue;

      const costBasis = getCellNumber(worksheet, 5, r);
      const currentValue = getCellNumber(worksheet, 6, r);

      holdingsMap.set(name, {
        id: `holding_${btoa(encodeURIComponent(name))}`,
        name,
        broker: broker || '증권사',
        avgPrice: costBasis,
        quantity: 1, // 뱅크샐러드는 수량 미제공, 1로 설정
        currentPrice: currentValue,
      });
    }
  }

  // ── 6.대출현황 파싱 ──
  // 컬럼: B(1)=대출종류 C(2)=금융사 D(3)=상품명 E(4)=빈 F(5)=대출원금 G(6)=대출잔액 H(7)=대출금리 I(8)=신규일 J(9)=만기일
  if (loanRow >= 0) {
    for (let r = loanRow + 3; r <= maxRow; r++) {
      if (getCellString(worksheet, 1, r) === '총계') break;

      const institution = getCellString(worksheet, 2, r);
      const name = getCellString(worksheet, 3, r);
      if (!name) continue;

      const principal = getCellNumber(worksheet, 5, r);
      const balance = getCellNumber(worksheet, 6, r);
      const rate = getCellNumber(worksheet, 7, r);
      const startDate = excelDateToString(getCellValue(worksheet, 8, r));
      const maturityDate = excelDateToString(getCellValue(worksheet, 9, r));

      // 대출 기간 계산
      let termMonths: number | undefined;
      if (startDate && maturityDate) {
        const start = new Date(startDate);
        const end = new Date(maturityDate);
        termMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      }

      assets.push({
        id: generateAssetId('loan', name),
        type: 'loan',
        name,
        institution: institution || inferInstitution(name),
        balance: -balance, // 대출은 음수
        loanPrincipal: principal,
        loanRate: rate,
        loanStartDate: startDate,
        maturityDate: maturityDate,
        loanTermMonths: termMonths,
        repaymentMethod: 'equal_principal', // 기본값
      });
    }
  }

  // ── 3.재무현황 파싱 ──
  // 컬럼: B(1)=항목(섹션) C(2)=상품명 D(3)=빈 E(4)=금액
  if (financeRow >= 0) {
    let currentSection = '';
    const securitiesHoldings: InvestmentHolding[] = [];

    for (let r = financeRow + 4; r <= maxRow; r++) {
      const sectionCol = getCellString(worksheet, 1, r); // B열: 섹션 구분
      const productName = getCellString(worksheet, 2, r); // C열: 상품명
      const balance = getCellNumber(worksheet, 4, r);     // E열: 금액

      // 총자산/순자산이면 끝
      if (sectionCol.includes('총자산') || sectionCol.includes('순자산')) break;

      // 섹션 변경 감지 (B열에 값이 있으면 새 섹션)
      if (sectionCol) {
        currentSection = sectionCol;
        // 상품명이 없는 빈 섹션 건너뛰기
        if (!productName && balance === 0) continue;
      }

      if (!productName) continue;

      // 섹션별 자산 타입 결정
      if (currentSection.includes('자유입출금') || currentSection.includes('저축성') || currentSection.includes('신탁')) {
        assets.push({
          id: generateAssetId('account', productName, r),
          type: 'account',
          name: productName,
          institution: inferInstitution(productName),
          balance,
        });
      } else if (currentSection.includes('현금')) {
        assets.push({
          id: generateAssetId('cash', productName, r),
          type: 'cash',
          name: productName,
          institution: '',
          balance,
        });
      } else if (currentSection.includes('전자금융')) {
        assets.push({
          id: generateAssetId('pay', productName, r),
          type: 'pay',
          name: productName,
          institution: inferInstitution(productName),
          balance,
        });
      } else if (currentSection.includes('투자성')) {
        // 개별 종목은 holdings로 묶고, 증권 계좌는 account로
        const holding = holdingsMap.get(productName);
        if (holding) {
          securitiesHoldings.push(holding);
        }
        if (/기본계좌|옵션계좌|종합계좌/.test(productName)) {
          assets.push({
            id: generateAssetId('account', productName, r),
            type: 'account',
            name: productName,
            institution: inferInstitution(productName),
            balance,
          });
        }
      }
      // 보험/부동산/동산/기타 실물/연금 — 건너뛰기
    }

    // 투자 종목이 있으면 증권 자산 하나로 묶기
    if (securitiesHoldings.length > 0) {
      const broker = securitiesHoldings[0]?.broker || '증권사';
      const totalValue = securitiesHoldings.reduce((sum, h) => sum + h.currentPrice, 0);
      assets.push({
        id: generateAssetId('securities', `${broker}_투자`),
        type: 'securities',
        name: `${broker} 투자`,
        institution: broker,
        balance: totalValue,
        holdings: securitiesHoldings,
      });
    }
  }

  if (assets.length === 0 && financeRow === -1) {
    errors.push({
      sheet: '뱅샐현황',
      message: '재무현황 섹션을 찾을 수 없습니다',
      severity: 'warning',
    });
  }

  return { assets, errors };
}
