<!-- 2026-07-18 -->
# 📖 Trillion(트릴리언) — 전체 문서 마스터 인덱스

> **이 파일은 무엇인가**: 프로젝트의 모든 참조 문서를 **카테고리별로 한자리에** 모은 카탈로그. "그 내용 어느 문서에 있더라?"를 매번 뒤지지 않게, **언제든 여기서부터** 원하는 문서를 꺼낸다.
> **사용법**: 아래 카테고리 표에서 목적에 맞는 파일을 찾아 열기. 각 행 = `파일` · `한 줄 용도` · `언제 읽나`.
> **범위**: 루트 파일 5개 + `docs/` 비-STEP 문서 67개. STEP 실행 명령서(693개)는 §⑩에 한 줄로 요약(개별 나열 X).
> **버전 표기**: `[최신]` = 현행 정본 · `[보존]`/`[폐기]`/`[아카이브]` = 히스토리(참고만, 충돌 시 최신 우선).
> **갱신일**: 2026-07-11 · HEAD `ba3ce68`.

---

## 세션 시작 시 읽는 순서 (요약)
1. **`docs/STATE.md`** — 현재 상태 단일 정본(HEAD·현재 상태·다음 할 일 · 덮어쓰기 · 세션 시작 최우선)
2. **`docs/SYSTEM_MAP.md`** — 아키텍처·6개국 파이프라인·크론·테이블·함정(필요할 때)
3. **`docs/ROADMAP.md`** — 무엇을/어떤 순서로(Phase 단일 기준)
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
| `docs/PRODUCT_SPEC_V7.md` | [보존] V7 — "검증된 중립 관문(Gateway)" 재정의 (구 비전 · 정체성 프레임 폐기) | V7 히스토리 · 현행 정체성=BRAND_IDENTITY/STATE |
| `docs/PRODUCT_SPEC_V6.md` | [보존] V6 — 정체성 5결정(정보+토론+신뢰) | V6 히스토리 참고 |
| `docs/PRODUCT_SPEC_V4.md` | [보존] V4 — 2창(한국·미국)·토스카드·Trustpilot 평가 | V4 히스토리 참고 |
| `docs/PRODUCT_SPEC_V3.md` | [보존] V3 — Stock Terminal 초기 스펙 | V3 히스토리 참고 |
| `docs/ROADMAP.md` | **[최신]** 마스터 로드맵 — 무엇을/어떤 순서로(Phase 단일 기준) | STATE 다음(순서 확인) |
| `docs/RELEASE_ROADMAP.md` | **[최신·핵심]** 1·2·3차 출시 로드맵 — 국가셋(KR·US·JP·GB·홍콩·VN)·차수별 범위·광고 활성화 시점 | 출시 계획·차수 결정 시 |
| `docs/SITE_MAP_V7.md` | SITE MAP V7 — 네이버 증권 구조 복제 spec | IA·메뉴 구조 작업 시 |
| `docs/TOSS_ANALYSIS_AND_IA.md` | 토스증권 전체 분석 + 새 IA(토스식 개편 spec) | IA 개편 참고 |
| `docs/NAVER_STOCK_PAGE_ANALYSIS.md` | 네이버 종목 페이지 디테일 분석 + Gap(V6) | 종목 페이지 디테일 보강 시 |
| `docs/HOME_REDESIGN_V2_SPEC.md` | [아카이브] 홈 재설계 V2(세션 #9) | 홈 디자인 히스토리 |
| `docs/DASHBOARD_SPEC_V3.md` | [최신·대시보드] 풀스크롤 대시보드 재설계 V3.2 | 홈 대시보드 작업 시 |
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
| 🔴 **`data/sources/README.md`** | **[원본 보관소 색인]** 원전 스프레드시트 T3~T10 · 다모다란 8종 · 원문 HTML · 학술 · **외부 유니버스 발췌** · 미저장 목록 | 규칙 ⓪·⓪-3 대조 시 **매번** |
| 🔴 **`lib/revdcf/registry.ts`** | **[코드형 원장]** 원전 변수 : 우리 값 : **차이 사유** 13행 + **`OUR_ADDITIONS`**(원전에 없는 것: sensitivity·distribution·**universe·liquidity**) | 드라이버·유니버스 손대기 전 |
| `docs/LENS_COMPLETION_STANDARD.md` | **[완성 기준]** DoD 9항목 + §10 깊이 4축 — 역DCF 현황 표 포함 | "완성" 선언 전 |
| `docs/LENS_DEV_PLAYBOOK.md` | **[필독]** 기법 렌즈 개발 플레이북 + 문제해결 로그(§0 원칙·**#1~#44**) | 새 렌즈 착수 전 + 막힐 때 |
| `docs/LENS_ROADMAP.md` | 기법(렌즈) 로스터 & 로드맵 | 다음 렌즈 선정 시 |
| `docs/LENS_ARCHITECTURE.md` | **[최신·뼈대]** 렌즈 "독립 배선" 표준 — StockData 번들·Lens 인터페이스·레지스트리·기법당 AI 교체 지점 | 렌즈 구조 변경·새 렌즈·AI 교체 시 |
| `docs/LENS_STRENGTH_MAP.md` | 기법별 적합 영역(강한 종목·섹터·조건) | 렌즈 가중·선택 근거 |
| `docs/LENS_DISPLAY_CHARTER.md` | 렌즈 표시 헌장 — 모든 카드 공통 표시 규칙(강제 체크리스트) | 렌즈 카드 생성/수정 시 |
| `docs/AI_LENS_SPEC.md` | [설계·보류] AI 렌즈 해설 설계 스펙(빌드 여부 결정용) | AI 해설 설계 참고 |
| `docs/AI_LENS_TECHNIQUE_MAP.md` | 주식 분석 기법 정밀 매핑표(결정론/LLM·오픈소스·라이선스) | 기법 구현 근거 조사 |
| `docs/AI_BRIEFING_SPEC.md` | AI 브리핑 레이어(R1~R3) — LLM=글 읽어 사실로(비예측) | 브리핑 층 작업 시 |
| `docs/EVENT_LAYER_SPEC.md` | 이벤트(공시) 사실 레이어 — "세 번째 시계"(US 완성형) | 이벤트/공시 층 작업 시 |
| `docs/ETF_LENS_PLAN.md` | ETF/ETN/REIT "상품 구성" 상세 설계 | ETF 상품 구성 작업 시 |

---

## ⑤ 언어권·국가탭·데이터 소스 (온보딩 런북)

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/LOCALE_SOURCE_PLAYBOOK.md` | **[필독]** 언어권 데이터소스 발견·검증·기록 런북(의미우선·검증게이트·실패원장) | 새 locale·데이터소스 착수 전 |
| `docs/COUNTRY_TAB_PLAYBOOK.md` | **[필독]** 국가 탭 표준 틀(US=레퍼런스·DoD 전 항목) | 새 국가탭 착수 전 매번 |
| `docs/KR_COMPLETENESS_AUDIT.md` | 한국 완성 감사 — 시장 복제 기준선(있다/예약/안만든다) | 새 시장 복제 체크 |
| `docs/KR_TAB_FINALIZE_PLAN.md` | 한국 탭 파이널라이즈 마스터 완성 플랜 | 한국탭 폴리시 작업 |
| `docs/KR_LINK_HUB_CURATION.md` | KR 링크 허브 큐레이션(신뢰 자산 검증·71개) | KR link_hub 갱신 시 |
| `docs/US_LINK_HUB_CURATION.md` | US 링크 허브 큐레이션 v2(67개/10카테고리) | US link_hub 갱신 시 |
| `docs/NEXT_SESSION_CN_PLAN.md` | [완료] CN 공시층 + R1(A주 cninfo·HK HKEXnews) 결과 | CN 데이터 히스토리 |
| `docs/NEXT_SESSION_VN_PLAN.md` | [완료·마감] VN 공시층 결과(공식 공시 소스 부재 실측) | VN 데이터 히스토리 |
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
| `docs/BUSINESS_CLAIM_SPEC.md` | 리딩방·업체 클레임/관리 설계(Phase 2 수익화 토대) | 업체 claim 기능 작업 시 |
| `docs/ROOM_VERIFICATION_SPEC.md` | 리딩방 검증 설계(금감원 등록·신고 뱃지 · 정체성 프레임=[이력]→BRAND_IDENTITY) | 리딩방 검증 작업 시 |

---

## ⑨ 시스템·위젯 스펙

| 파일 | 용도 | 언제 읽나 |
|------|------|-----------|
| `docs/SYSTEM_DESIGN.md` | 시스템 설계서 [보존·V3] — 아키텍처·API 현황·인증/권한·배포 체크 | 아키텍처 참조 |
| `docs/WIDGET_SPEC_Chart.md` | 위젯 스펙 — Chart(차트) | 차트 위젯/페이지 작업 시 |
| `docs/WIDGET_SPEC_DartFilings.md` | 위젯 스펙 — DartFilings(DART 공시 피드) | 공시 피드 작업 시 |
| `docs/WIDGET_SPEC_OrderBook.md` | 위젯 스펙 — OrderBook(호가창) | 호가창 작업 시 |
| `docs/WIDGET_SPEC_Watchlist.md` | 위젯 스펙 — Watchlist(관심종목) | 관심종목 작업 시 |

---

## ⑩ STEP 실행 명령서 아카이브

- `docs/STEP_*.md` = **Claude Code용 실행 명령서 아카이브**(총 693개). 번호는 연속(일부 분기 STEP: `20a`/`20b`·`52B`·`663B~E`·`672B~D` 등).
- 각 파일 = "한 STEP의 목표 + 실행 명령어(Sonnet/Opus) + 전제 커밋 + 변경 내용". 완료 후에도 **삭제하지 않고 아카이브**로 보존(설계 의도 기록).
- 특정 STEP 내용이 필요할 때만 파일명(`docs/STEP_{번호}_COMMAND.md`)으로 직접 열기. INDEX엔 개별 나열하지 않음.
- 최신 STEP 진행 상황은 §① 세션·핸드오프 문서에서 확인.

---

> **유지 규칙**: 새 비-STEP 문서를 만들면 이 INDEX의 해당 카테고리에 한 행 추가. 문서를 폐기하면 `[폐기]` 표기(삭제보다 표기 우선 — 히스토리 보존).
