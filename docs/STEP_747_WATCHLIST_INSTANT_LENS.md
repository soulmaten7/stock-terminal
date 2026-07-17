# STEP 747 — 관심목록 렌즈 즉시화 (②b-2, ②b 마무리)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** STEP 746(②b-1·KR 선계산 489행 라이브) 완료. ②b 2/2.
**대상:** `app/api/watchlist/quotes/route.ts`(선계산 톤 배치 포함) + `components/favorites/WatchlistClient.tsx`(선계산 톤 즉시 사용·없으면 실시간 폴백).

## 목표
관심목록 렌즈 요약이 지금은 행마다 실시간 `/api/lens`로 지연 로딩("렌즈 읽는 중…"). 이걸 **선계산 `lens_scores` 상태를 배치로 읽어 즉시** 뜨게 한다. 선계산에 없는 심볼(top-N 밖·비KR/US)만 기존 실시간 폴백.

## 배경
- `lens_scores`는 **public-read**(RLS `select using(true)`) → 어떤 클라로도 배치 읽기 가능. `symbol` PK. US 1028 + KR 489행.
- 저장된 건 `*_state`(톤 아님) — **state→tone 매핑은 결정론적**. 라이브 로직(WatchlistClient 99~108·`verdict.tone`)과 1:1. na/null은 **제외**(카운트 안 함).
- `/api/watchlist/quotes`(739)는 이미 관심 심볼을 국가별 스냅샷에서 배치로 읽어 가격 반환 → **같은 자리에 `lens_scores` 배치 읽기 추가**.

## 수정 1 — `app/api/watchlist/quotes/route.ts`: 선계산 톤 포함
가격 병합 후, 전 관심 심볼로 `lens_scores`를 한 번 배치 읽어 심볼별 톤을 계산해 각 항목에 붙인다.
```ts
// 전 심볼(국가 무관) lens_scores 상태 배치 읽기 — public-read
const allSymbols = rows.map((r) => r.symbol); // 관심목록 심볼 배열
const { data: lensRows } = await sb
  .from("lens_scores")
  .select("symbol, momentum_state, technical_state, valuation_state, lowvol_state, quality_state, assetgrowth_state, fscore_state")
  .in("symbol", allSymbols);

type Tone = "pos" | "warn" | "flat";
// state→tone (라이브 로직과 동일 · na/null/그 외는 제외)
function tonesFromStates(r: Record<string, string | null>): Tone[] {
  const out: Tone[] = [];
  const map = (s: string | null, pos: string, warn: string, mid: string) => {
    if (s === pos) out.push("pos");
    else if (s === warn) out.push("warn");
    else if (s === mid) out.push("flat");
    // 그 외(na/null) → 제외
  };
  map(r.momentum_state, "up", "down", "flat");
  map(r.technical_state, "up", "down", "flat");
  map(r.valuation_state, "cheap", "rich", "mid");
  map(r.lowvol_state, "calm", "jumpy", "mid");
  map(r.quality_state, "high", "low", "mid");
  map(r.assetgrowth_state, "conservative", "aggressive", "mid");
  map(r.fscore_state, "strong", "weak", "mid");
  return out;
}
const tonesBySym = new Map<string, Tone[]>();
for (const lr of (lensRows ?? []) as Record<string, string | null>[]) {
  tonesBySym.set(lr.symbol as string, tonesFromStates(lr));
}
```
그리고 반환하는 각 watchlist 항목에 **`tones` 필드 추가**: `tones: tonesBySym.get(sym) ?? null` (선계산 없으면 null). 최종 응답:
```
{ auth, watchlist: [{ symbol, name_ko, market, country, price, changePercent, tones }] }
```
> `sb`는 이 라우트가 이미 쓰는 클라 그대로. `lens_scores`는 public-read라 문제없음. tones가 빈 배열(`[]`)이면(모두 na) null과 구분해도 되고 합쳐도 됨 — **길이 0이면 렌즈 숨김**은 클라가 이미 처리.

## 수정 2 — `WatchlistClient.tsx`: 선계산 톤 즉시 사용 + 실시간 폴백
1. `WatchItem` 타입에 `tones?: Tone[] | null` 추가.
2. 관심목록 로드(quotes) 직후, **`tones`가 있는(non-null) 항목은 `lensMap`을 즉시 채운다**: `{ state: 'done', tones: item.tones }` → 스켈레톤·fetch 없이 바로 렌더.
3. **지연 `/api/lens` 큐는 `tones`가 null인 항목만** 처리(선계산 밖 소형주·비KR/US). 기존 동시성4 큐 로직 유지하되 대상 목록을 `items.filter(x => x.tones == null)`로.
```ts
// 로드 직후:
setItems(list);
const seed: Record<string, LensState> = {};
for (const it of list) if (it.tones != null) seed[it.symbol] = { state: 'done', tones: it.tones };
setLensMap(seed);
// 지연 큐: const queue = list.filter((x) => x.tones == null);  // 선계산 없는 것만
```
> 나머지(LensSummary 렌더·TONE_DOT·카운트)는 **불변**. 결과: 선계산된 KR·US 종목은 즉시(점7+카운트 바로), 선계산 밖만 잠깐 "읽는 중…".

## 마무리
```
npm run build   # tsc·빌드·vitest
git add -A && git commit -m "feat(watchlist): 렌즈 요약 즉시화 — /api/watchlist/quotes에 lens_scores 선계산 톤 배치 포함 + WatchlistClient가 즉시 사용(선계산 밖만 실시간 폴백)·②b 완결" && git push
```

## 검증 (배포 후 Cowork)
- 로그인 + 관심종목(삼성전자·SK하이닉스 등 선계산 상위)에서 `/favorites` → 렌즈 요약이 **"읽는 중…" 없이 즉시**(강점/주의/보통·점7). 값은 STEP 746 MCP와 동일(삼성전자 강점2·주의2·보통3).
- 선계산 밖 종목(예: KR 소형주)은 잠깐 폴백 로딩 후 채워짐(깨짐 없음).
