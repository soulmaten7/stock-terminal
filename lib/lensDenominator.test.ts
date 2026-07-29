// STEP 819 §5: 분모 시점 회귀 잠금 — GP/A(당해 기말)·자산성장(전기)·F-스코어 ROA(기초)를 **값으로** 고정한다.
// 픽스처의 전기·당기 총자산을 **다르게** 줘서, 분모 시점을 되돌리면 값이 달라져 테스트가 깨지게 한다(815 유형 재발 방지).
// + 음성 어서션: 재현 실패로 화면에서 내린 점추정이 note에 다시 들어오면 실패(양성 토큰 검사만으론 못 잡음).
import { describe, it, expect } from "vitest";
import { quality, assetGrowth } from "./lenses";
import { computeFScore, type FRow } from "./fscore";
import { LENS_COPY } from "./lensCopy";
import type { StockData } from "./lenses/types";

function sd(financials: FRow[]): StockData {
  return { symbol: "T", resolved: "T", name: "T", price: null, closes: [], pe: null, pb: null, financials };
}

describe("분모 시점 잠금 (STEP 819 §5)", () => {
  it("GP/A = 매출총이익 ÷ **당해 기말** 총자산 (Novy-Marx·815) — 전기말로 되돌리면 값이 달라짐", async () => {
    // 전기 자산 100 · 당해 자산 200 · 매출총이익 60 → 당해: 60/200=30% (전기말이면 60/100=60%)
    const r = await quality.compute(sd([{ totalAssets: 100 }, { grossProfit: 60, totalAssets: 200 }]), "ko");
    expect(r.value).toBe(30); // 60이면 전기말로 되돌아간 회귀
  });

  it("자산성장 = (당해/전기 − 1)×100 — **전기(기초)** 분모 (CGS·816) — 당해 분모면 항상 0", async () => {
    const r = await assetGrowth.compute(sd([{ totalAssets: 100 }, { totalAssets: 130 }]), "ko");
    expect(r.value).toBe(30); // (130/100−1)*100=30. 당해 분모면 (130/130−1)=0
  });

  it("F-스코어 ROA = 순이익 ÷ **기초(전기말)** 총자산 (Piotroski·818) — 기말이면 값이 달라짐", () => {
    // 3년 연속: 기초자산 = 전기말. T{순이익40·자산400}, 전기 자산 200 → ROA_t = 40/200 = 20.0% (기말이면 40/400=10.0%)
    const base = { operatingCashFlow: 5, ordinarySharesNumber: 10, currentAssets: 60, currentLiabilities: 40, longTermDebt: 10 };
    const rows: FRow[] = [
      { date: "2022-12-31", totalAssets: 100, netIncome: 5, totalRevenue: 100, grossProfit: 30, ...base },
      { date: "2023-12-31", totalAssets: 200, netIncome: 8, totalRevenue: 120, grossProfit: 40, ...base, operatingCashFlow: 9 },
      { date: "2024-12-31", totalAssets: 400, netIncome: 40, totalRevenue: 150, grossProfit: 60, ...base, operatingCashFlow: 50 },
    ];
    const f = computeFScore(rows, "ko");
    expect(f.supported).toBe(true);
    const roa = f.criteria.find((c) => c.key === "roa_pos");
    expect(roa?.note).toBe("ROA 20.0%"); // 기말(400)이면 "ROA 10.0%"
  });
});

// 음성 어서션 — 813~817에서 재현 실패로 삭제한 자체 백테스트 점추정이 note에 다시 들어오면 실패.
describe("제거된 점추정 재유입 방지 (STEP 819 §5 음성 어서션)", () => {
  const REMOVED: Record<string, string[]> = {
    momentum: ["t≈2.5", "0.71", "67%", "t≈3.6"],       // 821 (자체 백테스트 재현 실패)
    lowvol: ["t≈1.6", "t≈3.1", "t≈2.6", "161개월"],   // 813
    valuation: ["t≈0.9", "t≈1.5", "βHML≈0.71", "+6~9%"], // 814
    quality: ["t≈2.9", "샤프 0.78", "t≈2.5", "t≈3.2", "t≈2.75"], // 815 (자체 백테스트 값)
    assetgrowth: ["t≈1.6", "βHML≈0.17", "+8%"],        // 816
    technical: ["−8.7%", "t≈−2.0", "t≈1.6", "t≈2.7", "153개월"], // 817
  };
  for (const [lens, pats] of Object.entries(REMOVED)) {
    it(`${lens}: 삭제한 점추정이 note에 없어야 (ko·en)`, () => {
      for (const loc of ["ko", "en"] as const) {
        const note = (LENS_COPY[loc] as unknown as Record<string, { note?: string }>)[lens]?.note ?? "";
        for (const p of pats) expect(note.includes(p), `${loc}/${lens}: 삭제한 '${p}' 재유입`).toBe(false);
      }
    });
  }
});
