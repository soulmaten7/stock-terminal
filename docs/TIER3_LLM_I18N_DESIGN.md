<!-- 2026-07-14 -->
# Tier 3 설계 — LLM 생성물 영어화 (브리핑 · news-brief · 공시 AI요약)

> `/en`에 남은 마지막 한국어 = **LLM이 한국어로 생성 + `*_ko` 컬럼에 locale 없이 캐시**한 것. 결정론(Tier 1·2)은 완료. 이건 DB 마이그레이션 + LLM 비용이 걸려 **설계 확정 후 STEP**.
> **원칙: KR은 순수 additive로 무손상**(ko 경로·ko 프롬프트·ko 캐시 그대로), 영어는 **덧붙이기만**.

---

## 0. 대상 (LLM 라우트)
- **R2 브리핑** — `/api/brief` → `stock_briefings.brief_ko`(키 `symbol,as_of`).
- **R3 뉴스브리핑** — `/api/news-brief` → `news_briefs.summary_ko`(키 `symbol,as_of`). ⚠️ **한국어 강제 후처리**(비한국어→한국어 재번역 + 원/엔/위안 통화어 주입) 있음.
- **R1 공시요약** — `/api/events/summary`(US) + `kr/jp/cn/gb/vn-events/summary` = **6개 라우트** → `filing_summaries.summary_ko`(키 `accession`·**전역**).

## 1. 🔑 캐시 스키마 결정 — **`*_en` 컬럼 추가**(Option A·권장)
두 안 비교:
| | A. `*_en` 컬럼 추가(권장) | B. 키에 `lang` 추가 |
|---|---|---|
| 마이그레이션 | `ADD COLUMN *_en text`(nullable) | PK/충돌키 변경 + 기존행 `lang='ko'` 백필 |
| 기존 ko 데이터 | **무손상**(그대로) | 재구성 필요 |
| 행 구조 | 엔티티당 1행(ko·en 나란히) | 엔티티×locale 다행 |
| 위험 | 낮음(순수 additive) | 높음(키 변경) |
| 읽기 | `locale==='en' ? row.*_en : row.*_ko` | `where lang=?` |

→ **A 채택.** `stock_briefings.brief_en` · `news_briefs.summary_en` · `filing_summaries.summary_en` 추가. 읽기=로케일 컬럼, **en null이면 생성→en 컬럼 upsert**. ko 경로 완전 불변.

## 2. On-demand 생성 & 비용 (❗ "2배"가 아님)
- en 컬럼은 **첫 `/en` 조회 시 지연 생성**(ko와 동일 패턴). → **실제 영어 트래픽만큼만** LLM 호출(전량 2배 아님·안 본 종목은 0).
- 기존 ko 캐시 그대로 서빙(재생성 없음). 비용 = 영어 사용량 비례·상한 자연.
- (선택·후속) 인기 US 종목 en 프리워밍 크론 — 지금은 불필요(on-demand로 충분).

## 3. 영어 프롬프트 (라우트별 system/user)
- 각 라우트에 **영어 프롬프트 추가**(ko 프롬프트 불변·`locale`로 분기). **가드레일 동일**: 사실만·**방향/예측/목표가 금지**·렌즈 판정·전문가 사실 톤(해요체→plain professional English·과장 금지).
- **브리핑(R2)**: facts를 영어로 — `computeSymbolLenses(symbol, locale)`로 lens facts를 영어로 뽑아 프롬프트에 주입(안 그러면 영어 브리핑이 한국어 렌즈명 인용). 715에서 lens는 이미 이중언어라 locale만 전달.
- **news-brief(R3)**: ⚠️ **한국어 강제 후처리 게이팅** — 비한국어→한국어 재번역·원/엔/위안 주입을 `if (locale==='ko')`로 감싸 en은 **건너뜀**. en 통화어는 영어(or 심볼) 유지. `summary`는 반드시 영어로 프롬프트.
- **공시요약(R1·6라우트)**: 각 영어 system 프롬프트("US 개인투자자에게 사실만" 류의 영어판). 원문 소스는 자국어(DART 한국어·EDGAR 영어·EDINET 일본어…)라 **요약만 영어**.

## 4. 배선 (thread `?lang`)
- 라우트: `pickLocale(searchParams.get('lang'))` 수용(기존 패턴).
- 클라: `&lang=${useLocale()}` — brief(`LensPreview:61`·`StockLensClient:751`)·news-brief(`:719`)·events summary fetch(EventLayer). 715·716에서 lens·events는 이미 배선됨 → 나머지만.

## 5. STEP 분할 (각 독립·KR 무손상·라이브 검증)
- **719 — 마이그레이션**: `stock_briefings.brief_en`·`news_briefs.summary_en`·`filing_summaries.summary_en` 3개 컬럼 추가(nullable). **DB만·동작 변화 0**(Supabase 마이그레이션 파일·MCP apply). 가장 안전한 선행.
- **720 — 브리핑(R2) 영어**: `/api/brief` 영어 프롬프트+`?lang`+en 컬럼 on-demand + lens facts locale + 클라 `&lang`. (제일 눈에 띔.)
- **721 — news-brief(R3) 영어**: `/api/news-brief` 영어 프롬프트+한국어 강제 후처리 en 게이팅+en 컬럼+클라 `&lang`.
- **722 — 공시요약(R1) 영어**: 6개 `*-events/summary` 라우트 영어 프롬프트+`filing_summaries.summary_en`+`?lang`+EventLayer `&lang`. (가장 큼·6라우트 일괄.)

## 6. KR 무손상 보장 (매 STEP)
ko 읽기=`*_ko`(불변)·ko 프롬프트 불변·ko 후처리 불변·en은 새 컬럼/새 프롬프트로만. 검증: `/stock/{KR}` 브리핑·뉴스·공시요약 **현재와 동일**(캐시 히트라 재생성 0) + `/en/stock/{US}` 영어 신규 생성 확인.

## 7. 위험·랜드마인
- **캐시 충돌**(먼저 캐시된 언어가 양쪽에) → **컬럼 분리로 원천 차단**(A안 핵심 이유).
- **프롬프트 가드레일 드리프트** → 영어 프롬프트도 "방향/예측/목표가 금지" 명시·ko와 대칭. en 출력에 예측/목표가 새는지 검수.
- **브리핑 facts 언어** → `computeSymbolLenses(locale)` 안 넘기면 영어 브리핑이 한국어 렌즈명 인용(720 필수 체크).
- **LLM 키/과금** = 서버 env(사용자 관리·Cowork 미취급). 비용 상한은 on-demand로 자연 확보.
- **DB 마이그레이션 = 운종 전용 Supabase**(POTAL 금지·CLAUDE.md).

## 8. 완결 시 = /en 100% 영어
719~722 후 `/en`은 로고 워드마크(트릴리언·의도적) 외 **한국어 0**. US 영어 시장 제품으로 완성.

---
> **결정 필요(사용자)**: ① 캐시 스키마 A(`*_en` 컬럼) 승인? ② STEP 순서 719(마이그)→720(브리핑)→721(뉴스)→722(공시) OK? ③ on-demand 생성(프리워밍 크론 없이) OK? → 승인 시 STEP 719(마이그레이션)부터.
