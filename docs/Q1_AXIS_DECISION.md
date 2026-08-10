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

## §5 못 한 것 / 미측정 / 새로 드러난 것 / 판정이 필요한 것

**못 한 것 / 미측정**:
- REIT용 P/CF 또는 P/FFO가 `us_fundamentals`에 이미 있는 태그로 구성 가능한지 미확인(신규 태그 발굴 필요 여부 불명).
- 나머지 7~8개 GICS 섹터의 대표배수를 어떻게 정할지(창작 금지에 걸리므로 대안 조사 자체를 이번엔 안 함).
- 축간 갈림(31.6%p)이 섹터별로 다른지(예: Financials가 다른 섹터보다 더/덜 갈리는지) — 전체 집계만 냄.
- 차단된 7곳(GuruFocus 등)은 이번에도 재시도 안 함(A-0 재사용 원칙 — 966·968·969·972 결과 그대로 인용).

**새로 드러난 것**:
- 🔑 **972의 "①-A·①-B가 서로 다른 방법으로 같은 결론"이라는 정리는 재검토가 필요할 수 있다** — Damodaran과 Mauboussin은 같은 결론이 아니라 **서로 다른 질문**(배수 여러 개 중 대표 선택 vs 배수 하나와 DCF 짝짓기)에 답하고 있었다.
- Real Estate에서 원전(P/CF)·실무(P/FFO)·우리(PBR·PSR)가 전부 다른 축을 쓴다는 삼자 불일치.
- 축간 답 갈림이 예외적 사례가 아니라 **중앙값 수준의 흔한 현상**(31.6%p)이라는 최초 실측.
- 44칸 표본 부족이 08-08 대비 08-09에 5칸→3칸으로 자연 개선됨(974의 신규 40종목 부착 효과).

**판정이 필요한 것**:
- 선택지 A~D 중 무엇을 택할지(또는 혼합).
- B를 완전히는 아니어도 부분 채택할지(예: Financials만 PBV 단일화, 나머지는 A 유지) — 이번 STEP에서 이 혼합 옵션 자체를 깊이 설계하지는 않았다.
- REIT 축 문제(P/CF/FFO 신규 파이프라인)를 Q1 범위에서 다룰지, 별도 STEP으로 미룰지.
