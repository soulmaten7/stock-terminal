# STEP 26 — minmax floor 제거 (사용자 직관 반영: 사이드바 포함 확정 fit)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 25 완료 (outer grid minmax 240/560/280). R4 fit OK. 하지만 R1-R3 Col 3 (뉴스/DART)는 여전히 사이드바 w-14 (~45px)만큼 튀어나옴.

---

## 🧠 사용자 관찰 — 정확함

> "R1~3에 사이드바가 포함됐는데, 그거 포함해서 계산한게 맞아? 딱 그만큼 사이즈만 튀어나와있는거같은데?"

**맞습니다.** `app/layout.tsx` 구조:
```
max-w-screen-2xl (1536px)
  ├ Header         ← 1536 폭
  ├ TickerBar      ← 1536 폭
  └ LayoutShell
      ├ VerticalNav (w-14 = 45.5px)
      └ main (flex-1 min-w-0)      ← 1536 − 45.5 = 1490.5px (실제 HomeClient 공간)
          └ HomeClient
```

현재 HomeClient:
```ts
gridTemplateColumns: 'minmax(240px,2.5fr) minmax(560px,6.5fr) minmax(280px,3fr)'
```

**문제**: minmax(Xpx, Yfr)에서 X는 **floor** 역할. 자식의 min-content가 X를 초과하면 track은 확장되어 **main 밖으로 넘침**. `min-w-0`는 main에만 있고, grid 내부에선 무력함. 즉 HomeClient가 Main 1490.5 안에 갇혀 있어야 하는데, 자식 min-content 요구가 크면 그만큼 Main 경계를 뚫고 나감. 그 초과분이 사용자 눈에 "사이드바만큼 튀어나온" 것처럼 보임.

---

## 🔧 해결 — minmax(0, Nfr)

**min을 0으로 바꾸면** grid track은 **부모 폭(Main) 안에서만** fr 비율로 분배됨. 자식 min-content가 어떻든 track이 부모 밖으로 나갈 수 없음.

- 2.5 : 6.5 : 3 fr 비율은 **그대로 유지**
- Main 1490px이든 1190px이든, 항상 해당 폭을 2.5:6.5:3으로 분할
- 자식 widget은 WidgetCard의 `overflow-hidden` 덕에 안에서 깔끔하게 clip됨 (내용 일부는 잘릴 수 있으나 **박스 경계는 절대 뚫지 않음**)

### `components/home/HomeClient.tsx` — 43번 줄 1줄 수정

```
old_string:
        gridTemplateColumns: 'minmax(240px,2.5fr) minmax(560px,6.5fr) minmax(280px,3fr)',

new_string:
        gridTemplateColumns: 'minmax(0,2.5fr) minmax(0,6.5fr) minmax(0,3fr)',
```

**비율별 실제 폭 예상** (Main 1490px 기준, gap 16 제외):
- Col 1 (2.5/12): 1474 × 2.5/12 = **307px** (기존 280 수준 유지)
- Col 2 (6.5/12): 1474 × 6.5/12 = **799px** (기존 640→560 보다 넉넉)
- Col 3 (3/12):   1474 × 3/12   = **369px** (기존 300→280 보다 넉넉)

→ 실제로 Main 가득 채우면서도 비율 유지. 작은 뷰포트에서도 비례 축소.

---

## 🔒 변경하지 않는 파일

- `components/layout/LayoutShell.tsx` — 유지
- `components/layout/VerticalNav.tsx` — 유지
- `components/layout/Footer.tsx` — Step 24 구조 유지
- `components/home/HomeClient.tsx`의 **다른 모든 설정** — gridTemplateRows, Col1 45:10:45, Col2 1:1, Col3 1:1, R4 1:1:1:1:1, 각 section div의 minHeight: 0 모두 그대로
- `app/layout.tsx` — 건드리지 않음

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. components/home/HomeClient.tsx Edit (43번 줄 gridTemplateColumns)

# 2. 빌드 확인
npm run build 2>&1 | tail -10

# 3. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 8
tail -n 15 /tmp/next-dev.log

# 4. 커밋 + 푸시
git add components/home/HomeClient.tsx

git commit -m "$(cat <<'EOF'
fix: set grid track min to 0 so dashboard never overflows main width

Step 25 reduced the outer grid minmax floors from 280/640/300 to
240/560/280, which fixed R4 but left R1-R3 Col 3 (뉴스/DART) still
overflowing — by almost exactly the sidebar w-14 (~45px), as the
user correctly observed.

Root cause: minmax(Xpx, Yfr) treats X as a hard floor. When a
child's min-content width exceeds X, the grid track expands to
accommodate it, pushing past the parent's available width. The
main element has min-w-0, but that only stops main from growing —
grid tracks inside main can still blow past main's right edge if
their minimums force it. News/DART widgets' min-content (flex gap
items, Korean text runs, table rows) exceeded 280px, so Col 3
expanded and sticks out.

Switch all three minmax minimums to 0. With minmax(0, Nfr), the
grid algorithm distributes the parent's actual available width
across tracks strictly by fr ratio — 2.5:6.5:3 — and never allows
a track to grow beyond its fr share, regardless of child content.
WidgetCard's overflow-hidden handles any content that wants more
room: it clips cleanly at the card boundary.

Ratios stay 2.5:6.5:3 (unchanged), so when main has room the
layout looks identical to Step 25. The difference only shows at
narrow widths — where previously the grid spilled out, now it
compresses proportionally.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**오버플로우 완전 해결 (핵심)**
1. R1-R3 Col 3 뉴스속보 위젯 우측 = 박스(1536) 우측 (밖으로 나오지 않음)
2. R1-R3 Col 3 DART 공시 위젯 우측 = 박스 우측
3. Col 3 우측 = R4 우측 = Footer 우측 (모두 정렬)
4. **가로 스크롤바 없음** (어떤 뷰포트 크기에서도)

**시각 비율 유지**
5. 화면이 넓을 때 Col 1 : Col 2 : Col 3 ≈ 2.5 : 6.5 : 3 (시각적으로 기존과 거의 동일)
6. 각 위젯 내용 잘 보임 (Col 1 채팅, Col 2 차트, Col 3 뉴스/DART)

**DevTools 재측정**
```javascript
const wrapper = document.querySelector('.max-w-screen-2xl');
const main = document.querySelector('main');
const r1col3 = document.querySelector('#section-col3');
const r4 = document.querySelector('#section-r4');
const news = document.querySelector('#section-news');
const get = (el, name) => {
  const r = el.getBoundingClientRect();
  return `${name}: left=${Math.round(r.left)}, right=${Math.round(r.right)}, width=${Math.round(r.width)}`;
};
console.log(get(wrapper, 'Wrapper'));
console.log(get(main, 'Main'));
console.log(get(r1col3, 'Col3'));
console.log(get(news, 'News'));
console.log(get(r4, 'R4'));
```

**기대값**: Col3.right = R4.right = News.right ≤ Main.right ≤ Wrapper.right

---

## 💡 만약 Col 3 위젯 내용이 너무 좁아져 보이면

fr 비율 조정으로 간단히 해결:
```ts
// Col 3를 조금 더 넓게: 3 → 3.5
gridTemplateColumns: 'minmax(0,2.5fr) minmax(0,6.0fr) minmax(0,3.5fr)',
```

하지만 **overflow는 이제 원천적으로 불가능**하므로 비율 조정은 순수 미적 판단.

---

## 🗣️ 남은 대기 목록

1. **세션 종료 처리** — 4개 문서 헤더 2026-04-22로 업데이트, CHANGELOG에 Step 20a~26 추가
2. **Phase 2-B** — 수급 통합 탭 (`/investor-flow` → `/net-buy`). P0
3. **Phase 2-C** — 경제캘린더 미니 위젯. P1
4. **Phase 2-D** — 발굴 ↔ 관심종목 연동. P1
