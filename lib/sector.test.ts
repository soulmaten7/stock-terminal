// STEP 938 §3 — fetchSectorMap 유닛테스트: 입력→출력 동등·페이징 경계·빈 결과.
// NO_INDUSTRY 회귀는 이 파일이 아니라 app/api/cron/revdcf/route.branches.test.ts:97(수정하지 않음)로 확인한다.
import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchSectorMap, resolveSector } from "./sector";

function mockSb(pages: { ticker_norm: string; industry_group: string }[][]) {
  let call = 0;
  const chain = {
    select: () => chain,
    eq: () => chain,
    range: async () => {
      const data = pages[call] ?? [];
      call++;
      return { data };
    },
  };
  return { from: () => chain } as unknown as SupabaseClient;
}

describe("fetchSectorMap", () => {
  it("정상: 3행 mock → Map 3건 · rows:3 · source:damodaran", async () => {
    const sb = mockSb([
      [
        { ticker_norm: "AAPL", industry_group: "Computers/Peripherals" },
        { ticker_norm: "MSFT", industry_group: "Software (System & Application)" },
        { ticker_norm: "GOOGL", industry_group: "Advertising" },
      ],
    ]);
    const r = await fetchSectorMap(sb, { field: "industryGroup", source: "damodaran" });
    expect(r.rows).toBe(3);
    expect(r.source).toBe("damodaran");
    expect(r.byTicker.size).toBe(3);
    expect(r.byTicker.get("AAPL")).toBe("Computers/Peripherals");
    expect(r.byTicker.get("GOOGL")).toBe("Advertising");
  });

  it("페이징 경계: 1,000행 + 1행을 두 번에 나눠 줘도 1,001건 전부 수집", async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => ({ ticker_norm: `T${i}`, industry_group: "IND" }));
    const page2 = [{ ticker_norm: "T1000", industry_group: "IND2" }];
    const sb = mockSb([page1, page2]);
    const r = await fetchSectorMap(sb, { field: "industryGroup", source: "damodaran" });
    expect(r.rows).toBe(1001);
    expect(r.byTicker.size).toBe(1001);
    expect(r.byTicker.get("T999")).toBe("IND");
    expect(r.byTicker.get("T1000")).toBe("IND2");
  });

  it("빈 결과: 0행 → 빈 Map · rows:0 (예외 아님)", async () => {
    const sb = mockSb([[]]);
    const r = await fetchSectorMap(sb, { field: "industryGroup", source: "damodaran" });
    expect(r.rows).toBe(0);
    expect(r.byTicker.size).toBe(0);
  });
});

// STEP 940/942 — resolveSector(0~4순위 해석기) 유닛테스트.
// missing219(lib/sector.ts가 정적 import하는 실제 파일)의 실 데이터를 SIC 관련 테스트에 그대로 쓴다(sic 값을 지어내지 않음).
// 942: 3순위 = 야후 단독(A안). crossCheck는 나스닥·SIC·야후가 각각 뭐라 했는지 사실만 담는다(sector·source를 안 바꿈).
type Damo = { ticker_norm: string; primary_sector: string | null; sic_code: string | null };

function mockResolveSb(fx: {
  gics?: { symbol: string; sector: string }[];
  damo?: Damo[];
  nasdaq?: { symbol: string; sector: string | null }[];
  yahoo?: { symbol: string; sector: string | null }[];
}) {
  const tables: Record<string, unknown[]> = {
    us_sector_gics: fx.gics ?? [],
    damodaran_industry: fx.damo ?? [],
    us_sector_nasdaq: fx.nasdaq ?? [],
    us_sector_yahoo: fx.yahoo ?? [],
  };
  return {
    from: (table: string) => {
      const rows = tables[table] ?? [];
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: rows.length ? { as_of: "2026-08-08" } : null }),
        range: async (from: number) => ({ data: from === 0 ? rows : [] }),
      };
      return chain;
    },
  } as unknown as SupabaseClient;
}
const noCross = { nasdaq: null, sic: null, yahoo: null, disagree: false };

describe("resolveSector", () => {
  it("0순위 우선: SPDR과 Damodaran이 다르면 SPDR이 이긴다", async () => {
    const sb = mockResolveSb({
      gics: [{ symbol: "XYZ", sector: "Energy" }],
      damo: [{ ticker_norm: "XYZ", primary_sector: "Financials", sic_code: null }],
    });
    const m = await resolveSector(sb, ["XYZ"]);
    expect(m.get("XYZ")).toEqual({ sector: "Energy", source: "spdr", crossCheck: { nasdaq: null, sic: null, yahoo: null, disagree: false } });
  });

  it("🔑 0순위 우선 불변(942): SPDR과 야후가 다르면 SPDR이 이긴다", async () => {
    const sb = mockResolveSb({
      gics: [{ symbol: "XYZ", sector: "Energy" }],
      yahoo: [{ symbol: "XYZ", sector: "Utilities" }],
    });
    const m = await resolveSector(sb, ["XYZ"]);
    expect(m.get("XYZ")?.sector).toBe("Energy");
    expect(m.get("XYZ")?.source).toBe("spdr");
    expect(m.get("XYZ")?.crossCheck.yahoo).toBe("Utilities"); // 채택은 안 됐지만 사실은 담긴다
  });

  it("1순위: SPDR에 없고 Damodaran 직접 매칭만 있으면 damodaran", async () => {
    const sb = mockResolveSb({ damo: [{ ticker_norm: "XYZ", primary_sector: "Materials", sic_code: null }] });
    const m = await resolveSector(sb, ["XYZ"]);
    expect(m.get("XYZ")).toEqual({ sector: "Materials", source: "damodaran", crossCheck: noCross });
  });

  it("2순위 형제: GOOG → GOOGL의 섹터를 물려받는다(GOOG 자체는 Damodaran에 없음)", async () => {
    const sb = mockResolveSb({ damo: [{ ticker_norm: "GOOGL", primary_sector: "Communication Services", sic_code: null }] });
    const m = await resolveSector(sb, ["GOOG"]);
    expect(m.get("GOOG")).toEqual({ sector: "Communication Services", source: "damodaran-sibling", crossCheck: noCross });
  });

  it("2순위 형제: BRK-B → BRKA(정규화 BRKA)의 섹터를 물려받는다", async () => {
    const sb = mockResolveSb({ damo: [{ ticker_norm: "BRKA", primary_sector: "Financials", sic_code: null }] });
    const m = await resolveSector(sb, ["BRK-B"]);
    expect(m.get("BRK-B")).toEqual({ sector: "Financials", source: "damodaran-sibling", crossCheck: noCross });
  });

  it("🔴 회귀(940 실측 발견): 구두점 없는 티커끼리는 뿌리·±1글자가 비슷해도 형제로 묶지 않는다 — ASML→ASMB(전혀 다른 회사) 실사례", async () => {
    const sb = mockResolveSb({ damo: [{ ticker_norm: "ASMB", primary_sector: "Health Care", sic_code: null }] });
    const m = await resolveSector(sb, ["ASML"]);
    expect(m.has("ASML")).toBe(false);
  });

  it("🔴 형제 후보가 2개 이상이면 미분류(임의 선택 금지)", async () => {
    const sb = mockResolveSb({
      damo: [
        { ticker_norm: "XYZA", primary_sector: "Financials", sic_code: null },
        { ticker_norm: "XYZC", primary_sector: "Industrials", sic_code: null },
      ],
    });
    const m = await resolveSector(sb, ["XYZ-B"]); // 구두점 있어야 뿌리 패턴이 시도됨(940 오매칭 수정 이후)
    expect(m.has("XYZ-B")).toBe(false);
  });

  it("🔑 3순위(942 A안): 야후 assetProfile 단독으로 채택된다", async () => {
    const sb = mockResolveSb({ yahoo: [{ symbol: "SONY", sector: "Technology" }] });
    const m = await resolveSector(sb, ["SONY"]);
    expect(m.get("SONY")).toEqual({ sector: "Technology", source: "yahoo", crossCheck: { nasdaq: null, sic: null, yahoo: "Technology", disagree: false } });
  });

  it("🔴 3순위(942): 나스닥·SIC만 있고 야후가 없으면 미분류(나스닥∩SIC 합의는 더 이상 채택 근거가 아니다)", async () => {
    const sb = mockResolveSb({
      damo: [
        { ticker_norm: "AA1", primary_sector: "Consumer Staples", sic_code: "2080" },
        { ticker_norm: "AA2", primary_sector: "Consumer Staples", sic_code: "2080" },
        { ticker_norm: "AA3", primary_sector: "Consumer Staples", sic_code: "2080" },
      ],
      nasdaq: [{ symbol: "ABEV", sector: "Consumer Staples" }], // missing219 실 데이터: ABEV sic=2080 → 나스닥·SIC 합의 O이지만 942 이후로는 채택 안 함
    });
    const m = await resolveSector(sb, ["ABEV"]);
    expect(m.has("ABEV")).toBe(false);
  });

  it("어느 순위도 못 찾으면 Map에 없다(미분류 = 부재)", async () => {
    const sb = mockResolveSb({});
    const m = await resolveSector(sb, ["NOTREAL"]);
    expect(m.has("NOTREAL")).toBe(false);
    expect(m.size).toBe(0);
  });

  it("🔑 skipTier0: SPDR을 건너뛰면 1순위(damodaran)가 대신 잡힌다(940 §4-2 0순위 제외 채점용)", async () => {
    const sb = mockResolveSb({
      gics: [{ symbol: "XYZ", sector: "Energy" }],
      damo: [{ ticker_norm: "XYZ", primary_sector: "Financials", sic_code: null }],
    });
    const m = await resolveSector(sb, ["XYZ"], { skipTier0: true });
    expect(m.get("XYZ")?.sector).toBe("Financials");
    expect(m.get("XYZ")?.source).toBe("damodaran");
  });

  it("🔑 crossCheck.disagree: nasdaq·sic·yahoo 중 값 있는 게 2개 이상이고 서로 다르면 true(채택된 sector와의 비교가 아니다)", async () => {
    const sb = mockResolveSb({
      damo: [{ ticker_norm: "XYZ", primary_sector: "Financials", sic_code: null }], // 1순위로 채택 — crossCheck는 이 값과 무관
      nasdaq: [{ symbol: "XYZ", sector: "Technology" }], // → GICS Information Technology
      yahoo: [{ symbol: "XYZ", sector: "Energy" }], // crossCheck용 — nasdaq과 다름
    });
    const m = await resolveSector(sb, ["XYZ"]);
    expect(m.get("XYZ")?.source).toBe("damodaran");
    expect(m.get("XYZ")?.crossCheck.disagree).toBe(true);
    expect(m.get("XYZ")?.crossCheck.nasdaq).toBe("Information Technology");
    expect(m.get("XYZ")?.crossCheck.yahoo).toBe("Energy");
  });

  it("🔑 crossCheck.disagree: 값을 가진 출처가 하나뿐이면 false", async () => {
    const sb = mockResolveSb({ damo: [{ ticker_norm: "XYZ", primary_sector: "Financials", sic_code: null }] });
    const m = await resolveSector(sb, ["XYZ"]);
    expect(m.get("XYZ")?.crossCheck.disagree).toBe(false);
  });

  it("🔑 crossCheck는 sector를 바꾸지 않는다 — 나스닥·야후가 갈려도 채택된 damodaran 값 그대로", async () => {
    const sb = mockResolveSb({
      damo: [{ ticker_norm: "XYZ", primary_sector: "Financials", sic_code: null }],
      nasdaq: [{ symbol: "XYZ", sector: "Technology" }],
      yahoo: [{ symbol: "XYZ", sector: "Energy" }],
    });
    const m = await resolveSector(sb, ["XYZ"]);
    expect(m.get("XYZ")?.sector).toBe("Financials");
    expect(m.get("XYZ")?.source).toBe("damodaran");
    expect(m.get("XYZ")?.crossCheck).toEqual({ nasdaq: "Information Technology", sic: null, yahoo: "Energy", disagree: true });
  });

  it("🔴 나스닥 Miscellaneous는 crossCheck.nasdaq에도 안 남는다(매핑표 밖)", async () => {
    const sb = mockResolveSb({
      // us_sector_yahoo.sector는 적재 시점(scripts/ingest_yahoo_sector.ts)에 이미 GICS로 매핑된 값 — 원문("Basic Materials") 아님
      yahoo: [{ symbol: "AGI", sector: "Materials" }], // 3순위로 채택
      nasdaq: [{ symbol: "AGI", sector: "Miscellaneous" }],
    });
    const m = await resolveSector(sb, ["AGI"]);
    expect(m.get("AGI")?.source).toBe("yahoo");
    expect(m.get("AGI")?.crossCheck.nasdaq).toBeNull();
  });
});
