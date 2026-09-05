# STEP 40 — ValueAnalysis.tsx 정직한 재작성 (DART 실재무 시계열 연결)

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

## 목표
`components/analysis/ValueAnalysis.tsx` 를 **가짜 계산값·하드코딩 제거** + **STEP 36~39 에서 쌓은 DART/KIS 실재무 시계열 노출** 방향으로 재작성. V3 방향성(AI 리포트 제외) 준수.

## 전제 상태
- 이전 커밋: `6595c27` (STEP 39 DART 파서 보완 + TOP 100 확장)
- `financials` 테이블: KIS 스냅샷 383 + DART 연간 193 = 누계 576건
- 테마 50종목 중 37종 DART 실재무 커버

## 왜 재작성인가 (현재 코드의 심각한 문제)
- `currentPrice = 52000` 하드코딩
- `sharesOutstanding = 100_000_000` 하드코딩
- `displayPer = per ?? 12.5` (DB 없으면 가짜 숫자 표시)
- `SECTOR_AVERAGES` 전체 하드코딩 (`per: 15.2` 등)
- `ai_analyses` 테이블 쿼리 + AI Summary 섹션 — **V3 전면 제외 대상인데 남아있음**
- DCF/그레이엄: 입력값(현재가·주식수·FCF)이 부실해 숫자 의미 없음

이 모든 게 CLAUDE.md 의 **"session-context.md 에 없는 숫자 만들기 금지"** 와 `docs/PRODUCT_SPEC_V3.md` 의 V3 제외 항목에 어긋남.

---

## Part A — ValueAnalysis.tsx 재작성

### A-1. 제거할 것
- `import type { AIAnalysis }` + `ai_analyses` 테이블 쿼리 + AI Summary 섹션 전체
- `SECTOR_AVERAGES` 상수 전체 + 섹터 비교 차트 + 저평가/고평가 배지 (섹터 평균 큐레이션 전까지는 의미 없음)
- 하드코딩 fallback (`per ?? 12.5`, `eps ?? 5200`, `currentPrice = 52000`, `sharesOutstanding = 100_000_000`)
- DCF 모델 섹션 전체 (성장률·할인율·FCF 모두 추정/고정값 — 근거 없음)
- 그레이엄 안전마진 섹션 (현재가·적정가 비교 불가능 → 무의미)
- `calculateGrahamValue`, `calculateSafetyMargin` import (사용 중단)

### A-2. 유지할 것
- 상단 핵심 밸류에이션 지표 카드 (PER/PBR/EPS/BPS 등) — 단, 하드코딩 fallback 없이 `latest?.per ?? null` 로 바꾸고 null 이면 `—` 표시
- `DisclaimerBanner`
- 로딩 스피너

### A-3. 새로 추가할 것

#### 섹션 1: 핵심 지표 (리팩토링된 기존 섹션)
```tsx
const metrics = [
  { label: 'PER', value: latest?.per, desc: '주가수익비율' },
  { label: 'PBR', value: latest?.pbr, desc: '주가순자산비율' },
  { label: 'ROE', value: latest?.roe ?? (latest?.eps && latest?.bps ? (latest.eps / latest.bps) * 100 : null), desc: '자기자본이익률(%)' },
  { label: 'EPS', value: latest?.eps, desc: '주당순이익' },
  { label: 'BPS', value: latest?.bps, desc: '주당순자산' },
];
```
렌더: 섹터 평균/배지 없이, 값만 깔끔하게. null 은 `—`.

#### 섹션 2: 손익계산서 시계열 (신규)
```tsx
// financials 는 이미 period_date DESC 로 정렬됨
const incomeSeries = [...financials]
  .filter(f => f.revenue != null || f.operating_income != null || f.net_income != null)
  .reverse()  // 차트는 과거→현재
  .map(f => ({
    period: f.period_date.slice(0, 4),  // '2024-12-31' → '2024'
    revenue: f.revenue ? f.revenue / 1_0000_0000 : null,  // 억 단위
    operating_income: f.operating_income ? f.operating_income / 1_0000_0000 : null,
    net_income: f.net_income ? f.net_income / 1_0000_0000 : null,
  }));
```
차트: recharts `<LineChart>` 또는 `<ComposedChart>` 로 3라인. 단위 "억".

**데이터 없으면**: `<ComingSoonCard title="손익 시계열" description="해당 종목은 DART 재무제표 수집 대상에 아직 포함되지 않았습니다." />`.

#### 섹션 3: 수익성·안정성 지표 추이 (신규)
```tsx
const marginSeries = [...financials]
  .filter(f => f.operating_margin != null || f.net_margin != null || f.debt_ratio != null)
  .reverse()
  .map(f => ({
    period: f.period_date.slice(0, 4),
    opMargin: f.operating_margin,
    netMargin: f.net_margin,
    debtRatio: f.debt_ratio,
  }));
```
차트: 3개 서브차트 또는 한 개 LineChart 에 3라인. 단위 "%".

### A-4. 구현 가이드

**전체 구조**:
```tsx
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Financial } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import ComingSoonCard from '@/components/common/ComingSoonCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface Props {
  stockId: number;
}

function formatNum(n: number | null | undefined, digits = 2, suffix = ''): string {
  if (n == null || isNaN(n)) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: digits })}${suffix}`;
}

export default function ValueAnalysis({ stockId }: Props) {
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('financials')
        .select('*')
        .eq('stock_id', stockId)
        .eq('period_type', 'annual')
        .order('period_date', { ascending: false })
        .limit(5);
      if (data) setFinancials(data as Financial[]);
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

  const latest = financials[0] ?? null;

  const metrics = [
    { label: 'PER', value: latest?.per, desc: '주가수익비율', suffix: '배' },
    { label: 'PBR', value: latest?.pbr, desc: '주가순자산비율', suffix: '배' },
    {
      label: 'ROE',
      value: latest?.roe ?? (latest?.eps && latest?.bps && latest.bps !== 0 ? (latest.eps / latest.bps) * 100 : null),
      desc: '자기자본이익률',
      suffix: '%',
    },
    { label: 'EPS', value: latest?.eps, desc: '주당순이익', suffix: '원' },
    { label: 'BPS', value: latest?.bps, desc: '주당순자산', suffix: '원' },
  ];

  const incomeSeries = [...financials]
    .filter(f => f.revenue != null || f.operating_income != null || f.net_income != null)
    .reverse()
    .map(f => ({
      period: f.period_date.slice(0, 4),
      revenue: f.revenue ? Math.round(f.revenue / 1_0000_0000) : null,
      operating_income: f.operating_income ? Math.round(f.operating_income / 1_0000_0000) : null,
      net_income: f.net_income ? Math.round(f.net_income / 1_0000_0000) : null,
    }));

  const marginSeries = [...financials]
    .filter(f => f.operating_margin != null || f.net_margin != null || f.debt_ratio != null)
    .reverse()
    .map(f => ({
      period: f.period_date.slice(0, 4),
      opMargin: f.operating_margin,
      netMargin: f.net_margin,
      debtRatio: f.debt_ratio,
    }));

  const hasIncomeData = incomeSeries.length > 0;
  const hasMarginData = marginSeries.length > 0;

  return (
    <div className="space-y-6">
      {/* 핵심 밸류에이션 지표 */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          핵심 밸류에이션 지표
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-dark-700 rounded-lg p-4 border border-border">
              <p className="text-xs text-text-secondary mb-1">{m.desc}</p>
              <p className="text-base font-bold font-mono-price">{m.label}</p>
              <p className="text-2xl font-bold font-mono-price mt-1 text-text-primary">
                {formatNum(m.value, 2, m.suffix)}
              </p>
            </div>
          ))}
        </div>
        {latest?.period_date && (
          <p className="text-xs text-text-secondary/70 mt-2">
            기준: {latest.period_date} ({latest.period_type}){latest.source ? ` · 출처 ${latest.source}` : ''}
          </p>
        )}
      </div>

      {/* 손익 시계열 */}
      {hasIncomeData ? (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            손익계산서 추이 (단위: 억원)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeSeries} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="period" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="매출액" stroke="#0ABAB5" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="operating_income" name="영업이익" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="net_income" name="당기순이익" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <ComingSoonCard
          title="손익계산서 시계열"
          description="해당 종목은 DART 재무제표 수집 대상에 아직 포함되지 않았습니다. 시총 TOP 100 종목 우선 커버 중 — 확장 예정."
        />
      )}

      {/* 수익성/안정성 지표 */}
      {hasMarginData ? (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            수익성·안정성 지표 (단위: %)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginSeries} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="period" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
                <Line type="monotone" dataKey="opMargin" name="영업이익률" stroke="#0ABAB5" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="netMargin" name="순이익률" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="debtRatio" name="부채비율" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <DisclaimerBanner />
    </div>
  );
}
```

### A-5. 파일 덮어쓰기
위 전체 코드로 `components/analysis/ValueAnalysis.tsx` 를 **완전 덮어쓰기**. 기존 315줄 → 약 150줄로 축소.

---

## Part B — 빌드 검증

### B-1. 타입체크 + 린트
```bash
npm run typecheck 2>&1 | tail -30 || npx tsc --noEmit 2>&1 | tail -30
```
**기대**: 에러 0건. 주의할 점:
- `calculateGrahamValue`, `calculateSafetyMargin`, `formatPercent`, `formatNumber` 등 미사용 import 제거 확인
- `AIAnalysis` type import 제거 확인 (여전히 다른 곳에서 쓰이는지 주의)
- `BarChart`, `Bar`, `Cell`, `Brain`, `Shield`, `Calculator` 등 불필요 import 제거

### B-2. 빌드
```bash
npm run build 2>&1 | tail -50
```
**기대**: 성공. 실패 시 에러 로그 보고 즉시 수정.

---

## Part C — 브라우저 검증

### C-1. 개발 서버
```bash
npm run dev
```

### C-2. 검증 URL
- `http://localhost:3000/stocks/005930/analysis` (삼성전자 — DART 실재무 커버)
- `http://localhost:3000/stocks/000660/analysis` (SK하이닉스 — STEP 39 에서 CIS fallback 으로 복구된 종목)
- `http://localhost:3000/stocks/012330/analysis` (현대모비스 — TOP 100 안에 있는 일반 종목)

**체크 포인트**:
- [ ] 상단 KPI 5개 카드가 숫자로 채워짐 (PER/PBR/ROE/EPS/BPS)
- [ ] 손익계산서 라인차트가 매출·영업이익·순이익 3개 라인으로 표시됨
- [ ] 수익성·안정성 차트가 영업이익률·순이익률·부채비율로 표시됨
- [ ] 기존 DCF/그레이엄/AI Summary 섹션이 보이지 않음 (완전 제거됨)
- [ ] DART 커버 안 된 종목(예: `http://localhost:3000/stocks/051900/analysis` LG생활건강 — 시총 TOP 100 바깥일 수 있음)은 ComingSoonCard 표시

### C-3. 스냅샷 비교
이전: 가짜 DCF 적정가치 · 고정 52000원 현재가 · 가짜 섹터평균 PER 15.2
이후: 실제 DART 매출 시계열 · KIS PER/PBR 실숫자 · 영업이익률 추이

---

## Part D — 문서 갱신 + 커밋

### D-1. 문서 4개 헤더 날짜 오늘로 갱신
- `CLAUDE.md`, `docs/CHANGELOG.md`, `session-context.md`, `docs/NEXT_SESSION_START.md`

### D-2. `docs/CHANGELOG.md` 상단 블록
```markdown
## 2026-04-22 — STEP 40: ValueAnalysis 정직한 재작성

**코드 변경**
- `components/analysis/ValueAnalysis.tsx` 전면 재작성 (315줄 → 약 150줄)
  - 제거: AI Summary 섹션, ai_analyses 테이블 쿼리, DCF 모델, 그레이엄 안전마진, 섹터 평균 하드코딩, placeholder fallback 숫자
  - 추가: DART 실재무 시계열 차트 (매출·영업이익·순이익 5년), 수익성·안정성 지표 추이 (영업이익률·순이익률·부채비율)
  - 유지: 상단 KPI 카드 5개 (PER/PBR/ROE/EPS/BPS), 단 null 일 때 `—` 표시

**방향성**
- CLAUDE.md 절대규칙 준수: "session-context.md 에 없는 숫자 만들기 금지"
- V3 방향성 준수: AI 리포트 제거
- 데이터 없는 종목은 ComingSoonCard 로 정직 표시
```

### D-3. `session-context.md` 완료 블록
```markdown
## 2026-04-22 세션 — STEP 40 완료

- [x] ValueAnalysis.tsx 전면 재작성 (가짜값 제거 + DART 실재무 연결)
- [x] 삼성전자·SK하이닉스 브라우저 검증
- [ ] STEP 41 후보: QuantAnalysis / DividendAnalysis 동일 방향 정리
- [ ] STEP 41 후보: 분기 재무 수집 (REPRT_CODE=11013/11012/11014)
```

### D-4. `docs/NEXT_SESSION_START.md` 갱신
최신 상태:
- ValueAnalysis 실데이터 전환 완료
- 다음: Quant/Dividend/Technical/Supply 탭 동일 방향 정리 또는 분기 재무 수집

### D-5. 커밋 + 푸시
```bash
git add components/analysis/ValueAnalysis.tsx CLAUDE.md docs/CHANGELOG.md docs/NEXT_SESSION_START.md session-context.md docs/STEP_40_COMMAND.md
git status
git commit -m "$(cat <<'EOF'
STEP 40: ValueAnalysis 정직한 재작성

- 하드코딩 제거: currentPrice=52000, sharesOutstanding, SECTOR_AVERAGES, placeholder fallback 숫자
- 섹션 제거: AI Summary, DCF 모델, 그레이엄 안전마진, 섹터 평균 비교
  - V3 방향성(AI 리포트 제외) + CLAUDE.md "없는 숫자 만들기 금지" 규칙 준수
- 신규 섹션: 손익계산서 시계열(매출·영업이익·순이익 5년), 수익성·안정성 추이(영업이익률·순이익률·부채비율)
- null 은 '—' 로 정직 표시, DART 미커버 종목은 ComingSoonCard
EOF
)"
git push
```

---

## STEP 41 예고

**두 방향 중 택일:**

1. **다른 분석 탭 동일 정리** (권장)
   - `QuantAnalysis.tsx`, `DividendAnalysis.tsx`, `TechnicalAnalysis.tsx`, `SupplyAnalysis.tsx` 도 ValueAnalysis 와 같은 위생 작업 필요 (placeholder 하드코딩 / AI 섹션 / 가짜 계산값 등 예상)
   - 각 탭이 어떤 DB 데이터를 써야 하는지 매핑:
     - Quant: `financials` 의 지표 조합 (ROE 추이, PER 분위 등)
     - Dividend: `dividends` 테이블 (있는지 확인 필요)
     - Technical: `stock_prices` (STEP 41+ 에서 시딩 필요)
     - Supply: `supply_demand` 테이블

2. **분기 재무 수집**
   - `REPRT_CODE=11013 python3 scripts/seed-dart-financials.py` (1Q)
   - `REPRT_CODE=11012 ...` (반기)
   - `REPRT_CODE=11014 ...` (3Q)
   - 분기 시계열까지 포함되면 더 풍부한 차트 가능

권장: **1번** — STEP 40 과 같은 "정직 재작성" 을 다른 탭에도 적용하는 게 UX 일관성 높음.

---

## 롤백
```bash
git revert HEAD  # 커밋 하나만 되돌림
git push
```
