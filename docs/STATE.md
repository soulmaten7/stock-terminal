<!-- 2026-08-10 -->
# 🚀 Trillion(트릴리언) — STATE (현재 상태 단일 정본)

> **이 파일 = "지금 어디까지 왔나 + 다음 뭐 할까"의 유일한 정본. 매 세션 덮어쓴다(배너 쌓기 금지).**
> 새 세션 읽는 순서: **이 STATE → `docs/REVDCF_SPEC.md`(모델 설계 정본) → `docs/SYSTEM_MAP.md`(아키텍처) → 작업별 PLAYBOOK** → 이력 = `docs/CHANGELOG.md` · STEP별 요약 = `docs/STEP_LEDGER.md`.
> 규칙: **현재상태=여기에만 · 이력=CHANGELOG·STEP_LEDGER에만 · 아키텍처=SYSTEM_MAP에만 · 모델 설계=REVDCF_SPEC·VALUATION_SPEC에만.**
> 🔴 **2026-08-10(STEP971) 재작성** — STEP947~970(2026-08-08~10) 이력이 이 파일에 그대로 쌓여 있었다. 현재 상태만 남기고 STEP별 서술은 CHANGELOG·STEP_LEDGER·REVDCF_SPEC·VALUATION_SPEC·probe로 옮겼다(포인터 유지, 내용 삭제 없음). 재작성 전 원문 = `git show HEAD~1:docs/STATE.md`(커밋 971 이전 어느 커밋이든).

---

## ① 최우선 확인 대기

- 🔴 **STEP969(부채 3분류) 반영 확인 — 2026-08-11 07:45 KST(=2026-08-10 22:45 UTC) 정규 크론 후.** `revdcf_results as_of='2026-08-10'`에서 `flags.debtBasis`가 채워지는지, `GM` verdict가 예측대로 `below_one`→`years`(gap5)로 바뀌는지 확인한다. 969 push는 970에서 완료(`f8693cc`) — 이 크론이 969 코드로 도는 첫 실행이다. 상세 = `docs/REVDCF_SPEC.md` §10-D·`docs/probe_969_debt_tags.json`.

---

## ② 확정된 모델 정의 (역DCF·Q1 코어)

> 서술은 각 정본 문서에 있다. 여기는 "무엇이 확정됐는가"의 목록과 링크만.

| 정의 | 확정 STEP | 정본 |
|---|---|---|
| 회계연도 관측 창 = 종목별 실재 최신 **연속 5개 연도** | 951 | `REVDCF_SPEC.md` §10-A |
| 제출버전(vintage) = **최신 제출값**(재작성 반영), `flags.restated`로 추적 | 965 | `REVDCF_SPEC.md` §10-B |
| PER·PBR = **보통주 기준**(`commonEquity`·보통주귀속순이익) | 963 | `REVDCF_SPEC.md` §10-B 인접·`VALUATION_SPEC.md` |
| 은행형 매출 = 표준 REV 4종 전무 시 **순이자수익+비이자수익** 폴백 | 967 | `REVDCF_SPEC.md` §10-C |
| 부채 = **확정0 / 확정값 / 모름**(`UNRESOLVED_DEBT`) 3분류 | 969 | `REVDCF_SPEC.md` §10-D |
| 업종 대비 = **백분위**(`empirical_rank`), `minSample=20` | 952·956 | `VALUATION_SPEC.md` 「업종 대비」 절 |
| 전체 조회 페이지네이션 = `fetchAllRows()`, 정렬키 **필수**(기본값 없음) | 954 | `lib/supabasePaging.ts`·`docs/probe_954_verify.json` |
| 섹터 해석 = `resolveSector()` 0~4순위(SPDR→Damodaran→형제→야후→미분류), 3순위=야후 단독 | 940·942 | `lib/sector.ts`·`docs/probe_942_final_resolve.json` |
| 유니버스(조달 범위) = **거래소 상장 N=2,857** | 867(장은태 승인) | `REVDCF_SPEC.md` §9(A-9⑤)·§11 |
| 엔진(풀이) = 원전 그대로 — 도미노 오차 0.0000·MIFP 8=8 | 848 | `REVDCF_SPEC.md` §6 |
| 예측 지평 = 원전대로 **25년**, fade=계단 고정, 터미널=`NOPAT(1+i)/(WACC−i)` | 859 | `REVDCF_SPEC.md` §6-7 |
| 모델 완성 정의 = **DoD9(라이브 노출) 제외 8항목 닫힘** | 921(장은태 승인) | `LENS_COMPLETION_STANDARD.md` |

**DoD 현황(9항목)**: 1·2·4·5·6·8 = ✅ · 3 = 🅿️(도메인 상한 종결, 903 장은태 승인) · 7 = 🔶(미결, ④ 참조) · 9 = ❌(보류, production 노출 승인 전제·별도 트랙). 상세 표·근거 = `LENS_COMPLETION_STANDARD.md`.

**기능 플래그 현황**: `REVDCF_ENABLED` = Production **OFF**(불변, 노출은 장은태 승인 필요) · `Q1_ENABLED` = 기본 **OFF**(957). 로컬 dev(`localhost:3333`)는 `REVDCF_ENABLED=true`로 기동 중 — 육안 검증용.

**Q1 재료 현황**: PER·PBR = 기보유 · EV/EBITDA·PSR = 미보유(SEC 태그 조립 필요) · 역DCF = 604종목(기완성, 자기참조 유니버스 — ④ 참조).

---

## ③ 진행 중인 질문 (Q0~Q5, 정본 = `docs/USER_QUESTIONS_2026-08-08.md`)

🔴 **진행 순서 정본 = 질문 순서(Q0~Q5)다, DoD 순번이 아니다**(CLAUDE.md 규칙 6). 역DCF는 독립 질문이 아니라 **Q1의 최심층 축**(원전 *"not as a replacement"*).

| | 질문 | 상태 |
|:--:|---|---|
| **Q0** | 뭐 하는 회사인가 | 🟡 **부분 완료** — 6단계 중 ①~④ 완결(940·942·943·944), ⑤ 화면표시는 리스트만 완결(945·946)·**카드에 「업종 대비」는 아직 없음**(Q1 카드 대기), ⑥ 테스트 완료(946)·라이브 실측(DoD9)은 판정 보류. 완성기준 9항목 중 ✅3·🟡5·판정보류1 — 마감 시점표 = `LENS_COMPLETION_STANDARD.md` Q0 행 |
| **Q1** | 내가 비싸게 사는 건가 | 🟡 **①②단계만 완료, ③④ 미착수.** 확정 구성(C안) = 주축 PER·보조 EV/EBITDA·PBR·적자대안 PSR·심층 역DCF, 전 축 「업종 대비」 표시. ①재료(947~965)·②업종백분위(952~956) 완료 — 커버리지 18.2%(DoD 0/9). **③ 카드 설계 자료 확보(972), 판정 대기** — `docs/Q1_CARD_DESIGN.md`. **착수 전 필요**: 판정 ⓛ(disagree 표시 규칙) + 「기존 7렌즈를 수리할지 Q1~Q4 카드를 신설할지」 판정 |
| **Q2** | 현금을 돌려주나 | ⬜ 확정(B안 = 수익률+커버) · 구현 0 |
| **Q3** | 커지고 있나 | ⬜ 확정(매출 5년 CAGR 주축+감가상각전 영업이익 보조) · 구현 0 |
| **Q4** | 망할 위험은 없나 | ⬜ 미확정 — `fscore`가 이미 7렌즈에 부분 작동 중. 착수 전 CLAUDE.md 규칙3(기존 렌즈 검증 없이 재사용 금지) 적용 — Piotroski 2000 원전 대조 + 결함 실측 필요 |
| **Q5** | 뭔가 바뀌었나 | ⬜ 미확정 — `lens_state_changes` 재사용(US 2,274행·754종목·18일치 축적, 카드+피드 둘 다 구상) |

🔴 **「확정」≠「완료」.** Q0~Q3은 무엇을 만들지 정해졌을 뿐 코드 변경 0건.

---

## ④ 미해결 통합 목록

> 각 항목 = 무엇을 모르는가 · 크기 · 어디서 나왔는가 · 판정 필요 여부. 우선순위 없음 — 판정은 장은태.

**Q1/역DCF 모델**
1. **PBR·PSR·EV/EBITDA 잔여 잔차 ~8% 미규명**(968) — 재척도 제거 직접구성 후에도 남는 절대상대차 중앙값(PBR 8.29%·PSR 8.34%·EV/EBITDA 8.90%). Citigroup PBR·GM EV/EBITDA 2건만 개별 규명, 나머지 미분해. → `docs/probe_968_residual.json`
2. **Citigroup PBR 정의 갈림**(968) — 우리(`commonEquity`, 963 정책) 기준 +13.64%인데 총자기자본 기준으로 재계산하면 +3.92%로 좁혀짐. stockanalysis.com이 총자기자본 기준으로 추정(미확정). 963 정책 자체는 유효 — 외부와 정의가 다를 뿐, 판정 대상 아님. → `VALUATION_SPEC.md` STEP968 절
3. **CBSH 매출 1.52% 잔차 미완결**(967) — 대손충당금 차감 가설로 0.5%/0.23%까지 좁혔으나 완전히 안 닫힘. → `docs/probe_967_bank_revenue.json`
4. **PSR × Financials가 minSample(20)로 안 가려짐**(958·959, 판정 대기) — Damodaran 교과서 원문은 "매출이 측정 불가 개념"이라 명시하나 실측 n=61로 임계값 초과, 지금 계산·저장됨. `Q1_ENABLED` OFF라 화면 노출은 없음. → `docs/SECTOR_AXIS_APPLICABILITY.md`
5. **PSR 종목단위 정의 원문 미확보**(958·962·963, 세 번 시도) — Damodaran 자료 전부 업종 집계 정의뿐, 종목단위(총매출/순매출 구분 등) 없음. → `VALUATION_SPEC.md` 미해결 1번
6. **969 값→0 전환 10건 중 9건 미규명** — `ALKS`만 개별확인(vintage 시점 불일치로 추정), 나머지 9건은 같은 메커니즘 추정만. → `docs/probe_969_debt_tags.json`
7. **969 정의 미대조로 배제한 태그 6종** — `SeniorNotes`·`ShortTermBankLoansAndNotesPayable`·`NotesPayable`·`LoansPayableToBank`·`FinanceLeaseLiability`(단일)·`DebtInstrumentCarryingAmount`. 이 태그만 있는 종목은 `UNRESOLVED_DEBT`로 skip. → `REVDCF_SPEC.md` §10-D
8. **운영리스 자본화 — 범위 밖, 미판정**(969 대전제) — 손대지 않음.
9. **`BPOP`류(낡은 REV 잔여 데이터로 은행형 전환 안 됨)**(967) — 발견만, 처방 없음.
10. **은행 `operatingIncome` 태그의 개념 정합성**(967) — EV/EBITDA는 다른 게이트(driver5)로 이미 막혀 있어 당장 영향 없음.
11. **IFRS 외국사 197건 중 A분류(135건) — 선택지 3개 판정 대기**(966) — ①현행유지 ②`ifrs-full` 지원 추가(확실 25건·잠재 52건 회복) ③SEC 밖 소스(CLAUDE.md 정본원칙과 충돌). 🔴 기존 「ADR은 소속국가 탭에서 계산」 정책과 겹침(재론 안 함). → `docs/probe_966_ifrs_scope.json`
12. **NVDA 회계연도 라벨 표시 문구**(958, 판정 대기) — `fiscal_year=2025`로 저장(calYear 5월 경계 규칙)하나 NVDA 자체표기는 FY2026. 값은 SEC 원문과 일치, 표시 문구만 미정. Q1 카드 작업 시 함께 정한다. → `VALUATION_SPEC.md` 미해결 6번

**인프라·운영**
13. **`lens_cuts`(US) 07-30부터 정지**(00번) — `lens_scores`(앞단)는 08-07까지 정상 갱신, `lens_cuts`(뒷단)만 정지. 원인 미조사. 모멘텀·밸류·퀄리티·저변동·자산성장 5개 렌즈 판정이 정지된 컷으로 나가고 있다는 뜻. → `docs/DECISION_912_LIVE.md` §10~16
14. **`us_market_cap` 결측 380건 — `LOCAL_OK_PROD_FAIL`**(949) — 로컬은 정상(383/465 즉시 성공), Production은 8일 연속 실패. 원인 미확정. 처방 후보 A~D 기록만, 미채택. → `docs/probe_949_mcap_gap.json`
15. **역DCF 유니버스 자기참조 — 신규 편입 경로 없음**(00-3) — `route.ts:28`이 "직전 as_of의 CIK"만 물려받는 구조. 표본 5종목(`AMST`·`ANF`·`AVAH`·`ACRS`·`ACT`)이 8일 전체 `as_of`에 한 번도 없었음 확인. 소스는 보유(`us_market_cap` 5,900) — 편입 경로 자체가 코드에 없음. → `CHANGELOG.md` (83)·`REVDCF_SPEC.md` §10 #76·77
16. **정규 크론 실행 응답이 어디에도 저장되지 않음**(00-d) — `BUDGET_MS` 실제 소진 여부·`us_fundamentals` 순환 병목이 처리량인지 예산인지 미측정. Vercel Runtime Logs는 Hobby 플랜 1시간 보존이라 사후 확인도 불가. 처방 후보(판정 없음): ①`cron_heartbeats` 활용 ②응답 DB 적재 ③Sentry 전송.
17. **`us_fundamentals` 순증 속도 재추정 필요**(970) — 이전 추정 124건/일 → 1개 사이클 관측 40건(1,127→1,167). 최소 1사이클 더 관측 필요, 추세 단정 안 함. → `docs/probe_970_newwindow_live.json` §2-5
18. **fiscal_year null 197건 — IFRS 135건은 미해결(위 11번), 미국 은행형 19건은 967로 해소**, 잔여(B분류 47건·D분류 7건 등)는 개별 재검토 안 함. → `VALUATION_SPEC.md` 197종목 섹션
26. **🔴 `us_sector_wide` as_of=2026-08-09에 0행 → `us_sector_relative` 1167/1167 전부 NO_SECTOR**(972 발견) — 08-08은 1038/1127 정상. Q1 API가 최신 as_of만 읽어 지금 플래그를 켜면 전 종목이 미성립으로만 보임. 원인(크론 실행 순서 추정) 미규명, 코드 무접촉 원칙상 미수정. → `docs/probe_972_card_design.json` §0

**DoD·완성 기준**
19. **DoD7(화면 일관성) — "같은 이름"의 정의 자체가 원문에 없음**(923·929) — `years` 배지·육안검증 둘 다 해소됐으나 이 정의 공백 하나가 남아 🔶 미결. → `LENS_COMPLETION_STANDARD.md`
20. **DoD9(라이브 노출) — "KR·US 각 2종목" 원문이 US 전용 모델과 원리적으로 충돌**(929) — `docs/DECISION_929_DOD_SCOPE.md`(질문만, 답 없음).
21. **866~867 잔여**(재개는 장은태 지시 후) — Russell 3기준(최저주가$1·최저시총$30M·float5%) 우리 유니버스에서 몇 개 자르는지 미측정 · OTC 티어(OTCQX/QB/PINK/OTCID) 라벨 신뢰도 미규명(PINK 66.0% < OTCID 77.0% 역전 관찰) · ICC 정본 미선택(604기준 0.198 vs 전수기준 0.165) · skipped 89사(15%) 전수 규명(회수가능 vs 원리적 불가).
22. **Q0 disagree 266건 — 방향 판정 없음**(942) — `crossCheck.disagree=true` 목록만 저장, 판단 안 함.
23. **`us_sector_resolved`(Q0, 라이브 화면) 재생성 여부 — 판정 대기**(955) — `us_sector_wide`(계산용)와 페이지네이션 비결정성 버그를 공유했을 가능성(3/1,021건 확인), 라이브 화면이 읽는 표라 이동 시 별도 승인 필요.
24. **damodaran tier ⓑ 나스닥 5순위 추가 여부 — 판정 대기**(952b) — ⓐ(페이지네이션 원인)가 954로 해소돼 ⓑ의 상대적 이득이 줄었을 수 있음.

**🅿️ 배경(모델 완성 후, ⑤ 참조)**
25. **GICS 라이선스 유료화 선결 조건**·**「양방향」 유사투자자문업 규제** — ⑤ 참조.

---

## ⑤ 🅿️ 배경 (역DCF 밖 · 모델 완성 후 논의) · 정체성 · 워크플로우

🅿️ **수익화 사전조사(2026-08-09 대화) — 🔴 판정 없음, 모델 완성 후 논의.**
🔴 **최종 목적지(장은태): 모든 국가의 모든 종목을 우리가 만들거나 분석한 모델로, 무료 또는 최소 비용으로, 누구나 이해하기 쉽게 접근할 수 있게 하는 것. 🔴 그 본체는 「미국 시장 기준 모델의 완성」이다 — 미국이 덜 된 채 나라를 늘리면 결함이 나라 수만큼 복제된다(2026-08-09 Q1 하나에서 결함 4건 발생이 근거).**
구상: 종목 개별 조회는 무료, 우리 데이터 안에서만 답하는 LLM은 유료 구독 월 5,000원 수준.

① 🔴 GICS 라이선스가 유료화 선결 조건. 우리는 화면에 GICS 섹터명을 직접 표시하고 업종 필터·업종 백분위 기준으로 쓴다. MSCI FAQ: "GICS Direct는 고객 유형·규모에 따라 가격이 책정되며 라이선스 비용이 다르다", 면책에 "금융상품·서비스의 창출·제공·거래·마케팅·홍보에 사용될 수 없다". 🔑 대안: Damodaran 업종군(94개) — STEP 960에서 우리 industry_group과 어휘 94개 전수 일치 확인됨. 야후 비공식 API 의존도 같은 시점에 볼 것.
   출처: https://www.msci.com/documents/10199/5973a128-47f0-4317-b083-716a10207b50
② 🔴 「양방향」이 더 무거운 규제로 걸린다. 유사투자자문업 4요건 중 넷째가 단방향이고, "양방향 유료 영업이 투자자문업으로 규율되므로 등록 없이 운영하면 미등록 문제". LLM은 정의상 양방향이다. 다만 셋째 요건(투자조언 여부)이 핵심이며 "금융 지식이나 차트 보는 법을 알려주는 수준"은 조언이 아니라고 명시돼 있다.
   🔴 법률사무소 칼럼 기준이며 실제 법률 검토 필요.
   출처: https://bh-law.kr/ko/news/column/similar-investment-advisory-report-registration-leading-risk
③ 🔑 캐시 가능성 = 규제 경계선(설계 후보). 데이터가 하루 1회 갱신이라 종목별 답변을 하루 단위로 캐시할 수 있고, 그러면 원가가 사용자 수와 무관해진다. 그리고 캐시가 된다는 것은 답변이 사용자와 무관하다는 뜻이므로, 「캐시할 수 없는 답변은 하지 않는다」가 곧 「개별 맞춤 조언을 하지 않는다」가 된다. 🔴 미검증 아이디어, 법률 검토 전.
④ 🔴 XBRL 전 세계 현황(「모든 국가」의 기술적 토대): 미국 SEC 의무(2009~) · EU ESEF 의무(2020~) · 일본·호주·인도는 의무 또는 강력 권장 · 일부 관할권은 미도입. taxonomy는 나라마다 다르나, STEP 966에서 ifrs-full의 태그 우선순위 구도가 us-gaap과 구조적으로 동일함을 확인했다(ProfitLoss vs ProfitLossAttributableToOwnersOfParent = NetIncomeLoss 구도와 동일). 즉 미국 모델이 본체이고 타국은 매핑 작업이다.
   출처: https://www.colonialfilings.com/blog/is-xbrl-filing-mandatory-worldwide/

🔴 위 넷 중 어느 것도 지금 실행하지 않는다. Q0~Q5 완성이 먼저다.

🔴🔴 **🇺🇸🔒 전면 US 단독 — 한국 관련 전부 동결(2026-08-08 장은태 확정, 정본 = `CLAUDE.md`).** 동결이지 제거가 아니다 — `ACTIVE_MARKETS=["KR","US"]`·KR 크론 3개·`messages/ko.json`·KR 렌즈 976종목은 그대로 둔다(끄지 말 것). 신규 착수 금지: KR 대상 기능·수리·데이터소스·조사·`ko` 신규 문구·KR 전용 화면. US 완성 후 확장 1순위 = 한국(확정).

- **활성 시장 = KR·US뿐**(JP/CN(HK)/VN/GB 파킹 — `lib/activeMarkets.ts`). **7렌즈 = 유지·수정만**(깊이확장은 역DCF 완성 뒤). 판정 = 분포 유도 컷(`lens_cuts` p30/p70·RSI 30/70·F-Score 3/7만 고정). 미착수: JP/CN/VN/GB 렌즈 선계산·대화형 LLM·푸시/앱스토어.
- 사업자 **원트릴리언**(대표 장은태·210-39-33812) · **"종목을 보는 눈을, 누구에게나."**(무기·직시·자립·멍거 톤·예측·추천 안 함) · 5면·i18n ko·en 패리티.
- 🗂️ **문서 구조**: `docs/`에 `INDEX.md`(전체 카탈로그, 상태표기 4종) 존재 — 새 세션은 이 STATE 다음 필요시 그쪽을 본다. STEP 명령서는 이동 금지(참조·실행 관례).
- **Cowork=두뇌**(설계·문서·Supabase MCP·실행 안 함) / **Claude Code=손**(STEP 실행·빌드·git). 세션 종료 = STATE 덮어쓰기+CHANGELOG+push.

---

## ⑥ 다음에 할 일

🔴 **장은태 지시 후에만 착수한다.** 순서·우선순위는 이 STATE에 적지 않는다(장은태 결정 대기, 905 원칙).

- **Q1 착수 준비**: 판정 ⓛ(disagree 표시 규칙) · 「기존 7렌즈 수리 vs Q1~Q4 카드 신설」 판정 · EV/EBITDA·PSR SEC 태그 조립.
- **① 최우선 확인 대기**(위 참조) — 2026-08-11 07:45 KST 크론 후 969 반영 확인.
- ④ 미해결 목록 중 장은태가 판정 우선순위를 정하는 항목부터.
