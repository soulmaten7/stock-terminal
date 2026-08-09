/**
 * STEP 952 §3 — 「업종 대비」 정의 고정(규칙 5-1·5-2). 원전 없음 — 정의를 우리가 고정하고 공개한다.
 *
 * 🔴 순수 함수만. DB·네트워크 접근 없음(규칙 5-2 ①).
 * 🔴 이 파일 + SECTOR_RELATIVE_SPEC이 「업종 대비」 정의의 유일한 출처다(규칙 5-2 ⑤) —
 *    docs/VALUATION_SPEC.md의 「업종 대비」 절은 이 객체를 그대로 옮겨 적은 것이어야 한다.
 * 🔴 업종 기준선(백분위 컷)은 여기서 계산하지 않는다 — 이 STEP은 정의 고정까지다(장은태 판정 2026-08-09).
 */

export const SECTOR_RELATIVE_SPEC = {
  method: "percentile",
  direction: "higher_is_more_expensive", // 4축(PER·PBR·PSR·EV/EBITDA) 전부 값이 클수록 비싸다
  axes: ["per", "pbr", "psr", "evEbitda"],
  sectorSource: "us_sector_wide",
  // 🔴 percentileFn = "count(v < target) / n_valid" — 그 종목보다 값이 작은 동일 업종·동일 축 종목의 비율.
  //   lib/sectorCuts.ts의 pctile()은 반대 방향 함수다(백분위→값). 이 함수는 값→백분위라 수학적으로 역함수이며
  //   같은 이름으로 재사용할 수 없다 — pctile을 그대로 부르면 정의 문장("그 종목보다 값이 작은 종목의 비율")과
  //   실제 동작이 달라진다(pctile의 선형보간 인덱스는 (n-1)분모라 empirical 비율(n분모)과 다른 수치를 낸다).
  //   그래서 이 함수는 새로 작성하되, pctile과 같은 계열(lib/sectorCuts.ts)의 선형정렬 전제를 공유한다.
  percentileFn: "empirical_rank", // count(v < target) / n_valid — pctile()과는 다른 함수(위 주석 참조)
  // 🔴 minSample = 20 (STEP 956, 장은태 판정 2026-08-09). 20건이면 백분위 해상도가 5% 단위(1/20).
  //   이 기준에서 비는 칸은 44칸(11업종×4축) 중 5칸 — Real Estate 전 축(PER 10·PBR 17·PSR 18·EV 4)과
  //   Financials EV(16). 실측 표본표 = docs/VALUATION_SPEC.md 「업종 대비」 절.
  //   🔴 Financials EV/EBITDA(16건)는 "표본이 적다"가 아니라 "축이 안 맞는다"일 수 있다 — 은행은 부채가
  //   영업 재료라 EV 개념 자체가 잘 안 맞는다. minSample로는 똑같이 걸러지지만 걸러지는 이유가 다르다 —
  //   표시 문구를 정할 때 이 둘을 구분해야 한다(🔴 미판정, Q1 카드 작업 시).
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
