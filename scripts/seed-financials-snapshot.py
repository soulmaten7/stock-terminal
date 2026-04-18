#!/usr/bin/env python3
"""
KIS API inquire-price → financials 테이블 upsert.
- PER/PBR/EPS/BPS 를 KIS FHKST01010100 엔드포인트에서 수집
- 대상: stocks 테이블 KR 시총 TOP 200 + watchlist 등록 종목 + 005930
- period_type='annual', period_date=오늘 (추후 DART 실재무가 덮어쓸 수 있도록)
"""
import os
import sys
import time
import warnings
from datetime import date

warnings.filterwarnings('ignore')

import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

SB_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SB_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
KIS_KEY = os.getenv('KIS_APP_KEY')
KIS_SECRET = os.getenv('KIS_APP_SECRET')
KIS_BASE = os.getenv('KIS_BASE_URL', 'https://openapi.koreainvestment.com:9443')

for var, val in [('SUPABASE_URL', SB_URL), ('SUPABASE_KEY', SB_KEY),
                 ('KIS_APP_KEY', KIS_KEY), ('KIS_APP_SECRET', KIS_SECRET)]:
    if not val:
        print(f'ERROR: {var} 누락')
        sys.exit(1)

sb = create_client(SB_URL, SB_KEY)
TODAY = date.today().isoformat()
TOP_N = 200
RATE_LIMIT_SEC = 0.12  # KIS 20req/s 제한 → 120ms 여유


# ── 1. KIS 액세스 토큰 ───────────────────────────────────────────────────────
print('[1/4] KIS 액세스 토큰 발급 중...')
token = None
for attempt in range(5):
    r = requests.post(
        f'{KIS_BASE}/oauth2/tokenP',
        headers={'Content-Type': 'application/json; charset=UTF-8'},
        json={
            'grant_type': 'client_credentials',
            'appkey': KIS_KEY,
            'appsecret': KIS_SECRET,
        },
        timeout=15,
    )
    if r.status_code == 200 and 'access_token' in r.json():
        token = r.json()['access_token']
        break
    err = r.json().get('error_description', r.text)
    print(f'  토큰 발급 실패 ({attempt+1}/5): {err} → 65초 대기')
    time.sleep(65)

if not token:
    print('ERROR: KIS 토큰 발급 5회 실패')
    sys.exit(1)
print('  토큰 발급 완료')

KIS_HEADERS = {
    'Content-Type': 'application/json',
    'authorization': f'Bearer {token}',
    'appkey': KIS_KEY,
    'appsecret': KIS_SECRET,
    'tr_id': 'FHKST01010100',
}


def get_kis_fundamentals(symbol: str):
    """KIS inquire-price → (per, pbr, eps, bps) or None"""
    try:
        resp = requests.get(
            f'{KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-price',
            headers=KIS_HEADERS,
            params={'FID_COND_MRKT_DIV_CODE': 'J', 'FID_INPUT_ISCD': symbol},
            timeout=10,
        )
        if resp.status_code != 200:
            return None
        o = resp.json().get('output', {})
        def sf(v):
            try:
                f = float(v)
                return f if f == f and f != 0.0 else None
            except Exception:
                return None
        return sf(o.get('per')), sf(o.get('pbr')), sf(o.get('eps')), sf(o.get('bps'))
    except Exception:
        return None


# ── 2. 대상 종목 선정 ────────────────────────────────────────────────────────
print(f'[2/4] 대상 종목 선정 (시총 TOP {TOP_N} + watchlist + 005930)')

top_rows = (
    sb.table('stocks')
    .select('id, symbol, market')
    .eq('country', 'KR')
    .not_.is_('market_cap', 'null')
    .order('market_cap', desc=True)
    .limit(TOP_N)
    .execute()
    .data or []
)
targets = {(r['symbol'], r['market']): r['id'] for r in top_rows}

# watchlist
wl = sb.table('watchlist').select('symbol, market').eq('country', 'KR').execute().data or []
for w in wl:
    sym, mkt = w['symbol'], w['market']
    if (sym, mkt) not in targets:
        rows = (
            sb.table('stocks')
            .select('id')
            .eq('symbol', sym)
            .eq('market', mkt)
            .limit(1)
            .execute()
            .data or []
        )
        if rows:
            targets[(sym, mkt)] = rows[0]['id']

# 005930 필수
r005_rows = (
    sb.table('stocks')
    .select('id')
    .eq('symbol', '005930')
    .eq('market', 'KOSPI')
    .limit(1)
    .execute()
    .data or []
)
r005 = r005_rows[0] if r005_rows else None
if r005:
    targets[('005930', 'KOSPI')] = r005['id']

print(f'  대상 {len(targets)}종목')


# ── 3. KIS 조회 루프 ─────────────────────────────────────────────────────────
print('[3/4] KIS API 에서 PER/PBR/EPS/BPS 수집 중...')
financial_rows = []
failed = []
processed = 0

for (symbol, market), stock_id in targets.items():
    processed += 1
    if processed % 20 == 0:
        print(f'  진행: {processed} / {len(targets)}')

    result = get_kis_fundamentals(symbol)
    time.sleep(RATE_LIMIT_SEC)

    if result is None:
        failed.append(symbol)
        continue

    per, pbr, eps, bps = result
    if all(v is None for v in [per, pbr, eps, bps]):
        continue

    financial_rows.append({
        'stock_id': stock_id,
        'period_type': 'annual',
        'period_date': TODAY,
        'per': per,
        'pbr': pbr,
        'eps': eps,
        'bps': bps,
        'source': 'KIS:inquire-price(snapshot)',
    })

print(f'  수집 완료: {len(financial_rows)}건, 실패: {len(failed)}건')
if failed[:5]:
    print(f'  실패 일부: {failed[:5]}')


# ── 4. 배치 upsert ───────────────────────────────────────────────────────────
print(f'[4/4] financials 총 {len(financial_rows)}건 upsert 시작')
BATCH = 500
upserted = 0
for i in range(0, len(financial_rows), BATCH):
    chunk = financial_rows[i:i + BATCH]
    sb.table('financials').upsert(chunk, on_conflict='stock_id,period_type,period_date').execute()
    upserted += len(chunk)
    print(f'  financials upserted: {upserted}건')

count = sb.table('financials').select('id', count='exact').execute().count
print(f'\n[완료] financials 테이블 총 {count}건')
