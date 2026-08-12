// STEP 1005 — ERPbymonth.xlsx 월간 rf·ERP 페어를 damodaran_global_inputs에 새 행으로 적재.
// 🔴 별도 스크립트(Cowork 판정①) — 갱신주기가 다르다(ERPbymonth 월1회 vs wacc.xls 연1회, 1002 원칙).
// 실행: npx tsx scripts/ingest_erp_monthly.ts [--dry-run]
// 재실행 안전: 이미 같은 as_of(해당 월 1일) 행이 있으면 스킵(중복 INSERT 방지).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { readFileSync } from "fs";
import { createAdminClient } from "../lib/supabase/admin";
import { parseErpMonthly, latestPairedRow } from "../lib/revdcf/erpMonthly";

const DRY_RUN = process.argv.includes("--dry-run");
const SNAPSHOT_PATH = "docs/probe_1005_pre_snapshot.json";

async function main() {
  const sb = createAdminClient();

  // ── §1 적재 전 확인 ──────────────────────────────────────────────────────
  const buf = readFileSync("data/sources/damodaran/ERPbymonth.xlsx");
  const rows = parseErpMonthly(buf);
  const latest = latestPairedRow(rows);
  if (!latest) throw new Error("ERPbymonth.xlsx: 페어드 행(rf·ERP 둘 다 있는 최신 월)을 찾지 못함");
  console.log(`[1-1] 최신 페어드 월 = ${latest.month} (rf=${latest.dollarRiskfreeRate}, erp=${latest.erpT12mAdjRiskfree})`);

  // 1-2 — expected_inflation이 ERPbymonth에 있는가: 없다(17개 컬럼 전수 확인, "Expected growth rate"는
  // S&P500 DDM 내부 현금흐름 성장률이지 거시 인플레이션이 아님 — 다른 개념). 직전 행(wacc.xls 유래) 값을 복사한다.
  const { data: allRows, error: allErr } = await sb.from("damodaran_global_inputs").select("*").order("as_of", { ascending: false });
  if (allErr) throw new Error(`damodaran_global_inputs 조회 실패: ${allErr.message}`);
  const priorRows = (allRows ?? []) as { as_of: string; riskfree_rate: string | number; erp: string | number; global_default_spread: string | number; marginal_tax_rate_used: string | number; expected_inflation: string | number }[];
  console.log(`[사전확인] damodaran_global_inputs 현재 행수 = ${priorRows.length}, as_of 목록 = ${priorRows.map((r) => r.as_of).join(", ")}`);
  const priorLatest = priorRows[0];
  if (!priorLatest) throw new Error("damodaran_global_inputs: 기존 행이 없음 — 예상 밖 상태, 중단");

  const newAsOf = latest.month; // ERPbymonth 월 자체를 새 행의 as_of로 쓴다(§1-4 판정 — 아래 문서 참조)
  const alreadyExists = priorRows.some((r) => r.as_of === newAsOf);
  if (alreadyExists) {
    console.log(`[스킵] as_of=${newAsOf} 행이 이미 존재 — 재실행 안전, 아무것도 안 함`);
    return;
  }

  // 1-3 — 새 행 컬럼별 출처
  const newRow = {
    as_of: newAsOf,
    riskfree_rate: latest.dollarRiskfreeRate, // ERPbymonth.xlsx 'Historical ERP' 열D, month=newAsOf
    erp: latest.erpT12mAdjRiskfree, // ERPbymonth.xlsx 'Historical ERP' 열K, month=newAsOf
    global_default_spread: Number(priorLatest.global_default_spread), // wacc.xls(as_of=priorLatest.as_of) 그대로 복사 — 갱신 안 됨
    marginal_tax_rate_used: Number(priorLatest.marginal_tax_rate_used), // 〃
    expected_inflation: Number(priorLatest.expected_inflation), // 〃 — ERPbymonth엔 없는 필드, §1-2 확인대로 복사
  };
  console.log("[1-3] 새 행 컬럼별 출처:");
  console.log(`  as_of              = ${newRow.as_of}  (ERPbymonth 월)`);
  console.log(`  riskfree_rate      = ${newRow.riskfree_rate}  ← ERPbymonth.xlsx "$ Riskfree Rate", month=${newAsOf}`);
  console.log(`  erp                = ${newRow.erp}  ← ERPbymonth.xlsx "ERP (T12m) with adj riskfree rate", month=${newAsOf}`);
  console.log(`  global_default_spread   = ${newRow.global_default_spread}  ← wacc.xls(as_of=${priorLatest.as_of}) 그대로 복사(미갱신, 이 STEP 범위 밖)`);
  console.log(`  marginal_tax_rate_used  = ${newRow.marginal_tax_rate_used}  ← wacc.xls(as_of=${priorLatest.as_of}) 그대로 복사(미갱신)`);
  console.log(`  expected_inflation      = ${newRow.expected_inflation}  ← wacc.xls(as_of=${priorLatest.as_of}) 그대로 복사(ERPbymonth엔 없는 필드)`);

  if (DRY_RUN) { console.log("\n[--dry-run] 여기서 중단 — INSERT 안 함"); return; }

  // ── §2 적재 ─────────────────────────────────────────────────────────────
  // 스냅샷(파일 기반) — 969 백필사고 전례. 이 테이블은 현재 1행뿐이라 전용 _snapshot 테이블(마이그레이션 필요) 대신
  // 전체 행을 JSON으로 떠 둔다(과잉이 아니라 비례) — 사후 지문 대조의 before로 쓴다.
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify({ tag: "pre_step1005", capturedAt: new Date().toISOString(), rows: priorRows }, null, 2));
  console.log(`\n[스냅샷] ${SNAPSHOT_PATH}에 사전 상태 저장(tag=pre_step1005, ${priorRows.length}행)`);

  const { error: insErr } = await sb.from("damodaran_global_inputs").insert([newRow]);
  if (insErr) throw new Error(`INSERT 실패: ${insErr.message}`);
  console.log(`[적재] damodaran_global_inputs에 새 행 추가 완료 (as_of=${newRow.as_of})`);

  // ── 적재 후 확인 ────────────────────────────────────────────────────────
  const { data: afterRows } = await sb.from("damodaran_global_inputs").select("*").order("as_of", { ascending: false });
  const after = (afterRows ?? []) as typeof priorRows;
  console.log(`\n[검증] 행수 ${priorRows.length} → ${after.length}`);
  const oldRowAfter = after.find((r) => r.as_of === priorLatest.as_of);
  const oldFingerprintMatch = oldRowAfter ? JSON.stringify(oldRowAfter) === JSON.stringify(priorLatest) : false;
  console.log(`[검증] 기존 행(as_of=${priorLatest.as_of}) 지문 불변 = ${oldFingerprintMatch}`);
  const newRowAfter = after.find((r) => r.as_of === newAsOf);
  const newRfMatch = newRowAfter ? Number(newRowAfter.riskfree_rate) === newRow.riskfree_rate : false;
  const newErpMatch = newRowAfter ? Number(newRowAfter.erp) === newRow.erp : false;
  console.log(`[검증] 새 행 rf 정확 일치 = ${newRfMatch}, erp 정확 일치 = ${newErpMatch}`);

  if (!oldFingerprintMatch || !newRfMatch || !newErpMatch) {
    console.error("🔴 검증 실패 — 즉시 확인 필요");
    process.exit(1);
  }
  console.log("\n✅ 적재 완료, 전부 검증 통과");
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
