// STEP 938 §3 — fetchSectorMap 유닛테스트: 입력→출력 동등·페이징 경계·빈 결과.
// NO_INDUSTRY 회귀는 이 파일이 아니라 app/api/cron/revdcf/route.branches.test.ts:97(수정하지 않음)로 확인한다.
import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchSectorMap, resolveSector, latestAsOf } from "./sector";

// STEP 954 — fetchSectorMap이 이제 fetchAllRows(내부에서 .order()를 건 뒤 .range())를 쓴다 —
// 이 mock의 검증 대상(입력→출력 동등·페이징 경계·빈 결과)은 그대로이고, .order()가 체인에 없어서
// 나던 "q.order is not a function"만 고친다(다른 어설션은 무변경).
// STEP1004 — fetchSectorMap이 이제 먼저 latestAsOf()를 호출한다(.select("as_of").order().limit().maybeSingle()).
// .limit()·.maybeSingle()을 추가해 고정 as_of 스텁을 반환 — eq()는 여전히 no-op이라 이후 .range() 결과(pages)는 무변경.
function mockSb(pages: { ticker_norm: string; industry_group: string }[][]) {
  let call = 0;
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => ({ data: { as_of: "2026-08-01" } }),
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

// ────────────────────────────────────────────────────────────────
// STEP1004 §3-3 — latestAsOf() 단위테스트: 0 as_of(빈 테이블) · 1 as_of(현재 실제 상태) · 2 as_of(시뮬레이션).
// 973/954가 쓰던 이 패턴을 export해서 damodaran_* 4개 테이블 + damodaran_industry 조회에 재사용했다
// (route.ts·page.tsx·compute_revdcf_all.ts·lib/sector.ts 자신) — 그 재사용의 근거가 되는 함수 자체를 검증한다.
// ────────────────────────────────────────────────────────────────
describe("latestAsOf (STEP1004)", () => {
  // 실제 Postgres의 order(desc).limit(1)이 서버에서 정렬해 클라이언트로 "이미 가장 최신 1행"만 내려주므로,
  // 이 모의 함수도 같은 계약(정렬된 결과의 첫 행)을 흉내낸다 — 클라이언트 코드(latestAsOf)가 그 결과를
  // 있는 그대로 신뢰하고 반환하는지만 본다(Postgres의 정렬 자체를 재검증하는 게 아니다).
  function mockTableWithRows(rows: { as_of: string }[]) {
    const sorted = [...rows].sort((a, b) => (a.as_of < b.as_of ? 1 : a.as_of > b.as_of ? -1 : 0));
    const chain = {
      select: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({ data: sorted[0] ?? null }),
    };
    return { from: () => chain } as unknown as SupabaseClient;
  }

  it("0 as_of(빈 테이블) → null 반환(에러를 던지지 않는다)", async () => {
    const sb = mockTableWithRows([]);
    const r = await latestAsOf(sb, "damodaran_global_inputs");
    expect(r).toBeNull();
  });

  it("1 as_of(현재 실제 damodaran_global_inputs 상태와 동일 모양) → 그 값을 그대로 반환", async () => {
    const sb = mockTableWithRows([{ as_of: "2026-01-05" }]);
    const r = await latestAsOf(sb, "damodaran_global_inputs");
    expect(r).toBe("2026-01-05");
  });

  it("2 as_of(시뮬레이션 — ERPbymonth 월간 갱신이 배선됐다고 가정) → 더 최신(큰) as_of를 고른다, 오래된 쪽 아님", async () => {
    const sb = mockTableWithRows([{ as_of: "2026-01-05" }, { as_of: "2026-08-01" }]);
    const r = await latestAsOf(sb, "damodaran_global_inputs");
    expect(r).toBe("2026-08-01");
    expect(r).not.toBe("2026-01-05");
  });

  it("2 as_of, 입력 순서를 뒤집어도(오래된 것이 배열 뒤에 와도) 여전히 최신을 고른다", async () => {
    const sb = mockTableWithRows([{ as_of: "2026-08-01" }, { as_of: "2026-01-05" }]);
    const r = await latestAsOf(sb, "damodaran_global_inputs");
    expect(r).toBe("2026-08-01");
  });

  it("🔴 대조군 — 구코드 패턴(.select('*').single(), as_of 필터 없음)은 2행이 있으면 던진다(신코드가 왜 필요한지의 증거)", async () => {
    // 실제 supabase-js의 .single()은 0행 또는 2행+ 이면 에러를 던진다(PostgrestError, "multiple (or no) rows returned").
    // 이 STEP은 그 계약을 재구현하지 않고, 같은 실패조건을 흉내낸 최소 스텁으로 "2행이면 던진다"만 보인다.
    function legacySingle(rows: { as_of: string }[]) {
      if (rows.length !== 1) throw new Error(`PostgrestError: multiple (or no) rows returned (got ${rows.length})`);
      return rows[0];
    }
    // 1003이 찾아낸 정확한 시나리오: ERPbymonth 월간 갱신으로 2번째 as_of 행이 생겼다고 가정
    const twoRows = [{ as_of: "2026-01-05" }, { as_of: "2026-08-01" }];
    expect(() => legacySingle(twoRows)).toThrow(/multiple/);

    // 신코드는 latestAsOf로 먼저 좁히므로 같은 2행 상황에서도 안전하게 값을 얻는다
    const sb = mockTableWithRows(twoRows);
    const asOf = await latestAsOf(sb, "damodaran_global_inputs");
    expect(asOf).toBe("2026-08-01");
    // 그 as_of로 필터한 뒤에는 정확히 1행만 남으므로(as_of가 PK 성격) .single()도 안전해진다
    const filtered = twoRows.filter((r) => r.as_of === asOf);
    expect(() => legacySingle(filtered)).not.toThrow();
  });
});
