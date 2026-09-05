<!-- 2026-07-01 -->
# STEP 482 — 일본 탭 마감: 닛케이225 인덱스 티커 (+ USD/JPY)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_482_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (`app/api/yahoo/indices/route.ts` 1파일)
상단 인덱스 마퀴(`HomeIndexStrip`)에 **닛케이225(`^N225`)** + **USD/JPY** 추가. 일본 탭의 키 없이 되는 마지막 조각.
- ⚠️ API 라우트라 클린 재시작 필요.

---

## 1) `app/api/yahoo/indices/route.ts` — 심볼 추가

**찾을 것:**
```ts
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "USDKRW=X", name: "USD/KRW" },
```
**바꿀 것:** (닛케이=아시아 지수 옆, USD/JPY=환율 옆)
```ts
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "^N225", name: "Nikkei 225" },
  { symbol: "USDKRW=X", name: "USD/KRW" },
  { symbol: "JPY=X", name: "USD/JPY" },
```

---

## 2) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 3) 검증 (localhost:3333)
- [ ] 상단 마퀴에 **Nikkei 225** 값 + **USD/JPY** 노출(스크롤에 흘러감).

## 4) 커밋
```bash
git add app/api/yahoo/indices/route.ts && git commit -m "feat(jp): 상단 인덱스에 닛케이225(^N225) + USD/JPY 추가 (STEP 482)" && git push
```

## ⚠️ 일본 탭 현황 — 이걸로 "키 없이 되는 부분" 완료
- ✅ 링크 허브(59) · ✅ 종목·상품(¥) · ✅ 피드 5탭(뉴스·기업재무·리포트·ETF·공모주) · ✅ 인덱스 티커 · ✅ 통화(엔)
- ⏸ **공시(EDINET)·거시(BOJ/e-Stat) 라이브 피드는 API 키 필요** — EDINET API v2·e-Stat 모두 사용자 키 발급 후 진행(현재는 이 탭들에 링크만 표시, 이미 있음).
- (선택 폴리시) 종목명 앞 `.T` 접미어 숨김 — 나중에 JpMarketBoard 표시부에서 `.replace(/\.T$/, '')`.

## ▶ 다음 국가 후보
일본 사실상 완료 → 플레이북 순서상 **3순위 다음 = 중국/홍콩** 또는 **인도**. 각 탭은 같은 순서(link_hub → 배관 → 종목보드 → 피드 → 인덱스)로 진행.
