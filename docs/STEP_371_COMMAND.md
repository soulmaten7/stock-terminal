<!-- 2026-06-23 -->
# STEP 371 — [티커] 지수 이름 영어화

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_371_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
상단 지수 티커 이름을 한글→영어로(universal — 한국/미국 토글과 무관하게 영어 하나로 통일, 국가 분리 불필요).

> 변경 1파일: `app/api/yahoo/indices/route.ts`(이름 매핑). ⚠️ **API 라우트(+모듈 캐시) → dev 서버 클린 재시작 필수.**

---

## 📄 `app/api/yahoo/indices/route.ts`

**찾기:**
```ts
const INDEX_SYMBOLS = [
  { symbol: "^KS11", name: "코스피" },
  { symbol: "^KQ11", name: "코스닥" },
  { symbol: "USDKRW=X", name: "원/달러" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "나스닥" },
  { symbol: "^DJI", name: "다우" },
  { symbol: "^SOX", name: "필라델피아 반도체" },
  { symbol: "^VIX", name: "VIX" },
  { symbol: "GC=F", name: "금" },
  { symbol: "BTC-USD", name: "비트코인" },
];
```
**바꾸기:**
```ts
const INDEX_SYMBOLS = [
  { symbol: "^KS11", name: "KOSPI" },
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "USDKRW=X", name: "USD/KRW" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^SOX", name: "SOX" },
  { symbol: "^VIX", name: "VIX" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "BTC-USD", name: "Bitcoin" },
];
```

---

## ✅ 검증 (API 라우트 → 클린 재시작 필수)
```bash
npm run build
```
빌드 무에러.

dev 서버 **클린 재시작**:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저:
- 상단 티커 = **KOSPI · KOSDAQ · USD/KRW · S&P 500 · NASDAQ · Dow Jones · SOX · VIX · Gold · Bitcoin**(전부 영어, 등락 색·숫자 그대로).

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/yahoo/indices/route.ts && git commit -m "feat(ticker): 지수 티커 영어 이름화 (STEP 371)" && git push
```

---

> **한 줄 요약**: 지수 티커 이름 한글→영어(universal). 새 라우트라 클린 재시작 필수.
