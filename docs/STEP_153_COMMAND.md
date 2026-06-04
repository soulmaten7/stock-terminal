<!-- 2026-06-04 -->
# STEP 153 — 마켓 미국 랭킹 (us-movers 확장 + MarketClient 국가 분기)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_153_COMMAND.md 파일 내용대로 실행해줘`

## 목표
마켓 페이지의 **미국 탭**을 실제 랭킹 테이블로 (현재 placeholder). `/api/yahoo/us-movers` 를 **상승/하락 + 30개 + 거래량** 지원하도록 확장(하위호환)하고, `MarketClient` 를 국가별로 분기.
> 시총·52주·인기 필터(KIS 신규 엔드포인트 필요)와 업종 히트맵은 STEP 154·155 로 분리.

## 전제 상태
- HEAD: `840e718` (STEP 152) — docs `619cc9b`
- 빌드 ✓ / 변경: 수정 2 (API 1, 컴포넌트 1).

## 데이터 (확장 후)
- `/api/yahoo/us-movers?dir=up|down&count=30` → `{ items: [{ code, name, price("$X.XX"), changePct, volume }] }`
- ⚠️ **하위호환**: 파라미터 없으면 기존대로 `dir=up, count=5`. `volume` 필드만 추가(기존 소비자 무영향).

---

## 작업 1/2 — API 확장: `app/api/yahoo/us-movers/route.ts` (파일 전체 교체)

```ts
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// Fallback: 인기 미국 종목 (screener 실패 시)
const POPULAR_US = ["NVDA", "TSLA", "AAPL", "META", "MSFT", "AMD", "AMZN", "GOOG"];

export async function GET(request: NextRequest) {
  const dir = request.nextUrl.searchParams.get("dir") === "down" ? "down" : "up";
  const count = Math.min(parseInt(request.nextUrl.searchParams.get("count") || "5", 10) || 5, 30);
  const scrId = dir === "down" ? "day_losers" : "day_gainers";

  try {
    let items: { code: string; name: string; price: string; changePct: number; volume: number }[] = [];

    try {
      const result = await yf.screener({ scrIds: scrId, count });
      const quotes = result.quotes ?? [];
      items = (quotes as unknown as Array<Record<string, unknown>>).slice(0, count).map((q) => ({
        code: String(q.symbol ?? ""),
        name: String(q.shortName ?? q.longName ?? q.symbol ?? ""),
        price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
        changePct: Number(q.regularMarketChangePercent ?? 0),
        volume: Number(q.regularMarketVolume ?? 0),
      }));
    } catch {
      // screener 실패 시 인기 종목 quote 폴백
      const quotes = await yf.quote(POPULAR_US);
      const quoteArr = Array.isArray(quotes) ? quotes : [quotes];
      items = quoteArr
        .map((q) => ({
          code: String(q.symbol ?? ""),
          name: String(q.shortName ?? q.symbol ?? ""),
          price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
          changePct: Number(q.regularMarketChangePercent ?? 0),
          volume: Number(q.regularMarketVolume ?? 0),
        }))
        .filter((x) => (dir === "down" ? x.changePct < 0 : x.changePct > 0))
        .sort((a, b) => (dir === "down" ? a.changePct - b.changePct : b.changePct - a.changePct))
        .slice(0, count);
    }

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

> 변경점: `GET()` → `GET(request)` + `dir`·`count` 파라미터 + `day_losers` 분기 + `volume` 필드. 폴백도 dir 반영. 기본값(up·5)이 기존과 동일 → 하위호환.

---

## 작업 2/2 — 국가 분기: `components/market/MarketClient.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Row = { rank: number; symbol: string; name: string; priceText: string; changePercent: number; volume: number; tradeAmount?: number };

const COUNTRIES = [
  { key: "kr", label: "국내" },
  { key: "us", label: "미국" },
  { key: "global", label: "글로벌" },
] as const;
type CountryKey = (typeof COUNTRIES)[number]["key"];

type FilterKey = "amount" | "volume" | "up" | "down";
type FilterDef = { key: FilterKey; label: string };

const KR_FILTERS: FilterDef[] = [
  { key: "amount", label: "거래대금" },
  { key: "volume", label: "거래량" },
  { key: "up", label: "상승" },
  { key: "down", label: "하락" },
];
const US_FILTERS: FilterDef[] = [
  { key: "up", label: "상승" },
  { key: "down", label: "하락" },
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

export default function MarketClient() {
  const router = useRouter();
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
          const url =
            filter === "amount" || filter === "volume"
              ? `/api/kis/volume-rank?market=${market}&sort=${filter}&limit=30`
              : `/api/kis/movers?dir=${filter}&market=${market}&limit=30`;
          const j = await (await fetch(url)).json();
          list = (j.stocks ?? j.items ?? []).map((s: Record<string, unknown>, i: number) => ({
            rank: typeof s.rank === "number" ? s.rank : i + 1,
            symbol: String(s.symbol ?? ""),
            name: String(s.name ?? ""),
            priceText: Number(s.price ?? 0).toLocaleString(),
            changePercent: Number(s.changePercent ?? 0),
            volume: Number(s.volume ?? 0),
            tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
          }));
        } else {
          const dir = filter === "down" ? "down" : "up";
          const j = await (await fetch(`/api/yahoo/us-movers?dir=${dir}&count=30`)).json();
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

  return (
    <div className="max-w-[1480px] mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
        <p className="mt-1 text-sm text-unjong-muted">실시간 랭킹 — 종목 클릭 시 상세로. (시총·52주 필터·히트맵은 순차 확장)</p>
      </header>

      {/* 국가 탭 */}
      <div className="flex items-center gap-2 border-b border-unjong-border mb-4">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setCountry(c.key);
              setFilter(c.key === "us" ? "up" : "amount");
              setMarket("all");
            }}
            className={
              country === c.key
                ? "px-3 py-2 text-sm font-bold text-unjong-primary border-b-2 border-unjong-primary -mb-px"
                : "px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary border-b-2 border-transparent -mb-px"
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {country === "global" ? (
        <EmptyState icon="🛠️" title="글로벌 마켓 준비 중" description="순차 확장 예정 (STEP 154~)." className="py-12" />
      ) : (
        <>
          {/* 시장 필터 (국내만) */}
          {country === "kr" && (
            <div className="flex items-center gap-1.5 mb-3">
              {MARKETS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMarket(m.key)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                    market === m.key ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* 랭킹 필터 (국가별) */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  filter === f.key ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 랭킹 테이블 */}
          <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft overflow-hidden">
            {loading ? (
              <LoadingState className="py-10" />
            ) : rows.length === 0 ? (
              <EmptyState title="데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-unjong-muted border-b border-unjong-border">
                    <th className="text-left font-medium px-4 py-2.5 w-12">순위</th>
                    <th className="text-left font-medium px-4 py-2.5">종목명</th>
                    <th className="text-right font-medium px-4 py-2.5">현재가</th>
                    <th className="text-right font-medium px-4 py-2.5">전일대비</th>
                    <th className="text-right font-medium px-4 py-2.5 hidden md:table-cell">거래량</th>
                    {country === "kr" && <th className="text-right font-medium px-4 py-2.5 hidden md:table-cell">거래대금</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const up = r.changePercent >= 0;
                    return (
                      <tr
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}`)}
                        className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
                      >
                        <td className="px-4 py-3 text-unjong-muted tabular-nums">{r.rank}</td>
                        <td className="px-4 py-3 font-medium text-unjong-primary">{r.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{r.priceText}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${up ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                          {up ? "+" : ""}{r.changePercent.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-muted hidden md:table-cell">
                          {r.volume ? r.volume.toLocaleString() : "—"}
                        </td>
                        {country === "kr" && (
                          <td className="px-4 py-3 text-right tabular-nums text-unjong-muted hidden md:table-cell">
                            {fmtAmount(r.tradeAmount)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
```

> 변경점: `Row.price`(number) → `priceText`(string, 국내=원 포맷·미국=$ 문자열). 국가 탭 클릭 시 filter/market 동시 초기화. 미국=US_FILTERS(상승/하락) + us-movers 연결, 거래대금 칸 국내만. 글로벌은 placeholder.

---

## 작업 3/3 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add app/api/yahoo/us-movers/route.ts components/market/MarketClient.tsx && git commit -m "feat(v7): 마켓 미국 랭킹 — us-movers 상승/하락·30개·거래량 확장 + MarketClient 국가 분기 (STEP 153)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (확인) `npm run dev` → `/market` 미국 탭 → 상승/하락 랭킹(NVDA 등 $가격), 클릭→/stock/[심볼]

## 주의·예상 이슈
- us-movers 확장은 **하위호환**(파라미터 없으면 up·5, volume 추가만) → 기존 홈 소비자 무영향.
- 미국 가격은 "$310.26" 문자열 → `priceText` 로 통일(국내는 원 포맷). 거래대금 칸은 국내만.
- US screener(day_gainers/losers) 실패 시 POPULAR_US 폴백(dir 반영).
- 미국 종목 클릭 → `/stock/NVDA` (종목 페이지가 `/^\d{6}$/` 로 한/미 구분 — 기존 동작).
- 미국은 코스피/코스닥 시장 필터 숨김(국내만 표시).

---
> STEP 153 = V7 마켓 미국 랭킹. 전제 `840e718` → 커밋 후 다음(154) = 시총·52주·인기 필터(KIS 신규 엔드포인트) / (155) 업종 히트맵. 문서는 묶어서 갱신.
