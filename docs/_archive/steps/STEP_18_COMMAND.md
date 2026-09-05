# STEP 18 — 옵션 A: 좌측 정렬 (사이드바 → 콘텐츠 연속 배치)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 17 완료 (commit `3699acd` — Header + TickerBar를 max-w-screen-2xl로 정렬)

---

## 📐 목표

Step 17 결과, 헤더/티커/콘텐츠 모두 **뷰포트 중앙에 1536px 배치**. 하지만 **사이드바(56px)** 는 뷰포트 좌측 끝에 있어서 **사이드바와 콘텐츠 사이에 164px 빈 공간** 발생. 사이드바가 "혼자 떠있는" 느낌.

→ 옵션 A: **좌측 정렬**로 전환. `mx-auto` 제거 + 사이드바 폭만큼 `ml-14` 보정.

```
현재 (Step 17):
[사이드바][164px 빈공간][1536px 콘텐츠][164px 우측여백]
 └─ 사이드바 붕 떠 있음 ─┘

Step 18 목표:
[사이드바][1536px 콘텐츠][328px 우측여백]
 └─ 사이드바 콘텐츠 직접 연결 ─┘
```

**핵심**: 헤더/티커 **외부 배경은 풀폭 유지** (border-b 끊김 방지). 내부 콘텐츠만 `ml-14` (= 56px, 사이드바 폭)로 우측 이동.

---

## 🔧 파일별 변경 (3개 파일, 4곳)

### 1. `components/layout/LayoutShell.tsx` — `mx-auto` 제거

**Edit:**

```
old_string:
          <div className="max-w-screen-2xl mx-auto">
            {children}
          </div>

new_string:
          <div className="max-w-screen-2xl">
            {children}
          </div>
```

**의도:** `<main>`(flex-1)이 사이드바 뒤 모든 공간 차지. `mx-auto` 없으면 자식 div가 좌측부터 시작 → 사이드바 바로 옆에 붙음.

---

### 2. `components/layout/Header.tsx` — 2곳 `mx-auto` → `ml-14`

**Edit 1 — 메인 헤더 (61번 줄):**

```
old_string:
      <div className="max-w-screen-2xl mx-auto px-6 h-[72px] flex items-center justify-between gap-8">

new_string:
      <div className="max-w-screen-2xl ml-14 px-6 h-[72px] flex items-center justify-between gap-8">
```

**Edit 2 — 검색바 토글 (180번 줄):**

```
old_string:
          <div className="max-w-screen-2xl mx-auto px-6 py-3">

new_string:
          <div className="max-w-screen-2xl ml-14 px-6 py-3">
```

**의도:**
- `ml-14` = 3.5rem = 56px (사이드바 폭과 동일)
- 헤더 내부 콘텐츠가 사이드바 오른쪽 경계부터 시작
- 외부 `<header>` 태그는 `bg-white border-b` 그대로 → 풀폭 배경 유지

---

### 3. `components/layout/TickerBar.tsx` — `mx-auto` → `ml-14`

**Edit:**

```
old_string:
      <div className="max-w-screen-2xl mx-auto h-full">

new_string:
      <div className="max-w-screen-2xl ml-14 h-full">
```

**의도:** 티커 첫 심볼(BTC)이 사이드바 오른쪽 바로 옆에서 시작. `h-full` 유지로 40px 높이 보존.

---

## 🔒 변경하지 않는 파일 (의도적)

- **`components/layout/VerticalNav.tsx`** — 사이드바는 그대로. 뷰포트 좌측 끝 고정 (Fitts's Law: 마우스 관성 도달 가능)
- **외부 배경 div들** — `<header>`, TickerBar 외부 div, LayoutShell 최상위 flex — 모두 풀폭 유지 (border-b 끊김 방지)

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. LayoutShell.tsx Edit (mx-auto 제거)
# 2. Header.tsx Edit 2곳 (mx-auto → ml-14)
# 3. TickerBar.tsx Edit (mx-auto → ml-14)

# 4. 빌드 확인
npm run build 2>&1 | tail -15

# 5. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 20 /tmp/next-dev.log

# 6. 커밋 + 푸시
git add components/layout/LayoutShell.tsx components/layout/Header.tsx components/layout/TickerBar.tsx

git commit -m "$(cat <<'EOF'
feat: left-align layout (option A) — sidebar-to-content continuity

LayoutShell:
- Remove mx-auto from max-w-screen-2xl inner div
- Content now left-aligns to sidebar edge

Header:
- Replace mx-auto with ml-14 (56px, matches sidebar width) (2 places)
- Logo and right icons anchor to same x-axis as content

TickerBar:
- Replace mx-auto with ml-14
- Ticker starts at sidebar edge

Rationale: Step 17 centered all elements at 1536px but sidebar
stayed at viewport edge, creating 164px dead zone between
sidebar and content.

Option A (left-align, Koyfin/Bloomberg pattern):
- Sidebar at viewport edge (Fitts's Law mouse reachability)
- Content starts immediately after sidebar
- Empty space on right only (natural for L-to-R reading)

Outer <header>, ticker outer div, LayoutShell flex container
all retain full-width backgrounds for uninterrupted border-b.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**정렬 확인 (핵심)**
1. 사이드바 바로 오른쪽에 **공백 없이** 콘텐츠 시작
2. 로고 `STOCK TERMINAL` 왼쪽 끝이 **사이드바 오른쪽 경계와 수직 정렬**
3. 티커 첫 심볼(BTC 또는 S&P 500)이 **사이드바 오른쪽에 바로 붙음**
4. 콘텐츠 첫 위젯(마켓채팅)도 **사이드바 오른쪽에 바로 붙음**

**오른쪽 여백**
5. 1920px 모니터에서 오른쪽에 **328px 여백** 생김 (자연스러움)
6. 1366px 노트북에서는 콘텐츠가 **뷰포트 끝까지** 채움

**배경 연속성**
7. 헤더 아래 border-b가 풀폭 유지
8. 티커 아래 border-b도 풀폭 유지

**기능 회귀 없음**
9. 검색 토글 정상, 드롭다운 위치 정상

---

## 🗣️ 남은 작업 대기 목록

1. **Step 19 — 홈 대시보드 구조 재설계** (P0, 사용자 제안 중)
   - 차트 축소 (R1-R2 → R1.5)
   - 글로벌지수 위치 → 관심종목
   - 마켓채팅↔관심종목 사이 **종목발굴** 미니 위젯 신설 (시장 + 키워드 → /screener 이동)
   - 관심종목 자리 → 호가창 / 상승테마 자리 → 체결창
   - 호가창 자리 → 뉴스속보 / 체결창 자리 → DART공시
   - 페이지2: DART → 상승테마, 뉴스속보 → 글로벌지수, 1:1:1:1:1 비율
2. **Phase 2-B (수급 통합 탭)** — `/investor-flow` → `/net-buy` 탭 흡수. P0
3. **Phase 2-C (경제캘린더 미니 위젯)** — 홈 편입. P1
4. **Phase 2-D (발굴 ↔ 관심종목 연동)** — 공통 StockTable. P1
5. **`/toolbox` vs `/link-hub` 중복 정리**
6. **세션 종료** — 4개 문서 헤더 날짜 업데이트

Step 18 완료 후 Step 19 재설계 다이어그램 사용자 승인 → 명령어 작성.
