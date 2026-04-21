<!-- 2026-04-21 -->
# Stock Terminal V3 Dashboard V1.3 — Step 6 명령서

**대상**: Claude Code (🔴 Opus 권장 — R4 구조 전환 + 내부 스크롤 아키텍처 손봄)
**실행 명령어**: `cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model opus`

---

## 목표

Step 5의 R4 문제 2가지 해결:

1. **뉴스속보가 길어서 R4가 페이지 3까지 확장** → R4 행 높이를 **500px 고정**으로 클램프 + 모든 R4 위젯 내부 스크롤로 전환
2. **발견피드·시장활성도 탭 UX** → 폭이 충분하므로 **탭 해제**, 좌우 2분할로 전환 (상승테마·DART공시·거래량TOP·상승/하락을 각각 독립 WidgetCard로 나열)

결과: R4 = 5개 독립 위젯 (상승테마 | DART공시 | 거래량TOP | 상승/하락 | 뉴스속보), 각 폭 0.75fr/0.75fr/0.75fr/0.75fr/1fr, 높이 500px 고정, 내부 스크롤.

---

## 전제

- 직전 커밋: `624d204` (Step 5 — 2-zone layout + R4 3 tab widgets)
- 현재 R4 위젯: `ThemesDartTabWidget` / `VolumeMoversTabWidget` / `NewsFeedWidget` (3개 탭 구조)
- 유지: R1-R3 레이아웃 그대로 (Col 1 채팅+관심, Col 2 차트+지수+수급, Col 3 호가+체결)
- 탭 위젯 2개는 **삭제하지 말 것** (다른 페이지·모바일에서 재사용 가능성). home에서 import만 제거.

---

## 작업 1. 4개 위젯에 `size` prop 추가 (pass-through)

대상 파일:

- `components/widgets/VolumeTop10Widget.tsx`
- `components/widgets/MoversTop10Widget.tsx`
- `components/widgets/TrendingThemesWidget.tsx`
- `components/widgets/DartFilingsWidget.tsx`

각 파일 Read 후 Props 인터페이스 확장:

```tsx
interface Props {
  inline?: boolean;
  size?: 'default' | 'large';  // ← 신규
}

export default function XxxWidget({ inline = false, size = 'default' }: Props = {}) {
  // 기존 state/fetch/useEffect 그대로

  if (inline) {
    return <div className="h-full overflow-hidden">{content}</div>;
  }

  return (
    <WidgetCard title="..." subtitle="..." href="..." size={size}>
      {content}
    </WidgetCard>
  );
}
```

- `size` 기본값 `'default'` → 기존 동작 유지 (상세 페이지 영향 0)
- `size="large"` 전달 시 WidgetCard large variant로 렌더 (Step 5에서 추가된 prop 활용)

---

## 작업 2. 내부 스크롤 감사 — `WidgetCard` body

`components/home/WidgetCard.tsx` Read 후 구조 확인. children 래퍼가 **이미** `flex-1 overflow-y-auto` 또는 등가 처리를 하고 있는지 검증:

- 이미 적용: OK, 넘어감
- 미적용: children 래퍼에 `flex-1 overflow-y-auto min-h-0` 추가

**핵심**: WidgetCard 컨테이너는 `h-full flex flex-col`, header는 `shrink-0`, children 영역은 `flex-1 overflow-y-auto min-h-0`.

`min-h-0`이 없으면 flex 자식이 부모를 밀어내서 스크롤 안 먹는 고전적 버그 있음 — 반드시 포함.

---

## 작업 3. R4 위젯 내부 컨텐츠 스크롤 검증

R4에 들어갈 5개 위젯 각각의 본문 컨테이너가 내부 스크롤 가능한 구조인지 확인:

- `TrendingThemesWidget` (상승 테마)
- `DartFilingsWidget` (DART 공시) ← 리스트 길어질 가능성 높음
- `VolumeTop10Widget` (거래량 TOP)
- `MoversTop10Widget` (상승/하락)
- `NewsFeedWidget` (뉴스속보) ← 가장 긴 리스트

검증 방법: 각 위젯의 최상위 렌더가 `WidgetCard`로 감싸진 상태에서, 내부 리스트 컨테이너가 `overflow-y-auto`를 자체적으로 걸지 말고 **WidgetCard의 body에서 자동 스크롤되도록** 단순화. 위젯 내부에 별도 `overflow-y-auto` 있으면 제거.

즉, **스크롤은 WidgetCard 한 층에서만** 발생. 이중 스크롤 금지.

---

## 작업 4. `components/home/HomeClient.tsx` R4 재설계

### Imports 조정

**제거**:
- `VolumeMoversTabWidget`
- `ThemesDartTabWidget`

**추가**:
- `VolumeTop10Widget`
- `MoversTop10Widget`
- `TrendingThemesWidget`
- `DartFilingsWidget`

**유지**: `NewsFeedWidget`, R1-R3 위젯 전부

### Grid 수정

`gridTemplateRows`를 `minmax(450px, auto)` → **`500px` 고정**으로 변경:

```tsx
gridTemplateRows: 'repeat(3, calc((100vh - 152px) / 3)) 500px',
```

R4 내부 5열 분할로 변경:

```tsx
{/* ── R4: Discovery Row (500px fixed, 5 widgets flat) ── */}
<div
  id="section-r4"
  style={{
    gridRow: 4,
    gridColumn: '1 / 4',
    display: 'grid',
    gridTemplateColumns: '0.75fr 0.75fr 0.75fr 0.75fr 1fr',
    gap: 8,
    minHeight: 0,
  }}
>
  <div id="section-themes" style={{ minHeight: 0 }}>
    <TrendingThemesWidget size="large" />
  </div>
  <div id="section-dart" style={{ minHeight: 0 }}>
    <DartFilingsWidget size="large" />
  </div>
  <div id="section-volume" style={{ minHeight: 0 }}>
    <VolumeTop10Widget size="large" />
  </div>
  <div id="section-movers" style={{ minHeight: 0 }}>
    <MoversTop10Widget size="large" />
  </div>
  <div id="section-news" style={{ minHeight: 0 }}>
    <NewsFeedWidget size="large" />
  </div>
</div>
```

`minHeight: 0` — flex/grid 자식에 내부 스크롤 작동시키는 핵심 트릭. 빼먹으면 스크롤 안 먹음.

### 상단 주석 블록 업데이트

```
// ── 레이아웃 (Dashboard V1.3) ──────────────────────────────────────────────
//
//  Row\Col │    Col 1 (3fr)          │    Col 2 (6fr)                │    Col 3 (3fr)
// ─────────┼─────────────────────────┼───────────────────────────────┼─────────────────────
//  R1-R2   │  마켓채팅 (top half)    │  차트 (R1-R2 span)            │  호가창 (top half)
//  R1-R3   │  ────────────────       │  ──────────────────────       │  ────────────────
//          │  관심종목 (bot half)    │                                │  체결창 (bot half)
//  R3      │                         │  글로벌지수 | 실시간수급      │
// ─────────┼─────────────────────────┼───────────────────────────────┼─────────────────────
//  R4      │  상승테마 | DART공시 | 거래량TOP | 상승/하락 | 뉴스속보
//          │  (500px 고정, 각 위젯 내부 스크롤, 0.75:0.75:0.75:0.75:1)
// ────────────────────────────────────────────────────────────────────────────────────────
//
// R4 아래 = 추후 광고 배너 자리 (500px 고정으로 예측 가능한 위치)
```

---

## 작업 5. (선택) 탭 위젯 파일 정리

`VolumeMoversTabWidget.tsx`와 `ThemesDartTabWidget.tsx`는 **삭제하지 말 것**. 다른 페이지·모바일 재사용 가능성. home에서 import만 제거된 상태로 남겨둠.

단, import 잔존 여부 확인:

```bash
grep -rE "VolumeMoversTabWidget|ThemesDartTabWidget" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v ".next"
```

`components/widgets/VolumeMoversTabWidget.tsx`, `components/widgets/ThemesDartTabWidget.tsx` 파일 자체 정의 외에 아무 import 없으면 OK (home에서 완전히 분리됨 확인).

---

## 작업 6. 빌드 + 런타임 검증

### 빌드

```
rm -rf .next
npm run build
```

빌드 에러 → **중단** + 스택 트레이스 보고.

### dev 서버 + HTTP 체크

```
pkill -f "next dev" || true
sleep 2
npm run dev > /tmp/next-dev.log 2>&1 &

for i in 1 2 3 4 5 6 7 8 9 10; do
  if grep -q "Ready" /tmp/next-dev.log 2>/dev/null; then
    echo "✅ dev 서버 ready"
    break
  fi
  sleep 2
done

curl -s -o /dev/null -w "HTTP / = %{http_code}\n" http://localhost:3333/
echo "===== 비-Yahoo 에러만 체크 ====="
tail -n 80 /tmp/next-dev.log | grep -iE "error" | grep -v "Yahoo Finance" | grep -v "auth lock" || echo "✅ No new errors"
```

`/` = 200 + Yahoo/auth lock 이외 신규 에러 0개 → 통과.

---

## 작업 7. Git commit + push

```
git add -A
git status
git commit -m "$(cat <<'EOF'
refactor: R4 flat layout + 500px fixed height + internal scroll - V1.3

Problem: NewsFeed long list expanded R4 to page 3 (minmax auto)
Problem: Tab UX unnecessary at 1.5fr wide - enough space for split

Changes:
- R4 gridTemplateRows[4]: minmax(450,auto) -> 500px fixed
- R4 gridTemplateColumns: 1.5:1.5:1 (3 tabs) -> 0.75:0.75:0.75:0.75:1 (5 widgets)
- Remove from home: VolumeMoversTabWidget, ThemesDartTabWidget imports
- Add to home R4: TrendingThemes | DartFilings | VolumeTop10 | MoversTop10 | NewsFeed
- Add size?: 'default' | 'large' prop to 4 sub-widgets (pass-through to WidgetCard)
- Enforce single scroll layer via WidgetCard body (flex-1 overflow-y-auto min-h-0)
- Apply minHeight: 0 on R4 grid items (internal scroll activation)

Tab widgets preserved in codebase for future mobile/other-page reuse.
Result: dashboard fits in ~2 pages, no R4 overflow to page 3.
EOF
)"

git push origin main
```

---

## 완료 후 필수 보고

1. 4개 위젯 size prop 추가 성공 여부 (VolumeTop10, MoversTop10, TrendingThemes, DartFilings)
2. WidgetCard body가 `flex-1 overflow-y-auto min-h-0` 적용된 상태인지 (이미 있었는지 / 추가했는지)
3. 위젯 내부에 중복 `overflow-y-auto` 있어서 제거한 곳 (있다면 파일명)
4. HomeClient R4 새 구조 적용 성공 여부 (5열, 500px)
5. 탭 위젯 2개 import 제거 확인 (grep 결과)
6. 빌드 결과 (성공/실패, 경고 수)
7. HTTP / = 200 확인
8. Yahoo/auth lock 외 신규 에러 유무
9. 커밋 해시
10. **localhost:3333 스크린샷** — 다음 확인용:
    - R4에 5개 위젯 가로 배치 (상승테마 / DART공시 / 거래량TOP / 상승/하락 / 뉴스속보)
    - R4 높이 500px (페이지 3까지 안 넘어감)
    - 뉴스속보 내부에서 마우스 휠로 스크롤 가능 (R4 높이는 그대로 유지)
    - DART공시도 동일하게 내부 스크롤

---

## 실패 시 롤백

```
git reset --hard 624d204
rm -rf .next
npm run dev
```

롤백 후 어디서 깨졌는지 에러 메시지 + 파일/줄번호 보고.

---

## 설계 근거 — 왜 이렇게 바꾸나

### 500px 고정의 이유
- `minmax(450, auto)`는 "최소 450, 최대 무한" → NewsFeed 40개 항목이면 R4가 2000px+로 팽창
- 500px 고정 = 광고 배너 위치 예측 가능 + 페이지 레이아웃 안정 + 스크롤 UX 일관성
- 500px ≒ 헤더(40) + 리스트 아이템 8~9개 노출 → 한눈에 "대충 뭐가 있는지" 스캔 가능한 크기

### 탭 해제의 이유
- 탭은 공간 부족 해결책. 0.75fr (~300px) × 2 = 1.5fr에서 둘 다 수용 가능
- "발견 존"의 본질 = **스캔 without 클릭**. 탭은 인지 비용 + 클릭 비용 추가
- Bloomberg Terminal 패러다임 = 최대 정보 밀도 → CPA funnel에 유리 (더 많은 관심 촉발점)
- 모바일에서는 여전히 탭 위젯 재사용 (보존된 이유)

### 단일 스크롤 레이어 원칙
- 위젯 내부에 `overflow-y-auto` + WidgetCard에도 `overflow-y-auto` = 이중 스크롤 → 트랙패드·마우스 휠 UX 깨짐
- 규칙: **스크롤은 WidgetCard body에서만**. 개별 위젯은 자체 overflow 금지
- `min-h-0`이 핵심 — flex child의 기본 min-height는 콘텐츠 크기라 부모를 밀어냄. 0으로 강제해야 스크롤 발생
