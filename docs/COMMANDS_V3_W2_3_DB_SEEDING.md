<!-- 2026-04-18 -->
# V3 W2.3 — 재무/가격 DB 시딩

> 이 문서는 **Claude Code 가 읽고 실행하기 위한 명령 문서** 이다.
> W2.2 에서 확인된 blocker 해결: `financials`, `stock_prices` 테이블 비어 있음 → KPI 표시 불가.

**모델**: Sonnet (기본)
**실행 위치**: `~/Desktop/OTMarketing`

## 🎯 이번 세션 목표

개요 탭 KPI 를 실제 숫자로 채우기:
- **PER / PBR / EPS / BPS** — FDR `StockListing` 스냅샷 → `financials` 테이블
- **52주 범위** — FDR `DataReader` 1년 OHLCV → `stock_prices` 테이블

### 범위
- **대상 종목**: 시가총액 TOP 200 (KOSPI/KOSDAQ 혼합) + watchlist 에 등록된 모든 종목
- **기간**: 일봉 1년
- **방식**: 2개의 Python 스크립트 신규 작성 → 순차 실행

---

## STEP 0 — 사전 확인

```bash
cd ~/Desktop/OTMarketing && python3 -c "import FinanceDataReader as fdr; print(fdr.__version__)"
```

- FDR 이미 설치되어 있어야 함 (세션 #7 에서 설치됨). 없으면:
  ```bash
  pip install FinanceDataReader --break-system-packages
  ```

---

## STEP 1 — financials 스냅샷 시딩 스크립트

**신규 파일**: `scripts/seed-financials-snapshot.py`

```python
#!/usr/bin/env python3
"""
FDR StockListing 스냅샷 → financials 테이블 upsert.
- PER/PBR/EPS/BPS 시장 지표를 오늘자 'annual' 스냅샷으로 저장
- period_type='annual', period_date=오늘로 설정 (추후 DART 실재무 데이터가 덮어쓸 수 있도록)
- 전 KOSPI + KOSDAQ 대상 (약 2,780건)
"""
import os
import sys
import warnings
from datetime import date

warnings.filterwarnings('ignore')

import FinanceDataReader as fdr
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

SB_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SB_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SB_URL or not SB_KEY:
    print('ERROR: .env.local SUPABASE 누락')
    sys.exit(1)

sb = create_client(SB_URL, SB_KEY)

TODAY = date.today().isoformat()

# 1. stocks 테이블에서 symbol → id 매핑 생성 (KR 만)
print('[1/3] stocks 테이블 symbol → id 매핑 로드 중...')
stocks_rows = []
page_size = 1000
offset = 0
while True:
    res = sb.table('stocks').select('id, symbol, market').eq('country', 'KR').range(offset, offset + page_size - 1).execute()
    data = res.data or []
    stocks_rows.extend(data)
    if len(data) < page_size:
        break
    offset += page_size

sym_to_id = {(r['symbol'], r['market']): r['id'] for r in stocks_rows}
print(f'  KR 종목 {len(sym_to_id)}건 매핑')

# 2. FDR StockListing (KOSPI + KOSDAQ)
def safe_float(v):
    try:
        if v is None:
            return None
        f = float(v)
        if f != f:  # NaN
            return None
        return f
    except Exception:
        return None

financial_rows = []
for market_code, market_label in [('KOSPI', 'KOSPI'), ('KOSDAQ', 'KOSDAQ')]:
    print(f'[2/3] FDR StockListing({market_code}) 가져오는 중...')
    df = fdr.StockListing(market_code)
    print(f'  {market_label} {len(df)}건 수신')

    for _, row in df.iterrows():
        code = str(row.get('Code', '')).zfill(6)
        stock_id = sym_to_id.get((code, market_label))
        if not stock_id:
            continue

        per = safe_float(row.get('Per'))
        pbr = safe_float(row.get('Pbr'))
        eps = safe_float(row.get('Eps'))
        bps = safe_float(row.get('Bps'))

        # 지표 하나도 없으면 건너뜀
        if all(v is None for v in [per, pbr, eps, bps]):
            continue

        financial_rows.append({
            'stock_id': stock_id,
            'period_type': 'annual',
            'period_date': TODAY,
            'per': per,
            'pbr': pbr,
            'eps': eps,
            'bps': bps,
            'source': 'FDR:StockListing(snapshot)',
        })

print(f'[3/3] financials 총 {len(financial_rows)}건 upsert 시작')
BATCH = 500
for i in range(0, len(financial_rows), BATCH):
    chunk = financial_rows[i:i + BATCH]
    sb.table('financials').upsert(chunk, on_conflict='stock_id,period_type,period_date').execute()
    print(f'  {min(i + BATCH, len(financial_rows))} / {len(financial_rows)}')

count = sb.table('financials').select('id', count='exact').execute().count
print(f'\n[완료] financials 테이블 총 {count}건')
```

**실행**:
```bash
cd ~/Desktop/OTMarketing && python3 scripts/seed-financials-snapshot.py
```

- 예상 시간: 1~2분
- 예상 업서트 건수: 약 2,000건 (FDR 가 PER/PBR 을 주지 않는 종목은 skip)

---

## STEP 2 — stock_prices 1년 일봉 시딩 스크립트

**신규 파일**: `scripts/seed-stock-prices.py`

> 전 종목 1년치는 FDR rate limit + 시간 때문에 비현실적.
> **대상**: (a) watchlist 등록된 종목 모두 + (b) 시가총액 TOP 200 + (c) 005930 필수.

```python
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
START_DATE = END_DATE - timedelta(days=400)  # 영업일 아닌 달력일 기준 1년 치 여유

# 1. 대상 종목 선정
print(f'[1/3] 대상 종목 선정 (watchlist + 시총 TOP {TOP_N} + 005930)')
wl = sb.table('watchlist').select('symbol, market').eq('country', 'KR').execute().data or []
wl_syms = {(w['symbol'], w['market']) for w in wl}

top_rows = sb.table('stocks').select('id, symbol, market, market_cap').eq('country', 'KR').not_.is_('market_cap', 'null').order('market_cap', desc=True).limit(TOP_N).execute().data or []
top_syms = {(r['symbol'], r['market']): r['id'] for r in top_rows}

# watchlist 종목의 stock_id 조회
wl_ids = {}
if wl_syms:
    or_filter = ','.join([f'and(symbol.eq.{s},market.eq.{m})' for (s, m) in wl_syms])
    # 개별 조회 (or filter 복잡)
    for (s, m) in wl_syms:
        r = sb.table('stocks').select('id').eq('symbol', s).eq('market', m).maybeSingle().execute().data
        if r:
            wl_ids[(s, m)] = r['id']

# 005930 (KOSPI) 반드시 포함
r = sb.table('stocks').select('id').eq('symbol', '005930').eq('market', 'KOSPI').maybeSingle().execute().data
if r:
    top_syms[('005930', 'KOSPI')] = r['id']

targets = {**top_syms, **wl_ids}
print(f'  대상 {len(targets)}종목')

# 2. FDR DataReader 루프
def safe_int(v):
    try:
        if v is None: return None
        i = int(v)
        return i
    except Exception:
        return None

def safe_float(v):
    try:
        if v is None: return None
        f = float(v)
        if f != f: return None
        return f
    except Exception:
        return None

all_rows = []
failed = []
processed = 0
for (symbol, market), stock_id in targets.items():
    processed += 1
    if processed % 20 == 0:
        print(f'  진행: {processed} / {len(targets)}')
    try:
        df = fdr.DataReader(symbol, START_DATE, END_DATE)
        if df is None or len(df) == 0:
            failed.append(symbol)
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
                'change': None,  # KRW absolute change 계산 추가 가능 (close - prev_close)
                'change_percent': change_pct,
            })
        time.sleep(0.1)  # rate limit 보호
    except Exception as e:
        failed.append(f'{symbol}:{e}')
        continue

print(f'[2/3] 행 수집 {len(all_rows)}건, 실패 {len(failed)}건')

# 3. 배치 upsert
print('[3/3] stock_prices upsert 시작')
BATCH = 2000
for i in range(0, len(all_rows), BATCH):
    chunk = all_rows[i:i + BATCH]
    sb.table('stock_prices').upsert(chunk, on_conflict='stock_id,trade_date').execute()
    print(f'  {min(i + BATCH, len(all_rows))} / {len(all_rows)}')

count = sb.table('stock_prices').select('id', count='exact').execute().count
print(f'\n[완료] stock_prices 테이블 총 {count}건')
if failed[:10]:
    print(f'실패 종목 일부: {failed[:10]}')
```

**실행**:
```bash
cd ~/Desktop/OTMarketing && python3 scripts/seed-stock-prices.py
```

- 예상 시간: 3~5분 (종목당 약 0.5초)
- 예상 행 수: 약 50,000 (종목당 250 거래일)

---

## STEP 3 — 검증 (dev 서버가 떠 있는 상태에서)

```bash
cd ~/Desktop/OTMarketing && curl -s http://localhost:3333/api/stocks/overview?symbol=005930 | python3 -m json.tool
```

**기대 결과**:
```json
{
  "symbol": "005930",
  "name": "삼성전자",
  ...
  "kpis": {
    "marketCap": "...조",
    "per": "...",
    "pbr": "...",
    "eps": "...",
    "bps": "...",
    "roe": "—",
    "dividendYield": "—",
    "yearRange": "... ~ ... KRW"
  },
  "meta": {
    "latestFinancialPeriod": "2026-04-18",
    "latestFinancialType": "annual",
    "priceDataPoints": 250
  }
}
```

- `per`, `pbr`, `eps`, `bps` 가 숫자로 나오면 ✅
- `yearRange` 가 `최저 ~ 최고 KRW` 로 나오면 ✅
- `priceDataPoints` 가 200~250 이면 ✅

---

## STEP 4 — 브라우저 스모크 테스트

`http://localhost:3333/stocks/005930?tab=overview` 접속:
- [ ] 시가총액 — 실데이터 (W2.2 에서 이미 확인)
- [ ] PER/PBR/EPS/BPS — **실제 숫자** (예: PER 14.23)
- [ ] ROE — `—` (FDR 제공 안 함, 정상)
- [ ] 배당수익률 — `—` (Phase 2)
- [ ] 52주 범위 — `53,000 ~ 88,000 KRW` 같은 형식
- [ ] 재무 기준일 텍스트: `재무 지표 기준: 2026-04-18 (annual) / 가격 데이터 포인트: 250`

---

## STEP 5 — git 커밋 (push 는 승인 대기)

**커밋 메시지 후보**:
```
feat: seed financials snapshot + stock_prices 1Y OHLCV for overview KPIs

- scripts/seed-financials-snapshot.py — FDR StockListing → financials (PER/PBR/EPS/BPS)
- scripts/seed-stock-prices.py — FDR DataReader 1Y → stock_prices (OHLCV)
- 대상: watchlist + 시총 TOP 200 + 005930
```

**Cowork Chrome MCP 검증 통과 후에만 push.**

---

## ⚠️ 실행 중 흔한 에러 & 대처

1. **`rate limit` / `429` 에러** — FDR 내부 웹 스크레이핑이 간헐적으로 차단. 30초 기다리고 재실행.
2. **`Service Role Key` 권한 에러** — Supabase Studio → Project Settings → API 에서 `service_role` 키 확인하고 `.env.local SUPABASE_SERVICE_ROLE_KEY` 갱신.
3. **Python `maybeSingle()` 속성 에러** — Python supabase-py 버전 차이. `.single()` 로 대체 가능 (없을 시 에러 발생하므로 try-except 감싸기).

---

## 📝 세션 종료

1. 4개 문서 헤더 오늘 날짜
2. `docs/CHANGELOG.md` W2.3 블록 추가 (시딩 건수 기록)
3. `session-context.md` 세션 #11 추가
4. `docs/NEXT_SESSION_START.md` 최신화

**명령어 종료.**
