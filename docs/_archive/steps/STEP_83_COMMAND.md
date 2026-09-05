# STEP 83 — 긴급 패치: 레이아웃 + 위젯 링크 + 채팅 재설계 + 중복 key 버그

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 82 완료 (`e557e07`). 실제 배포 확인 결과 6개 이슈 발견.

**수정 대상 (6개):**

| # | 이슈 | 작업 번호 |
|---|------|----------|
| 1 | 호가창/체결창·우측탭 세로 높이 안 맞아 **드래그 필요** | 작업 1 |
| 2 | 일부 위젯 **가로폭 overflow** | 작업 2 |
| 3 | 위젯 → 페이지 이동 링크가 아이콘만 — **텍스트 없음** | 작업 3 |
| 4 | 채팅 UX 재설계: **기본 펼침 + 접힘 시 하단 가로 바 + 드래그 이동** | 작업 4 |
| 5 | 채팅 열면 **화면 깨져서 상단 거대 여백 발생** | 작업 4 |
| 6 | `ChatParticipantsModal.tsx:79` **중복 key 에러** | 작업 5 |

**범위 원칙:**
- 대시보드 안에서 스크롤/드래그 금지 (페이지 자체 세로 스크롤은 OK)
- 하나의 커밋으로 6개 이슈 한꺼번에

---

## 작업 0 — 현재 상태 진단

```bash
# 섹션 높이 및 overflow
grep -n "h-\[\|overflow" components/home/HomeClient.tsx

# 위젯 이동 링크 (전체보기) 현황
grep -rn "전체보기\|ArrowUpRight\|ExternalLink" components/widgets/ components/dashboard/ --include="*.tsx" | head -30

# 채팅 관련 파일
find components/chat components/widgets -name "*Chat*" -o -name "*Floating*" -o -name "*Participants*" -type f 2>/dev/null

# 중복 key 에러 소스
sed -n '65,90p' components/widgets/ChatParticipantsModal.tsx 2>/dev/null

# 상단 QuickNav
grep -rn "QuickNav\|TickerBar\|TopBar" components/ --include="*.tsx" | head
```

보고: 섹션 높이, overflow 누락, 전체보기 없는 위젯, ChatParticipantsModal 69~82 라인 내용.

---

## 작업 1 — 섹션별 고정 높이 + 내부 스크롤

### 원칙
- **섹션 전체**: 고정 높이 + `overflow-hidden`
- **섹션 내부 패널**: `min-w-0 min-h-0 overflow-y-auto`
- **위젯 내부 `max-h-[...]` 전부 제거** (이중 스크롤바 방지)

### HomeClient 전체 구조

```tsx
{/* Section 1 — 680px */}
<section className="grid gap-0 h-[680px] border border-[#E5E7EB] bg-white overflow-hidden
  grid-cols-[240px_1fr]
  lg:grid-cols-[240px_1fr_320px]
  xl:grid-cols-[280px_1fr_360px]">
  <div className="border-r border-[#E5E7EB] min-w-0 overflow-y-auto"><WatchlistWidget /></div>
  <div className="flex flex-col min-w-0 overflow-hidden">
    <div className="basis-[60%] min-h-0 overflow-hidden"><ChartArea /></div>
    <div className="basis-[25%] min-h-0 overflow-y-auto border-t border-[#E5E7EB]"><OrderbookWidget /></div>
    <div className="basis-[15%] min-h-0 overflow-y-auto border-t border-[#E5E7EB]"><TradesWidget /></div>
  </div>
  <div className="hidden lg:block min-w-0 overflow-hidden"><StockDetailPanel /></div>
</section>

{/* Section 2 — 400px */}
<section className="mt-4 grid grid-cols-12 gap-2 h-[400px]">
  <div className="col-span-4 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><BriefingWidget compact /></div>
  <div className="col-span-8 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><GlobalIndicesWidget expanded /></div>
</section>

{/* Section 3 — 260 + 340 = 600px */}
<section className="mt-4 space-y-2">
  <div className="h-[260px] border border-[#E5E7EB] bg-white overflow-y-auto"><ScreenerExpandedWidget /></div>
  <div className="grid grid-cols-12 gap-2 h-[340px]">
    <div className="col-span-6 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><MoversPairWidget /></div>
    <div className="col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><VolumeTop10Widget /></div>
    <div className="col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><NetBuyTopWidget /></div>
  </div>
</section>

{/* Section 4 — 440px */}
<section className="mt-4 grid grid-cols-12 gap-2 h-[440px]">
  <div className="col-span-9 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><SectorHeatmapWidget /></div>
  <div className="col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><ThemeTop10Widget /></div>
</section>

{/* Section 5 — 440px */}
<section className="mt-4 mb-6 grid grid-cols-12 gap-2 h-[440px]">
  <div className="col-span-5 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><NewsStreamWidget /></div>
  <div className="col-span-4 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><DisclosureStreamWidget /></div>
  <div className="col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-y-auto"><EconomicCalendarWidget /></div>
</section>
```

### 위젯 내부 정리
각 위젯 컴포넌트에서:
- `max-h-[NNNpx]` 제거
- 최상위 div 에 `className="p-3 min-w-0"` (높이 지정 금지 — 부모가 결정)

---

## 작업 2 — 가로 overflow 정리

### 체크포인트
- 모든 `col-span-*` / `basis-*` 사용 위치에 **`min-w-0`** 병기 (빠진 곳 전부 추가)
- 상단 지수 티커바만 `overflow-x-auto whitespace-nowrap` 허용, 나머지 본문은 금지
- 긴 텍스트 셀은 `truncate` + `max-w-full`
- 테이블은 `table-fixed` + column별 고정 폭 (ex: `w-20`, `w-24`)

### 위젯별 체크
- `ScreenerExpandedWidget` 결과 테이블: `table-fixed` + column width 명시
- `WatchlistWidget`: 종목명 `truncate`, 숫자 `tabular-nums text-right`
- `MoversPairWidget`, `VolumeTop10`, `NetBuyTop`, `ThemeTop10`: 종목명 `truncate max-w-[...]`

---

## 작업 3 — 위젯 이동 링크 텍스트화 (WidgetHeader 공통 컴포넌트)

### 3-1. `components/dashboard/WidgetHeader.tsx` 신설

```tsx
'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function WidgetHeader({
  title,
  subtitle,
  href,
  actions,
}: {
  title: string;
  subtitle?: string;
  href?: string;     // 페이지 없으면 undefined
  actions?: React.ReactNode;   // 토글 버튼 등
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
      <div className="flex items-baseline gap-2 min-w-0">
        <h3 className="text-sm font-semibold text-[#222] truncate">{title}</h3>
        {subtitle && <span className="text-[10px] text-[#999] truncate">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-xs text-[#0ABAB5] hover:underline"
          >
            전체보기
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
```

### 3-2. 전 위젯 헤더 교체

각 위젯 컴포넌트 내부의 기존 `<h3>...</h3>` 섹션을 `<WidgetHeader />` 로 교체.

### 3-3. 위젯 → 페이지 매핑

| 위젯 | href | 비고 |
|------|------|------|
| WatchlistWidget | `/watchlist` | |
| ChartArea | `/chart` | |
| OrderbookWidget | `/orderbook` | |
| TradesWidget | `/ticks` | |
| BriefingWidget | `/briefing` | |
| GlobalIndicesWidget | `/global` | |
| ScreenerExpandedWidget | `/screener` | 존재 확인, 없으면 href 생략 |
| MoversPairWidget | `/movers` | |
| VolumeTop10Widget | `/movers/volume` | |
| NetBuyTopWidget | `/net-buy` | |
| SectorHeatmapWidget | `/market-map` | 존재 확인, 없으면 href 생략 + TODO |
| ThemeTop10Widget | `/themes` | 존재 확인, 없으면 href 생략 + TODO |
| NewsStreamWidget | `/news` | |
| DisclosureStreamWidget | `/disclosures` | |
| EconomicCalendarWidget | `/calendar` | |

```bash
# 페이지 존재 여부 확인
ls app/screener app/market-map app/themes 2>/dev/null
```

존재하지 않는 페이지는 href 생략 + 파일 내에 TODO 주석:
```tsx
{/* TODO: /market-map 페이지 미구현 — STEP 84+ */}
<WidgetHeader title="시장 지도" />   {/* href 없음 */}
```

### 3-4. 상단 QuickNav 아이콘 라벨 상시 노출

`components/TopBar.tsx` 또는 `QuickNav.tsx` 에서 아이콘 아래 라벨이 숨겨진 곳이 있으면 전부 노출:

```tsx
<Link href={item.href} className="flex flex-col items-center gap-0.5 px-2 py-1 hover:bg-[#F3F4F6] rounded">
  {item.icon}
  <span className="text-[10px] text-[#444]">{item.label}</span>
</Link>
```

---

## 작업 4 — FloatingChat 재설계 (기본 펼침 + 하단 바 + 드래그)

기존 `components/chat/FloatingChat.tsx` 전면 교체.

### 요구사항
- **기본 상태**: `open` (닫힘 FAB 제거)
- **접힘 상태**: **화면 하단 전체 가로 바** (높이 40px) — 우하단 FAB 아니라 하단 ribbon
- **드래그 이동**: 열림 상태에서만 헤더 잡고 이동 가능
- **화면 깨짐 방지**: 완전 `position: fixed` + 컴포넌트 트리 끝에 포탈로 분리 권장
- **localStorage 지속**: 위치 (x, y), 상태 (open/minimized)

### 구현

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Minus, Send } from 'lucide-react';

type ChatState = 'open' | 'minimized';

const STATE_KEY = 'floating-chat-state';
const POS_KEY = 'floating-chat-pos';

const PANEL_W = 320;
const PANEL_H = 440;
const BAR_H = 40;

export default function FloatingChat() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<ChatState>('open');
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // 초기화
  useEffect(() => {
    setMounted(true);
    try {
      const s = localStorage.getItem(STATE_KEY);
      if (s === 'open' || s === 'minimized') setState(s);
      const p = localStorage.getItem(POS_KEY);
      if (p) {
        const parsed = JSON.parse(p);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') setPos(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(STATE_KEY, state); } catch {}
  }, [state, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch {}
  }, [pos, mounted]);

  // 드래그
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    // 화면 밖 클램프
    const maxX = window.innerWidth - PANEL_W;
    const maxY = window.innerHeight - PANEL_H;
    const newX = Math.max(0, Math.min(maxX, dragRef.current.origX - dx));
    const newY = Math.max(0, Math.min(maxY, dragRef.current.origY - dy));
    setPos({ x: newX, y: newY });
  };
  const onMouseUp = () => {
    dragRef.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  if (!mounted) return null;

  // 접힘 — 하단 가로 바
  if (state === 'minimized') {
    return (
      <div
        className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-[#E5E7EB] shadow-[0_-2px_8px_rgba(0,0,0,0.05)] flex items-center justify-between px-4"
        style={{ height: BAR_H }}
      >
        <button
          onClick={() => setState('open')}
          className="flex items-center gap-2 text-sm text-[#222] hover:text-[#0ABAB5]"
        >
          <MessageCircle className="w-4 h-4 text-[#0ABAB5]" />
          <span>마켓 채팅</span>
          <span className="text-[11px] text-[#999]">(클릭하여 펼치기)</span>
        </button>
        <span className="text-[11px] text-[#999]">실시간 대화</span>
      </div>
    );
  }

  // 펼침 — 드래그 가능 패널
  return (
    <div
      className="fixed z-40 bg-white border border-[#E5E7EB] rounded-lg shadow-xl flex flex-col"
      style={{
        right: pos.x,
        bottom: pos.y,
        width: PANEL_W,
        height: PANEL_H,
      }}
    >
      {/* 드래그 핸들 = 헤더 */}
      <div
        onMouseDown={onMouseDown}
        className="h-10 border-b border-[#E5E7EB] flex items-center justify-between px-3 cursor-move select-none bg-[#FAFAFA] rounded-t-lg"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[#222]">
          <MessageCircle className="w-4 h-4 text-[#0ABAB5]" />
          마켓 채팅
        </div>
        <button
          onClick={() => setState('minimized')}
          aria-label="하단으로 내리기"
          className="w-7 h-7 flex items-center justify-center text-[#666] hover:text-black hover:bg-[#F3F4F6] rounded"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* 메시지 영역 — 기존 ChatWidget 의 메시지 리스트 로직 복사 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 text-sm">
        {/* TODO: 기존 ChatMessages 컴포넌트 재사용 */}
        <div className="text-[#999] text-center mt-10">첫 메시지를 남겨보세요.</div>
      </div>

      {/* 입력 */}
      <div className="h-12 border-t border-[#E5E7EB] p-2 flex items-center gap-2">
        <input
          type="text"
          placeholder="메시지 입력... ($종목명 태그 지원)"
          className="flex-1 h-8 px-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#0ABAB5]"
        />
        <button
          aria-label="보내기"
          className="w-8 h-8 flex items-center justify-center text-white bg-[#0ABAB5] rounded hover:bg-[#089693]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

### 마운트 위치 (화면 깨짐 방지)

`app/layout.tsx` 의 `<body>` **최하단 `{children}` 뒤** 에 마운트 (이미 되어 있으면 유지). 어떤 레이아웃 스택 안에도 포함되면 안 됨 — body 직계 자식.

```tsx
<body>
  {children}
  <FloatingChat />
</body>
```

**기존 인라인 채팅 참조 제거 확인:**
```bash
grep -rn "ChatWidget\|ChatPanel" app/ components/home/ --include="*.tsx"
```

남은 인라인 마운트 전부 제거.

---

## 작업 5 — ChatParticipantsModal 중복 key 수정

### 증상
```
Encountered two children with the same key, `a7db2d46-bcfb-4a1a-8ff4-14eb3c59fc87`.
at ChatParticipantsModal.tsx:79 (key={p.user_id})
```

### 원인
참여자 배열에 동일 `user_id` 를 가진 항목이 중복 포함됨 (데이터 소스 문제 or 동일 사용자 다중 접속).

### 패치

`components/widgets/ChatParticipantsModal.tsx` 의 map 직전에 dedupe:

```tsx
// 기존 (대략)
const participants = useParticipants();  // or props
return (
  <ul>
    {participants.map((p) => (
      <li key={p.user_id} className="...">
        {/* ... */}
      </li>
    ))}
  </ul>
);

// 수정
const participants = useParticipants();

// user_id 기준 dedupe (최신 상태 우선)
const uniqueParticipants = Array.from(
  new Map(participants.map((p) => [p.user_id, p])).values()
);

return (
  <ul>
    {uniqueParticipants.map((p) => (
      <li key={p.user_id} className="...">
        {/* ... */}
      </li>
    ))}
  </ul>
);
```

**추가 방어:** 배열 출처(구독/웹소켓) 에서 중복 생성 로직이 있으면 원인 수정 필요. 일단 이번 STEP 은 **렌더 단계 dedupe** 로 에러만 차단.

---

## 작업 6 — 빌드 + 문서 + push

```bash
npm run build
```

CHANGELOG:
```
- fix(dashboard): 레이아웃 드래그 제거 + 위젯 이동 링크 텍스트화 + 가로 overflow 정리 (STEP 83)
- fix(chat): 플로팅 채팅 재설계 (기본 펼침 / 하단 가로 바 접힘 / 드래그 이동) (STEP 83)
- fix(chat): ChatParticipantsModal 중복 key 에러 수정 — 렌더 전 dedupe (STEP 83)
```

```bash
git add -A && git commit -m "$(cat <<'EOF'
fix(dashboard): 긴급 패치 6건 통합 (STEP 83)

레이아웃
- 섹션별 고정 높이 + 내부 overflow-y-auto (S1 680, S2 400, S3 600, S4 440, S5 440)
- 모든 패널에 min-w-0 / min-h-0 (이중 스크롤 제거)
- 위젯 내부 max-h 제거

위젯 이동 링크
- components/dashboard/WidgetHeader.tsx 신설 — "전체보기 →" 텍스트 링크
- 전 위젯 헤더 교체
- 상단 QuickNav 아이콘 하단 라벨 상시 노출
- 존재 없는 페이지 href 생략 + TODO

플로팅 채팅 재설계
- 기본 상태 'open' 으로 변경
- 접힘 시 화면 하단 가로 바 (높이 40px, 좌우 꽉 참)
- 드래그 이동 지원 (헤더 핸들 + 화면 클램프)
- localStorage chat-state / chat-pos 지속

버그
- ChatParticipantsModal 렌더 전 user_id 기준 dedupe — 중복 key 에러 해소

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 83 완료

레이아웃
- 섹션 고정 높이 적용 (S1~S5)
- 수정 파일: <목록>

가로 overflow
- min-w-0 / truncate 추가 위치: <목록>

위젯 이동 링크
- WidgetHeader.tsx 신설
- 교체된 위젯 N개: <목록>
- 페이지 없어 href 생략: <목록>

채팅 재설계
- FloatingChat.tsx 전면 교체
- 기본 펼침 + 하단 가로 바 + 드래그

ChatParticipantsModal
- dedupe 적용

- npm run build: 성공
- git commit: <hash>
```

---

## 주의사항

- **기존 ChatMessages/메시지 로직 보존** — FloatingChat 내부 TODO 주석 자리에 기존 메시지 리스트 컴포넌트 재사용. 기존 `chatStore` 나 Socket 연결 코드 절대 수정 금지.
- **드래그 범위** — 화면 바깥으로 벗어나지 않도록 `Math.max(0, Math.min(max, ...))` 클램프 필수. 윈도우 리사이즈 시 클램프 재계산은 이번 STEP 범위 외 TODO.
- **dedupe 후 숫자 차이** — 중복 제거 후 참여자 수 표시도 `uniqueParticipants.length` 로 교체. 배지도 일관되게.
- **섹션 높이 vs 콘텐츠 — 내부 overflow-y-auto** — 콘텐츠가 넘치면 위젯 안에서 세로 스크롤바 생김 (이건 허용). 섹션 전체가 드래그되는 건 금지.
- **`min-h-0` 는 flex 자식 overflow 동작 필수** — 빼먹으면 스크롤 안 됨.
- **기존 `ChatWidget` 이 남아있으면 제거 확인** — FloatingChat 과 동시 마운트되면 이중 채팅.
