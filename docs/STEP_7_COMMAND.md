<!-- 2026-04-21 -->
# Stock Terminal V3 Dashboard V1.4 — Step 7 명령서

**대상**: Claude Code (Sonnet OK — 단일 파일, 소규모 수정)
**실행 명령어**: `cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet`

---

## 목표

Step 6의 R4 문제 2가지 해결:

1. **페이지 2가 꽉 차지 않음** — R4(500px 고정) 아래로 빈 공간 300~400px 후 푸터. R4 높이를 **뷰포트 기반 동적 계산**으로 변경해서 페이지 2가 정확히 한 화면에 꽉 차게.
2. **R4 위젯 순서 재배치** — F-pattern + narrative(가격 움직임 → 원인 → 최신성) 정렬.

---

## 전제

- 직전 커밋: `d4ab8ae` (Step 6 — R4 flat 5 widgets, 500px 고정)
- 현재 R4 위젯 순서: `TrendingThemes | DartFilings | VolumeTop10 | MoversTop10 | NewsFeed`
- 현재 R4 높이: `500px` 고정
- 푸터 높이: 약 280px (서비스안내·약관·광고·고객지원 4열 + 하단 등록번호 + 패딩)

---

## 작업 1. `components/home/HomeClient.tsx` — R4 높이 변경

### Grid Template Rows 수정

**현재**:
```tsx
gridTemplateRows: 'repeat(3, calc((100vh - 152px) / 3)) 500px',
```

**변경**:
```tsx
gridTemplateRows: 'repeat(3, calc((100vh - 152px) / 3)) max(500px, calc(100vh - 280px))',
```

**설명**:
- `max(500px, calc(100vh - 280px))` — CSS `max()` 함수로 둘 중 큰 값 선택
- 일반 데스크톱(1080p+): `calc(100vh - 280px)` 승리 → R4가 뷰포트-푸터 크기로 확장
- 작은 화면(768px 이하 세로): `500px` 승리 → 최소 높이 보장

**계산**:
- 총 바디 높이 = (100vh - 152px) + max(500, 100vh - 280)
- 100vh = 1000px 기준: R4 = 720px → 총 = 848 + 720 = 1568px + header 152 = 1720px
- 페이지 1 = 0 ~ 1000px (header 152 + R1-R3 848)
- 페이지 2 = 1000 ~ 2000px (R4 720 + footer 280)
- → **정확히 2 페이지에 맞춰짐**

---

## 작업 2. `components/home/HomeClient.tsx` — R4 위젯 순서 재배치

### 현재 순서 (Step 6)

```tsx
<div id="section-themes"><TrendingThemesWidget size="large" /></div>
<div id="section-dart"><DartFilingsWidget size="large" /></div>
<div id="section-volume"><VolumeTop10Widget size="large" /></div>
<div id="section-movers"><MoversTop10Widget size="large" /></div>
<div id="section-news"><NewsFeedWidget size="large" /></div>
```

### 새 순서 (Step 7)

```tsx
<div id="section-movers" style={{ minHeight: 0 }}>
  <MoversTop10Widget size="large" />
</div>
<div id="section-volume" style={{ minHeight: 0 }}>
  <VolumeTop10Widget size="large" />
</div>
<div id="section-themes" style={{ minHeight: 0 }}>
  <TrendingThemesWidget size="large" />
</div>
<div id="section-dart" style={{ minHeight: 0 }}>
  <DartFilingsWidget size="large" />
</div>
<div id="section-news" style={{ minHeight: 0 }}>
  <NewsFeedWidget size="large" />
</div>
```

**주의**: `minHeight: 0` 유지 (Step 6에서 스크롤 작동시키는 필수 속성). 기존 래퍼 div들 그대로 두고 **순서만 재배열**.

---

## 작업 3. 상단 주석 블록 업데이트

```
// ── 레이아웃 (Dashboard V1.4) ──────────────────────────────────────────────
//
//  Row\Col │    Col 1 (3fr)          │    Col 2 (6fr)                │    Col 3 (3fr)
// ─────────┼─────────────────────────┼───────────────────────────────┼─────────────────────
//  R1-R2   │  마켓채팅 (top half)    │  차트 (R1-R2 span)            │  호가창 (top half)
//  R1-R3   │  ────────────────       │  ──────────────────────       │  ────────────────
//          │  관심종목 (bot half)    │                                │  체결창 (bot half)
//  R3      │                         │  글로벌지수 | 실시간수급      │
// ─────────┼─────────────────────────┼───────────────────────────────┼─────────────────────
//  R4      │  상승/하락 | 거래량TOP | 상승테마 | DART공시 | 뉴스속보
//          │  (max(500px, 100vh-280px), 내부 스크롤, 0.75:0.75:0.75:0.75:1)
// ────────────────────────────────────────────────────────────────────────────────────────
//
// R4 순서 논리: 가격 움직임(Movers·Volume) → 원인(Themes·DART) → 최신성(News)
// 페이지 높이 = 200vh 정확히 — R4가 뷰포트-푸터 채움
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
refactor: R4 viewport-filling height + reorder widgets (price->cause->news) - V1.4

Problem 1: page 2 had 300-400px empty space between R4 (500px fixed) and footer
Problem 2: R4 order started with themes/filings instead of price movements

Changes:
- R4 height: 500px -> max(500px, calc(100vh - 280px))
  - Fills viewport minus footer (~280px) for exactly 2-page layout
  - 500px minimum fallback for small screens
- R4 order: Themes|DART|Volume|Movers|News
             -> Movers|Volume|Themes|DART|News
  - F-pattern: eye-catching price movements first
  - Narrative: what's moving -> why -> latest context
  - Retention: price shock -> curiosity -> news consumption funnel
EOF
)"

git push origin main
```

---

## 완료 후 필수 보고

1. gridTemplateRows 4번째 값 변경 확인 (max 함수 적용됨)
2. R4 내부 5개 위젯 순서 변경 확인 (Movers → Volume → Themes → DART → News)
3. 빌드 결과 (성공/실패, 경고 수)
4. HTTP / = 200 확인
5. Yahoo/auth lock 외 신규 에러 유무
6. 커밋 해시
7. **localhost:3333 스크린샷 2장**:
   - 페이지 1: R1-R3 (채팅·차트·호가 등)
   - 페이지 2: R4 5개 위젯 (순서 확인) + 푸터 (빈 공간 없이 꽉 찬지)
8. 뷰포트 높이 대비 페이지 2가 정확히 한 화면에 꽉 차는지 주관적 판단

---

## 실패 시 롤백

```
git reset --hard d4ab8ae
rm -rf .next
npm run dev
```

롤백 후 어디서 깨졌는지 에러 메시지 + 파일/줄번호 보고.

---

## 설계 근거

### 왜 `max(500px, calc(100vh - 280px))`

1. **CSS `max()` 함수**: 두 값 중 큰 값 선택 — 반응형 대응
2. **280px**: 푸터 측정값 (서비스안내/약관/광고/고객지원 4열 + 하단 등록번호 + 패딩)
3. **500px 최소값**: 매우 작은 뷰포트에서도 R4 위젯이 쓸 만한 크기 유지
4. **총 페이지 높이 = 200vh**: R1-R3 = 100vh - 152px(header), R4 = 100vh - 280px, footer = 280px, header = 152px → 합산 정확히 200vh

### 왜 이 순서 (Movers → Volume → Themes → DART → News)

**F-pattern 읽기 원리**: 사용자는 좌→우로 읽으며 첫 요소에 가장 집중. 가장 시선 끌기 쉬운 걸 왼쪽에 배치.

**Narrative 순서**:
1. **상승/하락 TOP10** — 가격 움직임의 극단값. "뭐가 움직였지?" 즉각 답
2. **거래량 급등 TOP10** — 가격 움직임의 원동력. "왜 이렇게 거래됐지?" 확장
3. **상승 테마** — 움직임의 배경 스토리. "어떤 테마로 묶이지?"
4. **DART 공시** — 움직임의 구조적 원인. "공시 이벤트 있었나?"
5. **뉴스 속보** — 최신 맥락. "지금 무슨 일이?"

**Retention 관점**: 가격 충격(관심 유발) → 원인 탐색(체류) → 뉴스 소비(체류 연장). 광고 배너가 R4 아래일 때 "관심 → 이해 → 행동" funnel과 정렬.

**기존 순서 대비**: 기존은 "스토리 먼저 → 가격 결과" 순서였는데, 개인투자자 실제 행동 패턴은 "가격 충격 먼저 → 스토리 탐색"에 가까움. 새 순서가 user mental model에 더 맞음.
