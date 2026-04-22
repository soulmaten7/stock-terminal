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
from datetime import date
from collections import defaultdict

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
latest_fin = {}
for r in fin_data:
    sid = r['stock_id']
    if sid not in latest_fin:
        latest_fin[sid] = r
    else:
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
price_map = defaultdict(list)

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
        'return_3m': compute_return(series, 60),
        'return_6m': compute_return(series, 120),
        'return_12m': compute_return(series, 240),
    }
print(f'  {len(returns_by_stock)}종목 수익률 계산 완료')


# ── 4. 퍼센타일 산출 ──────────────────────────────────────────────
print('[4/5] Value / Momentum / Quality / Composite 퍼센타일 산출')

per_pairs = [(sid, latest_fin.get(sid, {}).get('per')) for sid in stock_ids]
pbr_pairs = [(sid, latest_fin.get(sid, {}).get('pbr')) for sid in stock_ids]
per_pct = percentile_rank(per_pairs, reverse=True)
pbr_pct = percentile_rank(pbr_pairs, reverse=True)

r3m_pairs = [(sid, returns_by_stock.get(sid, {}).get('return_3m')) for sid in stock_ids]
r6m_pairs = [(sid, returns_by_stock.get(sid, {}).get('return_6m')) for sid in stock_ids]
r12m_pairs = [(sid, returns_by_stock.get(sid, {}).get('return_12m')) for sid in stock_ids]
r3m_pct = percentile_rank(r3m_pairs)
r6m_pct = percentile_rank(r6m_pairs)
r12m_pct = percentile_rank(r12m_pairs)

roe_pairs = [(sid, latest_fin.get(sid, {}).get('roe')) for sid in stock_ids]
om_pairs = [(sid, latest_fin.get(sid, {}).get('operating_margin')) for sid in stock_ids]
roe_pct = percentile_rank(roe_pairs)
om_pct = percentile_rank(om_pairs)

sector_groups = defaultdict(list)
for sid in stock_ids:
    sector = top_ids.get(sid, {}).get('sector')
    sector_groups[sector].append(sid)


# ── 5. Assemble rows + upsert ────────────────────────────────────
print('[5/5] quant_factors 조립 + upsert')
rows = []
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

for sector, sids in sector_groups.items():
    sector_composites = [(sid, composite_by_stock.get(sid)) for sid in sids]
    sector_pct = percentile_rank(sector_composites)
    for row in rows:
        if row['stock_id'] in sector_pct:
            row['sector_rank_pct'] = sector_pct[row['stock_id']]

BATCH = 500
upserted = 0
for i in range(0, len(rows), BATCH):
    chunk = rows[i:i+BATCH]
    sb.table('quant_factors').upsert(chunk, on_conflict='stock_id,snapshot_date').execute()
    upserted += len(chunk)
    print(f'  quant_factors upserted: {upserted}')

total = sb.table('quant_factors').select('id', count='exact').execute().count
print(f'\n[완료] quant_factors 테이블 총 {total}행')
