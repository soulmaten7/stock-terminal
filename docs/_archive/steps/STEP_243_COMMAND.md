<!-- 2026-06-15 -->
# STEP 243 — 주식 기간 수익률(1주~1년) 실데이터 연동 (yahoo kr-performance + MarketClient 병합)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_243_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정)
주식 성적표의 **1주~1년 "—" 칸을 실데이터로** 채운다.
- 신규 `/api/yahoo/kr-performance` — 대표 국내 주식(~45)의 과거 시세로 **r1w·r1m·r3m·r6m·r1y** 계산 (기존 `etf-performance`와 동일 방식, 30분 캐시).
- `MarketClient`가 KRX 거래대금 유니버스(100)에 **심볼로 병합** → 그 종목이 대표 유니버스에 있으면 기간 수익률 채워짐, 없으면 "—"(소형주·신규).
- **2단계 로드**: KRX(1일) 먼저 즉시 표시 → 기간 수익률 도착하면 갱신(느려도 1일은 바로 보임).
- 시총은 이미 KRX `MKTCAP`로 들어옴(마켓 페이지) — 변경 없음.

## 전제 상태
- 현재 HEAD: STEP 242(`5a38ca1`) + STEP 240 적용 후(HomeEtfRanking). MarketClient = STEP 237+239 상태.
- 변경 **2파일**:
  - `app/api/yahoo/kr-performance/route.ts` (**신규**)
  - `components/market/MarketClient.tsx` (**전체 교체** — 병합 로직 추가)
- 검증: yahoo `.KS`/`.KQ` 국내 시세 정상 확인 완료(앱 시세와 일치).

---

## 작업 1/2 — `app/api/yahoo/kr-performance/route.ts` (신규 파일)

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 대표 국내 주식 (코드·시장 KS=코스피/KQ=코스닥). yahoo 과거 시세로 기간 수익률 계산.
// 코드/시장 틀리면 자동 제외(self-clean). 거래대금 상위 유니버스와 '심볼'로 병합됨.
const UNIVERSE: { sym: string; mkt: "KS" | "KQ" }[] = [
  { sym: "005930", mkt: "KS" }, // 삼성전자
  { sym: "000660", mkt: "KS" }, // SK하이닉스
  { sym: "373220", mkt: "KS" }, // LG에너지솔루션
  { sym: "207940", mkt: "KS" }, // 삼성바이오로직스
  { sym: "005380", mkt: "KS" }, // 현대차
  { sym: "000270", mkt: "KS" }, // 기아
  { sym: "005490", mkt: "KS" }, // POSCO홀딩스
  { sym: "035420", mkt: "KS" }, // NAVER
  { sym: "035720", mkt: "KS" }, // 카카오
  { sym: "051910", mkt: "KS" }, // LG화학
  { sym: "006400", mkt: "KS" }, // 삼성SDI
  { sym: "105560", mkt: "KS" }, // KB금융
  { sym: "055550", mkt: "KS" }, // 신한지주
  { sym: "086790", mkt: "KS" }, // 하나금융지주
  { sym: "012330", mkt: "KS" }, // 현대모비스
  { sym: "028260", mkt: "KS" }, // 삼성물산
  { sym: "066570", mkt: "KS" }, // LG전자
  { sym: "003670", mkt: "KS" }, // 포스코퓨처엠
  { sym: "015760", mkt: "KS" }, // 한국전력
  { sym: "034730", mkt: "KS" }, // SK
  { sym: "017670", mkt: "KS" }, // SK텔레콤
  { sym: "030200", mkt: "KS" }, // KT
  { sym: "011200", mkt: "KS" }, // HMM
  { sym: "009150", mkt: "KS" }, // 삼성전기
  { sym: "032830", mkt: "KS" }, // 삼성생명
  { sym: "010130", mkt: "KS" }, // 고려아연
  { sym: "018260", mkt: "KS" }, // 삼성에스디에스
  { sym: "010950", mkt: "KS" }, // S-Oil
  { sym: "259960", mkt: "KS" }, // 크래프톤
  { sym: "042700", mkt: "KS" }, // 한미반도체
  { sym: "009540", mkt: "KS" }, // HD한국조선해양
  { sym: "267260", mkt: "KS" }, // HD현대일렉트릭
  { sym: "064350", mkt: "KS" }, // 현대로템
  { sym: "011170", mkt: "KS" }, // 롯데케미칼
  { sym: "096770", mkt: "KS" }, // SK이노베이션
  { sym: "003550", mkt: "KS" }, // LG
  { sym: "247540", mkt: "KQ" }, // 에코프로비엠
  { sym: "086520", mkt: "KQ" }, // 에코프로
  { sym: "196170", mkt: "KQ" }, // 알테오젠
  { sym: "028300", mkt: "KQ" }, // HLB
  { sym: "277810", mkt: "KQ" }, // 레인보우로보틱스
  { sym: "240810", mkt: "KQ" }, // 원익IPS
  { sym: "357780", mkt: "KQ" }, // 솔브레인
  { sym: "058470", mkt: "KQ" }, // 리노공업
  { sym: "066970", mkt: "KQ" }, // 엘앤에프
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

let cache: { at: number; data: unknown } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // ~13개월

  const results = await Promise.all(
    UNIVERSE.map(async (e) => {
      try {
        const ch = await yf.chart(`${e.sym}.${e.mkt}`, { period1, interval: "1d" });
        const closes = ((ch.quotes ?? []) as Array<{ close: number | null }>)
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        return {
          symbol: e.sym,
          r1w: ret(closes, 5),
          r1m: ret(closes, 21),
          r3m: ret(closes, 63),
          r6m: ret(closes, 126),
          r1y: ret(closes, 252),
        };
      } catch {
        return null;
      }
    })
  );

  const items = results.filter((x) => x !== null);
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```

> `etf-performance`와 동일 패턴 + `r1w`(5영업일) 추가. 영업일 오프셋: 1주=5·1개월=21·3개월=63·6개월=126·1년=252. 반환 `{ items: [{ symbol, r1w, r1m, r3m, r6m, r1y }] }`.

---

## 작업 2/2 — `components/market/MarketClient.tsx` (파일 전체 교체)

> 변경점: `PerfRow` 타입 추가 + KR fetch를 **2단계(KRX 즉시 → kr-performance 병합)**로. 나머지(칩·단일칼럼·정렬)는 그대로.

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
  changePercent: number; // 1일전 대비(현재 등락률)
  volume: number;
  tradeAmount?: number;
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
  marketCap?: number;
};

type PerfRow = { symbol: string; r1w?: number | null; r1m?: number | null; r3m?: number | null; r6m?: number | null; r1y?: number | null };

const COUNTRIES = [
  { key: "kr", label: "국내" },
  { key: "us", label: "미국" },
  { key: "global", label: "글로벌" },
] as const;
type CountryKey = (typeof COUNTRIES)[number]["key"];

type PeriodKey = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
];
const PERIOD_FIELD: Record<PeriodKey, "changePercent" | "r1w" | "r1m" | "r3m" | "r6m" | "r1y"> = {
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
  const [period, setPeriod] = useState<PeriodKey>("1d");
  const [market, setMarket] = useState<MarketKey>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (country === "global") return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (country === "kr") {
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
          // 1단계: KRX(1일) 즉시 표시 — 기간 칸은 일단 "—"
          const base: Row[] = raw.map((s, i: number) => ({
            rank: typeof s.rank === "number" ? s.rank : i + 1,
            symbol: String(s.symbol ?? ""),
            name: String(s.name ?? ""),
            priceText: Number(s.price ?? 0).toLocaleString(),
            changePercent: Number(s.changePercent ?? 0),
            volume: Number(s.volume ?? 0),
            tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
            marketCap: typeof s.marketCap === "number" ? s.marketCap : undefined,
          }));
          if (!cancelled) { setRows(base); setLoading(false); }
          // 2단계: 기간 수익률 병합 (느려도 1일은 이미 보임 · 실패 시 무시)
          try {
            const j = await (await fetch("/api/yahoo/kr-performance")).json();
            const perfMap: Record<string, PerfRow> = {};
            for (const it of (j.items ?? []) as PerfRow[]) if (it.symbol) perfMap[String(it.symbol)] = it;
            if (!cancelled) {
              setRows((prev) =>
                prev.map((r) => {
                  const p = perfMap[r.symbol];
                  return p
                    ? { ...r, r1w: p.r1w ?? undefined, r1m: p.r1m ?? undefined, r3m: p.r3m ?? undefined, r6m: p.r6m ?? undefined, r1y: p.r1y ?? undefined }
                    : r;
                })
              );
            }
          } catch {
            /* 기간 수익률 실패 → "—" 유지 */
          }
        } else {
          const j = await (await fetch(`/api/yahoo/us-movers?dir=up&count=100`)).json();
          const list: Row[] = (j.items ?? []).map((s: Record<string, unknown>, i: number) => ({
            rank: i + 1,
            symbol: String(s.code ?? ""),
            name: String(s.name ?? ""),
            priceText: String(s.price ?? "—"),
            changePercent: Number(s.changePct ?? 0),
            volume: Number(s.volume ?? 0),
          }));
          if (!cancelled) setRows(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [country, market]);

  const field = PERIOD_FIELD[period];
  const periodLabel = PERIODS.find((p) => p.key === period)!.label;

  // 클라이언트 정렬: 선택 기간 수익률 내림차순(미연동 undefined는 뒤로).
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return bv - av;
    });
  }, [rows, field]);

  const chip = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
    }`;

  return (
    <div className={embedded ? "" : "px-4 py-6"}>
      {!embedded && (
        <header className="mb-4">
          <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
          <p className="mt-1 text-sm text-unjong-muted">기간 수익률 성적표 — 기간칩으로 구간 선택. (대표 종목 1주~1년 실데이터)</p>
        </header>
      )}

      {/* 필터: 국가 ｜ 시장 ｜ 기간칩 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => { setCountry(c.key); setPeriod("1d"); setMarket("all"); }}
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
          PERIODS.map((p) => (
            <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
              {p.label}
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
                      <th className="text-right font-medium px-3 py-2.5 whitespace-nowrap">{periodLabel}전 대비</th>
                      {!embedded && <th className="text-right font-medium px-3 py-2.5 whitespace-nowrap">시총</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r, i) => {
                      const v = r[field];
                      return (
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
                          <td className={`px-3 py-3 text-right tabular-nums font-semibold whitespace-nowrap ${pctColor(v)}`}>{pct(v)}</td>
                          {!embedded && (
                            <td className="px-3 py-3 text-right tabular-nums text-unjong-muted whitespace-nowrap">{fmtAmount(r.marketCap)}</td>
                          )}
                        </tr>
                      );
                    })}
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

> 핵심: KR fetch가 2단계 — `setRows(base)`로 1일 즉시, 그다음 `/api/yahoo/kr-performance` 병합해 `setRows((prev)=>...)`. 대표 유니버스에 든 종목만 기간 수익률 채워지고 나머지는 "—"(소형주·신규). 정렬은 기존 클라이언트 정렬 그대로(기간 데이터 있으면 위로).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/kr-performance/route.ts components/market/MarketClient.tsx && git commit -m "feat(v7): 주식 기간 수익률(1주~1년) 실데이터 — yahoo kr-performance + MarketClient 병합 (STEP 243)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 주식 탭에서 **1주일/1개월/3개월/6개월/1년** 누르면 **대표 종목들 수익률 실제 표시**(삼성전자·SK하이닉스·에코프로 등), 그 기준 정렬
- [ ] 1일은 기존처럼 즉시 표시(KRX), 기간 수익률은 잠깐 뒤 채워짐(2단계 로드)
- [ ] 대표 유니버스에 없는 소형주·신규는 기간 칸 "—"(정상 — 정렬 시 아래로)
- [ ] `/market` 페이지 시총 칼럼 정상(KRX MKTCAP)
- ⚠️ 하드 새로고침. 첫 로드 시 yahoo ~45종목이라 기간 수익률 수 초 걸릴 수 있음(이후 30분 캐시).

## 주의·예상 이슈
- kr-performance는 **대표 ~45종목 고정 유니버스**(거래대금 상위와 심볼 병합). 전 종목 기간 수익률은 추후 확장.
- yahoo 첫 호출이 느리거나 일부 종목 rate-limit이면 그 종목만 "—"(self-clean) — 2단계 로드라 1일은 영향 없음.
- 현재가는 KRX, 기간 수익률은 yahoo 기준(같은 종목이라 비율은 일관) — 소폭 시점 차 가능.
- 다음: ETN·리츠·펀드 데이터(같은 패턴) · 미국 기간 수익률(us-performance) · 전 종목 확장.
- **문서 TODO**(다음 갱신): STEP 243~.

---
> STEP 243 = 주식 1주~1년 실데이터(yahoo kr-performance 병합). 전제 STEP 242(`5a38ca1`)+240.
> 다음 = ETN·리츠·펀드 데이터(동일 패턴) / 미국 기간 수익률 / 전 종목 확장.
