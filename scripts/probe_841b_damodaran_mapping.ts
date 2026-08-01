/**
 * STEP 841b 프로브 — driver 3(세율) 다모다란 업종 매핑 커버리지 실측
 *
 * 목적: "다모다란 94섹터 실효세율을 우리 유니버스에 붙일 때 몇 %가 매칭되나"
 *
 * 🔑 핵심 발견 (이 스크립트가 존재하는 이유):
 *  다모다란은 회사별 업종 분류를 **티커·SIC와 함께** 공개한다(indname.xls · 48,156사).
 *  → SIC→업종 크로스워크를 우리가 만들 필요가 없다.
 *
 * 🔴 함정: 매칭 키를 `Country == "United States"`로 하면 안 된다.
 *  다모다란은 **설립국** 기준이라 아일랜드·스위스 설립 미국 상장사(ACN·ETN·JCI·CRH·NXPI)가
 *  해외 버킷에 있고, 티커만 맞추면 TEL→루마니아 전력 / ET→이탈리아 건설로 **오분류**된다.
 *  → 키 = **상장 거래소**(NYSE·NasdaqGS/CM/GM·NYSEAM·OTCPK) + **구두점 정규화**(BF-B ↔ BF.B)
 *
 * 실측 결과 (2026-07-31):
 *  - 매칭 595/623 = 95.5% (발행사 595/611 = 97.4%)
 *  - 미매칭 28 = 복수클래스 12 + MLP 7 + 나머지 9
 *  - 🔴 MLP 7사 발견 → A층 제외 규칙에 파트너십 추가 (N 623→616)
 *  - 세율표 94업종 중 우리가 쓰는 74개 전부 존재 · 이상치(음수·100%↑) 0건
 *
 * 실행: npx tsx scripts/probe_841b_damodaran_mapping.ts
 * 의존: xlsx 파서 필요 (파이썬 pandas+xlrd로 실행한 원본 절차는 아래 주석 참조)
 *
 * ── 원본 실행 절차 (재현용) ──────────────────────────────────────
 *  1) 다운로드 (User-Agent 필수)
 *     https://pages.stern.nyu.edu/~adamodar/pc/datasets/indname.xls   (~22MB)
 *     https://pages.stern.nyu.edu/~adamodar/pc/datasets/taxrate.xls   (~59KB)
 *  2) indname.xls · 시트 "By company name" · header=0
 *     컬럼: Company Name / Exchange:Ticker / Industry Group / Primary Sector / SIC Code / Country / Broad Group / Sub Group
 *  3) exch = "Exchange:Ticker".split(":")[0] · ticker = split(":")[-1]
 *     US_EX = {NYSE, NasdaqGS, NasdaqCM, NasdaqGM, NYSEAM, AMEX, BATS, OTCPK}  → 6,937 티커
 *  4) 정규화: /[^A-Z0-9]/g 제거 후 대조
 *  5) taxrate.xls · 시트 "Industry Averages" · header=8
 *     컬럼: industry, nfirms, taxableInc, taxAccrual, cashTaxes, cashOverAccrual,
 *           eff_all, eff_money, eff_agg, cash_money, cash_agg
 *     🔴 eff_money(수익기업 평균·accrual) 사용. cash_* 는 이자 세금방패 이중계산이라 금지.
 * ────────────────────────────────────────────────────────────────
 */

export const DAMODARAN_URLS = {
  industryByCompany: "https://pages.stern.nyu.edu/~adamodar/pc/datasets/indname.xls",
  taxRateByIndustry: "https://pages.stern.nyu.edu/~adamodar/pc/datasets/taxrate.xls",
} as const;

/** 다모다란 Exchange:Ticker 접두어 중 미국 거래소 */
export const US_EXCHANGE_PREFIXES = new Set([
  "NYSE",
  "NasdaqGS",
  "NasdaqCM",
  "NasdaqGM",
  "NYSEAM",
  "AMEX",
  "BATS",
  "OTCPK",
]);

/** 🔴 티커 정규화 — BF-B(우리) ↔ BF.B(다모다란) 를 같게 만든다 */
export function normalizeTicker(t: string): string {
  return t.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * 🔴 파트너십·MLP 판별 — SEC entityName 기준.
 * 법인세 pass-through라 실효세율·NOPAT이 성립하지 않으므로 유니버스에서 제외한다.
 * (금융사·REIT 제외와 동일 논리)
 * 실측: 유니버스 623 중 7사 — EPD·ET·MPLX·CQP·WES·PAA·SUN (전부 에너지 미드스트림)
 */
export const PARTNERSHIP_PATTERN = /\b(LP|L\.P\.|PARTNERS|PARTNERSHIP)\b/i;

/**
 * 🔴 여기에 세율 숫자를 상수로 두지 않는다 (REVDCF_SPEC §12 · B분류).
 *
 * 이전 버전은 `TAX_RATE_FALLBACK = { moneyMakingAverage: 0.19416, aggregate: 0.20198 }`
 * 를 상수로 박아뒀다. 다모다란 데이터는 **연 1회(1월 첫 2주) 갱신**되므로 이렇게 두면
 * 다음 갱신 때 조용히 틀린 값이 된다. → **소스에서 읽어 DB에 저장하고 기준일을 함께 남긴다.**
 *
 * 실제로 이 방식 때문에 불일치가 발견됐다(2026-08-01):
 *   countrytaxrates.xls US 한계세율 = 25.63%  vs  wacc.xls 입력 한계세율 = 25.00%
 *   → 숫자를 베껴 적었으면 못 잡았을 오류.
 */
export const TAX_RATE_SOURCE = {
  marginalUS: {
    file: "countrytaxrates.xls",
    row: "United States of America",
    column: 1,
  },
  effectiveByIndustry: {
    file: "taxrate.xls",
    sheet: "Industry Averages",
    headerRow: 8,
    column: "eff_money", // 수익기업 평균(accrual). 🔴 cash_* 는 이자 세금방패 이중계산이라 금지
  },
  effectiveFallback: {
    file: "taxrate.xls",
    row: "Total Market (without financials)",
  },
  refresh: "연 1회 · 1월 첫 2주 (원문 확인 2026-08-01)",
} as const;
