<!-- 2026-06-20 -->
# STEP 323 — [신규] 게이트웨이 첫 탭 "종목·상품" (멀티컬럼 정렬표 + 차트·증권사 미리보기)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_323_COMMAND.md 파일 내용대로 실행해줘
```

- **전제**: 로그인·푸터·너비 통일까지 끝난 현재 HEAD.

---

## 🎯 목표 (1차 버전 — 보고 피드백)
게이트웨이 **첫 탭 "종목·상품"** 신설 (뉴스 앞, 기본 탭). 옛 코드 재활용:
- 하위탭 **주식·ETF·ETN·리츠**
- **한 줄에 다**: `종목명 · 현재가 · 1일 · 1주일 · 1개월 · 3개월 · 6개월 · 1년` — **컬럼 헤더 클릭 → 그 기간 수익률 순 정렬**(▼▲)
- 우측 **리딩방과 동일 크기 미리보기**(`w-72 sticky`): 행 클릭 → **미니 차트** + 그 밑 **증권사 바로가기**
- "지연 시세(참고용)" 표기 — 예측·추천 0 (안전 구역)

> 데이터: 주식=`/api/krx/ranking`+`/api/yahoo/kr-performance` 병합 / ETF·ETN·리츠=각 performance API / 차트=`/api/yahoo/chart`. 전부 기존 라우트.
> 변경: **신규 1파일**(`MarketBoard.tsx`) + `ToolboxClient.tsx` 4곳.

---

## 📄 파일 1 (신규) — `components/toolbox/MarketBoard.tsx`

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { StockLogo } from '@/components/ui/StockLogo';
import { BROKERS } from '@/lib/brokers';

type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
};

type SubTab = 'stock' | 'etf' | 'etn' | 'reit';
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '주식' },
  { key: 'etf', label: 'ETF' },
  { key: 'etn', label: 'ETN' },
  { key: 'reit', label: '리츠' },
];

type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1d', label: '1일', field: 'changePercent' },
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m' },
  { key: '3m', label: '3개월', field: 'r3m' },
  { key: '6m', label: '6개월', field: 'r6m' },
  { key: '1y', label: '1년', field: 'r1y' },
];

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-[#F04452]' : 'text-[#3182F6]';
}

// ── 미니 캔들차트 (HomeStockDetail의 CandleChart 축약) ──
type Candle = { time: string; open: number; high: number; low: number; close: number; volume: number };
function MiniChart({ candles }: { candles: Candle[] }) {
  const data = candles.filter((c) => c.close > 0).slice(-120);
  if (data.length < 2) {
    return <div className="flex h-28 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
  const w = 248, priceH = 96, gap = 2, volH = 28, h = priceH + gap + volH, pad = 4;
  const max = Math.max(...data.map((c) => c.high));
  const min = Math.min(...data.map((c) => c.low));
  const range = max - min || 1;
  const maxVol = Math.max(...data.map((c) => c.volume), 1);
  const cw = w / data.length;
  const py = (v: number) => pad + (priceH - 2 * pad) * (1 - (v - min) / range);
  const volBase = priceH + gap + volH;
  const bw = Math.max(1, Math.min(cw * 0.6, 5));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" aria-hidden="true">
      {data.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.close >= c.open;
        const color = up ? '#F04452' : '#3182F6';
        const top = py(Math.max(c.open, c.close));
        const bot = py(Math.min(c.open, c.close));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={py(c.high)} y2={py(c.low)} stroke={color} strokeWidth={0.8} />
            <rect x={x - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} fill={color} />
          </g>
        );
      })}
      {data.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.close >= c.open;
        const vh = (c.volume / maxVol) * volH;
        return <rect key={`v${i}`} x={x - bw / 2} y={volBase - vh} width={bw} height={Math.max(0.5, vh)} fill={up ? '#F04452' : '#3182F6'} opacity={0.5} />;
      })}
    </svg>
  );
}

async function fetchRows(tab: SubTab): Promise<Row[]> {
  if (tab === 'stock') {
    let raw: Record<string, unknown>[] = [];
    try {
      const j = await (await fetch('/api/krx/ranking?market=all&sort=amount&limit=100')).json();
      raw = (j.stocks ?? []) as Record<string, unknown>[];
    } catch { raw = []; }
    if (raw.length === 0) {
      try {
        const j = await (await fetch('/api/kis/volume-rank?market=all&sort=amount&limit=100')).json();
        raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
      } catch { raw = []; }
    }
    const rows: Row[] = raw.map((s) => ({
      symbol: String(s.symbol ?? ''),
      name: String(s.name ?? ''),
      price: Number(s.price ?? 0),
      changePercent: Number(s.changePercent ?? 0),
    }));
    try {
      const j = await (await fetch('/api/yahoo/kr-performance')).json();
      const map: Record<string, Row> = {};
      for (const it of (j.items ?? []) as Row[]) if (it.symbol) map[String(it.symbol)] = it;
      return rows.map((r) => {
        const p = map[r.symbol];
        return p ? { ...r, r1w: p.r1w, r1m: p.r1m, r3m: p.r3m, r6m: p.r6m, r1y: p.r1y } : r;
      });
    } catch { return rows; }
  }
  const api = tab === 'etf' ? '/api/krx/etf-performance' : tab === 'etn' ? '/api/krx/etn-performance' : '/api/yahoo/reit-performance';
  try {
    const j = await (await fetch(api)).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y,
    }));
  } catch { return []; }
}

export default function MarketBoard() {
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<PeriodKey>('1d');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [selected, setSelected] = useState<Row | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelected(null);
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);

  useEffect(() => {
    if (!selected) { setCandles([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const j = await (await fetch(`/api/yahoo/chart?symbol=${encodeURIComponent(selected.symbol)}&interval=1d`)).json();
        if (!cancelled) setCandles((j.candles ?? []) as Candle[]);
      } catch { if (!cancelled) setCandles([]); }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [selected?.symbol]);

  const sortField = PERIODS.find((p) => p.key === sortKey)!.field;
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortField] as number | null | undefined;
      const bv = b[sortField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    }).slice(0, 100);
  }, [rows, sortField, sortDir]);

  function clickHeader(k: PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  return (
    <section className="min-w-0">
      <div className="mb-3 border-b border-unjong-border pb-2">
        <h2 className="text-lg font-bold text-unjong-primary">종목·상품</h2>
        <p className="mt-0.5 text-xs text-unjong-muted">기간별 수익률 · 지연 시세(참고용) · 기간 컬럼을 누르면 그 기준 순으로 정렬</p>
      </div>

      <div className="mb-2 flex gap-1 overflow-x-auto">
        {SUBTABS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setTab(s.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${tab === s.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          {loading ? (
            <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>
          ) : sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">데이터가 없습니다. 잠시 후 다시 시도해 주세요.</p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="px-2 py-2.5 text-left font-medium">#</th>
                  <th className="px-3 py-2.5 text-left font-medium">종목명</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">현재가</th>
                  {PERIODS.map((p) => (
                    <th key={p.key} className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => clickHeader(p.key)}
                        className={`inline-flex items-center gap-0.5 hover:text-unjong-primary ${sortKey === p.key ? 'font-bold text-unjong-accent' : ''}`}
                      >
                        {p.label}{sortKey === p.key ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const isSel = selected?.symbol === r.symbol;
                  return (
                    <tr
                      key={r.symbol}
                      onClick={() => setSelected(r)}
                      className={`cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background ${isSel ? 'bg-unjong-background' : ''}`}
                    >
                      <td className="px-2 py-2.5 tabular-nums text-unjong-muted">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5 whitespace-nowrap">
                          <StockLogo code={r.symbol} name={r.name} size={24} />
                          <span className="font-medium text-unjong-primary">{r.name}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary">{r.price ? r.price.toLocaleString() : '—'}</td>
                      {PERIODS.map((p) => {
                        const v = r[p.field] as number | null | undefined;
                        return <td key={p.key} className={`whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 미리보기 — 리딩방과 동일 크기·위치 */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-11 rounded-xl border border-unjong-border bg-unjong-surface p-4">
            {!selected ? (
              <p className="py-12 text-center text-xs leading-relaxed text-unjong-muted">종목을 선택하면<br />차트와 증권사 바로가기가 표시됩니다.</p>
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <StockLogo code={selected.symbol} name={selected.name} size={28} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-unjong-primary">{selected.name}</p>
                    <p className={`text-xs font-semibold tabular-nums ${pctColor(selected.changePercent)}`}>
                      {selected.price ? selected.price.toLocaleString() : '—'} <span className="ml-0.5">({pct(selected.changePercent)})</span>
                    </p>
                  </div>
                </div>
                <div className="mb-1 rounded-lg border border-unjong-border bg-unjong-background p-2">
                  <MiniChart candles={candles} />
                </div>
                <p className="mb-3 text-[10px] text-unjong-muted">일봉 · 지연 시세(참고용)</p>
                <p className="mb-1.5 text-xs font-semibold text-unjong-muted">증권사 바로가기</p>
                <ul className="space-y-0.5">
                  {BROKERS.slice(0, 8).map((b) => (
                    <li key={b.rank}>
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-unjong-background"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`} alt="" width={16} height={16} className="h-4 w-4 shrink-0 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                        <span className="flex-1 truncate text-xs text-unjong-primary group-hover:text-unjong-accent">{b.name}</span>
                        <ExternalLink size={11} className="shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">운종은 거래를 중개하지 않습니다. 거래는 증권사에서 진행됩니다.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
```

---

## 📄 파일 2 (수정 4곳) — `components/toolbox/ToolboxClient.tsx`

### 1 — import 추가
**찾기:**
```tsx
import AdvisorDirectory from './AdvisorDirectory';
```
**바꾸기:**
```tsx
import AdvisorDirectory from './AdvisorDirectory';
import MarketBoard from './MarketBoard';
```

### 2 — TAB_ORDER 맨 앞에 'market'
**찾기:**
```tsx
const TAB_ORDER = ['news', 'broker', 'youtube', 'chart', 'analysis', 'research', 'disclosure', 'etf', 'ipo', 'macro', 'exchange', 'community', 'room'];
```
**바꾸기:**
```tsx
const TAB_ORDER = ['market', 'news', 'broker', 'youtube', 'chart', 'analysis', 'research', 'disclosure', 'etf', 'ipo', 'macro', 'exchange', 'community', 'room'];
```

### 3 — SPECIAL_LABELS에 market 추가
**찾기:**
```tsx
const SPECIAL_LABELS: Record<string, string> = { youtube: '유튜브', broker: '증권사', room: '리딩방·검증' };
```
**바꾸기:**
```tsx
const SPECIAL_LABELS: Record<string, string> = { market: '종목·상품', youtube: '유튜브', broker: '증권사', room: '리딩방·검증' };
```

### 4 — 디스패처 맨 앞에 market 분기
**찾기:**
```tsx
        {activeTab === 'youtube' ? (
```
**바꾸기:**
```tsx
        {activeTab === 'market' ? (
          country === 'KR' ? (
            <MarketBoard />
          ) : (
            <Placeholder emoji="🇺🇸" title="미국 종목·상품 — 준비 중" />
          )
        ) : activeTab === 'youtube' ? (
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`):
1. 홈 첫 탭이 **"종목·상품"**(기본 선택). 하위탭 주식·ETF·ETN·리츠.
2. 표가 **한 줄에 현재가+1일~1년** 다 나옴. **기간 헤더 클릭 → 그 기준 정렬**(▼▲ 표시), 다시 누르면 오름/내림 토글.
3. 행 클릭 → 우측 **미리보기에 미니 차트 + 증권사 바로가기** (리딩방과 같은 위치·크기).
4. ETF/ETN/리츠는 1일~1년 다 채워짐. **주식은 1일은 전부, 장기수익률은 대표 종목만**(나머지 "—") — 이건 v1 데이터 한계(`kr-performance`가 대표 종목만 커버). 보고 더 확장할지 정하면 됨.
5. 모바일: 표는 가로 스크롤, 미리보기는 데스크탑(lg)만 — 모바일 미리보기 시트는 후속.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/MarketBoard.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(market): 게이트웨이 첫 탭 '종목·상품' — 멀티컬럼 수익률 정렬표 + 차트·증권사 미리보기 (STEP 323)" && git push
```

---

> **한 줄 요약**: 게이트웨이 첫 탭 '종목·상품' 신설(주식·ETF·ETN·리츠), 한 줄에 1일~1년 수익률+헤더 정렬, 리딩방 크기 미리보기에 미니차트+증권사 바로가기. 옛 API·차트·brokers 재활용.
