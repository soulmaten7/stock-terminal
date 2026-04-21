<!-- 2026-04-21 -->
# Stock Terminal V3 Dashboard V1.5 — Step 8 명령서

**대상**: Claude Code (🔴 **Opus 권장** — 3파일 리팩토링 + npm 패키지 추가 + 레이아웃 대전환)
**실행 명령어**: `cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model opus`

---

## 목표

5가지 통합 변경:

1. **Layout 대전환** — R3·Col 1 스왑, R4 순서 재정렬, Col 1 폭 축소
2. **KOSPI 200 추가** — 글로벌 지수 위젯에 `^KS200` 심볼 포함
3. **30초 Polling** — 글로벌 지수 위젯을 진짜 "실시간감" 있게
4. **Yahoo Finance 401 해결** — `yahoo-finance2` npm 패키지로 교체 (crumb 인증 자동 처리)
5. **NetBuyTopWidget에 size/inline prop 추가** — R4 배치 대비

---

## 전제

- 직전 커밋: `86685b6` (Step 7 — R4 viewport-filling + reorder)
- 현재 레이아웃 (V1.4):
  - Col 1: 마켓채팅(top) / 관심종목(bot)
  - Col 2 R3 중앙: 글로벌지수 | 실시간수급
  - R4: 상승/하락 | 거래량 | 상승테마 | DART | 뉴스
- Yahoo Finance `/api/home/global` — 401 Unauthorized (crumb 토큰 요구)

---

## 작업 1. `yahoo-finance2` npm 패키지 설치

```bash
npm install yahoo-finance2
```

**설치 후 검증**:
```bash
ls node_modules/yahoo-finance2/package.json || echo "❌ install failed"
```

실패 시 → 중단하고 에러 보고.

---

## 작업 2. `app/api/home/global/route.ts` 재작성

기존 fetch 로직 → `yahoo-finance2` 라이브러리로 교체. KOSPI 200 추가. 캐시 5분 → 30초.

```typescript
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

const SYMBOLS = [
  { symbol: '^KS11',    label: 'KOSPI' },
  { symbol: '^KS200',   label: 'KOSPI 200' },     // ← 신규
  { symbol: '^KQ11',    label: 'KOSDAQ' },
  { symbol: 'ES=F',     label: 'S&P 500 선물' },
  { symbol: 'NQ=F',     label: 'NASDAQ 선물' },
  { symbol: 'USDKRW=X', label: 'USD/KRW' },
  { symbol: 'USDJPY=X', label: 'USD/JPY' },
  { symbol: 'CL=F',     label: 'WTI 원유' },
  { symbol: '^TNX',     label: '미국채 10Y' },
];

interface QuoteItem {
  label: string;
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

function fmt(n: number, digits = 2): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: digits });
  return n.toFixed(digits);
}

export async function GET() {
  try {
    // yahoo-finance2는 crumb 인증을 자동 처리
    const symbols = SYMBOLS.map((s) => s.symbol);
    const quotes = await yahooFinance.quote(symbols);
    const resultsArr = Array.isArray(quotes) ? quotes : [quotes];

    const labelMap = Object.fromEntries(SYMBOLS.map((s) => [s.symbol, s.label]));

    const items: QuoteItem[] = resultsArr.map((q) => {
      const price = (q.regularMarketPrice as number) ?? 0;
      const changePct = (q.regularMarketChangePercent as number) ?? 0;
      const sym = q.symbol as string;
      const label = labelMap[sym] ?? sym;
      const isYield = sym === '^TNX';

      return {
        label,
        symbol: sym,
        price: isYield ? `${fmt(price, 3)}%` : fmt(price),
        change: `${changePct >= 0 ? '+' : ''}${fmt(changePct, 2)}%`,
        up: changePct >= 0,
      };
    });

    // preserve original order
    const ordered = SYMBOLS.map((s) => items.find((i) => i.symbol === s.symbol)).filter(Boolean) as QuoteItem[];

    return NextResponse.json(
      { items: ordered },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10' } },
    );
  } catch (e) {
    console.error('[api/home/global]', e);
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}

// Next.js 캐시 — 30초
export const revalidate = 30;
```

**핵심 변경**:
- `fetch(YF_URL)` → `yahooFinance.quote()` (crumb 자동)
- `^KS200` (KOSPI 200) 추가 — SYMBOLS 배열 2번째 위치
- 캐시 5분 → 30초 (`s-maxage=30`, `revalidate = 30`)

**주의**: `yahoo-finance2` 설치 실패 시 이 파일 수정 중단하고 기존 유지 + 보고.

---

## 작업 3. `components/widgets/GlobalIndicesWidget.tsx` 수정

### PLACEHOLDER에 KOSPI 200 추가

```tsx
const PLACEHOLDER: QuoteItem[] = [
  { label: 'KOSPI',       price: '—', change: '—', up: true },
  { label: 'KOSPI 200',   price: '—', change: '—', up: true },  // ← 신규
  { label: 'KOSDAQ',      price: '—', change: '—', up: true },
  { label: 'S&P 500 선물', price: '—', change: '—', up: false },
  { label: 'NASDAQ 선물', price: '—', change: '—', up: false },
  { label: 'USD/KRW',     price: '—', change: '—', up: true },
  { label: 'USD/JPY',     price: '—', change: '—', up: true },
  { label: 'WTI 원유',    price: '—', change: '—', up: true },
  { label: '미국채 10Y',  price: '—', change: '—', up: false },
];
```

### 30초 Polling 추가

```tsx
useEffect(() => {
  const fetchData = () => {
    fetch('/api/home/global')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (d.items?.length) setItems(d.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  fetchData();  // 즉시 1회
  const interval = setInterval(fetchData, 30_000);  // 이후 30초마다
  return () => clearInterval(interval);  // 언마운트 시 정리
}, []);
```

**핵심**:
- `fetchData` 함수 추출
- 즉시 1회 + `setInterval` 30초마다
- cleanup: `clearInterval`로 메모리 누수 방지

---

## 작업 4. `components/widgets/NetBuyTopWidget.tsx` — size + inline prop 추가

파일 Read 후 Props 인터페이스 추가:

```tsx
interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function NetBuyTopWidget({ inline = false, size = 'default' }: Props = {}) {
  // 기존 state/useEffect 그대로

  // 기존 return 부분:
  // - inline=true 분기 추가 (있다면) — WidgetCard 없이 본문만
  // - WidgetCard에 size={size} 전달
}
```

**주의**: 기존 단독 사용처(상세 페이지 등) 영향 없도록 기본값 `default`. WidgetCard 래핑 부분에 `size={size}` 추가하면 됨.

---

## 작업 5. `components/home/HomeClient.tsx` 레이아웃 대전환

### Imports 조정 (변경 없음)

기존 imports 모두 유지. 위치만 바꿀 뿐.

### Grid Template Columns 수정

**현재**:
```tsx
gridTemplateColumns: 'minmax(300px,3fr) minmax(600px,6fr) minmax(300px,3fr)',
```

**변경**:
```tsx
gridTemplateColumns: 'minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)',
```

- Col 1: 3fr → **2.5fr** (채팅·글로벌지수 축소)
- Col 2: 6fr → **6.5fr** (차트·관심종목·상승테마 확장)
- Col 3: 3fr → **3fr** (호가·체결 유지)

### Col 1 내부 스왑 (관심종목 ↔ 글로벌 지수)

**현재**:
```tsx
<div id="section-col1" style={{ gridRow: '1 / 4', gridColumn: 1, display: 'grid', gridTemplateRows: '1fr 1fr', gap: 8 }}>
  <div id="section-chat"><ChatWidget /></div>
  <div id="section-watchlist"><WatchlistWidget /></div>
</div>
```

**변경**:
```tsx
<div id="section-col1" style={{ gridRow: '1 / 4', gridColumn: 1, display: 'grid', gridTemplateRows: '1fr 1fr', gap: 8 }}>
  <div id="section-chat"><ChatWidget /></div>
  <div id="section-global"><GlobalIndicesWidget /></div>
</div>
```

Col 1 하단 `WatchlistWidget` → `GlobalIndicesWidget`로 교체.

### R3 중앙 스왑 (글로벌지수 ↔ 관심종목, 실시간수급 ↔ 상승테마)

**현재**:
```tsx
<div id="section-r3-center" style={{ gridRow: 3, gridColumn: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
  <div id="section-global"><GlobalIndicesWidget /></div>
  <div id="section-net-buy"><NetBuyTopWidget /></div>
</div>
```

**변경**:
```tsx
<div id="section-r3-center" style={{ gridRow: 3, gridColumn: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
  <div id="section-watchlist"><WatchlistWidget /></div>
  <div id="section-themes"><TrendingThemesWidget /></div>
</div>
```

R3 중앙: `글로벌지수 | 실시간수급` → `관심종목 | 상승테마` (1:1 유지).

**주의**: `TrendingThemesWidget`은 R4에서 제거되고 R3로 이동. `size` prop 전달하지 않음 (기본값 `default` 사용 — R3는 일반 크기).

### R4 위젯 순서 재정렬 (실시간수급 삽입)

**현재**:
```tsx
<div id="section-r4" style={{ gridRow: 4, gridColumn: '1 / 4', display: 'grid', gridTemplateColumns: '0.75fr 0.75fr 0.75fr 0.75fr 1fr', gap: 8 }}>
  <div id="section-movers" style={{ minHeight: 0 }}><MoversTop10Widget size="large" /></div>
  <div id="section-volume" style={{ minHeight: 0 }}><VolumeTop10Widget size="large" /></div>
  <div id="section-themes" style={{ minHeight: 0 }}><TrendingThemesWidget size="large" /></div>
  <div id="section-dart" style={{ minHeight: 0 }}><DartFilingsWidget size="large" /></div>
  <div id="section-news" style={{ minHeight: 0 }}><NewsFeedWidget size="large" /></div>
</div>
```

**변경**:
```tsx
<div id="section-r4" style={{ gridRow: 4, gridColumn: '1 / 4', display: 'grid', gridTemplateColumns: '0.75fr 0.75fr 0.75fr 0.75fr 1fr', gap: 8 }}>
  <div id="section-movers" style={{ minHeight: 0 }}><MoversTop10Widget size="large" /></div>
  <div id="section-volume" style={{ minHeight: 0 }}><VolumeTop10Widget size="large" /></div>
  <div id="section-net-buy" style={{ minHeight: 0 }}><NetBuyTopWidget size="large" /></div>
  <div id="section-dart" style={{ minHeight: 0 }}><DartFilingsWidget size="large" /></div>
  <div id="section-news" style={{ minHeight: 0 }}><NewsFeedWidget size="large" /></div>
</div>
```

R4 순서: `Movers | Volume | 상승테마 | DART | News` → `Movers | Volume | **NetBuy** | DART | News`.

TrendingThemesWidget 제거, NetBuyTopWidget 삽입 (size="large").

### 상단 주석 블록 업데이트

```
// ── 레이아웃 (Dashboard V1.5) ──────────────────────────────────────────────
//
//  Row\Col │  Col 1 (2.5fr)      │    Col 2 (6.5fr)              │    Col 3 (3fr)
// ─────────┼─────────────────────┼───────────────────────────────┼─────────────────────
//  R1-R2   │  마켓채팅 (top)      │  차트 (R1-R2 span)             │  호가창 (top)
//  R1-R3   │  ────                │  ──────                       │  ────
//          │  글로벌지수 (bot)    │                                │  체결창 (bot)
//  R3      │                     │  관심종목 | 상승 테마           │
// ─────────┼─────────────────────┼───────────────────────────────┼─────────────────────
//  R4      │  상승/하락 | 거래량 | 실시간수급 | DART공시 | 뉴스속보
//          │  (max(500px, 100vh-280px), 내부 스크롤)
// ────────────────────────────────────────────────────────────────────────────────────────
//
// Zone 철학:
//  좌열 = 대화·감성 엔진 (채팅 + 배경 지수)
//  중앙 = 트레이딩 아이디어 엔진 (차트 + 내 종목 + 핫 테마)
//  우열 = 주문·실행 엔진 (호가 + 체결)
//  R4   = 발견·탐색 엔진 (랭킹 + 피드)
```

---

## 작업 6. 빌드 + 런타임 검증

### 빌드

```
rm -rf .next
npm run build
```

빌드 에러 → **중단** + 스택 트레이스 보고. 특히 `yahoo-finance2` 타입 에러 가능성 — 있으면 보고.

### dev 서버 + HTTP 체크

```
pkill -f "next dev" || true
sleep 2
npm run dev > /tmp/next-dev.log 2>&1 &

for i in 1 2 3 4 5 6 7 8 9 10; do
  if grep -q "Ready" /tmp/next-dev.log 2>/dev/null; then
    echo "✅ dev 서버 ready"
    break
  fi
  sleep 2
done

curl -s -o /dev/null -w "HTTP / = %{http_code}\n" http://localhost:3333/
curl -s http://localhost:3333/api/home/global | head -c 500
echo ""
echo "===== 에러 체크 (auth lock 제외) ====="
tail -n 80 /tmp/next-dev.log | grep -iE "error" | grep -v "auth lock" || echo "✅ No errors"
```

**통과 조건**:
- `/` = 200
- `/api/home/global` — **실제 숫자 데이터 반환** (KOSPI, KOSPI 200, KOSDAQ 등 items 배열에 값 채워짐)
- 에러 0 (auth lock 제외)

**Yahoo 교체가 성공했는지 판단 기준**: `/api/home/global` 응답의 `items` 배열이 **비어있지 않아야 함**. 여전히 빈 배열이면 `yahoo-finance2` 설치 or 인증 이슈.

---

## 작업 7. Git commit + push

```
git add -A
git status
git commit -m "$(cat <<'EOF'
refactor: V1.5 dashboard - zone restructure + KOSPI200 + polling + Yahoo fix

Layout restructure (5 swaps):
- Col 1 bottom: Watchlist -> GlobalIndices (background info down, trading idea up)
- R3 center: GlobalIndices|NetBuy -> Watchlist|TrendingThemes (trading idea zone)
- R4: TrendingThemes -> NetBuyTop (ranking zone consistency)
- Col 1 width: 3fr -> 2.5fr (chart expansion)
- Col 2 width: 6fr -> 6.5fr (chart + R3 center benefit)

GlobalIndices widget:
- Add KOSPI 200 (^KS200) to symbols
- Add 30s polling (setInterval in useEffect)
- Cache: 5min -> 30s for real-time feel

Yahoo Finance 401 fix:
- Install yahoo-finance2 npm package
- Replace raw fetch with library (auto crumb auth)
- Rewrite app/api/home/global/route.ts

NetBuyTopWidget:
- Add size?: 'default' | 'large' prop (R4 compatibility)
- Add inline? prop (future tab reuse)

Zone philosophy:
- Left: conversation+context engine
- Center: trading idea engine (chart + watchlist + themes)
- Right: order execution engine
- R4: discovery engine (rankings + feeds)
EOF
)"

git push origin main
```

---

## 완료 후 필수 보고

1. `yahoo-finance2` npm 패키지 설치 성공 여부 + package.json dependencies 반영 확인
2. `/api/home/global` 응답에 **실제 데이터 반환 여부** (JSON items 배열에 KOSPI 등 값 채워짐)
3. KOSPI 200 (^KS200) 데이터 정상 수신 여부 (Yahoo가 이 심볼 지원하지 않으면 다른 후보 제안)
4. GlobalIndicesWidget 30초 Polling 작동 여부 (브라우저 Network 탭에서 30초마다 요청 발생 확인)
5. NetBuyTopWidget size/inline prop 추가 성공 여부
6. HomeClient R4 순서 변경 확인 (TrendingThemes 제거, NetBuy 삽입)
7. HomeClient R3 중앙 변경 확인 (Watchlist | TrendingThemes)
8. HomeClient Col 1 하단 변경 확인 (GlobalIndicesWidget)
9. Grid columns 비율 변경 확인 (2.5 / 6.5 / 3)
10. 빌드 결과 (성공/실패, 경고 수)
11. HTTP / = 200 확인
12. 신규 에러 유무
13. 커밋 해시
14. **localhost:3333 스크린샷 2장**:
    - 페이지 1: 새 레이아웃 (Col 1 채팅+글로벌지수 / R3 중앙 관심종목+상승테마 등)
    - 페이지 2: R4 새 순서 (Movers | Volume | NetBuy | DART | News)

---

## 실패 시 롤백

```
git reset --hard 86685b6
rm -rf .next
npm uninstall yahoo-finance2
npm run dev
```

롤백 후 어디서 깨졌는지 파일/줄번호 + 에러 메시지 보고.

---

## KOSPI 200 심볼 확인 — 만약 `^KS200` 작동 안 하면

Yahoo Finance가 `^KS200`을 지원하지 않을 가능성 있음 (미검증). API 응답에 KOSPI 200 데이터가 비어있으면 대안 심볼 시도:

1. `^KOSPI200` (일부 소스에서 사용)
2. `^KS200.KS` (접미사 버전)
3. **포기하고 KOSPI 200 제외** — KIS API로 추후 별도 구현

Claude Code가 테스트 후 맞는 심볼 선택. 3개 다 실패 시 KOSPI 200 항목 임시 제거 + 보고.

---

## 설계 근거

### 왜 yahoo-finance2 패키지인가

Yahoo Finance의 `v7/finance/quote` 엔드포인트는 2024년부터 **crumb 토큰** 요구. raw fetch로는 인증 실패 (401). `yahoo-finance2` 라이브러리는:

1. 최초 호출 시 쿠키 + crumb 자동 획득 (브라우저 세션 시뮬레이션)
2. 이후 토큰 자동 갱신
3. 심볼 배열 지원, 타입 정의 포함
4. Next.js 서버 환경 호환

대안(Alpha Vantage, Finnhub, Stooq)도 있지만:
- Alpha Vantage: 무료 25회/일 (부족)
- Finnhub: 60회/분 OK이지만 API 키 필요
- Stooq: 키 없음 OK이지만 CSV 파싱 + 심볼 매핑 필요

→ **yahoo-finance2가 최소 변경으로 복구** 가능한 방법.

### 왜 캐시 5분 → 30초

사용자 기대 "실시간감"을 위해:
- 서버 캐시 30초 = Yahoo API 호출은 30초에 1회로 제한 (rate limit 안전)
- 클라이언트 Polling 30초 = 각 사용자 30초마다 서버 조회 (캐시 hit)
- 실제 Yahoo 호출은 **동시 접속자 수 무관하게 30초 1회**

→ 무한 확장성 유지하면서도 "실시간감" 제공.

### 왜 30초 간격 (15초나 60초가 아니라)

- 15초: 너무 빠름, 지수는 분 단위 유의미 변화
- 60초: 느림, 사용자가 "정지한 화면" 느낌
- **30초 = 심리적 "움직임" 체감의 sweet spot** (증권사 MTS도 유사 주기)
