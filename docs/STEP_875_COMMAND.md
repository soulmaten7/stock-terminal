# STEP 875 — 차이 3행(driver 4) 판정 확정 · 4행(driver 5) 근거 부재 기록 · 도미노 앵커 검증

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_875_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `c502094`(STEP 874 · `main`·`revdcf-preview` 동일) · tsc 0 · test 153/153 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,886

---

## §0. B·C축 결과 (Cowork · 2026-08-02) — 두 행의 답이 갈린다

874까지 ①②는 쟀으나 **외부 근거(B 실무·C 반대 증거)가 비어 있었다.** 채운 결과:

**Damodaran, *Working capital in valuation*** (`pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/noncashwc.htm`)

> *"Changes in non-cash working capital are **unstable**, with big increases in some years followed by big decreases in the following years."*
> *"can the change in non-cash working capital be negative? The answer is **clearly yes**."*
> *"The non-cash working capital **as a percent of revenues** can be used, in conjunction with expected revenue changes each period, to estimate projected changes in non-cash working capital over time."*
> *"For most firms, estimating a **composite number** for non-cash working capital is easier to do and often **more accurate than breaking it down into more detail**."*
> 변동이 크고 예측 불가면 **업종 평균** 권고.

### 이것이 판정하는 것

| | 우리 현행 | 평가 |
|---|---|---|
| **driver 4** | `(유동자산 − 현금 − 유동부채) ÷ 매출` 5년 평균 | ✅ **다모다란의 "as a percent of revenues" 그대로.** 우리 발명품이 아니라 이유가 붙은 실무 방식 |
| **A안 vs B안** | — | ✅ *"composite … more accurate than breaking it down"* → **집계(B안) 지지.** 커버리지 12.6% vs 99.8%와 같은 방향 |
| 원전 증분식의 불안정성 | 도미노 연도별 −26.7%~+18.2% · B안 음수 220사 | ✅ **문헌이 예측한 성질.** 우리 데이터 결함이 아님 |
| 🔴 **driver 5** | `PP&E 장부가 ÷ 매출` 5년 평균 | 🔴 **위 근거가 적용되지 않는다.** 이건 **자본집약도**이지 재투자율이 아니다. 원전에도 없고 다모다란 권고도 아니다 |

🔑 **driver 4는 "다른 이름의 같은 것"을, driver 5는 "다른 것"을 잰다.** 874 숫자가 그대로 반영한다 — driver 4 원전식 적용 시 `years` −12(온건), driver 5 −49(큼).

---

## 🔴 금지사항

| # | 금지 |
|---|---|
| 1 | 🔴 `lib/**`·`app/**`·`components/**`·`messages/**` 수정 — **`drivers.ts`를 고치지 말 것.** 이 STEP은 기록이지 교체가 아니다 |
| 2 | `revdcf_results`·`us_market_cap` 쓰기 · 플래그·화면 변경 |
| 3 | 🔴 **driver 5를 새 방식으로 교체하지 말 것** — 근거 부재를 **기록만** 한다 |
| 4 | 🔴 **driver 6·다음 행 착수 제안 금지** |

---

## §1 — 🔴 도미노 앵커 (874에서 안 된 것)

874 §1-4가 요구한 것은 *"T4·T5의 도미노 입력으로 **우리 계산을 돌리면** 원전 값이 재현되는가"*였는데, 보고는 **원본 셀이 그 값을 낸다는 확인**이었다. **우리 공식으로 돌린 게 아니다.**

**신규 파일**: `scripts/probe_875_dominos_anchor.ts` (측정 전용)

`data/sources/expectations-investing/T4.xlsx`·`T5.xlsx`의 **도미노 입력값을 그대로 넣어** 우리 세 공식을 각각 돌린다:

| 공식 | 기대값(원전 셀) | 우리 결과 |
|---|---|---|
| driver 4 **B안**(집계 근사) | T4 `I31` = **0.501%** | ? |
| driver 4 **A안**(세부 태그) | 동상 | ? |
| driver 5 **marginal**(원전식) | T5 `I20` = **11.6%** | ? |
| driver 5 **level**(현행) | (원전에 대응 없음) | ? |

🔴 **B안이 0.501%를 재현하지 못하면 "B안은 원전 근사"라는 주장이 무너진다.** 그 경우 §2의 판정 근거에서 B안 언급을 빼고 그 사실을 보고할 것.
🔴 **차이가 나면 원인을 추정하지 말고 수치와 함께 그대로 보고**한다(예: 필요현금 2% 적용 여부·무이자 판별 차이).

산출: `docs/probe_875_anchor.json`

---

## §2 — driver 4 판정 확정

진행표 **3행(driver 4)** ③칸을 `🔴 대기` → **`✅ 현행 유지(원전 미채택) — 2026-08-02 장은태 승인`** 으로 바꾸고 각주를 단다.

> **결정**: driver 4를 원전 증분식(T4)으로 **교체하지 않는다.** 현행 `(유동자산 − 현금 − 유동부채) ÷ 매출` 5년 평균을 유지한다.
>
> 🔴 **원전과 다르다는 사실을 인정하는 결정이다.** 원전 T4는 **증분식 + 5년 누적**(`I31 = (I23−D23)÷(I26−D26)`)이고 **무이자 유동부채만** 차감한다(`Tutorial 4` B23 *"non-interest bearing"*, `C44`에서 `C40` 제외). 우리는 **수준형**이고 **유동부채 전액**을 뺀다.
>
> **그럼에도 유지하는 근거**
> 1. **다모다란이 우리 방식을 명시적으로 권고한다** — *"non-cash working capital **as a percent of revenues**"*. 우리 현행이 바로 그 형태다.
> 2. **원전 증분식의 불안정성이 문헌에 기록돼 있다** — *"unstable, with big increases in some years followed by big decreases"* · *"negative? … clearly yes"*. 도미노 연도별 −26.7%~+18.2%가 그 예다.
> 3. **집계가 세부 분해보다 낫다는 근거** — *"composite … often more accurate than breaking it down into more detail"*. 874 실측도 같은 방향(A안 65/515 = **12.6%**, 병목 `AccruedLiabilities` 284 결측).
> 4. **원전식으로 바꿔도 결과가 크게 안 바뀐다** — 874: `years` 177→165(−12) · GAP 중앙 11→10 · 유출12/유입4. **바꿀 이유가 약하다.**
>
> 🔴 **남는 사실(숨기지 않는다)**: 우리는 **유동부채 전액**을 빼므로 **단기차입금이 운전자본에 섞인다.** 원전은 명시적으로 제외한다. 이는 차입이 많은 기업에서 운전자본을 과소평가한다. 🔴 **그 크기는 미측정**(§4 미결).
>
> 🔴 **재검토 조건**: 위 "단기차입금 혼입"의 크기를 재고 그것이 판정에 유의미하면 다시 연다.

## §3 — 🔴 driver 5: "확정"을 **근거 부재**로 강등

진행표 **4행(driver 5)** ③칸을 `🔴 대기` 유지하되, **아래를 각주로 단다.**

> 🔴 **852의 "확정"에 근거가 없다(875 확인).**
> 현행 주 판정은 `fixedCapitalRateLevel = mean(PP&E 장부가 ÷ 매출)`이다(`drivers.ts:167·191`). 이 지표는
> ⓐ **원전에 없다** — T5는 증분 투자율(`(capex+인수−D&A) ÷ Δ매출`)만 쓴다. PP&E 잔액 ÷ 매출은 T5 어디에도 없다.
> ⓑ **다모다란 권고도 아니다** — 그의 운전자본 권고(% of revenues)는 driver 4에 적용되지 rate-of-reinvestment에는 적용되지 않는다. `PP&E ÷ 매출`은 **자본집약도**이지 재투자율이 아니다.
> ⓒ **registry가 "level + marginal 이중 산정"이라 적었으나, 코드는 원전 아닌 level을 주 판정으로 쓴다**(`:191`). 그 사실이 문서에 없었다.
>
> **874 실측**: marginal 적용 시 `years` 177→**128**(−27.7%) · 계산불가 **50**(Δ매출=0) · 유출 41(비교가능 기준) 또는 57(계산불가 포함) / 유입 8.
> 🔴 **`level`은 감가상각된 장부가라 성숙 기업일수록 작게 나오고, 작으면 FCF가 커져 `years`가 나오기 쉽다** — *"이 주가는 설명된다"*고 말하기 쉬운 쪽으로 편향돼 있을 수 있다.
>
> 🔴 **그러나 원전식(marginal)으로 바로 갈 수도 없다** — 계산불가 50사(9.7%)와 극단값 133(25.8%)이 남는다.
> → **driver 5는 "현행 유지"도 "원전 채택"도 근거가 부족한 상태다. 제3의 방식(다모다란 sales-to-capital·capex 기반 재투자율 등)을 재는 것이 남았다.** 🔴 **이번 STEP에서 재지 않는다.**

🔴 **registry.ts는 고치지 말 것** — 코드 동기화는 별건(`§10` 기존 미결).

## §4 — 문서

- `docs/REVDCF_SPEC.md`
  - 차이 원장 driver 4 행 최종화(§2 요약) · driver 5 행에 **근거 부재** 명시
  - §11 실측 원장에 874·875 수치
  - 🔴 §10 미결 **신규 3건**:
    ① *"driver 4가 유동부채 전액을 차감해 단기차입금이 운전자본에 섞인다 — 크기 미측정"*
    ② *"driver 5는 현행·원전 어느 쪽도 근거 부족. 제3 방식(sales-to-capital 등) 미측정"*
    ③ 🔑 **"원전은 세 층이 서로 다른 값을 갖는다"** — 고정자본 튜토리얼 계산 **11.6%** / 책 **10.0%**(T5 B52·page 92) / T8 워크북 **15%**, 운전자본 **0.5% / 3.2%**(T4 B32) / **10%**. **우리는 T8을 원전으로 본다 — T8만이 출력을 검증할 수 있는 층이기 때문이다**(도미노 $285.20·8년 오차 0.0000). 튜토리얼은 절차를 가르치고, 책은 서술하고, **T8은 실행된다.** 🔴 책 미보유로 이 선택은 **재검토 가능**하다.
- `docs/PRIMARY_SOURCE_MAP.md`에 §0(다모다란)·§1(앵커) 결과를 **추가**한다(기존 내용 삭제 금지).
- `docs/LENS_DEV_PLAYBOOK.md` **#74**:
  - **문제**: 852가 driver 5를 "확정"으로 닫았으나, 주 판정에 쓰는 `level`이 **원전에도 문헌에도 근거가 없었다.**
  - **원인**: registry가 *"level + marginal 이중 산정"*이라 **중립적으로** 적어, **어느 쪽이 주 판정인지가 문서에 없었다.** 코드(`:191`)를 열어야만 보인다.
  - **교훈**: 🔑 **"둘 다 계산한다"는 서술은 "무엇을 쓰는가"를 감춘다. 두 방식을 병기할 때는 어느 쪽이 주 판정인지 문서에 명시한다.**
- `docs/STATE.md` "▶ 다음" 갱신 — driver 4 완료 · driver 5 근거부재로 재개방. 🔴 1~2p 상한 유지.

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/   # 🔴 출력 없어야 함
```

```sql
select as_of, count(*) from revdcf_results group by as_of order by as_of desc;  -- 604 ×3
select count(*) from us_market_cap;                                             -- 5,886
```

```bash
git add scripts/probe_875_dominos_anchor.ts docs/probe_875_anchor.json \
        docs/LENS_COMPLETION_STANDARD.md docs/REVDCF_SPEC.md docs/PRIMARY_SOURCE_MAP.md \
        docs/LENS_DEV_PLAYBOOK.md docs/STATE.md docs/CHANGELOG.md docs/STEP_875_COMMAND.md
git commit -m "STEP 875: close working capital as keep-current, reopen fixed capital as unsupported

- run the Domino inputs through our own formulas to test the anchor 874 did not test
- working capital stays on the level ratio: Damodaran recommends non-cash working capital as
  a percent of revenues, records that year-to-year changes are unstable and often negative,
  and prefers a composite figure to a detailed breakdown, which matches our 12.6 vs 99.8
  percent coverage result; switching moves only 12 names
- record the cost we accept: we deduct all current liabilities where the source deducts only
  non-interest-bearing ones, so short-term debt leaks into working capital, size unmeasured
- fixed capital is downgraded from decided to unsupported: the level ratio we actually use is
  capital intensity, absent from the source and not what Damodaran recommends, and registry
  described both forms without saying which one the engine reads
- note that the source itself carries three different figures per driver and that we treat the
  T8 workbook as authoritative because it is the only layer whose output we can verify
- playbook #74: saying both are computed hides which one is used
- documents and one probe; no engine change, flag unchanged"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 앵커: driver4 B안 → ?(기대 0.501%) · A안 → ? · driver5 marginal → ?(기대 11.6%) · level → ?
        🔴 재현 실패 시 그 사실과 수치
§2 진행표 3행 ③ = ✅ 현행 유지 · 각주 4근거 + 남는사실 + 재검토조건
§3 진행표 4행 ③ = 🔴 대기 유지 + 근거부재 각주(ⓐⓑⓒ)
§4 SPEC 차이원장·§11·§10 미결 3건 · PRIMARY_SOURCE_MAP 추가 · 플레이북 #74 · STATE
무변경: revdcf_results 604×3 · us_market_cap 5,886 · lib/app/components/messages diff 없음
tsc 0 · test ?/? · push ?
🔴 못 한 것 · 미측정
```

🔴 **driver 5의 제3 방식을 재지 말 것. 다음 행 착수를 제안하지 말 것.**
