// STEP 945 §5-4 — /api/sector/us: 최신 as_of 조회 + 페이지네이션 + source 포함 반환.
import { describe, it, expect, vi, afterEach } from "vitest";

function makeSupabaseMock(rows: { symbol: string; sector: string | null; source: string | null }[], asOf: string) {
  let call = 0;
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => ({ data: rows.length ? { as_of: asOf } : null }),
    range: async (from: number) => {
      call++;
      return { data: from === 0 ? rows : [] };
    },
  };
  return { from: () => chain, __callCount: () => call };
}

const createAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

describe("GET /api/sector/us", () => {
  afterEach(() => { vi.resetModules(); createAdminClient.mockClear(); });

  it("최신 as_of·전 종목·source를 반환한다", async () => {
    const rows = [
      { symbol: "AAPL", sector: "Information Technology", source: "spdr" },
      { symbol: "SONY", sector: "Information Technology", source: "yahoo" },
    ];
    createAdminClient.mockReturnValue(makeSupabaseMock(rows, "2026-08-08"));
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(body.asOf).toBe("2026-08-08");
    expect(body.items).toEqual(rows);
  });

  it("데이터가 없으면 asOf:null·items:[]를 반환한다(예외 아님)", async () => {
    createAdminClient.mockReturnValue(makeSupabaseMock([], "2026-08-08"));
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ asOf: null, items: [] });
  });

  it("DB 오류 시에도 예외를 던지지 않고 빈 응답을 낸다", async () => {
    createAdminClient.mockReturnValue({ from: () => { throw new Error("db down"); } });
    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ asOf: null, items: [] });
  });
});
