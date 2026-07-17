# STEP 748 — KR 종목명 영어화 (①-KR)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** ②b 완결 후. ① 1/2(KR만·JP/CN/VN은 다음). **`kr_stock_snapshot.name_en` 컬럼은 Cowork이 MCP로 이미 추가함.**
**대상:** **신규** `scripts/enrich_kr_names.ts` + `app/api/krx/ranking/route.ts` + `components/toolbox/MarketBoard.tsx` + `lib/stockName.ts` + `app/api/watchlist/quotes/route.ts` + `components/favorites/WatchlistClient.tsx`.

## 목표
`/en`에서 KR 종목명이 한글로 나오는 것(예: "삼성전자")을 **야후 영문명**("Samsung Electronics Co., Ltd.")으로. 소스=야후 `longName`→`kr_stock_snapshot.name_en`, 그다음 보드·종목상세·관심목록이 로케일로 선택(ko=한글·en=영문·영문 없으면 한글 폴백).

## 배경 (코드 지도)
- 지금 어떤 것도 이름을 로케일로 안 바꿈. 종목상세는 이미 `/en` 스위치 배선됨(`resolveStockName`이 진짜 영어 `en`만 주면 자동).
- `kr_stock_snapshot`: symbol(6자리)·market(`kospi`/`kosdaq` 소문자)·name(한글)·**name_en(신규·null)**. RLS 읽기정책 없음 → admin 클라로 읽기/쓰기.
- 야후 배치 quote 패턴 = `lib/lensPrecompute.ts` `topByMarketCap`(100개씩 `yf.quote(grp)`)·`createAdminClient`.

## 수정 1 — 신규 `scripts/enrich_kr_names.ts` (야후 영문명 → name_en)
```ts
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, async () => {
    while (i < arr.length) { const cur = i++; await fn(arr[cur]); }
  }));
}

(async () => {
  const sb = createAdminClient();
  const { data } = await sb.from("kr_stock_snapshot").select("symbol, market");
  const list = (data ?? []) as { symbol: string; market: string }[];
  const ysym = (r: { symbol: string; market: string }) => r.symbol + (r.market === "kosdaq" ? ".KQ" : ".KS");
  const codeByY = new Map(list.map((r) => [ysym(r), r.symbol]));
  const yss = [...codeByY.keys()];
  const nameBySym = new Map<string, string>();
  // 배치 quote 100개씩 → longName||shortName
  for (let i = 0; i < yss.length; i += 100) {
    const grp = yss.slice(i, i + 100);
    try {
      const qs = (await yf.quote(grp)) as Array<{ symbol?: string; longName?: string; shortName?: string }>;
      for (const q of Array.isArray(qs) ? qs : []) {
        const code = codeByY.get(q.symbol ?? "");
        const en = (q.longName || q.shortName || "").trim();
        if (code && en) nameBySym.set(code, en);
      }
    } catch { /* 청크 실패 스킵 */ }
    console.log(`  ...quote ${Math.min(i + 100, yss.length)}/${yss.length}`);
  }
  // name_en만 UPDATE(동시성 8·다른 컬럼 보존)
  const entries = [...nameBySym.entries()];
  let saved = 0;
  await mapLimit(entries, 8, async ([symbol, name_en]) => {
    const { error } = await sb.from("kr_stock_snapshot").update({ name_en }).eq("symbol", symbol);
    if (!error) saved++;
  });
  console.log(`완료: name_en 저장 ${saved}/${entries.length}`);
  process.exit(0);
})();
```

## 수정 2 — `app/api/krx/ranking/route.ts`: name_en 반환
- `kr_stock_snapshot` select에 `name_en` 추가(현재 name 등 읽는 곳·약 108줄 근처).
- 반환 row에 `nameEn: s.name_en ?? null` 추가(기존 `name` 옆). 라이브 KRX 폴백 경로는 nameEn 없음(null) — 무방.

## 수정 3 — `components/toolbox/MarketBoard.tsx`: 로케일로 이름 선택
- `useLocale` import 후 `const locale = useLocale(); const isEn = locale === "en";`.
- `Row` 타입에 `nameEn?: string | null` 추가(리스트 API가 주는 필드).
- 이름 렌더 3곳(데스크톱 표·모바일 카드·시트)에서 `{r.name}` → `{isEn ? (r.nameEn ?? r.name) : r.name}`.
- **정렬 collation은 불변**(ko localeCompare 그대로 — 표시만 영문).

## 수정 4 — `lib/stockName.ts`: KR에 영어 `en` 반환
- KR 분기(약 76~86줄)에서 `kr_stock_snapshot` select에 `name_en` 추가 → 반환을 `{ name: 한글, en: name_en ?? undefined, country: "KR" }`로. (en 없으면 undefined → 상세페이지가 한글 폴백.)
- 종목상세 `page.tsx`는 이미 `isEn ? (en ?? name) : name` 배선됨 → **페이지 수정 불필요**.

## 수정 5 — 관심목록: quotes가 name_en 제공 + WatchlistClient 로케일 선택
- `app/api/watchlist/quotes/route.ts`: KR 스냅샷 읽을 때 `name_en`도 select → 각 항목에 `name_en: <kr row>.name_en ?? null` 추가(비KR은 null).
- `components/favorites/WatchlistClient.tsx`: `WatchItem`에 `name_en?: string | null` 추가. 이름 렌더(약 162줄) `{f.name_ko ?? f.symbol}` → `{(useLocale()==="en" ? (f.name_en ?? f.name_ko) : f.name_ko) ?? f.symbol}`. (`useLocale`는 이미 import돼 있음.)

## 마무리
```
npm run build   # tsc·빌드·vitest
git add -A && git commit -m "feat(i18n·KR): KR 종목명 영어화 — kr_stock_snapshot.name_en(야후 longName) + 보드·종목상세·관심목록 /en 로케일 선택(한글 폴백)·JP/CN/VN 다음" && git push
```
그다음 **영문명 즉시 채우기**:
```
npx tsx scripts/enrich_kr_names.ts
```
(전 KR 종목 배치 quote·약 30초~1분. 로그의 저장 수 알려줄 것.)

## 검증 (배포 후 Cowork)
- MCP: `kr_stock_snapshot`에서 005930 name_en = "Samsung Electronics…" 확인.
- `/en` 보드(KR 탭): 종목명 영어(예 Samsung Electronics·SK Hynix). `/ko`는 한글 그대로.
- `/en` 종목상세(005930): h1 영어. `/en` 관심목록: 영어명.
