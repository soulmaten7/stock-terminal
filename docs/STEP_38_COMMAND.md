# STEP 38 — DART 재무제표 파이프라인 (시범 배치: TOP 10 × 2년)

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

## 목표
DART OpenAPI 로 실제 재무제표(매출·영업이익·순이익 + 자산·부채·자본 3종)를 수집해서 `financials` 테이블을 채운다.
- Part A: `seed-dart-corpcodes.py` 실행 (기존 스크립트) → `dart_corp_codes` 테이블 적재
- Part B: 새 스크립트 `scripts/seed-dart-financials.py` 작성 → `lib/dart-financial.ts` 의 로직을 Python 으로 재구현 + BS 항목 추가
- Part C: 시범 배치 실행 (TOP 10 종목 × 최근 2년 연간)
- Part D: 검증 + 커밋

**이번 STEP 은 코드 변경 있음 → git commit/push 필요**

## 전제 상태
- 이전 커밋: `9ba4557` (STEP 35) + STEP 36·37 데이터 시딩 완료
- `stocks` 2,780건 / `financials` KIS 스냅샷 약 192건 존재
- `lib/dart-financial.ts`, `lib/dart.ts`, `scripts/seed-dart-corpcodes.py` 기존 파일 존재 (수정 없음)
- `.env.local` 에 `DART_API_KEY` 존재 전제 (이전 세션에서 이미 발급됨)

---

## Part A — `dart_corp_codes` 테이블 적재

### A-1. 환경변수 확인
```bash
grep -E "^DART_API_KEY=" .env.local | sed 's/=.*/=<hidden>/'
```
**기대**: `DART_API_KEY=<hidden>` 한 줄 출력

**누락 시**: https://opendart.fss.or.kr/ 무료 회원가입 → 인증키 신청 → `.env.local` 에 `DART_API_KEY=...` 추가

### A-2. 기존 스크립트 실행
```bash
python3 scripts/seed-dart-corpcodes.py
```
**예상 로그**:
```
DART CORPCODE.xml 다운로드 중...
상장 종목 3XXX건 적재 중...
  500 / 3XXX
  ...
완료
```

**소요 시간**: 약 1분

### A-3. 적재 확인
```bash
python3 -c "
import os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv('.env.local')
sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
cnt = sb.table('dart_corp_codes').select('corp_code', count='exact').execute().count
print(f'dart_corp_codes: {cnt}건')
samsung = sb.table('dart_corp_codes').select('corp_code').eq('stock_code', '005930').single().execute().data
print(f'삼성전자 corp_code: {samsung}')
"
```
**기대**: `dart_corp_codes: 3000+`, 삼성전자 `corp_code: {"corp_code": "00126380"}`

---

## Part B — `seed-dart-financials.py` 작성

### B-1. 파일 생성
다음 내용으로 `scripts/seed-dart-financials.py` 파일 생성:

```python
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
```

### B-2. 저장 위치 확인
```bash
ls -la scripts/seed-dart-financials.py
```

---

## Part C — 시범 배치 실행 (TOP 10 × 2년 연간)

### C-1. 기본값으로 실행
```bash
python3 scripts/seed-dart-financials.py
```

**예상 소요 시간**: 약 10초 (10종목 × 2년 × 150ms = 3초 + 오버헤드)

**예상 로그**:
```
[1/3] 대상 종목: 시총 TOP 10
  10종목 (예: 삼성전자 → ...)
[2/3] DART corp_code 매핑
  매핑 10/10 완료
[3/3] DART 재무제표 수집 (연도: [2023, 2024], reprt: 11011 / annual)
  OK 삼성전자         2023 rev=258935494000000 op=6566976000000 ni=15487100000000
  OK 삼성전자         2024 rev=...
  OK SK하이닉스       2023 rev=...
  ...

[upsert] 20건 (skip 0건)
  upserted 20 / 20

[완료] financials 테이블 총 212건
```

### C-2. 에러 케이스
- **`status=013` (조회 결과 없음)** → 해당 연도 보고서가 아직 제출 안 된 경우 (2024년은 3~4월에 제출 완료) → SKIP 정상
- **`status=020` (사용한도 초과)** → DART 일일 20,000건 한도. 24시간 대기
- **`status=010` (등록되지 않은 키)** → `DART_API_KEY` 재확인
- **`corp_code 누락`** → Part A 재실행 (dart_corp_codes 비어있을 수 있음)

---

## Part D — 검증

### D-1. 삼성전자 재무제표 확인
```bash
python3 -c "
import os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv('.env.local')
sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
sid = sb.table('stocks').select('id').eq('symbol', '005930').eq('market', 'KOSPI').single().execute().data['id']
rows = sb.table('financials').select('period_date, revenue, operating_income, net_income, total_assets, operating_margin, debt_ratio').eq('stock_id', sid).like('source', 'DART%').order('period_date', desc=True).execute().data
for r in rows:
    rev = r['revenue']
    print(f\"  {r['period_date']} rev={rev/1e12:.1f}조 op={r['operating_income']/1e12:.1f}조 ni={r['net_income']/1e12:.1f}조 opm={r['operating_margin']}% dr={r['debt_ratio']}%\" if rev else f\"  {r['period_date']} (빈 데이터)\")
"
```
**기대**: 삼성전자 2023, 2024 두 줄. 매출 258조 / 303조 근처, 영업이익 6.6조 / 32조 근처 (2024 는 대폭 회복).

### D-2. 브라우저 검증 (선택)
```bash
npm run dev
```
`http://localhost:3000/stocks/005930/analysis` → 가치투자 탭이 매출·영업이익·순이익 실데이터로 표시되는지 확인 (현재 가치투자 컴포넌트가 `financials.revenue` 를 읽는다면 활성화됨, 아직 stub 이면 UI 변화 없음 — 그래도 DB 레벨에서는 성공).

---

## Part E — 문서 갱신 + 커밋

### E-1. 문서 4개 헤더 날짜 오늘로 갱신
- `CLAUDE.md`
- `docs/CHANGELOG.md`
- `session-context.md`
- `docs/NEXT_SESSION_START.md`

### E-2. `docs/CHANGELOG.md` 상단에 블록 추가
```markdown
## 2026-04-22 — STEP 38: DART 재무제표 파이프라인 (시범 배치)

**코드 변경**
- `scripts/seed-dart-financials.py` 신규 작성 (DART `fnlttSinglAcntAll.json` 래퍼 + BS 항목 확장)
  - 환경변수 `TOP_N`, `YEARS`, `REPRT_CODE` 로 배치 스코프 조정 가능
  - 기본값: TOP 10 종목 × 최근 2년 연간 (사업보고서 11011)

**데이터 작업**
- `scripts/seed-dart-corpcodes.py` 실행 → `dart_corp_codes` 테이블 3XXX건 적재
- `seed-dart-financials.py` 시범 실행 → `financials` 테이블에 DART 실재무 약 20건 upsert
- 수집 항목: 매출액·영업이익·당기순이익·자산총계·부채총계·자본총계 + 파생 지표(영업이익률·순이익률·부채비율)

**효과**
- 시총 TOP 10 종목의 `/stocks/[symbol]/analysis` 가치투자 탭이 실재무 기반 데이터로 활성화 가능
- KIS 스냅샷(`source='KIS:inquire-price(snapshot)'`) 과 DART 실재무(`source='DART:fnlttSinglAcntAll:11011'`) 가 `source` 필드로 분리 저장되어 충돌 없음
```

### E-3. `session-context.md` 에 완료 블록 추가
```markdown
## 2026-04-22 세션 — STEP 38 완료 (DART 재무제표 파이프라인 시범)

- [x] dart_corp_codes 테이블 적재 (상장 종목 3XXX건)
- [x] seed-dart-financials.py 신규 작성
- [x] TOP 10 × 2년 시범 배치 실행 (약 20건 upsert)
- [x] 삼성전자 2023·2024 재무제표 검증
- [ ] STEP 39: TOP 100 전체 배치 확장 (`TOP_N=100 python3 scripts/seed-dart-financials.py`)
- [ ] STEP 39+: 분기 보고서 (11013/11012/11014) 수집 추가
```

### E-4. `docs/NEXT_SESSION_START.md` 갱신
최신 상태:
- stocks 2,780 / financials KIS 192 + DART 20 / dart_corp_codes 3000+ / link_hub 56
- DART 파이프라인 시범 검증 완료 (TOP 10)
- 다음: STEP 39 TOP 100 전체 배치 확장

### E-5. 커밋 + 푸시
```bash
git add scripts/seed-dart-financials.py CLAUDE.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md session-context.md docs/STEP_38_COMMAND.md
git status
git commit -m "$(cat <<'EOF'
STEP 38: DART 재무제표 파이프라인 시범 배치

- scripts/seed-dart-financials.py 신규 — DART fnlttSinglAcntAll API 래퍼
  - TOP_N, YEARS, REPRT_CODE 환경변수로 배치 스코프 조정
  - IS 3종(매출/영업이익/순이익) + BS 3종(자산/부채/자본) + 파생 지표
- dart_corp_codes 테이블 적재 (기존 스크립트 실행, 3XXX건)
- 시범 배치: TOP 10 × 2023,2024 연간 → financials 약 20건 upsert
- 삼성전자 재무제표 검증 완료
EOF
)"
git push
```

**⚠️ 빌드 확인 불필요**: `scripts/*.py` 는 Next.js 빌드 대상 아님. 타입체크/빌드는 STEP 39 에서 이 데이터를 UI 에 연결할 때 검증.

---

## STEP 39 예고

**본 배치 확장**:
```bash
TOP_N=100 python3 scripts/seed-dart-financials.py
```
- 소요: 100종목 × 2년 × 150ms = 30초
- 테마 50종목(`data/themes.json`) 대부분 커버
- 추가로: 분기 보고서 수집 (`REPRT_CODE=11014 python3 ...` 등 3번)

**UI 연결** (별도 STEP):
- 가치투자 탭(`ValueAnalysis.tsx`) 이 `financials.revenue/operating_income/net_income` 시계열을 실제로 읽도록 수정
- 현재 stub 여부는 STEP 39 에서 점검

---

## 롤백
```sql
-- Supabase SQL Editor 에서 DART 재무만 정확히 삭제
DELETE FROM financials WHERE source LIKE 'DART:%';
```
`source` 필드로 KIS 스냅샷과 분리되므로 안전.
