# STEP 68 — 세로 사이드바 → 가로 TopNav 전환

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** 직전 커밋 `32f4beb` (STEP 67 완료 — 사이드바 🅑 안 + MarketFlow null-safe).

**목표:**
좌측 세로 `VerticalNav` 제거, 티커 밑에 가로 `TopNav` 삽입. 🅰 안 적용:
- 15개 항목 한 줄 (5그룹, 그룹 사이에 세로선 구분)
- 아이콘 + 라벨 항상 노출
- 활성 표시 = 하단 2px 틸 바(`#0ABAB5`)
- 로고 클릭 = 홈 역할 유지 → 네비에서 "홈" 항목 제거
- 라벨 축약 3개: "상승/하락" → "급등락", "거래량 급등" → "거래량", "DART 공시" → "공시"

---

## 작업 1 — `components/layout/TopNav.tsx` 신규 생성

파일 **새로 생성**:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Filter, Star, LineChart, TrendingUp, Flame, BarChart3, Newspaper,
  FileText, Calendar, Sun, Globe, PieChart, BookMarked,
  ListOrdered, Activity,
} from 'lucide-react';

type LucideIcon = typeof Star;

interface NavItem { icon: LucideIcon; label: string; href: string; }

// 5그룹 — 🅑 안 구조 유지, 가로 배치로 변환
// [0] 핵심 / [1] 분석 / [2] 시장 흐름 / [3] 정보 / [4] 도구
// "홈"은 헤더 로고 클릭으로 대체 → 네비에서 제외
const GROUPS: NavItem[][] = [
  // 핵심
  [
    { icon: Star,   label: '관심종목',  href: '/watchlist' },
    { icon: Filter, label: '종목 발굴', href: '/screener' },
  ],
  // 분석
  [
    { icon: LineChart,   label: '차트',   href: '/chart' },
    { icon: ListOrdered, label: '호가창', href: '/orderbook' },
    { icon: Activity,    label: '체결창', href: '/ticks' },
  ],
  // 시장 흐름
  [
    { icon: TrendingUp, label: '급등락',      href: '/movers/price' },
    { icon: Flame,      label: '거래량',      href: '/movers/volume' },
    { icon: BarChart3,  label: '수급',        href: '/net-buy' },
    { icon: Globe,      label: '글로벌 지수', href: '/global' },
    { icon: PieChart,   label: '시장 지도',   href: '/analysis' },
  ],
  // 정보
  [
    { icon: Newspaper, label: '뉴스 속보',   href: '/news' },
    { icon: FileText,  label: '공시',        href: '/disclosures' },
    { icon: Calendar,  label: '경제 캘린더', href: '/calendar' },
    { icon: Sun,       label: '장전 브리핑', href: '/briefing' },
  ],
  // 도구
  [
    { icon: BookMarked, label: '참고 사이트', href: '/toolbox' },
  ],
];

export default function TopNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isActive = (href: string) => {
    if (!mounted) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
      <div className="px-6 h-11 flex items-center overflow-x-auto">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center shrink-0">
            {gi > 0 && <div aria-hidden="true" className="w-px h-5 bg-[#E5E7EB] mx-3 shrink-0" />}
            {group.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 px-3 h-11 text-xs whitespace-nowrap transition-colors shrink-0 ${
                    active ? 'text-[#0ABAB5] font-bold' : 'text-[#444] hover:text-black'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#0ABAB5]' : ''}`} />
                  <span>{item.label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0ABAB5] rounded-t"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
```

---

## 작업 2 — `app/layout.tsx` 수정

TopNav import 추가 + TickerBar 아래에 배치:

**수정 전:**
```tsx
import Header from '@/components/layout/Header';
import TickerBar from '@/components/layout/TickerBar';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/components/auth/AuthProvider';
import LayoutShell from '@/components/layout/LayoutShell';
```

**수정 후:** `TopNav` import 한 줄 추가
```tsx
import Header from '@/components/layout/Header';
import TickerBar from '@/components/layout/TickerBar';
import TopNav from '@/components/layout/TopNav';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/components/auth/AuthProvider';
import LayoutShell from '@/components/layout/LayoutShell';
```

**그리고 `<TickerBar />` 다음 줄에 `<TopNav />` 추가:**

수정 전:
```tsx
<Header />
<TickerBar />
<LayoutShell footer={<Footer />}>
  {children}
</LayoutShell>
```

수정 후:
```tsx
<Header />
<TickerBar />
<TopNav />
<LayoutShell footer={<Footer />}>
  {children}
</LayoutShell>
```

---

## 작업 3 — `components/layout/LayoutShell.tsx` 단순화

VerticalNav 제거, main만 남김:

**전체 교체:**

```tsx
'use client';

import { ReactNode } from 'react';

interface LayoutShellProps {
  children: ReactNode;
  footer: ReactNode;
}

export default function LayoutShell({ children, footer }: LayoutShellProps) {
  return (
    <>
      <main className="flex-1 min-w-0">
        {children}
      </main>
      {footer}
    </>
  );
}
```

---

## 작업 4 — `components/layout/VerticalNav.tsx` 파일 삭제

```bash
rm components/layout/VerticalNav.tsx
```

---

## 작업 5 — 검증

아래 순서로 실행:

```bash
# 1) VerticalNav import가 다른 곳에서 참조되지 않는지 확인
grep -r "VerticalNav" --include="*.tsx" --include="*.ts" .

# 출력이 비어있어야 함. 만약 결과 나오면 해당 파일 열어서 import 제거.
```

```bash
# 2) 빌드
npm run build
```

에러 없으면 다음 단계. 에러 나면 로그 전달 후 중단.

---

## 작업 6 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(nav): 세로 사이드바 → 가로 TopNav 전환 (🅰 안) (STEP 68)

- VerticalNav.tsx 삭제, 좌측 54px 기둥 제거
- 가로 TopNav 신설 — 티커 아래 sticky 위치, 5그룹 15항목 한 줄
- 그룹 구분은 세로선 1px + 좌우 12px 여백
- 활성 상태 = 하단 2px 틸 바(#0ABAB5) + 틸 텍스트
- 로고 클릭이 홈 역할 → 네비에서 "홈" 항목 제거
- 라벨 축약 3개: 상승/하락 → 급등락, 거래량 급등 → 거래량, DART 공시 → 공시
- LayoutShell 단순화 (main만 남김)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 68 완료
- TopNav.tsx 신규 생성 (5그룹 15항목 가로 배치)
- VerticalNav.tsx 삭제
- app/layout.tsx: TopNav 삽입
- LayoutShell.tsx: main만 남김
- grep VerticalNav: 참조 없음 확인
- npm run build: 성공
- git commit: <hash>
- git push: success
```

빌드 실패 시 즉시 중단 후 로그 전달.

---

## 주의사항

- **반응형**: `overflow-x-auto`로 좁은 모니터에서는 가로 스크롤 허용. 1440px 이상 모니터는 한 줄 전부 표시됨.
- **z-index**: TopNav sticky `z-40` (Header modal/dropdown은 `z-50` 유지)
- **로고 홈 링크**: `Header.tsx`의 `<Link href="/">` 그대로 유지 — 수정 불필요
- **Footer**: LayoutShell에서 footer는 main 뒤에 렌더됨 (레이아웃 순서 변경 없음)
