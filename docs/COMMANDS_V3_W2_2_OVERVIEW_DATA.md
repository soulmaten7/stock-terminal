<!-- 2026-04-18 -->
# V3 W2.2 — 개요 탭 실데이터 연동 + DART 인프라

> 이 문서는 **Claude Code 가 읽고 실행하기 위한 명령 문서** 이다.
> Cowork 가 설계한 W2 Phase 1 중 두 번째 단계.
> 앞선 단계: `docs/COMMANDS_V3_W2_1_STOCK_DETAIL.md` (8탭 구조 + 라이트 테마 완료)

**모델**: Sonnet (기본)
**실행 위치**: `~/Desktop/OTMarketing`

## 🎯 이번 세션 목표

기존 OverviewTab 의 8개 KPI placeholder (`—`) 를 실데이터로 치환 + DART 인프라 구축.

### 데이터 소스 매핑

| KPI | 데이터 소스 | 비고 |
|---|---|---|
| 시가총액 | `stocks.market_cap` | 이미 DB 에 있음 |
| PER | `financials.per` 최신값 | annual latest |
| PBR | `financials.pbr` 최신값 | annual latest |
| EPS | `financials.eps` 최신값 | annual latest |
| BPS | `financials.bps` 최신값 | annual latest |
| ROE | `financials.roe` 최신값 | annual latest |
| 배당수익률 | (임시 `—`) | Phase 2 에서 DART 배당 데이터 |
| 52주 범위 | `stock_prices` 최근 1년 min/max | stock_prices 테이블 쿼리 |
| 기업개황 | DART `/company.json` | W2.2 에서 연동 |

### 원칙
- **DART 키가 없어도** KPI 7개 (배당 제외) + 기업개황 fallback 은 동작.
- DART 키 있으면 기업개황 실데이터.

---

## STEP 0 — 사전 확인

```bash
cd ~/Desktop/OTMarketing && git status && npm run build 2>&1 | tail -20
```

---

## STEP 1 — DART corp codes 테이블 마이그레이션

**신규 파일**: `supabase/migrations/006_dart_corp_codes.sql`

```sql
-- DART CORPCODE → 종목코드 매핑
create table if not exists public.dart_corp_codes (
  corp_code text primary key,
  corp_name text,
  stock_code text unique,
  created_at timestamptz default now()
);

create index if not exists idx_dart_corp_codes_stock_code
  on public.dart_corp_codes (stock_code);

alter table public.dart_corp_codes enable row level security;

create policy "public read dart_corp_codes"
  on public.dart_corp_codes for select
  using (true);
```

**실행**:
```bash
cd ~/Desktop/OTMarketing && npx supabase db push --include-all
```

- 권한 이슈 있으면 Supabase Studio SQL Editor 에 직접 붙여넣어 실행 (사용자에게 안내).

---

## STEP 2 — DART API 래퍼 `lib/dart.ts`

**신규 파일**: `lib/dart.ts`

```typescript
// DART OpenAPI 래퍼.
// 인증키: https://opendart.fss.or.kr/ 무료 발급 후 .env.local 에 DART_API_KEY=... 로 설정.
// 키 없으면 에러 throw — 호출 측에서 try-catch 로 처리.

const DART_BASE_URL = 'https://opendart.fss.or.kr/api';

export class DartKeyMissingError extends Error {
  constructor() {
    super('DART_API_KEY not set');
    this.name = 'DartKeyMissingError';
  }
}

export async function fetchDart<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) throw new DartKeyMissingError();

  const url = new URL(`${DART_BASE_URL}${endpoint}`);
  url.searchParams.set('crtfc_key', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`DART API HTTP ${res.status}`);
  const data = await res.json();
  if (data.status && data.status !== '000') {
    throw new Error(`DART API status=${data.status} msg=${data.message ?? 'unknown'}`);
  }
  return data as T;
}

export async function getDartCorpCode(symbol: string): Promise<string | null> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('dart_corp_codes')
    .select('corp_code')
    .eq('stock_code', symbol)
    .maybeSingle();
  return (data as { corp_code: string } | null)?.corp_code ?? null;
}
```

---

## STEP 3 — 기업개황 API `/api/dart/company`

**신규 파일**: `app/api/dart/company/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fetchDart, getDartCorpCode, DartKeyMissingError } from '@/lib/dart';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  }

  try {
    const corpCode = await getDartCorpCode(symbol);
    if (!corpCode) {
      return NextResponse.json(
        { error: 'corp_code not found — run scripts/seed-dart-corpcodes.py' },
        { status: 404 }
      );
    }

    const raw = await fetchDart<{
      corp_name: string;
      ceo_nm: string;
      adres: string;
      hm_url: string;
      phn_no: string;
      induty_code: string;
      est_dt: string;
    }>('/company.json', { corp_code: corpCode });

    return NextResponse.json({
      symbol,
      name: raw.corp_name,
      ceo: raw.ceo_nm,
      address: raw.adres,
      homepage: raw.hm_url,
      phone: raw.phn_no,
      industry: raw.induty_code,
      established: raw.est_dt,
    });
  } catch (err) {
    if (err instanceof DartKeyMissingError) {
      return NextResponse.json(
        { error: 'DART_API_KEY not configured', fallback: true },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

---

## STEP 4 — 개요 탭 집계 API `/api/stocks/overview`

**신규 파일**: `app/api/stocks/overview/route.ts`

> 모든 KPI 를 **한 번의 호출** 로 가져오도록 집계. OverviewTab 은 이 엔드포인트 하나만 호출.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function formatKRW(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_0000_0000_0000) return `${(n / 1_0000_0000_0000).toFixed(1)}조`;
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(0)}억`;
  return n.toLocaleString('ko-KR');
}

function fmtNum(n: number | null | undefined, suffix = ''): string {
  if (n == null || isNaN(n)) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}${suffix}`;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });

  const supabase = await createClient();

  // 1. stocks 기본 정보 + market_cap
  const { data: stock } = await supabase
    .from('stocks')
    .select('id, symbol, name_ko, name_en, market, country, sector, industry, market_cap')
    .eq('symbol', symbol.toUpperCase())
    .maybeSingle();

  if (!stock) return NextResponse.json({ error: 'stock not found' }, { status: 404 });

  // 2. 최신 재무 지표 (annual 우선, 없으면 quarterly)
  const { data: fin } = await supabase
    .from('financials')
    .select('period_type, period_date, per, pbr, eps, bps, roe')
    .eq('stock_id', stock.id)
    .order('period_date', { ascending: false })
    .limit(5);

  const latest = (fin ?? []).find((f: any) => f.period_type === 'annual')
              ?? (fin ?? [])[0]
              ?? null;

  // 3. 52주 최고/최저 (stock_prices)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: prices } = await supabase
    .from('stock_prices')
    .select('high, low')
    .eq('stock_id', stock.id)
    .gte('trade_date', oneYearAgo.toISOString().slice(0, 10));

  let yearHigh: number | null = null;
  let yearLow: number | null = null;
  if (prices && prices.length > 0) {
    yearHigh = Math.max(...prices.map((p: any) => p.high ?? 0));
    yearLow = Math.min(
      ...prices
        .filter((p: any) => p.low != null && p.low > 0)
        .map((p: any) => p.low)
    );
  }

  const currency = stock.country === 'KR' ? 'KRW' : 'USD';

  return NextResponse.json({
    symbol: stock.symbol,
    name: stock.name_ko ?? stock.name_en,
    market: stock.market,
    country: stock.country,
    sector: stock.sector,
    industry: stock.industry,
    kpis: {
      marketCap: stock.country === 'KR' ? formatKRW(stock.market_cap) : fmtNum(stock.market_cap, ' USD'),
      per: fmtNum(latest?.per),
      pbr: fmtNum(latest?.pbr),
      eps: fmtNum(latest?.eps),
      bps: fmtNum(latest?.bps),
      roe: latest?.roe != null ? fmtNum(latest.roe, '%') : '—',
      dividendYield: '—',
      yearRange: yearHigh && yearLow
        ? `${yearLow.toLocaleString()} ~ ${yearHigh.toLocaleString()} ${currency}`
        : '—',
    },
    meta: {
      latestFinancialPeriod: latest?.period_date ?? null,
      latestFinancialType: latest?.period_type ?? null,
      priceDataPoints: prices?.length ?? 0,
    },
  });
}
```

---

## STEP 5 — OverviewTab 실데이터 연동

**기존 파일 교체**: `components/stocks/tabs/OverviewTab.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { Stock } from '@/types/stock';

type OverviewData = {
  kpis: {
    marketCap: string;
    per: string;
    pbr: string;
    eps: string;
    bps: string;
    roe: string;
    dividendYield: string;
    yearRange: string;
  };
  meta: {
    latestFinancialPeriod: string | null;
    latestFinancialType: string | null;
    priceDataPoints: number;
  };
};

type CompanyData = {
  name?: string;
  ceo?: string;
  address?: string;
  homepage?: string;
  phone?: string;
  industry?: string;
  established?: string;
  error?: string;
  fallback?: boolean;
};

const KPI_ORDER: Array<{ key: keyof OverviewData['kpis']; label: string }> = [
  { key: 'marketCap', label: '시가총액' },
  { key: 'per', label: 'PER' },
  { key: 'pbr', label: 'PBR' },
  { key: 'eps', label: 'EPS' },
  { key: 'bps', label: 'BPS' },
  { key: 'roe', label: 'ROE' },
  { key: 'dividendYield', label: '배당수익률' },
  { key: 'yearRange', label: '52주 범위' },
];

export default function OverviewTab({ stock }: { stock: Stock }) {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`/api/stocks/overview?symbol=${stock.symbol}`).then((r) => r.json()),
      stock.country === 'KR'
        ? fetch(`/api/dart/company?symbol=${stock.symbol}`).then((r) => r.json())
        : Promise.resolve({ error: 'not korean stock', fallback: true }),
    ])
      .then(([ov, co]) => {
        if (cancelled) return;
        setOverview(ov.kpis ? ov : null);
        setCompany(co);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stock.symbol, stock.country]);

  return (
    <div className="space-y-6">
      {/* KPI 그리드 */}
      <div>
        <h2 className="text-base font-bold text-black mb-3">핵심 지표</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KPI_ORDER.map(({ key, label }) => (
            <div
              key={key}
              className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-3"
            >
              <p className="text-[#666666] text-xs font-bold mb-1">{label}</p>
              <p className="text-black font-mono-price font-bold text-base">
                {loading ? '...' : overview?.kpis[key] ?? '—'}
              </p>
            </div>
          ))}
        </div>
        {overview?.meta.latestFinancialPeriod && (
          <p className="text-[10px] text-[#999999] mt-2">
            재무 지표 기준: {overview.meta.latestFinancialPeriod} ({overview.meta.latestFinancialType}) /
            가격 데이터 포인트: {overview.meta.priceDataPoints}
          </p>
        )}
      </div>

      {/* 기업개황 */}
      <div>
        <h2 className="text-base font-bold text-black mb-3">기업개황</h2>
        <div className="bg-white border border-[#E5E7EB] rounded p-4 text-sm">
          {loading ? (
            <p className="text-[#999999]">불러오는 중…</p>
          ) : company?.error ? (
            <div>
              <p className="text-[#666666] text-xs mb-2">
                {company.fallback
                  ? 'DART 연동 미설정 — 기본 정보만 표시'
                  : `기업개황을 불러올 수 없습니다: ${company.error}`}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-bold text-black">종목코드: </span>{stock.symbol}</div>
                <div><span className="font-bold text-black">시장: </span>{stock.market}</div>
                <div><span className="font-bold text-black">섹터: </span>{stock.sector ?? '—'}</div>
                <div><span className="font-bold text-black">국가: </span>{stock.country}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <Info label="기업명" value={company?.name} />
              <Info label="대표이사" value={company?.ceo} />
              <Info label="본사 주소" value={company?.address} />
              <Info label="전화번호" value={company?.phone} />
              <Info label="홈페이지" value={company?.homepage} link />
              <Info label="설립일" value={company?.established} />
              <Info label="종목코드" value={stock.symbol} />
              <Info label="시장" value={stock.market} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, link }: { label: string; value?: string; link?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <span className="font-bold text-black">{label}: </span>
      {link ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0ABAB5] hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <span className="text-[#666666] break-words">{value}</span>
      )}
    </div>
  );
}
```

---

## STEP 6 — DART CORPCODE 시딩 스크립트 (선택 실행)

**신규 파일**: `scripts/seed-dart-corpcodes.py`

```python
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
```

**실행 (DART 키가 있을 때만)**:
```bash
cd ~/Desktop/OTMarketing && python3 scripts/seed-dart-corpcodes.py
```

---

## STEP 7 — `.env.local` DART 키 안내

**기존 파일 확인**: `.env.local`

다음 줄이 없으면 사용자에게 안내:
```
DART_API_KEY=  # https://opendart.fss.or.kr/ 에서 무료 발급 (선택 사항 — 없으면 기업개황만 fallback)
```

> 사용자가 키를 발급받지 않아도 **KPI 는 정상 동작.** 기업개황만 fallback 표시.

---

## STEP 8 — 빌드 검증

```bash
cd ~/Desktop/OTMarketing && npm run build 2>&1 | tail -40
```

- 0 error 필수.

---

## STEP 9 — 스모크 테스트

```bash
cd ~/Desktop/OTMarketing && npm run dev
```

**체크리스트**:
- [ ] `/stocks/005930` → 개요 탭에 KPI 값이 숫자로 표시 (시가총액 억/조 단위, PER/PBR/EPS/BPS/ROE 숫자)
- [ ] 52주 범위 "최저 ~ 최고 KRW" 형식
- [ ] 재무 기준일 표시 (2024-12-31 (annual) 같은 포맷)
- [ ] DART 키가 설정된 경우: 기업개황 카드에 대표이사/주소/홈페이지 등 표시
- [ ] DART 키가 없는 경우: "DART 연동 미설정 — 기본 정보만 표시" 안내 + 종목코드/시장/섹터/국가 fallback
- [ ] 미국 종목 (`/stocks/AAPL`) → 개요 탭에서 KPI 는 보이되, 기업개황은 "한국 종목 아님" fallback

---

## STEP 10 — git 커밋 (승인 대기)

**커밋 메시지 후보**:
```
feat: stock detail W2.2 — overview tab real data + DART company wrapper

- /api/stocks/overview 집계 API (시총/PER/PBR/EPS/BPS/ROE/52주범위)
- /api/dart/company 기업개황 API (DART 키 없을 때 fallback)
- lib/dart.ts DART OpenAPI wrapper
- supabase/migrations/006_dart_corp_codes.sql
- scripts/seed-dart-corpcodes.py (선택 실행)
- OverviewTab 실데이터 연동 (로딩 / 에러 / fallback 분기)
```

**주의**: Cowork Chrome MCP 검증 전에는 `git push` 금지.

---

## 📝 세션 종료 (검증 완료 후)

1. 4개 문서 헤더 오늘 날짜
2. `docs/CHANGELOG.md` W2.2 블록 추가
3. `session-context.md` 세션 히스토리 추가
4. `docs/NEXT_SESSION_START.md` 최신화 (다음: W2.3 실적 탭 + 비교 탭)

**명령어 종료.**
