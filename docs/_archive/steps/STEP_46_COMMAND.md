<!-- 2026-04-22 -->
# STEP 46 — 스크리너 팩터 업그레이드

## 실행 정보

**모델**: Sonnet
**이전 커밋**: 8b867d2 (STEP 45: QuantAnalysis 재활성화 — 전종목 팩터 집계, 5개 분석 탭 전원 live)
**예상 소요**: 30-40분
**중간 수동 단계**: Part A migration은 Supabase SQL Editor에서 수동 실행 필요

```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

## 목표

STEP 45 까지 쌓은 자산(quant_factors 200행 + dividends 790행 + financials 576행)을 **스크리너에 노출**.
현재 스크리너는 시장+키워드+시총만 필터 가능 — 본문에 `재무/가격 필터는 다음 업데이트에서 추가` 라고 명시된 stub 상태.
이번 스텝에서 팩터 기반 프리셋 5종 + 필터 + 정렬 컬럼을 추가한다.

## 변경 범위

1. **Migration 013**: `stock_snapshot_v` view — stocks + 최신 quant_factors + 최신 dividends LEFT JOIN
2. **API**: `app/api/stocks/screener/route.ts` 전면 재작성 — 팩터 필터 + 정렬
3. **UI**: `components/screener/ScreenerClient.tsx` 전면 재작성 — 프리셋 8종 + 필터 5종 + 컬럼 3종 추가
4. **build + commit + push**

## 예상 결과

- commit 메시지: `STEP 46: 스크리너 팩터 업그레이드 — API JOIN + 프리셋 8종 + 정렬 컬럼`
- 변경 파일: 3-4개
- 스크리너 페이지에서:
  - 🔥 퀀트 TOP 100 / 💎 저PER+고ROE / 📈 모멘텀 / 💰 배당 / 🛡️ Quality 프리셋
  - PER / ROE / 퀀트종합 컬럼 + 클릭 정렬

---

## Part A — Migration 013 (view 생성)

### A-1. 마이그레이션 파일 작성

`supabase/migrations/013_stock_snapshot_view.sql` 신규 생성:

```sql
-- STEP 46: 스크리너용 스냅샷 뷰
-- stocks + 최신 quant_factors + 최신 dividends LEFT JOIN

CREATE OR REPLACE VIEW stock_snapshot_v
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.symbol,
  s.name_ko,
  s.market,
  s.country,
  s.market_cap,
  s.sector,
  s.industry,
  s.is_active,
  -- 퀀트 팩터 (최신 snapshot_date)
  qf.per,
  qf.pbr,
  qf.roe,
  qf.operating_margin,
  qf.return_3m,
  qf.return_6m,
  qf.return_12m,
  qf.value_pct,
  qf.momentum_pct,
  qf.quality_pct,
  qf.composite_pct,
  qf.snapshot_date AS qf_snapshot_date,
  -- 배당 (최신 fiscal_year)
  d.dividend_yield,
  d.payout_ratio,
  d.dividend_per_share,
  d.fiscal_year AS div_fiscal_year
FROM stocks s
LEFT JOIN LATERAL (
  SELECT per, pbr, roe, operating_margin,
         return_3m, return_6m, return_12m,
         value_pct, momentum_pct, quality_pct, composite_pct,
         snapshot_date
  FROM quant_factors
  WHERE stock_id = s.id
  ORDER BY snapshot_date DESC
  LIMIT 1
) qf ON TRUE
LEFT JOIN LATERAL (
  SELECT dividend_yield, payout_ratio, dividend_per_share, fiscal_year
  FROM dividends
  WHERE stock_id = s.id
  ORDER BY fiscal_year DESC
  LIMIT 1
) d ON TRUE;

COMMENT ON VIEW stock_snapshot_v IS 'STEP 46: 스크리너용 최신 퀀트+배당 집계 뷰.';
```

### A-2. Supabase에 적용

STEP 45 때 스키마 캐시 이슈 경험 감안해서, 이번엔 `psycopg2` 로 직접 실행한다.

```bash
# .env.local 에 DATABASE_URL 없으면 멈추고 사용자에게 알림 (STEP 45 검증 완료 — 있어야 함)
python3 <<'EOF'
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.getenv('DATABASE_URL') or os.getenv('SUPABASE_DB_URL') or os.getenv('POSTGRES_URL') or os.getenv('DIRECT_URL')
if not url:
    raise SystemExit("ERROR: .env.local 에 DATABASE_URL 없음")

conn = psycopg2.connect(url)
conn.autocommit = True
cur = conn.cursor()

with open('supabase/migrations/013_stock_snapshot_view.sql') as f:
    cur.execute(f.read())

print("OK: view created")

# 스키마 캐시 리로드
cur.execute("NOTIFY pgrst, 'reload schema';")
print("OK: schema reload signaled")

cur.close()
conn.close()
EOF

# 5초 대기 후 view 검증
sleep 5
python3 -c "
import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv('.env.local')
sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
r = sb.table('stock_snapshot_v').select('symbol, name_ko, per, roe, composite_pct').not_.is_('composite_pct', 'null').order('composite_pct', desc=True).limit(5).execute()
print('Quant TOP 5:')
for row in r.data:
    print(f\"  {row['symbol']} {row['name_ko']:<15} PER={row['per']} ROE={row['roe']} Quant={row['composite_pct']}\")
"
```

**기대 출력:**
```
OK: view created
OK: schema reload signaled
Quant TOP 5:
  XXXXXX 종목명          PER=XX.X ROE=XX.X Quant=95.5
  ...
```

만약 view 에서 결과가 안 나오면 Part B 넘어가지 말고 멈춰서 디버깅.

---

## Part B — API route 재작성

`app/api/stocks/screener/route.ts` **전체를 다음 내용으로 교체**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 정렬 가능한 컬럼 화이트리스트 (SQL injection 방지)
const SORTABLE = new Set([
  'market_cap', 'per', 'pbr', 'roe', 'operating_margin',
  'return_3m', 'return_6m', 'return_12m',
  'value_pct', 'momentum_pct', 'quality_pct', 'composite_pct',
  'dividend_yield',
]);

function num(v: string | null): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const markets = (sp.get('market') ?? 'KOSPI,KOSDAQ').split(',').filter(Boolean);
  const q = sp.get('q')?.trim() ?? '';

  // 시총
  const minCap = num(sp.get('minCap'));
  const maxCap = num(sp.get('maxCap'));

  // 재무
  const minPER = num(sp.get('minPER'));
  const maxPER = num(sp.get('maxPER'));
  const minROE = num(sp.get('minROE'));

  // 팩터 퍼센타일
  const minComposite = num(sp.get('minComposite'));
  const minMomentum = num(sp.get('minMomentum'));
  const minQuality = num(sp.get('minQuality'));
  const minValue = num(sp.get('minValue'));

  // 배당
  const minYield = num(sp.get('minYield'));
  const maxPayout = num(sp.get('maxPayout'));

  // 페이지네이션 / 정렬
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const limit = Math.min(100, Math.max(10, Number(sp.get('limit') ?? 50)));

  const orderByRaw = sp.get('orderBy') ?? 'market_cap';
  const orderBy = SORTABLE.has(orderByRaw) ? orderByRaw : 'market_cap';
  const order = sp.get('order') === 'asc' ? 'asc' : 'desc';

  const supabase = await createClient();
  let query = supabase
    .from('stock_snapshot_v')
    .select(
      [
        'symbol', 'name_ko', 'market', 'market_cap', 'sector', 'industry',
        'per', 'pbr', 'roe', 'operating_margin',
        'return_3m', 'return_6m', 'return_12m',
        'value_pct', 'momentum_pct', 'quality_pct', 'composite_pct',
        'dividend_yield', 'payout_ratio', 'dividend_per_share', 'div_fiscal_year',
      ].join(','),
      { count: 'exact' }
    )
    .eq('is_active', true)
    .eq('country', 'KR')
    .in('market', markets);

  if (q) query = query.or(`name_ko.ilike.%${q}%,symbol.ilike.${q}%`);
  if (minCap != null && minCap > 0) query = query.gte('market_cap', minCap);
  if (maxCap != null && maxCap > 0) query = query.lte('market_cap', maxCap);

  if (minPER != null) query = query.gte('per', minPER);
  if (maxPER != null) query = query.lte('per', maxPER);
  if (minROE != null) query = query.gte('roe', minROE);

  if (minComposite != null) query = query.gte('composite_pct', minComposite);
  if (minMomentum != null) query = query.gte('momentum_pct', minMomentum);
  if (minQuality != null) query = query.gte('quality_pct', minQuality);
  if (minValue != null) query = query.gte('value_pct', minValue);

  if (minYield != null) query = query.gte('dividend_yield', minYield);
  if (maxPayout != null) query = query.lte('payout_ratio', maxPayout);

  const from = (page - 1) * limit;
  query = query
    .order(orderBy, { ascending: order === 'asc', nullsFirst: false })
    .range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    stocks: data ?? [],
    total: count ?? 0,
    page,
    limit,
    orderBy,
    order,
  });
}
```

### B-1. API 수동 검증 (빌드 전)

로컬 dev 서버가 안 돌고 있어도 TypeScript 컴파일만 확인:

```bash
npx tsc --noEmit app/api/stocks/screener/route.ts
```

에러 없으면 Part C 로.

---

## Part C — ScreenerClient UI 재작성

`components/screener/ScreenerClient.tsx` **전체를 다음 내용으로 교체**:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw, Search, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { formatMarketCap } from '@/lib/utils/format';
import PartnerSlot from '@/components/partners/PartnerSlot';
import { useAuthStore } from '@/stores/authStore';
import { addToWatchlist, removeFromWatchlist, getWatchlistSymbols } from '@/lib/watchlist';

interface StockRow {
  symbol: string;
  name_ko: string;
  market: string;
  market_cap: number | null;
  sector: string | null;
  industry: string | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  operating_margin: number | null;
  return_3m: number | null;
  return_6m: number | null;
  return_12m: number | null;
  value_pct: number | null;
  momentum_pct: number | null;
  quality_pct: number | null;
  composite_pct: number | null;
  dividend_yield: number | null;
  payout_ratio: number | null;
  dividend_per_share: number | null;
  div_fiscal_year: number | null;
}

interface ApiResponse {
  stocks: StockRow[];
  total: number;
  page: number;
  limit: number;
  orderBy: string;
  order: 'asc' | 'desc';
}

const 조 = 1_000_000_000_000;
const LIMIT = 50;

interface PresetFilter {
  minCap?: number;
  maxCap?: number;
  minPER?: number;
  maxPER?: number;
  minROE?: number;
  minComposite?: number;
  minMomentum?: number;
  minQuality?: number;
  minValue?: number;
  minYield?: number;
  maxPayout?: number;
}

const PRESETS: Array<{ label: string; icon: string; filter: PresetFilter; orderBy?: string }> = [
  { label: '대형주 (10조+)', icon: '🏢', filter: { minCap: 10 * 조 } },
  { label: '중형주 (1~10조)', icon: '🏬', filter: { minCap: 1 * 조, maxCap: 10 * 조 } },
  { label: '소형주 (1조 미만)', icon: '🏪', filter: { maxCap: 1 * 조 } },
  { label: '퀀트 TOP 100', icon: '🔥', filter: { minComposite: 80 }, orderBy: 'composite_pct' },
  { label: '저PER + 고ROE', icon: '💎', filter: { maxPER: 10, minROE: 15 }, orderBy: 'roe' },
  { label: '모멘텀 강세', icon: '📈', filter: { minMomentum: 80 }, orderBy: 'momentum_pct' },
  { label: '배당 귀족', icon: '💰', filter: { minYield: 4, maxPayout: 60 }, orderBy: 'dividend_yield' },
  { label: '우량 Quality', icon: '🛡️', filter: { minQuality: 80 }, orderBy: 'quality_pct' },
];

interface FilterState {
  market: string[];
  keyword: string;
  minCap: number;
  maxCap: number;
  minPER: number;
  maxPER: number;
  minROE: number;
  minComposite: number;
  minMomentum: number;
  minQuality: number;
  minValue: number;
  minYield: number;
  maxPayout: number;
}

const DEFAULT_FILTER: FilterState = {
  market: ['KOSPI', 'KOSDAQ'],
  keyword: '',
  minCap: 0,
  maxCap: 0,
  minPER: 0,
  maxPER: 0,
  minROE: 0,
  minComposite: 0,
  minMomentum: 0,
  minQuality: 0,
  minValue: 0,
  minYield: 0,
  maxPayout: 0,
};

type SortKey =
  | 'market_cap' | 'per' | 'roe' | 'composite_pct' | 'dividend_yield';
const SORTABLE_COLUMNS: Record<SortKey, string> = {
  market_cap: '시가총액',
  per: 'PER',
  roe: 'ROE',
  composite_pct: '퀀트종합',
  dividend_yield: '배당수익률',
};

function fmtNum(n: number | null | undefined, digits = 2, suffix = ''): string {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return `${Number(n).toFixed(digits)}${suffix}`;
}

function scoreBadge(pct: number | null): { bg: string; text: string } {
  if (pct == null) return { bg: 'bg-[#F0F0F0]', text: 'text-[#999]' };
  if (pct >= 75) return { bg: 'bg-emerald-500/15', text: 'text-emerald-600' };
  if (pct >= 50) return { bg: 'bg-[#0ABAB5]/15', text: 'text-[#0ABAB5]' };
  if (pct >= 25) return { bg: 'bg-amber-500/15', text: 'text-amber-600' };
  return { bg: 'bg-red-500/10', text: 'text-red-600' };
}

export default function ScreenerClient() {
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<SortKey>('market_cap');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [watched, setWatched] = useState<Set<string>>(new Set());

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) { setWatched(new Set()); return; }
    getWatchlistSymbols(user.id).then((syms) => setWatched(new Set(syms)));
  }, [user]);

  // URL 초기 필터 1회
  useEffect(() => {
    if (!mounted) return;
    const urlMarket = searchParams.get('market');
    const urlQ = searchParams.get('q');
    if (!urlMarket && !urlQ) return;

    setFilters((prev) => {
      const next = { ...prev };
      if (urlMarket) {
        const markets = urlMarket.split(',').filter((m) => ['KOSPI', 'KOSDAQ'].includes(m));
        if (markets.length > 0) next.market = markets;
      }
      if (urlQ) next.keyword = urlQ;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => { setPage(1); }, [filters, orderBy, order]);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      setLoading(true);
      const p = new URLSearchParams({
        market: filters.market.join(','),
        page: String(page),
        limit: String(LIMIT),
        orderBy,
        order,
      });
      if (filters.keyword) p.set('q', filters.keyword);
      const addIf = (key: string, val: number) => { if (val > 0) p.set(key, String(val)); };
      addIf('minCap', filters.minCap);
      addIf('maxCap', filters.maxCap);
      addIf('minPER', filters.minPER);
      addIf('maxPER', filters.maxPER);
      addIf('minROE', filters.minROE);
      addIf('minComposite', filters.minComposite);
      addIf('minMomentum', filters.minMomentum);
      addIf('minQuality', filters.minQuality);
      addIf('minValue', filters.minValue);
      addIf('minYield', filters.minYield);
      addIf('maxPayout', filters.maxPayout);

      fetch(`/api/stocks/screener?${p}`)
        .then((r) => r.json())
        .then((d: ApiResponse) => setData(d))
        .catch(() => setData({ stocks: [], total: 0, page: 1, limit: LIMIT, orderBy, order }))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [filters, page, orderBy, order, mounted]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const next: FilterState = { ...DEFAULT_FILTER };
    const f = preset.filter;
    if (f.minCap) next.minCap = f.minCap;
    if (f.maxCap) next.maxCap = f.maxCap;
    if (f.minPER) next.minPER = f.minPER;
    if (f.maxPER) next.maxPER = f.maxPER;
    if (f.minROE) next.minROE = f.minROE;
    if (f.minComposite) next.minComposite = f.minComposite;
    if (f.minMomentum) next.minMomentum = f.minMomentum;
    if (f.minQuality) next.minQuality = f.minQuality;
    if (f.minValue) next.minValue = f.minValue;
    if (f.minYield) next.minYield = f.minYield;
    if (f.maxPayout) next.maxPayout = f.maxPayout;
    setFilters(next);
    if (preset.orderBy) {
      setOrderBy(preset.orderBy as SortKey);
      setOrder('desc');
    }
  };

  const toggleWatch = async (symbol: string) => {
    if (!user) {
      alert('관심종목은 로그인 후 이용 가능합니다.');
      return;
    }
    const was = watched.has(symbol);
    setWatched((prev) => {
      const n = new Set(prev);
      if (was) n.delete(symbol); else n.add(symbol);
      return n;
    });
    const ok = was
      ? await removeFromWatchlist(user.id, symbol)
      : await addToWatchlist(user.id, symbol);
    if (!ok) {
      setWatched((prev) => {
        const n = new Set(prev);
        if (was) n.add(symbol); else n.delete(symbol);
        return n;
      });
    }
  };

  const toggleMarket = (m: string) => {
    const next = filters.market.includes(m)
      ? filters.market.filter((x) => x !== m)
      : [...filters.market, m];
    if (next.length === 0) return;
    setFilters({ ...filters, market: next });
  };

  const toggleSort = (col: SortKey) => {
    if (orderBy === col) {
      setOrder(order === 'desc' ? 'asc' : 'desc');
    } else {
      setOrderBy(col);
      setOrder('desc');
    }
  };

  if (!mounted) {
    return (
      <div className="px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">종목 발굴</h1>
        <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-12 bg-[#F0F0F0] animate-pulse" />))}</div>
      </div>
    );
  }

  const stocks = data?.stocks ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const SortHeader = ({ col, align = 'right' }: { col: SortKey; align?: 'left' | 'right' | 'center' }) => {
    const active = orderBy === col;
    return (
      <button
        onClick={() => toggleSort(col)}
        className={`flex items-center gap-1 text-xs font-bold ${active ? 'text-[#0ABAB5]' : 'text-[#999]'} hover:text-[#0ABAB5] ${align === 'right' ? 'justify-end ml-auto' : align === 'center' ? 'justify-center mx-auto' : ''}`}
      >
        {SORTABLE_COLUMNS[col]}
        {active && (order === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
      </button>
    );
  };

  return (
    <div className="px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-2">종목 발굴</h1>
      <p className="text-[#999999] text-xs mb-6">
        KOSPI + KOSDAQ 전체 · 퀀트/재무 팩터 기반 필터 · 컬럼 클릭 정렬
      </p>

      {/* Presets */}
      <div className="bg-[#0D1117] p-4 mb-6 flex gap-3 overflow-x-auto">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="shrink-0 px-4 py-2 bg-[#161B22] text-white font-bold text-sm hover:bg-[#C9A96E] border border-[#2D3748]"
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border-[3px] border-[#0ABAB5] p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-black block mb-1">시장</label>
            <div className="flex gap-2">
              {['KOSPI', 'KOSDAQ'].map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMarket(m)}
                  className={`px-3 py-1.5 text-xs font-bold border ${filters.market.includes(m) ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]' : 'bg-white text-[#999999] border-[#E5E7EB]'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">키워드</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="종목명/코드"
                className="pl-8 pr-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-40"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">시총 최소(조)</label>
            <input
              type="number"
              value={filters.minCap > 0 ? filters.minCap / 조 : ''}
              onChange={(e) => setFilters({ ...filters, minCap: e.target.value ? Number(e.target.value) * 조 : 0 })}
              placeholder="0"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">시총 최대(조)</label>
            <input
              type="number"
              value={filters.maxCap > 0 ? filters.maxCap / 조 : ''}
              onChange={(e) => setFilters({ ...filters, maxCap: e.target.value ? Number(e.target.value) * 조 : 0 })}
              placeholder="무제한"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">PER ≤</label>
            <input
              type="number"
              value={filters.maxPER > 0 ? filters.maxPER : ''}
              onChange={(e) => setFilters({ ...filters, maxPER: e.target.value ? Number(e.target.value) : 0 })}
              placeholder="무제한"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">ROE ≥ (%)</label>
            <input
              type="number"
              value={filters.minROE > 0 ? filters.minROE : ''}
              onChange={(e) => setFilters({ ...filters, minROE: e.target.value ? Number(e.target.value) : 0 })}
              placeholder="0"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">퀀트 종합 ≥</label>
            <input
              type="number"
              value={filters.minComposite > 0 ? filters.minComposite : ''}
              onChange={(e) => setFilters({ ...filters, minComposite: e.target.value ? Number(e.target.value) : 0 })}
              placeholder="0"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">배당수익률 ≥ (%)</label>
            <input
              type="number"
              step="0.1"
              value={filters.minYield > 0 ? filters.minYield : ''}
              onChange={(e) => setFilters({ ...filters, minYield: e.target.value ? Number(e.target.value) : 0 })}
              placeholder="0"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <button
            onClick={() => { setFilters(DEFAULT_FILTER); setOrderBy('market_cap'); setOrder('desc'); }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#999999] hover:text-black"
          >
            <RotateCcw className="w-3 h-3" /> 초기화
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F5] text-xs text-[#999999] font-bold">
            <tr>
              <th className="text-left px-3 py-2">종목</th>
              <th className="text-left px-3 py-2">시장</th>
              <th className="text-left px-3 py-2">섹터</th>
              <th className="text-right px-3 py-2"><SortHeader col="market_cap" /></th>
              <th className="text-right px-3 py-2"><SortHeader col="per" /></th>
              <th className="text-right px-3 py-2"><SortHeader col="roe" /></th>
              <th className="text-right px-3 py-2"><SortHeader col="dividend_yield" /></th>
              <th className="text-center px-3 py-2"><SortHeader col="composite_pct" align="center" /></th>
              <th className="text-center px-3 py-2 w-10">⭐</th>
            </tr>
          </thead>
          <tbody>
            {loading && stocks.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-[#999999]">불러오는 중...</td></tr>
            )}
            {!loading && stocks.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-[#999999] font-bold">조건에 맞는 종목이 없습니다</td></tr>
            )}
            {stocks.map((s, i) => {
              const badge = scoreBadge(s.composite_pct);
              return (
                <tr key={`${s.symbol}-${s.market}`} className={`border-b border-[#F0F0F0] hover:bg-[#F5F5F5] ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                  <td className="px-3 py-2">
                    <Link href={`/stocks/${s.symbol}`} className="text-black font-bold hover:text-[#0ABAB5]">{s.name_ko}</Link>
                    <span className="text-[#999999] text-xs ml-1">{s.symbol}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-[#999999] font-bold">{s.market}</td>
                  <td className="px-3 py-2 text-xs text-[#666666]">{s.sector ?? '-'}</td>
                  <td className="text-right px-3 py-2 font-mono-price font-bold">{formatMarketCap(s.market_cap)}</td>
                  <td className="text-right px-3 py-2 font-mono-price">{fmtNum(s.per, 1)}</td>
                  <td className="text-right px-3 py-2 font-mono-price">{fmtNum(s.roe, 1, '%')}</td>
                  <td className="text-right px-3 py-2 font-mono-price">{fmtNum(s.dividend_yield, 2, '%')}</td>
                  <td className="text-center px-3 py-2">
                    {s.composite_pct != null ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${badge.bg} ${badge.text}`}>
                        {Math.round(s.composite_pct)}
                      </span>
                    ) : <span className="text-[#CCC] text-xs">—</span>}
                  </td>
                  <td className="text-center px-3 py-2">
                    <button
                      onClick={() => toggleWatch(s.symbol)}
                      className={`p-1 transition-colors ${watched.has(s.symbol) ? 'text-[#0ABAB5]' : 'text-[#CCC] hover:text-[#0ABAB5]'}`}
                      aria-label={watched.has(s.symbol) ? '관심종목 제거' : '관심종목 추가'}
                    >
                      <Star className="w-4 h-4" fill={watched.has(s.symbol) ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[#999999] text-xs">
          {total.toLocaleString()}종목 중 {((page - 1) * LIMIT + 1).toLocaleString()}~{Math.min(page * LIMIT, total).toLocaleString()}
        </p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1 text-xs font-bold border border-[#E5E7EB] disabled:opacity-40 hover:border-[#0ABAB5]">이전</button>
          <span className="px-3 py-1 text-xs font-bold text-black">{page} / {totalPages || 1}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1 text-xs font-bold border border-[#E5E7EB] disabled:opacity-40 hover:border-[#0ABAB5]">다음</button>
        </div>
      </div>

      {/* Partner Slot */}
      <div className="mt-8">
        <PartnerSlot slotKey="screener-bottom" variant="card" />
      </div>
    </div>
  );
}
```

### C-1. 타입/빌드 검증

```bash
npm run build
```

- 빌드 에러 없으면 Part D 로.
- ESLint/TypeScript 에러 나오면 수정 후 재빌드.

**흔한 이슈 예방:**
- `formatMarketCap` 의 nullable 처리 확인
- `SORTABLE_COLUMNS` 의 key 타입이 `SortKey` 와 일치
- `useSearchParams` 는 Next.js 16 에서 `Suspense` 필요 — `app/screener/page.tsx` 에 이미 `<Suspense>` 래핑돼 있으니 OK

---

## Part D — 세션 종료 문서 업데이트

### D-1. CHANGELOG.md 맨 위에 STEP 46 항목 추가

```markdown
<!-- 2026-04-22 -->
# Stock Terminal — 변경 이력

## 2026-04-22 — STEP 46: 스크리너 팩터 업그레이드 (API JOIN + 프리셋 8종 + 정렬 컬럼)

- **Migration**: `supabase/migrations/013_stock_snapshot_view.sql` 신규 — stocks + 최신 quant_factors + 최신 dividends LEFT JOIN LATERAL view
- **API**: `app/api/stocks/screener/route.ts` 전면 재작성 — PER/ROE/composite/yield/payout 필터 + orderBy 화이트리스트 기반 정렬
- **UI**: `components/screener/ScreenerClient.tsx` 재작성 — 프리셋 3종 → 8종 (퀀트 TOP 100 / 저PER+고ROE / 모멘텀 / 배당 귀족 / Quality), 필터 5종 추가 (PER max, ROE min, 퀀트종합 min, 배당수익률 min), 테이블 컬럼 3종 추가 (PER, ROE, 퀀트종합 배지), 클릭 정렬
- **Data**: quant_factors 200행 + dividends 790행 노출 채널 개통. 스크리너에서 전종목 팩터 검색 가능
- **Result**: `/screener` 페이지 stub → 전업용 팩터 스크리너로 격상

## (이전 STEP 45 항목 유지)
...
```

(기존 내용은 그대로 두고 맨 위에만 추가)

### D-2. session-context.md — 최근 세션 블록 추가

상단에 다음 블록을 "최근 세션" 섹션 맨 위에 추가:

```markdown
### 2026-04-22 세션 — STEP 46: 스크리너 팩터 업그레이드 ✅

- Migration 013 stock_snapshot_v view — stocks/quant_factors/dividends 집계
- API route 팩터 필터 + 정렬 지원
- ScreenerClient 프리셋 3→8, 필터 5종 추가, 컬럼 3종 추가, 정렬 UI
- 누계 DB 변화 없음 (view 신설만)
- 5개 분석 탭 완성 이후 첫 유저 노출 단계 — 스크리너가 팩터 자산 활용 UX 1순위 진입점
```

### D-3. NEXT_SESSION_START.md — 다음 세션 초기 지시 업데이트

기존 내용을 덮어쓰되, 상단 2-3줄만 갱신:

```markdown
<!-- 2026-04-22 -->
# Stock Terminal — 다음 세션 시작 가이드

## ⚠️ 다음 세션에서 가장 먼저 할 일
1. `docs/SESSION_KICKOFF.md` 읽기 — 전체 현황 요약
2. **STEP 46 후속 작업 후보**:
   - 홈 대시보드에 "퀀트 종합 TOP 10" 위젯 추가
   - 스크리너 URL 공유 기능 (현재 필터 → URL 직렬화)
   - 데이터 fresh-cycle 스케줄 (일일 재시딩 자동화)
3. 기존 4개 문서(CLAUDE/CHANGELOG/session-context/NEXT_SESSION_START) 오늘 날짜 확인

## 현재 상태 (2026-04-22 STEP 46 완료 시점)
- 5개 분석 탭 전원 live (가치/기술/수급/배당/퀀트)
- 스크리너 팩터 업그레이드 완료 — /screener 전업용 수준
- DB: stocks 2,780 / financials 576 / stock_prices 54,899 / supply_demand 3,000 / dividends 790 / quant_factors 200

...
(이후 기존 내용 유지)
```

### D-4. 4개 docs 날짜 헤더 오늘(2026-04-22) 확인

이미 오늘 날짜인지 `head -1` 로 확인 — STEP 45 종료 시점에 갱신됐으면 그대로 OK.

---

## Part E — Build + Commit + Push

### E-1. 빌드 최종 검증

```bash
npm run build
```

에러 0, 경고는 허용. 빌드 성공 못 하면 커밋 금지.

### E-2. Git 커밋 + push

```bash
git add supabase/migrations/013_stock_snapshot_view.sql \
        app/api/stocks/screener/route.ts \
        components/screener/ScreenerClient.tsx \
        docs/CHANGELOG.md \
        session-context.md \
        docs/NEXT_SESSION_START.md \
        docs/STEP_46_COMMAND.md

git commit -m "$(cat <<'EOF'
STEP 46: 스크리너 팩터 업그레이드 — API JOIN + 프리셋 8종 + 정렬 컬럼

- Migration 013: stock_snapshot_v view (stocks + 최신 quant_factors + 최신 dividends LEFT JOIN LATERAL)
- API route 재작성: PER/ROE/composite/yield 필터 + orderBy 화이트리스트 정렬
- ScreenerClient 재작성: 프리셋 3→8종 (퀀트 TOP 100 / 저PER+고ROE / 모멘텀 / 배당 귀족 / Quality), 필터 5종 + 컬럼 3종 + 클릭 정렬

5개 분석 탭 마일스톤 이후 첫 유저 노출 단계 — 퀀트/재무/배당 자산이 /screener 에서 전종목 검색 가능.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push origin main
```

### E-3. 완료 보고 형식

사용자에게 다음 형식으로 보고:

```
STEP 46 완료. push까지 끝났습니다.

변경 요약:
- 013_stock_snapshot_view.sql 신규 (LEFT JOIN LATERAL)
- screener API 팩터 필터/정렬 지원
- ScreenerClient 프리셋 3→8, 필터 5종 추가, 정렬 컬럼

누계 DB (변동 없음): stocks 2,780 / financials 576 / stock_prices 54,899 / supply_demand 3,000 / dividends 790 / quant_factors 200

스크리너 현황:
✅ 퀀트 TOP 100 프리셋
✅ 저PER+고ROE 프리셋
✅ 모멘텀 강세
✅ 배당 귀족
✅ 우량 Quality
✅ PER/ROE/퀀트 컬럼 클릭 정렬

브라우저에서 /screener 확인 → 프리셋 눌러 필터 작동 검증.
```

---

## 실패 대처 플로우

### Part A 실패 (view 생성 실패)
- `psycopg2` 연결 에러 → `.env.local` 의 `DATABASE_URL` 확인
- SQL 에러 → migration 파일 문법 확인
- 스키마 캐시 갱신 안 됨 → Supabase Dashboard → Settings → API → Reload schema 수동

### Part B 실패 (API 타입 에러)
- Supabase client type 불일치 → `.select(' ... ')` 문자열 확인
- view 컬럼 오타 → migration 파일과 비교

### Part C 실패 (빌드 에러)
- 흔한 원인: null 타입 처리, optional chaining 누락
- `fmtNum` 을 nullable 지원하도록 작성됨 — 호출 쪽에서 그대로 통과 가능
- `useSearchParams` 는 이미 Suspense 안에 있음 — 별도 처리 불필요

### Part E 실패 (push rejected)
- `git pull --rebase origin main` 후 재시도
- 충돌 나면 수동 해결 후 재커밋

---

## 설계 의도 (왜 이렇게 했는가)

### LATERAL JOIN 선택 이유
- 대안: `DISTINCT ON (stock_id)` → 서브쿼리 + JOIN → 가독성 떨어짐
- LATERAL LIMIT 1 은 "각 행별로 최신 1개" 의미가 SQL 자연어 수준 — 유지보수 용이
- 성능은 stocks 2,780 규모에서는 무시해도 됨

### view vs RPC 함수
- view 선택: Supabase JS client 가 `.from()` 으로 자연스럽게 쿼리 가능
- RPC 대안은 지양 — 파라미터 바인딩/에러 메시지 추적 번거로움

### 정렬 화이트리스트
- `SORTABLE` Set 으로 제한 — 사용자 입력 직접 SQL 컬럼명에 못 넣도록 차단
- 화이트리스트 미일치 시 `market_cap` fallback — 에러 없이 안전 동작

### 프리셋 orderBy 동반
- 프리셋 선택 시 자동 정렬 기준 변경 ("퀀트 TOP 100" → `composite_pct DESC`) — UX 직관성
- 사용자가 이후 컬럼 헤더 클릭하면 overwrite 가능

### 컬럼 3개 선정 근거 (PER / ROE / 퀀트종합)
- PER: 가장 널리 알려진 밸류에이션 지표
- ROE: 퀄리티 대표 지표
- 퀀트종합: 배지 형식으로 시각화 — 한눈에 매력 판단
- 제외: PBR/영업이익률/개별 팩터 퍼센타일 — 밀도 부담, 필터로는 제공

---

이 파일은 STEP 46 실행용 단일 진실의 소스. Claude Code 는 이 파일 내용대로만 실행.
