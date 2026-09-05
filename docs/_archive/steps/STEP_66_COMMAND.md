# STEP 66 — TickWidget 심볼 선택 + /ticks 페이지 실데이터화

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표:**
1. `TickWidget`: 심볼 인풋(기본 005930) 추가 — URL 파라미터 또는 내부 state 로 심볼 전환, 유효한 6자리 숫자만 허용.
2. `/ticks` 페이지: stub 제거 → 풀페이지에서 심볼 선택 + 최근 50건 체결 로그 + 체결강도 바 + 매수/매도 분포 통계.

**전제 상태 (직전 커밋):** STEP 65 완료 (ChatWidget 폴리싱)

**참고:** 이게 P0/P1 위젯 STEP 시퀀스의 마지막. 완료 후 `docs/REFERENCE_PLATFORM_MAPPING.md` 의 P0/P1 항목이 모두 실데이터로 채워진 상태가 된다.

---

## 1. TickWidget 심볼 state 추가 — `components/widgets/TickWidget.tsx`

전체 교체:

```typescript
'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface Execution {
  time: string;
  price: number;
  change: number;
  changeSign: string;
  volume: number;
}

interface ApiResponse {
  symbol: string;
  executions: Execution[];
}

const DEFAULT_SYMBOL = '005930';

function fmtPrice(n: number): string {
  return n.toLocaleString('ko-KR');
}

function fmtTime(t: string): string {
  if (!t || t.length < 6) return t || '—';
  return `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
}

function calcStrength(executions: Execution[]): number {
  if (executions.length === 0) return 0;
  const recent = executions.slice(0, 10);
  const upVol = recent
    .filter((e) => e.changeSign === '1' || e.changeSign === '2')
    .reduce((s, e) => s + e.volume, 0);
  const totalVol = recent.reduce((s, e) => s + e.volume, 0);
  if (totalVol === 0) return 50;
  return Math.round((upVol / totalVol) * 100);
}

export default function TickWidget() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/kis/execution?symbol=${symbol}`);
        if (!res.ok) return;
        const data: ApiResponse = await res.json();
        if (cancelled) return;
        setExecutions(data.executions || []);
      } catch {
        // noop
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    load();
    const timer = setInterval(load, 5_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [symbol]);

  const handleSymbolChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setSymbolInput(v);
    if (v.length === 6) setSymbol(v);
  };

  const strength = calcStrength(executions);
  const strengthUp = strength >= 50;

  return (
    <WidgetCard
      title="체결창"
      subtitle={`${symbol} · 5초 갱신`}
      href={`/ticks?symbol=${symbol}`}
      action={
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={symbolInput}
            onChange={handleSymbolChange}
            className="w-16 text-[10px] font-mono border border-[#E5E7EB] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]"
            placeholder="005930"
            aria-label="종목 코드"
          />
          {loading && <span className="text-[10px] text-[#BBB]">로딩…</span>}
        </div>
      }
    >
      <div className="px-3 py-2 border-b border-[#F0F0F0]">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-[#999]">체결강도</span>
          <span className={`font-bold ${strengthUp ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
            {strength}%
          </span>
        </div>
        <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${strengthUp ? 'bg-[#FF3B30]' : 'bg-[#0051CC]'}`}
            style={{ width: `${Math.min(strength, 100)}%` }}
          />
        </div>
      </div>

      <div role="table" aria-label="체결 내역">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-3 px-3 py-1 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">시각</span>
            <span role="columnheader" className="text-right">체결가</span>
            <span role="columnheader" className="text-right">체결량</span>
          </div>
        </div>
        <div role="rowgroup">
          {executions.slice(0, 10).map((t, i) => {
            const up = t.changeSign === '1' || t.changeSign === '2';
            return (
              <div
                key={i}
                role="row"
                className="grid grid-cols-3 px-3 py-1 text-xs border-b border-[#F0F0F0]"
              >
                <span role="cell" className="text-[#999]">{fmtTime(t.time)}</span>
                <span role="cell" className={`text-right font-bold ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                  {fmtPrice(t.price)}
                </span>
                <span role="cell" className="text-right text-[#555]">{t.volume.toLocaleString()}</span>
              </div>
            );
          })}
          {!loading && executions.length === 0 && (
            <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
```

---

## 2. `/ticks` 페이지 풀페이지화 — 신규 Client 컴포넌트

**파일:** `components/ticks/TicksPageClient.tsx`

```typescript
'use client';

import { useEffect, useState, useMemo, type ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Execution {
  time: string;
  price: number;
  change: number;
  changeSign: string;
  volume: number;
}

const DEFAULT_SYMBOL = '005930';

function fmtPrice(n: number): string {
  return n.toLocaleString('ko-KR');
}
function fmtTime(t: string): string {
  if (!t || t.length < 6) return t || '—';
  return `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
}

export default function TicksPageClient() {
  const sp = useSearchParams();
  const initSym = sp.get('symbol') && /^\d{6}$/.test(sp.get('symbol')!) ? sp.get('symbol')! : DEFAULT_SYMBOL;

  const [symbol, setSymbol] = useState(initSym);
  const [symbolInput, setSymbolInput] = useState(initSym);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/kis/execution?symbol=${symbol}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setExecutions(data.executions || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setLoading(true);
    load();
    const iv = setInterval(load, 5_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [symbol]);

  const { strength, buyVol, sellVol, totalVol, avgPrice } = useMemo(() => {
    const recent = executions.slice(0, 50);
    const buyVol = recent.filter((e) => e.changeSign === '1' || e.changeSign === '2').reduce((s, e) => s + e.volume, 0);
    const sellVol = recent.filter((e) => e.changeSign === '4' || e.changeSign === '5').reduce((s, e) => s + e.volume, 0);
    const totalVol = buyVol + sellVol;
    const strength = totalVol === 0 ? 50 : Math.round((buyVol / totalVol) * 100);
    const avgPrice = recent.length === 0 ? 0 : Math.round(recent.reduce((s, e) => s + e.price * e.volume, 0) / Math.max(1, recent.reduce((s, e) => s + e.volume, 0)));
    return { strength, buyVol, sellVol, totalVol, avgPrice };
  }, [executions]);

  const handleSymbolChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setSymbolInput(v);
    if (v.length === 6) setSymbol(v);
  };

  const strengthUp = strength >= 50;

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">체결창</h1>
        <p className="text-sm text-[#666]">
          실시간 체결 내역 + 체결강도 + 매수/매도 분포. KIS API FHKST01010300 · 5초 갱신.
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center gap-3">
        <label className="text-xs text-[#666]">종목 코드</label>
        <input
          type="text"
          inputMode="numeric"
          value={symbolInput}
          onChange={handleSymbolChange}
          className="w-24 text-sm font-mono border border-[#E5E7EB] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]"
          placeholder="005930"
        />
        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      {/* 통계 + 테이블 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* 통계 패널 */}
        <aside className="space-y-3">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-xs text-[#999] mb-2">체결강도</div>
            <div className={`text-3xl font-bold ${strengthUp ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
              {strength}%
            </div>
            <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${strengthUp ? 'bg-[#FF3B30]' : 'bg-[#0051CC]'}`}
                style={{ width: `${Math.min(strength, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#888] mt-2">최근 50건 기준</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#666]">매수 체결량</span>
              <span className="text-[#FF3B30] font-bold tabular-nums">{buyVol.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">매도 체결량</span>
              <span className="text-[#0051CC] font-bold tabular-nums">{sellVol.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-[#F0F0F0] pt-2">
              <span className="text-[#666]">총 체결량</span>
              <span className="text-black font-bold tabular-nums">{totalVol.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">가중평균가</span>
              <span className="text-black font-bold tabular-nums">{avgPrice > 0 ? fmtPrice(avgPrice) : '—'}</span>
            </div>
          </div>
        </aside>

        {/* 체결 테이블 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="px-4 py-2.5 text-left w-24">시각</th>
                <th className="px-4 py-2.5 text-right w-28">체결가</th>
                <th className="px-4 py-2.5 text-right w-20">변동</th>
                <th className="px-4 py-2.5 text-right">체결량</th>
                <th className="px-4 py-2.5 text-center w-16">구분</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-[#999]">로딩 중…</td></tr>
              )}
              {!loading && executions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-[#999]">데이터 없음</td></tr>
              )}
              {executions.slice(0, 50).map((t, i) => {
                const up = t.changeSign === '1' || t.changeSign === '2';
                return (
                  <tr key={i} className="border-t border-[#F0F0F0] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-2 text-[#888] font-mono text-xs">{fmtTime(t.time)}</td>
                    <td className={`px-4 py-2 text-right font-bold tabular-nums ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {fmtPrice(t.price)}
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums text-xs ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {t.change > 0 ? '+' : ''}{t.change}
                    </td>
                    <td className="px-4 py-2 text-right text-[#555] tabular-nums">{t.volume.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${up ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 'bg-[#0051CC]/10 text-[#0051CC]'}`}>
                        {up ? '매수' : '매도'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. `app/ticks/page.tsx` 교체 (Suspense 래핑)

```typescript
import type { Metadata } from 'next';
import { Suspense } from 'react';
import TicksPageClient from '@/components/ticks/TicksPageClient';

export const metadata: Metadata = { title: '체결창 — StockTerminal' };

export default function TicksPage() {
  return (
    <Suspense fallback={<div className="w-full px-6 py-6"><div className="h-48 bg-[#F0F0F0] animate-pulse rounded-lg" /></div>}>
      <TicksPageClient />
    </Suspense>
  );
}
```

---

## 4. 검증

```bash
cd ~/Desktop/OTMarketing
npm run build
```

수동 테스트:
- `/ticks` — 005930 기본, 50건 + 통계 패널
- `/ticks?symbol=000660` — SK하이닉스 로드
- 위젯에서 심볼 변경 → /ticks 링크 도달 시 같은 심볼 유지

커밋 + push:

```bash
git add -A
git commit -m "feat(ticks): 위젯 심볼 입력 + /ticks 풀페이지 (통계 패널 + 50건 로그)

- TickWidget: 6자리 숫자 인풋으로 심볼 전환 + 링크에 symbol 파라미터
- TicksPageClient: 체결강도·매수/매도·가중평균가 통계 + 50건 테이블
- app/ticks/page.tsx: stub 제거 + Suspense 래핑

STEP 66 / REFERENCE_PLATFORM_MAPPING.md P1 최종"
git push
```

---

## 5. 세션 마무리

**세션 종료 체크리스트** (Cowork 이 CHANGELOG/NEXT_SESSION_START 업데이트 담당):
- STEP 59–66 모두 실행 완료되면 `docs/REFERENCE_PLATFORM_MAPPING.md` 의 P0/P1 체크박스 최종 갱신
- `docs/CHANGELOG.md` 에 STEP 59–66 한번에 블록 추가
- `session-context.md` 에 "P0/P1 위젯·페이지 전량 실데이터 전환" 기록
- `docs/NEXT_SESSION_START.md` 최신화 (다음 세션의 P2 우선순위 안내)

STEP 66 까지 완료하면 "홈 대시보드의 모든 위젯이 실데이터 + 모든 위젯에 대응 풀페이지 존재" 상태가 된다.
