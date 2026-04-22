# STEP 76 — Section 2: Pre-Market & Global

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 75 완료 (`7fc5137`) — Section 1 완결.

**목표:**
HomeClient 에 Section 2 추가 — `4col 장전 브리핑 + 8col 글로벌 지수 확장판`.
- 장전 브리핑: 기존 `/briefing` 페이지용 컴포넌트 재활용 or 축약 래퍼 신규
- 글로벌 지수: 기존 `GlobalIndicesWidget` 확장 — 5그룹 17개 지표 + 7일 미니 스파크라인

**범위 제한:**
- 새 API 라우트 추가는 필요한 경우만 (환율/원자재/채권/암호 데이터가 없으면).
- 스파크라인은 **SVG polyline 직접 그리기** — 차트 라이브러리 추가 금지.
- AI 요약 블록은 장전 브리핑에서 **생략 또는 단순 팩트 문장**으로 대체 (V3 규칙: AI 리포트 제외).

---

## 작업 0 — 현재 상태 파악

```bash
# 1) 기존 위젯 위치
find components -name "BriefingWidget*" -o -name "GlobalIndicesWidget*" -type f 2>/dev/null
find app/briefing app/global -type f 2>/dev/null

# 2) 기존 API 라우트
ls app/api/briefing 2>/dev/null
ls app/api/global 2>/dev/null
grep -rln "exchange\|wti\|gold\|bitcoin\|treasury\|환율\|원자재" app/api/ lib/ --include="*.ts" 2>/dev/null | head

# 3) HomeClient 현재 구조 (Section 2 자리 있나)
grep -n "Section" components/home/HomeClient.tsx 2>/dev/null
```

보고: 기존 위젯 재활용 가능 여부, 누락 데이터 영역.

---

## 작업 1 — HomeClient 에 Section 2 컨테이너 추가

Section 1 바로 아래에 삽입:

```tsx
{/* Section 2 — Pre-Market & Global (4:8) */}
<section className="mt-4 grid grid-cols-12 gap-2">
  <div className="col-span-4 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
    <BriefingWidget compact />
  </div>
  <div className="col-span-8 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
    <GlobalIndicesWidget expanded />
  </div>
</section>
```

- 높이: 자연스럽게 콘텐츠 크기. 대략 `min-h-[500px]` 이하.
- 두 위젯 모두 `compact` / `expanded` prop 없으면 **추가**하여 홈 축약 모드를 분기.

---

## 작업 2 — 장전 브리핑 (BriefingWidget)

기존 컴포넌트 재활용. `compact` prop 추가 시:

- 한국 전일 종가 (KOSPI / KOSDAQ)
- 미국 전일 종가 (S&P / NASDAQ / DJI)
- 오늘 주요 경제 이벤트 3~5건 (경제 캘린더 API 재활용)
- **AI 한 줄 요약 자리는 생략** — 대신 "오늘 주요 이벤트" 블록으로 대체

**없으면 신규:**
`components/widgets/BriefingWidget.tsx` 간단 버전:
- 위 3블록만 세로 스택
- 각 블록 h3 + 2~3줄 데이터

---

## 작업 3 — 글로벌 지수 확장 (GlobalIndicesWidget)

기존 위젯에 `expanded` prop 추가.

### 5그룹 17개 지표 구조

```
지수 (6)    │  S&P 500    DJI          NDX100       Nikkei 225   HSI          상해종합
환율 (4)    │  USD/KRW    JPY/KRW      EUR/USD      CNH/KRW
원자재 (3)  │  WTI        Gold         Copper
채권 (2)    │  10Y US     10Y KR
암호화폐 (2) │  BTC        ETH
```

### 각 셀 포맷

```
┌────────────────────┐
│ S&P 500            │  ← 라벨
│ 5,678.90           │  ← 현재값 (text-lg, bold, tabular-nums)
│ ▲ +0.45%  ╱╲╱‾╲╱  │  ← 등락 + 7일 스파크라인 (SVG)
└────────────────────┘
```

- 등락 `+` 는 `#0ABAB5`, `-` 는 `#FF4D4D`, `0` 은 `#444`
- 스파크라인은 SVG polyline, 폭 60px × 높이 20px
- 스파크라인 색: 등락 방향과 동일

### 스파크라인 구현

```tsx
function Sparkline({ points }: { points: number[] }) {
  if (!points.length) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 60, H = 20, PAD = 1;
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * (W - 2 * PAD) + PAD;
    const y = H - PAD - ((v - min) / range) * (H - 2 * PAD);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const up = points[points.length - 1] >= points[0];
  const stroke = up ? '#0ABAB5' : '#FF4D4D';
  return (
    <svg width={W} height={H} aria-hidden="true">
      <polyline points={coords} fill="none" stroke={stroke} strokeWidth="1.2" />
    </svg>
  );
}
```

### 데이터 소스 조사 (작업 0 결과에 따라)

- 지수·암호: 기존 `GlobalIndicesWidget` 이 이미 소스 보유 → 재활용
- 환율/원자재/채권: 누락 가능성 → `/api/global/quotes?symbols=...` 확장 or 별도 라우트 추가
- 필요 시 공개 API: Yahoo Finance (비공식, 불안정 주의) / FRED (미 채권 공식) / CoinGecko (암호 공식)

**미구현 그룹은 UI에 `—` placeholder 유지 + TODO 주석.**

---

## 작업 4 — 빌드 + 문서 + push

```bash
npm run build
```

문서 4개 갱신 (날짜 `2026-04-23`), CHANGELOG:
```
- feat(dashboard): Section 2 Pre-Market & Global 추가 — 장전 브리핑 + 글로벌 지수 확장 17지표 (STEP 76)
```

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): Section 2 Pre-Market & Global (STEP 76)

- HomeClient에 Section 2 추가 (4:8 grid)
- BriefingWidget compact 모드 (KR/US 전일 + 주요 이벤트)
- GlobalIndicesWidget expanded 모드 (5그룹 17지표 + SVG 스파크라인)
- 데이터 소스 없는 그룹은 — placeholder + TODO

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 76 완료
- Section 2 4:8 grid 삽입
- BriefingWidget compact: <재활용/신규>, KR/US 전일 + 이벤트
- GlobalIndicesWidget expanded:
  · 지수 6: <소스>
  · 환율 4: <소스 or TODO>
  · 원자재 3: <소스 or TODO>
  · 채권 2: <소스 or TODO>
  · 암호 2: <소스 or TODO>
- npm run build: 성공
- git commit: <hash>
```

---

## 주의사항

- **AI 요약 금지** — 장전 브리핑에서 AI 블록 생략, 단순 팩트만.
- **스파크라인 데이터** — 7일 시계열. 기존 API가 latest만 주면 TODO 유지.
- **Yahoo Finance 비공식** — 폴백 용도만, 프로덕션 의존 주의. 불안정하면 TODO.
