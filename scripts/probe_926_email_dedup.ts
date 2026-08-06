// STEP 926 — email-brief mover-line 중복 수정(B안) 검증 프로브. 읽기 전용, 메일 발송 0, DB 쓰기 0, 라우트 미호출.
// 실행: npx tsx scripts/probe_926_email_dedup.ts
// 무엇을 재는가: app/api/cron/email-brief/route.ts가 실제로 export하는 stripEmbeddedLensName()을
//   (재구현이 아니라 그 함수 자체를) 7렌즈 × 전 상태(924가 쓴 것과 같은 71개 조합)에 돌려
//   ① 수정 전 문자열에 중복이 있던 조합이 수정 후엔 없는지 ② 중복이 없던 조합은 문자열이 그대로인지 확인.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { LENS_COPY, LENS_READINGS, lensDisplayName, lensStateLabel, type Locale } from "../lib/lensCopy";
import { stripEmbeddedLensName } from "../app/api/cron/email-brief/route";
import { getTodayChanges } from "../lib/todayChanges";
import { resolveDisplayName } from "../lib/displayName";

// 925의 probe_925_brief_labels.ts와 같은 데이터소스(getTodayChanges)를 재사용 — 오늘 실제 전환 건에
// 수정 전/후 email mover-line을 나란히 재현한다(라우트 미호출·발송 0, movers()가 하는 것과 동일한 조립).
async function liveBeforeAfter() {
  const out: Record<string, unknown> = {};
  for (const [market, loc] of [["KR", "ko"], ["US", "en"]] as [("KR" | "US"), Locale][]) {
    const changes = await getTodayChanges({ market, limit: 5 });
    out[`${market}_${loc}`] = changes.items.map((it) => {
      const name = resolveDisplayName({ loc, market, symbol: it.symbol, nameKo: it.nameKo, nameEn: it.nameEn, rawName: it.name, context: "list" });
      const lensName = lensDisplayName(loc, it.lensKey);
      const rawFrom = it.fromState ? lensStateLabel(loc, it.lensKey, it.fromState) : "—";
      const rawTo = lensStateLabel(loc, it.lensKey, it.toState);
      const before = `${name} — ${lensName} ${rawFrom} → ${rawTo}`;
      const after = `${name} — ${lensName} ${it.fromState ? stripEmbeddedLensName(lensName, rawFrom) : rawFrom} → ${stripEmbeddedLensName(lensName, rawTo)}`;
      return { symbol: it.symbol, before, after, changed: before !== after };
    });
  }
  return out;
}

function containsCore(lensName: string, phrase: string): boolean {
  const core = /[(（]/.test(lensName) ? lensName.replace(/[(（].*$/, "") : lensName;
  return phrase.toLowerCase().includes(core.toLowerCase());
}

async function main() {
  const rows: {
    loc: Locale; key: string; state: string;
    lensName: string; before: string; after: string;
    dup_before: boolean; dup_after: boolean; changed: boolean;
  }[] = [];

  const locs: Locale[] = ["ko", "en"];
  for (const loc of locs) {
    for (const key of Object.keys(LENS_COPY[loc])) {
      const states = Object.keys((LENS_READINGS[loc] as unknown as Record<string, Record<string, unknown>>)[key] ?? {});
      for (const state of states) {
        const lensName = lensDisplayName(loc, key);
        const before = lensStateLabel(loc, key, state);
        const after = stripEmbeddedLensName(lensName, before);
        rows.push({
          loc, key, state, lensName, before, after,
          dup_before: containsCore(lensName, before),
          dup_after: containsCore(lensName, after),
          changed: before !== after,
        });
      }
    }
  }

  const total = rows.length;
  const wasDup = rows.filter((r) => r.dup_before);
  const stillDupAfter = rows.filter((r) => r.dup_before && r.dup_after);
  const changedButWasNotDup = rows.filter((r) => !r.dup_before && r.changed);

  console.log(JSON.stringify(
    {
      total_combinations: total,
      duplicate_before_count: wasDup.length,
      duplicate_before_list: wasDup.map((r) => `${r.loc}/${r.key}/${r.state}: "${r.before}"`),
      residual_duplicate_after_fix_count: stillDupAfter.length,
      residual_duplicate_after_fix_list: stillDupAfter.map((r) => `${r.loc}/${r.key}/${r.state}: "${r.after}"`),
      regressions_non_duplicate_rows_changed_count: changedButWasNotDup.length,
      regressions_list: changedButWasNotDup.map((r) => `${r.loc}/${r.key}/${r.state}: "${r.before}" -> "${r.after}"`),
      fixed_examples: wasDup.filter((r) => !r.dup_after).map((r) => ({ loc: r.loc, key: r.key, state: r.state, lensName: r.lensName, before: r.before, after: r.after })),
      live_today_before_after: await liveBeforeAfter(),
    },
    null,
    2
  ));
}

main();
