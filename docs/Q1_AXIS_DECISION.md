<!-- 2026-08-10 · Cowork 작성 · 🔴 판정 자료 (판정 아님) · STEP 978 -->

# Q1 축 구성 — 「4축 병렬」 vs 「업종별 대표 배수」 판정 자료

> **이 문서는 자료다. 판정 = 장은태.**
> 원자료 = `docs/probe_978_axis_selection.json`. 972가 이미 확보한 것(`docs/Q1_CARD_DESIGN.md` §2·§3)은 재조사하지 않고 인용만 했다 — 이 문서는 그 결론의 전후맥락·반대증거·자체데이터를 보강한다. **화면·문구·위치는 이번 STEP 범위 밖(손대지 않음).**

---

## §1 원전이 실제로 무엇을 말하는가 (맨 앞)

**972의 "업종마다 배수를 하나만 고른다" 해석은 틀리지 않았다 — 전후맥락을 보니 오히려 더 강하게 확인된다.**

`relval.pdf` 슬라이드 176(972가 인용한 177-179 바로 앞, 이번에 새로 확인):
> *"Since there can be only one final estimate of value, there are three choices at this stage: • Use a simple average of the valuations obtained using a number of different multiples • Use a weighted average of the valuations obtained using a number of different multiples • Choose one of the multiples and base your valuation on that multiple"* — 이어서 *"Picking one Multiple — This is usually the best way to approach this issue."*

Damodaran은 "여러 배수의 (가중)평균"을 대안으로 **명시적으로 검토했고**, 그걸 제치고 "하나 고르기"를 "보통 가장 좋은 방법"이라 택했다. 이건 특정 수업 예제나 업종 이론에 한정된 말이 아니라 **일반 방법론 지침**이다(분석가가 여러 배수로 낸 값을 하나의 최종 추정치로 합칠 때의 권고).

**그런데 반대 방향 서술도 우리 자산(A-0)에 이미 있었다 — 972가 못 본 것.** `docs/USER_QUESTIONS_2026-08-08.md`(Q1 C안 확정 근거 1번, 2026-08-08 장은태 기존 인용)이 Mauboussin을 인용한다: *"원전이 배수를 부정하는 건 「혼자 쓸 때」다… 가린 것을 드러내면 배수와 역DCF는 충돌이 아니라 한 쌍."* 원문(Mauboussin, "Everything Is a DCF Model")을 직접 대조 확인: *"valuation using multiples does not avoid the drivers of long-term cash flows but rather obscures them… You have to earn the right to use a multiple… ask what you have to believe about the value drivers to justify today's price."*

🔴 **그러나 이 두 인용은 서로 다른 질문에 답한다 — 직접 충돌하지 않는다.**
- Damodaran(관련 질문: **"4개의 다른 배수 중 무엇을 최종 대표로 삼을까"**) → 답: 하나 고른다.
- Mauboussin(관련 질문: **"배수(어떤 배수든 하나) 하나를 DCF와 어떻게 짝지을까"**) → 답: 명시적 역DCF와 짝짓는다.

Mauboussin은 "PER·PBR·PSR·EV/EBITDA를 나란히 보여줘라"고 말한 적이 없다 — 이 인용은 **Q1의 "배수+역DCF" 구조 자체**(C안 확정의 근거)를 정당화하지, **"몇 개의 다른 배수를 동시에 보여줄까"**를 정당화하지 않는다. 972가 "①-A와 ①-B가 서로 다른 방법으로 같은 결론에 도달했다"고 정리한 것은, 두 원전이 **애초에 다른 질문**에 답하고 있었다는 사실을 놓쳤을 수 있다.

**업종별 대표 배수 표는 GICS 11개 섹터를 못 채운다.** Damodaran 표 = Cyclical Manufacturing·High Tech High Growth·High Growth No Earnings·Heavy Infrastructure·REIT·Financial Services·Retailing(7개, 972 인용). 우리 GICS 11개와 직접 대응 = Financial Services→Financials·REIT→Real Estate·Retailing→Consumer Discretionary(부분) 정도뿐. **나머지 7~8개 섹터는 원전에 대응표가 없다** — 채우려면 우리가 만들어야 하고, 그건 CLAUDE.md 창작 금지(규칙 3)에 걸린다.

**백분위(percentile) 방법 자체가 원전에 없다.** `relval.pdf` 전문(47p) 검색 0건. 대신 원전은 **중앙값**을 명시 권장한다: *"The median for this multiple is often a more reliable comparison point."* + *"Multiples have skewed distributions: The averages are seldom good indicators."* — 🔴 단, 이건 새로운 문제가 아니다. `docs/VALUATION_SPEC.md`(STEP 952)가 이미 **"원전 없음 — 규칙 5-1 트랙… 우리가 고른 산술 방법"**이라고 스스로 명시해뒀다 — 숨긴 적이 없다. 이번에 새로 확인된 건 "그 대안이 구체적으로 무엇이었는가"(중앙값)뿐이다.

---

## §2 타 플랫폼 실제 조회 (은행·리츠·유틸리티, 3곳)

| 플랫폼 | 종목 | EV/EBITDA | 업종비교 방식 | 헤드라인 |
|---|---|---|---|---|
| stockanalysis.com | JPM(은행) | **없음("n/a")** | 없음(이 페이지엔) | 암묵적 PER |
| stockanalysis.com | O(리츠) | 있음 | 없음 | **Price/FFO**(PE보다 상단 — 5번째 지표 추가) |
| stockanalysis.com | DUK(유틸리티) | 있음 | 없음 | 암묵적 PER |
| WallStreetZen | JPM(은행) | **없음** | **평균**(업종·시장) | 명시적 PER |
| MarketBeat | JPM(은행) | **없음** | **평균**(업종·시장) | 명시적 PER, 축간 불일치 설명 없음 |

**종합**: 은행 EV/EBITDA 제외는 3곳 다 일치(우리 SECTOR_AXIS_APPLICABILITY.md의 조건부 판정과 정합). **REIT는 "하나만"이 아니라 "4개+FFO 1개 추가"** — Damodaran의 "업종당 하나" 원칙을 실제로 따르는 곳은 이번 3곳 중에도 없다. 업종비교는 확인된 곳 전부 **평균**(백분위·중앙값 둘 다 0곳). 축간 불일치를 설명하는 곳은 0/3(972의 3곳 관찰과 동일 방향, 6곳 누적 전부 미설명).

---

## §3 자체 데이터 (as_of=2026-08-09)

**44칸 재계산 — 41/44 성립(개선, 08-08엔 더 많이 빔).** 실패 3칸: Financials×EV/EBITDA(n=17) · Real Estate×PER(n=13) · Real Estate×EV/EBITDA(n=4).

**원전 지정 축과 우리 성립 축 대조**:
- Financials→PBV(원전 지정): 우리 n=79 **성립** — 일치.
- Real Estate→P/CF(원전 지정): **우리 4축에 P/CF 자체가 없다.** 우리가 지금 성립시키는 축(PBR n=20·PSR n=21)은 원전이 REIT에 지정한 축이 아니다. 실무(§2, stockanalysis O)는 또 다른 지표(P/FFO)를 쓴다 — **원전·실무·우리, 셋의 REIT 대표축이 전부 다르다.**

**축간 답 갈림 — 처음 측정**(4축 전부 성립하는 465종목):

| 성립 축 수 | 종목 수 | 중앙값 스프레드 | p90 스프레드 |
|:--:|--:|--:|--:|
| 2 | 164 | 16.4%p | 67.1%p |
| 3 | 246 | 32.1%p | 71.2%p |
| **4** | **465** | **31.6%p** | **62.3%p** |

🔑 972가 AAPL 하나로 보였던 52%↔97%(45%p 차)는 예외가 아니다 — **4축 다 있는 종목의 절반이 31.6%p 이상 갈린다.**

---

## §4 선택지와 대가 (고르지 않음)

### A. 현행 유지(4축 병렬 + 백분위)

- 원전 근거: **없음.** Damodaran은 "평균/가중평균"을 검토 후 기각했고(§1), 백분위 자체도 원전에 없다(중앙값 권장). 단 VALUATION_SPEC.md가 이미 "원전 없음"으로 정직히 공개해둠(규칙 5-1 준수 상태).
- 실무 근거: 부분적 — 3곳 다 "여러 배수 동시 표시"는 하나(백분위는 안 씀, 헤드라인 위계는 있음 — 지금 우리는 위계 없이 4축 대등).
- 우리 데이터 성립: 41/44(93%).
- 버리는 것: 없음.
- 커버리지 변화: 없음.

### B. 업종별 대표 배수 하나로 전환(Damodaran 방식 그대로)

- 원전 근거: **있음**(§1, "usually the best way"). 단 11개 섹터 중 3~4개만 대응표가 있고 나머지는 우리가 채워야 함 = **창작 금지에 걸림**(규칙 3).
- 우리 데이터 성립: Financials→PBV은 성립(n=79). **Real Estate→P/CF는 그 축 자체가 우리에게 없어 전종목 미성립**(신규 데이터 파이프라인 필요 — 958/959가 이미 "Q1 전체 재설계급"이라 평가).
- 버리는 것: 선택 안 된 3축의 백분위 계산·저장 전부(코드·DB 상당 부분 폐기).
- 커버리지 변화: **섹터에 따라 오히려 악화 가능** — Real Estate는 지금(PBR/PSR로 20/21종목 성립)보다 원전을 그대로 따르면(P/CF 미보유) 더 나빠지는 역설적 사례.

### C. 절충 — 4축 다 계산하되 헤드라인 하나만 승격, 나머지는 부축

- 원전 근거: 실무 3곳 전부 이 패턴(헤드라인 1개+부축). Damodaran과는 "최종 하나"라는 점에서 방향은 같으나 "나머지도 보여준다"는 점에서 완전히 같진 않음. Mauboussin과는 배치 안 됨(어느 축이든 하나를 명시적 역DCF와 짝지으면 됨).
- 우리 데이터 성립: 지금과 동일(41/44) — 계산은 그대로, 표시 위계만 바뀌는 문제라 **화면 변경**(이번 STEP 범위 밖).
- 버리는 것: 없음(계산 유지).
- 커버리지 변화: 없음.

### D. 백분위 → 배율/평균 병기(실무 3곳 전부 이 방식)

- 원전 근거: Damodaran은 **중앙값**을 권장(평균도 경계) — 실무는 평균을 쓴다. 우리 백분위도 실무 평균도 원전의 명시 권고(중앙값)와 정확히 일치하지 않는다.
- 우리 데이터: 계산 로직 자체 교체 필요(코드 변경, 이번 STEP 범위 밖). minSample(20) 조건도 재검토 대상이 될 수 있음(평균/중앙값은 표본이 적어도 낼 수 있어 성립 기준 자체가 달라질 수 있음 — 미검토).
- 버리는 것: `sectorPercentiles()`(`lib/sectorRelative.ts`) 로직.
- 커버리지 변화: 계산방식 변경만으로는 미미할 것으로 추정되나 실측 안 함.

---

## §5 (STEP 979 추가) 계산방식 전환 사전 실측 — 백분위 → 중앙값 대비

> 판정(Cowork, 장은태 위임): **업종 대비는 중앙값 대비로 간다**(셋 중 유일하게 원전 근거가 있는 방식 — 백분위는 원전 없음[952 자백]·평균은 Damodaran이 경계). **이번 STEP은 교체하지 않는다** — 영향만 실측했다. 업종별 대표배수(§4 선택지 B)는 **보류**(11섹터 중 7~8개를 채워야 해 창작 금지 위반) — Financials=PBV·REIT=P/FFO 근거만 기록해두고 표시 판정 때 재론.

**①-A-2(음수 처리, 이 STEP의 성패) — ⓐ 원전에 처리 규칙이 있다.** `ch19.pdf`(Investment Valuation): 음수 자기자본이면 *"price to book ratios cannot be computed"*(5,903개사 중 728개사 실측). `pedata.xls` FAQ: PE는 *"averaged across all money-making firms"*만. 웹검색으로 4축 전체에 일반화 확인: *"this same issue applies to firm value to EBITDA multiples… revenue multiples[PSR]는 가장 덜 편향적."* 🔑 **우리 `lib/valuation.ts`가 이미 정확히 이 규칙**(`NEGATIVE_EARNINGS`·`NEGATIVE_EQUITY`·`NEGATIVE_REVENUE`·`NEGATIVE_EBITDA` — 963 이전부터 계산 안 함)이라, 전환과 무관하게 새로 지어낼 규칙이 없다.

**비교 형태(배율 vs %차이)·minSample 하한 — 원전에 없음.** 952의 백분위와 같은 처지(규칙 5-1 트랙, 우리가 정의를 고정해야 함).

**실무 3곳(재사용) — 배율·%차이를 명시적으로 계산해 보여주는 곳 0곳.** 원시값 두 개("35.81x vs 31.6x")를 병기하고 독자가 암산.

**자체 실측(as_of=2026-08-09)**:
- 44칸 중앙값 전부 산출됨(음수 미포함 모집단이라 중앙값 항상 양수).
- 배율을 못 내는 사례 = **0건**(음수는 이미 상류 단계에서 걸러져 있어 이 단계에서 새로 뺄 게 없음).
- 커버리지: 백분위(minSample=20 적용) = 2,961/2,995쌍. **minSample을 없애면 2,995(+34)** — 34쌍은 Real Estate×PER(13)·Real Estate×EV/EBITDA(4)·Financials×EV/EBITDA(17). minSample을 유지하면 방식과 무관하게 커버리지는 그대로(2,961).
- 순위 보존: Real Estate×PBR(n=20) 전수 대조 **20/20 완전 일치** — 수학적으로 당연(둘 다 원시값의 단조변환).
- **Real Estate 개별 확인**: PER(n=13) 상위 3종목이 중앙값의 5.5~30배(CTO 316x·VTR 590x·**CSGP 1750x**) — REIT GAAP감가상각 왜곡이 숫자로 확인됨. EV/EBITDA(n=4)는 CSGP 하나가 중앙값을 크게 끌어올림 — n=4에서 중앙값 대표성 자체가 약함(하한 없음이 실무적으로 왜 위험한지 보여주는 사례).

**④ 결론(교체 가능 여부만)**: ⓐ — 음수 처리는 이미 해결돼 있어 손댈 것 없음. 단 표시 형태·minSample 하한은 별도 판정 필요(952와 같은 "원전 없음" 트랙).

상세 = `docs/probe_979_search.md`·`docs/probe_979_median_relative.json`.

---

## §7 (STEP 980) 중앙값 배율 도입 완료 — 백분위는 대조군으로 유지

> 판정(Cowork, 장은태 위임 · 979 근거): 정본 = **업종 중앙값 대비 배율**. minSample=20 유지(원전 근거는 계속 없음, CSGP n=4 사례가 근거). 배율 상한 없음. 백분위는 삭제 안 함(전환기 대조군).

**구현**: `us_sector_relative`에 8컬럼 추가(`per_rel`·`pbr_rel`·`psr_rel`·`ev_ebitda_rel`·`per_med`·`pbr_med`·`psr_med`·`ev_ebitda_med`, 기존 컬럼 무변경). `lib/sectorRelative.ts`에 `sectorMedian()`·`sectorMedianRelative()` 신설(`sectorPercentiles()`는 무변경, 나란히 둠). `lib/sectorRelativeBatch.ts`가 두 방식을 같은 minSample 게이트로 동시 산출. `computeAndSaveSectorRelative()`(크론)가 8컬럼도 함께 upsert.

**값 불변 증명**: 구코드(980 이전) vs 신코드 — 이 STEP은 percentile 계산 로직 자체를 안 건드리므로 966·973류의 완전대조 대신, **백필 전후 md5 지문 대조**로 검증했다: as_of 2026-08-08·2026-08-09 두 날짜 모두 **지문 완전 일치**(percentile 컬럼 0건 변경).

**순위 보존(44칸 전수)**: PER 1,306쌍·PBR 1,630쌍·PSR 1,757쌍·EV/EBITDA 1,095쌍 — **전부 불일치 0건**(979의 Real Estate×PBR 20건 샘플 확인을 전체로 확장, 예측대로 100% 일치).

**커버리지**: as_of=2026-08-09 기준 축별 pct/rel 건수가 전부 정확히 동일(647↔647·792↔792·855↔855·533↔533[08-08], 659↔659·838↔838·902↔902·562↔562[08-09]) — 합계 2,961/2,995(979 예측과 정확히 일치).

**극단값**: 요청받은 CTO(316x)·VTR(590x)·CSGP(1750x)는 Real Estate×PER(n=13)이 minSample 미달이라 **DB엔 애초에 저장되지 않는다**(percentile도 동일하게 null — 상한이 아니라 minSample 게이트, 이 STEP에서 유지하기로 이미 판정된 것). 대신 **minSample을 통과한 실제 저장값 중 상위**로 무상한을 확인: LSCC(반도체) per_rel=124.4배·DKNG=114.7배 등 — 임의 절단점 없이 그대로 저장됨.

**문서**: `docs/VALUATION_SPEC.md` 「업종 대비」 절 개정(정본 전환·원전 근거·minSample/cap 판단 공개) · `docs/STATE.md` ②·④ 갱신.

상세 = `docs/probe_980_search.md`.

---

## §6 못 한 것 / 미측정 / 새로 드러난 것 / 판정이 필요한 것 (972·978·979·980 누적)

**못 한 것 / 미측정**:
- REIT용 P/CF 또는 P/FFO가 `us_fundamentals`에 이미 있는 태그로 구성 가능한지 미확인(신규 태그 발굴 필요 여부 불명).
- 나머지 7~8개 GICS 섹터의 대표배수를 어떻게 정할지(창작 금지에 걸리므로 대안 조사 자체를 이번엔 안 함).
- 축간 갈림(31.6%p)이 섹터별로 다른지(예: Financials가 다른 섹터보다 더/덜 갈리는지) — 전체 집계만 냄.
- 차단된 7곳(GuruFocus 등)은 이번에도 재시도 안 함(A-0 재사용 원칙 — 966·968·969·972 결과 그대로 인용).
- 🔴(979) 배율 표시 형태(x배 vs %차이) 결정용 추가 실무조사 — 원전·3플랫폼 다 답 없음, 못 정함.
- 🔴(979) CSGP의 GICS Real Estate 편입이 실제로 이례적인지(부동산 서비스업 vs 보유업) — 추측만, 확인 안 함.
- 🔴(980) 배율 표시 형태는 이번에도 안 정함(화면 범위 밖) — 정본 전환은 계산·저장까지만.
- 🔴(980) 백분위(대조군) 제거 시점 — 이번 STEP에서 판정 안 함, 명시적으로 유예.

**새로 드러난 것**:
- 🔑 **972의 "①-A·①-B가 서로 다른 방법으로 같은 결론"이라는 정리는 재검토가 필요할 수 있다** — Damodaran과 Mauboussin은 같은 결론이 아니라 **서로 다른 질문**(배수 여러 개 중 대표 선택 vs 배수 하나와 DCF 짝짓기)에 답하고 있었다.
- Real Estate에서 원전(P/CF)·실무(P/FFO)·우리(PBR·PSR)가 전부 다른 축을 쓴다는 삼자 불일치.
- 축간 답 갈림이 예외적 사례가 아니라 **중앙값 수준의 흔한 현상**(31.6%p)이라는 최초 실측.
- 44칸 표본 부족이 08-08 대비 08-09에 5칸→3칸으로 자연 개선됨(974의 신규 40종목 부착 효과).
- 🔑(979) **음수 처리는 이미 우리 코드가 원전과 일치** — 백분위→중앙값 전환에 새 규칙이 필요 없다.
- (979) Real Estate PER 상위 3종목이 중앙값의 5.5~30배(CSGP 1750x) — REIT GAAP감가상각 왜곡이 숫자로 확인됨.
- (979) minSample=20을 없애면 커버리지가 2,961→2,995(+34)로 느는데, 원전은 하한 자체를 언급하지 않는다.
- 🔑(980) `multiples.pdf`(Damodaran)가 절단(cap) 관행을 **평균 계산 맥락에서만** 언급하고 곧바로 "그래서 중앙값을 보라"고 잇는다 — 정본은 상한 자체가 필요 없다는 뜻으로 읽을 수 있다.
- (980) 979에서 못 찾았던 "①-A-2(음수·상한)"의 나머지 절반(상한/절단)을 `multiples.pdf` 원문에서 직접 확보 — 979는 여기까지 못 봤음(972·975가 확보한 relval.pdf·pbv.pdf·ps.pdf에는 없었다).
- (980) STEP977이 남긴 임시 비교파일 삭제가 `npm run build`를 깨뜨리고 있던 것을 이번에 발견·복구(별개 결함, 980 작업 중 우연히 tsc 실행하다 드러남).

**판정이 필요한 것**:
- 선택지 A~D 중 무엇을 택할지(또는 혼합).
- B를 완전히는 아니어도 부분 채택할지(예: Financials만 PBV 단일화, 나머지는 A 유지) — 이번 STEP에서 이 혼합 옵션 자체를 깊이 설계하지는 않았다.
- REIT 축 문제(P/CF/FFO 신규 파이프라인)를 Q1 범위에서 다룰지, 별도 STEP으로 미룰지.
- 🔴(979) 백분위→중앙값 실제 교체를 언제 할지 · 배율 표시 형태 · minSample 하한 유지 여부.
- 🔴(980) 화면에 배율을 어떤 형태(x배/%차이/중앙값 병기)로 노출할지 · 백분위 대조군을 몇 사이클 뒤 제거할지.
