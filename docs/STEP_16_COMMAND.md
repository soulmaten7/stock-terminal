# STEP 16 — 전역 창 너비 통일 (max-w-screen-2xl = 1536px) + screener/toolbox 풀폭 수정

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 15 완료 (commit `02d712a` — Header nav 제거 + 사이드바 통합)

---

## 📐 목표

사용자가 대시보드 폭을 **Koyfin 스타일 (max-w-screen-2xl = 1536px)** 로 확정.

현재 페이지별 폭이 **제각각** 상태:
- 홈 대시보드, WidgetDetailStub, /analytics → 풀 뷰포트 (제약 없음)
- `/screener` → `max-w-[1400px]` (너무 좁음)
- `/toolbox` → `max-w-5xl` (1024px, 매우 좁음)

이를 **단일 기준(1536px)** 으로 통일.

**구현 전략:** LayoutShell `<main>` 안에 **공통 max-width 래퍼**를 하나 넣어서 **모든 페이지가 자동 상속**받게 함. 개별 페이지는 터치하지 않고, screener/toolbox만 기존 개별 제약을 **제거**하여 공통 래퍼를 따르게 함.

---

## 🎯 적용 결과 (1920px 모니터 기준)

```
[56px 사이드바][164px 여백][1536px 콘텐츠][164px 여백]
```

- **1920px 모니터**: 콘텐츠 1536px, 양옆 164px each (약 9%)
- **1366px 노트북**: 뷰포트 자동 채움 (1310px) — 반응형 자동 처리
- **2560px QHD**: 콘텐츠 1536px, 양옆 484px each — 거대 모니터에서도 가독성 유지

---

## 🔧 파일별 변경 (3개 파일)

### 1. `components/layout/LayoutShell.tsx` — 공통 래퍼 추가 ⭐ 핵심

**Edit:**

```
old_string:
        <main className="flex-1 min-w-0">
          {children}
        </main>

new_string:
        <main className="flex-1 min-w-0">
          <div className="max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
```

**의도:**
- `max-w-screen-2xl` = Tailwind 내장 (1536px)
- `mx-auto` = 부모(`<main>`)가 1536px보다 클 때 자동 중앙정렬
- 자식 페이지는 이 div 안에서 블록 렌더 — 모든 페이지가 동일 폭 상속
- 페이지가 자체 `max-w-*`를 가지고 있으면 더 좁아짐(nested max-width rule) → screener/toolbox에서 제거 필요 (아래 2, 3번)

---

### 2. `components/screener/ScreenerClient.tsx` — 개별 `max-w-[1400px]` 제거 (2군데)

파일 내 `max-w-[1400px] mx-auto` 가 **93번 줄 (로딩 상태)** + **105번 줄 (정상 상태)** 두 곳에 등장.

**Edit (replace_all 사용):**

```
old_string:
max-w-[1400px] mx-auto

new_string:

```
(빈 문자열로 대체 — 해당 클래스 2개만 제거, 나머지 `px-4 py-8`는 유지)

`replace_all: true`

**결과 (예시):**
- Before: `className="max-w-[1400px] mx-auto px-4 py-8"`
- After: `className=" px-4 py-8"` (공백 하나 남지만 Tailwind 파싱 문제 없음)

---

### 3. `components/toolbox/ToolboxClient.tsx` — 개별 `max-w-5xl` 제거

**Edit:**

```
old_string:
    <div className="max-w-5xl mx-auto px-4 py-8">

new_string:
    <div className="px-4 py-8">
```

**결과:** toolbox 페이지가 `/screener`, 홈 대시보드와 동일한 1536px 폭 사용.

---

## 🔒 변경하지 않는 파일 (의도적)

- **`app/layout.tsx`** — Header, TickerBar, AuthProvider, LayoutShell 구조 그대로
- **`components/layout/Header.tsx`** — 헤더는 `max-w-[1920px] mx-auto` 유지 (로고/우측 아이콘이 양 끝으로 가는 게 자연스러움)
- **`components/layout/TickerBar.tsx`** — 풀 뷰포트 유지 (TradingView 위젯이 전체 스크롤)
- **`components/home/HomeClient.tsx`** — 풀폭 기반 그리드 그대로 두면 래퍼가 1536px로 자동 제한
- **`components/common/WidgetDetailStub.tsx`** — `w-full` 그대로 (래퍼가 1536px 제한)
- **`app/analytics/page.tsx`** — `w-full` 그대로 (래퍼가 1536px 제한)

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. LayoutShell.tsx Edit (위 1번)
# 2. ScreenerClient.tsx Edit (위 2번, replace_all: true)
# 3. ToolboxClient.tsx Edit (위 3번)

# 4. 빌드 확인
npm run build 2>&1 | tail -15

# 5. 에러 없으면 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 20 /tmp/next-dev.log

# 6. 커밋 + 푸시
git add components/layout/LayoutShell.tsx \
        components/screener/ScreenerClient.tsx \
        components/toolbox/ToolboxClient.tsx

git commit -m "$(cat <<'EOF'
feat: unify page width to max-w-screen-2xl (1536px)

LayoutShell:
- Add max-w-screen-2xl mx-auto wrapper inside <main>
- All pages inherit 1536px width constraint
- Auto-centered on monitors > 1536px

Cleanup individual constraints:
- ScreenerClient: remove max-w-[1400px] mx-auto (x2 occurrences)
- ToolboxClient: remove max-w-5xl mx-auto (1024px → 1536px)

Rationale: Koyfin-inspired tablet-like proportion on wide monitors.
At 1920px monitor: 1536px content + 192px margin each side (symmetric).
At 1366px laptop: full viewport (responsive auto).
At 2560px QHD: 1536px content + 512px margin (readable).

Header + TickerBar retain max-w-[1920px] (logo/icons at edges).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

브라우저에서 `http://localhost:3000` 새로고침 후:

**홈 대시보드**
1. 3열 그리드(채팅+글로벌 | 차트+관심 | 호가+체결)가 **중앙정렬** 되어 보이는가
2. 양옆에 **여백**이 생겼는가 (1920px 모니터 기준 약 192px each)
3. 헤더와 티커는 **전체 폭** 유지 — 콘텐츠만 중앙정렬인지

**/screener (종목 발굴)**
4. 종목 테이블 + 필터 바가 **중앙정렬**되고 1536px까지 사용하는가
5. 이전 1400px 대비 **약간 더 넓어진 느낌**인지

**/toolbox (참고 사이트)**
6. 링크 카드 그리드가 이전 **1024px에서 1536px로 확 넓어졌는가** (가장 체감 큼)
7. 카드가 3열에서 4열로 자동 확장되는지 (Tailwind grid-cols 자동 반응)

**사이드바 페이지 (상승/하락, 거래량 등)**
8. 모든 WidgetDetailStub 페이지도 **중앙정렬 + 1536px 제한** 걸리는가

**반응형**
9. 브라우저 창을 **1366px 이하**로 줄이면 콘텐츠가 자동으로 뷰포트 채우는가

---

## 🗣️ 남은 작업 대기 목록

1. **Phase 2-B (수급 통합 탭)** — `/investor-flow` → `/net-buy` 내부 탭 흡수. P0.
2. **Phase 2-C (경제캘린더 미니 위젯)** — 홈 대시보드 편입. P1.
3. **Phase 2-D (발굴 ↔ 관심종목 연동)** — `⭐ 추가` 버튼 + 공통 StockTable 컴포넌트. P1.
4. **/toolbox vs /link-hub 중복 정리** — 같은 DB 테이블 사용, 하나 제거 필요.
5. **세션 종료 처리** — 4개 문서(CLAUDE, CHANGELOG, session-context, NEXT_SESSION_START) 헤더 날짜 업데이트.

Step 16 완료 후 사용자 선택.
