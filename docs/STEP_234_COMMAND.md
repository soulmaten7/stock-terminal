<!-- 2026-06-14 -->
# STEP 234 — 주식 마켓 테이블을 '기간 수익률 성적표' 칼럼으로 재구성 (UI-first)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_234_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정)
주식(실시간 차트 = `MarketClient`) 테이블을 **전 상품 공통 성적표 칼럼**의 기준 템플릿으로 만든다.
- 칼럼: **순위 · 종목명 · 현재가 · 1일 · 1주 · 1개월 · 3개월 · 6개월 · 1년 · 시총**
- 기간을 **칩(하나 골라보기) → 칼럼(다 펼쳐 한눈에)**으로 전환 → 기존 기간 칩 줄 제거.
- 정렬용 '거래대금/거래량' 등 **필터 칩은 유지**(어떤 100종목을 가져올지 결정 — 데이터 소스).
- **UI-first**: 1일 = 현재 등락률(있음), **1주~1년·시총은 데이터 미연동이라 지금은 "—"**(다음 STEP에서 채움).
- 화면 폭: **홈(embedded)=핵심 3기간(1일·1개월·1년)**, **마켓 페이지(full)=6기간 전부 + 시총**.

> ETF/펀드(`HomeEtfRanking`)에 같은 칼럼 적용 + 주식 기간 데이터 실제 연동 = **다음 STEP(235~)**.
> (ETF는 1·3·6·12개월 데이터가 이미 있어 235에서 바로 채워짐.)

## 전제 상태
- 현재 HEAD: STEP 233 상태 (`df3d054`)
- 변경 **1파일**: `components/market/MarketClient.tsx` (**전체 교체**)
- DB·API 변경 0 (UI 구조만 — fetch 로직은 그대로 보존)

---

## 작업 1/1 — `components/market/MarketClient.tsx` (파일 전체 교체)

> 아래 내용으로 파일을 통째로 덮어쓴다. (fetch/관심·hover/라우팅 전부 보존, 칼럼만 성적표로 교체 + 기간 칩·거래량·거래대금 칼럼 제거 + `pct`/`pctColor` 헬퍼 추가 + `PERIODS`·`period` 상태 제거)

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { StockLogo } from "@/components/ui/StockLogo";
import { Heart } from "lucide-react";
import { useWatchlist } from "@/stores/watchlistStore";

type Row = {
  rank: number;
  symbol: string;
  name: string;
  priceText: string;
  changePercent: number; // 1일 등락률
  volume: number;
  tradeAmount?: number;
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
  marketCap?: number;
};

const COUNTRIES = [
  { key: "kr", label: "국내" },
  { key: "us", label: "미국" },
  { key: "global", label: "글로벌" },
] as const;
type CountryKey = (typeof COUNTRIES)[number]["key"];

type FilterKey = "amount" | "volume" | "cap" | "up" | "down";
type FilterDef = { key: FilterKey; label: string };

const KR_FILTERS: FilterDef[] = [
  { key: "amount", label: "거래대금" },
  { key: "volume", label: "거래량" },
  { key: "up", label: "급상승" },
  { key: "down", label: "급하락" },
];
const US_FILTERS: FilterDef[] = [
  { key: "up", label: "급상승" },
  { key: "down", label: "급하락" },
];

const MARKETS = [
  { key: "all", label: "전체" },
  { key: "kospi", label: "코스피" },
  { key: "kosdaq", label: "코스닥" },
] as const;
type MarketKey = (typeof MARKETS)[number]["key"];

function fmtAmount(won?: number): string {
  if (!won || won <= 0) return "—";
  if (won >= 1e12) return `${(won / 1e12).toFixed(1)}조`;
  if (won >= 1e8) return `${Math.round(won / 1e8).toLocaleString()}억`;
  return won.toLocaleString();
}
function pct(v?: number | null): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return "text-unjong-muted";
  return v >= 0 ? "text-[#F04452]" : "text-[#3182F6]";
}

export type HoverStock = { symbol: string; name: string; priceText: string; changePercent: number; volume: number; tradeAmount?: number };

export default function MarketClient({ embedded = false, onHover, detailSlot }: { embedded?: boolean; onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const router = useRouter();
  const watchItems = useWatchlist((s) => s.items);
  const addWatch = useWatchlist((s) => s.add);
  const removeWatch = useWatchlist((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isWatched = (code: string) => watchItems.some((i) => i.code === code);
  const [country, setCountry] = useState<CountryKey>("kr");
  const [filter, setFilter] = useState<FilterKey>("amount");
  const [market, setMarket] = useState<MarketKey>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (country === "global") return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        let list: Row[] = [];
        if (country === "kr") {
          // 1순위: KRX 100개(약 20분 지연). 비거나 실패하면 2순위: KIS 30개 fallback.
          const krxUrl = `/api/krx/ranking?market=${market}&sort=${filter}&limit=100`;
          const kisUrl =
            filter === "amount" || filter === "volume"
              ? `/api/kis/volume-rank?market=${market}&sort=${filter}&limit=100`
              : filter === "cap"
              ? `/api/kis/market-cap?market=${market}&limit=100`
              : `/api/kis/movers?dir=${filter}&market=${market}&limit=100`;
          let raw: Record<string, unknown>[] = [];
          try {
            const j = await (await fetch(krxUrl)).json();
            raw = (j.stocks ?? []) as Record<string, unknown>[];
          } catch {
            raw = [];
          }
          if (raw.length === 0) {
            const j = await (await fetch(kisUrl)).json();
            raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
          }
          list = raw.map((s, i: number) => ({
            rank: typeof s.rank === "number" ? s.rank : i + 1,
            symbol: String(s.symbol ?? ""),
            name: String(s.name ?? ""),
            priceText: Number(s.price ?? 0).toLocaleString(),
            changePercent: Number(s.changePercent ?? 0),
            volume: Number(s.volume ?? 0),
            tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
            marketCap: typeof s.marketCap === "number" ? s.marketCap : undefined,
            // 1주~1년 등락률: 데이터 레이어 연동 전(다음 STEP) → 지금은 미연동(undefined → "—")
            r1w: undefined, r1m: undefined, r3m: undefined, r6m: undefined, r1y: undefined,
          }));
        } else {
          const dir = filter === "down" ? "down" : "up";
          const j = await (await fetch(`/api/yahoo/us-movers?dir=${dir}&count=100`)).json();
          list = (j.items ?? []).map((s: Record<string, unknown>, i: number) => ({
            rank: i + 1,
            symbol: String(s.code ?? ""),
            name: String(s.name ?? ""),
            priceText: String(s.price ?? "—"),
            changePercent: Number(s.changePct ?? 0),
            volume: Number(s.volume ?? 0),
          }));
        }
        if (!cancelled) setRows(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [country, filter, market]);

  const filters = country === "us" ? US_FILTERS : KR_FILTERS;
  const shownRows = rows;

  // 토스식 칩: 라운드스퀘어, 선택=진한 채움/흰 글씨, 비선택=글자만
  const chip = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
    }`;

  // 성적표 기간 칼럼 (1일 = changePercent, 나머지는 Row 필드). 홈(embedded)=핵심 3개, 마켓=6개 전부.
  const periodCols: { key: string; label: string }[] = embedded
    ? [
        { key: "1d", label: "1일" },
        { key: "r1m", label: "1개월" },
        { key: "r1y", label: "1년" },
      ]
    : [
        { key: "1d", label: "1일" },
        { key: "r1w", label: "1주" },
        { key: "r1m", label: "1개월" },
        { key: "r3m", label: "3개월" },
        { key: "r6m", label: "6개월" },
        { key: "r1y", label: "1년" },
      ];
  const showCap = !embedded; // 시총은 마켓 페이지에만(홈은 폭 절약)
  const periodVal = (r: Row, key: string): number | null | undefined => {
    if (key === "1d") return r.changePercent;
    return r[key as "r1w" | "r1m" | "r3m" | "r6m" | "r1y"];
  };

  return (
    <div className={embedded ? "" : "px-4 py-6"}>
      {!embedded && (
        <header className="mb-4">
          <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
          <p className="mt-1 text-sm text-unjong-muted">기간 수익률 성적표 — 종목 클릭 시 상세로. (1주~1년 데이터 순차 연동)</p>
        </header>
      )}

      {/* 필터 (토스식 라운드스퀘어 칩: 국가 ｜ 시장 ｜ 정렬) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { setCountry(c.key); setFilter(c.key === "us" ? "up" : "amount"); setMarket("all"); }}
            className={chip(country === c.key)}
          >
            {c.label}
          </button>
        ))}

        {country === "kr" && <span className="mx-1.5 h-5 w-px bg-unjong-border" />}
        {country === "kr" &&
          MARKETS.map((m) => (
            <button key={m.key} type="button" onClick={() => setMarket(m.key)} className={chip(market === m.key)}>
              {m.label}
            </button>
          ))}

        {country !== "global" && <span className="mx-1.5 h-5 w-px bg-unjong-border" />}
        {country !== "global" &&
          filters.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={chip(filter === f.key)}>
              {f.label}
            </button>
          ))}
      </div>

      {country === "global" ? (
        <EmptyState icon="🛠️" title="글로벌 마켓 준비 중" description="순차 확장 예정 (STEP 154~)." className="py-12" />
      ) : (
        <div className={embedded ? "grid grid-cols-1 items-start gap-4 xl:grid-cols-3" : ""}>
          <section className={`overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft ${embedded ? "min-w-0 xl:col-span-2" : ""}`}>
            {loading ? (
              <LoadingState className="py-10" />
            ) : shownRows.length === 0 ? (
              <EmptyState title="데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-unjong-muted border-b border-unjong-border">
                      <th className="w-8 px-2 py-2.5"></th>
                      <th className="text-left font-medium px-3 py-2.5 w-12">순위</th>
                      <th className="text-left font-medium px-3 py-2.5">종목명</th>
                      <th className="text-right font-medium px-3 py-2.5 whitespace-nowrap">현재가</th>
                      {periodCols.map((p) => (
                        <th key={p.key} className="text-right font-medium px-3 py-2.5 whitespace-nowrap">{p.label}</th>
                      ))}
                      {showCap && <th className="text-right font-medium px-3 py-2.5 whitespace-nowrap">시총</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {shownRows.map((r) => (
                      <tr
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}`)}
                        onMouseEnter={() => onHover?.({ symbol: r.symbol, name: r.name, priceText: r.priceText, changePercent: r.changePercent, volume: r.volume, tradeAmount: r.tradeAmount })}
                        className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
                      >
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            aria-label="관심 토글"
                            className="p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWatched(r.symbol)) removeWatch(r.symbol);
                              else addWatch({ code: r.symbol, name: r.name, market: country === "us" ? "US" : "KOSPI" });
                            }}
                          >
                            <Heart
                              size={15}
                              fill={mounted && isWatched(r.symbol) ? "currentColor" : "none"}
                              className={mounted && isWatched(r.symbol) ? "text-[#3182F6]" : "text-unjong-muted hover:text-[#3182F6]"}
                            />
                          </button>
                        </td>
                        <td className="px-3 py-3 text-unjong-muted tabular-nums">{r.rank}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5 whitespace-nowrap">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-unjong-primary whitespace-nowrap">{r.priceText}</td>
                        {periodCols.map((p) => {
                          const v = periodVal(r, p.key);
                          return (
                            <td key={p.key} className={`px-3 py-3 text-right tabular-nums font-semibold whitespace-nowrap ${pctColor(v)}`}>
                              {pct(v)}
                            </td>
                          );
                        })}
                        {showCap && (
                          <td className="px-3 py-3 text-right tabular-nums text-unjong-muted whitespace-nowrap">{fmtAmount(r.marketCap)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {embedded && detailSlot}
        </div>
      )}
    </div>
  );
}
```

> 핵심: `PERIODS`·`PeriodKey`·`period`/`setPeriod`·기간 칩 블록 **삭제**(미사용 0). 거래량·거래대금 칼럼 → **기간 칼럼**으로 교체. `pct`/`pctColor` 추가. `marketCap`은 API에 있으면 표시, 없으면 "—". 1주~1년은 전부 "—"(다음 STEP에서 채움). `overflow-x-auto`로 칼럼 많아도 안전.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx && git commit -m "feat(v7): 주식 마켓 테이블 기간 수익률 성적표 칼럼화(UI, 1주~1년 placeholder) (STEP 234)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 (미사용 import/변수 에러 없음 — `period`·`PERIODS` 잔여 참조 0) / 커밋·push
- [ ] 홈 실시간 차트 칼럼: **현재가 · 1일 · 1개월 · 1년** (핵심 3기간), 거래량·거래대금·기간 칩 **사라짐**
- [ ] `/market` 페이지 칼럼: **현재가 · 1일 · 1주 · 1개월 · 3개월 · 6개월 · 1년 · 시총** (전부)
- [ ] **1일** 칸은 색(빨강/파랑)으로 값 표시, **1주~1년·시총**은 지금 **"—"**(정상 — 데이터 다음 STEP)
- [ ] 종목 클릭 → 상세 이동, 관심(하트) 토글, hover 미리보기 **그대로 동작**
- ⚠️ 클라이언트 컴포넌트 → 하드 새로고침(Cmd+Shift+R).

## 주의·예상 이슈
- 지금은 1주~1년이 전부 "—" → **의도된 UI-first 상태**(데이터 미연동). 빈 표 아님.
- 홈(embedded)에서 칼럼이 좁으면 가로 스크롤(`overflow-x-auto`) — 의도.
- KRX 응답에 `marketCap` 필드가 없으면 시총도 "—"(마켓 페이지) — 다음 STEP에서 KRX `MKTCAP` plumbing.
- **다음(235)**: ETF/펀드(`HomeEtfRanking`)에 동일 칼럼 + 주식 1주~1년 실제 데이터 연동.
- **문서 TODO**(다음 갱신): STEP 228~234.

---
> STEP 234 = 주식 마켓 테이블 성적표 칼럼화(UI-first, 기간 placeholder). 전제 STEP 233(`df3d054`).
> 다음(235) = ETF·펀드 동일 칼럼 + 주식 기간 수익률 데이터 연동(데이터 레이어).
