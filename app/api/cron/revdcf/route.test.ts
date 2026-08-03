// STEP 880 §3 패스2 — driver 5 ③판정(원전식 marginal 채택) 회귀 방지.
// ⓐ marginal이 null이면 skip_reason: "NO_MARGINAL_CAPEX" 행이 (드롭되지 않고) 그대로 저장된다(§2 유니버스 보존).
// ⓑ 주 판정 경로(fixed_capital_rate)에 level이 아니라 marginal이 들어간다(854 게이팅 누락 선례 — 테스트 부재로 회귀가 살아남았던 것과 같은 유형).
import { describe, it, expect, vi, afterEach } from "vitest";

const upserts: Record<string, unknown>[] = [];
let revdcfRangeCalls = 0;

function makeSupabaseMock() {
  const chain: {
    select: () => typeof chain;
    eq: () => typeof chain;
    order: () => typeof chain;
    limit: () => typeof chain;
    maybeSingle: () => Promise<{ data: unknown }>;
    single: () => Promise<{ data: unknown }>;
    range: (from: number, to: number) => Promise<{ data: unknown[] }>;
    upsert: (rows: Record<string, unknown>[]) => { then: (resolve: (r: { error: null }) => void) => void };
    then: (resolve: (r: { data: unknown }) => void) => void;
    __table: string;
  } = {} as never;
  return (table: string) => {
    const c = { ...chain, __table: table };
    c.select = () => c;
    c.eq = () => c;
    c.order = () => c;
    c.limit = () => c;
    c.maybeSingle = async () => (table === "revdcf_results" ? { data: { as_of: "2026-08-01" } } : { data: null });
    c.single = async () => {
      if (table === "damodaran_global_inputs") return { data: { as_of: "2026-08-01", riskfree_rate: 0.04, erp: 0.045, expected_inflation: 0.02 } };
      if (table === "damodaran_country_tax") return { data: { marginal_rate: 0.2563 } };
      return { data: null };
    };
    c.range = async () => {
      if (table === "revdcf_results") {
        revdcfRangeCalls++;
        if (revdcfRangeCalls === 1) return { data: [{ cik: 1, symbol: "NOMARG" }, { cik: 2, symbol: "HASMARG" }] };
        return { data: [] }; // "done" 조회 — 아무것도 처리된 적 없음
      }
      if (table === "damodaran_industry") return { data: [{ ticker_norm: "NOMARG", industry_group: "IND" }, { ticker_norm: "HASMARG", industry_group: "IND" }] };
      if (table === "us_market_cap") return { data: [{ symbol: "NOMARG", market_cap: 1000 }, { symbol: "HASMARG", market_cap: 1000 }] };
      return { data: [] };
    };
    c.then = (resolve) => {
      if (table === "damodaran_credit_spread") resolve({ data: [] });
      else if (table === "damodaran_beta") resolve({ data: [{ industry: "IND", unlevered_beta_cash_adj: 1, std_dev_equity: 0.1 }] });
      else resolve({ data: [] });
    };
    c.upsert = (rows) => { upserts.push(...rows); return { then: (resolve) => resolve({ error: null }) }; };
    return c;
  };
}

const createAdminClient = vi.fn(() => ({ from: makeSupabaseMock() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

vi.mock("@/lib/revdcf/drivers", () => ({
  computeDrivers: vi.fn((gaap: { __marker?: string }) => {
    const base = { startingSales: 100, salesGrowth: 0.05, operatingMargin: 0.1, startingMargin: 0.1, workingCapitalRate: 0.1 };
    if (gaap?.__marker === "no-marginal") {
      return { ok: true, drivers: { ...base, fixedCapitalRate: 0.9, fixedCapitalRateLevel: 0.9, fixedCapitalRateMarginal: null }, market: { debt: 0, nonOperatingAssets: 0, shares: 10, latestYear: 2024 }, flags: {} };
    }
    if (gaap?.__marker === "has-marginal") {
      return { ok: true, drivers: { ...base, fixedCapitalRate: 0.9, fixedCapitalRateLevel: 0.9, fixedCapitalRateMarginal: 0.12 }, market: { debt: 0, nonOperatingAssets: 0, shares: 10, latestYear: 2024 }, flags: {} };
    }
    return { ok: false, skipReason: "UNKNOWN_MARKER", flags: {} };
  }),
}));

describe("GET /api/cron/revdcf — driver5 ③판정(marginal) 회귀 방지 (STEP 880)", () => {
  afterEach(() => {
    vi.resetModules();
    upserts.length = 0;
    revdcfRangeCalls = 0;
    delete process.env.CRON_SECRET;
  });

  it("ⓐ marginal == null → skip_reason: NO_MARGINAL_CAPEX 행이 그대로 저장된다(드롭 아님)", async () => {
    process.env.CRON_SECRET = "test-secret";
    global.fetch = vi.fn(async (url: string | URL) => {
      const m = /CIK(\d{10})\.json/.exec(String(url));
      const cik = m ? parseInt(m[1], 10) : 0;
      const marker = cik === 1 ? "no-marginal" : cik === 2 ? "has-marginal" : "unknown";
      return { ok: true, json: async () => ({ facts: { "us-gaap": { __marker: marker }, dei: {} } }) } as Response;
    }) as typeof fetch;

    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/cron/revdcf", { headers: { authorization: "Bearer test-secret" } }));
    await res.json();

    const nomarg = upserts.find((r) => r.symbol === "NOMARG");
    expect(nomarg).toBeDefined();
    expect(nomarg?.skip_reason).toBe("NO_MARGINAL_CAPEX");
  });

  it("ⓑ 주 판정(fixed_capital_rate)에는 level(0.9)이 아니라 marginal(0.12)이 들어간다", async () => {
    process.env.CRON_SECRET = "test-secret";
    global.fetch = vi.fn(async (url: string | URL) => {
      const m = /CIK(\d{10})\.json/.exec(String(url));
      const cik = m ? parseInt(m[1], 10) : 0;
      const marker = cik === 1 ? "no-marginal" : cik === 2 ? "has-marginal" : "unknown";
      return { ok: true, json: async () => ({ facts: { "us-gaap": { __marker: marker }, dei: {} } }) } as Response;
    }) as typeof fetch;

    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/cron/revdcf", { headers: { authorization: "Bearer test-secret" } }));
    await res.json();

    const hasmarg = upserts.find((r) => r.symbol === "HASMARG");
    expect(hasmarg).toBeDefined();
    expect(hasmarg?.skip_reason).toBeNull();
    expect(hasmarg?.fixed_capital_rate).toBe(0.12);
    expect(hasmarg?.fixed_capital_rate).not.toBe(0.9);
    expect(hasmarg?.fixed_capital_rate_level).toBe(0.9);
    expect(hasmarg?.fixed_capital_rate_marginal).toBe(0.12);
  });
});
