<!-- 2026-06-20 -->
# STEP 329 — [UI] 종목 표 행 높이 = 증권사 행 높이 (로고 22→24)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_329_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
좌측 종목 표 행과 우측 증권사 행이 **아래로 갈수록 어긋나는 문제** 해결.
- 원인: 종목 로고 22px vs 증권사 파비콘 24px → 행마다 ~2px 차이 누적.
- 해결: 종목 로고를 **24px**로 맞춤(증권사 파비콘과 동일) → 두 리스트 행 높이 일치 → 끝까지 정렬.

> 변경: `components/toolbox/MarketBoard.tsx` 1곳. (1년 컬럼 영향 없음 — 종목명 칸이 가변폭이라 흡수)

---

## 📄 `components/toolbox/MarketBoard.tsx`

**찾기:**
```tsx
                        <StockLogo code={r.symbol} name={r.name} size={22} />
```
**바꾸기:**
```tsx
                        <StockLogo code={r.symbol} name={r.name} size={24} />
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러.

개발 서버: 종목 표 행과 증권사 행이 **1행부터 끝까지 같은 높이로 나란히** 정렬(어긋남 없음).

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/MarketBoard.tsx && git commit -m "ui(market): 종목 표 로고 24px로 — 증권사 행과 높이 일치(정렬 어긋남 해소) (STEP 329)" && git push
```

---

> **한 줄 요약**: 종목 로고 22→24로 증권사 행과 높이 통일 → 좌우 리스트 정렬 일치.
