# STEP 21 — Footer/R4 정렬 수정 + Sidebar 페이지 전체 확장

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 20b 완료 (홈 대시보드 User Flow 재배치)

---

## 📐 문제 진단

사용자가 발견한 3가지 레이아웃 이슈:

### 이슈 1 — Footer와 R4 폭이 정확히 사이드바(56px)만큼 안 맞음

```
현재 LayoutShell 구조 (잘못됨):
┌──── 1536px 박스 ────────────────────┐
│ ┌───┬──────────────────────────┐    │
│ │Sb │  Main (R1-R3 + R4)       │    │  ← Main = 1480px
│ │56 │                          │    │
│ └───┴──────────────────────────┘    │
│ Footer                               │  ← Footer = 1536px ❌ (56px 더 넓음)
└──────────────────────────────────────┘
```

Footer가 sidebar + main 박스 **밖**에 있어서 박스 전체 폭(1536)을 씀.
→ R4는 main 안이므로 1480px → **정확히 56px 차이**.

### 이슈 2 — 사이드바가 페이지 전체 높이만큼 이어지지 않음 (스크롤 시 "홈이 안 보임")

`VerticalNav`의 `sticky top-0 h-screen`이 flex 컨테이너의 기본 `align-items: stretch`와 충돌해서 sticky가 불안정.

### 이슈 3 — Col 3 뉴스/DART 레이아웃 미세 어긋남

이슈 1 해결하면 main 폭 유지되므로 Col 비율도 그대로. 현상이 남으면 Step 22에서 비율 조정.

---

## 🔧 파일별 변경 (2개 파일)

### 1. `components/layout/LayoutShell.tsx` — Footer를 main과 같은 컨테이너로 이동 ⭐ 핵심

**Edit (전체 내부 교체):**

```
old_string:
export default function LayoutShell({ children, footer }: LayoutShellProps) {
  return (
    <>
      <div className="flex flex-1">
        <VerticalNav />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      {footer}
    </>
  );
}

new_string:
export default function LayoutShell({ children, footer }: LayoutShellProps) {
  return (
    <div className="flex flex-1">
      <VerticalNav />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1">
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}
```

**의도:**
- 최상위 `<>` fragment → `<div flex flex-1>` (row)
- 내부: Sidebar(왼쪽 56) + **오른쪽 컨테이너 하나**로 main과 footer를 세로 스택
- 오른쪽 컨테이너: `flex-1 min-w-0 flex flex-col` — sidebar 오른쪽 공간을 모두 차지하고 내부는 column
- `main`은 `flex-1` (대시보드가 남는 세로 공간 채움)
- `footer`는 main 아래 (같은 1480px 폭으로 자동 정렬)

**결과 구조:**

```
┌──── 1536px 박스 ────────────────────┐
│ ┌───┬──────────────────────────┐    │
│ │Sb │  Main (R1-R3 + R4)       │    │  ← 1480px
│ │56 ├──────────────────────────┤    │
│ │   │  Footer                  │    │  ← 1480px ✅ 같은 폭
│ └───┴──────────────────────────┘    │
└──────────────────────────────────────┘
```

---

### 2. `components/layout/VerticalNav.tsx` — Sticky 안정화 (`self-start` 추가)

**Edit (55번 줄 `<nav>` className):**

```
old_string:
    <nav className="hidden md:flex flex-col items-center w-14 bg-white border-r border-[#E5E7EB] py-3 sticky top-0 h-screen shrink-0 z-50 isolate">

new_string:
    <nav className="hidden md:flex flex-col items-center w-14 bg-white border-r border-[#E5E7EB] py-3 sticky top-0 h-screen shrink-0 z-50 isolate self-start">
```

**의도:**
- `self-start` 추가 — flex 아이템의 `align-self`를 `start`로 명시 지정
- 기본값 `align-items: stretch`가 sidebar를 부모 flex 높이 전체로 늘려서 `h-screen`이 무시되고 sticky가 제대로 동작하지 않는 문제 해결
- `self-start` 이후: sidebar 높이 = `h-screen` (뷰포트 100vh)
- 스크롤 시 `sticky top-0`로 항상 뷰포트 상단에 고정 → 페이지 끝까지 스크롤해도 사이드바가 계속 보임

---

## 🔒 변경하지 않는 파일

- **`app/layout.tsx`** — Step 19의 1536px 박스 래퍼 그대로 유지
- **`components/layout/Footer.tsx`** — 내부 구조 그대로 (부모가 바뀌면서 자동 정렬)
- **`components/home/HomeClient.tsx`** — 홈 대시보드 그리드 비율 그대로 (main 폭 1480 내부에서 2.5:6.5:3 비율 자동 재계산)
- **각 위젯** — 변경 불필요

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. components/layout/LayoutShell.tsx Edit (구조 변경)
# 2. components/layout/VerticalNav.tsx Edit (self-start 추가)

# 3. 빌드 확인
npm run build 2>&1 | tail -20

# 4. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 20 /tmp/next-dev.log

# 5. 시각 검증 (브라우저 새로고침 + 스크롤)

# 6. 커밋 + 푸시
git add components/layout/LayoutShell.tsx \
        components/layout/VerticalNav.tsx

git commit -m "$(cat <<'EOF'
fix: align footer with main + stabilize sidebar sticky

Footer was sitting outside the sidebar+main flex row, which
made it 56px wider than the dashboard R4 row (which is inside
main, offset by the sidebar). The visual result: R4 and footer
didn't line up at the 1536px box edges.

VerticalNav sticky was unstable because the parent flex
container's default align-items: stretch was overriding
h-screen, leaving the sidebar without a proper height anchor
for sticky positioning.

Changes:
- LayoutShell: wrap main + footer together in a flex-col
  container placed next to the sidebar. Both now share the
  same post-sidebar width (~1480px).
- VerticalNav: add self-start so the sidebar respects h-screen
  instead of stretching to the flex container's full height.
  This restores sticky top-0 behavior — sidebar now stays
  pinned as the user scrolls down to R4 and the footer.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**이슈 1 — Footer/R4 정렬**
1. R4(상승/거래량/수급/상승테마/글로벌) 오른쪽 끝이 **푸터 오른쪽 끝과 같은 x 좌표**
2. R4 왼쪽 끝(= 사이드바 바로 오른쪽)과 푸터 왼쪽 끝도 **같은 x 좌표**
3. 사이드바-푸터 사이에 공백이 **없음** (있던 56px 죽은 공간 제거됨)

**이슈 2 — 사이드바 스크롤 추적**
4. 페이지 상단(R1-R3)에서 사이드바 전체 14개 아이콘 정상 표시
5. 스크롤해서 R4(페이지2)까지 내려가도 **사이드바 14개 아이콘 계속 보임**
6. 사이드바가 뷰포트 top-0에 고정된 상태로 콘텐츠만 스크롤됨
7. 사이드바 아이콘 hover 툴팁 정상 (z-50 유지)

**이슈 3 — Col 3 뉴스/DART (부수 검증)**
8. 뉴스속보 상단 경계와 차트 상단 경계 동일 y좌표
9. DART공시 하단 경계와 호가창|체결창 하단 경계 동일 y좌표
10. Col 3 폭이 너무 좁거나 위젯 내부 글자 잘림이 없는지 (만약 있으면 Step 22에서 비율 조정)

**회귀 검증**
11. Header 로고(STOCK TERMINAL) 정렬 Step 19 상태 유지
12. 티커 첫 심볼 정렬 Step 19 상태 유지
13. 종목발굴 미니 위젯(Col 1 가운데) 정상 작동
14. 반응형 — 뷰포트 1366px로 줄여도 레이아웃 깨짐 없음

---

## ⚠️ 예상 부작용 & 대응

- **Footer 배경이 더 이상 박스 전체 폭을 안 채움**: 1536px 박스 안에서 sidebar(56) + (main+footer)(1480) 구조이므로 Footer의 turquoise 배경은 1480px 폭으로만 칠해짐. 의도된 결과(R4와 정렬). 만약 사용자가 Footer는 풀박스폭을 원하면 Step 22에서 별도 처리.
- **사이드바 border-r이 footer까지 이어지는지 확인**: `h-screen` + sticky라 사이드바 자체는 100vh만 그려짐. R4 지나서 Footer 영역에는 사이드바 선이 없을 수 있음 — 문제 시 부모 flex 컨테이너에 `bg-white border-r` 배경 줘서 해결.
- **Next.js 16 hydration warning**: 구조 변경 시 발생 가능. 빌드 후 console 확인.

---

## 🗣️ 남은 작업 대기 목록

1. **Step 22 (조건부)** — Col 3 비율 조정 (만약 뉴스/DART가 여전히 좁아 보이면)
2. **Step 20c (조건부)** — 페이지2 별도 라우트 존재 확인 후 결정
3. **Phase 2-B** — 수급 통합 탭 (`/investor-flow` → `/net-buy`). P0
4. **Phase 2-C** — 경제캘린더 미니 위젯. P1
5. **Phase 2-D** — 발굴 ↔ 관심종목 연동. P1
6. **세션 종료 처리** — 4개 문서 헤더 날짜 업데이트

Step 21 완료 후 스크린샷 받아서 Col 3 폭 조정 필요 여부 판단.
