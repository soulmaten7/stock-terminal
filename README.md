<!-- 2026-06-03 -->
# 운종(雲從) · UNJONG

> **한국 금융 동선의 출발점** — 정보 + 대화 + 허브 + 신뢰 4박자 플랫폼

조선 한양 종로의 옛 이름 **운종가(雲從街)** — "구름처럼 사람이 모이는 거리" — 에서 가져온 이름.
운종은 한국 금융 시장의 정보·대화·외부 정확한 출처를 한 곳에 모으는 허브입니다.

**운종 V5 정체성 (2026-06-01 합의)**:
네이버 페이 증권 레이아웃 + 토스 증권 카드 디자인 + Trustpilot 평가 모델 = 운종 고유.

거래 X · 영어판 X · 정밀 스크리너 X (네이버·키움·FnGuide 영역 — 외부 동선 안내).

## 핵심 정체성

| 영역 | 내용 |
|------|------|
| **정보** | 한국 5개·미국 4개 정확 카드 + 종목별 가격·차트·뉴스·공시·시고저·52주·PER |
| **대화** | 종목별 채팅 + 토론·댓글 (Realtime + Tier 표시 + 신고 5건 자동 hidden) |
| **허브** | 모든 한국 금융 사이트 출발점 (네이버·키움·FnGuide·Investing.com 외부 동선) |
| **신뢰** | 상품·리딩방 평가 디렉토리 (Trustpilot 금융 한국판 — MVP 2.0) + Tier 1·2·3 인증 |

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

- **MVP 1.0** — 기본 정보 + 정제된 채팅·토론 (트래픽 확보)
- **MVP 2.0** — 상품·리딩방 평가 디렉토리 (Trustpilot 금융 버전) — 운종 진짜 차별화
- **광고** — Tier 1·2·3 인증 광고 시스템 (Sponsored ↔ 평가 명확 분리)

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
| `docs/NEXT_SESSION_START.md` | 운종 V5 비전·구조·다음 STEP |
| `docs/BRAND_IDENTITY.md` | 운종 브랜드 + V5 디자인 시스템 |
| `docs/CHANGELOG.md` | 변경 이력 (세션별) |
| `session-context.md` | TODO + 누적 결정 사항 |
| `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| `docs/PRODUCT_SPEC_V4.md` | V4 비전 (이력 보존) |
| `docs/PRODUCT_SPEC_V3.md` | V3 히스토리 (보존) |

## 라이선스

비공개 프로젝트.

---

> 운종(雲從) — 모든 자산이 운집(雲集)하는 곳.
