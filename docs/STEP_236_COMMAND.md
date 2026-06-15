<!-- 2026-06-14 -->
# STEP 236 — 주식 정렬칩을 '기간칩(실시간·1일·1주일·1개월·3개월·6개월·1년)'으로 (토스식) + 클라이언트 정렬

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_236_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정)
주식 탭 정렬칩을 토스처럼 **기간칩**으로:
- 정렬칩 = **실시간 · 1일 · 1주일 · 1개월 · 3개월 · 6개월 · 1년**
- 거래량·급상승·급하락 **제거**. (거래대금은 칩에서 빠지고 '상위 100 유니버스'를 뽑는 기준으로만 유지)
- 칩 = 그 기간 수익률로 **정렬**. 성적표 **칼럼(현재가·기간들·시총)은 그대로** 유지(다 펼침). 칩은 정렬축.
- 정렬은 **클라이언트**에서. 데이터는 거래대금 유니버스로 1회 fetch.
- **기본 정렬 = 1년**(성적표 지향 — 홈이 '오늘 급등' 보드가 되지 않게). 1년 데이터 연동 전엔 거래대금 순서로 보임.

> 결정 2가지:
> 1) **실시간·1일은 우리 데이터론 같은 값**(우리는 진짜 실시간 아님 — 지연). 일단 토스처럼 둘 다 넣되, 둘 다 '현재 등락률'로 정렬. (원하면 '실시간' 칩 제거 권장 — 더 솔직.)
> 2) **기본 1년** 선택 → 데이터 없을 땐 no-op(거래대금 순서). 1주~1년 데이터 들어오면(다음 STEP) 그 정렬이 자동으로 살아남.

## 전제 상태
- 현재 HEAD: STEP 235 상태 (`72dc575`)
- 변경 **1파일**: `components/market/MarketClient.tsx` (**전체 교체**)
- DB·API 변경 0

---

## 작업 1/1 — `components/market/MarketClient.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  changePercent: number; // 현재 등락률(=실시간/1일)
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

// 정렬축 = 기간칩(토스식). 칩 = 그 기간 수익률로 정렬. (거래대금은 유니버스 기준으로만 사용)
type SortKey = "live" | "1d" | "1w" | "1m" | "3m" | "6m" | "1y";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "live", label: "실시간" },
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
];
// 정렬칩 → 정렬에 쓸 Row 필드 (실시간·1일 = 현재 등락률)
const SORT_FIELD: Record<SortKey, "changePercent" | "r1w" | "r1m" | "r3m" | "r6m" | "r1y"> = {
  live: "changePercent",
  "1d": "changePercent",
  "1w": "r1w",
  "1m": "r1m",
  "3m": "r3m",
  "6m": "r6m",
  "1y": "r1y",
};

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
  const [sort, setSort] = useState<SortKey>("1y"); // 기본=1년(성적표 지향, '오늘 급등' 보드 방지)
  const [market, setMarket] = useState<MarketKey>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터: '거래대금 기준 상위 100 유니버스'를 한 번만 받음(정렬과 분리). 정렬은 아래 클라이언트에서.
  useEffect(() => {
    if (country === "global") return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        let list: Row[] = [];
        if (country === "kr") {
          // 1순위: KRX 100개(약 20분 지연). 비거나 실패하면 2순위: KIS fallback.
          const krxUrl = `/api/krx/ranking?market=${market}&sort=amount&limit=100`;
          const kisUrl = `/api/kis/volume-rank?market=${market}&sort=amount&limit=100`;
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
            // 1주~1년 등락률: 데이터 레이어 연동 전(다음 STEP) → undefined("—")
            r1w: undefined, r1m: undefined, r3m: undefined, r6m: undefined, r1y: undefined,
          }));
        } else {
          const j = await (await fetch(`/api/yahoo/us-movers?dir=up&count=100`)).json();
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
  }, [country, market]);

  // 클라이언트 정렬: 선택 기간 필드 내림차순(미연동 undefined는 뒤로). 1년 등 데이터 없으면 결과적으로 유니버스(거래대금) 순서.
  const sortedRows = useMemo(() => {
    const f = SORT_FIELD[sort];
    return [...rows].sort((a, b) => {
      const av = a[f];
      const bv = b[f];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return bv - av;
    });
  }, [rows, sort]);

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
  const showCap = !embedded;
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

      {/* 필터: 국가 ｜ 시장 ｜ 기간칩(실시간~1년) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { setCountry(c.key); setSort("1y"); setMarket("all"); }}
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
          SORTS.map((s) => (
            <button key={s.key} type="button" onClick={() => setSort(s.key)} className={chip(sort === s.key)}>
              {s.label}
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
            ) : sortedRows.length === 0 ? (
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
                    {sortedRows.map((r, i) => (
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
                        <td className="px-3 py-3 text-unjong-muted tabular-nums">{i + 1}</td>
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

> 핵심: 정렬칩 = **기간칩(실시간·1일·1주일·1개월·3개월·6개월·1년)**. `SORT_FIELD`로 칩→필드 매핑(실시간·1일=현재 등락률). 기본=`"1y"`. fetch는 거래대금 유니버스 1회(deps `[country, market]`), 정렬은 `useMemo`. 칼럼(성적표)·헬퍼는 그대로.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx && git commit -m "feat(v7): 주식 정렬칩 토스식 기간칩(실시간~1년)+클라이언트 정렬, 기본 1년 (STEP 236)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 (`FilterKey`·`US_FILTERS` 잔여참조 0, `useMemo` import) / 커밋·push
- [ ] 주식 탭 칩 = **실시간 · 1일 · 1주일 · 1개월 · 3개월 · 6개월 · 1년** (거래량·급상승·급하락 사라짐)
- [ ] 기본 선택 = **1년** (데이터 없어 지금은 거래대금 순서로 보임 — '오늘 급등' 보드 아님)
- [ ] **1일/실시간** 누르면 현재 등락률 순으로 재정렬됨(작동 확인)
- [ ] **1주일~1년**은 지금 눌러도 재정렬 안 됨(값 "—", 정상 — 데이터 다음 STEP)
- [ ] 종목 클릭·관심·hover 그대로
- ⚠️ 하드 새로고침(Cmd+Shift+R).

## 주의·예상 이슈
- **실시간 칩**: 우리는 진짜 실시간(틱) 데이터가 아니라 1일과 같은 값으로 정렬됨. '안 속게' 관점에선 실시간 칩을 빼는 게 더 솔직 — 원하면 `SORTS`에서 `{ key: "live", ... }` 한 줄만 제거.
- 기본을 1년으로 둔 이유 = 홈 첫 화면이 '오늘 급등 추격' 보드가 되지 않게(미션). 데이터 들어오면 1년 성적표가 기본.
- 다음(237): ETF 칼럼 통일 + 주식/ETF 1주~1년·시총 **실제 데이터** 연동 → 기간칩 정렬이 전부 살아남.
- **문서 TODO**(다음 갱신): STEP 228~236.

---
> STEP 236 = 주식 정렬칩 토스식 기간칩 + 클라이언트 정렬(기본 1년). 전제 STEP 235(`72dc575`).
> 다음(237) = ETF 칼럼 통일 + 기간 수익률 데이터 연동.
