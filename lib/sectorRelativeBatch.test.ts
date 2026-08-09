import { describe, it, expect } from "vitest";
import { computeSectorRelativeBatch, type ValuationInput, type SectorInput } from "./sectorRelativeBatch";

// 표본 개수만큼 심볼을 만들어 per 값 1..n을 순서대로 부여(값 자체는 중요하지 않고 개수 경계가 핵심)
function makeSector(sector: string, n: number, prefix: string): { valuations: ValuationInput[]; sectors: SectorInput[] } {
  const valuations: ValuationInput[] = [];
  const sectors: SectorInput[] = [];
  for (let i = 1; i <= n; i++) {
    const symbol = `${prefix}${i}`;
    valuations.push({ symbol, per: i, pbr: null, psr: null, evEbitda: null });
    sectors.push({ symbol, sector });
  }
  return { valuations, sectors };
}

describe("computeSectorRelativeBatch — STEP 956 §5-3 손계산 경계 검산", () => {
  it("표본 19 — minSample=20 미달, 전부 SAMPLE_TOO_SMALL·pct=null(n은 실제값 19 기록)", () => {
    const { valuations, sectors } = makeSector("Test", 19, "S19_");
    const rows = computeSectorRelativeBatch(valuations, sectors, 20);
    expect(rows).toHaveLength(19);
    for (const r of rows) {
      expect(r.perPct).toBeNull();
      expect(r.perN).toBe(19);
      expect(r.unavailable.per).toBe("SAMPLE_TOO_SMALL");
    }
  });

  it("표본 20 — minSample=20 충족, 전부 계산됨(pct 0~19/20)", () => {
    const { valuations, sectors } = makeSector("Test", 20, "S20_");
    const rows = computeSectorRelativeBatch(valuations, sectors, 20);
    expect(rows).toHaveLength(20);
    for (const r of rows) {
      expect(r.perPct).not.toBeNull();
      expect(r.perN).toBe(20);
      expect(r.unavailable.per).toBeUndefined();
    }
    const lowest = rows.find((r) => r.symbol === "S20_1")!;
    const highest = rows.find((r) => r.symbol === "S20_20")!;
    expect(lowest.perPct).toBeCloseTo(0 / 20);
    expect(highest.perPct).toBeCloseTo(19 / 20);
  });

  it("표본 21 — minSample=20보다 1 많음, 계산됨", () => {
    const { valuations, sectors } = makeSector("Test", 21, "S21_");
    const rows = computeSectorRelativeBatch(valuations, sectors, 20);
    expect(rows).toHaveLength(21);
    for (const r of rows) {
      expect(r.perN).toBe(21);
      expect(r.unavailable.per).toBeUndefined();
    }
  });

  it("업종 내 동점 — 서로를 '작다'고 세지 않음(중간순위 보정 없음)", () => {
    const valuations: ValuationInput[] = [
      { symbol: "A", per: 10, pbr: null, psr: null, evEbitda: null },
      { symbol: "B", per: 20, pbr: null, psr: null, evEbitda: null },
      { symbol: "C", per: 20, pbr: null, psr: null, evEbitda: null },
      { symbol: "D", per: 30, pbr: null, psr: null, evEbitda: null },
    ];
    const sectors: SectorInput[] = valuations.map((v) => ({ symbol: v.symbol, sector: "Tie" }));
    const rows = computeSectorRelativeBatch(valuations, sectors, 1);
    const byS = new Map(rows.map((r) => [r.symbol, r]));
    expect(byS.get("A")!.perPct).toBeCloseTo(0 / 4);
    expect(byS.get("B")!.perPct).toBeCloseTo(1 / 4); // A만 작음
    expect(byS.get("C")!.perPct).toBeCloseTo(1 / 4); // B와 동점 → 같은 백분위
    expect(byS.get("D")!.perPct).toBeCloseTo(3 / 4);
  });

  it("업종 내 전부 결측(PBR 축) — 유효표본 0 < minSample → 전부 SAMPLE_TOO_SMALL(n=0)", () => {
    const valuations: ValuationInput[] = [
      { symbol: "A", per: 10, pbr: null, psr: null, evEbitda: null },
      { symbol: "B", per: 20, pbr: null, psr: null, evEbitda: null },
    ];
    const sectors: SectorInput[] = valuations.map((v) => ({ symbol: v.symbol, sector: "AllMissing" }));
    const rows = computeSectorRelativeBatch(valuations, sectors, 1);
    for (const r of rows) {
      expect(r.pbrPct).toBeNull();
      expect(r.pbrN).toBe(0);
      expect(r.unavailable.pbr).toBe("SAMPLE_TOO_SMALL");
    }
  });

  it("섹터 null — 4축 전부 pct=null·NO_SECTOR, n도 null", () => {
    const valuations: ValuationInput[] = [{ symbol: "X", per: 10, pbr: 1, psr: 1, evEbitda: 1 }];
    const sectors: SectorInput[] = [{ symbol: "X", sector: null }];
    const rows = computeSectorRelativeBatch(valuations, sectors, 1);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.perPct).toBeNull(); expect(r.pbrPct).toBeNull(); expect(r.psrPct).toBeNull(); expect(r.evEbitdaPct).toBeNull();
    expect(r.perN).toBeNull(); expect(r.pbrN).toBeNull(); expect(r.psrN).toBeNull(); expect(r.evEbitdaN).toBeNull();
    expect(r.unavailable).toEqual({ per: "NO_SECTOR", pbr: "NO_SECTOR", psr: "NO_SECTOR", evEbitda: "NO_SECTOR" });
  });

  it("섹터는 있으나 그 종목만 값이 없음(다른 종목은 충분) — NO_VALUE(SAMPLE_TOO_SMALL과 구분)", () => {
    const { valuations, sectors } = makeSector("Test", 20, "NV_");
    valuations[0] = { ...valuations[0], per: null }; // 표본은 여전히 19(≥minSample 아님) — minSample을 19로 낮춰 나머지 19건은 충족시킨다
    const rows = computeSectorRelativeBatch(valuations, sectors, 19);
    const missing = rows.find((r) => r.symbol === "NV_1")!;
    expect(missing.perPct).toBeNull();
    expect(missing.perN).toBe(19); // 유효표본(자기 자신 제외 19명) 그대로 기록
    expect(missing.unavailable.per).toBe("NO_VALUE");
    const present = rows.find((r) => r.symbol === "NV_2")!;
    expect(present.perPct).not.toBeNull();
    expect(present.unavailable.per).toBeUndefined();
  });

  it("음수 PER 혼재 — 부호와 무관하게 값 크기로만 순위(음수가 항상 가장 작다)", () => {
    const valuations: ValuationInput[] = [
      { symbol: "NEG1", per: -50, pbr: null, psr: null, evEbitda: null },
      { symbol: "NEG2", per: -10, pbr: null, psr: null, evEbitda: null },
      { symbol: "POS1", per: 5, pbr: null, psr: null, evEbitda: null },
      { symbol: "POS2", per: 15, pbr: null, psr: null, evEbitda: null },
    ];
    const sectors: SectorInput[] = valuations.map((v) => ({ symbol: v.symbol, sector: "NegMix" }));
    const rows = computeSectorRelativeBatch(valuations, sectors, 1);
    const byS = new Map(rows.map((r) => [r.symbol, r]));
    expect(byS.get("NEG1")!.perPct).toBeCloseTo(0 / 4); // 가장 작음
    expect(byS.get("NEG2")!.perPct).toBeCloseTo(1 / 4);
    expect(byS.get("POS1")!.perPct).toBeCloseTo(2 / 4);
    expect(byS.get("POS2")!.perPct).toBeCloseTo(3 / 4); // 가장 큼(가장 비쌈)
  });

  it("축마다 독립 — PER은 충분표본, PBR은 부족표본인 업종 혼합", () => {
    const valuations: ValuationInput[] = [
      { symbol: "M1", per: 10, pbr: 1, psr: null, evEbitda: null },
      { symbol: "M2", per: 20, pbr: null, psr: null, evEbitda: null },
    ];
    const sectors: SectorInput[] = valuations.map((v) => ({ symbol: v.symbol, sector: "Mixed" }));
    const rows = computeSectorRelativeBatch(valuations, sectors, 2);
    const m1 = rows.find((r) => r.symbol === "M1")!;
    expect(m1.perPct).not.toBeNull(); // PER 유효표본 2 ≥ minSample
    expect(m1.unavailable.per).toBeUndefined();
    expect(m1.pbrPct).toBeNull(); // PBR 유효표본 1 < minSample
    expect(m1.unavailable.pbr).toBe("SAMPLE_TOO_SMALL");
  });
});
