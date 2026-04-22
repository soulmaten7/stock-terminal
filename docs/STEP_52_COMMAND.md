# STEP 52 — Chart 페이지 리팩토링 (P0 Phase A)

**실행 명령어**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태**
- 직전 커밋: `c961765` (STEP 51 Watchlist Phase A)
- 빌드 통과 상태
- `/chart` 페이지는 현재 `WidgetDetailStub` 더미 테이블만 표시 중

**목표**
1. `/chart` 스텁을 실제 풀스크린 차트 페이지로 교체
2. URL 파라미터 `?symbol=` 지원 (기본 005930)
3. 기간 토글 (일/주/월) 추가 (KRX)
4. OHLCV 테이블 30행 실데이터 (KRX)
5. `ChartWidget` href를 현재 티커 포함하도록 동적화

**참고 문서**: `docs/WIDGET_SPEC_Chart.md` (Phase A 스펙)

---

## Part A — `ChartPageClient` 신설

### A-1. 새 파일 생성: `components/chart/ChartPageClient.tsx`

디렉토리가 없으면 먼저 생성:
```bash
mkdir -p components/chart
```

파일 전체 내용 (**복붙**):

```tsx
'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';

declare global {
  interface Window {
    TradingView?: { widget: new (o: Record<string, unknown>) => unknown };
  }
}

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Period = 'D' | 'W' | 'M';

function normalizeSymbol(input: string): { raw: string; isKrx: boolean } {
  const t = input.trim().toUpperCase();
  if (/^\d{6}$/.test(t)) return { raw: t, isKrx: true };
  if (t.includes(':')) return { raw: t, isKrx: false };
  return { raw: `NASDAQ:${t}`, isKrx: false };
}

const fmtN = (n: number) => n.toLocaleString('ko-KR');

export default function ChartPageClient() {
  const sp = useSearchParams();
  const symbolParam = sp.get('symbol') || '005930';

  const [ticker, setTicker] = useState(symbolParam);
  const [input, setInput] = useState(symbolParam);
  const [period, setPeriod] = useState<Period>('D');
  const { raw, isKrx } = normalizeSymbol(ticker);

  const krxContainerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tvContainerRef = useRef<HTMLDivElement>(null);

  // URL 파라미터 변경 시 티커 동기화
  useEffect(() => {
    setTicker(symbolParam);
    setInput(symbolParam);
  }, [symbolParam]);

  // ── KRX: KIS API fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isKrx) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/kis/chart?symbol=${raw}&period=${period}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || 'fetch failed');
        setCandles(data.candles || []);
        setName(data.name || '');
      } catch (e) {
        if (!cancelled) setErr(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [raw, isKrx, period]);

  // ── KRX: lightweight-charts 렌더 ──────────────────────────────────────────
  useEffect(() => {
    if (!isKrx || !krxContainerRef.current || candles.length === 0) return;
    const el = krxContainerRef.current;
    el.innerHTML = '';

    const chart: IChartApi = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#333',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#F0F0F0' },
        horzLines: { color: '#F0F0F0' },
      },
      rightPriceScale: { borderColor: '#E5E7EB' },
      timeScale: { borderColor: '#E5E7EB', timeVisible: false },
      crosshair: { mode: 1 },
      autoSize: true,
    });

    const candleSeries: ISeriesApi<'Candlestick'> = chart.addCandlestickSeries({
      upColor: '#FF3B30',
      downColor: '#0064FF',
      borderVisible: false,
      wickUpColor: '#FF3B30',
      wickDownColor: '#0064FF',
    });
    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    const volumeSeries: ISeriesApi<'Histogram'> = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: '#D1D5DB',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? '#FFD1CF' : '#C7D7FF',
      })),
    );

    chart.timeScale().fitContent();
    return () => { chart.remove(); };
  }, [candles, isKrx]);

  // ── 해외: TradingView tv.js ───────────────────────────────────────────────
  useEffect(() => {
    if (isKrx || !tvContainerRef.current) return;
    const el = tvContainerRef.current;
    el.innerHTML = '';
    const host = document.createElement('div');
    host.id = `tv-${Date.now()}`;
    host.style.width = '100%';
    host.style.height = '100%';
    el.appendChild(host);

    const render = () => {
      if (!window.TradingView) return;
      new window.TradingView.widget({
        container_id: host.id,
        symbol: raw,
        interval: 'D',
        theme: 'light',
        locale: 'kr',
        timezone: 'Asia/Seoul',
        autosize: true,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        allow_symbol_change: true,
        style: '1',
        withdateranges: true,
        save_image: false,
      });
    };

    if (window.TradingView) {
      render();
    } else {
      const ex = document.querySelector<HTMLScriptElement>('script[data-tv-loader="1"]');
      if (ex) {
        ex.addEventListener('load', render, { once: true });
      } else {
        const s = document.createElement('script');
        s.src = 'https://s3.tradingview.com/tv.js';
        s.async = true;
        s.dataset.tvLoader = '1';
        s.onload = render;
        document.head.appendChild(s);
      }
    }
  }, [raw, isKrx]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (v) setTicker(v.toUpperCase());
  };

  const tableRows = [...candles].reverse().slice(0, 30);

  return (
    <div className="w-full px-6 py-6 max-w-screen-2xl mx-auto">
      {/* 상단 헤더 */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black">차트</h1>
          <p className="text-sm text-[#666] mt-0.5">
            {isKrx ? (name ? `${raw} · ${name}` : raw) : raw}
            {isKrx ? ' · KIS OpenAPI' : ' · TradingView'}
          </p>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="mb-3 flex flex-wrap items-center gap-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            className="w-48 text-sm bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"
            placeholder="005930 · AAPL · NASDAQ:TSLA"
            maxLength={32}
          />
          <button
            type="submit"
            className="text-sm font-medium text-white bg-[#0ABAB5] hover:bg-[#089B97] rounded px-3 py-1.5"
          >
            이동
          </button>
        </form>

        {isKrx && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-[#666] mr-1">기간</span>
            {(['D', 'W', 'M'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs font-medium px-2.5 py-1 rounded ${
                  period === p
                    ? 'bg-[#0ABAB5] text-white'
                    : 'bg-white border border-[#E5E7EB] text-[#666] hover:text-black'
                }`}
              >
                {p === 'D' ? '일' : p === 'W' ? '주' : '월'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 차트 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="relative" style={{ height: 600 }}>
          {isKrx ? (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[#888] bg-white/50 z-10">
                  차트 로딩 중…
                </div>
              )}
              {err && !loading && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[#C33] bg-white/90 z-10 p-4 text-center">
                  차트 로드 실패: {err}
                </div>
              )}
              <div ref={krxContainerRef} className="w-full h-full" />
            </>
          ) : (
            <div ref={tvContainerRef} className="w-full h-full" />
          )}
        </div>
      </div>

      {/* OHLCV 테이블 (KRX 전용) */}
      {isKrx && tableRows.length > 0 && (
        <div className="mt-4 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#F0F0F0] flex items-center justify-between">
            <span className="text-sm font-bold text-black">
              최근 {tableRows.length}개 {period === 'D' ? '일봉' : period === 'W' ? '주봉' : '월봉'}
            </span>
            <span className="text-xs text-[#999]">KIS OpenAPI</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                  <th className="px-4 py-2 text-left font-bold text-[#666]">날짜</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">시가</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">고가</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">저가</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">종가</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">전일비</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">등락률</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">거래량</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((c, i) => {
                  const prev = tableRows[i + 1];
                  const change = prev ? c.close - prev.close : 0;
                  const changePct = prev ? (change / prev.close) * 100 : 0;
                  const up = change >= 0;
                  const colorCls = up ? 'text-[#FF3B30]' : 'text-[#0051CC]';
                  return (
                    <tr key={c.time} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                      <td className="px-4 py-1.5 text-[#333]">{c.time}</td>
                      <td className="px-4 py-1.5 text-right text-[#333]">{fmtN(c.open)}</td>
                      <td className="px-4 py-1.5 text-right text-[#333]">{fmtN(c.high)}</td>
                      <td className="px-4 py-1.5 text-right text-[#333]">{fmtN(c.low)}</td>
                      <td className={`px-4 py-1.5 text-right font-medium ${colorCls}`}>
                        {fmtN(c.close)}
                      </td>
                      <td className={`px-4 py-1.5 text-right ${colorCls}`}>
                        {prev ? `${up ? '+' : ''}${fmtN(change)}` : '—'}
                      </td>
                      <td className={`px-4 py-1.5 text-right ${colorCls}`}>
                        {prev ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-4 py-1.5 text-right text-[#666]">{fmtN(c.volume)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
```

### A-2. `app/chart/page.tsx` 전체 교체

기존 내용 전체 삭제 후 아래로 **완전 교체**:

```tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import ChartPageClient from '@/components/chart/ChartPageClient';

export const metadata: Metadata = { title: '차트 — StockTerminal' };

export default function ChartPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] bg-white">
          <div className="animate-spin w-8 h-8 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
        </div>
      }
    >
      <ChartPageClient />
    </Suspense>
  );
}
```

---

## Part B — `ChartWidget` href 동적화

### B-1. `components/widgets/ChartWidget.tsx` 수정

**Before** (line 186):
```tsx
      className="h-full"
      href="/chart"
      action={
```

**After**:
```tsx
      className="h-full"
      href={`/chart?symbol=${encodeURIComponent(raw)}`}
      action={
```

`raw` 변수는 line 38에서 이미 `normalizeSymbol(ticker).raw`로 선언되어 있어 그대로 사용 가능.

---

## Part C — 빌드 검증

```bash
npm run build
```

에러 없이 완료되어야 진행. 경고는 무시해도 됨.

---

## Part D — 사용자 수동 검증

브라우저에서 확인:

1. **홈 위젯** (`http://localhost:3000/`)
   - [ ] 차트 위젯 우상단 ↗ 클릭 → `/chart?symbol=005930` 이동
   - [ ] 위젯에서 "AAPL" 입력 후 이동 → 다시 ↗ 클릭 → `/chart?symbol=NASDAQ%3AAAPL`

2. **차트 페이지** (`http://localhost:3000/chart?symbol=005930`)
   - [ ] 풀스크린 캔들차트 표시 (600px 높이)
   - [ ] 거래량 바 하단 표시
   - [ ] 상승 빨강 / 하락 파랑
   - [ ] 기간 토글(일/주/월) 전환 시 차트 재렌더
   - [ ] OHLCV 테이블 30행 표시, 신순 정렬
   - [ ] 홈으로 링크 동작

3. **해외 종목** (`http://localhost:3000/chart?symbol=AAPL` 또는 `NASDAQ:AAPL`)
   - [ ] TradingView 위젯 임베드 로드
   - [ ] 기간 토글 버튼 안 보임(KRX 전용)
   - [ ] OHLCV 테이블 안 보임(KRX 전용)

4. **심볼 변경**
   - [ ] 인풋에 `000660` 입력 후 이동 → 차트 새로고침, URL은 변경 안 됨(내부 상태)
   - [ ] URL을 직접 `/chart?symbol=000660`로 바꾸고 F5 → SK하이닉스 차트 표시

문제 없으면 Part E로.

---

## Part E — 4개 문서 업데이트

### E-1. `CLAUDE.md` 첫 줄 날짜만 갱신 (본문 변경 없음)

파일 최상단 `# Stock Terminal — Claude Code 지침서` 바로 다음에 날짜가 있다면 오늘(`2026-04-22`)로.

### E-2. `docs/CHANGELOG.md` 상단에 블록 추가

```markdown
### 2026-04-22 세션 — STEP 52 완료
- [x] `/chart` 스텁 → 풀스크린 차트 페이지로 교체
- [x] `ChartPageClient.tsx` 신설 (URL 파라미터, 기간 토글, OHLCV 테이블)
- [x] ChartWidget href를 `/chart?symbol={raw}` 동적화
- [x] `docs/WIDGET_SPEC_Chart.md` 작성 (Phase A/B/C)
```

### E-3. `session-context.md` 상단 이력 블록 추가

```markdown
### 2026-04-22 세션 — STEP 52 완료
- [x] /chart 풀스크린 차트 페이지 (lightweight-charts + TradingView)
- [x] 기간 토글 D/W/M + OHLCV 30행 테이블 (KRX)
- [x] ChartWidget href 동적화 (?symbol=)
```

### E-4. `docs/NEXT_SESSION_START.md` 갱신

"현재 상태" 섹션 날짜를 오늘로, "다음 할 일 P0" 항목에서 **STEP 52 체크**하고 다음 후보 추가:
```markdown
- [ ] STEP 53: OrderBookWidget 리팩토링 (P0) — 키움 영웅문 호가창 스타일
- [ ] STEP 54: DartFilingsWidget 리팩토링 (P0) — DART 공시유형 뱃지
```

---

## Part F — Git commit + push

```bash
git add app/chart/page.tsx components/chart/ChartPageClient.tsx components/widgets/ChartWidget.tsx docs/CHANGELOG.md docs/NEXT_SESSION_START.md docs/WIDGET_SPEC_Chart.md docs/STEP_52_COMMAND.md session-context.md CLAUDE.md && git commit -m "$(cat <<'EOF'
feat(chart): STEP 52 Phase A — /chart 풀스크린 페이지 + 기간 토글 + OHLCV 테이블

- app/chart/page.tsx: WidgetDetailStub 스텁 제거, Suspense 래퍼로 교체
- components/chart/ChartPageClient.tsx: 신설
  - URL 파라미터 ?symbol= 지원 (기본 005930)
  - KRX: lightweight-charts 캔들+거래량 (600px)
  - 해외: TradingView tv.js 임베드 (side toolbar/symbol change 활성화)
  - 기간 토글 D/W/M (KRX 전용)
  - OHLCV 테이블 30행 (KRX 전용, 신순, 빨강/파랑 색상)
- components/widgets/ChartWidget.tsx: href 동적화
  - "/chart" → /chart?symbol={encodeURIComponent(raw)}
- docs/WIDGET_SPEC_Chart.md: TradingView/Koyfin/네이버증권 벤치마크 + Phase A/B/C

Phase B(분봉/지표) · Phase C(저장 레이아웃/멀티차트) 유보
EOF
)" && git push origin main
```

---

## Part G — Git log 확인

```bash
git log --oneline -5
```

최신 커밋이 위 메시지로 표시되는지 확인.

---

## 완료 후

다음 후보: **STEP 53 — OrderBookWidget 리팩토링 (P0)**
- 레퍼런스: 키움 영웅문 호가창
- 현재 상태는 Cowork에게 파일 읽기 요청하여 Phase A 스펙 작성 예정.
