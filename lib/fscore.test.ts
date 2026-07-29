import { describe, it, expect } from "vitest";
import { computeFScore, type FRow } from "./fscore";

// STEP 801 — 값 검증(스냅샷 아님·기존 특성화 스냅샷 대체). 3개 회계연도(PP·P·T) 오름차순.
// ROA·자산회전율 분모 = 기초(전기말) 총자산(Piotroski 2000 원전).
// STEP 803: 필수 필드 결측 시 사유를 '데이터 부족'으로 정직 표기(은행 단정 금지) + 회계연도 연속성·분할 조정 검증.
function rows(over: { pp?: Partial<FRow>; p?: Partial<FRow>; t?: Partial<FRow> } = {}): FRow[] {
  const PP: FRow = { date: "2021-12-31", totalAssets: 1000, ...over.pp }; // P의 기초 자산 = PP 기말
  const P: FRow = {
    date: "2022-12-31",
    netIncome: 50, operatingCashFlow: 60, ordinarySharesNumber: 100,
    currentAssets: 200, currentLiabilities: 100, longTermDebt: 100,
    totalAssets: 1000, totalRevenue: 500, grossProfit: 200, ...over.p,
  };
  const T: FRow = {
    date: "2023-12-31",
    netIncome: 80, operatingCashFlow: 90, ordinarySharesNumber: 100,
    currentAssets: 250, currentLiabilities: 90, longTermDebt: 80,
    totalAssets: 1100, totalRevenue: 600, grossProfit: 280, ...over.t,
  };
  return [PP, P, T];
}
function passKeys(r: FRow[]): Set<string> {
  return new Set(computeFScore(r).criteria.filter((c) => c.pass).map((c) => c.key));
}

describe("computeFScore — 지원 조건", () => {
  it("3년 미만 → 미지원(reason=3년 안내)", () => {
    const two = rows().slice(1); // P·T만(2년)
    const f = computeFScore(two);
    expect(f.supported).toBe(false);
    expect(f.reason).toContain("3");
    expect(f.score).toBe(0);
  });
  it("기초 총자산(PP 기말) 없으면 미지원", () => {
    expect(computeFScore(rows({ pp: { totalAssets: 0 } })).supported).toBe(false);
  });
  it("정상 3년 → 지원", () => {
    expect(computeFScore(rows()).supported).toBe(true);
  });
  it("필수 필드 결측(매출총이익·매출 없음): 미지원 + 사유는 '데이터 부족'(은행 단정 금지·STEP 803 §1)", () => {
    const missing = rows({
      p: { grossProfit: null, costOfRevenue: null, totalRevenue: null },
      t: { grossProfit: null, costOfRevenue: null, totalRevenue: null },
    });
    const f = computeFScore(missing);
    expect(f.supported).toBe(false);
    expect(f.reason).not.toContain("은행");
    expect(f.reason).not.toContain("보험");
    expect(f.reason).toContain("데이터");
    // en 로케일도 은행 단정이 없어야 함
    expect(computeFScore(missing, "en").reason).not.toMatch(/bank|insurer/i);
  });
  it("회계연도 비연속(2021·2022·2024 — 2023 결측): 미지원 + 사유는 연속성 안내(STEP 803 §5)", () => {
    const gap = rows({ t: { date: "2024-12-31" } }); // PP 2021·P 2022·T 2024 → P→T 2년
    const f = computeFScore(gap);
    expect(f.supported).toBe(false);
    expect(f.reason).not.toContain("은행");
  });
  it("주식수 정수배 급변(액면분할): no_dilute 오탐 없음(통과)+조정 표기·max 항상 9(STEP 808 §3)", () => {
    // T 주식수 = P의 4배(4:1 분할) → 원값 비교면 '신주발행=실패' 오탐. 분할로 보고 통과 + 조정 표기. max는 9 고정(소비처 9·7 하드코딩과 정합).
    const split = computeFScore(rows({ t: { ordinarySharesNumber: 400 } }));
    const nd = split.criteria.find((x) => x.key === "no_dilute");
    expect(nd?.pass).toBe(true);
    expect(nd?.note).toMatch(/조정/);
    expect(split.max).toBe(9);
  });
  it("정상 주식수(급변 없음): no_dilute 정상 채점·max 9", () => {
    const f = computeFScore(rows());
    expect(f.criteria.find((x) => x.key === "no_dilute")?.note).not.toMatch(/조정/);
    expect(f.max).toBe(9);
  });
});

describe("computeFScore — 9항목 전부 통과 세트(비금융 정상)", () => {
  it("설계상 9점·양호(ko 기본)", () => {
    const f = computeFScore(rows());
    expect(f.score).toBe(9);
    expect(f.grade).toBe("양호");
    expect(f.criteria.length).toBe(9);
  });
});

describe("computeFScore — 개별 항목 경계(하나씩 뒤집기)", () => {
  it("roa_pos: 순이익 음수 → roa_pos·roa_up 실패", () => {
    const k = passKeys(rows({ t: { netIncome: -10 } }));
    expect(k.has("roa_pos")).toBe(false);
    expect(k.has("roa_up")).toBe(false);
  });
  it("cfo_pos: 영업현금 음수 → cfo_pos·accrual 실패", () => {
    const k = passKeys(rows({ t: { operatingCashFlow: -5 } }));
    expect(k.has("cfo_pos")).toBe(false);
    expect(k.has("accrual")).toBe(false);
  });
  it("no_dilute: 주식수 증가 → 실패 (기본은 통과)", () => {
    // 130 = 1.3배(정수배 아님) → 진짜 희석으로 판정 실패. (정수배 급증은 분할로 별도 처리·STEP 803 §4)
    expect(passKeys(rows({ t: { ordinarySharesNumber: 130 } })).has("no_dilute")).toBe(false);
    expect(passKeys(rows()).has("no_dilute")).toBe(true);
  });
  it("margin_up: 매출총이익률 하락 → 실패", () => {
    expect(passKeys(rows({ t: { grossProfit: 100 } })).has("margin_up")).toBe(false);
  });
  it("lever_dn: 장기부채비율 상승 → 실패", () => {
    expect(passKeys(rows({ t: { longTermDebt: 300 } })).has("lever_dn")).toBe(false);
  });
  it("liq_up: 유동비율 하락 → 실패", () => {
    expect(passKeys(rows({ t: { currentLiabilities: 500 } })).has("liq_up")).toBe(false);
  });
});

describe("computeFScore — 기초(전기말) 총자산이 실제로 분모인지 검증", () => {
  it("ROA_P·회전율_P의 분모는 P 기말이 아니라 PP(기초) 자산", () => {
    // 기본 PP=1000: roaP=50/1000=0.05 < roaT=80/1000=0.08 → roa_up 통과 · atP=0.5 < atT=0.6 → turn_up 통과
    const base = passKeys(rows());
    expect(base.has("roa_up")).toBe(true);
    expect(base.has("turn_up")).toBe(true);
    // PP=400으로 낮추면 roaP=50/400=0.125 > roaT 0.08 → roa_up 실패 · atP=1.25 > 0.6 → turn_up 실패.
    // (분모가 P 자신의 기말=1000이었다면 PP 변조에도 불변이어야 함 → 바뀐다 = PP(기초)가 실제로 쓰인다는 증거)
    const beg = passKeys(rows({ pp: { totalAssets: 400 } }));
    expect(beg.has("roa_up")).toBe(false);
    expect(beg.has("turn_up")).toBe(false);
  });
});
