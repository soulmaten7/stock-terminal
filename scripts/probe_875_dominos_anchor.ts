// STEP 875 §1 — 도미노 앵커: 874가 "원본 셀이 값을 낸다"만 확인했지 "우리 공식으로 돌려서 재현되는가"는 안 했다.
// 이 스크립트는 T4.xlsx·T5.xlsx의 도미노 입력값을 그대로(하드코딩 전사) 넣어 874의 세 공식을 돌린다.
// 측정 전용 · lib/revdcf/** 수정 없음(참조도 안 함 — 원전 앵커라 production computeDrivers()의 SEC 태그 로직과 무관) · 네트워크·DB 호출 없음.
// 실행: npx tsx scripts/probe_875_dominos_anchor.ts
//
// 🔴 데이터는 data/sources/expectations-investing/T4.xlsx·T5.xlsx를 openpyxl로 직접 개봉해 그대로 전사(추정 없음).
import { writeFileSync } from "fs";

// ── T4 Inputs 시트 그대로 전사 (연도: 2013~2019) ──────────────────────────
const YEARS_T4 = [2013, 2014, 2015, 2016, 2017, 2018, 2019];
const REV_T4: Record<number, number> = { 2013: 1802.223, 2014: 1993.827, 2015: 2216.528, 2016: 2472.61, 2017: 2787.979, 2018: 3432.844, 2019: 3618.77 };
const AR_T4: Record<number, number> = { 2013: 105.779, 2014: 118.395, 2015: 131.582, 2016: 150.369, 2017: 173.677, 2018: 190.091, 2019: 210.26 };
const INV_T4: Record<number, number> = { 2013: 30.321, 2014: 37.944, 2015: 36.861, 2016: 40.181, 2017: 39.961, 2018: 45.975, 2019: 52.955 };
const OTHERCA_T4: Record<number, number> = { 2013: 64.894, 2014: 110.356, 2015: 119.805, 2016: 136.012, 2017: 138.612, 2018: 138.454, 2019: 124.518 };
const AP_T4: Record<number, number> = { 2013: 83.408, 2014: 86.552, 2015: 106.927, 2016: 111.51, 2017: 106.894, 2018: 92.546, 2019: 111.101 };
const ACCRUED_T4: Record<number, number> = { 2013: 68.133, 2014: 70.719, 2015: 71.055, 2016: 77.657, 2017: 80.266, 2018: 89.153, 2019: 131.148 };
const ADVERTISING_T4: Record<number, number> = { 2013: 44.695, 2014: 72.055, 2015: 99.159, 2016: 118.377, 2017: 120.223, 2018: 107.15, 2019: 101.921 };
const OTHERACCRUED_T4: Record<number, number> = { 2013: 34.231, 2014: 35.717, 2015: 39.509, 2016: 57.267, 2017: 58.578, 2018: 55.001, 2019: 66.267 };
// T4 Inputs 시트엔 실제 Cash·단기투자·이자부 유동부채·집계 Current Assets/Liabilities가 아예 없음(섹션 헤더가 "Non-Interest Bearing Current Liabilities:"뿐).
// Tutorial 4 서술 표(rows 31-44)에만 부분(2014~2017 4개년) 진짜 잔액이 있음 — B안 앵커 시도용, I31과 다른 창임을 명시.
const TUTORIAL4_YEARS = [2014, 2015, 2016, 2017];
const TUTORIAL4_CASH: Record<number, number> = { 2014: 30.855, 2015: 133.449, 2016: 42.815, 2017: 35.768 };
const TUTORIAL4_STINV: Record<number, number> = { 2014: 120.954, 2015: 180.94, 2016: 126.496, 2017: 191.762 };
const TUTORIAL4_DEFTAX: Record<number, number> = { 2014: 9.9, 2015: 0, 2016: 0, 2017: 0 };
const TUTORIAL4_DEBTCUR: Record<number, number> = { 2014: 0.565, 2015: 59.333, 2016: 38.887, 2017: 32.324 };
// 위 4개 + AR·Inv·OtherCA·AP·Accrued·Advertising·OtherAccrued(같은 4개년)로 진짜 AssetsCurrent/LiabilitiesCurrent 구성 가능.

// ── T5 Inputs 시트 그대로 전사 (연도: 2013~2019, capex/D&A는 2014~2019만) ──
const REV_T5 = REV_T4; // 동일 도미노·동일 매출
const DNA_T5: Record<number, number> = { 2014: 35.788, 2015: 32.434, 2016: 38.14, 2017: 44.369, 2018: 53.665, 2019: 59.93 };
const CAPEX_T5: Record<number, number> = { 2014: -70.093, 2015: -63.282, 2016: -58.555, 2017: -90.011, 2018: -119.888, 2019: -85.565 }; // 음수=현금유출
const ACQ_T5: Record<number, number> = { 2014: 0, 2015: 0, 2016: 0, 2017: 0, 2018: 0, 2019: 0 };
// T4·T5·T8 어디에도 PP&E 잔액(장부가) 데이터가 없다 — level(PP&E÷매출) 자체를 도미노로 계산할 재료가 없음(§1 결론).

function pct(x: number): string { return (x * 100).toFixed(3) + "%"; }

function main() {
  const out: Record<string, unknown> = {};

  // ══════════════════════════ driver 4 — A안 (874 코드 그대로: 필요현금+AR+Inv+OtherCA − (AP+Accrued만)) ══════════════════════════
  // T4 I31은 D(2014)↔I(2019) 두 시점의 NWC 레벨차 ÷ 매출차(끝점 방식·연도 합산 아님).
  function nwc(y: number, accruedBucket: number[]): number {
    const reqCash = REV_T4[y] * 0.02;
    const liabs = accruedBucket.reduce((a, b) => a + b, 0);
    return reqCash + AR_T4[y] + INV_T4[y] + OTHERCA_T4[y] - (AP_T4[y] + liabs);
  }
  const d0 = 2014, d1 = 2019;
  // 874 코드 그대로 — Accrued 버킷 = "Accrued expenses" 하나만(태그 AccruedLiabilitiesCurrent 근사)
  const nwc0_ours = nwc(d0, [ACCRUED_T4[d0]]), nwc1_ours = nwc(d1, [ACCRUED_T4[d1]]);
  const dRev = REV_T4[d1] - REV_T4[d0];
  const A_ours = (nwc1_ours - nwc0_ours) / dRev;
  // T4 원전 그대로 — 무이자 4항목 전부(AP+Accrued+Advertising+OtherAccrued) = 원전 재현 사니티체크
  const nwc0_full = nwc(d0, [ACCRUED_T4[d0], ADVERTISING_T4[d0], OTHERACCRUED_T4[d0]]);
  const nwc1_full = nwc(d1, [ACCRUED_T4[d1], ADVERTISING_T4[d1], OTHERACCRUED_T4[d1]]);
  const A_full = (nwc1_full - nwc0_full) / dRev;

  out.driver4_A = {
    expected: 0.005011166545534272, // T4 I31
    ours_AP_plus_AccruedOnly: A_ours,
    ours_AP_plus_AccruedOnly_pct: pct(A_ours),
    full_T4_all4NonInterestItems: A_full,
    full_T4_all4NonInterestItems_pct: pct(A_full),
    matchesExpected_full: Math.abs(A_full - 0.005011166545534272) < 0.0001,
    note: "874 코드가 실제로 쓰는 A안(AP+AccruedLiabilitiesCurrent 태그 근사 2종만)은 도미노의 Advertising fund liabilities·Other accrued liabilities 2개 항목을 놓친다 — 그래서 T4의 4항목 전부를 쓴 재현(full)과 따로 낸다. full이 0.501%와 일치하면 계산 구조(끝점차·5년창·2%현금)는 맞다는 뜻이고, ours가 다르면 그 차이는 '태그 매핑의 한계'이지 '공식 오류'가 아니다.",
  };

  // ══════════════════════════ driver 4 — B안 (집계 근사) ══════════════════════════
  // T4.xlsx의 Inputs 시트(=I31이 실제로 쓰는 데이터)엔 진짜 Cash·단기투자·이자부유동부채·집계 Current Assets/Liabilities가 아예 없다.
  // Tutorial 4 서술 표에 부분(2014~2017) 진짜 값이 있으나 I31의 5년 창(2014↔2019)과 다른 창(2014~2017)이라 같은 앵커 테스트가 아니다.
  const t4y0 = 2014, t4y1 = 2017; // Tutorial 4 서술 표가 가진 두 끝점(3년 창 — 5년 아님)
  function assetsCurrentTutorial(y: number): number { return TUTORIAL4_CASH[y] + TUTORIAL4_STINV[y] + AR_T4[y] + INV_T4[y] + OTHERCA_T4[y] + TUTORIAL4_DEFTAX[y]; }
  function liabilitiesCurrentTutorial(y: number): number { return AP_T4[y] + TUTORIAL4_DEBTCUR[y] + ACCRUED_T4[y] + ADVERTISING_T4[y] + OTHERACCRUED_T4[y]; }
  function nwcB_tutorial(y: number): number {
    const reqCash = REV_T4[y] * 0.02;
    const opAssets = assetsCurrentTutorial(y) - TUTORIAL4_CASH[y] - TUTORIAL4_STINV[y] + reqCash;
    const opLiabs = liabilitiesCurrentTutorial(y) - TUTORIAL4_DEBTCUR[y];
    return opAssets - opLiabs;
  }
  const B_partial = (nwcB_tutorial(t4y1) - nwcB_tutorial(t4y0)) / (REV_T4[t4y1] - REV_T4[t4y0]);

  out.driver4_B = {
    expected: 0.005011166545534272,
    testable: false,
    reason: "T4.xlsx의 Inputs 시트(I31이 실제로 쓰는 데이터)엔 '진짜' Cash·단기투자·이자부 유동부채·AssetsCurrent/LiabilitiesCurrent 집계가 전혀 없다 — 섹션 헤더 자체가 'Non-Interest Bearing Current Liabilities:'뿐이다. B안이 필요로 하는 필드가 원본 파일에 없어 I31과 같은 5년 창(2014↔2019)으로는 재현 시도 자체가 불가능하다.",
    partial_using_tutorial4_narrative_table: {
      window: "2014→2017(3년 — I31의 2014→2019 5년 창과 다름. 같은 앵커 테스트 아님)",
      value: B_partial,
      value_pct: pct(B_partial),
      note: "Tutorial 4 서술 표(2014~2017만)의 진짜 Cash·단기투자·유동부채 잔액으로 계산한 참고값. 창이 달라 0.501%와 직접 비교 불가 — 재현 실패/성공을 판정하지 않는다.",
    },
  };

  // ══════════════════════════ driver 5 — marginal(원전 T5식) ══════════════════════════
  // T5 I20 = -(E13+F13+G13+H13+I13)/(E16+F16+G16+H16+I16), 기준연도 D(2014)·합산연도 E~I(2015~2019) 5개.
  const invYears5 = [2015, 2016, 2017, 2018, 2019];
  let cumNet = 0; for (const y of invYears5) cumNet += Math.abs(CAPEX_T5[y]) + Math.abs(ACQ_T5[y]) - Math.abs(DNA_T5[y]);
  const cumDRev5 = REV_T5[2019] - REV_T5[2014];
  // cumNet = Σ(|capex|+|acq|-|D&A|) = Σ(-row13) 그 자체(production 공식과 동일 정의·부호 이미 반영) → 그대로 나눔
  const marginalCorrect = cumNet / cumDRev5;

  out.driver5_marginal = {
    expected: 0.1161659208969176, // T5 I20
    ours: marginalCorrect,
    ours_pct: pct(marginalCorrect),
    matchesExpected: Math.abs(marginalCorrect - 0.1161659208969176) < 0.0001,
    note: "production drivers.ts:179-184의 cumNet/cumDRev 공식을 도미노 6년 창(기준 2014 + 합산 2015~2019 5개, T5 I20과 동일 창)에 그대로 적용. production은 5년 데이터(4개 합산연도)만 쓰지만 이건 도미노 원본이 가진 6년 전체를 그대로 써 형식만 검증한 것.",
  };

  // ══════════════════════════ driver 5 — level(현행 주 판정) ══════════════════════════
  out.driver5_level = {
    expected: "원전에 대응 없음",
    testable: false,
    reason: "T4.xlsx·T5.xlsx·T8.xlsx 셋 다 개봉 확인 — PP&E 장부가(잔액) 데이터가 어디에도 없다. T5 Inputs 시트는 매출·capex·D&A·인수뿐(재고·PP&E 등 대차대조표 잔액 자체가 원전 재료에 없음). level(PP&E÷매출)을 도미노로 계산할 재료가 원전 어디에도 없다 — 앵커 테스트 불가능(구조적으로 원전에 대응 없다는 875 §0/§3의 주장을 데이터 차원에서도 재확인).",
  };

  writeFileSync("docs/probe_875_anchor.json", JSON.stringify(out, null, 2));
  console.error("=== driver4 A안 ===");
  console.error(`기대(T4 I31) = 0.501%`);
  console.error(`874코드 그대로(AP+Accrued만) = ${pct(A_ours)}`);
  console.error(`T4 4항목 전부(재현 사니티체크) = ${pct(A_full)} (일치=${out.driver4_A && (out.driver4_A as any).matchesExpected_full})`);
  console.error("\n=== driver4 B안 ===");
  console.error(`I31과 같은 5년창(2014→2019) 앵커 테스트 불가 — Inputs 시트에 필요 데이터 없음`);
  console.error(`참고(다른 창 2014→2017): ${pct(B_partial)}`);
  console.error("\n=== driver5 marginal ===");
  console.error(`기대(T5 I20) = 11.6%`);
  console.error(`우리 공식 = ${pct(marginalCorrect)} (일치=${(out.driver5_marginal as any).matchesExpected})`);
  console.error("\n=== driver5 level ===");
  console.error(`앵커 테스트 불가 — 원전 어디에도 PP&E 잔액 데이터 없음`);
}

main();
