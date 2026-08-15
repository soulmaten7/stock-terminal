<!-- 2026-07-18 -->
# 📖 Trillion(트릴리언) — 전체 문서 마스터 인덱스

> **이 파일은 무엇인가**: 프로젝트의 모든 참조 문서를 **카테고리별로 한자리에** 모은 카탈로그. "그 내용 어느 문서에 있더라?"를 매번 뒤지지 않게, **언제든 여기서부터** 원하는 문서를 꺼낸다.
> **사용법**: 아래 카테고리 표에서 목적에 맞는 파일을 찾아 열기. 각 행 = `파일` · `한 줄 용도` · `언제 읽나`.
> **범위**: 루트 파일 5개 + `docs/` 비-STEP 문서 **97개**. STEP 실행 명령서(**884개**)는 §⑩에 한 줄로 요약(개별 나열 X). 폐기본은 `docs/_archive/`(**16개**).
>
> ### 🔴 상태 표기 (2026-08-08 개정 — 반드시 먼저 볼 것)
>
> | 표기 | 뜻 | 취급 |
> |---|---|---|
> | `[최신]` | **현행 정본** | 그대로 따른다 |
> | 🅿️ **동결** | **KR·JP·CN·VN·GB 주제** — 2026-08-08 「🇺🇸🔒 전면 US 단독」 규칙 | 🔴 **신규 착수 금지 · 판정·감사·모델선정에서 수치를 결론에 넣지 말 것.** 내용은 유효 |
> | 🗄️ **아카이브** | `docs/_archive/` 로 이동됨(폐기·구버전) | 히스토리 참고만. 충돌 시 최신 우선 |
> | `[보존]`/`[폐기]` | 구 표기(히스토리) | 위와 동일 |
>
> **갱신일**: **2026-08-08**.

---

## 세션 시작 시 읽는 순서 (요약)
1. **`docs/STATE.md`** — 현재 상태 단일 정본(HEAD·현재 상태·다음 할 일 · 덮어쓰기 · 세션 시작 최우선)
2. **`docs/SYSTEM_MAP.md`** — 아키텍처·6개국 파이프라인·크론·테이블·함정(필요할 때)
3. **`docs/ROADMAP.md`** — 무엇을/어떤 순서로(Phase 단일 기준) · 🔴 **개정 중 — WHY 층은 `docs/ROADMAP_V2.md`가 정본**(2026-08-15~)
4. 목적별 심화 문서(PLAYBOOK류) → 이 INDEX에서 카테고리로 검색

---

## ⓪ 루트 파일 (프로젝트 최상단 · 지침)

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `CLAUDE.md` | Claude Code 지침서 — 역할분담·절대규칙·워크플로우·참조 테이블·세션 루틴 | 매 세션(규칙·워크플로우 확인) |
| `AGENTS.md` | Next.js(이 버전) 주의 — 학습지식과 다른 breaking change 경고 | 코드 작성 전 |
| `README.md` | 프로젝트 소개(구 운종 브랜드 서술 — 리브랜드 반영 필요) | 외부 소개용 |
| `session-context.md` | [폐기] 구 프로젝트 맥락 — `docs/_archive/`로 통합·폐기(현행 = `docs/STATE.md`) | 히스토리 참고만 |
| `CLAUDE_CODE_INSTRUCTIONS.md` | 개발 명령서 [보존·V3 명세] — 전체 기능·DB 스키마·페이지 상세 | DB/기능 명세 참조 |

---

## ① 세션·핸드오프 (현재 상태·다음 작업)

> **2026-07-17 통합**: 겹치던 핸드오프 문서 6개(SESSION_BOOT·NEW_SESSION_HANDOFF·NEXT_SESSION_PLAYBOOK·NEXT_SESSION_START·SESSION_KICKOFF·session-context)를 `docs/STATE.md`(현재 상태)+`docs/SYSTEM_MAP.md`(아키텍처) 2개로 단일화. 옛 파일은 **다시 만들지 말 것** — `docs/_archive/`에 히스토리로만 보존.

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/STATE.md` | **[최우선·단일 정본]** 현재 상태 — HEAD·현재 상태·다음 할 일(세션마다 덮어쓰기) | 세션 시작 첫 파일 |
| `docs/SYSTEM_MAP.md` | 아키텍처·6개국 파이프라인·크론·테이블·env·함정(라이브 실측) | STATE 다음(구조 확인) |
| `docs/CHANGELOG.md` | 변경 이력 — 세션별/STEP별 변경사항(유일한 이력) | 무엇이 바뀌었나 추적 |
| `docs/PROD_ACCESS_DIAGNOSTIC_2026-08-02.md` | 🚨 **사고 기록** — `/api/revdcf` 게이팅 누락 질의서(원본·미수정) | STEP 868 경위 참고 |
| `docs/PROD_ACCESS_ANSWER_2026-08-02.md` | 🚨 **사고 기록** — 1차 답변서(원본·미수정, §4에서 스스로 정정됨) | STEP 868 경위 참고 |
| `docs/PROD_ACCESS_ANSWER2_2026-08-02.md` | 🚨 **사고 기록** — 2차 답변서(원본·미수정) — `docs/STATE.md`가 근거로 인용 | STEP 868 경위 참고 |
| `docs/_archive/SESSION_BOOT.md` | [폐기] 구 새 세션 부트 — `docs/STATE.md`로 통합·폐기 | 히스토리 참고만 |
| `docs/_archive/NEW_SESSION_HANDOFF.md` | [폐기] 구 단일 자급형 핸드오프 — `docs/STATE.md`로 통합·폐기 | 히스토리 참고만 |
| `docs/_archive/NEXT_SESSION_PLAYBOOK.md` | [폐기] 구 마스터 인수인계(디자인·컴포넌트 매핑) — `docs/SYSTEM_MAP.md`로 통합·폐기 | 히스토리 참고만 |
| `docs/_archive/NEXT_SESSION_START.md` | [폐기] 구 다음 세션 시작 가이드 — `docs/STATE.md`로 통합·폐기 | 히스토리 참고만 |
| `docs/_archive/SESSION_KICKOFF.md` | [폐기] 구 즉시 시작 파일 — `docs/STATE.md`로 통합·폐기 | 히스토리 참고만 |
| `docs/_archive/session-context.md` | [폐기] 구 프로젝트 맥락(TODO·핵심 수치) — `docs/STATE.md`로 통합·폐기 | 히스토리 참고만 |
| `docs/SESSION_25_CLOSE_COMMAND.md` | 세션 #25 종료 명령서 [아카이브] — 3중 검증 절차 예시 | 종료 절차 참고 |

---

## ② 정체성·브랜드·보이스·카피

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/BRAND_IDENTITY.md` | **[최신]** 브랜드 정체성 — 3기둥(무기·직시·자립)·멍거 목소리·§0 외부 슬로건 "종목을 보는 눈을, 누구에게나" | 브랜드·카피·정체성 결정 전 |
| `docs/VOICE_GUIDE.md` | 카피 보이스 — "원어민 전문가처럼"(번역·AI조어 금지) | 노출 카피 작성 시 |
| `docs/LENS_COPY.md` | 렌즈 겉면 카피(언어별 원본) — `lib/lensCopy.ts` 소스 | 렌즈 라벨·설명 문구 편집 시 |
| `docs/LOGO_PROMPT.md` | 로고 생성 프롬프트(Claude SVG 디자인용) | 로고·파비콘 작업 시 |
| `docs/LAUNCH_INFO.md` | 출시 정보 — 푸터 사업자정보·연락처(원트릴리언 210-39-33812) | 푸터·메타·법적 표기 채울 때 |

---

## ③ 제품·비전·IA (버전 계보 주의)

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/_archive/PRODUCT_SPEC_V7.md` | [보존] V7 — "검증된 중립 관문(Gateway)" 재정의 (구 비전 · 정체성 프레임 폐기) | V7 히스토리 · 현행 정체성=BRAND_IDENTITY/STATE |
| `docs/_archive/PRODUCT_SPEC_V6.md` | [보존] V6 — 정체성 5결정(정보+토론+신뢰) | V6 히스토리 참고 |
| `docs/_archive/PRODUCT_SPEC_V4.md` | [보존] V4 — 2창(한국·미국)·토스카드·Trustpilot 평가 | V4 히스토리 참고 |
| `docs/PRODUCT_SPEC_V3.md` | [보존] V3 — Stock Terminal 초기 스펙 | V3 히스토리 참고 |
| 🔴🔑 **`docs/ROADMAP_V2.md`**(2026-08-15 착수, 갱신 중 · 사실관계 검증 완료) | **[개정 중 — WHY·HOW 층 정본]** 마스터 로드맵 전면 개정, 장은태와 층별로 확정하며 하강(WHY✅·HOW✅ 확정·WHAT/절차/순서/완성/수익모델은 확정 대기). WHY = 문제·현인 앵커(멍거·버핏·파인만, `BRAND_IDENTITY.md`와 대조 확인)·구본 §1 오류 정정. HOW = 조건 3(정확·단순·왜)의 실행 방법(`LOCALE_SOURCE_PLAYBOOK.md` §2·§3·§4·§11·`AD_MONETIZATION_PLAYBOOK.md` §1·`BRAND_IDENTITY.md` §4·창작금지 규칙 5-1 대조 — 대체로 정확, 사소한 불일치 2건·부분 불일치 1건 발견·목록 보고, 문서 미수정). 사본 = `docs/roadmap_v2.html` | **WHY·HOW 확인 시 이 문서가 `ROADMAP.md` §1보다 우선** |
| `docs/ROADMAP.md` | 🔴 **개정 중 — WHY 층은 위 V2가 정본.** 마스터 로드맵(구본, 2026-07-18 정지) — 무엇을/어떤 순서로(Phase 단일 기준), KR중심·6개국탭 전제로 이력 보존 | STATE 다음(WHY 이외 순서 확인) |
| `docs/RELEASE_ROADMAP.md` | **[최신·핵심]** 1·2·3차 출시 로드맵 — 국가셋(KR·US·JP·GB·홍콩·VN)·차수별 범위·광고 활성화 시점 | 출시 계획·차수 결정 시 |
| `docs/SITE_MAP_V7.md` | SITE MAP V7 — 네이버 증권 구조 복제 spec | IA·메뉴 구조 작업 시 |
| `docs/_archive/TOSS_ANALYSIS_AND_IA.md` | 토스증권 전체 분석 + 새 IA(토스식 개편 spec) | IA 개편 참고 |
| 🅿️ `docs/NAVER_STOCK_PAGE_ANALYSIS.md` | 네이버 종목 페이지 디테일 분석 + Gap(V6) | 종목 페이지 디테일 보강 시 |
| `docs/HOME_REDESIGN_V2_SPEC.md` | [아카이브] 홈 재설계 V2(세션 #9) | 홈 디자인 히스토리 |
| `docs/_archive/DASHBOARD_SPEC_V3.md` | [최신·대시보드] 풀스크롤 대시보드 재설계 V3.2 | 홈 대시보드 작업 시 |
| `docs/DASHBOARD_SPEC_V1.md` | [폐기] 대시보드 스펙 V1(V3가 대체) | 히스토리만 |
| `docs/PAGE_FRAME_SPEC.md` | [보존·V3] 전체 페이지 프레임 명세 | V3 프레임 히스토리 |
| `docs/REFERENCE_PLATFORM_MAPPING.md` | [보존·V3] 레퍼런스 플랫폼 매핑 | 벤치마크 히스토리 |
| `docs/MARKET_RESEARCH_V1.md` | 한국 플랫폼 대시보드 UX 시장조사(16곳) | 시장 벤치마크 참고 |
| `docs/V3_RELEASE_NOTES.md` | [보존] Stock Terminal V3 릴리즈 노트 | V3 릴리즈 히스토리 |

---

## ④ AI 렌즈·기법·이벤트 (개발 플레이북)

> 🔴 **현재 개발 트랙 = 역DCF 모델 1개(7렌즈 확장은 중단).** 아래 렌즈 문서는 **유지·수정용**이다.

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| 🔴 **`docs/REVDCF_SPEC.md`** | **[모델 단일 정본]** 역DCF·PIE 설계 — 용어집·A~D 층·결정 이력·**정정 기록**·미결·실측 원장·값 분류(A/B/C) | **모델 관련 작업 전 반드시** · 결정·수치 생길 때마다 즉시 갱신 |
| 🔴🔑 **`docs/DATA_SOURCE_CATALOG.md`**(2026-08-15 STEP1034 최신화 · 이전엔 이 색인에 미등재 상태였음) | **[조달 지도 정본]** 92개 기관/소스 전수(SEC·Yahoo·Nasdaq·Damodaran·SPDR) · 슬롯 매핑 20개(지금 쓰는 소스·코드 좌표 `파일:줄` 전수 대조) · 슬롯 간 의존관계 6건 · 커버리지 게이트 §0-A(85% 기준으로 갱신, STEP1031/1034) · 완료조건 6항목. 사본 = `docs/data_source_catalog.xlsx`(항상 같이 갱신) | **재료 조달처를 찾을 때 반드시** — `BUILD_SEQUENCE.md` §7 문서 위계의 "조달" 층 |
| 🔑 **`docs/KNOWN_ANSWERS.md`**(STEP1028 신설) | **[중복조사 방지 색인]** 이미 확정된 질문·답·근거 STEP·재검토 조건을 3줄 이내로 — Vercel 로그 접근 등 같은 조사를 6번 반복한 전례 방지용 | **새 STEP 착수 전 반드시**(`_TEMPLATE.md` ⓪-1b가 강제) |
| 🔴 **`data/sources/README.md`** | **[원본 보관소 색인]** 원전 스프레드시트 T3~T10 · 다모다란 8종 · 원문 HTML · 학술 · **외부 유니버스 발췌** · 미저장 목록 | 규칙 ⓪·⓪-3 대조 시 **매번** |
| 🔴 **`lib/revdcf/registry.ts`** | **[코드형 원장]** 원전 변수 : 우리 값 : **차이 사유** 13행 + **`OUR_ADDITIONS`**(원전에 없는 것: sensitivity·distribution·**universe·liquidity**) | 드라이버·유니버스 손대기 전 |
| `docs/LENS_COMPLETION_STANDARD.md` | **[완성 기준]** DoD 9항목 + §10 깊이 4축 — 역DCF 현황 표 포함 | "완성" 선언 전 |
| 🔴🔑 **`docs/USER_QUESTIONS_2026-08-08.md`** | **[질문 정본 · 모델보다 먼저]** 이용자가 알고 싶은 것 Q0~Q5 + 요약층 · 근거 3소스(SWS 오픈소스 모델·AAII 설문·Stock Analysis) · 철회 4건 · 역DCF 위치 재정의 · 「N년」 표현 실측 | **모델·화면 결정 전 반드시** |
| 🔴🔑 **`docs/BUILD_SEQUENCE.md`**(2026-08-15 신설 · 사실관계 검증 완료) | **[제작 순서 정본]** 흩어진 순서 규칙(제품 정의 3건·제작 절차 6단계·관문 G1~G7·실사용 순위 12위·완성 기준·현재 위치·**미해결 판정 6건**·문서 위계·반복된 실수 5건)을 한곳에 통합 — 새 결정 없음, 빈 칸을 빈 채로 표시만. 사본 = `docs/build_sequence.html`(시각화). **§6의 6개 판정 칸은 장은태 전용** | **다음 무엇을 만들지 판단할 때 가장 먼저** |
| 🔴🔑 **`docs/MODEL_ROSTER.md`**(STEP1033 신설) | **[모델 로스터 갱신본]** 5개 계층(팩터·밸류에이션·재무건전성·플랫폼자체모델·주주환원) 전수 조사 + 원전 확보 4단계 + 미시도 6플랫폼 + 로드맵 탈락/보류 3건 재검토. **08-07 조사 4건(아래)의 존재를 재확인·보완** — 그 4건을 대체하지 않음 | **모델 선정·순서 결정 시(08-07 4건과 같이 읽는다)** |
| 🔴 **`docs/probe_1037_retail_demand.md`**(STEP1037 신설) | **[관문① 근거 조사]** 개인 수요 실측 — 방법 A(개인직접·FINRA NFCS 2,861명·SEC THRIVE·WEF-BCG-Robinhood US1,003명)·B(드러난선호·플랫폼3곳실조회)·C(역방향) 3방법 교차, 「원하는 정보 목록」(질문형 아님)·Q0~Q5 매핑. 🔴 **판정 없음** — F-4(순위 재정렬)의 입력 | F-4 순위 판정 시 |
| 🔴 **`docs/MODEL_UNIVERSE_63_2026-08-07.md`** | **[모델 우주 정본]** 세상의 주식 계산 모델 **63개** × 실사용 근거 × **우리 SEC 태그 실측 기반 재현 비용** | 모델 선정·순서 결정 시 |
| `docs/MODEL_BUILD_ORDER_2026-08-07.md` | 관문 7개(방향번역·증명가능·커버리지·무료·법적·안매김·자동화)로 재정렬한 제작 순서 | 다음 모델 착수 전 |
| `docs/MARKET_MODEL_USAGE_TOP20_2026-08-07.md` | 애널리스트 리포트 2,263건·CFA 1,980명 등 **학술 서베이 기반** 실사용 상위 20 | 수요 근거가 필요할 때 |
| `docs/MODEL_DEMAND_SURVEY_2026-08-07.md` | 리테일 플랫폼 채택 기준 수요 조사(1차) | 위 문서의 선행본 |
| `docs/VALUE_LENS_DEFECT_AUDIT_2026-08-07.md` | **렌즈 전수감사 ① 밸류** — 결함 6건 + 기록지 규칙 이행 점검 | 밸류 렌즈 수리 전 |
| `docs/LENS_AUDIT_02_MOMENTUM_2026-08-07.md` | **렌즈 전수감사 ② 모멘텀** — 결함 5건 | 모멘텀 렌즈 수리 전 |
| `docs/DRAFT_MODEL_SELECTION_RECOVERY.md` | [경위 보존] 07-30 선정 근거 복원 조사 초안(미실행 · 근거 3건 중 2건이 사후 반증됨) | 경위 참고만 |
| `docs/STEP_LEDGER.md` | **[필독]** STEP 원장 — 성공·부분·실패·**미실행** 전부 한 줄씩(전체 진행을 한눈에) | **STEP 착수 전 매번** |
| `docs/LENS_DEV_PLAYBOOK.md` | **[필독]** 기법 렌즈 개발 플레이북 + 문제해결 로그(§0 원칙·**#1~#106 · 111행**) | 새 렌즈 착수 전 + 막힐 때 |
| `docs/LENS_ROADMAP.md` | 기법(렌즈) 로스터 & 로드맵 | 다음 렌즈 선정 시 |
| `docs/LENS_ARCHITECTURE.md` | **[최신·뼈대]** 렌즈 "독립 배선" 표준 — StockData 번들·Lens 인터페이스·레지스트리·기법당 AI 교체 지점 | 렌즈 구조 변경·새 렌즈·AI 교체 시 |
| `docs/LENS_STRENGTH_MAP.md` | 기법별 적합 영역(강한 종목·섹터·조건) | 렌즈 가중·선택 근거 |
| `docs/LENS_DISPLAY_CHARTER.md` | 렌즈 표시 헌장 — 모든 카드 공통 표시 규칙(강제 체크리스트) | 렌즈 카드 생성/수정 시 |
| `docs/_archive/AI_LENS_SPEC.md` | [설계·보류] AI 렌즈 해설 설계 스펙(빌드 여부 결정용) | AI 해설 설계 참고 |
| `docs/AI_LENS_TECHNIQUE_MAP.md` | 주식 분석 기법 정밀 매핑표(결정론/LLM·오픈소스·라이선스) | 기법 구현 근거 조사 |
| `docs/_archive/AI_BRIEFING_SPEC.md` | AI 브리핑 레이어(R1~R3) — LLM=글 읽어 사실로(비예측) | 브리핑 층 작업 시 |
| `docs/EVENT_LAYER_SPEC.md` | 이벤트(공시) 사실 레이어 — "세 번째 시계"(US 완성형) | 이벤트/공시 층 작업 시 |
| `docs/ETF_LENS_PLAN.md` | ETF/ETN/REIT "상품 구성" 상세 설계 | ETF 상품 구성 작업 시 |

---

## ⑤ 언어권·국가탭·데이터 소스 (온보딩 런북)

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/LOCALE_SOURCE_PLAYBOOK.md` | **[필독]** 언어권 데이터소스 발견·검증·기록 런북(의미우선·검증게이트·실패원장) | 새 locale·데이터소스 착수 전 |
| `docs/COUNTRY_TAB_PLAYBOOK.md` | **[필독]** 국가 탭 표준 틀(US=레퍼런스·DoD 전 항목) | 새 국가탭 착수 전 매번 |
| 🅿️ `docs/KR_COMPLETENESS_AUDIT.md` | 한국 완성 감사 — 시장 복제 기준선(있다/예약/안만든다) | 새 시장 복제 체크 |
| 🅿️ `docs/KR_TAB_FINALIZE_PLAN.md` | 한국 탭 파이널라이즈 마스터 완성 플랜 | 한국탭 폴리시 작업 |
| 🅿️ `docs/KR_LINK_HUB_CURATION.md` | KR 링크 허브 큐레이션(신뢰 자산 검증·71개) | KR link_hub 갱신 시 |
| `docs/US_LINK_HUB_CURATION.md` | US 링크 허브 큐레이션 v2(67개/10카테고리) | US link_hub 갱신 시 |
| 🅿️ `docs/NEXT_SESSION_CN_PLAN.md` | [완료] CN 공시층 + R1(A주 cninfo·HK HKEXnews) 결과 | CN 데이터 히스토리 |
| `docs/_archive/NEXT_SESSION_VN_PLAN.md` | [완료·마감] VN 공시층 결과(공식 공시 소스 부재 실측) | VN 데이터 히스토리 |
| `docs/PARKED_HNX_VCI_ACTIVATION.md` | 🅿️ 보류 기능 — VN HNX(VCI·거주지 IP 필요·배선 완비) | HNX 재활성화 시 |
| `docs/PARKED_OAUTH_LOCALE_ACTIVATION.md` | ✅ 완료(710E·`6bccc45`) — OAuth 로케일(로그인 후 언어 유지·쿠키 방식·라이브 실측 성공) | OAuth 로케일 히스토리 |

---

## ⑥ 데이터 운영·마이그레이션·배포·자동화

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/SUPABASE_MIGRATION.md` | Supabase 전용 프로젝트 분리(구 OT-Marketing→Trillion) | DB 마이그레이션 참고 |
| `docs/SUPABASE_MIGRATION_HANDOFF.md` | Supabase 이사 마무리 가이드(사용자 단계·37테이블) | 이사 마무리 시 |
| `docs/DEPLOY_VERCEL.md` | 배포 — Vercel CLI(link+환경변수+배포·테스트 URL) | 배포 설정 시 |
| `docs/MAKE_AUTOMATION.md` | Make(Integromat) 자동화 시나리오 설계 | 자동화 시나리오 작업 |
| `docs/CALENDAR_DATA_UPDATE.md` | 경제 캘린더 데이터 수동 갱신 가이드(월 1회) | 캘린더 데이터 갱신 시 |
| `docs/THEMES_DATA_UPDATE.md` | 테마 데이터 갱신 가이드(월 1회) | 테마 데이터 갱신 시 |
| `docs/CROSS_REFERENCE.md` | Stock Terminal ↔ OTMarketing 분리 기록 | 두 저장소 경계 확인 |

---

## ⑦ UI·디자인·모바일·정책

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/UI_BROKER_LENS_REDESIGN.md` | 우측 레일 개편 — 증권사 탭 분리 + AI 렌즈 미리보기 설계 | 종목 우측 레일 작업 시 |
| `docs/MOBILE_BUILD_PLAN.md` | 모바일 빌드 마스터 플랜(375px·데스크탑 회귀 금지) | 모바일 반응형 작업 시 |
| `docs/MOBILE_MORNING_CHECKLIST.md` | 모바일 아침 체크리스트(화면별 확인) | 모바일 QA 시 |
| `docs/EXTERNAL_LINKS_POLICY.md` | 외부 링크 열기 & 번역 정책(결정 기록) | 외부 링크 UX 작업 시 |
| `docs/SITE_REVIEW_FIXES.md` | [아카이브] 초기 사이트 점검·수정 목록(2026-04-08) | 초기 히스토리 |

---

## ⑧ 사업·수익화·검증

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/BUSINESS_STRATEGY.md` | 비즈니스 전략서 [보존·V3, 결정 로그는 최신 누적] — 수익모델·AI전략·핵심 결정 | 사업 전략·결정 이력 참조 |
| `docs/AD_MONETIZATION_PLAYBOOK.md` | **[최신]** 광고·수익화 런북(전 언어권)·슬롯 인벤토리·어필리에이트·합법성 원장 | 광고·수익화 작업 전 |
| `docs/LAUNCH_PLAYBOOK.md` | **[최신]** 한국탭 완성→공개 로드맵 + 출시 전 검수 체크리스트(규제 조사) | 출시 준비·검수 시 |
| `docs/BUSINESS_CLAIM_SPEC.md` | 🔴 [이력] 리딩방·업체 클레임/관리 설계 — 2026-08-15 STEP1035로 기능 자체 삭제(`spinoff/advisor-directory/`로 이전). 설계 이력으로만 보존 | (작업 대상 아님 — 참고용) |
| `docs/_archive/ROOM_VERIFICATION_SPEC.md` | [이력] 리딩방 검증 설계(금감원 등록·신고 뱃지 · 정체성 프레임=[이력]→BRAND_IDENTITY) — 2026-08-15 STEP1035로 기능 삭제 | (작업 대상 아님 — 참고용) |
| `spinoff/advisor-directory/README.md` | 🆕 리딩방·유사투자자문 검증 디렉토리 — 본체 삭제 후 분리 보관된 코드의 안내(무엇/왜/DB의존성/복원절차/법적주의사항). DB 스키마 원문은 형제 파일 `spinoff/advisor-directory/schema.sql` | 이 기능을 타 플랫폼에서 재사용하려 할 때 |
| `docs/PARKED_TERMS_PRIVACY_ACTIVATION.md` | 🆕🅿️ 이용약관·개인정보처리방침 정리 보류 — STEP1035로 삭제된 기능을 아직 서술 중인 조항(원문 인용)·미루는 게 안전한 이유·재개 시 조사 항목. **법률 자문 아님**, 약관 파일 미편집 | 모델 완성 + 법률 자문 갖춰 재개할 때 |

---

## ⑨ 시스템·위젯 스펙

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/SYSTEM_DESIGN.md` | 시스템 설계서 [보존·V3] — 아키텍처·API 현황·인증/권한·배포 체크 | 아키텍처 참조 |
| `docs/WIDGET_SPEC_Chart.md` | 위젯 스펙 — Chart(차트) | 차트 위젯/페이지 작업 시 |
| 🅿️ `docs/WIDGET_SPEC_DartFilings.md` | 위젯 스펙 — DartFilings(DART 공시 피드) | 공시 피드 작업 시 |
| `docs/WIDGET_SPEC_OrderBook.md` | 위젯 스펙 — OrderBook(호가창) | 호가창 작업 시 |
| `docs/WIDGET_SPEC_Watchlist.md` | 위젯 스펙 — Watchlist(관심종목) | 관심종목 작업 시 |

---

## ⑪ 판정·감사 기록 (역DCF 트랙 · 884~937)

> 🔑 **성격**: 장은태 판정을 받은 결정서와 감사 보고서. **`STATE.md`가 결론만 요약하고 근거는 여기 있다.**

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/DECISION_912_LIVE.md` | **[최신]** 라이브 이상징후 912~937 전 과정(§10~§16) — `recovered=0` 관측·원인 축 4회 전환 | 라이브 결함 작업 전 |
| `docs/DECISION_929_DOD_SCOPE.md` | DoD 범위 미결 3문 | DoD 판정 전 |
| `docs/DECISION_921_COMPLETION.md` | 완성 정의(DoD9 분리) | 완성 선언 전 |
| `docs/DECISION_908_PENDING.md` · `DECISION_905_NEXT.md` | 미결·다음 후보 목록 | STEP 제안 전 |
| `docs/DECISION_907_WC_DEF.md` · `DECISION_884_TABLE_STRUCTURE.md` | 운전자본 정의 · 대조표 구조 | 드라이버 작업 전 |
| `docs/DECISION_890_DOD4.md` · `DECISION_902_DOD3.md` | DoD4·DoD3 판정서 | 해당 DoD 재개 시 |
| `docs/DECISION_918_AGENDA2.md` · `DECISION_922_BADGE.md` · `DECISION_923_NAMING.md` · `DECISION_925_BRIEF.md` | 안건별 판정 | 해당 화면 손대기 전 |
| `docs/AUDIT_904_OPEN_ITEMS.md` | §10 미결 76항목 전수 감사 | 미결 정리 시 |
| `docs/AUDIT_888_REVDCF_SURFACE.md` · `AUDIT_895_SKIP_REASONS.md` | 표면 감사 · 스킵 사유 감사 | 화면·스킵 작업 전 |
| `docs/COMMIT_GATES.md` | **[최신]** 커밋 전 실행 체크리스트(886 신설) | **커밋 전 매번** |
| `docs/PRIMARY_SOURCE_MAP.md` | 1차 출처 지도 | 출처 대조 시 |
| `docs/PARKED_FIELD_SURFACES.md` | 파킹된 표면 복원 절차 | 시장 재개 시 |
| `docs/US_UNIVERSE_DIAGNOSIS_2026-07.md` · `UNIVERSE_DEFINITION_MEASUREMENT_2026-07.md` | US 유니버스 진단·정의 측정 | 모집단 변경 전 |
| 🅿️ `docs/FREE_DATA_PROBE_2026-07.md` | 무료 데이터 소스 정찰 | 새 소스 검토 시 |
| 🅿️ `docs/TIER3_LLM_I18N_DESIGN.md` | LLM 생성물 i18n 설계 | ko 재개 시 |
| `docs/ABOUT_REWRITE_DRAFT.md` · `docs/BETA_INVITE.md` | About 초안 · 베타 초대 문안 | 카피 작업 시 |
| `docs/_archive/LENS_7_COMPLETED.md` | 🗄️ 7렌즈 완료 기록 | 히스토리 |

---

## ⑩ STEP 실행 명령서 아카이브

- `docs/STEP_*.md` = **Claude Code용 실행 명령서 아카이브**(총 693개). 번호는 연속(일부 분기 STEP: `20a`/`20b`·`52B`·`663B~E`·`672B~D` 등).
- 각 파일 = "한 STEP의 목표 + 실행 명령어(Sonnet/Opus) + 전제 커밋 + 변경 내용". 완료 후에도 **삭제하지 않고 아카이브**로 보존(설계 의도 기록).
- 특정 STEP 내용이 필요할 때만 파일명(`docs/STEP_{번호}_COMMAND.md`)으로 직접 열기. INDEX엔 개별 나열하지 않음.
- 최신 STEP 진행 상황은 §① 세션·핸드오프 문서에서 확인.

---

> **유지 규칙**: 새 비-STEP 문서를 만들면 이 INDEX의 해당 카테고리에 한 행 추가. 문서를 폐기하면 `[폐기]` 표기(삭제보다 표기 우선 — 히스토리 보존).
