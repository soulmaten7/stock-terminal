<!-- 2026-06-19 -->
# STEP 284 — [V7] 실시간 지수 티커 복귀 (홈 헤더 밑 풀폭)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_284_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 283(`0158d9a`). 빌드 ✓.
- (참고: 그 사이 link_hub 카테고리 보강 8건은 DB에 직접 반영됨 — git 변경 아님.)

---

## 🎯 목표

예전 홈에 있던 **실시간 지수 티커**(`HomeIndexStrip`, `/api/yahoo/indices`)를 새 게이트웨이 홈에 **헤더 밑 풀폭 띠**로 복귀. 종목·순서는 **기존 그대로**(다 뜨게).

> 컴포넌트·API 그대로 살아있음 → 2군데만 수정.

---

## 📄 파일 1 — `app/page.tsx` (티커 추가)

### (1-A) import 추가
**찾기:**
```tsx
import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
```
**바꾸기:**
```tsx
import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
import HomeIndexStrip from "@/components/home-v6/HomeIndexStrip";
```

### (1-B) 렌더 — 게이트웨이 위에 티커(풀폭)
**찾기:**
```tsx
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <ToolboxClient initialCategories={categories} isLoggedIn={!!user} />
    </div>
  );
```
**바꾸기:**
```tsx
  return (
    <>
      <HomeIndexStrip />
      <div className="mx-auto max-w-7xl px-6 py-6">
        <ToolboxClient initialCategories={categories} isLoggedIn={!!user} />
      </div>
    </>
  );
```

---

## 📄 파일 2 — `components/home-v6/HomeIndexStrip.tsx` (옛 컨테이너용 음수마진 제거)

> 예전엔 px-6 py-5 컨테이너 안에 있어 `-mx-6 -mt-5`로 풀폭을 만들었는데, 이제 페이지 최상단 직접 배치라 음수마진 빼야 정상 풀폭.

**찾기:**
```tsx
    <div className="sticky top-0 z-30 -mx-6 -mt-5 mb-4 flex h-9 items-center border-b border-unjong-border bg-unjong-surface/95 backdrop-blur">
```
**바꾸기:**
```tsx
    <div className="sticky top-0 z-30 flex h-9 items-center border-b border-unjong-border bg-unjong-surface/95 backdrop-blur">
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 홈 헤더 밑에 **지수 티커 띠**가 풀폭으로 흐르는지(코스피·코스닥·S&P·나스닥·환율·비트코인 등 기존 그대로).
2. 스크롤 시 티커가 상단에 붙는지(sticky).
3. 어긋남·음수마진 잘림 없는지.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 실시간 지수 티커 홈 복귀 (헤더 밑 풀폭) (STEP 284)" && git push
```

---

> **한 줄 요약**: HomeIndexStrip을 새 홈 헤더 밑 풀폭으로 복귀(음수마진만 정리), 종목·순서 기존 그대로.
