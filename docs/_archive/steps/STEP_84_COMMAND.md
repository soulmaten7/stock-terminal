# STEP 84 — Section 1 L자 재설계 + 하이라이트/FloatingChat/위젯 제목 통일

**실행 명령어 (Sonnet 기본, 복잡 디버깅 필요 시 🔴 Opus):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 83 완료 — Section 1~5 긴급 폴리싱 + WidgetHeader 컴포넌트 도입 (commit `feabb57`).

**목표:**
STEP 83 배포 확인 후 사용자 피드백 5종 전면 반영.
1. **Section 1 L자 레이아웃** — 호가/체결을 좌측 관심종목 아래까지 확장한 세로 2열 구조로 재배치. 높이 820px.
2. **대시보드 가로폭 cap** — max-w 1600 / min-w 1280. 반응형 분기 제거, 단일 레이아웃 고정.
3. **하이라이트 탭 정렬/필터 수정** — 14일 이상 오래된 항목 대체 + 현재 종목 배지 + 최신순 재확인.
4. **FloatingChat v3** — 대시보드 폭 안쪽 위치, 닫힘=아이콘, 열림=좌/우 하단 2위치 + "◀ 좌측 / 우측 ▶" 텍스트 토글 (드래그 삭제).
5. **위젯 제목 체계 통일** — [메인 — 서브] 패턴 전 위젯 적용 + "전체보기" 텍스트 링크 `{도메인} 전체` 로 통일. `WidgetHeader` 누락 위젯 grep 전수조사 후 강제 적용.

**범위 제한:**
- 실제 데이터 정확성 개선(섹터 히트맵 KR 빈값, 급등락 하락 빈값 등)은 이번 STEP 제외 — 별도 STEP.
- 차트 내부 구현 변경 금지(높이만 조정).
- 모바일 세로뷰 대응 제외 (CLAUDE.md 원칙).

---

## 작업 0 — 현재 상태 확인

```bash
# Section 1 레이아웃 컴포넌트
find components/dashboard -name "HomeClient*" -o -name "Section1*" 2>/dev/null
cat components/dashboard/HomeClient.tsx 2>/dev/null | head -80

# FloatingChat 현재 상태
find components/chat -type f 2>/dev/null
cat components/chat/FloatingChat.tsx 2>/dev/null | head -60

# WidgetHeader 적용 여부 전수조사
grep -rL "WidgetHeader" components/widgets/ --include="*.tsx"

# 하이라이트 탭 파일
grep -rln "하이라이트\|highlight" components/widgets/ --include="*.tsx" | head
```

보고: 각 파일 경로 + WidgetHeader 누락 목록.

---

## 작업 1 — 대시보드 컨테이너 가로폭 cap

`app/(dashboard)/page.tsx` 또는 `components/dashboard/HomeClient.tsx` 최상위 wrapper 수정:

```tsx
<div className="max-w-[1600px] min-w-[1280px] mx-auto px-4 py-4">
  {/* Section 1 ~ Section 5 */}
</div>
```

**주의:**
- `min-w-[1280px]` 은 **body 에 적용하지 말 것** — 대시보드 페이지 내부 컨테이너에만.
- 다른 페이지(로그인/설정 등) 는 영향 받지 않도록.

---

## 작업 2 — Section 1 L자 레이아웃 재설계

### 2-1. 구조 (CSS Grid, 반응형 분기 없음)

```tsx
<section className="grid gap-0 h-[820px] border border-[#E5E7EB] bg-white overflow-hidden
  grid-cols-[280px_1fr_360px]
  grid-rows-[55%_45%]">

  {/* 상단 Row — 관심종목 (55%) */}
  <div className="row-start-1 col-start-1 border-r border-[#E5E7EB] min-w-0 overflow-y-auto">
    <WatchlistWidget compact />
  </div>

  {/* 상단 Row — 차트 (55%) */}
  <div className="row-start-1 col-start-2 min-w-0 overflow-hidden">
    <ChartArea />
  </div>

  {/* 우측 통짜 — 상세탭 (row-span-2) */}
  <div className="row-start-1 row-span-2 col-start-3 border-l border-[#E5E7EB] min-w-0 overflow-hidden">
    <StockDetailPanel />
  </div>

  {/* 하단 Row — 호가/체결 (좌측+중앙 통합, 내부 55:45) */}
  <div className="row-start-2 col-start-1 col-span-2 border-t border-[#E5E7EB]
                  grid grid-cols-[55%_45%] min-w-0 overflow-hidden">
    <div className="border-r border-[#E5E7EB] min-w-0 overflow-y-auto">
      <OrderbookWidget />
    </div>
    <div className="min-w-0 overflow-y-auto">
      <TradesWidget />
    </div>
  </div>
</section>
```

### 2-2. 관심종목 컴팩트 모드

`components/widgets/WatchlistWidget.tsx` 에 `compact` prop 추가:

```tsx
type Props = { compact?: boolean };

export default function WatchlistWidget({ compact = false }: Props) {
  const rowHeight = compact ? 'h-7' : 'h-8';         // 28px vs 32px
  const padding = compact ? 'px-2 py-1' : 'px-2 py-1.5';
  // ...
  return (
    <div>
      <WidgetHeader title="관심종목" subtitle="My List" href="/watchlist" />
      <ul>
        {items.map((s) => (
          <li key={s.code} className={`${rowHeight} ${padding} flex items-center ...`}>
            {/* 행 내부 */}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 2-3. 높이 분배 검증

브라우저에서 1920px / 1440px / 1280px 3개 폭 수동 확인:
- 관심종목: 450px 안에 16종목 이상 + 스크롤 동작
- 차트: 450px, 캔들 압축 표시
- 호가창: 370px 높이 안에 10단계 + 총잔량 2줄 정상
- 체결창: 370px 높이 안에 최근 30행 스크롤 정상

---

## 작업 3 — 하이라이트 탭 수정 (14일 필터 + 종목 배지 + 최신순)

### 3-1. 대상 파일

`components/widgets/StockDetailPanel.tsx` 내부의 News/Disclosure 탭 컴포넌트 또는 별도 파일:
```bash
grep -rln "NewsHighlight\|DisclosureHighlight\|news_highlight\|disclosure_highlight" components/ --include="*.tsx"
```

### 3-2. 공통 로직

```tsx
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function isStale(publishedAt: string): boolean {
  return Date.now() - new Date(publishedAt).getTime() > FOURTEEN_DAYS_MS;
}

// 정렬 최신순 + 14일 이하만 유지
const fresh = items
  .filter((it) => !isStale(it.publishedAt))
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
```

### 3-3. 종목 배지 + 빈 상태

```tsx
<div className="p-3">
  {/* 배지 */}
  <div className="flex items-center gap-2 mb-2">
    <span className="text-[10px] px-2 py-0.5 bg-[#F3F4F6] text-[#666] rounded">
      종목: {selected.name} {selected.code}
    </span>
    <span className="text-[10px] text-[#999]">최근 14일</span>
  </div>

  {/* 리스트 */}
  {fresh.length === 0 ? (
    <div className="text-center py-8 text-xs text-[#999]">
      <div className="mb-2">최근 14일 내 관련 활동 없음</div>
      <Link href="/news" className="text-[#0ABAB5] hover:underline">
        전체 뉴스 스트림 보기 →
      </Link>
    </div>
  ) : (
    <ul className="space-y-1.5">
      {fresh.map((it) => (
        <li key={it.id} className="text-xs">
          {/* 항목 렌더 */}
        </li>
      ))}
    </ul>
  )}
</div>
```

### 3-4. 적용 대상

- 종합 탭 (summary): 뉴스/공시 하이라이트 모두
- 뉴스 탭: 동일 로직
- 공시 탭: 동일 로직
- 재무 탭: 분기 재무는 오래된 게 정상이므로 **14일 필터 예외** — 대신 "최근 보고 기준일" 표시만

---

## 작업 4 — FloatingChat v3 재설계

### 4-1. 기존 파일 백업 후 재작성

```bash
cp components/chat/FloatingChat.tsx components/chat/FloatingChat.tsx.bak
```

### 4-2. 요구 사양

| 상태 | 표시 | 위치 |
|---|---|---|
| 닫힘 (`closed`) | 56×56 원형 채팅 아이콘 | 대시보드 우하단 (좌/우 마지막 선택 기억) |
| 열림 (`open`) | 320×440 패널 | 대시보드 좌하단 또는 우하단 |
| 토글 버튼 | 패널 헤더 `[ ◀ 좌측 ] [ 우측 ▶ ]` 텍스트 포함 | 현재 위치는 비활성(회색), 반대쪽만 클릭 |

### 4-3. 위치 제약

- **fixed 제거** → `sticky` 또는 대시보드 컨테이너 내부 `absolute`
- 대시보드 wrapper 에 `relative` + 최하단에 FloatingChat 배치:

```tsx
<div className="relative max-w-[1600px] min-w-[1280px] mx-auto">
  {/* sections... */}
  <FloatingChat />
</div>
```

- FloatingChat 내부는 `absolute bottom-4 left-4` 또는 `absolute bottom-4 right-4`

### 4-4. 구현 골격

```tsx
'use client';
import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

type Position = 'left' | 'right';
type ChatState = 'open' | 'closed';

export default function FloatingChat() {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>('right');
  const [state, setState] = useState<ChatState>('open');

  useEffect(() => {
    setMounted(true);
    const savedPos = localStorage.getItem('floating-chat-position') as Position | null;
    const savedState = localStorage.getItem('floating-chat-state') as ChatState | null;
    if (savedPos === 'left' || savedPos === 'right') setPosition(savedPos);
    if (savedState === 'open' || savedState === 'closed') setState(savedState);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('floating-chat-position', position);
    localStorage.setItem('floating-chat-state', state);
  }, [position, state, mounted]);

  if (!mounted) return null;

  const positionClass = position === 'left' ? 'left-4' : 'right-4';

  // 닫힘 상태: 아이콘만
  if (state === 'closed') {
    return (
      <button
        onClick={() => setState('open')}
        className={`absolute bottom-4 ${positionClass} w-14 h-14 rounded-full bg-[#0ABAB5] text-white shadow-lg hover:bg-[#089591] z-40 flex items-center justify-center`}
        aria-label="채팅 열기"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  // 열림 상태: 320×440 패널
  return (
    <div className={`absolute bottom-4 ${positionClass} w-[320px] h-[440px] bg-white border border-[#E5E7EB] shadow-xl rounded-lg z-40 flex flex-col`}>
      {/* Header — 위치 토글 + 닫기 */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPosition('left')}
            disabled={position === 'left'}
            className={`text-[11px] px-2 py-0.5 rounded ${
              position === 'left'
                ? 'bg-[#F3F4F6] text-[#999] cursor-default'
                : 'text-[#0ABAB5] hover:bg-[#F0FDFC]'
            }`}
          >
            ◀ 좌측
          </button>
          <button
            onClick={() => setPosition('right')}
            disabled={position === 'right'}
            className={`text-[11px] px-2 py-0.5 rounded ${
              position === 'right'
                ? 'bg-[#F3F4F6] text-[#999] cursor-default'
                : 'text-[#0ABAB5] hover:bg-[#F0FDFC]'
            }`}
          >
            우측 ▶
          </button>
        </div>
        <button
          onClick={() => setState('closed')}
          className="text-[#999] hover:text-[#222] p-1"
          aria-label="채팅 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body — 기존 채팅 UI 삽입 */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* TODO: 기존 채팅 메시지/입력 UI 재사용 */}
      </div>
    </div>
  );
}
```

### 4-5. 드래그 로직 제거 확인

```bash
grep -n "onMouseDown\|onMouseMove\|onMouseUp\|draggable" components/chat/FloatingChat.tsx
```

→ 모두 삭제되어야 함. `position.x`, `position.y` 상태도 제거.

---

## 작업 5 — 위젯 제목 체계 통일 ([메인 — 서브] + 전체보기 텍스트)

### 5-1. 통일 규칙

| 메인제목 | 서브제목 (예시) | 전체보기 텍스트 | href |
|---|---|---|---|
| 관심종목 | My List | 관심종목 전체 | /watchlist |
| 차트 | {선택 종목} | — | — |
| 호가 | 10단계 | — | — |
| 체결 | 실시간 | — | — |
| 장전 브리핑 | 오늘 시장 요약 | 브리핑 전체 | /briefing |
| 글로벌 지수 | 5그룹 17지표 | 지수 전체 | /global-indices |
| 발굴 | 프리셋 6개 | 발굴 전체 | /screener |
| 급등락 | 상위 20 | 급등락 전체 | /movers |
| 거래량 | Top 10 | 거래량 전체 | /volume |
| 수급 | Top 10 | 수급 전체 | /flow |
| 시장 지도 | 섹터 히트맵 | 시장지도 전체 | /market-map |
| 인기 테마 | Top 10 | 테마 전체 | /themes |
| 뉴스 | 최신 5건 | 뉴스 전체 | /news |
| 공시 | 최신 5건 | 공시 전체 | /disclosures |
| 경제 캘린더 | 이번 주 | 캘린더 전체 | /economic-calendar |

### 5-2. WidgetHeader 적용 확인

```bash
# 누락된 위젯 찾기
grep -rL "WidgetHeader" components/widgets/ --include="*.tsx"
```

목록에 뜬 모든 파일에 `<WidgetHeader title subtitle href />` 삽입. 기존 `<h3>` 태그는 제거.

### 5-3. WidgetHeader 컴포넌트 확인/보강

`components/dashboard/WidgetHeader.tsx` 가 이미 존재(STEP 83) — "전체보기" 텍스트 부분만 재확인:

```tsx
{href && (
  <Link href={href} className="flex items-center gap-0.5 text-xs text-[#0ABAB5] hover:underline whitespace-nowrap">
    {linkLabel ?? '전체보기'}<ArrowUpRight className="w-3 h-3" />
  </Link>
)}
```

`linkLabel` prop 추가해서 `"발굴 전체"`, `"테마 전체"` 등 도메인별 커스텀 텍스트 주입 가능하게:

```tsx
type Props = {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;   // 신규
  actions?: React.ReactNode;
};
```

### 5-4. 각 위젯에서 호출부 수정 예시

```tsx
// 기존
<WidgetHeader title="인기 테마 Top 10" href="/themes" />

// 수정
<WidgetHeader title="인기 테마" subtitle="Top 10" href="/themes" linkLabel="테마 전체" />
```

---

## 작업 6 — 빌드 + 린트

```bash
npm run lint
npm run build
```

- 에러 0건 목표.
- 경고는 any 타입 외 모두 정리.

---

## 작업 7 — 문서 4개 갱신

- `CLAUDE.md` 첫 줄 날짜 → 2026-04-23
- `docs/CHANGELOG.md`:
  ```
  - feat(dashboard): Section 1 L자 레이아웃 + 하이라이트 14일 필터 + FloatingChat v3 + 위젯 제목 통일 (STEP 84)
  ```
- `session-context.md`: STEP 84 완료 블록 추가 (L자 구조, 대시보드 max-w cap, 전체보기 통일)
- `docs/NEXT_SESSION_START.md`: 다음 = STEP 85 (데이터 정확성 — 섹터 히트맵 KR, 급등락 하락, 뉴스 카테고리 필터)

---

## 작업 8 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): Section 1 L자 + 하이라이트 필터 + 채팅 v3 + 제목 통일 (STEP 84)

- Section 1 L자 레이아웃: 상단(관심종목/차트/상세탭) + 하단(호가55:체결45, 좌측+중앙 통합)
- 대시보드 max-w 1600 / min-w 1280 고정, 반응형 분기 제거
- 관심종목 컴팩트 모드 (행 28px)
- 하이라이트 탭 14일 필터 + 종목 배지 + 최신순 재확인 + 빈 상태 대체 UI
- FloatingChat v3: fixed 제거(대시보드 폭 안쪽), 닫힘=원형 아이콘, 열림=좌/우 하단 2위치,
  "◀ 좌측 / 우측 ▶" 텍스트 토글, 드래그 로직 삭제
- WidgetHeader 전 위젯 강제 적용 + linkLabel prop 추가
- 위젯 제목 [메인 — 서브] 통일, "전체보기" → "{도메인} 전체" 텍스트 링크 통일

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 84 완료

1. Section 1 L자 레이아웃
   - 높이 820px, grid-cols-[280px_1fr_360px] / grid-rows-[55%_45%]
   - 하단 row: col-span-2 (관심종목 + 중앙) 내부 호가55:체결45
   - 상세탭 row-span-2 (우측 통짜)
   - 관심종목 compact mode: 행 28px

2. 대시보드 폭 cap
   - max-w: 1600px / min-w: 1280px
   - 반응형 분기 제거

3. 하이라이트 수정
   - 14일 필터 적용 위치: <파일 N개>
   - 종목 배지 추가
   - 빈 상태 "최근 14일 내 관련 활동 없음" + 전체 스트림 링크

4. FloatingChat v3
   - 위치: absolute, 대시보드 wrapper 내부 bottom-4 left-4/right-4
   - 닫힘: 56×56 원형 아이콘
   - 열림: 320×440 패널, ◀ 좌측 / 우측 ▶ 토글
   - 드래그 로직 제거 완료

5. 위젯 제목 통일
   - WidgetHeader 누락 위젯 N개 → 모두 적용
   - linkLabel prop 도입, 도메인별 텍스트 주입
   - 전 위젯 [메인 — 서브] + "전체보기" 텍스트 링크

6. 빌드/린트
   - npm run lint: <통과/경고 N건>
   - npm run build: 성공

7. git
   - commit: <hash>
   - push: success

다음 STEP 85: 데이터 정확성 — 섹터 히트맵 KR 빈값, 급등락 하락 빈값, 뉴스 카테고리 필터
```

---

## 주의사항

- **1280px 미만 fallback 없음** — CLAUDE.md "모바일 세로뷰 V3 범위 외" 원칙에 따라 좁은 화면은 가로 스크롤 허용. 별도 대응 금지.
- **관심종목 compact mode 는 Section 1 에서만** — 다른 페이지(/watchlist 전체 페이지) 는 기본 모드 유지.
- **FloatingChat 드래그 로직 "흔적" 까지 제거** — `position.x`, `position.y`, `onMouseDown` 전부 삭제. 기존 `.bak` 파일은 grep 제거 확인 후 삭제.
- **하이라이트 14일 필터 기준은 "published_at"** — 서버에서 내려주는 필드명 확인. 다를 경우 매핑 레이어에서 통일.
- **위젯 제목 테이블은 가이드** — 서브제목은 위젯 실제 범위에 맞게 유연하게 조정. 단 **"전체보기" 텍스트는 "{도메인} 전체" 형식 엄수**.
- **StockDetailPanel 우측 row-span-2** — 내부 4탭(종합/뉴스/공시/재무) 높이 820px 기준 재조정 필요. 스크롤 경계 확인.
- **차트 높이 감소(680→450)** — 기존 차트 라이브러리가 min-height 제약 있을 수 있음. 렌더 확인 필수.
