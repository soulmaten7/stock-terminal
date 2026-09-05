# STEP 22 — LayoutShell 롤백 (Header = Footer = 1536 풀폭)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 21 완료 (commit `64fe8fa` — Footer를 main과 같은 1480px로 이동, 이건 잘못된 방향)

---

## 📐 목표

사용자가 명시한 최종 레이아웃 구조로 복원:

```
┌──── 1536px 박스 ──────────────────────┐
│ Header                      (1536)    │
├────────────────────────────────────────┤
│ Ticker                      (1536)    │
├─────┬──────────────────────────────────┤
│ Sb  │ Main (R1-R4)          (1480)    │  ← Sidebar+Main 한몸
│ 56  │                                  │
├─────┴──────────────────────────────────┤
│ Footer                      (1536)    │  ← Header와 같은 너비
└────────────────────────────────────────┘
```

**원칙:**
- Header / Ticker / Footer = **박스 풀폭 1536** (같은 너비)
- Sidebar + Main = **한몸으로 중간 row** (56 + 1480 = 1536)
- R4는 Main 안이므로 1480 (= 사용자 의도)

Step 21에서 Footer를 main 옆 1480 컨테이너에 넣은 게 잘못된 해석이었음. 사용자는 **R4/Footer가 안 맞아 보인 게 문제가 아니라**, 뉴스/DART 위젯 내부 레이아웃이 Col 3 폭에 비해 어긋나 보였던 것.

→ LayoutShell 구조를 Step 19 상태로 **롤백**. Col 3 내부 문제는 별도 Step에서 처리.

---

## 🔧 파일 변경 (1개 파일)

### `components/layout/LayoutShell.tsx` — Step 19 상태로 롤백

**Edit:**

```
old_string:
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

new_string:
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
```

**의도:**
- Footer를 sidebar+main row **밖**으로 다시 꺼냄
- app/layout.tsx의 wrapper가 `flex-col`이므로 Footer는 sidebar+main row 아래에 자동 stack
- Footer 폭 = wrapper 폭 = 1536 (Header/Ticker와 동일)
- Main 폭은 여전히 1480 (sidebar 옆)

---

## 🔒 변경하지 않는 파일

- **`components/layout/VerticalNav.tsx`** — Step 21의 `self-start` 유지 (sticky 안정화, 사이드바 스크롤 추적 잘 작동 중)
- **`app/layout.tsx`** — Step 19 구조 그대로
- **`components/home/HomeClient.tsx`** — 대시보드 그리드 그대로

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. components/layout/LayoutShell.tsx Edit (Step 19 상태로 롤백)

# 2. 빌드 확인
npm run build 2>&1 | tail -15

# 3. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 20 /tmp/next-dev.log

# 4. 커밋 + 푸시
git add components/layout/LayoutShell.tsx

git commit -m "$(cat <<'EOF'
revert: restore footer to full box width (header = footer = 1536)

Step 21 misread the issue. User's intended layout is:
- Header / Ticker / Footer all span the full 1536px box width
- Sidebar (56) + Main (1480) sit together as the middle row
- Sidebar and dashboard are "one body" — R4 naturally offset
  by sidebar width, as intended

Step 21 moved Footer inside the sidebar+main flex container,
shrinking it to 1480px to match R4. That made Header and
Footer different widths — opposite of what was wanted.

This revert returns LayoutShell to the Step 19 structure:
- Sidebar + Main stay in their own flex row
- Footer is a sibling below, inheriting the 1536 box width
  from app/layout.tsx's wrapper div

VerticalNav self-start (Step 21) is preserved — that fix
stabilized sticky behavior and is not related to the footer
width misunderstanding.

The real Col 3 News/DART layout concerns will be addressed
in a separate step focused on widget internals.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**폭 일치 (핵심)**
1. Header 좌우 끝 = Footer 좌우 끝 (같은 x 좌표)
2. Ticker 좌우 끝 = Header 좌우 끝 (같은 x 좌표)
3. Footer turquoise 배경이 **사이드바 아래까지** 이어짐 (박스 풀폭)

**Sidebar+Main 한몸**
4. Sidebar는 Header 아래부터 Footer 위까지 (Step 21 `self-start` + sticky 유지)
5. Main(R1-R4) 왼쪽 = Sidebar 오른쪽 (공백 없음)

**기능 회귀 없음**
6. Step 21에서 해결된 사이드바 스크롤 추적은 **그대로 유지**됨
7. 홈 대시보드 레이아웃 Step 20b 상태 유지
8. 종목발굴 위젯 정상 작동

---

## 🗣️ 남은 작업 (다음 Step)

**Step 23 (다음 과제) — Col 3 뉴스/DART 레이아웃 정리**

사용자가 언급한 "뉴스속보/DART 공시피드 레이아웃이 안맞아" 문제를 정확히 진단하기 위해 아래 파일들을 읽어봐야 함:
- `components/widgets/NewsFeedWidget.tsx`
- `components/widgets/DartFilingsWidget.tsx`

가능한 원인:
- Col 3 폭(370px)에 비해 위젯 내부 패딩/글자 크기 부적합
- 위젯 카드 내부 `flex` 자식이 `min-w-0` 누락으로 overflow
- 상단 헤더 높이가 두 위젯 간 다름 → 수직 정렬 틀어짐

Step 22 완료 후 사용자가 현재 Col 3 스크린샷 공유 → Step 23 명령어 작성.

---

## 📝 남은 대기 목록

1. **Step 23** — Col 3 뉴스/DART 위젯 내부 레이아웃 정리
2. **Phase 2-B** — 수급 통합 탭 (`/investor-flow` → `/net-buy`). P0
3. **Phase 2-C** — 경제캘린더 미니 위젯. P1
4. **Phase 2-D** — 발굴 ↔ 관심종목 연동. P1
5. **세션 종료 처리** — 4개 문서 헤더 날짜 업데이트
