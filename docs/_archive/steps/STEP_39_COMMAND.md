# STEP 39 — DART 파서 보완 (4종목 null 해결) + TOP 100 확장

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model opus
```
🔴 **Opus 권장**: DART 원본 응답 스키마 해독 후 파서 개선이 필요 — Cowork 가 미리 예측할 수 없는 패턴을 Claude Code 가 직접 판단해야 함.

## 목표
STEP 38 에서 null 처리된 4종목(SK하이닉스 · 한화에어로스페이스 · 삼성바이오로직스 · HD현대중공업) 을 잡고, 그 보완을 바탕으로 TOP 100 으로 배치 확장.

## 전제 상태
- 이전 커밋: `f73406d` (STEP 38 DART 시범 배치)
- `financials` 테이블: KIS 스냅샷 383 + DART 연간 18 = 누계 401건
- `scripts/seed-dart-financials.py` 존재 (TOP_N/YEARS/REPRT_CODE 환경변수 지원)
- 4종목은 IS 항목 매칭 실패로 모든 필드 null — `source='DART:fnlttSinglAcntAll:11011'` 레코드가 아예 안 들어감

---

## Part A — 진단: SK하이닉스 raw 응답 덤프

### A-1. 디버깅 스크립트 작성
`scripts/debug-dart-sample.py` 파일 생성:

```python
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
    for x in rows[:40]:  # 상위 40건만
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
```

### A-2. 4종목 전수 덤프 실행
```bash
python3 scripts/debug-dart-sample.py 000660 2024 > /tmp/dart-skhynix.txt
python3 scripts/debug-dart-sample.py 012450 2024 > /tmp/dart-hanwha.txt
python3 scripts/debug-dart-sample.py 207940 2024 > /tmp/dart-sambio.txt
python3 scripts/debug-dart-sample.py 329180 2024 > /tmp/dart-hdhi.txt
```

### A-3. 출력 분석 — 해야 할 판단
각 파일에서 **매출액 / 영업이익 / 당기순이익** 에 해당할 항목을 찾아 `account_nm` 과 `account_id` 를 기록:
```bash
grep -E "(매출|수익|영업이익|영업손익|당기순|법인세|반기순)" /tmp/dart-*.txt | head -40
```

**예상 발견 패턴 (가설)**:
- SK하이닉스: `매출액` 대신 `매출` 또는 `ifrs-full_RevenueFromContractsWithCustomers`
- 삼성바이오로직스: `수익(매출액)` 대신 `수익` / `영업수익`
- 조선업(HD현대중공업): `영업이익` 대신 `영업이익(손실)` — 원래 keyword 에 있지만 `account_id` 가 다를 수 있음
- 한화에어로스페이스: 2024년 합병 후 IFRS 태그 변경 가능성

**CFS 없음(연결재무제표 미제출)**: 일부 비지주사는 `OFS` (개별) 만 제공 → fallback 필요

---

## Part B — `seed-dart-financials.py` 파서 개선

Part A 결과를 바탕으로 `scripts/seed-dart-financials.py` 의 `fetch_dart_financial` 함수와 `find_amount` 함수를 아래 방향으로 개선.

### B-1. keyword 확장 (`fetch_dart_financial` 내부)
**개선 전 (현재)**:
```python
'revenue': find_amount(items, 'IS', '매출액', 'ifrs-full_Revenue', '수익(매출액)'),
'operating_income': find_amount(items, 'IS', '영업이익', 'dart_OperatingIncomeLoss', '영업이익(손실)'),
'net_income': find_amount(items, 'IS', '당기순이익', 'ifrs-full_ProfitLoss', '당기순이익(손실)'),
```

**개선 후 (확장안 — Part A 결과 보고 실제 필요한 것만 선별)**:
```python
# 매출: 여러 IFRS 태그 + 한국어 표현 포괄
revenue = (
    find_amount(items, 'IS', '매출액', '수익(매출액)', '매출', '영업수익', '수익',
                'ifrs-full_Revenue', 'ifrs-full_RevenueFromContractsWithCustomers')
    or find_amount(items, 'CIS', '매출액', '수익(매출액)', '매출', '영업수익', '수익',
                   'ifrs-full_Revenue', 'ifrs-full_RevenueFromContractsWithCustomers')
)

# 영업이익
operating_income = (
    find_amount(items, 'IS', '영업이익', '영업이익(손실)', '영업손익',
                'dart_OperatingIncomeLoss', 'ifrs-full_ProfitLossFromOperatingActivities')
    or find_amount(items, 'CIS', '영업이익', '영업이익(손실)', '영업손익',
                   'dart_OperatingIncomeLoss')
)

# 순이익
net_income = (
    find_amount(items, 'IS', '당기순이익', '당기순이익(손실)', '당기순손익', '분기순이익', '반기순이익',
                'ifrs-full_ProfitLoss')
    or find_amount(items, 'CIS', '당기순이익', '당기순이익(손실)', '당기순손익',
                   'ifrs-full_ProfitLoss')
)
```

**주의**: Part A 출력에서 실제로 등장하지 않는 키워드는 넣지 말 것. 과도한 fallback 은 엉뚱한 항목(예: `매출총이익`)을 잡아올 위험.

### B-2. `find_amount` 의 account_id 매칭 정확도 상향
현재 `kw in account_id` (부분 문자열) 은 `ifrs-full_Revenue` 가 `ifrs-full_RevenueFromContractsWithCustomers` 에도 매칭되어 엉뚱한 값 가져올 수 있음.

**개선**: account_id 에 대해서는 **완전 일치** 우선, 없으면 부분 문자열:
```python
def find_amount(items, sj_div, *keywords):
    # 1차: 완전 일치 (account_nm 또는 account_id 정확히 일치)
    for kw in keywords:
        for x in items:
            if x.get('sj_div') != sj_div:
                continue
            if x.get('account_nm') == kw or x.get('account_id') == kw:
                v = parse_amount(x.get('thstrm_amount')) or parse_amount(x.get('frmtrm_amount'))
                if v is not None:
                    return v
    # 2차: account_id 부분 매칭 (IFRS 태그 prefix 유연 매칭)
    for kw in keywords:
        if not kw.startswith('ifrs-full_') and not kw.startswith('dart_'):
            continue
        for x in items:
            if x.get('sj_div') != sj_div:
                continue
            aid = x.get('account_id') or ''
            if kw in aid:
                v = parse_amount(x.get('thstrm_amount')) or parse_amount(x.get('frmtrm_amount'))
                if v is not None:
                    return v
    return None
```

### B-3. CFS → OFS fallback (선택, Part A 에서 CFS 빈 종목 발견 시만)
`fetch_dart_financial` 에서 CFS 가 빈 응답이면 OFS 로 재요청:
```python
# CFS 시도
r = requests.get(..., params={'fs_div': 'CFS', ...})
data = r.json()
if data.get('status') != '000' or not data.get('list'):
    time.sleep(RATE_LIMIT_SEC)
    r = requests.get(..., params={'fs_div': 'OFS', ...})
    data = r.json()
```

### B-4. `lib/dart-financial.ts` 도 같은 방향으로 동기화
Python 스크립트만 고치면 **런타임 API** (`/api/stocks/...` 가 `lib/dart-financial.ts` 쓸 경우) 는 여전히 구버전. 같은 keyword 확장을 TS 쪽에도 적용:

`lib/dart-financial.ts` 의 `findAmount` 함수 + `fetchDartFinancial` 내부 keyword 리스트를 Python 쪽과 동일 구조로 맞춰야 함. 시간 부족하면 이번 STEP 은 Python 만 고치고, `lib/dart-financial.ts` 는 다음 STEP (UI 연결) 에서 같이 처리하는 옵션도 있음 — 판단은 Claude Code 에게 맡김.

---

## Part C — 재시도 검증

### C-1. TOP_N=10 재실행 (STEP 38 과 동일 스코프)
```bash
TOP_N=10 YEARS='2023,2024' python3 scripts/seed-dart-financials.py
```

**기대**: `SKIP` 로그가 0건 되어야 함. 특히:
```
OK SK하이닉스        2023 rev=... op=... ni=...
OK SK하이닉스        2024 rev=... op=... ni=...
OK 삼성바이오로직스   2024 rev=... op=... ni=...
OK 한화에어로스페이스 2024 rev=... op=... ni=...
OK HD현대중공업      2024 rev=... op=... ni=...
```

일부는 2023년 아직 미수록일 수 있음 (분할·합병 종목). 2024년은 전원 성공해야 함.

### C-2. 여전히 null 인 종목 있으면 Part A-B 재진행
→ 실패 종목 1개에 대해 Part A-2 로 raw 덤프 → 누락된 keyword 추가 → 재시도. 최대 2회 반복으로 해결.

---

## Part D — TOP 100 배치 확장

### D-1. 본 배치 실행
```bash
TOP_N=100 YEARS='2023,2024' python3 scripts/seed-dart-financials.py
```

**예상 소요**: 100종목 × 2년 × 150ms = 30초 + 오버헤드 ≈ 1분

**예상 결과**: 약 150~200건 upsert (비상장기업 자회사 · 리츠 · 신규 상장 등으로 일부 SKIP 정상)

### D-2. 테마 50종목 커버리지 확인
```bash
python3 -c "
import os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv('.env.local')
sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# themes.json 의 50 티커 로드
import json
with open('data/themes.json') as f:
    themes = json.load(f)
tickers = set()
for t in themes['themes']:
    for s in t['stocks']:
        tickers.add(s['symbol'])

# DART 연간 데이터 있는 종목 확인
stock_ids = {r['symbol']: r['id'] for r in sb.table('stocks').select('id, symbol').in_('symbol', list(tickers)).execute().data}
covered = sb.table('financials').select('stock_id').in_('stock_id', list(stock_ids.values())).like('source', 'DART%').execute().data
covered_ids = set(r['stock_id'] for r in covered)
covered_syms = [s for s, sid in stock_ids.items() if sid in covered_ids]

print(f'테마 50 중 DART 커버: {len(covered_syms)}/{len(tickers)}')
print(f'미커버 (TOP 100 바깥): {sorted(set(tickers) - set(covered_syms))[:10]}')
"
```

**기대**: 테마 50종목 중 30~40개 커버 (대부분 시총 TOP 100 안에 포함). 나머지는 STEP 40 에서 스코프 확장으로 보완.

---

## Part E — 커밋

### E-1. 문서 4개 헤더 날짜 오늘로 갱신
- `CLAUDE.md`, `docs/CHANGELOG.md`, `session-context.md`, `docs/NEXT_SESSION_START.md`

### E-2. `docs/CHANGELOG.md` 상단 블록
```markdown
## 2026-04-22 — STEP 39: DART 파서 보완 + TOP 100 확장

**코드 변경**
- `scripts/seed-dart-financials.py` `find_amount` 개선
  - account_id 완전 일치 우선 → 부분 매칭 2차 fallback
  - IS/CIS 양쪽 탐색, keyword 확장 (수익, 영업수익, 매출, 영업손익, ifrs-full_RevenueFromContractsWithCustomers 등)
  - CFS → OFS fallback 추가 (연결재무제표 미제출 종목 대응)
- `scripts/debug-dart-sample.py` 신규 — DART raw 응답 진단용
- (선택) `lib/dart-financial.ts` 도 동일 방향 동기화

**데이터 작업**
- STEP 38 누락 4종목(SK하이닉스 · 한화에어로스페이스 · 삼성바이오로직스 · HD현대중공업) 복구 성공
- TOP_N=100 × 2023,2024 배치 실행 → financials 약 1XX건 DART 실재무 추가

**효과**
- 테마 50종목 중 3X종이 DART 실재무 커버
- 시총 TOP 100 종목의 `/stocks/[symbol]` 에 실제 매출·영업이익·순이익·자산·부채·자본 시계열 DB 적재 완료
```

### E-3. `session-context.md` 완료 블록
```markdown
## 2026-04-22 세션 — STEP 39 완료

- [x] DART 진단 스크립트 작성
- [x] seed-dart-financials.py 파서 확장 (4종목 null 해결)
- [x] TOP 100 × 2년 배치 실행
- [x] 테마 커버리지 검증
- [ ] STEP 40 후보: 분기 보고서 수집 / UI 연결 (ValueAnalysis.tsx)
```

### E-4. `docs/NEXT_SESSION_START.md` 갱신
최신 상태:
- stocks 2,780 / financials KIS 383 + DART 약 200 / dart_corp_codes 3000+ / link_hub 56
- 시총 TOP 100 DART 연간 재무 커버
- 다음: STEP 40 — 분기 보고서 수집 또는 UI 연결 (ValueAnalysis)

### E-5. 커밋 + 푸시
```bash
git add scripts/seed-dart-financials.py scripts/debug-dart-sample.py CLAUDE.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md session-context.md docs/STEP_39_COMMAND.md
# lib/dart-financial.ts 도 수정했다면 추가
git status
git commit -m "$(cat <<'EOF'
STEP 39: DART 파서 보완 + TOP 100 배치 확장

- seed-dart-financials.py 개선
  - find_amount: account_id 완전일치 → 부분매칭 2차 fallback
  - IS/CIS 양쪽 탐색, keyword 대폭 확장
  - CFS → OFS fallback 로직
- debug-dart-sample.py 신규 — DART raw 응답 진단 도구
- STEP 38 누락 4종목(SK하이닉스 등) 복구 성공
- TOP 100 × 2년 배치 → 테마 30+ 종목 DART 실재무 커버
EOF
)"
git push
```

---

## STEP 40 후보 (다음 세션 판단)

1. **UI 연결 — ValueAnalysis.tsx 실데이터 모드**
   - 현재 가치투자 탭이 DB 데이터를 읽는지 점검
   - stub 상태면 실데이터로 전환 (매출·영업이익·순이익 시계열 + 주요 지표 KPI)

2. **분기 보고서 수집**
   - `REPRT_CODE=11013 python3 ...` (1Q) / `11012` (반기) / `11014` (3Q) 세 번 실행
   - TOP 100 × 각 분기 = 300건 추가

3. **테마 50 풀커버**
   - `TOP_N=500` 으로 극단적 확장 또는
   - 테마 종목 명시 리스트 기반 타겟 시딩 스크립트 별도 작성

권장: **1번 (UI 연결)** — 데이터가 쌓였으니 사용자가 실제로 체감하는 화면을 열어주는 게 맞음.

---

## 롤백
```sql
-- DART 재무만 선택 삭제 (KIS 스냅샷은 보존)
DELETE FROM financials WHERE source LIKE 'DART:%';
```
