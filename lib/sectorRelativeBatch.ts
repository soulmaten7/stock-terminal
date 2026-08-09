/**
 * STEP 956 §3 — 업종 백분위 배치 계산. 순수 함수 + DB 입출력 분리(입력만 받아 결과를 돌려준다 — DB·네트워크 접근 없음).
 * 🔴 sectorPercentiles()(lib/sectorRelative.ts)를 그대로 재사용한다 — 백분위 계산 로직을 복제하지 않는다.
 * 🔴 방향: SECTOR_RELATIVE_SPEC.direction = "higher_is_more_expensive" — pct가 클수록 그 업종 안에서 비싸다.
 */
import { sectorPercentiles, SECTOR_RELATIVE_SPEC, type SectorAxisEntry } from "./sectorRelative";

export type UnavailReason = "NO_SECTOR" | "NO_VALUE" | "SAMPLE_TOO_SMALL";
const AXES = ["per", "pbr", "psr", "evEbitda"] as const;
type Axis = (typeof AXES)[number];

export interface ValuationInput {
  symbol: string;
  per: number | null;
  pbr: number | null;
  psr: number | null;
  evEbitda: number | null;
}
export interface SectorInput {
  symbol: string;
  sector: string | null;
}
export interface SectorRelativeRow {
  symbol: string;
  sector: string | null;
  perPct: number | null; pbrPct: number | null; psrPct: number | null; evEbitdaPct: number | null;
  perN: number | null; pbrN: number | null; psrN: number | null; evEbitdaN: number | null;
  // 🔴 빈 칸을 null로만 두지 않는다(규칙 5-1 ⑤) — 축별로 왜 없는지 사유를 남긴다.
  unavailable: Partial<Record<Axis, UnavailReason>>;
  minSample: number;
}

/**
 * 밸류에이션 4축(us_valuation) + 섹터 배정(us_sector_wide)을 받아 종목별 업종 백분위를 계산한다.
 * - 업종별·축별로 값이 있는 종목만 모은다(결측은 분모에서 제외).
 * - 유효 표본 < minSample이면 그 업종·그 축은 전부 pct=null, unavailable="SAMPLE_TOO_SMALL"(n은 실제 유효표본 수를 그대로 기록).
 * - minSample 이상이면 sectorPercentiles()로 계산.
 * - 섹터가 없는 종목은 4축 전부 pct=null, unavailable="NO_SECTOR".
 * - 섹터는 있으나 그 축 값이 없는 종목은 pct=null, unavailable="NO_VALUE"(n은 그 업종·축의 유효표본 수 — 참고용).
 */
export function computeSectorRelativeBatch(
  valuations: ValuationInput[],
  sectors: SectorInput[],
  minSample: number = SECTOR_RELATIVE_SPEC.minSample
): SectorRelativeRow[] {
  const sectorBySymbol = new Map(sectors.map((s) => [s.symbol, s.sector]));

  const bySector = new Map<string, ValuationInput[]>();
  for (const v of valuations) {
    const sector = sectorBySymbol.get(v.symbol) ?? null;
    if (sector == null) continue;
    if (!bySector.has(sector)) bySector.set(sector, []);
    bySector.get(sector)!.push(v);
  }

  type AxisResult = { pctBySymbol: Map<string, number | null>; n: number; sampleOk: boolean };
  const cache = new Map<string, Record<Axis, AxisResult>>();
  for (const [sector, members] of bySector) {
    const axisResults = {} as Record<Axis, AxisResult>;
    for (const axis of AXES) {
      const entries: SectorAxisEntry[] = members.map((m) => ({ symbol: m.symbol, value: m[axis] }));
      const n = entries.filter((e) => e.value != null && Number.isFinite(e.value)).length;
      const sampleOk = n >= minSample;
      axisResults[axis] = { pctBySymbol: sampleOk ? sectorPercentiles(entries) : new Map(), n, sampleOk };
    }
    cache.set(sector, axisResults);
  }

  const rows: SectorRelativeRow[] = [];
  for (const v of valuations) {
    const sector = sectorBySymbol.get(v.symbol) ?? null;
    const unavailable: Partial<Record<Axis, UnavailReason>> = {};
    const pct: Record<Axis, number | null> = { per: null, pbr: null, psr: null, evEbitda: null };
    const n: Record<Axis, number | null> = { per: null, pbr: null, psr: null, evEbitda: null };

    if (sector == null) {
      for (const axis of AXES) unavailable[axis] = "NO_SECTOR";
    } else {
      const axisResults = cache.get(sector)!;
      for (const axis of AXES) {
        const { pctBySymbol, n: axisN, sampleOk } = axisResults[axis];
        n[axis] = axisN;
        if (!sampleOk) {
          unavailable[axis] = "SAMPLE_TOO_SMALL";
          continue;
        }
        const own = v[axis];
        if (own == null || !Number.isFinite(own)) {
          unavailable[axis] = "NO_VALUE";
          continue;
        }
        pct[axis] = pctBySymbol.get(v.symbol) ?? null;
      }
    }

    rows.push({
      symbol: v.symbol, sector,
      perPct: pct.per, pbrPct: pct.pbr, psrPct: pct.psr, evEbitdaPct: pct.evEbitda,
      perN: n.per, pbrN: n.pbr, psrN: n.psr, evEbitdaN: n.evEbitda,
      unavailable, minSample,
    });
  }
  return rows;
}
