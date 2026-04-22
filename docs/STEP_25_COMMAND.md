# STEP 25 — 대시보드 그리드 minmax 축소 (사이드바 포함 가용폭 기준 재조정)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 24 완료 (Footer 정렬 OK), 대시보드 R4가 박스 밖으로 40px 튀어나오는 문제 확인됨

---

## 📐 DevTools 실측 데이터 (진단 근거)

```
Wrapper (1536 박스): width=1248  right=1264
Main:               width=1203  right=1264 ✓
Footer:             width=1248  right=1264 ✓
R1 Col1:            left=68     width=280 (minmax 최소값 적중)
R4 (5위젯):          left=68     right=1304  width=1236  ❌ 튀어나옴
뷰포트:              866 (DevTools 열린 상태)
```

**R4.right(1304) - Wrapper.right(1264) = 40px 오버플로우**

---

## 🧮 왜 튀어나오나 — Grid minmax 동작

현재 `components/home/HomeClient.tsx`:
```ts
gridTemplateColumns: 'minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)'
gap: 8
```

CSS Grid의 minmax는 **최소값을 무조건 보장**함. 부모가 작아도 컬럼이 줄어들지 않고 **부모를 뚫고 나감**.

| 요소 | 값 |
|---|---|
| Col1 min | 280px |
| Col2 min | 640px |
| Col3 min | 300px |
| gap × 2 | 16px |
| **Grid 최소 합** | **1236px** |
| Main 가용 | 1203px |
| HomeClient px-2 | -13px |
| **실제 사용 가능** | **1190px** |
| **오버플로우** | **46px** |

사용자 원래 말: *"사이드바가 들어온 걸 감안하고 기존 대시보드 비율 나눴던저에서 가로폭을 다시 조율"* — 바로 이 min값들을 사이드바 포함 환경에 맞춰 줄여야 함.

---

## 🔧 파일 변경 (1개 파일, 1줄)

### `components/home/HomeClient.tsx`

**Edit — outer grid의 gridTemplateColumns (43번 줄):**

```
old_string:
        gridTemplateColumns: 'minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)',

new_string:
        gridTemplateColumns: 'minmax(240px,2.5fr) minmax(560px,6.5fr) minmax(280px,3fr)',
```

**새 최소값 합**: 240 + 560 + 280 + 16 = **1096px** (Main 1190 안에 94px 여유)

**비율 유지**: 2.5fr : 6.5fr : 3fr (전체 12 = 변경 없음). 가용 폭에서는 기존 비율 그대로 적용되고, 아주 좁을 때만 min값으로 내려감.

**각 컬럼별 변화:**
- Col 1 (채팅/발굴/관심종목): 280 → 240 (-40px, 여전히 채팅 입력 읽기 가능)
- Col 2 (차트/호가·체결): 640 → 560 (-80px, TradingView 차트 최소 500px 수준 보장)
- Col 3 (뉴스/DART): 300 → 280 (-20px, 뉴스 제목 2줄 유지)

---

## 🔒 변경하지 않는 파일

- `components/layout/LayoutShell.tsx` — Step 22 상태 유지
- `components/layout/VerticalNav.tsx` — Step 21 `self-start` 유지
- `components/layout/Footer.tsx` — Step 24 미러링 구조 유지 (Footer 정렬은 OK, 이번 문제와 무관)
- `app/layout.tsx` — 건드리지 않음
- HomeClient.tsx의 **다른 모든 설정** — gridTemplateRows, Col1 내부 비율(45:10:45), Col2 내부 비율, Col3 내부 비율, R4 1:1:1:1:1 모두 그대로

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
fix: shrink dashboard grid mins to fit post-sidebar main width

Root cause of the "dashboard sticking out" issue: HomeClient's
outer gridTemplateColumns declared minmax minimums (280/640/300)
that summed to 1236px + 16px gap = 1252px total minimum. After
the vertical sidebar (~46px in this 13px-rem context) takes its
slice of the 1536 box, main only has ~1190px of usable width.
Grid's minmax forces columns to their minimum regardless of
parent width, so the whole grid spilled ~40px past the box edge.

Reduce the minimums to 240/560/280 (sum 1080 + 16 = 1096) so
the grid fits comfortably inside main, with ~94px of safety
margin for narrower viewports. Fractional ratios 2.5:6.5:3
remain unchanged, so the normal-width layout is visually
identical — only the overflow-preventing floor moved down.

This is the actual fix the user flagged back in Steps 21-24:
"sidebar came inside the layout, so the dashboard ratios need
to be recalibrated for the post-sidebar available width."
Footer work in Steps 22-24 addressed a different symptom.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**오버플로우 해결 (핵심)**
1. R4 (상승/하락~글로벌지수) 5개 위젯 오른쪽 끝이 박스(1536) 안에 들어와 있음
2. R4 오른쪽 끝 ≤ Footer 오른쪽 끝 (같거나 안쪽)
3. 가로 스크롤바 없음 (1280px 이상 뷰포트에서)

**회귀 방지**
4. Step 24 Footer 정렬 그대로 유지 (Footer 그리드 left = R1/R4 left = 68px)
5. Col 1 채팅 입력창, 종목발굴 KOSPI/KOSDAQ 버튼, 종목 검색창 가독성 유지
6. Col 2 차트 정상 렌더 (TradingView 위젯 깨지지 않음)
7. Col 3 뉴스 제목 2~3줄, DART 공시 제목 가독성 유지
8. R4 5개 위젯 각각 테이블 컬럼 레이아웃 정상

**DevTools 재측정 (선택)**
9. Console에서 동일 진단 스크립트 재실행 → R4.right ≤ Wrapper.right 확인

---

## 🗣️ 남은 대기 목록

1. **Col 3 뉴스/DART 위젯 내부 레이아웃** — 원래 첫 불만(widget 내부 정렬). Step 25 후 스크린샷 재확인하고 남아있으면 Step 26에서 처리
2. **세션 종료 처리** — 4개 문서 헤더 날짜 업데이트, CHANGELOG에 Step 20a~25 추가
3. **Phase 2-B** — 수급 통합 탭 (`/investor-flow` → `/net-buy`). P0
4. **Phase 2-C** — 경제캘린더 미니 위젯. P1
5. **Phase 2-D** — 발굴 ↔ 관심종목 연동. P1

---

## 💡 Step 25 후에도 문제 있으면

DevTools에서 다음 수치 재측정해서 공유:
```javascript
const wrapper = document.querySelector('.max-w-screen-2xl');
const r4 = document.querySelector('#section-r4');
const get = (el, name) => {
  const r = el.getBoundingClientRect();
  return `${name}: left=${Math.round(r.left)}, right=${Math.round(r.right)}, width=${Math.round(r.width)}`;
};
console.log(get(wrapper, 'Wrapper'));
console.log(get(r4, 'R4'));
```

**기대값**: R4.right ≤ Wrapper.right
