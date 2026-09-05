# STEP 19 — 옵션 B 전환: 전체 레이아웃을 하나의 1536px 박스로 통합

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 18 완료 (commit `48ab97f` — 좌측 정렬 = 옵션 A)

---

## 📐 목표

Step 18(옵션 A)은 "사이드바 혼자 떠있는" 문제를 **해결하지 못했고**, 오히려 콘텐츠만 왼쪽으로 쏠려서 **오른쪽 328px 죽은 공간 + 풀폭 푸터 부조화** 문제를 추가로 만듦.

→ **옵션 B로 전환**: Header + TickerBar + Sidebar + Main + Footer **전체를 하나의 `max-w-screen-2xl mx-auto` 박스**에 담아 **모두 같은 프레임에 수렴**.

```
Step 18 (현재, 잘못된 방향):
[사이드바][1536 콘텐츠][────── 328px 죽은공간 ──────]
 ───────── 푸터 풀폭 (부조화) ─────────

Step 19 목표 (옵션 B):
[─ 192 ─][1536px 박스 전체: 헤더/티커/사이드바/콘텐츠/푸터][─ 192 ─]
         └── 모두 같은 축에 정렬 + 푸터도 박스 안 ──┘
```

**핵심**: 개별 컴포넌트의 `max-width`, `ml-14`, `mx-auto` **전부 제거**하고 → app/layout.tsx **최상위에 박스 하나만**.

---

## 🔧 파일별 변경 (4개 파일)

### 1. `app/layout.tsx` — 전체 래퍼 박스 추가 ⭐ 핵심

**Edit:**

```
old_string:
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Header />
          <TickerBar />
          <LayoutShell footer={<Footer />}>
            {children}
          </LayoutShell>
        </AuthProvider>
      </body>

new_string:
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
```

**의도:**
- `max-w-screen-2xl mx-auto` → 전체를 1536px 박스로, 중앙정렬
- `w-full` → 박스가 1536px 미만 뷰포트에선 풀폭
- `flex-1 flex flex-col` → body의 flex 레이아웃 상속, 내부 Header/TickerBar/LayoutShell 세로 스택

---

### 2. `components/layout/LayoutShell.tsx` — 내부 max-width 제거

**Edit:**

```
old_string:
        <main className="flex-1 min-w-0">
          <div className="max-w-screen-2xl">
            {children}
          </div>
        </main>

new_string:
        <main className="flex-1 min-w-0">
          {children}
        </main>
```

**의도:** 부모 박스(layout.tsx 래퍼)가 이미 1536px 제한 → 내부 제약 중복 제거. `<main>`만으로 flex-1 처리.

---

### 3. `components/layout/Header.tsx` — ml-14 + max-w 제거 (2곳)

**Edit 1 — 메인 헤더 (61번 줄):**

```
old_string:
      <div className="max-w-screen-2xl ml-14 px-6 h-[72px] flex items-center justify-between gap-8">

new_string:
      <div className="px-6 h-[72px] flex items-center justify-between gap-8">
```

**Edit 2 — 검색바 토글 (180번 줄):**

```
old_string:
          <div className="max-w-screen-2xl ml-14 px-6 py-3">

new_string:
          <div className="px-6 py-3">
```

**의도:** 이미 부모 박스가 1536px 제한. 헤더는 박스 내에서 풀폭(≤1536) + px-6 자연 padding. `ml-14`(사이드바 보정)도 불필요 — 사이드바도 같은 박스 안이라 자동 정렬.

---

### 4. `components/layout/TickerBar.tsx` — 내부 래퍼 제거

**Edit:**

```
old_string:
    <div className="bg-white border-b border-[#E5E7EB] h-10 overflow-hidden">
      <div className="max-w-screen-2xl ml-14 h-full">
        {/* key forces full remount on country change */}
        <TradingViewTickerTape key={country} country={country} />
      </div>
    </div>

new_string:
    <div className="bg-white border-b border-[#E5E7EB] h-10 overflow-hidden">
      {/* key forces full remount on country change */}
      <TradingViewTickerTape key={country} country={country} />
    </div>
```

**의도:** 부모 박스가 제한하므로 내부 래퍼 불필요. TradingView 위젯이 직접 박스 폭 채움.

---

## 🔒 변경하지 않는 파일

- **`components/layout/VerticalNav.tsx`** — 사이드바 56px 고정. 박스 안에서 자연스럽게 좌측 정렬
- **`components/layout/Footer.tsx`** — LayoutShell fragment로 박스 안에 들어가 있어서 자동으로 박스 폭 따름

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. app/layout.tsx — 래퍼 div 추가
# 2. LayoutShell.tsx — 내부 max-w-screen-2xl div 제거
# 3. Header.tsx — 2곳 (max-w-screen-2xl ml-14 제거)
# 4. TickerBar.tsx — 내부 래퍼 제거

# 5. 빌드 확인
npm run build 2>&1 | tail -15

# 6. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 20 /tmp/next-dev.log

# 7. 커밋 + 푸시
git add app/layout.tsx \
        components/layout/LayoutShell.tsx \
        components/layout/Header.tsx \
        components/layout/TickerBar.tsx

git commit -m "$(cat <<'EOF'
refactor: unify layout into single 1536px centered box (option B)

Move max-width constraint from individual components to
app/layout.tsx root wrapper. All elements (header, ticker,
sidebar, main, footer) now share the same 1536px box.

Changes:
- app/layout.tsx: wrap AuthProvider children in
  max-w-screen-2xl mx-auto flex-1 flex flex-col div
- LayoutShell: remove redundant max-w-screen-2xl inner div
- Header: remove max-w-screen-2xl ml-14 (2 places)
- TickerBar: remove inner wrapper div

Visual result on 1920px monitor:
- 192px empty [1536px everything] 192px empty
- Sidebar now inside the box, aligned with header logo
- Footer same width as content (no full-width disconnect)

Rationale: Step 18 (option A, left-align) solved the sidebar
isolation by moving content leftward — but created a 328px
dead zone on the right and footer/content width mismatch.
Option B eliminates these by centering everything together.

Tradeoff accepted: Fitts's Law — sidebar no longer at viewport
edge on monitors >1536px. Icons still clickable at their
natural positions; not a dealbreaker for a data-reading tool.

Matches Notion/Linear/Figma pattern for max-width centered
layouts with internal sidebar.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**1920px 모니터 기준** (http://localhost:3000 새로고침):

**통합 정렬 (핵심)**
1. 헤더 `STOCK TERMINAL` 로고가 **사이드바 바로 위**에 정렬되는가 (같은 x 좌표)
2. 티커 첫 심볼도 **사이드바 위에서 시작**하는가
3. 콘텐츠 그리드 좌측 끝이 **사이드바 오른쪽 경계**와 연속되는가
4. 푸터도 박스 폭(1536px) 따라 **헤더와 같은 좌우 경계**에 있는가

**중앙정렬**
5. 뷰포트 좌우에 **약 192px씩 빈 공간**이 생겼는가
6. 좌우 빈 공간이 **대칭**인가

**기능**
7. 사이드바 아이콘 클릭 → 페이지 이동 정상
8. 헤더 검색 토글, 국가 선택, 프로필 드롭다운 정상
9. 티커 TradingView 위젯 정상 렌더

**반응형**
10. 브라우저 창을 1366px 이하로 줄이면 **좌우 여백 사라지고** 박스가 뷰포트 풀폭으로 변하는가

---

## 🗣️ 남은 작업 대기 목록

1. **Step 20a — 종목발굴 위젯 신규 생성** (ScreenerMiniWidget + URL param 처리) — 이전 Step 19a 이름 변경
2. **Step 20b — 홈 대시보드 그리드 재배치** (D 비율 45:10:45 + Col 2 1:1 + Col 3 뉴스/DART)
3. **Step 20c — 페이지2 위젯 교체 + 1:1:1:1:1 비율**
4. **Phase 2-B / 2-C / 2-D** — 수급 통합 / 경제캘린더 / 발굴↔관심종목 연동
5. **/toolbox vs /link-hub 중복 정리**
6. **세션 종료 처리** — 4개 문서 헤더 날짜 업데이트

Step 19 완료 후 Step 20a 명령어 작성 시작.
