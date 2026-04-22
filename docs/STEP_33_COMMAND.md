# STEP 33 — `/analysis` 페이지 더미 제거 + 정직화 (MarketFlow 실데이터, Sector/Theme는 ComingSoon)

**🚀 실행 명령어 (Sonnet):**

```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

Claude Code 세션에서:

```
@docs/STEP_33_COMMAND.md 파일 내용대로 실행해줘
```

---

## 전제 상태

- 이전 커밋: `26814cd` (STEP 32 레거시 17개 파일 cleanup)
- `/analysis` 페이지 4개 카드 중 3개가 하드코딩 더미 발견:
  - `SectorHeatmap.tsx` — 11개 업종 % 가짜
  - `ThemeGroups.tsx` — 3개 테마 × 종목별 % 가짜
  - `MarketFlow.tsx` — 외국인/기관/개인/프로그램 수급 가짜
  - `EconomicDashboard.tsx` — FRED API 실데이터 ✓ (유지)
- Cowork API 사전조사 결과:
  - MarketFlow용 시장 전체 수급: 기존 `/api/kis/investor-rank` 확장이 가장 안전 (라벨은 "상위 종목 순매수 집계"로 정직하게)
  - SectorHeatmap용 업종별 지수: KRX 스크래핑/공공데이터 필요 → 별도 STEP로 분리
  - ThemeGroups용 테마 분류: 큐레이션 JSON 필요 → 별도 STEP로 분리

## 목표

`/analysis` 페이지에서 가짜 숫자 노출을 제거하고, 실데이터 연결 가능한 부분만 살린다.

세션 #15 W5 cleanup + STEP 32 철학 계승: **부정직한 숫자 < 정직한 "준비 중"**.

## 변경 사항

### 1. `/api/kis/investor-rank` 응답 확장 — totals 추가

파일: `app/api/kis/investor-rank/route.ts`

기존 반환 구조에 `totals` 필드 추가. 현재 `mapped` 배열 전체의 외국인/기관 순매수 합계를 반환.

```ts
// 기존 mapped 배열 생성 후, totals 계산
const totals = {
  foreignBuyTotal: mapped.reduce((acc, x) => acc + x.foreignBuy, 0),
  institutionBuyTotal: mapped.reduce((acc, x) => acc + x.institutionBuy, 0),
  // 개인 ≈ -(외국인 + 기관) 근사치 (실제 시장 전체 수급은 아니지만 상위 종목 합산 기준)
  individualBuyApprox: -1 * (
    mapped.reduce((acc, x) => acc + x.foreignBuy, 0) +
    mapped.reduce((acc, x) => acc + x.institutionBuy, 0)
  ),
  count: mapped.length,
};

return NextResponse.json({ foreignTop, institutionTop, totals });
```

→ 기존 `foreignTop`/`institutionTop` 소비자 (net-buy 페이지 등) 영향 없음. 새 필드 추가일 뿐.

### 2. `MarketFlow.tsx` 실데이터로 교체

파일: `components/analysis-page/MarketFlow.tsx`

기존 하드코딩 `FLOW` 배열 제거하고 `useEffect` + `useState`로 API 호출:

```tsx
'use client';

import { useState, useEffect } from 'react';

interface FlowRow { label: string; value: number; color: string; }

export default function MarketFlow() {
  const [flow, setFlow] = useState<FlowRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/kis/investor-rank?market=all');
        const json = await res.json();
        if (json.totals) {
          // API 값은 억원 단위 (investor-rank에서 /100 처리됨)
          const { foreignBuyTotal, institutionBuyTotal, individualBuyApprox } = json.totals;
          setFlow([
            { label: '외국인',  value: foreignBuyTotal,      color: '#FF3B30' },
            { label: '기관',    value: institutionBuyTotal,  color: '#007AFF' },
            { label: '개인(추정)', value: individualBuyApprox,  color: '#999999' },
          ]);
        }
      } catch {}
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 60 * 1000); // 1분마다 갱신
    return () => clearInterval(iv);
  }, []);

  const maxAbs = flow.length > 0 ? Math.max(...flow.map((f) => Math.abs(f.value))) : 1;

  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-bold text-black">상위 종목 순매수 집계</h2>
        <span className="text-[10px] text-[#999]">KIS · 외국인·기관 매매 상위 30종목 합산 (억원)</span>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-[#F0F0F0] animate-pulse" />
          ))}
        </div>
      ) : flow.length === 0 ? (
        <p className="text-sm text-[#999] text-center py-8">데이터를 불러올 수 없습니다</p>
      ) : (
        <div className="space-y-3">
          {flow.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-sm font-bold text-black w-28 shrink-0">{f.label}</span>
              <div className="flex-1 h-6 bg-[#F5F5F5] relative">
                <div className="absolute top-0 h-full" style={{
                  width: `${(Math.abs(f.value) / maxAbs) * 100}%`,
                  backgroundColor: f.color,
                  left: f.value >= 0 ? '50%' : undefined,
                  right: f.value < 0 ? '50%' : undefined,
                }} />
              </div>
              <span className={`text-sm font-mono-price font-bold w-20 text-right ${f.value >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                {f.value >= 0 ? '+' : ''}{f.value.toLocaleString()}억
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**핵심 정직성 포인트**:
- 제목 "시장 전체 수급" → "상위 종목 순매수 집계"로 변경
- 부제 "KIS · 외국인·기관 매매 상위 30종목 합산 (억원)" 명시
- "개인(추정)" 라벨로 프록시 값임을 표시
- 프로그램(차익/비차익) 행은 제거 (실데이터 없음)

### 3. `SectorHeatmap.tsx` — ComingSoonCard로 교체

파일: `components/analysis-page/SectorHeatmap.tsx` 전체 교체:

```tsx
'use client';

import { LayoutGrid } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function SectorHeatmap() {
  return (
    <ComingSoonCard
      title="업종별 히트맵"
      icon={<LayoutGrid className="w-4 h-4 text-[#0ABAB5]" />}
      description="KRX 업종별 지수 (11개 GICS 섹터) 연결 준비 중 — 가짜 데이터 대신 정직한 상태 표시."
      eta="KRX data.krx.co.kr 스크래핑/공공데이터 API 연결 후"
    />
  );
}
```

### 4. `ThemeGroups.tsx` — ComingSoonCard로 교체

파일: `components/analysis-page/ThemeGroups.tsx` 전체 교체:

```tsx
'use client';

import { Layers } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function ThemeGroups() {
  return (
    <ComingSoonCard
      title="테마별 종목"
      icon={<Layers className="w-4 h-4 text-[#0ABAB5]" />}
      description="테마 분류 큐레이션 작업 중 — 무단 JSON 시드 후 주 1회 업데이트 예정. 현재는 /screener 에서 업종 필터 사용 가능."
      eta="테마 JSON 큐레이션 완료 후 (경제 캘린더와 동일 방식)"
    />
  );
}
```

### 5. `ComingSoonCard` 컴포넌트 호환성 확인

`components/common/ComingSoonCard.tsx` 가 `title/icon/description/eta` props를 받는지 먼저 확인:

```bash
cat components/common/ComingSoonCard.tsx | head -30
```

만약 props 시그니처가 다르면 그에 맞춰 조정. 기존 `ProgramTrading.tsx`가 (삭제 전) 썼던 형태와 동일해야 함.

### 6. 빌드 검증

```bash
cd ~/Desktop/OTMarketing && npm run build
```

TypeScript 컴파일 에러 0개 확인.

### 7. 개발 서버 렌더 확인 (선택)

```bash
# 서버 이미 돌고 있으면 생략
npm run dev
```

`/analysis` 페이지 열어서:
- SectorHeatmap 자리 → "준비 중" 카드 (정직)
- ThemeGroups / MarketFlow 자리 → "준비 중" + 실데이터 바 차트
- EconomicDashboard → FRED 실시간 값 (기존 유지)

### 8. 커밋 & 푸시

```bash
git add -A
git commit -m "feat(analysis): remove dummy data, wire MarketFlow to real KIS aggregate

Problem: /analysis page showed 3 cards (SectorHeatmap, ThemeGroups,
MarketFlow) with hardcoded fake numbers — misleading users browsing
the site.

Fix:
- MarketFlow: now pulls /api/kis/investor-rank totals (top-30 foreign
  + institution net buy sum, KRW 100M). Relabeled as '상위 종목 순매수
  집계' — honest about scope. 1-min polling.
- SectorHeatmap: replaced with ComingSoonCard (KRX sector index
  connection pending).
- ThemeGroups: replaced with ComingSoonCard (theme curation JSON
  pending, points users to /screener sector filter).
- /api/kis/investor-rank: added totals field {foreignBuyTotal,
  institutionBuyTotal, individualBuyApprox, count}. Backward
  compatible — existing foreignTop/institutionTop untouched.

EconomicDashboard (FRED live) kept as-is.

Philosophy: honest 'coming soon' > misleading fake numbers.
Matches session #15 W5 cleanup + STEP 32 approach."

git push
```

## 세션 종료 체크

Cowork이 4개 문서 헤더 날짜를 2026-04-22로 업데이트 + CHANGELOG 엔트리:
- `CLAUDE.md`
- `docs/CHANGELOG.md`
- `session-context.md`
- `docs/NEXT_SESSION_START.md`

## 다음 STEP 예고

**STEP 34 후보** (Cowork 자동 선택):
- **A. TrendingThemesWidget 더미 제거** (홈 R4) — 동일 철학, ComingSoonCard 교체 OR DART 공시 키워드 프록시로 전환
- **B. 테마 JSON 큐레이션** (STEP 33에서 deferred) — 경제 캘린더와 동일 방식으로 20~30개 테마 × 3~5종목 시드
- **C. KRX 업종별 지수 스크래핑** (STEP 33에서 deferred) — `data.krx.co.kr` 접근성 검증 후 `/api/krx/sector` 구현
