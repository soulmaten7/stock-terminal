<!-- 2026-06-06 -->
# STEP 186 — 미리보기 캔들차트 토스식 (거래량 막대 + 월 축 라벨)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_186_COMMAND.md 파일 내용대로 실행해줘`

## 목표
종목 미리보기 패널 캔들차트를 토스처럼: 캔들 밑에 **거래량 막대** + 하단 **월 축 라벨(26.3·26.4…)**.
- 차트 API(`/api/kis/chart`)는 이미 `time`·`volume` 제공 중 → 타입에 추가만 하면 됨
- 캔들은 그대로(초록/빨강), 거래량은 같은 색 옅게, 월 바뀌는 첫 캔들에 라벨
- 데이터 60일치(약 3개월, 토스 미리보기와 비슷)

## 전제 상태
- HEAD: STEP 185 적용된 상태
- 변경: `components/home-v6/HomeStockDetail.tsx`(Candle 타입 + CandleChart 함수) 1파일
- 참고: `/api/kis/chart` candle = `{ time:"YYYY-MM-DD", open, high, low, close, volume }`

---

## 작업 1/2 — `Candle` 타입에 time·volume 추가

**찾기:**
```tsx
type Candle = { open: number; high: number; low: number; close: number };
```
**바꾸기:**
```tsx
type Candle = { time: string; open: number; high: number; low: number; close: number; volume: number };
```

## 작업 2/2 — `CandleChart` 함수 교체

**찾기:**
```tsx
function CandleChart({ candles }: { candles: Candle[] }) {
  if (candles.length < 2) {
    return <div className="flex h-32 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
  const data = candles.slice(-50);
  const w = 280;
  const h = 128;
  const pad = 4;
  const max = Math.max(...data.map((c) => c.high));
  const min = Math.min(...data.map((c) => c.low));
  const range = max - min || 1;
  const cw = w / data.length;
  const y = (v: number) => pad + (h - 2 * pad) * (1 - (v - min) / range);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
      {data.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.close >= c.open;
        const color = up ? "#1AC267" : "#F04452";
        const top = y(Math.max(c.open, c.close));
        const bot = y(Math.min(c.open, c.close));
        const bw = Math.max(1.2, cw * 0.6);
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={0.8} />
            <rect x={x - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}
```

**바꾸기:**
```tsx
function CandleChart({ candles }: { candles: Candle[] }) {
  if (candles.length < 2) {
    return <div className="flex h-32 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
  const data = candles.slice(-60);
  const w = 280;
  const priceH = 96;
  const gap = 6;
  const volH = 22;
  const labelH = 14;
  const h = priceH + gap + volH + labelH;
  const pad = 4;
  const max = Math.max(...data.map((c) => c.high));
  const min = Math.min(...data.map((c) => c.low));
  const range = max - min || 1;
  const maxVol = Math.max(...data.map((c) => c.volume), 1);
  const cw = w / data.length;
  const py = (v: number) => pad + (priceH - 2 * pad) * (1 - (v - min) / range);
  const volBase = priceH + gap + volH;
  const bw = Math.max(1.2, cw * 0.6);

  // 월이 바뀌는 첫 캔들에 라벨(너무 붙으면 스킵)
  const labels: { x: number; text: string }[] = [];
  let prevMonth = "";
  data.forEach((c, i) => {
    const ym = c.time.slice(0, 7);
    if (ym !== prevMonth) {
      prevMonth = ym;
      const x = i * cw + cw / 2;
      if (labels.length === 0 || x - labels[labels.length - 1].x > 34) {
        labels.push({ x, text: `${c.time.slice(2, 4)}.${parseInt(c.time.slice(5, 7), 10)}` });
      }
    }
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" aria-hidden="true">
      {/* 캔들 */}
      {data.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.close >= c.open;
        const color = up ? "#1AC267" : "#F04452";
        const top = py(Math.max(c.open, c.close));
        const bot = py(Math.min(c.open, c.close));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={py(c.high)} y2={py(c.low)} stroke={color} strokeWidth={0.8} />
            <rect x={x - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} fill={color} />
          </g>
        );
      })}
      {/* 거래량 막대 */}
      {data.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.close >= c.open;
        const vh = (c.volume / maxVol) * volH;
        return (
          <rect
            key={`v${i}`}
            x={x - bw / 2}
            y={volBase - vh}
            width={bw}
            height={Math.max(0.5, vh)}
            fill={up ? "#1AC267" : "#F04452"}
            opacity={0.45}
          />
        );
      })}
      {/* 월 축 라벨 */}
      {labels.map((l, i) => (
        <text key={`l${i}`} x={l.x} y={h - 3} fontSize={8} fill="#94a3b8" textAnchor="middle">
          {l.text}
        </text>
      ))}
    </svg>
  );
}
```

> 핵심: 가격(priceH 96) 밑에 거래량 밴드(volH 22) + 월 라벨(14) 추가. 거래량은 캔들과 같은 x·색, 옅게(0.45). SVG는 `w-full`만 줘서 viewBox 비율로 높이 자동(왜곡 없음).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeStockDetail.tsx && git commit -m "feat(v7): 미리보기 캔들차트 토스식 — 거래량 막대 + 월 축 라벨 (STEP 186)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 국내 종목 hover 시 미리보기 캔들 **밑에 거래량 막대**(초록/빨강 옅게), **하단에 월 라벨(26.3·26.4…)**
- [ ] 캔들 자체는 그대로 또렷
- [ ] 미국 종목은 KIS 차트 미지원이라 "차트 데이터 없음"(정상)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 거래량 진하기: `opacity={0.45}` 조절. 막대 높이대: `volH` 숫자.
- 라벨 너무 촘촘/성기면 `> 34`(px 간격) 숫자 조절.
- 데이터 길이 `slice(-60)` = 약 3개월. 더 길게 보려면 숫자 ↑(API는 최대 100영업일).

---
> STEP 186 = 미리보기 캔들 토스식(거래량+월라벨). 전제 STEP 185. 다음: 카테고리 2열 등. 문서 묶어 갱신.
