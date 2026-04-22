#!/usr/bin/env python3
"""
DART alotMatter.json → dividends 테이블 upsert.
- 시총 TOP 200 + 005930 대상
- 2024, 2021 2회 호출로 2019~2024 (6년) 커버 (각 호출 당기/전기/전전기 포함)
- 보통주 배당금·배당수익률·배당성향 추출

환경변수:
  TOP_N  (기본 200)
  CALL_YEARS  (기본 '2024,2021')
"""
import os
import sys
import time
import warnings
warnings.filterwarnings('ignore')

import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')
SB_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SB_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
DART_KEY = os.getenv('DART_API_KEY')

for var, val in [('SUPABASE_URL', SB_URL), ('SUPABASE_KEY', SB_KEY), ('DART_API_KEY', DART_KEY)]:
    if not val:
        print(f'ERROR: {var} 누락')
        sys.exit(1)

sb = create_client(SB_URL, SB_KEY)

TOP_N = int(os.getenv('TOP_N', '200'))
CALL_YEARS = [int(y.strip()) for y in os.getenv('CALL_YEARS', '2024,2021').split(',')]
RATE_LIMIT_SEC = 0.15

DART_BASE = 'https://opendart.fss.or.kr/api'


def parse_float(raw):
    if raw is None or raw == '' or raw == '-':
        return None
    try:
        s = str(raw).replace(',', '').replace(' ', '')
        if s in ('', '-', 'N/A'):
            return None
        return float(s)
    except (ValueError, AttributeError):
        return None


def matches_se(se_val: str, *keywords) -> bool:
    if not se_val:
        return False
    normalized = se_val.replace(' ', '').replace('(', '').replace(')', '')
    for kw in keywords:
        kn = kw.replace(' ', '').replace('(', '').replace(')', '')
        if kn in normalized:
            return True
    return False


def extract_for_year(items, year_key, *keywords, prefer_common=True):
    if prefer_common:
        for x in items:
            if x.get('stock_knd') != '보통주':
                continue
            if matches_se(x.get('se', ''), *keywords):
                v = parse_float(x.get(year_key))
                if v is not None:
                    return v
    for x in items:
        if matches_se(x.get('se', ''), *keywords):
            v = parse_float(x.get(year_key))
            if v is not None:
                return v
    return None


def fetch_alot_matter(corp_code: str, year: int):
    try:
        r = requests.get(
            f'{DART_BASE}/alotMatter.json',
            params={
                'crtfc_key': DART_KEY,
                'corp_code': corp_code,
                'bsns_year': str(year),
                'reprt_code': '11011',
            },
            timeout=15,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        if data.get('status') != '000':
            return None
        return data.get('list') or []
    except Exception:
        return None


# ── 1. 대상 종목 ─────────────────────────────────────────────────
print(f'[1/3] 대상 종목: 시총 TOP {TOP_N}')
top = (
    sb.table('stocks')
    .select('id, symbol, name_ko')
    .eq('country', 'KR')
    .not_.is_('market_cap', 'null')
    .order('market_cap', desc=True)
    .limit(TOP_N)
    .execute().data or []
)
print(f'  {len(top)}종목')


# ── 2. corp_code 매핑 ────────────────────────────────────────────
print('[2/3] DART corp_code 매핑')
symbols = [s['symbol'] for s in top]
cc_data = (
    sb.table('dart_corp_codes')
    .select('stock_code, corp_code')
    .in_('stock_code', symbols)
    .execute().data or []
)
cc_map = {r['stock_code']: r['corp_code'] for r in cc_data}
print(f'  매핑 {len(cc_map)}/{len(symbols)}')


# ── 3. DART alotMatter 수집 ──────────────────────────────────────
print(f'[3/3] alotMatter 수집 (호출 연도: {CALL_YEARS}, 각 호출 3년치 반환)')
rows_by_key = {}
no_data = 0

for stock in top:
    corp_code = cc_map.get(stock['symbol'])
    if not corp_code:
        continue

    for call_year in CALL_YEARS:
        time.sleep(RATE_LIMIT_SEC)
        items = fetch_alot_matter(corp_code, call_year)
        if items is None or not items:
            no_data += 1
            continue

        for offset, key in [(0, 'thstrm'), (-1, 'frmtrm'), (-2, 'lwfr')]:
            fiscal_year = call_year + offset
            dps = extract_for_year(items, key, '주당현금배당금', '주당 현금배당금')
            yield_pct = extract_for_year(items, key, '현금배당수익률', '시가배당율', '시가배당률')
            payout = extract_for_year(items, key, '현금배당성향', '배당성향')

            if dps is None and yield_pct is None and payout is None:
                continue

            row_key = (stock['id'], fiscal_year)
            existing = rows_by_key.get(row_key)
            if existing is None or (
                (dps is not None and existing.get('dividend_per_share') is None)
                or (yield_pct is not None and existing.get('dividend_yield') is None)
                or (payout is not None and existing.get('payout_ratio') is None)
            ):
                merged = existing or {
                    'stock_id': stock['id'],
                    'fiscal_year': fiscal_year,
                    'dividend_per_share': None,
                    'dividend_yield': None,
                    'payout_ratio': None,
                }
                if dps is not None:
                    merged['dividend_per_share'] = dps
                if yield_pct is not None:
                    merged['dividend_yield'] = yield_pct
                if payout is not None:
                    merged['payout_ratio'] = payout
                rows_by_key[row_key] = merged

rows = list(rows_by_key.values())
print(f'\n[수집] {len(rows)}행 (no-data 호출 {no_data}회)')


# ── 4. upsert ────────────────────────────────────────────────────
BATCH = 500
for i in range(0, len(rows), BATCH):
    sb.table('dividends').upsert(
        rows[i:i+BATCH],
        on_conflict='stock_id,fiscal_year',
    ).execute()
    print(f'  dividends upserted: {min(i+BATCH, len(rows))} / {len(rows)}')

total = sb.table('dividends').select('id', count='exact').execute().count
print(f'\n[완료] dividends 테이블 총 {total}행')
