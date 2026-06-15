<!-- 2026-06-15 -->
# STEP 245 — 미국 주식 기간 수익률(1주~1년) 실데이터 (yahoo us-performance + MarketClient US 병합)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_245_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 확정 — '순서대로')
미국 탭의 1주~1년 "—"를 **실데이터로** (국내 STEP 243과 동일 방식).
- 신규 `/api/yahoo/us-performance` — 대표 미국 40종목(us-movers 유니버스 재사용)의 r1w·r1m·r3m·r6m·r1y.
- `MarketClient` US 브랜치를 **2단계 로드**(us-movers 1일 즉시 → us-performance 병합)로.
- 병합 키 = 티커(symbol). 유니버스 밖 종목은 "—".

> ※ **ETN은 보류**: yahoo에 국내 ETN 데이터 없음(코드 14개 테스트 0/14, "No data found"). ETN은 KRX ETN 전용 엔드포인트가 필요한 별도 작업 → 추후. 펀드도 KOFIA 소스 필요(보류). 그래서 순서상 **미국**이 다음 가능 항목.

## 전제 상태
- 현재 HEAD: STEP 244(`429619f`)
- 변경 **2파일**:
  - `app/api/yahoo/us-performance/route.ts` (**신규**)
  - `components/market/MarketClient.tsx` (US 브랜치 find/replace 1곳)
- 검증: yahoo US 정상(AAPL 291·NVDA 205·GOOGL +102% 등). `PerfRow` 타입은 STEP 243에서 이미 있음.

---

## 작업 1/2 — `app/api/yahoo/us-performance/route.ts` (신규)

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 대표 미국 종목 (us-movers 폴백 유니버스와 동일). 티커는 접미사 없음.
const UNIVERSE = [
  "NVDA", "TSLA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "AMD", "NFLX", "AVGO",
  "INTC", "QCOM", "ORCL", "CRM", "ADBE", "MU", "JPM", "BAC", "V", "MA",
  "WMT", "COST", "KO", "PEP", "DIS", "NKE", "BA", "CAT", "XOM", "CVX",
  "JNJ", "UNH", "HD", "MCD", "SBUX", "PYPL", "UBER", "COIN", "PLTR", "SOFI",
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
    UNIVERSE.map(async (sym) => {
      try {
        const ch = await yf.chart(sym, { period1, interval: "1d" });
        const closes = ((ch.quotes ?? []) as Array<{ close: number | null }>)
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        return {
          symbol: sym,
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

> `kr-performance`의 미국판. 티커 접미사 없음. 반환 `{ items: [{ symbol, r1w, r1m, r3m, r6m, r1y }] }`.

---

## 작업 2/2 — `components/market/MarketClient.tsx` (US 브랜치 find/replace)

**찾기:**
```tsx
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
```
**바꾸기:**
```tsx
        } else {
          const j = await (await fetch(`/api/yahoo/us-movers?dir=up&count=100`)).json();
          // 1단계: us-movers(1일) 즉시 표시
          const base: Row[] = (j.items ?? []).map((s: Record<string, unknown>, i: number) => ({
            rank: i + 1,
            symbol: String(s.code ?? ""),
            name: String(s.name ?? ""),
            priceText: String(s.price ?? "—"),
            changePercent: Number(s.changePct ?? 0),
            volume: Number(s.volume ?? 0),
          }));
          if (!cancelled) { setRows(base); setLoading(false); }
          // 2단계: 기간 수익률 병합 (티커 기준 · 실패 시 무시)
          try {
            const pj = await (await fetch("/api/yahoo/us-performance")).json();
            const perfMap: Record<string, PerfRow> = {};
            for (const it of (pj.items ?? []) as PerfRow[]) if (it.symbol) perfMap[String(it.symbol)] = it;
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
        }
```
> 국내(STEP 243)와 동일한 2단계 병합. `PerfRow` 타입은 이미 정의돼 있어 추가 불필요. 미국 시장 칩엔 코스피/코스닥 없음(기존대로 국내만 시장칩).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/us-performance/route.ts components/market/MarketClient.tsx && git commit -m "feat(v7): 미국 주식 기간 수익률(1주~1년) — yahoo us-performance + MarketClient US 병합 (STEP 245)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 주식 탭 → **미국** 선택 → 1주일~1년 누르면 **대표 미국 종목 실수익률**(AAPL·NVDA·GOOGL 등), 그 기준 정렬
- [ ] 1일은 us-movers 즉시, 기간 수익률은 잠깐 뒤 채워짐(2단계)
- [ ] 유니버스 밖(40개 외) 종목은 기간 칸 "—"(정상)
- ⚠️ 하드 새로고침. 첫 로드 시 yahoo 40종목이라 수 초(이후 30분 캐시).

## 주의·예상 이슈
- us-performance 유니버스 = us-movers 폴백과 동일 40개. 더 추가하려면 두 곳 다 넣거나 us-performance만 확장.
- 미국 시총은 별도(KRX 같은 소스 없음) — 미국 탭 시총은 추후(현재 마켓 페이지 시총은 국내 KRX만).
- **ETN 보류**(yahoo 데이터 없음 → KRX ETN 엔드포인트 필요) · **펀드 보류**(KOFIA 소스 필요).
- 다음 후보: `/market` 상품 통합 디렉토리 · ETN(KRX 경로) · 펀드(KOFIA) · 전 종목 확장.
- **문서 TODO**(다음 갱신): STEP 243~245.

---
> STEP 245 = 미국 주식 기간 수익률(yahoo us-performance 병합). 전제 STEP 244(`429619f`).
> 보류: ETN(KRX ETN 엔드포인트)·펀드(KOFIA). 다음 후보: /market 상품 통합 디렉토리.
