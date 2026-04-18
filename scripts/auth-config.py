# 사용법:
#   python3 scripts/auth-config.py get            # 전체 auth 설정 조회
#   python3 scripts/auth-config.py get.providers  # provider / site_url 핵심만
#   python3 scripts/auth-config.py patch <json>   # PATCH body 로 부분 업데이트
"""
Supabase Management API 로 /config/auth 조회 + 패치.
"""
import os, sys, json, requests
from dotenv import load_dotenv

load_dotenv('.env.local')
TOKEN = os.getenv('SUPABASE_ACCESS_TOKEN')
REF   = os.getenv('SUPABASE_PROJECT_REF')
if not TOKEN or not REF:
    print('ERROR: SUPABASE_ACCESS_TOKEN 또는 SUPABASE_PROJECT_REF 누락', file=sys.stderr)
    sys.exit(1)

URL = f'https://api.supabase.com/v1/projects/{REF}/config/auth'
HEADERS = {'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}

mode = sys.argv[1] if len(sys.argv) > 1 else 'get'

if mode == 'get':
    r = requests.get(URL, headers=HEADERS, timeout=15)
    r.raise_for_status()
    print(json.dumps(r.json(), ensure_ascii=False, indent=2))
elif mode == 'get.providers':
    r = requests.get(URL, headers=HEADERS, timeout=15)
    r.raise_for_status()
    data = r.json()
    filt = {k: v for k, v in data.items() if k.startswith('external_') or k in ('site_url','uri_allow_list','disable_signup','mailer_autoconfirm')}
    print(json.dumps(filt, ensure_ascii=False, indent=2))
elif mode == 'patch':
    body = json.loads(sys.argv[2])
    r = requests.patch(URL, headers=HEADERS, json=body, timeout=15)
    if not r.ok:
        print(f'ERROR: HTTP {r.status_code}', file=sys.stderr)
        try:
            print(json.dumps(r.json(), ensure_ascii=False, indent=2), file=sys.stderr)
        except Exception:
            print(r.text, file=sys.stderr)
        sys.exit(1)
    print(json.dumps(r.json(), ensure_ascii=False, indent=2))
else:
    print(f'Unknown mode: {mode}', file=sys.stderr); sys.exit(1)
