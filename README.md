<!-- 2026-05-27 -->
# 운종(雲從) · UNJONG

> **한국 주식 동선의 출발점** — 정보 + 대화 + 허브 + 신뢰 4박자 플랫폼

조선 한양 종로의 옛 이름 **운종가(雲從街)** — "구름처럼 사람이 모이는 거리" — 에서 가져온 이름.
운종은 한국 주식 시장의 모든 정보·대화·외부 사이트를 한 곳에 모으는 허브입니다.

## 핵심 정체성

| 영역 | 내용 |
|------|------|
| **정보** | 매매 스타일별 카드 큐레이션 (단타·장타·미국주식 × 7개) |
| **대화** | 3창 분리 실시간 채팅 |
| **허브** | 모든 한국 주식 사이트 출발점 |
| **수익** | Partner-Agnostic Lead Gen (Tier 1·2·3 인증 광고) |
| **신뢰** | 인증 시스템 3 Tier (사기·작전·리딩방 차단) |

## 화면 구조 (Layer 0 ✅)

```
┌──────┬───────────────────────────────┬──────┐
│ 채팅  │ 종목 상세 (차트·호가·체결·종합)   │ 관심  │
│ 좌측  │                                │ 종목  │
│ 500px├───────────────────────────────┴──────┤
│       │ 카드 7개 풀폭 (Movers·Volume·VI 등)    │
└──────┴──────────────────────────────────────┘
```

**3창 분리** (매매 스타일별 페이지):
- `/scalper` — 단타창 (장중 09:00~15:30)
- `/longterm` — 장타창 (저녁·주말)
- `/us` — 미국주식창 (새벽 22:30~05:00)

**21개 카드** (3창 × 7) + **21개 디테일 페이지** (동적 라우트):
- 단타창: Movers · Volume · VI · NetBuy+거래원 · 공시 · 테마 · 공매도
- 장타창: 공시 · 분기실적 · 저평가 · 배당TOP · 52주신저가 · 섹터 · 관리종목
- 미국주식창: 글로벌지수+VIX · Pre/After · M7 · Movers · 환율+시계 · 뉴스+8K · FOMC

## 기술 스택

- **프론트엔드**: Next.js 16 + TypeScript + Tailwind CSS v4
- **상태 관리**: Zustand (persist)
- **차트**: TradingView + lightweight-charts
- **데이터베이스**: Supabase (PostgreSQL + Realtime + Auth)
- **데이터 소스**: KIS · DART · Yahoo Finance · KRX · SEC EDGAR (100% 무료)
- **배포**: Vercel + Supabase Cloud

## 개발 환경

### 사전 요구사항

- Node.js 20+
- npm
- Supabase 계정 (`.env.local` 환경변수)
- KIS API 키 (서버사이드)
- DART API 키 (Open DART)

### 실행

```bash
npm install
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
- 보호용: `unjong.com` + `unjong.app` (Layer 6 구매 예정)

## 로드맵

| Layer | 내용 | 상태 |
|-------|------|------|
| **Layer 0** | 시각 골격 + 21개 카드 + 디테일 페이지 | ✅ 완성 (세션 #25) |
| **Layer 1** | 카드 실데이터 + Supabase Realtime 채팅 | ⏸️ 시작 예정 |
| Layer 2 | 광고 허브 + 사이트 모아보기 | 예정 |
| Layer 3 | 인증 시스템 (Tier 1·2·3) | 예정 |
| Layer 4 | 모더레이션 + 신고 + 닉네임 점수제 | 예정 |
| Layer 5 | 통합 종목 검색 + AI 봇 (@운종AI) | 예정 |
| Layer 6 | 도메인 + Vercel 배포 + 광고주 영업 | 예정 |

## 참조 문서

| 파일 | 용도 |
|------|------|
| `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작 가이드 (가장 최신) |
| `docs/PRODUCT_SPEC_V4.md` | V4 비전·구조·레이어 (현재 확정) |
| `docs/BRAND_IDENTITY.md` | 운종 브랜드 이름·색·도메인 |
| `docs/NEXT_SESSION_START.md` | 다음 세션 Layer 1 가이드 |
| `docs/CHANGELOG.md` | 변경 이력 (세션별) |
| `session-context.md` | TODO + 누적 결정 사항 |
| `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| `docs/PRODUCT_SPEC_V3.md` | V3 히스토리 (보존) |

## 라이선스

비공개 프로젝트.

---

> 운종(雲從) — 모든 자산이 운집(雲集)하는 곳.
