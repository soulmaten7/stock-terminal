<!-- 2026-06-07 -->
# STEP 216 — 종목 뒤로가기 '옛 홈(잔재)' 제거: /kr·/us → /market 리다이렉트 + 뒤로 링크 통일

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_216_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (버그 수정)
종목 상세에서 "뒤로"를 누르면 **옛 V4/V5 셸**(`app/(windows)/layout.tsx` — 좌측 채팅 + "Layer 2 광고·텔레그램" placeholder + 옛 종목패널)이 "이전에 만든 홈처럼" 뜨는 문제.
- **원인**: 종목 상세 "뒤로" 링크가 한국 종목을 `/kr`로 보냄 → `/kr`·`/us`는 아직 옛 `(windows)` 셸 안에서 렌더됨.
- **처방(최소·안전)**:
  1. 종목 "뒤로" 링크를 KR·US 모두 **`/market`** 으로 통일.
  2. `/kr`·`/us` 페이지를 **`/market`** 으로 리다이렉트 → 마이페이지·로그인·카드 등 **다른 곳에 남은 `/kr` 링크도 전부** 새 마켓으로 가고, 옛 셸은 어디서도 안 뜸.
- 옛 셸 파일(`(windows)/layout.tsx`, `kr/[card]`, `us/[card]`, `KrCards`/`UsCards` 등) **삭제는 이번 STEP에서 안 함** — 링크 깨질 위험. 'UI 완성 후 일괄 정리'로 미룸.

## 전제 상태
- HEAD: STEP 215 상태
- 변경 3파일: `components/stock/StockInfoPanel.tsx` · `app/(windows)/kr/page.tsx` · `app/(windows)/us/page.tsx`
- DB 변경 0

---

## 작업 1/3 — 종목 "뒤로" 링크 `/market` 통일 (`StockInfoPanel.tsx`)

**찾기:**
```tsx
      <Link href={isKr ? "/kr" : "/market"} className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary">
        <ArrowLeft size={12} /> {isKr ? "한국주식" : "마켓"}
      </Link>
```
**바꾸기:**
```tsx
      <Link href="/market" className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary">
        <ArrowLeft size={12} /> 마켓
      </Link>
```
> `isKr` 변수는 윗줄 `const isUS = !isKr;` 에서 계속 쓰이므로 미사용 경고 없음(빌드 안전).

---

## 작업 2/3 — `/kr` 옛 셸 → `/market` 리다이렉트 (`app/(windows)/kr/page.tsx` 전체 교체)

```tsx
import { redirect } from "next/navigation";

// 구 V4/V5 한국주식 셸(잔재) → 새 마켓으로 통합 리다이렉트 (STEP 216)
export default function KrPage() {
  redirect("/market");
}
```

## 작업 3/3 — `/us` 옛 셸 → `/market` 리다이렉트 (`app/(windows)/us/page.tsx` 전체 교체)

```tsx
import { redirect } from "next/navigation";

// 구 V4/V5 미국주식 셸(잔재) → 새 마켓으로 통합 리다이렉트 (STEP 216)
export default function UsPage() {
  redirect("/market");
}
```

> 둘 다 서버 컴포넌트(`"use client"` 없음)라 `redirect()` 정상 동작. 리다이렉트는 `(windows)` 레이아웃 렌더 전에 발생 → 옛 셸 안 보임.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후 (경로에 괄호가 있어 **따옴표 필수**):
```bash
cd ~/stock-terminal && git add components/stock/StockInfoPanel.tsx "app/(windows)/kr/page.tsx" "app/(windows)/us/page.tsx" && git commit -m "fix(v7): 종목 뒤로가기 옛 홈(잔재) 제거 — /kr·/us → /market 리다이렉트 + 뒤로 링크 통일 (STEP 216)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈·마켓에서 **한국 종목** 클릭 → 종목 상세 → "뒤로" → **마켓**(새 화면)로 감 (옛 채팅·Layer 2 셸 안 뜸)
- [ ] 주소창에 `/kr`·`/us` 직접 입력해도 **`/market` 으로 자동 이동**
- [ ] 미국 종목 뒤로도 정상(마켓)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- `/kr/movers` 같은 **카드 상세 하위 경로**(`(windows)/kr/[card]`)는 이번엔 그대로 둠(옛 셸). `/kr`이 리다이렉트되며 진입 동선이 사라져 사실상 고아 → 후속 일괄 삭제 대상.
- 후속 'UI 완성 후 정리' STEP 후보: `app/(windows)/` 통째 삭제 + 미사용 `KrCards`/`UsCards`/`ChatPanel`/`StockDetailPanel`/`home-v5` 잔재 정리(링크 정리 포함).
- `/us` → `/market` 은 기본 국내 뷰로 감(마켓 상단 국내/미국/글로벌 토글로 전환). 필요하면 후속에 `/market?country=US` 식 초기 필터 지원.
- **문서 TODO**(다음 갱신): STEP 215~216.

---
> STEP 216 = 옛 홈 잔재 제거(뒤로 링크 통일 + /kr·/us 리다이렉트). 전제 STEP 215. 문서 묶어 갱신.
