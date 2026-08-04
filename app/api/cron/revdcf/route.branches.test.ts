// STEP 900 §2~§3 — DoD8 경계 케이스 점검에서 나온 미커버 항목 보강: NO_INDUSTRY·EX·HTTP_* 3개 스킵 사유는
// route.test.ts에 테스트가 없었다(NO_MARGINAL_CAPEX·STALE_MARKETCAP·NO_MARKETCAP·MISSING_TAG_OPERATING_INCOME만 커버).
// 별도 파일인 이유: 기존 route.test.ts의 공유 모킹 상태(upserts·revdcfRangeCalls·mcapOverride)를 건드리지 않기 위해
// — 그 파일의 여러 describe 블록이 그 상태에 의존하고 있어, 여기서 자체 완결 모킹으로 격리한다.
import { describe, it, expect, vi, afterEach } from "vitest";

const upserts: Record<string, unknown>[] = [];
let revdcfRangeCalls = 0;

function makeSupabaseMock() {
  const chain: {
    select: () => typeof chain; eq: () => typeof chain; order: () => typeof chain; limit: () => typeof chain;
    maybeSingle: () => Promise<{ data: unknown }>; single: () => Promise<{ data: unknown }>;
    range: (from: number, to: number) => Promise<{ data: unknown[] }>;
    upsert: (rows: Record<string, unknown>[]) => { then: (resolve: (r: { error: null }) => void) => void };
    then: (resolve: (r: { data: unknown }) => void) => void; __table: string;
  } = {} as never;
  return (table: string) => {
    const c = { ...chain, __table: table };
    c.select = () => c; c.eq = () => c; c.order = () => c; c.limit = () => c;
    c.maybeSingle = async () => (table === "revdcf_results" ? { data: { as_of: "2026-08-01" } } : { data: null });
    c.single = async () => {
      if (table === "damodaran_global_inputs") return { data: { as_of: "2026-08-01", riskfree_rate: 0.04, erp: 0.045, expected_inflation: 0.02 } };
      if (table === "damodaran_country_tax") return { data: { marginal_rate: 0.2563 } };
      return { data: null };
    };
    c.range = async () => {
      if (table === "revdcf_results") {
        revdcfRangeCalls++;
        if (revdcfRangeCalls === 1) return { data: [{ cik: 1, symbol: "TESTCO" }] };
        return { data: [] };
      }
      if (table === "damodaran_industry") return { data: [] }; // 🔴 의도적으로 비움 — NO_INDUSTRY 유발
      if (table === "us_market_cap") return { data: [{ symbol: "TESTCO", market_cap: 1000, as_of: "2026-08-01" }] };
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

// computeDrivers는 항상 ok:true — HTTP_*·EX는 fetch 단계에서 먼저 갈리고, NO_INDUSTRY 테스트는 이 성공 결과가
// industry lookup(위 damodaran_industry 빈 배열)에서 걸리는 것을 본다.
vi.mock("@/lib/revdcf/drivers", () => ({
  computeDrivers: vi.fn(() => ({
    ok: true,
    drivers: { startingSales: 100, salesGrowth: 0.05, operatingMargin: 0.1, startingMargin: 0.1, fixedCapitalRate: 0.15, fixedCapitalRateLevel: 0.15, fixedCapitalRateMarginal: 0.12, workingCapitalRate: 0.1 },
    market: { debt: 0, nonOperatingAssets: 0, shares: 10, latestYear: 2024 },
    flags: {},
  })),
}));

describe("GET /api/cron/revdcf — NO_INDUSTRY·EX·HTTP_* 회귀 방지 (STEP 900 §3)", () => {
  afterEach(() => {
    vi.resetModules();
    upserts.length = 0;
    revdcfRangeCalls = 0;
    delete process.env.CRON_SECRET;
  });

  it("SEC 응답이 !ok(HTTP 실패) → skip_reason: HTTP_${status}, 행은 그대로 써진다(유니버스 보존)", async () => {
    process.env.CRON_SECRET = "test-secret";
    global.fetch = vi.fn(async () => ({ ok: false, status: 503 }) as Response) as typeof fetch;

    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/cron/revdcf", { headers: { authorization: "Bearer test-secret" } }));
    await res.json();

    const row = upserts.find((r) => r.symbol === "TESTCO");
    expect(row).toBeDefined();
    expect(row?.skip_reason).toBe("HTTP_503");
    expect(row?.verdict).toBe("skipped");
  });

  it("fetch 자체가 예외를 던짐(네트워크 오류 등) → skip_reason: EX, 내부 오류 메시지가 flags.ex에 잘려 저장된다", async () => {
    process.env.CRON_SECRET = "test-secret";
    global.fetch = vi.fn(async () => { throw new Error("network unreachable — simulated"); }) as unknown as typeof fetch;

    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/cron/revdcf", { headers: { authorization: "Bearer test-secret" } }));
    await res.json();

    const row = upserts.find((r) => r.symbol === "TESTCO");
    expect(row).toBeDefined();
    expect(row?.skip_reason).toBe("EX");
    expect((row?.flags as Record<string, unknown>)?.ex).toContain("network unreachable");
  });

  it("업종 매핑이 없으면(damodaran_industry 미매칭) → skip_reason: NO_INDUSTRY (computeDrivers는 성공했음에도)", async () => {
    process.env.CRON_SECRET = "test-secret";
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ facts: { "us-gaap": {}, dei: {} } }) }) as unknown as Response) as typeof fetch;

    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/cron/revdcf", { headers: { authorization: "Bearer test-secret" } }));
    await res.json();

    const row = upserts.find((r) => r.symbol === "TESTCO");
    expect(row).toBeDefined();
    expect(row?.skip_reason).toBe("NO_INDUSTRY");
  });
});
