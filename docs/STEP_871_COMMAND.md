# STEP 871 — 차이 9행 **1행: driver 1(매출 성장률)** 실측 (측정 전용 · 코드 0줄)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_871_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `84d4d55`(STEP 870 · `main`·`revdcf-preview` 동일) · tsc 0 · vitest 153/153 · `REVDCF_ENABLED` **OFF** · 프로덕션 `https://onetrillion.app`

**위치**: 870이 만든 **차이 9행 진행표의 1행**. 이 STEP은 ①결과 변화 ②커버리지 손실을 **재기만** 한다. 🔴 **③판정 = 장은태.**

---

## 0. 성격 — 🔴 측정 전용

| # | 금지 |
|---|---|
| 1 | 🔴 `lib/**`·`app/**`·`components/**`·`messages/**` 수정 — **`lib/revdcf/drivers.ts`를 고치지 말 것** |
| 2 | 🔴 `revdcf_results`·`us_market_cap` **쓰기** · `data/us_symbols.json` 수정 |
| 3 | 플래그 변경 · 화면 변경 |
| 4 | 🔴 **"원전으로 바꾸자/말자"를 쓰지 말 것.** 숫자와 사유만 |
| 5 | 🔴 **다음 행(driver 3~) 제안 금지** |
| 6 | 유료 API 구독·키 구매 제안 금지 |

---

## §0. 🔴 이 STEP 전에 정정되어야 할 것 — Cowork 실측(2026-08-02)

**870·STATE·`registry.ts`가 driver 1의 근거로 `847 가이던스 63.3%`를 쓰고 있는데, 원본을 열어보니 성격이 다르다.**

`docs/probe_847_guidance.json` 원문:

```json
"sampleSize": 60, "withRevenueGuidanceLanguage": 38, "rateRevGuidanceOfFetched": 0.633,
"note": "존재율은 '가이던스 언어 정규식' 근사(정확한 금액·기간 추출엔 LLM 필요). 8-K Item 2.02 최근 1건 본문 스캔."
```

🔴 **63.3%는 커버리지가 아니다.** ① 표본 **60사**(우리 유니버스 604/2,857 아님 · 추출 기준 미상) ② **정규식으로 "가이던스 언어가 있나"만** 봄 — **금액을 뽑은 게 아니다** ③ **8-K 1건**만 스캔.
→ **원전 절차로 갈아끼울 때의 실제 커버리지는 63.3%보다 낮다.** 이 STEP이 새로 재야 한다.

**더 중요한 것 — 원전이 지목한 소스는 8-K가 아니다.**

`data/sources/text/EI_tutorial_02_sales.html` 원문(*"How Do I Project Future Sales Growth Rates?"* 절):

> *"**Company web sites.** Companies commonly publish their guidance … Search a company's investor relations website … Domino's Pizza offers **multi-year guidance** for sales growth here."*
> *"**Value Line Investment Survey.** … available via online subscriptions and through many local libraries."*
> *"**Morningstar.** …"*
> *"Other useful sites include **Koyfin, Zacks, roic.ai and Yahoo Finance**."*

🔑 **원전은 소스를 5갈래로 제시하고, 그중 첫째는 IR의 multi-year 가이던스다.** 847이 잰 **8-K Item 2.02(분기 실적발표)는 그 목록에 없다.** *"N≈1년"* 이라는 한계도 8-K의 성질이지 원전 절차의 성질이 아니다.

🔴 **그리고 `Yahoo Finance`가 원전 목록에 있다.** 우리는 `yahoo-finance2` v3.14.0을 **이미 쓰고 있다**(`lib/lensPrecompute.ts`·`scripts/probe_us_universe.ts`). `registry.ts:119`는 *"FMP 컨센서스(2~3년) 키 미보유"* 라고 막다른 길만 적어놨는데, **원전이 지목한 소스 중 하나를 우리가 이미 보유 중일 수 있다.** §2가 이걸 잰다.

**원전은 단일값이 아니라 범위를 쓴다** — 같은 문단:

> *"we combine our own analysis, analyst reports, and Value Line forecasts to assess a **range** for Domino's likely sales growth rate. We estimate the price-implied expectations reflect sales growth of **7 percent**. Our **low scenario of 3 percent** …"*

→ 원전 = **기준 + 시나리오 범위**. 우리 = **단일 CAGR**. 차이의 일부다.

---

## §1 — 🔴 원본을 먼저 연다 (⓪-3 · 이 명령서도 그대로 믿지 말 것)

1. `data/sources/text/EI_tutorial_02_sales.html` **본문 직접 개봉** — §0의 인용 5갈래가 맞는지 확인. **틀리면 그 사실을 보고.**
2. `data/sources/expectations-investing/T8.xlsx` **`Inputs!C6`** — 도미노에 실제로 들어간 성장률 값과 셀 주석. 🔴 **T2 스프레드시트는 없다**(T3~T10만 보유 · 튜토리얼 #1·#2는 404).
3. `lib/revdcf/drivers.ts:163` — 우리 계산 원문:
   ```ts
   const salesGrowth = nSpan > 0 && rev[firstY] > 0 ? (rev[lastY] / rev[firstY]) ** (1 / nSpan) - 1 : 0;
   ```
   🔴 **끝점 2개만 쓴다**(5년 중 중간 3년 미사용). 이 성질을 보고에 적을 것.
4. `docs/probe_847_guidance.json` 전문 — §0의 성격 규정이 맞는지 확인.
5. **부수 확인(판정 아님)**: `lib/revdcf/registry.ts` `operatingMargin`(driver2) 항목의
   `divergence: "원전은 단일 예측치. 우리는 5년/10년 병기해 순환성을 노출"` 이
   `LENS_COMPLETION_STANDARD` 607행에서 **"동일 8행"**에 들어가 있다.
   🔴 **계산식은 동일**(도미노 시작마진 17.39% 정확 일치)하나, "5년/10년 병기"는 **원전에 없는 산출물**이라 추가물 4행에도 없다.
   → **어느 칸에도 없다는 사실만 보고**한다. 🔴 **분류를 바꾸지 말 것.**

---

## §2 — ② 커버리지: 원전 소스를 우리가 얼마나 조달할 수 있나

**신규 파일**: `scripts/probe_871_driver1_sources.ts` (측정 전용)

**대상**: `revdcf_results` `as_of` 최신의 `skip_reason is null` **515사**(현행 산출 대상). 🔴 전수 2,857로 넓히지 말 것 — 이번은 **현행 대비 변화**를 본다.

**잴 것 — 소스별로 따로**:

| 소스 | 방법 | 보고 |
|---|---|---|
| **A. 야후 애널리스트 매출 추정** | `yahoo-finance2` `quoteSummary`의 추정 모듈(예: `earningsTrend`) — 🔴 **모듈명·필드는 추측하지 말고 실제 응답에서 확인**. 라이브러리 타입/문서를 열어볼 것 | 응답률 · **연도 수**(+1y만인지 +2y까지인지) · 값의 단위·통화 |
| **B. 8-K 가이던스** | 847 방법 재사용(`scripts/probe_847*`) | 🔴 **515 전수로** 재측정 · 언어 존재율과 **금액 추출 성공률을 따로** |
| C. Value Line · Morningstar | — | 🔴 **측정하지 말 것.** 유료·비공개다. **"원전 소스이나 우리는 접근 불가"로 기록만** |

🔴 **A와 B의 합집합·교집합을 셀 것.** 어느 하나로 안 되면 둘을 겹쳐야 하는지가 재료다.
🔴 **금액을 못 뽑으면 "언어는 있으나 값 추출 실패"로 따로 센다.** 존재율과 사용가능률을 뭉뚱그리지 말 것(847의 63.3%가 그렇게 오해됐다).

산출: `docs/probe_871_coverage.json`

---

## §3 — ① 결과 변화: 성장률을 갈아끼우면 GAP이 얼마나 달라지나

§2에서 **값을 실제로 얻은 종목만** 대상. 기존 엔진을 **import만** 해서 다시 태운다(수정 금지).

```ts
import { computeGapWithSensitivity } from "../lib/revdcf/compute";
import { runRevDcf } from "../lib/revdcf/engine";
```

`app/api/cron/revdcf/route.ts`의 `processOne()` 조립을 그대로 따르되 **`salesGrowth`만 교체**한다. 나머지 드라이버·WACC·시총은 현행 그대로. `maxYears: 25`.

**현행 기준선** (Cowork 실측 · `as_of 2026-08-03` · 산출 515):

| | p05 | p25 | **p50** | p75 | p95 | 음수 | >30% |
|---|---|---|---|---|---|---|---|
| `sales_growth` | −1.88% | 5.48% | **9.48%** | 15.43% | 38.84% | 31사 | 48사 |
| `gap_years` | — | 6 | **11** | 17 | — | — | — |

**보고할 것**:
- 교체 성장률의 분포(같은 백분위) vs 위 기준선
- `verdict` 이동 행렬 — `years`↔`over_cap`↔`value_destroying`↔`below_one` **몇 개가 어디로**
- `gap_years` 중앙·p25/p75 변화
- 🔴 **부호가 뒤집힌 종목 수**(과거 CAGR 음수인데 전망 양수, 또는 반대) — 31사 음수가 어떻게 되는지
- 🔴 **원전은 범위를 쓴다**(§0). 단일값 교체 외에 **low/base 두 시나리오가 가능하면 둘 다** 산출. 불가능하면 "불가"로 적을 것

산출: `docs/probe_871_output.json` + CIK별 행 `docs/probe_871_rows.json`

---

## §4 — 진행표 갱신

`docs/LENS_COMPLETION_STANDARD.md` 차이 9행 진행표의 **1행(driver 1)** 만 채운다:
- ①결과 변화 = §3 요약 한 줄
- ②커버리지 손실 = §2 요약 한 줄
- ③판정 = 🔴 **`대기` 그대로 둘 것**

🔴 **2~9행은 손대지 말 것.**
🔴 `REVDCF_SPEC` §11 실측 원장에 §2·§3 수치를 날짜·출처와 함께 추가.
🔴 `registry.ts`는 **고치지 말 것** — §0에서 드러난 "Yahoo 미검토" 사실은 **문서에만** 적는다(코드 동기화는 별건).

---

## 검증

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/     # 🔴 출력 없어야 함
```

```sql
select as_of, count(*) from revdcf_results group by as_of order by as_of desc;  -- 604 ×3 무변화
select count(*) from us_market_cap;                                             -- 5,886 무변화
```

커밋(push 포함):

```bash
git add scripts/probe_871_driver1_sources.ts docs/probe_871_*.json \
        docs/LENS_COMPLETION_STANDARD.md docs/REVDCF_SPEC.md \
        docs/STATE.md docs/CHANGELOG.md docs/STEP_871_COMMAND.md
git commit -m "STEP 871: measure driver 1 (sales growth) against the primary source procedure

- the primary source names five forecast sources, first among them multi-year IR guidance;
  the 63.3% figure carried in registry/STATE came from a 60-name regex scan of one 8-K each
  and detects guidance language, not extractable amounts
- Yahoo Finance is on the primary source's list and we already ship yahoo-finance2; probe
  whether its analyst revenue estimates are reachable before treating consensus as unavailable
- measure coverage per source separately, language presence apart from amount extraction
- rerun the existing engine with sales growth swapped, report verdict migration and GAP shift
- fill row 1 of the divergence table; verdict stays pending
- measurement only: no writes, no engine changes, flag unchanged"
git push && git push origin main:revdcf-preview
```

## 보고 → 그리고 멈춘다

```
§1 원본: 원전 5소스 확인 ? · T8 Inputs!C6 값 ? · drivers.ts:163 끝점2개 확인 ?
        · driver2 미분류 확인 ? · 🔴 명령서와 다른 점 ?
§2 커버리지(515 기준): 야후 응답 ? · 연도수 ? / 8-K 언어 ? · 금액추출 ? / 합집합 ? · 교집합 ?
§3 결과: 성장률 p50 9.48%→? · GAP 중앙 11→? · verdict 이동 행렬 · 부호반전 ?사
        · 시나리오 2개 산출 가능/불가
무변경: revdcf_results 604×3 · us_market_cap 5,886 · lib/app/components/messages/data diff 없음
tsc 0 · test ?/? · push ?
🔴 못 한 것 · 미측정
```

🔴 **채택 여부·다음 행에 대해 한 줄도 쓰지 말 것.** 판정은 장은태가 한다.
