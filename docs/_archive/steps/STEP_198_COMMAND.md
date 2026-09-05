<!-- 2026-06-07 -->
# STEP 198 — 투자상품 탭 ② 수익순(1·3·6·12개월) + ETF/펀드 토글

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_198_COMMAND.md 파일 내용대로 실행해줘`

## 목표
투자상품 탭을 토스 상품랭킹처럼: **[ETF ｜ 펀드] 토글 + [인기순 ｜ 1개월 ｜ 3개월 ｜ 6개월 ｜ 1년] 정렬칩**.
- **ETF·인기순**: 기존 거래대금(STEP 197) 그대로.
- **ETF·수익순**: 신규 `/api/yahoo/etf-performance` — 대표 ETF 과거 시세(Yahoo)로 1·3·6·12개월 수익률 계산, 선택 기간 내림차순.
- **펀드**: 데이터 소스(금투협 등) 별도라 **"준비 중" 자리만**(가짜 X).
- 표: 순위·종목명(로고)·현재가·1일 등락%·[지표](인기순=거래대금 / 수익순=기간 수익률). 한국식 색.

## 전제 상태
- HEAD: STEP 197 적용된 상태
- 변경: `app/api/yahoo/etf-performance/route.ts`(신규) + `components/home-v6/HomeEtfRanking.tsx`(전면 교체)

---

## 작업 1/2 — 신규 `app/api/yahoo/etf-performance/route.ts` (파일 생성)

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 대표 KR ETF (코드·이름). 과거 시세로 기간 수익률 계산. 코드 틀리면 자동 제외(self-clean).
const UNIVERSE: { sym: string; name: string }[] = [
  { sym: "069500", name: "KODEX 200" },
  { sym: "122630", name: "KODEX 레버리지" },
  { sym: "114800", name: "KODEX 인버스" },
  { sym: "252670", name: "KODEX 200선물인버스2X" },
  { sym: "233740", name: "KODEX 코스닥150레버리지" },
  { sym: "229200", name: "KODEX 코스닥150" },
  { sym: "102110", name: "TIGER 200" },
  { sym: "360750", name: "TIGER 미국S&P500" },
  { sym: "133690", name: "TIGER 미국나스닥100" },
  { sym: "091160", name: "KODEX 반도체" },
  { sym: "091170", name: "KODEX 은행" },
  { sym: "132030", name: "KODEX 골드선물" },
  { sym: "153130", name: "KODEX 단기채권" },
  { sym: "148020", name: "KBSTAR 200" },
  { sym: "278530", name: "KODEX 200TR" },
  { sym: "305720", name: "KODEX 2차전지산업" },
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
        const ch = await yf.chart(`${e.sym}.KS`, { period1, interval: "1d" });
        const closes = ((ch.quotes ?? []) as Array<{ close: number | null }>)
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        const price = closes[closes.length - 1];
        return {
          symbol: e.sym,
          name: e.name,
          price,
          changePercent: ret(closes, 1) ?? 0,
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

---

## 작업 2/2 — `components/home-v6/HomeEtfRanking.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  tradeAmount?: number;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
};

const ETF_RE = /^(KODEX|TIGER|KBSTAR|RISE|ARIRANG|PLUS|ACE|KINDEX|SOL|HANARO|KOSEF|TIMEFOLIO|WOORI|KCGI|BNK|파워|TREX|FOCUS|히어로즈|네비게이터|마이티|WON|KIWOOM)/i;

type SortKey = "pop" | "r1m" | "r3m" | "r6m" | "r1y";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "pop", label: "인기순" },
  { key: "r1m", label: "1개월" },
  { key: "r3m", label: "3개월" },
  { key: "r6m", label: "6개월" },
  { key: "r1y", label: "1년" },
];

function chip(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
  }`;
}
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

export default function HomeEtfRanking() {
  const router = useRouter();
  const [asset, setAsset] = useState<"etf" | "fund">("etf");
  const [sort, setSort] = useState<SortKey>("pop");
  const [popRows, setPopRows] = useState<Row[]>([]);
  const [perfRows, setPerfRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const popP = (async () => {
        try {
          const j = await (await fetch("/api/kis/volume-rank?market=all&sort=amount&limit=100")).json();
          const raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
          return raw
            .map((s) => ({
              symbol: String(s.symbol ?? ""),
              name: String(s.name ?? ""),
              price: Number(s.price ?? 0),
              changePercent: Number(s.changePercent ?? 0),
              tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
            }))
            .filter((r) => r.name && ETF_RE.test(r.name))
            .slice(0, 15) as Row[];
        } catch {
          return [] as Row[];
        }
      })();
      const perfP = (async () => {
        try {
          const j = await (await fetch("/api/yahoo/etf-performance")).json();
          return (j.items ?? []) as Row[];
        } catch {
          return [] as Row[];
        }
      })();
      const [pop, perf] = await Promise.all([popP, perfP]);
      if (!cancelled) {
        setPopRows(pop);
        setPerfRows(perf);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isPop = sort === "pop";
  let rows: Row[] = [];
  if (asset === "etf") {
    if (isPop) {
      rows = popRows;
    } else {
      const k = sort as "r1m" | "r3m" | "r6m" | "r1y";
      rows = [...perfRows].filter((r) => r[k] != null).sort((a, b) => (b[k] as number) - (a[k] as number)).slice(0, 15);
    }
  }
  const metricLabel = isPop ? "거래대금" : SORTS.find((s) => s.key === sort)!.label;

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {/* 컨트롤 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-unjong-border px-4 py-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setAsset("etf")} className={chip(asset === "etf")}>ETF</button>
          <button type="button" onClick={() => setAsset("fund")} className={chip(asset === "fund")}>펀드</button>
        </div>
        <span className="mx-1 h-5 w-px bg-unjong-border" />
        {asset === "etf" &&
          SORTS.map((s) => (
            <button key={s.key} type="button" onClick={() => setSort(s.key)} className={chip(sort === s.key)}>
              {s.label}
            </button>
          ))}
        <span className="ml-auto text-[11px] text-unjong-muted">
          {asset === "etf" ? (isPop ? "거래대금 순 · KRX" : "수익률 · 최근 시세 기준") : ""}
        </span>
      </div>

      {asset === "fund" ? (
        <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
          <span className="mb-2 text-2xl">🗂️</span>
          <p className="text-sm font-medium text-unjong-primary">펀드 랭킹은 준비 중이에요</p>
          <p className="mt-1 text-xs text-unjong-muted">펀드 데이터 소스 연동 후 ETF와 같은 방식으로 제공해요</p>
        </div>
      ) : loading ? (
        <LoadingState className="py-10" />
      ) : rows.length === 0 ? (
        <EmptyState title="ETF 데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-unjong-border text-xs text-unjong-muted">
              <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
              <th className="px-4 py-2.5 text-left font-medium">종목명</th>
              <th className="px-4 py-2.5 text-right font-medium">현재가</th>
              <th className="px-4 py-2.5 text-right font-medium">등락(1일)</th>
              <th className="px-4 py-2.5 text-right font-medium">{metricLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const up = r.changePercent >= 0;
              const metric = isPop ? null : (r[sort as "r1m" | "r3m" | "r6m" | "r1y"] ?? null);
              return (
                <tr
                  key={r.symbol}
                  onClick={() => router.push(`/stock/${r.symbol}`)}
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
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${up ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                    {up ? "+" : ""}{r.changePercent.toFixed(2)}%
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${isPop ? "text-unjong-muted" : pctColor(metric)}`}>
                    {isPop ? fmtAmount(r.tradeAmount) : pct(metric)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
```

> ETF/펀드 토글 + 인기순/기간수익순 칩(라운드스퀘어). 인기순=거래대금(STEP 197), 수익순=신규 perf API(과거 시세 계산). 펀드=준비중. 지표 컬럼이 선택에 따라 거래대금↔기간 수익률로 바뀜.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/etf-performance/route.ts components/home-v6/HomeEtfRanking.tsx && git commit -m "feat(v7): 투자상품 탭 수익순(1·3·6·12개월)+ETF/펀드 토글 — etf-performance API (STEP 198)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 투자상품 탭에 **[ETF｜펀드] 토글 + [인기순·1개월·3개월·6개월·1년] 칩**
- [ ] 인기순 = 거래대금(기존), 기간 클릭 시 **수익률 순**으로 재정렬·해당 기간 수익률 표시(빨강/파랑)
- [ ] 펀드 탭 = "준비 중" 안내
- [ ] 수익순 데이터 확인: `curl -s localhost:3333/api/yahoo/etf-performance | grep -o '"symbol"' | wc -l` → 0 아님(대표 ETF 십수 개)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- perf API는 Yahoo 과거 시세 16개 ETF 병렬 호출 + 30분 캐시. 느리거나 빈값이면 universe 축소/순차 호출로 보정.
- ETF 코드 틀리면 자동 제외 → 목록 적게 나오면 알려주세요(코드 보정/추가).
- 수익률은 영업일 근사(1M=21·3M=63·6M=126·1Y=252 거래일). 장 마감/주말은 전일 기준.
- **문서 TODO**(다음 갱신): STEP 195~198 + 투자상품/리딩방 로드맵 + "광고는 사용자 지시 시에만" 한 줄.
- 다음: ③ ETF 상세에 "어디서 살까" 증권사 링크 → 이후 리딩방 랭킹(FSS).

---
> STEP 198 = 투자상품 ② 수익순+토글. 전제 STEP 197. 다음: ③ 증권사 링크. 문서 묶어 갱신.
