# STEP 55 — DartFilings 위젯 + /disclosures 페이지 리팩토링 (P0)

> **실행 명령어 (Sonnet)**:
> ```bash
> cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
> ```
>
> **목표**: DART 공시 위젯에 중요 토글 추가 + `/disclosures` 페이지 화이트/티얼 테마 마이그레이션 + 시장구분·중요 필터 + 유형 뱃지 컬럼
>
> **전제 상태 (이전 커밋)**: `5d0a3c6` — feat(orderbook): STEP 54 Phase B
>
> **참고 문서**: `docs/WIDGET_SPEC_DartFilings.md` Phase A

---

## 작업 흐름 (총 5개 파일)

1. **신규** `lib/dart-classify.ts` — 공용 분류 유틸
2. **수정** `components/widgets/DartFilingsWidget.tsx` — 중요 토글 + 붉은 보더
3. **신규** `components/disclosures/DisclosuresPageClient.tsx` — 풀 리팩토링
4. **교체** `app/disclosures/page.tsx` — Suspense 래퍼
5. 빌드 → 커밋 → push

---

## Part 1 — `lib/dart-classify.ts` (신규)

**전체 파일 내용** (위젯과 페이지에서 공용 import):

```ts
// lib/dart-classify.ts
// DART 공시 분류 및 색상 매핑 (위젯·페이지 공용)

export type DartType = '주요사항' | '정기공시' | '지분공시' | '감사보고' | '공시';

export const TYPE_COLOR: Record<DartType, string> = {
  '주요사항': 'text-[#FF9500] bg-[#FF9500]/10',
  '정기공시': 'text-[#0ABAB5] bg-[#0ABAB5]/10',
  '지분공시': 'text-[#9B59B6] bg-[#9B59B6]/10',
  '감사보고': 'text-[#0066CC] bg-[#0066CC]/10',
  '공시':     'text-[#999] bg-[#F0F0F0]',
};

export function classifyDartType(reportNm: string): DartType {
  if (/주요사항|유상증자|무상증자|합병|분할|자사주|해산/.test(reportNm)) return '주요사항';
  if (/사업보고서|분기보고서|반기보고서|연결/.test(reportNm)) return '정기공시';
  if (/주요주주|대량보유|주식등/.test(reportNm)) return '지분공시';
  if (/감사보고/.test(reportNm)) return '감사보고';
  return '공시';
}

export function fmtDartDate(rcept_dt: string): string {
  // "20260420" → "04/20"
  if (rcept_dt.length !== 8) return '';
  return `${rcept_dt.slice(4, 6)}/${rcept_dt.slice(6, 8)}`;
}

export function fmtDartDateFull(rcept_dt: string): string {
  // "20260420" → "2026-04-20"
  if (rcept_dt.length !== 8) return rcept_dt;
  return `${rcept_dt.slice(0, 4)}-${rcept_dt.slice(4, 6)}-${rcept_dt.slice(6, 8)}`;
}
```

---

## Part 2 — `components/widgets/DartFilingsWidget.tsx` (전면 교체)

**전체 파일 내용**:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';
import { classifyDartType, TYPE_COLOR, fmtDartDate } from '@/lib/dart-classify';

interface Filing {
  corp_name: string;
  report_nm: string;
  rcept_dt: string;
  url: string;
  is_important: boolean;
}

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function DartFilingsWidget({ inline = false, size = 'default' }: Props = {}) {
  const [items, setItems] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [onlyImportant, setOnlyImportant] = useState(false);

  useEffect(() => {
    fetch('/api/dart?endpoint=list&page_count=30')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.disclosures ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (onlyImportant ? items.filter((d) => d.is_important) : items).slice(0, 15),
    [items, onlyImportant]
  );

  const href = onlyImportant ? '/disclosures?important=1' : '/disclosures';

  const action = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setOnlyImportant(false)}
        className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
          !onlyImportant
            ? 'bg-[#0ABAB5] text-white'
            : 'bg-[#F0F0F0] text-[#666] hover:bg-[#E5E7EB]'
        }`}
      >
        전체
      </button>
      <button
        type="button"
        onClick={() => setOnlyImportant(true)}
        className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
          onlyImportant
            ? 'bg-[#FF3B30] text-white'
            : 'bg-[#F0F0F0] text-[#666] hover:bg-[#E5E7EB]'
        }`}
      >
        중요
      </button>
    </div>
  );

  const content = (
    <>
      {loading && (
        <div className="flex items-center justify-center h-24 text-xs text-[#999]">로딩 중…</div>
      )}
      {error && (
        <div className="flex items-center justify-center h-24 text-xs text-[#FF3B30]">
          공시를 불러오지 못했습니다
        </div>
      )}
      {!loading && !error && (
        <ul aria-label="DART 공시 목록" className="divide-y divide-[#F0F0F0]">
          {filtered.map((d, i) => {
            const type = classifyDartType(d.report_nm);
            return (
              <li
                key={i}
                className={`flex items-start gap-2 px-3 py-2 hover:bg-[#F8F9FA] ${
                  d.is_important ? 'border-l-2 border-[#FF3B30]' : 'border-l-2 border-transparent'
                }`}
              >
                <span className="text-[10px] text-[#999] mt-0.5 shrink-0 w-9">
                  {fmtDartDate(d.rcept_dt)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-black truncate">{d.corp_name}</p>
                    {d.is_important && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white shrink-0">
                        중요
                      </span>
                    )}
                  </div>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#555] truncate block hover:text-[#0ABAB5] hover:underline"
                  >
                    {d.report_nm}
                  </a>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${TYPE_COLOR[type]}`}>
                  {type}
                </span>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-xs text-[#999] text-center">
              {onlyImportant ? '중요 공시 없음' : '공시 없음'}
            </li>
          )}
        </ul>
      )}
    </>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard title="DART 공시 피드" subtitle="DART OpenAPI" href={href} size={size} action={action}>
      {content}
    </WidgetCard>
  );
}
```

---

## Part 3 — `components/disclosures/DisclosuresPageClient.tsx` (신규)

**전체 파일 내용**:

```tsx
'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Search, Calendar, ExternalLink } from 'lucide-react';
import {
  classifyDartType,
  TYPE_COLOR,
  fmtDartDateFull,
} from '@/lib/dart-classify';

interface DartDisclosure {
  corp_name: string;
  corp_code: string;
  stock_code: string;
  report_nm: string;
  rcept_no: string;
  rcept_dt: string;
  flr_nm: string;
  url: string;
  is_important: boolean;
}

type CorpCls = '' | 'Y' | 'K' | 'N';

const CORP_CLS_LABELS: Record<CorpCls, string> = {
  '': '전체',
  'Y': 'KOSPI',
  'K': 'KOSDAQ',
  'N': 'KONEX',
};

export default function DisclosuresPageClient() {
  const sp = useSearchParams();
  const initialImportant = sp.get('important') === '1';
  const initialCorpCls = (sp.get('corp_cls') || '') as CorpCls;
  const initialSymbol = sp.get('symbol') || '';

  const [disclosures, setDisclosures] = useState<DartDisclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSymbol);
  const [onlyImportant, setOnlyImportant] = useState(initialImportant);
  const [corpCls, setCorpCls] = useState<CorpCls>(initialCorpCls);
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bgnDe = dateFilter.replace(/-/g, '');
      const params = new URLSearchParams({
        endpoint: 'list',
        bgn_de: bgnDe,
        page_count: '100',
      });
      if (corpCls) params.set('corp_cls', corpCls);
      const res = await fetch(`/api/dart?${params}`);
      const data = await res.json();
      if (data.disclosures) {
        setDisclosures(data.disclosures);
        setTotal(data.total || 0);
      } else {
        setDisclosures([]);
        setTotal(0);
      }
    } catch {
      setDisclosures([]);
    }
    setLoading(false);
  }, [dateFilter, corpCls]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  const filtered = disclosures
    .filter((d) => (onlyImportant ? d.is_important : true))
    .filter((d) =>
      searchQuery.trim()
        ? d.corp_name.includes(searchQuery) ||
          d.report_nm.includes(searchQuery) ||
          (d.stock_code && d.stock_code.includes(searchQuery))
        : true
    );

  return (
    <div className="w-full px-6 py-6 max-w-screen-2xl mx-auto">
      {/* 상단 헤더 */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-black">
              <FileText className="w-6 h-6 text-[#0ABAB5]" />
              DART 공시 전체
            </h1>
            <p className="text-sm text-[#666] mt-1">
              금융감독원 DART 전자공시시스템 실시간 공시
            </p>
          </div>
          {total > 0 && (
            <span className="text-xs text-[#888]">
              총 <span className="text-black font-bold tabular-nums">{total.toLocaleString()}</span>건
            </span>
          )}
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        {/* 검색 */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="기업명·종목코드·공시제목 검색"
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E5E7EB] rounded focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"
          />
        </form>

        {/* 날짜 */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999] pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 pr-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"
          />
        </div>

        {/* 시장구분 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(CORP_CLS_LABELS) as CorpCls[]).map((key) => (
            <button
              key={key || 'all'}
              type="button"
              onClick={() => setCorpCls(key)}
              className={`text-xs font-medium px-3 py-2 transition-colors ${
                corpCls === key
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {CORP_CLS_LABELS[key]}
            </button>
          ))}
        </div>

        {/* 중요 토글 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={() => setOnlyImportant(false)}
            className={`text-xs font-medium px-3 py-2 transition-colors ${
              !onlyImportant ? 'bg-[#666] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => setOnlyImportant(true)}
            className={`text-xs font-medium px-3 py-2 transition-colors ${
              onlyImportant ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            중요만
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="text-left px-4 py-3 w-28">접수일</th>
                <th className="text-left px-4 py-3 w-24">종목코드</th>
                <th className="text-left px-4 py-3 w-40">기업명</th>
                <th className="text-left px-4 py-3 w-24">유형</th>
                <th className="text-left px-4 py-3">공시 제목</th>
                <th className="text-left px-4 py-3 w-32">제출인</th>
                <th className="text-center px-4 py-3 w-14">원문</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#F0F0F0]">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-5 bg-[#F0F0F0] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <FileText className="w-10 h-10 text-[#E5E7EB] mx-auto mb-3" />
                    <p className="text-sm text-[#666]">
                      {searchQuery
                        ? '검색 결과가 없습니다'
                        : onlyImportant
                        ? '중요 공시가 없습니다'
                        : '해당 날짜의 공시가 없습니다'}
                    </p>
                    <p className="text-xs text-[#999] mt-1">
                      날짜·시장구분·필터를 조정해 보세요
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const type = classifyDartType(d.report_nm);
                  return (
                    <tr
                      key={d.rcept_no}
                      className={`border-t border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors ${
                        d.is_important ? 'bg-[#FF3B30]/[0.03]' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-[#888] tabular-nums text-xs">
                        {fmtDartDateFull(d.rcept_dt)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-xs text-[#333]">
                        {d.stock_code || '-'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-black">{d.corp_name}</span>
                          {d.is_important && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white shrink-0">
                              중요
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLOR[type]}`}
                        >
                          {type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#333] hover:text-[#0ABAB5] hover:underline line-clamp-1"
                        >
                          {d.report_nm.trim()}
                        </a>
                      </td>
                      <td className="px-4 py-2.5 text-[#888] text-xs">{d.flr_nm}</td>
                      <td className="px-4 py-2.5 text-center">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[#F0F0F0] text-[#999] hover:text-[#0ABAB5] transition-colors"
                          aria-label="DART 원문 열기"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#999] mt-4 text-center">
        데이터 출처: 금융감독원 DART 전자공시시스템 (opendart.fss.or.kr)
      </p>
    </div>
  );
}
```

---

## Part 4 — `app/disclosures/page.tsx` (전면 교체)

**전체 파일 내용**:

```tsx
import { Suspense } from 'react';
import DisclosuresPageClient from '@/components/disclosures/DisclosuresPageClient';

export default function DisclosuresPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-6 py-10 max-w-screen-2xl mx-auto">
          <div className="text-sm text-[#999]">로딩 중…</div>
        </div>
      }
    >
      <DisclosuresPageClient />
    </Suspense>
  );
}
```

---

## Part 5 — 빌드 · 커밋 · push

```bash
# 1) 빌드 검증
npm run build

# 2) 빌드 성공 시 커밋 + push
git add -A
git commit -m "$(cat <<'EOF'
feat(disclosures): STEP 55 Phase A — DART 위젯 중요 토글 + 페이지 화이트 테마 리팩토링

- lib/dart-classify.ts 신규 — classifyDartType / TYPE_COLOR 공용 모듈
- DartFilingsWidget: is_important 플래그 활용 + 붉은 보더 + "중요" 뱃지
- DartFilingsWidget: 전체/중요 토글 action 슬롯 추가
- DartFilingsWidget: href 동적화 (?important=1 전달)
- components/disclosures/DisclosuresPageClient.tsx 신규 생성
- app/disclosures/page.tsx Suspense 래퍼로 전환
- /disclosures 화이트/티얼 테마 마이그레이션 (구 다크 테마 제거)
- 시장구분 필터 (전체/KOSPI/KOSDAQ/KONEX) + 중요 토글 추가
- 테이블에 "유형" 컬럼 추가 (분류 뱃지)
- URL 파라미터 지원 (?important, ?corp_cls, ?symbol)
EOF
)"

git push
```

---

## 검증 체크리스트 (푸시 후 사용자 확인)

- [ ] 홈 `/` → DartFilingsWidget 우상단에 "전체 / 중요" 칩 표시
- [ ] "중요" 클릭 시 붉은 보더 달린 공시만 남음
- [ ] 중요 공시 행에 "중요" 뱃지(붉은색) 표시
- [ ] 위젯 우상단 ↗ 클릭 → `/disclosures?important=1` 로 이동, 페이지에서도 중요 토글이 "중요만"으로 초기화됨
- [ ] `/disclosures` 배경은 흰색, 다크 테마 잔재 없음
- [ ] 컨트롤 바: 검색 + 날짜 + 시장구분 4개칩 + 중요 2개칩 모두 렌더
- [ ] KOSDAQ 클릭 시 코스닥 공시만 로드
- [ ] 테이블 "유형" 컬럼에 색상 뱃지 표시 (주요사항=주황, 정기공시=티얼 등)
- [ ] 빌드 에러 0
