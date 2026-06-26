<!-- 2026-06-25 -->
# STEP 406 — US 종목 탭 KR 구조 통일 (하위탭·기간 드롭다운·증권사 사이드바)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_406_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
미국(US) 종목 보드를 한국(KR) `MarketBoard`와 **구조적으로 동일**하게 다시 만든다. 이전 US 빌드가 갈라져 있었다(기간 탭이 표 위에 가로로, 하위 카테고리 탭 없음, 증권사 사이드바 없음). 이번 STEP은 KR 보드 구조를 그대로 복제한다:

- **하위 카테고리 탭** `주식 | ETF | ETN | 리츠` — KR과 동일한 위치·스타일(검색창도 같은 줄).
- **증권사 바로가기 사이드바** — KR과 동일하게 보드 컴포넌트 안에 내장(데스크탑 우측 `w-72` aside + 모바일 하단 + 종목 클릭 시 바텀시트).
- **기간 드롭다운** — KR 데스크탑처럼 모든 기간 컬럼을 펼치는 대신, **현재가 + 1일 고정 후 단일 드롭다운 컬럼**(KR이 모바일에서 6개 기간 컬럼을 접을 때 쓰는 `<select>` 방식을 **모든 화면폭**에서 재사용). 이것이 KR 대비 유일한 의도적 차이.
- 페이지네이션·검색·행 스타일·등락 색·숫자 포맷·스켈레톤·클라 캐시 모두 KR 미러.

**한 가지 의도적 차이**: US는 기간 컬럼이 KR 데스크탑처럼 다 펼쳐지지 않고 **드롭다운 1개**. 나머지는 전부 KR과 동일.

## 전제
- 최신 main. Next.js 16 App Router(Turbopack, :3333), Tailwind v4. `unjong-*` 식별자 유지. 한국어 UI.
- 배포는 배치 — 이 STEP은 **로컬 빌드 + 로컬 커밋만**(push X, vercel X).
- `MarketBoard.tsx`·`BrokerRanking.tsx`는 **수정 금지**(재사용만). KR 동작 byte-identical 유지.
- `/api/yahoo/us-performance`는 이미 `{symbol,name,price,changePercent(=1일),r1w,r1m,r3m,r6m,r1y,amount}` 반환 — 라우트 변경 없음.
- `/api/watchlist`는 `onConflict user_id,symbol,market` 라 `market:'US'` 안전(이전 STEP 확인).
- ETF/ETN/리츠는 이번엔 **구조만**(데이터 없음 → "준비 중" 빈 상태). 데이터는 다음 STEP.

---

## 1단계 — `components/toolbox/UsMarketBoard.tsx` 전체 교체 (KR 구조 미러)

> 아래 내용으로 파일 **전체를 덮어쓴다**. (현재 파일은 기간 탭이 표 위에 가로로 있고 사이드바·하위탭이 없음 → 폐기.)
>
> **핵심 복제 포인트**
> - KR `MarketBoard`처럼 **하위탭 + 검색**을 같은 컨트롤 줄에 두고, 우측 `w-72`에 "증권사 바로가기" 헤더.
> - 본문은 `flex gap-4` → 좌 `min-w-0 flex-1`(표+페이지네이션), 우 `aside w-72 lg:block`(증권사 리스트). KR과 동일.
> - **기간 드롭다운**은 KR이 모바일에서 쓰는 `<select>`(MarketBoard 224~226행) 마크업을 그대로 가져와 **컬럼 헤더 자리(1일 다음)** 에 배치 — 모든 폭에서. 옵션 변경 시 표시 필드(r1w/r1m/r3m/r6m/r1y)만 바뀌고 **refetch 없음**.
> - 하위탭 `주식`만 `/api/yahoo/us-performance`로 채우고, `ETF/ETN/리츠`는 중앙 "준비 중" 빈 상태(이 탭들은 **fetch 안 함**).
> - ⭐는 KR과 동일하게 `/api/watchlist` `market:'US'`, `stopPropagation`, 비로그인 시 `/auth/login`.
> - 행 클릭은 KR과 동일한 최소 동작(모바일에서 증권사 바텀시트). 별도 증권사 시트 신규 구현 X — KR `BrokerRanking` 재사용.

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star, X } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import BrokerRanking from './BrokerRanking';

type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
  amount?: number; // 거래대금(USD) — 정렬 전용(표시 X)
};

// 하위 카테고리 탭 — KR MarketBoard와 동일 구성. 'stock'만 라이브, 나머지는 '준비 중'.
type SubTab = 'stock' | 'etf' | 'etn' | 'reit';
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '주식' },
  { key: 'etf', label: 'ETF' },
  { key: 'etn', label: 'ETN' },
  { key: 'reit', label: '리츠' },
];

// 기간 드롭다운: 현재가+1일 고정 후 단일 컬럼을 선택 기간으로 표시(KR 모바일 select 방식을 전 폭 재사용).
type PeriodKey = '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m' },
  { key: '3m', label: '3개월', field: 'r3m' },
  { key: '6m', label: '6개월', field: 'r6m' },
  { key: '1y', label: '1년', field: 'r1y' },
];

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}
function usd(v?: number | null): string {
  if (v == null || !v) return '—';
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function fetchRows(): Promise<Row[]> {
  try {
    const j = await (await fetch('/api/yahoo/us-performance')).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y, amount: r.amount,
    }));
  } catch { return []; }
}

export default function UsMarketBoard({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>('us-stock') ?? []);
  const [loading, setLoading] = useState(() => getCache('us-stock') === undefined);
  const [period, setPeriod] = useState<PeriodKey>('1w');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // 'stock' 탭만 데이터 로드(서버 30분 캐시 + 클라 메모리 캐시 stale-while-revalidate).
  // ETF/ETN/리츠는 fetch 안 함 — '준비 중' 빈 상태로만 노출.
  useEffect(() => {
    if (tab !== 'stock') { setSearch(''); setPage(0); return; }
    let cancelled = false;
    setSearch('');
    setPage(0);
    const cached = getCache<Row[]>('us-stock');
    if (cached) { setRows(cached); setLoading(false); } else { setLoading(true); }
    fetchRows().then((r) => { if (!cancelled) { setRows(r); setCache('us-stock', r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);

  // 관심종목 동기화(로그인 시) — KR과 동일하게 symbol 집합 관리.
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.watchlist) setWatchSet(new Set((j.watchlist as { symbol: string }[]).map((w) => w.symbol)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const toggleWatch = (r: Row) => {
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    const add = !watchSet.has(r.symbol);
    setWatchSet((prev) => { const n = new Set(prev); add ? n.add(r.symbol) : n.delete(r.symbol); return n; });
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: r.symbol, name_ko: r.name, market: 'US', country: 'US', add }),
    }).then((res) => { if (!res.ok) throw new Error('watchlist'); }).catch(() => {
      setWatchSet((prev) => { const n = new Set(prev); add ? n.delete(r.symbol) : n.add(r.symbol); return n; });
    });
  };

  const PAGE_SIZE = 50;
  // 거래대금(amount) 내림차순 고정(최다거래 우선) + 검색 필터(티커·이름).
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    return [...base].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }, [rows, search]);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'r1w';

  function pageNumbers(): (number | '…')[] {
    const out: (number | '…')[] = [];
    const cur = page + 1;
    const win = 2;
    const start = Math.max(1, cur - win);
    const end = Math.min(totalPages, cur + win);
    if (start > 1) { out.push(1); if (start > 2) out.push('…'); }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages) { if (end < totalPages - 1) out.push('…'); out.push(totalPages); }
    return out;
  }

  return (
    <section className="min-w-0">
      {/* 컨트롤 줄: 좌=하위탭+검색(같은 줄) / 우(w-72)=증권사 바로가기 헤더 — KR 미러 */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {SUBTABS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setTab(s.key)}
                className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors sm:py-1.5 ${tab === s.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="티커·종목명 검색"
              className="w-32 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-1.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent sm:w-48"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="shrink-0 text-xs text-unjong-muted hover:text-unjong-accent">초기화</button>}
          </div>
        </div>
        <div className="hidden w-72 shrink-0 lg:block">
          <p className="text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        </div>
      </div>

      {/* 좌: 종목 표 / 우: 증권사 리스트 — KR 미러(flex gap-4) */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          {tab !== 'stock' ? (
            <p className="py-16 text-center text-sm text-unjong-muted">준비 중</p>
          ) : loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-unjong-background" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">{search ? `"${search}" 검색 결과 없음` : '데이터가 없습니다. 잠시 후 다시 시도해 주세요.'}</p>
          ) : (
            <table className="w-full min-w-[320px] table-fixed text-sm sm:min-w-[600px]">
              <thead>
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">#</th>
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
                  <th className="w-[96px] whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
                  <th className="w-[72px] whitespace-nowrap px-2 py-2.5 text-right font-medium">1일</th>
                  {/* 기간 드롭다운(KR 모바일 select 마크업 재사용) — 표시 필드만 변경, refetch 없음 */}
                  <th className="w-[88px] whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium">
                    <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className="rounded border border-unjong-border bg-unjong-surface px-1 py-1 text-xs font-medium text-unjong-primary outline-none">
                      {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </th>
                  <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={r.symbol} onClick={() => setSelectedStock(r)} className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background">
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{page * PAGE_SIZE + i + 1}</td>
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <StockLogo code={r.symbol} name={r.name} size={24} />
                        <span className="min-w-0">
                          <span className="font-bold text-unjong-primary">{r.symbol}</span>
                          <span title={r.name} className="ml-1.5 truncate text-xs text-unjong-muted">{r.name}</span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{usd(r.price)}</td>
                    <td className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(r.changePercent)}`}>{pct(r.changePercent)}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-semibold tabular-nums ${pctColor(r[periodField] as number | null | undefined)}`}>{pct(r[periodField] as number | null | undefined)}</td>
                    <td className="w-9 px-1 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                        aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
                        className={`transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} className="mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* 페이지네이션 — 숫자 페이지 (KR MarketBoard와 동일 방식) */}
          {tab === 'stock' && !loading && sorted.length > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-center gap-1 border-t border-unjong-border px-2 py-3 text-xs">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">←</button>
              {pageNumbers().map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="px-1 text-unjong-muted">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage((n as number) - 1)}
                    className={`h-7 min-w-[1.75rem] rounded px-1 tabular-nums transition-colors ${page === (n as number) - 1 ? 'bg-unjong-primary font-bold text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
                  >
                    {n}
                  </button>
                )
              )}
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">→</button>
              <span className="ml-2 text-unjong-muted">총 {sorted.length.toLocaleString()} 종목</span>
            </div>
          )}
        </div>

        {/* 우측: 증권사 리스트(헤더는 위 컨트롤 줄로 이동) — KR과 동일하게 BrokerRanking 재사용 */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
      </div>

      {/* 모바일: 증권사 바로가기 (표 아래 — 데스크탑은 우측 aside) — KR 미러 */}
      <div className="mt-5 lg:hidden">
        <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        <p className="border-b border-unjong-border px-1 py-2 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
        <BrokerRanking hideHeader />
      </div>
      {/* 종목 클릭 → 증권사 바로가기 (모바일 전용 — PC는 우측 리스트로 한눈에) — KR 미러 */}
      {selectedStock && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedStock(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-snug text-unjong-primary">{selectedStock.symbol}</p>
                <p className="font-mono text-xs text-unjong-muted">
                  {selectedStock.name} · {usd(selectedStock.price)}
                  <span className={`ml-1 font-sans font-semibold ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                </p>
              </div>
              <button type="button" onClick={() => setSelectedStock(null)} aria-label="닫기" className="shrink-0 text-unjong-muted hover:text-unjong-primary">
                <X size={20} />
              </button>
            </div>
            <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
            <BrokerRanking hideHeader />
          </div>
        </div>
      )}
    </section>
  );
}
```

## 2단계 — `components/toolbox/ToolboxClient.tsx` 확인 (편집 없음 — 그대로 둠)

> **편집 불필요.** KR/US 모두 증권사 사이드바를 **각 보드 컴포넌트 안에** 내장한다(KR `MarketBoard`는 우측 `aside`+모바일 섹션에 `BrokerRanking`을 자체 포함, 위 1단계로 US `UsMarketBoard`도 동일). 따라서 `ToolboxClient`의 market 분기는 **보드 컴포넌트만 KR↔US로 교체**하면 되고, 래퍼(보드+증권사)는 보드 안에서 공유된다. 아래 블록이 **현재 그대로 유지**되는지만 확인(이미 충족 — 변경 X):
>
> ```tsx
>         {activeTab === 'market' ? (
>           country === 'KR' ? (
>             <MarketBoard isLoggedIn={isLoggedIn} />
>           ) : (
>             <UsMarketBoard isLoggedIn={isLoggedIn} />
>           )
> ```
>
> 즉 KR 렌더는 **현재와 100% 동일**, US만 새 `UsMarketBoard`(KR 구조 미러)로 그려진다. ToolboxClient는 손대지 않는다.

## 3단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add components/toolbox/UsMarketBoard.tsx
git commit -m "feat(STEP 406): US 종목 탭 KR 구조 통일 — 하위탭·기간 드롭다운·증권사 사이드바"
```

> 참고: 이번 STEP은 `UsMarketBoard.tsx` 1개 파일만 변경된다(`ToolboxClient.tsx`는 이미 올바른 분기라 무수정). 만약 검토 중 `ToolboxClient.tsx`를 손댔다면 커밋에 함께 add:
> `git add components/toolbox/UsMarketBoard.tsx components/toolbox/ToolboxClient.tsx`

## 확인
- [ ] 빌드 통과(타입 에러 0).
- [ ] US 종목 탭에 하위탭 `주식 | ETF | ETN | 리츠`가 KR과 같은 위치·스타일로 보인다(검색창 같은 줄).
- [ ] `주식` 탭: `/api/yahoo/us-performance` 데이터, 거래대금 내림차순, 50개/페이지, 숫자 페이지네이션 + `총 N 종목`.
- [ ] 컬럼 = `# | 종목명(티커 볼드 + 영문명) | 현재가($) | 1일 | [기간 ▼] | ⭐`. 기간 드롭다운 옵션 `1주일/1개월/3개월/6개월/1년`, 기본 `1주일`. 선택 시 그 컬럼 값만 바뀌고 **재요청 없음**.
- [ ] 등락 색(`unjong-up`/`unjong-down`)·`+/-%` 포맷이 KR과 동일. 현재가 `$668.00`처럼 소수 2자리 고정.
- [ ] 데스크탑(`lg`) 우측에 "증권사 바로가기" 사이드바(KR `BrokerRanking`), 모바일은 표 아래 + 종목 클릭 시 바텀시트 — KR과 동일.
- [ ] ⭐ 토글: 로그인 시 `/api/watchlist`(`market:'US'`) 반영, 비로그인 클릭 시 `/auth/login`. 행 클릭과 분리(`stopPropagation`).
- [ ] `ETF/ETN/리츠` 탭: 중앙 "준비 중" 빈 상태, fetch 발생 안 함, 사이드바는 그대로.
- [ ] KR 종목 탭은 이전과 **완전히 동일**(MarketBoard 무변경).

## 스킵 / 보류 (다음 STEP)
- **ETF/ETN/리츠 데이터** — 이번엔 "준비 중" 구조만. US ETF/ETN/REIT 성과 라우트는 다음 STEP에서 연결.
- **증권사 US 전용** — 사이드바는 KR `BrokerRanking`(국내 증권사) 그대로 재사용. 가정: 이 증권사들은 해외주식(미국) 거래도 지원하므로 US 탭에서도 "증권사 바로가기"로 유효. US 전용 증권사 목록/해외주식 거래대금 순위는 추후 별도 STEP.
- **상장 이후 수익률(상장이후)** — US 데이터에 없음. 보류.
- **전종목 확장** — 현재 US 유니버스는 라우트의 ~190 대표 종목 고정. KRX 전종목 같은 풀커버리지는 추후.
