import "dotenv/config";
import { importFssAdvisors } from "../lib/fss";

importFssAdvisors()
  .then((r) => {
    console.info(`[FSS] 완료 — ${r.total}건 / ${r.pages}페이지 / revoked ${r.revoked}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error("[FSS] 실패:", e);
    process.exit(1);
  });
