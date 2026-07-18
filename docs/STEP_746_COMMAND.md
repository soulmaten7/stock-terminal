# STEP 746 — name_en 정상운영화(KR): kr-perf 일일 크론에 null-only 증분 채움

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 단순 1파일 수정)

**전제 상태**: HEAD `7bd48e5` · 트리 클린 · `kr_stock_snapshot.name_en` 백필 완료(2766/2772 · 남은 6 = 야후 미제공 소형주 = 정직한 결측 · 0이 목표 아님)

**목표**: 새로 상장한 KR 종목이 다음날 자동으로 영문명(`name_en`)을 갖게 한다. **별도 크론 신설 금지** — 매일 도는 `kr-perf` 크론(`computeKrSnapshot`) 끝에 증분 1스텝만 얹는다. `scripts/enrich_kr_names.ts` 로직을 **null-only로 스코프**해 재사용(배치 quote 100·`longName||shortName`).

**안전 근거(이미 실측된 사실 — 변경 금지)**:
- `computeKrSnapshot`의 upsert payload에 `name_en`이 **없음** → 기존 `name_en` 보존됨(2026-07-17(4) 확인). 이 구조 건드리지 말 것.
- 증분 대상 = `name_en IS NULL`만 → 평소 6개(야후 미제공) + 신규 상장 몇 개. 야후 콜 1회면 끝 → 비용≈0 · `maxDuration 300` 여유 충분.

---

## 수정 — `lib/krSnapshot.ts` 1파일만

### 1) 상단 import에 야후 추가 (기존 lib 패턴과 동일 — `lib/usPerf.ts` 참조)

```ts
import { createAdminClient } from "./supabase/admin";
import { pct } from "./returns";
```
바로 아래에 추가:
```ts
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
```

### 2) 파일 하단에 증분 함수 추가 (export — 단독 검증용)

```ts
// name_en IS NULL인 종목만 야후 longName/shortName으로 채움 (증분 · 기존값 절대 불변).
// 매일 kr-perf 크론이 스냅샷 upsert 후 호출 — 신규 상장이 다음날 자동으로 영문명 획득.
// 백필은 scripts/enrich_kr_names.ts로 완료(2766/2772) — 이 함수는 정상운영(신규분)만 담당.
export async function enrichMissingNameEn(
  sb: ReturnType<typeof createAdminClient>
): Promise<number> {
  const { data } = await sb
    .from("kr_stock_snapshot")
    .select("symbol, market")
    .is("name_en", null)
    .range(0, 999); // 증분 대상은 보통 한 자릿수 — 1000이면 충분(전종목 백필 아님)
  const list = (data ?? []) as { symbol: string; market: string }[];
  if (list.length === 0) return 0;

  const ysym = (r: { symbol: string; market: string }) =>
    r.symbol + (r.market === "kosdaq" ? ".KQ" : ".KS");
  const codeByY = new Map(list.map((r) => [ysym(r), r.symbol]));
  const yss = [...codeByY.keys()];

  let saved = 0;
  for (let i = 0; i < yss.length; i += 100) {
    const grp = yss.slice(i, i + 100);
    try {
      const qs = (await yf.quote(grp)) as Array<{
        symbol?: string;
        longName?: string;
        shortName?: string;
      }>;
      for (const q of Array.isArray(qs) ? qs : []) {
        const code = codeByY.get(q.symbol ?? "");
        const en = (q.longName || q.shortName || "").trim();
        if (!code || !en) continue;
        // .is("name_en", null) 이중 가드 — 기존값은 어떤 경우에도 안 덮는다.
        const { error } = await sb
          .from("kr_stock_snapshot")
          .update({ name_en: en })
          .eq("symbol", code)
          .is("name_en", null);
        if (!error) saved++;
      }
    } catch {
      /* 청크 실패 스킵 — 다음날 크론이 자연 재시도 */
    }
  }
  return saved;
}
```

### 3) `computeKrSnapshot` 리턴 직전에 호출 배선

기존:
```ts
  const sb = createAdminClient();
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("kr_stock_snapshot").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }
  return { ok: true, computed: payload.length, basDd: base.basDd };
```
를 다음으로 교체:
```ts
  const sb = createAdminClient();
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("kr_stock_snapshot").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }
  // 증분 name_en — 실패해도 스냅샷 성공을 막지 않는다(비차단).
  let nameEnFilled = 0;
  try {
    nameEnFilled = await enrichMissingNameEn(sb);
  } catch {
    /* 야후 장애 시 스킵 — 다음날 재시도 */
  }
  return { ok: true, computed: payload.length, basDd: base.basDd, nameEnFilled };
```

시그니처도 갱신:
```ts
export async function computeKrSnapshot(): Promise<{ ok: true; computed: number; basDd: string; nameEnFilled: number }> {
```

`app/api/cron/kr-perf/route.ts`는 `NextResponse.json(r)` 그대로라 **수정 불필요**(응답에 `nameEnFilled` 자동 포함).

---

## 검증 (전부 통과해야 커밋)

1. `npx tsc --noEmit` → 0 에러
2. `npm run test` (vitest) → 전부 통과 (기존 49+)
3. **증분 함수 단독 실행** (KRX 스냅샷·크론 안 건드리고 enrich만 — 라이브 DB에 안전: null만 채움):
   ```bash
   npx tsx -e "
   import dotenv from 'dotenv'; dotenv.config({ path: '.env.local' });
   (async () => {
     const { createAdminClient } = await import('./lib/supabase/admin');
     const { enrichMissingNameEn } = await import('./lib/krSnapshot');
     const n = await enrichMissingNameEn(createAdminClient());
     console.log('filled:', n);
     process.exit(0);
   })();
   "
   ```
   **기대값: `filled: 0`** (현재 null 6개 = 야후 미제공 소형주 → 못 채우는 게 정상). 에러 없이 0 반환이면 성공. 0이 아니어도 소수(예: 야후가 뒤늦게 제공 시작)면 정상.
4. `npm run build` → 성공

## 커밋

```bash
git add lib/krSnapshot.ts docs/STEP_746_COMMAND.md
git commit -m "STEP 746: auto-fill name_en for new KR listings in daily kr-perf cron (null-only incremental)"
git push
```

## 완료 보고 → Cowork에게

- tsc/vitest/build 결과 + 단독 실행 `filled:` 값 + 커밋 해시.
- 이후 Cowork이 MCP로 `name_en IS NULL` 개수 확인(기대 6·기존값 무변) 후 STATE '다음' #1 완료 갱신 + CHANGELOG 한 줄. (문서는 Cowork 담당 — Claude Code는 코드만.)
