// STEP 957 §2-5 — 플래그 OFF 404 · KR 심볼 404 · 정상 응답 형태.
import { describe, it, expect, vi, afterEach } from "vitest";

const createAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

function makeSupabaseMock(responses: Record<string, unknown[]>) {
  const counters: Record<string, number> = {};
  const chain = (table: string) => ({
    select: () => chain(table),
    eq: () => chain(table),
    order: () => chain(table),
    limit: () => chain(table),
    maybeSingle: async () => {
      const i = counters[table] ?? 0;
      counters[table] = i + 1;
      const list = responses[table] ?? [];
      return { data: list[i] ?? null };
    },
  });
  return { from: (table: string) => chain(table) };
}

describe("GET /api/q1/[symbol]", () => {
  const ORIGINAL_ENV = process.env.Q1_ENABLED;

  afterEach(() => {
    process.env.Q1_ENABLED = ORIGINAL_ENV;
    vi.resetModules();
    createAdminClient.mockClear();
  });

  it("플래그 OFF(미설정)면 404 — Supabase에 닿지 않는다", async () => {
    delete process.env.Q1_ENABLED;
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/q1/AAPL"), { params: Promise.resolve({ symbol: "AAPL" }) });
    expect(res.status).toBe(404);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("플래그가 \"false\"여도 404", async () => {
    process.env.Q1_ENABLED = "false";
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/q1/AAPL"), { params: Promise.resolve({ symbol: "AAPL" }) });
    expect(res.status).toBe(404);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("플래그 ON이어도 KR 6자리 심볼이면 404 — Supabase에 닿지 않는다(US 전용)", async () => {
    process.env.Q1_ENABLED = "true";
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/q1/005930"), { params: Promise.resolve({ symbol: "005930" }) });
    expect(res.status).toBe(404);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("플래그 ON + 정상 US 심볼 — us_valuation·us_sector_relative·us_sector_wide·revdcf_results를 조합한 형태로 반환한다", async () => {
    process.env.Q1_ENABLED = "true";
    createAdminClient.mockReturnValue(
      makeSupabaseMock({
        us_valuation: [
          { as_of: "2026-08-08" },
          { per: 25.6, pbr: 4.2, psr: 3.1, ev_ebitda: 18.9, per_basis: "ttm", fundamentals_fiscal_year: 2025 },
        ],
        us_sector_relative: [
          { sector: "Industrials", per_pct: 0.5096774193548387, pbr_pct: 0.4, psr_pct: 0.3, ev_ebitda_pct: 0.2, per_n: 155, pbr_n: 159, psr_n: 170, ev_ebitda_n: 133, unavailable: {} },
        ],
        us_sector_wide: [{ source: "damodaran" }],
        revdcf_results: [
          { as_of: "2026-08-08" },
          { verdict: "years", gap_years: 9, flags: { yearWindow: [2021, 2022, 2023, 2024, 2025] } },
        ],
      })
    );
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/q1/AAPL"), { params: Promise.resolve({ symbol: "AAPL" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      symbol: "AAPL", asOf: "2026-08-08", sector: "Industrials", sectorSource: "damodaran",
      axes: {
        per: { value: 25.6, pct: 0.5096774193548387, n: 155, unavailable: null },
        pbr: { value: 4.2, pct: 0.4, n: 159, unavailable: null },
        psr: { value: 3.1, pct: 0.3, n: 170, unavailable: null },
        evEbitda: { value: 18.9, pct: 0.2, n: 133, unavailable: null },
      },
      fiscalYear: 2025, perBasis: "ttm",
      revdcf: { verdict: "years", gapYears: 9 },
      yearWindow: [2021, 2022, 2023, 2024, 2025],
    });
  });

  it("us_valuation에 해당 종목 행이 없으면 404", async () => {
    process.env.Q1_ENABLED = "true";
    createAdminClient.mockReturnValue(makeSupabaseMock({ us_valuation: [{ as_of: "2026-08-08" }, null] }));
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/q1/ZZZZ"), { params: Promise.resolve({ symbol: "ZZZZ" }) });
    expect(res.status).toBe(404);
  });

  it("us_sector_relative 행이 없으면(아직 배선 전 as_of) 4축 전부 NO_SECTOR로 표시된다", async () => {
    process.env.Q1_ENABLED = "true";
    createAdminClient.mockReturnValue(
      makeSupabaseMock({
        us_valuation: [{ as_of: "2026-08-08" }, { per: 10, pbr: 1, psr: 1, ev_ebitda: 5, per_basis: "ttm", fundamentals_fiscal_year: 2025 }],
        us_sector_relative: [null],
        us_sector_wide: [null],
        revdcf_results: [null],
      })
    );
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/q1/AAPL"), { params: Promise.resolve({ symbol: "AAPL" }) });
    const body = await res.json();
    expect(body.sector).toBeNull();
    expect(body.axes.per).toEqual({ value: 10, pct: null, n: null, unavailable: "NO_SECTOR" });
    expect(body.revdcf).toBeNull();
    expect(body.yearWindow).toBeNull();
  });
});
