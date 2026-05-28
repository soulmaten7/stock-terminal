<!-- 2026-05-27 -->
# STEP 95-D — 헤더·페이지·사이드 미세조정 7개

> **목표**: STEP 95-C 후 화면 미세 조정. 사용자 직접 검증 후 확정한 7개 변경.
> **세션**: #25
> **전제**: STEP 95-C 완료 (`8441316`), 헤더 4단 통합 + ContextNav 작동
> **유형**: 미세조정 (작업 시간 1시간)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_95D_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **모두 미세 조정** — 구조 변경 X, 위치·크기·이름·정렬만
2. **좌측 사이드 비율 고정** — `flex-1` 가변 → 명확한 비율 (`h-[65%]` + `h-[35%]`)
3. **창마다 동일 크기** — 단타창·장타창·미국주식창의 채팅·관심종목 비율 동일
4. **빌드 깨지면 즉시 보고**

---

## 작업 1 — 1단 우측 아이콘 위치·크기 조정

### 현재 문제
한국기·알림·즐겨찾기·프로필 아이콘이 위치·크기 어색.

### 조정 — Header.tsx (V3 헤더 컴포넌트)

```tsx
{/* 우측 아이콘 영역 */}
<div className="flex items-center gap-3 ml-auto flex-shrink-0">
  {/* 한국기 — 국가 선택 (Layer 7+ 다국가) */}
  <button
    type="button"
    className="text-base hover:opacity-70 transition-opacity"
    aria-label="국가 선택"
    title="한국"
  >
    🇰🇷
  </button>

  {/* 알림 */}
  <button
    type="button"
    className="text-unjong-muted hover:text-unjong-primary transition-colors p-1"
    aria-label="알림"
  >
    <Bell size={18} />
  </button>

  {/* 즐겨찾기 */}
  <button
    type="button"
    className="text-unjong-muted hover:text-unjong-primary transition-colors p-1"
    aria-label="즐겨찾기"
  >
    <Star size={18} />
  </button>

  {/* 프로필 */}
  <button
    type="button"
    className="text-unjong-muted hover:text-unjong-primary transition-colors p-1"
    aria-label="프로필"
  >
    <User size={18} />
  </button>
</div>
```

핵심:
- `gap-3` 으로 아이콘 간격 통일
- 아이콘 사이즈 `size={18}` 통일
- 한국기는 emoji 라 `text-base` 로 사이즈 맞춤
- `hover:` 효과 통일
- 모든 버튼 padding `p-1` 통일

⚠️ 실제 V3 Header.tsx 구조에 맞게 적용. lucide-react 의 `Bell`, `Star`, `User` import 확인.

---

## 작업 2 — 3단 메뉴 이름 변경 (영문 + 한글 병기)

### `components/header/MainNav.tsx` 수정

```tsx
const SECONDARY_LINKS = [
  { href: "/screener", label: "종목발굴", englishLabel: "Screener", icon: Search },
  { href: "/calendar", label: "경제캘린더", englishLabel: "Calendar", icon: Calendar },
] as const;

// 렌더링 부분
{SECONDARY_LINKS.map(({ href, label, englishLabel, icon: Icon }) => (
  <Link
    key={href}
    href={href}
    className="flex items-center gap-1.5 text-xs text-unjong-muted hover:text-unjong-primary transition-colors"
  >
    <Icon size={14} />
    <span className="font-medium">{label}</span>
    <span className="text-[10px] text-unjong-muted">({englishLabel})</span>
  </Link>
))}
```

결과: 
- `🔍 종목발굴 (Screener)`
- `📅 경제캘린더 (Calendar)`

한국어 메인 + 영문 보조 (작은 글씨, 회색 톤).

---

## 작업 3 — 4단 ContextNav 위치 변경 (채팅창 제외)

### 현재 문제
4단 ContextNav 가 헤더 전체 폭에 걸쳐 있어 **좌측 채팅창 위까지 침범**.

### 해결 — ContextNav 를 헤더에서 분리해서 메인 영역 위로 이동

#### 3-1. V3 헤더 wrapper (또는 root layout) 에서 ContextNav 제거

기존 STEP 95-C 에서 `<ContextNav />` 가 헤더 안에 있으면 거기서 제거.

#### 3-2. `app/(windows)/layout.tsx` 에 ContextNav 추가 — 메인 영역 위

```tsx
import { ContextNav } from "@/components/header/ContextNav";
import { UnjongSidebar } from "@/components/sidebar/UnjongSidebar";
import { StockDetailPanel } from "@/components/sidepanel/StockDetailPanel";

export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-unjong-background">
      {/* 헤더 1·2·3단은 root layout 의 V3 헤더가 처리 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드 — 채팅 + 관심종목 */}
        <UnjongSidebar />

        {/* 메인 + 우측 패널 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 4단 ContextNav — 채팅창 제외, 메인+우측 영역의 폭만 */}
          <ContextNav />

          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4">{children}</main>
            <StockDetailPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
```

핵심:
- 좌측 사이드(`UnjongSidebar`) 는 그대로
- 메인 + 우측 패널 = 새 wrapper div 로 묶음 (`flex-1 flex flex-col`)
- 이 wrapper 의 첫 줄에 `<ContextNav />` 추가 → 좌측 채팅 제외, 메인+우측 폭만 차지

⚠️ STEP 95-C 에서 ContextNav 어디 배치했는지 확인 후 그 위치를 비우고 새 위치에 배치.

---

## 작업 4 — 페이지 헤더 박스 제거

### 대상 파일 3개
- `app/(windows)/scalper/page.tsx`
- `app/(windows)/longterm/page.tsx`
- `app/(windows)/us/page.tsx`

### 제거할 박스

```diff
- {/* 페이지 헤더 */}
- <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
-   <h1 className="text-xl font-bold text-unjong-primary">⚡ 단타창</h1>
-   <p className="mt-1 text-xs text-unjong-muted">
-     장중 09:00~15:30 — 액티브 트레이더의 데스크 · 카드 7개 완성 (STEP 96)
-   </p>
- </div>
```

3개 페이지 모두 이 박스 삭제. 페이지 진입 시 바로 카드 그리드부터 보이게.

---

## 작업 5 — Layer 1 안내 박스 제거

### 대상 파일 3개
같음 (scalper / longterm / us).

### 제거할 박스

```diff
- {/* Layer 1 진행 상황 안내 */}
- <div className="rounded-lg border border-dashed border-unjong-accent bg-unjong-surface p-4">
-   <p className="text-xs font-semibold text-unjong-primary mb-1">
-     🚧 Layer 1 — 실데이터 연결 진행 중
-   </p>
-   <p className="text-[11px] text-unjong-muted leading-relaxed">
-     현재 모든 카드 더미. Layer 1 에서 실데이터 연결: ...
-   </p>
- </div>
```

또는 그 외 비슷한 "Layer 1 예정 카드" 안내 박스도 모두 제거. 페이지가 카드 그리드만 깔끔하게 보이게.

---

## 작업 6 — 카드 그리드 3열 → 2열

### 대상 파일 3개
- `app/(windows)/scalper/page.tsx`
- `app/(windows)/longterm/page.tsx`
- `app/(windows)/us/page.tsx`

### 변경

```diff
- <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
+ <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

`xl:grid-cols-3` 제거. md 이상에서 2열 유지.

결과:
- 모바일: 1열
- 태블릿/데스크탑/와이드: **2열** (카드 사이즈 ↑)

7개 카드 = 4행 (2+2+2+1).

---

## 작업 7 — 좌측 사이드 비율 고정 (가장 중요)

### 현재 문제
- `UnjongSidebar` 가 `flex-1` (가변) + `max-h-[35%]` (관심종목) 로 되어 있어 화면 크기에 따라 채팅 영역이 흔들림
- 채팅 입력박스가 안 보이거나 위치가 어색

### 해결 — `UnjongSidebar.tsx` 비율 고정

```tsx
import { ChatPanel } from "./ChatPanel";
import { WatchlistPanel } from "./WatchlistPanel";

/**
 * 운종 좌측 사이드 (폭 300px)
 *
 * 비율 고정:
 * - 채팅 영역 = 65% (메시지 스크롤 + 입력박스 하단 고정)
 * - 관심종목 영역 = 35% (스크롤 가변)
 *
 * 모든 창 (단타·장타·미장) 에서 동일 비율 유지.
 */
export function UnjongSidebar() {
  return (
    <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
      <div className="flex h-full flex-col">
        {/* 채팅 영역 — 65% 고정 */}
        <div className="h-[65%] flex flex-col min-h-0">
          <ChatPanel />
        </div>

        {/* 관심종목 영역 — 35% 고정 */}
        <div className="h-[35%] flex flex-col min-h-0">
          <WatchlistPanel />
        </div>
      </div>
    </aside>
  );
}
```

### `ChatPanel.tsx` 수정 — 입력박스 항상 하단 고정

```tsx
export function ChatPanel() {
  // ... 기존 ctx, DUMMY_MESSAGES 등 ...

  return (
    <div className="flex h-full flex-col bg-unjong-surface">
      {/* 헤더 — 고정 높이 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>{ctx.emoji}</span>
          <span className="text-sm font-semibold text-unjong-primary">
            {ctx.window} 채팅
          </span>
        </div>
        <span className="text-[10px] text-unjong-muted">
          (Layer 1 실시간)
        </span>
      </div>

      {/* 메시지 영역 — 가변 (스크롤) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {/* 기존 메시지 렌더링 */}
        {ctx.messages.map((msg) => ( ... ))}
      </div>

      {/* 입력박스 — 하단 고정 */}
      <div className="border-t border-unjong-border bg-unjong-background p-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 rounded-md border border-unjong-border bg-unjong-surface px-2 py-1.5">
          <input
            type="text"
            placeholder={`${ctx.window}에 메시지...`}
            className="flex-1 bg-transparent text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            disabled
            aria-label="채팅 입력 (Layer 1 에서 활성)"
          />
          <button
            type="button"
            disabled
            className="text-unjong-muted hover:text-unjong-accent disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

핵심:
- 헤더 = `flex-shrink-0` (고정 높이)
- 메시지 = `flex-1 overflow-y-auto min-h-0` (가변, 스크롤)
- 입력박스 = `flex-shrink-0` (고정 높이, 항상 하단)

### `WatchlistPanel.tsx` 수정 — max-h-[35%] 제거 (이미 부모가 35% 잡음)

```diff
- <div className="flex flex-col max-h-[35%] border-t border-unjong-border bg-unjong-surface flex-shrink-0">
+ <div className="flex h-full flex-col border-t border-unjong-border bg-unjong-surface">
```

부모(`UnjongSidebar`) 가 이미 `h-[35%]` 로 영역 잡았으니, WatchlistPanel 은 그 안에서 `h-full` 로 채움.

---

## 작업 8 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공, TypeScript 오류 0
- 7개 변경 모두 정상 컴파일
- 색상 클래스 폴백 필요 없음 (STEP 95-C 와 동일)

---

## 작업 9 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add -A
git status
git commit -m "fix: STEP 95-D - 헤더·페이지·사이드 미세조정 7개

사용자 직접 검증 후 확정한 7개 변경:
1. 1단 우측 아이콘 정렬·크기 통일 (한국기·알림·즐겨찾기·프로필)
2. 3단 메뉴 이름 영문+한글 병기 (종목발굴·경제캘린더)
3. 4단 ContextNav 위치 변경 — 채팅창 제외, 메인+우측 폭만 차지
4. 페이지 헤더 박스 제거 (⚡단타창/🌳장타창/🌙미국주식창)
5. Layer 1 안내 박스 제거 (페이지 깔끔)
6. 카드 그리드 3열 → 2열 (md:grid-cols-2)
7. 좌측 사이드 비율 고정 (채팅 65% + 관심종목 35%)
   · 채팅 입력박스 flex-shrink-0 로 하단 항상 고정
   · 모든 창에서 동일 비율 유지

브라우저 확인:
- 4단 ContextNav 가 좌측 채팅창 위까지 침범 X
- 채팅 입력박스 항상 보임
- 단타창·장타창·미국주식창 모두 동일 사이즈"
git push
```

---

## 검증 체크리스트

- [ ] 1단 우측 아이콘 정렬 자연스러움
- [ ] 3단 메뉴: 🔍 종목발굴 (Screener) · 📅 경제캘린더 (Calendar) 표시
- [ ] 4단 ContextNav 가 좌측 채팅창 위까지 침범 X — 메인+우측 영역의 폭만 차지
- [ ] scalper / longterm / us 페이지에서 헤더 박스 제거됨
- [ ] Layer 1 안내 박스 제거됨
- [ ] 카드 2열 그리드 (모든 화면 크기에서 md 이상은 2열)
- [ ] 좌측 사이드 비율 고정 (채팅 65% / 관심종목 35%)
- [ ] 채팅 입력박스가 좌측 사이드 채팅 영역의 하단에 항상 보임
- [ ] 단타창 ↔ 장타창 전환 시 채팅·관심종목 비율 동일
- [ ] 빌드 클린, git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 95-D 완료. 헤더·페이지·사이드 미세조정 7개 끝.

변경 사항:
- 1단 우측 아이콘 정렬 + size={18} 통일 ✅
- 3단 메뉴: 종목발굴 (Screener) · 경제캘린더 (Calendar) ✅
- 4단 ContextNav 위치 변경: (windows)/layout.tsx 의 메인+우측 wrapper 첫 줄 ✅
- 3개 page.tsx 의 헤더 박스 + Layer 1 안내 박스 제거 ✅
- 카드 그리드 md:grid-cols-2 (2열) ✅
- 좌측 사이드 채팅 65% + 관심종목 35% 고정 ✅
- 채팅 입력박스 flex-shrink-0 하단 고정, 모든 창 동일 사이즈 ✅

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  http://localhost:3333/scalper
    → 4단 ContextNav 가 좌측 채팅 위에 없음 (메인 영역 위에만)
    → 카드 2열 그리드 (4행 = 2+2+2+1)
    → 좌측 사이드 채팅 영역 하단에 입력박스 항상 보임
  단타창 ↔ 장타창 ↔ 미국주식창 전환 시 채팅 크기 동일
```

---

## ⚠️ 주의 사항

1. **좌측 사이드 비율은 % 고정** — `flex-1` 사용 X, `h-[65%]` + `h-[35%]` 명시
2. **채팅 입력박스 = flex-shrink-0** — 메시지가 많아져도 입력박스가 사라지지 않음
3. **ContextNav 위치 변경 = 핵심** — V3 헤더 wrapper 에서 빼고 (windows)/layout.tsx 안 메인+우측 wrapper 의 첫 줄
4. **카드 그리드 = md 부터 2열** — xl:grid-cols-3 절대 X
5. **페이지 헤더 박스·Layer 1 안내 박스 모두 제거** — 3개 page.tsx 전부
6. **console.log 남기지 말 것**
7. **빌드 깨지면 즉시 보고**
