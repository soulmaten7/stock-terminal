# STEP 17 — 헤더 + 티커 max-w-screen-2xl 정렬 (콘텐츠와 시각적 축 통일)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 16 완료 (commit `4aa8afc` — LayoutShell `<main>`에 max-w-screen-2xl 래퍼 추가, screener/toolbox 개별 제약 제거)

---

## 📐 목표

Step 16 이후 **콘텐츠는 1536px 중앙정렬**됐는데, **Header와 TickerBar는 여전히 1920px 폭** 사용 중. 1920px 모니터에서:

```
[풀폭 헤더 — 로고 맨 왼쪽, 프로필 맨 오른쪽]
[풀폭 티커 — BTC ... 끝까지]
[사이드바][164px 여백][1536px 콘텐츠][164px 여백]
          ↑ 로고와 콘텐츠 시작점 어긋남
```

→ Header/TickerBar도 **1536px로 통일**하여 **시각적 축 단일화**:

```
[풀폭 헤더 배경 + border]
  [1536px 헤더 내부 — 로고/프로필]
[풀폭 티커 배경 + border]
  [1536px 티커 내부 — BTC, EUR/USD, ...]
[사이드바][1536px 콘텐츠]
          ↑ 모두 같은 축
```

**핵심**: 배경(`bg-white`, `border-b`)은 **풀폭 유지** (시각적 구분선 끊김 방지). 내부 요소만 max-width 제한.

---

## 🔧 파일별 변경 (2개 파일, 3곳)

### 1. `components/layout/Header.tsx` — 2곳 (메인 헤더 + 검색바)

**Edit 1 — 메인 헤더 (61번 줄):**

```
old_string:
      <div className="max-w-[1920px] mx-auto px-6 h-[72px] flex items-center justify-between gap-8">

new_string:
      <div className="max-w-screen-2xl mx-auto px-6 h-[72px] flex items-center justify-between gap-8">
```

**Edit 2 — 검색바 토글 영역 (180번 줄):**

```
old_string:
          <div className="max-w-[1920px] mx-auto px-6 py-3">

new_string:
          <div className="max-w-screen-2xl mx-auto px-6 py-3">
```

**의도:**
- 외부 `<header>` 엘리먼트(60번 줄)는 `bg-white border-b` 그대로 유지 → 배경과 구분선은 풀폭
- 내부 `<div>` max-width만 1536px로 축소 → 로고와 우측 아이콘이 콘텐츠 좌우 끝과 정렬

---

### 2. `components/layout/TickerBar.tsx` — 1곳 (내부 래퍼 추가)

현재 `<div>`가 `bg-white border-b` + TradingView 위젯을 직접 감쌈. 래퍼 하나 추가해서 위젯만 제한.

**Edit:**

```
old_string:
    <div className="bg-white border-b border-[#E5E7EB] h-10 overflow-hidden">
      {/* key forces full remount on country change */}
      <TradingViewTickerTape key={country} country={country} />
    </div>

new_string:
    <div className="bg-white border-b border-[#E5E7EB] h-10 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto h-full">
        {/* key forces full remount on country change */}
        <TradingViewTickerTape key={country} country={country} />
      </div>
    </div>
```

**의도:**
- 외부 `<div>` (`bg-white border-b h-10 overflow-hidden`) → 풀폭 배경 유지
- 내부 `<div>` (`max-w-screen-2xl mx-auto h-full`) → 위젯만 1536px 제한
- `h-full` 필수 — 부모 `h-10`을 내부 래퍼도 상속해야 TradingView iframe이 제대로 렌더

---

## 🔒 변경하지 않는 파일 (의도적)

- **`components/layout/VerticalNav.tsx`** — 사이드바 56px 고정. 이미 최소 폭 (아이콘만), 더 줄일 곳 없음
- **`components/layout/LayoutShell.tsx`** — Step 16에서 이미 max-w-screen-2xl 설정 완료
- **모든 콘텐츠 페이지** — 이미 1536px 상속 중

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. Header.tsx Edit (위 1-Edit 1, 1-Edit 2)
# 2. TickerBar.tsx Edit (위 2)

# 3. 빌드 확인
npm run build 2>&1 | tail -15

# 4. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 20 /tmp/next-dev.log

# 5. 커밋 + 푸시
git add components/layout/Header.tsx components/layout/TickerBar.tsx

git commit -m "$(cat <<'EOF'
feat: align header + ticker to max-w-screen-2xl (visual axis unification)

Header:
- Main container max-w-[1920px] -> max-w-screen-2xl
- Search bar toggle area same change
- <header> wrapper retains full-width bg + border-b

TickerBar:
- Add inner max-w-screen-2xl mx-auto wrapper
- Outer div keeps full-width bg + border-b
- h-full on inner wrapper to preserve 40px height

Rationale: Step 16 constrained content to 1536px but header/ticker
remained 1920px, creating visual misalignment on wide monitors
(logo at viewport edge, content centered inward).

Now all elements share the same 1536px axis while background
separators stay full-width for visual continuity.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

브라우저 `http://localhost:3000` 새로고침 후 **1920px 모니터 기준**:

**정렬 확인 (핵심)**
1. 로고 `STOCK TERMINAL` 왼쪽 끝이 콘텐츠 영역 **왼쪽 끝과 수직 정렬**되는가
2. 우측 아이콘들(🔍 🇰🇷 🔔 ⭐ 👤) 오른쪽 끝이 콘텐츠 영역 **오른쪽 끝과 수직 정렬**되는가
3. 티커 첫 심볼(BTC)이 로고와 **같은 세로축**에 있는가

**배경 연속성**
4. 헤더 아래 구분선(`border-b`)이 **풀폭**으로 끊김 없이 이어지는가
5. 티커 배경도 **풀폭 흰색** 유지하는가 (가운데만 흰색 아님)

**기능 회귀 없음**
6. 검색 토글 → 검색바가 열리고 중앙정렬되는가
7. 국가 선택(🇰🇷) 드롭다운 정상 작동
8. 프로필 드롭다운 위치 정확 (우측 정렬)

**반응형**
9. 창을 1366px 이하로 줄이면 모든 요소가 뷰포트 채우는가

---

## 🗣️ 남은 작업 대기 목록

1. **Phase 2-B (수급 통합 탭)** — `/investor-flow` → `/net-buy` 내부 탭 흡수. P0
2. **Phase 2-C (경제캘린더 미니 위젯)** — 홈 대시보드 편입. P1
3. **Phase 2-D (발굴 ↔ 관심종목 연동)** — `⭐ 추가` 버튼 + 공통 StockTable. P1 (사용자 승인 완료)
4. **`/toolbox` vs `/link-hub` 중복 정리** — 같은 `link_hub` 테이블, 하나 제거
5. **세션 종료 처리** — 4개 문서(CLAUDE, CHANGELOG, session-context, NEXT_SESSION_START) 헤더 날짜 업데이트

Step 17 완료 후 사용자 선택.
