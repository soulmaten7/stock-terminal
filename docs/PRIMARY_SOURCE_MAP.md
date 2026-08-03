<!-- 2026-08-02 · 작성 = Cowork · 원본 직접 개봉 판독본 -->
# 원전 명세 지도 — T3~T7 스프레드시트 직독

> **성격**: 발췌·요약이 아니라 **원본 셀 수식을 그대로 옮긴 판독본**이다. 각 항목에 **원본 파일·시트·셀 좌표**를 붙였다.
> **왜 만들었나**: 차이 9행을 한 행씩 판정하는데, 지금까지의 판정 근거가 **원본이 아니라 이전 STEP의 요약 문장**에 기대어 있었다. 2026-08-02 하루에 그런 인용이 **여섯 번** 뒤집혔다(플레이북 #72).
> **원본**: `data/sources/expectations-investing/T{3,4,5,6,7}.xlsx` · 🔴 **T1·T2는 없다**(튜토리얼 #1·#2 404).

---

## §1. driver 3 — 세율 (T6 + T7)

### 원전이 실제로 하는 것

**T6 `Cash Tax Rate` 시트** — NOPAT용 세율

```
Deferred taxes        = 세금비용 − 현금납부세금        (Inputs!C17 − Inputs!C26)
Current cash taxes    = 세금비용 − Deferred            (= 현금납부세금)
Tax shield            = 이자 × 장부세율                (Inputs!C14 × Inputs!C20)
Unlevered cash taxes  = Current cash taxes − Tax shield   ← 이자가 음수라 실제로는 더함
Cash tax rate         = Unlevered cash taxes ÷ EBITA   (Inputs!C13)
```

정의(T6 `Tutorial 6` B15·B16):
> *"**Unlevered.** …we remove this distortion by calculating a company's tax burden **assuming a company was 100% equity financed with no debt.**"*
> *"the percent of pre-tax **operating** profits a company would pay in cash taxes … assuming it was 100% equity financed."*

B36: *"we **increase** the tax onus by the taxes shielded by debt."*
각주 B52: *"For Domino's, we assumed that deferred taxes were the difference between the tax provision and cash taxes paid."* → **Advanced는 대수적으로 "현금납부세금"이 된다.**

**🔴 원전은 방법을 둘 제시한다** (T6 B20~B28):
- **A. Simplified** — *"just substitutes a company's **book tax rate** as a proxy"*
- **B. Advanced** — 위 3단계 조정

**T7 `Tutorial 8` 시트 B24·B26** — WACC용 세율
> *"The after-tax cost of debt-capital = The yield-to-maturity on long-term debt x (1 minus [tax rate])"*
> *"We enter the **marginal tax rate** in cell C10 of worksheet 'Inputs.'"*

### 🔑 결론 — 원전은 세율을 **두 개** 쓴다

| 쓰이는 곳 | 원전 | 우리 |
|---|---|---|
| NOPAT | **무차입 현금세율**(T6) | 한계세율 25.63% |
| WACC 세후 부채비용 | **한계세율**(T7 B26) | 한계세율 25.63% |

🔴 **우리는 하나를 양쪽에 쓴다** — `app/api/cron/revdcf/route.ts`: `const drv = {...dr.drivers, taxRate: usTax}` 와 `assembleWacc({… taxRate: usTax …})`가 **같은 값**.
→ **driver 3의 진짜 차이는 "현금세율이냐 한계세율이냐"가 아니라 "세율이 하나냐 둘이냐"다.**

### 🔴 기존 기각 사유가 성립하지 않는다

`REVDCF_SPEC` §622·§966·§1311이 든 이유:
> ~~*"현금세율은 이자 세금방패를 이미 반영 → WACC 세후 부채비용에서 또 세는 **이중 계산**. **다모다란 지적**을 따름"*~~

1. **T6 현금세율은 unlevered** — 방패를 **빼낸** 값이다. "이미 반영"이 아니다.
2. **원전은 WACC에 현금세율을 쓰지 않는다**(T7 = 한계세율). 이중계산이 발생할 구조가 아니다.
3. **다모다란 출처 미확인** — 그의 세율 Q&A(`pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/taxrate.htm`)는 이자 방패 이중계산을 **다루지 않는다.**

### ✅ 결론은 살아남는다 — 다른 근거로

다모다란 원문 직인용:
> *"the safer choice is the **marginal tax rate** because none of the reasons noted above can be sustained in perpetuity."*
> *"It is critical that the tax rate used **in perpetuity to compute the terminal value** be the marginal tax rate."*

우리 모델은 25년 + 터미널이고 **터미널 비중이 크다**(원전 관찰 중앙 79.6%). → 한계세율 유지의 근거는 **"이중계산"이 아니라 "영구 구간 = 한계세율"**이다.
🔴 단 그는 *"1년차는 실효세율로 시작해 시간에 걸쳐 한계세율로 수렴"*도 허용한다. **우리 단일 세율 구조에서는 불가**(driver 1의 페이드 문제와 같은 자리).

### 🔴 열린 것
- **커버리지 58%(847)를 다시 재야 한다** — 840이 *"이자 절벽 = frames 미부여 아티팩트, companyfacts엔 존재"*를 발견했고 862가 *"무차입 37 / 진짜결측 24"*를 분리했는데 **847은 둘 다 이전**이다. T6에서 이자는 **tax shield에만** 쓰이므로 무차입이면 0이고 병목이 아니다.
- **원전 A안(장부세율)이 미검토** — 원전이 명시적으로 제시한 방법인데 후보에 없었다.

---

## §2. driver 4 — 운전자본 (T4)

**`Working Capital Analysis` 시트**

```
Cash                          = 매출 × 0.02          ← C5 = Inputs!C5*0.02
A/R · Inventory · Other CA    = 실제 값
Current operating assets      = SUM(위 4)
Current operating liabilities = SUM(무이자 4항목)
Net working capital           = 자산 − 부채
Incremental WC                = 당해 − 전년
Incremental WC (% of sales)   = ΔNWC ÷ Δ매출          ← 연도별
🔴 5년 누적                    = (I23−D23) ÷ (I26−D26)   ← I31
```

**무이자만 차감이 명시돼 있다** — `Tutorial 4` B23: *"Other **non-interest bearing** current liabilities."*
그리고 `C44 = C39+C41+C42+C43`로 **`C40`(current portion of long-term debt)을 합계에서 뺐다.**

각주 B32: *"in the book we do **not** consider other current assets, so the calculations are slightly [different]"* → **책과 스프레드시트가 다르다.**

### 대조
| | 원전 | 우리 |
|---|---|---|
| 필요현금 | **매출 × 2%** | (미확인 — 우리 정의 확인 필요) |
| 유동부채 | 무이자만 | 847 판독 **✅ 맞음** |
| 산출 방식 | **5년 누적**(I31) | 수준형 5년 평균 |

✅ **847의 T4 판독은 옳았다.** 다만 registry가 *"단기차입금 미차감 → **태그부족 우회 가설**"*이라 적었는데, **가설이 아니라 원전에 명시된 설계다**(B23).

🔴 **비대칭**: 원전은 T4·T5 **둘 다** 5년 누적식인데, 우리는 **driver 5만 원전식(marginal)을 병기**하고 **driver 4는 수준형만** 쓴다.

🔴 **849와 충돌 가능성(미확인)**: T4는 **매출 2%를 운전자본에 묶인 현금**으로 본다. 그런데 `registry.nonOperatingAssets`는 *"✅ 849: A(전액) 채택 … **원전 그대로**"*다. **T8의 비영업자산 처리를 확인해야 판정 가능.**

---

## §3. driver 5 — 고정자본 (T5)

**`Cash Flow Method` 시트**

```
Total Gross Fixed Capital Investments = capex + 인수(net of cash acquired)
Net Fixed Capital Investments         = 총투자 + D&A        ← D&A 음수라 실제로는 차감
Incremental Fixed Capital Rate        = −순고정투자 ÷ Δ매출   ← 연도별 (E18)
🔴 5년 누적                            = −(E13+…+I13) ÷ (E16+…+I16)   ← I20
```

`Tutorial 5` B18~B21이 포함 항목을 나열: capex · 자본화 소프트웨어 · 기타 투자활동(순) · **인수**.
B23: *"we need to **deduct depreciation**"*.

### 대조
✅ **852의 marginal 방식(*"원전 T5 5년누적 순고정÷5년누적Δ매출"*)이 T5 `I20`과 정확히 일치한다.** 인수 포함도 맞다.
→ **driver 5는 원전식이 이미 구현돼 있고 `revdcf_results`에 `fixed_capital_rate_marginal`·`verdict_marginal`로 매일 저장된다.**

🔴 **level(수준형)이 우리 추가물**이다 — 원전에 없다. 대조표 어느 칸에 있는지 확인 필요.

---

## §4. driver 6 — 자본비용 (T7)

**`Tutorial 8` 시트** — 3단계
1. **구성요소** — 부채: *"after-tax cost of debt = **yield-to-maturity on long-term debt** × (1 − 한계세율)"* · 자기자본: **CAPM** = 무위험 + 베타 × 시장위험프리미엄
2. **자본구조** — 부채·자기자본 비중
3. **가중**

### 대조
| | 원전 | 우리 |
|---|---|---|
| 부채비용 | **회사별 실제 YTM** | 다모다란 **업종 신용스프레드** |
| 베타 | (T7 Inputs) | 다모다란 **업종 무차입 베타** |
| 세율 | **한계세율** | 한계세율 ✅ |

🔴 registry `costOfCapital`이 아직 **미결**이다 — 849가 조립을 배선했으나 `divergence`가 ✅로 안 바뀜. **차이 9행 중 registry에서도 미결인 유일한 행.**

---

## §5. driver 2 — 영업이익률 (T3)

`Margins` 시트: `C14 = C12/C5` = 영업이익 ÷ 매출. 영업이익 = 매출총이익 − SG&A − 광고비.
`Tutorial 3` B46: *"How Do We Estimate A Company's **Future** Operating Profit Margin?"* → B48: *"using one of **four methods**"*.

🔴 **원전은 미래 마진 추정에 네 가지 방법을 제시한다.** driver 1과 같은 구조(앞을 본다)인데, **대조표는 driver 2를 "동일 8행"에 넣었다.** 계산식은 같지만(도미노 17.39% 일치) **추정 방식은 대조된 적이 없다.**

---

## §6. driver 4 — 다모다란 반대증거 재확인 (STEP 875 §0)

**Damodaran, *Working capital in valuation*** (`pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/noncashwc.htm`)

> *"Changes in non-cash working capital are **unstable**, with big increases in some years followed by big decreases in the following years."*
> *"can the change in non-cash working capital be negative? The answer is **clearly yes**."*
> *"The non-cash working capital **as a percent of revenues** can be used, in conjunction with expected revenue changes each period, to estimate projected changes in non-cash working capital over time."*
> *"For most firms, estimating a **composite number** for non-cash working capital is easier to do and often **more accurate than breaking it down into more detail**."*

**이것이 판정하는 것**: 우리 현행(driver 4 = `(유동자산−현금−유동부채)÷매출` 5년 평균)이 정확히 *"as a percent of revenues"* 형태다 — 우리 발명품이 아니라 이유가 붙은 실무 방식. *"composite ... more accurate than detail"*은 A안(세부 태그·874 커버리지 12.6%)보다 B안(집계·99.8%)을 지지하는 방향과 일치. 원전 증분식의 불안정성(*"unstable"*·*"clearly negative"*)은 도미노 연도별 −26.7%~+18.2%가 예다.

🔴 **driver 5에는 이 근거가 적용되지 않는다.** `PP&E÷매출`은 자본집약도이지 재투자율이 아니고, 다모다란의 위 권고는 driver 4(운전자본)에 관한 것이지 driver 5(고정자본 재투자율)에 관한 것이 아니다.

## §7. driver 4·5 — 도미노 앵커 재현 (STEP 875 §1)

874가 "원본 셀이 그 값을 낸다"만 확인했지 "우리 공식으로 돌려서 재현되는가"는 안 했다. `scripts/probe_875_dominos_anchor.ts`가 도미노 입력을 그대로 하드코딩 전사해 우리 세 공식을 돌린 결과:

| 공식 | 기대값(원전 셀) | 우리 결과 | 재현 |
|---|---|---|---|
| driver 4 A안(874 코드·AP+Accrued태그만) | T4 `I31`=0.501% | **4.219%** | ❌ 미재현(Advertising fund·Other accrued 2항목 미포착) |
| driver 4 A안(T4 4항목 전부) | 동상 | **0.501%** | ✅ 정확 일치(공식구조 검증) |
| driver 4 B안(집계 근사) | 동상 | 테스트 불가 | — `T4.xlsx` `Inputs`에 진짜 현금·이자부부채·집계잔액 데이터 자체가 없음(참고: 다른 3년창 2014→2017 = −1.181%, 직접비교 불가) |
| driver 5 marginal(원전식) | T5 `I20`=11.6% | **11.617%** | ✅ 정확 일치 |
| driver 5 level(현행 주판정) | 원전에 대응 없음 | 테스트 불가 | — T4·T5·T8 어디에도 PP&E 잔액 데이터 없음 |

🔑 **결론**: driver 5 marginal은 공식·데이터 양쪽에서 원전과 검증됐다(11.617%≈11.6%). driver 4는 공식 구조는 맞으나(원전 4항목 전부=0.501% 정확 일치), 실제 코드가 쓰는 SEC 태그 근사(AP+Accrued 2종만)로는 도미노 같은 사례에서 원전값을 재현하지 못한다 — 태그 매핑의 한계이지 공식 오류가 아니다. B안·level은 원전 데이터 자체가 없어 앵커 테스트가 원천 불가능하다(이는 "재현 실패"와 다른, 더 근본적인 사실).

## §8. driver 4 — A안 커버리지 근거 보정 + 도미노(DPZ) 실제 데이터 재확인 (STEP 876)

875의 앵커가 874의 A안(AP+`AccruedLiabilitiesCurrent` 2종)을 8배 틀리게 만들었음을 밝혔다. **그러면 874가 낸 "A안 커버리지 12.6%"는 원전 방식의 커버리지가 아니라 그 틀린 구현의 커버리지였다.** 876이 다시 잰다.

**태그 전수 스캔(목록을 미리 정하지 않음)** — 515사 companyfacts에서 무이자 유동부채성 태그(`Liabilit`+`Current`, 이자부·리스·총계·중단영업 제외) 후보 36종을 실제로 세었다. 상위: `EmployeeRelatedLiabilitiesCurrent`(349사)·`OtherAccruedLiabilitiesCurrent`(240)·`AccruedLiabilitiesCurrent`(231)·`OtherLiabilitiesCurrent`(226) 등.

**확장 A안 재측정**: 빈도 상위 6종을 채택해 재계산 → 커버리지 **65/515(12.6%) → 152/515(29.5%)**. 개선됐지만 **B안(99.8%)엔 크게 못 미친다.**

**🔑 도미노(DPZ)는 우리 유니버스에 실존한다(CIK 1286681)** — 튜토리얼 고유 라벨이 아니라 실제 SEC 등록기업이다. DPZ의 2019 XBRL을 직접 열어 T4의 4항목과 대조:

| T4 항목(2019 값) | DPZ 실제 XBRL 태그 |
|---|---|
| AP(111.101M) | `AccountsPayableCurrent` — **정확 일치** |
| Other accrued liabilities(66.267M) | `OtherAccruedLiabilitiesCurrent` — **정확 일치** |
| Accrued expenses(131.148M) | **일치하는 태그 없음**(`AccruedLiabilitiesCurrent`는 DPZ가 2012년 이후 미사용) |
| Advertising fund liabilities(101.921M) | **일치하는 태그 없음** |

🔑 **결론**: 태그를 더 정교하게 골라도 이 간극을 못 메운다. Rappaport가 튜토리얼에서 세부 4분류한 것은 재무제표 주석(footnote) 수준의 수기 재분류였고, **오늘날 DPZ 자신의 표준 XBRL에도 그 세부 개념이 개별 사실(fact)로 남아 있지 않다.** 이건 우리 태그 매핑의 한계가 아니라 원전 세부 분류와 현대 XBRL 공시 관행 사이의 근본적인 간극이다.

🔴 **driver4 판정(✅ 현행 유지)은 이 결과와 무관하게 유지된다** — 판정을 지탱한 근거는 다모다란의 실무 권고(§6)와 원전 증분식의 불안정성(§0/§6)이지, A안의 커버리지 숫자가 아니었다. "커버리지가 낮아서 집계를 택했다"는 근거 하나만 철회됐다.

## 🔴 이 지도가 바꾸는 것

| 행 | 기존 상태 | 원본 개봉 후 |
|---|---|---|
| driver 3 세율 | ✅ 확정(847) | **결론 유지 · 근거 3개 중 2개 무효** · 원전은 세율 **둘** · A안 미검토 · 커버리지 재측정 필요 |
| driver 4 운전자본 | ✅ 확정(847) | **판독 맞음** · "가설"→"명시된 설계" 정정 · **875: ✅ 현행 유지 최종 확정**(장은태 승인·다모다란 근거 + 도미노 앵커로 A안 태그한계 확인) · **876: 근거 하나 철회**(A안 12.6% 커버리지는 버그의 커버리지였음·확장해도 29.5%뿐·판정은 불변) |
| driver 5 고정자본 | ✅ 확정(852) | ✅ marginal은 **원전식과 정확히 일치**(875 앵커 11.617%) · **level(현행 주판정)은 875에서 "확정"→🔴 근거 부재로 강등**(원전에도 다모다란에도 근거 없음·앵커 테스트 불가) |
| driver 6 자본비용 | 🔴 미결 | 원전 = 회사별 YTM · 우리 = 업종 스프레드 |
| driver 2 영업이익률 | 동일 8행 | 🔴 **미래 마진 추정 4방법이 대조된 적 없음** |
| 비영업자산 | ✅ 849 "원전 그대로" | 🔴 **T4의 매출 2% 필요현금과 충돌 가능** (T8 확인 필요) |

🔴 **판정은 하지 않았다.** 이 문서는 재료이고, 각 행의 ③판정은 장은태 몫이다.

## 🔴 아직 안 연 것
- **T8** 비영업자산·필요현금 처리(§2·§6 충돌 확인용) · **T9·T10**
- 원전 **책 본문**(스프레드시트 각주가 *"in the book we do not consider…"*로 책과 다름을 두 번 명시)
