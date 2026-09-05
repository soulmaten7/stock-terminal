# STEP 42 — TechnicalAnalysis 재활성화 (stock_prices 시딩 + 기술 지표 컴포넌트)

**실행 명령어 (Sonnet)**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

Claude Code 안에서:
```
@docs/STEP_42_COMMAND.md 파일 내용대로 실행해줘
```

---

## 목표
1. `scripts/seed-stock-prices.py` 실행 → `stock_prices` 테이블에 시총 TOP 200 + 테마 50종목 1년치 일봉 시딩
2. `types/stock.ts` 에 `StockPrice` 인터페이스 추가
3. `components/analysis/TechnicalAnalysis.tsx` 를 스텁 → **실제 기술 지표 컴포넌트**로 재작성
   - 이동평균선 (MA 5 · 20 · 60 · 120)
   - 볼린저밴드 (20일 평균 ± 2σ)
   - RSI (14일)
   - 거래량 추이

## 전제 상태
- 직전 커밋: `6fee4f6` (STEP 41 — 4개 분석 탭 스텁 교체)
- `scripts/seed-stock-prices.py` 존재 (기존 파일, FDR DataReader 사용)
- `components/analysis/TechnicalAnalysis.tsx` 는 현재 32줄 스텁 카드
- `supabase/migrations/007_stock_prices.sql` 존재 (stock_prices 테이블)

## ⚠ 실행 시간 주의
- FDR DataReader 레이트리밋 때문에 **250종목 일봉 수집에 약 10~25분** 소요 예상
- 스크립트 중단 없이 끝까지 두고, 중간에 rate limit 로그가 나와도 자동 재시도함

---

## Part A — stock_prices 시딩

### A-0. 사전 점검
```bash
# 1. 프로젝트 루트
cd ~/Desktop/OTMarketing

# 2. 현재 stock_prices 카운트 확인
python3 scripts/sql-exec.py "SELECT COUNT(*) FROM stock_prices"

# 3. Python 의존성 확인 (이미 설치되어 있어야 함)
python3 -c "import FinanceDataReader, supabase; print('OK')"
```

만약 의존성 누락이면:
```bash
pip install finance-datareader supabase python-dotenv --break-system-packages
```

### A-1. 시딩 실행
```bash
python3 scripts/seed-stock-prices.py
```

**예상 출력 패턴**:
```
[1/3] 대상 종목 선정 (watchlist + 시총 TOP 200 + 005930)
  대상 200종목  # 혹은 테마/관심종목 포함 시 ~250
[2/3] FDR DataReader 1년 일봉 수집 중 (2025-03-17 ~ 2026-04-22)
  진행: 20 / 250
  진행: 40 / 250
  ...
[2/3] 행 수집 48000건 내외, 실패 N건
[3/3] stock_prices upsert 시작
  stock_prices upserted: 2000건
  stock_prices upserted: 4000건
  ...
[완료] stock_prices 테이블 총 ~48000건
```

**실패 허용 기준**: 전체 대상의 5% 이내 실패는 OK (FDR 일시적 장애로 인한 개별 종목 누락은 재시딩으로 복구 가능).

### A-2. 시딩 결과 검증
```bash
# 1. 총 행수
python3 scripts/sql-exec.py "SELECT COUNT(*) FROM stock_prices"

# 2. 삼성전자 (005930) 일봉 샘플
python3 scripts/sql-exec.py "SELECT trade_date, close, volume FROM stock_prices sp JOIN stocks s ON s.id = sp.stock_id WHERE s.symbol = '005930' ORDER BY trade_date DESC LIMIT 5"

# 3. 커버된 종목 수
python3 scripts/sql-exec.py "SELECT COUNT(DISTINCT stock_id) FROM stock_prices"
```

**예상 결과**:
- 총 ~48,000행 (250종목 × 240영업일)
- 삼성전자 최근 5일 정상 출력
- 커버 종목 수 200~250개

---

## Part B — types/stock.ts 에 StockPrice 인터페이스 추가

`types/stock.ts` 파일 상단 (Stock 인터페이스 바로 아래, Financial 인터페이스 위에) 에 다음 추가:

```typescript
export interface StockPrice {
  id: number;
  stock_id: number;
  trade_date: string;  // YYYY-MM-DD
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  change: number | null;
  change_percent: number | null;
  created_at: string;
}
```

---

## Part C — TechnicalAnalysis.tsx 재작성

`components/analysis/TechnicalAnalysis.tsx` 전체 내용을 아래로 교체:

```tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { StockPrice } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  LineChart, Line, Bar, ComposedChart, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Activity, TrendingUp, BarChart3, LineChart as LineChartIcon } from 'lucide-react';

interface Props {
  stockId: number;
}

function formatNum(n: number | null | undefined, digits = 0, suffix = ''): string {
  if (n == null || isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: digits })}${suffix}`;
}

// SMA — 단순 이동평균
function sma(arr: (number | null)[], window: number): (number | null)[] {
  return arr.map((_, i) => {
    if (i < window - 1) return null;
    const slice = arr.slice(i - window + 1, i + 1);
    if (slice.some(v => v == null)) return null;
    const sum = (slice as number[]).reduce((a, b) => a + b, 0);
    return sum / window;
  });
}

// 볼린저밴드 — 20일 이동평균 ± 2σ
function bollinger(arr: (number | null)[], window = 20, k = 2): {
  upper: (number | null)[];
  lower: (number | null)[];
} {
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < window - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    const slice = arr.slice(i - window + 1, i + 1);
    if (slice.some(v => v == null)) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    const nums = slice as number[];
    const mean = nums.reduce((a, b) => a + b, 0) / window;
    const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / window;
    const std = Math.sqrt(variance);
    upper.push(mean + k * std);
    lower.push(mean - k * std);
  }
  return { upper, lower };
}

// RSI — Wilder's smoothing
function rsi(closes: (number | null)[], window = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < window + 1) return out;

  const changes: (number | null)[] = [null];
  for (let i = 1; i < closes.length; i++) {
    const c = closes[i];
    const p = closes[i - 1];
    if (c == null || p == null) changes.push(null);
    else changes.push(c - p);
  }

  // 초기 평균 (첫 window 기간의 gain/loss 평균)
  let avgGain = 0;
  let avgLoss = 0;
  let validCount = 0;
  for (let i = 1; i <= window; i++) {
    const ch = changes[i];
    if (ch == null) continue;
    if (ch > 0) avgGain += ch;
    else avgLoss += -ch;
    validCount++;
  }
  if (validCount < window) return out;
  avgGain /= window;
  avgLoss /= window;
  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out[window] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0);

  for (let i = window + 1; i < closes.length; i++) {
    const ch = changes[i];
    if (ch == null) {
      out[i] = out[i - 1];
      continue;
    }
    const gain = ch > 0 ? ch : 0;
    const loss = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (window - 1) + gain) / window;
    avgLoss = (avgLoss * (window - 1) + loss) / window;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  }

  return out;
}

export default function TechnicalAnalysis({ stockId }: Props) {
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('stock_prices')
        .select('*')
        .eq('stock_id', stockId)
        .order('trade_date', { ascending: true });
      if (data) setPrices(data as StockPrice[]);
      setLoading(false);
    }
    load();
  }, [stockId]);

  // 지표 계산 — 항상 호출되도록 early return 이전에 배치
  const chartData = useMemo(() => {
    if (prices.length === 0) return [];
    const closes = prices.map(p => (p.close ?? null));
    const ma5 = sma(closes, 5);
    const ma20 = sma(closes, 20);
    const ma60 = sma(closes, 60);
    const ma120 = sma(closes, 120);
    const { upper, lower } = bollinger(closes, 20, 2);
    const rsiArr = rsi(closes, 14);

    return prices.map((p, i) => ({
      date: p.trade_date,
      close: p.close,
      volume: p.volume,
      ma5: ma5[i],
      ma20: ma20[i],
      ma60: ma60[i],
      ma120: ma120[i],
      bbUpper: upper[i],
      bbLower: lower[i],
      rsi: rsiArr[i],
    }));
  }, [prices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (prices.length < 20) {
    return (
      <div className="space-y-6">
        <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
          <LineChartIcon className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            기술적 분석 — 데이터 부족
          </h3>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            해당 종목은 아직 일봉 시계열이 부족합니다. 시총 TOP 200 + 테마 관심종목 우선 커버 중이며 확장 예정입니다.
          </p>
        </div>
        <DisclaimerBanner />
      </div>
    );
  }

  const latest = chartData[chartData.length - 1];

  const metrics = [
    { label: '종가', value: latest.close, digits: 0, suffix: '원' },
    { label: 'MA 20', value: latest.ma20, digits: 0, suffix: '원' },
    { label: 'MA 60', value: latest.ma60, digits: 0, suffix: '원' },
    { label: 'RSI(14)', value: latest.rsi, digits: 1, suffix: '' },
    { label: 'BB 상단', value: latest.bbUpper, digits: 0, suffix: '원' },
  ];

  return (
    <div className="space-y-6">
      {/* 핵심 기술 지표 요약 */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          핵심 기술 지표 (최근 거래일 기준)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-dark-700 rounded-lg p-4 border border-border">
              <p className="text-xs text-text-secondary mb-1">{m.label}</p>
              <p className="text-2xl font-bold font-mono-price mt-1 text-text-primary">
                {formatNum(m.value, m.digits, m.suffix)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-secondary/70 mt-2">
          기준일: {latest.date} · 일봉 {chartData.length}개
        </p>
      </div>

      {/* 이동평균선 + 볼린저밴드 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          이동평균선 & 볼린저밴드 (단위: 원)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={50} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Legend />
              <Line type="monotone" dataKey="close" name="종가" stroke="#FFFFFF" strokeWidth={1.8} dot={false} />
              <Line type="monotone" dataKey="ma5" name="MA 5" stroke="#F59E0B" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="ma20" name="MA 20" stroke="#0ABAB5" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="ma60" name="MA 60" stroke="#EF4444" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="ma120" name="MA 120" stroke="#8B5CF6" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="bbUpper" name="BB 상단" stroke="#6B7280" strokeDasharray="3 3" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="bbLower" name="BB 하단" stroke="#6B7280" strokeDasharray="3 3" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RSI */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          RSI (14일)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={50} />
              <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="rsi" name="RSI" stroke="#0ABAB5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          70 이상 = 과매수(매도 압력), 30 이하 = 과매도(매수 압력). 참고 지표이며 매매 조언 아님.
        </p>
      </div>

      {/* 거래량 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          거래량 추이
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={50} />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={v => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${(v / 1_000).toFixed(0)}K`)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value: number) => value.toLocaleString('ko-KR')}
              />
              <Bar dataKey="volume" name="거래량" fill="#0ABAB5" opacity={0.7} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
```

---

## Part D — 빌드 검증

```bash
cd ~/Desktop/OTMarketing

# 1. 타입 체크
npx tsc --noEmit

# 2. ESLint
npx next lint --dir components/analysis

# 3. 프로덕션 빌드
npm run build
```

**허용 가능한 경고**: `stock_prices` 관련 경고 없어야 함. 기존 경고는 무시.

**실패 조건**:
- `types/stock.ts` StockPrice 누락 → 타입 에러
- `ComposedChart`·`Bar` import 누락 → 런타임 에러 가능성
- `react-hooks/rules-of-hooks` 에러 (useMemo 위치 문제) — 이미 위에 배치했으므로 OK

---

## Part E — 로컬 브라우저 검증

```bash
npm run dev
```

- http://localhost:3000/stocks/005930/analysis 접속
- **기술 분석** 탭 클릭
- 확인사항:
  1. 핵심 지표 5개 카드 (종가 / MA 20 / MA 60 / RSI / BB 상단) 숫자 표시
  2. 이동평균선 + 볼린저밴드 차트 — 종가(흰색) · MA 5/20/60/120 · BB 상하단 점선 표시
  3. RSI 차트 — 0~100 범위, 70/30 기준선
  4. 거래량 바차트
- 삼성전자(005930) 외 커버되지 않은 종목 접속 시 "데이터 부족" 카드 표시 확인 (예: 임의 소형주)

---

## Part F — 문서 업데이트 + 커밋

### F-1. 4개 문서 헤더 날짜 오늘로 업데이트
`CLAUDE.md`, `docs/CHANGELOG.md`, `session-context.md`, `docs/NEXT_SESSION_START.md` 첫 줄 날짜를 **오늘 (2026-04-22)** 로 갱신.

### F-2. CHANGELOG.md 추가 블록 (최상단에)

```markdown
## 2026-04-22 — STEP 42: TechnicalAnalysis 재활성화 (stock_prices 시딩 + MA·볼린저·RSI)
- **Data**: `scripts/seed-stock-prices.py` 실행 → stock_prices 테이블에 시총 TOP 200 + 관심종목 1년 일봉 시딩 (~48,000행)
- **Types**: `types/stock.ts` 에 `StockPrice` 인터페이스 추가
- **Component**: `components/analysis/TechnicalAnalysis.tsx` 스텁(32줄) → 실제 기술 지표 컴포넌트(~280줄) 재작성
  - SMA (5 · 20 · 60 · 120일)
  - 볼린저밴드 (20일 ± 2σ)
  - RSI (Wilder's 14일)
  - 거래량 바차트
  - 일봉 20개 미만 종목은 "데이터 부족" 카드 표시
- 다음 STEP 43 → KIS per-stock investor-flow (FHKST01010900) 수집 파이프라인 → SupplyAnalysis 재활성화
```

### F-3. session-context.md 에 이번 세션 블록 추가
STEP 42 완료, stock_prices 행수, 커버 종목 수 기록.

### F-4. NEXT_SESSION_START.md 업데이트
- 현재까지 누계: stocks 2,780 / financials 576+ / **stock_prices ~48,000**
- 다음 할 일: STEP 43 (SupplyAnalysis — KIS investor-flow 수집)

### F-5. 커밋 + 푸시
```bash
git add components/analysis/TechnicalAnalysis.tsx types/stock.ts CLAUDE.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md docs/STEP_42_COMMAND.md session-context.md
git commit -m "STEP 42: TechnicalAnalysis 재활성화 — stock_prices 시딩 + MA·볼린저·RSI"
git push origin main
```

---

## 완료 보고 형식 (사용자에게 붙여넣기)

```
STEP 42 완료. push까지 끝났습니다.

변경 요약:
- stock_prices: 0 → ~48,000행 (250종목 × 1년)
- TechnicalAnalysis.tsx: 32줄 스텁 → ~280줄 실제 지표 컴포넌트
- 지표: MA 5/20/60/120, 볼린저밴드, RSI(14), 거래량
- 005930 삼성전자 /analysis 기술 분석 탭 live

다음 로드맵:
- STEP 43: KIS per-stock investor-flow → SupplyAnalysis
- STEP 44: DART 배당 공시 → DividendAnalysis
- STEP 45+: 전종목 팩터 집계 → QuantAnalysis
```

---

## STEP 43 예고
**SupplyAnalysis 재활성화 — KIS per-stock investor-flow 수집**
1. KIS OpenAPI FHKST01010900 (종목별 투자자별 매매동향) 클라이언트 작성
2. 시총 TOP 50 + 테마 50 대상 최근 60영업일 수집 스크립트 `scripts/seed-supply-demand.py` 신규 작성
3. SupplyAnalysis.tsx 재작성 — 외국인/기관/개인 일별 순매수 스택 바차트 + 누적 순매수 라인
