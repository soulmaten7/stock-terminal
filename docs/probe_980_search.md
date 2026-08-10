<!-- STEP 980 착수 전 검색 — 3중 규칙. 979에서 확보한 것은 재사용, 이번 초점 = 중앙값 동점/홀짝 처리 · 분모 0 근접 관행. -->

# STEP 980 — 중앙값 배율 도입 전 검색 기록

## ①-A 원전 — 최소 3회

### 1. 중앙값 홀짝/동점 처리

`relval.pdf`(972·979 기확보)·`ch19.pdf`(979 기확보)·이번에 새로 확보한 `multiples.pdf`(Damodaran, "RELATIVE VALUATION" 학술논문 원문, `pages.stern.nyu.edu/~adamodar/pdfiles/papers/multiples.pdf`) 전부 확인 — **"중앙값 = 절반은 이 값보다 작고 절반은 크다"**(각주2: *"With the median, half of all firms in the group fall below this value and half lie above."*)는 정성적 정의뿐, **짝수 표본일 때 가운데 두 값을 어떻게 처리하는지(평균/보간/기타)는 명시가 없다.**
🔴 **못 찾음.** 표준 통계학 정의(가운데 두 값의 평균)를 그대로 쓰는 것이 관행적으로 안전하나, 원전이 명시한 게 아니다.

### 2. 🔑 분모가 0에 가까울 때·극단값 처리 — `multiples.pdf`에서 직접 확보(신규, 979는 못 찾았던 것)

> *"Outliers and Averages — As noted earlier, multiples are unconstrained on the upper end and firms can have price earnings ratios of 500 or 2000 or even 10000... These outliers will result in **averages** that are not representative of the sample. In most cases, services that compute and report average values for multiples either **throw out these outliers when computing the averages or constrain the multiples to be less than or equal to a fixed number**. For instance, any firm that has a price earnings ratio greater than 500 may be given a price earnings ratio of 500."*
> 바로 이어서: *"the sensitivity of the estimated average to outliers is another reason for **looking at the median values** for multiples."*

🔑 **핵심 — 이 절단(상한 500 등) 관행은 "평균(average)"을 계산할 때만 언급된다.** 원전은 이 문단 바로 다음 문장에서 "그래서 평균 대신 중앙값을 보라"고 이어간다 — **중앙값을 쓰는 이유 자체가 "이런 절단·왜곡 처리가 필요 없어서"다.** 우리가 정본으로 중앙값을 택한 이상, **개별 종목의 배율(분자)에 상한을 두는 관행은 원전이 말하는 문제(평균의 왜곡)에 대한 해법이지, 우리가 지금 만드는 산출물(종목별 배율)에 적용될 근거가 아니다.**
🔴 단, 분모(0에 가까운 값)에 대해서는 이 문단도 명시가 없다 — "분모 0"은 애초에 우리 코드(`lib/valuation.ts`)가 음수·0을 이미 걸러(`NEGATIVE_*`) 이 지점에 도달하지 않는다(979 확인 재사용, 이번엔 재검토 안 함).

### 3. `multiples.pdf`의 음수처리 재확인(979 인용의 원출처 확정)

979가 웹검색 요약으로 인용했던 *"With every multiple, there are firms for which the multiple cannot be computed..."* 문장의 **원출처가 바로 이 `multiples.pdf`**임을 이번에 직접 원문 대조로 확정(라인 275 부근, "Biases in Estimating Multiples" 절). 979의 인용이 정확했음이 재확인됐다 — 새 내용 아님, 출처 확정만.

---

## ①-B 타 플랫폼 — 최소 3곳(979 재사용 + 극단값 표시 1건 신규 확인)

979에서 이미 stockanalysis.com·WallStreetZen·MarketBeat 3곳을 조회(배율/%차이 명시 안 함, 원시값 병기)했다 — 재조사 안 함.

**신규 확인(극단값이 실제로 어떻게 표시되는지)**: stockanalysis.com에서 CSGP(CoStar Group) 조회 — **PE Ratio = 170.72로 그대로 표시됨(상한·절단·"N/A" 처리 없음).** 🔴 참고로 이 값은 우리 DB의 CSGP PER(1750.5, FY2024 annual 기준)과 크게 다르다(TTM vs annual 회계연도 기준차로 추정 — us_valuation 4축 값 자체는 이번 STEP 범위 밖이라 재조사 안 함, `docs/STATE.md`에 새 항목으로만 등재).

🔑 **종합**: 실무도 극단값을 자르지 않고 그대로 노출한다는 정황(1곳 확인) — "배율에 상한을 걸지 않는다"는 이미 내려진 판정과 방향이 같다.

---

## 결론 — 이번 STEP 착수 근거

①-A-1(동점처리)은 못 찾음 → 표준 통계 정의(가운데 두 값 평균, `percentile_cont(0.5)`와 동일)를 그대로 쓴다(원전이 반박 안 함). ①-A-2(상한/절단)는 **원전이 오히려 "중앙값을 쓰면 이 문제 자체가 없다"고 말한다** — 상한 미도입 판정을 강하게 뒷받침. 착수한다.
