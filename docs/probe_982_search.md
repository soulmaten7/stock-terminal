# STEP 982 — 3번 규칙 기록 (①-A 3회 · ①-B 3회)

> 조사 전용. 코드 0줄·DB 쓰기 0. 🇺🇸 US 단독.

## A-0 (우리 자산) — 먼저 연 것

- `lib/lensPrecompute.ts:53-67`(`capGateDecision`)·`:344-465`(`computeLensScoresFor` 컷 유도 블록) — 코드로 직접 확인(1-3 근거).
- `cron_heartbeats` 테이블(`job='lens-scores'`) — 라이브 조회, 08-09 실행의 실제 게이트 값 확보(2-1·3 근거). 🔴 **테이블 자체가 `job` 단일PK라 이력이 없다** — "최신 1건"만 본다는 한계를 안고 시작.
- `docs/probe_949_mcap_gap.json` — 미해결 14번의 기존 실측(us_market_cap STALE 380건, 전부 2026-07-30). 이번 STEP의 발견과 날짜가 겹친다.
- `docs/STATE.md` 미해결 13·14·16번 — 배경 그대로.

## ①-A — 원전·공식문서 (3회)

**A-1. Kenneth French 공식 데이터라이브러리 — B/M(밸류) 팩터**(WebSearch로 발견 → 페이지 확인 시도, 상세본문 접근은 실패했으나 검색 스니펫과 2차 학술 PDF 서술이 일치)

우리 p30/p70 분포컷과 **정의가 동일**하다: *"B/M breakpoints are the 30th and 70th percentiles of B/M for NYSE stocks"*. 갱신은 **연 1회(매년 6월, 이른바 "June formation") — 그 뒤 12개월은 고정**. `lensPrecompute.ts:433`의 주석("학술·업계 '표준'이라서가 아님")은 **30/70이라는 숫자의 출처**에 관한 것이지 **갱신 주기**에 관한 것이 아니었다 — 이번에 처음으로 갱신 주기 쪽 원전을 봤다.

**A-2. Kenneth French 공식 데이터라이브러리 — 모멘텀 팩터 상세 페이지**(`det_mom_factor.html`, WebFetch로 직접 확인)

> *"The monthly prior (2-12) return breakpoints are the 30th and 70th NYSE percentiles."* — *"The portfolios, which are formed monthly..."*

🔑 **모멘텀만 월 1회 재계산, 밸류/사이즈는 연 1회.** 원전이 이미 **팩터마다 갱신주기를 다르게 둔다** — "얼마나 자주 흔들리는 값인가"에 따라 재계산 주기를 다르게 잡는다는 뜻. 이건 우리가 3단계에서 실측한 "모멘텀 컷이 5개 렌즈 중 가장 많이 움직였다(differ 6.9%, 최대)"와 **정확히 같은 방향**이다 — 원전이 예상하는 바와 우리 실측이 부합한다.

**A-3. 학술 PDF 재확인**(`fama_french_methodology.pdf`, Swedish House of Finance — WebSearch 스니펫으로 확인, 원문 직접 열람은 실패[HTML 오인식])

*"portfolios are rebalanced annually at a fixed date (commonly June)... breakpoints calculated at the end of June are 'held fixed' for the subsequent period."* — A-1을 3번째 각도(2차 학술 정리)로 재확인.

🔴 **미독**: 원전 1차 논문(Fama-French 1992/1993)은 이번에 직접 안 읽음 — 전부 데이터라이브러리·2차 정리본을 통해서만 확인.

🔑 **①-A 결론**: 원전(팩터모델 표준)은 "컷이 하루 이틀 늦어도 문제"라는 서술이 없다 — 오히려 **연 단위 고정이 정상**이다(모멘텀만 예외적으로 월 단위). **11일 정지 자체는 원전 기준으로 "이례적으로 나쁘다"고 말하기 어렵다.** 문제는 정지 기간의 길이가 아니라 **정지가 의도(스케줄)가 아니라 사고(게이트 실패)라는 것**과 **정지 사실이 화면에 드러나지 않는다는 것**(982 범위 밖 — 표시 문제는 981/980과 같은 미결 목록).

## ①-B — 타 플랫폼 실무 (3곳, US 한정)

| 플랫폼 | 갱신 주기 | as_of 날짜 공개? |
|---|---|---|
| **Zacks Rank** | 매일 밤 재계산(검색 스니펫 다수 일치 — *"recalculated nightly... daily"*) | 페이지 자체는 봇 차단으로 직접 확인 실패(`www.zacks.com/stocks/zacks-rank` — "Pardon Our Interruption") — **미확인** |
| **Finviz 스크리너** | 서술 없음(WebFetch로 헬프 페이지 확인) | ❌ 없음 — "지연 1분" 시세 안내만 있고 필터·퍼센타일 갱신 주기·기준일 공개 없음 |
| **stockanalysis.com** | 해당 없음 | 개별 종목 페이지 자체에 **퍼센타일·업종 상대순위가 없음**(절대 지표만) — 비교할 대상 자체가 없다 |

🔑 **①-B 결론**: 확인 가능했던 2곳(Finviz·stockanalysis.com) 어디도 **"기준선이 언제 갱신됐는지" 날짜를 사용자에게 공개하지 않는다.** 우리 `cutSource`(시장·표본수·as_of를 화면에 그대로 노출)는 이 점에서 실무보다 이미 더 투명하다 — 단 **투명한 것과 그 값이 최신인지는 별개 문제**라는 게 이번 STEP의 핵심.

🔴 **못 채운 것**: Zacks Rank의 "매일 밤"이 실제로 무슨 게이트(결측 처리)를 쓰는지는 페이지 차단으로 확인 못함 — 미확인으로 남긴다.
