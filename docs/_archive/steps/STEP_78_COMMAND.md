# STEP 78 — Section 3: Discovery (종목 발굴 + 급등락 + 거래량/수급)

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 77 완료 — 플로팅 채팅 전환.

**목표:**
HomeClient 에 Section 3 추가 — Discovery 영역.
- **상단 행**: 12col 풀폭 **종목 발굴 확장판** (프리셋 + 검색 + 결과 상위 10)
- **하단 행 (6:3:3)**: 급등락 좌우 분리 + 거래량 Top10 + 수급 Top10

**범위 제한:**
- 기존 `ScreenerMiniWidget`, `MoversTop10Widget`, `VolumeTop10Widget`, `NetBuyTopWidget` 재활용 — 없으면 스텁 작성.
- 신규 API 라우트 추가 금지 — 기존 라우트 확장 or 스텁 유지.
- 프리셋 필터는 **상수 배열** 로 정의 (DB 저장 금지, 이번 STEP 한정).

---

## 작업 0 — 현재 위젯 파악

```bash
# 1) 기존 위젯 파일
find components -name "ScreenerMini*" -o -name "MoversTop*" -o -name "VolumeTop*" -o -name "NetBuy*" -type f 2>/dev/null

# 2) 기존 API 라우트
ls app/api/stocks/screener 2>/dev/null
ls app/api/stocks/movers 2>/dev/null
ls app/api/stocks/volume 2>/dev/null
ls app/api/stocks/net-buy 2>/dev/null
grep -rln "screener\|movers\|volume/top\|net-buy" app/api/ --include="*.ts" 2>/dev/null | head

# 3) HomeClient 현재 Section 구조
grep -n "Section" components/home/HomeClient.tsx
```

보고: 4개 위젯 존재 여부 + 재활용 가능성 + 누락 위젯 목록.

---

## 작업 1 — Section 3 컨테이너

Section 2 바로 아래에 삽입:

```tsx
{/* Section 3 — Discovery */}
<section className="mt-4 space-y-2">
  {/* 상단: 종목 발굴 확장 (12col 풀폭) */}
  <div className="border border-[#E5E7EB] bg-white overflow-hidden">
    <ScreenerExpandedWidget />
  </div>

  {/* 하단: 6:3:3 */}
  <div className="grid grid-cols-12 gap-2">
    <div className="col-span-6 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
      <MoversPairWidget />
    </div>
    <div className="col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
      <VolumeTop10Widget />
    </div>
    <div className="col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
      <NetBuyTopWidget />
    </div>
  </div>
</section>
```

---

## 작업 2 — 종목 발굴 확장판 (`ScreenerExpandedWidget`)

`components/widgets/ScreenerExpandedWidget.tsx` 신규 (기존 `ScreenerMiniWidget` 있으면 그 로직 재활용):

### UI 구조

```
┌─────────────────────────────────────────────────────────────┐
│ 종목 발굴                                                    │
│ ┌──────┬──────┬──────┬──────┬──────┬──────┐  검색: [____] 🔍 │
│ │ 저PER │ 고배당│ 신고가│ 급등  │ 우량주│ 초소형│              │
│ └──────┴──────┴──────┴──────┴──────┴──────┘                │
│                                                              │
│ 결과 (상위 10)                                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ # │ 종목명     │ 코드   │ 현재가     │ 등락    │ 거래량     ││
│ │ 1 │ 삼성전자   │ 005930 │ 72,000     │ +1.5%  │ 1.2M       ││
│ │ ...                                                       ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 프리셋 상수

```ts
const PRESETS = [
  { key: 'low-per',    label: '저PER',   params: { filter: 'per', op: 'lt', value: 10 } },
  { key: 'high-divi',  label: '고배당',   params: { filter: 'divi', op: 'gt', value: 3 } },
  { key: 'new-high',   label: '신고가',   params: { filter: '52w-high' } },
  { key: 'gainers',    label: '급등',     params: { filter: 'change', op: 'gt', value: 5 } },
  { key: 'blue-chip',  label: '우량주',   params: { filter: 'marketcap', op: 'gt', value: 10_000_000_000_000 } },
  { key: 'small-cap',  label: '초소형',   params: { filter: 'marketcap', op: 'lt', value: 100_000_000_000 } },
] as const;
```

### 데이터 연동

- 기존 `/api/stocks/screener?preset=low-per&limit=10` 형식으로 호출 가정
- 라우트 없으면 **mock 데이터** 반환 + TODO 주석
- 로딩 스피너 + 에러 상태 처리

### 구현 골격

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

const PRESETS = [/* ... 위 상수 */];

type Row = {
  code: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
};

export default function ScreenerExpandedWidget() {
  const [active, setActive] = useState<string>('low-per');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/screener?preset=${active}&limit=10`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setRows(d.items ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#222]">종목 발굴</h3>
        <div className="flex items-center gap-1 border border-[#E5E7EB] rounded px-2">
          <Search className="w-3.5 h-3.5 text-[#999]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="종목 검색"
            className="w-40 h-7 text-xs outline-none"
          />
        </div>
      </div>

      {/* 프리셋 탭 */}
      <div className="flex gap-1 mb-3">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setActive(p.key)}
            className={`px-3 h-7 text-xs rounded border ${
              active === p.key
                ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]'
                : 'bg-white text-[#444] border-[#E5E7EB] hover:bg-[#F3F4F6]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 결과 테이블 */}
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#666] border-b border-[#E5E7EB]">
            <th className="text-left py-1.5 w-8">#</th>
            <th className="text-left">종목명</th>
            <th className="text-left w-20">코드</th>
            <th className="text-right w-24">현재가</th>
            <th className="text-right w-20">등락</th>
            <th className="text-right w-24">거래량</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={6} className="text-center py-4 text-[#999]">로딩 중...</td></tr>
          )}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={6} className="text-center py-4 text-[#999]">데이터 없음</td></tr>
          )}
          {!loading && rows.map((r, i) => (
            <tr key={r.code} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA]">
              <td className="py-1.5 text-[#999]">{i + 1}</td>
              <td className="truncate max-w-[140px]">{r.name}</td>
              <td className="text-[#666] tabular-nums">{r.code}</td>
              <td className="text-right tabular-nums">{r.price.toLocaleString()}</td>
              <td className={`text-right tabular-nums ${r.changePct >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF4D4D]'}`}>
                {r.changePct >= 0 ? '+' : ''}{r.changePct.toFixed(2)}%
              </td>
              <td className="text-right tabular-nums text-[#666]">{r.volume.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 작업 3 — 급등락 좌우 분리 (`MoversPairWidget`)

`components/widgets/MoversPairWidget.tsx` 신규 (기존 `MoversTop10Widget` 재활용 or 2개 리스트로 분리):

### UI 구조

```
┌────────────────────────────┬────────────────────────────┐
│ 🔺 상승 Top 10              │ 🔻 하락 Top 10              │
│ 1. 종목A    +12.5%          │ 1. 종목X    -9.8%          │
│ 2. 종목B    +10.2%          │ 2. 종목Y    -8.5%          │
│ ...                         │ ...                         │
└────────────────────────────┴────────────────────────────┘
```

### 구현 골격

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

type Item = { code: string; name: string; changePct: number };

export default function MoversPairWidget() {
  const [gainers, setGainers] = useState<Item[]>([]);
  const [losers, setLosers] = useState<Item[]>([]);
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);

  useEffect(() => {
    Promise.all([
      fetch('/api/stocks/movers?type=gainers&limit=10').then(r => r.ok ? r.json() : { items: [] }),
      fetch('/api/stocks/movers?type=losers&limit=10').then(r => r.ok ? r.json() : { items: [] }),
    ]).then(([g, l]) => {
      setGainers(g.items ?? []);
      setLosers(l.items ?? []);
    });
  }, []);

  const renderList = (items: Item[], up: boolean) => (
    <ol className="text-xs space-y-1">
      {items.map((it, i) => (
        <li
          key={it.code}
          onClick={() => setSelected({ code: it.code, name: it.name, market: 'KR' })}
          className="flex items-center justify-between px-2 py-1 hover:bg-[#F3F4F6] cursor-pointer rounded"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-[#999] w-4">{i + 1}</span>
            <span className="truncate">{it.name}</span>
          </span>
          <span className={`tabular-nums ${up ? 'text-[#0ABAB5]' : 'text-[#FF4D4D]'}`}>
            {up ? '+' : ''}{it.changePct.toFixed(2)}%
          </span>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="p-3 h-full">
      <div className="grid grid-cols-2 gap-3 h-full">
        <div>
          <h3 className="text-sm font-semibold text-[#0ABAB5] mb-2">🔺 상승 Top 10</h3>
          {renderList(gainers, true)}
        </div>
        <div className="border-l border-[#E5E7EB] pl-3">
          <h3 className="text-sm font-semibold text-[#FF4D4D] mb-2">🔻 하락 Top 10</h3>
          {renderList(losers, false)}
        </div>
      </div>
    </div>
  );
}
```

---

## 작업 4 — 거래량 / 수급 Top10 재활용

### 거래량 (`VolumeTop10Widget`)

기존 위젯이 있으면 그대로 삽입. 없으면 스텁:

```tsx
'use client';
import { useEffect, useState } from 'react';

export default function VolumeTop10Widget() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/stocks/volume-top?limit=10')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);
  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold text-[#222] mb-2">📊 거래량 Top 10</h3>
      <ol className="text-xs space-y-1">
        {items.length === 0 && <li className="text-[#999] text-center py-4">데이터 없음</li>}
        {items.map((it, i) => (
          <li key={it.code} className="flex justify-between px-2 py-1 hover:bg-[#F3F4F6] rounded">
            <span className="truncate"><span className="text-[#999] mr-2">{i + 1}</span>{it.name}</span>
            <span className="tabular-nums text-[#666]">{(it.volume / 1_000_000).toFixed(1)}M</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

### 수급 (`NetBuyTopWidget`)

외국인 + 기관 순매수 상위 10. 탭 2개로 분기 (외국인 / 기관):

```tsx
'use client';
import { useEffect, useState } from 'react';

type Tab = 'foreign' | 'institution';

export default function NetBuyTopWidget() {
  const [tab, setTab] = useState<Tab>('foreign');
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/stocks/net-buy?investor=${tab}&limit=10`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [tab]);
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#222]">💰 수급 Top 10</h3>
        <div className="flex gap-1">
          {(['foreign', 'institution'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2 h-6 text-xs rounded border ${
                tab === t ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]' : 'bg-white border-[#E5E7EB]'
              }`}
            >
              {t === 'foreign' ? '외국인' : '기관'}
            </button>
          ))}
        </div>
      </div>
      <ol className="text-xs space-y-1">
        {items.length === 0 && <li className="text-[#999] text-center py-4">데이터 없음</li>}
        {items.map((it, i) => (
          <li key={it.code} className="flex justify-between px-2 py-1 hover:bg-[#F3F4F6] rounded">
            <span className="truncate"><span className="text-[#999] mr-2">{i + 1}</span>{it.name}</span>
            <span className="tabular-nums text-[#0ABAB5]">+{(it.netBuy / 100_000_000).toFixed(1)}억</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

---

## 작업 5 — 빌드 + 문서 + push

```bash
npm run build
```

문서 4개 갱신 + CHANGELOG:
```
- feat(dashboard): Section 3 Discovery (종목 발굴 + 급등락 + 거래량/수급) (STEP 78)
```

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): Section 3 Discovery (STEP 78)

- HomeClient Section 3 추가 (12col 상단 + 6:3:3 하단)
- ScreenerExpandedWidget: 6프리셋 + 검색 + 결과 Top10
- MoversPairWidget: 상승/하락 좌우 분리
- VolumeTop10Widget / NetBuyTopWidget 재활용 or 스텁
- API 라우트 없는 경우 mock + TODO

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 78 완료
- Section 3 컨테이너 (상단 12col + 하단 6:3:3)
- ScreenerExpandedWidget: <신규/재활용>, 프리셋 6개
- MoversPairWidget: <신규/재활용>, 좌우 분리
- VolumeTop10Widget: <재활용/스텁>
- NetBuyTopWidget: <재활용/스텁>, 외국인/기관 탭
- API 라우트 현황:
  · /api/stocks/screener: <존재/mock>
  · /api/stocks/movers: <존재/mock>
  · /api/stocks/volume-top: <존재/mock>
  · /api/stocks/net-buy: <존재/mock>
- npm run build: 성공
- git commit: <hash>
```

---

## 주의사항

- **검색 기능은 이번 STEP UI만** — 실제 검색 로직은 별도 STEP 분리.
- **프리셋 필터 로직** — 프론트엔드 상수. DB 저장/개인화는 V3 범위 외.
- **종목 클릭 → selectedSymbolStore 연동** — 모든 리스트 항목 클릭 시 `setSelected({ code, name, market })` 호출해서 Section 1 상세 패널 갱신.
- **market 필드 기본 'KR'** — US 종목은 별도 preset 나올 때 처리.
- **Mock 데이터 빌드 실패 방지** — API 없어도 `try/catch` + 빈 배열 리턴.
