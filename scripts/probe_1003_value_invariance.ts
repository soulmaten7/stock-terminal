// STEP 1003 §5-2 — 값 불변 증명 + 최신 월 파싱 결과 확인. 🔴 DB 쓰기 0(SELECT만).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { readFileSync } from "fs";
import { createAdminClient } from "../lib/supabase/admin";
import { parseErpMonthly, latestPairedRow, findRowForMonth } from "../lib/revdcf/erpMonthly";

async function main() {
  const buf = readFileSync("data/sources/damodaran/ERPbymonth.xlsx");
  const rows = parseErpMonthly(buf);
  console.log(`파싱된 월 수: ${rows.length}(첫 달=${rows[0]?.month}, 마지막 달=${rows[rows.length - 1]?.month})`);

  // §5-2 값 불변 증명 — 새 파서로 2026-01 행을 읽어 현재 DB 저장값과 정확히 같은지 확인
  const jan2026 = findRowForMonth(rows, "2026-01");
  const sb = createAdminClient();
  const stored = (await sb.from("damodaran_global_inputs").select("as_of, riskfree_rate, erp").single()).data as {
    as_of: string; riskfree_rate: string | number; erp: string | number;
  };
  const storedRf = Number(stored.riskfree_rate);
  const storedErp = Number(stored.erp);
  const invariance = {
    storedAsOf: stored.as_of,
    storedRf, storedErp,
    parsedJan2026: jan2026,
    rfMatch: jan2026 != null && Math.abs((jan2026.dollarRiskfreeRate ?? NaN) - storedRf) < 1e-9,
    erpMatch: jan2026 != null && Math.abs((jan2026.erpT12mAdjRiskfree ?? NaN) - storedErp) < 1e-9,
  };
  console.log("\n=== §5-2 값 불변 증명(새 파서로 읽은 2026-01 행 vs DB 저장값) ===");
  console.log(JSON.stringify(invariance, null, 2));
  if (!invariance.rfMatch || !invariance.erpMatch) {
    console.error("🔴 불일치 — 파서 또는 컬럼 위치가 잘못됐을 가능성");
    process.exit(1);
  }

  // 최신 페어드 행(오늘 기준)
  const latest = latestPairedRow(rows);
  console.log("\n=== 최신 페어드 행(오늘 기준) ===");
  console.log(JSON.stringify(latest, null, 2));
  console.log(`저장값(as_of=${stored.as_of})과의 개월차: 2026-01 → ${latest?.month} = 7개월`);
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
