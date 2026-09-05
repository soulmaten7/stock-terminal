# STEP 81 — Section 1 체결창 + 호가창 폴리싱

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 80 완료 — Section 1~5 레이아웃 구조 완성.

**목표:**
Section 1 중앙 컬럼 하단부 체결창 + 호가창 UI 품질 개선.
- 체결창: 실시간 느낌 + 매수/매도 색상 + 대량 체결 하이라이트
- 호가창: 10호가 + 잔량 바 + 총잔량/평균가

**범위 제한:**
- 실시간 WebSocket 연결은 **기존 구조 유지** — 폴링이면 폴링 그대로.
- 호가/체결 데이터 포맷은 기존 API 응답 그대로 사용.
- 모바일 세로뷰 대응은 이번 STEP 제외.

---

## 작업 0 — 현재 위젯 파악

```bash
find components -name "Trade*" -o -name "Orderbook*" -o -name "Quote*" -o -name "Execution*" -type f 2>/dev/null | head
grep -rn "trades\|orderbook\|체결\|호가" components/ --include="*.tsx" 2>/dev/null | head -20
```

보고: 체결창/호가창 파일 경로 + 현재 데이터 흐름(폴링/WS).

---

## 작업 1 — 체결창 (`TradesWidget` 또는 ExecutionList) 폴리싱

### 목표 UI

```
┌─────────────────────────────────┐
│ 체결 (실시간)                    │
│ 시각     체결가    수량    변동   │
│ 14:23:45 72,100  1,234  ▲       │
│ 14:23:44 72,050    567  ▼       │
│ 14:23:43 72,100 10,000  ▲ HUGE  │  ← 대량(1만주↑) 하이라이트
│ ...                              │
└─────────────────────────────────┘
```

### 개선 항목

- **매수 체결(+)** `text-[#0ABAB5]`, **매도 체결(-)** `text-[#FF4D4D]`
- 신규 체결 행 **0.3s fadeIn 애니메이션** (Tailwind `animate-fadeIn` 커스텀)
- 대량(임계값: KR 5000주 / US 100주 이상) 행 배경 `bg-[#FFF8E1]` + 우측 `HUGE` 배지
- 최대 30행 유지 — 그 이상은 앞에서 잘라냄

### 애니메이션 keyframe 추가

`tailwind.config.ts` (또는 `.js`) 에 확장:

```ts
theme: {
  extend: {
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0', transform: 'translateY(-4px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
    },
    animation: {
      fadeIn: 'fadeIn 0.3s ease-out',
    },
  },
},
```

### 행 컴포넌트 예시

```tsx
function TradeRow({ trade }: { trade: Trade }) {
  const up = trade.side === 'buy';
  const huge = trade.volume >= (trade.market === 'KR' ? 5000 : 100);
  return (
    <tr className={`animate-fadeIn ${huge ? 'bg-[#FFF8E1]' : ''}`}>
      <td className="text-[#666] tabular-nums">{trade.time}</td>
      <td className={`text-right tabular-nums font-semibold ${up ? 'text-[#0ABAB5]' : 'text-[#FF4D4D]'}`}>
        {trade.price.toLocaleString()}
      </td>
      <td className="text-right tabular-nums">{trade.volume.toLocaleString()}</td>
      <td className="text-center">
        {up ? <span className="text-[#0ABAB5]">▲</span> : <span className="text-[#FF4D4D]">▼</span>}
        {huge && <span className="ml-1 text-[9px] px-1 py-0.5 bg-[#FF9800] text-white rounded">HUGE</span>}
      </td>
    </tr>
  );
}
```

---

## 작업 2 — 호가창 (`OrderbookWidget`) 폴리싱

### 목표 UI

```
┌──────────────────────────────┐
│ 호가 (10단계)                 │
│ 매도잔량         호가   매수잔량│
│  ▓▓▓▓  12,340  72,500       │
│  ▓▓     5,678  72,400       │
│  ▓      2,345  72,300       │
│  ──────────────────────     │
│                72,200        │  ← 현재가 강조
│  ──────────────────────     │
│                72,100  4,567 ▓│
│                72,000  9,876 ▓▓│
│                71,900 15,234 ▓▓▓│
│  ─────────────────────────  │
│  총매도: 456K  │ 총매수: 523K │
│  평균매도가: 72,280          │
│  평균매수가: 71,950          │
└──────────────────────────────┘
```

### 잔량 바 구현

```tsx
function OrderbookRow({ row, maxVolume, side, currentPrice }: {
  row: { price: number; volume: number };
  maxVolume: number;
  side: 'ask' | 'bid';
  currentPrice: number;
}) {
  const pct = (row.volume / maxVolume) * 100;
  const isAsk = side === 'ask';
  const bgColor = isAsk ? '#FFE5E5' : '#E5F7F6';
  const textColor = isAsk ? '#FF4D4D' : '#0ABAB5';

  return (
    <div className="grid grid-cols-3 h-6 text-xs items-center relative">
      {/* 매도(왼쪽) */}
      {isAsk ? (
        <>
          <div className="relative">
            <div
              className="absolute right-0 top-0 h-full"
              style={{ width: `${pct}%`, backgroundColor: bgColor }}
            />
            <span className="relative text-right pr-2 block tabular-nums">{row.volume.toLocaleString()}</span>
          </div>
          <span className="text-center tabular-nums font-semibold" style={{ color: textColor }}>
            {row.price.toLocaleString()}
          </span>
          <span />
        </>
      ) : (
        <>
          <span />
          <span className="text-center tabular-nums font-semibold" style={{ color: textColor }}>
            {row.price.toLocaleString()}
          </span>
          <div className="relative">
            <div
              className="absolute left-0 top-0 h-full"
              style={{ width: `${pct}%`, backgroundColor: bgColor }}
            />
            <span className="relative text-left pl-2 block tabular-nums">{row.volume.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
}
```

### 총잔량 / 평균가 계산

호가창 하단에 추가:

```tsx
const totalAsk = asks.reduce((sum, r) => sum + r.volume, 0);
const totalBid = bids.reduce((sum, r) => sum + r.volume, 0);
const avgAskPrice = asks.reduce((s, r) => s + r.price * r.volume, 0) / (totalAsk || 1);
const avgBidPrice = bids.reduce((s, r) => s + r.price * r.volume, 0) / (totalBid || 1);

// 렌더
<div className="border-t border-[#E5E7EB] p-2 text-[11px] grid grid-cols-2 gap-2">
  <div>
    <div className="text-[#999]">매도잔량 합계</div>
    <div className="text-[#FF4D4D] tabular-nums font-semibold">{totalAsk.toLocaleString()}</div>
  </div>
  <div>
    <div className="text-[#999]">매수잔량 합계</div>
    <div className="text-[#0ABAB5] tabular-nums font-semibold">{totalBid.toLocaleString()}</div>
  </div>
</div>
```

### 현재가 강조 선

호가 10단계 사이에 현재가를 표시하는 가로 구분선 + 가격 라벨:

```tsx
<div className="h-8 border-y-2 border-[#0ABAB5] bg-[#F0FDFC] flex items-center justify-center">
  <span className="text-sm font-bold text-[#0ABAB5] tabular-nums">
    {currentPrice.toLocaleString()}
  </span>
</div>
```

---

## 작업 3 — 레이아웃 비율 재확인

Section 1 중앙 컬럼 내부 stack 비율 (STEP 70 기준):
- 차트 60% / 호가 25% / 체결 15%

호가 내부가 상세해지면서 25% 로 부족하면 **30%로 조정** 고려. 단, 체결도 최소 15% 확보. 차트는 55% 로 축소.

```tsx
<div className="flex flex-col h-full">
  <div className="basis-[55%] ..."><ChartArea /></div>
  <div className="basis-[30%] border-t ..."><OrderbookWidget /></div>
  <div className="basis-[15%] border-t ..."><TradesWidget /></div>
</div>
```

구현 전에 실제 렌더 확인해서 결정. 차트가 너무 작아지면 원래 60/25/15 유지.

---

## 작업 4 — 빌드 + 문서 + push

```bash
npm run build
```

CHANGELOG:
```
- feat(dashboard): 체결창 + 호가창 폴리싱 (대량체결 하이라이트, 10호가 잔량바, 총잔량) (STEP 81)
```

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): 체결창 + 호가창 폴리싱 (STEP 81)

- TradesWidget: 매수/매도 색상, fadeIn 애니메이션, 대량체결 HUGE 배지
- OrderbookWidget: 10단계 잔량 막대, 현재가 강조 라인, 총잔량/평균가
- tailwind.config 에 fadeIn keyframe 추가
- Section 1 중앙 stack 비율 재조정(필요시)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 81 완료
- TradesWidget 폴리싱: 애니메이션/색상/HUGE 배지
- OrderbookWidget 폴리싱: 잔량 막대/현재가 강조/총잔량
- Section 1 중앙 stack 비율: <55/30/15 or 60/25/15 유지>
- npm run build: 성공
- git commit: <hash>
```

---

## 주의사항

- **`animate-fadeIn` 매 렌더마다 재실행** — React key 가 바뀌지 않도록 주의. 체결 id 기준 key 유지.
- **대량 체결 임계값** — KR 5000주 / US 100주는 종목 시가 기반 맞춤 조정 필요. 이번 STEP 은 고정값.
- **호가창 잔량 바 최대 폭 100%** — `maxVolume` 이 0 이면 `(totalAsk, totalBid).max` 중 더 큰 쪽 기준.
- **현재가 포매터** — 종목별 최소 단위(10원/100원 등)에 따라 `toLocaleString` 만으로 부족할 수 있음. 기존 포매터 있으면 그대로 사용.
- **성능** — 체결 30행 넘으면 앞에서 slice. WebSocket/폴링에서 300ms 이하 업데이트는 중복 렌더 주의(requestAnimationFrame 배치).
