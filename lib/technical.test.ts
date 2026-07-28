import { describe, it, expect } from "vitest";
import { rsi, sma, rsiState, maTrendState } from "./technical";

// STEP 801 — Wilder RSI(재귀 평활 α=1/14)를 **공개 참조값과 대조**.
// 참조 = StockCharts ChartSchool "Relative Strength Index" 워크시트(널리 인용되는 표준 예제).
//   첫 RSI(15봉·14변화) = 70.53 · 마지막(33봉) = 37.77. (증권사 HTS·TradingView와 같은 계산.)
const STOCKCHARTS = [
  44.3389, 44.0902, 44.1497, 43.6124, 44.3278, 44.8264, 45.0955, 45.4245, 45.8433,
  46.0826, 45.8931, 46.0328, 45.614, 46.282, 46.282, 46.0027, 46.0328, 46.4116,
  46.2222, 45.6439, 46.2122, 46.2521, 45.7137, 46.4515, 45.7835, 45.3548, 44.0288,
  44.1783, 44.2181, 44.5672, 43.4205, 42.6628, 43.1314,
];

describe("rsi — Wilder(14) 공개 참조값 대조", () => {
  it("첫 값(15봉) = 70.53", () => {
    expect(rsi(STOCKCHARTS.slice(0, 15))!).toBeCloseTo(70.53, 2);
  });
  it("마지막(33봉) = 37.77", () => {
    expect(rsi(STOCKCHARTS)!).toBeCloseTo(37.77, 2);
  });
  it("period+1 미만 → null", () => {
    expect(rsi(STOCKCHARTS.slice(0, 14))).toBeNull();
    expect(rsi([100])).toBeNull();
  });
  it("전부 상승(하락 0) → 100", () => {
    expect(rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])).toBe(100);
  });
  it("전체 계열을 써 평활 — 마지막 period만 보지 않는다", () => {
    // 동일한 마지막 15봉이라도 앞쪽 계열이 다르면 값이 다르다(재귀 평활).
    const tail = STOCKCHARTS.slice(-15);
    expect(rsi(STOCKCHARTS)).not.toBeCloseTo(rsi(tail)!, 1);
  });
});

describe("sma", () => {
  it("최근 n개 단순평균", () => {
    expect(sma([10, 20, 30, 40], 2)).toBe(35);
    expect(sma([1, 2, 3, 4, 5], 5)).toBe(3);
  });
  it("n 미만 → null", () => {
    expect(sma([1, 2], 3)).toBeNull();
  });
});

describe("rsiState / maTrendState — 컷", () => {
  it("rsiState 30/70", () => {
    expect(rsiState(71)).toBe("hot");
    expect(rsiState(70)).toBe("neutral");
    expect(rsiState(29)).toBe("cold");
    expect(rsiState(30)).toBe("neutral");
    expect(rsiState(null)).toBeNull();
  });
  it("maTrendState (동가=up)", () => {
    expect(maTrendState(110, 100)).toBe("up");
    expect(maTrendState(100, 100)).toBe("up");
    expect(maTrendState(90, 100)).toBe("down");
    expect(maTrendState(null, 100)).toBeNull();
    expect(maTrendState(100, null)).toBeNull();
  });
});
