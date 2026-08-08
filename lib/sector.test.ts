// STEP 938 §3 — fetchSectorMap 유닛테스트: 입력→출력 동등·페이징 경계·빈 결과.
// NO_INDUSTRY 회귀는 이 파일이 아니라 app/api/cron/revdcf/route.branches.test.ts:97(수정하지 않음)로 확인한다.
import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchSectorMap } from "./sector";

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
