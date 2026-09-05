<!-- 2026-06-24 -->
# STEP 388 — [🧹 코드 헬스] 죽은 코드 2차 정리 (미사용 26파일 + /api/likes)

> ⚠️ **STEP 387 먼저 실행 후** 이거. 모든 대상은 Cowork이 **import 0건 + 파일 존재**를 grep로 재확인함(오탐 제거). **빌드 통과가 최종 안전망** — 실패하면 그 파일은 실은 쓰임 → 복구.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_388_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
감사에서 나온 **검증된 죽은 코드** 일괄 삭제: 옛 기능 잔재 스토어 7 · 옛 네비/미사용 컴포넌트 7 · 옛/중복/깨진 lib 8 · 미사용 타입 4 · 죽은 라우트 `/api/likes`(♥ 제거됨). `lib/watchlist.ts`는 없는 테이블 `watchlists` 조회하는 깨진 코드(진짜 관심종목은 `/api/watchlist`).
- **살려두는 것(삭제 X)**: `lib/utils/format.ts`(mypage 사용)·`lib/constants/linkHub.ts`·`types/user.ts`·`components/ui/StockLogo.tsx`. ETF/ETN/리츠 성과 라우트·room_likes 테이블도 **사용 중이라 보존**.

---

## ① 삭제
```bash
cd ~/stock-terminal

# 스토어 7 (옛 채팅·차트·심볼 기능 잔재)
git rm stores/chatStore.ts stores/selectedSymbolStore.ts stores/tagMapStore.ts \
       stores/unjongSelectedSymbolStore.ts stores/watchlistStore.ts stores/nicknameStore.ts stores/chartRangeStore.ts

# 컴포넌트 7 (옛 네비·티커바·미사용 UI)
git rm components/layout/TopNav.tsx components/layout/RightFixedNav.tsx components/layout/TickerBar.tsx \
       components/common/ComingSoonCard.tsx components/common/DisclaimerBanner.tsx components/common/WidgetDetailStub.tsx \
       components/ui/State.tsx

# lib 8 (옛 결제·채팅·차트계산·깨진 watchlist·중복 format·미사용 분류)
git rm lib/watchlist.ts lib/payment.ts lib/format.ts lib/dart-classify.ts \
       lib/constants/stock-tabs.ts lib/utils/stockCalculations.ts lib/chat/moderation.ts lib/chat/realtime.ts

# 타입 4 (미사용)
git rm types/advertiser.ts types/chat.ts types/api.ts types/stock.ts

# 죽은 API 라우트 (♥ 제거됨, 호출처 0)
git rm -r app/api/likes
```

## ② 빌드 검증 (★ 최종 안전망)
```bash
cd ~/stock-terminal && npm run build
```
- ✅ **무에러** → 커밋.
- ❌ `Cannot find module '@/...'` → 그 파일은 **실제 사용 중**(오탐). 해당 파일만 복구하고 알려줘:
  ```bash
  git checkout HEAD -- <그_파일경로>
  ```
  그리고 어떤 파일이 어디서 쓰였는지 출력 후 멈춤(커밋 금지).

## ③ 커밋·푸시 (빌드 통과 시에만)
```bash
cd ~/stock-terminal && git add -A && git commit -m "chore(cleanup): 죽은 코드 2차 정리 — 미사용 스토어7·컴포넌트7·lib8·타입4 + /api/likes 삭제 (STEP 388)" && git push
```

---

> **한 줄 요약**: 감사에서 검증된 미사용 26파일 + 죽은 `/api/likes` 일괄 삭제. 빌드 통과(오탐 안전망) 시에만 커밋.
