#!/usr/bin/env python3
"""
DART OpenAPI → financials 테이블 (매출·영업이익·순이익 + BS 3종).
lib/dart-financial.ts 의 로직을 Python 으로 재구현 + 재무상태표(BS) 항목 추가.

환경변수:
  TOP_N  (기본 10) — stocks 시총 TOP N 대상
  YEARS  (기본 '2023,2024') — 수집 연도 콤마 구분
  REPRT_CODE (기본 '11011') — 11011=사업보고서(연간), 11014=3Q, 11012=반기, 11013=1Q

실행:
  python3 scripts/seed-dart-financials.py                 # 기본 TOP 10 × 2023,2024 연간
  TOP_N=100 python3 scripts/seed-dart-financials.py       # TOP 100 으로 확장
  YEARS='2024' python3 scripts/seed-dart-financials.py    # 2024년만
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

TOP_N = int(os.getenv('TOP_N', '10'))
YEARS = [int(y.strip()) for y in os.getenv('YEARS', '2023,2024').split(',')]
REPRT_CODE = os.getenv('REPRT_CODE', '11011')
RATE_LIMIT_SEC = 0.15  # DART 공식 초당 10건 제한 → 150ms 여유

REPRT_META = {
    '11011': ('annual', '12-31'),
    '11014': ('quarterly', '09-30'),
    '11012': ('quarterly', '06-30'),
    '11013': ('quarterly', '03-31'),
}
if REPRT_CODE not in REPRT_META:
    print(f'ERROR: 지원 안되는 REPRT_CODE: {REPRT_CODE}')
    sys.exit(1)
PERIOD_TYPE, PERIOD_MMDD = REPRT_META[REPRT_CODE]

DART_BASE = 'https://opendart.fss.or.kr/api'


def parse_amount(raw):
    if not raw:
        return None
    try:
        return int(str(raw).replace(',', '').replace(' ', ''))
    except (ValueError, AttributeError):
        return None


def find_amount(items, sj_div, *keywords):
    """sj_div (IS/BS) 카테고리 안에서 account_nm 또는 account_id 매칭."""
    for kw in keywords:
        for x in items:
            if x.get('sj_div') != sj_div:
                continue
            if x.get('account_nm') == kw or (kw in (x.get('account_id') or '')):
                v = parse_amount(x.get('thstrm_amount'))
                if v is None:
                    v = parse_amount(x.get('frmtrm_amount'))
                if v is not None:
                    return v
    return None


def fetch_dart_financial(corp_code, year):
    try:
        r = requests.get(
            f'{DART_BASE}/fnlttSinglAcntAll.json',
            params={
                'crtfc_key': DART_KEY,
                'corp_code': corp_code,
                'bsns_year': str(year),
                'reprt_code': REPRT_CODE,
                'fs_div': 'CFS',
            },
            timeout=15,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        if data.get('status') != '000':
            return None
        items = data.get('list', [])
        if not items:
            return None

        return {
            'revenue': find_amount(items, 'IS', '매출액', 'ifrs-full_Revenue', '수익(매출액)'),
            'operating_income': find_amount(items, 'IS', '영업이익', 'dart_OperatingIncomeLoss', '영업이익(손실)'),
            'net_income': find_amount(items, 'IS', '당기순이익', 'ifrs-full_ProfitLoss', '당기순이익(손실)'),
            'total_assets': find_amount(items, 'BS', '자산총계', 'ifrs-full_Assets'),
            'total_liabilities': find_amount(items, 'BS', '부채총계', 'ifrs-full_Liabilities'),
            'total_equity': find_amount(items, 'BS', '자본총계', 'ifrs-full_Equity'),
        }
    except Exception as e:
        print(f'  EXC {e}')
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
if not top:
    print('ERROR: 대상 0건. stocks 시딩 확인.')
    sys.exit(1)
print(f'  {len(top)}종목 (예: {top[0]["name_ko"]} → {top[-1]["name_ko"]})')


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
missing = [s for s in symbols if s not in cc_map]
if missing:
    print(f'  WARN corp_code 누락 {len(missing)}건: {missing[:5]}')
print(f'  매핑 {len(cc_map)}/{len(symbols)} 완료')


# ── 3. DART 수집 ─────────────────────────────────────────────────
print(f'[3/3] DART 재무제표 수집 (연도: {YEARS}, reprt: {REPRT_CODE} / {PERIOD_TYPE})')
rows = []
skipped = []

for stock in top:
    corp_code = cc_map.get(stock['symbol'])
    if not corp_code:
        skipped.append((stock['symbol'], 'no-corp-code'))
        continue
    for year in YEARS:
        time.sleep(RATE_LIMIT_SEC)
        fin = fetch_dart_financial(corp_code, year)
        if not fin:
            skipped.append((f'{stock["symbol"]}_{year}', 'no-data'))
            continue

        rev = fin['revenue']
        op = fin['operating_income']
        ni = fin['net_income']
        eq = fin['total_equity']
        liab = fin['total_liabilities']

        op_margin = round(op / rev * 100, 2) if (rev and op is not None and rev != 0) else None
        net_margin = round(ni / rev * 100, 2) if (rev and ni is not None and rev != 0) else None
        debt_ratio = round(liab / eq * 100, 2) if (eq and liab is not None and eq != 0) else None

        rows.append({
            'stock_id': stock['id'],
            'period_type': PERIOD_TYPE,
            'period_date': f'{year}-{PERIOD_MMDD}',
            'revenue': rev,
            'operating_income': op,
            'net_income': ni,
            'total_assets': fin['total_assets'],
            'total_liabilities': liab,
            'total_equity': eq,
            'operating_margin': op_margin,
            'net_margin': net_margin,
            'debt_ratio': debt_ratio,
            'source': f'DART:fnlttSinglAcntAll:{REPRT_CODE}',
        })
        print(f'  OK {stock["name_ko"]:<15} {year} rev={rev} op={op} ni={ni}')


# ── 4. upsert ────────────────────────────────────────────────────
print(f'\n[upsert] {len(rows)}건 (skip {len(skipped)}건)')
if skipped[:5]:
    print(f'  skipped 일부: {skipped[:5]}')

BATCH = 500
for i in range(0, len(rows), BATCH):
    sb.table('financials').upsert(
        rows[i:i+BATCH],
        on_conflict='stock_id,period_type,period_date',
    ).execute()
    print(f'  upserted {min(i+BATCH, len(rows))} / {len(rows)}')

total = sb.table('financials').select('id', count='exact').execute().count
print(f'\n[완료] financials 테이블 총 {total}건')
