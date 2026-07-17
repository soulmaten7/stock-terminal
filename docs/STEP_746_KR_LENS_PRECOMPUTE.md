# STEP 746 — KR 렌즈 선계산 크론 (②b-1)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** ④ 완결 후. ②b 1/2. **백분위 RPC 시장 필터는 Cowork이 MCP로 이미 적용함**(이 STEP은 그 .sql 아카이브만 커밋).
**대상:** `lib/lensPrecompute.ts`(파라미터화) + **신규** `app/api/cron/kr-lens-scores/route.ts` + `vercel.json`(크론 1줄) + **신규** `scripts/precompute_lens_kr.ts` + **신규** `supabase/migrations/030_lens_percentiles_market_filter.sql`(아카이브).

## 목표
KR 시장 종목(거래대금 상위 1000)의 7팩터 렌즈를 매일 선계산해 `lens_scores`(market=`KR`)에 저장. 엔진(`computeSymbolLenses`)은 이미 KR 대응 → US 로직을 `(universe, market)`로 파라미터화해 재활용.

## 배경 (코드 지도)
- `lib/lensPrecompute.ts` `computeLensScores(topN)` = US 전용(`topByMarketCap` + `market:"US"` 하드코딩). 엔진 코어(mapLimit+upsert)는 시장 무관.
- `kr_stock_snapshot`(RLS 읽기정책 없음 → **service-role admin 클라만 읽힘**)에 전 KR 종목 + `trade_amount` 있음. `createAdminClient` 사용.
- `lens_scores`: `symbol` PK·`market` 컬럼(기본 US)·public-read. onConflict `symbol`.

## 수정 1 — `lib/lensPrecompute.ts` 파라미터화 (US 경로 보존)
`computeLensScores` 함수(63~108줄)를 **코어 추출 + US 델리게이트 + KR 유니버스 함수**로 교체:
```ts
// 코어: 주어진 유니버스·시장으로 계산→upsert (market 파라미터)
export async function computeLensScoresFor(universe: string[], market: string, concurrency = 6): Promise<{ ok: true; computed: number; universe: number; at: string }> {
  const at = new Date().toISOString();
  const sb = createAdminClient(); // RLS 우회(쓰기·kr_stock_snapshot 읽기)
  let done = 0, saved = 0;
  let buffer: Record<string, unknown>[] = [];
  async function flush() {
    if (!buffer.length) return;
    const batch = buffer; buffer = [];
    const { error } = await sb.from("lens_scores").upsert(batch, { onConflict: "symbol" });
    if (error) throw error;
    saved += batch.length;
    console.log(`  ...저장 누계 ${saved}`);
  }
  await mapLimit(universe, concurrency, async (sym): Promise<void> => {
    try {
      const r = await computeSymbolLenses(sym);
      if (!r.lenses.length) return;
      const m = pick(r.lenses, "momentum"), lv = pick(r.lenses, "lowvol"), v = pick(r.lenses, "valuation");
      const q = pick(r.lenses, "quality"), ag = pick(r.lenses, "assetgrowth"), t = pick(r.lenses, "technical");
      const fs = fscoreOf(r.fscore);
      buffer.push({
        symbol: sym, market, name: r.name, price: r.price,
        momentum_value: m.value, momentum_state: m.state,
        lowvol_value: lv.value, lowvol_state: lv.state,
        valuation_value: v.value, valuation_state: v.state,
        quality_value: q.value, quality_state: q.state,
        assetgrowth_value: ag.value, assetgrowth_state: ag.state,
        technical_value: t.value, technical_state: t.state,
        fscore_value: fs.value, fscore_state: fs.state,
        updated_at: at,
      });
      if (buffer.length >= 100) await flush();
    } catch {
      /* 종목별 실패 스킵 */
    } finally {
      if (++done % 50 === 0) console.log(`  ...진행 ${done}/${universe.length}`);
    }
  });
  await flush();
  return { ok: true, computed: saved, universe: universe.length, at };
}

// US(기존 API 보존) — 시총 상위 N
export async function computeLensScores(topN = 1000, concurrency = 6) {
  return computeLensScoresFor(await topByMarketCap(topN), "US", concurrency);
}

// KR 유니버스 — kr_stock_snapshot 거래대금 상위 N (admin 클라·6자리 코드)
export async function topKrByTradeAmount(topN: number): Promise<string[]> {
  const sb = createAdminClient();
  const { data } = await sb.from("kr_stock_snapshot").select("symbol").order("trade_amount", { ascending: false }).limit(topN);
  return ((data ?? []) as { symbol: string }[]).map((r) => r.symbol);
}
```
> `pick`·`fscoreOf`·`topByMarketCap`·`mapLimit`은 그대로 둠. 위는 기존 `computeLensScores` 본문을 대체·확장하는 것.

## 수정 2 — 신규 KR 크론 라우트 `app/api/cron/kr-lens-scores/route.ts`
```ts
import { NextResponse } from "next/server";
import { computeLensScoresFor, topKrByTradeAmount } from "@/lib/lensPrecompute";

// KR 렌즈 선계산 크론 — 매일 거래대금 상위 1000 KR 종목 7팩터 → lens_scores(market=KR).
// lens-scores(US) 크론과 동일 패턴. kr-perf(10:00 UTC) 뒤에 돌아 kr_stock_snapshot 최신 유니버스 사용.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const universe = await topKrByTradeAmount(1000);
    const r = await computeLensScoresFor(universe, "KR");
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

## 수정 3 — `vercel.json` 크론 추가
`crons` 배열에 한 줄(스케줄 = kr-perf 10:00·kr-etp 10:15 UTC 뒤인 10:30):
```json
    { "path": "/api/cron/kr-lens-scores", "schedule": "30 10 * * *" }
```

## 수정 4 — 신규 로컬 러너 `scripts/precompute_lens_kr.ts`
`scripts/precompute_lens.ts`와 동일 형식으로, KR용:
```ts
import { computeLensScoresFor, topKrByTradeAmount } from "../lib/lensPrecompute";
const N = Number(process.argv[2] ?? 500);
(async () => {
  console.log(`KR 렌즈 선계산 상위 ${N}종목…`);
  const universe = await topKrByTradeAmount(N);
  const r = await computeLensScoresFor(universe, "KR");
  console.log(r);
  process.exit(0);
})();
```

## 수정 5 — 마이그레이션 아카이브 `supabase/migrations/030_lens_percentiles_market_filter.sql`
(Cowork이 MCP로 **이미 라이브 적용함** — 이 파일은 repo 기록용. `lens_percentiles` RPC의 각 순위 서브쿼리에 `market = (select market from n)` 필터를 추가한 버전. 아래 그대로 저장:)
```sql
-- 030_lens_percentiles_market_filter.sql
-- lens_percentiles를 시장별로 격리 — KR 추가 시 US 백분위 오염 방지. (Cowork MCP 라이브 적용)
create or replace function public.lens_percentiles(p_symbol text)
returns table( momentum_pctl int, quality_pctl int, lowvol_pctl int, value_pctl int, assetgrowth_pctl int )
language sql stable as $$
  with n as (select * from public.lens_scores where symbol = p_symbol)
  select
    case when (select momentum_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and momentum_value <= (select momentum_value from n))
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and momentum_value is not null),0))::int end,
    case when (select quality_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and quality_value <= (select quality_value from n))
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and quality_value is not null),0))::int end,
    case when (select lowvol_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and lowvol_value >= (select lowvol_value from n))
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and lowvol_value is not null),0))::int end,
    case when (select valuation_value from n) is null or (select valuation_value from n) <= 0 then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and valuation_value >= (select valuation_value from n) and valuation_value > 0)
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and valuation_value is not null and valuation_value > 0),0))::int end,
    case when (select assetgrowth_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and assetgrowth_value >= (select assetgrowth_value from n))
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and assetgrowth_value is not null),0))::int end
$$;
```

## 마무리
```
npm run build   # tsc·빌드
git add -A && git commit -m "feat(lens·KR): KR 렌즈 선계산 크론 — computeLensScores 파라미터화(universe,market)+KR 유니버스(거래대금 상위)+/api/cron/kr-lens-scores(30 10 * * *)+백분위 RPC 시장필터 아카이브" && git push
```
그다음 **KR 렌즈 즉시 채우기**(스케줄 안 기다리고): 
```
npx tsx scripts/precompute_lens_kr.ts 500
```
(약 1.5~2분·100행마다 저장이라 중간에 끊겨도 진행분 남음. 실행 로그의 `computed` 숫자 알려줄 것.)

## 검증 (Cowork이 MCP로)
- `lens_scores`에 market=`KR` 행 수·삼성전자(005930) states 확인. US 백분위 미오염 확인.
- (②b-2에서 관심목록이 이 선계산을 읽어 즉시화.)
