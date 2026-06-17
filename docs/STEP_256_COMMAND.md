<!-- 2026-06-15 -->
# STEP 256 — ETN 탭 연결 (KRX 실데이터 성적표, 1일 시세)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_256_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (ETN 완성)
STEP 255로 `/api/krx/etn`가 ETN 380종목 실데이터를 줌(확인 완료). 이제 **ETN 탭 = '준비 중' → 실제 성적표**.
- ETN은 **1일 시세만** 존재(KRX 일별 = 하루치, yahoo에 ETN 없음 → 기간 수익률 소스 없음). 그래서 주식식 1주~1년 칩 대신 **거래대금순 / 1일 등락순** 정렬 + 1일 성적표.
- 디자인·hover 미리보기·로고·종목클릭(`?name=`)은 주식·리츠 탭과 **동일**.
- 신규 컴포넌트 `HomeEtnRanking` + `HomeRankingTabs`에서 `ComingSoon` → `HomeEtnRanking`(이제 `ComingSoon`은 미사용 → 제거).

## 전제 상태
- 현재 HEAD: STEP 255 적용 후(`02498d1`)
- 변경 **2파일**:
  - `components/home-v6/HomeEtnRanking.tsx` (**신규**)
  - `components/home-v6/HomeRankingTabs.tsx` (import 추가 + ComingSoon 제거 + etn 연결)
- 데이터: `/api/krx/etn` → `{etns:[{symbol,name,price,changePercent,volume,tradeAmount,marketCap}], basDd, count}`

---

## 작업 1/2 — `components/home-v6/HomeEtnRanking.tsx` (신규)

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import HomeStockDetail from "./HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";

type Etn = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  tradeAmount: number;
  marketCap: number;
};

type SortKey = "tradeAmount" | "changePercent";

function pct(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function pctColor(v: number): string {
  return v >= 0 ? "text-[#F04452]" : "text-[#3182F6]";
}
function won(v: number): string {
  if (v >= 1e8) return `${(v / 1e8).toFixed(v >= 1e9 ? 0 : 1)}억`;
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString()}만`;
  return v.toLocaleString();
}
function toHover(r: Etn): HoverStock {
  return { symbol: r.symbol, name: r.name, priceText: r.price.toLocaleString(), changePercent: r.changePercent, volume: r.volume };
}
function chip(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
  }`;
}

export default function HomeEtnRanking() {
  const router = useRouter();
  const [all, setAll] = useState<Etn[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("tradeAmount");
  const [hovered, setHovered] = useState<HoverStock | null>(null);
  const [basDd, setBasDd] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const j = await (await fetch("/api/krx/etn")).json();
        if (!cancelled) {
          setAll((j.etns ?? []) as Etn[]);
          setBasDd(String(j.basDd ?? ""));
        }
      } catch {
        if (!cancelled) setAll([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setHovered(null);
  }, [sort]);

  const rows = useMemo(() => {
    return [...all]
      .sort((a, b) => (sort === "tradeAmount" ? b.tradeAmount - a.tradeAmount : b.changePercent - a.changePercent))
      .slice(0, 20);
  }, [all, sort]);

  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);
  const dateLabel = basDd.length === 8 ? `${basDd.slice(4, 6)}/${basDd.slice(6, 8)}` : "";

  return (
    <div>
      {/* 정렬칩 (주식·ETF 기간칩과 동일 스타일) + 기준 안내 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        <button type="button" onClick={() => setSort("tradeAmount")} className={chip(sort === "tradeAmount")}>
          거래대금순
        </button>
        <button type="button" onClick={() => setSort("changePercent")} className={chip(sort === "changePercent")}>
          1일 등락순
        </button>
        <span className="ml-auto text-[11px] text-unjong-muted">
          ETN 1일 시세{dateLabel ? ` · ${dateLabel} 기준` : ""} · 기간 수익률 미제공
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {loading ? (
            <LoadingState className="py-10" />
          ) : rows.length === 0 ? (
            <EmptyState title="ETN 데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
                    <th className="px-4 py-2.5 text-left font-medium">종목명</th>
                    <th className="px-4 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">1일 대비</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">거래대금</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.symbol}
                      onClick={() => router.push(`/stock/${r.symbol}?name=${encodeURIComponent(r.name)}`)}
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
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${pctColor(r.changePercent)}`}>{pct(r.changePercent)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-unjong-muted">{won(r.tradeAmount)}</td>
                    </tr>
                  ))}
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

> 주식·리츠 탭과 동일한 표·hover 미리보기·로고·`?name=` 라우팅. 차이는 기간칩 대신 **거래대금순/1일 등락순** 정렬 + 거래대금 칼럼.

---

## 작업 2/2 — `components/home-v6/HomeRankingTabs.tsx` (3곳)

**① import 추가 — 찾기:**
```tsx
import HomeRoomRanking from "./HomeRoomRanking";
```
**바꾸기:**
```tsx
import HomeRoomRanking from "./HomeRoomRanking";
import HomeEtnRanking from "./HomeEtnRanking";
```

**② ComingSoon 함수 제거 (이제 미사용) — 찾기:**
```tsx
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

```
**바꾸기:** (빈 줄까지 통째로 삭제 — 아래 내용으로 대체)
```tsx
```
> ※ 위 ComingSoon 블록 전체(함수 + 바로 뒤 빈 줄 1줄)를 삭제. 다른 탭은 ComingSoon을 안 쓰므로 안전(미사용 제거).

**③ etn 탭 연결 — 찾기:**
```tsx
      {tab === "etn" && <ComingSoon label="ETN" />}
```
**바꾸기:**
```tsx
      {tab === "etn" && <HomeEtnRanking />}
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeEtnRanking.tsx components/home-v6/HomeRankingTabs.tsx && git commit -m "feat(v7): ETN 탭 KRX 실데이터 연결 (1일 시세 성적표·거래대금/등락순) (STEP 256)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 서버 재시작 + 홈 ETN 탭** → '준비 중' 대신 **ETN 380종목 1일 성적표**(거래대금순 기본, 1일 등락순 토글)
- [ ] 행 hover → 우측 미리보기(이름·현재가·1일 등락 + 커뮤니티). ETN은 차트 소스가 없어 "차트 데이터 없음"은 정상
- [ ] 행 클릭 → `/stock/{코드}?name=` 이동

## 주의·예상 이슈
- ETN 차트: KIS·yahoo 모두 ETN 미커버 → 미리보기 캔들은 "데이터 없음"(정상, 리스트·시세는 정상).
- `ComingSoon` 제거 후 빌드 시 미사용 경고 0 확인.
- **문서 TODO**(다음 갱신): STEP 254·255·256.

---
> STEP 256 = ETN 탭 실데이터 연결. 전제 STEP 255(`02498d1`).
> 이걸로 주식·ETF·리츠·미국·**ETN** 실데이터 ✅. 남음: 펀드(KOFIA).
