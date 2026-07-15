<!-- 2026-07-15 -->
# STEP 732 — US ETN 보드 서브탭 (주식/ETF/REITs 옆 · REIT 패턴)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(REIT 패턴 복제·다파일. Sonnet. `/clear` 후. **731과 독립 — 순서 무관.**)

**목표:** `UsMarketBoard`의 하위탭(주식·ETF·REITs)에 **ETN 추가**. US REIT 보드(`/api/yahoo/us-reit-performance`·큐레이션 유니버스+Yahoo 성과)와 동일 패턴. **US ETN은 VXX 편중 니치**라 후보 유니버스를 넉넉히 주고 **Yahoo가 실명·현재가로 live 필터**(죽은 티커 자동 제외·내가 이름 하드코딩 안 함).

**전제:** 729(`9d977f0`) 이후(731과 독립). REIT 라우트 = `app/api/yahoo/us-reit-performance/route.ts`(참조 원본).

---

## 파일 1 (신규) — `app/api/yahoo/us-etn-performance/route.ts`
REIT 라우트와 동일 계산(기간수익률·거래대금·정렬·30분 캐시)이되, **이름·live 필터는 `yf.quote`(정확성)**, 기간수익률은 `yf.chart`.
```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const yf = new YahooFinance();

// US ETN 후보 유니버스(티커=식별자만). US ETN은 니치·상당수 상폐 → Yahoo quote로 live만 필터,
// 실명도 Yahoo가 제공(하드코딩 X). 살아있는 것만 화면에. (VXX 변동성·AMJ MLP·DJP 원자재·FNGU 레버리지 등.)
const UNIVERSE = [
  "VXX", "VXZ", "AMJ", "AMJB", "DJP", "FNGU", "FNGD", "FNGS", "BULZ",
  "PFFL", "SMHB", "HDLB", "BDCX", "DVHL", "CEFD", "MLPB",
  "BAL", "JO", "NIB", "SGG", "JJC", "JJG", "JJN", "GRN", "OIL", "USOI", "GLDI", "SLVO",
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

let cache: { at: number; data: unknown } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) return NextResponse.json(cache.data);

  // 1) quote 배치 → 실명 + live 필터(현재가 있는 것만) + 현재가/거래량
  let quotes: any[] = [];
  try {
    const q = await yf.quote(UNIVERSE);
    quotes = (Array.isArray(q) ? q : [q]).filter((x) => x && typeof x.regularMarketPrice === "number" && x.regularMarketPrice > 0);
  } catch {
    quotes = [];
  }

  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
  const results = await mapLimit(quotes, 8, async (q: any) => {
    const sym = q.symbol as string;
    try {
      const ch = await yf.chart(sym, { period1, interval: "1d" });
      const qs = (ch.quotes ?? []) as Array<{ close: number | null }>;
      const closes = qs.map((x) => x.close).filter((c): c is number => typeof c === "number" && c > 0);
      if (closes.length < 22) return null;
      const name = q.longName || q.shortName || sym;
      const price = q.regularMarketPrice as number;
      const vol = (q.regularMarketVolume as number) ?? 0;
      return {
        symbol: sym,
        name: `${name} (${sym})`,
        price,
        changePercent: (q.regularMarketChangePercent as number) ?? ret(closes, 1) ?? 0,
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
        r1y: ret(closes, 252),
        amount: price * vol,
      };
    } catch {
      return null;
    }
  });

  const items = results.filter((x) => x !== null);
  items.sort((a, b) => (b!.amount ?? 0) - (a!.amount ?? 0)); // 거래대금 순
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```
> 행 shape(`symbol·name·price·changePercent·r1w..r1y·amount`)는 REIT/ETF와 동일 → 보드가 그대로 렌더.

## 파일 2 — `components/toolbox/UsMarketBoard.tsx` (ETN 서브탭 추가 — 기존 `reit` 미러)
`reit`가 있는 **4곳 전부에 `etn`을 reit와 나란히** 추가:
1. `type SubTab = 'stock' | 'etf' | 'reit';` → **`| 'etn'`** 추가.
2. TABS 배열(현재 `{ key: 'reit', label: 'subtab.reit' }`) 뒤에 → `{ key: 'etn', label: 'subtab.etn' }`.
3. `ENDPOINTS`(현재 `reit: '/api/yahoo/us-reit-performance'`) 옆에 → `etn: '/api/yahoo/us-etn-performance'`.
4. `CACHE_KEYS`(현재 `reit: 'us-reit'`) 옆에 → `etn: 'us-etn'`.
> `Record<SubTab, ...>` 타입이라 4곳 다 안 넣으면 tsc 에러 → **정확히 4곳**.

## 파일 3 — i18n: `messages/ko.json` + `messages/en.json` (`subtab.etn` 추가·패리티)
`subtab.stock/etf/reit`이 있는 네임스페이스에, **양쪽 파일 모두**:
```jsonc
// ko.json — subtab 안
"etn": "ETN"
// en.json — subtab 안
"etn": "ETN"
```
(약어라 ko/en 동일 값 "ETN". 키 양쪽 존재 = `messages.test.ts` 패리티 통과.)

## ⚠️ 주의
- **주식/ETF/REITs 탭·다른 국가 보드 불변.** ETN만 추가.
- ETN 성과가 극단적이어도(VXX 콘탱고 붕괴 r1y −80%류·커버드콜 ETN) **오염 단정·가드 금지** — 변동성/레버리지 ETN의 구조적 정상값(present-day·훈련지식 밖).
- 유니버스는 **후보**(일부 상폐 가능) → `yf.quote` live 필터가 죽은 티커 제거. **살아있는 것만** 표시되면 정상(니치라 10~20행 예상).
- 이름은 **Yahoo 제공값**(내 하드코딩 아님) → 정확한 현행명.

## 검증
1. `npx tsc --noEmit` → 0(SubTab 4곳 다 채웠나 확인).
2. `NEXT_DIST_DIR=.next-verify npm run build` → 성공. 끝나면 삭제.
3. `npx vitest run` → 전체 통과(`messages.test.ts` — subtab.etn 양쪽).
4. **라이브/dev 실측 + Cowork 보고**: `/api/yahoo/us-etn-performance` 열어 **live ETN 몇 건·이름 뭐가 뜨나**(예: VXX iPath Series B S&P 500 VIX…). **8건 미만이거나 이름 이상하면 보고**(유니버스 조정). US 보드 → ETN 서브탭 클릭 → 행 렌더.
5. 주식/ETF/REITs 탭 무영향.

## 커밋
```bash
git add -A && git commit -m "feat(732·US 뎁스): US ETN 보드 서브탭(주식/ETF/REITs 옆) — /api/yahoo/us-etn-performance(REIT 패턴·후보 유니버스·Yahoo quote 실명+live 필터·chart 기간수익률)+UsMarketBoard 서브탭+i18n subtab.etn·다른 탭/국가 불변" && git push
```

## 다음
- 배포 후 Cowork 라이브 실측(ETN 서브탭 live 건수·이름·성과). 니치라 얇으면 정직하게 그대로(또는 유니버스 보강).
- (사용자 언급) **추가 수정 내용** 대화.
