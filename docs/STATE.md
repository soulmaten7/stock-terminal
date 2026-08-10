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
| 업종 대비 = **중앙값 배율**(`value/median`, 정본), 백분위는 대조군, `minSample=20`(둘이 공유) | 952·956·980 | `VALUATION_SPEC.md` 「업종 대비」 절 |
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
| **Q1** | 내가 비싸게 사는 건가 | 🟡 **①②단계만 완료, ③④ 미착수.** 확정 구성(C안) = 주축 PER·보조 EV/EBITDA·PBR·적자대안 PSR·심층 역DCF, 전 축 「업종 대비」 표시. ①재료(947~965)·②업종백분위(952~956) 완료 — 커버리지 18.2%(DoD 0/9). **③ 카드 설계 자료 확보(972), 판정 대기** — `docs/Q1_CARD_DESIGN.md`. 🔴 **축 구성 자체(4축 병렬 vs 업종별 대표배수) 조사 완료, 판정 대기(978)** — 원전(Damodaran)은 "하나만 고른다"를 명시 지지하나 11개 GICS 중 3~4개 섹터만 대응표 존재(나머지는 창작 금지에 걸림), 실무 3곳(은행·리츠·유틸리티 실조회)은 전부 다축 표시(단 헤드라인 위계 있음), 축간 답 갈림이 중앙값 31.6%p로 처음 실측됨 — `docs/Q1_AXIS_DECISION.md`. ✅ **업종 대비 계산방식 교체 완료(980)** — `us_sector_relative`에 `per_rel`등 8컬럼 배선, 크론 반영, 08-08·08-09 백필. 값 불변(md5 지문 일치)·순위보존(44칸 전수 2,995쌍 불일치 0)·커버리지(2,961/2,995, 979 예측 정확 일치) 전부 검증. 백분위는 대조군으로 유지(제거 안 함). ✅ **④ 야후 밸류 렌즈 제거 사전 조사 완료(981, 조사 전용)** — 괴리 중앙값 1.117배·p90 1.846배(대칭 ratio=max/min 정본), AMT(972 사례)는 전체의 70.9백분위(예외 아닌 평범한 쪽). 정지된 lens_cuts(07-30)로 재시뮬레이션한 cheap/mid/rich 판정이 510종목 중 103종목(20.2%) 달라지고 4종목은 완전히 반대 극으로 뒤집힘. US만 떼어낼 시장 분기점이 코드에 아예 없음(LENSES·LENS_KEYS·CUT_LENSES 전부 시장무관 단일배열) 확인 — 선택지 A~D 대가표만 작성. ✅ **982 판정: ⓐ 현행 유지**(Q1_ENABLED OFF라 두 PER이 화면에 동시 노출된 적 없음 — 재론 시점 = Q1 카드 켜는 때) + 선결질문 등재("KR 공유 코드를 읽고 확인하는 게 US 단독 위반인가" — ⓑ 착수 전 필수) → `docs/Q1_YAHOO_REMOVAL.md` §판정. **착수 전 필요**: 판정 ⓛ(disagree 표시 규칙) + 판정 ⓜ(축 구성 A~D) + 판정 ⓞ(배율 표시 형태·백분위 대조군 제거 시점) + 선결질문(KR 공유코드 열람이 US단독 위반인가) + 「기존 7렌즈를 수리할지 Q1~Q4 카드를 신설할지」 판정 |
| **Q2** | 현금을 돌려주나 | ⬜ 확정(B안 = 수익률+커버) · 구현 0 |
| **Q3** | 커지고 있나 | ⬜ 확정(매출 5년 CAGR 주축+감가상각전 영업이익 보조) · 구현 0 |
| **Q4** | 망할 위험은 없나 | ⬜ 미확정 — `fscore`가 이미 7렌즈에 부분 작동 중. 착수 전 CLAUDE.md 규칙3(기존 렌즈 검증 없이 재사용 금지) 적용 — Piotroski 2000 원전 대조 + 결함 실측 필요 |
| **Q5** | 뭔가 바뀌었나 | ⬜ 미확정 — `lens_state_changes` 재사용(US 2,274행·754종목·18일치 축적, 카드+피드 둘 다 구상) |

🔴 **「확정」≠「완료」.** Q0~Q3은 무엇을 만들지 정해졌을 뿐 코드 변경 0건.

---

## ④ 미해결 통합 목록

> 각 항목 = 무엇을 모르는가 · 크기 · 어디서 나왔는가 · 판정 필요 여부. 우선순위 없음 — 판정은 장은태.

**Q1/역DCF 모델**
1. ✅ **해소(975) — 「PBR·PSR·EV/EBITDA 잔여 잔차 ~8%」는 우리 모델 오차가 아니라 968 대조 방법(FY 가중평균희석주식수로 시총 구성)의 결함이었다.** 외부는 SEC 기말 실제 발행주식수를 쓴다는 것을 13종목 중 11종목에서 ±1% 이내로 직접 확인, 대조 방법을 기말발행주식수로 교체하니 PBR 중앙값 8.29%→0.053%·PSR 8.34%→0.112%로 수렴(PER은 예상대로 0.07%→3.99%로 커져 방법 정합성을 재확인). **정본 대조 방법(968 newBaseline) 갱신**: 이제부터는 "FY말종가×FY말 실제 발행주식수"가 정본. 잔여 예외(C·QXO·PROP·HGTY 등)는 아래 30~32번으로 개별 등재. → `docs/probe_975_residual_decomposition.json`
2. **Citigroup PBR 정의 갈림**(968, 975 재확인) — 우리(`commonEquity`, 963 정책) 기준 +13.64%인데 총자기자본 기준으로 재계산하면 +3.92%로 좁혀짐. stockanalysis.com이 총자기자본 기준으로 추정(미확정). 963 정책 자체는 유효 — 외부와 정의가 다를 뿐, 판정 대상 아님. 🔴 **975: shares를 기말발행 기준으로 바꿔도 10.28%→10.68%로 거의 안 움직임 — shares 문제가 아니라 이 항목(equity 정의)과 같은 건임을 재확인.** → `VALUATION_SPEC.md` STEP968·975 절
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
13. 🔴 **`lens_cuts`(US) 정지 = 14번의 증상, 단일 근본 확정(984)** — 13번·14번은 별개 사고가 아니라 **하나의 근본**(야후 배치조회 응답에서 `marketCap` 필드가 빠지는 것)이 게이트를 통해 밖으로 드러난 두 표현이다. `freshCoverage 93.04%<97%` → `coverageOk=false` → `cutGateOk=false`(`lensPrecompute.ts:453`) → 컷 스킵. 🔴 **정정(984, Cowork 오류)**: 이전에 "coverage와 composition을 별개로 고쳐야 한다"고 한 것은 코드 미확인 오류였다 — `capGateDecision`(`:53-67`)을 다시 읽으면 `compositionOk`도 `freshSet`(=coverage와 같은 marketCap 취득 성공 집합)에서 파생된다. 별개 원인 아님. 🔴 **정정**: "lens_scores는 08-07까지 정상 갱신"도 실측과 다름(11일 중 5일 US 갱신 0건, 982). 영향: 오늘 컷으로 재유도 시 최소 140종목(13.7%) 판정 변경. 🔴 **`health` 크론이 11일 내내 매일 이 stale을 Sentry에 올렸으나 대응은 0건이었다**(장은태 확인, Sentry 대시보드) — 감시가 없던 게 아니라 감시는 있었는데 대응 프로세스가 없었다. → `docs/LENS_CUTS_FREEZE_982.md`·`docs/probe_984_mcap_root_cause.json`
14. 🔴 **`us_market_cap` 결측 — `LOCAL_OK_PROD_FAIL`, 13번과 단일근본(984) + 재구성 관측 배선(986, 저장 안 함)** — 08-10 재확인 349건 정지(335건이 949의 380과 겹침=88% 지속). B그룹(82건, 원천 없음)과 겹침 0건 — D그룹(로컬은 되는데 프로드만 실패) 계열. heartbeat 실측(200응답인데 필드만 빔)·crumb 가설(약화, 기각 아님)은 984 그대로. 🔴 **근본원인 여전히 미규명.** 🔴 **986 정정**: 985의 "재구성 폴백을 배선한다" 판정은 **표본 1개(XOM 0.001%)에 근거한 오류**였다 — 전수 대조 p90 20%·최대 99.22%, 원인은 **복수클래스/트래킹주식 구조적 불일치**(sharesOutstanding=클래스별 vs marketCap=회사전체합산). ✅ **986: 복수클래스 판별 = 기존 `us_cik_map`(새 소스 없음)으로 충분**(같은 CIK 유니버스내 2개이상=복수클래스, 985의 10종목 10/10 일치 + FISK·OGCP·ESBA 추가 설명, 유니버스 88심볼·43CIK≈1.5%). ✅ **`lensPrecompute.ts`에 관측 전용 배선 완료**(저장은 여전히 안 함) — `reconstructable`·`reconstructableSingleClass`·`reconstructableMultiClass`·`noPriceEither`·`wouldBeCoverage`를 `cron_heartbeats.note`에만 기록, try/catch 격리(974원칙). **값 불변 증명**: 야후 1회조회로 구코드·신코드 동일데이터 대조 — `capOf`·`freshSet`·`batchOk`·`recovered`·`retryNoCapField`·`freshCoverage`(98.64%) **전부 완전 일치** 확인. 🔴 **이 환경은 여전히 984 프로덕션 실패(349건)를 재현 못 함**(이번 실행 재구성실패 61건 중 복수클래스 0건) — 실제 회수량은 프로덕션 며칠 관측 후에만 판단 가능. 저장 배선 여부는 그 관측 뒤로 미룸. → `docs/probe_986_reconstruct_observe.json`·`docs/probe_986_search.md`·`docs/VALUATION_SPEC.md` "시총 취득 경로" 절
🔴 **987 정정(장은태 지적)**: "회수량은 프로덕션에서만 관측 가능하다"던 986의 판단이 과했다 — **실패 종목의 정확한 심볼 목록(349개)이 `us_market_cap.as_of<08-09`에 이미 남아 있어서 기다릴 필요 없이 지금 재조회하면 되는 문제였다.** ✅ **987: 349건 직접 조회 완료 — LOCAL_OK_PROD_FAIL 정확 재현.** 349종목(+대조군100·환경정상 확인) 실시간 조회 → 응답 346건 중 **346/346(100%) marketCap 정상 수신**(무응답 3건=`GV`·`KVAC`·`PSTV`, SPAC·소형바이오텍 추정). 🔑 **결론 확정: 종목 문제가 아니라 프로덕션 환경 문제다 — 재구성은 이 349건 문제의 답이 될 수 없다**(재구성 가능 후보 자체가 0건, 235건 문턱 논의가 무의미해짐). 커버리지 시나리오(계산만): 재구성 반영해도 93.04%→93.04%(변화 없음, 97%게이트 그대로 미달). 🔴 **1-1 재현 중 불일치 발견·정정**: Cowork이 제시한 "복수클래스 48건" 수치는 986 자신이 확립한 "유니버스 내로 좁힌 정확한 정의"가 아니라 986이 명시적으로 오탐 위험으로 배제했던 "전역 `us_cik_map` 중복" 정의를 썼다 — 정확한 정의로는 4건(348건 중), 300건이 아니라 344건이 단일클래스. 나머지 4개 수치(349·348·235·07-30 338건)는 정확히 재현됨. → `docs/probe_987_stale349.json`·`docs/probe_987_search.md`
🔴 **988: 결정적 요인(11일간 같은 338건) 규명 — 부분 성공, 원인 미확정 유지.** 1-1(청크 균등분산 평균5.6·0건짜리 청크 없음·334/15분할·07-30 338건고정) **4개 전부 정확 재현**(987과 달리 이번엔 불일치 없음). 1-2: 987은 단건이 아니라 **배치100·동시성6**(프로덕션과 동일 파라미터)이었음을 코드로 확인 — 배치가설 부활 조건 불성립, 949 폐기 유지. **새로 기각한 가설 2개(코드+원전 대조, 배포 불필요)**: yahoo-finance2 버전차이(package-lock.json이 3.15.4로 정확히 고정 확인) · 실행시간예산소진(기존 heartbeat timeHit=false 재확인). **새로 제기 후 기각 2개**: Next.js fetch캐싱(force-dynamic+Next16공식문서 "Request-time API 감지시 매요청 fetch") · 웜인스턴스crumb상태누수(yahoo-finance2 4.0.0이 정확히 이 버그를 수정했으나 우리는 3.15.4 고정 — 단 Vercel Hobby가 몇분만 웜유지[Scale-to-One 14일은 Pro전용]라 "11일 지속"과 메커니즘이 안 맞아 약함). **생존 가설 3개**(전부 확률적 아닌 결정적 요인과 부합): IP대역×증권유형 상호작용(배포 없이 검증 불가) · 실행시각(21:30 UTC 장마감직후, 🔑 **배포 없이 검증 가능** — 같은 시각에 재조회하면 됨, 이번엔 미실시) · 07-30 전후 야후측 변경(정황만, 검증 불가). 유니버스 제안(계산만, 미실행): 334건 제외 시 커버리지 93.04%→98.58%(97%게이트 통과) — `data/us_symbols.json` 수정금지·867 승인 사항 명시. → `docs/probe_988_prod_specific_factor.json`·`docs/probe_988_search.md`
15. **역DCF 유니버스 자기참조 — 신규 편입 경로 없음**(00-3) — `route.ts:28`이 "직전 as_of의 CIK"만 물려받는 구조. 표본 5종목(`AMST`·`ANF`·`AVAH`·`ACRS`·`ACT`)이 8일 전체 `as_of`에 한 번도 없었음 확인. 소스는 보유(`us_market_cap` 5,900) — 편입 경로 자체가 코드에 없음. → `CHANGELOG.md` (83)·`REVDCF_SPEC.md` §10 #76·77
16. 🔴 **크론 관측 인프라 부재 — 14번 규명의 전제(설계 완료, 982·983)** — Vercel MCP `get_runtime_logs`/`get_runtime_errors` 실제 조회 시도 = **403(권한없음, 실측 확인)**. 이미 되고 있는 것(917 이래 `cron_heartbeats.note`에 diag JSON 저장)과 안 되는 것(PK=`job` 단일이라 이력 없음, "성공"과 "실행됨"을 섞어 쓰는 크론 있음[email-brief], 9개 중 3개만 heartbeat·2개[health 자신·revdcf]는 관측 완전 0) 전수 정리. **가장 비용이 낮은 옵션 = Sentry 대시보드 직접 확인(무료·코드 0줄) — 이미 `[lens-cut-gate]` 등을 매 실행 남기고 있어 07-31~08-08 이력이 이미 있을 가능성** — 아직 확인 안 함(사람 몫). 저장설계 옵션 A~F(cron_heartbeats 이력화/신규테이블/Axiom/Log Drains 등) 비용·공수 표만 작성, 미구현·미채택. 🔴 **부수 발견**: `health` 크론이 `lens_cuts` 나이를 이미 49시간 임계로 감시 중(828) — US 정지라면 11일 내내 stale로 잡혔어야 함, 왜 대응 없었는지는 Sentry 미확인이라 모름. → `docs/CRON_OBSERVABILITY.md`·`docs/probe_983_observability.json`
17. **`us_fundamentals` 순증 속도 재추정 필요**(970) — 이전 추정 124건/일 → 1개 사이클 관측 40건(1,127→1,167). 최소 1사이클 더 관측 필요, 추세 단정 안 함. → `docs/probe_970_newwindow_live.json` §2-5
18. **fiscal_year null 197건 — IFRS 135건은 미해결(위 11번), 미국 은행형 19건은 967로 해소**, 잔여(B분류 47건·D분류 7건 등)는 개별 재검토 안 함. → `VALUATION_SPEC.md` 197종목 섹션
26. ✅ **해소(973)** — ~~`us_sector_wide` as_of=2026-08-09에 0행 → `us_sector_relative` 1167/1167 전부 NO_SECTOR`(972 발견)~~ `computeAndSaveSectorRelative()`가 `us_sector_wide`의 **최신 as_of**를 쓰도록 수정, 08-09 복구(null_sector 129, +40은 아래 28번). → `docs/VALUATION_SPEC.md` 「us_sector_wide 참조 방식」 절
27. **`us_sector_wide` 신선도 상한 미설정 — 판정 대기**(973, 974에서 재검토했으나 미도입 유지) — 상한을 안 둔 이유(원전·타플랫폼 대조로 저빈도 개념임을 재확인·`docs/probe_974_step2_search.md`)는 문서화했으나, 언젠가 걸어야 할 시점이 온다면 SPDR 소스는 "분기"라는 구체적 기준이 이미 검색으로 확보돼 있다. 언제·며칠로 걸지는 여전히 판정 필요. → `docs/VALUATION_SPEC.md` 같은 절
28. ✅ **해소(974)** — ~~신규 종목(+40) 섹터 미부착 — 처방 후보 3개 중 미선택(973)~~ 처방 ①(resolveSector 증분 크론 배선, 방식 ⓐ=기존 as_of에 append) 채택·구현. 신규 40종목(damodaran 32·spdr 2·미분류 6) 자동 부착 확인, 기존 1,127행 fingerprint 불변(MD5 `ffb271e898ea81300f40f2aa831b78b0`) 확인. `us_sector_relative`(08-09) null_sector 129→95. → `docs/VALUATION_SPEC.md` 「us_sector_wide 증분 갱신」 절
29. **damodaran_* 7개 테이블 — as_of 무필터 읽기, 지금은 as_of가 1개뿐이라 안전(973 회귀조사, 미수정)** — `app/api/cron/revdcf/route.ts:144-148`·`lib/sector.ts:26,88`이 `damodaran_global_inputs`(`.single()`)·`damodaran_country_tax`(`.single()`)·`damodaran_credit_spread`·`damodaran_beta`·`damodaran_industry`를 as_of 필터 없이 읽는다. 전부 PK에 `as_of`가 있어(`scripts/ingest_damodaran.ts` onConflict 확인) **연차 갱신으로 두 번째 as_of가 생기는 순간** `.single()`은 에러로 죽고 무필터 select는 신구 데이터가 섞인다. 972/973과 같은 병의 잠복형. → 이번엔 손대지 않음
30. **QXO PBR 잔여 5.37%·PROP PBR/PSR 잔여 −11%대**(975) — 968 direct construction에서 mktcap 성분을 기말발행주식수로 교체해도 남는 잔차. QXO는 극적 개선(−44.79%→+5.37%)됐으나 완전히는 안 닫힘, PROP은 968이 이미 "극단희석·미확정"으로 플래그한 것과 동일선상. 원인 미규명. → `docs/probe_975_residual_decomposition.json`
31. **HGTY(Hagerty) Up-C 정의차이 3건 — 방향·대략 크기만 설명, 정확한 배율 미확정**(975) — revenue(ASC606 매출 vs 총계), equity(모회사귀속 vs 연결총자본), net_income(연결총액 vs 모회사귀속분— 후자는 항등식 도출값이라 직접 태그 확인 안 됨) 3가지가 각각 PSR·PBR·PER 잔차 방향과 대체로 맞으나 정확히는 안 맞는다. Class A/V 정확한 유통주식수도 미확정. → `docs/probe_975_residual_decomposition.json` §4-2
32. 🔴 **`lib/revdcf/drivers.ts:67` `latestYear()`가 목표연도 근접성 없이 "5년 창 안에 값 있는 첫 연도"를 반환 — HGTY의 `shares` 필드가 FY2024 대신 FY2021(3년 전) 값을 쓰게 만듦**(975 발견, 코드 무변경). production PER·PBR·PSR·EV/EBITDA는 `us_market_cap`(라이브)만 써서 무영향이나, 역DCF `sharePrice = mcap/dr.market.shares`(`route.ts:255`)에는 영향(HGTY는 현재 604종목 밖이라 오늘은 무해). **15종목 표본에서 HGTY 1건만 확인 — 604종목·1,167종목 전수 스캔 안 함**, 다른 종목에도 잠재할 수 있음. → `docs/probe_975_residual_decomposition.json` §4-2 finding1
33. **GM.debt이 라이브 조회에서 다시 0으로 관측됨**(975 발견, 조사 안 함) — 969가 FY2024 기준으로 고쳤는데 GM의 `fiscal_year`가 08-09→08-10 사이 2024→2025로 전진(951 창 갱신)하며 재발한 것으로 추정, 확인 안 함. → 이번엔 손대지 않음
34. 🟡 **`latestYear()` lag — 기록 배선 완료(977), 상한 판정은 여전히 유예.** `computeDrivers()`가 `flags.inputLag`·`flags.inputLagCause`를 계산값 무변경으로 추가(1,167종목 완전대조 불일치 0건 증명). 1,167 전체 vs 604 나란히 실측: debt lag≥1 비율이 1,167 전체(4.4%)가 604(3.2%)보다 높음(원인 미규명). **재검토 조건 = 몇 사이클 뒤 같은 종목의 lag이 유지/증가(태그 영구소멸 신호)하는지 vs 줄어드는지(제출시차였을 뿐) 관측 후 판정** — 지금 상한을 걸 근거는 여전히 없음(976의 "대체값 없음 20/21건" 결론 유지). → `docs/REVDCF_SPEC.md` §10-E · `docs/probe_977_input_lag.json`
35. 🔴 **`revdcf_results.flags.debtBasis`가 5개 as_of(08-05~08-09) 전부 0/604건 저장 — computeDrivers()는 채우는데 route.ts가 최종 저장 시 빠뜨리는 것으로 관찰됨**(976 발견, 코드 추적 안 함) — 969의 "확정0/확정값/모름" 3분류가 계산엔 반영되나 DB 저장 산출물(flags)엔 안 남아 사후 감사가 어려움. → `docs/probe_976_latest_year_freshness.json` stage2
36. **TXRH — 태그 커버리지 문제(latestYear 문제 아님) 확인**(976) — 목표연도(2025)에 `FinanceLeaseLiability`(Current/Noncurrent 미분리 합계형, $2.7M)가 실재하나 `FIN_LEASE` 배열이 분리형만 인식해 못 잡음. 값이 작아 영향 재계산은 안 함(우선순위 낮음, 미실행). → `docs/probe_976_latest_year_freshness.json`
37. **ROIV debt lag=2 원인 미확정**(976) — 비정형 회계연도(FYE 3월말)로 인한 `calYear()` 버킷팅(2024-03-31 종료분→calYear 2023) 때문인지, FYE 2025-03 10-K 자체가 아직 SEC에 없는지 확정 못함.
38. **업종별 대표배수(Q1 축 구성 선택지 B) — 보류, 창작 금지**(978·979) — 11개 GICS 섹터 중 3~4개(Financials·Real Estate·부분 Consumer Discretionary)만 Damodaran 원전 대응표가 있고 나머지 7~8개는 우리가 채워야 해 규칙 3(창작 금지) 위반 소지. → `docs/Q1_AXIS_DECISION.md`
39. **Financials→PBV(원전 지정 축) — 우리 데이터로 성립 확인(n=79)**(979) — 축 구성 판정 시 참고. → `docs/probe_979_median_relative.json`
40. **Real Estate→P/CF(원전 지정 축) — 우리 4축에 없음, 미보유**(978·979) — 원전(P/CF)·실무(P/FFO)·우리(PBR·PSR) 삼자가 전부 다른 축. 신규 파이프라인 필요(958/959가 "Q1 재설계급"으로 평가한 바 있음).
41. ✅ **minSample=20 — 980에서 유지로 확정(장은태 위임 판정)** — 원전 근거는 여전히 없음(980 ①-A-3도 못 찾음), 계속 공개. 근거 = CSGP 1사가 Real Estate EV/EBITDA(n=4) 중앙값을 지배하는 실측(979). 커버리지 2,961/2,995 그대로. → `docs/VALUATION_SPEC.md` 「업종 대비」 절
42. ✅ **업종 대비 계산방식(백분위→중앙값 배율) 교체 완료**(980) — `us_sector_relative` 8컬럼 배선·크론 반영·백필(08-08·08-09) 전부 완료. 값 불변(md5)·순위보존(44칸 전수)·커버리지 동일 검증 완료. 백분위는 대조군으로 유지, 제거 시점 미정. → `docs/Q1_AXIS_DECISION.md` §7·`docs/probe_980_search.md`
43. **배율 표시 형태(x배 vs %차이) — 여전히 미정**(979·980 둘 다 원전·실무에서 답 못 찾음) — 화면 작업 시 판정 필요.
44. 🅿️ **`us_sector_relative_snapshot`(tag=pre_step980) — 백필 검증용 임시 테이블, 비교 끝나면 지운다**(969·973 선례와 동일 관례) — 이번엔 안 지움(방금 만든 참고자료라 즉시 삭제 안 함, 몇 사이클 뒤 정리 대상).
45. 🔴 **`npm run build`가 STEP977 정리(`scripts/_step977_tmp/` 삭제)로 깨져 있던 것을 980에서 발견·복구** — `scripts/probe_977_invariance.ts`가 그 디렉토리를 정적 import해 tsc가 실패했다. 재추출해 이번엔 커밋(삭제 안 함)으로 재발 방지.
46. ✅ **야후 밸류 렌즈 의존 지도 완결(981)** — US 유니버스 1,023종목 중 110종목(10.8%)이 이미 annual 폴백 진입(peBasis="ttm" 아님) 실측. 표면 목록 재검산 = 최소 18개 파일/DB객체(972의 구두 "6곳"보다 많음, 972 산출근거 미기록이라 재현 불가). TTM/FY 시점차 원인은 상위20 괴리 중 10건에서 정량 부합(SEC companyfacts 로컬캐시로 직접 검증), 나머지 10건은 불명으로 남김(추정치 지어내지 않음). 시장분기점 부재 확인(US만 못 끔 — 신규 코드 필요). → `docs/Q1_YAHOO_REMOVAL.md`·`docs/probe_981_yahoo_dependency.json`
47. ✅ **lens_cuts(US) 정지 원인 부분특정 + 981 판정 완료(982)** — 08-09 실행분은 코드+실측으로 완전 특정(cutGateOk=false ← freshCoverage 93.04%<97%). 미해결 13·14번이 같은 acquisition 함수·같은 날짜(07-30)라는 강한 정황 발견(인과 미확정). 재유도 시 140종목(13.7%) 판정 변경(momentum 6.9%가 최대 — Fama-French 원전의 팩터별 차등갱신주기[모멘텀=월·나머지=연]와 방향 일치). 981 §4 선택지 판정 = ⓐ 현행유지(Q1 카드 켜는 시점에 재론) + 선결질문 등재. → `docs/LENS_CUTS_FREEZE_982.md`·`docs/probe_982_lens_cuts_freeze.json`·`docs/Q1_YAHOO_REMOVAL.md` §판정
48. ✅ **크론 관측 인프라 설계 완료(983, 설계·조사 전용)** — 9개 크론 중 heartbeat 쓰는 곳 3개뿐(그중 email-brief는 "성공"이 아니라 "실행됨"만 기록 — 의미 다름), 관측 완전 0인 곳 2개(health 자기자신·revdcf). Vercel MCP 로그조회 403 실측 확인(가정 아님). 최소비용 옵션 = Sentry 대시보드 직접 확인($0·코드0 — 이미 배선된 `[lens-cut-gate]` 등이 30일 무료보존에 있을 가능성, 미확인). 저장설계(이력화 vs 신규테이블)·크론코드 변경범위(실패경로 기록누락 포함)·6개 옵션 비용표 작성, 미구현. → `docs/CRON_OBSERVABILITY.md`·`docs/probe_983_observability.json`
49. ✅ **us_market_cap 결측 원인 부분규명(984)** — 13·14번 단일근본 확정(marketCap 필드 결측) + composition/coverage 별개원인설 정정(같은 freshSet에서 파생). 지금 결측 349건 전부 949 B그룹(82건, 원천 없음)과 무관 — D그룹(로컬 OK) 계열만 지속실패. 공통점 실측: NYSE 2배·3글자심볼·Fund7.4배·Trust2.7배 과대표집이나 초대형주(XOM 등) 포함으로 완전설명 아님(솔직히 기록). heartbeat 실측으로 "네트워크실패 아니라 200응답인데 필드만 빔" 확정. crumb 메커니즘 코드로 확인(getCrumb.js 모듈레벨 캐시)했으나 GitHub #764 근거로 "crumb실패=완전실패" 패턴과 안 맞아 가설 약화(기각은 아님). 이 세션 환경에서 직접 20종목 재조회 → 100% 성공(949 LOCAL_OK 재확인) + sharesOutstanding×price 대안재구성 산술확인(오차0.001%, 미구현). 근본원인 여전히 미규명, 처방후보 4개만 기록. → `docs/probe_984_mcap_root_cause.json`·`docs/probe_984_search.md`
50. ✅ **시총 재구성 순수함수 구현·검증 완료, 미배선(985)** — `lib/marketCapReconstruct.ts`(원시필드 우선, 없을 때만 재구성, 8단위테스트) + US 전체 5,972종목 전수검증. marketCap 있는 5,891종목 대조 중앙값 0%·p90 20% — 상위20 전부 복수클래스주식(sharesOutstanding=클래스별 vs marketCap=회사전체 구조적 불일치, XOM 0.001%가 예외 아닌 대표값). 🔴 **핵심 한계**: 이 환경의 freshCoverage가 재구성 전부터 이미 98.64%(97%게이트 통과)이고 984 지목 초대형주 7/7 전부 정상수신돼 프로덕션 실패(349건) 자체를 재현 못 함 — 재구성의 실제 효과는 프로덕션에서만 검증 가능(크론 미배선이라 이번엔 불가). 배선지점·예상효과(140/1023종목 판정변경)만 설계, 코드 미변경. → `docs/probe_985_mcap_reconstruction.json`·`docs/VALUATION_SPEC.md` "시총 취득 경로" 절
51. ✅ **985 판정 정정 + 재구성 관측 배선 완료(986)** — 985의 "배선한다" 판정이 표본1개(XOM) 근거 오류였음을 정정. 복수클래스 판별=기존 `us_cik_map`으로 충분(새 소스 없음, 985의 10종목 10/10 일치+FISK·OGCP·ESBA 추가설명, 유니버스 88심볼·43CIK). `lensPrecompute.ts`에 관측전용 배선(저장은 안 함) — 새 diag필드 5개를 `cron_heartbeats.note`에만 기록, try/catch 격리. **값 불변 증명**: 야후1회조회 구코드/신코드 동일데이터 대조 — capOf·freshSet·batchOk·recovered·retryNoCapField·freshCoverage(98.64%) 전부 완전일치. 이 환경은 여전히 984 프로덕션 실패 재현 못 함(이번 실행 복수클래스 실패 0건) — 저장 배선 판정은 프로덕션 며칠 관측 후로 미룸. → `docs/probe_986_reconstruct_observe.json`·`docs/probe_986_search.md`
52. ✅ **LOCAL_OK_PROD_FAIL 정확 재현 완료(987) — 재구성 처방 계열 종결.** 986의 "며칠 기다린다" 판단이 과했음을 장은태가 지적 — 실패한 정확한 349개 심볼명이 이미 DB에 있어 즉시 재조회 가능했다. 349종목+대조군100 실시간 조회 → 346/346(응답분 100%) marketCap 정상 수신, 무응답 3건(GV·KVAC·PSTV, SPAC·소형바이오텍). **종목 문제 아니라 프로덕션 환경 문제로 확정** — 재구성 가능 후보 0건이라 235건 문턱·복수클래스 논의 자체가 무의미해짐(재구성 계열 처방 전체가 이 문제엔 적용대상 아님으로 종결). 커버리지 시나리오 3개 계산 — 전부 93.04%로 무변화. Cowork이 제시했던 "복수클래스 48건" 수치가 986 자신의 정확한 정의(유니버스내 좁힘)가 아니라 986이 배제했던 전역정의였음을 재현 과정에서 발견·정정(정확히는 4건). 나머지 4개 수치는 정확 재현. → `docs/probe_987_stale349.json`·`docs/probe_987_search.md`
53. ✅ **프로덕션 특이 요인 재조사(988)** — Cowork 수치 4개(청크균등분산·334/15분할·07-30 338건·평균5.6) 전부 정확 재현. 987이 배치(100·동시성6, 프로덕션과 동일)였음을 확인해 배치가설 부활조건 불성립. 신규 기각 2개(버전차이=lockfile 3.15.4 고정 확인·시간예산소진=기존heartbeat timeHit=false)+제기후기각 2개(Next.js캐싱=force-dynamic이라 원리상 미적용·웜인스턴스상태누수=라이브러리버그는 실재하나 Hobby는 매일콜드스타트라 메커니즘 불일치) 전부 코드·문서 대조로 배포 없이 결론. 생존 가설 3개 중 1개(실행시각 21:30UTC)만 배포 없이 검증 가능(이번엔 미실시), 나머지 2개(IP×증권유형·야후측변경)는 배포 필요. 유니버스 제외 시뮬레이션(계산만): 98.58%로 게이트 통과, 867 승인사항 명시. → `docs/probe_988_prod_specific_factor.json`·`docs/probe_988_search.md`

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
