/**
 * STEP 1003 — Damodaran ERPbymonth.xlsx 'Historical ERP' 시트 파서 (순수함수).
 *
 * 🔴 어디에도 배선되지 않는다. `scripts/ingest_damodaran.ts`는 이 파일을 import하지 않는다.
 * 🔴 rf·ERP를 항상 "짝"으로만 반환한다(§5-2 y=f(x) 원칙 — riskfree.ts와 같은 설계).
 *
 * 파싱 명세(1003 §2, 파일 구조가 바뀌면 여기가 깨지는 지점):
 *   시트 = "Historical ERP" · 헤더 행 1 · 데이터 행 2~
 *   열A "Start of month"(datetime) · 열D "$ Riskfree Rate"(float) · 열K "ERP (T12m) with adj riskfree rate"(float)
 *
 * 왜 열D·열K인가(2-3): damodaran_global_inputs 저장값(rf=0.0395·erp=0.0446, as_of 2026-01-05)이
 * 이 두 열의 2026-01 행과 정확히 일치한다(다른 4개 ERP 변형·raw T.Bond Rate는 일치하지 않음) —
 * 즉 wacc.xls가 실제로 참조하는 열이 이 둘이다. 🔴 단, Damodaran이 자기 요약 시트("Last 12 months
 * data")에서 더 눈에 띄게 보여주는 조합은 raw T.Bond Rate + ERP(T12m)(plain, 열C+열J)로 다르다 —
 * 우리 저장값이 이미 "adj riskfree" 변형을 쓰고 있었으므로 연속성을 위해 그대로 유지한다.
 *
 * $ Riskfree Rate 산식(2026-08-13 재확인, 1001의 "미공개" 기록을 정정) —
 * Damodaran, "Sovereign Ratings, Default Risk and Markets: The Moody's Downgrade Aftermath!"
 * (Musings on Markets, 2025-06): Moody's가 2025-05-16 미국을 Aaa→Aa1로 강등한 뒤,
 * raw T.Bond rate에 이제 디폴트 스프레드가 섞여 있다고 보고 이를 다시 빼낸 값이 "$ Riskfree Rate"다.
 *   $ Riskfree Rate = T.Bond rate − (해당 등급의 디폴트 스프레드, 시장연동이라 매달 변함)
 * 그 자신이 공개한 예시(2025-05-30): 4.41% − 0.40%(Aa1 디폴트 스프레드) = 4.01%.
 * 2025년 중반 이전 행이 비어 있는 이유 = 그 전까지는 미국이 Aaa라 조정이 필요 없었기 때문.
 */
import * as XLSX from "xlsx";

export interface ErpMonthlyRow {
  month: string; // YYYY-MM-01
  dollarRiskfreeRate: number | null; // 열D "$ Riskfree Rate"
  erpT12mAdjRiskfree: number | null; // 열K "ERP (T12m) with adj riskfree rate"
  tBondRateRaw: number | null; // 열C, 참고용(짝 아님 — raw Treasury)
}

const SHEET_NAME = "Historical ERP";
const COL_MONTH = 0; // A
const COL_TBOND_RAW = 2; // C
const COL_DOLLAR_RISKFREE = 3; // D
const COL_ERP_T12M_ADJ = 10; // K

// 🔴 STEP1003 자체발견 버그(값불변증명 스크립트가 잡음): 이 파일은 Excel **1904 날짜체계**로
// 저장돼 있다(`Workbook.WBProps.date1904 === true` — Damodaran의 histimpl.xls 메타데이터에 찍힌
// "Microsoft Macintosh Excel"과 정합, Mac Excel 레거시 기본값). 1900체계 공식을 그대로 쓰면 날짜가
// 정확히 1,462일(1904/1900 오프셋) 어긋난다(2026-08-01이 2022-07-31로 나옴 — openpyxl은 이 플래그를
// 자동 보정해 정확히 읽는다). → date1904 여부를 워크북에서 직접 읽어 조건부로 보정한다(하드코딩 아님 —
// 이 파일이 언젠가 1900체계로 바뀌어도 깨지지 않는다).
const DATE1904_OFFSET_DAYS = 1462;
function excelSerialToMonth(v: unknown, date1904: boolean): string | null {
  const n = typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return null;
  const serial = date1904 ? n + DATE1904_OFFSET_DAYS : n;
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 10);
}
function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 순수함수 — 이미 읽어들인 xlsx buffer를 파싱만 한다(네트워크·파일IO 없음). */
export function parseErpMonthly(buffer: Buffer): ErpMonthlyRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" }); // 🔴 cellDates:true 안 씀(위 excelSerialToMonth 주석 참조)
  if (!wb.SheetNames.includes(SHEET_NAME)) throw new Error(`parseErpMonthly: 시트 "${SHEET_NAME}" 없음 — 파일 구조 변경 의심`);
  const date1904 = Boolean((wb as unknown as { Workbook?: { WBProps?: { date1904?: boolean } } }).Workbook?.WBProps?.date1904);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[SHEET_NAME], { header: 1, blankrows: false, raw: true }) as unknown[][];

  const header = raw[0] ?? [];
  if (String(header[COL_DOLLAR_RISKFREE] ?? "").trim() !== "$ Riskfree Rate")
    throw new Error(`parseErpMonthly: 열D 헤더가 "$ Riskfree Rate"가 아님(실제: "${header[COL_DOLLAR_RISKFREE]}") — 컬럼 위치 확인 필요`);
  if (String(header[COL_ERP_T12M_ADJ] ?? "").trim() !== "ERP (T12m) with adj riskfree rate")
    throw new Error(`parseErpMonthly: 열K 헤더가 예상과 다름(실제: "${header[COL_ERP_T12M_ADJ]}") — 컬럼 위치 확인 필요`);

  const rows: ErpMonthlyRow[] = [];
  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] ?? [];
    const month = excelSerialToMonth(r[COL_MONTH], date1904);
    if (!month) continue;
    rows.push({
      month,
      tBondRateRaw: num(r[COL_TBOND_RAW]),
      dollarRiskfreeRate: num(r[COL_DOLLAR_RISKFREE]),
      erpT12mAdjRiskfree: num(r[COL_ERP_T12M_ADJ]),
    });
  }
  return rows;
}

/** 최신 행(짝으로 rf·ERP 둘 다 값이 있는 것 중 가장 최근) — null이면 최근 몇 개월이 결측이란 뜻. */
export function latestPairedRow(rows: ErpMonthlyRow[]): ErpMonthlyRow | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r.dollarRiskfreeRate != null && r.erpT12mAdjRiskfree != null) return r;
  }
  return null;
}

/** 특정 월(YYYY-MM) 행을 찾는다 — 값 불변 증명(§5-2)에서 과거 as_of와 대조할 때 사용. */
export function findRowForMonth(rows: ErpMonthlyRow[], yyyyMm: string): ErpMonthlyRow | null {
  return rows.find((r) => r.month.startsWith(yyyyMm)) ?? null;
}
