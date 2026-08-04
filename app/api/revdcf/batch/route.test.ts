// STEP 899 §3 — 보드 배지가 종목상세와 같은 lossMaking 판정을 내는지 회귀 방지.
// WBD 실측(2026-08-03): verdict="years"·gap_years=8·operating_margin=-2.2% — 적자인데 "8년"으로 보이면 안 된다.
import { describe, it, expect, vi, afterEach } from "vitest";

let mockRows: { symbol: string; verdict: string; gap_years: number | null; operating_margin: number | null }[] = [];

function makeSupabaseMock() {
  return (_table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.order = () => chain;
    chain.limit = () => chain;
    chain.eq = () => chain;
    chain.maybeSingle = async () => ({ data: { as_of: "2026-08-03" } });
    chain.in = async () => ({ data: mockRows });
    return chain;
  };
}

const createAdminClient = vi.fn(() => ({ from: makeSupabaseMock() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

describe("GET /api/revdcf/batch — lossMaking 899 회귀 방지", () => {
  afterEach(() => {
    vi.resetModules();
    process.env.REVDCF_ENABLED = "";
    mockRows = [];
  });

  it("적자(마진<=0)면 verdict가 years여도 lossMaking:true를 반환한다 (WBD 실측 재현)", async () => {
    process.env.REVDCF_ENABLED = "true";
    mockRows = [{ symbol: "WBD", verdict: "years", gap_years: 8, operating_margin: -0.021961214969669584 }];
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/revdcf/batch?symbols=WBD"));
    const body = await res.json();
    expect(body.verdicts.WBD.lossMaking).toBe(true);
    expect(body.verdicts.WBD.verdict).toBe("years");
    expect(body.verdicts.WBD.gapYears).toBe(8);
  });

  it("흑자면 lossMaking:false를 반환한다", async () => {
    process.env.REVDCF_ENABLED = "true";
    mockRows = [{ symbol: "GOOGL", verdict: "years", gap_years: 5, operating_margin: 0.1 }];
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/revdcf/batch?symbols=GOOGL"));
    const body = await res.json();
    expect(body.verdicts.GOOGL.lossMaking).toBe(false);
  });
});
