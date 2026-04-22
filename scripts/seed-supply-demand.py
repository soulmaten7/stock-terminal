#!/usr/bin/env python3
"""
KIS API FHKST01010900 (종목별 투자자별 매매동향) → supply_demand 테이블 upsert.
- 한 번 호출에 최근 ~60영업일치 일별 외국인/기관/개인 순매수 반환
- 대상: 시총 TOP 100 + watchlist + 005930
"""
import os
import sys
import time
import warnings
from datetime import datetime

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
TOP_N = int(os.getenv('TOP_N', '100'))
RATE_LIMIT_SEC = float(os.getenv('KIS_SLEEP', '0.15'))


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
    'tr_id': 'FHKST01010900',
}


def safe_int(v):
    try:
        if v is None or v == '':
            return None
        return int(float(v))
    except Exception:
        return None


def get_investor_flow(symbol: str):
    """KIS FHKST01010900 → list of daily investor flow rows (~60 days)"""
    try:
        resp = requests.get(
            f'{KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-investor',
            headers=KIS_HEADERS,
            params={'FID_COND_MRKT_DIV_CODE': 'J', 'FID_INPUT_ISCD': symbol},
            timeout=15,
        )
        if resp.status_code != 200:
            return None
        return resp.json().get('output', []) or []
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
if r005_rows:
    targets[('005930', 'KOSPI')] = r005_rows[0]['id']

print(f'  대상 {len(targets)}종목')


# ── 3. KIS 수급 조회 루프 ────────────────────────────────────────────────────
print('[3/4] KIS FHKST01010900 수급 수집 중...')
supply_rows = []
failed = []
processed = 0
total = len(targets)

for (symbol, market), stock_id in targets.items():
    processed += 1
    if processed % 20 == 0:
        print(f'  진행: {processed} / {total}')

    rows = get_investor_flow(symbol)
    time.sleep(RATE_LIMIT_SEC)

    if rows is None:
        failed.append(symbol)
        continue

    for r in rows:
        raw_date = r.get('stck_bsop_date', '')
        if not raw_date or len(raw_date) != 8:
            continue
        try:
            trade_date = datetime.strptime(raw_date, '%Y%m%d').date().isoformat()
        except Exception:
            continue

        supply_rows.append({
            'stock_id': stock_id,
            'trade_date': trade_date,
            'foreign_net': safe_int(r.get('frgn_ntby_qty')),
            'institution_net': safe_int(r.get('orgn_ntby_qty')),
            'individual_net': safe_int(r.get('prsn_ntby_qty')),
        })

print(f'  수집 완료: {len(supply_rows)}행, 실패 {len(failed)}종목')
if failed[:5]:
    print(f'  실패 일부: {failed[:5]}')


# ── 4. 배치 upsert ───────────────────────────────────────────────────────────
print(f'[4/4] supply_demand 총 {len(supply_rows)}행 upsert 시작')
BATCH = 1000
upserted = 0
for i in range(0, len(supply_rows), BATCH):
    chunk = supply_rows[i:i + BATCH]
    sb.table('supply_demand').upsert(chunk, on_conflict='stock_id,trade_date').execute()
    upserted += len(chunk)
    print(f'  supply_demand upserted: {upserted}행')

count = sb.table('supply_demand').select('id', count='exact').execute().count
print(f'\n[완료] supply_demand 테이블 총 {count}행')
