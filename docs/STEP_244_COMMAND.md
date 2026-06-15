<!-- 2026-06-15 -->
# STEP 244 — 리츠 탭 실데이터 (yahoo reit-performance + 제네릭 HomePerfRanking 컴포넌트)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_244_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정)
'준비 중'이던 **리츠 탭을 실데이터로** 채운다 (주식·ETF처럼 기간 수익률 성적표 + 미리보기).
- 신규 `/api/yahoo/reit-performance` — 주요 국내 리츠 14개(전부 yahoo 확인 완료)의 현재가·1일·r1w·r1m·r3m·r6m·r1y.
- 신규 **제네릭 `HomePerfRanking`** 컴포넌트 — 단일 소스(yahoo) 기간 랭킹. 단일 '[기간]전 대비' 칼럼 + 기간칩 + **wide 미리보기**(주식·ETF와 동일 레이아웃). **리츠·ETN 공용**(다음 ETN도 이 컴포넌트 재사용).
- `HomeRankingTabs`: 리츠 `ComingSoon` → `HomePerfRanking`.

## 전제 상태
- 현재 HEAD: STEP 243(`9d2f654`)
- 변경 **3파일**:
  - `app/api/yahoo/reit-performance/route.ts` (**신규**)
  - `components/home-v6/HomePerfRanking.tsx` (**신규**, 제네릭)
  - `components/home-v6/HomeRankingTabs.tsx` (find/replace 2곳)
- 검증: 14개 리츠 yahoo `.KS` 정상(롯데리츠 3,775·SK리츠 5,840·맥쿼리인프라 10,950 등).

---

## 작업 1/3 — `app/api/yahoo/reit-performance/route.ts` (신규)

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 주요 국내 리츠 (전부 yahoo .KS 확인). 단일 소스 — 현재가·1일·기간 수익률 모두 yahoo 시세에서 계산.
const UNIVERSE: { sym: string; name: string }[] = [
  { sym: "088980", name: "맥쿼리인프라" },
  { sym: "330590", name: "롯데리츠" },
  { sym: "293940", name: "신한알파리츠" },
  { sym: "395400", name: "SK리츠" },
  { sym: "448730", name: "삼성FN리츠" },
  { sym: "451800", name: "한화리츠" },
  { sym: "432320", name: "KB스타리츠" },
  { sym: "094800", name: "맵스리얼티1" },
  { sym: "404990", name: "신한서부티엔디리츠" },
  { sym: "365550", name: "ESR켄달스퀘어리츠" },
  { sym: "357120", name: "코람코라이프인프라리츠" },
  { sym: "400760", name: "NH올원리츠" },
  { sym: "377190", name: "디앤디플랫폼리츠" },
  { sym: "348950", name: "제이알글로벌리츠" },
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
        const ch = await yf.chart(`${e.sym}.KS`, { period1, interval: "1d" });
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

> 반환 `{ items: [{ symbol, name, price, changePercent, r1w, r1m, r3m, r6m, r1y }] }`. 단일 소스(주식과 달리 KRX 병합 불필요 — 리츠는 거래대금 상위 100에 잘 안 들어와서 yahoo가 더 적합).

---

## 작업 2/3 — `components/home-v6/HomePerfRanking.tsx` (신규, 제네릭 — 리츠/ETN 공용)

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import HomeStockDetail from "./HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";

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

export default function HomePerfRanking({ apiPath, emptyLabel }: { apiPath: string; emptyLabel: string }) {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>("1d");
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const j = await (await fetch(apiPath)).json();
        if (!cancelled) setAllRows((j.items ?? []) as Row[]);
      } catch {
        if (!cancelled) setAllRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiPath]);

  useEffect(() => { setHovered(null); }, [period]);

  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  const field = FIELD[period];

  const rows = useMemo(() => {
    return [...allRows]
      .filter((r) => r[field] != null)
      .sort((a, b) => (b[field] as number) - (a[field] as number))
      .slice(0, 20);
  }, [allRows, field]);

  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);

  return (
    <div>
      {/* 기간칩 (위, 풀폭 — 주식·ETF와 동일) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-unjong-muted">기간 수익률 · 최근 시세 기준</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {loading ? (
            <LoadingState className="py-10" />
          ) : rows.length === 0 ? (
            <EmptyState title={`${emptyLabel} 데이터 없음`} description="잠시 후 다시 시도해 주세요." className="py-10" />
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
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}`)}
                        onMouseEnter={() => setHovered(toHover(r))}
                        className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
                      >
                        <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
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

> 단일 소스(`apiPath`) 기간 랭킹. 주식·ETF와 동일한 단일칼럼·기간칩·**wide 미리보기**. `emptyLabel`로 빈상태 문구. ETN도 다음에 `apiPath`만 바꿔 재사용.

---

## 작업 3/3 — `components/home-v6/HomeRankingTabs.tsx` (find/replace 2곳)

**① 찾기 (import):**
```tsx
import HomeEtfRanking from "./HomeEtfRanking";
import HomeRoomRanking from "./HomeRoomRanking";
```
**바꾸기:**
```tsx
import HomeEtfRanking from "./HomeEtfRanking";
import HomePerfRanking from "./HomePerfRanking";
import HomeRoomRanking from "./HomeRoomRanking";
```

**② 찾기 (리츠 탭 렌더):**
```tsx
      {tab === "reit" && <ComingSoon label="리츠" />}
```
**바꾸기:**
```tsx
      {tab === "reit" && <HomePerfRanking apiPath="/api/yahoo/reit-performance" emptyLabel="리츠" />}
```
> ETN(`{tab === "etn" && <ComingSoon label="ETN" />}`)·펀드는 그대로 — 리츠만 연결. `ComingSoon`은 ETN이 계속 쓰므로 유지.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/reit-performance/route.ts components/home-v6/HomePerfRanking.tsx components/home-v6/HomeRankingTabs.tsx && git commit -m "feat(v7): 리츠 탭 실데이터 — yahoo reit-performance + 제네릭 HomePerfRanking (STEP 244)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **리츠 탭** = '준비 중' 사라지고 **표(롯데리츠·SK리츠·맥쿼리인프라 등) + 기간칩 + 미리보기(wide)** 등장
- [ ] 기간칩(1일~1년) 누르면 그 기간 수익률로 정렬·표시 (1년은 -64%~+34%로 갈림 — 정상)
- [ ] 미리보기 폭이 주식·ETF와 동일
- [ ] ETN·펀드 탭은 '준비 중' 그대로
- ⚠️ 하드 새로고침. 첫 로드 시 yahoo 14종목이라 잠깐 걸릴 수 있음(이후 30분 캐시).

## 주의·예상 이슈
- 리츠 14개 = 주요 종목. 더 추가하려면 `reit-performance` `UNIVERSE`에 코드·이름 넣으면 됨(틀리면 self-clean).
- `HomePerfRanking`은 제네릭 — **ETN은 다음 STEP에서 `apiPath`만 새 API로** 연결(컴포넌트 재사용).
- 다음: ETN 데이터(yahoo 커버리지 확인 후 동일 패턴) · 미국 기간 수익률 · 펀드(KOFIA 소스).
- **문서 TODO**(다음 갱신): STEP 243~244.

---
> STEP 244 = 리츠 탭 실데이터 + 제네릭 HomePerfRanking. 전제 STEP 243(`9d2f654`).
> 다음 = ETN(HomePerfRanking 재사용) → 미국 기간 수익률 → 펀드(KOFIA).
