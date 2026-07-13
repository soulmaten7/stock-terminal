<!-- 2026-07-13 -->
# Trillion(트릴리언)

> **종목을 보는 눈을, 누구에게나.** — 모든 시각을 데이터로, 판단은 당신입니다.

기관이 쓰는 검증된 분석 기법(**TR-AI 렌즈**)을 개인 손에. 예측·추천은 하지 않고, 1차 재료(시세·뉴스·공시)를 정직하게 **데이터로 보여주고 판단은 사용자**에게 맡깁니다. 거래 X(매매·중개·자문 없음 · 통신판매업신고 비대상 = 무거래 정보서비스). 사업자 원트릴리언(210-39-33812).

## 정체성 3기둥

권위 = `docs/BRAND_IDENTITY.md`.

| 기둥 | 내용 |
|------|------|
| **무기 (Arm)** | AI 렌즈·분석 = 개인 손에 쥐어주는 기관급 명료함 |
| **직시 (See)** | 정직한 1차 재료. 데이터 없으면 "데이터 부족"이라 말한다. 비예측 |
| **자립 (Compete)** | 추천 안 함. 분석은 우리가, 판단은 당신이 |

목소리 = **멍거 톤**(건조·직설·인센티브·"덜 멍청하게"). 각인 = 찰리 멍거. 엔진명 = **TR-AI 렌즈**("AI 렌즈"=기능, "TR-AI"=엔진 브랜드). 디자인 = 미드나잇 `#0E1116` + 민트 `#2DD4BF`.

> ⚠️ 아래 "운종 V5 페이지 13개"·"진행 상태(STEP 88~134)" 등 구조 서술은 **리브랜드 이전(운종 V5) [이력]** — 현재는 게이트웨이 구조(상단 탭 종목·정보 2개). 최신 상태 = `docs/SESSION_BOOT.md`. 코드 식별자 `unjong-*`·DB명은 대소문자 이유로 유지.

## 운종 V5 페이지 13개

| 라우트 | 역할 |
|--------|------|
| `/` | 새 홈 (시장 핫이슈 + HOT 토론·평가·헤드라인 + 관심종목) |
| `/kr` | 한국주식 카드 5개 |
| `/us` | 미국주식 카드 4개 |
| `/stock/[code]` | 종목 페이지 (좌 정보·차트 / 중 탭(차트·토론·뉴스·인사이트) + 댓글 / 우 채팅) |
| `/products` | 상품 디렉토리 (ETF·펀드·랩·리츠·채권) |
| `/product/[id]` | 상품 평가 |
| `/rooms` | 리딩방 디렉토리 (텔레그램·카카오·디스코드·유튜브) |
| `/room/[id]` | 리딩방 평가 |
| `/calendar` | Investing.com 외부 링크 안내 |
| `/auth/login`·`/auth/callback` | 카카오 OAuth (활성화 미완) |
| `/mypage` | 마이페이지 |

## 수익 모델

권위 = `docs/AD_MONETIZATION_PLAYBOOK.md`.
- **인리스트 광고** — 종목 리스트 증권사 슬롯 + 콘텐츠 피드 슬롯 ('광고' 라벨 상시)
- **유사투자자문 조회 디렉토리** — 금감원 등록·신고 **사실** + 누적 즐겨찾기 **관심**순 (미검증 평가=별점·후기 없음)
- **AI 구독**(Phase 5·미착수) — 원칙: 능력을 팔되 의존을 팔지 않는다(리딩방 광고 = 철학적으로 독)

## 기술 스택

- **프론트엔드**: Next.js 16 + TypeScript + Tailwind CSS v4
- **상태 관리**: Zustand (persist)
- **차트**: lightweight-charts (Apache 2.0)
- **데이터베이스**: Supabase (PostgreSQL + Realtime + Auth)
- **데이터 소스**: KIS · DART · Yahoo Finance · KRX · SEC EDGAR (100% 무료)
- **폰트**: Pretendard Variable (CDN @import)
- **배포**: Vercel + Supabase Cloud

## 개발 환경

### 사전 요구사항

- Node.js 20+
- npm
- Supabase 계정 (`.env.local` 환경변수 — `.env.example` 참조)
- KIS API 키 (서버사이드)
- DART API 키 (Open DART)

### 실행

```bash
npm install
cp .env.example .env.local   # 그 후 실제 값 채우기
npm run dev
# http://localhost:3333 에서 확인
```

### 빌드

```bash
npm run build
npm run start
```

## 도메인 전략

- 메인: `onetrillion.app` (보유)
- 보호용: `unjong.com` + `unjong.app` (구매 검토 중)

## 진행 상태 (STEP 88~134)

| 단계 | 내용 | 상태 |
|------|------|------|
| 88~99 | V4 골격 + 21개 카드 + 디테일 | ✅ V4 완성 (보존) |
| 100~113 | 인증·검색·관심종목 + 채팅 1차 | ✅ 완성 |
| 114 | V5 1차 — 1984px + 2창(한국/미국) + 카드 9개 + 종목 탭 시스템 + 채팅 1채널 | ✅ V5 골격 |
| 115~127 | 인증·평가·디렉토리·종목 페이지 다듬기 | ✅ 완성 |
| 128 | MVP 2.0 진입 (상품·리딩방 디렉토리) | ✅ 진입 |
| 129~133 | 전면 디자인 리뉴얼 (Pretendard + 토스 색상 + rounded-2xl + 손성기 모듈 순서) | ✅ 완성 |
| 134 | 모든 문서·로그 3차 교차검수 갱신 | ✅ 완료 |
| 135 | 잔여 문서 V5 정렬 패치 (README·BRAND·SPEC_V4·.env.example) | ✅ 완료 |

## 참조 문서

| 파일 | 용도 |
|------|------|
| `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작 가이드 (가장 최신) |
| `docs/NEXT_SESSION_START.md` | 최신 상태 요약 + 다음 STEP |
| `docs/BRAND_IDENTITY.md` | **현행 브랜드 정체성(권위)** + 디자인 시스템 |
| `docs/CHANGELOG.md` | 변경 이력 (세션별) |
| `session-context.md` | TODO + 누적 결정 사항 |
| `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| `docs/PRODUCT_SPEC_V4.md` | V4 비전 (이력 보존) |
| `docs/PRODUCT_SPEC_V3.md` | V3 히스토리 (보존) |

## 라이선스

비공개 프로젝트.

---

> Trillion(트릴리언) — 종목을 보는 눈을, 누구에게나.
