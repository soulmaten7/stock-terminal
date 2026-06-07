<!-- 2026-06-06 -->
# STEP 176 — #4 랭킹 3탭 (토스식: 실시간 차트 ｜ 지금 뜨는 카테고리 ｜ 국내 투자자 동향)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_176_COMMAND.md 파일 내용대로 실행해줘`

## 목표
랭킹 영역을 토스처럼 **3탭**으로. 전부 **실데이터**(placeholder X):
- **실시간 차트** = 기존 `MarketClient`(랭킹) 그대로
- **지금 뜨는 카테고리** = 업종별 등락 (KIS `FHPUP02140000`, 신규 라우트) — 코스피 38개 업종 등락률 정렬
- **국내 투자자 동향** = 외국인·기관 순매수 상위 (기존 `/api/kis/investor-rank` 재사용). ⚠️ 개인은 KIS에 종목별 랭킹이 없어 **외국인/기관 2개만**(정직)

## 전제 상태
- HEAD: `13067c6`(STEP 174) + STEP 175(상세 패널) 적용됨
- 변경: 신규 `app/api/kis/sector-rank/route.ts` · `components/home-v6/SectorRanking.tsx` · `components/home-v6/InvestorTrend.tsx` · `components/home-v6/HomeRankingTabs.tsx` · `components/market/MarketClient.tsx`(embedded h2 제거) · `components/home-v6/HomeClientV6.tsx`(MarketClient→HomeRankingTabs)

---

## 작업 1/6 — 신규 `app/api/kis/sector-rank/route.ts`

```ts
import { NextResponse } from "next/server";
import { fetchKisApi } from "@/lib/kis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 업종별 등락 (KIS FHPUP02140000) — '지금 뜨는 카테고리'. 코스피 업종 38개.
function num(s: string | undefined): number {
  return Number(String(s ?? "").replace(/,/g, "")) || 0;
}

export async function GET() {
  try {
    const data = await fetchKisApi({
      endpoint: "/uapi/domestic-stock/v1/quotations/inquire-index-category-price",
      trId: "FHPUP02140000",
      params: {
        FID_COND_MRKT_DIV_CODE: "U",
        FID_INPUT_ISCD: "0001",
        FID_COND_SCR_DIV_CODE: "20214",
        FID_MRKT_CLS_CODE: "K",
        FID_BLNG_CLS_CODE: "0",
      },
      cacheTtlMs: 60_000,
    });
    const rows = (data.output2 ?? []) as Record<string, string>[];
    const sectors = rows
      .map((r) => ({
        code: String(r.bstp_cls_code ?? ""),
        name: String(r.hts_kor_isnm ?? "").trim(),
        index: num(r.bstp_nmix_prpr),
        changePercent: num(r.bstp_nmix_prdy_ctrt),
        tradeAmount: num(r.acml_tr_pbmn),
      }))
      .filter((s) => s.name && s.index > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
    return NextResponse.json({ sectors });
  } catch (e) {
    return NextResponse.json({ sectors: [], error: e instanceof Error ? e.message : String(e) });
  }
}
```

---

## 작업 2/6 — 신규 `components/home-v6/SectorRanking.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Sector = { code: string; name: string; index: number; changePercent: number; tradeAmount: number };

export default function SectorRanking() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await (await fetch("/api/kis/sector-rank")).json();
        if (!cancelled) setSectors(j.sectors ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {loading ? (
        <LoadingState className="py-10" />
      ) : sectors.length === 0 ? (
        <EmptyState title="업종 데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-unjong-border text-xs text-unjong-muted">
              <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
              <th className="px-4 py-2.5 text-left font-medium">업종</th>
              <th className="px-4 py-2.5 text-right font-medium">지수</th>
              <th className="px-4 py-2.5 text-right font-medium">등락률</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s, i) => {
              const up = s.changePercent >= 0;
              return (
                <tr key={s.code} className="border-b border-unjong-border last:border-0 hover:bg-unjong-background">
                  <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-unjong-primary">{s.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{s.index.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${up ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                    {up ? "+" : ""}{s.changePercent.toFixed(2)}%
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

---

## 작업 3/6 — 신규 `components/home-v6/InvestorTrend.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState } from "@/components/ui/State";

type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;
  institutionBuy: number;
};

function Col({ title, items, valueKey }: { title: string; items: Item[]; valueKey: "foreignBuy" | "institutionBuy" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="border-b border-unjong-border bg-unjong-background px-4 py-3">
        <span className="text-sm font-bold text-unjong-primary">
          {title} <span className="text-xs font-normal text-unjong-muted">순매수 상위 (억)</span>
        </span>
      </div>
      <ul className="divide-y divide-unjong-border">
        {items.slice(0, 10).map((it, i) => {
          const v = it[valueKey];
          return (
            <li key={it.symbol}>
              <Link href={`/stock/${it.symbol}`} className="flex items-center gap-2.5 px-4 py-2 hover:bg-unjong-background">
                <span className="w-5 text-xs tabular-nums text-unjong-muted">{i + 1}</span>
                <StockLogo code={it.symbol} name={it.name} size={24} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-unjong-primary">{it.name}</span>
                <span className={`text-sm font-semibold tabular-nums ${v >= 0 ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                  {v >= 0 ? "+" : ""}{v.toLocaleString()}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function InvestorTrend() {
  const [data, setData] = useState<{ foreignTop: Item[]; institutionTop: Item[] }>({ foreignTop: [], institutionTop: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await (await fetch("/api/kis/investor-rank?market=all&sort=buy")).json();
        if (!cancelled) setData({ foreignTop: j.foreignTop ?? [], institutionTop: j.institutionTop ?? [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState className="py-10" />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Col title="외국인" items={data.foreignTop} valueKey="foreignBuy" />
      <Col title="기관" items={data.institutionTop} valueKey="institutionBuy" />
    </div>
  );
}
```

---

## 작업 4/6 — 신규 `components/home-v6/HomeRankingTabs.tsx`

```tsx
"use client";

import { useState } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import SectorRanking from "./SectorRanking";
import InvestorTrend from "./InvestorTrend";

const TABS = [
  { key: "chart", label: "실시간 차트" },
  { key: "category", label: "지금 뜨는 카테고리" },
  { key: "investor", label: "국내 투자자 동향" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function HomeRankingTabs({ onHover }: { onHover?: (s: HoverStock) => void }) {
  const [tab, setTab] = useState<TabKey>("chart");

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
        {TABS.map((t) => (
          <button
            key={t.key}
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
        ))}
      </div>

      {tab === "chart" && <MarketClient embedded onHover={onHover} />}
      {tab === "category" && <SectorRanking />}
      {tab === "investor" && <InvestorTrend />}
    </div>
  );
}
```

---

## 작업 5/6 — `components/market/MarketClient.tsx` (embedded 헤딩 제거 — 탭바가 라벨 가짐)

**찾기:**
```tsx
      {embedded ? (
        <h2 className="text-lg font-bold text-unjong-primary mb-3">📈 실시간 차트</h2>
      ) : (
        <header className="mb-4">
          <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
          <p className="mt-1 text-sm text-unjong-muted">실시간 랭킹 — 종목 클릭 시 상세로. (시총·52주 필터·히트맵은 순차 확장)</p>
        </header>
      )}
```
**바꾸기:**
```tsx
      {!embedded && (
        <header className="mb-4">
          <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
          <p className="mt-1 text-sm text-unjong-muted">실시간 랭킹 — 종목 클릭 시 상세로. (시총·52주 필터·히트맵은 순차 확장)</p>
        </header>
      )}
```

---

## 작업 6/6 — `components/home-v6/HomeClientV6.tsx` (MarketClient → HomeRankingTabs, 2곳)

### ① import
**찾기:**
```tsx
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
```
**바꾸기:**
```tsx
import { type HoverStock } from "@/components/market/MarketClient";
import HomeRankingTabs from "./HomeRankingTabs";
```

### ② 렌더
**찾기:**
```tsx
              <MarketClient embedded onHover={setHovered} />
```
**바꾸기:**
```tsx
              <HomeRankingTabs onHover={setHovered} />
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/api/kis/sector-rank/route.ts components/home-v6/SectorRanking.tsx components/home-v6/InvestorTrend.tsx components/home-v6/HomeRankingTabs.tsx components/market/MarketClient.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 랭킹 3탭(토스식) — 실시간 차트 | 지금 뜨는 카테고리(업종 FHPUP02140000) | 국내 투자자 동향(외국인·기관 investor-rank) (STEP 176)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈 랭킹 위에 **3탭** [실시간 차트 ｜ 지금 뜨는 카테고리 ｜ 국내 투자자 동향], 클릭 시 전환되는지
- [ ] **지금 뜨는 카테고리** = 업종 등락 정렬(전기·전자, 유통 등 실데이터). `curl -s localhost:3333/api/kis/sector-rank | head -c 300` 으로 확인 가능
- [ ] **국내 투자자 동향** = 외국인/기관 순매수 상위 2열(종목+억). (개인 없음 = 정상)
- [ ] 실시간 차트 탭은 기존 랭킹+hover 상세 그대로
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 업종(카테고리)은 코스피 38개(KIS). 코스닥은 ETF/인덱스 노이즈라 v1 제외 — 추후 필터링 추가.
- 개인 순매수 상위는 KIS에 없음 → 외국인/기관만(정직). 개인까지 원하면 KRX 별도 조사.
- 탭 4개(market/sector-rank/investor-rank)는 KIS rate-limit 캐시(15s~60s) 안에서 처리.
- 상세 패널(hover)은 실시간 차트 탭과 연동(다른 탭은 마지막 hover 유지).

---
> STEP 176 = 랭킹 3탭(전부 실데이터). 전제 `13067c6`+175. 다음: 지수 영역 토스 레이아웃(featured+주요일정) · 랭킹 거래비율 컬럼. 문서 묶어 갱신.
