<!-- STEP 1015 — 답변 가능성 지도(ANSWERABILITY_MAP.md) 성립 조건을 코드로 확정 (읽기 전용 · 코드 수정 0) -->
# probe_1015 — 답변 가능성 지도 코드 대조

## ⓪-4 판정

🟡 **혼합 — 두 번째 갈래(조건이 코드 어디에도 없다) + 세 번째 갈래(코드의 조건이 초안과 다르다) 둘 다 나왔다. 첫 번째 갈래(전부 일치)는 0건.**

`조건확정 0 / 확인불가 2 / 불일치 6` (8개 항목 기준)

| 항목 | 판정 | 핵심 |
|---|---|---|
| A. 역DCF/적정가치 | 🔴 불일치 | 초안의 "skip_reason IS NULL이 성립조건"이 틀렸다 — `verdict='skipped'`도 **항상 렌더된다**(내용만 바뀜) |
| B. WACC 민감도 | 🔴 불일치 | 초안의 "세 값 모두 non-null 게이트"가 없다 — null이면 그냥 "—"로 렌더(널-세이프, 게이트 아님) |
| C. 밸류에이션 배수 | 🔴 불일치 | `unavailable` 사유가 **다른 테이블**(`us_sector_relative`)에서 온다. `us_valuation.unavailable`의 세부 사유(NEGATIVE_EARNINGS 등)는 **계산은 되지만 화면에 전혀 안 감** |
| D. 업종 대비 | 🔴 불일치 | 필요값 칸의 컬럼명 3개(`per_rel`·`per_med`·`sector_as_of`)가 **존재하지 않는다**(실제: `per_pct`·컬럼없음·`as_of`). 게이트 로직(`sector IS NOT NULL AND n>=20`) 자체는 코드와 일치 |
| E. 7렌즈 | 🟡 확인불가 | 초안이 명시한 "`lens_cuts` 신선도 ≤49h" 게이트가 **서빙 경로(`/api/lens`)에 없다** — 49h는 `health` 크론 전용 모니터링 값이고, 화면은 컷이 며칠 묵었든 그대로 판정을 낸다 |
| F. 재무 원문 수치 | 🟡 확인불가 | **서빙 코드 자체가 없다** — `us_fundamentals`를 읽는 곳은 revdcf/Q1 배치 계산 내부뿐, 사용자에게 답하는 API·컴포넌트가 존재하지 않는다 |
| G. 시총·주가·수익률 | 🔴 불일치 | 초안의 "as_of 신선도 ≤30h 게이트"가 서빙 경로에 없다 — 관심목록은 값을 항상 내보내고 `asOf`만 별도로 투명 공개(게이트 아님) |
| H. 섹터 분류 | 🔴 불일치 | 필요값 칸이 **잘못된 테이블**(`us_sector_wide`)을 지목 — 실제 라이브 화면은 `us_sector_resolved`(`app/api/sector/us/route.ts`)를 쓴다. 게다가 그 라우트는 `disagree`·`cross_*` 컬럼을 **select조차 안 한다** — 한계 고지("disagree면 반드시 함께 말한다")가 구현 자체가 없다 |

🔑 **공통 패턴**: `docs/CRON_OBSERVABILITY.md`의 신선도 임계값(49h·30h)은 **`health` 크론의 모니터링/알림 전용**이고, 실제 사용자에게 값을 내보내는 API 경로들은 그 임계값을 **전혀 참조하지 않는다.** "언제 성립하는가"를 코드에서 찾으려 했더니, 그 판단 자체가 서빙 경로에 없는 경우가 절반에 가까웠다.

---

## 1. 항목별 근거표

### A. 역DCF / 적정가치

| 칸 | 초안 | 코드 대조 결과 |
|---|---|---|
| 성립 조건(재작성) | `REVDCF_ENABLED === true` **AND** `EXISTS revdcf_results WHERE symbol=X AND as_of = MAX(as_of)` | `app/api/revdcf/route.ts:18`(플래그 게이트) · `:27-29`(최신 as_of, 없으면 result:null) · `:31-32`(행 조회, 없으면 result:null) · `components/RevDcfSection.tsx:37`(`!loaded \|\| !r` → 미렌더) |
| 🔴 초안 정정 | ~~`skip_reason IS NULL` **AND** 해당 as_of가 최신 **AND** REVDCF_ENABLED~~ → **`skip_reason`은 성립 조건이 아니다.** `verdict` 컬럼 자체가 `'skipped'` 값을 가질 수 있고, 그 경우도 섹션은 렌더된다 — 단지 헤드라인이 `t(\`skip.${skipKey}\`)`로 바뀔 뿐(`RevDcfSection.tsx:126`) | `RevDcfSection.tsx:77`(`skipKeyFor(r.skipReason)`) · `:126`(`v === "skipped"` 분기) |
| 불성립 시 문구 | 🟡 초안 그대로 유효 — `skipKeyFor()`가 사유별 문구 매핑, `SKIP_KEY_MAP` 밖은 `"unspecified"` 중립 폴백(896 주석) | `lib/revdcf/skipKey.ts`(파일 존재 확인, 상세 미대조 — 이 STEP 범위 밖) |
| 한계 고지 | ✅ 초안 유효 | i18n 텍스트 확인 안 함(범위 밖), `methodologyLink` 존재(`RevDcfSection.tsx:160`) |
| 근거 | ✅ 확정 | 위 표 |

### B. WACC 민감도

| 칸 | 초안 | 코드 대조 결과 |
|---|---|---|
| 성립 조건(재작성) | A의 조건과 **동일**(별도 게이트 없음). `band.minus1`/`band.plus1`는 **null-safe로 항상 렌더**(값이 없으면 `"—"`) | `RevDcfSection.tsx:52`(`gapText`: `n == null ? "—" : ...`) · `:97,99`(항상 3행 테이블 렌더, `v === "years"`일 때만) |
| 🔴 초안 정정 | ~~성립 조건 = A와 동일 + 세 값 모두 non-null~~ → **"모두 non-null"은 게이트가 아니라 개별 null-세이프 표시**다. 하나가 null이어도 나머지는 뜬다 | 동일 |
| 불성립 시 문구 | 🔴 초안 정정 — ~~"민감도를 계산하지 못했습니다"~~ 같은 별도 문구는 코드에 없다. 그냥 해당 칸이 `"—"`로 남는다 | `RevDcfSection.tsx:52` |
| 한계 고지 | ✅ 초안 유효(±1%p 두 점) | `RevDcfSection.tsx:51`(`wLow = d.wacc - 0.01`, `wHigh = d.wacc + 0.01`) |
| 근거 | ✅ 확정 | 위 표 |

### C. 밸류에이션 배수

| 칸 | 초안 | 코드 대조 결과 |
|---|---|---|
| 필요값 검증 | 🔴 부분 오류 | `us_valuation`엔 `unavailable jsonb` 컬럼이 **실제로 있다**(`supabase/migrations/20260808_us_valuation.sql:17`, 예시 `{"per":"NEGATIVE_EARNINGS"}`) — 그런데 서빙 라우트(`app/api/q1/[symbol]/route.ts:32`)가 **이 컬럼을 select하지 않는다.** 화면에 뜨는 `unavailable`은 전부 `us_sector_relative.unavailable`(D의 테이블)에서 온 것(`:37-39,53`) |
| 성립 조건(재작성) | `EXISTS us_valuation WHERE symbol=X AND as_of=MAX(as_of)`(없으면 라우트 전체 404) — 축별로는 `value`가 null이어도 화면엔 `"—"`로 그냥 뜬다(게이트 아님) | `q1/[symbol]/route.ts:28-35`(404 게이트) · `Q1Section.tsx:56-60,76`(`fmtValue`는 항상 렌더) |
| 🔴 초안 정정 | ~~불성립 시: `unavailable`의 사유를 그대로~~ → **`us_valuation.unavailable`의 세부 사유(11종: MISSING_MARKET_CAP·NEGATIVE_EARNINGS·MISSING_EQUITY 등, `lib/valuation.ts:66,73,79,85,91-92,96`)는 계산되지만 API가 안 실어 보내 화면에 절대 안 뜬다.** 대신 D의 3종(NO_SECTOR/NO_VALUE/SAMPLE_TOO_SMALL)만 노출 — "값 자체가 없다"의 **이유**는 `NO_VALUE`라는 뭉뚱그린 라벨 하나로 수렴 | `lib/valuation.ts:66-96` · `Q1Section.tsx:44-48`(`unavailableText` 3종만 매핑) |
| 한계 고지 | 🔴 정정 필요 — `fiscalYear`·`perBasis`는 노출되나(`q1/route.ts:73`, `Q1Section.tsx:86`), **`asOf`(데이터 기준일)는 API 응답엔 있는데 컴포넌트가 전혀 렌더하지 않는다** | `q1/route.ts:70-75`(`asOf` 포함) · `Q1Section.tsx`에서 `r.asOf` 검색 시 타입 선언(`:14`) 외 사용처 0건 |
| 근거 | ✅ 확정(위 표) | — |

### D. 업종 대비

| 칸 | 초안 | 코드 대조 결과 |
|---|---|---|
| 필요값 검증 | 🔴 **3개 컬럼명 오류** — `per_rel`(존재 안 함, 실제는 `per_pct`) · `per_med`(해당 컬럼 자체가 없음 — 이 테이블은 업종 중앙값을 저장하지 않고 백분위만 저장) · `sector_as_of`(존재 안 함, 실제는 그냥 `as_of`) | `supabase/migrations/20260809_us_sector_relative.sql:6-19`(전체 컬럼 목록) |
| 성립 조건 | ✅ **초안 그대로 코드와 일치** — `sector IS NOT NULL`(아니면 4축 전부 `NO_SECTOR`) **AND** `axis_n >= min_sample(=20)`(아니면 `SAMPLE_TOO_SMALL`) | `lib/sectorRelativeBatch.ts:70`(`sampleOk = n >= minSample`) · `:91`(NO_SECTOR) · `:98`(SAMPLE_TOO_SMALL) · `:103`(NO_VALUE, C와 공유) · `lib/sectorRelative.ts:47`(`minSample: 20`) |
| 불성립 시 | ✅ 초안 유효(사유 그대로 노출) — `Q1Section.tsx:44-48` 3종 매핑, C와 동일 코드 경로 공유 | 동일 |
| 한계 고지 | ✅ 초안 유효(#19 업종배수 외부 벤치마크 없음 — 슬롯 검증과 일치, 아래 §3 참조) | — |
| 근거 | ✅ 확정(컬럼명 정정 포함) | 위 표 |

### E. 7렌즈

| 칸 | 초안 | 코드 대조 결과 |
|---|---|---|
| 성립 조건(재작성) | `isActiveSymbol(symbol) === true`(그 외 게이트 없음). **컷(`lens_cuts`) 신선도는 판정 계산에 전혀 반영되지 않는다** — 컷이 며칠이든 몇 달이든 묵어도 `loadCuts()`가 가져온 값을 그대로 쓴다 | `app/api/lens/route.ts:88`(활성시장 게이트) · `lib/lensCuts.ts:65-73`(`loadCuts` — `as_of`를 읽어 `out[key].asOf`에 저장은 하나) · `lib/lensCompute.ts`(asOf/cutsAsOf 참조 0건 — grep 확인) · 최종 응답 구조(`lensCompute.ts:315`)에 `asOf`/신선도 필드 자체가 없음 |
| 🔴 초안 정정 | ~~성립 조건 = 유니버스 소속 **AND** `lens_cuts` 신선도 ≤49h~~ → **49h는 `health` 크론(`app/api/cron/health/route.ts:86-96`)의 감시용 숫자일 뿐, `/api/lens`가 실제로 참조하지 않는다.** 지금 US `lens_cuts`가 2026-07-30부터 15일 묵었어도(⓪-1 "현재" 행), **`/api/lens`는 그 묵은 컷 기준으로 계속 실시간 판정을 내보내고 있으며, 화면·API 응답 어디에도 "이 판정이 며칠 전 기준"이라는 표시가 없다.** | `app/api/cron/health/route.ts:87`(주석: "as_of는 날짜라 실행 직후에도 ~12h·다음날 실행전 ~36h → 49h 임계") · `:93-94`(`stale`/`thresholdH:49` — health 리포트 전용 필드, 서빙 API와 무관한 별도 결과 배열) |
| 불성립 시 | 🟡 확인불가(불성립 상태 자체가 지금 코드에 없음 — 늘 "성립"으로 취급) | — |
| 한계 고지 | ✅ 초안 유효(7렌즈 비합산·상대분위) | 이 STEP에서 코드 재확인 안 함(1011 대조 인용) |
| 근거 | 🟡 확인불가(신선도 게이트 부분) / ✅ 확정(그 외) | 위 표 |
| 🔴 현재 상태(2-4) | US `lens_cuts` 2026-07-30 정지 15일째 — **이 STEP 확인**: `/api/lens`는 이 상태에서도 정상 200 응답을 내며, 판정 문구 어디에도 "컷이 낡았다"는 신호가 없다. 초안이 "불성립 시 컷 기준일을 명시하고 판정을 그대로 쓰지 않는다"고 적었으나 **그런 코드가 없다 — 지금 판정을 그대로 쓰고 있다.** |

### F. 재무 원문 수치

| 칸 | 초안 | 코드 대조 결과 |
|---|---|---|
| 🔴 전면 확인불가 | **이 질문에 답하는 API·컴포넌트가 존재하지 않는다.** `us_fundamentals`를 읽는 코드는 3곳뿐이며 전부 내부 배치 계산용이다: `app/api/cron/revdcf/route.ts`(역DCF 계산 입력) · `lib/valuation.ts`(Q1 배치 계산 입력) · `lib/revdcf/drivers.ts`(드라이버 계산 입력). **사용자 요청에 응답해 `revenue`·`net_income`·`equity` 원문값 자체를 돌려주는 GET 라우트가 0건.** | `grep -rln "us_fundamentals" app/ lib/ components/` → 위 3개 파일만(cron·계산 내부 전용), API 응답 경로 0건 |
| 필요값 검증 | 🟡 컬럼 자체는 존재(`supabase/migrations/20260808_us_fundamentals.sql:4-20` — revenue·net_income·equity·operating_income·dna·debt·non_operating_assets·shares·fiscal_year·source_tags·unavailable_reason 전부 확인) — **저장은 되지만 서빙 경로가 없다는 뜻** | 위 마이그레이션 |
| 성립 조건/불성립 문구/근거 | 🟡 **확인불가 — 판정 자체가 없다.** 이 항목은 "조건이 코드 어디에도 없다"가 아니라 **"기능 자체가 없다"**에 가깝다(더 근본적) | — |
| 한계 고지 | 🔴 초안의 `shares` 태그 미기록 지적(1011)은 여전히 유효하나, **그 이전에 F 전체가 서빙되지 않는다는 사실이 먼저** | STEP1011 §2 확인(`us_fundamentals.source_tags`에 `shares` 키 없음) |

### G. 시가총액·주가·수익률

| 칸 | 초안 | 코드 대조 결과 |
|---|---|---|
| 성립 조건(재작성) | 관심목록(`app/api/watchlist/quotes/route.ts`) 기준: **게이트 없음.** `us_stock_perf`/`us_market_cap`에서 조회된 값을 신선도 무관하게 항상 반환하고, 대신 `asOf`를 별도 필드로 함께 내보내 "정직화"한다(STEP829 §7) | `watchlist/quotes/route.ts:127`(주석: "최대 25h 묵음 정직화") · `:136-140`(`us_stock_perf.updated_at` 최신값을 `asOf.US`로 산출, 게이트 아님 — 항상 계산) |
| 🔴 초안 정정 | ~~성립 조건 = as_of 신선도 ≤30h~~ → **관심목록 API에 그런 게이트가 없다.** 30h는 `docs/CRON_OBSERVABILITY.md:146-147`이 정의한 `health`용 알림 임계값이지 서빙 코드가 참조하는 값이 아니다. 코드 주석이 스스로 다른 숫자(25h)를 쓰고 있어 **문서 간에도 숫자가 다르다**(불일치, 아래 §2 참조) | `watchlist/quotes/route.ts:127` vs `docs/CRON_OBSERVABILITY.md:146-147` |
| 불성립 시 | 🔴 초안 정정 — ~~"마지막 확보일을 명시한다"~~는 부분적으로 맞다(`asOf` 필드는 실제로 나간다). 단 **어떤 화면이 이 `asOf`를 실제로 사용자에게 렌더하는지는 이 STEP에서 확인 못 함**(watchlist 클라이언트 컴포넌트 코드는 범위 밖) | `watchlist/quotes/route.ts:129-142` |
| 한계 고지 | ✅ 초안 유효(계산기준 미명시 — 야후 소스) | — |
| 근거 | ✅ 확정(게이트 부재 포함) | 위 표 |
| 🔴 현재 상태(2-4) | 373건이 2026-07-30 이후 갱신 없음(296건 07-30 고정) — **이 STEP 확인**: 게이트가 없으므로 이 373건도 그냥 낡은 값 그대로 응답에 나간다(차단되지 않는다). `asOf`만 07-30으로 정직하게 찍힐 뿐. |

### H. 섹터 분류

| 칸 | 초안 | 코드 대조 결과 |
|---|---|---|
| 🔴 필요값 — 테이블 자체가 틀림 | 초안: `us_sector_wide.*`. **실제 라이브 화면이 쓰는 테이블은 `us_sector_resolved`**(다른 테이블, 컬럼 구성은 동일하나 별개 PK·별개 갱신 경로) | `app/api/sector/us/route.ts:4`(주석: "us_sector_resolved... 최신 as_of를 그대로 노출") · `:11,16`(테이블명 리터럴) · `supabase/migrations/20260808_sector_cuts_applied.sql:11-22`(us_sector_wide 마이그레이션 파일의 헤더 주석: "🔴 us_sector_resolved... 는 건드리지 않는다 — 여기 쓰면 화면이 움직인다") |
| 성립 조건(재작성) | `EXISTS us_sector_resolved WHERE as_of=MAX(as_of)`(없으면 `{asOf:null, items:[]}`). `sector`가 개별 행에서 null이어도 그냥 `null`인 채로 반환(게이트 아님, 프론트가 알아서 처리) | `app/api/sector/us/route.ts:11-21` |
| 🔴 한계 고지 — 구현 자체가 없음 | ~~disagree가 true면 반드시 함께 말한다~~ → **`app/api/sector/us/route.ts:16`이 select하는 컬럼은 `symbol, sector, source` 3개뿐.** `disagree`·`cross_nasdaq`·`cross_sic`·`cross_yahoo`는 **테이블엔 있지만(마이그레이션 확인) 이 쿼리가 아예 안 가져온다.** 전 코드베이스에서 `disagree`를 참조하는 곳은 `lib/sector.ts`·`lib/sectorCuts.ts`(내부 계산)뿐, `app/**`·`components/**` 0건 | `app/api/sector/us/route.ts:16` · `grep -rn disagree app/ lib/ components/` → 계산 내부 2파일만 |
| 불성립 시 | 🟡 확인불가(sector=null일 때 프론트가 무엇을 렌더하는지는 컴포넌트 추적 범위 밖 — `ExploreClient.tsx:467` 참조만 확인, 상세 미대조) | `us_sector_wide` 마이그레이션 헤더 주석에서 `ExploreClient.tsx:467` 인용 확인(간접) |
| 근거 | ✅ 확정(테이블 오류·disagree 미구현 포함) | 위 표 |

---

## 2. 🔴 중복·불일치 검사

**같은 값(역DCF verdict·gapYears)이 두 개의 독립된 API 경로에서 각각 서빙된다:**

| 경로 | 테이블·조회 | 최신 as_of 판정 |
|---|---|---|
| `app/api/revdcf/route.ts` | `revdcf_results` 전체 컬럼 | `:27`(자체 `order(as_of desc).limit(1)`) |
| `app/api/q1/[symbol]/route.ts` | `revdcf_results`의 `verdict, gap_years, flags`만(요약) | `:57`(**별도의** `order(as_of desc).limit(1)`) |

두 라우트가 **완전히 독립된 두 번의 "최신 as_of" 쿼리**를 각자 수행한다. `revdcf_results`가 하루 한 번(22:45 UTC)만 갱신되므로 지금까지 실제로 값이 갈렸다는 증거는 없다(이 STEP은 실측 안 함 — DB 쓰기 0 원칙상 재현 시도 안 함). 🔴 **다만 구조적으로, 크론이 실행되는 순간과 두 API가 호출되는 순간이 겹치면(초 단위) 한쪽은 새 as_of를, 다른 쪽은 옛 as_of를 볼 수 있는 여지가 있다** — 지금은 이론적 위험으로만 기록, 실제 불일치 관측은 없음.

**신선도 임계값 숫자 자체도 문서 간에 다르다**: `docs/CRON_OBSERVABILITY.md:146-147`은 `us_market_cap`/`lens_scores`에 **30h**를 정의하지만, `app/api/watchlist/quotes/route.ts:127`의 코드 주석은 **25h**("최대 25h 묵음 정직화")라고 말한다. 어느 쪽도 실제로 게이트로 쓰이지 않으므로(위 G 참조) 지금 당장 화면 판정에 영향은 없으나, **두 숫자가 서로 다른 채로 각자의 문서에 정본처럼 적혀 있다.**

**전수 나열**: 위 두 건이 이번 대조에서 발견된 전부다. C/D의 `unavailable` 필드 공유(§1 C 참조)는 "중복"이 아니라 "의도된 재사용"으로 판단(코드 주석 `q1/route.ts:44-45`가 그 의도를 명시).

---

## 3. 한계 고지 — 슬롯 검증(1011) 교차 확인

| 슬롯 | 1011 실측 | ANSWERABILITY_MAP 반영 여부 |
|---|---|---|
| #19 업종 배수 외부 벤치마크 없음 | 1011은 이 슬롯을 "일치"로 판정(카탈로그 서술이 코드와 맞음) | ✅ D 항목 한계 고지에 이미 있음(`ANSWERABILITY_MAP.md` §2 D, 문구 불변) |
| #2 발행주식수 `shares` 태그 없음 | 1011 실측 확정(`us_fundamentals.source_tags`에 `shares` 키 자체가 없음) | ✅ F 항목 한계 고지에 이미 있음 — 단 **F 전체가 서빙되지 않는다는 더 큰 문제 위에 얹힌 지엽 사항**으로 재배치 필요(§1 F 참조) |

---

## 4. 규칙 신설이 필요한 항목 (판정 요청 — 🔴 고르지 않음)

1. **E·G의 신선도 게이트를 서빙 경로에 실제로 넣을 것인가, 아니면 지금처럼 "값은 항상 내보내고 기준일만 투명 공개"할 것인가.** 후자를 계속 쓴다면 G처럼 응답에 `asOf`를 반드시 포함하고 프론트가 반드시 렌더하도록 규칙화해야 한다(C는 API엔 있지만 프론트가 버림 — 지금은 그조차 안 지켜짐).
2. **`docs/CRON_OBSERVABILITY.md`의 임계값(49h·30h)이 "모니터링 전용"인지 "서빙 게이트여야 하는지"를 정한다.** 지금은 이름은 같은데 실제 역할이 다른 두 가지 숫자가 한 문서에 섞여 있다.
3. **C의 세부 `unavailable` 사유(11종, `lib/valuation.ts`)를 화면에 실을지 말지.** 지금은 계산만 하고 버려진다 — 값 자체는 이미 있으니 배선 비용은 select 한 줄이지만, 노출 여부는 판단 사항.
4. **H의 `disagree`/`cross_*`를 실제로 select·노출할지.** 컬럼·계산 로직 다 있고 API에 한 줄만 추가하면 된다 — 배선 여부는 판단 사항.
5. **F(재무 원문 수치)를 별도 API로 만들 것인지, 아니면 이 질문 자체를 §3(답하지 않는 영역)으로 옮길 것인지.** 지금 상태로는 "질문 유형"이 있는데 "성립 조건"이 원리적으로 존재하지 않는(기능 없음) 유일한 항목이다.
6. **A/C의 "최신 as_of" 독립 조회 중복을 공유 헬퍼로 합칠지.** 지금 위험은 이론적이나, revdcf가 앞으로 스케줄이 바뀌거나 재시도 로직이 생기면 실제 경합이 될 수 있다.

---

## 5. 2-4 현재 불성립 상태 — 이 STEP이 코드로 재확인한 사실

- **E. 7렌즈** — US `lens_cuts` 2026-07-30 정지 15일째. **재확인: 코드에 신선도 게이트가 없어 `/api/lens`는 이 상태에서도 계속 정상 200과 판정을 낸다.** "불성립"이 아니라 **"낡은 값을 성립인 것처럼 계속 내보내는 중"**이 정확한 표현이다.
- **G. 시총/주가** — 373건이 07-30 이후 갱신 없음(296건 고정). **재확인: 관심목록 API도 게이트 없이 그대로 내보낸다.** `asOf`가 07-30으로 정직하게 찍히긴 하나, 값 자체를 막지는 않는다.
- **D. 업종 대비** — `us_sector_relative` 2026-08-10 정지(이 STEP에서 재조회 안 함 — DB 쓰기 0 원칙, 1014 이전 STEP들의 관측을 그대로 인용). **정지 자체가 D의 `sector IS NOT NULL` 게이트에 걸리는지는 정지 상태의 구체적 값(sector가 null로 남는지, 옛 값이 유지되는지)에 달려 있고 이 STEP은 재조회하지 않았으므로 확인불가로 남긴다.**

🔴 이 세 가지는 "언젠가 고칠 것"이 아니라 **오늘 이 질문들에 답할 수 없거나(D 일부) 낡은 답을 새 답처럼 내보내고 있다는(E·G) 사실**이다.

---

## 6. 오늘 밤 관측 (§2-7)

작업 시각 확인: **2026-08-13T15:25:22Z**(UTC) — `us-perf`(22:00 UTC)·`revdcf`(22:45 UTC) 둘 다 **미도래**. 크론 호출 없이 읽기만:

| 항목 | 값 | 판정 |
|---|---|---|
| `us_market_cap_nasdaq` 행수 / as_of | 0 / null | 미도래 |
| `cron_heartbeats.job='us-perf'` | 행 없음 | 미도래 |
| `cron_heartbeats.job='revdcf'` | 행 없음 | 미도래(1007부터 계속 이월) |
| `cron_heartbeats` 현재 4행 | email-brief(ok)·jp-disclosures(ok)·kr-lens-scores(ok)·lens-scores(**ok=false**, last_run 2026-08-12 21:58 UTC) | 1014 시점과 동일, 변화 없음 |

`us_stock_perf` 행수·`nasdaqError` 등 나머지 항목은 위 두 크론이 안 돌아 관측 대상 자체가 없음(미도래).

---

## 게이트7 — git 미추적 파일 참조 검사

🔴 **신규 발견 — `docs/ANSWERABILITY_MAP.md` 자체가 이 STEP 착수 시점까지 git에 한 번도 커밋되지 않았다.** `git log --all -- docs/ANSWERABILITY_MAP.md` 빈 결과, `git ls-files`도 빈 결과로 확인 — 1014가 `docs/step_orders/`에서 발견한 것과 **정확히 같은 패턴**이다. 이 문서는 §1이 스스로를 "출력 쪽 정본"이라 부르는 기초 문서인데도 2026-08-13 작성 이후 로컬에만 존재했다. 이번 커밋에 `docs/ANSWERABILITY_MAP.md`(갱신본)와 `docs/step_orders/STEP1015.md`를 함께 편입해 보존한다(1014와 같은 원칙 — CLAUDE.md 아카이브 조항).

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- 오늘 밤 관측(§6) — 22:00·22:45 UTC 둘 다 미도래, 다음 세션 이월.
- A의 `skipKeyFor()`(`lib/revdcf/skipKey.ts`) 내부 사유별 매핑 전수 대조 — 파일 존재만 확인, 상세 미대조(이 STEP 범위 밖).
- G의 `asOf`를 실제로 렌더하는 관심목록 클라이언트 컴포넌트 코드 확인 — API 응답까지만 추적.
- H의 `sector=null`일 때 `ExploreClient.tsx` 실제 렌더 확인 — 간접 인용만, 직접 열람 안 함.
- D의 `us_sector_relative` 08-10 정지 상태의 구체적 값(재조회 시도 안 함, DB 쓰기 0·이 STEP은 select만 허용되나 이미 알려진 정지 상태를 새로 재는 것은 범위 밖으로 판단).

**철회·정정한 것**
- A~H 8개 항목 전부에서 초안의 "성립 조건"·"필요값"·"한계 고지" 문구 중 최소 하나씩이 코드와 달라 정정했다(§1 각 항목의 "🔴 초안 정정"/"🔴 필요값" 행 참조). 특히 **E·G의 신선도 게이트는 존재 자체가 확인되지 않아 "확인불가"로 하향**했다(초안은 이미 성립 조건인 것처럼 서술했었음).

**미측정으로 남은 것**
- §4의 규칙 신설 판정 6건 — 장은태 몫.
- §2의 A/C 이론적 경합(두 개의 독립 as_of 조회) — 실제로 값이 갈린 사례 관측 안 됨, 재현 시도도 안 함(DB 쓰기 0).
- D 항목의 08-10 정지가 실제로 사용자 화면에 어떻게 보이는지(빈 섹터로 보이는지, 옛 값이 유지되는지).

🔴 **규칙 신설·§3 확정·LLM 배선은 이 STEP에서 하지 않는다. 표를 채우는 것까지다.**
