<!-- 2026-06-06 -->
# STEP 169 — #1 관심종목 우측 레일 토스화 (헤더까지 풀하이트 + 레터아바타 + ♥)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_169_COMMAND.md 파일 내용대로 실행해줘`

## 목표
토스처럼 **관심종목을 헤더까지 올라오는 풀하이트 우측 컬럼**으로 + 토스식 카드(레터아바타 원형 · 종목명/코드 · 가격 · 등락% · ♥).
- 홈을 **2단 레이아웃**: 왼쪽(상태바+지수그리드+랭킹) / 오른쪽(관심 레일, sticky 풀하이트)
- 로고 = **레터 아바타**(첫 글자+파스텔색) — 무료 국내 로고 소스 없음 대응, 전 종목 커버. `lib/avatar.ts`로 빼서 추후 랭킹(#3)에서도 재사용
- 이 우측 영역에 **추후 채팅 탭** 들어올 자리 → 풀하이트로 미리 확보 (이번엔 관심종목만)

## 전제 상태
- HEAD: `959d8fa`(STEP 168) 이상
- 변경: 신규 `lib/avatar.ts` · `components/sidebar/WatchlistPanel.tsx`(교체) · `components/home-v6/HomeRightRail.tsx`(교체) · `components/home-v6/HomeClientV6.tsx`(교체)

---

## 작업 1/4 — 신규 파일 `lib/avatar.ts`

```ts
// 종목 레터 아바타 — 무료 로고 소스 없는 국내 종목용. 첫 글자 + 이름 해시 파스텔색.
const PALETTE = [
  "#FEE2E2", "#FEF3C7", "#D1FAE5", "#DBEAFE",
  "#EDE9FE", "#FCE7F3", "#E0F2FE", "#FEF9C3",
  "#FFE4E6", "#ECFCCB",
];

export function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function avatarChar(name: string): string {
  const t = (name || "").trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}
```

---

## 작업 2/4 — `components/sidebar/WatchlistPanel.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Heart, Plus } from "lucide-react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import { useWatchlist, type WatchlistItem } from "@/stores/watchlistStore";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { avatarBg, avatarChar } from "@/lib/avatar";

type PriceInfo = { price: string; changePct: number };
type PriceMap = Record<string, PriceInfo | null>;

export function WatchlistPanel() {
  const router = useRouter();
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [mounted, setMounted] = useState(false);
  const items = useWatchlist((s) => s.items);
  const addItem = useWatchlist((s) => s.add);
  const removeItem = useWatchlist((s) => s.remove);
  const resetItems = useWatchlist((s) => s.reset);

  const [prices, setPrices] = useState<PriceMap>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addInput, setAddInput] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // 가격 폴링 (30초)
  useEffect(() => {
    if (!mounted || items.length === 0) {
      setPrices({});
      setPricesLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const krCodes = items.filter((i) => i.market !== "US").map((i) => i.code);
      const usCodes = items.filter((i) => i.market === "US").map((i) => i.code);
      const next: PriceMap = {};
      await Promise.all(
        krCodes.map(async (code) => {
          try {
            const r = await fetch(`/api/kis/price?symbol=${code}`);
            if (!r.ok) return;
            const json = await r.json();
            if (json.error) return;
            next[code] = { price: Number(json.price).toLocaleString(), changePct: Number(json.changePercent) || 0 };
          } catch { next[code] = null; }
        })
      );
      if (usCodes.length > 0) {
        try {
          const r = await fetch(`/api/yahoo/quote?symbols=${usCodes.join(",")}`);
          if (r.ok) {
            const json = await r.json();
            (json.items as Array<{ code: string; price: number; changePct: number }>).forEach((it) => {
              next[it.code] = { price: `$${it.price.toFixed(2)}`, changePct: it.changePct };
            });
          }
        } catch { /* 무시 */ }
      }
      if (!cancelled) { setPrices(next); setPricesLoading(false); }
    };
    setPricesLoading(true);
    load();
    const interval = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [items, mounted]);

  const handleAdd = () => {
    const raw = addInput.trim().toUpperCase();
    if (!raw) return;
    let item: WatchlistItem;
    if (/^\d{6}$/.test(raw)) item = { code: raw, name: raw, market: "KOSPI" };
    else if (/^[A-Z.\-]+$/.test(raw)) item = { code: raw, name: raw, market: "US" };
    else return;
    addItem(item);
    setAddInput("");
    setShowAdd(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
    else if (e.key === "Escape") { setShowAdd(false); setAddInput(""); }
  };

  const handleItemClick = (item: WatchlistItem) => {
    const p = prices[item.code];
    setSelectedSymbol({ code: item.code, name: item.name, price: p?.price, changePct: p?.changePct, market: item.market });
    router.push(`/stock/${item.code}`);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-4 py-3 bg-unjong-background flex-shrink-0">
        <span className="text-sm font-bold text-unjong-primary" suppressHydrationWarning>
          관심 종목 {mounted ? `${items.length}` : ""}
        </span>
        <button type="button" onClick={() => setShowAdd((v) => !v)} className="text-unjong-muted hover:text-unjong-accent p-0.5" aria-label="관심종목 추가" title="추가">
          <Plus size={15} />
        </button>
      </div>

      {/* 추가 입력창 */}
      {showAdd && (
        <div className="border-b border-unjong-border bg-unjong-background p-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <input type="text" value={addInput} onChange={(e) => setAddInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="005930 또는 AAPL" autoFocus className="flex-1 px-2 py-1 text-sm rounded border border-unjong-border bg-unjong-surface text-unjong-primary focus:outline-none focus:border-unjong-accent" />
            <button type="button" onClick={handleAdd} className="px-2 py-1 text-sm rounded bg-unjong-accent text-white font-semibold hover:opacity-90">추가</button>
          </div>
          <p className="text-xs text-unjong-muted mt-1">한국: 6자리 종목코드 · 미국: 티커 (예: TSLA)</p>
        </div>
      )}

      {/* 리스트 */}
      <ul className="flex-1 overflow-y-auto min-h-0 divide-y divide-unjong-border">
        {!mounted ? (
          <li><LoadingState /></li>
        ) : items.length === 0 ? (
          <li>
            <EmptyState title="관심종목이 없습니다" action={
              <button type="button" onClick={resetItems} className="text-xs text-unjong-accent hover:underline">기본 종목 8개 복원</button>
            } />
          </li>
        ) : (
          items.map((item) => {
            const p = prices[item.code];
            const isUp = (p?.changePct ?? 0) >= 0;
            return (
              <li key={item.code} className="group flex items-center gap-2 px-3 py-2 text-sm hover:bg-unjong-background cursor-pointer transition-colors">
                <button type="button" onClick={() => handleItemClick(item)} className="flex flex-1 items-center gap-2.5 min-w-0 text-left">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-unjong-primary" style={{ background: avatarBg(item.name) }}>
                    {avatarChar(item.name)}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-unjong-primary truncate">{item.name}</span>
                    <span className="text-xs text-unjong-muted">{item.code}</span>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-0.5 shrink-0">
                    <span className="font-semibold text-unjong-primary tabular-nums">{pricesLoading && !p ? "..." : (p?.price ?? "—")}</span>
                    {p && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{isUp ? "+" : ""}{p.changePct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); removeItem(item.code); }} className="shrink-0 text-[#F04452] hover:opacity-70 p-0.5" aria-label={`${item.name} 관심 해제`} title="관심 해제">
                  <Heart size={14} fill="currentColor" />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
```
> 변경점: 레터 아바타 원형(좌) + X→♥(항상 표시, 클릭 시 관심 해제). 데이터·store·폴링 로직 동일.

---

## 작업 3/4 — `components/home-v6/HomeRightRail.tsx` (파일 전체 교체)

```tsx
"use client";

import Link from "next/link";
import { Bell, Star, Briefcase, Clock } from "lucide-react";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";

export default function HomeRightRail() {
  const nav = [
    { icon: Bell, label: "알림", href: "/mypage" },
    { icon: Star, label: "관심종목", href: "/" },
    { icon: Briefcase, label: "보유종목", href: "/mypage" },
    { icon: Clock, label: "최근 본", href: "/" },
  ];
  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-5 self-start h-[calc(100vh-6rem)]">
      {/* 아이콘 nav */}
      <div className="flex items-center justify-around bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft py-3 flex-shrink-0">
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <Link key={n.label} href={n.href} title={n.label} className="flex flex-col items-center gap-1 text-unjong-muted hover:text-unjong-primary transition-colors">
              <Icon size={18} />
              <span className="text-[10px]">{n.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 관심 종목 (남은 높이 가득) — 추후 이 컬럼에 채팅 탭 추가 예정 */}
      <div className="flex-1 min-h-0">
        <WatchlistPanel />
      </div>
    </aside>
  );
}
```
> 변경점: 고정 `h-[420px]` 제거 → `aside` 풀하이트(`h-[calc(100vh-6rem)]` sticky), WatchlistPanel `flex-1`로 채움. 숏컷 placeholder 제거(채팅 들어올 자리).

---

## 작업 4/4 — `components/home-v6/HomeClientV6.tsx` (파일 전체 교체)

```tsx
"use client";

import { useRef } from "react";
import HomeIndexBar from "./HomeIndexBar";
import HomeRightRail from "./HomeRightRail";
import HomeStickyTicker from "./HomeStickyTicker";
import MarketClient from "@/components/market/MarketClient";

export default function HomeClientV6() {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* 왼쪽: 상태바 + 지수 그리드 + 실시간 랭킹 */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-unjong-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
              국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
              해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
            </span>
          </div>

          <div ref={gridRef}>
            <HomeIndexBar />
          </div>

          <div className="mt-5">
            <MarketClient embedded />
          </div>
        </div>

        {/* 오른쪽: 관심 레일 (헤더까지 풀하이트) */}
        <HomeRightRail />
      </div>

      {/* 하단 고정 마퀴 티커 */}
      <HomeStickyTicker observeRef={gridRef} />
    </div>
  );
}
```
> 변경점: 전체를 `grid-cols-[1fr_320px]` 2단으로 — 왼쪽에 상태바+지수+랭킹, 오른쪽에 관심 레일(상단부터 풀하이트). `gridRef`(지수)·`HomeStickyTicker` 유지.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add lib/avatar.ts components/sidebar/WatchlistPanel.tsx components/home-v6/HomeRightRail.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 관심종목 우측 레일 토스화 — 헤더까지 풀하이트 2단 레이아웃 + 레터아바타 + ♥ (STEP 169)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈이 **2단**(왼쪽 지수+랭킹 / 오른쪽 관심 레일)으로, 관심 레일이 **상단(헤더 근처)부터 길게** 내려오는지
- [ ] 관심종목 각 행에 **원형 레터 아바타**(삼=삼성전자 등) + 가격/등락% + **♥**(클릭 시 해제) 보이는지
- [ ] 지수 그리드 10개·하단 티커 정상(레이아웃 바뀌어도 유지)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 지수 그리드가 오른쪽 레일(320px)만큼 좁아짐 — 넓은 화면에선 5열 유지(정상, 토스 동일).
- 레터 아바타는 첫 글자 기반(삼성전자=삼, Apple=A). 유명 종목 실로고는 추후 옵션.
- 다음(#3)에서 같은 `lib/avatar.ts`로 랭킹 테이블에도 아바타 적용.
- 채팅은 이 우측 컬럼에 탭으로 추후 추가.

---
> STEP 169 = #1 관심 레일 토스화. 전제 `959d8fa`. 다음: #3 랭킹 로고(레터아바타) · #2 hover 상세 · #4 카테고리 탭. 문서 묶어 갱신.
