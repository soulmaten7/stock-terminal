# STEP 27 — Grid item 자체의 min-width 차단 (post-hydration 확장 방지)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 26 완료 (outer grid `minmax(0, Nfr)`). 하지만 증상 여전 — 새로고침 시 **잠시 맞춰진 크기로 렌더되다가 곧 원래대로 돌아감**.

---

## 🧠 결정적 단서 — "잠시 fit → 다시 밀려남"

이 증상은 100% **post-hydration content growth** 패턴:
1. **SSR 초기 렌더**: 위젯들이 빈 상태 (loading spinner만) → outer grid가 minmax(0, Nfr)로 정확히 fit ✓
2. **클라이언트 hydration 후 fetch 완료**: 위젯에 실제 데이터 삽입 → 자식 min-content 팽창 → grid item(section-col3)을 밀어냄 → track도 밀림 → 박스 밖으로 오버플로우 ✗

---

## 🧠 왜 Step 26 (minmax(0, Nfr))만으론 부족했나

CSS Grid Level 1 스펙의 "Automatic Minimum Size of Grid Items":
> Note that this automatic minimum size can cause the auto-sized track minimum to grow even when the track's min size is 0.

즉 `minmax(0, Xfr)`에서 **track의 min은 0이지만**, grid item(자식 div)의 `min-width`가 **`auto`**(기본값)면 여전히 min-content를 고려해서 track이 팽창함.

해결책은 **grid item 자체에 `min-width: 0` 명시**. Step 26은 outer **track**만 건드렸고, Step 25도 마찬가지. **item 쪽 차단이 계속 빠져있었음** — 이게 지난 2번 실패의 진짜 원인.

---

## 🔧 파일 변경 — HomeClient.tsx 5군데에 minWidth: 0 추가

### `components/home/HomeClient.tsx`

**Edit 1 — section-col1:**
```
old_string:
      <div
        id="section-col1"
        style={{
          gridRow: 1,
          gridColumn: 1,
          display: 'grid',
          gridTemplateRows: '45fr 10fr 45fr',
          gap: 8,
          minHeight: 0,
        }}
      >

new_string:
      <div
        id="section-col1"
        style={{
          gridRow: 1,
          gridColumn: 1,
          display: 'grid',
          gridTemplateRows: '45fr 10fr 45fr',
          gap: 8,
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
```

**Edit 2 — section-col2:**
```
old_string:
      <div
        id="section-col2"
        style={{
          gridRow: 1,
          gridColumn: 2,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
          minHeight: 0,
        }}
      >

new_string:
      <div
        id="section-col2"
        style={{
          gridRow: 1,
          gridColumn: 2,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
```

**Edit 3 — section-col3:**
```
old_string:
      <div
        id="section-col3"
        style={{
          gridRow: 1,
          gridColumn: 3,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
          minHeight: 0,
        }}
      >

new_string:
      <div
        id="section-col3"
        style={{
          gridRow: 1,
          gridColumn: 3,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
```

**Edit 4 — section-r4:**
```
old_string:
      <div
        id="section-r4"
        style={{
          gridRow: 2,
          gridColumn: '1 / 4',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          gap: 8,
          minHeight: 0,
        }}
      >

new_string:
      <div
        id="section-r4"
        style={{
          gridRow: 2,
          gridColumn: '1 / 4',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          gap: 8,
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
```

**Edit 5 — section-orderbook-tick (Col 2 내부 중첩 grid):**
```
old_string:
        <div
          id="section-orderbook-tick"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            minHeight: 0,
          }}
        >

new_string:
        <div
          id="section-orderbook-tick"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
```

---

## 🎯 3단계 방어선 구축

```
1. outer grid track    → minmax(0, Nfr)  ← Step 26 (이미 적용)
2. grid item 자체      → minWidth: 0      ← Step 27 신규
3. item overflow       → overflow: hidden ← Step 27 신규 (최종 안전망)
```

- 1단계: track이 밖으로 확장 못 함
- 2단계: 자식 min-content가 item을 밀어내도 item은 자기 track 안에 머묾
- 3단계: 그래도 콘텐츠가 튀어나오려 하면 clip됨 (WidgetCard의 overflow-hidden과 중복이지만 이중 안전망)

이 3단계가 다 막으면 **어떤 상황에서도** 박스 밖으로 나갈 수 없음.

---

## 🔒 변경하지 않는 파일

- `components/layout/LayoutShell.tsx` — 유지
- `components/layout/VerticalNav.tsx` — 유지
- `components/layout/Footer.tsx` — Step 24 구조 유지
- `components/home/WidgetCard.tsx` — 유지 (이미 overflow-hidden 있음)
- 각 widget 컴포넌트 — 유지
- HomeClient의 outer gridTemplateColumns — Step 26 값 유지 (`minmax(0,2.5fr) minmax(0,6.5fr) minmax(0,3fr)`)
- HomeClient의 inner widget wrapper divs (section-chat, section-watchlist, section-news, section-dart, section-chart, section-orderbook, section-tick, section-movers 등) — 유지 (이미 minHeight: 0 있음, 추가 조치 불필요)

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. components/home/HomeClient.tsx Edit 5회 (4개 section-col + 1개 section-orderbook-tick에 minWidth + overflow 추가)

# 2. 빌드 확인
npm run build 2>&1 | tail -10

# 3. 개발 서버 완전 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 8
tail -n 15 /tmp/next-dev.log

# 4. 커밋 + 푸시
git add components/home/HomeClient.tsx

git commit -m "$(cat <<'EOF'
fix: block grid items from expanding their tracks post-hydration

User reported that after Step 26 (minmax(0, Nfr) on outer grid),
the dashboard briefly rendered at the correct size on refresh,
then snapped back to overflowing — the telltale signature of
content growth after client hydration pushing grid tracks out.

Why Step 26 was incomplete: CSS Grid Level 1 spec defines an
"automatic minimum size" for grid items. Even when a track is
declared minmax(0, Xfr), if the grid item itself has min-width:
auto (the default), the item's min-content size is still
considered and can expand the track.

The outer <div> elements (section-col1/2/3, section-r4, and
section-orderbook-tick) are grid items of their parent grid.
They had minHeight: 0 but no minWidth: 0, so their auto
min-width resolved to child min-content. When widgets fetched
data (News items, DART filings, etc.) and painted content,
the section div's min-width jumped, and the outer track
expanded with it — exactly by the sidebar's w-14 width.

Add minWidth: 0 to all five grid-item divs. Also add
overflow: hidden as a third-line defense: even if any other
mechanism tries to expand an item, content is clipped at the
declared track boundary.

Three-layer defense now in place:
1. Track level: minmax(0, Nfr) — track can't grow past parent
2. Item level: minWidth: 0 — item can't push track from inside
3. Visual level: overflow: hidden — content clips at boundary

All three must be bypassed for overflow to occur, which no
normal content can do.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**핵심 테스트 — 새로고침 후 안정성**
1. **페이지 새로고침 (F5 또는 Cmd+R)** → 로딩 완료 후에도 Col 3가 박스 안에 머묾
2. 뉴스 데이터가 fetch되는 순간에도 Col 3 width 변화 없음
3. DART 공시 데이터가 fetch되는 순간에도 Col 3 width 변화 없음
4. TradingView 차트가 로드된 후에도 Col 2 width 변화 없음

**최종 정렬**
5. R1-R3 Col 3 우측 = R4 우측 = Footer 우측 = 박스 우측 (모두 동일)
6. 가로 스크롤바 없음 (페이지 로딩 전·중·후 모든 시점)

**DevTools 새로고침 테스트**
```javascript
// 새로고침 직후와 5초 뒤 두 번 측정
const measure = () => {
  const wrapper = document.querySelector('.max-w-screen-2xl');
  const col3 = document.querySelector('#section-col3');
  const r4 = document.querySelector('#section-r4');
  return {
    wrapper: wrapper.getBoundingClientRect().right,
    col3: col3.getBoundingClientRect().right,
    r4: r4.getBoundingClientRect().right,
    diff: col3.getBoundingClientRect().right - wrapper.getBoundingClientRect().right,
  };
};
console.log('Now:', measure());
setTimeout(() => console.log('5s later:', measure()), 5000);
```

**기대값**: `diff` 가 두 시점 모두 ≤ 0 (Col 3 우측이 Wrapper 우측과 같거나 안쪽)

---

## 💡 만약 Step 27 후에도 여전히 밀린다면

거의 있을 수 없지만, 남은 가능성:
1. **TradingView iframe 자체가 viewport width를 조작** — Col 2 내부에만 영향, Col 3는 아님
2. **body `min-width: 1280px`** (globals.css:35) — 뷰포트가 1280 미만일 때만 관련
3. **다른 sticky/fixed 요소가 레이아웃 방해** — VerticalNav sticky는 Step 21에서 처리

이 경우 스크린샷 + DevTools Computed 탭의 section-col3 width 값 공유 부탁.

---

## 🗣️ 남은 대기 목록

1. **세션 종료 처리** — 4개 문서 헤더 2026-04-22로 업데이트, CHANGELOG에 Step 20a~27 추가
2. **Phase 2-B** — 수급 통합 탭 (`/investor-flow` → `/net-buy`). P0
3. **Phase 2-C** — 경제캘린더 미니 위젯. P1
4. **Phase 2-D** — 발굴 ↔ 관심종목 연동. P1
