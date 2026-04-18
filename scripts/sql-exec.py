# 사용법: echo "SQL" | python3 scripts/sql-exec.py  OR  python3 scripts/sql-exec.py path/to/file.sql
"""
Supabase Management API 를 통해 임의 SQL 실행.
DDL 포함 모든 SQL 가능 (SUPABASE_ACCESS_TOKEN = PAT 필요).
"""
import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv('.env.local')

TOKEN = os.getenv('SUPABASE_ACCESS_TOKEN')
REF   = os.getenv('SUPABASE_PROJECT_REF')

if not TOKEN or not REF:
    print('ERROR: SUPABASE_ACCESS_TOKEN 또는 SUPABASE_PROJECT_REF 누락', file=sys.stderr)
    sys.exit(1)

# SQL 소스 결정: 인자(파일 경로) > stdin
if len(sys.argv) > 1:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        query = f.read()
else:
    query = sys.stdin.read()

query = query.strip()
if not query:
    print('ERROR: 실행할 SQL 이 비어있습니다', file=sys.stderr)
    sys.exit(1)

resp = requests.post(
    f'https://api.supabase.com/v1/projects/{REF}/database/query',
    headers={
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json',
    },
    json={'query': query},
    timeout=30,
)

if not resp.ok:
    print(f'ERROR: HTTP {resp.status_code}', file=sys.stderr)
    try:
        print(json.dumps(resp.json(), ensure_ascii=False, indent=2), file=sys.stderr)
    except Exception:
        print(resp.text, file=sys.stderr)
    sys.exit(1)

try:
    result = resp.json()
    print(json.dumps(result, ensure_ascii=False, indent=2))
except Exception:
    print(resp.text)
