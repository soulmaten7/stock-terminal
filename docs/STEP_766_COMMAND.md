# STEP 766 — 내비 재편: 모바일 하단 탭바 + PC 헤더 정리 ("오늘" 문법의 나머지 절반)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 코드 HEAD `01f75b1`(STEP 765b) · 트리 클린

**결정(07-19 목업 승인 · 07-21 검수 교훈)**: 페이지(/today)와 내비는 한 문법의 반쪽씩 — 내비 없이는 "페이지 추가"로 체감됨. **랜딩 스위치는 여전히 767**(로고·기본 진입은 현행 `/` 유지 — 이 STEP은 내비만).

---

## 수정 1 — 신규 `components/layout/MobileTabBar.tsx` (모바일 전용·글로벌)

- 하단 고정 탭바 4개(목업 확정): **오늘(/today) · 탐색(/) · 관심(/favorites) · 마이(/mypage)**
  - 아이콘: 기존 lucide-react 재사용(예: Sun·ListFilter(또는 Search류)·Star·User) — 새 아이콘 팩 금지.
  - 활성 판정: `usePathname()` — `/today`=오늘 · `/`(및 `/stock/*` 제외 여부는 아래) = 탐색 · `/favorites`=관심 · `/mypage`=마이. 종목 상세(`/stock/*`)에선 탐색을 활성으로.
  - 마이: 비로그인 시 `/auth/login`으로(기존 헤더 프로필 동작과 동일 로직 재사용).
- 스타일: `fixed bottom-0 inset-x-0 z-50 sm:hidden` · 배경 `#0E1116`(헤더 바 토큰)·상단 보더 · 각 탭 min-h-12 · 라벨 11~12px+아이콘 22px · 활성 = 민트 · **iOS safe-area**(`pb-[env(safe-area-inset-bottom)]`).
- **콘텐츠 가림 방지**: 루트 레이아웃(모바일)에서 본문 `pb-16 sm:pb-0`(푸터가 탭바에 안 묻히게). admin 경로에선 탭바 숨김.
- i18n: `Nav.today/explore/watchlist/my` — ko "오늘·탐색·관심·마이" / en "Today·Explore·Watchlist·My" (패리티).

## 수정 2 — `components/layout/Header.tsx` (PC 헤더 정리 + 모바일 헤더 슬림화)

- **PC 메뉴 순서·라벨**: `오늘 · 탐색 · 소개` — "주식"→**"탐색"**으로 개명(i18n 키), "오늘"을 맨 앞으로. 관심은 기존 우측 별 아이콘이 담당(메뉴 중복 금지). 로고 클릭 동작 불변(`/`·뷰 리셋 — 748 유지).
- **모바일 헤더**: 텍스트 메뉴(주식·소개·오늘) `hidden sm:flex`로 숨김 — 모바일 내비는 하단 탭바가 전담(헤더 = 로고·언어·별·프로필만). 소개 진입은 푸터 링크가 커버.

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 코드 레벨: 탭바가 admin 제외 전 페이지 렌더(레이아웃 배치)·safe-area 클래스·본문 pb 보정·활성 판정 4경로.
3. 라이브(배포 후): 모바일 — /today·/·/favorites·/mypage 이동하며 활성 전환·콘텐츠 안 가림·종목 상세에서도 탭바 표시 / PC — 탭바 없음·헤더 "오늘 탐색 소개"·기존 기능 무변. 사용자 폰 최종.
4. 커밋:
   ```bash
   git add components/layout/ app/ messages/ docs/STEP_766_COMMAND.md
   git commit -m "STEP 766: mobile bottom tab bar (Today/Explore/Watchlist/My) + PC header menu rework"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · 커밋 해시. (767 랜딩 스위치는 사용자가 /today를 며칠 써본 뒤 별도 결정.)
