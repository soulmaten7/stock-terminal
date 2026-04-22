#!/usr/bin/env python3
"""
DART 응답 raw 덤프 — IS/CIS/BS 항목명 전수 조사.
실행:
  python3 scripts/debug-dart-sample.py 000660 2024     # SK하이닉스
  python3 scripts/debug-dart-sample.py 207940 2024     # 삼성바이오로직스
"""
import os
import sys
import json
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

symbol = sys.argv[1] if len(sys.argv) > 1 else '000660'
year = sys.argv[2] if len(sys.argv) > 2 else '2024'
reprt = sys.argv[3] if len(sys.argv) > 3 else '11011'

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
cc = sb.table('dart_corp_codes').select('corp_code, corp_name').eq('stock_code', symbol).single().execute().data
if not cc:
    print(f'ERROR: {symbol} corp_code 없음')
    sys.exit(1)

print(f'▶ {cc["corp_name"]} ({symbol}) corp_code={cc["corp_code"]} year={year} reprt={reprt}\n')

r = requests.get(
    'https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json',
    params={
        'crtfc_key': os.getenv('DART_API_KEY'),
        'corp_code': cc['corp_code'],
        'bsns_year': year,
        'reprt_code': reprt,
        'fs_div': 'CFS',
    },
    timeout=15,
)
data = r.json()
print(f'status={data.get("status")} message={data.get("message")}')
print(f'items={len(data.get("list", []))}\n')

# sj_div 별 그룹화
by_sj = {}
for x in data.get('list', []):
    sj = x.get('sj_div', '?')
    by_sj.setdefault(sj, []).append(x)

for sj in ['IS', 'CIS', 'BS', 'CF', 'SCE']:
    rows = by_sj.get(sj, [])
    if not rows:
        continue
    print(f'── {sj} ({len(rows)}건) ──')
    for x in rows[:40]:
        nm = x.get('account_nm', '?')
        aid = x.get('account_id', '?')
        amt = x.get('thstrm_amount', '-')
        print(f'  nm="{nm}"  id="{aid}"  amt={amt}')
    if len(rows) > 40:
        print(f'  ... (+{len(rows)-40})')
    print()

# CFS 가 비어있으면 OFS 로 재시도
if not data.get('list'):
    print('\n▶ CFS 비어있음 — OFS(개별) 로 재시도')
    r2 = requests.get(
        'https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json',
        params={
            'crtfc_key': os.getenv('DART_API_KEY'),
            'corp_code': cc['corp_code'],
            'bsns_year': year,
            'reprt_code': reprt,
            'fs_div': 'OFS',
        },
        timeout=15,
    )
    d2 = r2.json()
    print(f'OFS status={d2.get("status")} items={len(d2.get("list", []))}')
    by_sj2 = {}
    for x in d2.get('list', []):
        sj = x.get('sj_div', '?')
        by_sj2.setdefault(sj, []).append(x)
    for sj in ['IS', 'CIS', 'BS', 'CF', 'SCE']:
        rows = by_sj2.get(sj, [])
        if not rows:
            continue
        print(f'── OFS/{sj} ({len(rows)}건) ──')
        for x in rows[:40]:
            nm = x.get('account_nm', '?')
            aid = x.get('account_id', '?')
            amt = x.get('thstrm_amount', '-')
            print(f'  nm="{nm}"  id="{aid}"  amt={amt}')
        if len(rows) > 40:
            print(f'  ... (+{len(rows)-40})')
        print()
