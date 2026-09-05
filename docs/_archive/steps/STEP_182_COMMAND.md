<!-- 2026-06-06 -->
# STEP 182 — 미국 탭 "데이터 없음" 버그 수정 (us-movers 폴백 강화)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_182_COMMAND.md 파일 내용대로 실행해줘`

## 목표
실시간 차트 '미국' 탭의 **"데이터 없음"** 수정.
- 원인: `yf.screener`(day_gainers/losers)가 실패하거나 빈값일 때, 폴백이 인기 8종목을 **등락 부호로 필터** → 하락장에서 '상승' 탭이면 0개.
- 수정: ① screener **빈값일 때도** 폴백 작동(지금은 throw 시에만) ② 폴백 종목 **40개로 확대** ③ 폴백은 **등락률 순 정렬**(부호 필터 제거) → 항상 데이터.

## 전제 상태
- HEAD: STEP 181 적용된 상태
- 변경: `app/api/yahoo/us-movers/route.ts`(전체 교체) 1파일

---

## 작업 1/1 — `app/api/yahoo/us-movers/route.ts` (파일 전체 교체)

```ts
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 폴백 universe — 대표 미국 종목(섹터 분산). screener 실패/빈값 시 등락률 순으로.
const UNIVERSE = [
  "NVDA", "TSLA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "AMD", "NFLX", "AVGO",
  "INTC", "QCOM", "ORCL", "CRM", "ADBE", "MU", "JPM", "BAC", "V", "MA",
  "WMT", "COST", "KO", "PEP", "DIS", "NKE", "BA", "CAT", "XOM", "CVX",
  "JNJ", "UNH", "HD", "MCD", "SBUX", "PYPL", "UBER", "COIN", "PLTR", "SOFI",
];

type Item = { code: string; name: string; price: string; changePct: number; volume: number };

export async function GET(request: NextRequest) {
  const dir = request.nextUrl.searchParams.get("dir") === "down" ? "down" : "up";
  const count = Math.min(parseInt(request.nextUrl.searchParams.get("count") || "100", 10) || 100, 100);
  const scrId = dir === "down" ? "day_losers" : "day_gainers";

  let items: Item[] = [];

  // 1) screener (전체 시장 — 가장 정확)
  try {
    const result = await yf.screener({ scrIds: scrId, count });
    const quotes = (result.quotes ?? []) as unknown as Array<Record<string, unknown>>;
    items = quotes.slice(0, count).map((q) => ({
      code: String(q.symbol ?? ""),
      name: String(q.shortName ?? q.longName ?? q.symbol ?? ""),
      price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
      changePct: Number(q.regularMarketChangePercent ?? 0),
      volume: Number(q.regularMarketVolume ?? 0),
    }));
  } catch {
    items = [];
  }

  // 2) screener 실패/빈값 → 대표 종목 등락률 순 폴백(항상 데이터 보장)
  if (items.length === 0) {
    try {
      const quotes = await yf.quote(UNIVERSE);
      const arr = Array.isArray(quotes) ? quotes : [quotes];
      items = arr
        .map((q) => ({
          code: String(q.symbol ?? ""),
          name: String(q.shortName ?? q.symbol ?? ""),
          price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
          changePct: Number(q.regularMarketChangePercent ?? 0),
          volume: Number(q.regularMarketVolume ?? 0),
        }))
        .sort((a, b) => (dir === "down" ? a.changePct - b.changePct : b.changePct - a.changePct))
        .slice(0, count);
    } catch {
      items = [];
    }
  }

  return NextResponse.json({ items });
}
```

> 변경: ① 폴백 트리거를 `throw` → **`items.length === 0`**(빈값도 포함) ② universe 8→40 ③ 부호 필터 제거 → **등락률 순**(상승=내림차순, 하락=오름차순)으로 항상 N개.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/us-movers/route.ts && git commit -m "fix(us): 미국 탭 '데이터 없음' — screener 빈값/실패 시 대표 종목 40개 등락순 폴백(항상 데이터) (STEP 182)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 실시간 차트 **'미국' 탭에 종목 리스트가 뜨는지**(상승·하락 모두). "데이터 없음" 사라짐
- [ ] `curl -s "http://localhost:3333/api/yahoo/us-movers?dir=up&count=100" | grep -o '"code"' | wc -l` → 0이 아님
- [ ] 미국 종목 hover → 미리보기(미국은 KIS 차트 미지원이라 "차트 데이터 없음", 헤더·커뮤니티는 정상)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- screener가 정상일 땐 실제 전체 day_gainers/losers(최대 100). 실패/빈값일 때만 universe 40개.
- universe 폴백은 부호 무관 등락률 순 → 하락장 '상승' 탭도 "상대적 상위"가 나옴(빈 화면 방지).
- 미국 차트(미리보기 캔들)는 추후 Yahoo 연동.

---
> STEP 182 = 미국탭 버그 수정. 전제 STEP 181. 다음: 카테고리 레이아웃 등 잔여 토스 정렬. 문서 묶어 갱신.
