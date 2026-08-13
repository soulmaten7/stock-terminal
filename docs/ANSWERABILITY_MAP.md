# 🗺️ 답변 가능성 지도 (Answerability Map) — 출력 쪽 정본

> **결정 기록: 2026-08-13, 장은태 · Cowork 논의**
> 🔴 **이 문서는 초안이다. 모든 행이 `🟡 미검증`으로 시작하며, 코드 대조(STEP 1015~)를 거쳐야 `✅`가 된다.**
> 🔴 검증되지 않은 행을 LLM에 넘기거나 제품 문구의 근거로 쓰지 않는다.
> 🟢 **2026-08-13 STEP 1015 — A~H 8개 항목 전수 코드 대조 완료.** 결과 = `조건확정 0 / 확인불가 2(E·F) / 불일치 6(A·B·C·D·G·H)` — 8개 전부에서 초안이 최소 한 군데 코드와 달랐다(상세 = `docs/probe_1015_answerability_audit.md`). 🔴 **공통 패턴**: `docs/CRON_OBSERVABILITY.md`의 신선도 임계값(49h·30h)은 `health` 크론 전용 모니터링 값이며, 실제 서빙 API 어디도 그 값을 게이트로 쓰지 않는다 — E·G는 지금 낡은 값을 성립인 것처럼 계속 내보내고 있다.

---

## §0. 왜 이 문서가 있는가

`docs/DATA_SOURCE_CATALOG.md`는 **입력 쪽 지도**다 — "이 값을 어디서 가져오는가"(`슬롯 → 소스`).
이 문서는 그 **역방향**이다 — "이 질문에 답하려면 어떤 값이 필요하고, 그 값이 언제 성립하는가"(`질문 → 필요값 → 조건`).

### 왜 필요한가 (장은태 논지)
모델이 완성되면 **어떤 데이터에서 어떤 답변이 도출되는지가 확정된다.** 슬롯이 20개로 유한하므로 거기서 나오는 값도 유한하고, 따라서 **답할 수 있는 질문의 집합도 유한하게 확정된다.**
→ "우리 데이터 안에서만 답한다"는 사후 필터가 아니라 **구조적으로 이미 정해진 경계**다.

### 왜 문서로 옮겨야 하는가 (Cowork 논지)
🔴 **"우리가 아는 것"과 "시스템이 아는 것"은 다르다.**
지금 그 지식은 사람 머릿속과 여러 문서에 흩어져 있고, 기계가 읽을 수 있는 한 곳에 없다.
🔴 **STEP 1011이 그 위험을 실측으로 증명했다** — 우리가 우리 시스템을 서술해둔 슬롯 20줄 중 **5줄(25%)이 실제 코드와 달랐다.**
사람이 읽는 문서는 25% 틀려도 사람이 보정하며 굴러간다. **LLM에 넘기는 순간 그 25%가 자신 있는 오답이 된다.**

### 어디에 쓰이는가
1. **지금** — 이 표를 채우다 보면 모델의 구멍이 드러난다(예: 슬롯 #19는 외부 벤치마크가 없어 "우리 유니버스 중앙값 대비"로만 말할 수 있다 → 답변 문구에도 그 한계가 반영돼야 한다)
2. **나중** — 자체 AI가 이 표를 따라간다. 조건이 안 맞으면 "말할 수 없다"가 나오고, 그건 창의성이 아니라 **조회 결과**다

🔴 **판정은 LLM이 하지 않는다.** 성립 조건은 결정론적 코드가 평가해 결과만 넘긴다. LLM에 맡기면 어떤 날은 말하고 어떤 날은 안 한다.

---

## §1. 표 형식

각 행은 아래 6칸을 채운다.

| 칸 | 내용 | 규칙 |
|---|---|---|
| **질문 유형** | 사용자가 물을 법한 형태 | 자연어 한 줄 |
| **필요값** | 그 답에 들어가는 컬럼 전부 | `테이블.컬럼` |
| **성립 조건** | 언제 답해도 되는가 | 🔴 **불리언 식으로** — "적당히 신선하면" 금지 |
| **불성립 시 문구** | 못 답할 때 무엇이라 말하는가 | 🔴 **이유를 밝힌다.** "정보 없음"으로 뭉개지 않는다 |
| **한계 고지** | 답하더라도 함께 말해야 하는 것 | 없으면 `없음` |
| **근거** | 그 조건이 코드 어디에 있는가 | 🔴 `파일:줄번호`. 없으면 `확인불가` |

---

## §2. 답변 가능 영역 — 초안 (🔴 전 행 미검증)

### A. 역DCF / 적정가치
| 항목 | 내용 |
|---|---|
| 질문 유형 | "이 종목 시장이 기대하는 게 뭐야?" · "적정가치 대비 어때?" |
| 필요값 | `revdcf_results.verdict` · `gap_years` · `wacc` · `explained_pct` · `threshold_margin` · `monotonic` · `flags` · `skip_reason` |
| 성립 조건 | ~~🟡 `skip_reason IS NULL` **AND** 해당 `as_of`가 최신 **AND** `REVDCF_ENABLED`~~ → ✅ **`REVDCF_ENABLED === true` AND `EXISTS revdcf_results WHERE symbol=X AND as_of=MAX(as_of)`**. 🔴 **`skip_reason`은 성립 조건이 아니다** — `verdict='skipped'`도 섹션이 그대로 렌더된다(헤드라인만 바뀜) |
| 불성립 시 | ✅ `skip_reason` 값을 `skipKeyFor()`가 문구로 매핑(맵 밖 값은 `"unspecified"` 중립 폴백) — 단 이건 "미노출"이 아니라 "다른 헤드라인"이다 |
| 한계 고지 | 🟡 **역DCF는 예측이 아니라 "현재 주가가 함의하는 기대치"의 역산**이다. 🔴 이 문구를 빼지 않는다(i18n 문구 상세 미대조) |
| 근거 | ✅ `app/api/revdcf/route.ts:18,27-29,31-32` · `components/RevDcfSection.tsx:37,77,126` — 상세 = `docs/probe_1015_answerability_audit.md` §1-A |

### B. WACC 민감도
| 항목 | 내용 |
|---|---|
| 질문 유형 | "할인율이 달라지면?" |
| 필요값 | `revdcf_results.gap_wacc_minus1` · `gap_wacc_plus1` · `wacc` · `beta_unlevered` · `de_ratio` |
| 성립 조건 | ~~🟡 A와 동일 + 세 값 모두 non-null~~ → ✅ **A와 동일(별도 게이트 없음). `band.minus1`/`band.plus1`는 null-세이프로 항상 렌더**(null이면 `"—"`) — "모두 non-null"은 게이트가 아니다 |
| 불성립 시 | ~~🟡 "민감도를 계산하지 못했습니다" + 이유~~ → ✅ **그런 문구 없음.** 해당 칸이 그냥 `"—"`로 남는다 |
| 한계 고지 | ✅ ±1%p 두 점만이다. **연속 곡선이 아니다**(`wLow = wacc-0.01`, `wHigh = wacc+0.01`) |
| 근거 | ✅ `RevDcfSection.tsx:51-52,97-99` — 상세 = `docs/probe_1015_answerability_audit.md` §1-B |

### C. 밸류에이션 배수
| 항목 | 내용 |
|---|---|
| 질문 유형 | "PER/PBR/PSR/EV-EBITDA는?" |
| 필요값 | `us_valuation.per` · `pbr` · `psr` · `ev_ebitda` · `per_basis` · `fundamentals_fiscal_year` · `fundamentals_age_days` · `unavailable` |
| 성립 조건 | ~~🟡 해당 축 non-null **AND** `unavailable`에 그 축이 없음~~ → ✅ **`EXISTS us_valuation WHERE symbol=X AND as_of=MAX(as_of)`(없으면 라우트 전체 404). 축별 `value`가 null이어도 게이트 없이 `"—"`로 렌더된다** |
| 불성립 시 | 🔴 **정정 — `unavailable`은 이 테이블(`us_valuation`) 소속이 아니라 `us_sector_relative`(D의 테이블)에서 온다.** `us_valuation.unavailable`엔 세부 사유 11종(MISSING_MARKET_CAP·NEGATIVE_EARNINGS·MISSING_EQUITY 등, `lib/valuation.ts`)이 **계산은 되지만 API가 select 안 해 화면에 전혀 안 뜬다.** 화면엔 D의 3종(NO_SECTOR/NO_VALUE/SAMPLE_TOO_SMALL)만 노출 |
| 한계 고지 | 🟡 **분자는 오늘 시총, 분모는 최근 제출 회계연도**다. `fundamentals_age_days`는 API에 없음(select 안 함) — `fiscalYear`·`per_basis`만 노출. 🔴 **`asOf`도 API 응답엔 있으나 컴포넌트가 렌더하지 않는다**(타입 선언 외 사용처 0건) |
| 근거 | ✅ `app/api/q1/[symbol]/route.ts:28-35,37-39,53` · `lib/valuation.ts:66-96` · `components/Q1Section.tsx:44-48,56-60,76,86` — 상세 = `docs/probe_1015_answerability_audit.md` §1-C |

### D. 업종 대비
| 항목 | 내용 |
|---|---|
| 질문 유형 | "업종 대비 싼가?" |
| 필요값 | ~~`us_sector_relative.per_rel`·`per_med`~~ → ✅ **실제 컬럼명 = `per_pct`(및 pbr/psr/ev_ebitda 4축 동형) · `min_sample`(테이블 레벨) · `sector` · `as_of`**(❌ `sector_as_of`라는 컬럼은 없다. ❌ `per_med`도 없다 — 이 테이블은 업종 중앙값을 저장하지 않고 백분위만 저장) |
| 성립 조건 | ✅ **코드와 일치** — `sector IS NOT NULL`(아니면 4축 전부 `NO_SECTOR`) **AND** `<축>_n >= min_sample(=20)`(아니면 `SAMPLE_TOO_SMALL`) |
| 불성립 시 | ✅ "이 종목의 업종 표본이 n개로 문턱(min_sample)에 못 미쳐 비교할 수 없습니다" — 코드가 실제로 이 3종(NO_SECTOR/NO_VALUE/SAMPLE_TOO_SMALL)을 구분해 반환 |
| 한계 고지 | 🔴 **슬롯 #19 한계**: 업종 배수의 외부 벤치마크가 없다. 이 비교는 **우리 유니버스 안의 중앙값 대비**이지 시장 전체 기준이 아니다. 🔴 이 문구를 빼지 않는다 |
| 근거 | ✅ `supabase/migrations/20260809_us_sector_relative.sql:6-19` · `lib/sectorRelativeBatch.ts:70,91,98,103` · `lib/sectorRelative.ts:47` — 상세 = `docs/probe_1015_answerability_audit.md` §1-D |

### E. 7렌즈
| 항목 | 내용 |
|---|---|
| 질문 유형 | "이 종목 렌즈 판정은?" |
| 필요값 | `lens_scores`의 7축 `*_value`/`*_state` · `lens_cuts`(market='US')의 `lo`·`hi`·`n`·`method`·`as_of` |
| 성립 조건 | ~~🟡 종목이 유니버스(시총 상위 1000)에 있음 **AND** `lens_cuts` 신선도 ≤ 49h(STEP828)~~ → 🟡 **확인불가(후반부) — `isActiveSymbol()` 게이트만 코드에 있다. `lens_cuts` 49h 신선도는 `/api/lens` 서빙 경로에 전혀 없다.** 49h는 `health` 크론(`app/api/cron/health/route.ts:86-96`) 전용 모니터링 값이고, 판정 계산(`lib/lensCompute.ts`)은 컷의 `as_of`를 아예 참조하지 않는다(응답 구조에 신선도 필드 자체가 없음) |
| 불성립 시 | 🔴 **정정** — "컷 기준일을 명시하고 판정을 그대로 쓰지 않는다"는 코드가 존재하지 않는다. **지금 US `lens_cuts`가 15일 묵었어도 `/api/lens`는 그 값 그대로 정상 200과 판정을 계속 내보낸다.** "불성립 처리"가 아니라 **"낡은 값을 성립인 것처럼 계속 내보내는 중"**이 정확한 상태 |
| 한계 고지 | 🔴 **7렌즈는 합산하지 않는다**(제품 설계 원칙). 종합 점수를 만들어 말하지 않는다. 🔴 컷은 p30/p70 **상대 분위**다 — 절대 기준이 아니다(1015에서 코드 재확인 안 함, 1011 인용) |
| 근거 | ✅ `app/api/lens/route.ts:88` · `lib/lensCuts.ts:65-73` · `app/api/cron/health/route.ts:86-96` — 상세 = `docs/probe_1015_answerability_audit.md` §1-E |
| 🔴 현재 상태 | **US `lens_cuts`가 2026-07-30 정지(15일)** — 게이트가 없어 이 항목은 "불성립"이 아니라 **"낡은 컷으로 계속 성립 판정을 내고 있다"**(1015 확인) |

### F. 재무 원문 수치
| 항목 | 내용 |
|---|---|
| 질문 유형 | "매출/순이익/자기자본은?" |
| 필요값 | `us_fundamentals.revenue`·`net_income`·`equity`·`operating_income`·`dna`·`debt`·`non_operating_assets`·`shares`·`fiscal_year`·`source_tags`·`unavailable_reason` |
| 성립 조건 | 🔴 **정정 — 그 이전에, 이 질문에 답하는 API·컴포넌트가 존재하지 않는다.** `us_fundamentals`를 읽는 코드는 3곳뿐이며 전부 내부 배치 계산용(`app/api/cron/revdcf/route.ts`·`lib/valuation.ts`·`lib/revdcf/drivers.ts`) — 사용자 요청에 원문값을 돌려주는 GET 라우트가 0건. 컬럼 자체는 전부 존재(`supabase/migrations/20260808_us_fundamentals.sql:4-20`)하나 **저장만 되고 서빙되지 않는다** |
| 불성립 시 | 🟡 확인불가(서빙 코드가 없어 판정 자체가 없음) |
| 한계 고지 | 🟡 **SEC 제출 원문 기반**(벤더 정규화 아님, i18n 상세 미대조). 🔴 **`shares`는 `source_tags`에 태그 기록이 없다**(STEP1011 실측·1015 재확인) — 단 F 전체가 서빙되지 않는다는 더 근본적 사실 위에 얹힌 지엽 사항 |
| 근거 | 🟡 **확인불가(기능 자체 없음)** — `grep -rln "us_fundamentals" app/ lib/ components/` 결과 3개 내부 파일만, 서빙 라우트 0건. 상세 = `docs/probe_1015_answerability_audit.md` §1-F |

### G. 시가총액 · 주가 · 수익률
| 항목 | 내용 |
|---|---|
| 질문 유형 | "시총/주가/최근 수익률은?" |
| 필요값 | `us_market_cap.market_cap`·`as_of` · `us_stock_perf.price`·`r1d`~`r1y`·`amount` |
| 성립 조건 | ~~🟡 `as_of` 신선도 ≤ 30h~~ → 🔴 **정정 — 관심목록 API(`app/api/watchlist/quotes/route.ts`)에 그런 게이트가 없다.** 값은 신선도 무관하게 항상 반환되고, `asOf`를 별도 필드로 함께 내보내 "정직화"할 뿐(STEP829 §7, 코드 주석은 "최대 25h"라 적어 `CRON_OBSERVABILITY.md`의 30h와도 **숫자가 다르다**) |
| 불성립 시 | 🟡 `asOf` 필드는 실제로 API 응답에 나간다(`:129-142`) — 🔴 **어떤 화면이 이를 실제 렌더하는지는 1015에서 확인 못 함**(클라이언트 컴포넌트 범위 밖). 🔴 값 자체는 낡아도 차단 없이 그대로 나간다 |
| 한계 고지 | 🟡 시총의 **계산기준이 미명시**다(야후). 재무제표 주식수와 다른 계열일 수 있다 |
| 근거 | ✅ `app/api/watchlist/quotes/route.ts:127,136-140` vs `docs/CRON_OBSERVABILITY.md:146-147`(숫자 불일치, 25h vs 30h) — 상세 = `docs/probe_1015_answerability_audit.md` §1-G |
| 🔴 현재 상태 | **373건이 2026-07-30 이후 갱신 없음**(296건 고정) — 게이트가 없어 이 373건도 차단 없이 그대로 응답에 나간다(1015 확인). `asOf`만 07-30으로 정직하게 찍힘 |

### H. 섹터 분류
| 항목 | 내용 |
|---|---|
| 질문 유형 | "이 종목 어느 업종이야?" |
| 필요값 | ~~`us_sector_wide.*`~~ → 🔴 **정정 — 실제 라이브 화면이 쓰는 테이블은 `us_sector_resolved`**(다른 테이블, `app/api/sector/us/route.ts:4,11,16`). `us_sector_wide`는 별개 갱신 경로이며 코드 주석이 직접 "여기 쓰면 화면이 움직인다"고 이 둘을 구분하고 있다(`supabase/migrations/20260808_sector_cuts_applied.sql` 헤더) |
| 성립 조건 | ✅ `EXISTS us_sector_resolved WHERE as_of=MAX(as_of)`(없으면 `{asOf:null, items:[]}`). `sector`가 null이어도 게이트 없이 그대로 반환 |
| 불성립 시 | 🟡 확인불가(프론트 렌더 확인 못 함 — `ExploreClient.tsx:467` 간접 인용만) |
| 한계 고지 | 🔴 **구현 자체가 없음** — `app/api/sector/us/route.ts:16`이 select하는 컬럼은 `symbol, sector, source` 3개뿐. `disagree`·`cross_nasdaq`·`cross_sic`·`cross_yahoo`는 테이블엔 있지만(마이그레이션 확인) 이 쿼리가 가져오지 않는다. 전 코드베이스에서 `disagree`를 참조하는 곳은 `lib/sector.ts`·`lib/sectorCuts.ts`(내부 계산)뿐, `app/**`·`components/**` 0건 |
| 근거 | ✅ `app/api/sector/us/route.ts:4,11,16` · `supabase/migrations/20260808_sector_cuts_applied.sql:11-25` — 상세 = `docs/probe_1015_answerability_audit.md` §1-H |

---

## §3. 🔴 답하지 않는 영역 (모델 밖)

**이 목록은 축소하지 않는다.** 좁은 게 결함이 아니라 신뢰의 근거다.

- **투자 추천** — "사야 하나/팔아야 하나". 🔴 **어떤 형태로도 하지 않는다.** 7렌즈를 합산하지 않는 제품 원칙과 같은 이유다
- **가격 예측** — 목표주가, "얼마까지 갈까"
- **뉴스·사건 해석** — "어제 왜 빠졌어". 별도 파이프라인(요약)이고 계산 모델과 무관하다
- **경영진·제품·경쟁력 정성 평가** — 모델에 입력이 없다
- **거시 전망** — 금리·환율·경기
- **비상장·해외(비US)** — 🔴 **전면 US 단독**. KR 포함 동결
- **모델 밖 재무 항목** — 슬롯 20개에 없는 값(현금흐름 세부, 세그먼트, 지분법 등)

🔴 이 영역의 질문에는 **"모릅니다"가 아니라 "이건 제 계산 범위가 아닙니다"**라고 답한다. 둘은 다르다.

---

## §4. 이 문서의 완료 조건

1. ✅ **2026-08-13 STEP 1015** — A~H 8개 항목의 **성립 조건이 불리언 식**으로 재작성됐다(자연어 서술 아님). 단 그 결과 **8개 중 6개는 초안이 코드와 달랐고(불일치), 2개(E·F)는 초안이 서술한 조건 자체가 서빙 경로에 없었다(확인불가)** — "적혔다"이지 "초안이 옳았다"가 아니다
2. ✅ **2026-08-13 STEP 1015** — 각 조건의 **근거가 `파일:줄번호`**로 붙었다(F는 "근거 없음"이 근거 — 서빙 코드 자체가 없다는 사실을 `파일:줄번호`형태로 명시: 해당 파일들 자체가 계산 내부용임을 인용)
3. 🟡 **부분** — #19·#2 두 슬롯은 교차 확인 완료(1015). 그 외 슬롯과의 전면 교차는 안 함(1011이 이미 20슬롯을 검증했으므로 재검증 범위 밖으로 판단, §5 참조)
4. ⬜ §3 목록이 장은태 판정으로 확정됐다
5. ⬜ 새 질문 유형을 추가할 때의 절차가 정해졌다
6. ⬜ **2026-08-13 STEP 1015 신규 미결 6건**(판정 요청, `docs/probe_1015_answerability_audit.md` §4) — 신선도 게이트 실제 도입 여부(E·G) · 임계값 문서 정본 정리(49h·30h vs 25h) · C의 세부 unavailable 11종 노출 여부 · H의 disagree·cross_* 노출 여부 · F를 별도 API로 만들지 §3으로 옮길지 · A/C의 독립 as_of 조회 중복 통합 여부

🔴 **1~3이 끝나기 전에는 이 표를 LLM 배선이나 제품 문구의 근거로 쓰지 않는다.**

---

## §5. 관련 문서
- `docs/DATA_SOURCE_CATALOG.md` — 입력 쪽 지도(짝 문서)
- `docs/REVDCF_SPEC.md` · `docs/VALUATION_SPEC.md` — 계산 정의
- `docs/CRON_OBSERVABILITY.md` §5 — 신선도 임계 **정본**(이 문서의 신선도 조건은 사본이다. 다르면 그쪽이 옳다)
- `docs/step_orders/_TEMPLATE.md` — 명령서 전제 점검 서식
