# STEP 848 — 🔴 역산기 엔진 구현 + 원전 재현 검증 (C층 첫 코드)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(수치 알고리즘 · 경계 처리)

**전제 상태**: STEP 847 커밋 `eea1021` 이후 HEAD · 트리 클린

**착수 전 필독**: `lib/revdcf/registry.ts`(**`PIE_FORMULAS`·`REFERENCE_CASE`**) · `data/sources/expectations-investing/T8.xlsx` · `docs/REVDCF_SPEC.md` §6 · `CLAUDE.md` ⓪-2

---

## 0. 성격 — 순수 계산 엔진. 데이터 파이프라인 아님

🔴 **화면 변경 0 · DB 쓰기 0.** 순수 함수 + 유닛테스트만.
🔴 **엔진 검증(수식이 맞나)과 조달 검증(재료가 맞나)은 다르다.** 847 §5가 후자였고, **이번은 전자**다.
🔴 재료는 **인자로 받는다.** 엔진 안에서 SEC를 부르지 않는다.
🔴 **어댑터 구속 조건(§4 A-8)**: 현금흐름·할인율·터미널 규칙을 **인자로** 받아야 은행·리츠 어댑터를 나중에 붙일 수 있다. FCFF를 내부에서 계산하지 말 것.

---

## §1 — 엔진 시그니처

`lib/revdcf/engine.ts` (신규)

```ts
export interface RevDcfDrivers {
  startingSales: number;
  salesGrowth: number;          // g
  operatingMargin: number;      // 예측기간 마진
  startingMargin: number;       // 0년차 마진
  taxRate: number;              // NOPAT용 (= WACC 세금방패와 동일 값이어야 함)
  fixedCapitalRate: number;     // × Δ매출
  workingCapitalRate: number;   // × Δ매출
}
export interface RevDcfMarket {
  wacc: number;
  inflation: number;            // 잔여가치 성장 (0 가능)
  sharePrice: number;
  sharesOutstanding: number;
  debt: number;
  nonOperatingAssets: number;
}
export interface RevDcfOptions {
  maxYears?: number;            // 기본 25 (원전) · 100까지 계산 가능
  displayCap?: number;          // 기본 25
}
```

**출력**: 연차별 배열(매출·영업이익·NOPAT·증분투자·FCF·현가·누적현가·잔여가치현가·기업가치·주주가치·**주당가치**) + 판정.

---

## §2 — 수식 (원전 T8 그대로 · `PIE_FORMULAS`)

```
매출(t)        = 매출(t-1) × (1+g)
영업이익(t)    = 매출(t) × 마진      [t=0은 startingMargin]
NOPAT(t)       = 영업이익(t) × (1 − 세율)
증분고정(t)    = (매출t − 매출t-1) × fixedCapitalRate
증분운전(t)    = (매출t − 매출t-1) × workingCapitalRate
FCF(t)         = NOPAT(t) − 증분고정(t) − 증분운전(t)
FCF현가(t)     = FCF(t) / (1+WACC)^t
누적현가(N)    = Σ FCF현가(1..N)
잔여가치현가(N)= [NOPAT(N) × (1+i)] / (WACC − i) / (1+WACC)^N
기업가치(N)    = 누적현가(N) + 잔여가치현가(N)
주주가치(N)    = 기업가치(N) + 비영업자산 − 부채
주당가치(N)    = 주주가치(N) / 주식수
```

🔴 **`i = 0`이면 잔여가치 = NOPAT(N)/WACC** — 우리 기본값. 원전은 인플레(도미노 1.6%). **둘 다 지원하고 인자로 받는다.**
🔴 **WACC ≤ i 이면 계산 불가** — 명시적 에러(0 나누기 방지).

---

## §3 — 해 탐색 (표 스캔)

🔴 근찾기 알고리즘 **쓰지 않는다.** N=1…maxYears 전부 계산하고 교차점을 찾는다(원전 `LOOKUP`, New Constructs 100기간과 동일 구조).

**판정 5분기** — 전부 다른 결과 타입으로 반환:

| 상황 | 반환 |
|---|---|
| 주당가치(N) 배열이 주가를 가로지름 | `{ kind:'years', gap:N }` (정수) |
| 주당가치(1) > 주가 | `{ kind:'below_one' }` — "성장이 없다고 봐도 지금 주가가 설명됨" |
| 주당가치(maxYears) < 주가 | `{ kind:'over_cap', explainedPct }` — 🔑 **원전 방식**: `주당가치(25)/주가` 를 함께 반환 |
| 🔴 곡선이 **감소**(증분 ROIC < WACC) | `{ kind:'value_destroying' }` |
| WACC ≤ i · 주식수 0 등 | `{ kind:'invalid', reason }` |

🔴 **단조성 판정을 명시적으로 계산**해 반환에 포함할 것(`monotonic: 'up'|'down'|'mixed'`).
- 이론: `Δ가치 > 0 ⟺ 증분 ROIC > WACC`. 드라이버 불변이면 **단조**여야 한다.
- 🔴 `mixed`가 나오면 **경고 로그** — 우리 설계 가정이 깨진 것이므로 조용히 넘기지 말 것.

---

## §4 — Threshold margin (원전 지표 · 우리가 몰랐던 것)

```
임계마진 = 현재마진×(1+i)/(1+g)
         + [g × (fixedCapitalRate + workingCapitalRate) × (WACC − i)]
           ÷ [(1+g) × (1−세율) × (1+WACC)]
```

**의미**: 이 성장률을 유지하면서 가치를 파괴하지 않으려면 필요한 최소 영업이익률.
🔴 실제 마진 < 임계마진 이면 **성장이 가치를 파괴**한다 → `value_destroying`과 같은 현상을 마진 한 줄로 표현.
→ 엔진이 함께 반환하고, **판정과 일치하는지 내부 검산**할 것(불일치 시 경고).

---

## §5 — 🔴 원전 재현 테스트 (통과 조건)

`lib/revdcf/engine.test.ts`

**도미노피자 (T8 Inputs · 2020-09)**
```
startingSales 3618.8 · salesGrowth 0.07 · operatingMargin 0.175 · startingMargin 0.1739
fixedCapitalRate 0.15 · workingCapitalRate 0.10 · taxRate 0.165
wacc 0.05357 · inflation 0.016
sharePrice 418 · shares 39.35 · debt 4170 · nonOperatingAssets 391.9
```

**기대값**
| 항목 | 기대 |
|---|---|
| 0년차 주당가치 | **≈ $285** |
| MIFP | **8년** |

🔴 **허용오차를 명시**하고(반올림·엑셀 부동소수 고려), 벗어나면 **어느 행에서 갈리는지** 출력해 원인을 규명할 것.
🔴 **재현 실패 시 커밋하지 말 것.** 원인 보고가 우선.

**추가 테스트**
1. `i=0`으로 바꿨을 때 GAP이 어떻게 변하는지 (원전 vs 우리 터미널 차이의 크기)
2. 단조성 — 무작위 드라이버 100세트에서 `mixed`가 나오지 않는지
3. 5분기 각각을 유발하는 입력으로 반환 타입 검증
4. 임계마진 ↔ `value_destroying` 판정 일치

---

## §6 — 🔴 오래 남은 미측정 해소: WACC 민감도

도미노 입력을 기준으로, **WACC만 ±0.5%p·±1%p·±2%p 흔들었을 때 GAP이 몇 년 변하는지** 표로 출력.

🔑 **이 숫자가 driver 6(베타)에 얼마나 공을 들여야 하는지를 결정한다.** FF1992가 "베타 설명력 3%"라고 했으므로, GAP이 WACC에 민감하면 **모델 전체의 신뢰도 문제**가 된다.

같은 방식으로 **성장률 ±1%p · 마진 ±1%p** 민감도도 낸다. 어느 driver가 GAP을 가장 크게 흔드는지 순위를 보고할 것.

---

## §7 — 예측 지평 결정 (근거와 함께 기록)

- **원전 = 25년** + `"25+"` + "25년이 주가의 몇 %를 설명하는가"
- **New Constructs = 100기간** (실제로 "75년 GAP"을 출력하고 *Very Dangerous* 등급)

🔴 **채택: 계산은 100년까지, 표시는 25년 컷.**
- 근거: 원전이 기준선(⓪-2) · 100년 GAP은 숫자로서 의미가 없어 "설명 불가"가 더 정직 · 다만 100년까지 계산하면 **분포를 볼 수 있다.**
- 🔴 **도미노 입력 기준으로 25년 컷을 넘는 조건이 무엇인지** 간단히 보고(성장률·마진을 얼마로 올리면 25+가 되는가).

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(신규 테스트 포함) · `npm run build`
2. **프로덕션 변경 0 증거** (`git diff --stat`에 `app/`·`supabase/` 없음)
3. 🔴 **§5 도미노 재현 결과** — $285 / 8년 통과 여부 + 오차
4. §6 **민감도 표** (WACC·성장률·마진) + driver 영향력 순위
5. §3 5분기 반환 타입 테스트 통과
6. §4 임계마진 ↔ 판정 일치
7. 🔴 **3중 점검 블록** 명시
8. `docs/REVDCF_SPEC.md` §6 갱신 — 지평 25년 결정 · 임계마진 신설 · 민감도 실측 기록 · §11 실측 원장 추가
9. `lib/revdcf/registry.ts` `REFERENCE_CASE`에 **실제 재현 결과** 기록
10. `docs/CHANGELOG.md`·`docs/STATE.md` 오늘 날짜
11. 커밋:
    ```bash
    git add lib/ docs/
    git commit -m "STEP 848: implement reverse-DCF engine (table scan, 5 verdicts, threshold margin) and reproduce Expectations Investing Domino's case"
    git push
    ```

## 완료 보고 → Cowork에게

- 🔴 **도미노 재현 통과 여부**(가장 중요) + 오차
- 민감도 표 + **어느 driver가 GAP을 가장 크게 흔드는가**
- 단조성 `mixed` 발생 여부
- 25년 컷 초과 조건
- 🔴 못 한 것과 이유
