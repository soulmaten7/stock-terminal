<!-- 2026-07-08 (3rd) -->
# STEP 666 — 📈 지수 티커: 6개국 완성 + 국가 블록 정렬·구분선

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `6e1775c`(STEP 665B). 지수 티커 = `components/layout/HomeIndexStrip.tsx`(마퀴 스크롤) ← `/api/yahoo/indices`.
**목표:** ① **6개국 지수 빠짐없이**(빠진 JP TOPIX·CN 상하이종합 추가) ② **국가 블록 순서로 정렬 + 블록 사이 구분선**(스캔 용이). 등락 색(`text-unjong-up/down`)은 **이미 있음 — 유지**.
**대상:** `app/api/yahoo/indices/route.ts` + `components/layout/HomeIndexStrip.tsx`.

> 현재 이미 있음: KR(KOSPI·KOSDAQ)·JP(Nikkei)·CN(CSI300)+HK(Hang Seng)·VN(VN-Index·VN30)·US(S&P·NASDAQ·Dow·SOX)·GB(FTSE100·250) + FX/원자재/크립토. **빠진 것 = JP TOPIX, CN 상하이종합.** 순서가 뒤섞여 국가 구분이 안 됨.

---

## 1. `app/api/yahoo/indices/route.ts`

**(a) `IndexItem`에 `group` 추가**:
```ts
type IndexItem = { name: string; value: string; changeText: string; changePct: number; isUp: boolean; spark: number[]; group: string };
```

**(b) `INDEX_SYMBOLS`를 국가 블록 순서 + group으로 재정렬**(TOPIX·상하이종합 추가):
```ts
const INDEX_SYMBOLS = [
  // 🇰🇷 KR
  { symbol: "^KS11", name: "KOSPI", group: "KR" },
  { symbol: "^KQ11", name: "KOSDAQ", group: "KR" },
  // 🇯🇵 JP
  { symbol: "^N225", name: "Nikkei 225", group: "JP" },
  { symbol: "^TPX", name: "TOPIX", group: "JP" },            // ← 추가
  // 🇨🇳 CN + 🇭🇰 HK
  { symbol: "000001.SS", name: "상하이종합", group: "CN" },   // ← 추가(Shanghai Composite)
  { symbol: "000300.SS", name: "CSI 300", group: "CN" },
  { symbol: "^HSI", name: "Hang Seng", group: "CN" },
  // 🇺🇸 US
  { symbol: "^DJI", name: "Dow Jones", group: "US" },
  { symbol: "^IXIC", name: "NASDAQ", group: "US" },
  { symbol: "^GSPC", name: "S&P 500", group: "US" },
  { symbol: "^SOX", name: "SOX", group: "US" },
  // 🇬🇧 GB
  { symbol: "^FTSE", name: "FTSE 100", group: "GB" },
  { symbol: "^FTMC", name: "FTSE 250", group: "GB" },
  // 🌐 시장·환율·원자재
  { symbol: "^VIX", name: "VIX", group: "ETC" },
  { symbol: "USDKRW=X", name: "USD/KRW", group: "ETC" },
  { symbol: "JPY=X", name: "USD/JPY", group: "ETC" },
  { symbol: "CNY=X", name: "USD/CNY", group: "ETC" },
  { symbol: "GBP=X", name: "USD/GBP", group: "ETC" },
  { symbol: "GC=F", name: "Gold", group: "ETC" },
  { symbol: "BTC-USD", name: "Bitcoin", group: "ETC" },
];
```

**(c) VN 지수에 group 부여 + CN 블록 뒤(=VN 블록)로 삽입 위치 변경**:
- `fetchVnIndex` 반환 객체에 `group: "VN"` 추가(`return { name, value, changeText, changePct, isUp, spark, group: "VN" }`).
- 야후 아이템 map 반환 객체에 `group: meta.group` 추가.
- merge: VN 블록을 **GB 앞(CN·US 사이 어디든 국가 블록으로)** — 자연스럽게 **CN 블록 뒤**에 넣자. 현재 `USD/CNY` 기준 삽입 로직을, **마지막 CN(=Hang Seng) 뒤**에 삽입하도록 변경:
```ts
const vnItems = vnRaw.filter((x): x is IndexItem => x !== null);
const lastCn = yahooItems.map((x) => x.group).lastIndexOf("CN");
const merged = lastCn >= 0
  ? [...yahooItems.slice(0, lastCn + 1), ...vnItems, ...yahooItems.slice(lastCn + 1)]
  : [...yahooItems, ...vnItems];
```
> 결과 순서: KR → JP → CN/HK → **VN** → US → GB → ETC.

> ⚠️ `^TPX`(TOPIX)·`000001.SS`(상하이종합) 값이 야후에서 안 오면 `value === "0"` 필터로 자동 제외됨(안전). 라이브에서 안 뜨면 대체 심볼 시도(TOPIX: `^TOPX` / 상하이: 그대로). 확인해 보고.

## 2. `components/layout/HomeIndexStrip.tsx` — 블록 구분선

- `Item` 타입에 `group: string` 추가.
- 마퀴 렌더에서 **group이 바뀌는 지점에 옅은 세로 구분선** 삽입:
```tsx
import { Fragment, useEffect, useState } from "react";
// ...
{loop.map((it, i) => {
  const showDiv = i > 0 && loop[i - 1].group !== it.group;
  return (
    <Fragment key={i}>
      {showDiv && <span className="mx-1 h-3 w-px shrink-0 bg-white/15" />}
      <span className="inline-flex items-center gap-1.5 px-4 text-xs">
        <span className="text-white/45">{it.name}</span>
        <span className="font-semibold tabular-nums text-white">{it.value}</span>
        <span className={`tabular-nums ${it.isUp ? "text-unjong-up" : "text-unjong-down"}`}>
          {it.changeText ? `${it.changeText} ` : ""}({it.isUp ? "+" : ""}{it.changePct.toFixed(2)}%)
        </span>
      </span>
    </Fragment>
  );
})}
```
> 등락 색·마퀴 애니메이션은 그대로. 구분선만 추가.

---

## 3. 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 로컬: `curl "http://localhost:3333/api/yahoo/indices"` → items에 **TOPIX·상하이종합 포함**, group 필드 있고 **KR→JP→CN→VN→US→GB→ETC 순서**.
- 화면 상단 티커: 국가 블록끼리 모여 스크롤 + 블록 사이 옅은 구분선. TOPIX·상하이종합 뜨는지(안 뜨면 대체 심볼).
- console.log 금지.
```bash
git add app/api/yahoo/indices/route.ts components/layout/HomeIndexStrip.tsx
git commit -m "feat(ui): STEP 666 지수 티커 6개국 완성(TOPIX·상하이종합 추가)+국가 블록 정렬·구분선"
git push
```

## Cowork에게 보고
1. TOPIX·상하이종합 라이브로 뜨는지(안 뜨면 심볼 알려줘).
2. 국가 블록 순서·구분선 체감.
→ 다음(선택) = STEP 667 색 대비 미세정리(muted 한 단계 진하게·등급 배지 대비·빨강/파랑 범례) 또는 **광고 대화**.
