<!-- 2026-05-27 -->
# STEP 95-A — V3 헤더 잔재 제거 (핫픽스)

> **목표**: 운종 3창 페이지에서 V3 헤더 잔재 (STOCK TERMINAL 로고·옛 글로벌 티커·옛 네비) 제거. 운종 헤더만 보이게.
> **세션**: #25
> **전제**: STEP 94 완료 (`954e59f`), Layer 0 구조 완성
> **유형**: 핫픽스 (작업 시간 30분)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_95A_COMMAND.md 파일 내용대로 실행해줘
```

---

## 발견된 문제

브라우저에서 `/scalper` 접속 시 화면 상단에 V3 헤더가 그대로 표시됨:

```
[V3 잔재 1] STOCK TERMINAL · 검색 · 한국기 · 알림 · 즐겨찾기 · 프로필
[V3 잔재 2] WTI · GOLD · BTC · ETH · ...    ← V3 글로벌 티커
[V3 잔재 3] 관심종목 · 종목발굴 · 차트 · 호가창 · 체결창 · 급락 · 거래 · 수급 · 글로벌지수 · 섹터지도 · 테마주 · 뉴스속보 · 공시 · 경제캘린더 · 장전브리핑 · 참고사이트
[운종 헤더 (STEP 90)] 雲從 UNJONG · 검색 · KOSPI/KOSDAQ/S&P/NASDAQ/USD-KRW · 알림 · 프로필
[운종 3창 박스] 단타창 · 장타창 · 미국주식창
```

**헤더가 4단으로 겹쳐 보임.** STEP 94 에서 FloatingChat 만 정리하고 V3 메인 헤더는 못 잡았음.

---

## 핵심 원칙

1. **운종 3창 페이지 (`/scalper` `/longterm` `/us`) 에서는 V3 헤더 안 보임**
2. **`/dashboard` (V3 보존 페이지) 에서는 V3 헤더 그대로** — V3 호환성 보장
3. **V3 헤더 컴포넌트 파일 자체는 삭제 X** — dashboard 에서 사용 중
4. **운종 3창은 `(windows)/layout.tsx` 가 자기 헤더(UnjongHeader) 만 표시**

---

## 작업 1 — V3 헤더 컴포넌트 위치 진단

```bash
cd ~/stock-terminal
# STOCK TERMINAL 텍스트 어디 있는지
grep -rn "STOCK TERMINAL\|STOCKTERMINAL\|Stock Terminal" --include="*.tsx" --include="*.ts" app components 2>/dev/null | head -20

# 운종 외 옛 헤더 컴포넌트 후보 찾기
ls components/ 2>/dev/null
grep -rn "WTI\|GOLD\|BTC" --include="*.tsx" --include="*.ts" components 2>/dev/null | head -10

# root layout 내용 확인
cat app/layout.tsx | head -80

# (windows) layout 내용 확인 — 정상인지
cat "app/(windows)/layout.tsx" | head -40
```

**예상 발견**:
- `app/layout.tsx` (root) 에 V3 헤더 컴포넌트 import + 사용
- 또는 V3 헤더가 `app/dashboard/page.tsx` (HomeClient) 안에 있어서 dashboard 에는 정상이지만 root layout 어딘가에도 있을 수 있음
- "STOCK TERMINAL" 문자열은 STEP 88 에서 운종으로 일괄 변경됐을 텐데, 컴포넌트 파일이 있다면 운종으로 바뀌었어야 함

→ **grep 결과로 정확한 위치 파악 후 처리**.

---

## 작업 2 — 시나리오별 처리

### 시나리오 A — V3 헤더가 `app/layout.tsx` 에 직접 import (가장 가능성 높음)

`app/layout.tsx` 에서 V3 헤더 import + 사용 라인 제거:

```diff
- import { OldHeader } from "@/components/OldHeader"; // 또는 비슷한 이름
- import { OldTickerBar } from "@/components/OldTickerBar";
- import { OldNavigation } from "@/components/OldNavigation";

  export default function RootLayout({ children }) {
    return (
      <html lang="ko">
        <body>
-         <OldHeader />
-         <OldTickerBar />
-         <OldNavigation />
          {children}
        </body>
      </html>
    );
  }
```

⚠️ 정확한 컴포넌트 이름은 grep 결과에 따라 다름. `Header`, `MainHeader`, `Navigation`, `TickerBar`, `GlobalIndicesWidget` 등 가능성.

V3 헤더가 제거되면 `/dashboard` 페이지에서도 안 보임 → 다음 단계로 dashboard 페이지에 복원.

### 시나리오 B — V3 헤더가 HomeClient 또는 dashboard 페이지 안에 (덜 가능성)

그러면 운종 3창에는 영향 X. 화면에 V3 잔재 보이는 게 다른 원인. 다시 진단:
- root layout 의 `<body>` 직속 내용 다시 확인
- (windows)/layout.tsx 에 모르고 추가한 import 있는지 확인

이 경우 Cowork 에게 진단 결과 보고 후 추가 지시 받기.

### 시나리오 C — V3 헤더 파일이 운종 헤더와 별도로 존재

`components/` 아래 `Header.tsx`, `MainHeader.tsx` 등 V3 시절 파일이 있고 root layout 에서 import 되는 경우. 시나리오 A 와 같은 처리.

---

## 작업 3 — `/dashboard` 에 V3 헤더 복원 (시나리오 A 후속)

root layout 에서 V3 헤더를 뺐으면 `/dashboard` 도 같이 사라짐. V3 호환 위해 dashboard 페이지(또는 dashboard layout)에 추가.

### 옵션 1: `app/dashboard/layout.tsx` 신설 (권장 — 깔끔)

```tsx
import type { ReactNode } from "react";
import { OldHeader } from "@/components/OldHeader"; // 실제 V3 헤더 컴포넌트
import { OldTickerBar } from "@/components/OldTickerBar";
import { OldNavigation } from "@/components/OldNavigation";

/**
 * V3 보존 페이지 (/dashboard) 전용 레이아웃.
 * 운종 3창 (/scalper /longterm /us) 에는 적용 안 됨.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OldHeader />
      <OldTickerBar />
      <OldNavigation />
      {children}
    </>
  );
}
```

### 옵션 2: dashboard 페이지에 직접 import (단순)

`app/dashboard/page.tsx` 안에서 페이지 컴포넌트 최상단에 V3 헤더 컴포넌트 렌더링.

→ **옵션 1 (dashboard layout) 권장**. Next.js App Router 표준 패턴.

---

## 작업 4 — `app/(windows)/layout.tsx` 점검 (변경 0 건일 가능성)

이 파일은 STEP 90 에서 UnjongHeader 적용 완료. 변경 불필요. 단, 검증:

```bash
cat "app/(windows)/layout.tsx" | grep -E "import|Header|Navigation"
```

확인:
- `UnjongHeader` 만 import 되어 있어야 함
- 다른 V3 헤더 컴포넌트 import 0건

만약 V3 헤더가 여기도 들어가 있으면 제거.

---

## 작업 5 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공
- TypeScript 오류 0
- V3 헤더 컴포넌트가 dashboard layout 에서 정상 import (옵션 1 적용 시)
- 운종 3창 라우트들 정상

---

## 작업 6 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add app docs/STEP_95A_COMMAND.md
git status
git commit -m "fix: STEP 95-A - V3 헤더 잔재 제거 (핫픽스)

문제: 운종 3창 페이지에 V3 헤더 4단 겹침 (STOCK TERMINAL 로고
+ 옛 글로벌 티커 + 옛 네비) 발생.

원인: app/layout.tsx (root) 에 V3 헤더 컴포넌트 import 잔존.

조치:
- root layout 에서 V3 헤더 import 제거
- app/dashboard/layout.tsx 신설 — V3 호환 위해 V3 헤더 복원
- 운종 3창 (/scalper /longterm /us) 은 UnjongHeader 만 표시
- /dashboard 는 V3 헤더 그대로 유지

결과: 운종 3창 헤더 = UnjongHeader 단독. 시각 정체성 회복."
git push
```

---

## 검증 체크리스트

- [ ] `app/layout.tsx` 에서 V3 헤더 import 제거 (또는 원래 없으면 그대로)
- [ ] `app/dashboard/layout.tsx` 신설 OR dashboard 페이지에 V3 헤더 추가
- [ ] `/scalper` `/longterm` `/us` 에서 V3 헤더 안 보임
- [ ] `/dashboard` 에서는 V3 헤더 보임
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 95-A 완료. V3 헤더 잔재 제거 끝.

진단 결과:
- V3 헤더 위치: [정확한 파일·컴포넌트 이름]
- 적용한 시나리오: [A / B / C]

조치:
- [구체적 변경 사항]

결과:
- 운종 3창 (/scalper /longterm /us) → UnjongHeader 만 표시 ✅
- /dashboard → V3 헤더 그대로 유지 ✅
- 빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  http://localhost:3333/scalper → 4단 헤더 → 운종 헤더 단독으로 정리됨
  http://localhost:3333/dashboard → V3 헤더 그대로 유지

다음 STEP 96 (단타창 카드 4개) 명령서 받을 준비 됨.
```

---

## ⚠️ 주의 사항

1. **V3 헤더 컴포넌트 파일 삭제 X** — dashboard 에서 사용 중
2. **(windows)/layout.tsx 건드리지 말 것** — STEP 90 에서 완성됨
3. **시나리오 판단은 grep 결과 우선** — 추측 X
4. **dashboard layout 신설이 깔끔** — page 직접 수정보다
5. **빌드 깨지면 즉시 보고** — 강제 진행 금지
