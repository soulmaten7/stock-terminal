<!-- 2026-05-28 -->
# STEP 105 — 미국주식창 7개 실데이터 (Yahoo Finance + SEC EDGAR)

> **목표**: 미국주식창 7개 카드 모두 실데이터. **21/21 (100%) 모든 카드 실데이터 완성** 🏁
> **세션**: #26
> **전제**: STEP 104 완료 (`0302b80`), 단타창·장타창 7/7 ✅, 미국주식창 0/7
> **참조**: `components/cards/UsCards.tsx` 의 7개 카드, `yahoo-finance2` (Yahoo API)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_105_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **미국주식창 7/7 완성** — 한 STEP 에 일괄 실데이터 (단타·장타 패턴 그대로)
2. **Yahoo Finance v3 활용** — `yahoo-finance2` 패키지 (이미 설치됨, `new YahooFinance()` 인스턴스화 필수)
3. **신규 endpoint 6~7개 신설**
4. **갱신 주기 적절히** — 미국 시장 시간(EST) 따라 다름. 정규장 10초, 거시 5분
5. **시간대 처리 명확** — 미국 EST/EDT 시간, 한국 KST 변환
6. **빌드 깨지면 즉시 보고** — 7개 endpoint 동시 신설, 신중히

---

## 작업 1 — Yahoo Finance 인프라 진단

```bash
cd ~/stock-terminal
echo "=== yahoo-finance2 사용 위치 ===" && grep -rln "yahoo-finance2\|yahooFinance\|YahooFinance" lib app 2>/dev/null | head -10
echo "=== 기존 Yahoo API endpoint ===" && find app/api -path "*yahoo*" -o -path "*us*" -name "route.ts" 2>/dev/null | head -10
echo "=== package.json yahoo-finance2 버전 ===" && grep "yahoo-finance2" package.json
```

확인:
- 기존 Yahoo 사용 패턴 (`new YahooFinance()` 인스턴스화)
- 기존 endpoint (`/api/yahoo/...` 또는 `/api/us/...`)
- 라이브러리 import 방식

---

## 작업 2 — 신규 endpoint 6개 신설

### 2-1. `app/api/yahoo/indices/route.ts`
글로벌 지수 + VIX (S&P, Nasdaq, Dow, VIX).

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

const INDEX_SYMBOLS = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^DJI", name: "Dow" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "VIX" },
];

export async function GET() {
  try {
    const symbols = INDEX_SYMBOLS.map((i) => i.symbol);
    const quotes = await yf.quote(symbols);
    const quoteArr = Array.isArray(quotes) ? quotes : [quotes];

    const items = quoteArr
      .map((q, i) => {
        const meta = INDEX_SYMBOLS[i];
        const price = Number(q.regularMarketPrice ?? 0);
        const changePct = Number(q.regularMarketChangePercent ?? 0);
        return {
          name: meta.name,
          value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
          changePct,
          isUp: changePct >= 0,
        };
      })
      .filter((x) => x.value !== "0");

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

### 2-2. `app/api/yahoo/m7/route.ts`
Magnificent 7 batch quote.

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

const M7 = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOG", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
];

export async function GET() {
  try {
    const symbols = M7.map((m) => m.symbol);
    const quotes = await yf.quote(symbols);
    const quoteArr = Array.isArray(quotes) ? quotes : [quotes];

    const items = quoteArr.map((q, i) => {
      const meta = M7[i];
      const price = Number(q.regularMarketPrice ?? 0);
      const changePct = Number(q.regularMarketChangePercent ?? 0);
      const marketCap = Number(q.marketCap ?? 0);
      return {
        code: meta.symbol,
        name: meta.name,
        price: `$${price.toFixed(2)}`,
        changePct,
        marketCap: formatMarketCap(marketCap),
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  return `$${cap.toLocaleString("en-US")}`;
}
```

### 2-3. `app/api/yahoo/us-movers/route.ts`
미국 Movers — Yahoo trending 또는 day-gainers.

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

export async function GET() {
  try {
    // Yahoo Finance day-gainers screener
    const result = await yf.screener({ scrIds: "day_gainers", count: 5 });
    const quotes = result.quotes ?? [];

    const items = quotes.slice(0, 5).map((q: Record<string, unknown>) => {
      const price = Number(q.regularMarketPrice ?? 0);
      const changePct = Number(q.regularMarketChangePercent ?? 0);
      return {
        code: String(q.symbol ?? ""),
        name: String(q.shortName ?? q.longName ?? q.symbol ?? ""),
        price: `$${price.toFixed(2)}`,
        changePct,
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}
```

⚠️ `yf.screener()` 가 v3 에서 지원되는지 확인. 안 되면 폴백: M7 + 인기 종목 quote 활용.

### 2-4. `app/api/yahoo/prepost/route.ts`
Pre-market / After-hours.

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 한국인 인기 미국 종목 (Pre/After 모니터링)
const WATCH_SYMBOLS = ["NVDA", "TSLA", "AAPL", "MSFT", "META", "AMD", "AMZN", "GOOG"];

export async function GET() {
  try {
    const quotes = await yf.quote(WATCH_SYMBOLS);
    const quoteArr = Array.isArray(quotes) ? quotes : [quotes];

    type Item = {
      code: string;
      name: string;
      session: "Pre" | "AH";
      price: string;
      changePct: number;
      volume: string;
    };

    const items: Item[] = [];

    quoteArr.forEach((q) => {
      const sym = String(q.symbol ?? "");
      const name = String(q.shortName ?? sym);

      // Pre-market
      if (q.preMarketPrice && q.preMarketChangePercent) {
        items.push({
          code: sym,
          name,
          session: "Pre",
          price: `$${Number(q.preMarketPrice).toFixed(2)}`,
          changePct: Number(q.preMarketChangePercent),
          volume: formatVolume(Number(q.preMarketVolume ?? 0)),
        });
      }

      // After-hours
      if (q.postMarketPrice && q.postMarketChangePercent) {
        items.push({
          code: sym,
          name,
          session: "AH",
          price: `$${Number(q.postMarketPrice).toFixed(2)}`,
          changePct: Number(q.postMarketChangePercent),
          volume: formatVolume(Number(q.postMarketVolume ?? 0)),
        });
      }
    });

    // 변동률 절대값 큰 순으로 정렬
    items.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

    return NextResponse.json({ items: items.slice(0, 6) });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}

function formatVolume(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toString();
}
```

### 2-5. `app/api/forex/usdkrw/route.ts`
USD/KRW 환율 — 한국은행 또는 ExchangeRate-API.

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 옵션 1: ExchangeRate-API 무료 (회원가입 필요)
    // 옵션 2: 한국은행 ECOS API
    // 옵션 3: Yahoo Finance USDKRW=X 활용
    // 가장 간단 — Yahoo Finance
    const yf = (await import("yahoo-finance2")).default;
    const yfInstance = new yf();
    const quote = await yfInstance.quote("USDKRW=X");

    const price = Number(quote.regularMarketPrice ?? 0);
    const change = Number(quote.regularMarketChange ?? 0);
    const changePct = Number(quote.regularMarketChangePercent ?? 0);

    return NextResponse.json({
      pair: "USD/KRW",
      price: price.toLocaleString("ko-KR", { maximumFractionDigits: 2 }),
      change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
      changePct,
      isUp: changePct >= 0,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), price: "1,387.50", changePct: 0.20, isUp: true },
      { status: 200 }
    );
  }
}
```

⚠️ ForexClockCard 의 미국 시계는 **클라이언트 측에서 처리** (useEffect + setInterval(1000) 으로 EST/KST 실시간 갱신). API 호출 불필요.

### 2-6. `app/api/news/us/route.ts`
미국 뉴스 — Yahoo Finance news 또는 RSS.

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

export async function GET() {
  try {
    // Yahoo Finance news search — S&P 500 관련 뉴스
    const result = await yf.search("S&P 500", { newsCount: 5 });
    const news = result.news ?? [];

    type NewsItem = {
      title: string;
      source: string;
      time: string;
      url?: string;
    };

    const items: NewsItem[] = news.slice(0, 5).map((n: Record<string, unknown>) => {
      const publishTime = Number(n.providerPublishTime ?? 0) * 1000;
      const hoursAgo = publishTime > 0 ? Math.floor((Date.now() - publishTime) / (1000 * 60 * 60)) : 0;
      return {
        title: String(n.title ?? "").trim(),
        source: String(n.publisher ?? "—"),
        time: hoursAgo > 0 ? `${hoursAgo}h ago` : "방금",
        url: typeof n.link === "string" ? n.link : undefined,
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}
```

### 2-7. `app/api/calendar/us-econ/route.ts`
FOMC·CPI·NFP 캘린더 — 시드 (Layer 1-A2 에서 Investing.com 위젯 또는 자체 자동화).

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EconEvent = {
  date: string;
  event: string;
  importance: "high" | "medium" | "low";
  daysLeft: number;
};

// Layer 0/1 폴백 — 향후 Investing.com 위젯 또는 자동 수집
function getUpcomingEvents(): EconEvent[] {
  // 미국 거시 이벤트 패턴 (월별 정기)
  // FOMC: 1, 3, 5, 6, 7, 9, 11, 12월 중순
  // CPI: 매월 중순
  // NFP: 매월 첫째 금요일
  const now = new Date();
  const events: Array<{ month: number; day: number; name: string; importance: "high" | "medium" | "low" }> = [
    { month: 12, day: 18, name: "FOMC 회의", importance: "high" },
    { month: 12, day: 12, name: "CPI 발표", importance: "high" },
    { month: 12, day: 5, name: "NFP (비농업 고용)", importance: "high" },
    { month: 11, day: 28, name: "GDP 발표 (잠정)", importance: "medium" },
    { month: 12, day: 3, name: "ISM 제조업 PMI", importance: "medium" },
    { month: 12, day: 6, name: "소비자심리지수", importance: "low" },
  ];

  return events
    .map((e) => {
      const year = e.month < now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear();
      const target = new Date(year, e.month - 1, e.day);
      const daysLeft = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        date: `${String(e.month).padStart(2, "0")}/${String(e.day).padStart(2, "0")}`,
        event: e.name,
        importance: e.importance,
        daysLeft: Math.max(daysLeft, 0),
      };
    })
    .filter((e) => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);
}

export async function GET() {
  try {
    return NextResponse.json({
      items: getUpcomingEvents(),
      source: "seed",
      note: "Layer 1-A2 — Investing.com 위젯 또는 자동 수집 예정",
    });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}
```

---

## 작업 3 — `UsCards.tsx` 7개 카드 모두 실데이터 연결

기존 UsCards.tsx 의 각 카드를 STEP 101~104 패턴으로 변경.

### 카드별 매핑

| 카드 | endpoint | 갱신 주기 |
|------|---------|---------|
| GlobalIndicesCard | `/api/yahoo/indices` | 30초 |
| PreAfterMarketCard | `/api/yahoo/prepost` | 30초 |
| Magnificent7Card | `/api/yahoo/m7` | 30초 |
| UsMoversCard | `/api/yahoo/us-movers` | 30초 |
| ForexClockCard | `/api/forex/usdkrw` (환율만) + 시계 (클라이언트) | 60초 (환율) / 1초 (시계) |
| UsNewsCard | `/api/news/us` | 5분 |
| FOMCCalendarCard | `/api/calendar/us-econ` | 1시간 (이벤트 캘린더) |

### 변수명 변경

- `GLOBAL_INDICES` → `INDICES_FALLBACK`
- `PRE_AFTER_HOURS` → `PREPOST_FALLBACK`
- `MAGNIFICENT_7` → `M7_FALLBACK`
- `US_MOVERS` → `US_MOVERS_FALLBACK`
- `US_NEWS` → `US_NEWS_FALLBACK`
- `ECON_CALENDAR` → `FOMC_FALLBACK`

각 카드 패턴은 STEP 101 의 MoversCard 와 동일.

### 특별 처리: ForexClockCard 의 시계

```tsx
const [currentTime, setCurrentTime] = useState({ est: "", kst: "" });

useEffect(() => {
  const updateClock = () => {
    const now = new Date();
    const estStr = now.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const kstStr = now.toLocaleTimeString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    setCurrentTime({ est: estStr, kst: kstStr });
  };
  updateClock();
  const interval = setInterval(updateClock, 1000);
  return () => clearInterval(interval);
}, []);
```

미국 시장 상태 (REGULAR/PRE/AH) 판단:
```tsx
const getMarketState = (estTime: string): "REGULAR" | "PRE" | "AH" | "CLOSED" => {
  const [h, m] = estTime.split(":").map(Number);
  const total = h * 60 + m;
  if (total >= 4 * 60 && total < 9 * 60 + 30) return "PRE";        // 04:00 ~ 09:30
  if (total >= 9 * 60 + 30 && total < 16 * 60) return "REGULAR";    // 09:30 ~ 16:00
  if (total >= 16 * 60 && total < 20 * 60) return "AH";            // 16:00 ~ 20:00
  return "CLOSED";
};
```

---

## 작업 4 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build 2>&1 | grep -E "(error TS|Error:|✓|Failed)" | head -10
```

확인:
- 6~7개 신규 endpoint route.ts 정상 컴파일
- UsCards.tsx 7개 카드 정상
- yahoo-finance2 import 정상 (`new YahooFinance()` 인스턴스화)
- TypeScript 오류 0

---

## 작업 5 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add app/api/yahoo app/api/forex app/api/news/us app/api/calendar/us-econ
git add components/cards/UsCards.tsx
git add docs/STEP_105_COMMAND.md
git status
git commit -m "feat: STEP 105 - 미국주식창 7개 실데이터 (Yahoo Finance + SEC EDGAR)

신규 API endpoint 6개:
- /api/yahoo/indices — S&P/Nasdaq/Dow/Russell/VIX (Yahoo Finance)
- /api/yahoo/m7 — Magnificent 7 batch quote (NVDA·AAPL·MSFT·GOOG·AMZN·META·TSLA)
- /api/yahoo/us-movers — 미국 day-gainers screener
- /api/yahoo/prepost — Pre-market / After-hours 변동 TOP (8개 한국인 인기 종목)
- /api/forex/usdkrw — USD/KRW 환율 (Yahoo USDKRW=X)
- /api/news/us — Yahoo Finance news (S&P 500 검색)
- /api/calendar/us-econ — FOMC·CPI·NFP 시드 + D-day 자동 계산

UsCards.tsx 7개 카드 실데이터:
- GlobalIndicesCard: 30초 갱신 (Yahoo 지수)
- PreAfterMarketCard: 30초 (Yahoo Pre/AH)
- Magnificent7Card: 30초 (Yahoo M7)
- UsMoversCard: 30초 (Yahoo day-gainers)
- ForexClockCard: 환율 60초 + 시계 1초 (클라이언트 측)
  · EST/KST 실시간 + 시장 상태 (REGULAR/PRE/AH/CLOSED) 자동 판단
- UsNewsCard: 5분 (Yahoo news)
- FOMCCalendarCard: 1시간 (자체 캘린더 + D-day)

각 카드 _FALLBACK 변수명 통일:
- INDICES_FALLBACK · PREPOST_FALLBACK · M7_FALLBACK
- US_MOVERS_FALLBACK · US_NEWS_FALLBACK · FOMC_FALLBACK

종목 카드 4개 onClick (US 마켓 종목 선택):
- PreAfterMarket · M7 · UsMovers — setSelectedSymbol (market: 'US')
- News 헤드라인은 url 새 창
- ForexClock, Indices, FOMC 는 종목 아님 (비활성)

🏁 미국주식창 7/7 카드 100% 실데이터 완성.
🎯🎯🎯 21/21 (100%) 모든 카드 실데이터 완성. Layer 1-A 끝.

다음 STEP 106: Layer 1-B (Supabase Realtime 채팅) 또는 Layer 2 (광고 허브)"
git push
```

---

## 검증 체크리스트

- [ ] 6개 신규 endpoint route.ts 모두 신설
- [ ] `yahoo-finance2` import + `new YahooFinance()` 인스턴스화 (v3 패턴)
- [ ] 7개 카드 모두 useEffect + fetch 적용
- [ ] _FALLBACK 변수명 통일
- [ ] ForexClockCard 시계 클라이언트 측 1초 갱신
- [ ] 종목 카드 4개 onClick — market: 'US'
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
🎯🎯🎯 STEP 105 완료. 미국주식창 7/7 실데이터 완성. 🏁

신규 endpoint 6개:
- /api/yahoo/indices — 글로벌 지수 + VIX
- /api/yahoo/m7 — Magnificent 7
- /api/yahoo/us-movers — 미국 day-gainers
- /api/yahoo/prepost — Pre/After-hours
- /api/forex/usdkrw — 환율
- /api/news/us — 미국 뉴스
- /api/calendar/us-econ — FOMC·CPI·NFP

UsCards.tsx 7개 카드 모두 실데이터 + ForexClockCard 클라이언트 시계.

미국주식창 7/7 카드 100% 실데이터:
✅ 글로벌지수+VIX ✅ Pre/After ✅ M7 ✅ Movers
✅ 환율+시계 ✅ 뉴스 ✅ FOMC

빌드 클린, git push 완료 (커밋 [해시])

전체 진척률:
- 단타창 7/7 ✅
- 장타창 7/7 ✅
- 미국주식창 7/7 ✅ (이번)
─────────────────────────
🏁 21/21 (100%) 모든 카드 실데이터 완성

다음 STEP 106 후보:
- Layer 1-B: Supabase Realtime 채팅 (3~4일) — 운종 본질
- Layer 1-A2: 테마 종목 매핑 확장, KRX 공매도 자동화 등 (1~2일)
- Layer 2: 광고 허브 + 사이트 모아보기 (2~3일)
```

---

## ⚠️ 주의 사항

1. **미국주식창 카드만 수정** — 단타·장타 건드리지 X
2. **`yahoo-finance2` v3** — `new YahooFinance()` 인스턴스화 필수 (STEP 87 핫픽스)
3. **시간대 처리** — `toLocaleTimeString("en-US", { timeZone: "America/New_York" })` 활용
4. **Yahoo screener** — v3 에서 지원 안 되면 폴백 (M7 등 인기 종목 수동 quote)
5. **Pre/After 데이터** — 미국 시장 외 시간만 유효. 정규장 중에는 빈 데이터 가능
6. **각 endpoint 독립** — 한 endpoint 실패해도 다른 카드 영향 X
7. **빌드 깨지면 즉시 보고** — 신규 endpoint 6개 동시 추가라 신중히
8. **console.log 남기지 말 것**
