<!-- 2026-06-03 -->
# 운종(雲從) — 다음 세션 시작 가이드

> **Last updated**: 2026-06-03 (STEP 138 — 홈 신뢰 축 재배치 / V6 정체성 정렬)
> ⭐ **더 디테일한 마스터 인수인계**: `docs/NEXT_SESSION_PLAYBOOK.md`. **마스터 비전**: `docs/PRODUCT_SPEC_V6.md` (정체성 축 = "안 속는 곳").
>
> **현재 상태**: V5 + V6 Phase 1 + Phase 2-①(FSS 인증, fss_advisors 1,738건 적재) + 홈 신뢰 축 재배치(STEP 138) 완료. 빌드 ✓ (HEAD `7e4e341` — STEP 138). 홈 위계 = 검증·평가→평가글→토론→시장정보→뉴스.
> **운종 정체성 (V6)**: "투자상품에 속지 않게 돕는 곳" — 정확한 정보 + 솔직한 토론 + 검증된 신뢰 (중심축 = 신뢰).
>
> ⚠️ **미적용 마이그레이션 (Cowork Supabase MCP 적용 대기)**: `020_dislike_votes.sql`(추천/비추천), `021_fss_advisors.sql`(FSS 인증). 적용 후 `npx tsx scripts/import-fss-advisors.ts` 1회 실행해 fss_advisors ~1,700건 적재.

---

## 0. 진행 상태 한눈 (2026-06-03 기준)

### ✅ 완료된 STEP (88~135)

| 구간 | 영역 | 결과 |
|------|------|------|
| 88~99 | 운종 V4 골격 + 21개 카드 + 디테일 (Layer 0) | V4 완성 (보존 단계) |
| 100~110 | Layer 1-A~E 실데이터 + 채팅·관심종목 + 마커 청소 | V4 → V5 진입 직전 |
| 111 | 검색 활성화 + ContextNav 제거 + V4 헤더 5개 청소 | V5 헤더 |
| 114 | V5 1차 — 컨테이너 1984px + 3창→2창(한국/미국) + 카드 9개 + 종목상세 2탭 + 채팅 1채널 | V5 골격 |
| 115 | 종목 페이지 + 토론 + 종목별 채팅 | 운종 본질 |
| 116 | V3 잔재 1차 청소 (9 페이지 + API 3 + 컴포넌트 2) | 청소 |
| 117 | 새 홈 + dashboard 처분 + V3 12 페이지 + widgets 청소 | 청소 |
| 118 | Layer 3 인증 코드 (카카오 OAuth) — 활성화 사용자 작업 | 인증 |
| 119 | (STEP 119 명령서 — 시크릿 노출 후 마스킹, push X) | 보류 |
| 120 | 종목 페이지 마무리 (좋아요·신고·차트 inline·미장 quote) | 마무리 |
| 122 | 시장 헤드라인 + 종목별 뉴스 (RSS + Yahoo) | 뉴스 |
| 123 | UI 일관성 (LoadingState·EmptyState·ErrorState) | UI |
| 124 | 토론 댓글 (discussion_comments + UI) | 대화 본질 |
| 125 | 미국 주식 상세 (Yahoo quoteSummary) + 검색 ⭐ Watchlist 통합 | 풍부화 |
| 126 | 종목 페이지 핫픽스 (종목명·시총·52주·차트 4 버그) | 핫픽스 |
| 127 | 가독성 리뉴얼 (Pretendard + html 13→16px + text-xs→sm) | 폰트·스케일 |
| 128 | MVP 2.0 1차 — 상품·리딩방 디렉토리 + 평가 시스템 기반 | MVP 2.0 진입 |
| 129~133 | 전면 디자인 리뉴얼 (디자인 시스템 + 토스 카드 + 종목 페이지 탭 + 새 홈 손성기 + MVP2 통일) | 운종 V5 완성 |
| 134 | 모든 문서·로그 3차 교차검수 갱신 | 문서 |
| 135 | 잔여 문서 V5 정렬 패치 (README·BRAND·SPEC_V4 + .env.example + .gitignore) | 문서 마감 |

### ✅ DB 마이그레이션 — 모두 적용 완료

| 마이그레이션 | 내용 | 적용 |
|------------|------|------|
| 005_chat_v2 | 채팅 기본 | ✅ |
| 014_chat_rooms | room/nickname 컬럼 | ✅ |
| **015_chat_unify** | scalper/longterm/us → general 통합 | ✅ |
| **016_users_v5** | V3 결제 컬럼 제거 + tier/bio/oauth_provider + handle_new_user | ✅ |
| **017_discussions** | discussions/likes/reports + chat_messages.symbol | ✅ |
| **018_discussion_comments** | 댓글 테이블 + comment_count 트리거 | ✅ |
| **019_platform_directory** | products/leading_rooms/platform_discussions + 시드 (ETF 10·리딩방 5) | ✅ |

→ Cowork (Supabase MCP) 가 모두 적용 완료. **로컬 동작 정상**.

---

## 1. 사용자 직접 작업 (🔴 미완)

### 🔴 카카오 OAuth 활성화 — STEP 118 잔여
1. **카카오 Developers 콘솔** (https://developers.kakao.com):
   - 앱 "운종" 등록 → Web 플랫폼 + 카카오 로그인 ON
   - Redirect URI: `https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback`
   - 동의항목: 닉네임·이메일·프로필 사진
   - REST API 키 복사
2. **Supabase Dashboard** → Auth → Providers → **Kakao ON** + REST API 키 입력

→ 전까지 카카오 로그인 시 OAuth 실패 (단 빌드·페이지·비로그인 사용은 정상).

### 🔴 SUPABASE_ACCESS_TOKEN 폐기 권장 — STEP 119 보안 이슈
- `docs/STEP_119_COMMAND.md` 에 한 차례 노출됐던 PAT (`sbp_aedc6b23...`)
- GitHub Push Protection 으로 외부 노출은 차단됐지만, 로컬 디스크에 평문 잔재
- https://supabase.com/dashboard/account/tokens → Revoke + 새 PAT 발급 → `.env.local` 갱신
- 명령서 시크릿은 이미 마스킹 완료

### 🟢 Vercel 배포 + unjong.com 도메인 — 사용자 결정 후
- 사용자 보류 상태 ("도메인 구매 전이니까 보류")
- 결정 시 STEP 119 (재작성·시크릿 마스킹 버전) 실행

---

## 2. 운종 V5 페이지 구조 (최종)

| 라우트 | 역할 | 상태 |
|--------|------|------|
| `/` | 새 홈 (시장 핫이슈 + HOT 토론 + HOT 평가 + 시장 헤드라인 + 관심종목) | ✅ |
| `/kr` | 한국주식 카드 5개 (Movers·Volume·NetBuy·단타공시·장타공시) | ✅ |
| `/us` | 미국주식 카드 4개 (Indices·M7·UsMovers·시계+시장상태) | ✅ |
| `/stock/[code]` | 종목 페이지 (좌 sticky 정보+차트 / 중 탭(차트·토론·뉴스·인사이트) + 댓글 / 우 채팅 + 우측 fixed nav 48px) | ✅ |
| `/products` | 상품 디렉토리 (ETF·펀드·랩·리츠·채권 카테고리 필터) | ✅ |
| `/product/[id]` | 상품 평가 (좌 정보 / 중 평가 토론 PlatformDiscussionBoard) | ✅ |
| `/rooms` | 리딩방 디렉토리 (텔레그램·카카오·디스코드·유튜브 + 인증 마크) | ✅ |
| `/room/[id]` | 리딩방 평가 | ✅ |
| `/calendar` | 경제 캘린더 → Investing.com 외부 링크 안내 (허브 정체성) | ✅ |
| `/auth/login` | 카카오 로그인 UI | 🔴 활성화 사용자 작업 |
| `/auth/callback` | OAuth 콜백 | 🔴 |
| `/mypage` | 마이페이지 (V3 잔재 일부) | 🟡 |
| ~~/screener~~ | (STEP 133 제거 — 정체성 충돌) | — |

---

## 3. 운종 정체성 (최종 합의)

> **운종 = 네이버 레이아웃 + 토스 카드 디자인 + Trustpilot 평가 = 한국 금융 동선의 출발점**

### 4박자 (정보·대화·허브·신뢰)
- **정보**: 본질만 (KIS·DART·Yahoo·RSS 9개 정확 카드 + 종목별 정보 핵심) — 디테일은 외부 (허브)
- **대화**: 정제된 채팅·토론·댓글 (모더레이션 + Tier)
- **허브**: /calendar 외부 링크 · 종목별 뉴스 외부 새 탭 · 운영자가 평가 X (사용자 토론)
- **신뢰**: Tier 1·2·3 시스템 + 신고 5건 자동 hidden + 카카오 OAuth 인증

### 운종이 안 하는 것 (의도된 제외)
- 거래 매매 (증권사 라이센스 X)
- 정밀 스크리너 (네이버·키움·FnGuide 영역)
- 영어판 (국가별 별도)
- 호가창·체결·거래원 동향 (전문가용)
- 컨센서스·목표주가·종목분석·리포트 (FnGuide 영역)

### 운종이 진짜 차별화 — MVP 2.0
- 상품·리딩방 **평가 디렉토리** (Trustpilot 금융 버전)
- Tier 인증 광고 (Sponsored ↔ 평가 명확 분리 — 추후)
- 정제된 종목 채팅·토론 (네이버 종토방 욕설·찌라시 대체)

---

## 4. 다음 STEP 후보 (우선순위 순)

| 순위 | 후보 | 의미 |
|------|------|------|
| 1 | **STEP 134 광고 분리 UI** (Sponsored 영역 + 평가 영역 명확 분리) | MVP 2.0 진화 |
| 2 | **Tier 인증 시스템** (운영자 인증 신청·검토·Tier 1·2·3 부여) | 운종 신뢰 차별화 핵심 |
| 3 | **고아 컴포넌트 일괄 청소** (calendar/screener 잔재·components/watchlist·stores/chatStore 등) | 코드 정리 |
| 4 | **모바일 반응형** (<1024px 단일 컬럼) | PC 완성 후 결정 |
| 5 | **카카오 OAuth 활성화** (사용자 직접) | 도메인 후 권장 |
| 6 | **Vercel 배포 + unjong.com** (사용자 결정) | 출시 |
| 7 | **outcome 통계 UI** (평가 positive/neutral/negative 시각화) | 평가 풍부화 |
| 8 | **네이버 검색 API 통합** (사용자 키 발급) | 종목별 뉴스 정확도 ↑ |

---

## 5. 즉시 확인할 파일

| 우선순위 | 파일 | 용도 |
|---------|------|------|
| 1 | `docs/NEXT_SESSION_START.md` (이 파일) | 가장 최신 |
| 2 | `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작 가이드 |
| 3 | `docs/PRODUCT_SPEC_V4.md` | 운종 V4 비전 (V5 는 본 파일·CHANGELOG 참조) |
| 4 | `docs/BRAND_IDENTITY.md` | 운종 브랜드 정체성 |
| 5 | `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| 6 | `session-context.md` | TODO + 누적 결정사항 |
| 7 | `docs/CHANGELOG.md` | 세션별 변경 이력 |

---

## 6. 절대 잊지 말 것 (운종 결정사항)

- **운종 정체성** = 정보 + 대화 + 허브 + 신뢰 (5박자 → 4박자 통일)
- **거래 X** (증권사 라이센스 X)
- **영어판 X** (국가별 별도)
- **호가창·체결 X** (전문가용, 운종 페르소나 X)
- **스크리너 X** (네이버·키움·FnGuide 영역 — STEP 133 제거)
- **경제 캘린더** = 외부 (Investing.com) 링크 (허브 정체성)
- **종목 정보 디테일** = 본질만 (네이버 따라가지 X)
- **MVP 2.0** = 상품·리딩방 평가 (운종 진짜 사업)
- **한자 雲從 표기 X** (UNJONG + 운종 한글만)
- **5섹션 대시보드 → 제거** (STEP 117 dashboard 통째 삭제)
- **도메인**: 사용자 결정 후 (unjong.com 보류 중)

---

## 7. 운종 V5 디자인 시스템

- **폰트**: Pretendard Variable (CDN, 한국어 친화) + Playfair_Display 보조 (UNJONG 로고)
- **루트 폰트**: 16px (Tailwind 표준)
- **색상**:
  - 운종 brand: `#0F1E3D` primary · `#D4AF37` accent (기존 유지)
  - 토스 보조: `#3182F6` blue · `#F04452` red (하락) · `#1AC267` green (상승) · 회색 그라데이션
- **카드**: rounded-2xl + shadow-soft + p-5 + hover shadow 전환
- **컨테이너 max-w**: 1984px (토스 동일)
- **spacing**: gap-5 카드 그리드 · py-3·px-3 종목 행

---

## 8. 새 세션 시작 시 Cowork 액션

1. **이 파일 (NEXT_SESSION_START.md) 읽기** ← 가장 최신
2. `session-context.md` TODO 확인 (가비지 컬렉션)
3. `docs/CHANGELOG.md` 최근 변경 훑기
4. 사용자에게 오늘 할 P0 작업 제안 (Tier 인증·광고 분리·고아 청소·모바일 등)
5. 결정되면 → STEP 명령서 작성 → Claude Code 실행
