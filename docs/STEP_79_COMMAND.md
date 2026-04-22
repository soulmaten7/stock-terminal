# STEP 79 — Section 4: Market Structure (시장 지도 히트맵 + 테마)

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 78 완료 — Section 3 Discovery 추가.

**목표:**
HomeClient 에 Section 4 추가 — 시장 구조 영역.
- **9:3 그리드**: 왼쪽 시장 지도 히트맵 (섹터/업종) + 오른쪽 테마 Top 10

**범위 제한:**
- 히트맵은 **CSS Grid + 동적 배경색** 으로 구현 — d3/treemap 라이브러리 추가 금지.
- 테마 데이터는 기존 `/api/stocks/themes` 있으면 재활용, 없으면 mock + TODO.
- 실제 Treemap 면적 비례(시가총액 기반) 는 이번 STEP 제외 — **동일 크기 grid 타일** 로 단순화.

---

## 작업 0 — 현재 상태 파악

```bash
find components -name "Heatmap*" -o -name "SectorMap*" -o -name "Theme*" -type f 2>/dev/null
ls app/api/stocks/sectors 2>/dev/null
ls app/api/stocks/themes 2>/dev/null
grep -rln "sector\|industry\|theme" app/api/ --include="*.ts" 2>/dev/null | head
```

보고: 히트맵/테마 위젯 존재 여부 + API 라우트 현황.

---

## 작업 1 — Section 4 컨테이너

Section 3 바로 아래에 삽입:

```tsx
{/* Section 4 — Market Structure */}
<section className="mt-4 grid grid-cols-12 gap-2">
  <div className="col-span-9 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
    <SectorHeatmapWidget />
  </div>
  <div className="col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
    <ThemeTop10Widget />
  </div>
</section>
```

---

## 작업 2 — `SectorHeatmapWidget` (왼쪽 9col)

`components/widgets/SectorHeatmapWidget.tsx` 신규.

### 구조

```
┌────────────────────────────────────────────────────────────┐
│ 시장 지도                            [KR] [US]              │
│ ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐      │
│ │IT  │금융 │소재 │산업 │헬스│에너│소비│통신│유틸│부동 │      │
│ │+1.5│-0.8│+2.3│+0.2│-1.1│+3.4│-0.5│+0.9│-0.3│+1.2 │      │
│ ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤      │
│ │삼전 │KB금융│LG화학│현대차│삼바 │S-Oil│롯데 │SKT │한전 │롯쇼  │      │
│ │+2.1│-1.2│+3.5│+0.5│-0.3│+4.2│+1.1│-0.2│-0.8│+2.3 │      │
│ │종목A│종목A│종목A│종목A│종목A│종목A│종목A│종목A│종목A│종목A│      │
│ └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘      │
└────────────────────────────────────────────────────────────┘
```

### 등락 → 색상 매핑

```ts
function heatColor(pct: number): string {
  if (pct >= 3)   return '#0ABAB5';        // 진한 초록
  if (pct >= 1)   return '#5FD5D1';        // 중간 초록
  if (pct >= 0)   return '#A8E8E5';        // 연한 초록
  if (pct >= -1)  return '#FFCCCC';        // 연한 빨강
  if (pct >= -3)  return '#FF8888';        // 중간 빨강
  return '#FF4D4D';                        // 진한 빨강
}

function textColor(pct: number): string {
  return Math.abs(pct) >= 2 ? '#FFFFFF' : '#222222';
}
```

### 구현 골격

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

type Market = 'KR' | 'US';

type SectorRow = {
  sector: string;       // IT, 금융, 소재, ...
  changePct: number;
  topStocks: Array<{ code: string; name: string; changePct: number }>;
};

function heatColor(pct: number): string {
  if (pct >= 3)   return '#0ABAB5';
  if (pct >= 1)   return '#5FD5D1';
  if (pct >= 0)   return '#A8E8E5';
  if (pct >= -1)  return '#FFCCCC';
  if (pct >= -3)  return '#FF8888';
  return '#FF4D4D';
}
function textColor(pct: number): string {
  return Math.abs(pct) >= 2 ? '#FFFFFF' : '#222222';
}

export default function SectorHeatmapWidget() {
  const [market, setMarket] = useState<Market>('KR');
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);

  useEffect(() => {
    fetch(`/api/stocks/sectors?market=${market}`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setSectors(d.items ?? []))
      .catch(() => setSectors([]));
  }, [market]);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#222]">시장 지도</h3>
        <div className="flex gap-1">
          {(['KR', 'US'] as Market[]).map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className={`px-2 h-6 text-xs rounded border ${
                market === m ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]' : 'bg-white border-[#E5E7EB]'
              }`}
            >{m}</button>
          ))}
        </div>
      </div>

      {sectors.length === 0 && (
        <div className="text-center py-8 text-[#999] text-xs">섹터 데이터 없음</div>
      )}

      {/* 섹터 헤더 행 (10개 기준) */}
      <div className="grid grid-cols-10 gap-0.5 mb-0.5">
        {sectors.map((s) => (
          <div
            key={s.sector}
            className="h-12 flex flex-col items-center justify-center text-xs font-semibold"
            style={{ backgroundColor: heatColor(s.changePct), color: textColor(s.changePct) }}
          >
            <span>{s.sector}</span>
            <span className="tabular-nums">{s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* 각 섹터의 top3 종목 행 */}
      {[0, 1, 2].map((rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-10 gap-0.5 mb-0.5">
          {sectors.map((s) => {
            const stock = s.topStocks[rowIdx];
            if (!stock) return <div key={s.sector} className="h-10 bg-[#F3F4F6]" />;
            return (
              <div
                key={s.sector}
                onClick={() => setSelected({ code: stock.code, name: stock.name, market })}
                className="h-10 flex flex-col items-center justify-center text-[10px] cursor-pointer hover:brightness-95"
                style={{ backgroundColor: heatColor(stock.changePct), color: textColor(stock.changePct) }}
              >
                <span className="truncate max-w-full px-1">{stock.name}</span>
                <span className="tabular-nums">{stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

**주의:** 10개 섹터 × 4행(헤더+top3) 고정 grid. 섹터 수가 10개 미만/초과면 CSS grid column 수 조정.

---

## 작업 3 — `ThemeTop10Widget` (오른쪽 3col)

`components/widgets/ThemeTop10Widget.tsx` 신규.

### 구조

```
┌──────────────────────┐
│ 🔥 인기 테마 Top 10   │
│ 1. AI 반도체  +3.2%  │
│ 2. 2차전지    +2.1%  │
│ 3. 바이오     -0.8%  │
│ ...                  │
└──────────────────────┘
```

### 구현 골격

```tsx
'use client';
import { useEffect, useState } from 'react';

type Theme = {
  id: string;
  name: string;
  changePct: number;
  stockCount: number;
};

export default function ThemeTop10Widget() {
  const [themes, setThemes] = useState<Theme[]>([]);
  useEffect(() => {
    fetch('/api/stocks/themes?limit=10')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setThemes(d.items ?? []))
      .catch(() => setThemes([]));
  }, []);

  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold text-[#222] mb-2">🔥 인기 테마 Top 10</h3>
      <ol className="text-xs space-y-1">
        {themes.length === 0 && (
          <li className="text-[#999] text-center py-4">테마 데이터 없음</li>
        )}
        {themes.map((t, i) => (
          <li key={t.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-[#F3F4F6] rounded">
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-[#999] w-4">{i + 1}</span>
              <span className="truncate">{t.name}</span>
              <span className="text-[10px] text-[#999]">({t.stockCount})</span>
            </span>
            <span className={`tabular-nums ${t.changePct >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF4D4D]'}`}>
              {t.changePct >= 0 ? '+' : ''}{t.changePct.toFixed(2)}%
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

---

## 작업 4 — 빌드 + 문서 + push

```bash
npm run build
```

CHANGELOG:
```
- feat(dashboard): Section 4 Market Structure — 섹터 히트맵 + 테마 Top10 (STEP 79)
```

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): Section 4 Market Structure (STEP 79)

- HomeClient Section 4 (9:3 grid)
- SectorHeatmapWidget: 10섹터 × 4행 CSS grid + 등락 히트컬러
- ThemeTop10Widget: 인기 테마 리스트
- KR/US 마켓 토글
- API 없는 경우 빈 상태 + TODO

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 79 완료
- Section 4 9:3 grid
- SectorHeatmapWidget: <신규/재활용>
- ThemeTop10Widget: <신규/재활용>
- API 라우트:
  · /api/stocks/sectors: <존재/mock>
  · /api/stocks/themes: <존재/mock>
- npm run build: 성공
- git commit: <hash>
```

---

## 주의사항

- **색상 6단계 히트맵** — 브랜드 티어(#0ABAB5) / 레드(#FF4D4D) 변주. 다른 색 추가 금지.
- **Treemap 면적 비례** — V3 범위 외. 동일 타일 크기 유지.
- **섹터 Top3 없으면 회색 빈 칸** — 데이터 누락도 레이아웃 깨지지 않게.
- **종목 클릭 → selectedSymbolStore** — Section 1 상세 패널 연동.
