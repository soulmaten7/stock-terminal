# STEP 29 — Phase 2-B 실데이터 연결 (/net-buy)

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `828470c feat: unify /investor-flow into /net-buy as a tab (Phase 2-B)`
- `/net-buy/page.tsx`는 서버컴포넌트, `?tab=top|flow`로 탭 선택
- 현재 두 탭 모두 Math.random() stub 데이터로 채워져 있고 "실데이터 연결 예정" 뱃지 부착
- 기존 홈 위젯 `NetBuyTopWidget`, `InvestorFlowWidget`이 각각 `/api/kis/investor-rank`, `/api/home/investor-flow` 를 `'use client' + useEffect` 패턴으로 소비 중 — **이 패턴을 그대로 따름**

## 목표
`/net-buy` 두 탭에 실제 KIS API 데이터 연결. stub/뱃지 제거. 홈 위젯과 동일한 패턴으로 로딩/빈 상태 처리.

---

## 변경 1: `components/net-buy/TopTab.tsx` 신규 생성

외국인 TOP 10 + 기관 TOP 10을 symbol 기준 병합해서 최대 20행 렌더.

```tsx
'use client';

import { useEffect, useState } from 'react';

interface NetItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;      // 억원
  institutionBuy: number;  // 억원
}

function fmtBn(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toLocaleString('ko-KR')}`;
}

function fmtPrice(val: number): string {
  return val.toLocaleString('ko-KR');
}

export default function TopTab() {
  const [rows, setRows] = useState<NetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/kis/investor-rank')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const foreignTop: NetItem[] = d.foreignTop ?? [];
        const institutionTop: NetItem[] = d.institutionTop ?? [];
        // symbol 기준 dedupe — 둘 다에 있으면 foreignTop 값 사용 (같은 API라 동일함)
        const map = new Map<string, NetItem>();
        for (const it of [...foreignTop, ...institutionTop]) {
          if (!map.has(it.symbol)) map.set(it.symbol, it);
        }
        // 외국인+기관 합산 순매수 내림차순 정렬
        const merged = Array.from(map.values())
          .sort((a, b) => (b.foreignBuy + b.institutionBuy) - (a.foreignBuy + a.institutionBuy))
          .slice(0, 20);
        setRows(merged);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="text-sm text-[#666] mb-3">
        외국인·기관 순매수 상위 종목. 외국인 TOP 10과 기관 TOP 10을 합산해 정렬. KIS API FHPTJ04400000 기반.
      </p>
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <span className="text-sm font-bold text-black">실시간 수급 TOP</span>
          <span className="text-[10px] font-bold text-[#999]">당일 기준</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                <th className="px-4 py-2.5 text-left font-bold text-[#666]">순위</th>
                <th className="px-4 py-2.5 text-left font-bold text-[#666]">종목명</th>
                <th className="px-4 py-2.5 text-right font-bold text-[#666]">외국인 순매수(억)</th>
                <th className="px-4 py-2.5 text-right font-bold text-[#666]">기관 순매수(억)</th>
                <th className="px-4 py-2.5 text-right font-bold text-[#666]">현재가</th>
                <th className="px-4 py-2.5 text-right font-bold text-[#666]">등락률</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-[#999]">로딩 중…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-[#FF3B30]">데이터를 불러오지 못했습니다</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-[#999]">데이터 없음</td></tr>
              )}
              {!loading && !error && rows.map((r, i) => (
                <tr key={r.symbol} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                  <td className="px-4 py-2 text-[#333]">{i + 1}</td>
                  <td className="px-4 py-2 text-[#333] font-bold truncate">{r.name}</td>
                  <td className={`px-4 py-2 text-right font-bold ${r.foreignBuy >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF3B30]'}`}>
                    {fmtBn(r.foreignBuy)}
                  </td>
                  <td className={`px-4 py-2 text-right font-bold ${r.institutionBuy >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF3B30]'}`}>
                    {fmtBn(r.institutionBuy)}
                  </td>
                  <td className="px-4 py-2 text-right text-[#333]">{fmtPrice(r.price)}원</td>
                  <td className={`px-4 py-2 text-right font-bold ${r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                    {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 변경 2: `components/net-buy/FlowTab.tsx` 신규 생성

투자자별 매매동향 — 4행 (외국인/기관/개인/기타법인), 당일 스냅샷.

```tsx
'use client';

import { useEffect, useState } from 'react';

interface FlowRow {
  label: string;
  kospi: string;   // "+1,234억" 형태로 이미 포맷된 문자열
  kosdaq: string;
}

function colorClass(val: string) {
  return val.startsWith('+') ? 'text-[#0ABAB5]' : val.startsWith('-') ? 'text-[#FF3B30]' : 'text-[#999]';
}

export default function FlowTab() {
  const [rows, setRows] = useState<FlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/home/investor-flow')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setRows(d.rows ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="text-sm text-[#666] mb-3">
        외국인·기관·개인·기타법인의 코스피/코스닥 순매수 합계. 당일 스냅샷 기준. KIS API FHKST01010900 기반.
      </p>
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <span className="text-sm font-bold text-black">투자자별 매매동향</span>
          <span className="text-[10px] font-bold text-[#999]">당일 기준</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                <th className="px-4 py-3 text-left font-bold text-[#666] text-xs">투자자</th>
                <th className="px-4 py-3 text-right font-bold text-[#666] text-xs">코스피 순매수</th>
                <th className="px-4 py-3 text-right font-bold text-[#666] text-xs">코스닥 순매수</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-[#999]">로딩 중…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-[#FF3B30]">데이터를 불러오지 못했습니다</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-[#999]">데이터 없음</td></tr>
              )}
              {!loading && !error && rows.map((r) => (
                <tr key={r.label} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                  <td className="px-4 py-3 text-[#333] font-bold">{r.label}</td>
                  <td className={`px-4 py-3 text-right font-bold ${colorClass(r.kospi)}`}>{r.kospi}</td>
                  <td className={`px-4 py-3 text-right font-bold ${colorClass(r.kosdaq)}`}>{r.kosdaq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#999]">
        * 기타법인은 현재 0으로 표시됩니다 (KIS inquire-investor API가 기타법인 순매수를 분리 제공하지 않음). 향후 별도 API 연동 필요.
      </p>
    </div>
  );
}
```

---

## 변경 3: `app/net-buy/page.tsx` 전체 교체

stub 데이터 + 인라인 TableCard 전부 삭제. 두 클라이언트 컴포넌트 렌더로 교체.

```tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TopTab from '@/components/net-buy/TopTab';
import FlowTab from '@/components/net-buy/FlowTab';

export default async function NetBuyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: 'top' | 'flow' = tab === 'flow' ? 'flow' : 'top';

  return (
    <div className="w-full px-6 py-6">
      {/* 공통 헤더 */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">수급</h1>
        <p className="text-sm text-[#666]">
          외국인·기관 순매수 상위 종목과 시장 전체 투자자별 매매동향을 확인합니다.
        </p>
      </div>

      {/* 탭바 */}
      <div className="flex items-center border-b border-[#E5E7EB] mb-6" role="tablist">
        <Link
          href="/net-buy?tab=top"
          role="tab"
          aria-selected={activeTab === 'top'}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'top'
              ? 'border-[#0ABAB5] text-[#0ABAB5]'
              : 'border-transparent text-[#666] hover:text-black'
          }`}
        >
          종목별 TOP
        </Link>
        <Link
          href="/net-buy?tab=flow"
          role="tab"
          aria-selected={activeTab === 'flow'}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'flow'
              ? 'border-[#0ABAB5] text-[#0ABAB5]'
              : 'border-transparent text-[#666] hover:text-black'
          }`}
        >
          시장 동향
        </Link>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'top' ? <TopTab /> : <FlowTab />}
    </div>
  );
}
```

---

## 검증 순서

1. **빌드 확인**
   ```bash
   npm run build
   ```
   에러 없이 통과해야 함.

2. **개발 서버에서 시각 확인**
   ```bash
   npm run dev
   ```
   - `http://localhost:3000/net-buy?tab=top` → 실제 종목명(SK하이닉스, 삼성전자 등) + 실제 순매수 금액 표시되어야 함. "로딩 중…" 순간 보인 뒤 테이블 렌더.
   - `http://localhost:3000/net-buy?tab=flow` → 4행 (외국인/기관/개인/기타법인). 기타법인은 "+0억 / +0억"으로 표시(정상).
   - `http://localhost:3000/investor-flow` → `/net-buy?tab=flow`로 리다이렉트 되는지 재확인.
   - "실데이터 연결 예정" 뱃지가 두 탭 모두에서 사라졌는지 확인.

3. **네트워크 탭 확인**
   - 탭 1: `/api/kis/investor-rank` 200 응답
   - 탭 2: `/api/home/investor-flow` 200 응답

## 커밋 메시지
```
feat: wire KIS API data into /net-buy tabs (Phase 2-B complete)

- TopTab: merge foreignTop + institutionTop from /api/kis/investor-rank,
  dedupe by symbol, sort by (foreign + institution) sum, top 20
- FlowTab: 4-row market flow from /api/home/investor-flow (scope
  reduced from 20-row historical stub — current API only returns
  today's snapshot)
- Remove "실데이터 연결 예정" placeholders
- Add loading / error / empty states mirroring home widget pattern
```

## 완료 후 공유할 정보
- 빌드 성공 여부
- 두 탭의 스크린샷 (실제 종목명 + 실제 금액이 보이는)
- 네트워크 응답 상태
