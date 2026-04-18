#!/usr/bin/env python3
"""
FDR DataReader 로 주요 종목의 1년치 일봉 → stock_prices 테이블 upsert.
대상 선정:
  - watchlist 에 등록된 모든 종목
  - 시가총액 TOP 200 (KR)
  - 005930 (삼성전자) 필수 포함
"""
import os
import sys
import warnings
import time
from datetime import date, timedelta

warnings.filterwarnings('ignore')

import FinanceDataReader as fdr
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')
SB_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SB_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
if not SB_URL or not SB_KEY:
    print('ERROR: SUPABASE 환경변수 누락')
    sys.exit(1)

sb = create_client(SB_URL, SB_KEY)

TOP_N = 200
END_DATE = date.today()
START_DATE = END_DATE - timedelta(days=400)  # 달력일 기준 1년 이상 여유

MAX_RETRIES = 3
RETRY_SLEEP = 35  # rate limit 대기

# 1. 대상 종목 선정
print(f'[1/3] 대상 종목 선정 (watchlist + 시총 TOP {TOP_N} + 005930)')
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

# watchlist 종목 추가
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

# 005930 (KOSPI) 반드시 포함
r005 = (
    sb.table('stocks')
    .select('id')
    .eq('symbol', '005930')
    .eq('market', 'KOSPI')
    .limit(1)
    .execute()
    .data or []
)
if r005:
    targets[('005930', 'KOSPI')] = r005[0]['id']

print(f'  대상 {len(targets)}종목')


# 2. FDR DataReader 루프
def safe_int(v):
    try:
        if v is None:
            return None
        return int(v)
    except Exception:
        return None


def safe_float(v):
    try:
        if v is None:
            return None
        f = float(v)
        if f != f:
            return None
        return f
    except Exception:
        return None


def fetch_with_retry(symbol):
    for attempt in range(MAX_RETRIES):
        try:
            df = fdr.DataReader(symbol, START_DATE, END_DATE)
            return df
        except Exception as e:
            err_str = str(e).lower()
            if 'rate' in err_str or '429' in err_str or 'json' in err_str or 'decode' in err_str:
                print(f'    rate limit({symbol}), {RETRY_SLEEP}초 대기 ({attempt+1}/{MAX_RETRIES})')
                time.sleep(RETRY_SLEEP)
            else:
                return None
    return None


all_rows = []
failed = []
processed = 0
total = len(targets)

print(f'[2/3] FDR DataReader 1년 일봉 수집 중 ({START_DATE} ~ {END_DATE})')
for (symbol, market), stock_id in targets.items():
    processed += 1
    if processed % 20 == 0:
        print(f'  진행: {processed} / {total}')

    df = fetch_with_retry(symbol)
    if df is None or len(df) == 0:
        failed.append(symbol)
        time.sleep(0.1)
        continue

    for idx, row in df.iterrows():
        trade_date = idx.date().isoformat() if hasattr(idx, 'date') else str(idx)[:10]
        open_p = safe_float(row.get('Open'))
        high = safe_float(row.get('High'))
        low = safe_float(row.get('Low'))
        close = safe_float(row.get('Close'))
        volume = safe_int(row.get('Volume'))
        change = safe_float(row.get('Change'))
        change_pct = safe_float(change * 100) if change is not None else None
        if close is None:
            continue
        all_rows.append({
            'stock_id': stock_id,
            'trade_date': trade_date,
            'open': open_p,
            'high': high,
            'low': low,
            'close': close,
            'volume': volume,
            'change': None,
            'change_percent': change_pct,
        })
    time.sleep(0.1)

print(f'[2/3] 행 수집 {len(all_rows)}건, 실패 {len(failed)}건')
if failed[:10]:
    print(f'  실패 종목 일부: {failed[:10]}')

# 3. 배치 upsert
print('[3/3] stock_prices upsert 시작')
BATCH = 2000
upserted = 0
for i in range(0, len(all_rows), BATCH):
    chunk = all_rows[i:i + BATCH]
    sb.table('stock_prices').upsert(chunk, on_conflict='stock_id,trade_date').execute()
    upserted += len(chunk)
    print(f'  stock_prices upserted: {upserted}건')

count = sb.table('stock_prices').select('id', count='exact').execute().count
print(f'\n[완료] stock_prices 테이블 총 {count}건')
