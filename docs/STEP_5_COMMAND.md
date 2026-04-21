<!-- 2026-04-21 -->
# Stock Terminal V3 Dashboard V1.2 — Step 5 명령서

**대상**: Claude Code (🔴 Opus 권장 — grid span 아키텍처 변경)
**실행 명령어**: `cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model opus`

---

## 목표

Step 4의 3행 그리드를 **"위 1뷰포트 + 아래 R4 발견 존" 2영역 구조**로 재설계.

### 핵심 변경

1. **Col 1 (마켓채팅 + 관심종목)** — 3행 span, 내부 1:1 수직 분할
2. **Col 2** — R1-R2 차트 span, R3에 글로벌지수 + 실시간수급 TOP 좌우 분할
3. **Col 3 (호가창 + 체결창)** — 3행 span, 내부 1:1 수직 분할
4. **R4 신규** — 발견피드 / 시장활성도 / 뉴스속보 (비율 1.5:1.5:1, 높이 400~500px)
5. **R4 위젯은 제목 텍스트 크게** (R1-R3 대비 강조)
6. **R4 탭 위젯(발견피드·시장활성도)은 기존 탭 형식 유지** (추후 여백 크면 분할로 전환 검토)

### 포지셔닝

- 마켓채팅 좌상단 = "실시간 관찰 + 커뮤니티 대화" 동시 진행 → 사용자 체류 시간 최대화 전략
- R4 = 발견·탐색 영역 + 추후 광고 배너 자리 (CPA funnel 설계와 정렬)

---

## 전제

- 직전 커밋: `f6c4606` (Step 4 — 3행 3열 + 탭 통합)
- 현재 home 위젯: 관심종목, 차트, 글로벌지수, 시장활성도 탭, 실시간수급, 발견피드 탭, 호가창, 체결창, 마켓채팅 (9개)
- 현재 home에 **없는 위젯**: 뉴스 (Step 4에서 `/news` 페이지로만 이동됨) — **이번 Step에서 R4C3으로 복귀**

---

## 작업 1. `components/home/WidgetCard.tsx` size prop 추가

파일 Read 후 구조 파악. 다음 prop 추가:

```tsx
interface Props {
  title: string;
  subtitle?: string;
  href?: string;
  size?: 'default' | 'large';  // ← 신규
  children: React.ReactNode;
}
```

**동작 차이**:

- `size="default"` (기본): 기존 title 텍스트 사이즈 그대로 (예: `text-sm font-bold`)
- `size="large"`: title 사이즈 확대 (예: `text-base font-bold` 또는 `text-lg font-bold`)
- subtitle도 함께 살짝 키우면 자연스러움 (예: `text-[10px]` → `text-xs`)

**원칙**: 기존 WidgetCard 스타일 변경하지 말고, large variant만 조건부 분기 추가. 기존 사용처 영향 0.

---

## 작업 2. NewsFeedWidget 상태 확인

`components/widgets/NewsFeedWidget.tsx`가 존재하고 WidgetCard로 래핑된 정상 컴포넌트인지 확인.

- 존재 + 정상: 그대로 사용
- 존재하지만 구조 달라졌으면: 보고 후 중단

---

## 작업 3. `components/home/HomeClient.tsx` 전면 재작성

### Imports

**추가**: `NewsFeedWidget` (R4 복귀)

**유지**: Watchlist, Chart, GlobalIndices, NetBuy, OrderBook, Tick, Chat, VolumeMoversTabWidget, ThemesDartTabWidget

**제거**: 없음 (모든 기존 import 유지)

### Grid 설계

```tsx
<div
  className="px-2 py-2"
  style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(300px,3fr) minmax(600px,6fr) minmax(300px,3fr)',
    gridTemplateRows: 'repeat(3, calc((100vh - 152px) / 3)) minmax(450px, auto)',
    gap: 8,
  }}
>
  {/* ── Col 1: Chat + Watchlist (spans R1-R3, internal 1:1 vertical split) ── */}
  <div
    id="section-col1"
    style={{
      gridRow: '1 / 4',
      gridColumn: 1,
      display: 'grid',
      gridTemplateRows: '1fr 1fr',
      gap: 8,
    }}
  >
    <div id="section-chat"><ChatWidget /></div>
    <div id="section-watchlist"><WatchlistWidget /></div>
  </div>

  {/* ── Col 2 R1-R2: Chart (span) ── */}
  <div id="section-chart" style={{ gridRow: '1 / 3', gridColumn: 2 }}>
    <ChartWidget />
  </div>

  {/* ── Col 2 R3: Global | NetBuy horizontal 1:1 subgrid ── */}
  <div
    id="section-r3-center"
    style={{
      gridRow: 3,
      gridColumn: 2,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
    }}
  >
    <div id="section-global"><GlobalIndicesWidget /></div>
    <div id="section-net-buy"><NetBuyTopWidget /></div>
  </div>

  {/* ── Col 3: OrderBook + Tick (spans R1-R3, internal 1:1 vertical split) ── */}
  <div
    id="section-col3"
    style={{
      gridRow: '1 / 4',
      gridColumn: 3,
      display: 'grid',
      gridTemplateRows: '1fr 1fr',
      gap: 8,
    }}
  >
    <div id="section-orderbook"><OrderBookWidget /></div>
    <div id="section-tick"><TickWidget /></div>
  </div>

  {/* ── R4: Discovery Row (spans full width, 1.5 : 1.5 : 1) ── */}
  <div
    id="section-r4"
    style={{
      gridRow: 4,
      gridColumn: '1 / 4',
      display: 'grid',
      gridTemplateColumns: '1.5fr 1.5fr 1fr',
      gap: 8,
    }}
  >
    <div id="section-themes-dart"><ThemesDartTabWidget size="large" /></div>
    <div id="section-volume-movers"><VolumeMoversTabWidget size="large" /></div>
    <div id="section-news"><NewsFeedWidget size="large" /></div>
  </div>
</div>
```

### 탭 위젯에 `size` prop 전달 지원

`VolumeMoversTabWidget`, `ThemesDartTabWidget`, `NewsFeedWidget` 세 컴포넌트에 `size` prop 추가:

```tsx
interface Props { size?: 'default' | 'large' }
export default function XxxTabWidget({ size = 'default' }: Props = {}) {
  return (
    <WidgetCard title="..." subtitle="..." size={size}>
      {/* 기존 내용 */}
    </WidgetCard>
  );
}
```

size prop은 그냥 WidgetCard로 전달만 하면 됨.

### 상단 주석 블록 업데이트

```
// ── 레이아웃 (Dashboard V1.2) ──────────────────────────────────────────────
//
//  Row\Col │    Col 1 (3fr)          │    Col 2 (6fr)                │    Col 3 (3fr)
// ─────────┼─────────────────────────┼───────────────────────────────┼─────────────────────
//  R1-R2   │  마켓채팅 (top half)    │  차트 (R1-R2 span)            │  호가창 (top half)
//  R1-R3   │  ────────────────       │  ──────────────────────       │  ────────────────
//          │  관심종목 (bot half)    │                                │  체결창 (bot half)
//  R3      │                         │  글로벌지수 | 실시간수급      │
// ─────────┼─────────────────────────┼───────────────────────────────┼─────────────────────
//  R4      │  발견피드 (1.5fr, 탭)   │  시장활성도 (1.5fr, 탭)       │  뉴스속보 (1fr)
// ────────────────────────────────────────────────────────────────────────────────────────
//
// R4 아래 = 추후 광고 배너 자리
```

---

## 작업 4. 빌드 + 런타임 검증

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

## 작업 5. Git commit + push

```
git add -A
git status
git commit -m "$(cat <<'EOF'
refactor: 2-zone dashboard (R1-R3 viewport + R4 discovery) - V1.2

R1-R3 (viewport):
- Col 1: Chat + Watchlist (1:1 vertical split, spans all rows)
- Col 2: Chart R1-R2 span, GlobalIndices+NetBuy R3 horizontal split
- Col 3: OrderBook + Tick (1:1 vertical split, spans all rows)

R4 (new, scroll area):
- Themes+DART tab (1.5fr) | Volume+Movers tab (1.5fr) | News (1fr)
- Enlarged title via WidgetCard size=large prop
- min-height 450px, prepares for future ad banner below

WidgetCard: add size?: 'default' | 'large' prop for title emphasis
Strategy: chat top-left for user retention, R4 for discovery+ad funnel
EOF
)"

git push origin main
```

---

## 완료 후 필수 보고

1. WidgetCard에 size prop 추가 성공 여부 + 적용된 텍스트 크기 변화 (default vs large)
2. NewsFeedWidget 상태 (정상/비정상)
3. 탭 위젯 2개 + NewsFeedWidget에 size prop 전달 성공 여부
4. 빌드 결과 (성공/실패, 경고 수)
5. HTTP / = 200 확인
6. Yahoo/auth lock 외 신규 에러 유무
7. 커밋 해시
8. **localhost:3333 스크린샷** — 다음 4개 확인용:
   - Col 1 상단에 마켓채팅, 하단에 관심종목 (1:1)
   - Col 2 상단 차트, 하단 글로벌지수 + 실시간수급 좌우
   - Col 3 상단 호가창, 하단 체결창
   - 스크롤하면 R4에 3개 위젯 가로 배치 (제목 크게)

---

## 실패 시 롤백

```
git reset --hard f6c4606
rm -rf .next
npm run dev
```

롤백 후 어디서 깨졌는지 에러 메시지 + 파일/줄번호 보고.

---

## 구조 참고 — 왜 이렇게 배치했는가

- **마켓채팅 좌상단**: 사용자가 "뻘소리하며 실시간 시장 관찰" = retention 전략. 증권사들이 안 하는 차별화 포인트.
- **호가창 + 체결창 우측 상단**: 한국 MTS 전통(키움·한투·NH) 계승. Jakob's Law — 익숙한 배치로 학습 비용 0.
- **차트 중앙 대형(R1-R2 span)**: 핵심 관찰 대상. 주변 위젯들이 차트 맥락을 보강하는 구조.
- **R3 중앙 글로벌+수급**: 차트 아래 "시장 전반 컨텍스트" 존. 차트 → 지수 → 수급 순 시선 이동 자연스러움.
- **R4 발견 존**: 스크롤 후 노출 = 디테일 탐색 모드. CPA 광고 자리 배치 시 "관심 생성 → 구매 전환" funnel과 정렬.
