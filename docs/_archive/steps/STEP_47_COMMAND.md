# STEP 47 — URL 라우팅 인프라 + 드로워 패턴 + 시범 이관

**실행 명령어 (Sonnet)**:
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```
그 후 Claude Code 터미널에서: `@docs/STEP_47_COMMAND.md 파일 내용대로 실행해줘`

**목표**:
- Next.js Parallel Routes (`@panel` 슬롯) + Intercepting Routes로 URL 라우팅 인프라 구축
- `DetailDrawer` 공통 컴포넌트 (데스크탑 우측 슬라이드, ESC/백드롭 클릭 닫기)
- `WidgetShell` 공통 컴포넌트 (위젯 헤더 + `[더보기 →]` 버튼 통합)
- 시범 이관: `ScreenerMiniWidget` 검색 제출 → `/screener`가 **드로워로** 슬라이드 인
- `/screener` 직접 URL 접속 = 기존처럼 **풀페이지** 유지 (공유·SEO·북마크용)
- 구버전 중복 페이지 2개 (`link-hub`, `filings`) 제거

**전제 상태**:
- 직전 커밋: `fb35ae2` (STEP 46 완료, 스크리너 8프리셋 + 3컬럼 라이브)
- Next.js `16.2.2`, React `19.2.4`, Tailwind v4
- 사이드바 `VerticalNav.tsx` = 아이콘 전용 (14개, `w-14`)
- `app/screener/page.tsx` = `<Suspense>`로 감싼 `<ScreenerClient />` (그대로 재사용)

**스코프 아웃 (차후 STEP으로 미룸)**:
- 사이드바 5그룹 재구성 (STEP 48)
- 나머지 12개 위젯 `WidgetShell` 적용 + Intercepting Routes 생성 (STEP 49~)
- 모바일 대응 (풀스크린 전환, 하단 탭 — Phase 3)

---

## Part A — 구버전 페이지 제거

### A1. `link-hub` 폴더 삭제 (toolbox가 완전 대체)
```bash
rm -rf app/link-hub
```

### A2. `filings` 폴더 삭제 (disclosures가 진짜 구현체)
```bash
rm -rf app/filings
```

### A3. VerticalNav에서 `/filings` 참조를 `/disclosures`로 교체

**파일**: `components/layout/VerticalNav.tsx`

**Line 32** 수정:

```tsx
// BEFORE
{ icon: FileText,   label: 'DART 공시',     href: '/filings' },

// AFTER
{ icon: FileText,   label: 'DART 공시',     href: '/disclosures' },
```

### A4. 잔여 참조 검색 및 제거

```bash
grep -rn "link-hub\|/filings\|app/link-hub\|app/filings" --include="*.tsx" --include="*.ts" app/ components/ lib/
```

발견된 모든 참조 제거. 특히:
- `components/` 하위에 `LinkHub` 관련 컴포넌트 있으면 삭제
- `lib/constants/linkHub.ts` 가 `toolbox`에서 사용 중이면 유지, 아니면 삭제
- 네비·메뉴·라우팅 상수에 `/filings` 있으면 `/disclosures`로 교체

---

## Part B — DetailDrawer 공통 컴포넌트 생성

**파일 생성**: `components/common/DetailDrawer.tsx`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface DetailDrawerProps {
  title: string;
  children: ReactNode;
}

export default function DetailDrawer({ title, children }: DetailDrawerProps) {
  const router = useRouter();

  // ESC 키로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', onKey);

    // body 스크롤 잠금
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [router]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => router.back()}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-full max-w-[920px] bg-white z-50 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] shrink-0">
          <h2 id="drawer-title" className="text-lg font-bold text-black">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="닫기"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-[#666666]" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </aside>
    </>
  );
}
```

**동작**:
- 렌더되면 body 스크롤 잠금 + ESC 리스너 등록
- 언마운트 시 정리
- ESC·닫기버튼·백드롭 클릭 → `router.back()` (드로워 URL 닫힘)

---

## Part C — WidgetShell 공통 컴포넌트 생성

**파일 생성**: `components/common/WidgetShell.tsx`

```tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface WidgetShellProps {
  title: string;
  icon?: ReactNode;
  detailHref?: string;  // 있으면 [더보기 →] 버튼 노출
  className?: string;
  children: ReactNode;
}

export default function WidgetShell({
  title,
  icon,
  detailHref,
  className = '',
  children,
}: WidgetShellProps) {
  return (
    <section
      className={`flex flex-col h-full bg-white border border-[#E5E7EB] overflow-hidden ${className}`}
    >
      <header className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] shrink-0 bg-[#FAFAFA]">
        <h3 className="flex items-center gap-1.5 text-xs font-bold text-black">
          {icon}
          {title}
        </h3>
        {detailHref && (
          <Link
            href={detailHref}
            className="flex items-center gap-0.5 text-[11px] text-[#999999] hover:text-[#0ABAB5] transition-colors"
          >
            더보기
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </section>
  );
}
```

**용도**: 다음 STEP부터 모든 위젯 외곽을 이걸로 교체. `detailHref` 주면 자동으로 [더보기] 버튼 생성. STEP 47에서는 생성만 하고 적용은 STEP 48부터.

---

## Part D — Parallel Route Slot 추가 (app/layout.tsx)

**파일**: `app/layout.tsx`

`panel` 슬롯을 `RootLayout` 시그니처에 추가하고 렌더 트리에 포함.

**BEFORE (line 28~44 기준)**:
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <div className="w-full max-w-screen-2xl mx-auto flex-1 flex flex-col">
            <Header />
            <TickerBar />
            <LayoutShell footer={<Footer />}>
              {children}
            </LayoutShell>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**AFTER**:
```tsx
export default function RootLayout({
  children,
  panel,
}: {
  children: React.ReactNode;
  panel: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <div className="w-full max-w-screen-2xl mx-auto flex-1 flex flex-col">
            <Header />
            <TickerBar />
            <LayoutShell footer={<Footer />}>
              {children}
            </LayoutShell>
          </div>
          {panel}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**핵심**: `{panel}` 을 `AuthProvider` 내부, 최상위 div 바깥에 배치 → 드로워가 `max-w-screen-2xl` 제약 없이 전체 뷰포트 기준으로 포지션됨.

---

## Part E — Panel 기본 슬롯 (null)

**폴더 및 파일 생성**:

```bash
mkdir -p "app/@panel"
```

**파일 생성**: `app/@panel/default.tsx`

```tsx
// Parallel Route 기본 컨텐츠: 드로워 없을 때 아무것도 렌더 안 함
export default function Default() {
  return null;
}
```

---

## Part F — Screener Intercepting Route

### F1. 인터셉팅 폴더 생성

```bash
mkdir -p "app/@panel/(..)screener"
```

**주의**: `(..)` 는 Next.js 인터셉팅 라우트 마커. 쉘에서 괄호 이스케이프 필요할 수 있으니 따옴표로 감싸서 생성.

### F2. 파일 생성: `app/@panel/(..)screener/page.tsx`

```tsx
import { Suspense } from 'react';
import DetailDrawer from '@/components/common/DetailDrawer';
import ScreenerClient from '@/components/screener/ScreenerClient';

export default function ScreenerPanel() {
  return (
    <DetailDrawer title="종목 발굴 스크리너">
      <Suspense>
        <ScreenerClient />
      </Suspense>
    </DetailDrawer>
  );
}
```

**동작**:
- 대시보드(`/`)에서 `/screener`로 내부 네비게이션 발생 → 이 인터셉트 파일이 드로워 슬롯에 렌더됨 → URL은 `/screener`이지만 홈이 뒷배경으로 유지됨
- 직접 `/screener` URL 입력 또는 새로고침 → 인터셉트 발동 안 함 → `app/screener/page.tsx` 가 풀페이지로 렌더됨
- 브라우저 뒤로가기 → 드로워 닫히며 `/`로 복귀

---

## Part G — 빌드 + 수동 검증

### G1. 타입체크 & 빌드

```bash
npm run build
```

**에러 없이 통과해야 함.** 에러 발생 시:
- `panel` 슬롯 타입 에러 → Part D의 시그니처 재확인
- 인터셉팅 폴더 이름 오타 → `(..)` 정확히 두 점
- import 경로 오타 → `@/components/common/DetailDrawer` 등 확인

### G2. 수동 기능 검증 (가능하면)

`npm run dev` 로 로컬 서버 띄운 후 http://localhost:3333 접속.

**검증 시나리오**:
1. 홈 대시보드 정상 렌더 ✓
2. ScreenerMini 위젯에서 키워드 입력 → `발굴` 버튼 클릭
3. URL이 `/screener?market=KOSPI&q=...` 로 바뀜
4. **우측에서 드로워 슬라이드 인** + 백드롭 딤드
5. 드로워 내부에 스크리너 풀 UI (8프리셋 + 필터 + 테이블) 렌더
6. ESC 키 또는 우상단 X 또는 백드롭 클릭 → 드로워 닫힘 + URL `/` 복귀
7. 브라우저 새 탭에서 `http://localhost:3333/screener` 직접 접속 → **풀페이지** (드로워 아님) 렌더
8. 브라우저 뒤로가기 테스트 → 정상 동작

**검증 실패 시**: 문제 기록하고 수정. 모두 통과해야 Part H 진행.

---

## Part H — 4개 문서 업데이트

### H1. `docs/CHANGELOG.md`

**맨 위에 새 섹션 추가** (기존 섹션 위):

```markdown
# CHANGELOG

> 최종 업데이트: 2026-04-22

## 2026-04-22 — STEP 47: URL 라우팅 인프라 + 드로워 패턴 도입

### Added
- **Parallel Routes 인프라**: `app/@panel/` 슬롯 + `app/layout.tsx`에 `panel` 파라미터 추가
- **Intercepting Route**: `app/@panel/(..)screener/page.tsx` — 대시보드에서 `/screener` 네비 시 드로워로 인터셉트
- **공통 컴포넌트 `DetailDrawer`** (`components/common/DetailDrawer.tsx`): 우측 슬라이드 드로워, ESC/백드롭 닫기, body 스크롤 잠금
- **공통 컴포넌트 `WidgetShell`** (`components/common/WidgetShell.tsx`): 위젯 외곽 + `[더보기 →]` 버튼 통합 (STEP 48부터 위젯 전체에 적용 예정)

### Changed
- `ScreenerMiniWidget` 검색 제출 → `/screener`가 드로워로 열림 (기존: 풀페이지 이동)
- `/screener` 직접 URL 접속은 풀페이지 유지 (공유·SEO·북마크 대응)
- `VerticalNav` 의 DART 공시 링크 `/filings` → `/disclosures` 교체

### Removed
- `app/link-hub/` — `toolbox/` 가 완전 대체 (동일 `link_hub` 테이블, 상위 기능)
- `app/filings/` — 스텁 페이지 (20건 하드코딩 가짜 데이터). `disclosures/` 가 실제 DART API 연동 구현체

### 아키텍처 결정
- **URL-routed drawer 패턴 채택**: `/screener` URL이 네비게이션 컨텍스트에 따라 **드로워 또는 풀페이지**로 렌더됨
- **공유·SEO는 풀페이지로, 인앱 브라우징은 드로워로** — 하나의 URL이 두 표현을 커버
- **모바일 대응**: Phase 3 (차후)에서 동일 URL이 풀스크린 페이지로 렌더되도록 반응형 처리
- **Product Scope 확정**: "정보 조회·탐색 전용 터미널" — 타 플랫폼(네이버 증권, 토스증권, 증권플러스, Koyfin, MTS, DART, 한경컨센서스 등)의 "보고 검색하는 기능"만 복제, 매수매도 주문 실행은 의도적 제외
```

### H2. `session-context.md`

- **1번째 줄 헤더 날짜**: `최종 업데이트: 2026-04-22`
- "최근 완료" 섹션 맨 위에 블록 추가:

```markdown
### 2026-04-22 — STEP 47 완료

- URL 라우팅 인프라: Parallel Routes (`@panel`) + Intercepting Routes
- DetailDrawer, WidgetShell 공통 컴포넌트
- ScreenerMini → `/screener` 드로워 시범 이관
- link-hub, filings 구버전 제거
- VerticalNav `/filings` → `/disclosures` 교체
- 커밋: (새 해시)
```

- TODO 섹션 가비지 컬렉션: 이미 완료된 항목 제거

### H3. `docs/NEXT_SESSION_START.md`

- **1번째 줄 헤더 날짜**: `최종 업데이트: 2026-04-22`
- 다음 세션 지시사항 갱신:

```markdown
# 다음 세션 시작 가이드

> 최종 업데이트: 2026-04-22

## 현재 상태
- STEP 47 완료: URL 라우팅 + 드로워 인프라 가동
- ScreenerMini 1개 위젯만 드로워 시범 이관된 상태
- 나머지 13개 위젯은 아직 WidgetShell 미적용

## 다음 할 일 (P0)

### 옵션 A — STEP 48: 위젯·페이지 레퍼런스 플랫폼 매핑 테이블 작성
- 20여 개 항목 (위젯 14개 + 사이드바 페이지 13개) 각각에 "어느 타 플랫폼을 레퍼런스로 삼을지" 명시
- 예: 차트 = TradingView, 종목상세 = 네이버 증권, 스크리너 = Koyfin, 호가창 = 키움 영웅문
- 이 테이블이 Phase 2 (위젯 이관·추가) 의 설계 기준이 됨

### 옵션 B — STEP 48: 사이드바 5그룹 재구성
- VerticalNav를 아이콘 전용에서 카테고리 그룹 사이드바로 재설계
- 5그룹: 대시보드 / 탐색·분석 / 시장 정보 / 외부 / 개인
- 14항목 라벨 노출

### 옵션 C — STEP 48: 나머지 위젯 WidgetShell 적용 + Intercepting Routes 일괄 생성
- 13개 위젯 각각 WidgetShell로 래핑
- 각 위젯의 디테일 페이지에 대응하는 Intercepting Route 생성
- 가장 많은 파일 수정이 필요하지만 시각적 변화 큼

**권장 순서**: A → B → C (레퍼런스 기준 먼저 확정 → 사이드바 구조 → 위젯 대량 이관)
```

### H4. `CLAUDE.md` 헤더 날짜 갱신

**1번째 줄** 수정:
```markdown
# Stock Terminal — Claude Code 지침서 (2026-04-22)
```

(기존 날짜가 다른 형식이면 그 형식 유지하되 2026-04-22로 업데이트)

---

## Part I — Commit + Push

### I1. 변경사항 확인
```bash
git status
git diff --stat
```

예상 변경:
- 삭제: `app/link-hub/` (폴더 전체)
- 삭제: `app/filings/` (폴더 전체)
- 신규: `app/@panel/default.tsx`
- 신규: `app/@panel/(..)screener/page.tsx`
- 신규: `components/common/DetailDrawer.tsx`
- 신규: `components/common/WidgetShell.tsx`
- 수정: `app/layout.tsx` (panel 슬롯 추가)
- 수정: `components/layout/VerticalNav.tsx` (line 32)
- 수정: `docs/CHANGELOG.md`
- 수정: `session-context.md`
- 수정: `docs/NEXT_SESSION_START.md`
- 수정: `CLAUDE.md`

### I2. 커밋

```bash
git add -A

git commit -m "$(cat <<'EOF'
feat: STEP 47 — URL 라우팅 인프라 + 드로워 패턴 + 시범 이관

Parallel Routes + Intercepting Routes 기반 URL-routed drawer 인프라 구축.
ScreenerMini 검색 제출이 /screener 드로워로 열림 (공유·SEO는 풀페이지 유지).

- app/@panel slot + (..)screener 인터셉트
- DetailDrawer, WidgetShell 공통 컴포넌트 신규
- link-hub, filings 구버전 페이지 제거
- VerticalNav /filings → /disclosures

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### I3. Push

```bash
git push
```

### I4. 최종 상태 확인

```bash
git log --oneline -3
git status
```

---

## 완료 기준 체크리스트

- [ ] `app/link-hub/` 폴더 제거됨
- [ ] `app/filings/` 폴더 제거됨
- [ ] `VerticalNav.tsx` 의 `/filings` 참조 `/disclosures` 로 교체됨
- [ ] 잔여 `link-hub`, `/filings` 참조 전부 제거됨 (grep 통과)
- [ ] `app/layout.tsx` 에 `panel` 슬롯 시그니처 추가됨
- [ ] `app/@panel/default.tsx` 존재 (null 반환)
- [ ] `app/@panel/(..)screener/page.tsx` 존재 (DetailDrawer + ScreenerClient)
- [ ] `components/common/DetailDrawer.tsx` 존재
- [ ] `components/common/WidgetShell.tsx` 존재
- [ ] `npm run build` 에러 0으로 통과
- [ ] (선택) 로컬 `npm run dev` 수동 검증: ScreenerMini → 드로워, 직접 URL → 풀페이지
- [ ] `docs/CHANGELOG.md` 헤더 날짜 2026-04-22 + STEP 47 섹션 추가
- [ ] `session-context.md` 헤더 날짜 2026-04-22 + 완료 블록 추가
- [ ] `docs/NEXT_SESSION_START.md` 헤더 날짜 2026-04-22 + 다음 할 일 갱신
- [ ] `CLAUDE.md` 헤더 날짜 2026-04-22
- [ ] `git push` 성공

---

## 문제 발생 시 대응

### 인터셉팅 라우트가 안 먹힘 (드로워 안 열리고 풀페이지로 이동함)
- `app/@panel/(..)screener` 폴더명 정확히 확인 — `(..)` 두 점, 괄호 정확
- `app/layout.tsx` 의 `panel` prop과 `{panel}` 렌더 위치 확인
- Next.js 16.2.2 에서 Parallel Routes는 `default.tsx` 필수 — `app/@panel/default.tsx` 존재 확인
- `router.push` vs `<Link>` 중 어느 방식인지 확인 — 둘 다 인터셉트 가능하지만 전체 페이지 새로고침이면 인터셉트 안 됨

### 빌드 에러 "Missing default for parallel route"
- `app/@panel/default.tsx` 없거나 export 잘못됨 → 위 Part E 코드로 교체

### 드로워가 `max-w-screen-2xl` 안에 갇혀서 화면 우측 끝까지 못 감
- Part D에서 `{panel}` 을 `<div className="w-full max-w-screen-2xl...">` **바깥**에 배치했는지 확인

### ScreenerClient 가 드로워 내부에서 렌더 깨짐
- ScreenerClient 가 최상위 컨테이너에 `h-screen` 또는 풀 뷰포트 전제 스타일 있으면 드로워 안에선 깨짐
- 우선 동작만 확인 — 스타일 미세 조정은 STEP 48로 넘김

---

**예상 소요 시간**: 1시간~1시간 30분 (대부분 Part G 수동 검증 + Part H 문서 작성)
