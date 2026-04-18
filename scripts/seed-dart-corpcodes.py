"""
DART CORPCODE.xml 다운로드 → Supabase 'dart_corp_codes' 테이블 적재.
실행 전제:
  - .env.local 에 DART_API_KEY 설정됨
  - .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정됨
실행:
  python3 scripts/seed-dart-corpcodes.py
"""
import os
import io
import zipfile
import requests
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')
API_KEY = os.getenv('DART_API_KEY')
SB_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SB_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not API_KEY:
    raise SystemExit('DART_API_KEY 누락 — https://opendart.fss.or.kr/ 에서 발급 후 .env.local 에 추가')
if not SB_URL or not SB_KEY:
    raise SystemExit('Supabase 환경변수 누락')

sb = create_client(SB_URL, SB_KEY)

print('DART CORPCODE.xml 다운로드 중...')
url = f'https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key={API_KEY}'
r = requests.get(url, timeout=30)
r.raise_for_status()

with zipfile.ZipFile(io.BytesIO(r.content)) as z:
    with z.open('CORPCODE.xml') as f:
        tree = ET.parse(f)

rows = []
for corp in tree.getroot().iter('list'):
    stock_code = (corp.findtext('stock_code') or '').strip()
    if not stock_code:
        continue
    rows.append({
        'corp_code': corp.findtext('corp_code'),
        'corp_name': corp.findtext('corp_name'),
        'stock_code': stock_code,
    })

print(f'상장 종목 {len(rows)}건 적재 중...')
CHUNK = 500
for i in range(0, len(rows), CHUNK):
    sb.table('dart_corp_codes').upsert(rows[i:i + CHUNK], on_conflict='stock_code').execute()
    print(f'  {min(i + CHUNK, len(rows))} / {len(rows)}')

print('완료')
