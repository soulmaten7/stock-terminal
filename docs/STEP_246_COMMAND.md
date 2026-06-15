<!-- 2026-06-15 -->
# STEP 246 — `/market`('상품 리스트') 전 타입 통합 디렉토리 (주식·ETF·리츠 한 자로 가로질러)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_246_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정 — A)
`/market` 페이지가 지금 주식만 보여줌 → **모든 상품(주식·ETF·리츠)을 같은 기간 수익률 자로 가로질러 비교하는 통합 성적표**로. (우리 핵심 차별점 "타입 가로질러 비교"의 실현)
- 한 테이블에 주식·ETF·리츠 섞어서, **타입 배지** + **타입 필터**(전체/주식/ETF/리츠) + **기간칩**(1일~1년).
- 선택 기간 수익률로 **전 타입 가로질러 정렬**. 기본 1일.
- 클라이언트가 기존 3개 perf 엔드포인트(kr/etf/reit) 병합 — 새 데이터 소스 없음.

> US는 이번 제외(us-performance에 name 없음 — 추후 확장). ETF는 r1w(1주일) 없음 → 1주일 탭에선 ETF 빠짐(정상).

## 전제 상태
- 현재 HEAD: STEP 245(`14e0664`)
- 변경 **3파일**:
  - `app/api/yahoo/kr-performance/route.ts` (**전체 교체** — name·price·changePercent 추가해 shape 통일)
  - `components/market/MarketDirectoryClient.tsx` (**신규**)
  - `app/market/page.tsx` (**전체 교체** — MarketClient → MarketDirectoryClient)
- kr-performance 확장은 **STEP 243 병합과 무관**(MarketClient는 r1w~r1y만 사용).

---

## 작업 1/3 — `app/api/yahoo/kr-performance/route.ts` (파일 전체 교체 — shape 통일)

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 대표 국내 주식 (코드·이름·시장). 통합 디렉토리용으로 name·price·changePercent도 반환(reit/etf와 동일 shape).
const UNIVERSE: { sym: string; name: string; mkt: "KS" | "KQ" }[] = [
  { sym: "005930", name: "삼성전자", mkt: "KS" },
  { sym: "000660", name: "SK하이닉스", mkt: "KS" },
  { sym: "373220", name: "LG에너지솔루션", mkt: "KS" },
  { sym: "207940", name: "삼성바이오로직스", mkt: "KS" },
  { sym: "005380", name: "현대차", mkt: "KS" },
  { sym: "000270", name: "기아", mkt: "KS" },
  { sym: "005490", name: "POSCO홀딩스", mkt: "KS" },
  { sym: "035420", name: "NAVER", mkt: "KS" },
  { sym: "035720", name: "카카오", mkt: "KS" },
  { sym: "051910", name: "LG화학", mkt: "KS" },
  { sym: "006400", name: "삼성SDI", mkt: "KS" },
  { sym: "105560", name: "KB금융", mkt: "KS" },
  { sym: "055550", name: "신한지주", mkt: "KS" },
  { sym: "086790", name: "하나금융지주", mkt: "KS" },
  { sym: "012330", name: "현대모비스", mkt: "KS" },
  { sym: "028260", name: "삼성물산", mkt: "KS" },
  { sym: "066570", name: "LG전자", mkt: "KS" },
  { sym: "003670", name: "포스코퓨처엠", mkt: "KS" },
  { sym: "015760", name: "한국전력", mkt: "KS" },
  { sym: "034730", name: "SK", mkt: "KS" },
  { sym: "017670", name: "SK텔레콤", mkt: "KS" },
  { sym: "030200", name: "KT", mkt: "KS" },
  { sym: "011200", name: "HMM", mkt: "KS" },
  { sym: "009150", name: "삼성전기", mkt: "KS" },
  { sym: "032830", name: "삼성생명", mkt: "KS" },
  { sym: "010130", name: "고려아연", mkt: "KS" },
  { sym: "018260", name: "삼성에스디에스", mkt: "KS" },
  { sym: "010950", name: "S-Oil", mkt: "KS" },
  { sym: "259960", name: "크래프톤", mkt: "KS" },
  { sym: "042700", name: "한미반도체", mkt: "KS" },
  { sym: "009540", name: "HD한국조선해양", mkt: "KS" },
  { sym: "267260", name: "HD현대일렉트릭", mkt: "KS" },
  { sym: "064350", name: "현대로템", mkt: "KS" },
  { sym: "011170", name: "롯데케미칼", mkt: "KS" },
  { sym: "096770", name: "SK이노베이션", mkt: "KS" },
  { sym: "003550", name: "LG", mkt: "KS" },
  { sym: "247540", name: "에코프로비엠", mkt: "KQ" },
  { sym: "086520", name: "에코프로", mkt: "KQ" },
  { sym: "196170", name: "알테오젠", mkt: "KQ" },
  { sym: "028300", name: "HLB", mkt: "KQ" },
  { sym: "277810", name: "레인보우로보틱스", mkt: "KQ" },
  { sym: "240810", name: "원익IPS", mkt: "KQ" },
  { sym: "357780", name: "솔브레인", mkt: "KQ" },
  { sym: "058470", name: "리노공업", mkt: "KQ" },
  { sym: "066970", name: "엘앤에프", mkt: "KQ" },
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
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

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
          name: e.name,
          price: closes[closes.length - 1],
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

> 출력에 `name·price·changePercent` 추가(reit/etf와 동일 shape). MarketClient(STEP 243)는 `r1w~r1y`만 병합에 써서 영향 없음.

---

## 작업 2/3 — `components/market/MarketDirectoryClient.tsx` (신규)

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import HomeStockDetail from "@/components/home-v6/HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";

type TypeKey = "주식" | "ETF" | "리츠";
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
  { key: "리츠", label: "리츠" },
];
const TYPE_BADGE: Record<TypeKey, string> = {
  주식: "bg-unjong-background text-[#3182F6]",
  ETF: "bg-unjong-background text-[#12B886]",
  리츠: "bg-unjong-background text-[#7048E8]",
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
function toHover(r: Row): HoverStock {
  return { symbol: r.symbol, name: r.name, priceText: r.price.toLocaleString(), changePercent: r.changePercent, volume: 0 };
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
      const grab = (path: string) =>
        fetch(path)
          .then((r) => r.json())
          .then((j) => (j.items ?? []) as Omit<Row, "type">[])
          .catch(() => [] as Omit<Row, "type">[]);
      const [kr, etf, reit] = await Promise.all([
        grab("/api/yahoo/kr-performance"),
        grab("/api/yahoo/etf-performance"),
        grab("/api/yahoo/reit-performance"),
      ]);
      const combined: Row[] = [
        ...kr.map((x) => ({ ...x, type: "주식" as TypeKey })),
        ...etf.map((x) => ({ ...x, type: "ETF" as TypeKey })),
        ...reit.map((x) => ({ ...x, type: "리츠" as TypeKey })),
      ];
      if (!cancelled) {
        setAllRows(combined);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { setHovered(null); }, [period, typeFilter]);

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

  return (
    <div className="px-6 py-5">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-unjong-primary">상품 리스트</h1>
        <p className="mt-1 text-sm text-unjong-muted">모든 투자상품을 같은 기간 수익률 자로 가로질러 — 중립 성적표. 종목 클릭 시 상세로.</p>
      </header>

      {/* 타입 필터 ｜ 기간칩 */}
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
                        onClick={() => router.push(`/stock/${r.symbol}`)}
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
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{r.price.toLocaleString()}</td>
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

> 3개 perf 엔드포인트(kr/etf/reit) 클라 병합 + 타입 태그. 타입 필터(전체/주식/ETF/리츠) + 기간칩. 선택 기간 수익률로 **전 타입 가로질러 정렬**. wide 미리보기. 새 데이터 소스 없음.

---

## 작업 3/3 — `app/market/page.tsx` (파일 전체 교체)

```tsx
import type { Metadata } from "next";
import MarketDirectoryClient from "@/components/market/MarketDirectoryClient";

export const metadata: Metadata = { title: "상품 리스트 — 운종" };

export default function MarketPage() {
  return <MarketDirectoryClient />;
}
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/kr-performance/route.ts components/market/MarketDirectoryClient.tsx app/market/page.tsx && git commit -m "feat(v7): /market 상품 통합 디렉토리 — 주식·ETF·리츠 한 자로 가로질러(타입배지·필터·기간칩) (STEP 246)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 헤더 **'상품 리스트'** 클릭(`/market`) → 주식·ETF·리츠가 **한 테이블에 섞여** 기간 수익률 순
- [ ] **타입 배지**(주식 파랑·ETF 초록·리츠 보라) + **타입 필터**(전체/주식/ETF/리츠) + **기간칩**(1일~1년)
- [ ] 기간 바꾸면 전 타입 가로질러 재정렬, 기본 1일
- [ ] 미리보기(wide) 동작, 종목 클릭 → 상세
- [ ] 홈 탭(주식 병합)은 그대로 정상(kr-performance 확장 무영향)
- ⚠️ 첫 로드 시 yahoo(주식45+ETF16+리츠14) 처리로 수 초(각 30분 캐시, 홈 사용으로 보통 워밍됨).

## 주의·예상 이슈
- ETF는 r1w(1주일) 없음 → '1주일' 필터에선 ETF 빠짐(주식·리츠만, 정상).
- US 미포함(us-performance에 name 없음) — 추후 name 추가하면 합류.
- 시뮬 환경상 국내 주식 수익률이 큼(삼성전자 등) → 통합 정렬 시 주식이 상단 경향(정상, 타입 배지로 구분).
- **문서 TODO**(다음 갱신): STEP 243~246.

---
> STEP 246 = /market 전 타입 통합 디렉토리(주식·ETF·리츠 가로질러). 전제 STEP 245(`14e0664`).
> 다음 후보: US 합류 · ETN(KRX)·펀드(KOFIA) 소스 · 종목→증권사 바로가기(B).
