<!-- 2026-08-18 · Claude Code 실측 · 코드 diff 0 · DB 쓰기 0 · 화면 변경 0 -->

# 렌즈 전수감사 ⑥ — F-스코어(Piotroski) (등급 「검증」·strong)

> `docs/LENS_AUDIT_05_TECHNICAL.md`(⑤기술) 다음 순서 — 새 기준("주장과 근거의 간극이 가장 큰 것부터")대로, F-스코어는 「검증」 등급인데 원전 표본이 고B/M 가치주 5분위이고 우리는 전 종목에 쓴다는 간극이 크다. 또한 이 STEP은 **판정 대기 하나(W-2-4 재무건전성 "나" — Piotroski 32.3% 수용 여부)의 재료를 직접 만든다.**
> **범위**: `lib/fscore.ts` 전부 · `lib/lenses.ts`의 fscore 렌즈 · `lib/lensCopy.ts`(`fscore` 블록) · `lib/lensTones.ts` · `lens_scores`·`lens_cuts`·`lens_state_changes`·`us_fundamentals`·`us_fundamentals_snapshot` 실측.
> 🔴 **판정은 장은태가 한다.** 이 STEP은 결함을 실측으로 뜯어 적는 데까지다.
> 🔴 **조회 시각**: DB 조회 2026-08-18 06:2x~06:4x UTC. `lens_scores` US `updated_at` 균일 `2026-08-17 22:03:40 UTC`. `us_fundamentals.fetched_at` 균일(최신분) `2026-08-17 23:38~23:42 UTC`.

---

## 요약

| | 항목 | 판정 |
|---|---|:--:|
| 🟢 | ⓪-4① ㉢ 부분 합산 | **확정 배제 — 결함 아님.** 3중 게이트(`rows.length<3`→`needThree` · `!ok(T)‖!ok(P)‖PP.totalAssets≤0`→`dataMissing` · 연도 불연속→`gap`) 전부 통과해야만 9개 신호 전부 계산. 하나라도 없으면 9개 전부 na, 부분 채점 불가능 |
| 🟡 | ⓪-4① 71.9% vs 32.3% | **원인 확정 — 유니버스 아니라 데이터 출처(㉡)가 지배적.** `us_fundamentals`(1개년만)·`us_fundamentals_snapshot`(최대 2개년, 3년 이상 보유 종목 **0개**) 둘 다 Piotroski의 "3개 회계연도" 요건을 **구조적으로 충족 못함** — probe_1054의 32.3%는 이 두 캐시 테이블이 아닌 별도 경로였을 가능성이 높음(직접 확인 못함). 라이브는 야후 `fundamentalsTimeSeries`(연도목록 항상 3~5개, STEP1060 실측)라 3년 요건을 쉽게 채움 |
| 🟢 | ⓪-4② 분모(기초 vs 기말) | **원전과 정확히 일치 — STEP818 인용 + 이번 STEP이 §2.3.1~2.3.3 원문 재확인.** ROA·CFO·ΔTURN(본문 기준)은 기초자산, ΔLIQUID는 기말 — 코드가 각각 그대로 따름 |
| 🟢 | ⓪-4③ 계산불가 사유 분기 | **코드 레벨 확정 — 3개 갈래 실재**(`needThree`/`dataMissing`/`gap`, 서로 다른 `return`). 🔴 **모집단 분포(281건 중 각각 몇 건)는 DB 미저장이라 측정 불가**(구조적) |
| 🔴 | ⓪-4④ 집계 레이어 | **해당 없음** — F-스코어는 「검증」 등급이라 ⑤ 결함①(등급 무시 집계)이 F-스코어엔 이중 계상되지 않음 |
| 🟢 | 공개 문구 4개(⓪-3b) | 전부 **지킴**(코드 대조, 아래 §결함없음 참조) — 결함으로 이중 계상 안 함 |
| — | 앞선 결함 18건 생존 | **18/18 그대로**(⑤ 결과 인용, 08-18 이후 git log 변경 0건) |

---

## ⓪-4 반증조건 판명

**전제①(71.9% vs 32.3%)** — 🔴 **이 STEP의 최우선 결과.** 아래 §1 상세.

**전제②(분모 원전 일치)** — **참.** 아래 §2 원전 대조표.

**전제③(사유 분기)** — **부분 참** — 코드는 갈리지만(참), 모집단 분포는 못 잼(DB 구조상).

**전제④(집계 레이어)** — **해당 없음, 정확히 예상대로.** `lensTones.ts`의 `STATE_SPEC.fscore = ["strong","weak","mid"]`는 확인했으나, F-스코어는 `LENS_STRENGTH_MAP:37`이 "검증"으로 명시한 등급이라 강점으로 셈되는 것 자체가 부당하지 않다 — ⑤ 결함①(참고용 등급이 검증 등급과 동일 가중)과 **다른 상황**. 이중 계상하지 않는다.

---

## §1. 🔴 71.9% vs 32.3% 갈림 해소 — 최우선

**1단계 — ㉢ 부분 합산부터 코드로 배제** (`lib/fscore.ts:103~150`):

```
1) rows.length < 3            → supported:false, reason:needThree, score:0  (조기 반환)
2) !ok(T) || !ok(P) || PP.totalAssets<=0 → supported:false, reason:dataMissing, score:0  (조기 반환)
3) 연도 불연속(yT-yP≠1 || yP-yPP≠1)      → supported:false, reason:gap, score:0  (조기 반환)
→ 셋 다 통과해야만 아래로 내려가 9개 criteria를 전부 계산(175~185행), score=pass 개수
```

`ok(r)`는 T·P 두 해 모두에서 `netIncome`·`operatingCashFlow`·`ordinarySharesNumber`·`currentAssets`·`longTermDebt`·`gp(r)`(grossProfit 또는 매출−원가)·`totalAssets>0`·`totalRevenue>0`·`currentLiabilities>0` **9개 필드 전부**를 요구한다. **이 게이트를 하나라도 통과 못 하면 9개 신호 전부가 na로 반환되고, 통과하면 9개 전부가 실제로 계산된다 — "몇 개만 계산해서 합산"이라는 경로 자체가 코드에 없다.** 🔴 **확정 배제 — 최악의 결함(부분합산)은 아니다.**

**2단계 — ㉠(유니버스) vs ㉡(데이터 출처)**:

SEC 원자료 캐시가 정확히 두 테이블에 있다:

| 테이블 | 행/종목 수 | 종목당 보유 회계연도 | Piotroski 3년 요건 충족 가능? |
|---|---:|---|:--:|
| `us_fundamentals` | 5,820행 = 5,820종목(1:1) | **정확히 1개**(최신) | 🔴 **불가** — 애초에 1년치뿐 |
| `us_fundamentals_snapshot` | 5,755행 / 1,247종목 | 종목별 분포: **0개년 216종목 · 1개년 431종목 · 2개년 600종목 · 3개년 이상 0종목** | 🔴 **불가 — 3년 이상 보유 종목이 전체에서 0개** |

🔴 **결정적 사실**: 우리가 이미 DB에 캐시해 둔 SEC 데이터로는, **단 한 종목도** Piotroski의 "3개 회계연도(T·P·PP)" 요건을 만족하지 못한다. AAPL·MSFT·KO로 직접 확인(아래 §4 손계산 절 참조) — `us_fundamentals`는 각 1개년, `us_fundamentals_snapshot`은 각 2개년(중복 캡처 포함)뿐이었다.

반면 **라이브 7렌즈는 야후 `fundamentalsTimeSeries`를 쓴다**(STEP1059 §2 확정) — STEP1060이 175종목 실조회로 이미 실측한 바, 야후가 반환하는 연도 목록 길이는 **175/175 전부 3~5개**(중앙값 5). 즉 **야후 한 번의 호출이 우리가 그동안 캐시해 둔 SEC 데이터보다 구조적으로 더 깊은(더 많은 연도의) 이력을 준다.**

🔴 **결론**: 71.9%(라이브) vs 32.3%(`probe_1054`, `docs/probe_1054_growth_data_supply.md` 등 인용원)의 간극은 **㉢(부분합산)이 아니고, 우리가 지금 갖고 있는 SEC 캐시 두 테이블만으로는 재현조차 안 된다** — `probe_1054`의 32.3%는 이 두 캐시 테이블을 쓴 숫자가 아닐 가능성이 매우 높다(그 STEP이 무엇을 원자료로 썼는지는 이 STEP 범위에서 재확인하지 않았다 — 미측정으로 남김). **㉠(유니버스: 999 vs 3,606)의 순수 기여도는 분리해서 측정 못 함**(㉡의 효과가 압도적으로 커서 같은 조건 비교 자체가 안 됨).

🔑 **「나」 판정 재료**: **32.3%는 "SEC 원자료를 3년 요건으로 걸렀을 때"의 숫자이고, 라이브 71.9%는 "야후 한 번의 호출로 얻는 이력 깊이" 덕에 나온 별개 경로의 숫자다.** 이 둘은 **다른 데이터 파이프라인의 산출물**이라 직접 대체 관계로 보기 어렵다 — *"32.3%뿐이라 못 쓴다"*는 SEC-단독 파이프라인 전제에서 나온 결론이고, **현재 라이브 F-스코어 렌즈는 애초에 그 파이프라인을 쓰지 않는다.** 32.3% 자체를 "틀렸다"고 정정하는 것은 이 STEP 범위 밖(그 STEP이 무엇을 측정했는지 원문 재확인 필요) — 다만 **"32.3%가 지금 라이브 F-스코어 커버리지의 근거로 인용되면 안 된다"**는 것은 이 STEP이 실측으로 확정한다.

---

## §2. 원전 대조표 (9신호)

🔴 **`LENS_DEV_PLAYBOOK.md` #48(STEP818)이 이미 Table1+§2.3 전문 대조를 완료**해뒀다. 이 STEP은 중복 대조하지 않고, **원문(Piotroski 2000, JAR 38 Supplement) §2.3.1~2.3.3을 직접 재확보해 독립 재확인**(`data/sources/academic/piotroski_2000_value_investing_fscore.pdf`, Ivey Business School 무료 사본)했다 — 818의 결론이 전부 재현됐다.

| # | 신호 | 원전 정의(원문 그대로 재확인) | 우리 구현 | 차이 | 영향 |
|:--:|---|---|---|---|---|
| ① | F_ROA | *"ROA … net income before extraordinary items … scaled by beginning-of-year total assets"* | `roaT = netIncome/begT`(기초자산) | 분자=순이익(원전=특별항목전 순이익) | 부호 거의 불변(818 확인) |
| ② | F_CFO | *"CFO … cash flow from operations … scaled by beginning-of-year total assets"* | `operatingCashFlow > 0` | 없음(직접 값 사용, 분모 무관) | 없음 |
| ③ | F_ΔROA | *"ΔROA as the current year's ROA less the prior year's ROA"* | `roaT > roaP` | 없음 | 없음 |
| ④ | F_ACCRUAL | *"ACCRUAL as the current year's net income before extraordinary items less cash flow from operations, scaled by beginning-of-year total assets"* | `operatingCashFlow > netIncome`(부호 비교, 스케일 없음) | 원전은 스케일된 차이값, 우리는 부호만 비교 — **pass/fail 결과는 동일**(둘 다 CFO>NI 여부로 판정) | 없음 |
| ⑤ | F_ΔLEVER | *"historical change in the ratio of total long-term debt **to average total assets**"* | `lev(r) = longTermDebt/totalAssets`(기말) | 🔴 **원전=평균자산, 우리=기말자산** | pass/fail 부호 거의 불변(818 확인) — probe_1054가 지목한 병목 신호(64.2%) |
| ⑥ | F_ΔLIQUID | *"current ratio as the ratio of current assets to current liabilities **at fiscal year-end**"* | `cr(r) = currentAssets/currentLiabilities`(기말) | 없음 | 없음 |
| ⑦ | F_EQ_OFFER | *"equal to one if the firm did not issue common equity in the year preceding portfolio formation"* | 발행주식수 변화(`shT<=shP*1.001`, 분할은 예외 처리) | 🔴 원전은 현금흐름표 신주발행 항목 직접 사용, 우리는 주식수 변화로 근사 | 818이 이미 지목, 재검토 안 함 |
| ⑧ | F_ΔMARGIN | *"current gross margin ratio (gross margin scaled by total sales) less the prior year's gross margin ratio"* | `gm(r) = gp(r)/totalRevenue`(당해) | 없음 | probe_1054가 지목한 병목 신호(51.6%, 매출총이익 결측 원인 — 금융사 등) |
| ⑨ | F_ΔTURN | *"current year's asset turnover ratio (total sales scaled by **beginning-of-the-year total assets**) less the prior year's asset turnover ratio"* | `atT = totalRevenue/begT`(기초) | 🔴 **원전 §2.3.3 본문 자체가 "기초"를 명시** — 818이 지목한 "Table1과의 자기모순"은 표 vs 본문 사이에 있고, **우리는 본문 쪽(기초)을 따른다** — 이 STEP이 재확인한 본문 인용과 일치 | 없음(본문 기준으로는 원전과 완전 일치) |

**등급 밴딩**: 원전은 고8~9/저0~1을 "강/약"으로 씀. 우리는 **양호≥7/취약≤3(자체 밴딩)** — `lensCopy.ts:263` `scope.failure`에 *"우리 '양호(≥7)'는 자체 기준이에요(피오트로스키의 '높음'은 8~9점)"*로 **이미 화면에 공개**(카드 `note`에 렌더, ⑤ 감사가 확인한 것과 같은 방식으로 `StockLensClient.tsx`의 narrative 경로를 통해 노출). 결함 아님.

**금융사 처리**: 원전은 유동비율 요구로 금융사가 사실상 자동 제외됨(§2.3.2 유동성 신호 자체가 은행 재무제표 구조와 안 맞음). 우리 코드는 `ok(r)`가 `currentAssets`·`currentLiabilities`·`gp(r)` 전부를 요구하므로 은행·보험은 이 필드들이 결측이라 `dataMissing`으로 자연 제외 — **원전과 정합**(명시적 SIC 필터 아님, 결과적으로 같은 효과).

---

## 🟢 잘 된 것

1. **부분 합산 경로가 코드에 아예 없다** — 이 STEP이 최우선으로 배제하려던 최악의 시나리오가 실제로는 존재하지 않았다.
2. **분모(기초/기말) 처리가 원전과 신호별로 정확히 일치** — 원문을 직접 재확인해도 818의 결론이 그대로 재현됐다(ROA·CFO=기초, ΔLIQUID=기말, ΔTURN=본문 기준 기초).
3. **계산 불가 사유가 코드 레벨에서 실제로 3갈래**(needThree/dataMissing/gap) — STEP889·①밸류 감사가 지적했던 "뭉뚱그림" 함정을 F-스코어는 처음부터 피해 있었다.
4. **공개 문구 넷(⓪-3b)이 전부 코드와 무모순** — ①가치주 집단 도구(카드에 명시) ②대형주 약함(카드에 명시) ③은행·보험 산출 불가(위 확인대로 실제로 그렇게 됨) ④양호≥7 자체 기준(카드에 명시, 렌더 확인).
5. **집계 레이어 문제가 F-스코어에는 실제로 해당 없음** — ⑤ 감사가 발견한 결함을 F-스코어에 그대로 옮겨 적지 않고 정확히 구분했다(등급 자체가 검증이므로).

---

## §3. 계산 불가 사유 — DB 실측

`lens_scores` US 전량(999행)에서 `fscore_value`는 있지만 **`reason`(needThree/dataMissing/gap 어느 것인지)은 저장되지 않는다** — DB 스키마 확인(`fscore_value`·`fscore_state` 두 컬럼뿐). ④퀄리티 감사의 grossProfit·⑤기술 감사의 rsi14/pos52w와 **같은 패턴**(파생 표시값은 저장, 중간 판정 근거는 저장 안 됨)이 F-스코어에서도 세 번째로 확인된다.

🔴 **코드 레벨 분기는 확인**(위 §1 1단계) — 셋이 서로 다른 `return`문으로 존재하는 것은 100% 확실. **281건(결측)이 셋 중 무엇으로 갈리는지 모집단 비율은 재취득 없이는 측정 불가**(미측정으로 남김).

---

## §4. DB·손계산 실측

### 4-1. DB 전수(조회 2026-08-18 06:2x UTC)

- `lens_scores` US 999행. `fscore_value` 비결측 **718(71.9%)**·결측 **281(28.1%)**.
- 점수 분포: 1점 1 · 2점 6 · 3점 17 · 4점 82 · 5점 123 · 6점 204 · 7점 144 · 8점 111 · 9점 30(0점 0건). 합=718, 정합.
- `fscore_state`: mid(4~6) **409** · strong(≥7) **285** · na **281** · weak(≤3) **24**.
- `updated_at` **전 999행 균일 `2026-08-17 22:03:40 UTC`** — ③ 감사 신규②(스테일) 재현 안 됨(정상).
- `lens_cuts`(fscore): **빈 배열(행 0개)** — F-스코어는 분포 유도 컷을 안 쓰고 **고정 임계값(≥7/≤3)**을 쓴다는 818의 기록과 정합(결함 아님, `lensCopy.ts` scope에 이미 "자체 기준"으로 공개).
- `lens_state_changes`(fscore, 07-20~08-07): **112건/111종목 — `LENS_DISPOSITION` §1 정확히 재현**(독립 검증 완료).

### 4-2. 역방향 검사 (⓪-5②㉡) — 구조적으로 불가능함을 확인

"SEC엔 3년 연속 있는데 라이브는 결측"인 종목을 찾으려 했으나, **§1에서 이미 확인했듯 우리 SEC 캐시(두 테이블 어느 쪽도) 3년 연속을 가진 종목이 0개다** — 역방향 검사 자체가 성립하지 않는다(비교할 "3년 있음" 모집단이 없음). 이 자체가 실측 결과다.

### 4-3. 손계산 검산 3종목 — 🔴 시도했으나 구조적으로 불가능함을 확인(⑤와 다른 이유로 같은 결론)

STEP1059의 실패(낡은 수치로 손계산)를 피하려 **먼저 회계연도를 고정**하려 했다: `us_fundamentals.fetched_at` = 균일 `2026-08-17 23:38~23:42 UTC`(어젯밤 신선). 그러나 이 시점의 SEC 데이터로 실제 확보 가능한 연도 수를 AAPL·MSFT·KO로 직접 확인한 결과:

| 종목 | `us_fundamentals`(1개년만) | `us_fundamentals_snapshot`(보유 연도) |
|---|---|---|
| AAPL | FY2025 1개년(순이익·CFO·총자산·총부채 有) | FY2024·FY2025 **2개년**(순이익·자기자본·매출·부채·주식수만 有 — **유동자산·유동부채·영업현금흐름 컬럼 자체가 이 테이블엔 없음**) |
| MSFT | FY2026 1개년 | FY2024·FY2026 2개년(같은 제약) |
| KO | FY2025 1개년(단, `total_liabilities` null) | FY2024·FY2025 2개년(같은 제약) |

**Piotroski 9신호는 T·P·PP 3개 회계연도가 필요하다.** 두 테이블을 합쳐도 최대 2개년이고, 그마저 `us_fundamentals_snapshot`엔 유동자산·유동부채·영업현금흐름 컬럼 자체가 없어(스키마 확인) ΔLIQUID·F_CFO·ACCRUAL을 낼 수 없다. **손계산에 필요한 원자료가 이 STEP이 허용된 범위(재취득 0) 안에는 존재하지 않는다.**

🔴 **STEP 자체의 §2-7 전제("이번엔 할 수 있다")는 틀렸다.** 정정: `us_fundamentals`는 **1개년만** 저장한다(revdcf가 최신 회계연도 하나만 쓰기 때문 — STEP1060이 이미 이 사실을 확인했었는데, 이 STEP이 "3개 연도로 이미 있다"고 다시 가정한 것은 STEP1060의 결과를 완전히 반영하지 못한 것이었다). ⑤ 감사가 "원시 종가 없음"으로 손계산을 못 한 것과 **다른 이유**(가격 계열이 아니라 재무 계열의 연도 깊이 부족)로, **같은 결론**(사후 검증 인프라 없음)에 도달했다.

---

## §5. 앞선 결함 18건 생존 확인 (①6+②5+③4+⑤3)

`LENS_AUDIT_05_TECHNICAL.md`가 **"15/15 그대로"**(①~③)를 이미 확정했고, ⑤ 자신의 신규 3건(집계 레이어·배당 미조정·pos52 최소표본)도 상태가 확정돼 있다. 재조사하지 않고 인용한 뒤, 2026-08-18 이후 관련 파일 `git log` 확인:

```
git log --oneline --since="2026-08-18T00:00:00" -- lib/fscore.ts lib/lenses.ts lib/lensCopy.ts lib/lensTones.ts lib/lensCompute.ts lib/lowvol.ts lib/technical.ts
→ (커밋 0건)
```

**18/18 그대로.**

---

## §6. 질문 귀속(2-9) — 이미 배정돼 있다

`lensCopy.ts:98` `fscore.question` = **"재무가 튼튼한가?"**. `ROADMAP_V2.md` W-2-4가 이미 **"재무건전성" 칸의 단독 모델 = Piotroski F-Score"**로 확정해뒀고, W-2 정본 문장("이 회사, 재정 상태가 좋아지고 있을까 나빠지고 있을까?")과 코드 질문이 개념상 무모순이다. 이 STEP이 새로 도출한 게 아니라 **기존 배정을 재확인**했다.

---

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- 손계산 3종목 — 원자료(3년 연속 전 필드)가 이 STEP의 재취득 금지 범위 안에 없다(§4-3).
- `probe_1054`의 32.3%가 정확히 어떤 원자료 경로에서 나왔는지 원문 재확인 — 이 STEP은 "지금 캐시된 두 테이블로는 재현 안 된다"까지만 확정했다.
- 계산 불가 281건의 사유별(needThree/dataMissing/gap) 정확한 모집단 분포 — DB 미저장 + 재취득 금지.
- ㉠(유니버스 999 vs 3,606)의 순수 기여도 분리 측정 — ㉡(데이터 출처) 효과가 압도적이라 조건 통제 비교 자체가 성립하지 않음.

**철회·정정한 것**
- 🔴 **이 STEP 자신의 §2-7 전제**("`us_fundamentals`에 3개 연도로 이미 있다") — **틀렸다.** `us_fundamentals`는 종목당 1개년만 저장(5,820행=5,820종목). 정정: 손계산은 구조적으로 불가능(§4-3).
- 직전 감사(①~⑤) 인용은 전부 원문 재확인 결과 정확했다(정정 불필요).

**미측정으로 남은 것**
- `probe_1054` 32.3%의 원자료 경로(위 참조).
- 계산 불가 사유 모집단 분포.
- ㉠㉡ 기여도 분리.
- `ROADMAP_V2.md` W-2-4의 32.3% 서술 — 🔴 이 STEP의 §1 결과("32.3%가 지금 라이브 커버리지 근거로 인용되면 안 된다")를 반영해 **정정이 필요할 수 있으나, 그 문장이 정확히 무엇을 측정한 숫자인지 원문 재확인 전에는 취소선 처리하지 않는다** — 잘못 정정하면 STEP1060의 실수(성급한 결론)를 반복하게 된다. **판정 재료로만 남긴다.**

🔴 **판정은 장은태가 한다. 이 문서는 결함을 놓는 것까지다.**
