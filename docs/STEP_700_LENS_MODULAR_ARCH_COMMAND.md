<!-- 2026-07-11 -->
# STEP 700 — 🔭 렌즈 "독립 배선" 아키텍처 리팩토링 (1차 뼈대)

🔴 **Opus 권장** (대규모 아키텍처 리팩토링 — 여러 파일 영향도 판단 필요)
**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`

**설계 정본:** `docs/LENS_ARCHITECTURE.md` — 반드시 먼저 정독하고 그대로 구현.
**불변식(절대):** ① **엔진=검증 일치**(화면·배치·백테스트가 같은 계산 공유) ② **동작 불변**(출력 1비트도 안 바뀜 — 특성화 테스트로 보증). 바뀌면 롤백.
**목표:** 각 기법 = 균일 `Lens` 모듈(입력=StockData 번들 / 출력=LensRead) · `LENSES` 레지스트리 · `compute` async 허용(= 나중에 기법당 AI 교체 지점). 계산식·note·copy는 **한 글자도 안 바꾼다.**

---

## 실행 순서 (테스트 우선 = 안전망)

### 1) 특성화 테스트 먼저 (리팩토링 전 현재 동작 고정)
- 리팩토링 **전에**, 현재 `computeSymbolLenses`/각 렌즈의 출력을 vitest로 박제. 최소:
  - 각 팩터 렌즈 함수(`momentumLens` 등)를 알려진 입력(고정 배열/수치)으로 호출 → 핵심 `LensRead` 필드(key·grade·value·state·detail·headline) 스냅샷 고정.
  - `pct`·`perFrom`·`pbrFrom` 등 기존 테스트 유지.
- `npm test` 통과 확인(리팩토링 전 baseline 초록).

### 2) 타입·레지스트리
- `lib/lenses/types.ts` 신규 — `StockData`·`LensMeta`·`Lens` + `LensRead`(lenses.ts에서 이전).
- `lib/lenses/registry.ts` 신규 — `export const LENSES: Lens[] = [momentum, lowVol, technical, valuation, quality, assetGrowth]`.

### 3) 6개 렌즈 → Lens 객체 (계산 불변)
- `lib/lenses.ts`의 6개 함수를 `Lens` 객체(`{ meta, compute(d, locale) }`)로. 입력을 인자→`d`(StockData)에서 추출로만 변경. **내부 계산·note·copy 그대로.**
- meta.backtestRef·percentile은 LENS_ARCHITECTURE §4 예시대로(모멘텀/퀄리티=dir high, 저변동/밸류/자산성장=dir low, 기술=percentile null).

### 4) 오케스트레이터 제네릭화
- `lib/lensCompute.ts` — 데이터 조달부를 `buildStockData(symbol, locale): StockData`로 추출, 렌즈부를 `await Promise.all(LENSES.map(l => l.compute(d, locale)))`로. F-Score는 `computeFScore(d.financials)` 그대로 `fscore` 필드. **밸류 재무폴백(perFrom/pbrFrom)·퀄리티·자산성장 데이터 매핑 로직 보존.**

### 5) percentile을 meta 기반으로
- `app/api/lens/route.ts`의 하드코딩 맵 제거 → `LENSES` 중 `meta.percentile`이 있는 렌즈에만 `dir`대로 주입. **RPC lens_percentiles 호출·결과는 동일.**

### 6) F-Score 테스트만 추가 (구조 불변)
- `lib/fscore.ts` 로직 불변 + `computeFScore` 특성화 테스트 1케이스.

## 게이트 (전부 통과해야 커밋)
```bash
npm install
npm test                 # 특성화 포함 전부 통과 (동작 불변 보증)
npx tsc --noEmit         # 0
npm run build 2>&1 | tail -6
```
## 라이브 회귀 (배포 후 — 진짜 게이트)
```bash
for s in 005930 AAPL 7203.T; do echo "== $s =="; curl -s "https://onetrillion.app/api/lens?symbol=$s" | python3 -c "import sys,json;d=json.load(sys.stdin);print('lenses',[l['key'] for l in d['lenses']]);print('fscore', (d.get('fscore') or {}).get('score'))"; done
```
- 리팩토링 **전과 동일한 렌즈 key 세트·순서 + F-Score 정상** 이면 성공. 값이 달라지면 불변식 위반 → 롤백.

## CHANGELOG
```
- **700**: 🔭 렌즈 "독립 배선" 아키텍처 — StockData 번들 + Lens 인터페이스(compute async 허용=기법당 AI 자리) + LENSES 레지스트리 + 오케스트레이터 제네릭화 + percentile meta화. 계산·출력 불변(특성화 테스트 보증). 설계=docs/LENS_ARCHITECTURE.md.
```
## 커밋
```bash
git add lib/ app/api/lens/route.ts docs/LENS_ARCHITECTURE.md docs/STEP_700_LENS_MODULAR_ARCH_COMMAND.md docs/CHANGELOG.md docs/INDEX.md
git commit -m "refactor(lens): 독립 배선 아키텍처(StockData 번들·Lens 인터페이스·LENSES 레지스트리·async compute) — 동작 불변(특성화 테스트)"
git push
```

## Cowork에게 보고
- npm test(특성화 포함) 통과·tsc 0·build + 라이브 3종목 렌즈 세트/값 리팩토링 전과 동일 여부.
