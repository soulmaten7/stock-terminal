# STEP 61 — 사이드바 5그룹 재구성 (VerticalNav)

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표:** `components/layout/VerticalNav.tsx` 의 14개 flat 아이콘 메뉴를 5개 논리 그룹(**시세 / 정보 / 일정 / 글로벌 / 도구**)으로 재구성. 사이드바 폭은 기본 54px(collapsed, 아이콘만) → hover/expanded 시 220px로 확장되며 그룹 헤더 + children label이 표시된다. 5그룹 재구성은 #25 task에 계류 중이던 항목.

**전제 상태 (직전 커밋):** STEP 60 완료 (/briefing 실데이터 전환)

---

## 1. 그룹 구조 정의

| 그룹 | 아이콘(헤더) | 항목 |
|------|-----------|------|
| **시세** | TrendingUp | 홈, 관심종목, 차트, 호가창, 체결창 |
| **정보** | Newspaper | 상승/하락, 거래량, 수급, 뉴스속보, DART 공시 |
| **일정** | Calendar | 경제캘린더, 장전 브리핑 |
| **글로벌** | Globe | 글로벌 지수, 시장 지도 |
| **도구** | Wrench | 종목 발굴, 참고 사이트, 채팅 |

---

## 2. VerticalNav 전면 재작성 — `components/layout/VerticalNav.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home, Filter, Star, LineChart, TrendingUp, Flame, BarChart3, Newspaper,
  FileText, Calendar, Sun, Globe, PieChart, BookMarked,
  ListOrdered, Activity, MessageSquare, Wrench,
} from 'lucide-react';

type LucideIcon = typeof Home;

interface NavItem { icon: LucideIcon; label: string; href: string; }
interface NavGroup { groupIcon: LucideIcon; groupLabel: string; items: NavItem[]; }

const GROUPS: NavGroup[] = [
  {
    groupIcon: TrendingUp,
    groupLabel: '시세',
    items: [
      { icon: Home,        label: '홈',       href: '/' },
      { icon: Star,        label: '관심종목', href: '/watchlist' },
      { icon: LineChart,   label: '차트',     href: '/chart' },
      { icon: ListOrdered, label: '호가창',   href: '/orderbook' },
      { icon: Activity,    label: '체결창',   href: '/ticks' },
    ],
  },
  {
    groupIcon: Newspaper,
    groupLabel: '정보',
    items: [
      { icon: TrendingUp, label: '상승/하락',   href: '/movers/price' },
      { icon: Flame,      label: '거래량 급등', href: '/movers/volume' },
      { icon: BarChart3,  label: '수급',        href: '/net-buy' },
      { icon: Newspaper,  label: '뉴스 속보',   href: '/news' },
      { icon: FileText,   label: 'DART 공시',   href: '/disclosures' },
    ],
  },
  {
    groupIcon: Calendar,
    groupLabel: '일정',
    items: [
      { icon: Calendar, label: '경제캘린더',  href: '/calendar' },
      { icon: Sun,      label: '장전 브리핑', href: '/briefing' },
    ],
  },
  {
    groupIcon: Globe,
    groupLabel: '글로벌',
    items: [
      { icon: Globe,    label: '글로벌 지수', href: '/global' },
      { icon: PieChart, label: '시장 지도',   href: '/analysis' },
    ],
  },
  {
    groupIcon: Wrench,
    groupLabel: '도구',
    items: [
      { icon: Filter,         label: '종목 발굴',   href: '/screener' },
      { icon: BookMarked,     label: '참고 사이트', href: '/toolbox' },
      { icon: MessageSquare,  label: '채팅',        href: '/chat' },
    ],
  },
];

export default function VerticalNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isActive = (href: string) => {
    if (!mounted) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`hidden md:flex flex-col bg-white border-r border-[#E5E7EB] py-3 sticky top-0 h-screen shrink-0 z-50 isolate self-start transition-[width] duration-150 ${
        expanded ? 'w-[220px]' : 'w-14'
      }`}
    >
      {GROUPS.map((group) => {
        const GroupIcon = group.groupIcon;
        const groupActive = group.items.some((it) => isActive(it.href));
        return (
          <div key={group.groupLabel} className="mb-2">
            {/* 그룹 헤더 */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 ${
                expanded ? 'justify-start' : 'justify-center'
              }`}
            >
              <GroupIcon
                className={`w-4 h-4 shrink-0 ${groupActive ? 'text-[#0ABAB5]' : 'text-[#999]'}`}
              />
              {expanded && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#888]">
                  {group.groupLabel}
                </span>
              )}
            </div>

            {/* 그룹 아이템 */}
            <div className="flex flex-col">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex items-center gap-3 mx-1 my-0.5 rounded-md transition-colors ${
                      expanded ? 'px-3 py-2' : 'justify-center w-12 h-10 mx-auto'
                    } ${active ? 'bg-[#0ABAB5]/10' : 'hover:bg-gray-100'}`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#0ABAB5] rounded-r"
                      />
                    )}
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        active ? 'text-[#0ABAB5]' : 'text-gray-600 group-hover:text-gray-900'
                      }`}
                    />
                    {expanded && (
                      <span className={`text-xs truncate ${active ? 'text-[#0ABAB5] font-bold' : 'text-[#333]'}`}>
                        {item.label}
                      </span>
                    )}

                    {!expanded && (
                      <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100]">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
```

---

## 3. 검증

```bash
cd ~/Desktop/OTMarketing
npm run build
```

hover 시 220px 확장 / 떠나면 54px 축소. 모든 경로(홈, /watchlist, /chart, /orderbook, /ticks, /movers/price, /movers/volume, /net-buy, /news, /disclosures, /calendar, /briefing, /global, /analysis, /screener, /toolbox, /chat) 클릭 테스트.

에러 없으면 커밋 + push:

```bash
git add -A
git commit -m "feat(nav): VerticalNav 14 flat → 5 그룹 (시세/정보/일정/글로벌/도구)

- 기본 54px collapsed (아이콘만), hover 시 220px expanded
- 그룹 헤더 아이콘 + uppercase tracking 라벨
- 호가창·체결창·채팅 메뉴 신규 노출
- Task #25 해결

STEP 61 / NAV refactor"
git push
```

---

## 4. 다음 STEP

완료 후 `@docs/STEP_62_COMMAND.md 파일 내용대로 실행해줘` 로 NewsFeed 폴리싱 진행.
