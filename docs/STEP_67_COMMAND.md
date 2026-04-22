# STEP 67 — 사이드바 UX 재설계 + MarketFlow 버그 수정

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** 직전 커밋 `b199716` (docs only). 코드 최종은 `6cbf55a` (STEP 59~66).

**목표 (4개를 한 커밋으로 묶음):**
1. VerticalNav 호버 확장(54px↔220px) 롤백 → 항상 54px, 호버 시 툴팁만 표시
2. 사이드바에서 `채팅` 메뉴 항목 제거 (`/chat` 페이지 자체는 유지)
3. 그룹 구조를 🅑 안으로 재설계: **핵심 / 분석 / 시장흐름 / 정보 / 도구**
4. `components/analysis-page/MarketFlow.tsx` 런타임 TypeError 수정 (`f.value` undefined 시 `.toLocaleString()` 호출 실패)

---

## 작업 1 — `components/layout/VerticalNav.tsx` 전체 교체

아래 내용으로 **파일 전체를 덮어쓰기**:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home, Filter, Star, LineChart, TrendingUp, Flame, BarChart3, Newspaper,
  FileText, Calendar, Sun, Globe, PieChart, BookMarked,
  ListOrdered, Activity, Wrench,
} from 'lucide-react';

type LucideIcon = typeof Home;

interface NavItem { icon: LucideIcon; label: string; href: string; }
interface NavGroup { groupIcon: LucideIcon; groupLabel: string; items: NavItem[]; }

const GROUPS: NavGroup[] = [
  {
    groupIcon: Home,
    groupLabel: '핵심',
    items: [
      { icon: Home,   label: '홈',         href: '/' },
      { icon: Star,   label: '관심종목',   href: '/watchlist' },
      { icon: Filter, label: '종목 발굴',  href: '/screener' },
    ],
  },
  {
    groupIcon: LineChart,
    groupLabel: '분석',
    items: [
      { icon: LineChart,   label: '차트',   href: '/chart' },
      { icon: ListOrdered, label: '호가창', href: '/orderbook' },
      { icon: Activity,    label: '체결창', href: '/ticks' },
    ],
  },
  {
    groupIcon: Flame,
    groupLabel: '시장 흐름',
    items: [
      { icon: TrendingUp, label: '상승/하락',   href: '/movers/price' },
      { icon: Flame,      label: '거래량 급등', href: '/movers/volume' },
      { icon: BarChart3,  label: '수급',        href: '/net-buy' },
      { icon: Globe,      label: '글로벌 지수', href: '/global' },
      { icon: PieChart,   label: '시장 지도',   href: '/analysis' },
    ],
  },
  {
    groupIcon: Newspaper,
    groupLabel: '정보',
    items: [
      { icon: Newspaper, label: '뉴스 속보',   href: '/news' },
      { icon: FileText,  label: 'DART 공시',   href: '/disclosures' },
      { icon: Calendar,  label: '경제 캘린더', href: '/calendar' },
      { icon: Sun,       label: '장전 브리핑', href: '/briefing' },
    ],
  },
  {
    groupIcon: Wrench,
    groupLabel: '도구',
    items: [
      { icon: BookMarked, label: '참고 사이트', href: '/toolbox' },
    ],
  },
];

export default function VerticalNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isActive = (href: string) => {
    if (!mounted) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="hidden md:flex flex-col bg-white border-r border-[#E5E7EB] py-3 sticky top-0 h-screen shrink-0 z-50 isolate self-start w-14">
      {GROUPS.map((group) => {
        const GroupIcon = group.groupIcon;
        const groupActive = group.items.some((it) => isActive(it.href));
        return (
          <div key={group.groupLabel} className="mb-2">
            {/* 그룹 헤더 — 아이콘만, 라벨 없음 (호버 확장 제거) */}
            <div className="flex items-center justify-center px-3 py-1.5">
              <GroupIcon
                className={`w-4 h-4 shrink-0 ${groupActive ? 'text-[#0ABAB5]' : 'text-[#999]'}`}
              />
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
                    className={`group relative flex items-center justify-center w-12 h-10 mx-auto my-0.5 rounded-md transition-colors ${
                      active ? 'bg-[#0ABAB5]/10' : 'hover:bg-gray-100'
                    }`}
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
                    {/* 툴팁 — 호버 시 우측에 표시 */}
                    <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100]">
                      {item.label}
                    </span>
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

**변경 요약:**
- `expanded` state, `onMouseEnter/Leave`, `w-[220px]`, `transition-[width]` 전부 제거
- `w-14` 고정
- 그룹 헤더 라벨 텍스트(`groupLabel`) 표시 로직 제거 — 아이콘만 남김
- 아이템 라벨도 제거, 툴팁(`group-hover:opacity-100`)만 남김
- `MessageSquare` import 제거, `/chat` 항목 삭제
- 그룹을 🅑 안으로 재편: **핵심(홈·관심종목·종목발굴) / 분석(차트·호가·체결) / 시장흐름(급등락·거래량·수급·글로벌·지도) / 정보(뉴스·공시·캘린더·브리핑) / 도구(참고사이트)**

---

## 작업 2 — `components/analysis-page/MarketFlow.tsx` 버그 수정

**기존 62번 라인:**
```tsx
<span className={`text-sm font-mono-price font-bold w-20 text-right ${f.value >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
  {f.value >= 0 ? '+' : ''}{f.value.toLocaleString()}억
</span>
```

**수정 후 (null-safe):**
```tsx
<span className={`text-sm font-mono-price font-bold w-20 text-right ${(f.value ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
  {(f.value ?? 0) >= 0 ? '+' : ''}{(f.value ?? 0).toLocaleString()}억
</span>
```

추가로 `maxAbs` 계산도 null-safe로 보강 (32번 라인):

**기존:**
```tsx
const maxAbs = flow.length > 0 ? Math.max(...flow.map((f) => Math.abs(f.value))) : 1;
```

**수정 후:**
```tsx
const maxAbs = flow.length > 0 ? Math.max(...flow.map((f) => Math.abs(f.value ?? 0))) : 1;
```

그리고 55번 라인 `width` 계산부도 동일하게 보강:

**기존:**
```tsx
width: `${(Math.abs(f.value) / maxAbs) * 100}%`,
...
left: f.value >= 0 ? '50%' : undefined,
right: f.value < 0 ? '50%' : undefined,
```

**수정 후:**
```tsx
width: `${(Math.abs(f.value ?? 0) / maxAbs) * 100}%`,
...
left: (f.value ?? 0) >= 0 ? '50%' : undefined,
right: (f.value ?? 0) < 0 ? '50%' : undefined,
```

---

## 작업 3 — 빌드 검증

```bash
npm run build
```

에러 없으면 다음 단계. 에러 나면 보고 후 중단.

---

## 작업 4 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(nav): 사이드바 그룹 🅑 안 재설계 + 호버 확장 롤백 + 채팅 메뉴 제거 + MarketFlow null-safe 수정 (STEP 67)

- VerticalNav: 54px 고정, 호버 확장(220px) 롤백, 호버 시 툴팁만 표시
- 그룹 재편: 핵심(홈/관심/발굴) / 분석(차트/호가/체결) / 시장흐름(급등락/거래량/수급/글로벌/지도) / 정보(뉴스/공시/캘린더/브리핑) / 도구(참고사이트)
- 사이드바에서 /chat 항목 제거 (페이지 자체는 유지)
- MarketFlow.tsx: f.value가 undefined일 때 toLocaleString() 터지는 런타임 TypeError 수정 — (f.value ?? 0) 패턴으로 전환

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

Claude Code 실행 끝나면 아래 형태로 요약 보고:

```
✅ STEP 67 완료
- VerticalNav.tsx: 호버 확장 롤백 + 채팅 제거 + 🅑 안 그룹 적용
- MarketFlow.tsx: null-safe (f.value ?? 0) 패턴 4곳 적용
- npm run build: 성공
- git commit: <hash>
- git push: success
```

빌드 실패하거나 중간에 막히면 즉시 중단 후 로그 전달.
