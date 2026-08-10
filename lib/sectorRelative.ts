/**
 * STEP 952 §3 — 「업종 대비」 정의 고정(규칙 5-1·5-2). 원전 없음(percentile) → STEP 980에서 정본을
 * median_relative로 교체(원전 근거 있음, 979 확정) — 정의를 우리가 고정하고 공개한다.
 *
 * 🔴 순수 함수만. DB·네트워크 접근 없음(규칙 5-2 ①).
 * 🔴 이 파일 + SECTOR_RELATIVE_SPEC이 「업종 대비」 정의의 유일한 출처다(규칙 5-2 ⑤) —
 *    docs/VALUATION_SPEC.md의 「업종 대비」 절은 이 객체를 그대로 옮겨 적은 것이어야 한다.
 * 🔴 업종 기준선(백분위 컷)은 여기서 계산하지 않는다 — 이 STEP은 정의 고정까지다(장은태 판정 2026-08-09).
 * 🔴 STEP 980 — sectorPercentiles()는 고치지 않는다(전환기 대조군으로 나란히 둔다). 새 정본 함수
 *   sectorMedianRelative()를 아래에 추가만 한다.
 */

export const SECTOR_RELATIVE_SPEC = {
  // 🔴 STEP 980 정본 전환(장은태 위임 판정, 979 근거) — median_relative가 원전이 명시 권고하는
  //   유일한 집계값이다(percentile은 원전 없음[952 자백], average는 Damodaran이 직접 경계함).
  method: "median_relative",
  methodPrior: "percentile", // 🔴 전환기 대조군 — 삭제 안 함. sectorPercentiles()는 그대로 계산·저장된다(per_pct 등 컬럼 무변경).
  direction: "higher_is_more_expensive", // 4축(PER·PBR·PSR·EV/EBITDA) 전부 값이 클수록 비싸다
  axes: ["per", "pbr", "psr", "evEbitda"],
  sectorSource: "us_sector_wide",
  // 🔴 medianRelativeFn = "value / sector_median" — 그 종목값을 같은 업종·같은 축의 중앙값으로 나눈 배율.
  //   원전 근거: Damodaran multiples.pdf("RELATIVE VALUATION" 논문) — "median... is often a more reliable
  //   comparison point"(relval.pdf) + 표본 분포가 우편향이라 평균보다 중앙값이 대표성 있음(multiples.pdf).
  medianRelativeFn: "value / sector_median",
  // 🔴 중앙값 정의 = 표준(오름차순 정렬 후 홀수면 가운데 값, 짝수면 가운데 두 값의 평균).
  //   원전은 "절반은 작고 절반은 크다"는 정성적 정의만 주고 짝수 표본의 처리를 명시하지 않는다(980 ①-A-1, 못 찾음)
  //   — 표준 통계 정의를 그대로 쓴다(SQL percentile_cont(0.5)와 동일 결과, 979가 실측 확인).
  medianTieBreak: "표준 정의(가운데 두 값 평균) — 원전 미명시, 우리가 고정",
  // 🔴 배율 상한 없음. Damodaran multiples.pdf: "services... either throw out these outliers... or
  //   constrain the multiples... For instance, any firm that has a PE > 500 may be given a PE of 500" —
  //   단 이 절단 관행은 "평균(average)" 계산 맥락에서만 언급되고, 바로 다음 문장이 "그래서 평균 대신
  //   중앙값을 보라"고 이어진다 — 중앙값을 쓰는 이유 자체가 이 절단이 필요 없어서다(980 ①-A-2).
  //   개별 종목 배율(우리 최종 산출물)에 상한을 걸 원전 근거가 없다 — CSGP 30배도 그대로 저장한다.
  medianRelativeCap: "없음(원전 근거 없음 — 980 확정)",
  // 🔴 percentileFn = "count(v < target) / n_valid" — 그 종목보다 값이 작은 동일 업종·동일 축 종목의 비율.
  //   lib/sectorCuts.ts의 pctile()은 반대 방향 함수다(백분위→값). 이 함수는 값→백분위라 수학적으로 역함수이며
  //   같은 이름으로 재사용할 수 없다 — pctile을 그대로 부르면 정의 문장("그 종목보다 값이 작은 종목의 비율")과
  //   실제 동작이 달라진다(pctile의 선형보간 인덱스는 (n-1)분모라 empirical 비율(n분모)과 다른 수치를 낸다).
  //   그래서 이 함수는 새로 작성하되, pctile과 같은 계열(lib/sectorCuts.ts)의 선형정렬 전제를 공유한다.
  percentileFn: "empirical_rank", // count(v < target) / n_valid — pctile()과는 다른 함수(위 주석 참조)
  // 🔴 minSample = 20 (STEP 956, 장은태 판정 2026-08-09) — 980에서도 유지(장은태 위임 판정, 근거 = Real
  //   Estate EV/EBITDA n=4에서 CSGP 1사가 중앙값을 지배함을 979에서 실측). 🔴 20이라는 숫자 자체는
  //   원전 근거가 없다(980 ①-A-3에서도 하한 서술 못 찾음) — 우리가 고정한 값임을 계속 공개한다.
  //   median_relative·percentile 둘 다 이 하나의 minSample을 공유한다(980 §2-2) — 유효표본<20이면 둘 다 null.
  //   이 기준에서 비는 칸은 44칸(11업종×4축) 중 3칸(2026-08-09 기준, 974 표본증가로 5칸→3칸 개선·978 실측) —
  //   Real Estate×PER(13)·Real Estate×EV/EBITDA(4)·Financials×EV/EBITDA(17).
  minSample: 20,
  unavailableWhen: [
    "sector == null",
    "축 값이 없음(us_valuation.unavailable에 사유 있음)",
    "업종 내 유효 표본 < minSample",
  ],
} as const;

export type SectorAxisEntry = { symbol: string; value: number | null };

/**
 * 같은 업종·같은 축 안에서 각 종목의 백분위를 계산한다.
 * 백분위 = 그 종목보다 값이 작은(strictly less) 유효 종목 수 / 유효 표본 수.
 * 🔴 값이 없는 종목(결측)은 분모·분자에서 뺀다(0으로 치지 않는다) — 결과도 null.
 * 🔴 동점 처리: 같은 값을 가진 종목들은 서로를 "작다"고 세지 않으므로 동일한 백분위를 받는다(정의 그대로, 중간순위 보정 없음).
 * 🔴 STEP 980 — 정본 지위를 median_relative에 넘겼으나 이 함수 자체는 무변경(전환기 대조군으로 계속 계산·저장).
 */
export function sectorPercentiles(entries: SectorAxisEntry[]): Map<string, number | null> {
  const valid = entries
    .map((e) => e.value)
    .filter((v): v is number => v != null && Number.isFinite(v));

  const result = new Map<string, number | null>();
  for (const e of entries) {
    if (e.value == null || !Number.isFinite(e.value)) {
      result.set(e.symbol, null);
      continue;
    }
    if (valid.length === 0) {
      result.set(e.symbol, null); // 이론상 도달 불가(자기 값이 valid에 포함됨) — 방어적 처리
      continue;
    }
    const countLess = valid.filter((v) => v < (e.value as number)).length;
    result.set(e.symbol, countLess / valid.length);
  }
  return result;
}

/**
 * STEP 980 — 표준 중앙값(오름차순 정렬, 홀수면 가운데 값·짝수면 가운데 두 값의 평균).
 * 🔴 SQL percentile_cont(0.5)와 동일 결과를 내도록 설계(979가 SQL로 44칸을 이미 실측했다 — 그 값과
 *   맞아야 한다). 원전은 짝수 표본 처리를 명시하지 않는다(980 ①-A-1) — 표준 정의를 그대로 쓴다.
 */
export function sectorMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * STEP 980 — 「업종 대비」 정본. 같은 업종·같은 축 안에서 각 종목의 값을 그 축의 중앙값으로 나눈 배율.
 * 🔴 값이 없는 종목(결측)은 분모·분자에서 뺀다(0으로 치지 않는다) — 결과도 null(sectorPercentiles와 동일 원칙).
 * 🔴 중앙값이 0이거나 계산 불가(빈 표본)면 배율도 null — 지어내지 않는다.
 * 🔴 배율에 상한을 두지 않는다(SECTOR_RELATIVE_SPEC.medianRelativeCap 참조 — 원전 근거 없음).
 */
export function sectorMedianRelative(entries: SectorAxisEntry[]): { median: number | null; ratios: Map<string, number | null> } {
  const valid = entries
    .map((e) => e.value)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const median = sectorMedian(valid);

  const ratios = new Map<string, number | null>();
  for (const e of entries) {
    if (e.value == null || !Number.isFinite(e.value) || median == null || median === 0) {
      ratios.set(e.symbol, null);
      continue;
    }
    ratios.set(e.symbol, e.value / median);
  }
  return { median, ratios };
}
