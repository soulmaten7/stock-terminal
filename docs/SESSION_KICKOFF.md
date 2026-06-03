<!-- 2026-06-03 -->
# 운종(雲從) — 새 세션 즉시 시작 파일

> ⭐ **더 디테일한 마스터 인수인계**: `docs/NEXT_SESSION_PLAYBOOK.md` (이 파일은 그 단축본)
>
> 이 파일을 처음부터 끝까지 읽으면 바로 작업 시작 가능.
> **Last refreshed**: 2026-06-03 (STEP 135 — 잔여 문서 V5 정렬 패치 + PLAYBOOK 생성)
> **실행 환경**: Mac 로컬 `~/stock-terminal` 에서 직접 실행
> **현재 커밋**: HEAD `3ba3773` (STEP 135 docs) — 빌드 ✓ (마지막 코드 변경은 `0f63ac5` STEP 133)
> 세션이 끝날 때마다 이 파일과 NEXT_SESSION_START.md 반드시 업데이트할 것.

---

## 1. 운종 한 줄 정체성

> **운종 = 한국 금융 동선의 출발점 + 정제된 대화 + 신뢰 평가 허브**
>
> = 네이버 페이 증권 레이아웃 + 토스 증권 카드 디자인 + Trustpilot 평가 모델

거래 X · 영어판 X · 깊은 분석 X (외부 정확한 곳으로 동선 안내 = 허브)

## 2. 운종 V5 페이지 13개

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

## 3. 현재 진행 상태 (STEP 88~134)

### ✅ MVP 1.0 (운종 V5 PC 기능 완성)
- 정보: 가격·차트·뉴스·공시·시고저·52주·PER (9개 정확 카드 + 종목별)
- 대화: 종목별 토론·댓글·채팅 (Realtime + Tier 표시 + 신고 5건 자동 hidden)
- 검색: stocks DB 자동완성 + ⭐ Watchlist 토글
- 관심종목: localStorage (멀티 기기는 인증 후 영구화)

### ✅ MVP 2.0 1차 (운종 진짜 차별화 진입)
- 상품 디렉토리 (ETF 10개 시드)
- 리딩방 디렉토리 (5개 placeholder)
- platform_discussions 다형 평가 토론

### ✅ 전면 디자인 리뉴얼 (STEP 129~133)
- 디자인 시스템 (Pretendard + 토스 색상 + rounded-2xl + shadow-soft)
- 9개 카드 토스 콘텐츠 스타일
- 종목 페이지 네이버 탭 시스템 (차트·토론·뉴스·인사이트) + 우측 fixed nav
- 새 홈 손성기 모듈 순서 + HOT 평가 진입 모듈
- /screener 제거 + /calendar 외부 링크

### 🔴 사용자 직접 작업 (미완)
- **카카오 OAuth 활성화** (카카오 콘솔 + Supabase Dashboard)
- **Vercel 배포 + unjong.com 도메인** (도메인 결정 후)
- **SUPABASE_ACCESS_TOKEN 폐기** (보안 권장)

## 4. 다음 STEP 후보 (우선순위)

1. **STEP 134** ✅ 완료 (모든 문서 갱신)
2. **STEP 135 — 광고 분리 UI** (Sponsored ↔ 평가 영역 시각 분리)
3. **Tier 인증 시스템** (운영자 신청·검토·Tier 1·2·3 부여) — 운종 신뢰 핵심
4. **고아 컴포넌트 일괄 청소** (calendar/screener 잔재·watchlist·stocks)
5. **모바일 반응형** (< 1024px 단일 컬럼)
6. **카카오 OAuth 활성화** (사용자)
7. **Vercel 배포 + unjong.com** (사용자)

## 5. DB 마이그레이션 — 모두 적용 완료

005 → 014 → 015 → 016 → 017 → 018 → 019 (Cowork Supabase MCP)
- 005 채팅 기본
- 014 room/nickname
- 015 채팅 통합
- 016 users V5 (tier·bio·oauth + handle_new_user)
- 017 discussions + chat_messages.symbol
- 018 discussion_comments
- 019 products + leading_rooms + platform_discussions + 시드

## 6. 핵심 참조 파일

| 파일 | 용도 |
|------|------|
| `docs/NEXT_SESSION_START.md` | **가장 최신 상태** (이 파일과 같이 읽기) |
| `docs/CHANGELOG.md` | 세션별 변경 이력 |
| `session-context.md` | TODO + 누적 결정사항 |
| `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| `docs/PRODUCT_SPEC_V4.md` | V4 비전 (V5 는 NEXT_SESSION_START 참조) |
| `docs/BRAND_IDENTITY.md` | 운종 브랜드 정체성 + V5 디자인 시스템 |

## 7. 세션 시작 시 Cowork 액션

1. **이 파일 + NEXT_SESSION_START.md 읽기**
2. `session-context.md` TODO 가비지 컬렉션
3. 사용자에게 다음 STEP 제안 → 결정 후 명령서 작성
4. 명령서 작성 시 보안: `.env.local` 값 절대 평문 X (마스킹·`.env.example` 형식)
