<!-- 2026-06-03 -->
# STEP 139 — 종목 페이지 네이버급 디테일 (시세 + 수급 + 기업실적 한 번에)

## 🟢 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
호출법: `@docs/STEP_139_COMMAND.md 파일 내용대로 실행해줘`

---

## 🎯 목표

종목 페이지(`/stock/[code]`)를 네이버증권 종목 페이지 수준의 디테일로 채운다. **핵심: 신규 데이터 소스·마이그레이션 0 — 이미 있는 백엔드 API를 화면에 연결**한다. (분석 근거: `docs/NAVER_STOCK_PAGE_ANALYSIS.md`)

이미 있으나 **미연결**인 자산:
- `/api/kis/orderbook`(호가 10단) · `/api/kis/execution`(체결) · `/api/kis/investor`(투자자별 매매동향) · `/api/kis/sector`(업종 등락률)
- `/api/stocks/earnings`(DART 5년 연간+분기 재무 — `lib/dart-financial.ts` 로 계정과목 매핑까지 완성됨)
- `/api/kis/price` 가 이미 반환하나 패널 미표시: `tradeAmount`(거래대금)·`dividendYield`(배당수익률)

빈 **"인사이트" 탭(현재 placeholder)** 이 이 디테일을 담을 자리다.

---

## 📌 전제 상태

- **이전 HEAD**: `e92d49d` (STEP 138 — 홈 신뢰 축 재배치 완료). *시작 전 `git log --oneline -1` 로 확인.*
- **마이그레이션 없음** · **DB 변경 없음** · 순수 프론트엔드 연결.
- 등락색 규칙: 운종 토스식 유지 — **상승 `#1AC267` / 하락 `#F04452`** (네이버 빨/파 따라가지 말 것).
- 데이터: KIS rate limit 존재 → 시세성(호가·체결) 폴링 간격 ≥ 10초, 재무·수급은 1회 로드(+수동 새로고침).

### 확정된 API 응답 모양 (그대로 사용)
```
GET /api/kis/orderbook?symbol=  → { asks:[{price,volume}×10], bids:[{price,volume}×10], totalAskVolume, totalBidVolume }
GET /api/kis/execution?symbol=  → { symbol, executions:[{time,price,change,changeSign,volume,totalVolume}×30] }
GET /api/kis/investor?symbol=   → { symbol, investors:[{date,foreignBuy,institutionBuy,individualBuy,foreignAmount,institutionAmount}×10] }
GET /api/kis/sector             → { items:[{name,changePct,status:"up"|"down"}] }   // 업종 등락률(종목 비교 아님)
GET /api/stocks/earnings?symbol= → { symbol, quarters:[≤12], annual:[] }
     FinancialStatement = { period, periodType, year, revenue, operatingIncome, netIncome,
                            opMargin, netMargin, totalAssets, totalLiabilities, totalEquity,
                            operatingCF, investingCF, financingCF }   // 금액 단위 = 원(KRW)
     ※ DART_API_KEY 없거나 corp_code 없으면 { quarters:[], annual:[], fallbackReason } 반환 — UI 에서 안내 표시
```
> ⚠️ KIS 호가/체결/투자자는 **한국 6자리 종목만**. 미국 티커는 해당 섹션 숨김.

---

## 🔢 작업 순서

### STEP 1 — 공용 포맷 헬퍼

`lib/format.ts` 없으면 생성, 있으면 함수만 추가:
```ts
// 원 단위 큰 금액 → "1.23조" / "4,567억" / "12억"
export function formatKRW(won: number | null): string {
  if (won === null || isNaN(won)) return "—";
  const sign = won < 0 ? "-" : "";
  const v = Math.abs(won);
  if (v >= 1e12) return `${sign}${(v / 1e12).toFixed(2)}조`;
  if (v >= 1e8)  return `${sign}${Math.round(v / 1e8).toLocaleString()}억`;
  return `${sign}${v.toLocaleString()}원`;
}
export function formatPct(n: number | null, digits = 1): string {
  return n === null || isNaN(n) ? "—" : `${n.toFixed(digits)}%`;
}
```

---

### STEP 2 — `StockInfoPanel.tsx` 시세 메타 보강

`StockData` 타입 + `setData(...)` 에 `tradeAmount`·`dividendYield` 추가(한국 KIS 응답에 이미 존재; 미국은 0 가드). 시세 표에 **거래대금 / 배당수익률** 행 추가.
```ts
// 타입에 추가
tradeAmount: number;
dividendYield: number;
// 한국 setData 에 추가
tradeAmount: json.tradeAmount ?? 0,
dividendYield: json.dividendYield ?? 0,
// 미국 setData 에 추가
tradeAmount: 0,
dividendYield: json.dividendYield ?? 0,
```
표 렌더에 두 행 추가(기존 거래량·PER·PBR 옆/아래):
```tsx
{data.tradeAmount > 0 && <Row label="거래대금" value={formatKRW(data.tradeAmount)} />}
{data.dividendYield > 0 && <Row label="배당수익률" value={formatPct(data.dividendYield, 2)} />}
```
> 기존 패널의 시세 행 렌더 패턴(label/value)에 맞춰 추가. `formatKRW`·`formatPct` import.

---

### STEP 3 — 차트·시세 탭에 호가 + 체결 연결

**(a) `components/stock/StockOrderbookCard.tsx` 신규** (한국만):
```tsx
"use client";
import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Level = { price: number; volume: number };
type Book = { asks: Level[]; bids: Level[]; totalAskVolume: number; totalBidVolume: number };

export default function StockOrderbookCard({ symbol }: { symbol: string }) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!/^\d{6}$/.test(symbol)) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/orderbook?symbol=${symbol}`);
        const j = await r.json();
        if (!cancelled && !j.error) setBook(j);
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    const t = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, [symbol]);

  if (!/^\d{6}$/.test(symbol)) return null;
  const maxVol = book ? Math.max(1, ...book.asks.map(a => a.volume), ...book.bids.map(b => b.volume)) : 1;

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <h3 className="text-base font-bold text-unjong-primary mb-3">호가 10단</h3>
      {loading ? <LoadingState /> : !book ? <EmptyState title="호가 정보 없음" /> : (
        <div className="space-y-0.5 text-sm">
          {book.asks.map((a, i) => (
            <div key={`a${i}`} className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="relative h-6 rounded bg-[#F04452]/5">
                <div className="absolute right-0 top-0 h-full rounded bg-[#F04452]/15" style={{ width: `${(a.volume / maxVol) * 100}%` }} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-unjong-muted">{a.volume.toLocaleString()}</span>
              </div>
              <span className="w-20 text-right font-mono text-[#F04452]">{a.price.toLocaleString()}</span>
            </div>
          ))}
          {book.bids.map((b, i) => (
            <div key={`b${i}`} className="grid grid-cols-[auto_1fr] items-center gap-2">
              <span className="w-20 text-left font-mono text-[#1AC267]">{b.price.toLocaleString()}</span>
              <div className="relative h-6 rounded bg-[#1AC267]/5">
                <div className="absolute left-0 top-0 h-full rounded bg-[#1AC267]/15" style={{ width: `${(b.volume / maxVol) * 100}%` }} />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-unjong-muted">{b.volume.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

**(b) `components/stock/StockExecutionCard.tsx` 신규** (한국만):
```tsx
"use client";
import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Exec = { time: string; price: number; change: number; changeSign: string; volume: number };

export default function StockExecutionCard({ symbol }: { symbol: string }) {
  const [items, setItems] = useState<Exec[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!/^\d{6}$/.test(symbol)) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/execution?symbol=${symbol}`);
        const j = await r.json();
        if (!cancelled && j.executions) setItems(j.executions.slice(0, 15));
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    const t = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, [symbol]);

  if (!/^\d{6}$/.test(symbol)) return null;
  const fmtTime = (s: string) => (s?.length === 6 ? `${s.slice(0,2)}:${s.slice(2,4)}:${s.slice(4,6)}` : s);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <h3 className="text-base font-bold text-unjong-primary mb-3">실시간 체결</h3>
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="체결 정보 없음" /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-unjong-muted border-b border-unjong-border">
            <th className="text-left py-1">체결시각</th><th className="text-right">체결가</th><th className="text-right">체결량</th>
          </tr></thead>
          <tbody>
            {items.map((e, i) => {
              const up = e.changeSign === "1" || e.changeSign === "2";
              return (
                <tr key={i} className="border-b border-unjong-border/50">
                  <td className="py-1 text-unjong-muted font-mono text-xs">{fmtTime(e.time)}</td>
                  <td className={`text-right font-mono ${up ? "text-[#F04452]" : "text-[#1AC267]"}`}>{e.price.toLocaleString()}</td>
                  <td className="text-right text-unjong-muted">{e.volume.toLocaleString()}</td>
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

**(c) `StockTabs.tsx` 차트 탭 분기 수정** — 차트 아래에 호가·체결 추가:
```tsx
import StockOrderbookCard from "./StockOrderbookCard";
import StockExecutionCard from "./StockExecutionCard";
// ...
{active === "chart" && (
  <div className="space-y-5">
    <StockChartSection symbol={symbol} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <StockOrderbookCard symbol={symbol} />
      <StockExecutionCard symbol={symbol} />
    </div>
  </div>
)}
```

---

### STEP 4 — "인사이트" 탭 전면 구현 (placeholder 교체)

`components/stock/StockInsightsTab.tsx` 를 아래로 교체. **기업실적분석 표 + ROE·부채비율 파생 + 투자자별 매매동향 + 동종업종 등락률**.

```tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { formatKRW, formatPct } from "@/lib/format";

type Fin = {
  period: string; periodType: string; year: number;
  revenue: number | null; operatingIncome: number | null; netIncome: number | null;
  opMargin: number | null; netMargin: number | null;
  totalLiabilities: number | null; totalEquity: number | null;
};
type Investor = { date: string; foreignBuy: number; institutionBuy: number; individualBuy: number };
type Sector = { name: string; changePct: number; status: "up" | "down" };

const roe = (f: Fin) => (f.netIncome !== null && f.totalEquity ? (f.netIncome / f.totalEquity) * 100 : null);
const debtRatio = (f: Fin) => (f.totalLiabilities !== null && f.totalEquity ? (f.totalLiabilities / f.totalEquity) * 100 : null);

export default function StockInsightsTab({ symbol }: { symbol: string }) {
  const isKr = /^\d{6}$/.test(symbol);
  const [annual, setAnnual] = useState<Fin[]>([]);
  const [finNote, setFinNote] = useState<string | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [earn, inv, sec] = await Promise.all([
          fetch(`/api/stocks/earnings?symbol=${symbol}`).then(r => r.json()).catch(() => null),
          isKr ? fetch(`/api/kis/investor?symbol=${symbol}`).then(r => r.json()).catch(() => null) : null,
          isKr ? fetch(`/api/kis/sector`).then(r => r.json()).catch(() => null) : null,
        ]);
        if (cancelled) return;
        if (earn) {
          setAnnual((earn.annual || []).slice(-4));
          if ((!earn.annual || earn.annual.length === 0) && earn.fallbackReason) setFinNote(earn.fallbackReason);
        }
        if (inv?.investors) setInvestors(inv.investors.slice(0, 7));
        if (sec?.items) setSectors(sec.items);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [symbol, isKr]);

  if (loading) return <LoadingState title="인사이트 로딩 중..." />;

  return (
    <div className="space-y-6">
      {/* 1) 기업실적분석 */}
      <section>
        <h3 className="text-base font-bold text-unjong-primary mb-3">기업실적분석 <span className="text-xs text-unjong-muted font-normal">연간 · 출처 DART</span></h3>
        {annual.length === 0 ? (
          <EmptyState icon="📊" title="재무 데이터 없음" description={finNote ?? "DART 정기공시 미확인 종목"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-unjong-muted border-b border-unjong-border">
                  <th className="text-left py-2">항목</th>
                  {annual.map(f => <th key={f.period} className="text-right px-2">{f.year}</th>)}
                </tr>
              </thead>
              <tbody>
                {([
                  ["매출액", (f: Fin) => formatKRW(f.revenue)],
                  ["영업이익", (f: Fin) => formatKRW(f.operatingIncome)],
                  ["당기순이익", (f: Fin) => formatKRW(f.netIncome)],
                  ["영업이익률", (f: Fin) => formatPct(f.opMargin)],
                  ["순이익률", (f: Fin) => formatPct(f.netMargin)],
                  ["ROE", (f: Fin) => formatPct(roe(f))],
                  ["부채비율", (f: Fin) => formatPct(debtRatio(f))],
                ] as const).map(([label, fn]) => (
                  <tr key={label} className="border-b border-unjong-border/50">
                    <td className="py-2 text-unjong-muted">{label}</td>
                    {annual.map(f => <td key={f.period} className="text-right px-2 font-mono text-unjong-primary">{fn(f)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-unjong-muted mt-2">더 깊은 재무 분석은 <a href={`https://comp.fnguide.com/SVO2/ASP/SVD_Main.asp?gicode=A${symbol}`} target="_blank" rel="noopener noreferrer" className="text-unjong-accent hover:underline">FnGuide ↗</a></p>
          </div>
        )}
      </section>

      {/* 2) 투자자별 매매동향 (한국) */}
      {isKr && (
        <section>
          <h3 className="text-base font-bold text-unjong-primary mb-3">투자자별 매매동향 <span className="text-xs text-unjong-muted font-normal">일별 순매수(주) · 출처 KIS</span></h3>
          {investors.length === 0 ? <EmptyState title="수급 데이터 없음" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-unjong-muted border-b border-unjong-border">
                <th className="text-left py-1">일자</th><th className="text-right">외국인</th><th className="text-right">기관</th><th className="text-right">개인</th>
              </tr></thead>
              <tbody>
                {investors.map((v, i) => {
                  const cell = (n: number) => <td className={`text-right font-mono ${n > 0 ? "text-[#F04452]" : n < 0 ? "text-[#1AC267]" : "text-unjong-muted"}`}>{n > 0 ? "+" : ""}{n.toLocaleString()}</td>;
                  const d = v.date?.length === 8 ? `${v.date.slice(4,6)}.${v.date.slice(6,8)}` : v.date;
                  return <tr key={i} className="border-b border-unjong-border/50"><td className="py-1 text-unjong-muted font-mono text-xs">{d}</td>{cell(v.foreignBuy)}{cell(v.institutionBuy)}{cell(v.individualBuy)}</tr>;
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* 3) 동종업종 등락률 (한국) */}
      {isKr && sectors.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-unjong-primary mb-3">업종 등락률 <span className="text-xs text-unjong-muted font-normal">출처 KIS</span></h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {sectors.map(s => (
              <div key={s.name} className="flex items-center justify-between rounded-lg bg-unjong-background px-3 py-2">
                <span className="text-sm text-unjong-primary truncate">{s.name}</span>
                <span className={`text-sm font-semibold ${s.status === "up" ? "text-[#F04452]" : "text-[#1AC267]"}`}>{s.changePct > 0 ? "+" : ""}{s.changePct}%</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

> ROE·부채비율은 earnings 의 순이익·자본·부채로 **파생 계산**(별도 API 불필요). EPS·BPS·목표주가 컨센서스는 무료 소스 부재 → **FnGuide 외부 링크**로 대체(V6 ④ 경계).
> 등락색: 한국 수급/체결/업종은 관습상 빨강=상승이 직관적이라 **상승 빨강(#F04452)/하락 초록(#1AC267)** 으로 표기(평가·홈의 토스식과 반대 방향임에 주의 — 시세성 데이터 한정).

---

### STEP 5 — 빌드 + 커밋

```bash
cd ~/stock-terminal && npm run build
```
✓ exit 0 확인. `console.log` 금지.

```bash
cd ~/stock-terminal && git add lib/format.ts \
  components/stock/StockInfoPanel.tsx components/stock/StockTabs.tsx \
  components/stock/StockInsightsTab.tsx \
  components/stock/StockOrderbookCard.tsx components/stock/StockExecutionCard.tsx \
  && git commit -m "feat(v6): 종목 페이지 네이버급 디테일 — 호가·체결·투자자수급·기업실적표(DART) 연결 + 거래대금·배당 노출 (STEP 139)" \
  && git push
```

---

### STEP 6 — 문서 갱신

오늘(2026-06-03):
- `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md` 헤더 + STEP 139 블록
- `docs/NEXT_SESSION_PLAYBOOK.md` (HEAD 갱신 · 종목 페이지 탭 구성 갱신 · 다음 후보)
- `docs/SESSION_KICKOFF.md` (현재 커밋)

---

## ✅ 완료 기준 (DoD)

1. 시세 패널에 거래대금·배당수익률 노출(한국).
2. 차트·시세 탭: 차트 + **호가 10단 + 실시간 체결**(한국).
3. 인사이트 탭: **기업실적분석 표(매출·영업이익·순이익·영업이익률·순이익률·ROE·부채비율) + 투자자별 매매동향 + 업종 등락률**.
4. 재무 fallback(DART 키/코드 없음) 시 안내 + FnGuide 외부 링크 노출.
5. 미국 티커는 KIS 섹션(호가·체결·수급·업종) 숨김, 재무표는 시도(없으면 안내).
6. `npm run build` ✓ exit 0 + push.
7. 6개 문서 갱신.

## ⚠️ 주의

- 마이그레이션·DB 변경 ❌ — 전부 기존 API 연결.
- KIS 호가/체결 폴링 ≥ 10초 (rate limit).
- 시세성 데이터 등락색(빨강=상승)과 평가·홈 토스식(초록=상승)이 반대 — **의도된 구분**이니 통일하지 말 것.
- `lib/dart-financial.ts`·`/api/stocks/earnings` 는 **수정 금지**(이미 동작) — 연결만.

---

> **STEP 139 = 종목 페이지를 네이버급 디테일로.** 빈 인사이트 탭이 채워지고, 있는 API가 전부 전시된다. 다음 후보: 종목 토론에 추천/비추천 도입(평가와 통일) · 공시(DART) 탭 · 외국인보유율·상장주식수 메타 추가.
