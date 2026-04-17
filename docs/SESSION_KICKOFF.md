<!-- 2026-04-17 -->
# Stock Terminal — 새 세션 즉시 시작 파일

> 이 파일을 처음부터 끝까지 읽으면 바로 작업 시작 가능.
> 세션이 끝날 때마다 이 파일도 업데이트할 것.

---

## 1. 나는 누구고 이건 무슨 프로젝트인가

- **나(Cowork)**: 설계·작성 담당. 코드와 명령어를 만들어서 사용자에게 전달.
- **Claude Code**: 사용자가 터미널에서 실행하는 CLI. 실제 파일 수정·빌드·git push 담당.
- **사용자**: 코딩 초보. Claude Code 터미널에 명령어 붙여넣기만 하면 됨.

**프로젝트**: 글로벌 개인투자자용 통합 주식 데이터 터미널  
**목표**: 전업투자자 수준의 투자 환경을 월 2~3만원 구독료로 일반 투자자에게 제공  
**기술 스택**: Next.js 16 + TypeScript + Tailwind CSS + Supabase + Zustand + Recharts + TradingView  
**결제**: 토스페이먼츠 (한국) → 추후 Paddle (글로벌)  
**배포**: Vercel + Supabase Cloud (현재 미배포, dev 서버 localhost:3333)

---

## 2. 현재 프로젝트 상태 (2026-04-17 기준)

| 항목 | 상태 |
|------|------|
| 총 파일 수 | 120개 이상 |
| 페이지 수 | 13개 |
| 컴포넌트 수 | 70개 이상 |
| DB 테이블 수 | 20개 |
| API 라우트 수 | 12개 이상 |
| 빌드 상태 | 정상 (dev 서버 localhost:3333) |
| 배포 상태 | 미배포 |
| 한투 API | 실전계좌 연동 완료 |
| AI 분석 | GPT-4o-mini 연동 완료 (7일 캐시) |
| AuthGuard | DEV_BYPASS = true (admin 게이트는 DEV_BYPASS 무시하고 role 검증) |
| Rate limit | ✅ 복구 완료 (`KIS_RATE_LIMIT_MS=60`, 20건/초) |
| git repo | https://github.com/soulmaten7/stock-terminal.git |
| 최신 커밋 | 18fcc48 (세션 #6 push 완료, 12개 파일 변경) |

---

## 3. 13개 페이지 목록 및 현재 상태

| # | URL | 페이지명 | 상태 |
|---|-----|---------|------|
| 1 | / | 홈 대시보드 | ✅ 실데이터 |
| 2 | /stocks | 종목 검색/리스트 | ⚠️ stocks 테이블 비어있음 |
| 3 | /stocks/[code] | 종목 상세 | ✅ (DEV_BYPASS로 열림) |
| 4 | /stocks/[code]/analysis | 종목 AI 분석 | ✅ (DEV_BYPASS로 열림) |
| 5 | /news | 뉴스·공시 | ✅ RSS 실데이터 20건 |
| 6 | /analysis | 시장분석 | ⚠️ FRED OK, 나머지 더미 |
| 7 | /screener | 스크리너 | ⚠️ 12종목 전체 더미 |
| 8 | /compare | 비교분석 | ⚠️ 삼성/SK 하드코딩 더미 |
| 9 | /link-hub | 링크 허브 | ⚠️ link_hub 테이블 비어있음 |
| 10 | /advertiser | 광고주 센터 | ✅ 정상 |
| 11 | /mypage | 마이페이지 | ✅ (미로그인 → /auth/login 리다이렉트) |
| 12 | /pricing | 구독/결제 | ✅ 요금제 버튼 정상 |
| 13 | /admin | 관리자 | ✅ AuthGuard `minPlan="admin"` 래핑 완료 (세션 #6) |

---

## 4. 다음 세션 작업 목록 (우선순위 순)

### ★ P0 — 지금 당장 (블로커)

#### 4-1. ~~Rate limit 복구~~ ✅ 세션 #6 완료 (2026-04-17)
- `.env.local`: `KIS_RATE_LIMIT_MS=400 → 60`
- `WatchlistLive.tsx`: 폴링 15000ms → 10000ms

#### 4-2. ~~/admin 페이지 AuthGuard 추가~~ ✅ 세션 #6 완료 (2026-04-17)
- `AuthGuard.tsx`: `'admin'` minPlan 추가 (DEV_BYPASS 무시하고 role 검증)
- `app/admin/page.tsx`: `<AuthGuard minPlan="admin">` 로 전체 래핑

#### 4-3. stocks 테이블 DB 시딩 (30분~1시간)
현재 stocks 테이블이 비어있어 종목 검색·리스트·스크리너 전부 빈 화면

**방법 옵션:**
- A) 한투 API로 전체 종목 리스트 가져오기 (추천)
- B) KRX 공공데이터 CSV 다운로드 후 Supabase에 insert
- C) 샘플 데이터 100개만 먼저 넣어서 UI 확인

#### 4-4. link_hub 테이블 DB 시딩 (20분)
현재 link_hub 테이블이 비어있어 링크 허브 페이지 빈 화면

**방법:** 기존 `lib/linkHub.ts`에 하드코딩된 데이터를 Supabase insert SQL로 변환

#### 4-5. 더미 데이터 제거 (8개 컴포넌트, 1~2시간)
아래 컴포넌트들이 하드코딩된 가짜 데이터를 보여주고 있음:

| 컴포넌트 | 위치 | 필요한 것 |
|---------|------|---------|
| ProgramTrading | components/home/ | KRX 크롤링 (한투 API 없음) |
| GlobalFutures | components/home/ | 외부 API (Yahoo Finance 등) |
| WarningStocks | components/home/ | KRX 경고종목 API |
| EconomicCalendar | components/home/ | 경제지표 일정 API |
| IpoSchedule | components/home/ | IPO 일정 API |
| EarningsCalendar | components/home/ | 실적발표 일정 API |
| ScreenerPage | app/screener/ | stocks 테이블 시딩 후 DB 쿼리 |
| ComparePage | app/compare/ | stocks 테이블 시딩 후 실데이터 |

---

### ★ P1 — 이번 주

- [ ] 장중 실시간 검증 (평일 09:00~15:30): 관심종목 변동, 수급 갱신, 호가창/체결
- [ ] TradingView 위젯 동작 확인 (차트, 티커바)
- [ ] 링크 허브 실제 링크 클릭 동작 확인
- [ ] 로그인/회원가입 Supabase Auth 연동 테스트
- [ ] 전체 페이지 UI 세부 점검

---

### ★ P2 — 다음 주

- [ ] 토스페이먼츠 결제 연동 (라이브 URL 생성 후 실제 API 키 발급)
- [ ] KRX 크롤링 (프로그램매매 + 공매도 데이터)
- [ ] SEC EDGAR API 연동 (미국 주식)
- [ ] 광고주 배너 등록 시스템 완성
- [ ] 관리자 페이지 기능 완성

---

### ★ P3 — 2주 후

- [ ] Make 자동화 스케줄링 세팅 (5개 시나리오)
- [ ] 모바일/태블릿 반응형 대응
- [ ] 성능 최적화 (번들 사이즈, 이미지, lazy loading)

---

### ★ P4 — 프로덕션 배포 전 필수 체크

- [ ] `AuthGuard.tsx`: `DEV_BYPASS = true` → `false` (또는 줄 삭제)
- [ ] `.env.local` → Vercel 환경변수로 이관
- [ ] `console.log` 전체 제거
- [ ] Vercel 배포 + Supabase Cloud 연결

---

## 5. 핵심 파일 위치

| 파일 | 경로 | 용도 |
|------|------|------|
| 이 파일 | `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작용 |
| Claude 지침 | `CLAUDE.md` | 역할 분담 + 절대 규칙 |
| 개발 명령서 | `CLAUDE_CODE_INSTRUCTIONS.md` | 전체 기능 명세, DB 스키마 |
| 비즈니스 전략 | `docs/BUSINESS_STRATEGY.md` | 사업 전략, 수익모델 |
| 시스템 설계 | `docs/SYSTEM_DESIGN.md` | 아키텍처, API 현황 |
| 프로젝트 맥락 | `session-context.md` | TODO, 히스토리, 핵심 수치 |
| 변경 이력 | `docs/CHANGELOG.md` | 세션별 변경사항 |
| DB 스키마 | `supabase/migrations/001_initial_schema.sql` | Supabase 테이블 정의 |
| 환경변수 | `.env.local` | API 키 (절대 git push 금지) |
| 한투 API 유틸 | `lib/kis.ts` | rate limiter, 토큰 캐싱 |
| AuthGuard | `components/auth/AuthGuard.tsx` | DEV_BYPASS 위치 |

---

## 6. 알아야 할 기술 이슈

### FUSE mount + Turbopack 충돌 (샌드박스 전용)
- **증상**: `Failed to open database - Operation not permitted`
- **원인**: 샌드박스 워크스페이스가 FUSE mount라 Turbopack DB lock 파일 생성 불가
- **해결**: `.fuse_hidden*` 파일 삭제 후 서버 재시작
  ```bash
  find . -name ".fuse_hidden*" -delete 2>/dev/null; npm run dev
  ```
- **운영 환경엔 영향 없음** (Vercel 배포 후 사라지는 문제)

### git 커밋 (샌드박스 전용)
- 샌드박스에서 `.git/index.lock` 삭제 불가 → Mac 터미널에서 직접 실행 필요
  ```bash
  rm -f .git/index.lock
  git add -A
  git commit -m "커밋 메시지"
  git push
  ```

### 한투 API Rate Limit
- 첫 3영업일(~4/15): 1건/초 → `RATE_LIMIT_MS=1100ms`
- 3영업일 이후: 20건/초 → `RATE_LIMIT_MS=60ms` ✅ 세션 #6 복구 완료
- WatchlistLive 폴링: 10초 ✅ 세션 #6 복구 완료

---

## 7. 한투 API 엔드포인트 현황

| 엔드포인트 | TR ID | 상태 | 용도 |
|-----------|-------|------|------|
| /api/kis/price | FHKST01010100 | ✅ 검증완료 | 종목 현재가 |
| /api/kis/investor | FHKST01010900 | ✅ 검증완료 | 외국인/기관 수급 |
| /api/kis/orderbook | FHKST01010200 | ✅ 검증완료 | 10호가 |
| /api/kis/execution | FHKST01010300 | ✅ 검증완료 | 체결 내역 |
| /api/kis/investor-rank | FHPTJ04400000 | ✅ 검증완료 | 외국인/기관 TOP10 batch |

---

## 8. Supabase DB 테이블 현황

| 테이블 | 상태 | 비고 |
|--------|------|------|
| users | ✅ 스키마 있음 | Auth 연동 필요 |
| stocks | ⚠️ 비어있음 | **시딩 필요 (P0)** |
| link_hub | ⚠️ 비어있음 | **시딩 필요 (P0)** |
| watchlist | ✅ 스키마 있음 | |
| chat_messages | ✅ 스키마 있음 | Realtime 연동 |
| ads | ✅ 스키마 있음 | 광고주 배너 |
| subscriptions | ✅ 스키마 있음 | 토스페이먼츠 연동 예정 |
| ai_analysis_cache | ✅ 스키마 있음 | GPT-4o-mini 7일 캐시 |

---

## 9. 수익 모델 (개발 우선순위 참고용)

| 항목 | 금액 | 상태 |
|------|------|------|
| 구독 (Premium) | 월 2만원 | 페이지 있음, 결제 미연동 |
| 구독 (Pro) | 월 3만원 | 페이지 있음, 결제 미연동 |
| 인증업체 배너 | 20일 5만원 | 컴포넌트 있음, 관리자 미완성 |
| 일반 배너 | 20일 3만원 | 컴포넌트 있음, 관리자 미완성 |

---

## 10. 세션 시작 루틴 (Cowork 체크리스트)

새 세션 시작 시 반드시 이 순서로:

- [ ] 이 파일(`docs/SESSION_KICKOFF.md`) 읽기
- [ ] `session-context.md` 확인 (TODO 가비지 컬렉션)
- [ ] 사용자에게 오늘 작업할 P0 항목 제안
- [ ] 확인 받으면 → 코드/명령어 작성 → Claude Code용 복붙 명령어 제공
- [ ] 작업 완료 후 → 4개 문서 날짜 갱신 + 로그 추가
- [ ] Claude Code용 git push 명령어 제공

---

## 11. 세션 종료 루틴 (반드시 지킬 것)

- [ ] `CLAUDE.md` 헤더 날짜 오늘로
- [ ] `docs/CHANGELOG.md` 헤더 날짜 + 이번 세션 항목 추가
- [ ] `session-context.md` 헤더 날짜 + 세션 히스토리 블록 추가 + TODO 갱신
- [ ] `docs/NEXT_SESSION_START.md` 최신 상태로 전면 갱신
- [ ] `docs/SESSION_KICKOFF.md` (이 파일) 섹션 2~4 업데이트
- [ ] Claude Code용 git push 명령어 제공:
  ```bash
  rm -f .git/index.lock
  git add -A
  git commit -m "docs: session #N 완료 + 문서 갱신"
  git push
  ```
