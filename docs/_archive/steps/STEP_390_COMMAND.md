<!-- 2026-06-24 -->
# STEP 390 — [P2 일관성] 상승/하락 색 토큰화 (unjong-up / unjong-down)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_390_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
종목 등락 색(`#F04452` 상승·`#3182F6` 하락)이 **컴포넌트에 raw hex로 하드코딩**돼 있음(MarketBoard·HomeIndexStrip). → `@theme`에 **시맨틱 토큰 `unjong-up`/`unjong-down` 추가** 후 클래스로 교체. 나중에 색 바꿀 때 한 곳만 고치면 됨.

> StockLogo의 `#F04452`/`#2563EB`는 **글자 아바타 배경색**(등락 아님)이라 이번 대상 아님. 기존 `--color-toss-*` 토큰은 그대로 둠(이번엔 추가만).

변경 3파일: `app/globals.css`, `components/toolbox/MarketBoard.tsx`, `components/layout/HomeIndexStrip.tsx`.

---

## ① `app/globals.css` — @theme에 토큰 추가
**찾기:**
```css
  --color-unjong-dark-border: #2C2C2E;
  /* STEP 129: 토스 스타일 보조 톤 */
```
**바꾸기:**
```css
  --color-unjong-dark-border: #2C2C2E;
  /* 종목 등락 색 (상승=빨강, 하락=파랑) */
  --color-unjong-up: #F04452;
  --color-unjong-down: #3182F6;
  /* STEP 129: 토스 스타일 보조 톤 */
```

## ② `components/toolbox/MarketBoard.tsx` — pctColor
**찾기:**
```tsx
  return v >= 0 ? 'text-[#F04452]' : 'text-[#3182F6]';
```
**바꾸기:**
```tsx
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
```

## ③ `components/layout/HomeIndexStrip.tsx` — 지수 등락
**찾기:**
```tsx
              <span className={`tabular-nums ${it.isUp ? "text-[#F04452]" : "text-[#3182F6]"}`}>
```
**바꾸기:**
```tsx
              <span className={`tabular-nums ${it.isUp ? "text-unjong-up" : "text-unjong-down"}`}>
```

---

## ✅ 빌드 + 검증
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 커밋. (Tailwind v4 `@theme`가 `--color-unjong-up`→`text-unjong-up` 유틸 생성.)
- ❌ 에러 → 출력 후 멈춤.

## ✅ 런타임 (새로고침)
- 종목 표·지수 티커의 **상승=빨강, 하락=파랑** 그대로 보이면 OK(색은 동일, 토큰으로만 바뀜).

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add -A && git commit -m "refactor(style): 상승/하락 색 unjong-up/down 토큰화 (MarketBoard·HomeIndexStrip) (STEP 390)" && git push
```

---

> **한 줄 요약**: 하드코딩 등락 색(`#F04452`/`#3182F6`) → `@theme` 토큰 `unjong-up`/`unjong-down`으로. 색은 동일, 관리 일원화.
