<!-- 2026-06-15 -->
# STEP 261 — /market 통합에 미국·ETN 합류

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_261_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (핵심 차별점 완성: "모든 상품 가로질러 비교")
`/market` 통합 디렉토리에 **미국·ETN 추가** → 주식·ETF·리츠·미국·ETN을 같은 기간 수익률 자로 비교.
- **미국**: `us-performance`가 지금 `symbol`+기간수익률만 줌 → **이름·현재가·1일등락 추가**(kr-performance 패턴). 그래야 통합 표에 표시됨.
- **ETN**: `/api/krx/etn`(1일 시세만) → **1일 비교에만 합류**(기간 수익률 없어 1주~1년엔 자동 제외). 거래대금 상위 40개만.

## 전제 상태
- 현재 HEAD: STEP 260 적용 후(펀드 제거)
- 변경 **2파일**:
  - `app/api/yahoo/us-performance/route.ts` (이름·현재가·1일등락 추가 — 전체 교체)
  - `components/market/MarketDirectoryClient.tsx` (미국·ETN 타입/필터/배지/fetch — 전체 교체)
- 검증: us-performance에 필드 추가는 **가산만** → 홈 MarketClient US 병합(STEP 245)은 r-필드만 읽으므로 무영향.

---

## 작업 1/2 — `app/api/yahoo/us-performance/route.ts` (전체 교체)

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 대표 미국 종목 (us-movers 폴백 유니버스와 동일). 티커 접미사 없음.
const UNIVERSE = [
  "NVDA", "TSLA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "AMD", "NFLX", "AVGO",
  "INTC", "QCOM", "ORCL", "CRM", "ADBE", "MU", "JPM", "BAC", "V", "MA",
  "WMT", "COST", "KO", "PEP", "DIS", "NKE", "BA", "CAT", "XOM", "CVX",
  "JNJ", "UNH", "HD", "MCD", "SBUX", "PYPL", "UBER", "COIN", "PLTR", "SOFI",
];

const NAMES: Record<string, string> = {
  NVDA: "NVIDIA", TSLA: "Tesla", AAPL: "Apple", MSFT: "Microsoft", AMZN: "Amazon",
  GOOGL: "Alphabet", META: "Meta", AMD: "AMD", NFLX: "Netflix", AVGO: "Broadcom",
  INTC: "Intel", QCOM: "Qualcomm", ORCL: "Oracle", CRM: "Salesforce", ADBE: "Adobe",
  MU: "Micron", JPM: "JPMorgan", BAC: "Bank of America", V: "Visa", MA: "Mastercard",
  WMT: "Walmart", COST: "Costco", KO: "Coca-Cola", PEP: "PepsiCo", DIS: "Disney",
  NKE: "Nike", BA: "Boeing", CAT: "Caterpillar", XOM: "Exxon Mobil", CVX: "Chevron",
  JNJ: "Johnson & Johnson", UNH: "UnitedHealth", HD: "Home Depot", MCD: "McDonald's",
  SBUX: "Starbucks", PYPL: "PayPal", UBER: "Uber", COIN: "Coinbase", PLTR: "Palantir", SOFI: "SoFi",
};

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
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

  const results = await Promise.all(
    UNIVERSE.map(async (sym) => {
      try {
        const ch = await yf.chart(sym, { period1, interval: "1d" });
        const closes = ((ch.quotes ?? []) as Array<{ close: number | null }>)
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        const price = closes[closes.length - 1];
        return {
          symbol: sym,
          name: NAMES[sym] ?? sym,
          price,
          changePercent: ret(closes, 1) ?? 0,
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

> 추가: `name`(영문)·`price`(최종 종가)·`changePercent`(`ret(closes,1)`=1일). r-필드 그대로 → 홈 US 병합 무영향.

---

## 작업 2/2 — `components/market/MarketDirectoryClient.tsx` (전체 교체)

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import HomeStockDetail from "@/components/home-v6/HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";

type TypeKey = "주식" | "ETF" | "리츠" | "미국" | "ETN";
type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
  type: TypeKey;
};
type PerfItem = Omit<Row, "type">;

type PeriodKey = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
];
const FIELD: Record<PeriodKey, "changePercent" | "r1w" | "r1m" | "r3m" | "r6m" | "r1y"> = {
  "1d": "changePercent",
  "1w": "r1w",
  "1m": "r1m",
  "3m": "r3m",
  "6m": "r6m",
  "1y": "r1y",
};

type FilterKey = "all" | TypeKey;
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "주식", label: "주식" },
  { key: "ETF", label: "ETF" },
  { key: "ETN", label: "ETN" },
  { key: "리츠", label: "리츠" },
  { key: "미국", label: "미국" },
];
const TYPE_BADGE: Record<TypeKey, string> = {
  주식: "bg-unjong-background text-[#3182F6]",
  ETF: "bg-unjong-background text-[#12B886]",
  리츠: "bg-unjong-background text-[#7048E8]",
  미국: "bg-unjong-background text-[#F76707]",
  ETN: "bg-unjong-background text-[#1098AD]",
};

function chip(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
  }`;
}
function pct(v?: number | null): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return "text-unjong-muted";
  return v >= 0 ? "text-[#F04452]" : "text-[#3182F6]";
}
function priceText(r: Row): string {
  return r.type === "미국" ? `$${r.price.toLocaleString()}` : r.price.toLocaleString();
}
function toHover(r: Row): HoverStock {
  return { symbol: r.symbol, name: r.name, priceText: priceText(r), changePercent: r.changePercent, volume: 0 };
}

export default function MarketDirectoryClient() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>("1d");
  const [typeFilter, setTypeFilter] = useState<FilterKey>("all");
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const grab = (path: string): Promise<PerfItem[]> =>
        fetch(path)
          .then((r) => r.json())
          .then((j) => (j.items ?? []) as PerfItem[])
          .catch(() => [] as PerfItem[]);
      const grabEtn = (): Promise<PerfItem[]> =>
        fetch("/api/krx/etn")
          .then((r) => r.json())
          .then((j) => {
            const arr = (j.etns ?? []) as Array<{ symbol: string; name: string; price: number; changePercent: number; tradeAmount?: number }>;
            return [...arr]
              .sort((a, b) => (b.tradeAmount ?? 0) - (a.tradeAmount ?? 0))
              .slice(0, 40)
              .map((e) => ({ symbol: e.symbol, name: e.name, price: e.price, changePercent: e.changePercent })) as PerfItem[];
          })
          .catch(() => [] as PerfItem[]);

      const [kr, etf, reit, us, etn] = await Promise.all([
        grab("/api/yahoo/kr-performance"),
        grab("/api/yahoo/etf-performance"),
        grab("/api/yahoo/reit-performance"),
        grab("/api/yahoo/us-performance"),
        grabEtn(),
      ]);
      const combined: Row[] = [
        ...kr.map((x) => ({ ...x, type: "주식" as TypeKey })),
        ...etf.map((x) => ({ ...x, type: "ETF" as TypeKey })),
        ...reit.map((x) => ({ ...x, type: "리츠" as TypeKey })),
        ...us.map((x) => ({ ...x, type: "미국" as TypeKey })),
        ...etn.map((x) => ({ ...x, type: "ETN" as TypeKey })),
      ];
      if (!cancelled) {
        setAllRows(combined);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setHovered(null);
  }, [period, typeFilter]);

  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  const field = FIELD[period];

  const rows = useMemo(() => {
    return allRows
      .filter((r) => (typeFilter === "all" ? true : r.type === typeFilter))
      .filter((r) => r[field] != null)
      .sort((a, b) => (b[field] as number) - (a[field] as number))
      .slice(0, 60);
  }, [allRows, field, typeFilter]);

  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);

  // ETN은 1일 시세만 → 기간 선택 시 빈 결과 안내
  const etnPeriodNote = typeFilter === "ETN" && period !== "1d";

  return (
    <div className="px-6 py-5">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-unjong-primary">상품 리스트</h1>
        <p className="mt-1 text-sm text-unjong-muted">모든 투자상품을 같은 기간 수익률 자로 가로질러 — 중립 성적표. 종목 클릭 시 상세로.</p>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setTypeFilter(f.key)} className={chip(typeFilter === f.key)}>
            {f.label}
          </button>
        ))}
        <span className="mx-1.5 h-5 w-px bg-unjong-border" />
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {loading ? (
            <LoadingState className="py-10" />
          ) : etnPeriodNote ? (
            <EmptyState title="ETN은 1일 시세만 제공돼요" description="ETN은 기간 수익률 데이터가 없어요. '1일'로 보세요." className="py-10" />
          ) : rows.length === 0 ? (
            <EmptyState title="데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
                    <th className="px-4 py-2.5 text-left font-medium">종목명</th>
                    <th className="px-4 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">{periodLabel}전 대비</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const v = r[field];
                    return (
                      <tr
                        key={`${r.type}-${r.symbol}`}
                        onClick={() => router.push(`/stock/${r.symbol}?name=${encodeURIComponent(r.name)}`)}
                        onMouseEnter={() => setHovered(toHover(r))}
                        className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
                      >
                        <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_BADGE[r.type]}`}>{r.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{priceText(r)}</td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <HomeStockDetail stock={previewStock} wide />
      </div>
    </div>
  );
}
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/us-performance/route.ts components/market/MarketDirectoryClient.tsx && git commit -m "feat(v7): /market 통합에 미국·ETN 합류 (us-performance에 이름·현재가·1일등락 추가, ETN 1일 비교) (STEP 261)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 재시작 + `/market`(상품 리스트)** → 타입 필터에 **미국·ETN** 추가, 표에 미국(배지·$가격)·ETN(1일) 합류
- [ ] 기간 1주~1년 → 미국 정상 표시 / ETN은 자동 제외(1일만)
- [ ] ETN 필터 + 1주~1년 → "ETN은 1일 시세만" 안내
- [ ] 홈 주식 탭 미국 병합 정상(무영향 확인)

## 주의·예상 이슈
- us-performance 30분 캐시 → 서버 재시작 시 즉시 반영.
- 미국 가격은 USD라 `$` 표기. ETN은 거래대금 상위 40개만(1일 등락 큰 레버리지 ETN이 1일 상위 차지 가능 — 타입 필터로 좁히기).
- **문서 TODO**(다음 갱신): STEP 261.

---
> STEP 261 = /market 미국·ETN 합류. 전제 STEP 260.
> 다음(②): 종목 → 증권사 바로가기(허브).
