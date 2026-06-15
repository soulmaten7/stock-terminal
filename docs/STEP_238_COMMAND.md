<!-- 2026-06-14 -->
# STEP 238 — '상품 리스트' 라벨 제거 + ETF/펀드 테이블도 단일 '[기간] 대비' 칼럼·기간칩으로 통일

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_238_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정)
1. 홈 탭의 **'상품 리스트' 라벨 제거** (탭처럼 보여 헷갈림 → 구분선이 이미 그룹 갈라줌).
2. **ETF/펀드(`HomeEtfRanking`)도 주식과 동일한 형식**으로:
   - 기간칩 = **1일전 · 1주일전 · 1개월전 · 3개월전 · 6개월전 · 1년전**
   - 단일 **'[기간] 대비'** 칼럼(칩 따라 제목+값 변경) + 그 기준 정렬, 기본 **1일전**.
   - ETF 데이터: **1일전 = 거래대금 상위(KIS) / 1·3·6·12개월 = 실제 수익률(yahoo)** → ETF는 기간 칸이 실제로 채워짐. **1주일전만 소스 없어 "—"**.
   - 펀드 = 기존 '준비 중' 그대로(`fixedAsset="fund"`).

## 전제 상태
- 현재 HEAD: STEP 237 상태 (홈에 '상품 리스트' 라벨 있음, 주식 단일칼럼 적용됨)
- 변경 **2파일** (둘 다 **전체 교체**):
  - `components/home-v6/HomeRankingTabs.tsx` (라벨 제거 = STEP 235 상태로 복귀)
  - `components/home-v6/HomeEtfRanking.tsx` (단일칼럼·기간칩으로 통일)
- DB·API 변경 0 (기존 `/api/kis/volume-rank`, `/api/yahoo/etf-performance` 그대로)

---

## 작업 1/2 — `components/home-v6/HomeRankingTabs.tsx` (파일 전체 교체 — '상품 리스트' 라벨 제거)

```tsx
"use client";

import { useState, Fragment, type ReactNode } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import HomeEtfRanking from "./HomeEtfRanking";
import HomeRoomRanking from "./HomeRoomRanking";

const TABS = [
  { key: "stock", label: "주식" },
  { key: "etf", label: "ETF" },
  { key: "etn", label: "ETN" },
  { key: "fund", label: "펀드" },
  { key: "reit", label: "리츠" },
  { key: "room", label: "리딩방 리스트" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function ComingSoon({ label }: { label: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <span className="mb-2 text-2xl">🗂️</span>
        <p className="text-sm font-medium text-unjong-primary">{label} 성적표는 준비 중이에요</p>
        <p className="mt-1 text-xs text-unjong-muted">데이터 소스 연동 후 주식·ETF와 같은 기간 수익률 방식으로 제공해요</p>
      </div>
    </section>
  );
}

export default function HomeRankingTabs({ onHover, detailSlot }: { onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const [tab, setTab] = useState<TabKey>("stock");

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
        {TABS.map((t) => (
          <Fragment key={t.key}>
            {/* 리딩방 리스트 앞 구분선 — '상품'과 '검증 디렉토리' 경계 */}
            {t.key === "room" && <span className="mx-1 h-4 w-px bg-unjong-border" aria-hidden />}
            <button
              type="button"
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? "-mb-px border-b-2 border-unjong-primary px-3 py-2 text-sm font-bold text-unjong-primary"
                  : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary"
              }
            >
              {t.label}
            </button>
          </Fragment>
        ))}

        {/* 오른쪽 자투리 공간: 시장 시간 안내 (넓은 화면만 — 좁으면 탭 우선) */}
        <div className="ml-auto hidden items-center gap-4 pb-2 pr-1 text-xs text-unjong-muted xl:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
            국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
            해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
          </span>
        </div>
      </div>

      {tab === "stock" && <MarketClient embedded onHover={onHover} detailSlot={detailSlot} />}
      {tab === "etf" && <HomeEtfRanking fixedAsset="etf" />}
      {tab === "etn" && <ComingSoon label="ETN" />}
      {tab === "fund" && <HomeEtfRanking fixedAsset="fund" />}
      {tab === "reit" && <ComingSoon label="리츠" />}
      {tab === "room" && <HomeRoomRanking platforms={["telegram", "kakao"]} kind="room" />}
    </div>
  );
}
```

> STEP 237에서 넣었던 `상품 리스트` 라벨·구분선 두 줄만 빠진 상태(= STEP 235 구조).

---

## 작업 2/2 — `components/home-v6/HomeEtfRanking.tsx` (파일 전체 교체 — 단일칼럼·기간칩 통일)

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
  tradeAmount?: number;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
};

const ETF_RE = /^(KODEX|TIGER|KBSTAR|RISE|ARIRANG|PLUS|ACE|KINDEX|SOL|HANARO|KOSEF|TIMEFOLIO|WOORI|KCGI|BNK|파워|TREX|FOCUS|히어로즈|네비게이터|마이티|WON|KIWOOM)/i;

// 기간칩 (주식과 동일). 1주일은 ETF 소스에 없어 "—".
type PeriodKey = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일전" },
  { key: "1w", label: "1주일전" },
  { key: "1m", label: "1개월전" },
  { key: "3m", label: "3개월전" },
  { key: "6m", label: "6개월전" },
  { key: "1y", label: "1년전" },
];
const PERF_FIELD: Partial<Record<PeriodKey, "r1m" | "r3m" | "r6m" | "r1y">> = {
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
  return { symbol: r.symbol, name: r.name, priceText: r.price.toLocaleString(), changePercent: r.changePercent, volume: 0, tradeAmount: r.tradeAmount };
}

export default function HomeEtfRanking({ fixedAsset }: { fixedAsset?: "etf" | "fund" } = {}) {
  const router = useRouter();
  const asset = fixedAsset ?? "etf";
  const [period, setPeriod] = useState<PeriodKey>("1d"); // 기본=1일전(주식과 동일)
  const [popRows, setPopRows] = useState<Row[]>([]);
  const [perfRows, setPerfRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  useEffect(() => {
    if (asset !== "etf") { setLoading(false); return; }
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
  }, [asset]);

  useEffect(() => { setHovered(null); }, [period]);

  const periodLabel = PERIODS.find((p) => p.key === period)!.label;

  // 1일전 = 거래대금 유니버스(popRows) / 1·3·6·12개월 = 성과(perfRows) / 1주일 = 소스 없음("—")
  const rows = useMemo(() => {
    if (period === "1d") {
      return [...popRows].sort((a, b) => b.changePercent - a.changePercent);
    }
    const f = PERF_FIELD[period];
    if (!f) return perfRows.slice(0, 15); // 1주일
    return [...perfRows]
      .filter((r) => r[f] != null)
      .sort((a, b) => (b[f] as number) - (a[f] as number))
      .slice(0, 15);
  }, [period, popRows, perfRows]);

  const rowVal = (r: Row): number | null | undefined => {
    if (period === "1d") return r.changePercent;
    const f = PERF_FIELD[period];
    return f ? r[f] : undefined;
  };

  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {/* 컨트롤: 기간칩 */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-unjong-border px-4 py-3">
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-unjong-muted">
          {asset === "etf" ? (period === "1d" ? "거래대금 상위 · KRX (실시간 아님)" : "기간 수익률 · 최근 시세 기준") : ""}
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
        <div className="flex items-start gap-4 p-2">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
                  <th className="px-4 py-2.5 text-left font-medium">종목명</th>
                  <th className="px-4 py-2.5 text-right font-medium">현재가</th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">{periodLabel} 대비</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const v = rowVal(r);
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
          <HomeStockDetail stock={previewStock} />
        </div>
      )}
    </section>
  );
}
```

> 핵심: ETF도 주식과 같은 **기간칩 + 단일 '[기간] 대비' 칼럼**. 데이터는 기존 그대로 재사용(1일=KIS 거래대금, 1·3·6·12개월=yahoo 성과). 기존 `SORTS`·거래대금 칼럼·ETF/펀드 토글 제거(토글은 STEP 235에서 이미 fixedAsset로 대체). HomeStockDetail 프리뷰 유지.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeRankingTabs.tsx components/home-v6/HomeEtfRanking.tsx && git commit -m "feat(v7): 상품 리스트 라벨 제거 + ETF/펀드 단일 등락칼럼·기간칩 통일 (STEP 238)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈 탭 앞 **'상품 리스트' 라벨 사라짐** (탭 = 주식·ETF·ETN·펀드·리츠 ｜ 리딩방 리스트)
- [ ] **ETF 탭** = 기간칩(1일전~1년전) + 단일 '[기간] 대비' 칼럼, 거래대금 칼럼·ETF/펀드 토글 사라짐
- [ ] ETF에서 **1개월전~1년전 누르면 실제 수익률** 표시(yahoo), **1주일전은 "—"**, 기본 1일전
- [ ] **펀드 탭** = '준비 중' 그대로
- [ ] 종목 클릭·hover 프리뷰 그대로
- ⚠️ 하드 새로고침(Cmd+Shift+R).

## 주의·예상 이슈
- ETF는 기간 바꾸면 데이터 소스가 바뀜(1일=KIS / 1·3·6·12개월=yahoo)이라 **목록 구성이 기간별로 다를 수 있음**(기존 동작과 동일). 1주일전은 소스 없어 "—".
- 주식은 아직 1주~1년·시총이 "—"(데이터 미연동) — 그 실제 연동은 별도 STEP(데이터 레이어, 큰 작업).
- **문서 TODO**(다음 갱신): STEP 228~238.

---
> STEP 238 = 상품 리스트 라벨 제거 + ETF/펀드 단일칼럼·기간칩 통일. 전제 STEP 237.
> 다음 = (택1) 주식 1주~1년·시총 실제 데이터 연동(yahoo kr-performance 등) / ETN·리츠·펀드 데이터 / 문서 일괄 갱신(228~238).
