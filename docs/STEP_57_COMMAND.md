# STEP 57 — Volume 위젯 + /movers/volume 페이지 리팩토링 (P0)

> **실행 명령어 (Sonnet)**:
> ```bash
> cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
> ```
>
> **목표**: VolumeTop10Widget 에 배수 막대 + 급등 강조 추가 + `/movers/volume` 페이지 스텁 → 풀 리팩토링 (실데이터 + 시장구분 + 정렬 옵션)
>
> **전제 상태**: STEP 56 완료 이후

---

## 1. API 라우트 업데이트 — `app/api/kis/volume-rank/route.ts`

현재 API는 전체(`0000`) 고정, 급등(BLNG=1) 고정. `market` 과 `sort` 쿼리 추가.

**전체 파일 교체**:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 거래량 순위 (KIS tr_id: FHPST01710000)
// ?market=all|kospi|kosdaq (default: all)
// ?sort=spike|volume|amount (default: spike)
//   - spike: 거래증가율(FID_BLNG_CLS_CODE=1)
//   - volume: 평균거래량(0)
//   - amount: 거래금액순(3)
// ?limit (default: 30, max: 30)
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'all';
  const sort = request.nextUrl.searchParams.get('sort') || 'spike';
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '30', 10) || 30,
    30
  );

  const iscd =
    market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : '0000';
  const blng =
    sort === 'volume' ? '0' : sort === 'amount' ? '3' : '1'; // default: spike

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/volume-rank',
      trId: 'FHPST01710000',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20171',
        FID_INPUT_ISCD: iscd,
        FID_DIV_CLS_CODE: '0',
        FID_BLNG_CLS_CODE: blng,
        FID_TRGT_CLS_CODE: '111111111',
        FID_TRGT_EXLS_CLS_CODE: '000000',
        FID_INPUT_PRICE_1: '0',
        FID_INPUT_PRICE_2: '0',
        FID_VOL_CNT: '0',
        FID_INPUT_DATE_1: '0',
      },
    });

    const items = (data.output || []).slice(0, limit).map((item: Record<string, string>, idx: number) => {
      const volume = parseInt(item.acml_vol || '0', 10);
      const avgVolume = parseInt(item.avrg_vol || '1', 10);
      const spike = avgVolume > 0 ? parseFloat((volume / avgVolume).toFixed(1)) : 0;
      const price = parseInt(item.stck_prpr || '0', 10);
      const tradeAmount = price * volume;

      return {
        rank: idx + 1,
        symbol: item.mksc_shrn_iscd || '',
        name: item.hts_kor_isnm || '',
        price,
        changePercent: parseFloat(item.prdy_ctrt || '0'),
        volume,
        avgVolume,
        spike,
        tradeAmount,
      };
    });

    return NextResponse.json({ stocks: items });
  } catch (err) {
    console.error('[api/kis/volume-rank]', err);
    return NextResponse.json({ stocks: [], error: String(err) }, { status: 502 });
  }
}
```

---

## 2. VolumeTop10Widget 개선 — `components/widgets/VolumeTop10Widget.tsx`

**전체 파일 교체**:

```tsx
'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface VolumeItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  spike: number;
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR');
}

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function VolumeTop10Widget({ inline = false, size = 'default' }: Props = {}) {
  const [items, setItems] = useState<VolumeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kis/volume-rank?sort=spike&limit=10')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.stocks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 막대 시각화: 최대 배수를 100%로 정규화 (최소 5x 보장)
  const maxSpike = Math.max(5, ...items.map((x) => x.spike));

  const content = (
    <div role="table" aria-label="거래량 급등 종목 목록">
      <div role="rowgroup">
        <div
          role="row"
          className="grid grid-cols-[32px_1fr_80px_90px_70px] px-3 py-2 text-xs text-[#999] font-bold border-b border-[#F0F0F0]"
        >
          <span role="columnheader">#</span>
          <span role="columnheader">종목</span>
          <span role="columnheader" className="text-right">배수</span>
          <span role="columnheader" className="text-right">현재가</span>
          <span role="columnheader" className="text-right">등락률</span>
        </div>
      </div>
      <div role="rowgroup">
        {items.slice(0, 10).map((r, i) => {
          const barPct = Math.min(100, Math.round((r.spike / maxSpike) * 100));
          const isExtreme = r.spike >= 10;
          const isHigh = r.spike >= 5 && r.spike < 10;
          const spikeColor = isExtreme
            ? 'text-[#FF3B30]'
            : isHigh
            ? 'text-[#FF9500]'
            : 'text-[#0ABAB5]';
          return (
            <div
              key={r.symbol}
              role="row"
              className="grid grid-cols-[32px_1fr_80px_90px_70px] px-3 py-2.5 text-sm hover:bg-[#F8F9FA] border-b border-[#F0F0F0]"
            >
              <span role="cell" className="text-[#999] font-bold">
                {i + 1}
              </span>
              <span role="cell" className="font-bold text-black truncate flex items-center gap-1">
                <span className="truncate">{r.name}</span>
                {isExtreme && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white shrink-0">
                    급등
                  </span>
                )}
              </span>
              <span role="cell" className="relative pr-1">
                <span
                  className={`absolute inset-y-1 left-0 rounded ${
                    isExtreme ? 'bg-[#FF3B30]/20' : isHigh ? 'bg-[#FF9500]/15' : 'bg-[#0ABAB5]/15'
                  }`}
                  style={{ width: `${barPct}%` }}
                />
                <span className={`relative text-right font-bold tabular-nums block ${spikeColor}`}>
                  {r.spike > 0 ? `${r.spike}x` : '—'}
                </span>
              </span>
              <span role="cell" className="text-right text-black tabular-nums">
                {fmt(r.price)}
              </span>
              <span
                role="cell"
                className={`text-right font-bold tabular-nums ${
                  r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                }`}
              >
                {r.changePercent >= 0 ? '+' : ''}
                {r.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
        {!loading && items.length === 0 && (
          <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
        )}
      </div>
    </div>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard
      title="거래량 급등 TOP 10"
      subtitle="KIS API · 배수 = 거래량 / 평균거래량"
      href="/movers/volume"
      size={size}
      action={loading ? <span className="text-[10px] text-[#BBB]">로딩 중…</span> : undefined}
    >
      {content}
    </WidgetCard>
  );
}
```

---

## 3. `/movers/volume` 페이지 풀 리팩토링

### 3-1. 신규 파일 — `components/movers/MoversVolumePageClient.tsx`

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flame } from 'lucide-react';

interface VolumeItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  spike: number;
  tradeAmount: number;
}

type Market = 'all' | 'kospi' | 'kosdaq';
type Sort = 'spike' | 'volume' | 'amount';

const MARKET_LABELS: Record<Market, string> = {
  all: '전체',
  kospi: 'KOSPI',
  kosdaq: 'KOSDAQ',
};

const SORT_LABELS: Record<Sort, string> = {
  spike: '거래증가율',
  volume: '거래량',
  amount: '거래대금',
};

const fmt = (n: number) => n.toLocaleString('ko-KR');

const fmtAmount = (n: number) => {
  if (!n) return '—';
  if (n >= 1_0000_0000_0000) return `${(n / 1_0000_0000_0000).toFixed(1)}조`;
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(1)}만`;
  return n.toLocaleString();
};

export default function MoversVolumePageClient() {
  const sp = useSearchParams();
  const initMarket = (['all', 'kospi', 'kosdaq'].includes(sp.get('market') || '')
    ? sp.get('market')
    : 'all') as Market;
  const initSort = (['spike', 'volume', 'amount'].includes(sp.get('sort') || '')
    ? sp.get('sort')
    : 'spike') as Sort;

  const [market, setMarket] = useState<Market>(initMarket);
  const [sort, setSort] = useState<Sort>(initSort);
  const [items, setItems] = useState<VolumeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kis/volume-rank?market=${market}&sort=${sort}&limit=30`);
      const data = await res.json();
      setItems(data.stocks ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [market, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const maxSpike = Math.max(5, ...items.map((x) => x.spike));

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
          <Flame className="w-6 h-6 text-[#FF9500]" />
          거래량 급등 순위
        </h1>
        <p className="text-sm text-[#666] mt-1">
          당일 거래증가율·거래량·거래대금 상위 30종목 · KIS API FHPST01710000
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
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

        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`text-xs font-bold px-3 py-2 transition-colors ${
                sort === s
                  ? 'bg-[#FF9500] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>

        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="text-right px-4 py-2.5 w-14">순위</th>
                <th className="text-left px-4 py-2.5 w-24">종목코드</th>
                <th className="text-left px-4 py-2.5">종목명</th>
                <th className="text-right px-4 py-2.5 w-28">현재가</th>
                <th className="text-right px-4 py-2.5 w-24">등락률</th>
                <th className="text-right px-4 py-2.5 w-28">거래량</th>
                <th className="text-right px-4 py-2.5 w-28">평균거래량</th>
                <th className="text-left px-4 py-2.5 w-36">배수</th>
                <th className="text-right px-4 py-2.5 w-24">거래대금</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm text-[#999]">
                    데이터 없음
                  </td>
                </tr>
              )}
              {items.map((r) => {
                const barPct = Math.min(100, Math.round((r.spike / maxSpike) * 100));
                const isExtreme = r.spike >= 10;
                const isHigh = r.spike >= 5 && r.spike < 10;
                const barColor = isExtreme
                  ? 'bg-[#FF3B30]/30'
                  : isHigh
                  ? 'bg-[#FF9500]/25'
                  : 'bg-[#0ABAB5]/20';
                const spikeTextColor = isExtreme
                  ? 'text-[#FF3B30]'
                  : isHigh
                  ? 'text-[#FF9500]'
                  : 'text-[#0ABAB5]';
                const priceColor = r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]';

                return (
                  <tr
                    key={r.symbol}
                    className="border-t border-[#F0F0F0] hover:bg-[#FAFAFA]"
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
                        {isExtreme && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white">
                            급등
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${priceColor}`}>
                      {fmt(r.price)}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${priceColor}`}>
                      {r.changePercent >= 0 ? '+' : ''}
                      {r.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#333]">
                      {fmt(r.volume)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#888]">
                      {fmt(r.avgVolume)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="relative h-5 flex items-center">
                        <div
                          className={`absolute inset-y-0 left-0 rounded ${barColor}`}
                          style={{ width: `${barPct}%` }}
                        />
                        <span className={`relative pl-1.5 font-bold tabular-nums ${spikeTextColor}`}>
                          {r.spike > 0 ? `${r.spike}x` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#555]">
                      {fmtAmount(r.tradeAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#999] mt-4 text-center">
        데이터 출처: 한국투자증권 KIS OpenAPI · 장중 5분 캐시 · 장마감 후 배수는 1.0x 로 수렴
      </p>
    </div>
  );
}
```

### 3-2. `app/movers/volume/page.tsx` — 전면 교체

```tsx
import { Suspense } from 'react';
import MoversVolumePageClient from '@/components/movers/MoversVolumePageClient';

export default function VolumeMoversPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-6 py-10 max-w-screen-2xl mx-auto">
          <div className="text-sm text-[#999]">로딩 중…</div>
        </div>
      }
    >
      <MoversVolumePageClient />
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
feat(volume): STEP 57 Phase A — 거래량 배수 막대 + /movers/volume 풀 리팩토링

- api/kis/volume-rank: market + sort(spike/volume/amount) + limit 파라미터 추가
- api/kis/volume-rank: 거래대금(tradeAmount), 평균거래량 필드 포함
- VolumeTop10Widget: 배수 막대 시각화 추가 (급등=빨강, 고배수=주황, 기본=티얼)
- VolumeTop10Widget: 10x 이상 "급등" 뱃지 표시
- components/movers/MoversVolumePageClient.tsx 신규 생성
- app/movers/volume/page.tsx 더미 스텁 → Suspense 래퍼로 교체
- 시장구분(전체/KOSPI/KOSDAQ) + 정렬(거래증가율/거래량/거래대금) 세그먼트
- 종목명 클릭 시 /chart?symbol= 로 이동
EOF
)"

git push
```

---

## 검증 체크리스트

- [ ] 홈 위젯: 각 행에 배수 막대(색상 그라데이션) 표시
- [ ] 10x 이상 종목에 "급등" 붉은 뱃지
- [ ] 페이지: 배경 흰색, 컨트롤 바에 시장구분 + 정렬 세그먼트
- [ ] 정렬 변경 시 재fetch, URL 파라미터 반영은 안 되어도 OK
- [ ] 배수 컬럼에 막대 + 색상 있는 텍스트
- [ ] 거래대금 "X.X조 / X.X억" 포맷 정상
- [ ] 빌드 0 에러
