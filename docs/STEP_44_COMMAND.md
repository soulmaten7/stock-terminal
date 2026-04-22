# STEP 44 — DividendAnalysis 재활성화 (DART alotMatter 배당 공시 수집)

**실행 명령어 (Sonnet)**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

Claude Code 안에서:
```
@docs/STEP_44_COMMAND.md 파일 내용대로 실행해줘
```

---

## 목표
1. `scripts/seed-dividends.py` 신규 작성 → DART `alotMatter.json` (배당에 관한 사항) 으로 시총 TOP 200 대상 최근 5년 배당 이력 시딩
2. `components/analysis/DividendAnalysis.tsx` 를 스텁 → **실제 배당 분석 컴포넌트**로 재작성
   - 주당 현금배당금 추이 (바차트)
   - 배당 수익률 추이 (라인차트)
   - 배당 성향 추이 (라인차트)
   - 최근 회계연도 배당 요약 카드

## 전제 상태
- 직전 커밋: `b9f027d` (STEP 43 — SupplyAnalysis 재활성화 + supply_demand 3,000행)
- `components/analysis/DividendAnalysis.tsx` 는 현재 32줄 스텁 카드
- `dividends` 테이블 존재 (001_initial_schema.sql line 154, UNIQUE(stock_id, fiscal_year))
- `dart_corp_codes` 3,959건 이미 시딩됨 (STEP 38)

## DART alotMatter.json 스키마 (배당에 관한 사항)
**엔드포인트**: `https://opendart.fss.or.kr/api/alotMatter.json`
**필수 파라미터**: `crtfc_key`, `corp_code`, `bsns_year`, `reprt_code='11011'` (연간)

**응답 구조** (리스트 항목):
- `se` — 항목 구분 (예: "주당 현금배당금(원)", "현금배당수익률(%)", "현금배당성향(%)", "주당순이익(원)")
- `stock_knd` — 주식 종류 ("보통주" / "우선주")
- `thstrm` — 당기 (bsns_year)
- `frmtrm` — 전기 (bsns_year - 1)
- `lwfr` — 전전기 (bsns_year - 2)

**추출 전략**:
- 보통주(`stock_knd` 필터) 우선, 없으면 전체에서 "주당 현금배당금" 첫 매칭
- 1회 호출로 **3년치 (당기/전기/전전기)** 커버 가능 → 2024, 2021 2번 호출로 2019~2024 6년 수집
- `se` 문자열에 "주당 현금배당금" 포함 여부로 매칭 (공백·괄호·"(원)" 변형 존재)

---

## Part A — seed-dividends.py 작성

`scripts/seed-dividends.py` 신규 파일 작성:

```python
#!/usr/bin/env python3
"""
DART alotMatter.json → dividends 테이블 upsert.
- 시총 TOP 200 + 005930 대상
- 2024, 2021 2회 호출로 2019~2024 (6년) 커버 (각 호출 당기/전기/전전기 포함)
- 보통주 배당금·배당수익률·배당성향 추출

환경변수:
  TOP_N  (기본 200)
  CALL_YEARS  (기본 '2024,2021')  — 각 호출이 3년치 반환
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
    """se 문자열에 키워드 중 하나라도 포함되면 True. 공백/괄호 무시."""
    if not se_val:
        return False
    normalized = se_val.replace(' ', '').replace('(', '').replace(')', '')
    for kw in keywords:
        kn = kw.replace(' ', '').replace('(', '').replace(')', '')
        if kn in normalized:
            return True
    return False


def extract_for_year(items, year_key, *keywords, prefer_common=True):
    """items 에서 keywords 에 매칭되는 se 행의 year_key (thstrm/frmtrm/lwfr) 값 추출.
    prefer_common=True 이면 stock_knd='보통주' 우선."""
    # 1차: 보통주
    if prefer_common:
        for x in items:
            if x.get('stock_knd') != '보통주':
                continue
            if matches_se(x.get('se', ''), *keywords):
                v = parse_float(x.get(year_key))
                if v is not None:
                    return v
    # 2차: 전체
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
rows_by_key = {}  # {(stock_id, fiscal_year): row}
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

        # 각 호출은 thstrm(call_year), frmtrm(call_year-1), lwfr(call_year-2) 포함
        for offset, key in [(0, 'thstrm'), (-1, 'frmtrm'), (-2, 'lwfr')]:
            fiscal_year = call_year + offset
            dps = extract_for_year(items, key, '주당현금배당금', '주당 현금배당금')
            yield_pct = extract_for_year(items, key, '현금배당수익률', '시가배당율', '시가배당률')
            payout = extract_for_year(items, key, '현금배당성향', '배당성향')

            if dps is None and yield_pct is None and payout is None:
                continue

            row_key = (stock['id'], fiscal_year)
            # 동일 년도 2번 들어오면 (2024 + 2021 호출 중복 없음 예상이지만 안전장치)
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
```

---

## Part B — 시딩 실행

### B-1. 005930 단일 종목 테스트 (소량 검증)
먼저 TOP 10 으로 파이프라인 건전성 확인:
```bash
cd ~/Desktop/OTMarketing
TOP_N=10 python3 scripts/seed-dividends.py
```

**예상**: 삼성전자·SK하이닉스 등 고배당주 6년치 (2019~2024) 행이 생성되어야 함.

검증:
```bash
python3 scripts/sql-exec.py "SELECT fiscal_year, dividend_per_share, dividend_yield, payout_ratio FROM dividends d JOIN stocks s ON s.id = d.stock_id WHERE s.symbol = '005930' ORDER BY fiscal_year DESC"
```

삼성전자 참고값 (실제 공시 기준):
- 2023 DPS ~1,444원, yield ~2%, payout ~19%
- 2024 DPS 대략 1,500원대

### B-2. TOP 200 본 시딩
10건 검증이 OK면 본 시딩:
```bash
TOP_N=200 python3 scripts/seed-dividends.py
```

**예상 소요**: 200종목 × 2회 호출 × 150ms = **약 60초**
**예상 결과**: ~400~800행 (무배당주 상당수 → 실제 배당 공시 있는 기업 위주로 저장)

### B-3. 검증
```bash
# 총 행수
python3 scripts/sql-exec.py "SELECT COUNT(*) FROM dividends"

# 커버 종목 수
python3 scripts/sql-exec.py "SELECT COUNT(DISTINCT stock_id) FROM dividends"

# 연도별 분포
python3 scripts/sql-exec.py "SELECT fiscal_year, COUNT(*) FROM dividends GROUP BY fiscal_year ORDER BY fiscal_year DESC"
```

---

## Part C — DividendAnalysis.tsx 재작성

`components/analysis/DividendAnalysis.tsx` 전체 교체:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Dividend } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { Coins, TrendingUp, Percent } from 'lucide-react';

interface Props {
  stockId: number;
}

function formatNum(n: number | null | undefined, digits = 0, suffix = ''): string {
  if (n == null || isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: digits })}${suffix}`;
}

export default function DividendAnalysis({ stockId }: Props) {
  const [rows, setRows] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('dividends')
        .select('*')
        .eq('stock_id', stockId)
        .order('fiscal_year', { ascending: true });
      if (data) setRows(data as Dividend[]);
      setLoading(false);
    }
    load();
  }, [stockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
          <Coins className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            배당 정보 없음
          </h3>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            해당 종목은 최근 6년간 DART에 배당 공시가 없거나 무배당입니다. 시총 TOP 200 대상 커버 중 — 확장 예정.
          </p>
        </div>
        <DisclaimerBanner />
      </div>
    );
  }

  const chartData = rows.map(r => ({
    year: String(r.fiscal_year),
    dps: r.dividend_per_share,
    yield: r.dividend_yield,
    payout: r.payout_ratio,
  }));

  const latest = rows[rows.length - 1];

  // 배당 성장률 — 최근 2년 비교
  const prev = rows[rows.length - 2];
  const dpsGrowth =
    prev?.dividend_per_share && latest?.dividend_per_share
      ? ((latest.dividend_per_share - prev.dividend_per_share) / prev.dividend_per_share) * 100
      : null;

  const metrics = [
    { label: '주당 배당금 (최근)', value: latest.dividend_per_share, digits: 0, suffix: '원' },
    { label: '배당 수익률 (최근)', value: latest.dividend_yield, digits: 2, suffix: '%' },
    { label: '배당 성향 (최근)', value: latest.payout_ratio, digits: 2, suffix: '%' },
    { label: 'DPS 성장률 (YoY)', value: dpsGrowth, digits: 2, suffix: '%' },
  ];

  return (
    <div className="space-y-6">
      {/* 최근 배당 요약 */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent" />
          최근 회계연도 배당 ({latest.fiscal_year}년)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-dark-700 rounded-lg p-4 border border-border">
              <p className="text-xs text-text-secondary mb-1">{m.label}</p>
              <p className="text-2xl font-bold font-mono-price mt-1 text-text-primary">
                {formatNum(m.value, m.digits, m.suffix)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-secondary/70 mt-2">
          출처: DART 정기공시 배당에 관한 사항 (alotMatter)
        </p>
      </div>

      {/* 주당 현금배당금 추이 */}
      {chartData.some(d => d.dps != null) && (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent" />
            주당 현금배당금 추이 (단위: 원)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value: number) => `${value.toLocaleString('ko-KR')}원`}
                />
                <Bar dataKey="dps" name="주당 배당금" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 배당 수익률 추이 */}
      {chartData.some(d => d.yield != null) && (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            배당 수익률 추이 (단위: %)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Line type="monotone" dataKey="yield" name="배당 수익률" stroke="#0ABAB5" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 배당 성향 추이 */}
      {chartData.some(d => d.payout != null) && (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-accent" />
            배당 성향 추이 (단위: %)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Legend />
                <Line type="monotone" dataKey="payout" name="배당 성향" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            배당 성향 = 배당 총액 ÷ 당기순이익. 높을수록 순이익 중 주주환원 비중 큼.
          </p>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
```

---

## Part D — 빌드 검증

```bash
cd ~/Desktop/OTMarketing

# 1. 타입 체크
npx tsc --noEmit

# 2. ESLint
npx next lint --dir components/analysis

# 3. 프로덕션 빌드
npm run build
```

---

## Part E — 브라우저 검증

```bash
npm run dev
```

- http://localhost:3000/stocks/005930/analysis → **배당 분석** 탭
- 확인:
  1. 최근 배당 4개 카드 (DPS / Yield / Payout / Growth)
  2. 주당 배당금 바차트 (6년)
  3. 배당 수익률 라인차트
  4. 배당 성향 라인차트
- 무배당주 접속 시 "배당 정보 없음" 카드

---

## Part F — 문서 + 커밋

### F-1. 4개 문서 헤더 날짜 오늘로
`CLAUDE.md`, `docs/CHANGELOG.md`, `session-context.md`, `docs/NEXT_SESSION_START.md`

### F-2. CHANGELOG.md 최상단

```markdown
## 2026-04-22 — STEP 44: DividendAnalysis 재활성화 (DART alotMatter 배당 수집)
- **Script**: `scripts/seed-dividends.py` 신규 — DART `alotMatter.json` 으로 TOP 200 대상 2019~2024 (6년) 배당 이력 수집
- **Data**: dividends 테이블 N행 시딩 (무배당주 제외)
- **Component**: `components/analysis/DividendAnalysis.tsx` 스텁(32줄) → 실제 배당 컴포넌트(~220줄)
  - 최근 배당 4지표 카드 (DPS / Yield / Payout / DPS YoY Growth)
  - 주당 배당금 6년 바차트
  - 배당 수익률 라인차트
  - 배당 성향 라인차트
- 다음 STEP 45+ → 전종목 팩터 집계 → QuantAnalysis 재활성화
```

### F-3. session-context.md + NEXT_SESSION_START.md
STEP 44 완료, dividends 행수 기록.

누계 DB:
- stocks 2,780
- financials 576+
- stock_prices 54,899
- supply_demand 3,000
- **dividends ~N (신규)**
- dart_corp_codes 3,959

### F-4. 커밋 + 푸시
```bash
git add scripts/seed-dividends.py components/analysis/DividendAnalysis.tsx CLAUDE.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md docs/STEP_44_COMMAND.md session-context.md
git commit -m "STEP 44: DividendAnalysis 재활성화 — DART alotMatter 6년 배당 이력 시딩"
git push origin main
```

---

## 완료 보고 형식

```
STEP 44 완료. push까지 끝났습니다.

변경 요약:
- seed-dividends.py 신규 작성 (DART alotMatter.json)
- dividends: 0 → N행 (TOP 200 × 최대 6년)
- DividendAnalysis.tsx: 32줄 스텁 → ~220줄 실제 컴포넌트
- 구성: 4지표 카드 + DPS 바차트 + Yield 라인 + Payout 라인

누계 DB: stocks 2,780 / financials 576 / stock_prices 54,899 / supply_demand 3,000 / dividends N

다음: STEP 45+ — 전종목 팩터 집계 → QuantAnalysis 재활성화
```

---

## STEP 45+ 예고
**QuantAnalysis 재활성화 — 전종목 팩터 집계 파이프라인**
- 밸류 팩터 퍼센타일 (PER/PBR/PSR 역순위)
- 모멘텀 팩터 퍼센타일 (3M/6M/12M 수익률 stock_prices 에서 계산)
- 퀄리티 팩터 퍼센타일 (ROE/영업이익률 financials 에서 계산)
- 종합 점수 (가중 평균) 및 섹터 내 상대 순위
