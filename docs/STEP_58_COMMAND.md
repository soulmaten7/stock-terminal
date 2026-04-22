# STEP 58 — NetBuy 위젯 + /net-buy 페이지 개선 (P0)

> **실행 명령어 (Sonnet)**:
> ```bash
> cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
> ```
>
> **목표**: NetBuyTopWidget 에 순매도 토글 + 막대 시각화 추가 + `/net-buy` TopTab 에 투자자/시장 세그먼트 추가
>
> **전제 상태**: STEP 57 완료 이후

---

## 1. API 라우트 업데이트 — `app/api/kis/investor-rank/route.ts`

`sort=buy|sell` 쿼리 추가로 순매수/순매도 상위 선택 가능.

**전체 파일 교체**:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 외국인/기관 매매종목 가집계 (한투 tr_id: FHPTJ04400000)
// ?market=all|kospi|kosdaq (default: all)
// ?sort=buy|sell (default: buy) — 순매수상위 vs 순매도상위
export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'all';
  const sort = request.nextUrl.searchParams.get('sort') === 'sell' ? 'sell' : 'buy';

  const marketDiv =
    market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : 'V';
  const rankSort = sort === 'sell' ? '1' : '0'; // 0:순매수상위, 1:순매도상위

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/foreign-institution-total',
      trId: 'FHPTJ04400000',
      params: {
        FID_COND_MRKT_DIV_CODE: marketDiv,
        FID_COND_SCR_DIV_CODE: '16449',
        FID_INPUT_ISCD: '0000',
        FID_DIV_CLS_CODE: '1', // 0:수량, 1:금액
        FID_RANK_SORT_CLS_CODE: rankSort,
        FID_ETC_CLS_CODE: '0',
      },
    });

    const items = (data.output || []) as Record<string, string>[];

    const mapped = items.map((item) => ({
      symbol: item.mksc_shrn_iscd,
      name: item.hts_kor_isnm,
      price: parseInt(item.stck_prpr || '0', 10),
      changePercent: parseFloat(item.prdy_ctrt || '0'),
      // 순매수 금액 (백만원 → 억원)
      foreignBuy: Math.round(parseInt(item.frgn_ntby_tr_pbmn || '0', 10) / 100),
      institutionBuy: Math.round(parseInt(item.orgn_ntby_tr_pbmn || '0', 10) / 100),
    }));

    // 정렬: sell 이면 가장 큰 매도(음수), buy 면 가장 큰 매수(양수)
    const sortFn = sort === 'sell'
      ? (a: typeof mapped[0], b: typeof mapped[0]) => a.foreignBuy + a.institutionBuy - (b.foreignBuy + b.institutionBuy)
      : (a: typeof mapped[0], b: typeof mapped[0]) => b.foreignBuy + b.institutionBuy - (a.foreignBuy + a.institutionBuy);

    const foreignTop = [...mapped]
      .sort((a, b) => (sort === 'sell' ? a.foreignBuy - b.foreignBuy : b.foreignBuy - a.foreignBuy))
      .slice(0, 20);
    const institutionTop = [...mapped]
      .sort((a, b) => (sort === 'sell' ? a.institutionBuy - b.institutionBuy : b.institutionBuy - a.institutionBuy))
      .slice(0, 20);
    const combined = [...mapped].sort(sortFn).slice(0, 20);

    const totals = {
      foreignBuyTotal: mapped.reduce((acc, x) => acc + x.foreignBuy, 0),
      institutionBuyTotal: mapped.reduce((acc, x) => acc + x.institutionBuy, 0),
      count: mapped.length,
    };

    return NextResponse.json({ foreignTop, institutionTop, combined, totals });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), foreignTop: [], institutionTop: [], combined: [] },
      { status: 500 }
    );
  }
}
```

---

## 2. NetBuyTopWidget 개선 — `components/widgets/NetBuyTopWidget.tsx`

**전체 파일 교체**:

```tsx
'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface NetItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;
  institutionBuy: number;
}

type Tab = 'foreign' | 'inst';
type Mode = 'buy' | 'sell';

function fmtBn(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toLocaleString('ko-KR')}`;
}

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function NetBuyTopWidget({ inline = false, size = 'default' }: Props = {}) {
  const [tab, setTab] = useState<Tab>('foreign');
  const [mode, setMode] = useState<Mode>('buy');
  const [data, setData] = useState<{ foreignTop: NetItem[]; institutionTop: NetItem[] }>({
    foreignTop: [],
    institutionTop: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kis/investor-rank?sort=${mode}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData({ foreignTop: d.foreignTop ?? [], institutionTop: d.institutionTop ?? [] }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode]);

  const items = tab === 'foreign' ? data.foreignTop : data.institutionTop;
  const netKey: 'foreignBuy' | 'institutionBuy' = tab === 'foreign' ? 'foreignBuy' : 'institutionBuy';

  // 막대 정규화: |값|의 최대치를 기준으로
  const maxAbs = Math.max(1, ...items.slice(0, 10).map((x) => Math.abs(x[netKey])));

  const header = (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <button
          onClick={() => setTab('foreign')}
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            tab === 'foreign' ? 'bg-[#0ABAB5] text-white' : 'text-[#999]'
          }`}
        >
          외국인
        </button>
        <button
          onClick={() => setTab('inst')}
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            tab === 'inst' ? 'bg-[#0ABAB5] text-white' : 'text-[#999]'
          }`}
        >
          기관
        </button>
      </div>
      <div className="w-px h-3 bg-[#E5E7EB]" />
      <div className="flex gap-1">
        <button
          onClick={() => setMode('buy')}
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            mode === 'buy' ? 'bg-[#FF3B30] text-white' : 'text-[#999]'
          }`}
        >
          매수
        </button>
        <button
          onClick={() => setMode('sell')}
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            mode === 'sell' ? 'bg-[#0051CC] text-white' : 'text-[#999]'
          }`}
        >
          매도
        </button>
      </div>
    </div>
  );

  const body = (
    <>
      {loading && (
        <div className="flex items-center justify-center h-20 text-xs text-[#999]">로딩 중…</div>
      )}
      {!loading && (
        <div role="table" aria-label="수급 TOP 목록">
          <div role="rowgroup">
            <div
              role="row"
              className="grid grid-cols-[1fr_110px_70px] px-3 py-1.5 text-xs text-[#999] font-bold border-b border-[#F0F0F0]"
            >
              <span>종목</span>
              <span className="text-right">순{mode === 'buy' ? '매수' : '매도'} (억)</span>
              <span className="text-right">등락</span>
            </div>
          </div>
          <div role="rowgroup">
            {items.slice(0, 10).map((r) => {
              const val = r[netKey];
              const barPct = Math.round((Math.abs(val) / maxAbs) * 100);
              const isBuy = val >= 0;
              const valText = fmtBn(Math.abs(val));
              return (
                <div
                  key={r.symbol}
                  role="row"
                  className="grid grid-cols-[1fr_110px_70px] px-3 py-2.5 text-sm border-b border-[#F0F0F0] hover:bg-[#F8F9FA]"
                >
                  <span className="font-bold text-black truncate">{r.name}</span>
                  <span className="relative pr-1">
                    <span
                      className={`absolute inset-y-1 right-0 rounded ${
                        isBuy ? 'bg-[#FF3B30]/15' : 'bg-[#0051CC]/15'
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                    <span
                      className={`relative text-right font-bold tabular-nums block ${
                        isBuy ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                      }`}
                    >
                      {isBuy ? '+' : '-'}
                      {valText.replace('+', '').replace('-', '')}
                    </span>
                  </span>
                  <span
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
            {items.length === 0 && (
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
          {header}
        </div>
        <div className="flex-1 overflow-auto">{body}</div>
      </div>
    );
  }

  return (
    <WidgetCard
      title="실시간 수급 TOP"
      subtitle="KIS API · 외국인·기관 순매수/매도"
      href={`/net-buy?tab=top&who=${tab}&mode=${mode}`}
      size={size}
      action={header}
    >
      {body}
    </WidgetCard>
  );
}
```

---

## 3. `/net-buy` TopTab 개선 — `components/net-buy/TopTab.tsx`

**전체 파일 교체**:

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface NetItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;
  institutionBuy: number;
}

type Who = 'foreign' | 'inst' | 'combined';
type Mode = 'buy' | 'sell';
type Market = 'all' | 'kospi' | 'kosdaq';

const WHO_LABELS: Record<Who, string> = {
  foreign: '외국인',
  inst: '기관',
  combined: '합산',
};

const MARKET_LABELS: Record<Market, string> = {
  all: '전체',
  kospi: 'KOSPI',
  kosdaq: 'KOSDAQ',
};

function fmtBn(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toLocaleString('ko-KR')}`;
}

function fmtPrice(val: number): string {
  return val.toLocaleString('ko-KR');
}

export default function TopTab() {
  const sp = useSearchParams();
  const initWho = (['foreign', 'inst', 'combined'].includes(sp.get('who') || '')
    ? sp.get('who')
    : 'combined') as Who;
  const initMode = sp.get('mode') === 'sell' ? 'sell' : 'buy';
  const initMarket = (['all', 'kospi', 'kosdaq'].includes(sp.get('market') || '')
    ? sp.get('market')
    : 'all') as Market;

  const [who, setWho] = useState<Who>(initWho);
  const [mode, setMode] = useState<Mode>(initMode);
  const [market, setMarket] = useState<Market>(initMarket);
  const [rows, setRows] = useState<NetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/kis/investor-rank?market=${market}&sort=${mode}`);
      if (!res.ok) throw new Error('load fail');
      const d = await res.json();
      const foreignTop: NetItem[] = d.foreignTop ?? [];
      const institutionTop: NetItem[] = d.institutionTop ?? [];
      const combined: NetItem[] = d.combined ?? [];
      const picked = who === 'foreign' ? foreignTop : who === 'inst' ? institutionTop : combined;
      setRows(picked);
    } catch {
      setError(true);
      setRows([]);
    }
    setLoading(false);
  }, [who, mode, market]);

  useEffect(() => {
    load();
  }, [load]);

  const netKey: 'foreignBuy' | 'institutionBuy' | null =
    who === 'foreign' ? 'foreignBuy' : who === 'inst' ? 'institutionBuy' : null;
  const buyColor = mode === 'buy' ? 'text-[#FF3B30]' : 'text-[#0051CC]';

  return (
    <div>
      {/* 컨트롤 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        {/* 투자자 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(WHO_LABELS) as Who[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWho(w)}
              className={`text-xs font-bold px-3 py-2 transition-colors ${
                who === w
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {WHO_LABELS[w]}
            </button>
          ))}
        </div>

        {/* 매수/매도 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={() => setMode('buy')}
            className={`text-xs font-bold px-3 py-2 transition-colors ${
              mode === 'buy' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            순매수
          </button>
          <button
            type="button"
            onClick={() => setMode('sell')}
            className={`text-xs font-bold px-3 py-2 transition-colors ${
              mode === 'sell' ? 'bg-[#0051CC] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            순매도
          </button>
        </div>

        {/* 시장 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(MARKET_LABELS) as Market[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              className={`text-xs font-medium px-3 py-2 transition-colors ${
                market === m
                  ? 'bg-[#FF9500] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {MARKET_LABELS[m]}
            </button>
          ))}
        </div>

        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      <p className="text-sm text-[#666] mb-3">
        {WHO_LABELS[who]} · {mode === 'buy' ? '순매수' : '순매도'} · {MARKET_LABELS[market]} 상위
        20종목. KIS API FHPTJ04400000 · 단위: 억원.
      </p>

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="px-4 py-2.5 text-right w-14">순위</th>
                <th className="px-4 py-2.5 text-left w-24">종목코드</th>
                <th className="px-4 py-2.5 text-left">종목명</th>
                <th className="px-4 py-2.5 text-right w-32">외국인 순매수</th>
                <th className="px-4 py-2.5 text-right w-32">기관 순매수</th>
                <th className="px-4 py-2.5 text-right w-24">현재가</th>
                <th className="px-4 py-2.5 text-right w-24">등락률</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">
                    로딩 중…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#FF3B30]">
                    데이터를 불러오지 못했습니다
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">
                    데이터 없음
                  </td>
                </tr>
              )}
              {!loading && !error &&
                rows.map((r, i) => {
                  const highlight = netKey ? r[netKey] : r.foreignBuy + r.institutionBuy;
                  return (
                    <tr
                      key={r.symbol}
                      className={`border-t border-[#F0F0F0] hover:bg-[#FAFAFA] ${
                        highlight > 0 ? '' : highlight < 0 ? '' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-right text-[#888] tabular-nums">{i + 1}</td>
                      <td className="px-4 py-2.5 text-[#333] tabular-nums text-xs">{r.symbol}</td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/chart?symbol=${r.symbol}`}
                          className="font-bold text-black hover:text-[#0ABAB5] hover:underline"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                          r.foreignBuy >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                        } ${who === 'foreign' ? buyColor : ''}`}
                      >
                        {fmtBn(r.foreignBuy)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                          r.institutionBuy >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                        } ${who === 'inst' ? buyColor : ''}`}
                      >
                        {fmtBn(r.institutionBuy)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#333] tabular-nums">
                        {fmtPrice(r.price)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                          r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                        }`}
                      >
                        {r.changePercent >= 0 ? '+' : ''}
                        {r.changePercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. 빌드 · 커밋 · push

```bash
npm run build

git add -A
git commit -m "$(cat <<'EOF'
feat(net-buy): STEP 58 Phase A — 순매도 토글 + 투자자·시장 세그먼트 + 막대 시각화

- api/kis/investor-rank: sort(buy/sell) + market 파라미터 추가, combined 필드 반환
- NetBuyTopWidget: 외국인/기관 + 매수/매도 이중 토글
- NetBuyTopWidget: 순매수/매도 금액 막대 시각화 (빨강/파랑 배경)
- NetBuyTopWidget: href 동적화 (?tab=top&who=...&mode=...)
- net-buy/TopTab: 투자자(외국인/기관/합산) + 매수/매도 + 시장(전체/KOSPI/KOSDAQ) 3단 세그먼트
- net-buy/TopTab: URL 파라미터 초기값 반영, 종목명 클릭 시 /chart 이동
EOF
)"

git push
```

---

## 검증 체크리스트

- [ ] 홈 위젯: 외국인/기관 + 매수/매도 토글 모두 동작
- [ ] 매수 시 붉은 막대, 매도 시 파란 막대
- [ ] 위젯 ↗ 클릭 → `/net-buy?tab=top&who=foreign&mode=buy` 등으로 이동
- [ ] /net-buy 페이지: 투자자 3개칩 + 매수/매도 2개칩 + 시장 3개칩 모두 렌더
- [ ] 세그먼트 변경 시 재fetch
- [ ] 합산(combined) 선택 시 외인+기관 합계 기준 정렬
- [ ] 순매도 토글 시 음수값 상위 종목 정렬
- [ ] 빌드 0 에러
