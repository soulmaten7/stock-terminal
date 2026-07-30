// STEP 831 §10 — 퀄리티 깊이(구성요소 분해·시계열) 값 잠금 테스트(스냅샷 아님·값 검증).
// 잠그는 것: ① 구성요소를 원자료에서 계산(최종값 역산 아님) ② 항등식 마진×회전율=GP/A ③ 연도 매칭·불연속 표시
//   ④ 분모를 되돌리면(전기말 자산) 실패(819 방식) ⑤ 매출총이익 경로(direct/computed) 구분.
import { describe, it, expect } from "vitest";
import { quality } from "./lenses";
import type { StockData } from "./lenses/types";
import type { FRow } from "./fscore";

function sd(financials: FRow[]): StockData {
  return { symbol: "T", resolved: "T", name: "T", price: null, closes: [], pe: null, pb: null, financials };
}
const CUTS = { quality: { lo: 15, hi: 40, n: 100, asOf: "2026-01-01" } };
function parts(d: NonNullable<Awaited<ReturnType<typeof quality.compute>>["decomposition"]>) {
  return Object.fromEntries(d.parts.map((p) => [p.key, p.value]));
}

describe("퀄리티 §10-① 구성요소 분해", () => {
  it("매출총이익 없으면 매출−원가로 계산(computed) + 항등식 마진×회전율=GP/A%", async () => {
    // revenue 200 · cogs 140 → gp 60 · AT 100 → GP/A 60% · margin 30% · turnover 2.0
    const r = await quality.compute(sd([{ date: "2023-12-31", totalRevenue: 200, costOfRevenue: 140, totalAssets: 100 }]), "ko", CUTS);
    expect(r.value).toBe(60); // GP/A%
    const d = r.decomposition!;
    expect(d.source).toBe("computed");
    const p = parts(d);
    expect(p.revenue).toBe(200);
    expect(p.cogs).toBe(140);
    expect(p.grossProfit).toBe(60); // 원자료에서 200−140 (최종 GP/A에서 역산 아님)
    expect(p.totalAssets).toBe(100);
    expect(p.grossMargin).toBe(30); // 60/200*100
    expect(p.assetTurnover).toBe(2); // 200/100
    // 항등식: 마진% × 회전율 = GP/A%
    expect((p.grossMargin as number) * (p.assetTurnover as number)).toBeCloseTo(r.value as number, 6);
  });

  it("매출총이익 보고값 있으면 그대로(direct)", async () => {
    const r = await quality.compute(sd([{ date: "2023-12-31", totalRevenue: 200, grossProfit: 50, totalAssets: 100 }]), "ko", CUTS);
    const d = r.decomposition!;
    expect(d.source).toBe("direct");
    expect(parts(d).grossProfit).toBe(50); // 매출−원가(computed)가 아니라 보고값
    expect(r.value).toBe(50); // 50/100*100
  });

  it("총자산 없으면 분해 불가 → decomposition null(지어내지 않음)", async () => {
    const r = await quality.compute(sd([{ date: "2023-12-31", totalRevenue: 200, costOfRevenue: 140 }]), "ko", CUTS);
    expect(r.decomposition).toBeNull();
    expect(r.value).toBeNull();
  });
});

describe("퀄리티 §10-② 시계열(연도 매칭·불연속)", () => {
  it("불연속 연도(2021·2022·2024)는 2023을 missing으로 표시(건너뛰지 않음)", async () => {
    const fin: FRow[] = [
      { date: "2021-12-31", grossProfit: 20, totalAssets: 100 }, // 20%
      { date: "2022-12-31", grossProfit: 30, totalAssets: 100 }, // 30%
      { date: "2024-12-31", grossProfit: 50, totalAssets: 100 }, // 50%
    ];
    const r = await quality.compute(sd(fin), "ko", CUTS);
    const ts = r.timeSeries!;
    expect(ts.points.map((p) => [p.year, p.value, p.missing ?? false])).toEqual([
      [2021, 20, false],
      [2022, 30, false],
      [2023, null, true], // 결측 연도 정직 표시
      [2024, 50, false],
    ]);
  });

  it("🔴 분모는 각 해 기말 총자산(815) — 전기말로 되돌리면 실패", async () => {
    // 2022 AT=80 · 2023 gp=60·AT=100. 당해 기말: 60/100=60%. 전기말이면 60/80=75%(오답).
    const r = await quality.compute(sd([
      { date: "2022-12-31", grossProfit: 40, totalAssets: 80 },
      { date: "2023-12-31", grossProfit: 60, totalAssets: 100 },
    ]), "ko", CUTS);
    const ts = r.timeSeries!;
    const y2023 = ts.points.find((p) => p.year === 2023);
    expect(y2023?.value).toBe(60); // 당해 기말 100 (전기말 80이면 75 — 되돌리면 이 단언이 깨짐)
    expect(r.value).toBe(60); // 최신연도 GP/A도 당해 기말
  });
});
