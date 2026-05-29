<!-- 2026-05-29 -->
# STEP 111 — 헤더 정리 (V4 죽은 코드 삭제 + 검색 활성화·위치 이동 + ContextNav 제거)

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `f1b2cf3` (STEP 110 — 개발자 마커 일괄 제거)
- 빌드 클린, Layer 1 전면 실데이터 완성
- **중요 발견**: 헤더 시스템이 V3/V4 2벌 공존. V4 헤더 컴포넌트 5개는 모두 import 0건 (죽은 코드). 현재 활성 헤더는 V3 `components/layout/Header.tsx`.
- 현재 활성 헤더 (V3) 의 검색 form 은 `/stocks?q=` 로 navigate 만 함, 자동완성 없음, placeholder 는 "Layer 5 에서 활성화" 라 비활성처럼 보임.

## 문제 (사용자 피드백)
1. **헤더 검색 vs 우상단 스크리너 중복 오해** — 같은 🔍 아이콘 + 비슷한 명칭
2. **검색박스 위치** — Row 1 (로고 옆) → Row 3 (메뉴 라인 가운데) 이동 요청 (검색=navigation 관점)
3. **ContextNav (Movers Volume VI...)** — 카드 헤더와 중복, 통째 제거
4. **V3/V4 헤더 코드 공존** — 코드 꼬일 위험. V4 미사용 5개 삭제로 정리

## 목표
1. **V4 미사용 헤더 컴포넌트 5개 삭제** (죽은 코드 청소)
2. **신규 자동완성 검색 컴포넌트** `components/header/HeaderSearch.tsx`
3. **MainNav 가운데에 검색박스 배치** — Row 3 = [윈도우 3개] [검색 flex-1] [메뉴 2개]
4. **Header.tsx (V3) 의 검색 form 제거** — Row 1 슬림화 (로고 + 국가 + 알림 + 유저)
5. **Header.tsx 의 Star ⭐ → /stocks 링크 제거** — 우측 WatchlistPanel 이 이미 같은 역할 (STEP 113 에서 통합)
6. **MainNav 아이콘 변경** — Search→BarChart3, Calendar→CalendarDays. 라벨 "종목발굴 (Screener)" / "경제 캘린더 (Calendar)" 유지
7. **신규 API** `/api/stocks/search` (stocks DB 자동완성)
8. **ContextNav 제거** `app/(windows)/layout.tsx`

## UX 원칙
- 모국어 라벨이 단독으로도 이해 가능해야 함
- "스크리너" 단독은 외래어라 모호 → "종목발굴" 한국어 우선
- 영문 subscript 는 보조 단서

---

## 작업 내용

### 1. 죽은 코드 삭제 (5개 파일)

```bash
rm components/header/UnjongHeader.tsx
rm components/header/UnjongLogo.tsx
rm components/header/UnjongSearch.tsx
rm components/header/WindowSwitcher.tsx
rm components/header/GlobalTickerBar.tsx
```

**검증**: 삭제 전 import 0건 확인됨 (UnjongHeader만 4개 컴포넌트 import 했고, UnjongHeader 자체는 어디서도 import 안 됨).

**보존**: `components/header/MainNav.tsx`, `components/header/ContextNav.tsx` (ContextNav 는 layout 에서만 빼고 파일은 보존)

### 2. 신규 API — `app/api/stocks/search/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * GET /api/stocks/search?q=삼성&limit=10
 * stocks 테이블 (is_active=true) 에서 name_ko/name_en/symbol 부분 일치
 * market_cap 내림차순 정렬
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const limit = Math.min(parseInt(sp.get("limit") || "10", 10), 30);

  if (!q || q.length < 1) {
    return NextResponse.json({ items: [] });
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ items: [], error: "Supabase 미설정" }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const qLike = `%${q}%`;
    const { data, error } = await supabase
      .from("stocks")
      .select("symbol, name_ko, name_en, market, country, market_cap")
      .eq("is_active", true)
      .or(`name_ko.ilike.${qLike},name_en.ilike.${qLike},symbol.ilike.${qLike}`)
      .order("market_cap", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ items: [], error: error.message }, { status: 200 });
    }

    const items = (data || []).map((row) => ({
      symbol: row.symbol,
      name: row.name_ko || row.name_en || row.symbol,
      market: row.market,
      country: row.country,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

### 3. 신규 컴포넌트 — `components/header/HeaderSearch.tsx`

자동완성 드롭다운 검색. MainNav 가운데에 배치될 컴포넌트.

```typescript
"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

type SearchResult = {
  symbol: string;
  name: string;
  market: string;
  country: string;
};

function inferMarket(country: string, market: string): "KOSPI" | "KOSDAQ" | "US" {
  if (country === "US") return "US";
  if (market === "KOSPI") return "KOSPI";
  return "KOSDAQ";
}

export function HeaderSearch() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search (200ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const r = await fetch(`/api/stocks/search?q=${encodeURIComponent(trimmed)}&limit=10`);
        const json = await r.json();
        setResults(json.items || []);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Click outside → close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (item: SearchResult) => {
    setSelectedSymbol({
      code: item.symbol,
      name: item.name,
      market: inferMarket(item.country, item.market),
    });
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      setQuery("");
      return;
    }
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (target) handleSelect(target);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl mx-4">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted z-10">
        <Search size={14} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder="종목명·코드 검색 (예: 삼성전자, 005930, AAPL)"
        className="w-full rounded-md border border-unjong-border bg-unjong-surface py-1 pl-8 pr-8 text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none focus:border-unjong-accent transition-colors"
        aria-label="운종 종목 검색"
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-unjong-muted hover:text-unjong-primary"
          aria-label="검색어 지우기"
        >
          <X size={12} />
        </button>
      )}

      {/* 드롭다운 */}
      {showDropdown && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto rounded-md border border-unjong-border bg-unjong-surface shadow-lg z-50">
          {loading && results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-unjong-muted italic">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-unjong-muted italic">
              일치하는 종목이 없습니다.
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item, i) => {
                const market = inferMarket(item.country, item.market);
                const marketColor =
                  market === "KOSPI"
                    ? "bg-blue-50 text-blue-700"
                    : market === "KOSDAQ"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-purple-50 text-purple-700";
                return (
                  <li key={item.symbol}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                        i === activeIndex ? "bg-unjong-background" : "hover:bg-unjong-background"
                      }`}
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${marketColor}`}>
                        {market}
                      </span>
                      <span className="font-medium text-unjong-primary truncate flex-1">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-unjong-muted font-mono flex-shrink-0">
                        {item.symbol}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

### 4. 수정 — `components/header/MainNav.tsx`

가운데에 HeaderSearch 배치 + 아이콘 변경 + 라벨 유지.

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays } from "lucide-react";
import { HeaderSearch } from "./HeaderSearch";

const PRIMARY_WINDOWS = [
  { href: "/scalper", label: "단타창", emoji: "⚡" },
  { href: "/longterm", label: "장타창", emoji: "🌳" },
  { href: "/us", label: "미국주식창", emoji: "🌙" },
] as const;

const SECONDARY_LINKS = [
  { href: "/screener", label: "종목발굴", englishLabel: "Screener", icon: BarChart3 },
  { href: "/calendar", label: "경제 캘린더", englishLabel: "Calendar", icon: CalendarDays },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-4 border-b border-unjong-border bg-unjong-background px-4 py-2"
      aria-label="메인 네비"
    >
      {/* 좌측: 운종 3창 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {PRIMARY_WINDOWS.map((w) => {
          const isActive = pathname?.startsWith(w.href);
          return (
            <Link
              key={w.href}
              href={w.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "flex items-center gap-1 rounded-md border-2 border-unjong-accent bg-unjong-surface px-3 py-1 text-sm font-semibold text-unjong-primary shadow-sm"
                  : "flex items-center gap-1 rounded-md border-2 border-transparent px-3 py-1 text-sm font-medium text-unjong-muted hover:bg-unjong-surface hover:text-unjong-primary"
              }
            >
              <span aria-hidden>{w.emoji}</span>
              <span>{w.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 가운데: 검색 (flex-1) */}
      <HeaderSearch />

      {/* 우측: 보조 링크 */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {SECONDARY_LINKS.map(({ href, label, englishLabel, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 text-xs text-unjong-muted hover:text-unjong-primary transition-colors"
          >
            <Icon size={14} />
            <span className="font-medium">{label}</span>
            <span className="text-[10px] text-unjong-muted">({englishLabel})</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

### 5. 수정 — `components/layout/Header.tsx`

검색 form 통째 제거 + Star ⭐ 링크 제거. 헤더 슬림화.

기존 (해당 블록):
```typescript
{/* ── 통합 검색박스 ── */}
<form onSubmit={handleSearch} className="relative flex-1 max-w-2xl mx-2">
  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="종목·뉴스·공시 통합 검색  ·  Layer 5 에서 활성화"
    className="w-full rounded-md border border-unjong-border bg-unjong-background py-1.5 pl-9 pr-3 text-sm placeholder:text-unjong-muted focus:outline-none focus:border-unjong-accent"
  />
</form>
```
→ **이 form 블록 통째로 삭제**. `searchQuery` state, `setSearchQuery`, `handleSearch` 함수도 같이 삭제. `Search` import 도 삭제 (다른 곳에서 안 쓰면).

또한 우측 아이콘 영역에서 Star ⭐ 링크 2개 제거:
```typescript
// 비로그인 케이스 (line 111~113)
<Link href="/stocks" className="..." title="관심종목">
  <Star size={18} />
</Link>
// 로그인 케이스 (line 120~122)
<Link href="/stocks?tab=watchlist" className="..." title="관심종목">
  <Star size={18} />
</Link>
```
→ **2개 블록 모두 삭제**. `Star` import 도 삭제.

남는 우측 아이콘: 국가 선택 (🇰🇷) + 알림 (Bell) + 유저 (User).

또한 `ml-auto` 가 필요할 수 있음 — Header div 의 flex-1 가운데 검색이 빠졌으니, 우측 영역이 자연스럽게 우측 정렬되도록 `<div className="flex items-center gap-3 ml-auto shrink-0">` 처럼 `ml-auto` 추가 (이미 있으면 유지).

### 6. 수정 — `app/(windows)/layout.tsx` (ContextNav 제거)

```typescript
// 기존 5번째 줄 — 삭제
import { ContextNav } from "@/components/header/ContextNav";
```

```typescript
// 기존 22번째 줄 부근 — 삭제
<div className="flex-1 flex flex-col min-w-0">
  <ContextNav />  ← 이 줄 삭제

  {/* 1행: 종목상세 (flex-1) + 관심종목 (300px) 가로 배치 */}
```

`ContextNav.tsx` 파일 자체는 보존 (사용자 결정).

### 7. 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

체크리스트:
- TypeScript 에러 없음
- 삭제한 파일 import 가 다른 곳에 남아있지 않은지
- `Search` 아이콘 import 가 Header.tsx 에서 빠졌는지

### 8. 잔여 확인 — V4 헤더 컴포넌트 import 잔재 0건

```bash
grep -rn "UnjongHeader\|UnjongLogo\|UnjongSearch\|WindowSwitcher\|GlobalTickerBar" --include="*.tsx" --include="*.ts" 2>&1 | grep -v "node_modules\|.next"
```

위 결과가 **0건** 이어야 함. 1건이라도 남으면 import 정리 필요.

### 9. 커밋 + 푸시

```bash
git add -A
git commit -m "refactor(header): V4 죽은 코드 삭제 + 검색 활성화·재배치 + ContextNav 제거

문제: V3/V4 헤더 코드가 공존. V4 헤더 5개 컴포넌트는 import 0건 (죽은 코드).
사용자 피드백: 검색박스 vs 스크리너 중복 오해, 검색박스 위치 재배치 희망,
ContextNav 가 카드 헤더와 중복 → 제거.

변경 1: V4 미사용 헤더 컴포넌트 5개 삭제
- components/header/UnjongHeader.tsx
- components/header/UnjongLogo.tsx
- components/header/UnjongSearch.tsx
- components/header/WindowSwitcher.tsx
- components/header/GlobalTickerBar.tsx
(ContextNav.tsx 는 보존, layout 에서만 분리)

변경 2: 신규 자동완성 검색
- app/api/stocks/search — Supabase stocks (2,780종목) name_ko/name_en/symbol 부분일치
- components/header/HeaderSearch.tsx — debounce 200ms, ↑↓Enter 키보드,
  시장 배지(KOSPI/KOSDAQ/US 색상), 외부 클릭 닫힘, 선택 시 setSelectedSymbol

변경 3: 검색박스 위치 이동
- components/layout/Header.tsx — Row 1 의 검색 form 통째 제거 + Star 링크 제거
- components/header/MainNav.tsx — Row 3 가운데에 HeaderSearch 배치
- 결과 레이아웃: [윈도우 3개] [검색 flex-1] [📊종목발굴 📅경제캘린더]
- 헤더 Row 1 슬림화: [로고] [국가] [알림] [유저]

변경 4: MainNav 아이콘 변경
- Search → BarChart3 (검색박스와 시각적 구분)
- Calendar → CalendarDays (캘린더답게)
- 라벨 '종목발굴 (Screener)' / '경제 캘린더 (Calendar)' 유지 (직관성)

변경 5: ContextNav 제거
- app/(windows)/layout.tsx 에서 import + 렌더 삭제
- 이유: 카드 헤더와 중복, 학습 비용, 모바일 부담, 업계 표준 X
- 컴포넌트 파일 자체는 보존"
git push
```

## 검증 (사용자 안내용)

푸시 후 브라우저 하드 리프레시 (Cmd+Shift+R):

1. **Row 1 헤더** — 로고 + 국가 + 알림 + 유저만 (검색 사라짐, Star 사라짐)
2. **Row 3 메뉴 라인** — [⚡단타창 🌳장타창 🌙미장] [🔍 검색박스 (가운데)] [📊종목발굴 📅경제 캘린더]
3. **검색 동작** — "삼성" 입력 → 드롭다운에 삼성전자/삼성바이오/삼성SDI 시총 순서. 클릭 시 중앙 패널에 종목 차트/호가 표시
4. **ContextNav 사라짐** — 단타·장타·미장 페이지의 Movers/Volume/VI/... 가로 메뉴 없어짐
5. **카드 영역 위치 동일** — 본문 카드들은 그대로
6. **우측 관심종목 동일** — WatchlistPanel 그대로 (STEP 113 에서 통합 예정)

## 완료 후 보고

- ✅/❌ 빌드 결과
- ✅/❌ V4 헤더 컴포넌트 잔여 import 0건
- ✅/❌ 커밋 해시 + 푸시
- API 테스트: `curl "http://localhost:3333/api/stocks/search?q=삼성&limit=5"` 응답 확인
