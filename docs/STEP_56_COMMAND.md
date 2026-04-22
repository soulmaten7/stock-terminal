# STEP 56 — Movers 위젯 + /movers/price 페이지 리팩토링 (P0)

> **실행 명령어 (Sonnet)**:
> ```bash
> cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
> ```
>
> **목표**: MoversTop10Widget 에 상한가/하한가 강조 추가 + `/movers/price` 페이지 스텁 → 풀 리팩토링 (실데이터 + 시장구분 + 상/하한가 세그먼트)
>
> **전제 상태**: STEP 55 완료 이후 (DART 공시 리팩토링 끝난 상태)

---

## 1. API 라우트 업데이트 — `app/api/kis/movers/route.ts`

현재 API는 전체(`0000`) 고정. `market` 쿼리와 `limit` 쿼리 추가.

**전체 파일 교체**:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 등락률 순위 (KIS tr_id: FHPST01700000)
// ?dir=up|down (default: up)
// ?market=all|kospi|kosdaq (default: all)
// ?limit=10|30 (default: 10)
export async function GET(request: NextRequest) {
  const dir = request.nextUrl.searchParams.get('dir') === 'down' ? '1' : '0';
  const market = request.nextUrl.searchParams.get('market') || 'all';
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '10', 10) || 10,
    30
  );

  // 0000=전체, 0001=코스피, 1001=코스닥
  const iscd =
    market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : '0000';

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/ranking/fluctuation',
      trId: 'FHPST01700000',
      params: {
        FID_RSFL_RATE2: '',
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20170',
        FID_INPUT_ISCD: iscd,
        FID_RANK_SORT_CLS_CODE: dir,
        FID_INPUT_CNT_1: '0',
        FID_PRC_CLS_CODE: '0',
        FID_INPUT_PRICE_1: '',
        FID_INPUT_PRICE_2: '',
        FID_VOL_CNT: '',
        FID_TRGT_CLS_CODE: '0',
        FID_TRGT_EXLS_CLS_CODE: '0',
        FID_DIV_CLS_CODE: '0',
        FID_RSFL_RATE1: '',
      },
    });

    const items = (data.output || []).slice(0, limit).map((item: Record<string, string>, idx: number) => ({
      rank: idx + 1,
      symbol: item.stck_shrn_iscd || item.mksc_shrn_iscd || '',
      name: item.hts_kor_isnm || '',
      price: parseInt(item.stck_prpr || '0', 10),
      priceText: parseInt(item.stck_prpr || '0', 10).toLocaleString('ko-KR'),
      prdyVrss: parseInt(item.prdy_vrss || '0', 10),  // 전일대비
      changePercent: parseFloat(item.prdy_ctrt || '0'),
      volume: parseInt(item.acml_vol || '0', 10),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[api/kis/movers]', err);
    return NextResponse.json({ items: [], error: String(err) }, { status: 502 });
  }
}
```

---

## 2. MoversTop10Widget 개선 — `components/widgets/MoversTop10Widget.tsx`

**전체 파일 교체**:

```tsx
'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface MoverItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  priceText: string;
  changePercent: number;
}

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

const LIMIT = 30; // 상한가/하한가 구분을 위해 30개 확보
const UPPER_LIMIT = 29.5;
const LOWER_LIMIT = -29.5;

export default function MoversTop10Widget({ inline = false, size = 'default' }: Props = {}) {
  const [tab, setTab] = useState<'up' | 'down'>('up');
  const [upItems, setUpItems] = useState<MoverItem[]>([]);
  const [downItems, setDownItems] = useState<MoverItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/kis/movers?dir=up&limit=${LIMIT}`).then((r) => (r.ok ? r.json() : { items: [] })),
      fetch(`/api/kis/movers?dir=down&limit=${LIMIT}`).then((r) => (r.ok ? r.json() : { items: [] })),
    ])
      .then(([up, down]) => {
        setUpItems(up.items ?? []);
        setDownItems(down.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const raw = tab === 'up' ? upItems : downItems;
  const data = raw.slice(0, 10);
  const upperCount = upItems.filter((x) => x.changePercent >= UPPER_LIMIT).length;
  const lowerCount = downItems.filter((x) => x.changePercent <= LOWER_LIMIT).length;

  const tabButtons = (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setTab('up')}
        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
          tab === 'up' ? 'bg-[#FF3B30] text-white' : 'text-[#999] hover:text-black'
        }`}
      >
        상승{upperCount > 0 ? ` · 상한가 ${upperCount}` : ''}
      </button>
      <button
        onClick={() => setTab('down')}
        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
          tab === 'down' ? 'bg-[#0051CC] text-white' : 'text-[#999] hover:text-black'
        }`}
      >
        하락{lowerCount > 0 ? ` · 하한가 ${lowerCount}` : ''}
      </button>
    </div>
  );

  const body = (
    <>
      {loading && (
        <div className="flex items-center justify-center h-20 text-xs text-[#999]">로딩 중…</div>
      )}
      {!loading && (
        <div role="table" aria-label="상승하락 종목 목록">
          <div role="rowgroup">
            <div
              role="row"
              className="grid grid-cols-3 px-3 py-2 text-xs text-[#999] font-bold border-b border-[#F0F0F0]"
            >
              <span role="columnheader">#  종목</span>
              <span role="columnheader" className="text-right">등락률</span>
              <span role="columnheader" className="text-right">현재가</span>
            </div>
          </div>
          <div role="rowgroup">
            {data.map((r) => {
              const isUpper = r.changePercent >= UPPER_LIMIT;
              const isLower = r.changePercent <= LOWER_LIMIT;
              const isLimit = isUpper || isLower;
              return (
                <div
                  key={r.symbol}
                  role="row"
                  className={`grid grid-cols-3 px-3 py-2.5 text-sm border-b border-[#F0F0F0] hover:bg-[#F8F9FA] ${
                    isUpper ? 'bg-[#FFE5E3]' : isLower ? 'bg-[#E3ECFF]' : ''
                  }`}
                >
                  <span role="cell" className="font-bold text-black truncate flex items-center gap-1">
                    <span className="text-[#999] mr-1">{r.rank}</span>
                    <span className="truncate">{r.name}</span>
                    {isUpper && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white shrink-0">
                        상
                      </span>
                    )}
                    {isLower && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#0051CC] text-white shrink-0">
                        하
                      </span>
                    )}
                  </span>
                  <span
                    role="cell"
                    className={`text-right font-bold tabular-nums ${
                      tab === 'up' ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                    } ${isLimit ? 'underline' : ''}`}
                  >
                    {r.changePercent >= 0 ? '+' : ''}
                    {r.changePercent.toFixed(2)}%
                  </span>
                  <span role="cell" className="text-right text-black tabular-nums">
                    {r.priceText}
                  </span>
                </div>
              );
            })}
            {data.length === 0 && (
              <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (inline) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex justify-end px-3 py-2 border-b border-[#F0F0F0] shrink-0">
          {tabButtons}
        </div>
        <div className="flex-1 overflow-auto">{body}</div>
      </div>
    );
  }

  return (
    <WidgetCard
      title="상승/하락 TOP 10"
      subtitle="KIS API"
      href={`/movers/price?tab=${tab}`}
      size={size}
      action={tabButtons}
    >
      {body}
    </WidgetCard>
  );
}
```

---

## 3. `/movers/price` 페이지 풀 리팩토링

### 3-1. 신규 파일 — `components/movers/MoversPricePageClient.tsx`

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';

interface MoverItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  priceText: string;
  prdyVrss: number;
  changePercent: number;
  volume: number;
}

type Dir = 'up' | 'down';
type Market = 'all' | 'kospi' | 'kosdaq';

const MARKET_LABELS: Record<Market, string> = {
  all: '전체',
  kospi: 'KOSPI',
  kosdaq: 'KOSDAQ',
};

const UPPER_LIMIT = 29.5;
const LOWER_LIMIT = -29.5;

const fmt = (n: number) => n.toLocaleString('ko-KR');

export default function MoversPricePageClient() {
  const sp = useSearchParams();
  const initTab = (sp.get('tab') || 'up') === 'down' ? 'down' : 'up';
  const initMarket = (['all', 'kospi', 'kosdaq'].includes(sp.get('market') || '')
    ? sp.get('market')
    : 'all') as Market;

  const [dir, setDir] = useState<Dir>(initTab as Dir);
  const [market, setMarket] = useState<Market>(initMarket);
  const [onlyLimit, setOnlyLimit] = useState(false);
  const [items, setItems] = useState<MoverItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kis/movers?dir=${dir}&market=${market}&limit=30`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [dir, market]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = onlyLimit
    ? items.filter((x) =>
        dir === 'up' ? x.changePercent >= UPPER_LIMIT : x.changePercent <= LOWER_LIMIT
      )
    : items;

  return (
    <div className="w-full px-6 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-black">
          <TrendingUp className="w-6 h-6 text-[#0ABAB5]" />
          상승/하락 순위
        </h1>
        <p className="text-sm text-[#666] mt-1">
          당일 등락률 상위·하위 30종목 · KIS API FHPST01700000
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        {/* 상승/하락 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={() => setDir('up')}
            className={`text-xs font-bold px-3 py-2 transition-colors ${
              dir === 'up' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            상승
          </button>
          <button
            type="button"
            onClick={() => setDir('down')}
            className={`text-xs font-bold px-3 py-2 transition-colors ${
              dir === 'down' ? 'bg-[#0051CC] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            하락
          </button>
        </div>

        {/* 시장구분 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(MARKET_LABELS) as Market[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              className={`text-xs font-medium px-3 py-2 transition-colors ${
                market === m
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {MARKET_LABELS[m]}
            </button>
          ))}
        </div>

        {/* 상/하한가 토글 */}
        <button
          type="button"
          onClick={() => setOnlyLimit((v) => !v)}
          className={`text-xs font-medium px-3 py-2 rounded border transition-colors ${
            onlyLimit
              ? dir === 'up'
                ? 'bg-[#FF3B30] text-white border-[#FF3B30]'
                : 'bg-[#0051CC] text-white border-[#0051CC]'
              : 'bg-white text-[#666] border-[#E5E7EB] hover:bg-[#F0F0F0]'
          }`}
        >
          {dir === 'up' ? '상한가만' : '하한가만'}
        </button>

        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="text-right px-4 py-2.5 w-14">순위</th>
                <th className="text-left px-4 py-2.5 w-28">종목코드</th>
                <th className="text-left px-4 py-2.5">종목명</th>
                <th className="text-right px-4 py-2.5 w-28">현재가</th>
                <th className="text-right px-4 py-2.5 w-24">전일대비</th>
                <th className="text-right px-4 py-2.5 w-24">등락률</th>
                <th className="text-right px-4 py-2.5 w-32">거래량</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-[#999]">
                    데이터 없음
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const isUpper = r.changePercent >= UPPER_LIMIT;
                const isLower = r.changePercent <= LOWER_LIMIT;
                const isLimit = isUpper || isLower;
                const colorCls = r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]';
                return (
                  <tr
                    key={r.symbol}
                    className={`border-t border-[#F0F0F0] hover:bg-[#FAFAFA] ${
                      isUpper ? 'bg-[#FFE5E3]/40' : isLower ? 'bg-[#E3ECFF]/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-right text-[#888] tabular-nums">{r.rank}</td>
                    <td className="px-4 py-2.5 text-[#333] tabular-nums text-xs">{r.symbol}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/chart?symbol=${r.symbol}`}
                          className="font-bold text-black hover:text-[#0ABAB5] hover:underline"
                        >
                          {r.name}
                        </Link>
                        {isUpper && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white">
                            상한
                          </span>
                        )}
                        {isLower && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#0051CC] text-white">
                            하한
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${colorCls}`}>
                      {fmt(r.price)}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${colorCls}`}>
                      {r.prdyVrss >= 0 ? '+' : ''}
                      {fmt(r.prdyVrss)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums font-bold ${colorCls} ${
                        isLimit ? 'underline' : ''
                      }`}
                    >
                      {r.changePercent >= 0 ? '+' : ''}
                      {r.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#555]">
                      {fmt(r.volume)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#999] mt-4 text-center">
        데이터 출처: 한국투자증권 KIS OpenAPI · 장중 5분 캐시
      </p>
    </div>
  );
}
```

### 3-2. `app/movers/price/page.tsx` — 전면 교체

```tsx
import { Suspense } from 'react';
import MoversPricePageClient from '@/components/movers/MoversPricePageClient';

export default function PriceMoversPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-6 py-10 max-w-screen-2xl mx-auto">
          <div className="text-sm text-[#999]">로딩 중…</div>
        </div>
      }
    >
      <MoversPricePageClient />
    </Suspense>
  );
}
```

---

## 4. 빌드 · 커밋 · push

```bash
npm run build

git add -A
git commit -m "$(cat <<'EOF'
feat(movers): STEP 56 Phase A — 상한가/하한가 강조 + /movers/price 풀 리팩토링

- api/kis/movers: market(kospi/kosdaq) + limit(30) 파라미터 추가, 전일대비·거래량 필드 포함
- MoversTop10Widget: 상한가(≥+29.5%)·하한가(≤-29.5%) 행 배경 강조 + "상/하" 뱃지
- MoversTop10Widget: 탭 라벨에 상한가 개수 뱃지
- MoversTop10Widget: href 동적화 (?tab=up|down)
- components/movers/MoversPricePageClient.tsx 신규 생성
- app/movers/price/page.tsx 더미 스텁 → Suspense 래퍼로 교체
- 상승/하락 세그먼트 + 시장구분(전체/KOSPI/KOSDAQ) + 상한가만 토글
- 종목명 클릭 시 /chart?symbol= 로 이동
EOF
)"

git push
```

---

## 검증 체크리스트

- [ ] 홈 위젯: "상승 · 상한가 N" 형태의 탭 라벨 표시
- [ ] 상한가 행은 붉은 배경 + "상" 뱃지, 하한가 행은 파란 배경 + "하" 뱃지
- [ ] 위젯 ↗ 클릭 → `/movers/price?tab=up|down` 이동
- [ ] 페이지: 상승/하락 세그먼트 전환 시 재fetch
- [ ] 페이지: KOSPI/KOSDAQ 전환 시 재fetch (API 쿼리에 market 포함)
- [ ] 페이지: "상한가만" 토글 작동
- [ ] 종목명 클릭 시 차트 페이지로 이동
- [ ] 빌드 0 에러
