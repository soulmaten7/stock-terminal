import { config } from "dotenv";
// Next.js 와 동일하게 .env.local 우선 로드 (SUPABASE_SERVICE_ROLE_KEY 등).
config({ path: ".env.local" });

(async () => {
  const { importFssAdvisors } = await import("../lib/fss");
  try {
    const r = await importFssAdvisors();
    console.info(`[FSS] 완료 — ${r.total}건 / ${r.pages}페이지 / revoked ${r.revoked}`);
    process.exit(0);
  } catch (e) {
    console.error("[FSS] 실패:", e);
    process.exit(1);
  }
})();
