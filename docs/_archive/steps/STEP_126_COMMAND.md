<!-- 2026-05-31 -->
# STEP 126 — 종목 페이지 핫픽스 (종목명·시총·52주·차트)

🔴 **Opus 권장** (4개 버그 동시 디버깅 + 수정)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `07cbd36` (STEP 125)
- 사용자가 `/stock/000660` (SK하이닉스) 페이지에서 4가지 버그 발견 (스크린샷)

## 발견된 버그 4종

### 🐛 버그 1: 종목명 미표시
**현상**:
- 좌측 종목정보 헤더에 "000660" 만 표시 (종목명 "SK하이닉스" 안 보임)
- 토론 헤더: "💬 000660 토론" (잘못) → "💬 SK하이닉스 토론" (정상)
- 채팅 헤더: "⚡ 000660 실시간 채팅" → "⚡ SK하이닉스 실시간 채팅"

**원인 추정**:
- StockInfoPanel: `data.name` 표시 부분 누락 또는 JSX 오류
- DiscussionBoard, StockChatPanel: `symbol` 만 사용, `stockName` prop 없음

**수정**:
1. StockPageClient 에서 종목명 fetch (한국: stocks DB `name_ko`, 미국: 그대로 ticker)
2. `stockName` prop 으로 DiscussionBoard, StockChatPanel 에 전달
3. StockInfoPanel 의 종목명 표시 부분 점검 (data.name 렌더 확인)
4. 헤더에서 종목명 우선 표시, 코드는 보조

### 🐛 버그 2: 시가총액 단위 1억배 오류 (결정적)

**현상**: SK하이닉스 시총 = 화면 **0.2조** (실제 약 200조원)

**원인**:
- KIS API `hts_avls` 필드 단위 = **억원**
- 운종 코드: `(cap / 100000000).toFixed(1) + "조"` (100,000,000 = 1억)
- 정확한 변환: `(cap / 10000).toFixed(1) + "조"` (10,000 억원 = 1조원)

**수정 위치**:
- `components/stock/StockInfoPanel.tsx` 의 `marketCap` 표시 부분
- `components/sidepanel/StockDetailPanel.tsx` 의 OverviewTab 도 같은 버그 가능 — 확인

**올바른 코드**:
```tsx
function formatMarketCapKr(cap: number): string {
  if (!cap || cap <= 0) return "—";
  // KIS hts_avls 단위 = 억원
  if (cap >= 10000) return `${(cap / 10000).toFixed(1)}조`;
  return `${cap.toLocaleString()}억`;
}
```

미국 주식은 기존 그대로 ($T/$B).

### 🐛 버그 3: 52주 최고/최저 "—" 표시

**원인**:
- 현재 KIS API 응답 매핑: `o.stck_dryc_hgpr` / `o.stck_dryc_lwpr`
- 이건 KIS 의 **당해년도 최고/최저** (52주 X)
- **52주 최고/최저는 `o.w52_hgpr` / `o.w52_lwpr`** (KIS 공식 필드명)

**수정 위치**: `app/api/kis/price/route.ts`

기존:
```tsx
high52w: parseInt(o.stck_dryc_hgpr || '0', 10),
low52w: parseInt(o.stck_dryc_lwpr || '0', 10),
```

변경:
```tsx
high52w: parseInt(o.w52_hgpr || o.stck_dryc_hgpr || '0', 10),
low52w: parseInt(o.w52_lwpr || o.stck_dryc_lwpr || '0', 10),
```

(폴백 유지 — 어떤 필드가 응답되든 동작)

### 🐛 버그 4: 차트 영역 표시 안 됨

**현상**: "일봉 (60일)" 라벨만 있고 차트 안 그려짐 (스크린샷에 빈 박스만)

**원인 추정 (디버깅 필요)**:
- A. KIS chart API 응답 실패
- B. lightweight-charts dynamic import 실패
- C. ChartTab 컴포넌트의 컨테이너 height 0
- D. ResizeObserver 가 자식 div 너비 측정 실패 (sticky 안에서)

**디버깅 절차**:
1. `curl http://localhost:3333/api/kis/chart?symbol=000660&period=D | head -c 500` — API 응답 확인
2. 브라우저 콘솔 — `[chart]` 또는 에러 로그 확인 (이전 STEP 107 에서 추가된 진단 코드 패턴)
3. StockInfoPanel 의 chartRef container CSS — `w-full h-[200px]` 확인
4. dynamic import: 빌드된 chunk 정상 로드되는지

**가능한 수정**:
- chartRef 의 부모 컨테이너 width 가 명시되어야 함 (sticky aside 안에서)
- 200px height 명시되어 있어야 함
- 컨테이너에 `position: relative` 추가
- ResizeObserver 가 자식 ref 가 아닌 부모 div ref 도 가능

---

## 작업 디테일

### [1] DB stocks 조회 활용 — 종목명 fetch

`components/stock/StockPageClient.tsx` 수정:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import { createAnonClient } from "@/lib/supabase/anon-client";
import StockInfoPanel from "./StockInfoPanel";
import DiscussionBoard from "./DiscussionBoard";
import StockChatPanel from "./StockChatPanel";

type Props = { code: string };

export default function StockPageClient({ code }: Props) {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [stockName, setStockName] = useState<string>(code);

  // 종목명 조회 (한국: stocks DB · 미국: ticker 그대로)
  useEffect(() => {
    const load = async () => {
      if (/^\d{6}$/.test(code)) {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("stocks")
          .select("name_ko")
          .eq("symbol", code)
          .maybeSingle();
        if (data?.name_ko) setStockName(data.name_ko);
      } else {
        setStockName(code);
      }
    };
    load();
  }, [code]);

  useEffect(() => {
    setSelectedSymbol({
      code,
      name: stockName,
      market: /^[A-Z.\-]+$/.test(code) ? "US" : "KOSPI",
    });
  }, [code, stockName, setSelectedSymbol]);

  return (
    <div className="grid grid-cols-[320px_1fr_380px] gap-4 px-10 py-4 min-h-screen">
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <StockInfoPanel symbol={code} />
      </aside>

      <main>
        <DiscussionBoard symbol={code} stockName={stockName} />
      </main>

      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)]">
        <StockChatPanel symbol={code} stockName={stockName} />
      </aside>
    </div>
  );
}
```

### [2] DiscussionBoard·StockChatPanel — stockName prop 받기

각 컴포넌트 Props 에 `stockName?: string` 추가, 헤더 텍스트에서 사용:

DiscussionBoard 헤더:
```tsx
<h1>💬 {stockName || symbol} 토론</h1>
```

StockChatPanel 헤더:
```tsx
<span>⚡ {stockName || symbol} 실시간 채팅</span>
```

placeholder 도 동일 (메시지 입력창):
```tsx
placeholder={`${stockName || symbol} 채팅...`}
```

### [3] StockInfoPanel — 종목명 표시 확인 + 시총 단위 수정 + 52주 fallback 표시

**종목명 표시 점검**:
- 좌측 헤더 박스에 `data.name` 이 렌더되는지 확인 (스크린샷에는 안 보임)
- 만약 누락이면 추가:

```tsx
<div className="bg-unjong-surface rounded-lg border border-unjong-border p-3">
  <h2 className="text-base font-bold text-unjong-primary">{data.name}</h2>
  <p className="text-[10px] text-unjong-muted font-mono">{symbol}</p>
  {/* 가격 ... */}
</div>
```

**시총 단위 수정** — 한국·미국 분리:

```tsx
function formatMarketCap(cap: number, isUS: boolean): string {
  if (!cap || cap <= 0) return "—";
  if (isUS) {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    return `$${cap.toLocaleString()}`;
  }
  // 한국 KIS hts_avls = 억원
  if (cap >= 10000) return `${(cap / 10000).toFixed(1)}조`;
  return `${cap.toLocaleString()}억`;
}
```

**52주 fallback 표시**:
```tsx
<Row label="52주 최고" value={data.high52w > 0 ? formatPrice(data.high52w, !isKr) : "—"} />
<Row label="52주 최저" value={data.low52w > 0 ? formatPrice(data.low52w, !isKr) : "—"} />
```

### [4] KIS API 응답 — 52주 필드 수정

`app/api/kis/price/route.ts`:

기존:
```tsx
high52w: parseInt(o.stck_dryc_hgpr || '0', 10),
low52w: parseInt(o.stck_dryc_lwpr || '0', 10),
```

변경:
```tsx
high52w: parseInt(o.w52_hgpr || o.stck_dryc_hgpr || '0', 10),
low52w: parseInt(o.w52_lwpr || o.stck_dryc_lwpr || '0', 10),
```

### [5] 차트 영역 디버깅

#### A. API 응답 확인 (먼저 검증)
```bash
curl -s "http://localhost:3333/api/kis/chart?symbol=000660&period=D" | head -c 1000
```

candles 가 잘 들어왔으면 → 클라이언트 문제. 빈 응답이면 KIS API 문제.

#### B. 컨테이너 width 강제 (sticky aside 안에서 폭 0 가능)

```tsx
<section className="bg-unjong-surface rounded-lg border border-unjong-border p-3">
  <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-2">일봉 (60일)</h3>
  <div ref={chartRef} className="w-full h-[200px] min-w-[260px]" />
</section>
```

#### C. createChart 호출 시 width 명시 (clientWidth = 0 폴백)

```tsx
const width = chartRef.current.clientWidth || 280;
chart = createChart(chartRef.current, {
  width,
  height: 200,
  // ...
});
```

#### D. 콘솔 에러 로깅

ChartTab/StockInfoPanel chart useEffect 에 try/catch + console.error 추가:

```tsx
try {
  const [{ createChart, ColorType, LineStyle }, res] = await Promise.all([
    import("lightweight-charts"),
    fetch(`/api/kis/chart?symbol=${symbol}&period=D`).then((r) => r.json()),
  ]);
  if (cancelled || !chartRef.current) return;
  if (!res.candles || res.candles.length === 0) {
    console.warn("[chart] no candles for", symbol);
    return;
  }
  // ... createChart
} catch (err) {
  console.error("[chart] failed to load", err);
}
```

### [6] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

### [7] 4개 문서 헤더 갱신

### [8] 커밋 + 푸시

```bash
git add -A
git commit -m "fix(stock-page): 4개 버그 핫픽스 — 종목명·시총·52주·차트

버그 1: 종목명 미표시
- StockPageClient 에서 stocks DB name_ko 조회
- stockName prop → DiscussionBoard / StockChatPanel 헤더에 사용
- StockInfoPanel 좌측 헤더에 data.name 표시 보장

버그 2: 시가총액 단위 1억배 오류 (SK하이닉스 200조 → 0.2조 표시)
- KIS hts_avls 단위 = 억원
- 잘못된 변환: (cap / 100000000) — 백만원 가정
- 올바른 변환: (cap / 10000).toFixed(1) + '조'
- 1만 미만은 'X억' 표기
- 미국 주식 단위 (T/B) 는 그대로

버그 3: 52주 최고/최저 '—' 표시
- KIS API 필드 stck_dryc_hgpr/lwpr = '당해년도' 고저 (52주 X)
- 올바른 필드 = w52_hgpr / w52_lwpr
- 양쪽 폴백: w52_hgpr || stck_dryc_hgpr

버그 4: 차트 영역 표시 안 됨
- chartRef 컨테이너 min-w-[260px] 추가 (sticky aside 안 width 0 방지)
- createChart 호출 시 width = clientWidth || 280 (폴백)
- try/catch + console.warn/error 디버깅 로그
- 빈 candles 응답 시 안내 표시

검증:
- SK하이닉스 (000660): 종목명·시총 200조·52주·차트 정상 표시
- 삼성전자 (005930): 동일
- 카카오 (035720): 동일
- AAPL: 미국 주식 영향 없음 (Yahoo 별도 경로)"
git push
```

## 검증 (사용자 안내용)

푸시 후 하드 리프레시:

1. `/stock/000660` (SK하이닉스):
   - 좌측 상단 "**SK하이닉스**" + "000660" 코드
   - 시총 "**200.0조**" (이전: 0.2조)
   - 52주 최고/최저 실제 가격 표시 (이전: —)
   - **일봉 60일 캔들 차트** 정상 표시 (이전: 빈 박스)
   - 가운데 "💬 **SK하이닉스** 토론" (이전: 💬 000660 토론)
   - 우측 "⚡ **SK하이닉스** 실시간 채팅" (이전: ⚡ 000660 실시간 채팅)
2. `/stock/005930` 도 동일
3. `/stock/AAPL` 미국 주식 영향 X (Yahoo 통합 경로 그대로)

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ 4개 버그 모두 해결
- ✅/❌ SK하이닉스 시총 200조 정상 표시
- ✅/❌ 차트 표시 (실패 시 console 로그 공유)
- ✅/❌ 커밋 + 푸시

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| KIS w52_hgpr 필드도 빈 응답 | 다른 API endpoint 필요 (`/api/kis/chart` 의 candles 에서 max·min 계산) |
| stocks DB 에 일부 종목명 누락 | DB 보강 필요 (별도 STEP) |
| 차트 width 0 → 200px 표시되지만 candle 압축됨 | ResizeObserver 가 부모 width 갱신 시 chart.applyOptions 호출 |
| Realtime 채팅 영향 | symbol prop 만 사용 → 영향 X |
