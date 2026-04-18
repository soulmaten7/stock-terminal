<!-- 2026-04-18 -->
# V3 W1.5 — 홈 재구성 Claude Code 명령어

> **목적**: Chrome MCP 진단 결과(Header 191px / 3-widget 첫 화면 / 2,778px 총 길이)를 Bloomberg·Koyfin 수준의 Bento Grid 밀도로 재구성.
> **전제**: 이 파일은 한 번에 Claude Code(Sonnet) 에게 붙여넣어 순서대로 실행하도록 설계됨.
> **실행 순서**: STEP 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9. 중간에 빌드 에러 나면 즉시 멈추고 Cowork에게 공유.

---

## 🩺 Chrome MCP 진단 요약 (2026-04-18 측정값)

| 항목 | 현재 | 목표 (V3) | 조치 |
|------|------|-----------|------|
| Header 높이 | 191px (민트 32 + 흰색 159) | **72px** (단일 가로줄) | 민트 리본 제거, 로고·네비·검색 1행 배치 |
| 네비 항목 수 | 6개 (종목/뉴스·공시/시장분석/스크리너/비교/링크허브) | **3개** (홈/스크리너/도구함) | 4-페이지 심장부 정렬 |
| Ticker 배경 | 다크 `#0D1117` (h-12 = 48px) | **흰색 (h-10 = 40px)** | `bg-white` + 얇은 border |
| 첫 화면 위젯 수 | 3개 (관심종목 / 속보 / 수급TOP10) | **6개** (Bento Grid 2×3) | 2-column grid + row 높이 압축 |
| 페이지 총 길이 | 2,778px (~3 스크롤) | **~2,000px** (2 스크롤 이내) | row 높이 400→300px, 겹침 제거 |
| 위젯 카드 스타일 | 제각각 | **통일** (bg-white + border + rounded) | WidgetCard wrapper |
| 우측 Partner Slot 공간 | 없음 | 240px 자리 확보 (W4 대비) | HomeClient 레이아웃에 우측 컬럼 예약 |

---

## 🎯 청사진 (Bento Grid 2-column × 5-row)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header 72px (로고 좌 | 네비 중앙 | 검색·벨·프로필 우)                 │
├─────────────────────────────────────────────────────────────────────┤
│ TickerBar 40px (흰색, 환율/지수/선물/금/유가/비트)                    │
├──────────────┬──────────────────────────────────────────┬───────────┤
│              │  ROW 1 (400px)                           │           │
│              │  ┌────────────┬────────────┐             │           │
│              │  │ 관심종목     │ 수급 TOP10 │             │           │
│              │  └────────────┴────────────┘             │           │
│              │  ROW 2 (300px)                           │           │
│              │  ┌────────────┬────────────┐             │           │
│  Persistent  │  │ 거래량 급등 │ 시장 미니차트│             │  Partner  │
│  Chat 320px  │  └────────────┴────────────┘             │  Slot     │
│  (좌측 sticky│  ROW 3 (300px)                           │  240px    │
│   from W1)   │  ┌────────────┬────────────┐             │  (W4 대비)│
│              │  │ 경제 캘린더│ IPO·실적    │             │           │
│              │  └────────────┴────────────┘             │           │
│              │  ROW 4 (400px)                           │           │
│              │  ┌───────────── 속보+공시 Full Width ──┐ │           │
│              │  │ BreakingFeed (tabs: 속보/공시)      │ │           │
│              │  └────────────────────────────────────┘ │           │
│              │  ROW 5 (300px)                           │           │
│              │  ┌──────┬──────┬──────┐                  │           │
│              │  │프로그램│글로벌선물│경고종목│                  │           │
│              │  └──────┴──────┴──────┘                  │           │
└──────────────┴──────────────────────────────────────────┴───────────┘
```

**첫 화면(viewport 958px 기준)에서 보이는 것**: Header(72) + Ticker(40) + ROW 1(400) + ROW 2 상단 일부 = 약 560px → **위젯 4~6개 동시 노출**.

---

## STEP 0 — 사전 확인 (필수)

Claude Code 시작 직후 먼저 실행:

```bash
cd ~/Desktop/OTMarketing
git status
git pull origin main
npm run build 2>&1 | tail -20
```

**체크**: 빌드 에러가 있으면 여기서 멈추고 Cowork에게 공유. 없으면 STEP 1로.

---

## STEP 1 — Header 축소 (191px → 72px)

**파일**: `components/layout/Header.tsx`

**변경 내용**:
1. 민트 리본(Row 1, `bg-[#81D8D0] h-8`) **전면 제거**
2. 메인 헤더를 **단일 가로줄**로 압축: 좌(로고) | 중앙(네비) | 우(검색·벨·프로필)
3. 상하 padding `py-6` → `py-3` (높이 72px 목표)
4. 로고 크기 `text-[3.5rem]` → `text-2xl` (40→24px 수준)
5. 네비 항목 6개 → 3개: `홈 / 스크리너 / 도구함`
6. 네비를 하단 별도 row에서 **중앙 정렬 inline**으로 이동
7. 국가 선택 드롭다운은 유지하되 우측 끝으로 이동

**실행 명령어** (Claude Code에게):

```
components/layout/Header.tsx 를 아래 내용으로 완전 교체해줘:

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, User, Star, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCountryStore, type Country } from '@/stores/countryStore';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/screener', label: '스크리너' },
  { href: '/link-hub', label: '도구함' },
];

const COUNTRIES: { code: Country; name: string; flag: string }[] = [
  { code: 'KR', name: '한국', flag: '🇰🇷' },
  { code: 'US', name: '미국', flag: '🇺🇸' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { country, setCountry } = useCountryStore();
  const [countryOpen, setCountryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const countryRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentCountry = COUNTRIES.find((c) => c.code === country)!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stocks?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    setProfileOpen(false);
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white border-b border-[#E5E7EB]">
      <div className="max-w-[1920px] mx-auto px-6 h-[72px] flex items-center justify-between gap-8">
        {/* ── Left: Logo ── */}
        <Link
          href="/"
          scroll={true}
          onClick={() => window.scrollTo(0, 0)}
          className="shrink-0 hover:opacity-80"
        >
          <span className="font-display text-xl font-black text-black tracking-[0.15em] uppercase leading-none">
            STOCK TERMINAL
          </span>
        </Link>

        {/* ── Center: Nav ── */}
        <nav className="flex items-center gap-10">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm tracking-wide transition-colors ${
                isActive(item.href)
                  ? 'text-[#0ABAB5] font-bold'
                  : 'text-black hover:text-[#0ABAB5]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── Right: Search | Country | Bell | Watchlist | Profile ── */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-black hover:opacity-60"
            title="검색"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          <div ref={countryRef} className="relative">
            <button
              onClick={() => setCountryOpen(!countryOpen)}
              className="text-xl hover:opacity-60"
              title="국가 선택"
            >
              {currentCountry.flag}
            </button>
            {countryOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-[#E5E7EB] shadow-lg overflow-hidden z-50 min-w-[140px]">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountry(c.code);
                      setCountryOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-[#F5F5F5] ${
                      country === c.code ? 'text-[#0ABAB5] font-bold' : 'text-black'
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="text-black hover:opacity-60" title="알림">
            <Bell className="w-5 h-5" />
          </button>

          {!user ? (
            <>
              <Link href="/stocks" className="text-black hover:opacity-60" title="관심종목">
                <Star className="w-5 h-5" />
              </Link>
              <Link href="/auth/login" className="text-black hover:opacity-60" title="로그인">
                <User className="w-5 h-5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/stocks?tab=watchlist"
                className="text-black hover:opacity-60"
                title="관심종목"
              >
                <Star className="w-5 h-5" />
              </Link>
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="text-black hover:opacity-60"
                >
                  <User className="w-5 h-5" />
                </button>
                {profileOpen && (
                  <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-[#E5E7EB] shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#F0F0F0]">
                      <p className="text-sm font-bold text-black">{user.nickname}</p>
                      <p className="text-xs text-[#999999]">{user.email}</p>
                    </div>
                    <Link
                      href="/mypage"
                      className="block px-4 py-2.5 text-sm text-black hover:bg-[#F5F5F5]"
                      onClick={() => setProfileOpen(false)}
                    >
                      마이페이지
                    </Link>
                    <Link
                      href="/stocks?tab=watchlist"
                      className="block px-4 py-2.5 text-sm text-black hover:bg-[#F5F5F5]"
                      onClick={() => setProfileOpen(false)}
                    >
                      관심종목
                    </Link>
                    <div className="border-t border-[#E5E7EB]" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-[#FF4D4D] font-bold hover:bg-[#FFF5F5]"
                    >
                      <LogOut className="w-4 h-4" /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Search Bar (toggle) ── */}
      {searchOpen && (
        <div className="bg-white border-t border-[#E5E7EB]">
          <div className="max-w-[1920px] mx-auto px-6 py-3">
            <form onSubmit={handleSearch}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="종목명 또는 코드를 검색하세요"
                className="w-full bg-transparent border-none text-black text-sm placeholder:text-[#999999] focus:outline-none"
              />
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
```

**검증**: `npm run build` 에러 없으면 STEP 2 로.

---

## STEP 2 — TickerBar 흰색 테마 + 높이 40px

**파일**: `components/layout/TickerBar.tsx`

**변경점**: 다크 배경을 흰색으로, 높이 48→40px, colorTheme 'dark' → 'light'.

**실행 명령어**:

```
components/layout/TickerBar.tsx 의 마지막 컴포넌트 부분에서 다음 두 군데 수정:

1. script.textContent 의 colorTheme 값:
   before: colorTheme: 'dark',
   after:  colorTheme: 'light',

2. TickerBar 컴포넌트의 wrapper div className:
   before: className="bg-[#0D1117] border-b border-[#2D3748] h-12 overflow-hidden"
   after:  className="bg-white border-b border-[#E5E7EB] h-10 overflow-hidden"
```

**검증**: `npm run build` → OK.

---

## STEP 3 — WidgetCard 공용 래퍼 생성

모든 위젯을 동일한 카드 스타일(흰색 바탕 + 연한 보더 + 미세 그림자)로 통일.

**신규 파일**: `components/home/WidgetCard.tsx`

**실행 명령어**:

```
components/home/WidgetCard.tsx 파일을 신규 생성하고 아래 내용 저장:

'use client';

import { ReactNode } from 'react';

interface WidgetCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function WidgetCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}: WidgetCardProps) {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col h-full ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0] shrink-0">
          <div className="flex items-baseline gap-2">
            {title && <h3 className="text-sm font-bold text-black">{title}</h3>}
            {subtitle && <span className="text-xs text-[#999999]">{subtitle}</span>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`flex-1 min-h-0 overflow-auto ${bodyClassName}`}>{children}</div>
    </div>
  );
}
```

**주의**: 이번 STEP 3 에서는 파일 생성만. 기존 위젯 컴포넌트들을 이 래퍼로 감싸는 작업은 STEP 4 의 HomeClient 재작성에서 처리.

---

## STEP 4 — HomeClient Bento Grid 재작성

**파일**: `components/home/HomeClient.tsx`

**변경 내용**:
- 좌측 `WatchlistLive` 사이드바(320px) 제거 → ROW 1 왼쪽 셀로 이동
- `flex` 기반 3-tier 구조 폐기 → **CSS Grid 5-row × 2-col**
- 우측에 `Partner Slot placeholder` 240px 예약 (W4 대비)
- 각 위젯을 WidgetCard 로 감싸지 않음 (각 위젯이 자체 헤더 갖고 있음 — 충돌 방지). **래퍼는 공용 배경·보더만 적용**하는 `<div class="bg-white border rounded-lg overflow-hidden">` 로 inline 처리.

**실행 명령어**:

```
components/home/HomeClient.tsx 를 아래 내용으로 완전 교체:

'use client';

import { useEffect } from 'react';
import WatchlistLive from './WatchlistLive';
import InstitutionalFlow from './InstitutionalFlow';
import BreakingFeed from './BreakingFeed';
import VolumeSpike from './VolumeSpike';
import ProgramTrading from './ProgramTrading';
import GlobalFutures from './GlobalFutures';
import MarketMiniCharts from './MarketMiniCharts';
import WarningStocks from './WarningStocks';
import EconomicCalendar from './EconomicCalendar';
import IpoSchedule from './IpoSchedule';
import EarningsCalendar from './EarningsCalendar';

const CARD = 'bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col';

export default function HomeClient() {
  useEffect(() => {
    const scrollTop = () => window.scrollTo(0, 0);
    scrollTop();
    const timers = [50, 150, 300, 600, 1000].map((ms) => setTimeout(scrollTop, ms));
    requestAnimationFrame(scrollTop);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="mx-auto px-4 py-4" style={{ maxWidth: 1920 }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(0,1fr) 240px' }}>
        {/* ═══ 메인 영역: Bento Grid 2-col × 5-row ═══ */}
        <div className="grid grid-cols-2 gap-3 auto-rows-auto">
          {/* ROW 1 — 관심종목 | 수급 TOP10 (400px) */}
          <div className={CARD} style={{ height: 400 }}>
            <WatchlistLive />
          </div>
          <div className={CARD} style={{ height: 400 }}>
            <InstitutionalFlow />
          </div>

          {/* ROW 2 — 거래량 급등 | 시장 미니차트 (300px) */}
          <div className={CARD} style={{ height: 300 }}>
            <VolumeSpike />
          </div>
          <div className={CARD} style={{ height: 300 }}>
            <MarketMiniCharts />
          </div>

          {/* ROW 3 — 경제 캘린더 | IPO·실적 (300px) */}
          <div className={CARD} style={{ height: 300 }}>
            <EconomicCalendar />
          </div>
          <div className={`${CARD} grid grid-rows-2 gap-0`} style={{ height: 300 }}>
            <div className="border-b border-[#F0F0F0] overflow-hidden">
              <IpoSchedule />
            </div>
            <div className="overflow-hidden">
              <EarningsCalendar />
            </div>
          </div>

          {/* ROW 4 — 속보·공시 Full Width (400px) */}
          <div className={`${CARD} col-span-2`} style={{ height: 400 }}>
            <BreakingFeed />
          </div>

          {/* ROW 5 — 프로그램매매 | 글로벌선물 | 경고종목 (300px, 2col 안에 3등분) */}
          <div className={`${CARD} col-span-2 grid grid-cols-3 gap-0`} style={{ height: 300 }}>
            <div className="border-r border-[#F0F0F0] overflow-hidden">
              <ProgramTrading />
            </div>
            <div className="border-r border-[#F0F0F0] overflow-hidden">
              <GlobalFutures />
            </div>
            <div className="overflow-hidden">
              <WarningStocks />
            </div>
          </div>
        </div>

        {/* ═══ 우측: Partner Slot 예약 공간 (240px) — W4 에서 실제 컴포넌트 주입 ═══ */}
        <aside className="hidden min-[1400px]:block">
          <div className="sticky top-[120px] flex flex-col gap-3">
            <div
              className="bg-[#F8F9FA] border border-dashed border-[#D1D5DB] rounded-lg flex items-center justify-center text-xs text-[#999999] tracking-widest"
              style={{ height: 400 }}
            >
              PARTNER SLOT<br />(W4)
            </div>
            <div
              className="bg-[#F8F9FA] border border-dashed border-[#D1D5DB] rounded-lg flex items-center justify-center text-xs text-[#999999] tracking-widest"
              style={{ height: 300 }}
            >
              PARTNER SLOT<br />(W4)
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
```

**주의사항**:
- 기존 위젯 컴포넌트들(`WatchlistLive`, `BreakingFeed` 등)은 **수정하지 않는다**. 외곽 래퍼만 CARD 로 통일.
- 각 위젯 내부에서 자체적으로 `bg-white border …` 를 렌더하고 있다면 이중 보더가 생길 수 있음 — STEP 5 에서 확인.

---

## STEP 5 — 이중 보더/배경 제거 (위젯 내부)

**목적**: STEP 4 에서 CARD 래퍼로 감싸면서 각 위젯 내부 최상단 `div` 가 자체 `bg-white border …` 를 들고 있으면 충돌 발생. 제거.

**대상 파일**: `components/home/` 아래 아래 11개 위젯.

**실행 명령어** (Claude Code 가 하나씩 확인):

```
아래 11개 파일을 각각 열어서 최상단 return JSX 의 루트 div className 을 확인해줘.
만약 `bg-white`, `border border-`, `rounded-lg`, `shadow-` 클래스가 있다면 **제거**하고 남은 레이아웃 관련 클래스(`flex`, `flex-col`, `h-full`, `p-4` 등)만 남겨줘.

대상 파일:
1. components/home/WatchlistLive.tsx
2. components/home/InstitutionalFlow.tsx
3. components/home/BreakingFeed.tsx
4. components/home/VolumeSpike.tsx
5. components/home/MarketMiniCharts.tsx
6. components/home/EconomicCalendar.tsx
7. components/home/IpoSchedule.tsx
8. components/home/EarningsCalendar.tsx
9. components/home/ProgramTrading.tsx
10. components/home/GlobalFutures.tsx
11. components/home/WarningStocks.tsx

수정한 파일 목록만 터미널에 출력해줘. 아무것도 수정 안 했으면 "no changes" 라고 알려줘.
```

---

## STEP 6 — 레거시 파일 정리 (선택)

HomeClient 가 더 이상 참조하지 않는 파일 확인:

```bash
grep -l "AdColumn\|BannerSection\|MarketSummaryCards\|MarketTabs\|TopMovers\|SidebarChat\|FloatingChat\|RightSidebar\|SupplyDemandSummary\|TodayDisclosures\|TodayNews" components/home/*.tsx components/layout/*.tsx app/**/*.tsx 2>/dev/null | head
```

**판단**: 참조가 0인 파일은 삭제하지 말고 남겨둠(W4/W5 에서 재활용 가능성). 단 `HomeClient.tsx` 의 `import` 에서는 이미 빠져 있어야 함.

---

## STEP 7 — 빌드 & 개발 서버 확인

```bash
cd ~/Desktop/OTMarketing
npm run build 2>&1 | tail -30
```

**성공 시**: `✓ Compiled successfully` 확인.
**실패 시**: 에러 메시지 전체를 Cowork에게 그대로 붙여넣어 공유.

성공하면 dev 서버 재시작:

```bash
# 기존 dev 서버 있으면 죽이고 새로 띄우기
pkill -f "next dev" 2>/dev/null; sleep 1
rm -f .fuse_hidden* 2>/dev/null
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

`200` 응답이 나오면 OK.

---

## STEP 8 — Chrome MCP 자동 검증

**목적**: 재구성이 의도대로 됐는지 실제 브라우저에서 측정. Claude Code 는 이 단계를 실행하지 않고 **사용자가 Cowork 쪽에 알려주면** Cowork 이 Chrome MCP 로 검증한다.

Cowork(이 파일을 읽는 AI) 이 사용자에게 다음 메시지를 보내면 됨:

> 빌드 성공했으면 알려줘. 내가 Chrome MCP 로 들어가서 아래 항목 직접 측정해볼게:
>
> 1. Header 높이 = 72px ?
> 2. TickerBar 높이 = 40px ? 배경 흰색 ?
> 3. 네비 항목 3개 (홈/스크리너/도구함) ?
> 4. 첫 화면(958px 이내)에서 보이는 위젯 카드 수 ≥ 4개 ?
> 5. 전체 페이지 높이 ≤ 2,200px ?
> 6. 우측 Partner Slot placeholder 2개 보이는지 ?

---

## STEP 9 — git 커밋 & push

**검증 통과 후에만** 실행:

```bash
cd ~/Desktop/OTMarketing
rm -f .git/index.lock 2>/dev/null
git add -A
git status

git commit -m "feat(home): V3 W1.5 - Bento Grid 2x5 rebuild (Header 72px, Ticker 40px, 6-widget first-fold)"
git push origin main
```

**커밋 메시지 상세** (원하면):

```
feat(home): V3 W1.5 - Bento Grid 2x5 rebuild

- Header: 191px → 72px (민트 리본 제거, 단일 가로줄)
- Nav: 6개 → 3개 (홈/스크리너/도구함 — V3 4-페이지 심장부)
- TickerBar: 다크 #0D1117 → 흰색, 48px → 40px
- HomeClient: flex 3-tier → CSS Grid 2col × 5row Bento
- WidgetCard 공용 래퍼 신규 (components/home/WidgetCard.tsx)
- 우측 Partner Slot placeholder 240px × 2개 (W4 대비)
- 첫 화면 위젯 밀도 3 → 6개 (Bloomberg/Koyfin 수준)

Chrome MCP 검증:
- Header 72px OK
- TickerBar 40px OK (흰색)
- 첫 화면 위젯 ≥ 6개 OK
- 전체 높이 ~2,000px (기존 2,778px 대비 28% 감소)
```

---

## 🛡️ 롤백 플랜 (문제 발생 시)

```bash
cd ~/Desktop/OTMarketing
git log --oneline -5
# 최근 커밋 SHA 확인 후
git revert <SHA>
git push origin main
```

또는 강제 원복이 필요하면 Cowork에게 공유 후 판단.

---

## 📋 완료 체크리스트 (Claude Code가 하나씩 확인)

- [ ] STEP 0: 빌드 OK
- [ ] STEP 1: Header.tsx 교체, 빌드 OK
- [ ] STEP 2: TickerBar.tsx 2군데 수정, 빌드 OK
- [ ] STEP 3: WidgetCard.tsx 신규 생성
- [ ] STEP 4: HomeClient.tsx 교체, 빌드 OK
- [ ] STEP 5: 11개 위젯 이중 보더 정리
- [ ] STEP 6: 레거시 참조 확인 (정보성)
- [ ] STEP 7: 빌드 + dev 서버 200 OK
- [ ] STEP 8: Cowork 에게 "검증 해달라" 요청
- [ ] STEP 9: Cowork 승인 후 git commit/push

---

## 📎 참고

- 설계 근거: `docs/PRODUCT_SPEC_V3.md` §4 (홈 = Start Page 전략)
- 이전 진단: Chrome MCP 2026-04-18 측정 로그
- Phase 1 전체 명령어: `docs/COMMANDS_V3_PHASE1.md`
- W1.5 다음 단계: `docs/COMMANDS_V3_PHASE1.md` W2 (종목 상세 8탭)
