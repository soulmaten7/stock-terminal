<!-- 2026-05-27 -->
# 운종(雲從) — 다음 세션 시작 가이드

> **Last updated**: 2026-05-27 (Layer 0 완료 · 세션 #25)
> **현재 상태**: Layer 0 (틀) 100% 완료. 다음은 Layer 1 (카드 확장 + 실데이터).

## 1. 즉시 확인할 파일
1. `docs/PRODUCT_SPEC_V4.md` — V4 비전·구조 전체
2. `docs/BRAND_IDENTITY.md` — 운종 브랜드 정체성
3. `CLAUDE.md` — Cowork ↔ Claude Code 역할 분담
4. `session-context.md` — TODO + 세션 #25 결정사항 누적

## 2. Layer 0 완료 상태 ✅
| STEP | 작업 | 커밋 |
|------|------|------|
| 88 | 운종 브랜드 적용 | 892c662 |
| 89 | 3창 라우트 (/scalper /longterm /us) | e8bc870 |
| 90 | 헤더 (로고·검색·티커·3창박스) | 052c439 |
| 91 | 좌측 사이드 (채팅+관심종목) | 13ae6c4 |
| 92 | 메인 카드 그리드 (창별 3개) | ef1bf4d |
| 93 | 우측 사이드패널 (4탭) | 7026306 |
| 94 | V3 → /dashboard 강등 | (이번) |
| 95 | PRODUCT_SPEC_V4 문서 | (세션 시작) |

## 3. 다음 — Layer 1 진입
**카드 7개 완성 + 실데이터 + 채팅 실시간**

### 3-1. 단타창 신규 카드 4개
- VI 발동/해제 (KIS 추가 호출)
- NetBuy + 거래원 매수상위
- 테마 TOP10 (기존 V3 재활용 가능)
- 공매도 잔고 변화 (KRX 크롤링)

### 3-2. 장타창 신규 카드 4개
- 저평가 종목 랭킹 (quant_factors DB 활용)
- 배당 캘린더 + 수익률 TOP
- 52주 신저가 우량주
- 관리종목·투자유의 경고

### 3-3. 미국주식창 신규 카드 4개
- Pre-market / After-hours TOP
- Magnificent 7 모음
- USD/KRW 환율 + 미국 시계
- FOMC·CPI·NFP 캘린더

### 3-4. 채팅 실시간
- Supabase Realtime 연결
- 닉네임 시스템 (Layer 4 의 점수제는 별도)
- 채팅 메시지 영구 저장

### 3-5. 카드 → 우측 패널 연결
- 9개 카드 (Layer 0) + 12개 신규 카드 (Layer 1) 모두 종목 클릭 시 `setSelectedSymbol` 호출
- 우측 패널 자동 변경

### 3-6. 글로벌 티커 실시간
- 헤더의 KOSPI/KOSDAQ/S&P/Nasdaq/USD-KRW 더미 → 실데이터

## 4. Layer 2 이후 로드맵
| Layer | 내용 | 시점 |
|-------|------|------|
| Layer 2 | 광고 허브 + 참고 사이트 + 헤더 사이트 모아보기 | Layer 1 후 |
| Layer 3 | 인증 시스템 (Tier 1·2·3) + 광고주 신청 | 그 다음 |
| Layer 4 | 모더레이션 + 신고 + 닉네임 점수 | 베타 직전 |
| Layer 5 | 통합 종목 검색 + AI 봇 (@운종AI) | 차별화 |
| Layer 6 | unjong.com 도메인 + Vercel 배포 + 광고주 영업 | 출시 |

## 5. 절대 잊지 말 것
- 운종 정체성 = **정보 · 대화 · 허브 · 신뢰** (거래 X)
- 영어판 안 만든다 (국가별 별도)
- 5섹션 대시보드 → /dashboard (보존)
- 채팅창 크기 고정, 스크롤로 보기
- 매매 스타일별 화면 자체가 다름 (단타·장타·미장 페이지 분리 + 우측 패널만 공통)
- WatchlistPanel 외 카드의 종목 클릭 연결은 Layer 1 작업

## 6. 도메인 현황
- ✅ 보유: `onetrillion.app` (메인 도메인 예정)
- ⏸️ 보호용 보류: `unjong.com` ($11.25), `unjong.app` ($9.99) — Layer 6 에서 구매

## 7. 즉시 시작할 작업 (Layer 1 첫 STEP 후보)
- **STEP 96 — Layer 1 — 단타창 신규 카드 4개**: VI · 거래원 · 테마 · 공매도
- 또는 **STEP 96 — Supabase Realtime 채팅 실시간 연결** (기반 인프라 먼저)
- 또는 **STEP 96 — 글로벌 티커 실데이터** (헤더 즉시 효과)

Cowork 과 다음 세션 시작 시 어디부터 갈지 결정.
