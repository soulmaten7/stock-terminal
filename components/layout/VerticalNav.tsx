'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Star,
  LineChart,
  TrendingUp,
  Flame,
  BarChart3,
  Newspaper,
  FileText,
  Calendar,
  Sun,
  Globe,
  PieChart,
} from 'lucide-react';

const ITEMS = [
  { icon: Home,       label: '홈',           href: '/' },
  { icon: Star,       label: '관심종목',      href: '/watchlist' },
  { icon: LineChart,  label: '차트',          href: '/chart' },
  { icon: TrendingUp, label: '상승/하락',     href: '/movers/price' },
  { icon: Flame,      label: '거래량 급등',   href: '/movers/volume' },
  { icon: BarChart3,  label: '수급',          href: '/net-buy' },
  { icon: Newspaper,  label: '뉴스 속보',     href: '/news' },
  { icon: FileText,   label: 'DART 공시',     href: '/filings' },
  { icon: Calendar,   label: '경제캘린더',    href: '/calendar' },
  { icon: Sun,        label: '장전 브리핑',   href: '/briefing' },
  { icon: Globe,      label: '글로벌 지수',   href: '/global' },
  { icon: PieChart,   label: '시장 지도',     href: '/analytics' },
];

export default function VerticalNav() {
  const pathname = usePathname();

  // 홈은 완전일치, 그 외는 prefix 일치 (상세 페이지 포함 활성화)
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="hidden md:flex flex-col items-center w-14 bg-white border-r border-[#E5E7EB] py-3 sticky top-0 h-screen shrink-0 z-40">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            title={item.label}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex items-center justify-center w-12 h-12 mb-1 rounded-md transition-colors ${
              active ? 'bg-[#0ABAB5]/10' : 'hover:bg-gray-100'
            }`}
          >
            {/* Active state: 왼쪽 컬러 바 */}
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#0ABAB5] rounded-r"
              />
            )}

            {/* 아이콘: active 시 티파니블루 */}
            <Icon
              className={`w-5 h-5 transition-colors ${
                active
                  ? 'text-[#0ABAB5]'
                  : 'text-gray-600 group-hover:text-gray-900'
              }`}
            />

            {/* Hover tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
