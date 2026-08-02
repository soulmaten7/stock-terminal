// STEP 868 — 플래그 OFF면 데이터가 나가지 않는다는 것을 고정한다.
// 🔴 이 테스트가 없어서 854 게이팅 누락이 853부터 프로덕션에 남아 있었다.
import { describe, it, expect, vi, afterEach } from "vitest";

const createAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

describe("GET /api/revdcf — flag gating", () => {
  const ORIGINAL_ENV = process.env.REVDCF_ENABLED;

  afterEach(() => {
    process.env.REVDCF_ENABLED = ORIGINAL_ENV;
    vi.resetModules();
    createAdminClient.mockClear();
  });

  it("returns {result: null} and never touches Supabase when REVDCF_ENABLED is unset", async () => {
    delete process.env.REVDCF_ENABLED;
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/revdcf?symbol=AAPL"));
    const body = await res.json();

    expect(body).toEqual({ result: null });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("returns {result: null} and never touches Supabase when REVDCF_ENABLED is \"false\"", async () => {
    process.env.REVDCF_ENABLED = "false";
    const { GET } = await import("./route");
    const res = await GET(new Request("http://x/api/revdcf?symbol=AAPL"));
    const body = await res.json();

    expect(body).toEqual({ result: null });
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});
