# STEP 34 — 테마 JSON 큐레이션 + `/api/themes` + 두 위젯 실데이터 연결

**🚀 실행 명령어 (Sonnet):**

```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

Claude Code 세션에서:

```
@docs/STEP_34_COMMAND.md 파일 내용대로 실행해줘
```

---

## 전제 상태

- 이전 커밋: `4318893` (STEP 33 /analysis 더미 제거 + MarketFlow 실데이터)
- 남아있는 하드코딩 더미 2곳:
  - `components/widgets/TrendingThemesWidget.tsx` — 홈 R4, 5개 테마 가짜 (TODO 주석 명시)
  - `components/analysis-page/ThemeGroups.tsx` — STEP 33에서 ComingSoonCard로 임시 처리됨
- 두 곳 모두 동일한 "테마 분류" 데이터 필요 → 하나의 JSON 시드 + 하나의 API로 통합

## 목표

경제 캘린더 (Phase 2-C, STEP 31)와 동일한 전략:
1. 수동 큐레이션 JSON 시드 생성 (`data/themes.json`)
2. `/api/themes` 엔드포인트가 JSON + KIS 실시간 가격을 합성해서 테마별 평균 등락률 반환
3. 두 위젯 동시에 실데이터 연결
4. 월 1회 업데이트 가이드 문서화

## 변경 사항

### 1. `data/themes.json` 생성 (큐레이션 시드)

파일: `data/themes.json`

```json
{
  "updatedAt": "2026-04-22",
  "source": "수동 큐레이션 — KRX 시가총액 상위 + 테마주 대표종목 (한경 테마분류 / 네이버 금융 테마 교차 검증)",
  "updateFrequency": "월 1회 또는 테마 지형 변동 시",
  "themes": [
    { "name": "반도체",        "stocks": ["005930", "000660", "042700", "058470"] },
    { "name": "2차전지",       "stocks": ["006400", "373220", "247540", "086520"] },
    { "name": "바이오",        "stocks": ["207940", "068270", "196170", "091990"] },
    { "name": "자동차",        "stocks": ["005380", "000270", "012330"] },
    { "name": "AI·소프트웨어", "stocks": ["035420", "035720", "377300"] },
    { "name": "방산",          "stocks": ["272210", "079550", "012450"] },
    { "name": "조선",          "stocks": ["009540", "010140", "329180"] },
    { "name": "금융",          "stocks": ["055550", "105560", "086790", "316140"] },
    { "name": "에너지·정유",   "stocks": ["096770", "010950", "267250"] },
    { "name": "화학",          "stocks": ["051910", "009830", "011170"] },
    { "name": "유통·식품",     "stocks": ["023530", "139480", "097950"] },
    { "name": "게임",          "stocks": ["036570", "251270", "293490", "259960"] },
    { "name": "미디어·엔터",   "stocks": ["352820", "041510", "035900", "122870"] },
    { "name": "건설",          "stocks": ["000720", "006360", "028050"] },
    { "name": "원전·인프라",   "stocks": ["034020", "100090"] }
  ]
}
```

**총 15개 테마 × 2~4종목 = 50개 고유 종목**. 종목 겹침(예: 005930 삼성전자 = 반도체)으로 순수 호출 수는 이보다 적을 수 있음.

### 2. `/api/themes/route.ts` 생성

파일: `app/api/themes/route.ts`

```ts
import { NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';
import themesData from '@/data/themes.json';

interface ThemeEntry { name: string; stocks: string[]; }

// In-memory cache (10분 TTL)
interface CachedResult {
  themes: Array<{ name: string; change: number; count: number; stocks: Array<{ symbol: string; name: string; change: number; price: number }> }>;
  updatedAt: number;
}
let cache: CachedResult | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function fetchStockPrice(symbol: string) {
  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-price',
      trId: 'FHKST01010100',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: symbol,
      },
    });
    const o = data.output;
    if (!o) return null;
    return {
      symbol,
      name: o.hts_kor_isnm as string,
      price: parseInt(o.stck_prpr, 10),
      change: parseFloat(o.prdy_ctrt),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  // 캐시 히트
  if (cache && Date.now() - cache.updatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      themes: cache.themes,
      cachedAt: new Date(cache.updatedAt).toISOString(),
      source: themesData.source,
    });
  }

  // 전체 고유 종목 수집
  const allSymbols = Array.from(
    new Set((themesData.themes as ThemeEntry[]).flatMap((t) => t.stocks))
  );

  // 병렬 호출 (lib/kis.ts 내부 RATE_LIMIT_MS로 자동 직렬화)
  const prices = await Promise.all(allSymbols.map(fetchStockPrice));
  const priceMap = new Map<string, { name: string; price: number; change: number }>();
  prices.forEach((p) => { if (p) priceMap.set(p.symbol, { name: p.name, price: p.price, change: p.change }); });

  // 테마별 집계
  const themes = (themesData.themes as ThemeEntry[]).map((t) => {
    const resolvedStocks = t.stocks
      .map((sym) => {
        const info = priceMap.get(sym);
        return info ? { symbol: sym, name: info.name, price: info.price, change: info.change } : null;
      })
      .filter((s): s is { symbol: string; name: string; price: number; change: number } => s !== null);

    const avgChange = resolvedStocks.length > 0
      ? resolvedStocks.reduce((acc, s) => acc + s.change, 0) / resolvedStocks.length
      : 0;

    return {
      name: t.name,
      change: Number(avgChange.toFixed(2)),
      count: resolvedStocks.length,
      stocks: resolvedStocks,
    };
  });

  cache = { themes, updatedAt: Date.now() };

  return NextResponse.json({
    themes,
    cachedAt: new Date().toISOString(),
    source: themesData.source,
  });
}
```

**설계 포인트**:
- 10분 인메모리 캐시 — 첫 호출만 KIS 대량 호출, 이후 10분간 즉시 응답
- `Promise.all` 로 병렬 호출, `lib/kis.ts`의 `RATE_LIMIT_MS` 가 내부 큐잉
- 실패한 종목은 `null` → 테마 집계 시 제외 (일부 실패해도 전체 응답 가능)
- `avgChange` = 테마 내 성공한 종목 등락률 평균 (가중치 없음 — 초안)

### 3. `TrendingThemesWidget.tsx` 실데이터 연결

파일: `components/widgets/TrendingThemesWidget.tsx` — 기존 하드코딩 `THEMES` 배열 제거, useEffect + fetch로 교체:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import WidgetCard from '@/components/home/WidgetCard';

interface Theme { name: string; change: number; count: number; }

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function TrendingThemesWidget({ inline = false, size = 'default' }: Props = {}) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/themes');
        const json = await res.json();
        if (json.themes) {
          const top5 = [...json.themes]
            .sort((a: Theme, b: Theme) => b.change - a.change)
            .slice(0, 5);
          setThemes(top5);
        }
      } catch {}
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 5 * 60 * 1000); // 5분마다 갱신
    return () => clearInterval(iv);
  }, []);

  const content = loading ? (
    <div className="flex flex-col h-full divide-y divide-[#F5F5F5]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 px-3">
          <div className="h-4 w-24 bg-[#F0F0F0] animate-pulse" />
          <div className="h-4 w-12 bg-[#F0F0F0] animate-pulse" />
        </div>
      ))}
    </div>
  ) : themes.length === 0 ? (
    <div className="h-full flex items-center justify-center">
      <p className="text-xs text-[#999]">데이터를 불러올 수 없습니다</p>
    </div>
  ) : (
    <div className="flex flex-col h-full divide-y divide-[#F5F5F5]">
      {themes.map((theme) => (
        <div key={theme.name} className="flex items-center justify-between py-2 px-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-[#1A1A2E] truncate">{theme.name}</span>
            <span className="text-[10px] text-[#999] shrink-0">{theme.count}종목</span>
          </div>
          <span className={`text-sm font-bold shrink-0 ${theme.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
            {theme.change >= 0 ? '+' : ''}{theme.change.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard
      title="상승 테마"
      subtitle="큐레이션 · 평균 등락률"
      href="/analysis"
      size={size}
      className="h-full"
      action={
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-[#FF3B30]" />
          <span className="text-[10px] text-[#FF3B30] font-bold">TOP 5</span>
        </div>
      }
    >
      {content}
    </WidgetCard>
  );
}
```

### 4. `ThemeGroups.tsx` 실데이터 복원 (STEP 33 ComingSoonCard 교체)

파일: `components/analysis-page/ThemeGroups.tsx` — 전체 교체:

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ThemeStock { symbol: string; name: string; price: number; change: number; }
interface Theme { name: string; change: number; count: number; stocks: ThemeStock[]; }

export default function ThemeGroups() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/themes');
        const json = await res.json();
        if (json.themes) {
          // 등락률 내림차순 정렬
          const sorted = [...json.themes].sort((a: Theme, b: Theme) => b.change - a.change);
          setThemes(sorted);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-bold text-black">테마별 종목</h2>
        <span className="text-[10px] text-[#999]">큐레이션 · 평균 등락률 기준</span>
      </div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#F0F0F0] animate-pulse" />
          ))}
        </div>
      ) : themes.length === 0 ? (
        <p className="text-sm text-[#999] text-center py-8">데이터를 불러올 수 없습니다</p>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {themes.map((t) => (
            <div key={t.name} className="border-b border-[#F0F0F0] pb-3 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-sm text-black">{t.name}</span>
                  <span className="text-[10px] text-[#999] ml-2">{t.count}종목</span>
                </div>
                <span className={`font-mono-price font-bold text-sm ${t.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                  {t.change >= 0 ? '▲' : '▼'}{Math.abs(t.change).toFixed(2)}%
                </span>
              </div>
              <div className="space-y-1">
                {t.stocks.map((s) => (
                  <Link
                    key={s.symbol}
                    href={`/stocks/${s.symbol}`}
                    className="flex items-center justify-between py-1 px-2 hover:bg-[#F5F5F5]"
                  >
                    <span className="text-black text-sm truncate">{s.name}</span>
                    <span className={`font-mono-price text-xs font-bold shrink-0 ${s.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                      {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. `docs/THEMES_DATA_UPDATE.md` 생성 — 월 1회 업데이트 가이드

파일: `docs/THEMES_DATA_UPDATE.md`

```markdown
# 테마 데이터 업데이트 가이드

**파일**: `data/themes.json`
**주기**: 월 1회 (매달 첫째 주) 또는 주요 테마 지형 변동 시

## 업데이트 절차

1. 네이버 금융 `finance.naver.com/sise/theme.naver` 테마별 종목 확인
2. 한국경제 테마분류 `hankyung.com/finance/theme` 교차 검증
3. KRX 시가총액 상위 변동 체크 (테마 대표종목이 여전히 유효한지)
4. `data/themes.json` 업데이트:
   - `updatedAt` 를 오늘 날짜로
   - 종목 리스트 조정 (제거/추가)
   - 테마 자체 조정 (신규 테마 추가, 사양 테마 제거)
5. 빌드 검증: `npm run build`
6. 개발 서버에서 `/analysis` + 홈 R4 상승 테마 위젯 렌더 확인
7. 커밋: `data: monthly themes refresh YYYY-MM`

## 초기 시드 (2026-04)

15개 테마 × 2~4종목 = 총 ~50개 고유 종목:

1. 반도체 — 삼성전자, SK하이닉스, 한미반도체, 리노공업
2. 2차전지 — 삼성SDI, LG에너지솔루션, 에코프로비엠, 에코프로
3. 바이오 — 삼성바이오로직스, 셀트리온, 알테오젠, 셀트리온헬스케어
4. 자동차 — 현대차, 기아, 현대모비스
5. AI·소프트웨어 — NAVER, 카카오, 카카오페이
6. 방산 — 한화시스템, LIG넥스원, 한화에어로스페이스
7. 조선 — HD한국조선해양, 삼성중공업, HD현대중공업
8. 금융 — 신한지주, KB금융, 하나금융지주, 우리금융지주
9. 에너지·정유 — SK이노베이션, S-Oil, HD현대
10. 화학 — LG화학, 한화솔루션, 롯데케미칼
11. 유통·식품 — 롯데쇼핑, 이마트, CJ제일제당
12. 게임 — 엔씨소프트, 넷마블, 카카오게임즈, 크래프톤
13. 미디어·엔터 — 하이브, SM, JYP Ent, 와이지엔터
14. 건설 — 현대건설, GS건설, 삼성E&A
15. 원전·인프라 — 두산에너빌리티, 삼강엠앤티

## 캐시 주의

`/api/themes` 는 10분 인메모리 캐시 사용. 프로덕션 반영 후 최대 10분간 구 캐시가 노출될 수 있음. 강제 반영 필요 시 서버 재시작.
```

### 6. 빌드 검증

```bash
cd ~/Desktop/OTMarketing && npm run build
```

TypeScript/Next 컴파일 에러 0개 확인. `data/themes.json` import 타입 이슈 발생 시:
- `tsconfig.json` 에 `"resolveJsonModule": true` 확인
- 경로 alias `@/data/themes.json` 작동 확인

### 7. 런타임 smoke test (선택, 서버 이미 돌면 skip)

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000/api/themes | head -100
```

첫 응답은 느림 (50종목 KIS 직렬 호출 — 최대 55초). 두 번째 호출부터 캐시로 즉시 응답.

### 8. 커밋 & 푸시

```bash
git add -A
git commit -m "feat(themes): curated themes.json + /api/themes + wire home R4 + /analysis

Two dummy components (TrendingThemesWidget home-R4, ThemeGroups
/analysis) shared the same need: curated Korean stock theme groupings
with real-time % change. Solved with a single data+API pipeline,
matching the economic-calendar strategy from STEP 31.

Changes:
- data/themes.json: 15 themes × 2~4 stocks = 50 unique tickers
  (semis, batteries, bio, auto, AI/SW, defense, shipbuilding,
  finance, energy, chemical, retail, gaming, media, construction,
  nuclear). Source: KRX cap + Naver finance + Hankyung theme cross-ref.
- /api/themes: reads themes.json, fetches KIS prices in parallel,
  computes per-theme avg %change. 10-min in-memory cache.
- TrendingThemesWidget (home R4): removed hardcoded array, fetches
  /api/themes, shows TOP 5 by change, 5-min refresh, skeleton loader.
- ThemeGroups (/analysis): ComingSoonCard (from STEP 33) replaced
  with real data — shows all themes sorted by change with drillthrough
  to /stocks/[symbol].
- docs/THEMES_DATA_UPDATE.md: monthly curation guide.

Cache note: first cold-miss takes ~50s (KIS rate-limited 1/sec).
Subsequent calls within 10min return instantly. Acceptable for MVP —
can swap to scheduled pre-warm cron later."

git push
```

## 세션 종료 체크

Cowork이 4개 문서 헤더 날짜를 2026-04-22로 업데이트 + CHANGELOG 엔트리:
- `CLAUDE.md`
- `docs/CHANGELOG.md`
- `session-context.md`
- `docs/NEXT_SESSION_START.md`

## 다음 STEP 예고

**STEP 35 후보** (Cowork 자동 선택):
- **A. KRX 업종별 지수 스크래핑** — STEP 33 deferred, SectorHeatmap 복원
- **B. 장중 실시간 검증** — 실제 장 시간에 KIS polling/limit 실측 (수동 관찰 성격)
- **C. /api/themes 캐시 사전 워밍** — cron/scheduled task로 5분마다 프리패치, 첫 로드 즉시 응답
- **D. /stocks/[symbol] 종목 상세 페이지 검증** — 508줄 큰 페이지, 실데이터 연결 상태 점검
