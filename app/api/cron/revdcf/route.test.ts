// STEP 880 §3 패스2 — driver 5 ③판정(원전식 marginal 채택) 회귀 방지.
// ⓐ marginal이 null이면 skip_reason: "NO_MARGINAL_CAPEX" 행이 (드롭되지 않고) 그대로 저장된다(§2 유니버스 보존).
// ⓑ 주 판정 경로(fixed_capital_rate)에 level이 아니라 marginal이 들어간다(854 게이팅 누락 선례 — 테스트 부재로 회귀가 살아남았던 것과 같은 유형).
// STEP 893 §2 — 892 처방 B(us_market_cap 7일 TTL) 회귀 방지. 854의 게이팅 누락이 테스트 부재로 살아남았던 것(868)과 같은 일을 반복하지 않는다.
import { describe, it, expect, vi, afterEach } from "vitest";

const TODAY = new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

const upserts: Record<string, unknown>[] = [];
let revdcfRangeCalls = 0;
let mcapOverride: { symbol: string; market_cap: number; as_of: string }[] | null = null;

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
      if (table === "us_market_cap") return { data: mcapOverride ?? [{ symbol: "NOMARG", market_cap: 1000, as_of: TODAY }, { symbol: "HASMARG", market_cap: 1000, as_of: TODAY }] };
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

// STEP 947 §2 — computeDrivers가 이제 모든 경로(ok true/false)에 fundamentals를 함께 반환한다. 목이 그 계약을 안 지키면
//   route.ts의 fundamentalsRow()가 dr.fundamentals를 읽다 던져 skip_reason이 전부 "EX"로 뒤바뀐다(947 실제 발견) — 목을 실계약에 맞춘다.
const STUB_FUND_OK = { netIncome: 10, equity: 50, revenue: 100, operatingIncome: 10, dna: 5, fiscalYear: 2024, sourceTags: {} };
vi.mock("@/lib/revdcf/drivers", () => ({
  computeDrivers: vi.fn((gaap: { __marker?: string }) => {
    const base = { startingSales: 100, salesGrowth: 0.05, operatingMargin: 0.1, startingMargin: 0.1, workingCapitalRate: 0.1 };
    if (gaap?.__marker === "no-marginal") {
      return { ok: true, drivers: { ...base, fixedCapitalRate: 0.9, fixedCapitalRateLevel: 0.9, fixedCapitalRateMarginal: null }, market: { debt: 0, nonOperatingAssets: 0, shares: 10, latestYear: 2024 }, flags: {}, fundamentals: STUB_FUND_OK };
    }
    if (gaap?.__marker === "has-marginal") {
      return { ok: true, drivers: { ...base, fixedCapitalRate: 0.9, fixedCapitalRateLevel: 0.9, fixedCapitalRateMarginal: 0.12 }, market: { debt: 0, nonOperatingAssets: 0, shares: 10, latestYear: 2024 }, flags: {}, fundamentals: STUB_FUND_OK };
    }
    // STEP 896 §5 — MISSING_TAG 3분기 중 하나가 route.ts를 거쳐 그대로 skip_reason에 실리는지(유니버스 보존 포함) 확인용 마커.
    if (gaap?.__marker === "missing-oi") {
      return { ok: false, skipReason: "MISSING_TAG_OPERATING_INCOME", flags: { missing: "operatingIncome<5yr" }, fundamentals: { netIncome: null, equity: null, revenue: 100, operatingIncome: null, dna: null, fiscalYear: 2024, sourceTags: {} } };
    }
    return { ok: false, skipReason: "UNKNOWN_MARKER", flags: {}, fundamentals: { netIncome: null, equity: null, revenue: null, operatingIncome: null, dna: null, fiscalYear: null, sourceTags: {} } };
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

describe("GET /api/cron/revdcf — us_market_cap 7일 TTL 회귀 방지 (STEP 893 §2 · 892 처방 B)", () => {
  afterEach(() => {
    vi.resetModules();
    upserts.length = 0;
    revdcfRangeCalls = 0;
    mcapOverride = null;
    delete process.env.CRON_SECRET;
  });

  const fetchMock = () =>
    vi.fn(async (url: string | URL) => {
      const m = /CIK(\d{10})\.json/.exec(String(url));
      const cik = m ? parseInt(m[1], 10) : 0;
      const marker = cik === 1 ? "no-marginal" : cik === 2 ? "has-marginal" : "unknown";
      return { ok: true, json: async () => ({ facts: { "us-gaap": { __marker: marker }, dei: {} } }) } as Response;
    }) as typeof fetch;

  it("1) 시총이 TTL 안(3일 전)이면 정상 계산된다(스킵 아님)", async () => {
    process.env.CRON_SECRET = "test-secret";
    global.fetch = fetchMock();
    mcapOverride = [{ symbol: "NOMARG", market_cap: 1000, as_of: daysAgo(3) }, { symbol: "HASMARG", market_cap: 1000, as_of: daysAgo(3) }];

    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/cron/revdcf", { headers: { authorization: "Bearer test-secret" } }));
    await res.json();

    const hasmarg = upserts.find((r) => r.symbol === "HASMARG");
    expect(hasmarg).toBeDefined();
    expect(hasmarg?.skip_reason).toBeNull();
    expect(hasmarg?.verdict).not.toBe("skipped");
  });

  it("2) 시총이 TTL 밖(8일 전)이면 STALE_MARKETCAP으로 스킵되고 행이 써진다(유니버스 보존)", async () => {
    process.env.CRON_SECRET = "test-secret";
    global.fetch = fetchMock();
    mcapOverride = [{ symbol: "NOMARG", market_cap: 1000, as_of: daysAgo(8) }, { symbol: "HASMARG", market_cap: 1000, as_of: daysAgo(8) }];

    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/cron/revdcf", { headers: { authorization: "Bearer test-secret" } }));
    await res.json();

    const hasmarg = upserts.find((r) => r.symbol === "HASMARG");
    expect(hasmarg).toBeDefined(); // 🔴 880 교훈 — 스킵돼도 행은 반드시 써진다(드롭 아님)
    expect(hasmarg?.skip_reason).toBe("STALE_MARKETCAP");
    expect(hasmarg?.verdict).toBe("skipped");
    expect((hasmarg?.flags as Record<string, unknown>)?.marketCapAgeDays).toBeGreaterThanOrEqual(7);
    expect((hasmarg?.flags as Record<string, unknown>)?.marketCapAsOf).toBe(daysAgo(8));
  });

  it("3) 시총이 아예 없으면 NO_MARKETCAP으로 남는다(STALE_MARKETCAP과 사유가 섞이지 않는다)", async () => {
    process.env.CRON_SECRET = "test-secret";
    global.fetch = fetchMock();
    mcapOverride = []; // 두 심볼 다 시총 행 자체가 없음

    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/cron/revdcf", { headers: { authorization: "Bearer test-secret" } }));
    await res.json();

    const nomarg = upserts.find((r) => r.symbol === "NOMARG");
    const hasmarg = upserts.find((r) => r.symbol === "HASMARG");
    expect(nomarg?.skip_reason).toBe("NO_MARKETCAP");
    expect(hasmarg?.skip_reason).toBe("NO_MARKETCAP");
    expect(nomarg?.skip_reason).not.toBe("STALE_MARKETCAP");
  });
});

describe("GET /api/cron/revdcf — MISSING_TAG 3분기 유니버스 보존 회귀 방지 (STEP 896 §5·880 교훈)", () => {
  afterEach(() => {
    vi.resetModules();
    upserts.length = 0;
    revdcfRangeCalls = 0;
    mcapOverride = null;
    delete process.env.CRON_SECRET;
  });

  it("drivers.ts가 새 MISSING_TAG_* 코드를 반환해도 route.ts가 그대로 실어 행을 쓴다(드롭 아님)", async () => {
    process.env.CRON_SECRET = "test-secret";
    global.fetch = vi.fn(async (url: string | URL) => {
      const m = /CIK(\d{10})\.json/.exec(String(url));
      const cik = m ? parseInt(m[1], 10) : 0;
      const marker = cik === 1 ? "missing-oi" : cik === 2 ? "has-marginal" : "unknown";
      return { ok: true, json: async () => ({ facts: { "us-gaap": { __marker: marker }, dei: {} } }) } as Response;
    }) as typeof fetch;

    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/cron/revdcf", { headers: { authorization: "Bearer test-secret" } }));
    await res.json();

    const nomarg = upserts.find((r) => r.symbol === "NOMARG");
    expect(nomarg).toBeDefined(); // 🔴 880 교훈 — 스킵돼도 행은 반드시 써진다
    expect(nomarg?.skip_reason).toBe("MISSING_TAG_OPERATING_INCOME"); // route.ts가 사유를 재작성하지 않고 그대로 통과시킨다
    expect(nomarg?.verdict).toBe("skipped");
  });
});
