<!-- 2026-07-11 -->
# 🔭 LENS ARCHITECTURE — 기법 렌즈 "독립 배선" 표준

> **목적**: 각 기법(렌즈)을 **자기완결 모듈**로 — 균일 인터페이스·레지스트리 플러그인·**나중에 기법당 전용 AI로 교체 가능**.
> **불변식(절대 보존)**: ① **엔진=검증 일치**(화면·배치·백테스트가 같은 계산 공유) · ② **동작 불변**(리팩토링 후 출력 동일 — vitest·tsc가 보증).
> 관련: `RELEASE_ROADMAP.md` §1(1차 완성기준 2) · `LENS_DEV_PLAYBOOK.md` §0.

## 0. 왜
지금은 렌즈 목록이 4~5곳(lensCompute 배열·lensCopy·percentile맵·UI)에 흩어지고(레지스트리 없음), 렌즈마다 입력 시그니처가 달라(closes / pe,pb / 재무) 오케스트레이터가 **수동 배선**한다. → 플러그인처럼 추가/교체 불가, **AI로 갈아끼울 자리가 없다.** 이 표준이 그 자리를 만든다. (현재 이미 잘 된 것: 순수함수·균일 출력 LensRead·기법별 계산모듈 분리·엔진=검증 일치 — 리빌드 아니라 **경계 정리**.)

## 1. 표준 데이터 번들 (한 번 fetch → 모든 렌즈에 주입)
```ts
// lib/lenses/types.ts
export interface StockData {
  symbol: string; resolved: string; name: string; price: number | null;
  closes: number[];                       // 가격계열 (모멘텀·기술·저변동)
  pe: number | null; pb: number | null;   // 밸류
  financials: FRow[];                     // 연간 재무(오름차순) — 퀄리티·자산성장·F-Score
}
```

## 2. Lens 인터페이스 (균일 · async 허용 = AI 자리)
```ts
export interface LensMeta {
  key: string; nameEn: string;
  grade: string; gradeTier: "strong" | "partial" | "ref";
  horizon: "short" | "mid" | "long";
  backtestRef?: string;                          // 이 등급을 낸 백테스트(엔진=검증 일치 문서화)
  percentile?: { dir: "high" | "low" } | null;   // 팩터 상대순위 지원·우호방향(미지원=null: 기술)
}
export interface Lens {
  meta: LensMeta;
  compute(data: StockData, locale: Locale): LensRead | Promise<LensRead>;   // ← Promise 허용
}
```
> `compute`가 `LensRead | Promise<LensRead>`라 — 어떤 렌즈의 compute를 **AI 구현으로 그대로 교체**(async)해도 오케스트레이터·타 렌즈 **무영향.** = "기법당 AI"의 정확한 연결점.

## 3. 레지스트리 (단일 출처)
```ts
// lib/lenses/registry.ts
export const LENSES: Lens[] = [momentum, lowVol, technical, valuation, quality, assetGrowth];
```
목록·순서·percentile 설정이 여기 한 곳. 렌즈 추가 = 이 배열에 한 줄.

## 4. 렌즈 변환 패턴 (계산식·note·copy는 한 글자도 안 바꾼다)
**before**: `export function valuationLens(pe, pb, locale): LensRead {...}`
**after**:
```ts
export const valuation: Lens = {
  meta: { key: "valuation", nameEn: "Value (E/P · B/M)", grade: "약한 신호",
          gradeTier: "partial", horizon: "long", backtestRef: "STEP560",
          percentile: { dir: "low" } },
  compute(d, locale) {
    const pe = d.pe, pb = d.pb;         // ← 인자 대신 번들에서 추출
    /* ...기존 계산·note·copy 그대로... 출력 LensRead 동일... */
  },
};
```
> 바뀌는 것은 **입력(인자→번들추출) + 형태(함수→Lens객체)뿐.** 내부는 불변.

## 5. 오케스트레이터 (제네릭)
```ts
// lib/lensCompute.ts
const d = await buildStockData(symbol, locale);         // chart/quote/fundamentals → StockData
if (d.closes.length < 30) return { ..., error: "insufficient_data" };
const lenses = await Promise.all(LENSES.map(l => l.compute(d, locale)));  // 수동 배선 제거·async 대응
const fscore = computeFScore(d.financials);             // F-Score는 독립 모듈(§6)
return { symbol, resolved: d.resolved, name: d.name, price: d.price, lenses, fscore };
```

## 6. F-Score = 독립 모듈 (억지 균일화 X)
F-Score는 9기준 체크리스트라 팩터 렌즈(방향 라벨)와 **구조가 다름** → LensRead에 억지로 안 넣는다. `lib/fscore.ts` 자기완결 유지 + **테스트 추가**. 오케스트레이터가 `fscore` 필드로 별도 노출(현 UI 유지).

## 7. percentile = 레지스트리 meta로
`/api/lens`의 하드코딩 맵 제거 → `LENSES` 중 `meta.percentile != null`인 렌즈만 `meta.percentile.dir`로 방향 결정해 주입.

## 8. 테스트 우선 (특성화 → 리팩토링 안전망)
리팩토링 **전에** 각 렌즈의 현재 출력을 vitest **특성화 테스트**로 고정(알려진 입력 → 기대 LensRead 필드). 그 후 리팩토링 → 테스트가 **동작 불변**을 보증. (vitest·tsc = 회귀 게이트.)

## 9. 렌즈 추가법 / AI 교체법
- **추가**: 새 `Lens` 객체(meta+compute) → `LENSES`에 한 줄 + `lensCopy` 카피 + 테스트. 끝(타 파일 무관).
- **AI 교체**: 그 렌즈의 `compute`를 `async (d) => aiAnalyze(d)`로 교체(같은 LensRead 반환). 레지스트리·오케스트레이터·타 렌즈 **무변경**.

## 10. 파일 배치
- `lib/lenses/types.ts` — StockData·Lens·LensMeta·LensRead(이전)
- `lib/lenses/registry.ts` — LENSES
- `lib/lenses.ts` — 6개 Lens 객체(계산 모듈 import 유지) *(추후 기법별 파일 분리는 선택)*
- `lib/lensCompute.ts` — buildStockData + 제네릭 오케스트레이터
- `lib/fscore.ts` — 독립(그대로) + 테스트
- `lib/lenses/*.test.ts` — 기법별
