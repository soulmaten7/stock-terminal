<!-- 2026-06-23 -->
# STEP 370 — [코드 헬스] 죽은 코드 정리 (legacy 라우트·컴포넌트 삭제)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_370_COMMAND.md 파일 내용대로 실행해줘
```

## 🔴 실행 에이전트 주의 (안전망)
- 이 STEP은 **대량 삭제**다. 순서대로: ① HomeIndexStrip 보존 이동 + import 수정 ② legacy 라우트 삭제 ③ legacy 컴포넌트 삭제 ④ **`npm run build`** ⑤ **빌드 통과 시에만 커밋·푸시.**
- ⚠️ **빌드 실패 시 커밋하지 말 것.** 에러 메시지(`Cannot find module '@/components/...'` 등)를 그대로 출력하고 멈춰라. (어떤 디렉토리가 아직 쓰이는지 그 메시지로 판단.)

---

## 🎯 목표
옛 버전(네이버클론·V5/V6 종목상세) 잔재 제거. 현재 게이트웨이(`app/page.tsx`→ToolboxClient+HomeIndexStrip / `app/layout.tsx`→Header·Footer·AuthProvider·LayoutShell)와 무관한 **죽은 라우트 11개 + 죽은 컴포넌트 ~27개** 삭제. 유일 활성 얽힘 = `home-v6/HomeIndexStrip`(지수티커) → 보존 이동.
- 빌드 페이지 수↓, 유지보수 혼란↓, 향후 공유 유틸/타입 변경 시 죽은 코드발 빌드 깨짐 위험 제거.
- **유지**: `components/{toolbox,layout,auth,ui,common,admin,favorites}` + 이동한 HomeIndexStrip. **API 라우트는 이번에 건드리지 않음**(후속).

---

## ① HomeIndexStrip 보존 + import 수정

```bash
cd ~/stock-terminal
git mv components/home-v6/HomeIndexStrip.tsx components/layout/HomeIndexStrip.tsx
```

`app/page.tsx` **찾기:**
```tsx
import HomeIndexStrip from "@/components/home-v6/HomeIndexStrip";
```
**바꾸기:**
```tsx
import HomeIndexStrip from "@/components/layout/HomeIndexStrip";
```

## ② legacy 라우트 삭제 (이미 STEP 362에서 홈 리다이렉트됨)

```bash
cd ~/stock-terminal
git rm -r "app/(windows)" app/calendar app/discussion app/global app/market app/news app/product app/products app/room app/rooms app/stock
```

## ③ legacy 컴포넌트 디렉토리 삭제 (현재 게이트웨이 미사용)

```bash
cd ~/stock-terminal
git rm -r \
  components/advertiser components/analysis components/analysis-page components/briefing \
  components/calendar components/chart components/dashboard components/disclosures \
  components/header components/movers components/net-buy components/news \
  components/orderbook components/partners components/payment components/ticks \
  components/watchlist components/home-v5 components/cards components/sidebar \
  components/platform components/market components/stocks components/stock \
  components/sidepanel components/global components/home-v6
```

## ④ 빌드 검증 (필수)

```bash
cd ~/stock-terminal && npm run build
```
- ✅ **무에러** → ⑤로.
- ❌ **에러(`Cannot find module '@/components/...'`)** → **커밋하지 말고** 그 모듈명을 출력하고 멈춰라. (그 디렉토리는 활성에서 아직 쓰임 → Cowork가 삭제목록에서 제외 지시.)

검증(빌드 후 dev):
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
- 홈(`/`) 정상 — 지수티커(상단 마퀴)·게이트웨이 탭 그대로.
- `/market`·`/stock/005930`·`/room/1` 등 옛 주소 → 홈 리다이렉트(STEP 362 그대로, 404 아님).

## ⑤ 커밋·푸시 (④ 통과 시에만)

```bash
cd ~/stock-terminal && git add -A && git commit -m "chore(cleanup): 죽은 legacy 라우트 11 + 컴포넌트 27 삭제, HomeIndexStrip 보존 이동 (STEP 370)" && git push
```

---

> **한 줄 요약**: 옛 V5/V6·네이버클론 잔재(라우트 11+컴포넌트 27) 삭제, 지수티커만 보존 이동. **빌드 통과 시에만 커밋**(실패하면 모듈명 출력 후 멈춤). API 라우트 정리는 후속.
