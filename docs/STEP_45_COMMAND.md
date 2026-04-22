# STEP 45 — QuantAnalysis 재활성화 (전종목 팩터 집계 + Value/Momentum/Quality 퍼센타일)

**실행 명령어 (Sonnet)**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

Claude Code 안에서:
```
@docs/STEP_45_COMMAND.md 파일 내용대로 실행해줘
```

---

## 목표
1. 새 테이블 `quant_factors` 마이그레이션 작성 (사용자가 Supabase SQL Editor에 실행)
2. `scripts/seed-quant-factors.py` 신규 작성 → TOP 200 대상 Value / Momentum / Quality 팩터 수집·퍼센타일 계산
3. `components/analysis/QuantAnalysis.tsx` 스텁 → **실제 퀀트 분석 컴포넌트** 재작성
4. 이로써 **5개 분석 탭 모두 실데이터 연결 완료**

## 전제 상태
- 직전 커밋: `069cc25` (STEP 44 — DividendAnalysis 재활성화 + dividends 790행)
- 누계 DB: stocks 2,780 / financials 576 / stock_prices 54,899 / supply_demand 3,000 / dividends 790
- `components/analysis/QuantAnalysis.tsx` 는 현재 32줄 스텁 카드

## 팩터 설계
각 팩터는 TOP 200 종목 간 **퍼센타일 (0~100, 높을수록 우수)** 로 산출:

| 팩터 | 입력 데이터 | 계산 방식 |
|---|---|---|
| **Value** | financials (PER, PBR) | PER 역순위 50% + PBR 역순위 50% (낮을수록 고점수) |
| **Momentum** | stock_prices | 3M 수익률 30% + 6M 수익률 30% + 12M 수익률 40% (높을수록 고점수) |
| **Quality** | financials (ROE, op_margin) | ROE 50% + 영업이익률 50% (높을수록 고점수) |
| **Composite** | 위 3개 | Value 35% + Momentum 30% + Quality 35% |

---

## Part A — Migration 작성

### A-1. 파일 생성
파일: `supabase/migrations/012_quant_factors.sql`

```sql
-- 2026-04-22 STEP 45 — quant_factors: 전종목 퀀트 팩터 스냅샷
CREATE TABLE IF NOT EXISTS quant_factors (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  -- 원시 값
  per NUMERIC,
  pbr NUMERIC,
  roe NUMERIC,
  operating_margin NUMERIC,
  return_3m NUMERIC,
  return_6m NUMERIC,
  return_12m NUMERIC,
  -- 퍼센타일 (0~100, 높을수록 우수)
  value_pct NUMERIC,
  momentum_pct NUMERIC,
  quality_pct NUMERIC,
  composite_pct NUMERIC,
  -- 섹터 상대 순위 (0~100)
  sector_rank_pct NUMERIC,
  -- 메타
  universe_size INT,  -- 집계 모수 (TOP N)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stock_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_quant_factors_stock ON quant_factors(stock_id);
CREATE INDEX IF NOT EXISTS idx_quant_factors_snapshot ON quant_factors(snapshot_date DESC);

ALTER TABLE quant_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read quant_factors" ON quant_factors FOR SELECT USING (true);
CREATE POLICY "Service role can manage quant_factors" ON quant_factors
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
```

### A-2. Supabase SQL Editor 실행
**사용자가 수동 실행** — Claude Code 에게 지시:
```
1. 위 SQL 내용을 Supabase Dashboard → SQL Editor 에 붙여넣기
2. Run
3. 테이블 생성 확인:
   python3 scripts/sql-exec.py "SELECT COUNT(*) FROM quant_factors"
```

Supabase URL: https://supabase.com/dashboard/project/{프로젝트-ID}/sql

---

## Part B — seed-quant-factors.py 작성

`scripts/seed-quant-factors.py` 신규:

```python
#!/usr/bin/env python3
"""
전종목 퀀트 팩터 집계 → quant_factors 테이블.
대상: 시총 TOP N (기본 200) + 005930
입력: financials (PER/PBR/ROE/op_margin), stock_prices (수익률)
출력: 각 종목의 Value/Momentum/Quality/Composite 퍼센타일
"""
import os
import sys
import warnings
from datetime import date, timedelta

warnings.filterwarnings('ignore')

from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')
SB_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SB_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

for var, val in [('SUPABASE_URL', SB_URL), ('SUPABASE_KEY', SB_KEY)]:
    if not val:
        print(f'ERROR: {var} 누락')
        sys.exit(1)

sb = create_client(SB_URL, SB_KEY)
TOP_N = int(os.getenv('TOP_N', '200'))
TODAY = date.today().isoformat()


def percentile_rank(values, reverse=False):
    """values: list of (key, value). Returns {key: percentile(0~100)}.
    reverse=True 이면 낮은 값이 높은 퍼센타일 (PER/PBR 용)."""
    valid = [(k, v) for k, v in values if v is not None]
    if not valid:
        return {}
    sorted_vals = sorted(valid, key=lambda x: x[1], reverse=reverse)
    n = len(sorted_vals)
    result = {}
    for i, (k, _) in enumerate(sorted_vals):
        # 낮을수록 좋다(reverse=True)면 첫번째가 최고 = 100점
        # 높을수록 좋다(reverse=False)면 마지막이 최고 = 100점
        if reverse:
            result[k] = round(100 * (n - 1 - i) / max(n - 1, 1), 1)
        else:
            result[k] = round(100 * i / max(n - 1, 1), 1)
    return result


def weighted(vals, weights):
    """vals, weights: same-length lists. None 인 값은 가중치 재분배."""
    paired = [(v, w) for v, w in zip(vals, weights) if v is not None]
    if not paired:
        return None
    total_w = sum(w for _, w in paired)
    if total_w == 0:
        return None
    return round(sum(v * w for v, w in paired) / total_w, 1)


# ── 1. TOP 200 종목 로드 ─────────────────────────────────────────
print(f'[1/5] 대상 종목: 시총 TOP {TOP_N} + 005930')
top = (
    sb.table('stocks')
    .select('id, symbol, name_ko, sector')
    .eq('country', 'KR')
    .not_.is_('market_cap', 'null')
    .order('market_cap', desc=True)
    .limit(TOP_N)
    .execute().data or []
)
top_ids = {s['id']: s for s in top}
# 005930 포함 확인
samsung = next((s for s in top if s['symbol'] == '005930'), None)
if not samsung:
    extra = sb.table('stocks').select('id, symbol, name_ko, sector').eq('symbol', '005930').eq('market', 'KOSPI').limit(1).execute().data or []
    if extra:
        top_ids[extra[0]['id']] = extra[0]
print(f'  {len(top_ids)}종목')

stock_ids = list(top_ids.keys())


# ── 2. 최신 financials (Value/Quality 원천) ──────────────────────
print('[2/5] financials 로딩 (PER/PBR/ROE/영업이익률)')
fin_data = (
    sb.table('financials')
    .select('stock_id, period_date, period_type, per, pbr, roe, operating_margin')
    .in_('stock_id', stock_ids)
    .order('period_date', desc=True)
    .execute().data or []
)
# 각 stock_id 별 최신 값 (period_date DESC 정렬되어 있음)
latest_fin = {}
for r in fin_data:
    sid = r['stock_id']
    if sid not in latest_fin:
        latest_fin[sid] = r
    else:
        # PER/PBR 가 NULL 이면 다음 후보로 갱신
        cur = latest_fin[sid]
        if cur.get('per') is None and r.get('per') is not None:
            cur['per'] = r['per']
        if cur.get('pbr') is None and r.get('pbr') is not None:
            cur['pbr'] = r['pbr']
        if cur.get('roe') is None and r.get('roe') is not None:
            cur['roe'] = r['roe']
        if cur.get('operating_margin') is None and r.get('operating_margin') is not None:
            cur['operating_margin'] = r['operating_margin']

print(f'  {len(latest_fin)}종목 financials 매핑')


# ── 3. stock_prices 수익률 계산 (Momentum) ───────────────────────
print('[3/5] stock_prices 3M/6M/12M 수익률 계산')
# 각 종목의 전체 일봉 로드 (chunk 처리)
from collections import defaultdict
price_map = defaultdict(list)  # stock_id -> [(date, close), ...]

CHUNK = 50
for i in range(0, len(stock_ids), CHUNK):
    chunk_ids = stock_ids[i:i+CHUNK]
    rows = (
        sb.table('stock_prices')
        .select('stock_id, trade_date, close')
        .in_('stock_id', chunk_ids)
        .order('trade_date', desc=False)
        .execute().data or []
    )
    for r in rows:
        if r['close'] is not None:
            price_map[r['stock_id']].append((r['trade_date'], r['close']))

def compute_return(series, days):
    """series: sorted by date ASC. days: lookback 영업일 수."""
    if len(series) < days + 1:
        return None
    latest = series[-1][1]
    past = series[-(days + 1)][1]
    if past == 0 or past is None:
        return None
    return round((latest - past) / past * 100, 2)

returns_by_stock = {}
for sid, series in price_map.items():
    returns_by_stock[sid] = {
        'return_3m': compute_return(series, 60),    # 영업일 ~60
        'return_6m': compute_return(series, 120),
        'return_12m': compute_return(series, 240),
    }
print(f'  {len(returns_by_stock)}종목 수익률 계산 완료')


# ── 4. 퍼센타일 산출 ──────────────────────────────────────────────
print('[4/5] Value / Momentum / Quality / Composite 퍼센타일 산출')

# 4-1. Value — PER/PBR 낮을수록 좋음
per_pairs = [(sid, latest_fin.get(sid, {}).get('per')) for sid in stock_ids]
pbr_pairs = [(sid, latest_fin.get(sid, {}).get('pbr')) for sid in stock_ids]
per_pct = percentile_rank(per_pairs, reverse=True)
pbr_pct = percentile_rank(pbr_pairs, reverse=True)

# 4-2. Momentum — 수익률 높을수록 좋음
r3m_pairs = [(sid, returns_by_stock.get(sid, {}).get('return_3m')) for sid in stock_ids]
r6m_pairs = [(sid, returns_by_stock.get(sid, {}).get('return_6m')) for sid in stock_ids]
r12m_pairs = [(sid, returns_by_stock.get(sid, {}).get('return_12m')) for sid in stock_ids]
r3m_pct = percentile_rank(r3m_pairs)
r6m_pct = percentile_rank(r6m_pairs)
r12m_pct = percentile_rank(r12m_pairs)

# 4-3. Quality — ROE/영업이익률 높을수록 좋음
roe_pairs = [(sid, latest_fin.get(sid, {}).get('roe')) for sid in stock_ids]
om_pairs = [(sid, latest_fin.get(sid, {}).get('operating_margin')) for sid in stock_ids]
roe_pct = percentile_rank(roe_pairs)
om_pct = percentile_rank(om_pairs)

# 4-4. 섹터 내 순위 — 섹터가 동일한 종목들끼리 composite 재계산
sector_groups = defaultdict(list)
for sid in stock_ids:
    sector = top_ids.get(sid, {}).get('sector')
    sector_groups[sector].append(sid)


# ── 5. Assemble rows + upsert ────────────────────────────────────
print('[5/5] quant_factors 조립 + upsert')
rows = []
# Composite 저장 임시
composite_by_stock = {}

for sid in stock_ids:
    f = latest_fin.get(sid, {})
    ret = returns_by_stock.get(sid, {})

    value_pct = weighted([per_pct.get(sid), pbr_pct.get(sid)], [0.5, 0.5])
    momentum_pct = weighted(
        [r3m_pct.get(sid), r6m_pct.get(sid), r12m_pct.get(sid)],
        [0.3, 0.3, 0.4],
    )
    quality_pct = weighted([roe_pct.get(sid), om_pct.get(sid)], [0.5, 0.5])
    composite_pct = weighted(
        [value_pct, momentum_pct, quality_pct],
        [0.35, 0.30, 0.35],
    )
    composite_by_stock[sid] = composite_pct

    rows.append({
        'stock_id': sid,
        'snapshot_date': TODAY,
        'per': f.get('per'),
        'pbr': f.get('pbr'),
        'roe': f.get('roe'),
        'operating_margin': f.get('operating_margin'),
        'return_3m': ret.get('return_3m'),
        'return_6m': ret.get('return_6m'),
        'return_12m': ret.get('return_12m'),
        'value_pct': value_pct,
        'momentum_pct': momentum_pct,
        'quality_pct': quality_pct,
        'composite_pct': composite_pct,
        'universe_size': len(stock_ids),
    })

# 섹터 상대 순위 재계산
for sector, sids in sector_groups.items():
    sector_composites = [(sid, composite_by_stock.get(sid)) for sid in sids]
    sector_pct = percentile_rank(sector_composites)
    for row in rows:
        if row['stock_id'] in sector_pct:
            row['sector_rank_pct'] = sector_pct[row['stock_id']]

# upsert
BATCH = 500
upserted = 0
for i in range(0, len(rows), BATCH):
    chunk = rows[i:i+BATCH]
    sb.table('quant_factors').upsert(chunk, on_conflict='stock_id,snapshot_date').execute()
    upserted += len(chunk)
    print(f'  quant_factors upserted: {upserted}')

total = sb.table('quant_factors').select('id', count='exact').execute().count
print(f'\n[완료] quant_factors 테이블 총 {total}행')
```

---

## Part C — 시딩 실행

### C-0. Migration 실행 확인
Part A-2 완료 후:
```bash
python3 scripts/sql-exec.py "SELECT COUNT(*) FROM quant_factors"
```
→ `0` 이 나오면 테이블 생성 OK

### C-1. 시딩
```bash
cd ~/Desktop/OTMarketing
python3 scripts/seed-quant-factors.py
```

**예상 출력**:
```
[1/5] 대상 종목: 시총 TOP 200 + 005930
  200종목
[2/5] financials 로딩 (PER/PBR/ROE/영업이익률)
  ~180종목 financials 매핑
[3/5] stock_prices 3M/6M/12M 수익률 계산
  ~200종목 수익률 계산 완료
[4/5] Value / Momentum / Quality / Composite 퍼센타일 산출
[5/5] quant_factors 조립 + upsert
  quant_factors upserted: 200
[완료] quant_factors 테이블 총 200행
```

**소요 시간**: 네트워크 I/O 위주 → 약 30초

### C-2. 검증
```bash
# 삼성전자 팩터 샘플
python3 scripts/sql-exec.py "SELECT s.name_ko, q.value_pct, q.momentum_pct, q.quality_pct, q.composite_pct FROM quant_factors q JOIN stocks s ON s.id = q.stock_id WHERE s.symbol = '005930'"

# 종합 점수 TOP 10
python3 scripts/sql-exec.py "SELECT s.name_ko, q.composite_pct, q.value_pct, q.momentum_pct, q.quality_pct FROM quant_factors q JOIN stocks s ON s.id = q.stock_id ORDER BY q.composite_pct DESC NULLS LAST LIMIT 10"
```

---

## Part D — QuantAnalysis.tsx 재작성

`components/analysis/QuantAnalysis.tsx` 전체 교체:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { BarChart3, Target, TrendingUp, Award } from 'lucide-react';

interface QuantFactor {
  stock_id: number;
  snapshot_date: string;
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
  sector_rank_pct: number | null;
  universe_size: number | null;
}

interface Props {
  stockId: number;
}

function formatNum(n: number | null | undefined, digits = 1, suffix = ''): string {
  if (n == null || isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: digits })}${suffix}`;
}

function scoreColor(pct: number | null | undefined): string {
  if (pct == null) return 'text-text-secondary';
  if (pct >= 75) return 'text-emerald-400';
  if (pct >= 50) return 'text-accent';
  if (pct >= 25) return 'text-amber-400';
  return 'text-red-400';
}

function scoreLabel(pct: number | null | undefined): string {
  if (pct == null) return '—';
  if (pct >= 75) return '상위';
  if (pct >= 50) return '중상위';
  if (pct >= 25) return '중하위';
  return '하위';
}

export default function QuantAnalysis({ stockId }: Props) {
  const [factor, setFactor] = useState<QuantFactor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('quant_factors')
        .select('*')
        .eq('stock_id', stockId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setFactor(data as QuantFactor);
      setLoading(false);
    }
    load();
  }, [stockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!factor) {
    return (
      <div className="space-y-6">
        <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            퀀트 팩터 없음
          </h3>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            해당 종목은 퀀트 팩터 집계 대상 (시총 TOP 200) 에 포함되지 않았습니다.
          </p>
        </div>
        <DisclaimerBanner />
      </div>
    );
  }

  const radarData = [
    { axis: 'Value', score: factor.value_pct ?? 0 },
    { axis: 'Momentum', score: factor.momentum_pct ?? 0 },
    { axis: 'Quality', score: factor.quality_pct ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* 종합 점수 헤더 */}
      <div className="bg-gradient-to-r from-dark-700 to-dark-800 rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-text-secondary mb-1 flex items-center gap-2">
              <Award className="w-4 h-4" />
              종합 퀀트 스코어 (TOP {factor.universe_size} 대비)
            </p>
            <p className={`text-5xl font-bold font-mono-price ${scoreColor(factor.composite_pct)}`}>
              {formatNum(factor.composite_pct, 1)}
              <span className="text-xl text-text-secondary ml-2">/ 100</span>
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {scoreLabel(factor.composite_pct)} · 섹터 내 {formatNum(factor.sector_rank_pct, 1)}점
            </p>
          </div>
          <div className="text-xs text-text-secondary/70 text-right">
            <p>집계일 {factor.snapshot_date}</p>
            <p>가중: Value 35% · Momentum 30% · Quality 35%</p>
          </div>
        </div>
      </div>

      {/* 3개 팩터 점수 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Value', pct: factor.value_pct, icon: Target, desc: 'PER·PBR 역순위' },
          { label: 'Momentum', pct: factor.momentum_pct, icon: TrendingUp, desc: '3M·6M·12M 수익률' },
          { label: 'Quality', pct: factor.quality_pct, icon: Award, desc: 'ROE·영업이익률' },
        ].map(m => (
          <div key={m.label} className="bg-dark-700 rounded-lg p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <m.icon className="w-5 h-5 text-accent" />
              <p className="text-sm font-bold text-text-primary">{m.label}</p>
            </div>
            <p className={`text-3xl font-bold font-mono-price ${scoreColor(m.pct)}`}>
              {formatNum(m.pct, 1)}
              <span className="text-sm text-text-secondary ml-1">/ 100</span>
            </p>
            <p className="text-xs text-text-secondary mt-1">{m.desc}</p>
            <p className={`text-xs font-bold mt-2 ${scoreColor(m.pct)}`}>
              {scoreLabel(m.pct)}
            </p>
          </div>
        ))}
      </div>

      {/* 레이더 차트 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          팩터 프로필
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#F9FAFB', fontSize: 13 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Radar name="점수" dataKey="score" stroke="#0ABAB5" fill="#0ABAB5" fillOpacity={0.3} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 원시 지표 테이블 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">원시 지표 (퍼센타일 계산 기초)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="py-2 px-3 text-left font-normal">항목</th>
                <th className="py-2 px-3 text-right font-normal">값</th>
                <th className="py-2 px-3 text-right font-normal">해석</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr><td className="py-2 px-3 text-text-primary">PER</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.per, 2, '배')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">낮을수록 저평가</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">PBR</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.pbr, 2, '배')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">낮을수록 저평가</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">ROE</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.roe, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">높을수록 수익성</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">영업이익률</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.operating_margin, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">높을수록 효율성</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">3개월 수익률</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.return_3m, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">—</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">6개월 수익률</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.return_6m, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">—</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">12개월 수익률</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.return_12m, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">—</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary/70 mt-3">
          퍼센타일은 시총 TOP {factor.universe_size} 종목 간 상대 순위. 절대 평가 아님.
        </p>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
```

---

## Part E — 빌드 + 브라우저 검증

```bash
cd ~/Desktop/OTMarketing
npx tsc --noEmit
npx next lint --dir components/analysis
npm run build
npm run dev
```

- http://localhost:3000/stocks/005930/analysis → **퀀트 분석** 탭
- 확인:
  1. 종합 스코어 그라디언트 헤더 (숫자 + 상/중/하 라벨 + 섹터 순위)
  2. Value / Momentum / Quality 3개 카드
  3. 레이더 차트 (3축)
  4. 원시 지표 테이블 7행

---

## Part F — 문서 + 커밋

### F-1. 4개 문서 헤더 오늘 날짜로

### F-2. CHANGELOG.md 최상단

```markdown
## 2026-04-22 — STEP 45: QuantAnalysis 재활성화 (전종목 팩터 집계 완료, 5개 분석 탭 전원 live)
- **Migration**: `supabase/migrations/012_quant_factors.sql` 신규 — quant_factors 테이블
- **Script**: `scripts/seed-quant-factors.py` 신규 — TOP 200 대상 Value/Momentum/Quality 퍼센타일 집계
- **Data**: quant_factors 200행 시딩
- **Component**: `components/analysis/QuantAnalysis.tsx` 스텁(32줄) → 실제 퀀트 컴포넌트(~250줄)
  - 종합 퀀트 스코어 그라디언트 헤더 (0~100, 섹터 내 순위 포함)
  - Value · Momentum · Quality 3개 점수 카드
  - 레이더 차트
  - 원시 지표 테이블 (PER/PBR/ROE/영업이익률/3M·6M·12M 수익률)
- **5개 분석 탭 모두 실데이터 연결 완료** — 가치투자 · 기술적 분석 · 수급 분석 · 배당 분석 · 퀀트 분석
- 다음 방향: 데이터 fresh-cycle (일일 재시딩 스케줄), 커버리지 확대, 해외주식 (US/JP) 지원
```

### F-3. session-context.md + NEXT_SESSION_START.md
STEP 45 완료 기록 + **분석 탭 전원 green** 마일스톤 명시.

### F-4. 커밋 + 푸시
```bash
git add supabase/migrations/012_quant_factors.sql scripts/seed-quant-factors.py components/analysis/QuantAnalysis.tsx CLAUDE.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md docs/STEP_45_COMMAND.md session-context.md
git commit -m "STEP 45: QuantAnalysis 재활성화 — 전종목 팩터 집계, 5개 분석 탭 전원 live"
git push origin main
```

---

## 완료 보고 형식

```
STEP 45 완료. push까지 끝났습니다. 🎉

변경 요약:
- migration 012_quant_factors.sql 신규 (Supabase SQL Editor 실행 완료)
- seed-quant-factors.py 신규 — TOP 200 Value/Momentum/Quality 집계
- quant_factors: 0 → 200행
- QuantAnalysis.tsx: 32줄 스텁 → ~250줄 실제 컴포넌트 (종합 스코어 + 레이더 + 원시 지표)

누계 DB: stocks 2,780 / financials 576 / stock_prices 54,899 / supply_demand 3,000 / dividends 790 / quant_factors 200

5개 분석 탭 상태:
- ✅ 가치투자
- ✅ 기술적 분석
- ✅ 수급 분석
- ✅ 배당 분석
- ✅ 퀀트 분석 ← 이번에 완성

이로써 종목 상세 /analysis 페이지 전체 실데이터 연결 마일스톤 달성.
```

---

## ⚠ Migration 실행 순서 주의
Claude Code 가 자동 실행 못 하는 것: **Part A-2 (Supabase SQL Editor 수동 실행)**
→ Claude Code 는 Part A-1 에서 파일만 생성하고 정지.
→ 사용자가 Supabase Dashboard 에 가서 SQL 붙여넣고 Run.
→ Run 완료 후 Claude Code 가 Part B 이후 이어서 실행.

Claude Code 지시 포인트: **"012_quant_factors.sql 파일을 만든 뒤, 사용자에게 '이 SQL을 Supabase SQL Editor에 복붙해서 실행해주세요' 안내하고 대기. 사용자가 '실행 완료'라고 말하면 Part B 이후 계속 진행."**
