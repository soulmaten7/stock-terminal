<!-- 2026-05-31 -->
# 운종(雲從) — 다음 세션 시작 가이드

> **Last updated**: 2026-05-31 (STEP 126 — 종목 페이지 핫픽스: 종목명·시총·52주·차트)
> **현재 상태**: 운종 V5 PC 핵심 완성 + 종목 페이지 버그 핫픽스 (114~126). 빌드 ✓. 다음은 사용자 시각 피드백 / Vercel 배포 / 모바일 반응형.

### STEP 126 검증 (사용자 실행 환경)
- `/stock/000660` → SK하이닉스 종목명·시총 200조·52주 가격·일봉 차트 정상 확인
- 차트 안 보이면 브라우저 콘솔의 `[chart]` 경고/에러 공유 (KIS chart API 응답 확인 필요)

⚠️ **미적용 DB 마이그레이션** (Cowork 가 Supabase MCP 로 순서대로 적용):
- `015_chat_unify.sql` — 채팅 room → general 통합
- `016_users_v5.sql` — users 결제 컬럼 제거 + tier/bio/oauth_provider + handle_new_user 트리거 + RLS
- `017_discussions.sql` — discussions/likes/reports 테이블 + chat_messages.symbol + 트리거 + RLS + Realtime
- `018_discussion_comments.sql` — discussion_comments 테이블 + comment_count 트리거 + RLS + Realtime
  → **017·018 적용 전까지 /stock/[code] 의 토론·댓글·종목채팅은 빈 화면/에러** (테이블 없음). 페이지/빌드는 정상.

🔴 **사용자(Jang Eun) 직접 작업 — 카카오 로그인 활성화 (STEP 118 잔여)**:
1. 카카오 Developers 콘솔: 앱 등록 + Redirect URI `https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback` + REST API 키
2. Supabase Dashboard → Auth → Providers → Kakao ON + 키 입력
→ 전까지 카카오 로그인 시 OAuth 실패. (토론 글쓰기는 로그인 필요, 채팅·읽기는 비로그인 가능)

✅ **채팅 DB 활성화 완료**: 마이그레이션 005 + 014 적용. 실시간 채팅 정상.

### 이연 사항 (다음 STEP)
- 고아 컴포넌트 dirs (analysis/briefing/stocks/news/dashboard/movers/net-buy/orderbook/ticks/toolbox/watchlist/partners/payment/advertiser 등) — V3 페이지 삭제로 미사용. 빌드 영향 없어 추후 일괄 청소
- 고아 `stores/chatStore.ts`, `components/layout/TopNav.tsx`, `app/global` 검토
- 종목 페이지 잔여: 토론 **댓글**(현재 count만, disabled), 미국주식 시고저·52주·PER(quoteSummary 별도 API), 미국주식 종목명(현재 ticker) → 추후
- mypage 구독/결제 탭 V3 잔재 → 카카오 OAuth 활성화 시 정리

### 다음 STEP
- **STEP 119** — Vercel 배포 + 환경변수 + unjong.com 도메인
- **STEP 124** — 토론 댓글 (discussion_comments 테이블 + UI) 또는 미국주식 시고저·52주·PER
- **STEP 125** — 모바일 반응형 (<1024px 단일 컬럼)
- 추후 — 카카오 OAuth 활성화 (사용자 작업) · 미국주식 상세(quoteSummary) · 고아 컴포넌트 일괄 청소 · 네이버 검색 API(키 발급 후)

### STEP 120 동작 전제
- 토론 좋아요·신고 실제 DB insert 는 **카카오 OAuth 활성화 + 마이그레이션 017 적용** 후 동작. 비로그인은 amber 안내 배너로 차단.

### STEP 122 뉴스 동작 전제
- 시장 헤드라인/종목 뉴스는 **외부 RSS·Yahoo 라이브 fetch** → 배포 환경(Vercel)에서 실데이터 확인 권장. 로컬/샌드박스 네트워크 차단 시 "로딩 실패/뉴스 없음" 안내(graceful).
- 종목별 한국 뉴스는 stocks DB `name_ko` 제목 부분일치 → 네이버 검색 API(키 발급) 통합 시 정확도 ↑ (추후)

### 운종 V5 페이지 구조 (최종)
- `/` 새 홈 · `/kr` 한국 5카드 · `/us` 미국 4카드 · `/stock/[code]` 종목 · `/screener` · `/calendar` · `/auth/login`·`/auth/callback` · `/mypage`

---

## 1. 즉시 확인할 파일

| 우선순위 | 파일 | 용도 |
|---------|------|------|
| 1 | `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작용 (이게 가장 최신) |
| 2 | `docs/PRODUCT_SPEC_V4.md` | V4 비전·구조·레이어 |
| 3 | `docs/BRAND_IDENTITY.md` | 운종 브랜드 정체성 |
| 4 | `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| 5 | `session-context.md` | TODO + 누적 결정사항 |

---

## 2. Layer 1-A 완성 — 세션 #26 (2026-05-29) ✅

| STEP | 작업 | 커밋 |
|------|------|------|
| 100 | 카드 → setSelectedSymbol 15개 연결 | (세션 #26 시작) |
| 101 | MoversCard 실데이터 | (세션 #26) |
| 102 | Volume·NetBuy·Disclosure 실데이터 | (세션 #26) |
| 103 | VI·Theme·Short 실데이터 — 단타창 7/7 ✅ | (세션 #26) |
| 104 | 장타창 7개 실데이터 — 장타창 7/7 ✅ | (세션 #26) |
| 105 | 미국주식창 7개 실데이터 — 미국주식창 7/7 ✅ | `bbe3adf` |

**🎯🎯🎯 21/21 카드 100% 실데이터 완성. Layer 1-A 끝.**

---

## 3. 운종 현재 상태 (2026-05-29)

### ✅ 완성된 것
- 헤더 4단 통합 (UNJONG 운종 + 검색 + 글로벌 티커 + 3창 + ContextNav)
- 3컬럼 본문 (좌측 채팅 + 가운데 메인 + 우측 관심종목)
- 21개 카드 (단타·장타·미장 × 7) — **모두 실데이터**
- 21개 디테일 페이지 (동적 라우트 3개로 자동 처리)
- ContextNav 창별 자동 변경 + 앵커 점프 + 금색 깜박임
- 카드 클릭 → setSelectedSymbol → 우측 패널 연동 (15개 카드)
- 글로벌 티커 TradingView 실시간 위젯 (이미 실데이터)

### 🟡 더미 데이터 (Layer 1-B 이후)
- 좌측 채팅 메시지 (Supabase Realtime 미연결)
- 관심종목 8개
- 종목 상세 (삼성전자 기본값)

---

## 4. 다음 — Layer 2 또는 Layer 1-A2

### ✅ Layer 1-B 완성 (세션 #27)
- ChatPanel 실시간 채팅 완성 (STEP 106, 커밋 `6b350d8`)
- ⚠️ **채팅 DB 활성화**: Supabase Dashboard → SQL Editor → `014_chat_rooms.sql` 실행 필수

### Layer 1-A2 — 카드 보완 (1~2일)
- 테마 종목 매핑 확장 (현재 THEME_MAP 10개 × 3~4종목)
- KRX 공매도·관리종목 자동 수집 (현재 시드 데이터)
- NetBuyBrokerCard 거래원 TOP3 API 연결 (현재 "—" 하드코딩)

### Layer 2 — 광고 허브 (2~3일)
- 좌측 채팅 아래 Layer 2 placeholder → 실 광고 카드
- 메인 카드 하단 광고 영역 신설 (증권사·전문가)
- 참고 사이트 모아보기 (헤더 메뉴)

→ **추천 순서: 1-B (채팅 실시간) → 2 (광고 허브) → 1-A2 (카드 보완)**

---

## (구) Layer 0 완성 히스토리
| STEP | 작업 | 커밋 |
|------|------|------|
| 88~99 | 운종 브랜드 + Layer 0 시각 골격 + 21개 카드 + 디테일 | `8890620` |
- 미국주식창 7개 → Yahoo Finance + SEC EDGAR
- 21개 디테일 페이지 풀 리스트 (30~100건+)

### Layer 1-B — Supabase Realtime 채팅 (3~4일)
- 좌측 채팅창 더미 → 실시간 송수신
- 닉네임 시스템
- 채팅 메시지 영구 저장
- 단타·장타·미장 채팅방 분리

### Layer 1-C — 카드 → 우측 패널 연결 강화 (1~2일)
- 21개 카드 모두 종목 클릭 시 `setSelectedSymbol` 호출
- 우측 종목 상세 자동 업데이트
- 현재 WatchlistPanel 만 연결됨

→ **추천 순서: 1-C → 1-A → 1-B** (가벼운 것부터)

---

## 5. Layer 2 이후 로드맵

| Layer | 내용 | 시점 |
|-------|------|------|
| **Layer 2** | 광고 허브 + 사이트 모아보기 + 좌측 빈공간 채우기 | Layer 1 후 |
| **Layer 3** | 인증 시스템 (Tier 1·2·3) + 광고주 신청 | 그 다음 |
| **Layer 4** | 모더레이션 + 신고 + 닉네임 점수제 | 베타 직전 |
| **Layer 5** | 통합 종목 검색 + AI 봇 (@운종AI) | 차별화 |
| **Layer 6** | unjong.com 도메인 + Vercel 배포 + 광고주 영업 | 출시 |

---

## 6. 절대 잊지 말 것

- 운종 정체성 = **정보 · 대화 · 허브 · 수익 · 신뢰** (5박자)
- 거래 X (증권사 라이선스 X)
- 영어판 X (국가별 별도)
- 5섹션 대시보드 → `/dashboard` (보존)
- 채팅창 크기 고정 (500px), 스크롤로 보기
- 매매 스타일별 화면 자체가 다름 (단타·장타·미장 페이지 분리)
- 한자 `雲從` 표기 X (UNJONG + 운종 한글만)
- 도메인: `onetrillion.app` 메인 + `unjong.com` 보호 (Layer 6)

---

## 7. 도메인 현황

- ✅ 보유: `onetrillion.app` (메인)
- ⏸️ 보호용 보류: `unjong.com` ($11.25), `unjong.app` ($9.99) — Layer 6 에서 구매

---

## 8. 새 세션 시작 시 Cowork 액션

1. **`docs/SESSION_KICKOFF.md` 읽기 먼저** ← 모든 정보 최신
2. 이 파일 (`NEXT_SESSION_START.md`) 확인 — Layer 1 가이드
3. `session-context.md` TODO 확인 (Layer 1 후보 3개)
4. 사용자에게 Layer 1-A / B / C 중 어느 거 시작할지 제안
5. 결정되면 → STEP 100 명령서 작성 → Claude Code 실행

---

## 9. Layer 1 첫 STEP 후보 — Cowork 결정

| 옵션 | 내용 | 예상 시간 | 첫 가시 효과 |
|------|------|---------|---------|
| **A** | 글로벌 티커 강화 + 카드 클릭 연결 (1-C) | 1~2일 | 작지만 즉시 |
| **B** | 단타창 7개 카드 실데이터 (1-A 일부) | 3~5일 | 단타창 100% 실데이터 |
| **C** | Supabase Realtime 채팅 (1-B) | 3~4일 | 운종 본질 활성 |

→ **추천: A 먼저** (가볍게 시작 + 모든 카드 종목 클릭 연결 강화)

---

## 10. 운종 시각 정체성 — 한 줄 요약

> **운종(雲從) · UNJONG** — 한국 주식 동선의 출발점.
> 좌측 채팅, 가운데 카드 7개 + 종목상세, 우측 관심종목.
> 3창 (단타·장타·미장) 분리 + ContextNav 자동 변경.
> 카드 "더보기 →" 로 디테일 페이지 → ← 뒤로가기.
> 모든 더미. Layer 1 에서 실데이터 활성.

세션 #25 종료. 운종 시각 골격 100% 완성. 다음은 진짜 운종이 살아나는 단계 (실데이터 + 채팅).
