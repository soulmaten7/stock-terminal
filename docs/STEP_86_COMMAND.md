# STEP 86 — 신규 화면 3개 (/market-map, /themes, /sec-stream)

**작성일**: 2026-04-23
**실행 명령어**:
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표**: 홈 대시보드 위젯의 "전체보기" 링크가 가리키는 3개 풀스크린 페이지 구축.

**전제 상태**: STEP 85 완료된 상태. 커밋 후 빌드 성공 확인 필요.

**원칙**:
- 모든 페이지는 기존 WidgetHeader 디자인 시스템 재사용
- 데이터는 기존 API 재사용 (새 API 생성 최소화)
- max-w-[1600px] min-w-[1280px] 대시보드 폭 규약 일관 유지

---

## Work Block 1 — /market-map 페이지 (섹터 지도 확장판)

**역할**: SectorHeatmapWidget의 풀스크린 확장 — 섹터별 히트맵 + 각 섹터 TOP 5 종목 드릴다운.

### 1-1. 새 파일 생성: `app/market-map/page.tsx`

```tsx
import MarketMapClient from './MarketMapClient';

export const metadata = { title: '섹터 지도 · Stock Terminal' };

export default function Page() {
  return <MarketMapClient />;
}
```

### 1-2. 새 파일 생성: `app/market-map/MarketMapClient.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import WidgetHeader from '@/components/dashboard/WidgetHeader';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

interface Sector { sector: string; change: number; count: number; }
interface Stock { symbol: string; name: string; changePct: number | null; }

type Market = 'KR' | 'US';

function heatColor(change: number): string {
  const c = Math.max(-5, Math.min(5, change));
  if (c > 0) {
    const a = Math.round((c / 5) * 200 + 30);
    return `rgba(255,59,48,${(a / 255).toFixed(2)})`;
  }
  if (c < 0) {
    const a = Math.round((Math.abs(c) / 5) * 200 + 30);
    return `rgba(0,81,204,${(a / 255).toFixed(2)})`;
  }
  return '#F3F4F6';
}

function textColor(change: number): string {
  return Math.abs(change) > 1.5 ? '#FFFFFF' : '#222222';
}

export default function MarketMapClient() {
  const [market, setMarket] = useState<Market>('KR');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [sectorStocks, setSectorStocks] = useState<Stock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);

  useEffect(() => {
    setLoading(true);
    setSelectedSector(null);
    setSectorStocks([]);
    fetch(`/api/home/sectors?market=${market}`)
      .then((r) => (r.ok ? r.json() : { sectors: [] }))
      .then((d) => setSectors(d.sectors ?? []))
      .catch(() => setSectors([]))
      .finally(() => setLoading(false));
  }, [market]);

  const openSector = (sector: string) => {
    setSelectedSector(sector);
    setStocksLoading(true);
    // KR: Supabase 스크리너를 sector 필터로, US: 간단히 빈 배열
    if (market === 'KR') {
      fetch(`/api/stocks/screener?limit=20&orderBy=market_cap&order=desc`)
        .then((r) => (r.ok ? r.json() : { stocks: [] }))
        .then((d) => {
          const filtered = (d.stocks ?? [])
            .filter((s: Record<string, unknown>) => s.sector === sector)
            .slice(0, 10)
            .map((s: Record<string, unknown>) => ({
              symbol: (s.symbol as string) ?? '',
              name: (s.name_ko as string) ?? '',
              changePct: null,
            }));
          setSectorStocks(filtered);
        })
        .catch(() => setSectorStocks([]))
        .finally(() => setStocksLoading(false));
    } else {
      setSectorStocks([]);
      setStocksLoading(false);
    }
  };

  const marketToggle = (
    <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB]">
      {(['KR', 'US'] as Market[]).map((m) => (
        <button
          key={m}
          onClick={() => setMarket(m)}
          className={`px-3 h-7 text-xs font-bold ${
            market === m ? 'bg-[#0ABAB5] text-white' : 'bg-white text-[#666] hover:bg-[#F3F4F6]'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1600px] min-w-[1280px] mx-auto px-4 py-4">
      <div className="bg-white border border-[#E5E7EB]">
        <WidgetHeader title="섹터 지도" subtitle={market === 'KR' ? 'KRX 섹터 ETF' : 'SPDR 섹터 ETF'} actions={marketToggle} />

        <div className="grid grid-cols-12 gap-0 min-h-[600px]">
          {/* 좌측: 히트맵 그리드 (8 cols) */}
          <div className="col-span-8 border-r border-[#E5E7EB] p-4">
            {loading ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} className="h-28 bg-[#F0F0F0] animate-pulse rounded" />
                ))}
              </div>
            ) : sectors.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-[#999]">데이터 없음</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {sectors.map((s) => (
                  <button
                    key={s.sector}
                    onClick={() => openSector(s.sector)}
                    className={`h-28 rounded p-3 flex flex-col justify-between text-left transition-all hover:scale-[1.02] ${
                      selectedSector === s.sector ? 'ring-2 ring-[#0ABAB5]' : ''
                    }`}
                    style={{ background: heatColor(s.change) }}
                  >
                    <span className="text-xs font-semibold leading-tight" style={{ color: textColor(s.change) }}>
                      {s.sector}
                    </span>
                    <div style={{ color: textColor(s.change) }}>
                      <div className="text-2xl font-bold tabular-nums">
                        {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                      </div>
                      <div className="text-[10px] opacity-80">{s.count}개 종목</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 섹터별 종목 리스트 (4 cols) */}
          <div className="col-span-4 p-4">
            <div className="text-xs font-bold text-[#222] mb-3">
              {selectedSector ? `${selectedSector} — 주요 종목` : '섹터를 선택하세요'}
            </div>
            {stocksLoading && <div className="text-xs text-[#999]">로딩 중...</div>}
            {!stocksLoading && selectedSector && sectorStocks.length === 0 && (
              <div className="text-xs text-[#999]">해당 섹터 종목 데이터 없음</div>
            )}
            {!stocksLoading && sectorStocks.length > 0 && (
              <ol className="space-y-1">
                {sectorStocks.map((stock, i) => (
                  <li
                    key={stock.symbol}
                    onClick={() => setSelected({ code: stock.symbol, name: stock.name, market: 'KR' })}
                    className="flex items-center gap-2 py-2 px-2 rounded hover:bg-[#F3F4F6] cursor-pointer"
                  >
                    <span className="text-[#999] text-xs w-5">{i + 1}</span>
                    <span className="font-medium text-xs text-black flex-1 truncate">{stock.name}</span>
                    <span className="text-[10px] text-[#999] tabular-nums">{stock.symbol}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 1-3. 섹터 히트맵 위젯의 href 연결

`components/widgets/SectorHeatmapWidget.tsx` 60번 줄을:
```tsx
<WidgetHeader title="섹터 히트맵" href="/market-map" actions={marketToggle} />
```

그리고 59번 줄 `{/* TODO: ... */}` 주석 삭제.

### 검증
```bash
npm run build 2>&1 | tail -20
```

빌드 후 `/market-map` 접속 → 히트맵 표시, 섹터 클릭 시 우측에 종목 리스트 표시 확인.

---

## Work Block 2 — /themes 페이지 (테마 확장판)

**역할**: TrendingThemesWidget + ThemeTop10Widget 통합 풀스크린. 좌측 테마 리스트, 우측 선택된 테마의 종목 상세.

### 2-1. 기존 파일 확인 필요

먼저 다음 위젯 존재 여부와 API 구조 확인:
```bash
grep -l "TrendingThemesWidget\|ThemeTop10Widget" /sessions/admiring-modest-johnson/mnt/OTMarketing/components/widgets/*.tsx
ls /sessions/admiring-modest-johnson/mnt/OTMarketing/app/api/themes/ 2>/dev/null || echo "no themes api"
```

### 2-2. 새 파일 생성: `app/themes/page.tsx`

```tsx
import ThemesClient from './ThemesClient';

export const metadata = { title: '테마주 · Stock Terminal' };

export default function Page() {
  return <ThemesClient />;
}
```

### 2-3. 새 파일 생성: `app/themes/ThemesClient.tsx`

⚠️ **주의**: TrendingThemesWidget / ThemeTop10Widget의 실제 API 시그니처를 먼저 읽고 맞춰서 작성. 아래는 일반적 틀.

```tsx
'use client';

import TrendingThemesWidget from '@/components/widgets/TrendingThemesWidget';
import ThemeTop10Widget from '@/components/widgets/ThemeTop10Widget';
import WidgetHeader from '@/components/dashboard/WidgetHeader';

export default function ThemesClient() {
  return (
    <div className="max-w-[1600px] min-w-[1280px] mx-auto px-4 py-4 flex flex-col gap-4">
      {/* 상단: 인기 테마 추이 */}
      <div className="bg-white border border-[#E5E7EB] h-[480px] overflow-hidden">
        <TrendingThemesWidget />
      </div>

      {/* 하단: 테마별 TOP 10 */}
      <div className="bg-white border border-[#E5E7EB] h-[520px] overflow-hidden">
        <ThemeTop10Widget />
      </div>
    </div>
  );
}
```

**Note**: 위젯이 prop 없이 동작하는지 먼저 확인. Compact 모드 prop이 있다면 풀스크린에선 생략. 위젯이 자체적으로 `h-full`을 기대하면 부모 컨테이너에 `overflow-hidden` 필수 (이미 적용됨).

### 2-4. ThemeTop10Widget의 href 연결

`components/widgets/ThemeTop10Widget.tsx`에서 `<WidgetHeader title="..." ... />` 부분에 `href="/themes"` 추가.
(정확한 제목은 해당 파일 읽고 맞출 것)

마찬가지로 `TrendingThemesWidget.tsx`도 `href="/themes"` 추가.

### 검증
```bash
npm run build 2>&1 | tail -20
```

빌드 후 `/themes` 접속 → 두 위젯이 세로로 쌓여 표시되는지 확인.

---

## Work Block 3 — /sec-stream 페이지 (공시 스트림 확장판)

**역할**: DisclosureStreamWidget의 풀스크린 — DART + SEC 공시 피드 통합.

### 3-1. 기존 /disclosures 확인

```bash
cat /sessions/admiring-modest-johnson/mnt/OTMarketing/app/disclosures/page.tsx
```

현재 `/disclosures`가 16줄짜리 stub인 것으로 파악됨. 이를 업그레이드하거나, 새 경로 `/sec-stream`으로 신설.

### 결정: `/disclosures`를 리팩토링 (새 경로 추가하지 말고 기존 활용)

`DisclosureStreamWidget`가 이미 있으니 그걸 풀스크린에 넣는 형태.

### 3-2. 파일 수정: `app/disclosures/page.tsx`

```tsx
import DisclosuresClient from './DisclosuresClient';

export const metadata = { title: '공시 스트림 · Stock Terminal' };

export default function Page() {
  return <DisclosuresClient />;
}
```

### 3-3. 새 파일 생성: `app/disclosures/DisclosuresClient.tsx`

```tsx
'use client';

import DisclosureStreamWidget from '@/components/widgets/DisclosureStreamWidget';
import DartFilingsWidget from '@/components/widgets/DartFilingsWidget';

export default function DisclosuresClient() {
  return (
    <div className="max-w-[1600px] min-w-[1280px] mx-auto px-4 py-4 grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 80px)' }}>
      {/* 좌측: 실시간 스트림 (전체) */}
      <div className="col-span-7 bg-white border border-[#E5E7EB] overflow-hidden">
        <DisclosureStreamWidget />
      </div>

      {/* 우측: 선택 종목 공시 */}
      <div className="col-span-5 bg-white border border-[#E5E7EB] overflow-hidden">
        <DartFilingsWidget />
      </div>
    </div>
  );
}
```

### 3-4. DisclosureStreamWidget의 href 연결

`components/widgets/DisclosureStreamWidget.tsx`에서 `<WidgetHeader title="..." ... />`에 `href="/disclosures"` 추가.

### 검증
```bash
npm run build 2>&1 | tail -20
```

빌드 후 `/disclosures` 접속 → 두 위젯이 좌우로 배치되는지 확인.

---

## Work Block 4 — 사이드바 링크 업데이트 (선택)

사이드바 네비게이션에 `/market-map`, `/themes`, `/disclosures` 링크가 이미 있으면 skip. 없으면 추가.

```bash
grep -rn "market-map\|themes\|disclosures" /sessions/admiring-modest-johnson/mnt/OTMarketing/components/nav/ 2>/dev/null
```

결과 보고 판단 — 누락된 항목만 사이드바 적절한 그룹에 추가.

---

## Work Block 5 — 문서 업데이트 + Git Commit & Push

### 5-1. 날짜 업데이트 (4개 파일)

**파일 1: `CLAUDE.md`** — 첫 줄 헤더 날짜 `2026-04-23`.

**파일 2: `docs/CHANGELOG.md`** — 최상단에 추가:
```markdown
## 2026-04-23 — STEP 86: 신규 화면 3개

- `/market-map` 섹터 지도 페이지 신설 (히트맵 + 섹터별 드릴다운)
- `/themes` 테마주 풀스크린 페이지 신설
- `/disclosures` 공시 스트림 페이지 리팩토링 (stub → 실데이터)
- 홈 위젯 3개 href 연결 (섹터 히트맵 / 테마 / 공시)
```

**파일 3: `session-context.md`** — 완료 블록 추가.

**파일 4: `docs/NEXT_SESSION_START.md`** — STEP 86 완료 반영.

### 5-2. Git commit + push

```bash
cd ~/Desktop/OTMarketing
git add -A
git commit -m "STEP 86: 신규 화면 3개 (/market-map + /themes + /disclosures 풀스크린)"
git push
```

### 5-3. 최종 빌드 검증
```bash
npm run build 2>&1 | tail -30
```

---

## 완료 보고 형식

```
✅ STEP 86 완료
- Block 1: /market-map 페이지 — ✅
- Block 2: /themes 페이지 — ✅
- Block 3: /disclosures 리팩토링 — ✅
- Block 4: 사이드바 업데이트 — ✅/N/A
- Block 5: 문서 + push — ✅ (커밋 해시: xxxxxxx)
- 빌드 상태: 성공 / 실패
- 주의사항: (있으면)
```

---

## 롤백 방법 (문제 발생 시)

```bash
cd ~/Desktop/OTMarketing
git reset --hard HEAD~1
git push --force-with-lease  # ⚠️ 사용자 확인 필수
```
