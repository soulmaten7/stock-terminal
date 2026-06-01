<!-- 2026-06-01 -->
# STEP 133 — /screener·/calendar 정리 + MVP 2.0 페이지 디자인 통일

## 실행 명령어
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- STEP 129~132 완료 (디자인 시스템·카드·종목 페이지·새 홈)
- 운종 정체성 충돌: `/screener` (네이버·키움 영역) · `/calendar` (Investing.com 영역)
- MVP 2.0 페이지 (`/products`·`/rooms`·`/product/[id]`·`/room/[id]`) 디자인 통일 X

## 목표

| 영역 | 변경 |
|------|------|
| **`/screener`** | 페이지 제거 + 메뉴에서 빼기 (정체성 충돌) |
| **`/calendar`** | 외부 링크로 변경 (Investing.com 한국어 경제캘린더) |
| **MainNav 메뉴** | "🏆 상품·리딩방" 만 (종목발굴·캘린더 제거 또는 외부) |
| **MVP 2.0 페이지 4개** | 토스 디자인 통일 (rounded-2xl·shadow-soft·p-5) |

## 작업

### [1] `/screener` 페이지 제거

```bash
rm -rf app/screener
rm -rf components/screener  # ScreenerClient.tsx
```

`lib/watchlist.ts` 가 Screener 에서 사용 중인지 확인. 미사용이면:
```bash
rm -f lib/watchlist.ts
```

### [2] `/calendar` 외부 링크로 변경

옵션 A — 페이지 제거 + 메뉴에서 외부 링크:
```bash
rm -rf app/calendar
```

옵션 B — 페이지 유지하되 안내 + 외부 링크:
```tsx
// app/calendar/page.tsx
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const metadata = { title: "경제 캘린더 — 운종" };

export default function CalendarPage() {
  return (
    <div className="max-w-screen-md mx-auto px-6 py-12 text-center">
      <h1 className="text-2xl font-bold text-unjong-primary mb-3">📅 경제 캘린더</h1>
      <p className="text-sm text-unjong-muted mb-6">
        FOMC·CPI·NFP·고용지표 등 글로벌 경제 일정.
        가장 풍부한 경제 캘린더는 Investing.com 입니다.
      </p>
      <a
        href="https://kr.investing.com/economic-calendar/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-unjong-accent text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
      >
        Investing.com 경제 캘린더 열기
        <ExternalLink size={16} />
      </a>
      <p className="text-xs text-unjong-muted mt-4">운종은 외부 정확한 정보로 동선 안내 (허브 정체성)</p>
    </div>
  );
}
```

→ **옵션 B 추천** (허브 정체성 강화 + 사용자 동선 보존).

### [3] MainNav 메뉴 변경

`components/header/MainNav.tsx`:

```tsx
const SECONDARY_LINKS = [
  { href: "/products", label: "상품·리딩방", englishLabel: "Reviews", icon: Award },
  { href: "/calendar", label: "경제 캘린더", englishLabel: "Calendar", icon: CalendarDays },
] as const;
```

(`/screener` 제거. 캘린더는 외부 안내 페이지로 유지)

### [4] MVP 2.0 페이지 디자인 통일

`/products`·`/rooms` 디렉토리 + `/product/[id]`·`/room/[id]` 평가 페이지에 토스 디자인 시스템 적용:

#### 디렉토리 카드 (ProductsClient·RoomsClient)

```tsx
// 기존
<li className="bg-unjong-surface rounded-lg border border-unjong-border p-4 hover:border-unjong-accent">

// 변경
<li className="bg-unjong-surface rounded-2xl border border-unjong-border p-5 shadow-soft hover:shadow-soft-hover transition-shadow">
```

종목명·가격·등락 패턴 STEP 130 과 동일 (text-sm font-semibold, 큰 padding 등).

#### 평가 페이지 (ProductDetailClient·RoomDetailClient)

좌측 상품·방 정보 sticky + 가운데 토론 — 종목 페이지와 동일 구조 (STEP 131 탭 시스템 같이 적용 가능, 단 이번 STEP 범위 X).

```tsx
<div className="grid grid-cols-[320px_1fr] gap-5 px-10 py-5">
  <aside className="sticky top-5 self-start">
    {/* 상품/방 정보 카드 */}
    <div className="bg-unjong-surface rounded-2xl border border-unjong-border p-5 shadow-soft">
      ...
    </div>
  </aside>
  <main>
    {/* PlatformDiscussionBoard */}
    <div className="bg-unjong-surface rounded-2xl border border-unjong-border p-5 shadow-soft">
      <PlatformDiscussionBoard targetType="product" targetId={id} />
    </div>
  </main>
</div>
```

### [5] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

체크: `/screener` 라우트 사라짐, `/calendar` 정상, `/products` 등 정상.

### [6] 4개 문서 헤더 갱신

### [7] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(design): /screener 제거 + /calendar 외부 링크 + MVP 2.0 디자인 통일 (전면 리뉴얼 STEP 5/5)

페이지 정리:
- /screener 통째 삭제 (정체성 충돌 — 네이버·키움·FnGuide 영역)
- components/screener/ScreenerClient.tsx 삭제
- lib/watchlist.ts 미사용 확인 후 정리

/calendar 외부 링크 안내 페이지:
- Investing.com 한국어 경제 캘린더로 외부 이동
- 운종 = 허브 정체성 강화 (정확한 외부로 안내)
- 단순 페이지 (헤더·설명·외부 링크 버튼)

MainNav 메뉴:
- 종목발굴 (Screener) 제거
- 상품·리딩방 (Reviews) + 경제 캘린더 (Calendar) 만

MVP 2.0 페이지 디자인 통일:
- /products·/rooms 디렉토리 카드: rounded-2xl + shadow-soft + p-5 (토스)
- /product/[id]·/room/[id] 평가 페이지: 좌 320 정보 sticky + 중 토론 (종목 페이지 동일 구조)
- 토론 본문 카드도 토스 스타일

🎉 전면 디자인 리뉴얼 완료 (STEP 129~133):
- 디자인 시스템 (토스 색상·spacing·CardContainer)
- 9개 카드 콘텐츠 토스 스타일
- 종목 페이지 네이버 탭 시스템 + 우측 fixed nav
- 새 홈 손성기 모듈 순서 + MVP 2.0 진입
- /screener·/calendar 정리 + MVP 2.0 디자인 통일

운종 V5 = 네이버 레이아웃 + 토스 카드 디자인 + Trustpilot 평가 = 고유 정체성"
git push
```
