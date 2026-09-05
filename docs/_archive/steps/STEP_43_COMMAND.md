# STEP 43 — SupplyAnalysis 재활성화 (KIS per-stock investor-flow 수집)

**실행 명령어 (Sonnet)**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

Claude Code 안에서:
```
@docs/STEP_43_COMMAND.md 파일 내용대로 실행해줘
```

---

## 목표
1. `scripts/seed-supply-demand.py` 신규 작성 → KIS `FHKST01010900` 종목별 투자자별 매매동향 API로 시총 TOP 100 + 관심종목 **최근 60영업일** 수급 시딩
2. `components/analysis/SupplyAnalysis.tsx` 를 스텁 → **실제 수급 분석 컴포넌트**로 재작성
   - 외국인·기관·개인 일별 순매수 스택 바차트
   - 3주체 누적 순매수 라인차트
   - 최근 5일 요약 테이블
   - 60일 합계 카드

## 전제 상태
- 직전 커밋: `918d3af` (STEP 42 — TechnicalAnalysis 재활성화 + stock_prices 54,899행)
- `components/analysis/SupplyAnalysis.tsx` 는 현재 32줄 스텁 카드
- `supply_demand` 테이블 존재 (001_initial_schema.sql line 105, UNIQUE(stock_id, trade_date))
- 기존 `app/api/kis/investor/route.ts` 에 FHKST01010900 참고 구현 (최근 10일만 반환)
- KIS 응답 필드:
  - `stck_bsop_date` (YYYYMMDD)
  - `frgn_ntby_qty` — 외국인 순매수 수량
  - `orgn_ntby_qty` — 기관 순매수 수량
  - `prsn_ntby_qty` — 개인 순매수 수량
  - `frgn_ntby_tr_pbmn` — 외국인 순매수 거래대금
  - `orgn_ntby_tr_pbmn` — 기관 순매수 거래대금

---

## Part A — seed-supply-demand.py 작성

`scripts/seed-supply-demand.py` 신규 파일 작성 (전체 내용 아래):

```python
#!/usr/bin/env python3
"""
KIS API FHKST01010900 (종목별 투자자별 매매동향) → supply_demand 테이블 upsert.
- 한 번 호출에 최근 ~60영업일치 일별 외국인/기관/개인 순매수 반환
- 대상: 시총 TOP 100 + watchlist + 005930
"""
import os
import sys
import time
import warnings
from datetime import datetime

warnings.filterwarnings('ignore')

import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

SB_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SB_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
KIS_KEY = os.getenv('KIS_APP_KEY')
KIS_SECRET = os.getenv('KIS_APP_SECRET')
KIS_BASE = os.getenv('KIS_BASE_URL', 'https://openapi.koreainvestment.com:9443')

for var, val in [('SUPABASE_URL', SB_URL), ('SUPABASE_KEY', SB_KEY),
                 ('KIS_APP_KEY', KIS_KEY), ('KIS_APP_SECRET', KIS_SECRET)]:
    if not val:
        print(f'ERROR: {var} 누락')
        sys.exit(1)

sb = create_client(SB_URL, SB_KEY)
TOP_N = int(os.getenv('TOP_N', '100'))
RATE_LIMIT_SEC = float(os.getenv('KIS_SLEEP', '0.15'))  # 150ms 여유


# ── 1. KIS 액세스 토큰 ───────────────────────────────────────────────────────
print('[1/4] KIS 액세스 토큰 발급 중...')
token = None
for attempt in range(5):
    r = requests.post(
        f'{KIS_BASE}/oauth2/tokenP',
        headers={'Content-Type': 'application/json; charset=UTF-8'},
        json={
            'grant_type': 'client_credentials',
            'appkey': KIS_KEY,
            'appsecret': KIS_SECRET,
        },
        timeout=15,
    )
    if r.status_code == 200 and 'access_token' in r.json():
        token = r.json()['access_token']
        break
    err = r.json().get('error_description', r.text)
    print(f'  토큰 발급 실패 ({attempt+1}/5): {err} → 65초 대기')
    time.sleep(65)

if not token:
    print('ERROR: KIS 토큰 발급 5회 실패')
    sys.exit(1)
print('  토큰 발급 완료')

KIS_HEADERS = {
    'Content-Type': 'application/json',
    'authorization': f'Bearer {token}',
    'appkey': KIS_KEY,
    'appsecret': KIS_SECRET,
    'tr_id': 'FHKST01010900',
}


def safe_int(v):
    try:
        if v is None or v == '':
            return None
        return int(float(v))
    except Exception:
        return None


def get_investor_flow(symbol: str):
    """KIS FHKST01010900 → list of daily investor flow rows (~60 days)"""
    try:
        resp = requests.get(
            f'{KIS_BASE}/uapi/domestic-stock/v1/quotations/inquire-investor',
            headers=KIS_HEADERS,
            params={'FID_COND_MRKT_DIV_CODE': 'J', 'FID_INPUT_ISCD': symbol},
            timeout=15,
        )
        if resp.status_code != 200:
            return None
        return resp.json().get('output', []) or []
    except Exception:
        return None


# ── 2. 대상 종목 선정 ────────────────────────────────────────────────────────
print(f'[2/4] 대상 종목 선정 (시총 TOP {TOP_N} + watchlist + 005930)')

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

# watchlist
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

# 005930 필수
r005_rows = (
    sb.table('stocks')
    .select('id')
    .eq('symbol', '005930')
    .eq('market', 'KOSPI')
    .limit(1)
    .execute()
    .data or []
)
if r005_rows:
    targets[('005930', 'KOSPI')] = r005_rows[0]['id']

print(f'  대상 {len(targets)}종목')


# ── 3. KIS 수급 조회 루프 ────────────────────────────────────────────────────
print('[3/4] KIS FHKST01010900 수급 수집 중...')
supply_rows = []
failed = []
processed = 0
total = len(targets)

for (symbol, market), stock_id in targets.items():
    processed += 1
    if processed % 20 == 0:
        print(f'  진행: {processed} / {total}')

    rows = get_investor_flow(symbol)
    time.sleep(RATE_LIMIT_SEC)

    if rows is None:
        failed.append(symbol)
        continue

    for r in rows:
        raw_date = r.get('stck_bsop_date', '')
        if not raw_date or len(raw_date) != 8:
            continue
        try:
            trade_date = datetime.strptime(raw_date, '%Y%m%d').date().isoformat()
        except Exception:
            continue

        supply_rows.append({
            'stock_id': stock_id,
            'trade_date': trade_date,
            'foreign_net': safe_int(r.get('frgn_ntby_qty')),
            'institution_net': safe_int(r.get('orgn_ntby_qty')),
            'individual_net': safe_int(r.get('prsn_ntby_qty')),
        })

print(f'  수집 완료: {len(supply_rows)}행, 실패 {len(failed)}종목')
if failed[:5]:
    print(f'  실패 일부: {failed[:5]}')


# ── 4. 배치 upsert ───────────────────────────────────────────────────────────
print(f'[4/4] supply_demand 총 {len(supply_rows)}행 upsert 시작')
BATCH = 1000
upserted = 0
for i in range(0, len(supply_rows), BATCH):
    chunk = supply_rows[i:i + BATCH]
    sb.table('supply_demand').upsert(chunk, on_conflict='stock_id,trade_date').execute()
    upserted += len(chunk)
    print(f'  supply_demand upserted: {upserted}행')

count = sb.table('supply_demand').select('id', count='exact').execute().count
print(f'\n[완료] supply_demand 테이블 총 {count}행')
```

---

## Part B — 시딩 실행

### B-1. 사전 점검
```bash
cd ~/Desktop/OTMarketing

# Python 의존성 확인
python3 -c "import requests, supabase; print('OK')"

# 현재 supply_demand 카운트 (시작점)
python3 scripts/sql-exec.py "SELECT COUNT(*) FROM supply_demand"
```

### B-2. 실행
```bash
python3 scripts/seed-supply-demand.py
```

**예상 출력**:
```
[1/4] KIS 액세스 토큰 발급 중...
  토큰 발급 완료
[2/4] 대상 종목 선정 (시총 TOP 100 + watchlist + 005930)
  대상 ~130종목
[3/4] KIS FHKST01010900 수급 수집 중...
  진행: 20 / 130
  ...
  수집 완료: ~7800행, 실패 N종목
[4/4] supply_demand 총 ~7800행 upsert 시작
  supply_demand upserted: 1000행
  ...
[완료] supply_demand 테이블 총 ~7800행
```

**예상 소요 시간**: 130종목 × 150ms = **약 20초**

### B-3. 검증
```bash
# 1. 총 행수
python3 scripts/sql-exec.py "SELECT COUNT(*) FROM supply_demand"

# 2. 삼성전자 최근 5일 샘플
python3 scripts/sql-exec.py "SELECT trade_date, foreign_net, institution_net, individual_net FROM supply_demand sd JOIN stocks s ON s.id = sd.stock_id WHERE s.symbol = '005930' ORDER BY trade_date DESC LIMIT 5"

# 3. 커버된 종목 수
python3 scripts/sql-exec.py "SELECT COUNT(DISTINCT stock_id) FROM supply_demand"
```

**예상**:
- 총 ~7,800행 (130종목 × 60영업일)
- 삼성전자 최근 5일 정상 출력
- 커버 종목 ~125개 (일부 실패 허용)

---

## Part C — SupplyAnalysis.tsx 재작성

`components/analysis/SupplyAnalysis.tsx` 전체 내용을 아래로 교체:

```tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupplyDemand } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Users, TrendingUp, BarChart3 } from 'lucide-react';

interface Props {
  stockId: number;
}

function formatAmount(n: number | null | undefined): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('ko-KR');
}

function formatSignedShares(n: number | null | undefined): string {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('ko-KR')}`;
}

function netColor(n: number | null | undefined): string {
  if (n == null || n === 0) return 'text-text-secondary';
  return n > 0 ? 'text-red-400' : 'text-blue-400';
}

export default function SupplyAnalysis({ stockId }: Props) {
  const [rows, setRows] = useState<SupplyDemand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('supply_demand')
        .select('*')
        .eq('stock_id', stockId)
        .order('trade_date', { ascending: true })
        .limit(90);
      if (data) setRows(data as SupplyDemand[]);
      setLoading(false);
    }
    load();
  }, [stockId]);

  // 누적 순매수 계산 — early return 이전에 호출
  const chartData = useMemo(() => {
    if (rows.length === 0) return [];
    let cumF = 0;
    let cumI = 0;
    let cumP = 0;
    return rows.map(r => {
      cumF += r.foreign_net ?? 0;
      cumI += r.institution_net ?? 0;
      cumP += r.individual_net ?? 0;
      return {
        date: r.trade_date,
        foreign: r.foreign_net,
        institution: r.institution_net,
        individual: r.individual_net,
        cumForeign: cumF,
        cumInstitution: cumI,
        cumIndividual: cumP,
      };
    });
  }, [rows]);

  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const sum = rows.reduce(
      (acc, r) => ({
        foreign: acc.foreign + (r.foreign_net ?? 0),
        institution: acc.institution + (r.institution_net ?? 0),
        individual: acc.individual + (r.individual_net ?? 0),
      }),
      { foreign: 0, institution: 0, individual: 0 }
    );
    return { ...sum, days: rows.length };
  }, [rows]);

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
          <Users className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            수급 분석 — 데이터 부족
          </h3>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            해당 종목은 아직 투자자별 매매동향 수집 대상에 포함되지 않았습니다. 시총 TOP 100 + 관심종목 우선 커버 중 — 확장 예정.
          </p>
        </div>
        <DisclaimerBanner />
      </div>
    );
  }

  const recent5 = [...rows].slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* 60일 합계 카드 */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          투자자별 합계 (최근 {summary?.days}영업일, 단위: 주)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '외국인', value: summary?.foreign ?? 0, color: '#0ABAB5' },
            { label: '기관', value: summary?.institution ?? 0, color: '#F59E0B' },
            { label: '개인', value: summary?.individual ?? 0, color: '#8B5CF6' },
          ].map(m => (
            <div key={m.label} className="bg-dark-700 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <p className="text-xs text-text-secondary">{m.label} 순매수 합계</p>
              </div>
              <p className={`text-2xl font-bold font-mono-price ${netColor(m.value)}`}>
                {formatSignedShares(m.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 일별 순매수 스택 바차트 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          일별 순매수 (단위: 주)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={40} />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={formatAmount}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value: number) => value.toLocaleString('ko-KR')}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#6B7280" />
              <Bar dataKey="foreign" name="외국인" fill="#0ABAB5" stackId="stack" />
              <Bar dataKey="institution" name="기관" fill="#F59E0B" stackId="stack" />
              <Bar dataKey="individual" name="개인" fill="#8B5CF6" stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 누적 순매수 라인차트 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          누적 순매수 추이 (단위: 주)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={40} />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={formatAmount}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value: number) => value.toLocaleString('ko-KR')}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#6B7280" />
              <Line type="monotone" dataKey="cumForeign" name="외국인 누적" stroke="#0ABAB5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cumInstitution" name="기관 누적" stroke="#F59E0B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cumIndividual" name="개인 누적" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 최근 5일 요약 테이블 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">최근 5영업일 순매수 (단위: 주)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="py-2 px-3 text-left font-normal">거래일</th>
                <th className="py-2 px-3 text-right font-normal">외국인</th>
                <th className="py-2 px-3 text-right font-normal">기관</th>
                <th className="py-2 px-3 text-right font-normal">개인</th>
              </tr>
            </thead>
            <tbody>
              {recent5.map(r => (
                <tr key={r.trade_date} className="border-b border-border/50">
                  <td className="py-2 px-3 text-text-primary">{r.trade_date}</td>
                  <td className={`py-2 px-3 text-right font-mono-price ${netColor(r.foreign_net)}`}>
                    {formatSignedShares(r.foreign_net)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono-price ${netColor(r.institution_net)}`}>
                    {formatSignedShares(r.institution_net)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono-price ${netColor(r.individual_net)}`}>
                    {formatSignedShares(r.individual_net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary/70 mt-3">
          양수(빨강) = 순매수, 음수(파랑) = 순매도. 출처: KIS 투자자별 매매동향
        </p>
      </div>

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

**실패 조건**:
- `SupplyDemand` 타입 import 누락 → 이미 `types/stock.ts` 에 존재하므로 OK
- `BarChart` 컴포넌트 stackOffset 속성 문제 — recharts 최신 버전 지원 확인

---

## Part E — 로컬 브라우저 검증

```bash
npm run dev
```

- http://localhost:3000/stocks/005930/analysis 접속
- **수급 분석** 탭 클릭
- 확인사항:
  1. 3개 합계 카드 (외국인·기관·개인 순매수 합계) 표시, 양수=빨강/음수=파랑
  2. 일별 순매수 스택 바차트 — 양수는 위로, 음수는 아래로 쌓임, 0축 참조선
  3. 누적 순매수 라인차트 — 3개 라인
  4. 최근 5일 테이블 — 날짜·외국인·기관·개인
- 커버 안 된 소형주 접속 시 "데이터 부족" 카드 표시

---

## Part F — 문서 업데이트 + 커밋

### F-1. 4개 문서 헤더 날짜 오늘로 업데이트
`CLAUDE.md`, `docs/CHANGELOG.md`, `session-context.md`, `docs/NEXT_SESSION_START.md` 첫 줄 날짜를 **오늘 (2026-04-22)** 로 갱신.

### F-2. CHANGELOG.md 최상단 추가

```markdown
## 2026-04-22 — STEP 43: SupplyAnalysis 재활성화 (KIS FHKST01010900 수급 시딩)
- **Script**: `scripts/seed-supply-demand.py` 신규 — KIS 종목별 투자자별 매매동향 API로 TOP 100 + watchlist 대상 최근 60영업일 수급 수집
- **Data**: supply_demand 테이블 ~7,800행 시딩
- **Component**: `components/analysis/SupplyAnalysis.tsx` 스텁(32줄) → 실제 수급 분석 컴포넌트(~270줄)
  - 60일 합계 카드 (외국인·기관·개인)
  - 일별 순매수 스택 바차트 (양수=빨강, 음수=파랑)
  - 누적 순매수 라인차트
  - 최근 5일 요약 테이블
- 다음 STEP 44 → DART 배당 공시 수집 → DividendAnalysis 재활성화
```

### F-3. session-context.md + NEXT_SESSION_START.md
STEP 43 완료, supply_demand 행수, 다음 할 일 (STEP 44 배당) 기록.

누계 DB:
- stocks 2,780
- financials 576+
- stock_prices 54,899
- **supply_demand ~7,800 (신규)**
- dart_corp_codes 3,959

### F-4. 커밋 + 푸시
```bash
git add scripts/seed-supply-demand.py components/analysis/SupplyAnalysis.tsx CLAUDE.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md docs/STEP_43_COMMAND.md session-context.md
git commit -m "STEP 43: SupplyAnalysis 재활성화 — KIS 투자자별 매매동향 60영업일 시딩"
git push origin main
```

---

## 완료 보고 형식 (사용자에게 붙여넣기)

```
STEP 43 완료. push까지 끝났습니다.

변경 요약:
- seed-supply-demand.py 신규 작성 (KIS FHKST01010900)
- supply_demand: 0 → ~7,800행 (130종목 × 60영업일)
- SupplyAnalysis.tsx: 32줄 스텁 → ~270줄 실제 컴포넌트
- 구성: 합계 카드 + 스택 바차트 + 누적 라인 + 최근 5일 테이블

누계 DB: stocks 2,780 / financials 576 / stock_prices 54,899 / supply_demand 7,800

다음 로드맵:
- STEP 44: DART 배당 공시 → DividendAnalysis
- STEP 45+: 전종목 팩터 집계 → QuantAnalysis
```

---

## STEP 44 예고
**DividendAnalysis 재활성화 — DART 배당 공시 수집**
1. DART 정기공시 배당 관련 보고서(`rcp_no` 기반) 크롤링 또는 fnlttSinglAcntAll 배당 항목 추출
2. `scripts/seed-dividends.py` 신규 작성 — 시총 TOP 200 대상 최근 5년 배당 이력
3. DividendAnalysis.tsx 재작성 — 배당 수익률 추이 · 배당 성향 · 배당 성장률
